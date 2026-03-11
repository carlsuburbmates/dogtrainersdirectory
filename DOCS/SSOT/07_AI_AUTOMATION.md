# AI Automation - Programme Scope, Modes, Boundaries

**Status:** Canonical (Tier-1)
**Version:** v2.2
**Last Updated:** 2026-03-11

## 1. Purpose
This document defines the canonical AI Automation programme for DTD.

It exists to stop "AI automation" from meaning only today's operator-side pipelines or becoming a catch-all label for unrelated experiments.

For DTD, AI Automation is the governed use of AI-assisted workflow steps across three actor groups:
- dog owners using triage, emergency, search, and trainer-selection journeys
- businesses using onboarding, listing-quality, and promotion-support journeys
- admins/operators using moderation, verification, monitoring, and digest workflows

This document defines scope, classes, safety rules, approval boundaries, mode handling, and audit requirements before any new implementation lane starts.

It does not mean every workflow family below is already live in production. A workflow is only live when its route, API, data, deployment, and security contracts are implemented and reflected in SSOT.

DTD's operating north star for this programme is:
- mostly self-running post-launch operation
- weekly exception review instead of daily queue babysitting
- deterministic-first automation with bounded AI where judgement adds value
- dashboard-first, mobile-friendly, low-noise supervision with critical escalation only when the dashboard model is not enough

## 2. Programme Scope By Actor
### 2.1 Dog owner workflows
Owner-facing automation is in scope when it helps a dog owner decide what to do next inside the existing DTD journey:
- emergency and behaviour triage guidance on `/triage` and `/emergency`
- triage-to-search handoff support, including issue framing and suggested next-step context
- search and trainer-profile interpretation support, where DTD explains fit, gaps, or next-step considerations
- optional draft assistance for owner-written requests or enquiries, if a future route supports it

Owner-facing automation must remain subordinate to DTD's existing safety-first public journey:
- urgent flows still prioritise `/emergency` resources and explicit escalation paths
- deterministic route, filter, and search behaviour remains canonical
- owner automation must not silently change search intent, submit contact requests, or mask emergency risk

### 2.2 Business workflows
Business-facing automation is in scope when it helps a trainer business complete or improve an existing DTD business workflow:
- onboarding completion guidance on `/onboarding`
- listing-quality, clarity, and missing-information guidance for business profiles
- explanation of how a listing fits DTD discovery expectations and trust signals
- promotion-support guidance on `/promote`, limited to explanation and draft assistance

Business-facing listing-quality guidance is only in scope when it is attached to a genuine business-owned workflow path.

The canonical post-onboarding surface for that work is the authenticated `/account/business/**` business profile-management family. Its first truthful slice is now implemented for business-owned profile maintenance and shadow-only listing-quality guidance, not operator review or monetisation handling.

Current canonical examples are:
- the implemented `/account/business` and `/account/business/[businessId]` business profile-management surface

`/onboarding` remains reserved for onboarding completion guidance and listing entry. It is not the canonical post-onboarding listing-quality surface.

Non-example:
- an operator queue or scaffold-review route under `/admin/**` or `/api/admin/**` is not a business-facing workflow, even when the record being reviewed belongs to a business

Business-facing automation must not autonomously:
- publish or materially edit a public listing
- start checkout or charge a payment method
- change featured, spotlight, or other monetisation state
- claim verification status or business credentials without the canonical verification path

### 2.3 Admin/operator workflows
Operator-facing automation is in scope when it helps an authorised operator run the platform within the existing `/admin` and `/api/admin/**` boundary:
- review moderation support
- business verification and ABN-support workflows
- scaffolded listing review guidance for operator queues
- triage monitoring summaries and anomaly surfacing
- ops digest generation and AI-health visibility
- queue and exception prioritisation support for operator review

Operator-facing automation may assist operators, but it does not dissolve the admin boundary, admin auth requirements, or human accountability for externally visible actions.

## 3. Automation Classes
### 3.1 Advisory automation
Advisory automation is read-only.

It may:
- classify, summarise, explain, rank considerations, or recommend next steps
- generate non-binding guidance visible to the current actor
- produce shadow-only outputs for evaluation

It must not:
- write canonical product state
- trigger outbound communication
- change billing, publication, verification, review status, or featured placement

DTD examples:
- emergency triage guidance shown to an owner
- a search-fit explanation that helps an owner understand why a trainer may or may not fit
- an operator digest summary

### 3.2 Assistive automation
Assistive automation prepares a draft, suggestion, or structured recommendation for a human to accept, reject, or edit.

It may:
- draft operator notes or recommendation text
- prefill unsaved workflow state
- suggest missing onboarding information
- propose a moderation or verification recommendation for review

It must not commit the final externally meaningful action without explicit approval from the relevant actor.

