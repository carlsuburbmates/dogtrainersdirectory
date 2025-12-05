/*
Unified LLM adapter for the app.
Supports provider selection (Z.AI primary, OpenAI optional backup), consistent result shape,
and graceful handling of missing API keys (ai_disabled).

Usage: import { callLlm } from '@/lib/llm' and call with { purpose, systemPrompt, userPrompt, responseFormat }
*/

type LlmProvider = "zai" | "openai";

export type LlmPurpose =
  | "ops_digest"
  | "triage"
  | "moderation"
  | "scraper_qa"
  | "abn_ocr"
  | "generic";

export type LlmResponseFormat = "text" | "json";

export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CallLlmOptions {
  purpose: LlmPurpose;
  systemPrompt?: string;
  userPrompt?: string;
  messages?: LlmMessage[];
  responseFormat?: LlmResponseFormat;
  temperature?: number;
  maxTokens?: number;
  model?: string;
  // New context for observability
  context?: LlmCallContext;
}

// ... (keep LlmResult import from above)

const provider: LlmProvider =
  (process.env.LLM_PROVIDER as LlmProvider) || "zai";

// Z.AI config (general API)
const ZAI_BASE_URL =
  process.env.ZAI_BASE_URL || "https://api.z.ai/api/paas/v4";
const ZAI_API_KEY = process.env.ZAI_API_KEY || "";
const ZAI_DEFAULT_MODEL = process.env.LLM_DEFAULT_MODEL || "glm-4.5-air";

// OpenAI config (optional backup)
const OPENAI_BASE_URL =
  process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL_ID =
  process.env.OPENAI_MODEL_ID || "gpt-4.1-mini";

export function isAiEnabled(): boolean {
  const providerEnv = (process.env.LLM_PROVIDER as LlmProvider) || 'zai'
  if (providerEnv === 'zai') return Boolean(process.env.ZAI_API_KEY)
  return Boolean(process.env.OPENAI_API_KEY)
}

import {
  LlmMode as AiMode,
  LlmPipeline,
  LlmCallContext,
  LlmResult
} from './ai-types';

export type { LlmMode as AiMode, LlmResult } from './ai-types';

// The Standardized Fallback Contract for consumers (as per User Step 2.3)
export interface AiResult<T> {
  action: T;
  reason: string;
  source: "heuristic" | "llm" | "manual";
  confidence: number;
  is_shadow_mode: boolean;
  // Included for logging purposes (will be flattened into DB columns)
  llm_log?: {
    provider: string;
    model: string | null;
    raw: unknown;
    text: string | null;
    json: unknown | null;
    latency_ms: number;
    success: boolean;
    promptVersion?: string;
    mode?: AiMode;
  };
  // Explicit metadata for DB logging
  meta?: {
    llmProvider: string;
    model: string;
    mode: AiMode;
    promptVersion: string;
  };
}

export interface AiOperationOptions<T> {
  purpose: LlmPurpose;
  mode?: AiMode; // Optional override, otherwise derived from env
  llmArgs: Omit<CallLlmOptions, "purpose">; // Purpose inherited
  // The deterministic fallback logic
  heuristicActions: () => Promise<{ action: T; confidence: number; reason: string }>;
  // Validates and maps LLM result to T. Return null if invalid/low confidence.
  validator: (llmResult: LlmResult) => { action: T; confidence: number; reason: string } | null;
}

export function resolveLlmMode(pipeline: LlmPipeline): AiMode {
  // 1. Check specific pipeline mode first
  const envKey = `${pipeline.toUpperCase()}_AI_MODE`;
  const pipelineMode = process.env[envKey] as AiMode | undefined;
  
  if (pipelineMode && ['live', 'shadow', 'disabled'].includes(pipelineMode)) {
    return pipelineMode;
  }

  // 2. Check global mode
  const globalMode = process.env.AI_GLOBAL_MODE as AiMode | undefined;
  if (globalMode && ['live', 'shadow', 'disabled'].includes(globalMode)) {
    return globalMode;
  }

  // 3. Backward compatibility: check old boolean (deprecated)
  if (process.env.AI_GLOBAL_DISABLED === "true") {
    return "disabled";
  }

  // 4. Default safe state
  return "disabled";
}

