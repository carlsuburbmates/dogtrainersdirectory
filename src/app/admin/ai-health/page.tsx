import { supabaseAdmin } from '@/lib/supabase'

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
  const base = "inline-flex px-2 py-1 text-xs rounded-full"
  const variantMap: Record<string, string> = {
    default: "bg-blue-100 text-blue-800",
    secondary: "bg-gray-100 text-gray-800",
    outline: "border border-gray-300 text-gray-700",
    destructive: "bg-red-100 text-red-800"
  }
  return <span className={[base, variantMap[variant || 'default'], className].filter(Boolean).join(' ')}>{children}</span>
}

interface PipelineHealth {
  pipeline: string
  mode: string
  lastSuccess: string | null
  errors24h: number
  aiDecisions: number
  deterministicDecisions: number
  manualOverrides: number
  note?: string | null
}

function resolveLlmMode(pipeline: string): string {
  const globalMode = process.env.AI_GLOBAL_MODE || 'live'
  const pipelineVars: Record<string, string | undefined> = {
    triage: process.env.TRIAGE_AI_MODE,
    moderation: process.env.MODERATION_AI_MODE,
    verification: process.env.VERIFICATION_AI_MODE,
    ops_digest: process.env.DIGEST_AI_MODE
  }
  const pipelineOverride = pipelineVars[pipeline]
  return pipelineOverride || globalMode
}

async function getPipelineHealth(): Promise<PipelineHealth[]> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const countByDecisionSource = async (table: string) => {
    const countFor = async (decisionSource: string) => {
      const { count } = await supabaseAdmin
        .from(table)
        .select('id', { count: 'exact', head: true })
        .gte('created_at', since)
        .eq('decision_source', decisionSource)
      return count ?? 0
    }

    const [llm, deterministic, manual] = await Promise.all([
      countFor('llm'),
      countFor('deterministic'),
      countFor('manual')
    ])

    return { llm, deterministic, manual }
  }

  const lastAiSuccessFor = async (table: string) => {
    const { data } = await supabaseAdmin
      .from(table)
      .select('created_at')
      .gte('created_at', since)
      .eq('decision_source', 'llm')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    return (data?.created_at as string | undefined) ?? null
  }

  const pipelines: { name: string; dbPipeline: string }[] = [
    { name: 'Emergency Triage', dbPipeline: 'triage' },
    { name: 'Review Moderation', dbPipeline: 'moderation' },
    { name: 'Resource Verification', dbPipeline: 'verification' },
    { name: 'Ops Digest', dbPipeline: 'ops_digest' }
  ]

  const healthData: PipelineHealth[] = []

  for (const { name, dbPipeline } of pipelines) {
    const mode = resolveLlmMode(dbPipeline)

    if (dbPipeline === 'triage') {
      const counts = await countByDecisionSource('emergency_triage_logs')
      healthData.push({
        pipeline: name,
        mode,
        lastSuccess: await lastAiSuccessFor('emergency_triage_logs'),
        errors24h: 0,
        aiDecisions: counts.llm,
        deterministicDecisions: counts.deterministic,
        manualOverrides: counts.manual,
        note: 'Counts from emergency_triage_logs (last 24h).'
      })
      continue
    }

    if (dbPipeline === 'moderation') {
      const counts = await countByDecisionSource('ai_review_decisions')
      healthData.push({
        pipeline: name,
        mode,
        lastSuccess: await lastAiSuccessFor('ai_review_decisions'),
        errors24h: 0,
        aiDecisions: counts.llm,
        deterministicDecisions: counts.deterministic,
        manualOverrides: counts.manual,
        note: 'Counts from ai_review_decisions (last 24h).'
      })
      continue
    }

    healthData.push({
      pipeline: name,
      mode,
      lastSuccess: null,
      errors24h: 0,
      aiDecisions: 0,
      deterministicDecisions: 0,
      manualOverrides: 0,
      note: 'Not instrumented yet.'
    })
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Health Monitor</h1>
        <p className="text-gray-600 mt-2">Last 24 hours of AI vs deterministic decisions (where instrumentation exists)</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pipeline Status (Last 24h)</CardTitle>
          <CardDescription>AI vs deterministic breakdown (some pipelines are not instrumented yet)</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pipeline</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Last AI Success</TableHead>
                <TableHead>24h Errors</TableHead>
                <TableHead>AI Decisions</TableHead>
                <TableHead>Deterministic</TableHead>
                <TableHead>Manual</TableHead>
                <TableHead>AI %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {healthData.map((row) => {
                const total = row.aiDecisions + row.deterministicDecisions + row.manualOverrides
                const aiPercentage = total > 0 ? Math.round((row.aiDecisions / total) * 100) : 0
                return (
                  <TableRow key={row.pipeline}>
                    <TableCell className="font-medium">{row.pipeline}</TableCell>
                    <TableCell>
                      <Badge variant={row.mode === 'live' ? 'default' : row.mode === 'shadow' ? 'secondary' : 'outline'}>
                        {row.mode}
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
                <span className="font-medium">{row.pipeline}:</span> {row.note}
              </div>
            ))}
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
            <div className="flex justify-between"><span className="text-gray-600">Triage Override:</span><span>{process.env.TRIAGE_AI_MODE || '(using global)'}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Moderation Override:</span><span>{process.env.MODERATION_AI_MODE || '(using global)'}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Verification Override:</span><span>{process.env.VERIFICATION_AI_MODE || '(using global)'}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Digest Override:</span><span>{process.env.DIGEST_AI_MODE || '(using global)'}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-600">Update env vars in Vercel and redeploy to change AI modes.</p>
            <div className="pt-2 space-y-1 text-xs">
              <div><code className="bg-gray-100 px-1 rounded">AI_GLOBAL_MODE=disabled</code> - Kill switch</div>
              <div><code className="bg-gray-100 px-1 rounded">AI_GLOBAL_MODE=shadow</code> - Log-only</div>
              <div><code className="bg-gray-100 px-1 rounded">AI_GLOBAL_MODE=live</code> - Full automation</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
