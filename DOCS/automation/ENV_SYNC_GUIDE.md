# Environment Sync & Artifact Packaging

This guide locks in the exact sequence we now use whenever `verify:launch` needs to run locally, in CI, or on Vercel. Follow these steps without skipping so the harness always has the required secrets and the artifacts stay canonical.

## 1. Local `.env.local` → shell export

```bash
cd /Users/carlg/Documents/PROJECTS/Project-dev/DTD
set -a && source .env.local && set +a
```

- `set -a` exports every key defined in `.env.local` so subprocesses inherit them.
- Run this before *any* `npm run verify:*` command (unless you use the optional direnv step below).

**Direnv option:** The repo ships with `.envrc`. Install direnv once (`brew install direnv`, hook it into your shell, then run `direnv allow` in the repo) and your `.env.local` will auto-load on `cd` without manual exports.

## 2. Run the harness and capture artifacts

```bash
npm run verify:launch
```

The script automatically appends to `DOCS/launch_runs/launch-prod-<date>-ai-preflight.{md,json}` and emits `dns-evidence-<timestamp>.txt` if DNS lookups were performed. No extra copying is needed.

## 3. Sync secrets to CI & Vercel

| Target | How | Notes |
| --- | --- | --- |
| GitHub Actions (staging/prod) | `gh secret set NAME --env <environment>` | Provide `SUPABASE_*`, `STRIPE_*`, `ABR_GUID`, `ZAI_*`, `LLM_DEFAULT_MODEL`, `FEATURE_MONETIZATION_*`, `ALERTS_*`, `CRON_SECRET`. Use `*_STAGING`/`*_PROD` naming where workflows expect it. |
| Vercel Preview / Production | Run `./scripts/vercel-env-import.sh --apply --project <vercel-project>` or set manually in the dashboard | Mirror the same values used locally so Preview/Production builds pass the env check. |
| Local dev machines | Copy `.env.local` from 1Password/secure vault, never commit it | Only trusted maintainers should hold service-role + connection-string values. |

After syncing each target, validate with:

```bash
ENV_TARGET=staging ./scripts/check_env_ready.sh staging   # or production
```

The command must print `All required variables are set.`

> **Remote DB reminder:** The harness always targets the Supabase instance configured in `.env.local`. Keep those secrets populated even for local-only work; pointing the tests at a local Postgres container will fail unless you deliberately run the optional Docker helpers.

## 4. Push evidence

1. `git add DOCS/launch_runs/launch-prod-*.md DOCS/launch_runs/launch-prod-*.json DOCS/launch_runs/dns-evidence-*.txt`
2. Commit with a message like `chore(launch): verify:launch pass 20251214`.
3. Push to `n1` (or whichever branch triggers Vercel) so CI has the same artifact history.

With this flow “locked in”, any future `FAIL` from the harness indicates a real regression rather than missing secrets.
