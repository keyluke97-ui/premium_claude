// dashboard-auth.js - 사업자번호 + 캠핑장 이름 + 연락처 뒷자리 4자리로 인증, JWT 토큰 발급

import { signToken, sanitizeForFormula, buildCorsHeaders } from './jwt-utils.js' // CHANGED: M-1 - 공통 유틸 import

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
  const JWT_SECRET = process.env.JWT_SECRET

  if (!API_KEY || !BASE_ID || !JWT_SECRET) {
    return jsonResponse({ error: '서버 환경변수가 설정되지 않았습니다.' }, 500)
  }

  try {
    const { businessNumber, accommodationName, phoneLastFour } = await request.json()

    if (!businessNumber || !accommodationName || !phoneLastFour) {
      return jsonResponse({ error: '사업자 번호, 캠핑장 이름, 연락처 뒷자리를 모두 입력해주세요.' }, 400)
    }

    // CHANGED: 연락처 뒷자리 4자리 형식 검증
    const cleanPhoneLastFour = phoneLastFour.replace(/[^0-9]/g, '')
    if (cleanPhoneLastFour.length !== 4) {
      return jsonResponse({ error: '연락처 뒷자리 4자리를 정확히 입력해주세요.' }, 400)
    }

    const cleanNumber = businessNumber.replace(/[^0-9]/g, '')

    // CHANGED: S-1 - filterByFormula 인젝션 방지: accommodationName 이스케이프 적용
    // cleanNumber는 숫자만 허용하므로 추가 이스케이프 불필요
    const filterFormula = encodeURIComponent(
      `AND({사업자 번호}='${cleanNumber}', {숙소 이름을 적어주세요.}='${sanitizeForFormula(accommodationName)}')`
    )

    // CHANGED: 연락처 필드도 함께 조회하여 뒷자리 검증에 사용
    const fieldsQuery = 'fields%5B%5D=' + encodeURIComponent('연락처')

    const airtableUrl =
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_ID)}` +
      `?filterByFormula=${filterFormula}&${fieldsQuery}&maxRecords=1`

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
      return jsonResponse({ error: '인증 정보가 일치하지 않습니다.' }, 401)
    }

    const matchedRecord = records[0]

    // CHANGED: 연락처 뒷자리 4자리 검증
    const storedPhone = (matchedRecord.fields['연락처'] || '').replace(/[^0-9]/g, '')
    const storedLastFour = storedPhone.slice(-4)

    if (!storedLastFour || storedLastFour !== cleanPhoneLastFour) {
      return jsonResponse({ error: '인증 정보가 일치하지 않습니다.' }, 401)
    }

    // JWT 토큰 발급 (recordId + 캠핑장 이름 포함)
    const token = signToken(
      {
        recordId: matchedRecord.id,
        accommodationName,
        businessNumber: cleanNumber,
      },
      JWT_SECRET
    )

    return jsonResponse({
      success: true,
      token,
      accommodationName,
    })
  } catch (error) {
    return jsonResponse({ error: error.message }, 500)
  }
}

export const config = {
  path: '/api/dashboard/auth',
}
