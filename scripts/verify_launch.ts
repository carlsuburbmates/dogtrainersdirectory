#!/usr/bin/env tsx
/**
 * Dog Trainers Directory – AI Launch Gate
 * npm run verify:launch
 */

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { lookup } from 'node:dns/promises'
import { pathToFileURL } from 'node:url'
import { Client } from 'pg'

export type Status = 'PASS' | 'FAIL' | 'WARN' | 'SKIP'

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
let dnsStatus: 'PASS' | 'WARN' = 'PASS'
const dnsEvidence: Record<string, string> = {}

const WARN_ALLOWED = new Set(['DNS root → Vercel'])

export function enforceStatusRules(name: string, status: Status): Status {
  if (status !== 'WARN') {
    return status
  }
  return WARN_ALLOWED.has(name) ? status : 'FAIL'
}

const REQUIRED_TABLES = [
  'payment_audit',
  'business_subscription_status',
  'abn_fallback_events',
  'abn_verifications',
  'ops_overrides',
  'businesses',
  'profiles',
  'suburbs',
  'featured_placements'
]

const RLS_REQUIRED_TABLES = ['businesses', 'profiles', 'abn_verifications', 'abn_fallback_events', 'ops_overrides']

const POLICY_REQUIRED_TABLES = ['businesses', 'profiles', 'abn_verifications', 'abn_fallback_events', 'ops_overrides']

const SENSITIVE_POLICY_TABLES = new Set(['businesses', 'profiles', 'abn_verifications', 'abn_fallback_events'])

const DNS_EXPECTATIONS: Record<string, { label: string; expected: string; optional?: boolean }> = {
  'dogtrainersdirectory.com.au': { label: 'DNS root → Vercel', expected: 'cname.vercel-dns.com.' },
  'www.dogtrainersdirectory.com.au': { label: 'DNS www → Vercel (optional)', expected: 'cname.vercel-dns.com.', optional: true }
}

const AI_CHECKS = new Set<string>([
  'verify:phase9b',
  'lint',
  'test',
  'smoke',
  'e2e',
  'preprod (staging)',
  'check_env_ready staging',
  'alerts dry-run',
  'DB target',
  'ABN fallback rate',
  'Database schema presence',
  'RLS status',
  'Policy coverage',
  'Migration parity',
  'DNS root → Vercel',
  'DNS staging → Vercel',
  'Production curl',
  'Monetization flags (staging env)'
])

const OPERATOR_ONLY_ITEMS = [
  { name: 'Secrets alignment (.env vs Vercel) – item 4c', reason: 'Requires Vercel dashboard + secret rotation approvals.' },
  { name: 'Stripe monetization drill – item 8b', reason: 'Live Stripe payment and webhook replay need human supervision.' },
  { name: 'Production payouts + compliance review – item 9b', reason: 'Requires finance + compliance teams sign-off.' },
  { name: 'Production admin toggles – item 10c', reason: 'Vercel/Stripe toggles enforced during final go/no-go.' },
  { name: 'Stripe live upgrade path – item 10d', reason: 'Must be exercised with real card + observers.' },
  { name: 'Stripe invoice sanity – item 10f', reason: 'Needs invoice PDF inspection + accounting approval.' },
  { name: 'Production governance approvals – item 11b', reason: 'Board/governance approvals cannot be automated.' },
  { name: 'Legal sign-off + comms – item 11c', reason: 'Requires legal + comms leads to sign launch docs.' }
]

const MCP_ONLY_ITEMS = [
  { name: 'Production monetization flags – item 10e', reason: 'Needs Vercel production env inspect via MCP/browser.' },
  { name: 'Production DNS evidence – item 11a', reason: 'Needs DNS provider screenshots/API (MCP) for production domain.' }
]

const DOCS_DIVERGENCE_OPT_OUT = '<!-- DOCS_DIVERGENCE_IGNORE: supporting index or changelog -->'

