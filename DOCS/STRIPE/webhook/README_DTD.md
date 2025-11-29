# dogtrainersdirectory — dedicated webhook test harness

Use this small harness to test Stripe webhooks for the dogtrainersdirectory project without colliding with other local dev projects.

Defaults
- Port: 4243
- Endpoint: /api/webhooks/stripe-dtd

Quick start (macOS / zsh)

```bash
# 1) activate venv (the repo's webhook/requirements.txt contains dependencies)
python3 -m venv .venv
source .venv/bin/activate
pip install -r webhook/requirements.txt

# 2) run the dedicated server
python webhook/server_dtd.py

# 3) in another shell, forward Stripe events to the dtd endpoint
stripe listen --forward-to localhost:4243/api/webhooks/stripe-dtd

# 4) trigger a test event
stripe trigger checkout.session.completed
```

Notes
- This is intentionally separate from an app listening on :3000/api/webhooks/stripe so you won't have cross-project collisions. Use this harness for development and quick local integration tests.

Security
- The server will verify webhook signatures when `STRIPE_WEBHOOK_SECRET` is present in the environment.
- Do not use real production secrets locally unless you know what you're doing.
