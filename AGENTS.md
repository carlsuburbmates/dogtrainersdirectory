# Agent rules (DTD app repo)

This repository is the application code for `dogtrainersdirectory.com.au`.

## Documentation location (important)
- Do **not** create or edit `DOCS/` or other longform documentation in this repo.
- All docs/runbooks/SSOT live in the sibling repo: `../dtd-docs-private/DOCS/`.

## Guardrails
- Run `npm run docs:guard` before committing if you touched documentation-related files.
- If you need to reference docs from this repo, use paths under `../dtd-docs-private/DOCS/` (or set `DTD_DOCS_DIR` locally).
