# Ops Runbook — Post-launch Operations (Reality)

**Status:** Canonical (Tier-1)  
**Version:** v1.5
**Last Updated:** 2026-03-29

## 1. Operating model (canonical)
Ops is **pull-based**:
- Status strip / dashboards show state
- Queues are action surfaces
There is **no support inbox** concept in code.

### 1.1 Automation supervision model
Automation supervision is dashboard-first.

Canonical operator expectations:
- use `/admin/ai-health` as the primary automation supervision surface
- review exceptions, audit trails, and bounded overrides rather than clearing routine AI queues
- keep supervision mobile-friendly and low-noise by default
- rely on off-dashboard escalation only for critical exceptions, blocked review states, or explicit disable events

### 1.2 Verification playbook (canonical)
DTD verification is reusable at the method level, even when the exact routes and risks differ by phase.

The reusable rule is:
- every accepted slice must verify code truth, runtime truth, visible truth, boundary truth, and supervision truth
- phase-specific matrices define which routes, risks, and negative-path checks apply for that slice
- future phases should add a new matrix instead of inventing a new verification method

#### 1.2.1 Core acceptance gates
Every governed slice must pass all of the following before main-control accepts it:

1. Code truth
- `npm run type-check`
- `npm run lint`
- focused automated tests for the touched slice
- `npm run docs:guard` whenever canonical docs, deployment docs, or control docs change

2. Runtime truth
- affected routes or admin surfaces render successfully in the real local app
- expected state transitions and request parameters stay truthful
- no hidden route, param, or mutation drift appears at runtime

3. Visible truth
- the visible copy says the truth about what the feature is doing
- the layout makes the next safe action clear for the intended actor
- key visible states are captured by browser evidence, screenshot evidence, or equivalent rendered proof

4. Boundary truth
- blocked actions stay blocked
- approval boundaries remain explicit
- no silent ranking, verification, moderation, billing, publication, or contact mutation is introduced

5. Supervision truth
- `/admin/ai-health` must match the real workflow ceiling, kill-switch semantics, and advisory-versus-visible behaviour for any touched automation family
- shadow, draft, deterministic visible behaviour, disabled, paused, and controlled-live states must remain distinguishable

#### 1.2.2 Required acceptance evidence
Every accepted slice must produce an evidence packet that includes:
- command evidence for required static verification
- focused route evidence for the affected public or admin surfaces
- at least one explicit negative-path check for the primary risk in that slice
- ai-health or control-plane evidence whenever automation truth, rollout ceiling, or kill-switch semantics are touched
- main-control audit output that either accepts or rejects the slice

Static green checks are necessary but not sufficient. A slice is not accepted only because code compiles or tests pass.

#### 1.2.3 Verification roles
- Implementation lane: writes the bounded slice and its focused tests
- Browser-verification lane or equivalent local runtime check: verifies the affected routes and visible states when the task materially changes user-visible or operator-visible behaviour
- Review lane: checks the produced diff for truthfulness drift, missing tests, and approval-boundary regressions
- Main-control: remains the only acceptance gate and the only authority that syncs SSOT or control-state changes

If coordination overhead or boundary drift becomes worse than the parallelism benefit, revert immediately to tighter single-writer execution while keeping the same acceptance gates.

#### 1.2.4 Phase-specific verification matrices
The following matrices are the current reusable examples for the recent AI automation phases. Future phases should add a new matrix under this section.

### 1.3 Phase 14 verification matrix — Operator Burden Reduction
Goal: prove that the operator-facing weekly loop is clearer without silently mutating protected outcomes.

| Area | Required route or surface | Pass condition |
|---|---|---|
| Exceptions-first admin overview | `/admin` | weekly operator order is obvious and actionable loops are prioritised over passive diagnostics |
| Moderation loop | `/admin/reviews` | reject-ready, approve-ready, shadow, manual, and completed states remain visibly distinct |
| Verification and ABN loop | `/admin` + `/api/admin/queues` | explicit next-safe-action guidance exists without auto-changing verification or ABN state |
| Scaffold review | `/admin` + `/api/admin/scaffolded` | checklist and next-safe-action guidance are visible at decision time |
| Protected operator actions | relevant `/api/admin/**` routes | no moderation, verification, ABN, publication, ranking, billing, or business-owned state auto-mutates |
| Supervision truth | `/admin/ai-health` | bounded, paused, disabled, advisory, draft, and controlled-live states remain truthful |

