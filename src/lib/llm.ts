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
}

export interface LlmResult {
  ok: boolean;
  provider: LlmProvider;
  model: string | null;
  text: string | null;
  json: unknown | null;
  raw: unknown;
  reason?: "ai_disabled" | "error";
  errorMessage?: string;
}

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

export async function callLlm(
  options: CallLlmOptions
): Promise<LlmResult> {
  const responseFormat: LlmResponseFormat =
    options.responseFormat || "text";

  const messages: LlmMessage[] =
    options.messages && options.messages.length > 0
      ? options.messages
      : buildMessages(options.systemPrompt, options.userPrompt);

  if (provider === "zai") {
    if (!ZAI_API_KEY) {
      return {
        ok: false,
        provider: "zai",
        model: null,
        text: null,
        json: null,
        raw: null,
        reason: "ai_disabled",
        errorMessage: "ZAI_API_KEY is not set. AI is disabled for Z.AI provider.",
      };
    }
    return callZai({
      ...options,
      messages,
      responseFormat,
      model: options.model || ZAI_DEFAULT_MODEL,
    });
  }

  // provider === "openai"
  if (!OPENAI_API_KEY) {
    return {
      ok: false,
      provider: "openai",
      model: null,
      text: null,
      json: null,
      raw: null,
      reason: "ai_disabled",
      errorMessage: "OPENAI_API_KEY is not set. AI is disabled for OpenAI provider.",
    };
  }

  return callOpenAi({
    ...options,
    messages,
    responseFormat,
    model: options.model || OPENAI_MODEL_ID,
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
  }
): Promise<LlmResult> {
  try {
    const body: any = {
      model: options.model,
      messages: options.messages,
      temperature:
        typeof options.temperature === "number"
          ? options.temperature
          : 0,
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
      const message =
        (raw && (raw.error?.message || raw.message)) ||
        `Z.AI API error (status ${res.status})`;
      console.error("[Z.AI] API error:", message, raw);
      return {
        ok: false,
        provider: "zai",
        model: options.model,
        text: null,
        json: null,
        raw,
        reason: "error",
        errorMessage: message,
      };
    }

    const choice = raw?.choices?.[0];
    const content: string =
      choice?.message?.content ?? "";

    let json: unknown = null;
    if (options.responseFormat === "json" && content) {
      try {
        const cleaned = cleanJsonContent(content)
        json = JSON.parse(cleaned);
      } catch (e) {
        console.error("[Z.AI] Failed to parse JSON output:", e);
        return {
          ok: false,
          provider: "zai",
          model: options.model,
          text: content,
          json: null,
          raw,
          reason: "error",
          errorMessage: "Failed to parse JSON from LLM response.",
        };
      }
    }

    return {
      ok: true,
      provider: "zai",
      model: options.model,
      text: options.responseFormat === "text" ? content : null,
      json: options.responseFormat === "json" ? json : null,
      raw,
    };
  } catch (err: any) {
    console.error("[Z.AI] call failed:", err);
    return {
      ok: false,
      provider: "zai",
      model: options.model,
      text: null,
      json: null,
      raw: null,
      reason: "error",
      errorMessage: err?.message || "Unknown error",
    };
  }
}

async function callOpenAi(
  options: CallLlmOptions & {
    messages: LlmMessage[];
    responseFormat: LlmResponseFormat;
    model: string;
  }
): Promise<LlmResult> {
  try {
    const body: any = {
      model: options.model,
      messages: options.messages,
      temperature:
        typeof options.temperature === "number"
          ? options.temperature
          : 0,
    };

    if (options.maxTokens && options.maxTokens > 0) {
      body.max_tokens = options.maxTokens;
    }

    // Rely on prompt instructions for JSON output with OpenAI — do not set a provider-specific response_format field for OpenAI to avoid incompatibilities.

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
      const message =
        (raw && (raw.error?.message || raw.message)) ||
        `OpenAI API error (status ${res.status})`;
      console.error("[OpenAI] API error:", message, raw);
      return {
        ok: false,
        provider: "openai",
        model: options.model,
        text: null,
        json: null,
        raw,
        reason: "error",
        errorMessage: message,
      };
    }

    const choice = raw?.choices?.[0];
    const content: string =
      choice?.message?.content ?? "";

    let json: unknown = null;
    if (options.responseFormat === "json" && content) {
      try {
        const cleaned = cleanJsonContent(content)
        json = JSON.parse(cleaned);
      } catch (e) {
        console.error("[OpenAI] Failed to parse JSON output:", e);
        return {
          ok: false,
          provider: "openai",
          model: options.model,
          text: content,
          json: null,
          raw,
          reason: "error",
          errorMessage: "Failed to parse JSON from LLM response.",
        };
      }
    }

    return {
      ok: true,
      provider: "openai",
      model: options.model,
      text: options.responseFormat === "text" ? content : null,
      json: options.responseFormat === "json" ? json : null,
      raw,
    };
  } catch (err: any) {
    console.error("[OpenAI] call failed:", err);
    return {
      ok: false,
      provider: "openai",
      model: options.model,
      text: null,
      json: null,
      raw: null,
      reason: "error",
      errorMessage: err?.message || "Unknown error",
    };
  }
}