export function getAiMode(purpose: LlmPurpose): AiMode {
    // Map LlmPurpose to LlmPipeline where they differ, or cast if they match
    // Currently purposes are: ops_digest, triage, moderation, etc.
    // LlmPipeline are: triage, ops_digest, verification, moderation, other
    // They mostly match. 
    const pipeline = purpose as unknown as LlmPipeline; 
    return resolveLlmMode(pipeline);
}

export async function runAiOperation<T>(
  options: AiOperationOptions<T>
): Promise<AiResult<T>> {
  const mode = options.mode || getAiMode(options.purpose);
  const start = Date.now();

  // 1. Helper to run heuristic fallback
  const runHeuristic = async (): Promise<AiResult<T>> => {
    try {
      const h = await options.heuristicActions();
      return {
        action: h.action,
        reason: h.reason,
        source: "heuristic",
        confidence: h.confidence,
        is_shadow_mode: mode === "shadow",
      };
    } catch (err) {
      console.error(`[AI] Heuristic fallback failed for ${options.purpose}`, err);
      throw err; // If heuristic fails, we essentially have a system failure
    }
  };

  // 2. Helper to run LLM
  const runLlm = async (): Promise<{
    result: AiResult<T> | null;
    log: AiResult<T>["llm_log"];
  }> => {
    try {
      const llmResult = await callLlm({
        ...options.llmArgs,
        purpose: options.purpose,
        // Inherit context if available or derive from purpose
        context: {
             pipeline: options.purpose as unknown as LlmPipeline, // Map roughly
             promptVersion: 'v1',
             mode
        }
      });
      const latency = Date.now() - start;

      const log = {
        provider: llmResult.meta.llmProvider,
        model: llmResult.meta.model,
        raw: llmResult.data, // or raw if we had it, but data is close enough
        text: typeof llmResult.data === 'string' ? llmResult.data : JSON.stringify(llmResult.data),
        json: typeof llmResult.data === 'object' ? llmResult.data : null,
        latency_ms: latency,
        success: llmResult.ok,
        promptVersion: llmResult.meta.promptVersion,
        mode: llmResult.meta.mode
      };

      if (!llmResult.ok) return { result: null, log };

      // Validator expects LlmResult but we need to ensure it knows how to handle the new structure
      // OR we adopt the new structure in validator too.
      // Based on types, validator takes LlmResult. 
      const validated = options.validator(llmResult);
      if (!validated) return { result: null, log };

      return {
        result: {
          action: validated.action,
          reason: validated.reason,
          source: "llm",
          confidence: validated.confidence,
          is_shadow_mode: false,
          llm_log: log,
          meta: {
            llmProvider: llmResult.meta.llmProvider,
            model: llmResult.meta.model,
            mode: llmResult.meta.mode,
            promptVersion: llmResult.meta.promptVersion
          }
        },
        log,
      };
    } catch (err) {
      return {
        result: null,
        log: {
          provider: "unknown",
          model: null,
          raw: null,
          text: null,
          json: null,
          latency_ms: Date.now() - start,
          success: false,
          promptVersion: 'v1',
          mode
        },
      };
    }
  };

  // 3. Execution Logic
  if (mode === "disabled") {
    return runHeuristic();
  }

  if (mode === "shadow") {
    const [heuristicResult, llmOutcome] = await Promise.all([
      runHeuristic(),
      runLlm().catch(() => null), // Swallow LLM errors in shadow mode to protect main flow
    ]);
    
    // Attach LLM log to heuristic result for observability
    if (llmOutcome?.log) {
      heuristicResult.llm_log = llmOutcome.log;
    }
    
    return heuristicResult;
  }

  // mode === 'live'
  try {
    const { result, log } = await runLlm();
    if (result) return result;
    
    // LLM failed or low confidence -> Fallback
    const fallback = await runHeuristic();
    fallback.llm_log = log; // Keep the log of why LLM wasn't used
    return fallback;
  } catch (err) {
    const fallback = await runHeuristic();
    return fallback;
  }
}

