import { supabaseAdmin } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { resolveLlmMode } from '@/lib/llm'
import type { LlmPipeline } from '@/lib/ai-types'

interface PipelineHealth {
  pipeline: string
  mode: string
  lastSuccess: string | null
  errors24h: number
  aiDecisions: number
  deterministicDecisions: number
  manualOverrides: number
}

async function getPipelineHealth(): Promise<PipelineHealth[]> {
  const pipelines: { name: string; dbPipeline: LlmPipeline }[] = [
    { name: 'Emergency Triage', dbPipeline: 'triage' },
    { name: 'Review Moderation', dbPipeline: 'moderation' },
    { name: 'Resource Verification', dbPipeline: 'verification' },
    { name: 'Ops Digest', dbPipeline: 'ops_digest' }
  ]

  const healthData: PipelineHealth[] = []

  for (const { name, dbPipeline } of pipelines) {
    const mode = resolveLlmMode(dbPipeline)

    // Get decision counts based on pipeline
    let aiDecisions = 0
    let deterministicDecisions = 0
    let manualOverrides = 0
    let lastSuccess: string | null = null

    if (dbPipeline === 'triage') {
      const { data } = await supabaseAdmin
        .from('emergency_triage_logs')
        .select('decision_source, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })

      aiDecisions = data?.filter(d => d.decision_source === 'llm').length || 0
      deterministicDecisions = data?.filter(d => d.decision_source === 'deterministic').length || 0
      manualOverrides = data?.filter(d => d.decision_source === 'manual_override').length || 0
      
      const lastAi = data?.find(d => d.decision_source === 'llm')
      lastSuccess = lastAi?.created_at || null
    } else if (dbPipeline === 'moderation') {
      const { data } = await supabaseAdmin
        .from('ai_review_decisions')
        .select('decision_source, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })

      aiDecisions = data?.filter(d => d.decision_source === 'llm').length || 0
      deterministicDecisions = data?.filter(d => d.decision_source === 'deterministic').length || 0
      manualOverrides = data?.filter(d => d.decision_source === 'manual_override').length || 0
      
      const lastAi = data?.find(d => d.decision_source === 'llm')
      lastSuccess = lastAi?.created_at || null
    } else if (dbPipeline === 'ops_digest') {
      const { data } = await supabaseAdmin
        .from('daily_ops_digests')
        .select('decision_source, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })

      aiDecisions = data?.filter(d => d.decision_source === 'llm').length || 0
      deterministicDecisions = data?.filter(d => d.decision_source === 'deterministic').length || 0
      
      const lastAi = data?.find(d => d.decision_source === 'llm')
      lastSuccess = lastAi?.created_at || null
    }

    // TODO: Get actual error counts from logs (would need error logging table)
    const errors24h = 0

    healthData.push({
      pipeline: name,
      mode,
      lastSuccess,
      errors24h,
      aiDecisions,
      deterministicDecisions,
      manualOverrides
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
        <p className="text-muted-foreground mt-2">
          Real-time status of all AI pipelines, decision sources, and error rates
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pipeline Status (Last 24h)</CardTitle>
          <CardDescription>
            AI vs deterministic decision breakdown and health metrics
          </CardDescription>
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
                      <Badge
                        variant={
                          row.mode === 'live' ? 'default' :
                          row.mode === 'shadow' ? 'secondary' :
                          'outline'
                        }
                      >
                        {row.mode}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatTimeAgo(row.lastSuccess)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.errors24h > 0 ? 'destructive' : 'outline'}>
                        {row.errors24h}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.aiDecisions}</TableCell>
                    <TableCell>{row.deterministicDecisions}</TableCell>
                    <TableCell>{row.manualOverrides}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${aiPercentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">{aiPercentage}%</span>
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
              <span className="text-muted-foreground">Global Mode:</span>
              <Badge>{process.env.AI_GLOBAL_MODE || 'live'}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Triage Override:</span>
              <span>{process.env.TRIAGE_AI_MODE || '(using global)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Moderation Override:</span>
              <span>{process.env.MODERATION_AI_MODE || '(using global)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Verification Override:</span>
              <span>{process.env.VERIFICATION_AI_MODE || '(using global)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Digest Override:</span>
              <span>{process.env.DIGEST_AI_MODE || '(using global)'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              To change AI modes, update environment variables in Vercel dashboard and redeploy.
            </p>
            <div className="pt-2 space-y-1 text-xs">
              <div><code className="bg-gray-100 px-1 rounded">AI_GLOBAL_MODE=disabled</code> - Emergency kill-switch</div>
              <div><code className="bg-gray-100 px-1 rounded">AI_GLOBAL_MODE=shadow</code> - Test mode (log only)</div>
              <div><code className="bg-gray-100 px-1 rounded">AI_GLOBAL_MODE=live</code> - Full automation</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
