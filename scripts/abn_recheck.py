#!/usr/bin/env python3
"""Hardened ABN re-check

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


def update_row_verified(conn: str, row_id: int, status: str, matched_name: str, score: float, raw_json: str) -> bool:
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
    cmd = ["psql", conn, "-c", sql]
    LOG.debug("Applying update: %s", sql)
    try:
        subprocess.run(cmd, check=True, capture_output=True, text=True)
        return True
    except subprocess.CalledProcessError as exc:
        LOG.error("Failed to update id=%s: %s\nstdout:%s\nstderr:%s", row_id, exc, exc.stdout, exc.stderr)
        return False


def process_row(conn: str, row: Row, api_key: Optional[str], guid: Optional[str], threshold_verified: float = 0.85, threshold_manual: float = 0.60) -> None:
    LOG.info("Checking ABN=%s (id=%s) for '%s'", row.abn, row.id, row.business_name)
    status, body = call_abr(row.abn, api_key, guid)
    if status == 0 or not body:
        LOG.info("No response for ABN %s", row.abn)
        return

    # attempt to parse JSON - ABR endpoint responds with JSON-ish payloads
    try:
        parsed = json.loads(body)
    except Exception:
        LOG.warning("ABR response not JSON for abn %s; raw: %s", row.abn, body[:500])
        parsed = None

    candidate_name = find_name_in_json(parsed) if parsed is not None else None
    if candidate_name:
        score = similarity(row.business_name or "", candidate_name)
        LOG.info("Found ABR candidate name: %r (score=%.3f)", candidate_name, score)
        if score >= threshold_verified:
            LOG.info("Marking id=%s verified (score %.3f)", row.id, score)
            update_row_verified(conn, row.id, "verified", candidate_name, score, json.dumps(parsed))
        elif score >= threshold_manual:
            LOG.info("Marking id=%s for manual_review (score %.3f)", row.id, score)
            # Update lower-confidence matches to manual_review and store details
            update_row_verified(conn, row.id, "manual_review", candidate_name, score, json.dumps(parsed))
        else:
            LOG.info("No confident match for id=%s (score %.3f) — leaving status", row.id, score)
    else:
        LOG.info("No candidate name found in ABR response for abn %s", row.abn)


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
    for row in rows:
        try:
            process_row(conn, row, api_key, guid)
            # Be polite to ABR endpoint
            time.sleep(0.35)
        except Exception:
            LOG.exception("Unhandled error processing id=%s abn=%s", row.id, row.abn)

    LOG.info("ABN re-check run completed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
