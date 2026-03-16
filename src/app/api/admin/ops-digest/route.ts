import { NextResponse } from 'next/server'
import { runDailyDigest } from '@/lib/digest'

export async function POST(request: Request) {
  try {
    // Check if force flag is set
    const url = new URL(request.url)
    const force = url.searchParams.get('force') === 'true'

    // Generate daily digest
    const result = await runDailyDigest(force)

    if (!result.persisted) {
      return NextResponse.json(
        {
          error: 'Ops digest evidence is not reviewable in this environment',
          digest: result.digest,
          runtimeMode: result.runtimeMode,
          evidenceReviewable: result.evidenceReviewable,
          countsAsNewEvidence: result.countsAsNewEvidence,
          persistenceNote: result.persistenceNote,
          usedCachedDigest: result.usedCachedDigest
        },
        { status: 503 }
      )
    }

    return NextResponse.json({
      success: true,
      digest: result.digest,
      runtimeMode: result.runtimeMode,
      evidenceReviewable: result.evidenceReviewable,
      countsAsNewEvidence: result.countsAsNewEvidence,
      persistenceNote: result.persistenceNote,
      usedCachedDigest: result.usedCachedDigest
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to generate ops digest', message: error.message },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
