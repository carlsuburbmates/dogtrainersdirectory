#!/usr/bin/env python3
"""
Canonical concierge seed pipeline for Phase 17 / CS-1002.

Reads the approved manual queue CSV, fetches only the human-approved source URLs,
extracts reviewable evidence, resolves canonical locality IDs from the seeded
suburb/council canon, and writes deterministic JSON + CSV review artifacts.

No AI sourcing, no blind discovery, and no publish mutation.
"""
from __future__ import annotations

import argparse
import csv
import html
import json
import os
import re
import ssl
import sys
from dataclasses import dataclass
from datetime import datetime
from html.parser import HTMLParser
from pathlib import Path
from typing import Any, Iterable
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen


REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = REPO_ROOT / "data" / "concierge_seed_queue_inner_melbourne_pilot_19.csv"
DEFAULT_OUTPUT_DIR = REPO_ROOT / "qa_artifacts" / "concierge"
DATA_IMPORT_SQL = REPO_ROOT / "supabase" / "data-import.sql"
SUBURB_MAPPING_CSV = REPO_ROOT / "data" / "suburbs_councils_mapping.csv"


def load_approved_mvp_catchment_suburbs() -> frozenset[str]:
    with SUBURB_MAPPING_CSV.open(encoding="utf-8") as fh:
        rows = list(csv.DictReader(fh))
    suburbs = {
        row["suburb"].strip()
        for row in rows
        if row.get("region", "").strip() == "Inner City" and row.get("suburb", "").strip()
    }
    return frozenset(suburbs)


APPROVED_MVP_CATCHMENT_SUBURBS = load_approved_mvp_catchment_suburbs()

SERVICE_TYPES = [
    "puppy_training",
    "obedience_training",
    "behaviour_consultations",
    "group_classes",
    "private_training",
]

AGE_SPECIALTIES = [
    "puppies_0_6m",
    "adolescent_6_18m",
    "adult_18m_7y",
    "senior_7y_plus",
    "rescue_dogs",
]

BEHAVIOR_ISSUES = [
    "pulling_on_lead",
    "separation_anxiety",
    "excessive_barking",
    "dog_aggression",
    "leash_reactivity",
    "jumping_up",
    "destructive_behaviour",
    "recall_issues",
    "anxiety_general",
    "resource_guarding",
    "mouthing_nipping_biting",
    "rescue_dog_support",
    "socialisation",
]

BLOCKING_KEYWORDS = (
    "coming soon",
    "under construction",
    "placeholder",
)

ADVISORY_SOURCE_KEYWORDS = (
    "directory",
    "marketplace",
    "find a trainer",
    "listings",
)

GENERIC_TITLE_TOKENS = {
    "home",
    "services",
    "service",
    "welcome",
    "about",
    "contact",
}


@dataclass(frozen=True)
class CouncilRecord:
    id: int
    name: str
    region: str


@dataclass(frozen=True)
class SuburbRecord:
    id: int
    name: str
    postcode: str
    latitude: str
    longitude: str
    council_id: int
    council_name: str
    region: str


@dataclass(frozen=True)
class ExistingInventoryRecord:
    business_id: int
    business_name: str
    domain: str
    phone: str
    email: str
    suburb_name: str
    council_name: str
    resource_type: str


class SnapshotParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.title_parts: list[str] = []
        self.body_parts: list[str] = []
        self.h1_parts: list[str] = []
        self.h2_parts: list[str] = []
        self.h3_parts: list[str] = []
        self.meta: dict[str, str] = {}
        self.links: list[dict[str, str]] = []
        self.canonical_url: str = ""
        self._skip_depth = 0
        self._in_title = False
        self._current_heading: str = ""
        self._current_link: dict[str, str] | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs_map = {key.lower(): (value or "") for key, value in attrs}
        if tag in {"script", "style", "noscript"}:
            self._skip_depth += 1
            return
        if tag == "title":
            self._in_title = True
        if tag == "meta":
            key = attrs_map.get("property") or attrs_map.get("name")
            content = attrs_map.get("content", "").strip()
            if key and content:
                self.meta[key.lower()] = content
        if tag == "link":
            rel = attrs_map.get("rel", "").lower()
            href = attrs_map.get("href", "").strip()
            if rel == "canonical" and href:
                self.canonical_url = href
        if tag in {"h1", "h2", "h3"}:
            self._current_heading = tag
        if tag == "a":
            self._current_link = {
                "href": attrs_map.get("href", "").strip(),
                "text": "",
            }

    def handle_endtag(self, tag: str) -> None:
        if tag in {"script", "style", "noscript"} and self._skip_depth > 0:
            self._skip_depth -= 1
            return
        if tag == "title":
            self._in_title = False
        if tag in {"h1", "h2", "h3"}:
            self._current_heading = ""
        if tag == "a" and self._current_link is not None:
            self.links.append(self._current_link)
            self._current_link = None

    def handle_data(self, data: str) -> None:
        if self._skip_depth > 0:
            return
        text = html.unescape(data).strip()
        if not text:
            return
        if self._in_title:
            self.title_parts.append(text)
        else:
            self.body_parts.append(text)
        if self._current_heading == "h1":
            self.h1_parts.append(text)
        elif self._current_heading == "h2":
            self.h2_parts.append(text)
        elif self._current_heading == "h3":
            self.h3_parts.append(text)
        if self._current_link is not None:
            if self._current_link["text"]:
                self._current_link["text"] += " "
            self._current_link["text"] += text


