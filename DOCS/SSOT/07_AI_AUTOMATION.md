# AI Automation - Modes, Flags, Kill Switches

**Status:** Canonical (Tier-1)
**Version:** v1.1
**Last Updated:** 2026-02-13

## 1. Global AI mode
- `AI_GLOBAL_MODE`: `disabled` | `shadow` | `live`
- Per-pipeline overrides:
- `TRIAGE_AI_MODE`
- `MODERATION_AI_MODE`
- `DIGEST_AI_MODE`
- `VERIFICATION_AI_MODE`

Rule: overrides take precedence over global mode.

## 2. Where AI is used (high level)
- Emergency triage (`/api/emergency/triage`)
- Review moderation (admin workflows)
- Ops digest generation (admin workflows)

## 3. Safety rules
- Shadow mode must not write or trigger irreversible actions.
- Live mode must still respect feature flags and ops overrides.

## 4. Availability signalling
- `OPENAI_API_KEY` may be used as availability signalling in some flows.
- Availability signalling is not authorisation.

## 5. Reference points
- Deployment env groups: `DOCS/SSOT/09_DEPLOYMENT.md`
- Security boundaries: `DOCS/SSOT/10_SECURITY_AND_PRIVACY.md`
- Implementation inventory (generated): `DOCS/SSOT/_generated/api.md`
