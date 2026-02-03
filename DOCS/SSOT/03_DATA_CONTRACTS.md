# Data Contracts — Tables, Enums, RPCs

**Status:** Canonical (Tier-1)  
**Version:** v1.1  

## 1. Canonical tables (implementation-aligned)
This list is aligned to the current implementation (code + migrations), not just the input bundle.

### 1.1 Core geography and identity
- `councils`
- `suburbs`
- `profiles` (linked to `auth.users`)
- `council_contacts`

### 1.2 Listings & reviews
- `businesses` (canonical “listing” entity; no `trainers` table)
- `trainer_services` (service types per business; primary/secondary)
- `trainer_behavior_issues` (behaviour issues per business)
- `trainer_specializations` (age specialties per business)
- `reviews`
- `ai_review_decisions` (moderation metadata)

### 1.3 Verification & ABN
- `abn_verifications`
- `abn_fallback_events`

### 1.4 Emergency & triage
- `emergency_resources`
- `emergency_triage_logs`
- `emergency_triage_feedback`
- `emergency_triage_weekly_metrics`
- `emergency_resource_verification_events`
- `emergency_resource_verification_runs`

### 1.5 Monetisation & featured
- `featured_placements`
- `featured_placement_queue`
- `featured_placement_events`
- `payment_audit`
- `business_subscription_status`
- `webhook_events`

### 1.6 Ops & telemetry
- `search_telemetry`
- `latency_metrics`
- `ops_overrides`
- `daily_ops_digests`
- `cron_job_runs`

### 1.7 Error logging & alerting
- `error_logs`
- `error_alerts`
- `error_alert_events`

### 1.8 Triage instrumentation
- `triage_logs`
- `triage_events`
- `triage_metrics_hourly` (view)

### 1.9 AI evaluation
- `ai_evaluation_runs`

## 2. Enums (canonical)
- `region`: Inner City | Northern | Eastern | South Eastern | Western
- `user_role`: trainer | admin
- `verification_status`: pending | verified | rejected | manual_review
- `age_specialty`: puppies_0_6m | adolescent_6_18m | adult_18m_7y | senior_7y_plus | rescue_dogs
- `behavior_issue`:
  - pulling_on_lead
  - separation_anxiety
  - excessive_barking
  - dog_aggression
  - leash_reactivity
  - jumping_up
  - destructive_behaviour
  - recall_issues
  - anxiety_general
  - resource_guarding
  - mouthing_nipping_biting
  - rescue_dog_support
  - socialisation
- `service_type`: puppy_training | obedience_training | behaviour_consultations | group_classes | private_training
- `resource_type`: trainer | behaviour_consultant | emergency_vet | urgent_care | emergency_shelter

## 3. RPCs / functions (canonical)
- `search_trainers(...)` (accepts optional `p_key` for decrypt)
- `get_trainer_profile(p_business_id, p_key DEFAULT NULL)`
- `public.decrypt_sensitive(...)` (key-aware overload)
- `public.encrypt_sensitive(...)` (key-aware overload)
- `public.get_search_latency_stats(...)`
- `public.calculate_distance(...)`
- `public.search_emergency_resources(...)`
- `public.get_enum_values(...)`
- `public.check_error_rate_alert(...)`
- `public.get_errors_per_hour(...)`

## 4. Contract rules
- Code must query **`businesses`** (or RPCs built on it), not a non-existent `trainers` table.
- Writes must use the correct identifiers:
  - `trainer_behavior_issues` (not “behaviours”)
  - `trainer_services.service_type`
- Emergency verification state is stored on `businesses` for emergency resource listings.
