# Design System - Dog Trainers Directory (DTD)

**Status:** Canonical (Tier-1)  
**Version:** v1.0  
**Last Updated:** 2026-03-05

## 1. Purpose
This document defines the current design system for DTD.

It is the canonical visual and interaction reference for public UX refinement work. It does not override route, API, data, monetisation, security, or operations contracts. It defines how the product should feel and how the UI should be composed.

The goal is:
- sophisticated but user-friendly
- distinctive without looking experimental
- structured without feeling like generic SaaS

## 2. Design philosophy
DTD uses a calm, high-clarity interface on top of a dramatic environmental canvas.

Three guiding principles:
- **Calm UI on top of a dramatic environment:** the background can create emotional depth, but content surfaces must remain legible and controlled.
- **Deterministic structure:** spacing, hierarchy, and component patterns must feel predictable and disciplined.
- **Product clarity:** every UI element must support the search -> shortlist -> contact flow, not decorative novelty.

## 3. Visual identity
### 3.1 Core concept
The core visual environment is **Living Field**.

It is a global environmental layer made up of:
- contour field lines
- mesh gradient tension
- subtle noise grain
- ambient slow motion

This background is a canvas-level treatment, not per-component decoration.

### 3.2 Motion rule
Ambient motion must remain subtle and must respect `prefers-reduced-motion`.

## 4. Token system
### 4.1 Surface tokens
- `background.deep`
- `background.mid`
- `background.surface`
- `background.overlay`

Usage:
- `deep`: global canvas
- `mid`: section transition surfaces
- `surface`: cards and main UI blocks
- `overlay`: modal and elevated overlays

### 4.2 Accent tokens
- `accent.primary`
- `accent.secondary`
- `accent.warning`
- `accent.success`

Usage:
- `primary`: primary CTA
- `secondary`: chips, tags, lightweight emphasis
- `warning`: emergency and urgent signals
- `success`: verification and positive status

Accent colours are controlled highlights, not broad theme fills.

### 4.3 Neutral tokens
- `text.primary`
- `text.secondary`
- `text.muted`
- `border.subtle`
- `border.strong`

## 5. Typography
Tone:
- calm
- confident
- authoritative

Canonical scale:
- `Display`
- `Heading`
- `Title`
- `Body`
- `Meta`

Expected usage:
- `Display`: hero statements
- `Heading`: page and section structure
- `Title`: cards and key blocks
- `Body`: descriptions and support copy
- `Meta`: labels, helper text, and status text

Public copy must read like a finished product, not an implementation note.

## 6. Spacing
Base system: **8px grid**

Tokens:
- `xs` = `4`
- `sm` = `8`
- `md` = `16`
- `lg` = `24`
- `xl` = `32`
- `xxl` = `48`

Rules:
- cards typically use `24px` to `32px`
- section spacing should usually be `48px` to `64px`

## 7. Shape
Rounded, but not playful.

Tokens:
- `radius.sm` = `8px`
- `radius.md` = `12px`
- `radius.lg` = `16px`
- `radius.xl` = `24px`

Expected usage:
- `sm`: inputs
- `md`: chips and compact controls
- `lg`: cards
- `xl`: sheets and large modal surfaces

## 8. Elevation
Minimal but explicit.

Tokens:
- `shadow.card`
- `shadow.pop`
- `shadow.overlay`

Rules:
- use one consistent card shadow language
- avoid stacked or competing shadow styles

## 9. Motion
Allowed motion:
- `fade-in`
- `slide-up`
- `hover-lift`
- `chip-press`
- `sheet-reveal`

Forbidden motion:
- bouncing
- flashy transitions
- aggressive parallax

Motion must support comprehension, not attract attention to itself.

## 10. Primitive component system
All UI should be composed from core primitives.

Canonical primitives:
- `Button`
- `Card`
- `Field`
- `Chip`
- `Badge`
- `Divider`
- `Sheet`
- `Capsule`

Public UX cleanup should reduce one-off explanatory panels and replace them with consistent primitive-based patterns.

## 11. Product component system
Built from primitives.

### 11.1 TrainerCard
Should present:
- trainer name
- location
- trust cues
- services/fit cues
- clear next action

### 11.2 Sticky Intent Capsule
Should summarise current search intent in a compact editable form.

Example:
- `Carlton • 15 km • Puppy • Reactivity`

### 11.3 Filter Sheet
The preferred mobile-first filter interaction is a compact summary plus an expandable filter sheet, rather than exposing every control at once.

### 11.4 Featured Rail
A horizontal promoted-listing surface when product rules provide data.

### 11.5 Empty State
Must contain:
- explanation
- corrective action
- CTA

### 11.6 Loading State
Use skeleton placeholders instead of abrupt blank regions where practical.

### 11.7 Error State
Use a simple, bounded card with a retry or recovery action.

## 12. Layout patterns
### 12.1 Hero + Triage
Home page should prioritise one dominant entry path:
- hero
- triage/search entry
- supporting trust cues

Secondary paths should be demoted, not given equal visual weight with the primary journey.

### 12.2 Search Results
Preferred structure:
- intent summary
- filters
- results list

The page should feel like a shortlist tool, not a manual.

### 12.3 Profile
Preferred structure:
- summary
- about
- services / fit
- reviews / trust
- contact

### 12.4 Onboarding
Preferred structure:
- step-based or progressively disclosed form sections

Long intimidating single-page forms should be reduced over time.

## 13. Accessibility baseline
Minimum requirements:
- keyboard navigation
- visible focus states
- minimum `44px` touch targets
- reduced-motion support
- proper ARIA roles, especially for combobox/autocomplete behaviour

## 14. Guardrails
### 14.1 Avoid “AI-looking” patterns
Avoid:
- generic SaaS grids
- template hero layouts
- pastel-gradient default aesthetics

The product should feel like premium local infrastructure, not a generated template.

### 14.2 No scattered styles
New UI work must use:
- tokens
- primitives
- consistent spacing and hierarchy

### 14.3 No product logic in presentation rules
The design system must not hardcode business rules.

Examples:
- UI may render featured rails when provided data
- UI must not assume fixed featured slot counts unless product logic explicitly provides them

### 14.4 Differentiation should be felt through UX, not overclaimed in copy
Triage, locality, and emergency-awareness should be expressed as product behaviour first, not as internal-sounding labels or explanatory claims.

## 15. Immediate enforcement priorities
The next public refinement slice must use this design system to correct the highest-signal current violations:
- remove internal builder language from public UI
- reduce instruction density above the fold
- restore a single dominant public entry path on home
- hide developer-facing location controls from public search
- reduce chip/control overload on key public surfaces
- replace placeholder empty states with actionable empty states
- remove implementation-detail labels from onboarding

## 16. Scope note
The design system is conceptually complete enough to guide the next refinement slice.

Current public weaknesses are not caused by a missing design philosophy. They are caused by:
- builder language leaking into user-facing UI
- overly explicit instructional copy
- inconsistent application of component discipline
- weak empty states
- specific state-model issues such as the triage suburb split-source problem

Use this file to align future UX work before introducing new public-facing complexity.