DTD examples:
- draft onboarding guidance for a business before submit
- a moderation recommendation shown to an operator for accept/reject action
- a verification checklist suggestion for operator review

### 3.3 Write-capable automation
Write-capable automation may write bounded internal records only when all of the following are true:
- the workflow is explicitly defined in SSOT
- the write path is defined in the current data and API contracts
- the effective mode allows writes
- the approval boundary for that workflow has been satisfied
- the write is auditable, idempotent where required, and reversible or supersedable

Write-capable automation is allowed for DTD only when the write is part of a governed workflow such as:
- storing an AI-generated draft, trace, or recommendation for later human review
- persisting bounded internal workflow metadata that does not itself publish or charge
- recording a final AI-assisted action only after the required human approval step

Write-capable automation is not blanket permission for autonomous product changes.

### 3.4 Autonomous actions that are not allowed
The following are out of bounds for the DTD AI Automation programme unless Tier-0/Tier-1 SSOT is explicitly changed first:
- automatically contacting dog owners, trainers, or leads
- automatically publishing, hiding, or materially editing public listings or reviews
- automatically granting verification status, ABN trust status, or admin access
- automatically starting checkout, changing billing state, or altering featured or spotlight placement
- automatically changing search ranking or discovery visibility in a way the current actor did not explicitly request
- automatically bypassing `/admin` auth, operator review, or kill-switch controls
- automatically taking actions outside the current documented DTD route and API model

## 4. Safety And Approval Boundaries
AI Automation in DTD must preserve existing product and security boundaries.

Core rules:
- Public, business, and operator automations stay inside their existing route and auth domains.
- AI availability is not authorisation. A valid key or healthy model does not permit an action by itself.
- When AI is disabled, degraded, or unavailable, the workflow must fall back to the normal deterministic DTD path rather than leaving a dead end.
- Any workflow that can affect emergency guidance, public trust signals, monetisation state, or moderation outcomes must have an explicit human approval boundary.

Approval boundaries by actor:
- Dog owner workflows: any send, submit, save, or search-changing action derived from AI requires explicit owner confirmation.
- Business workflows: any public-profile change, evidence submission, featured-placement change, or payment initiation requires explicit business confirmation.
- Admin/operator workflows: any approve/reject, verification-state, publication-state, or other externally visible platform action requires operator approval unless SSOT later defines a narrower exception.

Safety requirements for write-capable workflows:
- the workflow must have a documented rollback or disable path before it can be live
- the workflow must surface its effective mode and failure state to operators
- the workflow must keep a trace that explains what was proposed, what was approved, and what was executed

DTD-specific emergency rule:
- owner-facing AI must not weaken the urgent-first behaviour of `/emergency`
- generated guidance may support the journey, but it must not replace the canonical emergency resource and escalation path

## 5. Mode Model
### 5.1 Global mode
`AI_GLOBAL_MODE` is the default mode for the AI Automation programme.

Canonical values:
- `disabled`
- `shadow`
- `live`

### 5.2 Per-workflow overrides
Per-workflow overrides take precedence over `AI_GLOBAL_MODE`.

Current canonical overrides already present in deployment SSOT:
- `TRIAGE_AI_MODE`
- `MODERATION_AI_MODE`
- `DIGEST_AI_MODE`
- `VERIFICATION_AI_MODE`

For any future owner-facing or business-facing workflow family, a dedicated override must be added to deployment SSOT before that workflow can be live. Until that happens, the workflow must remain bounded below `live` by its implemented ceiling and must not be treated as live-capable.

### 5.3 Mode meanings
`disabled`
- no AI-generated workflow output may affect user-visible or operator-visible behaviour
- the product must use the non-AI path
- no AI-driven write side effects are allowed, except explicit operational logs that record the disabled state

`shadow`
- the workflow may run for evaluation, comparison, or audit capture
- shadow outputs must not change public ranking, review outcomes, verification outcomes, featured or spotlight state, payment state, or outbound communications
- shadow writes, if any, are limited to audit or evaluation storage and must not become the final business record

`live`
- the workflow may produce actor-visible output or bounded internal writes, but only within its approved automation class and approval boundary
- live mode does not remove human approval requirements
- live mode does not override auth, route, or kill-switch boundaries

### 5.4 Rollout states
Mode alone is not the full rollout truth.

DTD canon distinguishes the runtime effective mode from the workflow rollout state.

Canonical rollout states:
- `disabled`
  - the workflow is intentionally off and must follow the deterministic non-AI path
- `shadow`
  - the workflow is currently running in evaluation mode only
- `shadow_only`
  - the workflow is capped below `live` by canonical boundary and must not be treated as live-capable
- `shadow_live_ready`
  - the workflow is canonically allowed to move toward controlled live use, but is still shadowed pending review approval
