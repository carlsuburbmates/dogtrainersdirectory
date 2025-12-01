#!/usr/bin/env python3
"""
Controlled ABN/ABR write test — manual use only

This script runs ABR lookups for a small allowlist of (businessId, abn)
pairs and optionally writes results to the `abn_verifications` table.

Tables / columns used:
- `abn_verifications` (id, business_id, abn, business_name, matched_name, matched_json, similarity_score, status, updated_at)

How the script chooses the database target:
- It prefers SUPABASE_CONNECTION_STRING (admin-style connection string) when present.
- Alternatively it will use SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (REST API) where possible.
- Use distinct secrets for staging vs production; do NOT point a local run at production secrets.

Safety rules:
 - Default behaviour is dry-run; nothing is written unless --apply is explicitly passed.
 - Requires AUTO_APPLY truthy AND SUPABASE_SERVICE_ROLE_KEY for writes.
 - Refuses to process more than MAX_ITEMS (20) unless --allow-bulk is used.
 - Never logs secrets (AUTO_APPLY value, service role key, GUID)

Usage (dry-run):
  SUPABASE_CONNECTION_STRING="<conn>" ABR_GUID="<guid>" python3 scripts/abn_controlled_batch.py

Apply (one-off):
  AUTO_APPLY=true SUPABASE_CONNECTION_STRING="<conn>" SUPABASE_SERVICE_ROLE_KEY="<srk>" ABR_GUID="<guid>" python3 scripts/abn_controlled_batch.py --apply

This is a manual tool for controlled testing; do NOT enable AUTO_APPLY globally until
you have validated writes using a small allowlist.
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import sys
import time
import urllib.request
from dataclasses import dataclass
from typing import List, Optional

from scripts.abn_recheck import call_abr, find_name_in_json, similarity

LOG = logging.getLogger("abn_controlled_batch")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")


@dataclass
class Pair:
    business_id: int
    abn: str


DEFAULT_ALLOWLIST = [
    # Replace these with a curated set of test businessId+ABN pairs used for controlled tests
    # Example placeholder entries — do NOT run these in prod unless you own/understand them
    {"business_id": 1000, "abn": "12345678901"},
]


# MAX_ITEMS protects against accidental large writes from a casual run.
# This script is a manual, tightly controlled tool and is NOT intended to be run
# against the entire table without human review. Default MAX_ITEMS is deliberately
# conservative and must be explicitly overridden using --allow-bulk.
MAX_ITEMS = 20


def load_pairs_from_file(path: str) -> List[Pair]:
    with open(path, "r", encoding="utf-8") as fh:
        data = json.load(fh)
    out = []
    for entry in data:
        out.append(Pair(business_id=int(entry["business_id"]), abn=str(entry["abn"])))
    return out


def find_existing_row(supabase_url: str, srk: str, business_id: int, abn: str) -> Optional[int]:
    # Query Supabase REST for abn_verifications for this business_id + abn
    url = f"{supabase_url.rstrip('/')}/rest/v1/abn_verifications?business_id=eq.{business_id}&abn=eq.{abn}&select=id&limit=1"
    req = urllib.request.Request(url, method="GET")
    req.add_header("apikey", srk)
    req.add_header("Authorization", f"Bearer {srk}")
    req.add_header("Accept", "application/json")
    with urllib.request.urlopen(req, timeout=20) as resp:
        body = resp.read().decode("utf-8")
        items = json.loads(body)
        if items and isinstance(items, list) and len(items) > 0:
            return int(items[0].get("id"))
    return None


def upsert_row(supabase_url: str, srk: str, payload: dict, existing_id: Optional[int]) -> bool:
    if existing_id:
        url = f"{supabase_url.rstrip('/')}/rest/v1/abn_verifications?id=eq.{existing_id}"
        method = "PATCH"
    else:
        url = f"{supabase_url.rstrip('/')}/rest/v1/abn_verifications"
        method = "POST"

    data_bytes = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data_bytes, method=method)
    req.add_header("apikey", srk)
    req.add_header("Authorization", f"Bearer {srk}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=representation")
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            if 200 <= resp.getcode() < 300:
                return True
            LOG.error("Upsert failed: status=%s body=%s", resp.getcode(), resp.read())
            return False
    except Exception as exc:
        LOG.error("Upsert failed: %s", exc)
        return False


def main(argv: Optional[list[str]] = None) -> int:
    argv = argv or sys.argv[1:]
    parser = argparse.ArgumentParser(description="ABN controlled batch writer")
    parser.add_argument("--file", help="JSON file with [{business_id,abn}, ...] entries", default=None)
    parser.add_argument("--apply", action="store_true", help="Apply writes (default dry-run)")
    parser.add_argument("--dry-run", action="store_true", help="Explicit dry-run; do not write updates even if AUTO_APPLY is set")
    parser.add_argument("--allow-bulk", action="store_true", help="Allow more than MAX_ITEMS (explicit conscious override). NOT recommended")
    args = parser.parse_args(argv)

    pairs: List[Pair] = []
    if args.file:
        try:
            pairs = load_pairs_from_file(args.file)
        except Exception as exc:
            LOG.error("Failed to load pairs from file: %s", exc)
            return 2
    else:
        pairs = [Pair(business_id=int(p["business_id"]), abn=str(p["abn"])) for p in DEFAULT_ALLOWLIST]

    if not args.allow_bulk and len(pairs) > MAX_ITEMS:
        LOG.error("Refusing to process %d items — exceed MAX_ITEMS=%d. Use --allow-bulk to override.", len(pairs), MAX_ITEMS)
        return 2

    conn = os.environ.get("SUPABASE_CONNECTION_STRING")
    supabase_url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    srk = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    guid = os.environ.get("ABR_GUID")

    apply_mode = args.apply
    if args.dry_run:
        LOG.info("--dry-run requested: will not write updates (overrides --apply if present)")
        apply_mode = False

    env_auto = os.environ.get("AUTO_APPLY", "false").lower() in ("1", "true", "yes")

    if apply_mode and not env_auto:
        LOG.error("--apply requested but AUTO_APPLY environment variable is not enabled. Aborting.")
        return 2

    if apply_mode and not srk:
        LOG.error("--apply requested but SUPABASE_SERVICE_ROLE_KEY is not present in environment. Aborting.")
        return 2

    if not conn and not supabase_url:
        LOG.error("SUPABASE_CONNECTION_STRING or SUPABASE_URL must be configured in env to perform lookups/updates.")
        return 2

    LOG.info("Running controlled batch (count=%d) mode=%s" , len(pairs), "apply" if apply_mode else "dry-run")

    results = []
    for p in pairs:
        LOG.info("Processing business_id=%s abn=%s", p.business_id, p.abn)
        status, body = call_abr(p.abn, os.environ.get("ABR_API_KEY"), guid)
        if status == 0 or not body:
            LOG.warning("No response for ABN %s", p.abn)
            results.append({"business_id": p.business_id, "abn": p.abn, "status": None, "action": "no_response"})
            continue

        parsed = None
        try:
            parsed = json.loads(body)
        except Exception:
            if body and body.strip().startswith('<'):
                # minimal xml parse (lightweight) - similar to abn_recheck
                import xml.etree.ElementTree as ET

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
                                'ABN': p.abn,
                                'ABNStatus': abn_status,
                                'EntityName': entity_name,
                                'BusinessName': [entity_name] if entity_name else []
                            }
                        }
                    }
                except Exception as exc:
                    LOG.warning("SOAP parse failed for %s: %s", p.abn, exc)
                    parsed = None
            else:
                LOG.warning("Non-JSON non-XML ABR response for %s", p.abn)

        candidate_name = find_name_in_json(parsed) if parsed is not None else None
        sc = 0.0
        if candidate_name:
            sc = similarity(candidate_name, "") if False else 0.0
            # compute similarity vs nothing — we'll rely on ABNStatus authoritative check

        entity = parsed.get('Response', {}).get('ResponseBody', {}) if parsed else {}
        abn_status = entity.get('ABNStatus') if isinstance(entity, dict) else None

        # Determine status using canonical mapping:
        # - no entity / no useful payload => 'rejected'
        # - ABNStatus === 'Active' => 'verified'
        # - otherwise => 'manual_review'
        entity_present = bool(parsed and parsed.get('Response') and parsed.get('Response').get('ResponseBody'))
        if not entity_present:
            state = 'rejected'
            verified = False
        else:
            verified = bool(abn_status == 'Active')
            state = 'verified' if verified else 'manual_review'

        action = 'dry-run'
        success = None

        payload = {
            'business_id': p.business_id,
            'abn': p.abn,
            'business_name': candidate_name or None,
            'matched_name': candidate_name or None,
            'similarity_score': None,
            'verification_method': 'api',
            'status': state,
            # parsed object when available, otherwise store raw payload wrapper
            'matched_json': parsed if parsed else { 'raw': body }
        }

        if apply_mode:
            # Find existing row id using REST
            existing_id = None
            try:
                existing_id = find_existing_row(supabase_url or conn, srk, p.business_id, p.abn)
            except Exception as exc:
                LOG.error("Failed to lookup existing row for %s/%s: %s", p.business_id, p.abn, exc)

            if existing_id:
                action = f"update id={existing_id}"
            else:
                action = "insert"

            ok = upsert_row(supabase_url or conn, srk, payload, existing_id)
            success = ok

        LOG.info("ABN=%s status=%s verified=%s action=%s applied=%s", p.abn, abn_status, verified, action, success)
        results.append({"business_id": p.business_id, "abn": p.abn, "status": abn_status, "verified": verified, "action": action, "applied": success})

        # be polite to ABR
        time.sleep(0.35)

    # summary
    LOG.info("Controlled batch completed — processed=%d applied=%s", len(results), apply_mode)
    print(json.dumps(results, indent=2, ensure_ascii=False))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
