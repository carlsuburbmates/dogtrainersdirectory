import { NextResponse } from 'next/server'
import { classifyEmergency, logEmergencyClassification } from '@/lib/emergency'

const GUIDANCE: Record<string, string> = {
  medical: 'Contact the nearest 24/7 emergency vet. If breathing is compromised or bleeding is severe, call before travelling so the team can prepare.',
  stray: 'Log the dog with the Lost Dogs Home or your council ranger. They have microchip scanners and the legal mandate to hold animals safely.',
  crisis: 'If someone is at risk of being bitten, separate the dog and contact a behaviour consultant who offers emergency remote or in-home support.',
  normal: 'Standard trainer search should meet your needs. Start with behaviour filters or age stage on the home page.'
}

export async function POST(request: Request) {
  try {
    const { description, suburbId, user_lat, user_lng } = await request.json()
    if (!description || typeof description !== 'string') {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 })
    }

    const result = await classifyEmergency(description)
    const logId = await logEmergencyClassification({
      description,
      predicted_category: result.category,
      recommended_flow: result.category,
      confidence: result.confidence,
      suburbId,
      user_lat,
      user_lng,
      decision_source: result.ai_result?.source === 'heuristic' ? 'deterministic' : 
                       result.ai_result?.source === 'manual' ? 'manual_override' : 
                       result.ai_result?.source || 'deterministic',
      ai_mode: result.ai_result?.meta?.mode,
      ai_provider: result.ai_result?.meta?.llmProvider,
      ai_model: result.ai_result?.meta?.model
    })

    return NextResponse.json({
      logId,
      category: result.category,
      confidence: result.confidence,
      reasoning: result.reasoning,
      guidance: GUIDANCE[result.category] ?? GUIDANCE.normal
    })
  } catch (error: any) {
    console.error('Emergency triage error', error)
    return NextResponse.json({ error: 'Unable to classify emergency' }, { status: 500 })
  }
}