// Low-level primitive (exports callOpenAi, callZai, etc kept below)
export async function callLlm(
  options: CallLlmOptions
): Promise<LlmResult> {
  const responseFormat: LlmResponseFormat =
    options.responseFormat || "text";

  const context = options.context || { pipeline: 'other' as LlmPipeline, promptVersion: 'unknown' };
  const mode = context.mode || resolveLlmMode(context.pipeline);

  // 1. Check if AI is disabled via mode
  if (mode === 'disabled') {
     return {
        ok: false,
        data: null,
        error: { type: 'disabled', message: 'AI is disabled by configuration (mode=disabled)' },
        meta: {
           llmProvider: 'unknown',
           model: options.model || 'unknown',
           mode: 'disabled',
           promptVersion: context.promptVersion
        }
     };
  }

  const messages: LlmMessage[] =
    options.messages && options.messages.length > 0
      ? options.messages
      : buildMessages(options.systemPrompt, options.userPrompt);

  // 2. Select Provider
  if (provider === "zai") {
    if (!ZAI_API_KEY) {
      return {
        ok: false,
        data: null,
        error: { type: 'config_error', message: 'ZAI_API_KEY is not set' },
        meta: {
           llmProvider: 'zai',
           model: options.model || ZAI_DEFAULT_MODEL,
           mode: mode,
           promptVersion: context.promptVersion
        }
      };
    }
    return callZai({
      ...options,
      messages,
      responseFormat,
      model: options.model || ZAI_DEFAULT_MODEL,
      context: { ...context, mode }
    });
  }

  // provider === "openai"
  if (!OPENAI_API_KEY) {
    return {
      ok: false,
      data: null,
      error: { type: 'config_error', message: 'OPENAI_API_KEY is not set' },
      meta: {
           llmProvider: 'openai',
           model: options.model || OPENAI_MODEL_ID,
           mode: mode,
           promptVersion: context.promptVersion
        }
    };
  }

  return callOpenAi({
    ...options,
    messages,
    responseFormat,
    model: options.model || OPENAI_MODEL_ID,
    context: { ...context, mode }
  });
}

function buildMessages(
  systemPrompt?: string,
  userPrompt?: string
): LlmMessage[] {
  const msgs: LlmMessage[] = [];
  if (systemPrompt && systemPrompt.trim().length > 0) {
    msgs.push({ role: "system", content: systemPrompt });
  }
  if (userPrompt && userPrompt.trim().length > 0) {
    msgs.push({ role: "user", content: userPrompt });
  }
  return msgs;
}

function cleanJsonContent(raw: string) {
  if (!raw || typeof raw !== 'string') return raw
  let s = raw.trim()
  // strip triple-backtick fences with optional language hint
  s = s.replace(/^```json\s*/i, '')
  s = s.replace(/\s*```$/i, '')
  // strip generic code fences
  s = s.replace(/^```\s*/i, '')
  s = s.replace(/\s*```$/i, '')

  // remove a simple English prefix like "Here is the JSON:" or "Sure — here's the JSON:" etc.
  s = s.replace(/^\w[\w\s,-.:;]*\bjson:?\s*/i, (match) => {
    // If the match contains { or [, it's probably not a simple prefix — keep as-is
    if (match.includes('{') || match.includes('[')) return match
    return ''
  })

  return s.trim()
}

