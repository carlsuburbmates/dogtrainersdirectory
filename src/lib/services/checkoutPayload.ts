type RawCheckoutPayload = Partial<{
  businessId: unknown
  business_id: unknown
}>

export const parseCheckoutPayload = (payload: unknown) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { businessId: null as number | null }
  }

  const body = payload as RawCheckoutPayload
  const businessId = Number(body.businessId ?? body.business_id)

  return {
    businessId: Number.isFinite(businessId) && businessId > 0 ? businessId : null
  }
}
