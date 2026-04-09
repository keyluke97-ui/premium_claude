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

    // CHANGED: 2패스 인증 — 1) 모든 레코드 조회+사업자번호 검증, 2) 하나라도 전화번호 매칭 시 전체 승인
    // [설계 의도] 같은 캠핑장이 다른 연락처로 재신청한 경우에도,
    // 그룹 내 하나의 번호로 본인 확인되면 동일 사업자의 모든 신청 건에 접근 가능
    const candidateRecords = [] // { entryType, recordId, phoneLastFour }

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

        const storedPhone = (record.fields[config.phoneField] || '').replace(/[^0-9]/g, '')
        candidateRecords.push({
          entryType,
          recordId: record.id,
          phoneLastFour: storedPhone.slice(-4),
        })
      } catch (entryError) {
        console.error(`[auth] ${entryType} 조회 실패:`, entryError.message)
        continue
      }
    }

    // 2패스: 후보 중 하나라도 전화번호 매칭 → 같은 사업자의 전체 레코드 승인
    const phoneVerified = candidateRecords.some(
      (r) => r.phoneLastFour && r.phoneLastFour === cleanPhoneLastFour
    )

    if (!phoneVerified) {
      return jsonResponse({ error: '인증 정보가 일치하지 않습니다.' }, 401)
    }

    // 검증 통과 — 모든 후보 레코드를 타입별로 분류
    const candidateRecordIds = { premium: [], partner: [] }
    for (const r of candidateRecords) {
      candidateRecordIds[r.entryType].push(r.recordId)
    }

    // CHANGED: 연락처 검증 통과 후 availableTypes 확정 (레코드가 있는 타입만)
    const availableTypes = Object.entries(candidateRecordIds)
      .filter(([, ids]) => ids.length > 0)
      .map(([t]) => t)

    // CHANGED: 복수 프리미엄 신청 시 각 레코드의 예산 정보 조회 (칩 라벨용)
    let premiumBudgets = null
    if (candidateRecordIds.premium.length > 1) {
      const tableSettings = getTableSettings('premium')
      if (tableSettings) {
        const budgetPromises = candidateRecordIds.premium.map(async (rid) => {
          try {
            const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(tableSettings.tableId)}/${rid}?fields%5B%5D=${encodeURIComponent('선택 예산')}`
            const res = await fetch(url, { headers: { Authorization: `Bearer ${API_KEY}` } })
            if (!res.ok) return { rid, budget: '' }
            const rec = await res.json()
            return { rid, budget: rec.fields?.['선택 예산'] || '' }
          } catch { return { rid, budget: '' } }
        })
        const results = await Promise.all(budgetPromises)
        premiumBudgets = Object.fromEntries(results.map(b => [b.rid, b.budget]))
      }
    }

    // CHANGED: JWT payload — premiumRecordIds 배열 + 하위 호환용 premiumRecordId 단건 유지
    const token = signToken(
      {
        premiumRecordId: candidateRecordIds.premium[0] || null,
        premiumRecordIds: candidateRecordIds.premium.length > 0 ? candidateRecordIds.premium : null,
        partnerRecordId: candidateRecordIds.partner[0] || null,
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
      // CHANGED: 복수 프리미엄 recordId + 예산 라벨을 프론트에 전달
      premiumRecordIds: candidateRecordIds.premium.length > 1 ? candidateRecordIds.premium : undefined,
      premiumBudgets: premiumBudgets || undefined,
    })
  } catch (error) {
    return jsonResponse({ error: error.message }, 500)
  }
}

export const config = {
  path: '/api/dashboard/auth',
}
