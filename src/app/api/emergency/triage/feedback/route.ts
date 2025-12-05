import { NextResponse } from 'next/server'
import { upsertEmergencyResolution, EmergencyFlow } from '@/lib/emergency'

export async function POST(request: Request) {
  try {
    const { logId, selectedFlow, predictedFlow } = await request.json()
    if (!logId || !selectedFlow) {
      return NextResponse.json({ error: 'Missing logId or selectedFlow' }, { status: 400 })
    }

    await upsertEmergencyResolution(Number(logId), selectedFlow as EmergencyFlow, predictedFlow)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Emergency triage feedback error', error)
    return NextResponse.json({ error: 'Unable to store feedback' }, { status: 500 })
  }
}
