# Security & Privacy — Auth, Data Protection, Secrets

**Status:** Canonical (Tier-1)  
**Version:** v1.0

## 1. Secret handling
- Never commit real secrets. Use `.env.example` as the only env template.
- Client-exposed env vars must be `NEXT_PUBLIC_*` only.

## 2. Supabase access
- Use anon key on client.
- Service role keys are server-only.

## 3. Admin boundary
- All admin pages under `/admin/**`.
- All admin APIs under `/api/admin/**`.
Bundle indicates inconsistent admin auth enforcement; treat as a required hardening item.

## 4. Sensitive fields
Bundle indicates encrypted columns exist for contact fields and are decrypted via `decrypt_sensitive` using `SUPABASE_PGCRYPTO_KEY`.
Rules:
- Decrypt on server only.
- Never return decrypted data to unauthorised clients.

## 5. Webhooks
- Stripe webhook secret (`STRIPE_WEBHOOK_SECRET`) must be required for webhook verification.
- Webhook event processing must be idempotent (verify `webhook_events` table or equivalent exists and is used).
