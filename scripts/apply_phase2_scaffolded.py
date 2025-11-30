import json
from pathlib import Path

INPUT = Path("supabase/phase2_scraped.json")
OUTPUT = Path("supabase/phase2_scaffolded.sql")

def escape(value: str) -> str:
    return value.replace("'", "''")

def encrypt(expr: str) -> str:
    return f"pgp_sym_encrypt('{escape(expr)}', current_setting('pgcrypto.key'))"

def main():
    if not INPUT.exists():
        raise FileNotFoundError("Run scripts/run_phase2_scraper.py first")

    entries = json.loads(INPUT.read_text())
    lines = ["-- Insert scaffolded Phase 2 listings", "BEGIN;"]

    for entry in entries:
        business_name = escape(entry["name"])
        phone_expr = encrypt(entry["phone"])
        email_expr = encrypt(entry["email"])
        abn_expr = encrypt(entry["abn"])
        suburb = escape(entry["suburb"])
        # For scaffolded entries we don't create profiles yet: leave profile_id NULL
        lines.append(
            f"INSERT INTO businesses (profile_id, name, phone_encrypted, email_encrypted, suburb_id, bio, abn, abn_verified, verification_status, resource_type, is_scaffolded, is_claimed)"
            f" VALUES (NULL, '{business_name}', {phone_expr}, {email_expr}, (SELECT id FROM suburbs WHERE name = '{suburb}' LIMIT 1), 'Scraped entry for {business_name}', '{entry['abn']}', false, 'manual_review', 'trainer', true, false);"
        )

        ages = entry["age_specialties"]
        for age in ages:
            lines.append(
                f"INSERT INTO trainer_specializations (business_id, age_specialty) VALUES (currval('businesses_id_seq'), '{age}');"
            )

        issues = entry["behavior_issues"]
        for issue in issues:
            lines.append(
                f"INSERT INTO trainer_behavior_issues (business_id, behavior_issue) VALUES (currval('businesses_id_seq'), '{issue}');"
            )

        services = [entry["primary_service"]] + entry.get("secondary_services", [])
        for service in services:
            lines.append(
                f"INSERT INTO trainer_services (business_id, service_type, is_primary) VALUES (currval('businesses_id_seq'), '{service}', {str(service == entry['primary_service']).lower()});"
            )

        # Use 'manual_upload' as verification_method for scaffolded imports (matches allowed enum values)
        lines.append(
            "INSERT INTO abn_verifications (business_id, abn, business_name, matched_name, similarity_score, verification_method, status)"
            " VALUES (currval('businesses_id_seq'), '{abn}', '{business}', '{business}', 0.00, 'manual_upload', 'manual_review');".format(
                abn=entry["abn"], business=business_name
            )
        )

    lines.append("COMMIT;")
    OUTPUT.write_text("\n".join(lines))
    print(f"Phase 2 scaffolded SQL written to {OUTPUT}")

if __name__ == "__main__":
    main()