Phase 14 required negative checks:
- no auto-approve review
- no auto-verify resource
- no auto-approve ABN
- no hidden publication, ranking, or billing side effect

### 1.4 Phase 15 verification matrix — Owner Low-Touch Guidance
Goal: prove that owner guidance is clearer without changing deterministic route truth, ranking, emergency escalation, or contact behaviour.

| Area | Required route or surface | Pass condition |
|---|---|---|
| Triage handoff clarity | `/triage` | owner can tell what happens next before leaving triage |
| Search explanation | `/search` | shortlist meaning is clearer without overstating what triage or AI currently controls |
| Trainer-fit explanation | `/trainers/[id]` | fit and gap guidance uses deterministic visible context only |
| Search restoration truth | `/search` and `/trainers/[id]` | returning from profile to search preserves truthful shortlist context |
| Emergency safety | `/triage`, `/emergency`, `/search` | no wording or behaviour weakens the urgent-first path |
| Supervision truth | `/admin/ai-health` | visible behaviour is not misrepresented as live owner AI |

Phase 15 required negative checks:
- no ranking change
- no hidden search rewrite
- no automatic contact or send
- no emergency downgrade
- no fake claim that AI made the owner decision for them

### 1.5 Phase 16 verification matrix — Confirmed Owner Action Automation
Goal: prove that owner-action assistance is explicit, confirm-before-apply or confirm-before-send, and truthfully supervised.

| Area | Required route or surface | Pass condition |
|---|---|---|
| Refinement suggestions | `/search` | every suggestion explains what changes and only applies after explicit owner action |
| Shortlist comparison guidance | `/search` | next-best-action guidance stays bounded and does not alter ranking |
| Enquiry draft assistance | `/trainers/[id]` | draft or question-builder support remains insert-only and does not send automatically |
| Owner-action substrate | `/admin/ai-health`, automation substrate, deployment docs | dedicated owner-action ceiling and override exist without implying current live owner automation |
| Rollback and kill-switch truth | `/admin/ai-health` | owner-action disable path and ceiling are explicit and non-misleading |
| Protected owner behaviour | `/search`, `/trainers/[id]` | no hidden search rewrite, no hidden ranking change, no send-like action without owner confirmation |

Phase 16 required negative checks:
- no automatic apply without confirmation
- no automatic send
- no ranking rewrite
- no hidden search-param mutation
- no implication that current owner-visible helpers are proof of live owner-action AI

### 1.6 Future-phase rule
When a new phase opens:
- reuse the core acceptance gates and evidence rules above
- add one new phase matrix under this section
- do not lower the acceptance bar just because the routes or actor class change

### 1.7 Agent workflow policy (canonical)
DTD should use multi-agent execution only when it improves delivery without weakening truthfulness or control.

#### 1.7.1 Control authority
- Main-control remains the only authority that may:
  - open or close a governed task
  - accept or reject a produced slice
  - sync `DOCS/SSOT/**`
  - sync `_generated/CONTROL_*` state
  - declare a phase complete
- Implementation, review, and exploration lanes do not decide roadmap state or acceptance.

#### 1.7.2 Default lane roles
- Implementation lane:
  - writes the active slice
  - owns the bounded file set for that slice
  - returns verification output, risks, and boundary notes
- Browser-verification lane:
  - checks the real local route behaviour for materially visible changes
  - captures the key visible states or equivalent evidence
- Review lane:
  - audits the produced diff for truthfulness drift, approval-boundary regressions, and missing tests
- Explorer lane:
  - may prepare candidate future task scope, risks, or file sets
  - remains read-only and candidate-only

#### 1.7.3 Default execution model
Unless a tighter or looser mode is explicitly justified, the canonical execution flow is:
1. main-control opens one active task
2. one implementation lane executes that task
3. one review lane audits the produced diff
4. one browser-verification lane checks the affected routes when the slice materially changes visible behaviour
5. main-control accepts or rejects
6. only after acceptance may SSOT and control-state sync occur

This is the default because it keeps responsibility clear and avoids speculative parallel writes on overlapping surfaces.

#### 1.7.4 Parallelism rules
Parallelism is allowed only when the write scopes are genuinely disjoint or when the extra lane is read-only.

Allowed:
- one implementation lane plus one review lane
- one implementation lane plus one browser-verification lane
- one implementation lane plus one or more read-only explorers for future-task prep
- multiple write-capable lanes only when main-control can defend a truly disjoint file scope and independent acceptance path

