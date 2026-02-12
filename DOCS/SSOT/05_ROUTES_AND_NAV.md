# Routes and Navigation - Intent and Boundaries

**Status:** Canonical (Tier-1)
**Version:** v1.2
**Last Updated:** 2026-02-13

## 1. Inventory source
Implementation-discovered route inventory is generated and versioned at:
- `DOCS/SSOT/_generated/routes.md`

This file defines navigation intent, canonical route decisions, and separation rules.

## 2. Public journey intent
- Entry points for public visitors are `/`, `/triage`, `/search`, `/directory`, and `/emergency`.
- `/triage` is the needs-first flow that routes users to either emergency help or focused search.
- `/directory` and `/trainers/[id]` are discovery and profile surfaces.
- `/trainer/[id]` exists for backward compatibility and must redirect to `/trainers/[id]`.
- Legal and policy pages (`/privacy`, `/terms`, `/disclaimer`) must remain publicly accessible.

## 3. Admin separation
- Admin surfaces are under `/admin/**` only.
- `/emergency` is a public surface and must not be repurposed as an admin console.
- Admin pages must be protected by middleware and role checks (see `DOCS/SSOT/10_SECURITY_AND_PRIVACY.md`).

## 4. Canonical routing decisions
- Canonical trainer listing route is `/directory`.
- `/trainers` is a compatibility route and may redirect to `/directory`.
- Route additions/removals must be reflected by regenerating `DOCS/SSOT/_generated/routes.md`.
