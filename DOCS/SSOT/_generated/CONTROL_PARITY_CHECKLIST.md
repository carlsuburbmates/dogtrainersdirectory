# Unified Parity Checklist (Frontend Backend DB SSOT)

**Status:** Active gate  
**Owner:** Main control chat session  
**Last Updated:** 2026-02-25

Use this before closing any sync task.

## 1. Frontend parity
- UI callers use only existing backend/edge endpoints.
- Query params/body shapes match current handler contracts.
- Triage-to-search flow uses one canonical handoff path.
- No dead links or placeholder user-critical actions.

## 2. Backend/API parity
- Endpoints/methods match implementation snapshots and SSOT policy docs.
- Admin/public boundaries remain intact (`/admin`, `/api/admin/**`).
- Error and fallback behavior is explicit and testable.
- Contract deltas are logged before frontend consumption changes.

## 3. Database and edge parity
- Tables/enums/RPCs used by code exist in schema/migrations.
- Edge functions invoked by frontend are deployed and contract-aligned.
- Schema changes include migrations and SSOT impact notes.
- No undocumented identifiers added.

## 4. Documentation parity
- Tier-0/Tier-1 updated for contract/behavior changes.
- Generated snapshots refreshed when route/api/schema changed.
- Only `DOCS/SSOT/**` is edited for canonical docs.
- `README*` and `supabase/LOCAL_SETUP.md` remain pointer-only.

## 5. Unified verification gate
- `npm run type-check`
- `npm run lint`
- `npm test`
- `npm run docs:guard` (if docs touched)
- `npm run ssot:refresh` (if route/api/schema touched)

Any failed gate must be logged in `CONTROL_DECISIONS.md` with disposition.
