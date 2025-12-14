# Launch Run Artifact Policy

This folder is the evidence log for `npm run verify:launch` and related preflight runs. Every entry must remain reproducible: the Markdown/JSON summaries tell the story, and the matching DNS evidence files (`dns-evidence-<timestamp>.txt`) capture the raw resolver output for that run.

## What to keep

| Artifact | Purpose | Retention |
| --- | --- | --- |
| `launch-prod-YYYYMMDD-ai-preflight.{md,json}` | Canonical run summary for that day | Keep **all** entries. Never delete or merge them; they serve as an audit trail. |
| `dns-evidence-<timestamp>.txt` | Raw `dig`/lookup output used in the corresponding run | Keep the **most recent 5 files per day**. Older files can be archived as described below. |
| Other launch plans (staging dry-runs, ops notes) | Narrative documents referenced by the main plan | Keep indefinitely unless superseded by a new SSOT doc. |

## DNS evidence archival policy

1. After committing a new `dns-evidence-<timestamp>.txt`, check how many DNS files exist for the same calendar day (UTC).  
2. If more than 5 files exist for that day, move the oldest ones into `DOCS/launch_runs/archive/<YYYY>/<MM>/` to keep the top-level folder readable:
   ```bash
   mkdir -p DOCS/launch_runs/archive/2025/12
   git mv DOCS/launch_runs/dns-evidence-2025-12-14T1446.txt DOCS/launch_runs/archive/2025/12/
   ```
3. Add a short note to the corresponding launch Markdown entry stating where the DNS file now resides (e.g., “DNS evidence archived under `archive/2025/12/`”).  
4. Commit the move with a descriptive message, e.g., `chore(launch): archive older dns evidence for 2025-12-14`.

Never delete DNS files outright; if you need to reduce noise, **move** them into `archive/` so the evidence chain stays intact.

## Adding a new artifact

1. Run `set -a && source .env.local && set +a` (or rely on `.envrc` + direnv) so `verify:launch` sees all secrets.  
2. Execute `npm run verify:launch`. The script automatically appends to the current day’s Markdown/JSON and writes a DNS evidence file if needed.  
3. Commit the updated files plus any newly created `dns-evidence-*.txt`. If you archived older DNS files, include those moves in the same commit.

Following this policy keeps the auditing trail reliable while preventing the folder from filling up with dozens of raw resolver dumps.***
