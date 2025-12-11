import { AiHealthDashboard } from '@/components/admin/AiHealthDashboard'

export default function AiHealthPage() {
  const provider = process.env.LLM_PROVIDER || 'zai'
  const baseUrl = process.env.ZAI_BASE_URL || 'https://api.z.ai/v1/chat/completions'
  const model = process.env.LLM_DEFAULT_MODEL || 'glm-4.6'

  return (
    <AiHealthDashboard
      providerName={provider}
      baseUrl={baseUrl}
      model={model}
      initialRefreshMs={60000}
    />
  )
}
