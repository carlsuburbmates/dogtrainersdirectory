#!/usr/bin/env tsx
/**
 * Dog Trainers Directory – AI Launch Gate
 * ---------------------------------------
 * npm run verify:launch
 *  - Executes all AI-verifiable launch checks in a single harness
 *  - Writes auditable artifacts under DOCS/launch_runs/
 *  - Exits non-zero if any launch gate fails
 */

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { Client } from 'pg'

type Status = 'PASS' | 'FAIL' | 'WARN' | 'SKIP'

interface CheckResult {
  name: string
  status: Status
  command?: string
  durationMs: number
  output?: string
  details?: Record<string, unknown>
}

const results: CheckResult[] = []
let hasFailure = false

function addResult(result: CheckResult) {
  results.push(result)
  if (result.status === 'FAIL') {
    hasFailure = true
  }
  const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : result.status === 'WARN' ? '⚠️' : '⊘'
  console.log(`${icon} ${result.name} (${formatDuration(result.durationMs)})`)
  if (result.output) {
    console.log(result.output)
  }
}

function formatDuration(ms: number) {
  return `${(ms / 1000).toFixed(1)}s`
}

function truncate(text: string, limit = 2000) {
  if (!text) return ''
  return text.length > limit ? `${text.slice(0, limit)}…` : text
}

function runCommandCheck(name: string, command: string, extraEnv: Record<string, string> = {}) {
  const start = Date.now()
  try {
    console.log(`\n▶ ${name}`)
    const output = execSync(command, {
      encoding: 'utf-8',
      stdio: 'pipe',
      env: { ...process.env, ...extraEnv }
    })
    console.log(output)
    addResult({ name, status: 'PASS', command, durationMs: Date.now() - start, output: truncate(output.trim()) })
  } catch (error) {
    const stdout = (error as any)?.stdout?.toString() ?? ''
    const stderr = (error as any)?.stderr?.toString() ?? ''
    const combined = (stdout + '\n' + stderr).trim()
    console.error(combined)
    addResult({ name, status: 'FAIL', command, durationMs: Date.now() - start, output: truncate(combined || String(error)) })
  }
}

async function runDbChecks() {
  const connString = process.env.SUPABASE_CONNECTION_STRING
  if (!connString) {
    addResult({ name: 'Database checks', status: 'FAIL', durationMs: 0, output: 'SUPABASE_CONNECTION_STRING not set' })
    return
  }

  const client = new Client({ connectionString: connString })
  try {
    await client.connect()
    await checkAbnFallbackMetrics(client)
    await checkTablePresence(client)
    await checkPolicyPresence(client)
    await checkMigrationParity(client)
  } catch (error) {
    addResult({ name: 'Database checks', status: 'FAIL', durationMs: 0, output: (error as Error).message })
  } finally {
    await client.end()
  }
}

async function checkAbnFallbackMetrics(client: Client) {
  const start = Date.now()
  try {
    const threshold = Number(process.env.ABN_FALLBACK_MAX_RATE ?? '0.15')
    const now = new Date()
    const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const fallback24 = await client.query('select count(*)::int as count from abn_fallback_events where created_at >= $1', [since24h.toISOString()])
    const fallbackCount = fallback24.rows[0]?.count ?? 0
    const verified24 = await client.query("select count(*)::int as count from abn_verifications where status = 'verified' and updated_at >= $1", [since24h.toISOString()])
    const verifiedCount = verified24.rows[0]?.count ?? 0
    const fallback7d = await client.query('select count(*)::int as count from abn_fallback_events where created_at >= $1', [since7d.toISOString()])
    const fallback7dCount = fallback7d.rows[0]?.count ?? 0

    const denom = fallbackCount + verifiedCount
    const rate = denom === 0 ? 0 : fallbackCount / denom

    let status: Status = 'PASS'
    let output = `fallback ${fallbackCount}, verified ${verifiedCount}, rate ${(rate * 100).toFixed(2)}% (threshold ${(threshold * 100).toFixed(2)}%)`

    if (denom > 0 && rate > threshold) {
      status = 'FAIL'
      output = `ABN fallback rate ${(rate * 100).toFixed(2)}% exceeds ${(threshold * 100).toFixed(2)}%`
    } else if (fallbackCount === 0) {
      status = fallback7dCount > 0 ? 'WARN' : 'FAIL'
      output = fallback7dCount > 0 ? 'No fallback events in last 24h (7d history present)' : 'No fallback events recorded in last 7d'
    }

    addResult({
      name: 'ABN fallback rate',
      status,
      durationMs: Date.now() - start,
      details: { fallbackCount24h: fallbackCount, verifiedCount24h: verifiedCount, fallbackCount7d: fallback7dCount, threshold }
    })
  } catch (error) {
    addResult({ name: 'ABN fallback rate', status: 'FAIL', durationMs: Date.now() - start, output: (error as Error).message })
  }
}

