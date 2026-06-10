// check-first-time.js - 사업자번호로 기존 신청 여부(재신청 여부) 조회 (재신청 할인 판단용)

import { buildCorsHeaders, sanitizeForFormula } from './jwt-utils.js'
import { TABLE_CONFIG } from './shared-constants.js'

const CORS_HEADERS = buildCorsHeaders('POST, OPTIONS')

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: CORS_HEADERS })
}

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('', { status: 200, headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const API_KEY = process.env.AIRTABLE_API_KEY
  const BASE_ID = process.env.AIRTABLE_BASE_ID
  const TABLE_ID = process.env.AIRTABLE_TABLE_ID || process.env.AIRTABLE_TABLE_NAME || '캠지기 모집 폼'

  if (!API_KEY || !BASE_ID) {
    return jsonResponse({ error: 'Airtable 환경변수가 설정되지 않았습니다.' }, 500)
  }

  try {
    const { businessNumber } = await req.json()

    if (!businessNumber) {
      return jsonResponse({ error: '사업자 번호를 입력해주세요.' }, 400)
    }

    // 하이픈 제거 후 숫자만 추출
    const cleanNumber = businessNumber.replace(/[^0-9]/g, '')

    if (!/^\d{10}$/.test(cleanNumber)) {
      return jsonResponse({ error: '올바른 사업자 번호 형식이 아닙니다.' }, 400)
    }

    // Airtable에서 해당 사업자번호로 기존 레코드 조회
    const fieldName = TABLE_CONFIG.premium.businessNumberField
    const filterFormula = encodeURIComponent(
      `SUBSTITUTE({${fieldName}}, '-', '')='${sanitizeForFormula(cleanNumber)}'`
    )

    const airtableUrl =
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_ID)}` +
      `?filterByFormula=${filterFormula}&maxRecords=1&fields%5B%5D=${encodeURIComponent(fieldName)}`

    const response = await fetch(airtableUrl, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    })

    if (!response.ok) {
      const errText = await response.text()
      return jsonResponse({ error: `Airtable 조회 실패 (${response.status})`, detail: errText }, 500)
    }

    const data = await response.json()
    // 재신청 여부: 기존 신청 이력(레코드)이 있으면 재신청자 → 할인 대상
    const isReturning = !!(data.records && data.records.length > 0)

    return jsonResponse({ isReturning })
  } catch (err) {
    return jsonResponse({ error: err.message }, 500)
  }
}

export const config = {
  path: '/api/check-first-time',
}