Not allowed:
- two write-capable lanes editing the same route family or shared helper set without an explicit main-control exception
- review or explorer lanes editing SSOT or control docs
- speculative roadmap advancement by implementation lanes
- acceptance or control-state sync before main-control audit

#### 1.7.5 Start gates
Before a lane begins work:
- confirm the expected branch and current HEAD when that matters for the slice
- inspect `git status --short --branch`
- stop if the worktree contains overlapping dirty files in the active task scope
- unrelated local-only dirt may be allowed only when main-control says so explicitly and the overlap risk is nil

#### 1.7.6 Reversion rule
If any of the following happens, main-control must revert immediately to tighter single-writer execution for the remainder of the active governed slice:
- implementation lanes push or sync control state before main-control acceptance
- two lanes collide on overlapping write scope
- reviewer findings show truthfulness drift or boundary-breaking output
- coordination overhead becomes higher than the speed gained from parallelism
- the produced evidence packet is incomplete or unreliable

#### 1.7.7 Acceptance rule
- main-control must review every completed slice against the verification playbook above
- findings come first when the slice is not acceptable
- no slice is accepted because a worker declared success
- only accepted work may be committed as canonical SSOT or control truth

## 2. Admin surfaces (canonical)
- `/admin` — overview
- `/admin/ai-health` — AI mode, rollout state, health visibility, and supervised automation readiness
- `/admin/cron-health` — cron monitoring
- `/admin/errors` — error monitoring
- `/admin/reviews` — moderation queues
- `/admin/triage` — triage monitoring

### 2.1 Weekly verification and ABN loop
- The canonical weekly exception pass for verification and ABN-support work now starts on `/admin`.
- Verification exceptions and ABN manual reviews should be worked from one bounded operator loop rather than separate ad hoc checks across the queue, fallback telemetry, and verification traces.
- The loop may surface deterministic next-safe-action guidance and recent fallback context, but final ABN approval or rejection and any verification-state change still require the explicit operator action.
- A degraded or missing guidance trace must not block the queue from loading; operators should still be able to clear the available exception items.

### 2.2 Scaffold-review guidance at decision time
- The scaffolded listing queue on `/admin` may surface the existing shadow-only scaffold-review guidance candidate directly on each operator decision card.
- The operator should use that checklist and next-safe-action guidance to clear the weekly scaffold-review pass with lower switching cost.
- The guidance remains assistive only:
  - approval and rejection still happen only through the explicit scaffold-review operator action
  - the surfaced guidance does not by itself change publication, verification, featured/spotlight, billing, or ranking state
- If the shadow guidance trace is missing or degraded, the scaffold queue must still load and remain actionable through the deterministic operator path.

## 3. Key admin API capabilities (examples)
- Moderation run loop: `/api/admin/moderation/run` (cron daily at 01:00 AEST/AEDT on the current Vercel Hobby-compatible schedule)
- Ops digest: `/api/admin/ops-digest` (daily)
- Monetisation resync/overview: `/api/admin/monetization/*`
- DLQ replay: `/api/admin/dlq/replay`

### 3.1 Ops digest evidence collection
- The canonical review-evidence path for `ops_digest` is the persisted `daily_ops_digests` table.
- Reviewable shadow evidence is collected by:
  - the scheduled `/api/admin/ops-digest` run, or
  - a manual forced `POST /api/admin/ops-digest?force=true`
- A digest run only counts toward controlled-live review when it is persisted in `daily_ops_digests` with `ai_mode='shadow'`.
- The evidence threshold is `7` distinct reviewable shadow runs, not `7` calendar days.
- Multiple qualifying `ops_digest` runs may share the same `digest_date` when they are forced review runs, but each counted run must be separately persisted and reconstructable by row `id` and `created_at`.
- A cached re-read of an existing digest row does not count as a new reviewable run.
- Local-only or non-persisted fallback digests do not count toward the seven-run shadow evidence window.
- If the service-role-backed persistence path is unavailable, the operator surface must say so explicitly rather than presenting the digest as reviewable evidence.
- For the current bounded `ops_digest` live cycle, a reviewed pause may later resume to `controlled_live` only through the canonical rollout-control mutation path after a separate approval decision. Operators must not treat `paused_after_review` as an informal toggle back to live.

## 4. Known gaps / risks (from bundle)
- **Resolved:** Admin auth enforcement is now consistent across `/admin/**` and `/api/admin/**` (see `10_SECURITY_AND_PRIVACY.md`).
- No background worker framework is present; cron + request-driven work are primary.

