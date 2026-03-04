# Routes and Navigation - Intent and Boundaries

**Status:** Canonical (Tier-1)
**Version:** v1.10
**Last Updated:** 2026-03-05

## 1. Inventory source
Implementation-discovered route inventory is generated and versioned at:
- `DOCS/SSOT/_generated/routes.md`

This file defines navigation intent, canonical route decisions, and separation rules.

## 2. Public journey intent
- Entry points for public visitors are `/`, `/triage`, `/search`, `/directory`, and `/emergency`.
- `/` is the guided public launch point: it should support fast shortlist setup (stage, suburb, key issues) while also clearly routing to triage, directory browse, and emergency help.
- `/triage` is the needs-first flow that routes users to either emergency help or focused search, and it must use one canonical emergency issue-to-flow mapping so the gate trigger and branch selection cannot diverge.
- In `/triage`, `suburbId` is the canonical location identity for URL state. If a saved or linked `suburbId` is present, the page must rehydrate the selected suburb from that id instead of relying on mutable location snapshot fields.
- `/search` is the shortlist refinement surface: filters and results must coexist in a way that keeps the next move to a trainer profile obvious and low-friction.
- `/search` is also the canonical first-slice landing surface for locality and service intent. When canonical query params are present (`suburbName`, `service_type`, `age_specialties`, `behavior_issues`, `q/query`), page heading, metadata, structured data, and internal discovery links should reflect that context without requiring a second route family.
- In `/search`, `suburbId` is the canonical location identity when present. Mutable location snapshot fields may remain as display/cache hints, but they must not override canonical suburb resolution for search correctness.
- `/directory` and `/trainers/[id]` are discovery and profile surfaces.
- `/trainers/[id]` is the trust and contact decision surface: it must make fit, proof, and direct contact options visible before the user leaves the directory, and it should prioritise the fastest available direct contact path while retaining the enquiry form as a written fallback.
- If `/trainers/[id]` cannot resolve to a live profile, the failure state must provide clear recovery actions back to search, directory, or home instead of ending in a hard stop.
- `/trainer/[id]` exists for backward compatibility and must redirect to `/trainers/[id]`.
- `/trainer/[id]` compatibility redirects must preserve meaningful query-string context when forwarding to `/trainers/[id]`.
- Legal and policy pages (`/privacy`, `/terms`, `/disclaimer`) must remain publicly accessible.

## 3. Admin separation
- Admin surfaces are under `/admin/**` only.
- `/emergency` is a public surface and must not be repurposed as an admin console.
- Admin pages must be protected by middleware and role checks (see `DOCS/SSOT/10_SECURITY_AND_PRIVACY.md`).
- Admin pages must render inside an operator-specific shell and navigation model, not the public marketing shell.
- Public acquisition CTAs and the public footer chrome must not be shown on `/admin/**` routes.

## 4. Canonical routing decisions
- Canonical trainer listing route is `/directory`.
- `/trainers` is a compatibility route and may redirect to `/directory`.
- Route additions/removals must be reflected by regenerating `DOCS/SSOT/_generated/routes.md`.