- `controlled_live`
  - the workflow is approved for bounded live use within its documented class, approval boundary, and rollback path
- `paused_after_review`
  - the workflow was previously eligible for or using controlled live operation, but has been paused after operator or governance review

Interpretation rules:
- a workflow may only be `controlled_live` when its effective mode is `live`
- a workflow with effective mode `shadow` may still be `shadow_live_ready` if canon permits eventual live use and the evidence threshold is met
- a workflow with a canonical class ceiling or actor boundary that forbids live operation must be represented as `shadow_only`
- `paused_after_review` is a canonical supervision state, not a synonym for environment drift; the workflow should then run with effective mode `disabled` unless a narrower documented fallback is explicitly allowed

### 5.5 Supervised rollout requirements
DTD must not treat shadow traces as sufficient proof of safe live operation without explicit supervised review.

Before a workflow can move from `shadow` or `shadow_live_ready` toward `controlled_live`, all of the following must be true:
- the workflow is not capped as `shadow_only` by canonical boundary
- the workflow already exposes truthful audit and failure visibility on the operator supervision surface
- a named review owner has examined the recent shadow evidence
- a named approver has accepted the controlled-live move under the current boundary rules
- rollback and disable steps are documented in the runbook before enablement

Minimum evidence threshold:
- request-driven workflows require at least `25` recent shadow traces spanning ordinary cases plus degraded or fallback conditions
- scheduled or low-frequency workflows require at least `7` consecutive shadow runs with no unresolved critical failure
- the evidence window must include recent disagreement, failure, and fallback review rather than only successful samples

Mandatory review contents:
- effective mode and visible deterministic path during the evidence window
- whether the workflow is `shadow_only` or `shadow_live_ready`
- recent error, fallback, and disagreement signals
- confirmation that actor-visible or externally meaningful outcomes did not exceed the current automation class
- confirmation that kill switches, rollback, and audit paths were exercised or explicitly re-checked

Mandatory rollback or pause triggers:
- any breach of the documented approval boundary
- any actor-visible outcome that exceeds the workflow's canonical class or route/auth boundary
- any incorrect externally meaningful outcome involving billing, publication, verification, moderation, ranking, or emergency handling
- repeated or unresolved critical live-path errors
- operator review concludes the output is unsafe, misleading, or no longer trustworthy

### 5.6 Kill switches
DTD requires two kill-switch layers:
- programme-wide kill switch: set `AI_GLOBAL_MODE=disabled`
- workflow-specific kill switch: set the relevant workflow override to `disabled`

Operational requirements:
- every live workflow family must expose its effective mode on `/admin/ai-health` or the current equivalent operator visibility surface
- operators must be able to disable a live workflow without editing application logic
- repeated failures, poor output quality, or unsafe behaviour must be handled by disabling the workflow first, then investigating

## 6. Dashboard-First Supervision Model
DTD supervision is dashboard-first.

The canonical operator role is:
- exception review
- audit review
- bounded override
- kill-switch and rollback action when required

It is not routine queue clearing for every normal-case automation step.

Supervision requirements:
- the primary supervision surface is `/admin/ai-health` until a canonically defined replacement exists
- the surface must remain mobile-friendly and readable in a quick operator pass
- dashboard state is the default source of truth; email, Slack, or webhook alerts are for critical exceptions only
- non-critical automation review should stay on-dashboard and low-noise by default

Per workflow family, the supervision surface must show:
- effective mode
- rollout state
- whether the workflow is capped as `shadow_only`
- whether the workflow is live-capable but currently shadowed
- last review timestamp or explicit `not reviewed yet` state
- whether minimum shadow evidence is satisfied
- meaningful error, fallback, degradation, and disagreement signals
- rollback and disable guidance appropriate to that workflow family

Truthfulness rule:
- shadow traces must be labelled as shadow traces
- actor-visible live outcomes must be distinguishable from shadow candidates
- a workflow must not be described as live-ready when canon still caps it below `live`

## 7. Workflow Families
These families define the intended DTD programme surface. They are not all live today.

