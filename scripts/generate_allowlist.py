#!/usr/bin/env python3
"""Generate controlled ABN allowlist JSON from CSV source files.

Usage:
  python3 scripts/generate_allowlist.py staging
  python3 scripts/generate_allowlist.py prod

Outputs:
  scripts/controlled_abn_list.staging.json
  scripts/controlled_abn_list.prod.json

CSV format:
  business_id,abn,label
  - Lines starting with # are treated as comments
  - Empty lines are ignored

Validation:
  - business_id must be integer
  - abn must contain exactly 11 digits (digits-only)

Exit codes:
  - 0 success
  - non-zero: failure (missing CSV or no valid rows)
"""
import csv
import json
import os
import re
import sys

SRC_MAP = {
    'staging': 'DOCS/automation/ABN-ABR-GUID_automation/abn_allowlist.staging.csv',
    'prod': 'DOCS/automation/ABN-ABR-GUID_automation/abn_allowlist.prod.csv'
}
OUT_MAP = {
    'staging': 'scripts/controlled_abn_list.staging.json',
    'prod': 'scripts/controlled_abn_list.prod.json'
}

ABN_RE = re.compile(r"^\d{11}$")


def read_csv(path: str):
    if not os.path.exists(path):
        print(f"ERROR: CSV not found: {path}", file=sys.stderr)
        sys.exit(2)

    rows = []
    with open(path, newline='', encoding='utf-8') as fh:
        reader = csv.reader(fh)
        header = None
        for r in reader:
            if not r:
                continue
            line = ','.join(r).strip()
            if not line or line.startswith('#'):
                continue
            if header is None:
                # Accept header if it contains business_id or abn
                hdr = [c.strip().lower() for c in r]
                if 'business_id' in hdr and 'abn' in hdr:
                    header = hdr
                    continue
                else:
                    # assume headerless, fall back to first row as data
                    pass
            rows.append([c.strip() for c in r])
    return rows


def validate_and_build(rows):
    out = []
    for r in rows:
        if len(r) < 2:
            print(f"WARN: skipping invalid row (too few columns): {r}", file=sys.stderr)
            continue
        # support headerless: first=business_id, second=abn, third optional label
        business_id_raw = r[0].strip()
        abn_raw = r[1].strip().replace('\n', '').replace('\r', '')
        label = r[2].strip() if len(r) > 2 else ''
        if not business_id_raw:
            print(f"WARN: skipping row with empty business_id: {r}", file=sys.stderr)
            continue
        try:
            business_id = int(business_id_raw)
        except Exception:
            print(f"WARN: invalid business_id (not integer) — skipping: {business_id_raw}", file=sys.stderr)
            continue
        # remove non-digits from ABN then validate
        abn_digits = re.sub(r"\D", '', abn_raw)
        if not ABN_RE.match(abn_digits):
            print(f"WARN: invalid abn (expected 11 digits) — skipping: {abn_raw}", file=sys.stderr)
            continue
        out.append({'business_id': business_id, 'abn': abn_digits, 'label': label})
    return out


def main():
    if len(sys.argv) < 2:
        print('Usage: generate_allowlist.py <staging|prod>')
        sys.exit(2)
    mode = sys.argv[1].lower()
    if mode not in SRC_MAP:
        print('Mode must be staging or prod', file=sys.stderr)
        sys.exit(2)
    src = SRC_MAP[mode]
    out = OUT_MAP[mode]

    rows = read_csv(src)
    entries = validate_and_build(rows)
    if not entries:
        print(f"ERROR: No valid rows found in {src}", file=sys.stderr)
        sys.exit(2)

    with open(out, 'w', encoding='utf-8') as fh:
        json.dump(entries, fh, indent=2, ensure_ascii=False)
    print(f"Wrote {len(entries)} entries to {out}")


if __name__ == '__main__':
    main()
