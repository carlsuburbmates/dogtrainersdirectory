# AI Agent Instructions - dogtrainersdirectory.com.au

## Canonical sources
- This repository is self-contained.
- Use `DOCS/SSOT/**` as the authoritative documentation set.
- Treat `DOCS/SSOT/00_BLUEPRINT_SSOT.md` as first read before implementation changes.
- Generated implementation inventories live under `DOCS/SSOT/_generated/*`.

## Do not use external docs
- Do not rely on sibling repos or external local doc folders.
- If a contract is missing from SSOT, stop and raise it for SSOT update before coding.

## Product and architecture scope
- Public product surfaces: `/`, `/triage`, `/search`, `/directory`, `/trainers/[id]`, `/emergency`, `/onboarding`, `/promote`.
- Admin surfaces: `/admin/**` and `/api/admin/**`.
- Data and enum contracts: `DOCS/SSOT/03_DATA_CONTRACTS.md`.
- API boundary rules: `DOCS/SSOT/04_API_CONTRACTS.md`.
- Routes and navigation intent: `DOCS/SSOT/05_ROUTES_AND_NAV.md`.
- Monetisation constraints: `DOCS/SSOT/06_MONETISATION.md`.
- AI mode controls: `DOCS/SSOT/07_AI_AUTOMATION.md`.
- Ops and deployment: `DOCS/SSOT/08_OPS_RUNBOOK.md`, `DOCS/SSOT/09_DEPLOYMENT.md`.
- Security/privacy rules: `DOCS/SSOT/10_SECURITY_AND_PRIVACY.md`.

## Working rules
- Keep frontend, backend, schema, and SSOT in sync.
- Do not invent tables, enums, or endpoints not present in code + SSOT.
- Preserve admin/public separation and role-based access rules.
- Do not expose secrets via client env vars.
- Keep DB identifiers stable; do not rename to match locale spelling.

## Drift prevention
- Regenerate snapshots when implementation changes:
  - `npm run ssot:refresh`
- Validate docs boundaries:
  - `npm run docs:guard`
- CI enforces snapshot drift checks.

## Validation before shipping
- `npm run type-check`
- `npm run lint`
- `npm test`
- `npm run smoke`
- If SSOT changed: `npm run docs:guard`

## If blocked
- Record the gap in `DOCS/SSOT/WORKPLAN.md` and continue in task order.
