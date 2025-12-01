#!/usr/bin/env python3
"""
/*
 *  ABR / ABN Lookup integration — developer note
 *
 *  Source: Australian Business Register ABRXMLSearch Web Services
 *  ---------------------------------------------------------------
 *  - We use the SOAP method “SearchByABNv202001” for ABN validation.
 *  - Requests require an authentication GUID (secret, do not expose to clients).
 *  - ABR data is public-only. Returned fields beyond ABN & ABNStatus are optional:
 *      • businessName(s), GST status, address (state/postcode), ACN/ASIC, historical names, etc.
 *      • Full street address, contact info, private data are NOT provided.
 *  - ABR is read-only: we cannot update business records via API.
 *  - ABR registry is updated hourly — treat cached/ stored data as potentially stale after ~1 hr.
 *
 *  Usage guidelines:
 *  - Only mark ABN “verified” when ABN exists AND ABNStatus === 'Active'.
 *  - Always treat all non-required fields as optional. Use optional chaining / null checks.
 *  - Persist raw API payload (XML or JSON) for audit / future re-verification (e.g. in matched_json column).
 *  - Do not rely on businessName or address for mandatory profile completeness or user onboarding approval.
 *
 *  If ABR returns minimal or no data (suppressed entry):
 *  - Fallback to manual review or require user-supplied documentation/verification.
 */
Hardened ABN re-check

Connects to Postgres using SUPABASE_CONNECTION_STRING (env) and re-checks
recent ABN verification rows against the ABR API. Uses JSON parsing and a
fuzzy similarity check (difflib) to decide verification, with simple
logging. The script is intentionally dependency-free (stdlib only) so it's
easy to run and test in CI.

Usage: set SUPABASE_CONNECTION_STRING and ABR_API_KEY or ABR_GUID in env
and run: python3 scripts/abn_recheck.py
"""

from __future__ import annotations

import json
import xml.etree.ElementTree as ET
import logging
import os
import shlex
import subprocess
import sys
import time
import urllib.request
from dataclasses import dataclass
from difflib import SequenceMatcher
from typing import Any, Dict, Iterable, Optional, Tuple
from datetime import datetime, timezone, timedelta
import argparse

LOG = logging.getLogger("abn_recheck")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")


def normalize_name(s: str) -> str:
    """Return a normalized string for comparison: lowercase and collapse non-alnum."""
    if s is None:
        return ""
    # keep space and alphanumeric, lower-case
    import re

    s = s.lower()
    s = re.sub(r"[^0-9a-z ]+", " ", s)
    s = " ".join(s.split())
    return s


def similarity(a: str, b: str) -> float:
    """Compute a 0..1 similarity score between two strings."""
    a2 = normalize_name(a)
    b2 = normalize_name(b)
    if not a2 or not b2:
        return 0.0
    return SequenceMatcher(None, a2, b2).ratio()


def find_name_in_json(j: Any) -> Optional[str]:
    """Search a parsed JSON object for the most likely name field.

    This is intentionally permissive: ABR return shapes vary, so we look for
    keys like entityName/businessName/legalName and fall back to the first
    string we find.
    """
    if isinstance(j, str):
        return j
    if isinstance(j, dict):
        # prioritized keys
        keys = [
            "entityName",
            "EntityName",
            "mainName",
            "legalName",
            "BusinessName",
            "businessName",
            "organisationName",
            "organisationName",
            "name",
            "organisation_name",
        ]
        for k in keys:
            if k in j and isinstance(j[k], str) and j[k].strip():
                return j[k].strip()
        # Otherwise search nested values
        for v in j.values():
            found = find_name_in_json(v)
            if found:
                return found
    if isinstance(j, list):
        for elem in j:
            found = find_name_in_json(elem)
            if found:
                return found
    return None


