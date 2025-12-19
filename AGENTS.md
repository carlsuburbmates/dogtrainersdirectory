# Agent rules (DTD app repo)

This repository is the application code for `dogtrainersdirectory.com.au`.

## Documentation location (important)
- Do **not** create or edit `DOCS/**` except for `DOCS/SSOT/**`.
- `DOCS/SSOT/**` is allowed for SSOT-only updates in this repo.
- All other docs/runbooks live in the sibling repo: `../dtd-docs-private/DOCS/`.
- Before making any change, read `DOCS/SSOT/00_BLUEPRINT_SSOT.md` and follow precedence rules.
- If SSOT does not define the contract, stop and report.

## Guardrails
- Run `npm run docs:guard` before committing if you touched documentation-related files.
- If you need to reference docs from this repo, use paths under `../dtd-docs-private/DOCS/` (or set `DTD_DOCS_DIR` locally).
