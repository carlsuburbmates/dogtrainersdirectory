import { describe, it, expect, vi } from 'vitest'
import { stripJsonp, parseAbrJson, fetchAbrJson } from './abr'
import { parseAbrSoap } from './abr'

describe('ABR JSONP parsing utilities', () => {
  it('stripJsonp should remove callback wrappers', () => {
    const raw = "callback({\"ABN\":\"12345678901\"});\n"
    const stripped = stripJsonp(raw)
    expect(stripped).toBe('{"ABN":"12345678901"}')
  })

  it('parseAbrJson should parse JSONP and JSON', () => {
    const raw = 'cbName({' + '"Response": {"ResponseBody": {"ABN": "123"}}' + '});'
    const parsed = parseAbrJson(raw)
    expect(parsed?.Response?.ResponseBody?.ABN).toBe('123')

    const rawJson = '{"Response": {"ResponseBody": {"ABN": "456"}}}'
    const parsed2 = parseAbrJson(rawJson)
    expect(parsed2?.Response?.ResponseBody?.ABN).toBe('456')
  })

  it('fetchAbrJson should call fetch and parse correctly (mocked)', async () => {
    const fakeBody = 'cb({' + '"Response": {"ResponseBody": {"ABN": "999"}}' + '});'
    const fetchMock = vi.fn(() => Promise.resolve({ status: 200, text: () => Promise.resolve(fakeBody) }))
    // @ts-ignore override global fetch
    globalThis.fetch = fetchMock

    const result = await fetchAbrJson('999')
    expect(result.status).toBe(200)
    expect(result.parsed?.Response?.ResponseBody?.ABN).toBe('999')
    expect(fetchMock).toHaveBeenCalled()
  })

  it('parseAbrSoap should extract fields from a full SOAP payload', () => {
    const soap = `<?xml version="1.0"?>
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <ABRSearchByABNResponse>
          <ABRSearchByABNResult>
            <Response>
              <ResponseBody>
                <ABN>53004085616</ABN>
                <ABNStatus>Active</ABNStatus>
                <EntityName>LOOSE LEAD TRAINING FITZROY PTY LTD</EntityName>
                <BusinessName>Loose Lead Training</BusinessName>
                <BusinessName>LLT Fitzroy</BusinessName>
                <GstFlag>Y</GstFlag>
                <GstEffectiveFrom>2024-01-01</GstEffectiveFrom>
                <MainBusinessAddress>
                  <State>VIC</State>
                  <Postcode>3065</Postcode>
                </MainBusinessAddress>
              </ResponseBody>
            </Response>
          </ABRSearchByABNResult>
        </ABRSearchByABNResponse>
      </soap:Body>
    </soap:Envelope>`

    const parsed = parseAbrSoap(soap)
    expect(parsed).toBeTruthy()
    expect(parsed?.Response?.ResponseBody?.ABN).toBe('53004085616')
    expect(parsed?.Response?.ResponseBody?.ABNStatus).toBe('Active')
    expect(parsed?.Response?.ResponseBody?.EntityName).toContain('LOOSE LEAD')
    expect(parsed?.Response?.ResponseBody?.BusinessName?.length).toBeGreaterThan(0)
    expect(parsed?.Response?.ResponseBody?.Gst?.GstFlag).toBe('Y')
    expect(parsed?.Response?.ResponseBody?.MainBusinessAddress?.State).toBe('VIC')
  })

  it('parseAbrSoap should handle suppressed/partial SOAP responses', () => {
    const soap = `<?xml version="1.0"?><soap:Envelope><soap:Body><ABRSearchByABNResponse><ABRSearchByABNResult><Response><ResponseBody><ABN>11111111111</ABN><ABNStatus>Active</ABNStatus></Response></Response></ABRSearchByABNResult></ABRSearchByABNResponse></soap:Body></soap:Envelope>`
    const p = parseAbrSoap(soap)
    expect(p?.Response?.ResponseBody?.ABN).toBe('11111111111')
    expect(p?.Response?.ResponseBody?.EntityName).toBeUndefined()
  })

  it('parseAbrSoap should represent cancelled status and historical ABN', () => {
    const soap = `<?xml version="1.0"?><soap:Envelope><soap:Body><ABRSearchByABNResponse><ABRSearchByABNResult><Response><ResponseBody><ABN>22222222222</ABN><ABNStatus>Cancelled</ABNStatus><DateCancelled>2024-10-10</DateCancelled><PreviousAbn>33333333333</PreviousAbn><PreviousAbn>44444444444</PreviousAbn></Response></Response></ABRSearchByABNResult></ABRSearchByABNResponse></soap:Body></soap:Envelope>`
    const p = parseAbrSoap(soap)
    expect(p?.Response?.ResponseBody?.ABNStatus).toBe('Cancelled')
    expect(p?.Response?.ResponseBody?.PreviousAbn?.length).toBe(2)
  })
})
