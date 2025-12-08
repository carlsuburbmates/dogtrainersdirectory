import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import fs from 'fs/promises'
import path from 'path'

// Expected enum values from the schema blueprint
const EXPECTED_ENUMS = {
  age_specialty: [
    'puppies_0_6m',
    'adolescent_6_18m', 
    'adult_18m_7y',
    'senior_7y_plus',
    'rescue_dogs'
  ],
  behaviour_issue: [
    'pulling_on_lead',
    'separation_anxiety',
    'excessive_barking',
    'dog_aggression',
    'leash_reactivity',
    'jumping_up',
    'destructive_behaviour',
    'recall_issues',
    'anxiety_general',
    'resource_guarding',
    'mouthing_nipping_biting',
    'rescue_dog_support',
    'socialisation'
  ],
  service_type: [
    'puppy_training',
    'obedience_training',
    'behaviour_consultations',
    'group_classes',
    'private_training'
  ],
  resource_type: [
    'trainer',
    'behaviour_consultant',
    'emergency_vet',
    'urgent_care',
    'emergency_shelter'
  ]
}

export async function GET() {
  try {
    // 1. Get enum values from database
    const [ageConstraints, issueConstraints, serviceConstraints, resourceConstraints] = await Promise.all([
      // Get CHECK constraint for age_specialty
      supabaseAdmin
        .rpc('get_enum_values', { 
          constraint_name: 'businesses_age_specialty_check' 
        })
        .catch(() => ({ data: null, error: 'Not found' })),
      
      // Get CHECK constraint for behaviour_issues
      supabaseAdmin
        .rpc('get_enum_values', { 
          constraint_name: 'businesses_behaviour_issues_check' 
        })
        .catch(() => ({ data: null, error: 'Not found' })),
      
      // Get enum values from businesses table
      supabaseAdmin
        .from('businesses')
        .select('resource_type')
        .not('resource_type', 'is', null),
      
      // Get service_type values from businesses table
      supabaseAdmin
        .from('businesses')
        .select('service_type_primary')
        .not('service_type_primary', 'is', null)
    ])

    // Collect unique values
    const dbEnums = {
      age_specialty: ageConstraints.data?.[0]?.enum_values ? 
        ageConstraints.data[0].enum_values.split(',').map((v: string) => v.trim().replace(/[{}']/g, '')) : [],
      behaviour_issue: issueConstraints.data?.[0]?.enum_values ?
        issueConstraints.data[0].enum_values.split(',').map((v: string) => v.trim().replace(/[{}']/g, '')) : [],
      service_type: [...new Set(serviceConstraints.data?.map((r: any) => r.service_type_primary))],
      resource_type: [...new Set(resourceConstraints.data?.map((r: any) => r.resource_type))]
    }

    // 2. Compare with expected values
    const validationResults = {}
    let isConsistent = true
    
    for (const [enumName, expectedValues] of Object.entries(EXPECTED_ENUMS)) {
      const actualValues = dbEnums[enumName as keyof typeof dbEnums] || []
      const expectedSet = new Set(expectedValues)
      const actualSet = new Set(actualValues)
      
      // Find mismatches
      const missing = expectedValues.filter(v => !actualSet.has(v))
      const extra = actualValues.filter(v => !expectedSet.has(v))
      
      if (missing.length > 0 || extra.length > 0) {
        isConsistent = false
      }
      
      validationResults[enumName] = {
        expected: expectedValues,
        actual: actualValues,
        missing,
        extra,
        consistent: missing.length === 0 && extra.length === 0
      }
    }

    // 3. Validate suburb count and council mapping
    let suburbValidation = null
    try {
      // Get suburbs data from CSV file if available
      const csvPath = path.join(process.cwd(), 'suburbs_councils_mapping.csv')
      const csvContent = await fs.readFile(csvPath, 'utf-8')
      const lines = csvContent.split('\n')
      
      // Skip header and count unique suburbs
      const uniqueSuburbs = new Map()
      // Skip header (if it exists)
      const startIdx = lines[0]?.includes('suburb') ? 1 : 0
      
      for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i].trim()
        if (line) {
          const [suburb] = line.split(',')
          if (suburb && !uniqueSuburbs.has(suburb.trim())) {
            uniqueSuburbs.set(suburb.trim(), true)
          }
        }
      }
      
      const csvSuburbCount = uniqueSuburbs.size
      
      // Get database suburb count
      const { count: dbSuburbCount, error: suburbError } = await supabaseAdmin
        .from('suburbs')
        .select('id', { count: 'exact', head: true })
      
      suburbValidation = {
        csvSuburbCount,
        dbSuburbCount: dbSuburbCount || 0,
        consistent: csvSuburbCount === (dbSuburbCount || 0),
        mismatch: Math.abs(csvSuburbCount - (dbSuburbCount || 0))
      }
      
      if (suburbValidation.mismatch > 0) {
        isConsistent = false
      }
    } catch (error) {
      console.warn('CSV validation failed:', error)
      suburbValidation = {
        error: 'CSV validation failed',
        csvSuburbCount: null,
        dbSuburbCount: null,
        consistent: false
      }
      isConsistent = false
    }

    // 4. Test distance calculation between Fitzroy and Brighton
    const distanceTest = await testDistanceCalculation()
    if (!distanceTest.success) {
      isConsistent = false
    }

    return NextResponse.json({
      overallConsistent: isConsistent,
      enums: validationResults,
      suburbs: suburbValidation,
      distanceTest,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Validation endpoint error:', error)
    return NextResponse.json(
      { error: 'Validation failed', message: error?.message },
      { status: 500 }
    )
  }
}

async function testDistanceCalculation(): Promise<{
  success: boolean
  calculatedDistance?: number
  expectedDistance?: number
  error?: string
}> {
  try {
    // Fitzroy coordinates: -37.8013, 144.9787
    // Brighton coordinates: -37.9167, 145.0000
    // Expected distance: ~10.5-12.5 km
    
    const { data, error } = await supabaseAdmin.rpc('calculate_distance', {
      lat1: -37.8013,
      lon1: 144.9787,
      lat2: -37.9167,
      lon2: 145.0000
    })
    
    if (error) {
      return {
        success: false,
        error: error.message
      }
    }
    
    const calculatedDistance = Number(data)
    const expectedDistance = 10.5 // Lower bound of expected range
    const tolerance = 2.0 // Accept variance of ±2km
    
    if (Math.abs(calculatedDistance - expectedDistance) <= tolerance) {
      return {
        success: true,
        calculatedDistance,
        expectedDistance
      }
    } else {
      return {
        success: false,
        calculatedDistance,
        expectedDistance,
        error: `Distance calculation out of range. Calculated: ${calculatedDistance}, Expected: ${expectedDistance}±${tolerance}`
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Unknown error'
    }
  }
}