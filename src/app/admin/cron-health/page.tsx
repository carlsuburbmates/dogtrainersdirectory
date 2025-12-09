import { supabaseAdmin } from '@/lib/supabase'
// Simple components without shadcnUI for compatibility
import Link from 'next/link'

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}
function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="border-b pb-2 mb-4">{children}</div>
}
function CardTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold">{children}</h2>
}
function CardDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-600">{children}</p>
}
function CardContent({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}

function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return <table className={className}>{children}</table>
}
function TableHeader({ children }: { children: React.ReactNode }) {
  return <thead>{children}</thead>
}
function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>
}
function TableRow({ children }: { children: React.ReactNode }) {
  return <tr className="border-b">{children}</tr>
}
function TableHead({ children }: { children: React.ReactNode }) {
  return <th className="text-left py-3 px-4 font-medium">{children}</th>
}
function TableCell({ children }: { children: React.ReactNode }) {
  return <td className="py-3 px-4">{children}</td>
}

function Badge({ children, variant }: { children: React.ReactNode; variant?: string }) {
  const base = "inline-flex px-2 py-1 text-xs rounded-full"
  const variantMap = {
    default: "bg-blue-100 text-blue-800",
    secondary: "bg-gray-100 text-gray-800",
    outline: "border border-gray-300 text-gray-700",
    destructive: "bg-red-100 text-red-800"
  }
  return <span className={`${base} ${variantMap[variant as keyof typeof variantMap] || variantMap.default}`}>{children}</span>
}

function Button({ children, variant, ...props }: { children: React.ReactNode; variant?: string; [key: string]: any }) {
  const base = "inline-block font-medium px-4 py-2 rounded"
  const variantMap = {
    default: "bg-blue-600 text-white hover:bg-blue-700", 
    outline: "border border-gray-300 hover:bg-gray-50"
  }
  const className = `${base} ${variantMap[variant as keyof typeof variantMap] || variantMap.default}`
  return <button className={className} {...props}>{children}</button>
}

interface CronJobRun {
  job_name: string
  started_at: string
  completed_at: string | null
  status: 'running' | 'success' | 'failed'
  duration_ms: number | null
  error_message: string | null
}

async function getCronHealth() {
  // Get the latest run for each job
  const { data: allRuns } = await supabaseAdmin
    .from('cron_job_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(100)

  if (!allRuns) return []

  // Group by job_name and take the most recent
  const latestByJob = new Map<string, CronJobRun>()
  
  for (const run of allRuns) {
    if (!latestByJob.has(run.job_name)) {
      latestByJob.set(run.job_name, run as CronJobRun)
    }
  }

  return Array.from(latestByJob.values())
}

function formatDuration(ms: number | null): string {
  if (!ms) return 'N/A'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
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

function getHealthStatus(run: CronJobRun): 'healthy' | 'warning' | 'critical' {
  if (run.status === 'failed') return 'critical'
  
  const hoursSinceRun = (Date.now() - new Date(run.started_at).getTime()) / (1000 * 60 * 60)
  
  // If job hasn't run in 2 hours, warning
  if (hoursSinceRun > 2) return 'warning'
  
  return 'healthy'
}

export default async function CronHealthPage() {
  const cronJobs = await getCronHealth()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Cron Job Health</h1>
          <p className="text-muted-foreground mt-2">
            Automated job execution status and error tracking
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin">← Back to Admin</Link>
        </Button>
      </div>

      {cronJobs.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No cron jobs have run yet.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Cron jobs are scheduled via Vercel and may take time to first execute.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Latest Job Status</CardTitle>
            <CardDescription>
              Most recent execution for each scheduled job
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Name</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cronJobs.map((job) => {
                  const healthStatus = getHealthStatus(job)
                  
                  return (
                    <TableRow
                      key={job.job_name}
                      className={
                        healthStatus === 'critical' ? 'bg-red-50' :
                        healthStatus === 'warning' ? 'bg-yellow-50' :
                        ''
                      }
                    >
                      <TableCell className="font-medium">{job.job_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatTimeAgo(job.started_at)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            job.status === 'success' ? 'default' :
                            job.status === 'running' ? 'secondary' :
                            'destructive'
                          }
                        >
                          {job.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDuration(job.duration_ms)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            healthStatus === 'healthy' ? 'default' :
                            healthStatus === 'warning' ? 'secondary' :
                            'destructive'
                          }
                        >
                          {healthStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-red-600 max-w-md truncate">
                        {job.error_message || '-'}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{cronJobs.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Healthy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {cronJobs.filter(j => getHealthStatus(j) === 'healthy').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Failed (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {cronJobs.filter(j => j.status === 'failed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expected Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span><code className="bg-gray-100 px-2 py-0.5 rounded">moderation</code></span>
              <span className="text-muted-foreground">Every 10 minutes</span>
            </div>
            <div className="flex justify-between">
              <span><code className="bg-gray-100 px-2 py-0.5 rounded">featured_expiry</code></span>
              <span className="text-muted-foreground">Daily at 2am</span>
            </div>
            <div className="flex justify-between">
              <span><code className="bg-gray-100 px-2 py-0.5 rounded">emergency verification</code></span>
              <span className="text-muted-foreground">Daily</span>
            </div>
            <div className="flex justify-between">
              <span><code className="bg-gray-100 px-2 py-0.5 rounded">weekly triage</code></span>
              <span className="text-muted-foreground">Weekly (Mondays)</span>
            </div>
            <div className="flex justify-between">
              <span><code className="bg-gray-100 px-2 py-0.5 rounded">ops digest</code></span>
              <span className="text-muted-foreground">Daily at 11pm</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
