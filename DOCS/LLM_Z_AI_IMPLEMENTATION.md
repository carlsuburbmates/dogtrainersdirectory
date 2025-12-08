# LLM Implementation with Z.ai

## Overview
This document describes the implementation of LLM (Large Language Model) functionality using the Z.ai API as a replacement for OpenAI. This implementation is now integrated with the existing digest, moderation, and emergency triage systems.

## Architecture

### Core Components
- `/src/lib/llm.ts` - LLM provider wrapper with Z.ai integration
- `/src/lib/digest.ts` - Operations digest generation (uses LLM)
- `/src/lib/moderation.ts` - Review moderation with AI decision tracking
- `/src/lib/emergency.ts` - Emergency triage classifier (keyword-based, ready for AI upgrade)

### API Integration
- `/src/app/api/admin/latency/route.ts` - Performance monitoring endpoint
- `/src/app/api/validation/check-csv-enums/route.ts` - Data validation endpoint

## Configuration

### Environment Variables
```env
# Z.ai API Settings
ZAI_API_KEY=your_zai_api_key
ZAI_MODEL=glm-4.6
ZAI_BASE_URL=https://api.z.ai/v1/chat/completions
ZAI_MAX_TOKENS=1000
ZAI_TEMPERATURE=0.7
```

## Features

### 1. LLM Provider Wrapper (`/src/lib/llm.ts`)
- Simple API integration with Z.ai Chat Completions endpoint
- Built-in retry logic with exponential backoff
- Rate limiting helper (1 second minimum between calls)
- Graceful fallback when API is unavailable
- Health check endpoint for monitoring
- Usage tracking (tokens, cost, latency)

### 2. Search Telemetry (`/src/lib/api.ts`)
- Latency tracking for all API calls (suburb search, triage search)
- Success/failure logging with error details
- P50/P95 latency statistics
- Admin dashboard integration
- Database table `search_telemetry` for persistent metrics

### 3. Data Validation (`/src/app/api/validation/check-csv-enums/route.ts`)
- Enum consistency checks between database and blueprint
- CSV suburb count validation against database
- Distance calculation regression test (Fitzroy→Brighton)
- Comprehensive validation report for CI/automation

## Usage Examples

### LLM Response Generation
```typescript
import { generateLLMResponse } from '@/lib/llm'

const response = await generateLLMResponse({
  systemPrompt: 'You are a helpful assistant.',
  userPrompt: 'Summarize the operational health in 3 sentences.',
  maxTokens: 500,
  temperature: 0.7
})

console.log(response.text)
console.log(response.model)      // "glm-4.6"
console.log(response.provider)  // "z.ai"
```

### LLM with Retry Logic
```typescript
import { generateLLMResponseWithRetry } from '@/lib/llm'

const response = await generateLLMResponseWithRetry(
  { systemPrompt: '...', userPrompt: '...' },
  2 // retry attempts
)
```

### Rate Limited Calls
```typescript
import { generateLLMResponseLimited, rateLimiter } from '@/lib/llm'

// Built-in 1-second rate limiting
const response = await generateLLMResponseLimited({ 
  systemPrompt: '...', 
  userPrompt: '...' 
})

// Or use rate limiter directly
await rateLimiter.wait()
```

### Health Check
```typescript
import { checkLLMHealth } from '@/lib/llm'

const health = await checkLLMHealth()
console.log(health.status)  // 'healthy' | 'degraded' | 'down'
console.log(health.message) // Human-readable status
```

## Monitoring & Telemetry

### Search Performance Metrics
The system automatically tracks:
- API call latency (in milliseconds)
- Success/failure rates
- Number of results returned
- Error details when available

Access metrics via admin dashboard or directly:
```
GET /api/admin/latency?hours=24
```

### Admin Integration
The admin overview now includes latency metrics:
- P50 latency (median)
- P95 latency (95th percentile)
- Average latency
- Success rate percentage
- Alert when P95 > 200ms

## Database Schema

### Search Telemetry Table
```sql
create table public.search_telemetry (
    id uuid primary key default gen_random_uuid(),
    operation text not null,
    suburb_id int references public.suburbs(id),
    suburb_name text,
    result_count int not null default 0,
    latency_ms int not null,
    success boolean not null default true,
    error text,
    timestamp timestamptz not null default now()
);
```

## Migration

To apply the search telemetry table, run the migration:
```sql
-- File: supabase/migrations/20241208020000_search_telemetry.sql
-- Create table, indexes, and functions for search telemetry
```

## Integration Points

### Daily Digest Generation
The `getOrCreateDailyDigest` function in `/src/lib/digest.ts` now uses Z.ai to generate operational summaries based on:
- Onboarding submissions
- Pending ABN reviews
- Emergency triage logs
- Verification status
- Error counts

### Review Moderation
`moderatePendingReviews` function in `/src/lib/moderation.ts` logs AI decisions with confidence scores and reasoning.

### Emergency Triage
Emergency classification uses keyword-based logic but is ready for AI enhancement (Phase B).

## Cost & Usage Optimization

### Rate Limiting
- Default: 1 second minimum between calls
- Prevents accidental API spam
- Configurable via environment variables

### Token Limits
- Default max tokens: 1000
- Shorter prompts for daily operations
- Configurable per use case

### Retry Logic
- Exponential backoff: 1s, 2s, 4s between attempts
- Prevents API rate limit errors
- Graceful fallback to deterministic responses

## Error Handling

### Graceful Degradation
- When Z.ai API is unavailable: fallback to deterministic messages
- When configuration is missing: clear error messages
- When service role key missing: skip admin operations safely

### Logging
- All API calls logged with duration
- Errors logged with details
- Performance metrics captured for monitoring

## Testing

### Validation Endpoint
Test data consistency and distance calculations:
```bash
curl http://localhost:3005/api/validation/check-csv-enums
```

### Health Check
Test Z.ai API connectivity:
```bash
# From your application
await checkLLMHealth()
```

### LLM Test
Generate a test response:
```typescript
import { generateLLMResponseLimited } from '@/lib/llm'

const test = await generateLLMResponseLimited({
  userPrompt: 'Respond with "OK" only.',
  maxTokens: 10
})
console.log(test.text) // Should be "OK"
```

## Future Enhancements

### Phase B: AI Emergency Triage
- Replace keyword classifier with NLP
- Add free-text emergency description processing
- Measure and improve classification accuracy

### Phase C: Enhanced Review Moderation
- Auto-approve safe reviews with higher confidence
- Better explanation for decisions
- Dashboard with moderation metrics

### Phase F: DLQ/Replay Infrastructure
- Dead letter queue for failed LLM calls
- Replay mechanism for critical operations
- Batch processing for pending items

## Troubleshooting

### LLM Not Working
1. Check `ZAI_API_KEY` environment variable
2. Test API health: `await checkLLMHealth()`
3. Check network connectivity to api.z.ai
4. Verify token limits and retry logic

### Telemetry Not Appearing
1. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set
2. Check migration was applied: `20241208020000_search_telemetry.sql`
3. Verify database permissions for service role
4. Check API routes are returning 200 responses

### Errors in Admin Dashboard
1. Check admin dashboard latency card
2. Verify `/api/admin/latency` endpoint is reachable
3. Check Next.js server logs for API errors
4. Validate environment variables are loaded