def call_abr(abn: str, api_key: Optional[str], guid: Optional[str]) -> Tuple[int, str]:
    """Call ABR service and return (status, body). We prefer the public
    abr.business.gov.au JSON endpoint; include GUID if provided. If an API
    key is present it's sent as a Bearer token (some endpoints accept this).
    """
    # Prefer SOAP/XML when a GUID is available (richer payload). Fall back
    # to the JSON/JSONP endpoint if SOAP is unavailable or the request fails.
    if guid:
        soap_url = 'https://abr.business.gov.au/abrxmlsearch/AbrXmlSearch.asmx/ABRSearchByABN'
        soap_body = f'''<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:abr="http://abr.business.gov.au/abrxmlsearch/">
  <soap:Body>
    <abr:ABRSearchByABN>
      <abr:searchString>{abn}</abr:searchString>
      <abr:includeHistoricalDetails>N</abr:includeHistoricalDetails>
      <abr:authenticationGuid>{guid}</abr:authenticationGuid>
    </abr:ABRSearchByABN>
  </soap:Body>
</soap:Envelope>'''
        req = urllib.request.Request(soap_url, data=soap_body.encode('utf-8'))
        req.add_header('Content-Type', 'text/xml; charset=utf-8')
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                body = resp.read().decode('utf-8')
                return resp.getcode(), body
        except Exception:
            # fall through to JSON endpoint below
            pass

    base = f"https://abr.business.gov.au/json/AbnDetails.aspx?abn={abn}"
    if guid:
        base += f"&guid={shlex.quote(guid)}"

    req = urllib.request.Request(base)
    if api_key:
        req.add_header("Authorization", f"Bearer {api_key}")

    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            body = resp.read().decode("utf-8")
            return resp.getcode(), body
    except Exception as exc:  # (socket errors, HTTP errors, timeouts)
        LOG.warning("ABR fetch failed for %s: %s", abn, exc)
        return 0, ""


@dataclass
class Row:
    id: int
    abn: str
    business_name: str


def fetch_rows(conn: str, limit: int = 50) -> Iterable[Row]:
    """Fetch recent ABN verification rows that need recheck.

    Uses psql client via subprocess to avoid adding DB client dependencies.
    """
    query = (
        "SELECT id||'|'||abn||'|'||coalesce(business_name, '') "
        "FROM abn_verifications WHERE status IN ('pending','manual_review') "
        "AND created_at >= now() - interval '30 days' LIMIT %s;" % limit
    )

    # If a Supabase service role key and SUPABASE_URL are present, prefer
    # using the HTTP REST API (avoids outbound TCP connection issues in
    # hosted runners). Otherwise fall back to using psql.
    supabase_url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    srk = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if supabase_url and srk:
        # compute ISO date for 30 days ago
        cutoff = (datetime.now(timezone.utc) - timedelta(days=30)).replace(microsecond=0).isoformat()
        # PostgREST query: status=in.(pending,manual_review)&created_at=gte.<cutoff>
        # We URL-encode the query parameters
        import urllib.parse as up

        q = (
            f"status=in.(pending,manual_review)&created_at=gte.{up.quote(cutoff)}"
            f"&select=id,abn,business_name&limit={limit}"
        )
        url = f"{supabase_url.rstrip('/')}/rest/v1/abn_verifications?{q}"
        req = urllib.request.Request(url)
        req.add_header("apikey", srk)
        req.add_header("Authorization", f"Bearer {srk}")
        req.add_header("Accept", "application/json")
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                body = resp.read().decode("utf-8")
                data = json.loads(body)
        except Exception as exc:
            LOG.error("http fetch failed: %s", exc)
            return []

        out = []
        for item in data:
            try:
                out.append(Row(id=int(item.get("id")), abn=item.get("abn", ""), business_name=item.get("business_name", "")))
            except Exception:
                LOG.warning("invalid row in http response: %r", item)
        return out

    cmd = ["psql", conn, "-tA", "-F", "|", "-c", query]
    LOG.debug("Running psql to fetch rows: %s", cmd)
    try:
        proc = subprocess.run(cmd, capture_output=True, check=True, text=True)
    except subprocess.CalledProcessError as exc:
        LOG.error("psql failed: %s\nstderr:%s", exc, exc.stderr)
        return []

    lines = [ln for ln in proc.stdout.splitlines() if ln.strip()]
    out = []
    for l in lines:
        parts = l.split("|", 2)
        if len(parts) < 3:
            LOG.warning("unexpected row format: %r", l)
            continue
        try:
            rid = int(parts[0])
        except Exception:
            LOG.warning("invalid id in row: %r", parts[0])
            continue
        out.append(Row(id=rid, abn=parts[1].strip(), business_name=parts[2].strip()))
    return out


