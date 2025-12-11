> ⚠️ **ARCHIVED / CONFLICTING DOCUMENT**
> This file is retained for historical reference only.
> It does NOT reflect the current implementation or plan and must not be used as a development source of truth.

---

# DTD Webhook Harness (Local)

Use this lightweight server to test Stripe webhooks locally without colliding with other projects.

## Quick start

```bash
# from repo root
python3 webhook/server_dtd.py
# server listens on http://127.0.0.1:4243/api/webhooks/stripe-dtd
```

In another terminal, forward Stripe events:

```bash
stripe listen --forward-to http://127.0.0.1:4243/api/webhooks/stripe-dtd
```

Send test events:

```bash
stripe trigger payment_intent.succeeded
stripe trigger charge.succeeded
stripe trigger checkout.session.completed
```

All requests log to `webhook/server.log` and stdout. The harness does not verify signatures—it’s just for local visibility. Production handlers must verify signatures and enforce idempotency in your app code.

## Metadata expectations (Phase 1 featured slot)
- `trainer_id`, `business_id`, `lga_id` must be present in Checkout/session metadata so the webhook can map payments.
- Price/Product: $20 AUD featured placement (30 days), single tier for Phase 1.

## Notes
- Endpoint path: `/api/webhooks/stripe-dtd`
- Host/port: `127.0.0.1:4243`
- Dependencies: standard library only (no extra installs)
- If you change port/path, update your `stripe listen --forward-to` command accordingly.

## ABN re-check workflow & notifications
- The repo contains a scheduled `ABN re-check` workflow (`.github/workflows/abn-recheck.yml`) and `scripts/abn_recheck.py` for periodic ABR lookups.
- CI supports an optional, minimal notification step when a secret `ABN_ALERT_WEBHOOK` is set in the repository (e.g., a Slack/Teams webhook). This is guarded and will not run unless explicitly configured.
- For local testing and quick dry-runs, use the CSV → generator → controlled batch workflow documented in the main README and `DOCS/ABN-Rollout-Checklist.md`. 
