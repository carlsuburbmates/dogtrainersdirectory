#!/usr/bin/env python3
"""
Basic test script for the Phase 2 scaffold generator.
Checks:
 - Generated file exists
 - profile_id values are NULL (we expect 'VALUES (NULL,' for business inserts)
 - verification_method uses 'manual_upload'
 - There are as many 'INSERT INTO businesses' as entries in the source JSON
"""
from pathlib import Path
import re
import json
import sys

REPO_ROOT = Path(__file__).resolve().parents[1]
GEN = REPO_ROOT / 'supabase' / 'phase2_scaffolded.sql'
SRC = REPO_ROOT / 'supabase' / 'phase2_scraped.json'

if not SRC.exists():
    print('Source JSON not found; run the scraper first or check supabase/phase2_scraped.json')
    sys.exit(2)

entries = json.loads(SRC.read_text(encoding='utf-8'))
expected_business_count = len(entries)

if not GEN.exists():
    print('ERROR: generated SQL file not found:', GEN)
    sys.exit(2)

content = GEN.read_text(encoding='utf-8')

# Count business insert occurrences
business_inserts = re.findall(r"INSERT INTO businesses\s*\(|INSERT INTO businesses.*?VALUES", content, re.I | re.S)
if len(business_inserts) < expected_business_count:
    print(f"ERROR: found {len(business_inserts)} business INSERTs, expected at least {expected_business_count}")
    sys.exit(1)

# Ensure profile_id is NULL in each business insert
null_profile_count = len(re.findall(r"VALUES\s*\(NULL\s*,", content))
if null_profile_count < expected_business_count:
    print(f"ERROR: only {null_profile_count}/{expected_business_count} business INSERTs set profile_id=NULL")
    sys.exit(1)

# Ensure manual_upload appears for verification_method
manual_upload_count = content.count("'manual_upload'")
if manual_upload_count < expected_business_count:
    print(f"ERROR: only {manual_upload_count}/{expected_business_count} abn_verifications use 'manual_upload'")
    sys.exit(1)

print('Phase 2 generator basic checks passed:')
print(f' - business inserts: {len(business_inserts)}')
print(f' - profile_id NULL in inserts: {null_profile_count}')
print(f' - manual_upload occurrences: {manual_upload_count}')
sys.exit(0)
