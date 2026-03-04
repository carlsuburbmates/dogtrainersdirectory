import type { SuburbResult } from '@/lib/api'

type GetSuburbById = (id: number) => Promise<SuburbResult | null>

export interface RehydratedTriageLocation {
  suburbId: number | null
  selectedSuburb: SuburbResult | null
}

export const parseCanonicalSuburbId = (value: string | null): number | null => {
  if (!value) {
    return null
  }

  const suburbId = Number(value)

  if (!Number.isInteger(suburbId) || suburbId < 1) {
    return null
  }

  return suburbId
}

export const rehydrateTriageLocation = async (
  value: string | null,
  getSuburbById: GetSuburbById
): Promise<RehydratedTriageLocation> => {
  const suburbId = parseCanonicalSuburbId(value)

  if (suburbId === null) {
    return {
      suburbId: null,
      selectedSuburb: null
    }
  }

  return {
    suburbId,
    selectedSuburb: await getSuburbById(suburbId)
  }
}