async function callZai(
  options: CallLlmOptions & {
    messages: LlmMessage[];
    responseFormat: LlmResponseFormat;
    model: string;
    context: LlmCallContext; // Ensure context is passed
  }
): Promise<LlmResult> {
    const { model, context } = options;
    const mode = context.mode || 'live'; // Should be resolved by now

  try {
    const body: any = {
      model: options.model,
      messages: options.messages,
      temperature: typeof options.temperature === "number" ? options.temperature : 0,
    };

    if (options.maxTokens && options.maxTokens > 0) {
      body.max_tokens = options.maxTokens;
    }

    if (options.responseFormat === "json") {
      body.response_format = { type: "json_object" };
    }

    const res = await fetch(
      `${ZAI_BASE_URL.replace(/\/$/, "")}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ZAI_API_KEY}`,
        },
        body: JSON.stringify(body),
      }
    );

    const raw = await res.json().catch(() => null);

    if (!res.ok) {
      const message = (raw && (raw.error?.message || raw.message)) || `Z.AI API error (status ${res.status})`;
      console.error("[Z.AI] API error:", message, raw);
      return {
        ok: false,
        data: null,
        error: { type: 'provider_error', message },
        meta: { llmProvider: 'zai', model, mode, promptVersion: context.promptVersion }
      };
    }

    const choice = raw?.choices?.[0];
    const content: string = choice?.message?.content ?? "";

    let data: unknown = content;
    if (options.responseFormat === "json" && content) {
      try {
        const cleaned = cleanJsonContent(content)
        data = JSON.parse(cleaned);
      } catch (e) {
        console.error("[Z.AI] Failed to parse JSON output:", e);
        return {
            ok: false,
            data: null,
            error: { type: 'parse_error', message: 'Failed to parse JSON' },
             meta: { llmProvider: 'zai', model, mode, promptVersion: context.promptVersion }
        };
      }
    }

    return {
      ok: true,
      data,
      meta: { llmProvider: 'zai', model, mode, promptVersion: context.promptVersion }
    };
  } catch (err: any) {
    console.error("[Z.AI] call failed:", err);
    return {
        ok: false,
        data: null,
        error: { type: 'network_error', message: err?.message || "Unknown error" },
        meta: { llmProvider: 'zai', model, mode, promptVersion: context.promptVersion }
    };
  }
}

async function callOpenAi(
  options: CallLlmOptions & {
    messages: LlmMessage[];
    responseFormat: LlmResponseFormat;
    model: string;
    context: LlmCallContext;
  }
): Promise<LlmResult> {
  const { model, context } = options;
  const mode = context.mode || 'live';

  try {
    const body: any = {
      model: options.model,
      messages: options.messages,
      temperature: typeof options.temperature === "number" ? options.temperature : 0,
    };

    if (options.maxTokens && options.maxTokens > 0) {
      body.max_tokens = options.maxTokens;
    }

    const res = await fetch(
      `${OPENAI_BASE_URL.replace(/\/$/, "")}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify(body),
      }
    );

    const raw = await res.json().catch(() => null);

    if (!res.ok) {
        const message = (raw && (raw.error?.message || raw.message)) || `OpenAI API error (status ${res.status})`;
        console.error("[OpenAI] API error:", message, raw);
        return {
            ok: false,
            data: null,
            error: { type: 'provider_error', message },
            meta: { llmProvider: 'openai', model, mode, promptVersion: context.promptVersion }
        };
    }

    const choice = raw?.choices?.[0];
    const content: string = choice?.message?.content ?? "";

    let data: unknown = content;
    if (options.responseFormat === "json" && content) {
      try {
        const cleaned = cleanJsonContent(content)
        data = JSON.parse(cleaned);
      } catch (e) {
        console.error("[OpenAI] Failed to parse JSON output:", e);
        return {
            ok: false,
            data: null,
            error: { type: 'parse_error', message: 'Failed to parse JSON' },
             meta: { llmProvider: 'openai', model, mode, promptVersion: context.promptVersion }
        };
      }
    }

    return {
        ok: true,
        data,
         meta: { llmProvider: 'openai', model, mode, promptVersion: context.promptVersion }
    };
  } catch (err: any) {
    console.error("[OpenAI] call failed:", err);
    return {
        ok: false,
        data: null,
        error: { type: 'network_error', message: err?.message || "Unknown error" },
        meta: { llmProvider: 'openai', model, mode, promptVersion: context.promptVersion }
    };
  }
}