## 5. Verification harnesses
- `scripts/verify_launch.ts` — launch gate checks
- `scripts/verify_phase9b.ts` — monetisation + build/test harness

## 6. Alerts
Env-driven alerts exist for email/Slack/webhook (see `ENV_VARS_INVENTORY.md` and `OPS_REALITY.md`).

Canonical alert posture:
- dashboard state is the default source of automation truth
- alerts should remain low-noise and critical-only
- alerts are appropriate for critical exceptions, repeated disable-worthy failures, or blocked operator review states
- non-critical shadow review and readiness signals should remain on-dashboard

## 7. Environment + connections (canonical)
- Remote-first: use a Supabase dev/staging project for daily development and ops testing.
- `.env.local` is required (copy from `.env.example`) and must never be committed.
- For ops scripts, prefer the **session pooler** connection string for `SUPABASE_CONNECTION_STRING` (avoids IPv6-only direct hosts).
- `config/env_required.json` is the definitive list of required environment variables.

## 8. Schema + migrations (canonical)
- **Source of truth:** `supabase/migrations/` (lexical order).
- `supabase/schema.sql` is a **derived snapshot**; refresh with `npm run schema:refresh`.
- Remote apply helper (ops-only): `scripts/try_remote_apply.sh` (prefer CI or Supabase dashboard).
- Data import validator: `npm run validate-import` (checks `supabase/schema.sql` and `supabase/data-import.sql`).
- Suburb/council source data lives in `data/suburbs_councils_mapping.csv` (regenerate from SQL via `npm run data:refresh`).

### 8.1 Database alignment policy for AI agents (canonical)
When an AI agent handles database-related work, the default objective is:
- **schema parity**
- **controlled verification-fixture parity**

It is **not** full bidirectional local/remote data sync.

Canonical database-handling rules:
- Remote dev/staging is the operational source of truth for daily development and verification.
- `supabase/migrations/` remains the schema source of truth.
- `supabase/schema.sql` remains a derived snapshot used to bootstrap or rebuild disposable local databases.
- Local databases are disposable rebuild targets, not long-lived sources of operational truth.
- AI agents must not perform broad local-to-remote or remote-to-local data mirroring unless an operator explicitly requests it.
- AI agents must not replay large imports or broad seed files into hosted environments unless that write scope is explicitly approved.

Tables and records that must **not** be treated as routine sync targets include:
- automation/control-plane tables
- moderation recommendations and AI review traces
- digest evidence rows
- telemetry, latency, alert, and error logs
- emergency triage logs
- webhook, billing, and monetisation event history
- arbitrary live business or user content outside the controlled verification fixture set

### 8.2 Required clean sequence for DB work
When database parity is needed for engineering or verification, the clean order is:
1. apply explicit migrations to the remote dev/staging database
2. refresh `supabase/schema.sql` from the remote database
3. rebuild the local database from the refreshed schema snapshot
4. apply only the narrow controlled fixture set required for verification
5. verify routes, RPCs, and browser flows against that rebuilt baseline

Do **not** invert that order by treating a local database as the authority for hosted environments.

### 8.3 Encryption and fixture portability
Encrypted contact and other protected fields depend on `SUPABASE_PGCRYPTO_KEY`.

Therefore:
- ciphertext is environment-bound unless the same key is intentionally shared
- AI agents must not assume encrypted fixture values are portable across local and hosted environments
- if controlled verification fixtures need to exist in multiple environments, they must be encrypted or re-encrypted using the target environment's active key
- a decryption failure such as `Wrong key or corrupt data` should be treated as an environment/key or fixture-state mismatch first, not as automatic proof of an application regression

## 9. Local DB helpers (optional)
- `npm run db:start` — start local Postgres and apply migrations.
- `npm run db:seed` — apply seed data only.
- `npm run dev:local` — start local DB + Next dev server.
- Scripts: `scripts/local_db_start_apply.sh`, `scripts/local_db_stop.sh`, `scripts/local_db_verify.sh`, `scripts/test_apply_migrations.sh`.
- Local containers are aligned to **Postgres 17** to match Supabase.

