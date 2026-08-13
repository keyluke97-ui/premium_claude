// check-first-time.js - 사업자번호로 가격 구분(기본가/신규/재신청) 조회
//
// CHANGED: 이 응답은 **화면 미리보기 전용**이다. 최종 가격은 submit.js 가 같은
//   resolvePriceTier()로 다시 판정해 결정한다. 여기 값이 조작돼도 청구엔 영향이 없다.

import { buildCorsHeaders } from './jwt-utils.js'
import { resolvePriceTier, isValidBusinessNumber } from './price-tier.js'
import { PRICE_TIER } from '../../src/constants/pricing.js'

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

    if (!isValidBusinessNumber(businessNumber)) {
      return jsonResponse({ error: '올바른 사업자 번호 형식이 아닙니다.' }, 400)
    }

    // CHANGED: 판정 로직을 price-tier.js 로 일원화 (submit.js 와 동일 함수)
    const tier = await resolvePriceTier({
      apiKey: API_KEY,
      baseId: BASE_ID,
      tableId: TABLE_ID,
      businessNumber,
    })

    // isReturning 은 기존 호출자 호환용. 신규 코드는 tier 를 쓴다.
    return jsonResponse({ tier, isReturning: tier === PRICE_TIER.RETURNING })
  } catch (err) {
    return jsonResponse({ error: err.message }, 500)
  }
}

export const config = {
  path: '/api/check-first-time',
}