def update_row_verified(conn: str, row_id: int, status: str, matched_name: str, score: float, raw_json: str, dry_run: bool = False) -> bool:
    """Update the abn_verifications row using psql safely via dollar quoting.

    Returns True on success, False otherwise.
    """
    # Avoid issues with quotes by using a dollar-quoted string marker
    dq = "$ABR$"
    sql = (
        "UPDATE abn_verifications SET status='" + status + "', "
        "matched_name=" + dq + matched_name + dq + ", "
        "similarity_score=%s, matched_json=%s::jsonb, updated_at=now() WHERE id=%s;" % (score, dq + raw_json + dq + "", row_id)
    )
    # If we have a Supabase service role key, use HTTP PATCH instead of psql
    supabase_url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    srk = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if srk and supabase_url:
        if dry_run:
            LOG.info("Dry-run enabled: would PATCH %s/abn_verifications?id=eq.%s with payload", supabase_url, row_id)
            return True
        url = f"{supabase_url.rstrip('/')}/rest/v1/abn_verifications?id=eq.{row_id}"
        payload = {
            "status": status,
            "matched_name": matched_name,
            "similarity_score": float(score),
            "matched_json": json.loads(raw_json) if raw_json else None,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        data_bytes = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data_bytes, method="PATCH")
        req.add_header("apikey", srk)
        req.add_header("Authorization", f"Bearer {srk}")
        req.add_header("Content-Type", "application/json")
        req.add_header("Prefer", "return=representation")
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                if 200 <= resp.getcode() < 300:
                    return True
                LOG.error("PATCH failed: status=%s body=%s", resp.getcode(), resp.read())
                return False
        except Exception as exc:
            LOG.error("HTTP update failed for id=%s: %s", row_id, exc)
            return False

    cmd = ["psql", conn, "-c", sql]
    LOG.debug("Applying update: %s", sql)
    if dry_run:
        LOG.info("Dry-run enabled: would run: %s", sql)
        return True
    try:
        subprocess.run(cmd, check=True, capture_output=True, text=True)
        return True
    except subprocess.CalledProcessError as exc:
        LOG.error("Failed to update id=%s: %s\nstdout:%s\nstderr:%s", row_id, exc, exc.stdout, exc.stderr)
        return False