## 10. ABN / ABR operations
- Controlled batch runner: `scripts/abn_controlled_batch.py` (dry-run by default; use `--apply` with `AUTO_APPLY=true`).
- Re-check job: `scripts/abn_recheck.py` (scheduled).
- Allowlist generation: `scripts/generate_allowlist.py` reads `data/abn_allowlist.{staging,prod}.csv` and writes `scripts/controlled_abn_list.*.json` (git-ignored).
- Required envs for writes: `ABR_GUID`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_CONNECTION_STRING`.
- Raw ABR matches are persisted in `abn_verifications.matched_json` for auditability.

## 11. Verification + health harnesses
- Launch gate: `scripts/verify_launch.ts`
- Phase 9B verifier: `scripts/verify_phase9b.ts`
- Smoke checks: `scripts/smoke_checks.sh`
- Tests: `npm test` (see `tests/smoke/*` for ops coverage)

## 12. AI evaluation harness
- Offline evaluation: `scripts/evaluate_ai.ts` (reads golden sets, prints metrics).
- Optional DB persistence when service role key is present.

## 13. Concierge seeding and scraping (canonical MVP launch model)

### 13.1 Operating posture
- The MVP launch inventory uses a **hybrid concierge pipeline**:
  - manual lead sourcing
  - automated scrape and normalization
  - manual review of the pre-publish seed artifact
  - automated relational publish into the canonical listing model
- AI agents and scripts must not decide **who** should be listed.
- Blind web acquisition is not allowed for MVP launch inventory.
- Every candidate listing must originate from a human-approved source URL.

### 13.2 Manual stages
The only required manual steps for MVP concierge seeding are:
- lead sourcing
- review of the seed or publish-ready CSV before publish

Humans should not manually format descriptions, assemble relational inserts, or hand-build publish payloads unless the automated path is blocked.

#### 13.2.1 Canonical manual seed contract
The canonical manual seed queue for MVP concierge sourcing is a CSV with these columns:
- `source_url` (required)
- `business_name_hint` (required)
- `suburb_hint` (required)
- `service_hint` (optional)
- `notes` (optional)

Rules:
- one business candidate per row
- `source_url` must be the approved public source URL for that business
- `business_name_hint` is a human-supplied fallback for weak or ambiguous source titles
- `suburb_hint` must be one of the currently approved MVP catchment suburbs
- optional hint columns are routing aids for the automated pipeline only; they are not canonical publish truth by themselves

### 13.3 Automated stages
Once a source URL is approved by a human, the pipeline may automate:
- page fetch and extraction
- structured candidate-field extraction from the public source
- canonical suburb resolution to `suburb_id`
- taxonomy mapping to `trainer_specializations`, `trainer_services`, and `trainer_behavior_issues`
- duplicate and conflict checks
- publish-ready artifact generation
- relational import generation
- scaffolded publish
- later claim handover support

### 13.4 Canonical guardrails
- No AI sourcing: automation may process only human-approved URLs.
- No blind scraping: broad open-web acquisition is out of scope for MVP launch inventory.
- No publish without canonical geography: a listing must resolve to a valid `suburb_id` before publish.
- No publish of `resource_type='trainer'` without at least one specialization row; this must remain aligned to the schema trigger.
- No listing may be presented as owner-verified or business-managed unless the real ownership and verification path has occurred.
- Concierge-seeded MVP listings may be publicly visible while still being scaffolded and unclaimed, but that state must stay truthful.

### 13.5 Launch inventory requirements
The launch objective is to avoid a ghost-town directory while keeping the source path reviewable and truthful.

The concierge pipeline must therefore produce inventory that is:
- sourced from real businesses, not placeholders
- geographically valid under the canonical suburb/council model
- sufficiently complete to feel like a real directory result
- reviewable before publish
- reproducible through a bounded import path

At minimum, a publish-ready trainer listing must have:
- business name
- source URL
- resolved `suburb_id`
- `resource_type`
- at least one specialization
- a truthful contact path or clearly bounded fallback

### 13.6 Review artifact requirements
The manual pre-publish review artifact must expose enough signal to catch bad automation output before publish.

It must show, at minimum:
- source URL
- human business-name hint
- extracted business name
- extracted contact fields if present
- resolved suburb and any locality warning
- resolved `suburb_id`
- resolved council
- mapped specialization, service, and behaviour-issue tags
- duplicate or conflict warnings
- publish-readiness or missing-field warnings

### 13.7 Legacy phase2 pipeline status
- `data/phase2_scraper_targets.csv`
- `scripts/run_phase2_scraper.py`
- `supabase/phase2_scraped.json`
- `scripts/apply_phase2_scaffolded.py`
- `supabase/phase2_scaffolded.sql`
- `scripts/scrape_qa_runner_stub.py`

These artifacts are legacy placeholder or demo scaffolding only.
They are not the canonical MVP launch pipeline for real trainer inventory and must not be treated as sufficient launch-gate evidence on their own.

## 14. Commercial Funnel Baseline (2026-03-01)
- Baseline type: controlled engineering sample, not organic production traffic.
- Environment: local Next.js dev server against the live-backed Supabase project `xqytwtmdilipxnjetvoe`.
- Sample path exercised, in order:
  - `POST /api/emergency/triage`
  - `GET /api/public/search?q=anxious&limit=1&flow_source=triage`
  - `GET /trainers/999999?flow_source=triage`
  - `GET /promote`
  - `POST /api/stripe/create-checkout-session` with an empty JSON body

### 14.1 Funnel stage baseline (24h window)
| Stage | Count | Avg ms | P95 ms | Success rate | Last seen (UTC) |
|---|---:|---:|---:|---:|---|
| `triage_submit` | 1 | 4155 | 4155 | 0.00 | `2026-03-01T14:24:44Z` |
| `search_results` | 1 | 520 | 520 | 0.00 | `2026-03-01T14:24:45Z` |
| `trainer_profile_view` | 1 | 368 | 368 | 0.00 | `2026-03-01T14:24:46Z` |
| `promote_page_view` | 1 | 0 | 0 | 0.00 | `2026-03-01T14:24:46Z` |
| `promote_checkout_session` | 1 | 283 | 283 | 0.00 | `2026-03-01T14:24:47Z` |

### 14.2 Supporting latency baseline (24h window)
| Area | Count | Avg ms | P95 ms | Success rate |
|---|---:|---:|---:|---:|
| `commercial_funnel` | 5 | 1065 | 4155 | 0.00 |
| `emergency_triage_api` | 1 | 3976 | 3976 | 0.00 |
| `search_suburbs` | 1 | 197 | 197 | 0.00 |
| `trainer_profile_page` | 1 | 209 | 209 | 0.00 |

### 14.3 Search responsiveness baseline (24h window)
- `search_telemetry` samples: `1`
- Average latency: `197 ms`
- Max latency: `197 ms`
- Success rate: `0.00`

### 14.4 Observed friction points from the first baseline pass
- `POST /api/emergency/triage` returned `500` with: `null value in column "description" of relation "emergency_triage_logs" violates not-null constraint`.
- `GET /api/public/search` returned `500` because the live API surface could not find `public.search_trainers(...)`.
- The live database also does not currently expose `public.get_trainer_profile(...)`, so trainer profile requests fall back instead of using the intended RPC path.
- `GET /promote` rendered successfully, but the controlled sample had no business context, so this is only a page-render baseline, not a commercial conversion baseline.
- `POST /api/stripe/create-checkout-session` returned `400` in the controlled sample because the request intentionally omitted `businessId`; this confirms instrumentation on invalid checkout attempts, not a successful payment path.

### 14.5 Operational interpretation
- The telemetry write path is working and the new `commercial_funnel` instrumentation is live.
- This baseline is useful as an engineering reference point only; it is not representative of real user demand or conversion.
- Market optimization can proceed, but this baseline should still be treated as controlled engineering traffic rather than organic demand.

### 14.6 Controlled live verification dataset (PH-205 + MO-307)
- The live project now uses a controlled demo baseline for directory verification and comparison depth.
- Current controlled records:
  - `business_id = 1` `DTD Verification Trainer PH205` (`Collingwood`, `City of Yarra`)
  - `business_id = 2` `DTD Demo Trainer Carlton Foundation` (`Carlton`, `City of Melbourne`)
  - `business_id = 3` `DTD Demo Trainer South Melbourne Reactive` (`South Melbourne`, `City of Port Phillip`)
  - `business_id = 4` `DTD Demo Trainer Fitzroy Social` (`Fitzroy`, `City of Yarra`)
- The controlled inventory now supports:
  - `4` active searchable listings total
  - `3` suburbs
  - `3` councils
  - multiple service types and non-homogeneous fit combinations
- Deterministic live verification query:
  - `GET /api/public/search?q=DTD%20Demo&limit=10`
  - expected result set: business IDs `2`, `4`, `3`
- These records are for controlled environment verification and product comparison only; they are not production-vetted customer businesses.
- Reproducibility path:
  - reuse `data/suburbs_councils_mapping.csv` for suburb/council linkage
  - apply a controlled `psql` transaction for the minimal additive business + trainer relation rows
  - preserve the `PH-205` verification fixture unless a later controlled import explicitly replaces it
  - avoid broad seed imports unless explicitly intended
