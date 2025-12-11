// Test endpoint for triggering error alerts
import { NextRequest, NextResponse } from 'next/server'
import { checkAndTriggerAlerts } from '@/lib/errorAlerts'
import { logError } from '@/lib/errorLog'

export async function POST(request: NextRequest) {
  try {
    // Log a test error to create some data
    await logError('This is a test error to trigger alerts', {
      route: '/api/admin/errors/trigger-alert',
      method: 'POST'
    })

    // Force trigger alerts
    const customConfig = [
      {
        type: 'high_error_rate' as const,
        severity: 'medium' as const,
        threshold: 1, // Very low threshold for testing
        minutes: 1,
        cooldownMinutes: 1 // Short cooldown for testing
      }
    ]
    
    await checkAndTriggerAlerts(customConfig)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Alert test triggered. Check dashboard for results.',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to trigger test alert:', error)
    return NextResponse.json(
      { error: 'Failed to trigger test alert', 
        details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Simple page with test button
    return new Response(`
<!DOCTYPE html>
<html>
<head>
  <title>Alert Test</title>
  <script>
    async function triggerAlert() {
      const response = await fetch('/api/admin/errors/trigger-alert', {
        method: 'POST'
      });
      const result = await response.json();
      alert(result.message);
      if (result.success) {
        location.href = '/admin/errors';
      }
    }
  </script>
  <style>
    body {
      font-family: system-ui;
      max-width: 600px;
      margin: 0 auto;
      padding: 2rem;
    }
    .button {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 1rem;
    }
    .container {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.5rem;
      margin: 2rem 0;
    }
  </style>
</head>
<body>
  <h1>Error Alert Test</h1>
  <div class="container">
    <p>This page allows you to test the error alerting system. Click the button below to generate test errors and trigger alerts.</p>
    <button class="button" onclick="triggerAlert()">Trigger Test Alert</button>
  </div>
  <p><a href="/admin/errors">← Back to Error Dashboard</a></p>
</body>
</html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    })
  } catch (error) {
    console.error('Failed to serve alert test page:', error)
    return NextResponse.json(
      { error: 'Failed to load test page' }, 
      { status: 500 }
    )
  }
}