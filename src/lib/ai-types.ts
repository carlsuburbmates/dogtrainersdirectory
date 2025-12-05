export type LlmMode = 'disabled' | 'shadow' | 'live';

export type DecisionSource = 'llm' | 'deterministic' | 'manual_override';

export type LlmPipeline = 'triage' | 'ops_digest' | 'verification' | 'moderation' | 'other';

export interface LlmCallContext {
  pipeline: LlmPipeline;
  promptVersion: string;
  mode?: LlmMode; // Optional override, otherwise resolved from env
}

export interface LlmResultMeta {
  llmProvider: string; // 'zai' | 'openai' | 'anthropic' | 'unknown'
  model: string;
  mode: LlmMode;
  promptVersion: string;
}

export interface LlmResult<T = unknown> {
  ok: boolean;
  data: T | null;
  error?: { type: string; message: string };
  usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
  meta: LlmResultMeta;
}