async function checkTablePresence(client: Client) {
  const start = Date.now()
  const tables = [
    'payment_audit',
    'business_subscription_status',
    'abn_fallback_events',
    'abn_verifications',
    'businesses',
    'profiles',
    'suburbs',
    'featured_placements',
    'ops_overrides'
  ]
  const missing: string[] = []
  for (const table of tables) {
    const res = await client.query('select to_regclass($1) is not null as exists', [`public.${table}`])
    if (!res.rows[0]?.exists) missing.push(table)
  }
  addResult({
    name: 'Database schema presence',
    status: missing.length === 0 ? 'PASS' : 'FAIL',
    durationMs: Date.now() - start,
    details: { missing }
  })
}

async function checkPolicyPresence(client: Client) {
  const start = Date.now()
  const tables = ['businesses', 'profiles', 'abn_verifications', 'abn_fallback_events']
  const missing: string[] = []
  for (const table of tables) {
    const res = await client.query('select count(*)::int as count from pg_policies where schemaname=$1 and tablename=$2', ['public', table])
    if ((res.rows[0]?.count ?? 0) === 0) missing.push(table)
  }
  addResult({ name: 'RLS policy presence', status: missing.length === 0 ? 'PASS' : 'FAIL', durationMs: Date.now() - start, details: { missing } })
}

async function checkMigrationParity(client: Client) {
  const start = Date.now()
  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations')
  const files = fs
    .readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .map(file => file.replace('.sql', ''))
    .sort()
  try {
    const ledger = await client.query('select version from supabase_migrations.schema_migrations order by version')
    const applied = ledger.rows.map((row: any) => row.version)
    const baseline = 20251100000000
    const critical = files.filter(file => {
      const numeric = Number(file.split('_')[0])
      return !Number.isNaN(numeric) && numeric >= baseline
    })
    const missing = critical.filter(file => !applied.includes(file))
    addResult({
      name: 'Migration parity',
      status: missing.length === 0 ? 'PASS' : 'FAIL',
      durationMs: Date.now() - start,
      details: { checkedCount: critical.length, missingCount: missing.length, missing }
    })
  } catch (error) {
    addResult({ name: 'Migration parity', status: 'WARN', durationMs: Date.now() - start, output: `Unable to read ledger: ${(error as Error).message}` })
  }
}

function runDnsChecks() {
  checkDnsTarget('dogtrainersdirectory.com.au', 'DNS root → Vercel')
  checkDnsTarget('staging.dogtrainersdirectory.com.au', 'DNS staging → Vercel')
  runCurlCheck()
}

function checkDnsTarget(domain: string, name: string) {
  const start = Date.now()
  try {
    const cname = execSync(`dig +short ${domain} CNAME`, { encoding: 'utf-8' }).trim()
    if (cname && cname.includes('vercel-dns.com')) {
      addResult({ name, status: 'PASS', durationMs: Date.now() - start, output: `CNAME ${cname}` })
      return
    }
    const ns = execSync(`dig +short ${domain} NS`, { encoding: 'utf-8' }).trim()
    if (ns && ns.includes('vercel-dns.com')) {
      addResult({ name, status: 'PASS', durationMs: Date.now() - start, output: 'NS managed by Vercel (apex flattening)' })
      return
    }
    const records = execSync(`dig +short ${domain}`, { encoding: 'utf-8' }).trim()
    if (records) {
      const looksVercel = records.split('\n').some(ip => ip.startsWith('76.76.21.'))
      addResult({
        name,
        status: looksVercel ? 'PASS' : 'WARN',
        durationMs: Date.now() - start,
        output: looksVercel ? `A-record(s): ${records}` : `A-record(s): ${records} (manual confirm required)`
      })
      return
    }
    addResult({ name, status: 'FAIL', durationMs: Date.now() - start, output: 'No DNS records returned' })
  } catch (error) {
    addResult({ name, status: 'FAIL', durationMs: Date.now() - start, output: (error as Error).message })
  }
}

function runCurlCheck() {
  const start = Date.now()
  try {
    const output = execSync('curl -I https://dogtrainersdirectory.com.au', { encoding: 'utf-8' })
    const statusLine = output.split('\n')[0]?.trim()
    addResult({ name: 'Production curl', status: statusLine?.startsWith('HTTP/') ? 'PASS' : 'WARN', durationMs: Date.now() - start, output: statusLine })
  } catch (error) {
    const stdout = (error as any)?.stdout?.toString() ?? ''
    const stderr = (error as any)?.stderr?.toString() ?? ''
    addResult({ name: 'Production curl', status: 'FAIL', durationMs: Date.now() - start, output: truncate((stdout + '\n' + stderr).trim()) })
  }
}

