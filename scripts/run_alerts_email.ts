#!/usr/bin/env tsx
import fs from 'node:fs'
import path from 'node:path'
import { evaluateAlerts } from '@/lib/alerts'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const forceSend = args.includes('--force')
const statePath = process.env.ALERTS_STATE_FILE || path.join(process.cwd(), '.alert_state.json')

async function main() {
  const snapshot = await evaluateAlerts()
  const actionableAlerts = snapshot.alerts.filter((alert) => !alert.suppressed && alert.severity !== 'info')

  if (actionableAlerts.length === 0) {
    console.log('No actionable alerts to report.')
    return
  }

  const signature = JSON.stringify(actionableAlerts.map((alert) => `${alert.id}:${alert.message}`))
  const previousSignature = readSignature(statePath)

  if (!forceSend && !dryRun && previousSignature === signature) {
    console.log('No new alerts since last run. Skipping delivery.')
    return
  }

  if (dryRun) {
    console.log('DRY RUN ALERT SUMMARY:')
    actionableAlerts.forEach((alert) => {
      console.log(`- [${alert.severity.toUpperCase()}] ${alert.area}: ${alert.message}`)
    })
    return
  }

  const results = [] as string[]
  results.push(await sendEmailAlerts(actionableAlerts, snapshot.generatedAt))
  results.push(await sendSlackAlerts(actionableAlerts, snapshot.generatedAt))

  writeSignature(statePath, signature)
  console.log('Alert delivery complete:', results.join(', '))
}

function readSignature(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) return null
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as { signature: string }
    return parsed.signature || null
  } catch (error) {
    console.warn('Failed to read alert state file', error)
    return null
  }
}

function writeSignature(filePath: string, signature: string) {
  try {
    fs.writeFileSync(filePath, JSON.stringify({ signature, updatedAt: new Date().toISOString() }, null, 2))
  } catch (error) {
    console.warn('Unable to write alert state file', error)
  }
}

async function sendEmailAlerts(alerts: Awaited<ReturnType<typeof evaluateAlerts>>['alerts'], generatedAt: string) {
  const apiKey = process.env.RESEND_API_KEY
  const recipients = (process.env.ALERTS_EMAIL_TO || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
  if (!apiKey || recipients.length === 0) {
    return 'email:disabled'
  }

  const from = process.env.ALERTS_EMAIL_FROM || 'Ops Alerts <ops@dogtrainersdirectory.com.au>'
  const htmlLines = alerts
    .map(
      (alert) =>
        `<li><strong>${alert.area}</strong> — [${alert.severity.toUpperCase()}] ${alert.message}</li>`
    )
    .join('')

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      from,
      to: recipients,
      subject: `Ops alerts (${alerts.length}) — ${new Date(generatedAt).toLocaleString()}`,
      html: `<p>The following alerts are currently active:</p><ul>${htmlLines}</ul><p>Generated at ${generatedAt}.</p>`
    })
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Email alert failed: ${response.status} ${text}`)
  }

  return 'email:sent'
}

async function sendSlackAlerts(alerts: Awaited<ReturnType<typeof evaluateAlerts>>['alerts'], generatedAt: string) {
  const webhook = process.env.ALERTS_SLACK_WEBHOOK_URL
  if (!webhook) return 'slack:disabled'

  const textBody = alerts
    .map((alert) => `• [${alert.severity.toUpperCase()}] ${alert.area}: ${alert.message}`)
    .join('\n')

  const response = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `Ops alerts (${alerts.length}) — ${generatedAt}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Ops alerts (${alerts.length})* — ${generatedAt}\n${textBody}`
          }
        }
      ]
    })
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Slack alert failed: ${response.status} ${text}`)
  }

  return 'slack:sent'
}

main().catch((error) => {
  console.error('Alert runner failed', error)
  process.exit(1)
})
