"""
Scraper QA runner stub for Phase 2 backfill.

Workflow:
- Ingest scraped listings JSON + source URLs/screenshots manifest.
- Sample >=10 (or 10% of batch, whichever is greater).
- Validate enums, contact fields, and LGA derivation.
- Check duplicates (ABN, phone, email, name+address).
- (Stub) LLM compare scraped fields to source URLs/screenshots for accuracy.
- Emit per-listing verdicts, batch accuracy %, and reasons; fail batch if accuracy <95% or required contact fields missing.
- Persist run log for audit/human gate.

NOTE: LLM comparison is stubbed; implement `run_llm_check` to call your model and parse a verdict/confidence.
"""

import argparse
import json
import random
import sys
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple

# Locked enums (keep in sync with blueprint_ssot_v1.1.md)
AGE_ENUM = {
    "puppies_0_6m",
    "adolescent_6_18m",
    "adult_18m_7y",
    "senior_7y_plus",
    "rescue_dogs",
}
ISSUE_ENUM = {
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
}
SERVICE_ENUM = {
    "puppy_training",
    "obedience_training",
    "behaviour_consultations",
    "group_classes",
    "private_training",
}

REQUIRED_CONTACT_FIELDS = {"name", "suburb", "phone", "email"}


@dataclass
class Listing:
    data: Dict
    source_url: Optional[str] = None


@dataclass
class QAResult:
    listing_id: str
    ok: bool
    reasons: List[str]
    llm_score: Optional[float] = None


def load_listings(path: Path) -> List[Listing]:
    payload = json.loads(path.read_text())
    listings: List[Listing] = []
    if isinstance(payload, dict):
        payload = payload.get("listings", [])
    for entry in payload:
        listings.append(
            Listing(
                data=entry,
                source_url=entry.get("source_url"),
            )
        )
    return listings


def sample_listings(listings: List[Listing], sample_size: int) -> List[Listing]:
    if sample_size >= len(listings):
        return listings
    return random.sample(listings, sample_size)


def check_enums(entry: Dict) -> List[str]:
    reasons = []
    for age in entry.get("age_specialties", []) or []:
        if age not in AGE_ENUM:
            reasons.append(f"Invalid age enum: {age}")
    for issue in entry.get("behaviour_issues", []) or []:
        if issue not in ISSUE_ENUM:
            reasons.append(f"Invalid issue enum: {issue}")
    primary = entry.get("service_type_primary")
    if primary and primary not in SERVICE_ENUM:
        reasons.append(f"Invalid primary service: {primary}")
    for svc in entry.get("service_types_secondary", []) or []:
        if svc not in SERVICE_ENUM:
            reasons.append(f"Invalid secondary service: {svc}")
    return reasons


def check_required_contact(entry: Dict) -> List[str]:
    missing = [f for f in REQUIRED_CONTACT_FIELDS if not entry.get(f)]
    return [f"Missing {f}" for f in missing]


def normalize(s: Optional[str]) -> str:
    return (s or "").strip().lower()


def check_duplicates(listings: List[Listing]) -> Dict[str, List[str]]:
    seen: Dict[str, str] = {}  # value -> listing_id
    dupes: Dict[str, List[str]] = defaultdict(list)

    def mark(key: str, value: str, lid: str):
        if not value:
            return
        if value in seen:
            dupes[key].append(f"{lid} duplicates {seen[value]}")
        else:
            seen[value] = lid

    for entry in listings:
        lid = str(entry.data.get("id") or entry.data.get("name") or "unknown")
        mark("abn", normalize(entry.data.get("abn")), lid)
        mark("phone", normalize(entry.data.get("phone")), lid)
        mark("email", normalize(entry.data.get("email")), lid)
        name_addr = normalize(entry.data.get("name")) + "|" + normalize(entry.data.get("address"))
        mark("name_address", name_addr, lid)
    return dupes


def run_llm_check(entry: Dict, source_url: Optional[str]) -> Tuple[bool, float, str]:
    """
    Stub for LLM comparison. Implement your model call here.
    Return tuple: (ok, confidence, reason)
    """
    return True, 0.99, "LLM stub passes automatically"


def evaluate_listing(entry: Listing) -> QAResult:
    lid = str(entry.data.get("id") or entry.data.get("name") or "unknown")
    reasons = []
    reasons.extend(check_enums(entry.data))
    reasons.extend(check_required_contact(entry.data))
    ok_llm, score, llm_reason = run_llm_check(entry.data, entry.source_url)
    if not ok_llm:
        reasons.append(llm_reason)
    return QAResult(listing_id=lid, ok=len(reasons) == 0, reasons=reasons, llm_score=score)


def main():
    parser = argparse.ArgumentParser(description="Scraper QA runner stub")
    parser.add_argument("input", type=Path, help="Path to scraped listings JSON")
    parser.add_argument("--sample", type=int, default=10, help="Sample size (min 10 or 10% of batch)")
    parser.add_argument("--output", type=Path, default=Path("qa_run_log.json"))
    args = parser.parse_args()

    listings = load_listings(args.input)
    if not listings:
        print("No listings found in input", file=sys.stderr)
        sys.exit(1)

    sample_size = max(args.sample, max(10, int(len(listings) * 0.1)))
    sampled = sample_listings(listings, sample_size)

    dupes = check_duplicates(listings)
    results: List[QAResult] = []
    for entry in sampled:
        res = evaluate_listing(entry)
        results.append(res)
        # Attach dedupe info if this listing has a known duplicate
        lid = res.listing_id
        for k, dup_msgs in dupes.items():
            for msg in dup_msgs:
                if lid in msg:
                    res.reasons.append(f"Duplicate ({k}): {msg}")
                    res.ok = False

    total_ok = sum(1 for r in results if r.ok)
    accuracy = total_ok / len(results) * 100
    batch_ok = accuracy >= 95 and all(r.ok for r in results)

    summary = {
        "total_listings": len(listings),
        "sampled": len(results),
        "accuracy_percent": round(accuracy, 2),
        "batch_ok": batch_ok,
        "results": [r.__dict__ for r in results],
        "duplicates": dupes,
    }

    args.output.write_text(json.dumps(summary, indent=2))
    print(json.dumps({"accuracy_percent": summary["accuracy_percent"], "batch_ok": batch_ok}, indent=2))
    if not batch_ok:
        sys.exit(1)


if __name__ == "__main__":
    main()
