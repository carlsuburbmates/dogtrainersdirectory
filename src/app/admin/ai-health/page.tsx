import { supabaseAdmin } from '@/lib/supabase'
import {
  describeModeSource,
  getAiAutomationOperatorControl,
  getAiAutomationModeResolutions,
  getAiAutomationVisibility,
  type AiAutomationModeResolution,
  type AiAutomationVisibility,
  type AiAutomationWorkflow
} from '@/lib/ai-automation'
import {
  normalizeDecisionSourceCounts,
  summarizeOnboardingHealth,
  summarizeModerationHealth,
  summarizeDigestHealth,
  summarizeTriageHealth,
  summarizeVerificationHealth,
  toAiPercentage
} from './model'

// Simple components without shadcn/ui for compatibility
type WithChildren = { children: React.ReactNode }
type WithChildrenAndClassName = { children: React.ReactNode; className?: string }

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}
function CardHeader({ children, className }: WithChildrenAndClassName) {
  return <div className={['border-b pb-2 mb-4', className].filter(Boolean).join(' ')}>{children}</div>
}
function CardTitle({ children, className }: WithChildrenAndClassName) {
  return <h2 className={['text-lg font-semibold', className].filter(Boolean).join(' ')}>{children}</h2>
}
function CardDescription({ children, className }: WithChildrenAndClassName) {
  return <p className={['text-sm text-gray-600', className].filter(Boolean).join(' ')}>{children}</p>
}
function CardContent({ children, className }: WithChildrenAndClassName) {
  return <div className={className}>{children}</div>
}

function Table({ children, className }: WithChildrenAndClassName) {
  return <table className={className}>{children}</table>
}
function TableHeader({ children }: WithChildren) {
  return <thead>{children}</thead>
}
function TableBody({ children }: WithChildren) {
  return <tbody>{children}</tbody>
}
function TableRow({ children, className }: WithChildrenAndClassName) {
  return <tr className={['border-b', className].filter(Boolean).join(' ')}>{children}</tr>
}
function TableHead({ children, className }: WithChildrenAndClassName) {
  return <th className={['text-left py-3 px-4 font-medium', className].filter(Boolean).join(' ')}>{children}</th>
}
function TableCell({ children, className }: WithChildrenAndClassName) {
  return <td className={['py-3 px-4', className].filter(Boolean).join(' ')}>{children}</td>
}

function Badge({ children, variant, className }: { children: React.ReactNode; variant?: string; className?: string }) {
  const base = 'inline-flex px-2 py-1 text-xs rounded-full'
  const variantMap: Record<string, string> = {
    default: 'bg-blue-100 text-blue-800',
    secondary: 'bg-gray-100 text-gray-800',
    outline: 'border border-gray-300 text-gray-700',
    destructive: 'bg-red-100 text-red-800'
  }
  return <span className={[base, variantMap[variant || 'default'], className].filter(Boolean).join(' ')}>{children}</span>
}

interface PipelineHealth {
  workflow: AiAutomationWorkflow
  pipeline: string
  mode: string
  overrideMode: string | null
  controlSource: string
  visibility: AiAutomationVisibility
  lastSuccess: string | null
  errors24h: number
  aiDecisions: number
  deterministicDecisions: number
  manualOverrides: number
  note?: string | null
}

