import { NextResponse } from 'next/server'
import { fetchEmergencyResources, EmergencyFlow } from '@/lib/emergency'

const DEFAULT_FLOW: EmergencyFlow = 'medical'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const flow = (url.searchParams.get('flow') as EmergencyFlow) || DEFAULT_FLOW
    const suburbIdParam = url.searchParams.get('suburbId')
    const suburbId = suburbIdParam ? Number(suburbIdParam) : undefined

    const data = await fetchEmergencyResources(flow, { suburbId })

    return NextResponse.json({
      flow,
      data
    })
  } catch (error: any) {
    console.error('Emergency resources fetch failed', error)
    return NextResponse.json({ error: 'Unable to load emergency resources' }, { status: 500 })
  }
}