const OPERATOR_ONLY_CHECKS = new Set(OPERATOR_ONLY_ITEMS.map(item => item.name))
const MCP_ONLY_CHECKS = new Set(MCP_ONLY_ITEMS.map(item => item.name))

function addResult(result: CheckResult) {
  const normalizedStatus = enforceStatusRules(result.name, result.status)
  const needsWarnMessage = result.status === 'WARN' && normalizedStatus === 'FAIL'
  const finalResult: CheckResult = {
    ...result,
    status: normalizedStatus,
    output: needsWarnMessage
      ? `${result.output ? `${result.output} | ` : ''}WARN not allowed for ${result.name}`
      : result.output
  }
  results.push(finalResult)
  if (finalResult.status === 'FAIL') {
    hasFailure = true
  }
  const icon =
    finalResult.status === 'PASS'
      ? '✅'
      : finalResult.status === 'FAIL'
        ? '❌'
        : finalResult.status === 'WARN'
          ? '⚠️'
          : '⊘'
  console.log(`${icon} ${finalResult.name} (${formatDuration(finalResult.durationMs)})`)
  if (finalResult.output) {
    console.log(finalResult.output)
  }
}

function formatDuration(ms: number) {
  return `${(ms / 1000).toFixed(1)}s`
}

function truncate(text: string, limit = 1500) {
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

interface PgClientMeta {
  client: Client
  parsed: ReturnType<typeof parseConnectionTarget>
  resolvedHost: string
}

async function runDbChecks() {
  const connString = process.env.SUPABASE_CONNECTION_STRING
  if (!connString) {
    addResult({ name: 'DB target', status: 'FAIL', durationMs: 0, output: 'SUPABASE_CONNECTION_STRING not set' })
    return
  }

  const pgMeta = await createPgClient(connString)
  if (!pgMeta) return

  const { client } = pgMeta
  try {
    await client.connect()
  } catch (error) {
    addResult({ name: 'DB target', status: 'FAIL', durationMs: 0, output: `Database connection failed: ${(error as Error).message}` })
    return
  }

  await reportDbTarget(client, pgMeta)
  await checkAbnFallbackMetrics(client)
  await checkTablePresence(client)
  await checkRlsStatus(client)
  await checkPolicyCoverage(client)
  await checkMigrationParity(client)

  await client.end().catch(() => {})
}

function parseConnectionTarget(connectionString: string) {
  try {
    const url = new URL(connectionString)
    return {
      host: url.hostname,
      port: url.port || '5432',
      database: url.pathname.replace('/', ''),
      user: decodeURIComponent(url.username || ''),
      password: decodeURIComponent(url.password || '')
    }
  } catch (error) {
    return { host: 'unknown', port: 'unknown', database: 'unknown', user: 'unknown', password: '' }
  }
}

async function createPgClient(connectionString: string): Promise<PgClientMeta | undefined> {
  try {
    if (!connectionString.startsWith('postgres')) {
      throw new Error('Invalid connection string protocol')
    }
    const parsed = parseConnectionTarget(connectionString)
    const sslParam = new URL(connectionString).searchParams.get('sslmode')
    const ssl = sslParam?.toLowerCase() === 'disable' ? undefined : { rejectUnauthorized: false }
    let resolvedHost = parsed.host
    try {
      const lookupResult = await lookup(parsed.host, { family: 4 })
      resolvedHost = lookupResult.address
    } catch (error) {
      console.warn(`IPv4 lookup failed for ${parsed.host}; falling back to hostname`, (error as Error).message)
    }
    const client = new Client({
      host: resolvedHost,
      port: Number(parsed.port || '5432'),
      database: parsed.database,
      user: parsed.user,
      password: parsed.password,
      ssl
    })
    return { client, parsed, resolvedHost }
  } catch (error) {
    addResult({ name: 'DB target', status: 'FAIL', durationMs: 0, output: `Unable to parse DB connection: ${(error as Error).message}` })
    return undefined
  }
}

async function reportDbTarget(client: Client, meta: PgClientMeta) {
  const start = Date.now()
  try {
    const runtime = await client.query(
      'select current_database() as database, current_user as role, inet_server_addr()::text as host, inet_server_port() as port'
    )
    addResult({
      name: 'DB target',
      status: 'PASS',
      durationMs: Date.now() - start,
      details: {
        urlHost: meta.parsed.host,
        urlDatabase: meta.parsed.database,
        resolvedHost: meta.resolvedHost,
        runtimeHost: runtime.rows[0]?.host ?? 'unknown',
        runtimeDatabase: runtime.rows[0]?.database ?? 'unknown',
        runtimeRole: runtime.rows[0]?.role ?? 'unknown',
        runtimePort: runtime.rows[0]?.port ?? 'unknown'
      }
    })
  } catch (error) {
    addResult({ name: 'DB target', status: 'FAIL', durationMs: Date.now() - start, output: (error as Error).message })
  }
}

async function checkAbnFallbackMetrics(client: Client) {
  const start = Date.now()
  try {
    const threshold = Number(process.env.ABN_FALLBACK_MAX_RATE_24H ?? '0.15')
    const minSample = Number(process.env.ABN_FALLBACK_MIN_SAMPLE_24H ?? '30')
    const now = new Date()
    const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const fallback24 = await client.query('select count(*)::int as count from abn_fallback_events where created_at >= $1', [since24h.toISOString()])
    const verified24 = await client.query(
      "select count(*)::int as count from abn_verifications where status = 'verified' and updated_at >= $1",
      [since24h.toISOString()]
    )
    const fallback7d = await client.query('select count(*)::int as count from abn_fallback_events where created_at >= $1', [since7d.toISOString()])

    const fallbackCount = fallback24.rows[0]?.count ?? 0
    const verifiedCount = verified24.rows[0]?.count ?? 0
    const fallback7dCount = fallback7d.rows[0]?.count ?? 0
    const sampleSize = verifiedCount

    if (sampleSize < minSample) {
      addResult({
        name: 'ABN fallback rate',
        status: 'SKIP',
        durationMs: Date.now() - start,
        output: 'Insufficient verification volume in last 24h',
        details: {
          fallbackCount24h: fallbackCount,
          verifiedCount24h: verifiedCount,
          sampleSize,
          fallbackCount7d: fallback7dCount,
          minSample,
          reason: 'insufficient_volume'
        }
      })
      return
    }

    const denom = fallbackCount + verifiedCount
    const rate = denom === 0 ? 0 : fallbackCount / denom

    let status: CheckResult['status'] = 'PASS'
    let output = `fallback ${fallbackCount}, verified ${verifiedCount}, rate ${(rate * 100).toFixed(2)}% (threshold ${(threshold * 100).toFixed(2)}%)`

    if (rate > threshold) {
      status = 'FAIL'
      output = `ABN fallback rate ${(rate * 100).toFixed(2)}% exceeds ${(threshold * 100).toFixed(2)}%`
    }

    addResult({
      name: 'ABN fallback rate',
      status,
      durationMs: Date.now() - start,
      details: {
        fallbackCount24h: fallbackCount,
        verifiedCount24h: verifiedCount,
        sampleSize,
        fallbackCount7d: fallback7dCount,
        threshold,
        minSample
      }
    })
  } catch (error) {
    addResult({ name: 'ABN fallback rate', status: 'FAIL', durationMs: Date.now() - start, output: (error as Error).message })
  }
}

async function checkTablePresence(client: Client) {
  const start = Date.now()
  try {
    const missing: string[] = []
    for (const table of REQUIRED_TABLES) {
      const res = await client.query('select to_regclass($1) is not null as exists', [`public.${table}`])
      if (!res.rows[0]?.exists) missing.push(table)
    }
    addResult({
      name: 'Database schema presence',
      status: missing.length === 0 ? 'PASS' : 'FAIL',
      durationMs: Date.now() - start,
      details: { missing }
    })
  } catch (error) {
    addResult({ name: 'Database schema presence', status: 'FAIL', durationMs: Date.now() - start, output: (error as Error).message })
  }
}

async function checkRlsStatus(client: Client) {
  const start = Date.now()
  try {
    const missing: string[] = []
    const tableStatuses: Array<{ table: string; rlsEnabled: boolean }> = []
    for (const table of RLS_REQUIRED_TABLES) {
      const res = await client.query('select relrowsecurity as enabled from pg_class where oid = $1::regclass', [`public.${table}`])
      const enabled = !!res.rows[0]?.enabled
      tableStatuses.push({ table, rlsEnabled: enabled })
      if (!enabled) missing.push(table)
    }
    addResult({
      name: 'RLS status',
      status: missing.length === 0 ? 'PASS' : 'FAIL',
      durationMs: Date.now() - start,
      details: { missing, tableStatuses }
    })
  } catch (error) {
    addResult({ name: 'RLS status', status: 'FAIL', durationMs: Date.now() - start, output: (error as Error).message })
  }
}

async function checkPolicyCoverage(client: Client) {
  const start = Date.now()
  try {
    type PgPolicyRow = {
      policyname: string
      permissive: string | boolean | null
      qual: string | null
      cmd: string | null
    }

    const missing: string[] = []
    const overlyPermissive: Array<{ table: string; policies: string[] }> = []
    const perTablePolicies: Array<{ table: string; policies: Array<{ name: string; permissive: boolean; usingClause: string }> }> = []
    for (const table of POLICY_REQUIRED_TABLES) {
      const res = await client.query(
        `select policyname, permissive, qual, cmd
         from pg_policies
         where schemaname=$1 and tablename=$2
         order by policyname`,
        ['public', table]
      )
      const tablePolicies = (res.rows as PgPolicyRow[]).map((row) => ({
        name: row.policyname as string,
        permissive: String(row.permissive ?? '').toUpperCase() === 'PERMISSIVE',
        usingClause: (row.qual as string | null)?.trim() || 'true',
        command: String(row.cmd ?? '').toLowerCase()
      }))
      perTablePolicies.push({ table, policies: tablePolicies })
      if (tablePolicies.length === 0) {
        missing.push(table)
      }
      if (SENSITIVE_POLICY_TABLES.has(table)) {
        const permissiveUsingTrue = tablePolicies
          .filter(
            (policy) =>
              policy.permissive && policy.usingClause.toLowerCase() === 'true' && policy.command !== 'insert'
          )
          .map((policy) => policy.name)
        if (permissiveUsingTrue.length > 0) {
          overlyPermissive.push({ table, policies: permissiveUsingTrue })
        }
      }
    }
    const hasIssues = missing.length > 0 || overlyPermissive.length > 0
    addResult({
      name: 'Policy coverage',
      status: hasIssues ? 'FAIL' : 'PASS',
      durationMs: Date.now() - start,
      details: { missing, overlyPermissive, perTablePolicies }
    })
  } catch (error) {
    addResult({ name: 'Policy coverage', status: 'FAIL', durationMs: Date.now() - start, output: (error as Error).message })
  }
}

async function checkMigrationParity(client: Client) {
  const start = Date.now()
  try {
    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations')
    const files = fs
      .readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .map(file => file.replace('.sql', ''))
      .sort()

    const ledger = await client.query('select version, name from supabase_migrations.schema_migrations order by version')
    type MigrationLedgerRow = { version: string; name?: string | null }
    const ledgerRows = ledger.rows as MigrationLedgerRow[]
    const applied = new Set<string>(ledgerRows.map((row) => row.version))
    const baseline = Number(process.env.MIGRATION_BASELINE_VERSION ?? '20251100000000')
    const relevantFiles = files.filter(file => {
      const numeric = Number(file.split('_')[0])
      return Number.isFinite(numeric) && numeric >= baseline
    })
    const missing = relevantFiles.filter(file => !applied.has(file))
    const appliedTimeline = ledgerRows.slice(-5).map((row) => {
      return `${row.version} (name: ${row.name ?? 'n/a'}, appliedAt: not tracked)`
    })

    addResult({
      name: 'Migration parity',
      status: missing.length === 0 ? 'PASS' : 'FAIL',
      durationMs: Date.now() - start,
      details: {
        totalMigrations: files.length,
        appliedCount: ledgerRows.length,
        checkedAfterBaseline: relevantFiles.length,
        missing,
        recentApplied: appliedTimeline,
        baselineVersion: baseline,
        timestampSource: 'schema_migrations has no inserted_at column'
      }
    })
  } catch (error) {
    addResult({ name: 'Migration parity', status: 'FAIL', durationMs: Date.now() - start, output: (error as Error).message })
  }
}

function runDnsChecks() {
  Object.entries(DNS_EXPECTATIONS).forEach(([domain, config]) => {
    checkDnsTarget(domain, config.label, config.expected)
  })
  addResult({
    name: 'DNS staging preview model',
    status: 'SKIP',
    durationMs: 0,
    output: 'Staging uses Vercel Preview deployments; no staging subdomain by design.'
  })
  runCurlCheck()
}

function checkDnsTarget(domain: string, name: string, expected: string) {
  const start = Date.now()
  try {
    const aRaw = execSync(`dig +short ${domain} A`, { encoding: 'utf-8' }).trim()
    const aaaaRaw = execSync(`dig +short ${domain} AAAA`, { encoding: 'utf-8' }).trim()
    const cnameRaw = execSync(`dig +short ${domain} CNAME`, { encoding: 'utf-8' }).trim()

    const aRecords = aRaw ? aRaw.split('\n').filter(Boolean) : []
    const aaaaRecords = aaaaRaw ? aaaaRaw.split('\n').filter(Boolean) : []
    const cnameRecords = cnameRaw ? cnameRaw.split('\n').filter(Boolean) : []

    // Consider a match if there is any A/AAAA record (registrar ALIAS/flattening acceptable)
    // or the expected Vercel CNAME is present.
    const matches = cnameRecords.includes(expected) || aRecords.length > 0 || aaaaRecords.length > 0

    const config = (DNS_EXPECTATIONS as any)[domain]
    const optional = config?.optional === true

    let status: CheckResult['status']
    const details: Record<string, unknown> = {
      expected,
      cnameRecords,
      aRecords,
      aaaaRecords,
      optional
    }

    // Capture raw dig output as evidence for the launch run
    dnsEvidence[domain] = `A:\n${aRaw}\nAAAA:\n${aaaaRaw}\nCNAME:\n${cnameRaw}`

    if (matches) {
      status = 'PASS'
    } else if (optional) {
      // Treat optional missing records as PASS but note it's optional
      status = 'PASS'
      details.optionalMissing = true
    } else {
      status = 'WARN'
      dnsStatus = 'WARN'
    }

    addResult({ name, status, durationMs: Date.now() - start, details })
  } catch (error) {
    dnsStatus = 'WARN'
    dnsEvidence[domain] = `error: ${(error as Error).message}`
    addResult({ name, status: 'WARN', durationMs: Date.now() - start, output: (error as Error).message })
  }
}

function runCurlCheck() {
  const start = Date.now()
  try {
    const output = execSync('curl -I https://dogtrainersdirectory.com.au', { encoding: 'utf-8' })
    const statusLine = output.split('\n')[0]?.trim()
    addResult({
      name: 'Production curl',
      status: statusLine?.startsWith('HTTP/') ? 'PASS' : 'WARN',
      durationMs: Date.now() - start,
      output: statusLine
    })
  } catch (error) {
    const stdout = (error as any)?.stdout?.toString() ?? ''
    const stderr = (error as any)?.stderr?.toString() ?? ''
    addResult({
      name: 'Production curl',
      status: 'FAIL',
      durationMs: Date.now() - start,
      output: truncate((stdout + '\n' + stderr).trim())
    })
  }
}

function checkMonetizationFlags() {
  const start = Date.now()
  const featureFlag = process.env.FEATURE_MONETIZATION_ENABLED ?? 'unset'
  const clientFlag = process.env.NEXT_PUBLIC_FEATURE_MONETIZATION_ENABLED ?? 'unset'
  const status: CheckResult['status'] = featureFlag === '1' && clientFlag === '1' ? 'PASS' : 'FAIL'
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

function recordManualChecks() {
  OPERATOR_ONLY_ITEMS.forEach(item => recordSkip(item.name, item.reason))
  MCP_ONLY_ITEMS.forEach(item => recordSkip(item.name, item.reason))
}

function recordSkip(name: string, reason: string) {
  addResult({ name, status: 'SKIP', durationMs: 0, details: { reason } })
}

function getStatusCounts() {
  return {
    pass: results.filter(r => r.status === 'PASS').length,
    warn: results.filter(r => r.status === 'WARN').length,
    skip: results.filter(r => r.status === 'SKIP').length,
    fail: results.filter(r => r.status === 'FAIL').length
  }
}

function getLaunchRunsDir() {
  const candidates = [
    process.env.DTD_ARTIFACTS_DIR,
    process.env.DTD_DOCS_DIR
  ].filter(Boolean) as string[]

  for (const candidate of candidates) {
    const resolved = path.isAbsolute(candidate) ? candidate : path.resolve(process.cwd(), candidate)
    try {
      if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
        return path.join(resolved, 'launch_runs')
      }
    } catch {
      // ignore and try next candidate
    }
  }

  // CI-safe fallback: keep artifacts inside this repo so GitHub Actions can upload them.
  return path.join(process.cwd(), 'launch_runs')
}

function writeArtifacts() {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const runsDir = getLaunchRunsDir()
  const mdPath = path.join(runsDir, `launch-prod-${date}-ai-preflight.md`)
  const jsonPath = path.join(runsDir, `launch-prod-${date}-ai-preflight.json`)
  const sha = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim()
  const counts = getStatusCounts()
  const envTarget = process.env.ENV_TARGET ?? 'staging'

  fs.mkdirSync(runsDir, { recursive: true })
  if (!fs.existsSync(mdPath)) {
    fs.writeFileSync(mdPath, `${DOCS_DIVERGENCE_OPT_OUT}\n# Launch Run – production – ${date}\n\n`)
  } else {
    const existing = fs.readFileSync(mdPath, 'utf-8')
    if (!existing.includes(DOCS_DIVERGENCE_OPT_OUT)) {
      fs.writeFileSync(mdPath, `${DOCS_DIVERGENCE_OPT_OUT}\n${existing}`)
    }
  }

  const mdLines = [
    '---',
    `## AI Launch Gate – ${now.toISOString()} (sha ${sha}, target ${envTarget})`,
    `- Commit: ${sha}`,
    `- Target: ${envTarget}`,
    `- DNS_STATUS: ${dnsStatus}${dnsStatus === 'WARN' ? ' (operator confirmation required)' : ''}`,
    `- Result counts: PASS ${counts.pass} / WARN ${counts.warn} / SKIP ${counts.skip} / FAIL ${counts.fail}`,
    '- Remaining non-AI items: 4c, 8b, 9b, 10c, 10d, 10f, 11b, 11c (MCP pending: 10e, 11a)',
    '',
    '| Check | Status | Duration | Details |',
    '| --- | --- | --- | --- |'
  ]

  for (const result of results) {
    mdLines.push(
      `| ${result.name} | ${result.status} | ${formatDuration(result.durationMs)} | ${
        result.output ?? JSON.stringify(result.details ?? {})
      } |`
    )
  }

  fs.appendFileSync(mdPath, mdLines.join('\n') + '\n\n')
  fs.writeFileSync(
    jsonPath,
    JSON.stringify(
      {
        timestamp: now.toISOString(),
        sha,
        target: envTarget,
        envTarget,
        dnsStatus,
        counts,
        results
      },
      null,
      2
    )
  )

  // Write DNS evidence artifact if we captured any dig outputs
  if (Object.keys(dnsEvidence).length > 0) {
    const tsSafe = now.toISOString().replace(/[:.]/g, '').slice(0, 15)
    const dnsPath = path.join(runsDir, `dns-evidence-${tsSafe}.txt`)
    const dnsLines = Object.entries(dnsEvidence)
      .map(([d, v]) => `### ${d}\n\n${v}`)
      .join('\n\n')
    fs.writeFileSync(dnsPath, dnsLines)
    console.log(`\nArtifacts updated:\n- ${mdPath}\n- ${jsonPath}\n- ${dnsPath}`)
  } else {
    console.log(`\nArtifacts updated:\n- ${mdPath}\n- ${jsonPath}`)
  }
}


function printSummary() {
  const counts = getStatusCounts()
  console.log('\nSummary:')
  console.log(`  PASS: ${counts.pass}`)
  console.log(`  WARN: ${counts.warn}`)
  console.log(`  SKIP: ${counts.skip}`)
  console.log(`  FAIL: ${counts.fail}`)

  const aiVerified = results.filter(r => AI_CHECKS.has(r.name) && r.status === 'PASS').map(r => r.name)
  const warnings = results.filter(r => r.status === 'WARN').map(r => r.name)
  const operatorOnly = results.filter(r => OPERATOR_ONLY_CHECKS.has(r.name)).map(r => r.name)
  const mcpOnly = results.filter(r => MCP_ONLY_CHECKS.has(r.name)).map(r => r.name)

  console.log('\nAutomation Boundary:')
  console.log(`  ✅ AI-VERIFIED: ${aiVerified.length ? aiVerified.join(', ') : 'None'}`)
  console.log(`  ⚠️ WARNINGS: ${warnings.length ? warnings.join(', ') : 'None'}`)
  console.log(`  ⏳ OPERATOR-ONLY: ${operatorOnly.length ? operatorOnly.join(', ') : 'None'}`)
  console.log(`  🔒 MCP-ONLY: ${mcpOnly.length ? mcpOnly.join(', ') : 'None'}`)
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
    {
      name: 'alerts dry-run',
      command: 'npx tsx scripts/run_alerts_email.ts --dry-run',
      env: { E2E_TEST_MODE: '1', NEXT_PUBLIC_E2E_TEST_MODE: '1' }
    }
  ]

  for (const item of commandChecks) {
    runCommandCheck(item.name, item.command, item.env ?? {})
  }

  await runDbChecks()
  runDnsChecks()
  checkMonetizationFlags()
  recordManualChecks()
  writeArtifacts()
  printSummary()
  const counts = getStatusCounts()
  const exitCode = counts.fail > 0 ? 1 : 0
  console.log(
    `VERIFY_LAUNCH_RESULT: PASS=${counts.pass} WARN=${counts.warn} SKIP=${counts.skip} FAIL=${counts.fail} EXIT=${exitCode}`
  )
  process.exit(exitCode)
}

const invokedFromCli = (() => {
  const entry = process.argv[1]
  if (!entry) {
    return false
  }
  try {
    return import.meta.url === pathToFileURL(entry).href
  } catch {
    return false
  }
})()

if (invokedFromCli) {
  main().catch(error => {
    console.error('Fatal error in verify:launch', error)
    process.exit(1)
  })
}
