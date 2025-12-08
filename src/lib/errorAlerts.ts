// Error Alerting System for Priority 3
// Provides threshold-based alerting for error spikes, LLM failures, and DB issues

import { getRecentErrorCount } from './errorLog'
import { supabaseAdmin } from './supabase'

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface AlertConfig {
  type: 'high_error_rate' | 'llm_failures' | 'db_issues'
  severity: AlertSeverity
  threshold: number
  minutes: number
  cooldownMinutes?: number
}

const DEFAULT_ALERTS: AlertConfig[] = [
  {
    type: 'high_error_rate',
    severity: 'high',
    threshold: 5, // >5 errors per minute
    minutes: 5,
    cooldownMinutes: 30
  },
  {
    type: 'llm_failures',
    severity: 'medium',
    threshold: 3, // >3 LLM errors per minute
    minutes: 5,
    cooldownMinutes: 30
  },
  {
    type: 'db_issues',
    severity: 'high',
    threshold: 3,
    minutes: 5,
    cooldownMinutes: 30
  }
]

// Check and trigger alerts based on configuration
export async function checkAndTriggerAlerts(customConfigs?: AlertConfig[]) {
  const configs = customConfigs || DEFAULT_ALERTS

  for (const config of configs) {
    try {
      let shouldTrigger = false
      let count = 0

      if (config.type === 'high_error_rate') {
        count = await getRecentErrorCount(config.minutes, ['error', 'critical'])
        shouldTrigger = count >= config.threshold * config.minutes
      } else if (config.type === 'llm_failures') {
        // Count LLM errors by filtering category later (simple implementation)
        const { count: llmCount } = await supabaseAdmin
          .from('error_logs')
          .select('*', { count: 'exact', head: true })
          .eq('category', 'llm')
          .gte('created_at', new Date(Date.now() - config.minutes * 60000).toISOString())

        count = llmCount || 0
        shouldTrigger = count >= config.threshold * config.minutes
      } else if (config.type === 'db_issues') {
        // Count DB errors
        const { count: dbCount } = await supabaseAdmin
          .from('error_logs')
          .select('*', { count: 'exact', head: true })
          .eq('category', 'db')
          .gte('created_at', new Date(Date.now() - config.minutes * 60000).toISOString())

        count = dbCount || 0
        shouldTrigger = count >= config.threshold * config.minutes
      }

      if (shouldTrigger) {
        const recentlyTriggered = await wasRecentlyTriggered(config.type, config.cooldownMinutes || 30)
        if (!recentlyTriggered) {
          await createAlert(config, count)
        }
      }
    } catch (error) {
      console.error('Error during alert check:', error)
    }
  }
}

// Helper to check if an alert was recently triggered
async function wasRecentlyTriggered(alertType: string, cooldownMinutes: number): Promise<boolean> {
  try {
    const cooldownTime = new Date(Date.now() - cooldownMinutes * 60000).toISOString()

    const { data, error } = await supabaseAdmin
      .from('error_alerts')
      .select('*')
      .eq('alert_type', alertType)
      .gte('last_triggered_at', cooldownTime)
      .limit(1)

    if (error) throw error

    return (data || []).length > 0
  } catch (error) {
    console.error('Failed to check recent alerts:', error)
    return false
  }
}

// Helper to create a new alert and event record
async function createAlert(config: AlertConfig, count: number) {
  try {
    const now = new Date().toISOString()

    // Create or update the alert record
    const { data: existingAlerts } = await supabaseAdmin
      .from('error_alerts')
      .select('*')
      .eq('alert_type', config.type)
      .eq('status', 'open')
      .limit(1)

    if ((existingAlerts || []).length > 0) {
      // Update existing alert
      const alert = existingAlerts![0]
      await supabaseAdmin
        .from('error_alerts')
        .update({ last_triggered_at: now, severity: config.severity })
        .eq('id', alert.id)
    } else {
      // Create new alert
      const { data: newAlert, error: alertError } = await supabaseAdmin
        .from('error_alerts')
        .insert({
          alert_type: config.type,
          severity: config.severity,
          threshold: { threshold: config.threshold, minutes: config.minutes },
          status: 'open',
          last_triggered_at: now
        })
        .select()
        .single()

      if (alertError) throw alertError

      // Create alert event record
      await supabaseAdmin
        .from('error_alert_events')
        .insert({
          alert_id: newAlert.id,
          message: buildAlertMessage(config, count),
          meta: { count, period_minutes: config.minutes }
        })
    }

    // Optional: send external notification (Slack/email)
    await sendNotification(buildAlertMessage(config, count))
  } catch (error) {
    console.error('Failed to create alert:', error)
  }
}

function buildAlertMessage(config: AlertConfig, count: number): string {
  if (config.type === 'high_error_rate') {
    return `High error rate detected: ${count} errors in last ${config.minutes} minutes (threshold: ${config.threshold}/min)`
  }
  if (config.type === 'llm_failures') {
    return `LLM failures detected: ${count} errors in last ${config.minutes} minutes (threshold: ${config.threshold}/min)`
  }
  if (config.type === 'db_issues') {
    return `Database issues detected: ${count} errors in last ${config.minutes} minutes (threshold: ${config.threshold}/min)`
  }
  return 'Alert triggered'
}

// Placeholder for external notifications
async function sendNotification(message: string) {
  try {
    const webhook = process.env.ALERT_WEBHOOK_URL
    if (!webhook) return

    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message })
    })
  } catch (error) {
    console.error('Failed to send alert notification:', error)
  }
}
