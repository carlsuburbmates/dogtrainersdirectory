# AI Automation — Modes, Flags, Kill Switches

**Status:** Canonical (Tier-1)  
**Version:** v1.0

## 1. Global AI mode
- `AI_GLOBAL_MODE`: `disabled` | `shadow` | `live`
- Per-pipeline overrides (examples):
  - `TRIAGE_AI_MODE`
  - `MODERATION_AI_MODE`
  - `DIGEST_AI_MODE`
  - `VERIFICATION_AI_MODE`

**Rule:** overrides win over global mode.

## 2. Where AI is used (high level)
- Emergency triage (`/api/emergency/triage`)
- Review moderation (admin workflows)
- Ops digest generation (admin workflows)

## 3. Safety rules
- Shadow mode must not write or trigger irreversible actions.
- Live mode must still respect feature flags and ops overrides.

## 4. “AI availability” signalling
Bundle indicates `OPENAI_API_KEY` is used as an availability flag in some admin endpoints. Treat this as **capability signalling**, not permission.

## 5. Reference
See `FLAGS_AND_AI_MODES.md` for the complete list of flags and their enforcement locations.
