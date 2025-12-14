# Local Review Checklist (Draft)

Purpose: one-page checklist for local sign-off before pushing `n1` for automated Vercel deploy.

Preconditions
- Working Node.js environment (Node v24) and required secrets in local `.env.local` for staging checks.
- Remote branch `n1` exists and is used for deploys when pushed.

Commands to run (local)
1. Install deps (if needed):

   ```bash
   npm ci
   corepack enable && corepack prepare yarn@stable --activate  # optional if yarn used
   ```

2. Type-check, build, and tests:

   ```bash
   npm run type-check
   npm run build
   npm run test
   ```

3. Smoke + E2E (recommended before push):

   ```bash
   npm run smoke
   npm run e2e  # Playwright - optional if environment supports it
   ```

4. Doc divergence and preprod verify:

   ```bash
   python3 scripts/check_docs_divergence.py --base-ref origin/main
   bash scripts/preprod_verify.sh
   ```

What to collect (save to `DOCS/launch_runs/`):
- `smoke-<timestamp>.log` (smoke run output)
- `preprod-verify-<timestamp>.log` (preprod verify output)
- `doc-divergence-<timestamp>.log` (doc divergence output)
- `build-<timestamp>.log` (optional build log)

If checks pass
- Commit drafts to branch `n1` and push:

  ```bash
  git checkout n1
  git add DOCS/_drafts/* DOCS/launch_runs/*
  git commit -m "chore(docs): local review artifacts + drafts"
  git push origin n1
  ```

- Wait for Vercel to build the pushed branch; capture the remote build URL or screenshot.

If checks fail
- Fix locally, repeat tests, re-run preprod verify, then commit and push.

Post-deploy verification (remote)
- Confirm Vercel build logs show Next.js build success and no server/runtime errors.
- Visit the site preview URL and confirm main flows (triage, search, trainer profile, emergency) load without errors.
- Save deployment logs/screenshots to `DOCS/launch_runs/` and update `DOCS/_drafts/REVIEW_CHECKLIST.md` with timestamp and result.

Rules
- No PR required for this workflow; `n1` is the single branch used to trigger automatic deploys.
- Keep drafts in `DOCS/_drafts/` until you’re ready to replace canonical docs.
