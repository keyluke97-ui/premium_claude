// dashboard-auth.js - 사업자번호 + 캠핑장 이름 + 연락처 뒷자리 4자리로 인증, JWT 토큰 발급
// CHANGED: type 필드 추가 — 'premium' | 'partner' 분기로 해당 테이블에서 인증

import { signToken, sanitizeForFormula, buildCorsHeaders, checkRateLimit, rateLimitResponse } from './jwt-utils.js'
// CHANGED: TABLE_CONFIG를 공통 상수 파일에서 import (중복 제거)
import { TABLE_CONFIG } from './shared-constants.js'

const CORS_HEADERS = buildCorsHeaders('POST, OPTIONS')

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: CORS_HEADERS })
}

/**
 * 협찬 유형에 따라 테이블 ID와 설정을 반환
 * @param {string} type - 'premium' | 'partner'
 * @returns {{ tableId: string, config: object } | null}
 */
function getTableSettings(type) {
  if (type === 'partner') {
    const tableId = process.env.AIRTABLE_PARTNER_CAMPAIGN_TABLE_ID
    if (!tableId) return null
    return { tableId, config: TABLE_CONFIG.partner }
  }
  // 기본값: premium
  const tableId = process.env.AIRTABLE_TABLE_ID || '캠지기 모집 폼'
  return { tableId, config: TABLE_CONFIG.premium }
}

export default async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('', { status: 200, headers: CORS_HEADERS })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const rateCheck = checkRateLimit(request)
  if (!rateCheck.allowed) {
    return rateLimitResponse(rateCheck.retryAfterSeconds, CORS_HEADERS)
  }

  const API_KEY = process.env.AIRTABLE_API_KEY
  const BASE_ID = process.env.AIRTABLE_BASE_ID
  const JWT_SECRET = process.env.JWT_SECRET

  if (!API_KEY || !BASE_ID || !JWT_SECRET) {
    return jsonResponse({ error: '서버 환경변수가 설정되지 않았습니다.' }, 500)
  }

  try {
    // CHANGED: types 배열 수신 — [{type, recordId}] 형태. 단일 type/recordId도 하위 호환
    const { businessNumber, accommodationName, phoneLastFour, recordId, type, types } = await request.json()

    if (!businessNumber || !accommodationName || !phoneLastFour) {
      return jsonResponse({ error: '사업자 번호, 캠핑장 이름, 연락처 뒷자리를 모두 입력해주세요.' }, 400)
    }

    const cleanPhoneLastFour = phoneLastFour.replace(/[^0-9]/g, '')
    if (cleanPhoneLastFour.length !== 4) {
      return jsonResponse({ error: '연락처 뒷자리 4자리를 정확히 입력해주세요.' }, 400)
    }

    const cleanNumber = businessNumber.replace(/[^0-9]/g, '')

    // CHANGED: types 배열이 있으면 사용, 없으면 단일 type/recordId로 하위 호환
    const typeEntries = Array.isArray(types) && types.length > 0
      ? types
      : [{ type: type === 'partner' ? 'partner' : 'premium', recordId }]

    // CHANGED: 연락처 검증 — typeEntries 중 하나라도 매칭되면 인증 성공
    // [설계 의도] lookup에서 연락처 기준으로 그룹핑했으므로,
    // 같은 그룹 = 같은 운영자(같은 연락처)가 보장됨.
    // 프리미엄/파트너 중 하나의 연락처만 매칭되면 전체 타입 인증 통과
    let phoneVerified = false
    const candidateRecordIds = {} // 연락처 검증 전 임시 저장

    for (const entry of typeEntries) {
      const entryType = entry.type === 'partner' ? 'partner' : 'premium'
      const tableSettings = getTableSettings(entryType)
      if (!tableSettings) continue

      const { tableId, config } = tableSettings

      try {
        let record

        if (entry.recordId) {
          // recordId 직접 조회
          const directUrl = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(tableId)}/${entry.recordId}`
          const directResponse = await fetch(directUrl, {
            headers: { Authorization: `Bearer ${API_KEY}` },
          })
          if (!directResponse.ok) continue
          record = await directResponse.json()

          // 사업자번호 검증
          const storedBusinessNumber = (record.fields[config.businessNumberField] || '').replace(/[^0-9]/g, '')
          if (storedBusinessNumber !== cleanNumber) continue
        } else {
          // filterByFormula fallback
          // CHANGED: cleanNumber도 sanitizeForFormula 적용 (방어적 코딩)
          const filterFormula = encodeURIComponent(
            `AND(SUBSTITUTE({${config.businessNumberField}}, '-', '')='${sanitizeForFormula(cleanNumber)}', {${config.accommodationNameField}}='${sanitizeForFormula(accommodationName)}')`
          )
          const fieldsQuery = 'fields%5B%5D=' + encodeURIComponent(config.phoneField)
          const airtableUrl =
            `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(tableId)}` +
            `?filterByFormula=${filterFormula}&${fieldsQuery}&maxRecords=1`
          const airtableResponse = await fetch(airtableUrl, {
            headers: { Authorization: `Bearer ${API_KEY}` },
          })
          if (!airtableResponse.ok) continue
          const { records } = await airtableResponse.json()
          if (!records || records.length === 0) continue
          record = records[0]
        }

        // CHANGED: recordId를 임시 Map에 저장 (연락처 검증 전)
        candidateRecordIds[entryType] = record.id

        // 연락처 검증 (아직 미검증 시에만)
        if (!phoneVerified) {
          const storedPhone = (record.fields[config.phoneField] || '').replace(/[^0-9]/g, '')
          const storedLastFour = storedPhone.slice(-4)
          if (storedLastFour && storedLastFour === cleanPhoneLastFour) {
            phoneVerified = true
          }
        }
      } catch (entryError) {
        console.error(`[auth] ${entryType} 조회 실패:`, entryError.message)
        continue
      }
    }

    if (!phoneVerified) {
      return jsonResponse({ error: '인증 정보가 일치하지 않습니다.' }, 401)
    }

    // CHANGED: 연락처 검증 통과 후에만 recordId 확정
    const verifiedRecordIds = { ...candidateRecordIds }

    // CHANGED: JWT payload에 타입별 recordId + availableTypes 포함
    const availableTypes = Object.keys(verifiedRecordIds)
    const token = signToken(
      {
        premiumRecordId: verifiedRecordIds.premium || null,
        partnerRecordId: verifiedRecordIds.partner || null,
        availableTypes,
        accommodationName,
        businessNumber: cleanNumber,
      },
      JWT_SECRET
    )

    return jsonResponse({
      success: true,
      token,
      accommodationName,
      availableTypes,
    })
  } catch (error) {
    return jsonResponse({ error: error.message }, 500)
  }
}

export const config = {
  path: '/api/dashboard/auth',
}
