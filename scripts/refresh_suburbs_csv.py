#!/usr/bin/env python3
"""
Regenerate data/suburbs_councils_mapping.csv from supabase/data-import.sql.

This keeps the CSV aligned to the canonical SQL seed used by the app.
"""
from __future__ import annotations

import csv
import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
SQL_PATH = REPO_ROOT / "supabase" / "data-import.sql"
OUT_PATH = REPO_ROOT / "data" / "suburbs_councils_mapping.csv"


def main() -> None:
    if not SQL_PATH.exists():
        raise SystemExit(f"Missing SQL file: {SQL_PATH}")

    text = SQL_PATH.read_text(encoding="utf-8")

    council_block_match = re.search(r"INSERT INTO councils .*?VALUES\s*(.*?);\n\n", text, flags=re.S)
    if not council_block_match:
        raise SystemExit("Could not find councils INSERT block")

    council_block = council_block_match.group(1)
    councils: dict[str, str] = {}
    for name, region in re.findall(r"\('((?:[^']|'')*)',\s*'((?:[^']|'')*)'\)", council_block):
        councils[name.replace("''", "'")] = region.replace("''", "'")

    suburb_block_match = re.search(r"INSERT INTO suburbs .*?VALUES\s*(.*?);\s*$", text, flags=re.S)
    if not suburb_block_match:
        raise SystemExit("Could not find suburbs INSERT block")

    suburb_block = suburb_block_match.group(1)
    pattern = re.compile(
        r"\('((?:[^']|'')*)',\s*(NULL|\d+),\s*(NULL|[-\d.]+),\s*(NULL|[-\d.]+),\s*\(SELECT id FROM councils WHERE name = '((?:[^']|'')*)'\)\)"
    )

    rows: list[dict[str, str]] = []
    for match in pattern.finditer(suburb_block):
        suburb, postcode, latitude, longitude, council = match.groups()
        suburb = suburb.replace("''", "'")
        council = council.replace("''", "'")
        region = councils.get(council, "")

        def normalise(value: str) -> str:
            return "" if value == "NULL" else value

        rows.append(
            {
                "suburb": suburb,
                "council": council,
                "region": region,
                "postcode": normalise(postcode),
                "latitude": normalise(latitude),
                "longitude": normalise(longitude),
            }
        )

    if not rows:
        raise SystemExit("No suburb rows parsed; check data-import.sql format")

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUT_PATH.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(
            fh,
            fieldnames=["suburb", "council", "region", "postcode", "latitude", "longitude"],
        )
        writer.writeheader()
        writer.writerows(rows)

    print(f"Wrote {len(rows)} rows to {OUT_PATH}")


if __name__ == "__main__":
    main()
