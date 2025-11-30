#!/usr/bin/env python3
"""
Simple validator for supabase/data-import.sql
Checks:
 - Councils insert regions are all valid values according to schema's region enum
 - Suburbs INSERTs do not contain explicit NULL for postcode (postcode must be not-null)
 - Reports any suspicious INSERT lines

This is intentionally conservative and easy to read so maintainers can adapt it.
"""
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
SCHEMA_FILE = REPO_ROOT / 'supabase' / 'schema.sql'
DATA_FILE = REPO_ROOT / 'supabase' / 'data-import.sql'


def extract_region_enum(schema_text: str):
    # Very small parser: finds CREATE TYPE region AS ENUM ( 'a', 'b', ... )
    m = re.search(r"CREATE\s+TYPE\s+region\s+AS\s+ENUM\s*\((.*?)\);", schema_text, re.S | re.I)
    if not m:
        return []
    inner = m.group(1)
    # split by commas but allow single-quoted strings
    vals = re.findall(r"'([^']+)'", inner)
    return [v.strip() for v in vals]


def find_councils_inserts(data_text: str):
    # find the INSERT INTO councils (...) VALUES (...) block using non-greedy match
    m = re.search(r"INSERT\s+INTO\s+councils\s*\((.*?)\)\s*VALUES\s*(.*?);", data_text, re.S | re.I)
    if not m:
        return []
    values_block = m.group(2)
    # find tuples of the form ('name', 'region') — ensure we capture only councils' tuples
    tuples = re.findall(r"\(\s*'([^']+)'\s*,\s*'([^']+)'\s*\)", values_block)
    # tuples now are sequences of (name, region)
    return tuples


def find_suburbs_inserts(data_text: str):
    m = re.search(r"INSERT\s+INTO\s+suburbs\s*\((.*?)\)\s*VALUES\s*(.*);", data_text, re.S | re.I)
    if not m:
        return []
    values_block = m.group(2)
    tuples = re.findall(r"\(([^\)]*)\)", values_block)
    return tuples


def check_councils_regions(schema_text: str, data_text: str):
    regions = extract_region_enum(schema_text)
    if not regions:
        return True, "Could not find region enum in schema (skipping region checks)."

    inserts = find_councils_inserts(data_text)
    bad = []
    for t in inserts:
        # t is now a tuple (name, region)
        if len(t) < 2:
            bad.append((t, 'could not parse name/region fields'))
            continue
        name, region_value = t[0].strip(), t[1].strip()
        if region_value not in regions:
            bad.append((name, f"unknown region '{region_value}' not in schema enum"))
    if bad:
        msg = "Found councils inserts with unexpected region values:\n"
        for name, reason in bad:
            msg += f" - {name} -> {reason}\n"
        return False, msg
    return True, f"All {len(inserts)} councils insert regions are valid."


def check_suburbs_postcode_not_null(data_text: str):
    inserts = find_suburbs_inserts(data_text)
    bad = []
    for t in inserts:
        # split on commas and trim
        parts = [p.strip() for p in re.split(r"(?<!\\),", t)]
        # The INSERT INTO suburbs columns in this repo are: (name, postcode, latitude, longitude, council_id)
        # We expect postcode to be the 2nd column
        if len(parts) < 2:
            bad.append((t, 'too few columns'))
            continue
        postcode_value = parts[1]
        # if postcode_value equals NULL (case-insensitive) then it's invalid
        if re.match(r"(?i)^NULL$", postcode_value):
            bad.append((t, 'postcode is NULL'))
        # also catch empty string ''
        if postcode_value == "''":
            bad.append((t, "postcode is empty string '': consider using valid postcode"))
    if bad:
        msg = f"Found {len(bad)} suburb insert(s) with invalid postcode:\n"
        for t, reason in bad:
            msg += f" - {t} -> {reason}\n"
        return False, msg
    return True, f"All {len(inserts)} suburb inserts have non-null postcode values."


def main():
    if not SCHEMA_FILE.exists():
        print(f"ERROR: {SCHEMA_FILE} not found", file=sys.stderr)
        sys.exit(2)
    if not DATA_FILE.exists():
        print(f"ERROR: {DATA_FILE} not found", file=sys.stderr)
        sys.exit(2)

    schema_text = SCHEMA_FILE.read_text(encoding='utf-8')
    data_text = DATA_FILE.read_text(encoding='utf-8')

    passed = True

    ok, msg = check_councils_regions(schema_text, data_text)
    print(msg)
    if not ok:
        passed = False

    ok2, msg2 = check_suburbs_postcode_not_null(data_text)
    print(msg2)
    if not ok2:
        passed = False

    if not passed:
        print('\nImport validation failed — please fix the issues and re-run.', file=sys.stderr)
        sys.exit(1)

    print('\nImport validation passed.')
    sys.exit(0)


if __name__ == '__main__':
    main()
