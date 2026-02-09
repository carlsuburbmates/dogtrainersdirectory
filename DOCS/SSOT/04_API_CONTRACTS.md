# API Contracts — Endpoints, Auth Boundaries, Payload Notes

**Status:** Canonical (Tier-1)  
**Version:** v1.1  
**Last Updated:** Phase 1 Batch 3 - Documentation Updates

## 1. Endpoint groups (canonical)
### 1.1 Public helper APIs
- `/api/public/autocomplete`

- `/api/public/search` — ✅ **Implemented (Phase 1 Batch 1)**  
  **Method:** GET  
  **Purpose:** Full-text search for trainers/businesses with filtering capabilities  
  **Query Parameters (implementation-aligned):**
    - `query` (string, optional): Search query text
    - `lat` (number, optional): User latitude (requires `lng`)
    - `lng` (number, optional): User longitude (requires `lat`)
    - `distance` (string, optional): Distance filter (`any`, `0-5`, `5-15`, `greater`)
    - `age_specialties` (string, optional): Comma-separated age specialties (values from `age_specialty` enum)
    - `behavior_issues` (string, optional): Comma-separated behaviour issues (values from `behavior_issue` enum)
    - `service_type` (string, optional): Single service type (values from `service_type` enum)
    - `verified_only` (boolean, optional): Show only ABN-verified trainers
    - `rescue_only` (boolean, optional): Show only rescue-dog specialists
    - `price_max` (number, optional): Maximum price filter
    - `limit` (number, optional, default: 50): Results per page (max 100)
    - `offset` (number, optional, default: 0): Pagination offset
  **Response Schema (implementation-aligned):**
    ```json
    {
      "results": [
        {
          "id": "uuid",
          "business_name": "string",
          "suburb": "string",
          "postcode": "string",
          "council": "string",
          "services": ["string"],
          "behavior_issues": ["string"],
          "avg_rating": 4.5,
          "review_count": 10,
          "is_featured": false,
          "is_verified": true,
          "contact_email": "string (decrypted)",
          "contact_phone": "string (decrypted)"
        }
      ],
      "metadata": {
        "total": 50,
        "limit": 50,
        "offset": 0,
        "hasMore": true,
        "filters": {
          "query": "string | null",
          "distance": "string",
          "serviceType": "string | null",
          "verifiedOnly": false
        }
      }
    }
    ```
  **Auth:** Public endpoint, no authentication required  
  **Security:** Uses `SUPABASE_PGCRYPTO_KEY` for decrypting sensitive contact fields  
  **Notes:** Calls `search_trainers` RPC with decryption key, includes telemetry logging

### 1.2 Emergency
- `/api/emergency/resources`
- `/api/emergency/triage`
- `/api/emergency/triage/feedback`
- `/api/emergency/triage/weekly`
- `/api/emergency/verify`

### 1.3 ABN verification
- `/api/abn/verify`
  **Rule:** ABN is **verified** only when `ABNStatus === "Active"` in the ABR response. All other outcomes are `manual_review` or `rejected` (see `abn_fallback_events` and `abn_verifications`).

### 1.4 Onboarding
- `/api/onboarding`

### 1.5 Stripe
- `/api/stripe/create-checkout-session`
- Webhooks: `/api/webhooks/stripe`

### 1.6 Admin APIs
Admin APIs live under `/api/admin/**`. They are operational surfaces and must be protected by admin auth (see `10_SECURITY_AND_PRIVACY.md`).
- `/api/admin/abn/[id]`
- `/api/admin/abn/fallback-stats`
- `/api/admin/alerts/snapshot`
- `/api/admin/ci-event`
- `/api/admin/dlq/replay`
- `/api/admin/errors`
- `/api/admin/errors/stats`
- `/api/admin/errors/trigger-alert`
- `/api/admin/featured/[id]/demote`
- `/api/admin/featured/[id]/extend`
- `/api/admin/featured/[id]/promote`
- `/api/admin/featured/expire`
- `/api/admin/featured/list`
- `/api/admin/health`
- `/api/admin/latency`
- `/api/admin/moderation/run`
- `/api/admin/monetization/overview`
- `/api/admin/monetization/resync`
- `/api/admin/ops-digest`
- `/api/admin/ops/overrides`
- `/api/admin/overview`
- `/api/admin/queues`
- `/api/admin/reviews/[id]`

- `/api/admin/reviews/list` — ✅ **Implemented (Phase 1 Batch 2)**  
  **Method:** POST  
  **Purpose:** Fetch paginated and filtered list of reviews for admin moderation interface  
  **Request Body:**
    ```json
    {
      "status": "pending" | "approved" | "rejected" | null,
      "rating": 1 | 2 | 3 | 4 | 5 | null
    }
    ```
  **Response Schema:**
    ```json
    {
      "success": true,
      "reviews": [
        {
          "id": "uuid",
          "business_id": "uuid",
          "business_name": "string",
          "reviewer_name": "string",
          "rating": 5,
          "title": "string",
          "content": "string",
          "is_approved": true,
          "is_rejected": false,
          "created_at": "timestamp",
          "ai_decision": "approve" | "review" | "reject" | null,
          "ai_confidence": 0.95,
          "ai_reason": "string"
        }
      ],
      "metadata": {
        "total": 50,
        "filtered": 25
      }
    }
    ```
  **Auth:** Admin-only, protected by middleware  
  **Security:** Uses `SUPABASE_SERVICE_ROLE_KEY` for admin-level database access  
  **Notes:** Joins `reviews` table with `businesses` for business name, includes AI moderation decisions from `ai_review_decisions` table  
  **Related Endpoint:** `/api/admin/reviews/[id]` for approve/reject actions

- `/api/admin/run/featured-expire`
- `/api/admin/run/moderation`
- *(see route inventory for full list)*

## 2. Canonical auth boundary rules
- Any `/api/admin/**` endpoint is **admin-only**.
- Public endpoints must not expose privileged ops actions or sensitive data.
- ✅ **Auth Implementation (Phase 1 Batch 1):** All `/api/admin/**` routes are protected by Next.js middleware (`src/middleware.ts`) using `checkAdminAuthFromRequest()` from `src/lib/auth.ts`.
- Non-admin requests to admin APIs return 401 Unauthorized.

## 3. Canonical notes (from bundle)
- `/api/stripe/create-checkout-session` uses Stripe Checkout `mode: payment` and adds `tier: featured_placement_30d` metadata.
- `/api/webhooks/stripe` processes Stripe events and must be idempotent (see `06_MONETISATION.md`).
- Search API (`/api/public/search`) uses `SUPABASE_PGCRYPTO_KEY` for server-side decryption of sensitive contact fields (email, phone).
- Admin reviews list API (`/api/admin/reviews/list`) enriches review data with AI moderation decisions for moderator convenience.

## 4. Source-of-truth
For full method/body/response shapes, refer to `ROUTE_INVENTORY.md` and the route handler code.