def norm(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def collapse_spaces(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def strip_trailing_noise(value: str) -> str:
    parts = re.split(r"\s*[|>·–—:-]\s*", value)
    return collapse_spaces(parts[0] if parts else value)


def normalize_domain(url: str) -> str:
    parsed = urlparse(url)
    host = parsed.netloc.lower()
    if host.startswith("www."):
        host = host[4:]
    return host


def locality_key(suburb_name: str, council_name: str = "") -> str:
    if council_name:
        return f"{norm(suburb_name)}:{norm(council_name)}"
    return norm(suburb_name)


def load_councils_and_suburbs() -> tuple[dict[str, CouncilRecord], dict[tuple[str, str], SuburbRecord], list[dict[str, str]]]:
    sql_text = DATA_IMPORT_SQL.read_text(encoding="utf-8")
    csv_rows = list(csv.DictReader(SUBURB_MAPPING_CSV.read_text(encoding="utf-8").splitlines()))

    council_block = re.search(r"INSERT INTO councils \(name, region\) VALUES\s*(.*?);\s*INSERT INTO suburbs", sql_text, re.S)
    suburb_block = re.search(r"INSERT INTO suburbs \(name, postcode, latitude, longitude, council_id\) VALUES\s*(.*?);\s*$", sql_text, re.S)
    if not council_block:
        raise SystemExit(f"Could not find councils INSERT block in {DATA_IMPORT_SQL}")
    if not suburb_block:
        raise SystemExit(f"Could not find suburbs INSERT block in {DATA_IMPORT_SQL}")

    councils: dict[str, CouncilRecord] = {}
    for idx, (name, region) in enumerate(re.findall(r"\('((?:[^']|'')*)',\s*'((?:[^']|'')*)'\)", council_block.group(1)), start=1):
        clean_name = name.replace("''", "'")
        clean_region = region.replace("''", "'")
        councils[clean_name] = CouncilRecord(id=idx, name=clean_name, region=clean_region)

    suburb_records: list[SuburbRecord] = []
    for idx, (name, postcode, latitude, longitude, council_name) in enumerate(
        re.findall(
            r"\('((?:[^']|'')*)',\s*(NULL|\d+),\s*([-\d.]+|NULL),\s*([-\d.]+|NULL),\s*\(SELECT id FROM councils WHERE name = '((?:[^']|'')*)'\)\)",
            suburb_block.group(1),
        ),
        start=1,
    ):
        clean_name = name.replace("''", "'")
        clean_council_name = council_name.replace("''", "'")
        council = councils.get(clean_council_name)
        if council is None:
            raise SystemExit(f"Council referenced by suburb seed not found: {clean_council_name}")
        suburb_records.append(
            SuburbRecord(
                id=idx,
                name=clean_name,
                postcode="" if postcode == "NULL" else postcode,
                latitude="" if latitude == "NULL" else latitude,
                longitude="" if longitude == "NULL" else longitude,
                council_id=council.id,
                council_name=council.name,
                region=council.region,
            )
        )

    if len(suburb_records) != len(csv_rows):
        raise SystemExit(
            f"Canonical suburb count mismatch: SQL has {len(suburb_records)} rows, CSV has {len(csv_rows)} rows"
        )

    csv_lookup = {(row["suburb"], row["council"]): row for row in csv_rows}
    suburb_lookup: dict[tuple[str, str], SuburbRecord] = {}
    for record in suburb_records:
        csv_row = csv_lookup.get((record.name, record.council_name))
        if csv_row is None:
            raise SystemExit(f"CSV suburb mapping missing canonical pair: {record.name} / {record.council_name}")
        if csv_row.get("postcode", "") and csv_row["postcode"] != record.postcode:
            raise SystemExit(
                f"Postcode mismatch for {record.name} / {record.council_name}: CSV={csv_row['postcode']} SQL={record.postcode}"
            )
        suburb_lookup[(norm(record.name), norm(record.council_name))] = record

    return councils, suburb_lookup, csv_rows


def parse_seed_queue(path: Path) -> list[dict[str, str]]:
    rows = list(csv.DictReader(path.read_text(encoding="utf-8").splitlines()))
    required = {"source_url", "business_name_hint", "suburb_hint"}
    if not rows:
        raise SystemExit(f"Input queue is empty: {path}")
    if not required.issubset(rows[0].keys()):
        raise SystemExit(f"Input queue missing required columns {sorted(required)}: {path}")

    seen_source_urls: set[str] = set()
    for index, row in enumerate(rows, start=1):
        source_url = row["source_url"].strip()
        parsed = urlparse(source_url)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise SystemExit(
                f"Row {index} in {path} has a non-approved source_url; only absolute http(s) URLs are allowed: {source_url}"
            )
        suburb_hint = row["suburb_hint"].strip()
        if suburb_hint not in APPROVED_MVP_CATCHMENT_SUBURBS:
            raise SystemExit(
                f"Row {index} in {path} has suburb_hint outside the approved Inner Melbourne catchment: {suburb_hint}"
            )
        if source_url in seen_source_urls:
            raise SystemExit(f"Duplicate approved source_url in queue at row {index}: {source_url}")
        seen_source_urls.add(source_url)

    return rows


def fetch_html(url: str, timeout: int = 20, max_bytes: int = 2_000_000) -> tuple[int | None, str, str, str, str]:
    request = Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-AU,en;q=0.9",
            "Accept-Encoding": "identity",
        },
    )
    context = ssl.create_default_context()
    with urlopen(request, timeout=timeout, context=context) as response:
        status = getattr(response, "status", response.getcode())
        final_url = response.geturl()
        content_type = response.headers.get("content-type", "")
        charset = response.headers.get_content_charset() or "utf-8"
        raw = response.read(max_bytes)
        html_text = raw.decode(charset, errors="replace")
        return status, final_url, content_type, charset, html_text


def extract_jsonld_objects(html_text: str) -> list[dict[str, Any]]:
    blocks = re.findall(
        r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
        html_text,
        flags=re.I | re.S,
    )
    objects: list[dict[str, Any]] = []
    for block in blocks:
        payload = block.strip()
        if not payload:
            continue
        try:
            parsed = json.loads(payload)
        except Exception:
            continue
        stack: list[Any] = [parsed]
        while stack:
            item = stack.pop()
            if isinstance(item, dict):
                objects.append(item)
                if "@graph" in item:
                    stack.append(item["@graph"])
            elif isinstance(item, list):
                stack.extend(item)
    return objects


def parse_snapshot(html_text: str) -> dict[str, Any]:
    parser = SnapshotParser()
    parser.feed(html_text)
    parser.close()
    title = collapse_spaces(" ".join(parser.title_parts))
    headings = {
        "h1": collapse_spaces(" ".join(parser.h1_parts)),
        "h2": collapse_spaces(" ".join(parser.h2_parts)),
        "h3": collapse_spaces(" ".join(parser.h3_parts)),
    }
    body_text = collapse_spaces(" ".join(parser.body_parts))
    meta = {key.lower(): value for key, value in parser.meta.items()}
    links = [link for link in parser.links if link.get("href")]
    return {
        "title": title,
        "headings": headings,
        "meta": meta,
        "canonical_url": parser.canonical_url,
        "links": links,
        "body_text": body_text,
        "jsonld": extract_jsonld_objects(html_text),
    }


def extract_contact_from_links(links: list[dict[str, str]]) -> tuple[list[str], list[str]]:
    emails: list[str] = []
    phones: list[str] = []
    for link in links:
        href = link.get("href", "")
        if href.startswith("mailto:"):
            email = href.split(":", 1)[1].split("?", 1)[0].strip()
            if email and email not in emails:
                emails.append(email)
        if href.startswith("tel:"):
            phone = re.sub(r"\s+", " ", href.split(":", 1)[1].split("?", 1)[0]).strip()
            if phone and phone not in phones:
                phones.append(phone)
    return emails, phones


