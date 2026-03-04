import { redirect } from 'next/navigation'

type SearchParamValue = string | string[] | undefined

const appendSearchParams = (
  query: URLSearchParams,
  key: string,
  value: SearchParamValue
) => {
  if (Array.isArray(value)) {
    for (const entry of value) {
      query.append(key, entry)
    }
    return
  }

  if (typeof value === 'string') {
    query.set(key, value)
  }
}

/**
 * Redirect /trainer/[id] to /trainers/[id] (plural)
 * Maintains backward compatibility while standardizing on plural form
 */
export default async function TrainerRedirectPage({
  params,
  searchParams
}: {
  params: { id: string }
  searchParams?: Record<string, SearchParamValue>
}) {
  const resolvedParams = await Promise.resolve(params as any)
  const resolvedSearchParams = (await Promise.resolve(searchParams ?? {})) as Record<string, SearchParamValue>
  const id = resolvedParams.id
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(resolvedSearchParams) as Array<[string, SearchParamValue]>) {
    appendSearchParams(query, key, value)
  }

  const destination = query.toString()
    ? `/trainers/${id}?${query.toString()}`
    : `/trainers/${id}`

  redirect(destination)
}
