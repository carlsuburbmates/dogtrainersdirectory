// Temporary placeholder llm.ts - to be implemented properly later
export interface LlmResponse {
  text: string
  model?: string | null
  provider?: string | null
}

export async function generateLLMResponse({
  systemPrompt,
  userPrompt
}: {
  systemPrompt?: string
  userPrompt: string
}): Promise<LlmResponse> {
  // Placeholder implementation - will be replaced with real LLM logic
  return {
    text: `AI generated response based on prompt: ${userPrompt.slice(0, 100)}...`,
    model: 'placeholder-model',
    provider: 'placeholder-provider'
  }
}

export function resolveLlmMode(pipeline: string): string {
  const globalMode = process.env.AI_GLOBAL_MODE || 'live'
  const pipelineVars = {
    triage: process.env.TRIAGE_AI_MODE,
    moderation: process.env.MODERATION_AI_MODE,
    verification: process.env.VERIFICATION_AI_MODE,
    digest: process.env.DIGEST_AI_MODE,
    ops_digest: process.env.DIGEST_AI_MODE
  }
  const pipelineOverride = pipelineVars[pipeline as keyof typeof pipelineVars]
  return pipelineOverride || globalMode
}

export type LlmPipeline = 'triage' | 'moderation' | 'verification' | 'ops_digest'