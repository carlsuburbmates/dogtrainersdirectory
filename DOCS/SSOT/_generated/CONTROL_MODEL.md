# Control Model (Main Session Governance)

**Status:** Active governance  
**Owner:** Main control chat session  
**Last Updated:** 2026-02-25

## 1. Scope and objective
This control model governs all active chats for DTD with one goal:
- keep frontend, backend, database, and SSOT in sync
- prevent doc/code drift and file ownership collisions
- land cleanly on `main` (single-developer, single-branch workflow)

## 2. Canonical sources
1. User instruction in main control session
2. `DOCS/SSOT/00_BLUEPRINT_SSOT.md`
3. Tier-1 SSOT docs (`DOCS/SSOT/*.md`, including `WORKPLAN.md`)
4. Running backend/API/schema implementation
5. Historical session notes

Operational rule for this cycle:
- Running backend contracts are operational truth for implementation.
- SSOT must be updated in the same cycle so no persistent drift remains.

## 3. Active session lanes
- Main control session (this chat): governance, lock allocation, final docs reconciliation
- Frontend session: `019c396e-e834-7472-9063-53c74c12b078`
- Backend session: active backend chat lane (session ID recorded in handoff log when provided)

## 4. Write-lock policy (single branch)
Only one session has write lock at a time.

Write order for sync work:
1. Backend lane (contracts/handlers/functions)
2. Frontend lane (callers/UI flows to match contracts)
3. Main control lane (SSOT updates, generated refresh, governance logs)

Each lane must hand off before next lane writes.

## 5. Required gates before lane handoff
1. `npm run type-check`
2. `npm run lint`
3. Relevant tests for changed area
4. If docs changed: `npm run docs:guard`
5. If route/api/schema changed: `npm run ssot:refresh`

## 6. Mandatory lane handoff format
1. Task ID
2. Files changed
3. What changed
4. Verification commands and pass/fail
5. Risks/blockers
6. Next task to activate

## 7. Stop conditions
Stop lane execution and escalate to main control session when:
- proposed change conflicts with Tier-0 invariants
- schema/API behavior is undocumented and unclear
- gate failures cannot be resolved inside assigned scope
