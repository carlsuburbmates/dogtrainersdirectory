# Agent rules (DTD app repo)

This repository is the application code for `dogtrainersdirectory.com.au`.

## Documentation location (important)
- Do **not** create or edit `DOCS/**` except for `DOCS/SSOT/**`.
- `DOCS/SSOT/**` is allowed for SSOT-only updates in this repo.
- `README.md`, `README_DEVELOPMENT.md`, and `supabase/LOCAL_SETUP.md` are pointer-only summaries.
- Before making any change, read `DOCS/SSOT/00_BLUEPRINT_SSOT.md` and follow precedence rules.
- If SSOT does not define the contract, stop and report.

## Guardrails
- Run `npm run docs:guard` before committing if you touched documentation-related files.
- Keep operational procedures in `DOCS/SSOT/08_OPS_RUNBOOK.md` and environment/deploy details in `DOCS/SSOT/09_DEPLOYMENT.md`.
