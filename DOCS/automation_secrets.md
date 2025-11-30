# Automation secrets and safe usage

This document explains the repository secrets required to run scheduled and manual automation workflows in CI/GitHub Actions and how to use them safely.

Required secrets

- SUPABASE_CONNECTION_STRING — a Postgres connection string used by scheduled jobs that need direct DB access (for example, data-quality, ABN re-check, smoke checks). This must include the password and use the admin connection string when a task requires write access. Prefer a read-only connection for checks where possible.

- SUPABASE_SERVICE_ROLE_KEY — Supabase service role key for admin operations such as applying migrations or running scripts that change DB state. Keep this key strictly protected in repository secrets and restrict access to the few workflows that need it.

- ABR_API_KEY or ABR_GUID — Key or GUID for the ABR (ABN lookup) API used by the ABN re-check workflow. Either one is accepted by existing scripts; the workflow validates that at least one is present.

Security and operational notes

- Never commit these secrets to the repository. Add them to GitHub repository secrets or organization secrets only.
- Protect the workflows that use these keys via environment protection rules and required reviewers where appropriate (e.g. the deploy-migrations workflow should target a protected `production` environment with required approvers).
- Always create a backup or snapshot before running any DDL that mutates the schema. Our `deploy-migrations` workflow creates a pg_dump artifact before applying SQL, but it's good practice to also take a Dashboard snapshot when available.
- Limit the lifetime/reach of service role keys and rotate them periodically.
- CI should be configured with a secrets-scan guardrail that prevents accidentally committing keys (pattern matching like sk_live_|sk_test_|whsec_ etc.).

How to add secrets (short)

1. Go to the repository -> Settings -> Secrets -> Actions
2. Click "New repository secret"
3. Paste the value and name it exactly (e.g., SUPABASE_CONNECTION_STRING)

Once added, scheduled workflows will use the values from ${'{'}{ secrets.VARIABLE_NAME }{'}'} and will run with the appropriate permissions.

Testing locally

To run the ABN re-check script locally (use with care — it will attempt to update the DB):

```bash
# set required env vars in your shell
export SUPABASE_CONNECTION_STRING="postgresql://user:pass@host:5432/postgres"
export ABR_API_KEY="<your-abn-api-key>" # or ABR_GUID
python3 scripts/abn_recheck.py
```

To run the unit tests for the ABN lookup logic (no secrets required):

```bash
python3 scripts/test_abn_recheck.py

Behaviour & thresholds

- The new ABN re-check implementation performs a fuzzy string comparison (SequenceMatcher) between the database business name and the name returned from ABR.
- Matching thresholds in the current implementation:
	- verified: similarity >= 0.85
	- manual_review: similarity >= 0.60 and < 0.85
- The script stores the matched_name, similarity_score, and the raw JSON response into `abn_verifications.matched_json` to aid debugging.

Logging

- The script logs informational messages to stdout so scheduled runs in CI will capture outcomes and any errors. If a request to the ABR API fails, it will be logged and the row will be skipped for the run.

```
