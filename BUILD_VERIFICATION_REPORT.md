# Build Verification Report (Deprecated)

This file used to contain a one-off build/verification narrative from 2026-01-27.
It is intentionally deprecated because it becomes stale quickly and can conflict with SSOT and the codebase.

## Canonical truth
- Product, contracts, and operations: `DOCS/SSOT/FILE_MANIFEST.md`
- Implementation inventories (generated): `DOCS/SSOT/_generated/*`
- CI is the current verification mechanism via workflows under `.github/workflows/`

## Current verification commands
- `npm run type-check`
- `npm run lint`
- `npm test`
- `npm run smoke`
- `npm run docs:guard`
- `npm run ssot:refresh`

## Historical record
If you need the original narrative report, use git history for this file.
