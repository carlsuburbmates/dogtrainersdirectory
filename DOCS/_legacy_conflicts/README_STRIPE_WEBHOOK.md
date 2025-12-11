> ⚠️ **ARCHIVED / CONFLICTING DOCUMENT**
> This file is retained for historical reference only.
> It does NOT reflect the current implementation or plan and must not be used as a development source of truth.

---

# Stripe webhook test harness

This folder contains a minimal Flask app that listens for Stripe webhooks on `/webhook`.

Quick start (macOS / zsh):

```bash
# create venv
python3 -m venv .venv
source .venv/bin/activate
pip install -r webhook/requirements.txt

# run the server
python webhook/server.py

# In another shell, forward Stripe events using the CLI (logged-in already):
stripe listen --forward-to localhost:4242/webhook

# Then trigger a test event
stripe trigger payment_intent.succeeded
```

The server will verify signatures when `STRIPE_WEBHOOK_SECRET` is set in the environment (we have this in `.env.local`).