async function getPipelineHealth(): Promise<PipelineHealth[]> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const llmConfigured = Boolean(process.env.ZAI_API_KEY)
  const resolutions = new Map(
    getAiAutomationModeResolutions().map((resolution) => [resolution.workflow, resolution])
  )

  const countByDecisionSource = async (table: string) => {
    const countFor = async (decisionSource: string) => {
      const { count, error } = await supabaseAdmin
        .from(table)
        .select('id', { count: 'exact', head: true })
        .gte('created_at', since)
        .eq('decision_source', decisionSource)

      return { count: count ?? 0, error }
    }

    const [llm, deterministic, manual, manualOverride] = await Promise.all([
      countFor('llm'),
      countFor('deterministic'),
      countFor('manual'),
      countFor('manual_override')
    ])

    const instrumented = !llm.error && !deterministic.error && !manual.error && !manualOverride.error
    if (!instrumented) {
      return {
        instrumented: false,
        counts: {
          aiDecisions: 0,
          deterministicDecisions: 0,
          manualOverrides: 0
        }
      }
    }

    return {
      instrumented: true,
      counts: normalizeDecisionSourceCounts({
        llm: llm.count,
        deterministic: deterministic.count,
        manual: manual.count,
        manualOverride: manualOverride.count
      })
    }
  }

  const lastAiSuccessFor = async (table: string) => {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select('created_at')
      .gte('created_at', since)
      .eq('decision_source', 'llm')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      return { instrumented: false, lastSuccess: null as string | null }
    }

    return {
      instrumented: true,
      lastSuccess: (data?.created_at as string | undefined) ?? null
    }
  }

  const lastActivityFor = async (table: string) => {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select('created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      return { instrumented: false, lastSuccess: null as string | null }
    }

    return {
      instrumented: true,
      lastSuccess: (data?.created_at as string | undefined) ?? null
    }
  }

  const toHealthRow = (
    workflow: AiAutomationWorkflow,
    pipeline: string,
    input: {
      lastSuccess: string | null
      aiDecisions?: number
      deterministicDecisions?: number
      manualOverrides?: number
      errors24h?: number
      note: string
      auditConnected?: boolean
    }
  ): PipelineHealth => {
    const resolution = resolutions.get(workflow) as AiAutomationModeResolution
    return {
      workflow,
      pipeline,
      mode: resolution.effectiveMode,
      overrideMode: resolution.overrideMode,
      controlSource: describeModeSource(resolution),
      visibility: getAiAutomationVisibility(resolution, {
        auditConnected: input.auditConnected,
        llmConfigured
      }),
      lastSuccess: input.lastSuccess,
      errors24h: input.errors24h ?? 0,
      aiDecisions: input.aiDecisions ?? 0,
      deterministicDecisions: input.deterministicDecisions ?? 0,
      manualOverrides: input.manualOverrides ?? 0,
      note: input.note
    }
  }

  const healthData: PipelineHealth[] = []

  const triageRows = await supabaseAdmin
    .from('emergency_triage_logs')
    .select('created_at, ai_mode, decision_source, classification, metadata')
    .gte('created_at', since)
    .order('created_at', { ascending: false })

  if (triageRows.error) {
    healthData.push(
      toHealthRow('triage', 'Emergency Triage', {
        lastSuccess: null,
        note: 'Triage audit trace counts are not available yet.',
        auditConnected: true
      })
    )
  } else {
    const triageSummary = summarizeTriageHealth(triageRows.data ?? [])
    healthData.push(
      toHealthRow('triage', 'Emergency Triage', {
        lastSuccess: triageSummary.lastTrace,
        aiDecisions: triageSummary.counts.aiDecisions,
        deterministicDecisions: triageSummary.counts.deterministicDecisions,
        manualOverrides: triageSummary.counts.manualOverrides,
        errors24h: triageSummary.shadowErrorCount,
        note: triageSummary.note,
        auditConnected: true
      })
    )
  }

  const moderationRows = await supabaseAdmin
    .from('ai_review_decisions')
    .select('created_at, decision_source')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
  const moderationControl = getAiAutomationOperatorControl('moderation')
  if (moderationRows.error) {
    healthData.push(
      toHealthRow('moderation', 'Review Moderation', {
        lastSuccess: null,
        note: 'Moderation audit traces are not available yet.',
        auditConnected: true
      })
    )
  } else {
    const moderationSummary = summarizeModerationHealth(moderationRows.data ?? [])
    healthData.push(
      toHealthRow('moderation', 'Review Moderation', {
        lastSuccess: moderationSummary.lastTrace,
        aiDecisions: moderationSummary.counts.aiDecisions,
        deterministicDecisions: moderationSummary.counts.deterministicDecisions,
        manualOverrides: moderationSummary.counts.manualOverrides,
        note: `${moderationSummary.note} Operator output: ${moderationControl?.outputLabel}. Rollback/disable: ${moderationControl?.rollbackLabel}`,
        auditConnected: true
      })
    )
  }

  const verificationRows = await supabaseAdmin
    .from('emergency_resource_verification_events')
    .select('created_at, details')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
  const verificationControl = getAiAutomationOperatorControl('verification')
  if (verificationRows.error) {
    healthData.push(
      toHealthRow('verification', 'Resource Verification', {
        lastSuccess: null,
        note: 'Verification audit traces are not available yet.',
        auditConnected: true
      })
    )
  } else {
    const verificationSummary = summarizeVerificationHealth(verificationRows.data ?? [])
    healthData.push(
      toHealthRow('verification', 'Resource Verification', {
        lastSuccess: verificationSummary.lastTrace,
        aiDecisions: verificationSummary.counts.aiDecisions,
        deterministicDecisions: verificationSummary.counts.deterministicDecisions,
        manualOverrides: verificationSummary.counts.manualOverrides,
        errors24h: verificationSummary.errorCount,
        note: `${verificationSummary.note} Rollback/disable: ${verificationControl?.rollbackLabel}`,
        auditConnected: true
      })
    )
  }

  const digestRows = await supabaseAdmin
    .from('daily_ops_digests')
    .select('created_at, ai_mode, decision_source, ci_summary')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
  const digestControl = getAiAutomationOperatorControl('ops_digest')
  if (digestRows.error) {
    healthData.push(
      toHealthRow('ops_digest', 'Ops Digest', {
        lastSuccess: null,
        note: 'Ops digest audit traces are not available yet.',
        auditConnected: true
      })
    )
  } else {
    const digestSummary = summarizeDigestHealth(digestRows.data ?? [])
    healthData.push(
      toHealthRow('ops_digest', 'Ops Digest', {
        lastSuccess: digestSummary.lastTrace,
        aiDecisions: digestSummary.counts.aiDecisions,
        deterministicDecisions: digestSummary.counts.deterministicDecisions,
        manualOverrides: digestSummary.counts.manualOverrides,
        errors24h: digestSummary.errorCount,
        note: `${digestSummary.note} Rollback/disable: ${digestControl?.rollbackLabel}`,
        auditConnected: true
      })
    )
  }

  const onboardingRows = await supabaseAdmin
    .from('latency_metrics')
    .select('created_at, metadata')
    .eq('area', 'onboarding_api')
    .eq('route', '/api/onboarding')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
  if (onboardingRows.error) {
    healthData.push(
      toHealthRow('onboarding', 'Business Onboarding', {
        lastSuccess: null,
        note: 'Onboarding shadow audit traces are not available yet.',
        auditConnected: true
      })
    )
  } else {
    const onboardingSummary = summarizeOnboardingHealth(onboardingRows.data ?? [])
    healthData.push(
      toHealthRow('onboarding', 'Business Onboarding', {
        lastSuccess: onboardingSummary.lastTrace,
        aiDecisions: onboardingSummary.counts.aiDecisions,
        deterministicDecisions: onboardingSummary.counts.deterministicDecisions,
        manualOverrides: onboardingSummary.counts.manualOverrides,
        errors24h: onboardingSummary.errorCount,
        note: onboardingSummary.note,
        auditConnected: true
      })
    )
  }

  return healthData
}