def process_row(
    conn: str,
    row: Row,
    api_key: Optional[str],
    guid: Optional[str],
    threshold_verified: float = 0.85,
    threshold_manual: float = 0.60,
    dry_run: bool = False,
    auto_apply: bool = False,
) -> None:
    LOG.info("Checking ABN=%s (id=%s) for '%s'", row.abn, row.id, row.business_name)
    status, body = call_abr(row.abn, api_key, guid)
    if status == 0 or not body:
        LOG.info("No response for ABN %s", row.abn)
        return

    # attempt to parse JSON - ABR endpoint responds with JSON-ish payloads
    parsed = None
    try:
        parsed = json.loads(body)
    except Exception:
        # might be SOAP XML — try to parse relevant fields and map to a
        # minimal dict shape that our downstream logic understands.
        if body and body.strip().startswith('<'):
            try:
                root = ET.fromstring(body)

                def find_local(el, name_candidates):
                    for e in el.iter():
                        tag = e.tag
                        if isinstance(tag, str) and '}' in tag:
                            local = tag.split('}')[-1]
                        else:
                            local = tag
                        if local in name_candidates and e.text and e.text.strip():
                            return e.text.strip()
                    return None

                entity_name = find_local(root, ['EntityName', 'entityName', 'BusinessName', 'businessName', 'LegalName'])
                abn_status = find_local(root, ['ABNStatus', 'abnStatus'])

                parsed = {
                    'Response': {
                        'ResponseBody': {
                            'ABN': row.abn,
                            'ABNStatus': abn_status,
                            'EntityName': entity_name,
                            'BusinessName': [entity_name] if entity_name else []
                        }
                    }
                }
            except Exception:
                LOG.warning("ABR SOAP/XML parse failed for abn %s; raw: %s", row.abn, body[:500])
                parsed = None
        else:
            LOG.warning("ABR response not JSON for abn %s; raw: %s", row.abn, body[:500])

    candidate_name = find_name_in_json(parsed) if parsed is not None else None
    # Extract authoritative ABNStatus if present
    abn_status = None
    try:
        abn_status = parsed.get('Response', {}).get('ResponseBody', {}).get('ABNStatus') if parsed else None
    except Exception:
        abn_status = None

    # Canonical mapping (single source of truth):
    # - no entity / no useful payload => 'rejected'
    # - ABNStatus === 'Active' => 'verified'
    # - otherwise => 'manual_review'
    entity_present = bool(parsed and parsed.get('Response') and parsed.get('Response').get('ResponseBody'))

    if not entity_present:
        # ABR returned no entity — mark as rejected (invalid ABN)
        state = 'rejected'
        score = 0.0
        LOG.info("ABR returned no entity for id=%s abn=%s — marking rejected", row.id, row.abn)
        if dry_run or not auto_apply:
            LOG.info("(not applying update - dry_run=%s auto_apply=%s)", dry_run, auto_apply)
        else:
            update_row_verified(conn, row.id, state, candidate_name or row.business_name or "", score, json.dumps(parsed) if parsed else json.dumps({ 'raw': body }))

    else:
        # entity exists — consult ABNStatus
        if abn_status == 'Active':
            state = 'verified'
            score = similarity(row.business_name or "", candidate_name or "")
            LOG.info("ABNStatus Active for id=%s abn=%s — marking verified (score=%.3f)", row.id, row.abn, score)
            if dry_run or not auto_apply:
                LOG.info("(not applying update - dry_run=%s auto_apply=%s)", dry_run, auto_apply)
            else:
                update_row_verified(conn, row.id, state, candidate_name or row.business_name or "", score, json.dumps(parsed))
        else:
            state = 'manual_review'
            if candidate_name:
                score = similarity(row.business_name or "", candidate_name)
            else:
                score = 0.0
            LOG.info("ABNStatus not active for id=%s abn=%s — marking manual_review (score=%.3f)", row.id, row.abn, score)
            if dry_run or not auto_apply:
                LOG.info("(not applying update - dry_run=%s auto_apply=%s)", dry_run, auto_apply)
            else:
                update_row_verified(conn, row.id, state, candidate_name or row.business_name or "", score, json.dumps(parsed))


def main(argv: Optional[list[str]] = None) -> int:
    argv = argv or sys.argv[1:]
    conn = os.environ.get("SUPABASE_CONNECTION_STRING")
    if not conn:
        LOG.error("SUPABASE_CONNECTION_STRING not set")
        return 2

    api_key = os.environ.get("ABR_API_KEY")
    guid = os.environ.get("ABR_GUID")

    rows = list(fetch_rows(conn, limit=50))
    if not rows:
        LOG.info("No ABN rows to re-check")
        return 0

    LOG.info("Processing %d ABN rows", len(rows))
    parser = argparse.ArgumentParser(description="ABN re-check script")
    parser.add_argument("--dry-run", action="store_true", help="Do not write updates to the DB")
    args = parser.parse_args(argv)

    env_auto = os.environ.get("AUTO_APPLY", "false").lower() in ("1", "true", "yes")
    dry_run = args.dry_run
    for row in rows:
        try:
            process_row(conn, row, api_key, guid, dry_run=dry_run, auto_apply=env_auto)
            # Be polite to ABR endpoint
            time.sleep(0.35)
        except Exception:
            LOG.exception("Unhandled error processing id=%s abn=%s", row.id, row.abn)

    LOG.info("ABN re-check run completed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
