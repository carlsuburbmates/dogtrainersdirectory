import csv
from pathlib import Path
from datetime import datetime

TRAINER_NAMES = [
    "Loose Lead Training", "Puppy Basics Preston", "Senior Dog Specialists",
    "Urban Rescue Rehab", "Brighton Obedience Co", "Whittlesea K9 Academy",
    "Yarra Valley Behavior Labs", "Eastern Agility Club", "Westside Training",
    "Northern Pack Leaders"
]

EMERGENCY_NAMES = [
    "MASH Ringwood", "Bayside Emergency Care", "City Vet 24/7",
    "North Melbourne Shelter", "Metro Urgent Care", "Stonnington Crisis Vet",
    "Port Phillip Shelter", "Frankston Trauma Hospital", "Wyndham Rescue Center",
    "Hume Emergency Vet"
]

AGE_SPECIALTIES = [
    "puppies_0_6m", "adolescent_6_18m", "adult_18m_7y",
    "senior_7y_plus", "rescue_dogs"
]

BEHAVIOR_ISSUES = [
    "pulling_on_lead", "separation_anxiety", "excessive_barking",
    "dog_aggression", "leash_reactivity", "jumping_up",
    "destructive_behaviour", "recall_issues", "anxiety_general",
    "resource_guarding", "mouthing_nipping_biting",
    "rescue_dog_support", "socialisation"
]

SERVICE_TYPES = ["puppy_training", "obedience_training", "behaviour_consultations", "group_classes", "private_training"]

def render_business(index, name, suburb_id, ages, issues):
    abn = f"12{9800000 + index}"
    secondary = [s for s in SERVICE_TYPES if s != SERVICE_TYPES[index % len(SERVICE_TYPES)]]
    return f"""INSERT INTO businesses (profile_id, name, phone, email, suburb_id, bio, pricing, abn, abn_verified, verification_status, resource_type)
VALUES (
  gen_random_uuid(), -- placeholder profile
  '{name} {index}',
  '0411{index:04d}{index:02d}',
  'contact{index}@example.com',
  {suburb_id},
  'Training plan #{index}',
  '$120/hr',
  '{abn}',
  true,
  'verified',
  'trainer'
);
"""

def render_emergency(index, name, suburb_id):
    resource = ["emergency_vet", "urgent_care", "emergency_shelter"][index % 3]
    return f"""INSERT INTO emergency_resources (name, resource_type, phone, email, suburb_id, is_24_hour, is_active)
VALUES (
  '{name}',
  '{resource}',
  '039876{index:04d}',
  'emergency{index}@example.com',
  {suburb_id},
  true,
  true
);
"""

def main():
    import random
    random.seed(42)
    seed_path = Path("supabase/phase1_seeds.sql")
    lines = [
        "-- Generated Phase 1 sample data",
        f"-- {datetime.utcnow().isoformat()}Z",
        "SET search_path = public;"
    ]

    for i in range(1, 51):
        name = TRAINER_NAMES[i % len(TRAINER_NAMES)]
        suburb_id = 1 + (i % 15)
        ages = AGE_SPECIALTIES[:2]
        issues = [BEHAVIOR_ISSUES[i % len(BEHAVIOR_ISSUES)]]
        lines.append(render_business(i, name, suburb_id, ages, issues))

    for i in range(1, 11):
        name = EMERGENCY_NAMES[i - 1]
        suburb_id = 1 + ((i + 10) % 15)
        lines.append(render_emergency(i, name, suburb_id))

    seed_path.write_text("\n".join(lines))
    print("Phase 1 seed script generated at supabase/phase1_seeds.sql")

if __name__ == "__main__":
    main()
