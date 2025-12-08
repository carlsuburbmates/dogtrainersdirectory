#!/usr/bin/env node
/*
Evaluation harness that reuses small helpers in src/lib/eval.ts so unit tests can import functions.
*/

import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import { tinyPredictor, scoreAgainstGold } from '../src/lib/eval'

type Case = { id?: string | number; text: string; gold_label: string }

async function loadCases(filePath: string): Promise<Case[]> {
  const raw = fs.readFileSync(path.resolve(filePath), { encoding: 'utf8' })
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
    if (parsed.cases && Array.isArray(parsed.cases)) return parsed.cases
    throw new Error('Input JSON must be an array of cases or an object with a cases array.')
  } catch (err) {
    const lines = raw.trim().split('\n')
    const cases: Case[] = lines.map(l => JSON.parse(l))
    return cases
  }
}

async function run() {
  const args = process.argv.slice(2)
  const argv: Record<string, string> = {}
  for (const a of args) {
    if (a.startsWith('--')) {
      const [k, v = ''] = a.slice(2).split('=')
      argv[k] = v
    }
  }

  const pipeline = argv.pipeline || 'triage'
  const input = argv.input || 'src/tests/fixtures/ai_golden_triage_sample.json'
  const datasetVersion = argv['dataset-version'] || 'dev-1'

  console.log(`Running offline evaluation: pipeline=${pipeline}, input=${input}, datasetVersion=${datasetVersion}`)

  const cases = await loadCases(input)
  const predictions = cases.map(c => tinyPredictor(c as any, pipeline))
  const golds = cases.map(c => c.gold_label)
  const { total, correct, accuracy, falsePos, falseNeg } = scoreAgainstGold(predictions, golds)

  console.log('RESULTS:', { total, correct, accuracy: accuracy.toFixed(2), falsePos, falseNeg })

  // persist into DB if supabase credentials are available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (supabaseUrl && supabaseKey) {
    console.log('Supabase credentials detected — inserting ai_evaluation_runs row')
    const client = createClient(supabaseUrl, supabaseKey)
    try {
      const insert = await client
        .from('ai_evaluation_runs')
        .insert({
          pipeline,
          dataset_version: datasetVersion,
          total_cases: total,
          correct_predictions: correct,
          accuracy_pct: Number(accuracy.toFixed(2)),
          false_positives: falsePos,
          false_negatives: falseNeg,
          metadata: { input_file: path.basename(input) }
        })

      if (insert.error) {
        console.error('Supabase insert failed:', insert.error)
      } else {
        console.log('Inserted evaluation run id:', insert.data?.[0]?.id)
      }
    } catch (err) {
      console.error('Error inserting into supabase', err)
    }
  } else {
    console.log('No supabase service role key present — not persisting results to the DB (dry-run).')
  }
}

if (require.main === module) {
  run().catch(err => {
    console.error(err)
    process.exit(1)
  })
}
