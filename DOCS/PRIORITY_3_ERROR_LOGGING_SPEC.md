# Priority 3: Error Logging & Monitoring — Technical Spec

Date: December 8, 2025
Status: Approved for implementation (Week 3)
Owner: Engineering

---

## Goals
- Capture all critical errors with rich context
- Expose real-time error metrics to admins
- Alert on spikes and outages
- Keep history (30 days) for investigation and trend analysis

## Non-Goals
- External SIEM integration (future)
- Full-text log search UI (basic filtering only for now)

---

## Data Model (Supabase)

### Tables

1. `error_logs`
- id (uuid, pk)
- created_at (timestamptz, default now())
- level (text: debug|info|warn|error|critical)
- category (text: api|llm|validation|db|client|other)
- route (text)
- method (text)
- status_code (int)
- message (text)
- stack (text)
- context (jsonb)
- user_id (uuid, nullable)
- session_id (text, nullable)
- request_id (text, nullable)
- duration_ms (int, nullable)
- env (text: dev|staging|prod)

Indexes:
- idx_error_logs_created_at
- idx_error_logs_level_created_at
- idx_error_logs_category_created_at
- idx_error_logs_route_created_at

RLS:
- Enabled; only service role/API may insert; admin role may read

2. `error_alerts`
- id (uuid, pk)
- created_at (timestamptz)
- alert_type (text)
- severity (text)
- threshold (jsonb)
- status (text: open|ack|closed)
- last_triggered_at (timestamptz)
- meta (jsonb)

3. `error_alert_events`
- id (uuid, pk)
- alert_id (uuid fk -> error_alerts)
- created_at (timestamptz)
- message (text)
- sample_error_ids (uuid[])

---

## Library API

File: `/src/lib/errorLog.ts`

```ts
export type ErrorLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical'
export type ErrorCategory = 'api' | 'llm' | 'validation' | 'db' | 'client' | 'other'

export interface ErrorContext {
  route?: string
  method?: string
  statusCode?: number
  userId?: string
  sessionId?: string
  requestId?: string
  durationMs?: number
  env?: 'dev' | 'staging' | 'prod'
  extra?: Record<string, unknown>
}

export function logError(messageOrError: string | Error, ctx?: ErrorContext, level: ErrorLevel = 'error', category: ErrorCategory = 'other'): Promise<void>
export function logAPIError(route: string, method: string, statusCode: number, error: unknown, ctx?: Omit<ErrorContext, 'route'|'method'|'statusCode'>): Promise<void>
export function logLLMError(prompt: string, response: unknown, latencyMs: number, error?: unknown, ctx?: ErrorContext): Promise<void>
export function logValidationError(field: string, error: string, userInput?: unknown, ctx?: ErrorContext): Promise<void>
```

Implementation notes:
- Normalize Error to { message, stack }
- Batch sends (flush every 500ms or 20 logs)
- Fallback to console.error if DB insert fails

---

## Admin APIs

1) `GET /api/admin/errors` (query params: level, category, route, before, after, limit=50)
- Returns paginated list with summary counts

2) `GET /api/admin/errors/:id`
- Returns full log record + related (same route within ±5m)

3) `GET /api/admin/errors/stats`
- { errorsPerMinute: [...], byRoute: [...], byLevel: [...], llmErrors: {...} }

4) `POST /api/admin/alerts/ack` (body: { alertId })
- Acknowledge an alert

---

## Alerting Logic

- Rule 1: High error rate
  - Condition: errors(level in ['error','critical']) per minute > 5 for 5 consecutive minutes
  - Action: create/open alert, send notification

- Rule 2: LLM provider failures
  - Condition: >10% llm errors (timeout|rate_limit|invalid_response) in last 10 minutes or health endpoint returns down
  - Action: alert

- Rule 3: DB connectivity
  - Condition: api errors with status 500 + category=db > 3/min for 5 min
  - Action: alert

Cooldown: 30 minutes before re-triggering same alert type

---

## Integration Tasks

- Wrap Next.js API handlers to capture and log uncaught exceptions
- Add try/catch in `/src/lib/llm.ts` calls; on failure, `logLLMError`
- In validation middleware, `logValidationError` for schema mismatches
- Client: add React error boundary to POST `/api/client-error` (optional)

---

## Testing

- Unit tests for `errorLog.ts` (message normalization, batching)
- Integration tests for `/api/admin/errors` and `/stats`
- Simulate alert triggers with seeded logs

---

## Rollout Plan

1. Create DB tables + indexes
2. Ship `errorLog.ts` with no-op export behind `ENABLE_ERROR_LOGGING`
3. Enable logging in staging
4. Verify metrics endpoints
5. Turn on in production with alert thresholds

---

## Environment

- `ENABLE_ERROR_LOGGING=true|false`
- `ENVIRONMENT=dev|staging|prod`
- `ALERT_WEBHOOK_URL` (Slack/email bridge)

---

## Security & Privacy

- Do not log PII fields (emails, phone, addresses) in `context.extra`
- Redact secrets (tokens, keys) before insert
- Enforce RLS: only service role insert; admin role read