function checkMonetizationFlags() {
  const start = Date.now()
  const featureFlag = process.env.FEATURE_MONETIZATION_ENABLED ?? 'unset'
  const clientFlag = process.env.NEXT_PUBLIC_FEATURE_MONETIZATION_ENABLED ?? 'unset'
  const status: Status = featureFlag === '1' && clientFlag === '1' ? 'PASS' : 'FAIL'
  addResult({
    name: 'Monetization flags (staging env)',
    status,
    durationMs: Date.now() - start,
    details: {
      FEATURE_MONETIZATION_ENABLED: maskValue(featureFlag),
      NEXT_PUBLIC_FEATURE_MONETIZATION_ENABLED: maskValue(clientFlag)
    }
  })
}

function maskValue(value: string) {
  if (value === 'unset') return 'unset'
  return value.length <= 4 ? value : `${value.slice(0, 1)}***${value.slice(-1)}`
}

function recordSkip(name: string, reason: string) {
  addResult({ name, status: 'SKIP', durationMs: 0, details: { reason } })
}

function writeArtifacts() {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const mdPath = path.join(process.cwd(), 'DOCS', 'launch_runs', `launch-prod-${date}-ai-preflight.md`)
  const jsonPath = path.join(process.cwd(), 'DOCS', 'launch_runs', `launch-prod-${date}-ai-preflight.json`)
  const sha = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim()

  fs.mkdirSync(path.dirname(mdPath), { recursive: true })
  if (!fs.existsSync(mdPath)) {
    fs.writeFileSync(mdPath, `# Launch Run – production – ${date}\n\n`)
  }

  const mdLines = [
    `## AI Launch Gate – ${now.toISOString()}`,
    `- Commit: ${sha}`,
    '- Target: staging',
    '- Remaining non-AI items: 4c, 8b, 9b, 10c, 10d, 10f, 11b, 11c (MCP pending: 10e, 11a)',
    '',
    '| Check | Status | Duration | Details |',
    '| --- | --- | --- | --- |'
  ]

  for (const result of results) {
    mdLines.push(`| ${result.name} | ${result.status} | ${formatDuration(result.durationMs)} | ${result.output ?? JSON.stringify(result.details ?? {})} |`)
  }

  fs.appendFileSync(mdPath, mdLines.join('\n') + '\n\n')
  fs.writeFileSync(jsonPath, JSON.stringify({ timestamp: now.toISOString(), sha, target: 'staging', results }, null, 2))

  console.log(`\nArtifacts updated:\n- ${mdPath}\n- ${jsonPath}`)
}

function printSummary() {
  const pass = results.filter(r => r.status === 'PASS').length
  const warn = results.filter(r => r.status === 'WARN').length
  const skip = results.filter(r => r.status === 'SKIP').length
  const fail = results.filter(r => r.status === 'FAIL').length
  console.log('\nSummary:')
  console.log(`  PASS: ${pass}`)
  console.log(`  WARN: ${warn}`)
  console.log(`  SKIP: ${skip}`)
  console.log(`  FAIL: ${fail}`)
}

async function main() {
  const commandChecks: Array<{ name: string; command: string; env?: Record<string, string> }> = [
    { name: 'verify:phase9b', command: 'npm run verify:phase9b' },
    { name: 'lint', command: 'npm run lint' },
    { name: 'test', command: 'npm run test' },
    { name: 'smoke', command: 'npm run smoke' },
    { name: 'e2e', command: 'npm run e2e' },
    { name: 'preprod (staging)', command: './scripts/preprod_verify.sh', env: { ENV_TARGET: 'staging' } },
    { name: 'check_env_ready staging', command: './scripts/check_env_ready.sh staging' },
    { name: 'alerts dry-run', command: 'npx tsx scripts/run_alerts_email.ts --dry-run' }
  ]

  for (const item of commandChecks) {
    runCommandCheck(item.name, item.command, item.env ?? {})
  }

  await runDbChecks()
  runDnsChecks()
  checkMonetizationFlags()

  recordSkip('Secrets alignment (.env vs Vercel) – item 4c', 'Operator-only (requires Vercel UI & secret inventory)')
  recordSkip('Production monetization flags – item 10e', 'MCP verification pending (Vercel Production env)')
  recordSkip('Production DNS evidence – item 11a', 'MCP verification pending (Vercel DNS tooling)')

  writeArtifacts()
  printSummary()

  if (hasFailure) {
    process.exit(1)
  }
}

main().catch(error => {
  console.error('Fatal error in verify:launch', error)
  process.exit(1)
})
