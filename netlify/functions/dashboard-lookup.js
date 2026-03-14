// dashboard-lookup.js - 사업자번호로 캠지기 모집 폼 검색, 캠핑장 목록 반환

import { buildCorsHeaders } from './jwt-utils.js' // CHANGED: M-1 - 공통 유틸 import

// CHANGED: S-2 - CORS 헤더를 buildCorsHeaders로 교체 (ALLOWED_ORIGIN 환경변수 지원)
const CORS_HEADERS = buildCorsHeaders('POST, OPTIONS')

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: CORS_HEADERS })
}

export default async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('', { status: 200, headers: CORS_HEADERS })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const API_KEY = process.env.AIRTABLE_API_KEY
  const BASE_ID = process.env.AIRTABLE_BASE_ID
  const TABLE_ID = process.env.AIRTABLE_TABLE_ID || '캠지기 모집 폼'

  if (!API_KEY || !BASE_ID) {
    return jsonResponse({ error: 'Airtable 환경변수가 설정되지 않았습니다.' }, 500)
  }

  try {
    const { businessNumber } = await request.json()

    if (!businessNumber || businessNumber.trim().length < 5) {
      return jsonResponse({ error: '사업자 번호를 입력해주세요.' }, 400)
    }

    const cleanNumber = businessNumber.replace(/[^0-9]/g, '')

    // Airtable에서 사업자 번호로 검색
    // cleanNumber는 숫자만 허용하므로 추가 이스케이프 불필요
    const filterFormula = encodeURIComponent(`{사업자 번호}='${cleanNumber}'`)
    const fieldsQuery = [
      'fields%5B%5D=' + encodeURIComponent('숙소 이름을 적어주세요.'),
      'fields%5B%5D=' + encodeURIComponent('사업자 번호'),
    ].join('&')

    // CHANGED: P-2 - maxRecords=50 추가 (무제한 조회 방지)
    const airtableUrl =
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_ID)}` +
      `?filterByFormula=${filterFormula}&${fieldsQuery}&maxRecords=50`

    const airtableResponse = await fetch(airtableUrl, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    })

    if (!airtableResponse.ok) {
      // CHANGED: S-4 - detail 필드 제거: Airtable 내부 오류 메시지를 클라이언트에 노출하지 않음
      return jsonResponse(
        { error: 'Airtable 조회 중 오류가 발생했습니다.' },
        airtableResponse.status
      )
    }

    const { records } = await airtableResponse.json()

    if (!records || records.length === 0) {
      return jsonResponse({ error: '해당 사업자 번호로 등록된 캠핑장이 없습니다.' }, 404)
    }

    // 중복 제거한 캠핑장 목록 반환
    const accommodationMap = new Map()
    for (const record of records) {
      const name = record.fields['숙소 이름을 적어주세요.'] || ''
      if (name && !accommodationMap.has(name)) {
        accommodationMap.set(name, record.id)
      }
    }

    const accommodations = Array.from(accommodationMap.entries()).map(
      ([name, recordId]) => ({ name, recordId })
    )

    return jsonResponse({ success: true, accommodations })
  } catch (error) {
    return jsonResponse({ error: error.message }, 500)
  }
}

export const config = {
  path: '/api/dashboard/lookup',
}
