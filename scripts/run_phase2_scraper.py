import csv
import json
from pathlib import Path

AGE_ENUM = [
    "puppies_0_6m",
    "adolescent_6_18m",
    "adult_18m_7y",
    "senior_7y_plus",
    "rescue_dogs",
]

ISSUE_ENUM = [
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
]

SERVICE_ENUM = [
    "puppy_training",
    "obedience_training",
    "behaviour_consultations",
    "group_classes",
    "private_training",
]

TARGETS = Path("DOCS/phase2_scraper_targets.csv")
OUTPUT = Path("supabase/phase2_scraped.json")

def map_age(hint: str):
    return [value for value in AGE_ENUM if hint.lower().split("_")[0] in value]

def map_issue(hint: str):
    return [value for value in ISSUE_ENUM if hint.replace("_"," ").lower() in value.replace("_"," ")]

def map_service(hint: str):
    for value in SERVICE_ENUM:
        if hint.replace("_", " ") in value.replace("_", " "):
            return value
    return SERVICE_ENUM[0]

def run():
    if not TARGETS.exists():
        raise FileNotFoundError("Missing DOCS/phase2_scraper_targets.csv")

    rows = []
    with TARGETS.open() as csvfile:
        reader = csv.DictReader(csvfile)
        for entry in reader:
            ages = map_age(entry["age_hint"]) or ["adult_18m_7y"]
            issues = map_issue(entry["issue_hint"]) or ["resource_guarding"]
            service = map_service(entry["service_hint"])
            rows.append(
                {
                    "source_url": entry["url"],
                    "name": entry["name"],
                    "phone": entry["phone"],
                    "email": entry["email"],
                    "suburb": entry["suburb"],
                    "lga": entry["lga"],
                    "age_specialties": ages,
                    "behavior_issues": issues,
                    "primary_service": service,
                    "secondary_services": [x for x in SERVICE_ENUM if x != service][:2],
                    "abn": entry["abn"],
                    "resource_type": "trainer",
                    "is_scaffolded": True,
                    "is_claimed": False,
                }
            )

    OUTPUT.write_text(json.dumps(rows, indent=2))
    print(f"Scraper output written to {OUTPUT}")

if __name__ == "__main__":
    run()
