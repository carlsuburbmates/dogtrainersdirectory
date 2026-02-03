import { supabaseAdmin } from '@/lib/supabase'
import { LlmPipeline } from '@/lib/ai-types'

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
  const pipelines: { name: string; dbPipeline: string }[] = [
    { name: 'Emergency Triage', dbPipeline: 'triage' },
    { name: 'Review Moderation', dbPipeline: 'moderation' },
    { name: 'Resource Verification', dbPipeline: 'verification' },
    { name: 'Ops Digest', dbPipeline: 'ops_digest' }
  ]

  const healthData: PipelineHealth[] = []

  for (const { name, dbPipeline } of pipelines) {
    const mode = resolveLlmMode(dbPipeline)

    // Placeholder counts; real impl would query per-pipeline tables
    healthData.push({
      pipeline: name,
      mode,
      lastSuccess: null,
      errors24h: 0,
      aiDecisions: 0,
      deterministicDecisions: 0,
      manualOverrides: 0
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
        <p className="text-gray-600 mt-2">Real-time status of AI pipelines and decision sources</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pipeline Status (Last 24h)</CardTitle>
          <CardDescription>AI vs deterministic breakdown</CardDescription>
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
