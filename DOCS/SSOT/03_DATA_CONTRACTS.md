# Data Contracts — Tables, Enums, RPCs

**Status:** Canonical (Tier-1)  
**Version:** v1.0

## 1. Canonical tables (high level)
This list is compiled from the input bundle’s DB inventory plus migrations included in the bundle.

### 1.1 Core geography and identity
- `councils`
- `suburbs`
- `profiles` (linked to `auth.users`)

### 1.2 Listings
- `businesses` (canonical “listing” entity; no `trainers` table)
- `trainer_services` (service types per business; primary/secondary)
- `trainer_behavior_issues` (behaviour issues per business)
- `trainer_specializations` (age specialities per business)
- `reviews`

### 1.3 Emergency
- `emergency_resources`
- `emergency_triage_logs` (referenced; table definition must be verified in repo—bundle includes ALTER statements only)

### 1.4 Monetisation & audit
- `featured_placements`
- `payment_audit` (migration: 20251209101000)
- `business_subscription_status` (migration: 20251209101000)
- `webhook_events` is referenced for idempotency in the bundle summary; definition must be verified in repo schema.

### 1.5 Ops / telemetry / overrides
- `search_telemetry` (migration: 20241208020000)
- `latency_metrics` (migration: 20251209093000)
- `ops_overrides` (migration: 20251212114500)
- Tables referenced but not confirmed in bundle migrations: `cron_job_runs`, `error_logs`, `review_decisions`, `ai_evaluation_runs`, etc. Treat as unknown until verified.

## 2. Enums (canonical)
- `region`: Inner City | Northern | Eastern | South Eastern | Western
- `user_role`: trainer | admin
- `verification_status`: pending | verified | rejected | manual_review
- `age_specialty`: puppies_0_6m | adolescent_6_18m | adult_18m_7y | senior_7y_plus | rescue_dogs
- `behavior_issue`: pulling_on_lead | separation_anxiety | excessive_barking | reactivity_aggression | fear_anxiety | toileting_issues | mouthing_nipping_biting | rescue_dog_support | socialisation
- `service_type`: puppy_training | obedience_training | behaviour_consultations | group_classes | private_training
- `resource_type`: trainer | behaviour_consultant | emergency_vet | urgent_care | emergency_shelter

## 3. RPCs / functions (canonical)
From migrations included in the bundle:
- `search_trainers(...)` (accepts optional `p_key` for decrypt)
- `get_trainer_profile(p_business_id, p_key DEFAULT NULL)`
- `public.decrypt_sensitive(...)` (null-safe fix in migrations)
- `public.get_search_latency_stats(...)`

Bundle indicates additional RPCs referenced in code but not located in migrations included; treat as unknown until verified.

## 4. Contract rules
- Code must query **`businesses`** (or RPCs built on it), not a non-existent `trainers` table.
- Writes must use the correct US-spelt identifiers:
  - `trainer_behavior_issues` (not “behaviours”)
  - `service_type` column in `trainer_services`
