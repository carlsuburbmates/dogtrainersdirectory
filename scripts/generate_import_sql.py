import csv
import os
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATA_DIR = (REPO_ROOT / "data").resolve()
DATA_DIR = Path(os.environ.get("DTD_DATA_DIR") or os.environ.get("DTD_DOCS_DIR") or str(DEFAULT_DATA_DIR)).resolve()

CSV_PATH = DATA_DIR / "suburbs_councils_mapping.csv"
OUTPUT_PATH = REPO_ROOT / "supabase" / "data-import.sql"

def main():
    rows = []
    councils = {}
    with CSV_PATH.open() as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
            council = row['council'].strip()
            region = row['region'].strip()
            councils[council] = region

    council_inserts = []
    for council, region in councils.items():
        council_inserts.append(f"('{council}', '{region}')")

    suburb_inserts = []
    for row in rows:
        suburb = row['suburb'].replace("'", "''")
        council = row['council']
        postcode = row['postcode'] or 'NULL'
        latitude = row['latitude'] or 'NULL'
        longitude = row['longitude'] or 'NULL'
        suburb_inserts.append(
            f"('{suburb}', {postcode!s}, {latitude!s}, {longitude!s}, (SELECT id FROM councils WHERE name = '{council}'))"
        )

    content = """-- Generated suburb import based on data/suburbs_councils_mapping.csv\n"""
    content += "TRUNCATE TABLE suburbs RESTART IDENTITY CASCADE;\n"
    content += "TRUNCATE TABLE councils RESTART IDENTITY CASCADE;\n\n"
    content += "INSERT INTO councils (name, region) VALUES\n"
    content += ",\n".join(council_inserts) + ";\n\n"
    content += "INSERT INTO suburbs (name, postcode, latitude, longitude, council_id) VALUES\n"
    content += ",\n".join(suburb_inserts) + ";\n"

    OUTPUT_PATH.write_text(content)

if __name__ == '__main__':
    main()