def extract_regex_contacts(text: str) -> tuple[list[str], list[str]]:
    emails = re.findall(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b", text)
    phones = re.findall(r"(?:\+?\d[\d\s().-]{7,}\d)", text)
    clean_emails = list(dict.fromkeys(email.strip() for email in emails))
    clean_phones = list(dict.fromkeys(collapse_spaces(phone) for phone in phones))
    return clean_emails, clean_phones


def format_address(address_obj: Any) -> str:
    if not address_obj:
        return ""
    if isinstance(address_obj, str):
        return collapse_spaces(address_obj)
    if isinstance(address_obj, dict):
        parts = [
            address_obj.get("streetAddress", ""),
            address_obj.get("addressLocality", ""),
            address_obj.get("addressRegion", ""),
            address_obj.get("postalCode", ""),
        ]
        return collapse_spaces(", ".join(part for part in parts if part))
    return ""


def extract_address_from_snapshot(snapshot: dict[str, Any]) -> tuple[str, list[str]]:
    evidence: list[str] = []
    for obj in snapshot["jsonld"]:
        if not isinstance(obj, dict):
            continue
        address = format_address(obj.get("address"))
        if address:
            evidence.append(f"jsonld:{obj.get('name', obj.get('@type', 'object'))}")
            return address, evidence

    meta_address = snapshot["meta"].get("og:street-address") or snapshot["meta"].get("business:contact_data:street_address")
    if meta_address:
        evidence.append("meta:address")
        return collapse_spaces(meta_address), evidence

    body = snapshot["body_text"]
    match = re.search(
        r"(\d{1,5}\s+[A-Za-z0-9.'\- ]{3,80},\s*[A-Za-z0-9.'\- ]{2,60},\s*VIC\s*\d{4})",
        body,
        flags=re.I,
    )
    if match:
        evidence.append("body:vic-address")
        return collapse_spaces(match.group(1)), evidence

    return "", evidence


def extract_name_candidates(snapshot: dict[str, Any]) -> list[tuple[str, str]]:
    candidates: list[tuple[str, str]] = []
    for obj in snapshot["jsonld"]:
        if not isinstance(obj, dict):
            continue
        name = collapse_spaces(str(obj.get("name", "")))
        if name:
            candidates.append((name, f"jsonld:{obj.get('@type', 'object')}"))
    for key in ("og:site_name", "twitter:site", "application-name"):
        value = collapse_spaces(snapshot["meta"].get(key, ""))
        if value:
            candidates.append((value, f"meta:{key}"))
    for key in ("h1", "h2", "h3"):
        value = collapse_spaces(snapshot["headings"].get(key, ""))
        if value:
            candidates.append((value, f"heading:{key}"))
    title = strip_trailing_noise(snapshot["title"])
    if title:
        candidates.append((title, "title"))
    return candidates


def score_name_candidate(candidate: str, hint: str) -> int:
    candidate_tokens = set(re.findall(r"[a-z0-9]+", candidate.lower()))
    hint_tokens = set(re.findall(r"[a-z0-9]+", hint.lower()))
    if not candidate_tokens:
        return -100
    score = len(candidate_tokens & hint_tokens) * 10
    score += min(len(candidate_tokens), 5)
    if candidate.lower() == hint.lower():
        score += 25
    if any(token in GENERIC_TITLE_TOKENS for token in candidate_tokens):
        score -= 20
    return score


def should_fallback_to_hint(candidate: str, hint: str, score: int) -> bool:
    candidate_clean = collapse_spaces(candidate)
    hint_clean = collapse_spaces(hint)
    candidate_tokens = set(re.findall(r"[a-z0-9]+", candidate_clean.lower()))
    hint_tokens = set(re.findall(r"[a-z0-9]+", hint_clean.lower()))

    if not candidate_clean:
        return True
    if score <= 15:
        return True
    if len(candidate_clean) > 90:
        return True
    if candidate_clean.lower() in {"oops!!", "<oops/>"}:
        return True
    if candidate_clean.lower().endswith(".com") or candidate_clean.lower().endswith(".com.au"):
        return True
    if hint_tokens and len(candidate_tokens & hint_tokens) == 0:
        return True
    return False


def pick_business_name(snapshot: dict[str, Any], hint: str) -> tuple[str, list[str]]:
    candidates = extract_name_candidates(snapshot)
    if not candidates:
        return hint.strip(), ["fallback:input hint"]
    scored = sorted(
        candidates,
        key=lambda item: (score_name_candidate(item[0], hint), len(item[0])),
        reverse=True,
    )
    chosen, source = scored[0]
    evidence = [source]
    top_score = score_name_candidate(chosen, hint)
    if should_fallback_to_hint(chosen, hint, top_score) or len(chosen) < 3:
        return hint.strip(), evidence + ["fallback:input hint"]
    return chosen, evidence


def infer_resource_type(text: str) -> tuple[str, list[str]]:
    lowered = text.lower()
    evidence: list[str] = []
    if re.search(r"\bbehavio[u]?r(?:al)?\s+(?:consultant|consultation|consultancy|assessment)\b", lowered):
        evidence.append("behaviour consultant keyword")
        return "behaviour_consultant", evidence
    if re.search(r"\bbehavio[u]?r(?:al)?\s+training\b", lowered):
        evidence.append("behaviour training keyword")
        return "behaviour_consultant", evidence
    evidence.append("default trainer")
    return "trainer", evidence


def infer_service_types(text: str) -> tuple[list[str], list[str]]:
    lowered = text.lower()
    matches: list[str] = []
    evidence: list[str] = []

    def add(service: str, label: str) -> None:
        if service not in matches:
            matches.append(service)
            evidence.append(label)

    if re.search(r"\bpuppy\s+(?:school|preschool|preschooling|class|classes|training)\b", lowered) or "puppy" in lowered:
        add("puppy_training", "puppy keyword")
    if re.search(r"\bprivate\b|\bone[- ]on[- ]one\b|\b1:1\b|\bin[- ]home\b|\bhome visit\b|\bpersonalis(?:e|z)ed\b", lowered):
        add("private_training", "private training keyword")
    if re.search(r"\bgroup\b|\bclass\b|\bclasses\b|\bschool\b|\bacademy\b|\bworkshop\b|\bfacility[- ]based\b", lowered):
        add("group_classes", "group/class keyword")
    if re.search(r"\bobedience\b|\bmanners\b|\bfoundation skills\b|\bfoundation\b|\bbasic training\b|\btraining\b", lowered):
        add("obedience_training", "obedience/training keyword")
    if re.search(r"\bbehavio[u]?r(?:al)?\b|\bconsultation\b|\bconsultancy\b|\bassessment\b|\bbehaivour\b", lowered):
        add("behaviour_consultations", "behaviour keyword")

    if not matches and re.search(r"\btraining\b", lowered):
        add("obedience_training", "generic training fallback")

    return matches, evidence


def infer_age_specialties(text: str) -> tuple[list[str], list[str]]:
    lowered = text.lower()
    matches: list[str] = []
    evidence: list[str] = []

    def add(age: str, label: str) -> None:
        if age not in matches:
            matches.append(age)
            evidence.append(label)

    if re.search(r"\bpuppy\b|\bpreschool\b|\bpre-school\b", lowered):
        add("puppies_0_6m", "puppy keyword")
    if re.search(r"\badolescent\b|\bteen\b|\byoung dog\b|\bjuvenile\b", lowered):
        add("adolescent_6_18m", "adolescent keyword")
    if re.search(r"\bsenior\b|\bold dog\b|\bgeriatric\b", lowered):
        add("senior_7y_plus", "senior keyword")
    if re.search(r"\brescue\b|\brehomed\b|\badopted\b|\bshelter\b", lowered):
        add("rescue_dogs", "rescue keyword")
    if re.search(r"\badult\b|\bgeneral\b|\ball ages\b|\bany age\b", lowered):
        add("adult_18m_7y", "adult/general keyword")

    if not matches and re.search(r"\btraining\b|\bbehavio[u]?r\b", lowered):
        add("adult_18m_7y", "generic trainer fallback")

    return matches, evidence


def infer_behavior_issues(text: str) -> tuple[list[str], list[str]]:
    lowered = text.lower()
    matches: list[str] = []
    evidence: list[str] = []

    def add(issue: str, label: str) -> None:
        if issue not in matches:
            matches.append(issue)
            evidence.append(label)

    if re.search(r"\bpull(?:ing|s)? on (?:the )?(?:lead|leash)\b|\bloose leash\b", lowered):
        add("pulling_on_lead", "lead/leash keyword")
    if re.search(r"\bseparation anxiety\b|\bseparation\b|\balone\b", lowered):
        add("separation_anxiety", "separation keyword")
    if re.search(r"\bbark(?:ing)?\b", lowered):
        add("excessive_barking", "barking keyword")
    if re.search(r"\baggress(?:ion|ive)?\b", lowered):
        add("dog_aggression", "aggression keyword")
    if re.search(r"\bleash reactiv", lowered):
        add("leash_reactivity", "leash reactivity keyword")
    if re.search(r"\bjump(?:ing|s)? up\b|\bjumping\b", lowered):
        add("jumping_up", "jumping keyword")
    if re.search(r"\bdestruct(?:ive|ion)\b|\bchew(?:ing|s)?\b", lowered):
        add("destructive_behaviour", "destructive/chewing keyword")
    if re.search(r"\brecall\b|\bcome when called\b", lowered):
        add("recall_issues", "recall keyword")
    if re.search(r"\banxiety\b|\bfearful\b|\bnervous\b", lowered):
        add("anxiety_general", "anxiety keyword")
    if re.search(r"\bresource guard(?:ing|)\b|\bguard(?:ing)? food\b", lowered):
        add("resource_guarding", "resource guarding keyword")
    if re.search(r"\bmouth(?:ing)?\b|\bnip(?:ping|s)?\b|\bbit(?:ing|es|e)?\b", lowered):
        add("mouthing_nipping_biting", "mouthing/nipping/biting keyword")
    if re.search(r"\brescue\b|\brehome\b|\badopt\b", lowered):
        add("rescue_dog_support", "rescue keyword")
    if re.search(r"\bsocialis(?:ation|ation)\b|\bsocialization\b", lowered):
        add("socialisation", "socialisation keyword")

    return matches, evidence


def find_council_mentions(text: str, councils: Iterable[str]) -> list[str]:
    lowered = text.lower()
    hits = []
    for council in councils:
        if council.lower() in lowered:
            hits.append(council)
    return hits


def resolve_suburb(
    suburb_hint: str,
    snapshot: dict[str, Any],
    suburb_lookup: dict[tuple[str, str], SuburbRecord],
    councils: dict[str, CouncilRecord],
) -> tuple[SuburbRecord | None, list[str]]:
    hint_key = norm(suburb_hint)
    matches = [record for (suburb_key, _), record in suburb_lookup.items() if suburb_key == hint_key]
    if not matches:
        return None, [f"no canonical suburb match for hint '{suburb_hint}'"]
    if len(matches) == 1:
        return matches[0], []

    evidence_text = " ".join([snapshot["title"], snapshot["headings"]["h1"], snapshot["body_text"], snapshot["meta"].get("description", "")])
    council_mentions = find_council_mentions(evidence_text, councils.keys())
    if council_mentions:
        for mention in council_mentions:
            filtered = [record for record in matches if record.council_name == mention]
            if len(filtered) == 1:
                return filtered[0], [f"resolved ambiguous suburb using council evidence '{mention}'"]
    return None, [f"ambiguous canonical suburb match for hint '{suburb_hint}'"]


def join_text(*parts: str) -> str:
    return collapse_spaces(" ".join(part for part in parts if part))


def extract_page_fields(url: str, business_name_hint: str, service_hint: str) -> dict[str, Any]:
    status = None
    final_url = url
    content_type = ""
    charset = "utf-8"
    html_text = ""
    error = ""
    try:
        status, final_url, content_type, charset, html_text = fetch_html(url)
    except HTTPError as exc:
        status = exc.code
        final_url = getattr(exc, "url", url) or url
        error = f"HTTPError {exc.code}: {exc.reason}"
    except URLError as exc:
        error = f"URLError: {exc.reason}"
    except Exception as exc:
        error = f"{type(exc).__name__}: {exc}"

    snapshot: dict[str, Any] = {
        "title": "",
        "headings": {"h1": "", "h2": "", "h3": ""},
        "meta": {},
        "canonical_url": "",
        "links": [],
        "body_text": "",
        "jsonld": [],
    }
    if html_text:
        snapshot = parse_snapshot(html_text)

    text_blob = join_text(
        snapshot["title"],
        snapshot["headings"]["h1"],
        snapshot["headings"]["h2"],
        snapshot["headings"]["h3"],
        snapshot["meta"].get("description", ""),
        snapshot["meta"].get("og:description", ""),
        snapshot["body_text"],
    )
    linked_emails, linked_phones = extract_contact_from_links(snapshot["links"])
    regex_emails, regex_phones = extract_regex_contacts(text_blob)

    contact_email = linked_emails[0] if linked_emails else (regex_emails[0] if regex_emails else "")
    contact_phone = linked_phones[0] if linked_phones else (regex_phones[0] if regex_phones else "")
    address, address_evidence = extract_address_from_snapshot(snapshot)
    business_name, name_evidence = pick_business_name(snapshot, business_name_hint)
    hint_text = join_text(business_name_hint, service_hint, text_blob)
    resource_type, resource_evidence = infer_resource_type(hint_text)
    services, service_evidence = infer_service_types(hint_text)
    ages, age_evidence = infer_age_specialties(hint_text)
    behavior_issues, issue_evidence = infer_behavior_issues(hint_text)

    website = snapshot["canonical_url"] or final_url or url
    domain = normalize_domain(website)
    blocked_issues: list[str] = []
    advisory_warnings: list[str] = []

    if error:
        blocked_issues.append(error)
    if not html_text:
        blocked_issues.append("no page body could be fetched")
    if not services:
        blocked_issues.append("no supported service taxonomy could be inferred")
    if not ages:
        blocked_issues.append("no supported age specialty could be inferred")
    if not business_name:
        advisory_warnings.append("business name fallback is empty")
    if not contact_phone and not contact_email and not address:
        advisory_warnings.append("no direct contact fields extracted from source")
    review_text = join_text(
        snapshot["title"],
        snapshot["headings"]["h1"],
        snapshot["meta"].get("description", ""),
        snapshot["meta"].get("og:description", ""),
    ).lower()
    if any(keyword in review_text for keyword in ADVISORY_SOURCE_KEYWORDS):
        advisory_warnings.append("source copy contains directory/listing language; confirm it is a real business site")
    if any(keyword in review_text for keyword in BLOCKING_KEYWORDS):
        blocked_issues.append("source appears to be placeholder or under construction")
    if "veterinary" in text_blob.lower() or "vet" in text_blob.lower():
        advisory_warnings.append("source looks like a veterinary business; confirm training listing scope")
    if "trainer" not in text_blob.lower() and "training" not in text_blob.lower() and "behavio" not in text_blob.lower():
        advisory_warnings.append("trainer/service signal is weak in source copy")

    return {
        "fetch": {
            "source_url": url,
            "final_url": final_url,
            "http_status": status,
            "content_type": content_type,
            "charset": charset,
            "error": error,
            "domain": domain,
        },
        "snapshot": snapshot,
        "text_blob": text_blob,
        "contacts": {
            "website": website,
            "phone": contact_phone,
            "email": contact_email,
            "address": address,
            "address_evidence": address_evidence,
        },
        "business_name": business_name,
        "taxonomy": {
            "resource_type": resource_type,
            "service_types": services,
            "age_specialties": ages,
            "behavior_issues": behavior_issues,
        },
        "evidence": {
            "name": name_evidence,
            "resource_type": resource_evidence,
            "service_types": service_evidence,
            "age_specialties": age_evidence,
            "behavior_issues": issue_evidence,
        },
        "blocked_issues": blocked_issues,
        "advisory_warnings": advisory_warnings,
    }


def format_list(values: list[str]) -> str:
    return "|".join(values)


def normalize_phone(value: str) -> str:
    digits = re.sub(r"\D+", "", value or "")
    if digits.startswith("61") and len(digits) > 9:
        return f"0{digits[2:]}"
    return digits


def load_existing_inventory_snapshot(page_size: int = 500) -> tuple[list[ExistingInventoryRecord], dict[str, Any]]:
    supabase_url = (os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or "").rstrip("/")
    service_role_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or ""
    decrypt_key = os.environ.get("SUPABASE_PGCRYPTO_KEY") or None

    metadata = {
        "source": "supabase_rpc:search_trainers",
        "status": "available",
        "record_count": 0,
        "contact_signals_decrypted": bool(decrypt_key),
        "warning": "",
    }

    if not supabase_url or not service_role_key:
        metadata["status"] = "unavailable"
        metadata["warning"] = (
            "existing inventory duplicate check unavailable; SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL "
            "and SUPABASE_SERVICE_ROLE_KEY are required for the canonical read path"
        )
        return [], metadata

    endpoint = f"{supabase_url}/rest/v1/rpc/search_trainers"
    headers = {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    fetched_rows: list[dict[str, Any]] = []
    offset = 0
    while True:
        payload = {
            "user_lat": None,
            "user_lng": None,
            "age_filters": None,
            "issue_filters": None,
            "service_type_filter": None,
            "verified_only": False,
            "rescue_only": False,
            "distance_filter": "any",
            "price_max": None,
            "search_term": None,
            "result_limit": page_size,
            "result_offset": offset,
            "p_key": decrypt_key,
        }
        request = Request(endpoint, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
        context = ssl.create_default_context()
        try:
            with urlopen(request, timeout=20, context=context) as response:
                page_rows = json.loads(response.read().decode("utf-8"))
        except HTTPError as exc:
            metadata["status"] = "error"
            metadata["warning"] = f"existing inventory duplicate check failed: HTTPError {exc.code}: {exc.reason}"
            return [], metadata
        except URLError as exc:
            metadata["status"] = "error"
            metadata["warning"] = f"existing inventory duplicate check failed: URLError: {exc.reason}"
            return [], metadata
        except Exception as exc:
            metadata["status"] = "error"
            metadata["warning"] = f"existing inventory duplicate check failed: {type(exc).__name__}: {exc}"
            return [], metadata

        if not isinstance(page_rows, list):
            metadata["status"] = "error"
            metadata["warning"] = "existing inventory duplicate check failed: unexpected RPC payload shape"
            return [], metadata

        fetched_rows.extend(page_rows)
        if len(page_rows) < page_size:
            break
        offset += page_size

    records = [
        ExistingInventoryRecord(
            business_id=int(row["business_id"]),
            business_name=str(row.get("business_name") or "").strip(),
            domain=normalize_domain(str(row.get("business_website") or "").strip()),
            phone=normalize_phone(str(row.get("business_phone") or "").strip()),
            email=str(row.get("business_email") or "").strip().lower(),
            suburb_name=str(row.get("suburb_name") or "").strip(),
            council_name=str(row.get("council_name") or "").strip(),
            resource_type="trainer_or_behaviour_consultant",
        )
        for row in fetched_rows
        if row.get("business_id") is not None
    ]
    metadata["record_count"] = len(records)
    if not decrypt_key:
        metadata["warning"] = (
            "existing inventory loaded without decrypted phone/email signals because SUPABASE_PGCRYPTO_KEY is not configured"
        )
    return records, metadata


def compute_publish_status(blocked_issues: list[str], advisory_warnings: list[str]) -> str:
    if blocked_issues:
        return "blocked"
    if advisory_warnings:
        return "needs_review"
    return "ready"


def build_duplicate_assessment(
    signal_hits: list[dict[str, Any]],
    current_name_key: str,
    current_locality_key: str,
) -> dict[str, Any]:
    if not signal_hits:
        return {
            "status": "no_duplicate_concern",
            "matched_rows": [],
            "matched_inventory_ids": [],
            "signals": [],
            "warnings": [],
        }

    warnings: list[str] = []
    signals_by_reference: dict[tuple[str, int], set[str]] = {}
    blocked_duplicate = False
    conflicting_duplicate = False

    for hit in signal_hits:
        reference_type = str(hit["reference_type"])
        reference_id = int(hit["reference_id"])
        signal = str(hit["signal"])
        signals_by_reference.setdefault((reference_type, reference_id), set()).add(signal)
        warnings.append(str(hit["warning"]))

        same_name = hit.get("previous_name_key") == current_name_key
        same_locality = hit.get("previous_locality_key") == current_locality_key

        if signal in {"phone", "email"}:
            if same_name and same_locality:
                blocked_duplicate = True
            else:
                conflicting_duplicate = True

    for reference_signals in signals_by_reference.values():
        if {"domain_locality", "name_locality"}.issubset(reference_signals):
            blocked_duplicate = True
        if len(reference_signals) >= 2 and not blocked_duplicate:
            conflicting_duplicate = True

    if blocked_duplicate:
        status = "blocked_duplicate"
    elif conflicting_duplicate:
        status = "conflicting_duplicate"
    else:
        status = "possible_duplicate"

    return {
        "status": status,
        "matched_rows": sorted(reference_id for reference_type, reference_id in signals_by_reference if reference_type == "batch"),
        "matched_inventory_ids": sorted(
            reference_id for reference_type, reference_id in signals_by_reference if reference_type == "inventory"
        ),
        "signals": sorted({str(hit["signal"]) for hit in signal_hits}),
        "warnings": warnings,
    }


def build_mapping_candidate(record: dict[str, Any]) -> dict[str, Any]:
    extracted = record["extracted"]
    locality = record["locality"]
    taxonomy = record["taxonomy"]
    duplicate_assessment = record["duplicate_assessment"]

    businesses_payload = {
        "name": extracted["business_name"] or record["business_name_hint"],
        "website": extracted["website"] or None,
        "address": extracted["address"] or None,
        "suburb_id": locality["suburb_id"],
        "bio": extracted["description"] or None,
        "resource_type": taxonomy["resource_type"],
        "service_type_primary": taxonomy["service_types"][0] if taxonomy["service_types"] else None,
    }
    contact_evidence = {
        "website": extracted["website"] or None,
        "phone_plaintext": extracted["phone"] or None,
        "email_plaintext": extracted["email"] or None,
        "address": extracted["address"] or None,
    }
    sensitive_contact_payload = {
        "phone_encrypted_source": "contact_evidence.phone_plaintext" if extracted["phone"] else None,
        "email_encrypted_source": "contact_evidence.email_plaintext" if extracted["email"] else None,
        "requires_encryption": bool(extracted["phone"] or extracted["email"]),
    }
    trainer_specializations_rows = [
        {"age_specialty": value}
        for value in taxonomy["age_specialties"]
    ]
    trainer_services_rows = [
        {"service_type": value, "is_primary": index == 0}
        for index, value in enumerate(taxonomy["service_types"])
    ]
    trainer_behavior_issues_rows = [
        {"behavior_issue": value}
        for value in taxonomy["behavior_issues"]
    ]

    mapping_blockers: list[str] = []
    mapping_warnings: list[str] = []

    if duplicate_assessment["status"] == "blocked_duplicate":
        mapping_blockers.extend(duplicate_assessment["warnings"])
    elif duplicate_assessment["status"] in {"possible_duplicate", "conflicting_duplicate"}:
        mapping_warnings.extend(duplicate_assessment["warnings"])

    if not businesses_payload["name"]:
        mapping_blockers.append("missing business name for businesses payload")
    if businesses_payload["suburb_id"] is None:
        mapping_blockers.append("missing suburb_id for businesses payload")
    if businesses_payload["resource_type"] == "trainer" and not trainer_specializations_rows:
        mapping_blockers.append("trainer candidate has no specialization rows")
    if not (contact_evidence["website"] or contact_evidence["phone_plaintext"] or contact_evidence["email_plaintext"]):
        mapping_warnings.append("no direct contact field extracted; source URL remains the fallback contact path")

    for warning in record["publish_readiness_warnings"]:
        if record["publish_status"] == "blocked":
            if warning not in mapping_blockers:
                mapping_blockers.append(warning)
        elif warning not in mapping_warnings:
            mapping_warnings.append(warning)

    if mapping_blockers:
        mapping_status = "blocked"
    elif mapping_warnings:
        mapping_status = "needs_review"
    else:
        mapping_status = "mapping_ready"

    return {
        "mapping_status": mapping_status,
        "mapping_blockers": mapping_blockers,
        "mapping_warnings": mapping_warnings,
        "businesses_payload": businesses_payload,
        "contact_evidence": contact_evidence,
        "sensitive_contact_payload": sensitive_contact_payload,
        "trainer_specializations_rows": trainer_specializations_rows,
        "trainer_services_rows": trainer_services_rows,
        "trainer_behavior_issues_rows": trainer_behavior_issues_rows,
    }


def build_review_artifact(
    input_rows: list[dict[str, str]],
    councils: dict[str, CouncilRecord],
    suburb_lookup: dict[tuple[str, str], SuburbRecord],
    input_csv_path: Path,
    existing_inventory: list[ExistingInventoryRecord],
    inventory_check: dict[str, Any],
) -> dict[str, Any]:
    results: list[dict[str, Any]] = []
    seen_domains_by_locality: dict[tuple[str, str], int] = {}
    seen_names_by_locality: dict[tuple[str, str], int] = {}
    seen_phones: dict[str, int] = {}
    seen_emails: dict[str, int] = {}
    previous_candidate_signals: dict[int, dict[str, str]] = {}
    inventory_domains_by_locality: dict[tuple[str, str], list[ExistingInventoryRecord]] = {}
    inventory_names_by_locality: dict[tuple[str, str], list[ExistingInventoryRecord]] = {}
    inventory_phones: dict[str, list[ExistingInventoryRecord]] = {}
    inventory_emails: dict[str, list[ExistingInventoryRecord]] = {}

    for record in existing_inventory:
        record_locality_key = locality_key(record.suburb_name, record.council_name)
        if record.domain:
            inventory_domains_by_locality.setdefault((record.domain, record_locality_key), []).append(record)
        normalized_inventory_name = norm(record.business_name)
        if normalized_inventory_name:
            inventory_names_by_locality.setdefault((normalized_inventory_name, record_locality_key), []).append(record)
        if record.phone:
            inventory_phones.setdefault(record.phone, []).append(record)
        if record.email:
            inventory_emails.setdefault(record.email, []).append(record)

    for index, row in enumerate(input_rows, start=1):
        source_url = row["source_url"].strip()
        suburb_hint = row["suburb_hint"].strip()
        business_name_hint = row["business_name_hint"].strip()
        service_hint = row.get("service_hint", "").strip()
        source_data = extract_page_fields(source_url, business_name_hint, service_hint)
        fetch = source_data["fetch"]
        snapshot = source_data["snapshot"]
        matched_suburb, suburb_warnings = resolve_suburb(suburb_hint, snapshot, suburb_lookup, councils)
        duplicate_signal_hits: list[dict[str, Any]] = []
        current_locality_key = (
            locality_key(matched_suburb.name, matched_suburb.council_name)
            if matched_suburb
            else locality_key(suburb_hint)
        )
        locality_label = matched_suburb.name if matched_suburb else suburb_hint

        final_domain = fetch["domain"]
        normalized_name = norm(source_data["business_name"] or business_name_hint)
        if final_domain:
            domain_key = (final_domain, current_locality_key)
            previous = seen_domains_by_locality.get(domain_key)
            if previous is not None:
                previous_signals = previous_candidate_signals.get(previous, {})
                duplicate_signal_hits.append(
                    {
                        "reference_type": "batch",
                        "reference_id": previous,
                        "signal": "domain_locality",
                        "warning": f"domain+locality duplicates row {previous} ({final_domain} / {locality_label})",
                        "previous_name_key": previous_signals.get("name_key", ""),
                        "previous_locality_key": previous_signals.get("locality_key", ""),
                    }
                )
            else:
                seen_domains_by_locality[domain_key] = index
            for inventory_record in inventory_domains_by_locality.get(domain_key, []):
                duplicate_signal_hits.append(
                    {
                        "reference_type": "inventory",
                        "reference_id": inventory_record.business_id,
                        "signal": "domain_locality",
                        "warning": (
                            f"domain+locality duplicates existing inventory business {inventory_record.business_id} "
                            f"({inventory_record.domain} / {inventory_record.suburb_name})"
                        ),
                        "previous_name_key": norm(inventory_record.business_name),
                        "previous_locality_key": locality_key(inventory_record.suburb_name, inventory_record.council_name),
                    }
                )
        if normalized_name:
            name_key = (normalized_name, current_locality_key)
            previous = seen_names_by_locality.get(name_key)
            if previous is not None:
                previous_signals = previous_candidate_signals.get(previous, {})
                duplicate_signal_hits.append(
                    {
                        "reference_type": "batch",
                        "reference_id": previous,
                        "signal": "name_locality",
                        "warning": f"name+locality duplicates row {previous} ({business_name_hint} / {locality_label})",
                        "previous_name_key": previous_signals.get("name_key", ""),
                        "previous_locality_key": previous_signals.get("locality_key", ""),
                    }
                )
            else:
                seen_names_by_locality[name_key] = index
            for inventory_record in inventory_names_by_locality.get(name_key, []):
                duplicate_signal_hits.append(
                    {
                        "reference_type": "inventory",
                        "reference_id": inventory_record.business_id,
                        "signal": "name_locality",
                        "warning": (
                            f"name+locality duplicates existing inventory business {inventory_record.business_id} "
                            f"({inventory_record.business_name} / {inventory_record.suburb_name})"
                        ),
                        "previous_name_key": norm(inventory_record.business_name),
                        "previous_locality_key": locality_key(inventory_record.suburb_name, inventory_record.council_name),
                    }
                )
        contact_phone = normalize_phone(source_data["contacts"]["phone"])
        contact_email = source_data["contacts"]["email"].strip().lower()
        if contact_phone:
            previous = seen_phones.get(contact_phone)
            if previous is not None:
                previous_signals = previous_candidate_signals.get(previous, {})
                duplicate_signal_hits.append(
                    {
                        "reference_type": "batch",
                        "reference_id": previous,
                        "signal": "phone",
                        "warning": f"phone duplicates row {previous} ({contact_phone})",
                        "previous_name_key": previous_signals.get("name_key", ""),
                        "previous_locality_key": previous_signals.get("locality_key", ""),
                    }
                )
            else:
                seen_phones[contact_phone] = index
            for inventory_record in inventory_phones.get(contact_phone, []):
                duplicate_signal_hits.append(
                    {
                        "reference_type": "inventory",
                        "reference_id": inventory_record.business_id,
                        "signal": "phone",
                        "warning": (
                            f"phone duplicates existing inventory business {inventory_record.business_id} ({contact_phone})"
                        ),
                        "previous_name_key": norm(inventory_record.business_name),
                        "previous_locality_key": locality_key(inventory_record.suburb_name, inventory_record.council_name),
                    }
                )
        if contact_email:
            previous = seen_emails.get(contact_email)
            if previous is not None:
                previous_signals = previous_candidate_signals.get(previous, {})
                duplicate_signal_hits.append(
                    {
                        "reference_type": "batch",
                        "reference_id": previous,
                        "signal": "email",
                        "warning": f"email duplicates row {previous} ({contact_email})",
                        "previous_name_key": previous_signals.get("name_key", ""),
                        "previous_locality_key": previous_signals.get("locality_key", ""),
                    }
                )
            else:
                seen_emails[contact_email] = index
            for inventory_record in inventory_emails.get(contact_email, []):
                duplicate_signal_hits.append(
                    {
                        "reference_type": "inventory",
                        "reference_id": inventory_record.business_id,
                        "signal": "email",
                        "warning": (
                            f"email duplicates existing inventory business {inventory_record.business_id} ({contact_email})"
                        ),
                        "previous_name_key": norm(inventory_record.business_name),
                        "previous_locality_key": locality_key(inventory_record.suburb_name, inventory_record.council_name),
                    }
                )

        taxonomy = source_data["taxonomy"]
        if matched_suburb:
            locality = {
                "suburb_hint": suburb_hint,
                "resolved_suburb": matched_suburb.name,
                "resolved_council": matched_suburb.council_name,
                "resolved_region": matched_suburb.region,
                "suburb_id": matched_suburb.id,
                "council_id": matched_suburb.council_id,
                "postcode": matched_suburb.postcode,
            }
        else:
            locality = {
                "suburb_hint": suburb_hint,
                "resolved_suburb": "",
                "resolved_council": "",
                "resolved_region": "",
                "suburb_id": None,
                "council_id": None,
                "postcode": "",
            }

        previous_candidate_signals[index] = {
            "name_key": normalized_name,
            "locality_key": current_locality_key,
        }
        duplicate_assessment = build_duplicate_assessment(
            duplicate_signal_hits,
            current_name_key=normalized_name,
            current_locality_key=current_locality_key,
        )
        duplicate_warnings = list(duplicate_assessment["warnings"])
        publish_warnings = list(source_data["blocked_issues"]) + list(source_data["advisory_warnings"]) + suburb_warnings + duplicate_warnings
        if inventory_check["status"] != "available":
            publish_warnings.append(inventory_check["warning"])
        if matched_suburb is None:
            publish_warnings.append("canonical suburb_id not resolved")
        if not taxonomy["service_types"]:
            publish_warnings.append("no service taxonomy mapped")
        if not taxonomy["age_specialties"]:
            publish_warnings.append("no age specialty mapped")
        if not source_data["contacts"]["website"]:
            publish_warnings.append("no canonical website extracted")
        publish_status = compute_publish_status(source_data["blocked_issues"] + suburb_warnings, source_data["advisory_warnings"] + duplicate_warnings)

        review_score = 0
        review_score += 25 if fetch["http_status"] and 200 <= int(fetch["http_status"]) < 400 else 0
        review_score += 15 if source_data["contacts"]["website"] else 0
        review_score += 15 if source_data["contacts"]["phone"] else 0
        review_score += 15 if matched_suburb else 0
        review_score += 15 if taxonomy["service_types"] else 0
        review_score += 10 if taxonomy["age_specialties"] else 0
        review_score += 5 if source_data["contacts"]["email"] else 0
        review_score = min(review_score, 100)

        result = {
            "input_row_index": index,
            "source_url": source_url,
            "business_name_hint": business_name_hint,
            "suburb_hint": suburb_hint,
            "service_hint": service_hint,
            "notes": row.get("notes", "").strip(),
            "fetch": {
                "http_status": fetch["http_status"],
                "final_url": fetch["final_url"],
                "content_type": fetch["content_type"],
                "charset": fetch["charset"],
                "error": fetch["error"],
                "domain": fetch["domain"],
            },
            "extracted": {
                "business_name": source_data["business_name"],
                "canonical_business_name": source_data["snapshot"]["meta"].get("og:site_name", "") or source_data["snapshot"]["headings"].get("h1", ""),
                "title": snapshot["title"],
                "h1": snapshot["headings"]["h1"],
                "description": snapshot["meta"].get("description", "") or snapshot["meta"].get("og:description", ""),
                "phone": source_data["contacts"]["phone"],
                "email": source_data["contacts"]["email"],
                "website": source_data["contacts"]["website"],
                "address": source_data["contacts"]["address"],
            },
            "locality": locality,
            "taxonomy": taxonomy,
            "evidence": source_data["evidence"],
            "duplicate_assessment": duplicate_assessment,
            "duplicate_warnings": duplicate_warnings,
            "publish_readiness_warnings": publish_warnings,
            "publish_status": publish_status,
            "review_score": review_score,
        }
        result.update(build_mapping_candidate(result))
        results.append(result)

    ready = sum(1 for row in results if row["publish_status"] == "ready")
    needs_review = sum(1 for row in results if row["publish_status"] == "needs_review")
    blocked = sum(1 for row in results if row["publish_status"] == "blocked")
    mapping_ready = sum(1 for row in results if row["mapping_status"] == "mapping_ready")
    mapping_needs_review = sum(1 for row in results if row["mapping_status"] == "needs_review")
    mapping_blocked = sum(1 for row in results if row["mapping_status"] == "blocked")

    return {
        "pipeline": "concierge_seed_pipeline",
        "phase": "17",
        "task": "CS-1003",
        "generated_at": None,
        "input_csv": str(input_csv_path.resolve()),
        "inventory_duplicate_check": inventory_check,
        "approved_source_only": True,
        "manual_steps": ["lead sourcing", "pre-publish review"],
        "review_counts": {
            "ready": ready,
            "needs_review": needs_review,
            "blocked": blocked,
            "total": len(results),
        },
        "mapping_counts": {
            "mapping_ready": mapping_ready,
            "needs_review": mapping_needs_review,
            "blocked": mapping_blocked,
            "total": len(results),
        },
        "records": results,
    }


def write_csv(artifact: dict[str, Any], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "input_row_index",
        "source_url",
        "business_name_hint",
        "suburb_hint",
        "service_hint",
        "notes",
        "http_status",
        "final_url",
        "domain",
        "business_name",
        "phone",
        "email",
        "website",
        "address",
        "resolved_suburb",
        "resolved_council",
        "resolved_region",
        "suburb_id",
        "council_id",
        "resource_type",
        "service_types",
        "age_specialties",
        "behavior_issues",
        "duplicate_assessment_status",
        "matched_inventory_ids",
        "duplicate_warnings",
        "publish_readiness_warnings",
        "publish_status",
        "mapping_status",
        "mapping_blockers",
        "mapping_warnings",
        "review_score",
    ]
    with output_path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames)
        writer.writeheader()
        for record in artifact["records"]:
            row = {
                "input_row_index": record["input_row_index"],
                "source_url": record["source_url"],
                "business_name_hint": record["business_name_hint"],
                "suburb_hint": record["suburb_hint"],
                "service_hint": record["service_hint"],
                "notes": record["notes"],
                "http_status": record["fetch"]["http_status"] or "",
                "final_url": record["fetch"]["final_url"],
                "domain": record["fetch"]["domain"],
                "business_name": record["extracted"]["business_name"],
                "phone": record["extracted"]["phone"],
                "email": record["extracted"]["email"],
                "website": record["extracted"]["website"],
                "address": record["extracted"]["address"],
                "resolved_suburb": record["locality"]["resolved_suburb"],
                "resolved_council": record["locality"]["resolved_council"],
                "resolved_region": record["locality"]["resolved_region"],
                "suburb_id": record["locality"]["suburb_id"] or "",
                "council_id": record["locality"]["council_id"] or "",
                "resource_type": record["taxonomy"]["resource_type"],
                "service_types": format_list(record["taxonomy"]["service_types"]),
                "age_specialties": format_list(record["taxonomy"]["age_specialties"]),
                "behavior_issues": format_list(record["taxonomy"]["behavior_issues"]),
                "duplicate_assessment_status": record["duplicate_assessment"]["status"],
                "matched_inventory_ids": format_list(
                    [str(value) for value in record["duplicate_assessment"]["matched_inventory_ids"]]
                ),
                "duplicate_warnings": format_list(record["duplicate_warnings"]),
                "publish_readiness_warnings": format_list(record["publish_readiness_warnings"]),
                "publish_status": record["publish_status"],
                "mapping_status": record["mapping_status"],
                "mapping_blockers": format_list(record["mapping_blockers"]),
                "mapping_warnings": format_list(record["mapping_warnings"]),
                "review_score": record["review_score"],
            }
            writer.writerow(row)


def write_mapping_artifact_json(artifact: dict[str, Any], output_path: Path) -> None:
    output_path.write_text(
        json.dumps(
            {
                "pipeline": artifact["pipeline"],
                "phase": artifact["phase"],
                "task": artifact["task"],
                "generated_at": artifact["generated_at"],
                "input_csv": artifact["input_csv"],
                "inventory_duplicate_check": artifact["inventory_duplicate_check"],
                "mapping_counts": artifact["mapping_counts"],
                "records": [
                    {
                        "input_row_index": record["input_row_index"],
                        "source_url": record["source_url"],
                        "business_name_hint": record["business_name_hint"],
                        "duplicate_assessment": record["duplicate_assessment"],
                        "mapping_status": record["mapping_status"],
                        "mapping_blockers": record["mapping_blockers"],
                        "mapping_warnings": record["mapping_warnings"],
                        "businesses_payload": record["businesses_payload"],
                        "contact_evidence": record["contact_evidence"],
                        "sensitive_contact_payload": record["sensitive_contact_payload"],
                        "trainer_specializations_rows": record["trainer_specializations_rows"],
                        "trainer_services_rows": record["trainer_services_rows"],
                        "trainer_behavior_issues_rows": record["trainer_behavior_issues_rows"],
                    }
                    for record in artifact["records"]
                ],
            },
            indent=2,
            ensure_ascii=True,
            sort_keys=False,
        ),
        encoding="utf-8",
    )


def write_mapping_csv(artifact: dict[str, Any], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "input_row_index",
        "source_url",
        "business_name_hint",
        "duplicate_assessment_status",
        "matched_rows",
        "matched_inventory_ids",
        "mapping_status",
        "business_name",
        "suburb_id",
        "resource_type",
        "service_type_primary",
        "specializations",
        "services",
        "behavior_issues",
        "mapping_blockers",
        "mapping_warnings",
    ]
    with output_path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames)
        writer.writeheader()
        for record in artifact["records"]:
            businesses_payload = record["businesses_payload"]
            writer.writerow(
                {
                    "input_row_index": record["input_row_index"],
                    "source_url": record["source_url"],
                    "business_name_hint": record["business_name_hint"],
                    "duplicate_assessment_status": record["duplicate_assessment"]["status"],
                    "matched_rows": format_list([str(value) for value in record["duplicate_assessment"]["matched_rows"]]),
                    "matched_inventory_ids": format_list(
                        [str(value) for value in record["duplicate_assessment"]["matched_inventory_ids"]]
                    ),
                    "mapping_status": record["mapping_status"],
                    "business_name": businesses_payload["name"],
                    "suburb_id": businesses_payload["suburb_id"] or "",
                    "resource_type": businesses_payload["resource_type"],
                    "service_type_primary": businesses_payload["service_type_primary"] or "",
                    "specializations": format_list([row["age_specialty"] for row in record["trainer_specializations_rows"]]),
                    "services": format_list([row["service_type"] for row in record["trainer_services_rows"]]),
                    "behavior_issues": format_list([row["behavior_issue"] for row in record["trainer_behavior_issues_rows"]]),
                    "mapping_blockers": format_list(record["mapping_blockers"]),
                    "mapping_warnings": format_list(record["mapping_warnings"]),
                }
            )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Run the canonical concierge seed pipeline for Phase 17.")
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT, help="Approved seed queue CSV")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR, help="Directory for review artifacts")
    parser.add_argument("--json-name", default="concierge_review_artifact.json", help="JSON output file name")
    parser.add_argument("--csv-name", default="concierge_review_artifact.csv", help="CSV output file name")
    parser.add_argument("--mapping-json-name", default="concierge_mapping_artifact.json", help="JSON mapping output file name")
    parser.add_argument("--mapping-csv-name", default="concierge_mapping_artifact.csv", help="CSV mapping output file name")
    args = parser.parse_args(argv)

    councils, suburb_lookup, _ = load_councils_and_suburbs()
    input_rows = parse_seed_queue(args.input)
    existing_inventory, inventory_check = load_existing_inventory_snapshot()
    artifact = build_review_artifact(
        input_rows,
        councils,
        suburb_lookup,
        args.input,
        existing_inventory,
        inventory_check,
    )
    artifact["generated_at"] = datetime.now().astimezone().isoformat()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    json_path = args.output_dir / args.json_name
    csv_path = args.output_dir / args.csv_name
    mapping_json_path = args.output_dir / args.mapping_json_name
    mapping_csv_path = args.output_dir / args.mapping_csv_name

    json_path.write_text(json.dumps(artifact, indent=2, ensure_ascii=True, sort_keys=False), encoding="utf-8")
    write_csv(artifact, csv_path)
    write_mapping_artifact_json(artifact, mapping_json_path)
    write_mapping_csv(artifact, mapping_csv_path)

    summary = artifact["review_counts"]
    mapping_summary = artifact["mapping_counts"]
    print(f"Wrote JSON review artifact: {json_path}")
    print(f"Wrote CSV review artifact: {csv_path}")
    print(f"Wrote JSON mapping artifact: {mapping_json_path}")
    print(f"Wrote CSV mapping artifact: {mapping_csv_path}")
    print(
        "Inventory duplicate check: "
        f"status={artifact['inventory_duplicate_check']['status']} "
        f"records={artifact['inventory_duplicate_check']['record_count']}"
    )
    print(f"Summary: ready={summary['ready']} needs_review={summary['needs_review']} blocked={summary['blocked']} total={summary['total']}")
    print(
        "Mapping summary: "
        f"mapping_ready={mapping_summary['mapping_ready']} "
        f"needs_review={mapping_summary['needs_review']} "
        f"blocked={mapping_summary['blocked']} "
        f"total={mapping_summary['total']}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