| Workflow family | Primary actor | Class ceiling | Current programme status | Canonical boundary |
|---|---|---|---|---|
| Emergency and behaviour triage guidance | Dog owner | advisory -> assistive | partially implemented family | must preserve `/emergency` escalation and owner confirmation |
| Triage-to-search handoff guidance | Dog owner | advisory | defined for rollout | may explain or suggest, but must not silently rewrite search intent |
| Search and trainer-fit explanation | Dog owner | advisory | defined for rollout | cannot change ranking or contact a trainer |
| Onboarding completion guidance | Business | assistive | defined for rollout | no auto-submit or public publish |
| Listing-quality and trust-signal guidance | Business | assistive | partially implemented family | must bind to the authenticated `/account/business/**` business profile-management surface, currently through the deterministic business-owned profile save path with shadow-only audit traces; not `/onboarding`, `/promote`, or `/admin/**` |
| Promotion-support guidance | Business | advisory | defined for rollout | no checkout initiation or featured/spotlight state change |
| Scaffolded listing review guidance | Admin/operator | assistive | defined for rollout | limited to operator queue workflows under `/admin/**` and `/api/admin/**`; does not become business-facing because the subject record is a business listing |
| Review moderation support | Admin/operator | assistive -> write-capable internal draft only | partially implemented family | final moderation action remains operator-approved |
| Verification and ABN-support assistance | Admin/operator | assistive -> write-capable internal draft only | partially implemented family | final verification state remains operator-approved |
| Ops digests and AI-health summaries | Admin/operator | advisory -> write-capable internal draft only | partially implemented family | no autonomous incident response or external comms; first candidate for future controlled live evaluation once supervised rollout controls exist |

## 8. Observability And Audit Trail Requirements
Every AI Automation workflow must be traceable enough for DTD operators to answer:
- what ran
- for which actor and record
- in which mode
- using which model or rule path
- what it produced
- whether a human approved it
- what was finally written or not written

Minimum audit envelope for every workflow family:
- timestamp
- workflow family and workflow instance ID
- actor class and actor identifier when available
- initiating surface or job source (`/triage`, `/onboarding`, `/admin/reviews`, cron job, and so on)
- effective mode (`disabled`, `shadow`, `live`)
- model/provider/version or explicit non-model fallback marker
- input summary, content hash, or other trace handle appropriate to the privacy level
- output summary or classification result
- approval state and approving actor where applicable
- resulting record IDs, queue IDs, or no-write outcome
- error state, retry state, and disable decision when relevant

Audit requirements:
- assistive and write-capable workflows require a human-review trace for the final externally meaningful action
- shadow runs must be reconstructable later and must be distinguishable from live outcomes
- operators must be able to identify which AI-generated output influenced a moderation, verification, triage, or digest decision
- write-capable workflows must define how to disable, supersede, or roll back their outputs before live rollout

Privacy requirements:
- sensitive contact data and other protected fields remain subject to `10_SECURITY_AND_PRIVACY.md`
- audit storage must avoid unnecessary plaintext retention of sensitive fields
- server-side decryption rules still apply; AI convenience is not a reason to widen exposure

Current-state constraint:
- current AI health and telemetry surfaces are not, by themselves, a complete programme-wide audit trail
- any future write-capable workflow must update the canonical data and API contract SSOT before rollout if new audit storage or endpoints are required

## 9. First Controlled-Live Candidate Policy
The first workflow family that may be considered for controlled live use is `ops_digest`.

Reason:
- it is operator-facing rather than public or business-facing
- it is advisory and bounded
- it has lower blast radius than triage, moderation, verification, or any owner/business-facing workflow
- a poor digest can be rolled back, ignored, or disabled without creating a billing, publication, verification, or ranking event

This is not blanket approval to enable it now.

Before `ops_digest` may move to `controlled_live`, DTD must first have:
- the supervised rollout registry/control layer
- truthful rollout-state reporting on `/admin/ai-health`
- operator pause or disable controls
- focused verification proving the workflow can be enabled and rolled back cleanly

No owner-facing or business-facing workflow should move toward live use until those prerequisites exist and the relevant workflow family meets the evidence and approval rubric above.

## 10. Non-Goals
The DTD AI Automation programme is not:
- a general-purpose site chatbot
- a replacement for deterministic search, filters, auth, or admin controls
- a shortcut to automatic publication, moderation, verification, billing, or featured-placement changes
- a content-farm lane for generic SEO or marketing copy generation
- a bucket for unrelated experiments that do not clearly belong to owner, business, or operator workflows already defined in DTD
- a licence to continue unfinished spotlight, monetisation, or route-expansion work under an AI label

## 11. Canonical References
- `DOCS/SSOT/00_BLUEPRINT_SSOT.md` - Tier-0 authority and actor model
- `DOCS/SSOT/05_ROUTES_AND_NAV.md` - canonical route and surface boundaries
- `DOCS/SSOT/08_OPS_RUNBOOK.md` - operator model, cron reality, and current admin surfaces
- `DOCS/SSOT/09_DEPLOYMENT.md` - environment groups, deployment, and current mode variables
- `DOCS/SSOT/10_SECURITY_AND_PRIVACY.md` - admin auth, secret handling, and sensitive-data rules
- `DOCS/SSOT/11_PRODUCT_CONTEXT.md` - plain-English product framing for owner, business, and operator journeys

Implementation note:
- if a future AI Automation task changes route behaviour, API contracts, data contracts, deployment envs, or security posture, the corresponding Tier-1 SSOT documents must be updated in the same change
