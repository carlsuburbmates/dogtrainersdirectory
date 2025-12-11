// Emergency Triage API - Phase A of AI Automation
// Classifies text-based help requests into actionable categories

import { NextRequest, NextResponse } from 'next/server'
import { classifyEmergency } from '@/lib/emergencyTriage'
import { detectMedicalEmergency } from '@/lib/medicalDetector'
import { logAPIError, logError } from '@/lib/errorLog'
import { createTriageLog, createTriageEvent } from '@/lib/triageLog'
import type { MedicalResult } from '@/lib/triageLog'
import { recordLatencyMetric } from '@/lib/telemetryLatency'

const normalizeSuburbId = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export async function POST(request: NextRequest) {
  const start = Date.now()
  let suburbId: number | null = null

  const recordMetric = async (statusCode: number, success: boolean) => {
    await recordLatencyMetric({
      area: 'emergency_triage_api',
      route: '/api/emergency/triage',
      durationMs: Date.now() - start,
      statusCode,
      success,
      metadata: suburbId ? { suburbId } : undefined
    })
  }
  
  try {
    const body = await request.json()
    const { message } = body
    suburbId = normalizeSuburbId(body.suburbId)
    
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      await recordMetric(400, false)
      return NextResponse.json(
        { 
          error: 'Message is required and must be a non-empty string', 
          code: 'INVALID_INPUT',
          details: { providedMessage: message }
        }, 
        { status: 400 }
      )
    }
    
// Step 1: Classification and medical detection
    let llmStart = Date.now()
    let classification: any
    let medicalResult: MedicalResult | null = null
    let llmLatency = 0
    let tokenCount = { prompt: 0, completion: 0, total: 0 }
    let llmError: Error | null = null
    // Note: We'll log events after triage log is created since createTriageEvent needs triage_log_id
    
    try {
      classification = await classifyEmergency(message)
      llmLatency = Date.now() - llmStart
      
      // If medical, also run medical detector
      if (classification.classification === 'medical') {
        const medicalStart = Date.now()
        try {
          medicalResult = await detectMedicalEmergency(message)
        } catch (medicalErr) {
          medicalResult = {
            is_medical: false,
            severity: 'minor',
            symptoms: [] as string[],
            recommended_resources: [] as MedicalResult['recommended_resources'],
            vet_wait_time_critical: false
          }
          await logError('Medical detector failed', { route: '/api/emergency/triage', method: 'POST', extra: { error: medicalErr instanceof Error ? medicalErr.message : medicalErr } }, 'warn')
        }
      }
      
      // If LLM response includes token info, extract it (implementation-dependent)
      // For now we set defaults
      tokenCount = { prompt: 120, completion: 30, total: 150 } // Example values
    } catch (err) {
      llmError = err as Error
      llmLatency = Date.now() - llmStart
      classification = {
        classification: 'other',
        confidence: 0.5,
        summary: 'Classification failed',
        recommended_action: 'other',
        urgency: 'moderate'
      }
      await logError('LLM classification failed', { route: '/api/emergency/triage', method: 'POST', extra: { error: llmError instanceof Error ? llmError.message : llmError } }, 'error', 'llm')
    }
    
    const totalDuration = Date.now() - start
    
    // Step 2: Log to database
    let triageLogId: string | null = null
    try {
      triageLogId = await createTriageLog({
        message,
        suburbId: suburbId ?? undefined,
        classification,
        medical: medicalResult,
        tokens: tokenCount,
        durationMs: totalDuration,
        source: 'api',
        requestMeta: { 
          userAgent: request.headers.get('user-agent'),
          // Note: client IP extraction needs to be done via headers
          xForwardedFor: request.headers.get('x-forwarded-for'),
          xRealIp: request.headers.get('x-real-ip')
        }
      })
    } catch (dbErr) {
      await logAPIError('/api/emergency/triage', 'POST', 500, dbErr, { 
        extra: { suburbId, classification, medicalResult, durationMs: totalDuration } 
      })
    }
    
    // Step 3: Log event details if we have a triage log ID
    if (triageLogId) {
      // Update the temporary LLM event with proper ID
      try {
        // Since we don't have update, we just log new events
        await createTriageEvent(triageLogId, 'llm_call', 
          { message, suburbId, llmProvider: 'openai', llmModel: 'gpt-4' }, llmLatency)
        if (medicalResult) {
          await createTriageEvent(triageLogId, 'postprocess', { medicalResult })
        }
        await createTriageEvent(triageLogId, 'persist', { success: true, logId: triageLogId })
      } catch (eventErr) {
        await logError('Event logging failed', { extra: { error: eventErr instanceof Error ? eventErr.message : eventErr, triageLogId } }, 'error')
      }
    }
    
    await recordMetric(200, true)
    return NextResponse.json({
      success: true,
      classification,
      medical: medicalResult, // Include medical detection if performed
      triageLogId,
      latency: {
        llm: llmLatency,
        total: totalDuration
      },
      tokenUsage: tokenCount,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    const duration = Date.now() - start
    
    await logAPIError('/api/emergency/triage', 'POST', 500, error, 
      { extra: { suburbId, durationMs: duration } })
    await recordMetric(500, false)
    return NextResponse.json(
      { 
        error: 'Failed to classify emergency', 
        code: 'CLASSIFICATION_ERROR',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Simple test page for triage classification
  return new Response(`
<!DOCTYPE html>
<html>
<head>
  <title>Emergency Triage Test</title>
  <script>
    async function classifyEmergency() {
      const message = document.getElementById('message').value;
      const suburbId = document.getElementById('suburbId').value || null;
      
      try {
        const response = await fetch('/api/emergency/triage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, suburbId })
        });
        
        const result = await response.json();
        
        alert('Classification success! See console for details');
        console.log('Result:', result);
        
        // Display classification details
        document.getElementById('result').innerHTML = JSON.stringify(result, null, 2);
        
        // If medical, show medical details
        if (result.medical) {
          document.getElementById('medical').innerHTML = JSON.stringify(result.medical, null, 2);
        }
      } catch (error) {
        alert('Error: ' + error.message);
        console.error(error);
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
    .form {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }
    textarea {
      width: 100%;
      min-height: 100px;
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 16px;
      margin-bottom: 1rem;
      resize: vertical;
    }
    input {
      display: block;
      width: 100%;
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 16px;
      margin-bottom: 1rem;
    }
    button {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
      margin-bottom: 1rem;
    }
    button:hover {
      background: #2563eb;
    }
    pre {
      background: #f5f5f5;
      padding: 1rem;
      border-radius: 4px;
      overflow-x: auto;
      margin-bottom: 1rem;
    }
    .section {
      margin-bottom: 2rem;
    }
    .section h3 {
      margin-bottom: 0.5rem;
    }
  </style>
</head>
<body>
  <h1>Emergency Triage Test</h1>
  
  <div class="form">
    <p>This page allows you to test the emergency triage classification system.</p>
    
    <div class="section">
      <label for="message">Emergency Description:</label>
      <textarea id="message" placeholder="Describe the emergency situation..."></textarea>
    </div>
    
    <div class="section">
      <label for="suburbId">Suburb ID (optional):</label>
      <input id="suburbId" type="number" placeholder="1234" />
    </div>
    
    <button onclick="classifyEmergency()">Classify Emergency</button>
    
    <div class="section">
      <h3>JSON Response:</h3>
      <pre id="result"></pre>
    </div>
    
    <div class="section" id="medical-section" style="display:none;">
      <h3>Medical Details:</h3>
      <pre id="medical"></pre>
    </div>
  </div>
  
  <div>
    <a href="/admin/errors">← Back to Error Dashboard</a>
  </div>
  
  <script>
    // Fetch test data to show examples
    fetch('/api/test/examples')
      .then(r => r.json())
      .then(examples => {
        if (document.getElementById('message')) {
          document.getElementById('message').placeholder = 'Examples: ' + examples.messages.join(' | ');
        }
      })
      .catch(() => {}); // Ignore errors
  </script>
</body>
</html>  `, {
    headers: { 'Content-Type': 'text/html' }
  })
}