function formatTimeAgo(isoString: string | null): string {
  if (!isoString) return 'Never'
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

export default async function AIHealthPage() {
  const healthData = await getPipelineHealth()
  const workflowResolutions = getAiAutomationModeResolutions()
  const llmConfigured = Boolean(process.env.ZAI_API_KEY)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Health Monitor</h1>
        <p className="text-gray-600 mt-2">Last 24 hours of workflow traces, effective modes, and deterministic fallback visibility.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pipeline Status (Last 24h)</CardTitle>
          <CardDescription>Connected workflows show trace counts where instrumentation exists.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pipeline</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead>Last Trace</TableHead>
                <TableHead>24h Errors</TableHead>
                <TableHead>AI Decisions</TableHead>
                <TableHead>Deterministic</TableHead>
                <TableHead>Manual</TableHead>
                <TableHead>AI %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {healthData.map((row) => {
                const aiPercentage = toAiPercentage(row.aiDecisions, row.deterministicDecisions, row.manualOverrides)
                return (
                  <TableRow key={row.pipeline}>
                    <TableCell className="font-medium">{row.pipeline}</TableCell>
                    <TableCell>
                      <Badge variant={row.mode === 'live' ? 'default' : row.mode === 'shadow' ? 'secondary' : 'outline'}>
                        {row.mode}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          row.visibility.state === 'degraded'
                            ? 'destructive'
                            : row.visibility.state === 'not_connected'
                              ? 'outline'
                              : 'secondary'
                        }
                      >
                        {row.visibility.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{formatTimeAgo(row.lastSuccess)}</TableCell>
                    <TableCell>
                      <Badge variant={row.errors24h > 0 ? 'destructive' : 'outline'}>{row.errors24h}</Badge>
                    </TableCell>
                    <TableCell>{row.aiDecisions}</TableCell>
                    <TableCell>{row.deterministicDecisions}</TableCell>
                    <TableCell>{row.manualOverrides}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${aiPercentage}%` }} />
                        </div>
                        <span className="text-sm text-gray-600">{aiPercentage}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <div className="mt-4 text-xs text-gray-500 space-y-1">
            {healthData.filter((row) => row.note).map((row) => (
              <div key={`${row.pipeline}-note`}>
                <span className="font-medium">{row.pipeline}:</span> {row.note} {row.visibility.note}
              </div>
            ))}
            <div>
              <span className="font-medium">24h Errors:</span> Uses connected audit error counts where available. Other workflows remain 0 until instrumented.
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Mode Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Global Mode:</span>
              <Badge>{process.env.AI_GLOBAL_MODE || 'live'}</Badge>
            </div>
            {workflowResolutions.map((resolution) => {
              const visibility = getAiAutomationVisibility(resolution, {
                auditConnected: true,
                llmConfigured
              })

              return (
                <div
                  key={resolution.workflow}
                  className="rounded-md border border-gray-200 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{resolution.label}</span>
                    <Badge
                      variant={
                        resolution.effectiveMode === 'live'
                          ? 'default'
                          : resolution.effectiveMode === 'shadow'
                            ? 'secondary'
                            : 'outline'
                      }
                    >
                      {resolution.effectiveMode}
                    </Badge>
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-gray-600">
                    <div className="flex justify-between gap-3">
                      <span>Override</span>
                      <span>{resolution.overrideMode ?? '(using global)'}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span>Control source</span>
                      <span>{describeModeSource(resolution)}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span>Visibility</span>
                      <span>{visibility.label}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-600">Update env vars in Vercel and redeploy to change AI modes or trigger the kill switch.</p>
            <div className="pt-2 space-y-1 text-xs">
              <div><code className="bg-gray-100 px-1 rounded">AI_GLOBAL_MODE=disabled</code> - Programme-wide kill switch</div>
              <div><code className="bg-gray-100 px-1 rounded">AI_GLOBAL_MODE=shadow</code> - Record traces without changing final public or moderation outcomes</div>
              <div><code className="bg-gray-100 px-1 rounded">AI_GLOBAL_MODE=live</code> - Use the live workflow path where that workflow is already connected</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
