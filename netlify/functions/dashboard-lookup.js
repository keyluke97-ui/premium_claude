// dashboard-lookup.js - 사업자번호로 프리미엄+파트너 테이블 병렬 검색, 캠핑장 목록 반환

import { buildCorsHeaders, sanitizeForFormula } from './jwt-utils.js'
// CHANGED: TABLE_CONFIG, MAX_RECORDS_LOOKUP를 공통 상수 파일에서 import (중복 제거)
import { TABLE_CONFIG, MAX_RECORDS_LOOKUP } from './shared-constants.js'

const CORS_HEADERS = buildCorsHeaders('POST, OPTIONS')

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: CORS_HEADERS })
}

/**
 * 이메일 마스킹 — 로컬파트 앞 3자리를 가리고 나머지는 노출
 * 예: camfit@gmail.com → ***fit@gmail.com / ab@gmail.com → ***@gmail.com
 * 가린 앞자리가 인증 입력값이므로 힌트에 절대 노출하지 않는다.
 */
function maskEmail(email) {
  const raw = (email || '').trim()
  const atIndex = raw.indexOf('@')
  if (atIndex <= 0) return ''
  const local = raw.slice(0, atIndex)
  const maskLen = Math.min(3, local.length)
  return `***${local.slice(maskLen)}${raw.slice(atIndex)}`
}

/**
 * 단일 Airtable 테이블에서 사업자번호로 캠핑장 목록 조회
 * @param {string} tableId - Airtable 테이블 ID
 * @param {string} cleanNumber - 숫자만 남긴 사업자번호
 * @param {object} config - TABLE_CONFIG의 premium 또는 partner
 * @param {string} apiKey - Airtable API Key
 * @param {string} baseId - Airtable Base ID
 * @param {string} type - 'premium' | 'partner'
 * @returns {Array} - [{ name, recordId, type, phone }]
 */
async function fetchAccommodationsFromTable(tableId, cleanNumber, config, apiKey, baseId, type) {
  // CHANGED: 프리미엄은 SUBSTITUTE 필요 (하이픈 형식 저장), 파트너는 하이픈 없이 저장될 수 있음
  const filterFormula = encodeURIComponent(
    `SUBSTITUTE({${config.businessNumberField}}, '-', '')='${sanitizeForFormula(cleanNumber)}'`
  )
  // CHANGED: phoneField + 선택예산 함께 조회 — 연락처 기준 그룹핑 + 복수 신청 구분에 사용
  const fieldNames = [
    config.accommodationNameField,
    config.businessNumberField,
    config.phoneField,
  ]
  // 프리미엄 테이블만 선택 예산 필드 추가 (복수 신청 구분용)
  if (type === 'premium') fieldNames.push('선택 예산')
  // 이메일 인증 힌트용 (마스킹 후 전달, 원본은 클라이언트에 미전송)
  if (config.emailField) fieldNames.push(config.emailField)
  const fieldsQuery = fieldNames.map(f => 'fields%5B%5D=' + encodeURIComponent(f)).join('&')

  const airtableUrl =
    `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableId)}` +
    `?filterByFormula=${filterFormula}&${fieldsQuery}&maxRecords=${MAX_RECORDS_LOOKUP}`

  try {
    const response = await fetch(airtableUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })

    if (!response.ok) {
      console.error(`[lookup] ${type} 테이블 조회 실패: ${response.status}`)
      return []
    }

    const { records } = await response.json()
    if (!records || records.length === 0) return []

    // CHANGED: 동일 타입 복수 신청 보존 — 같은 연락처라도 별도 레코드면 모두 반환
    // (동일 캠핑장이 프리미엄 2회 신청 시 각각 독립 레코드로 대시보드에 표시)
    return records
      .filter((record) => record.fields[config.accommodationNameField])
      .map((record) => ({
        name: record.fields[config.accommodationNameField] || '',
        recordId: record.id,
        type,
        phone: (record.fields[config.phoneField] || '').replace(/[^0-9]/g, ''),
        // 프리미엄: 선택예산으로 복수 신청 구분, 파트너: null
        budget: type === 'premium' ? (record.fields['선택 예산'] || '') : '',
        // 이메일 인증 힌트 (마스킹된 형태만, 원본 미전송)
        maskedEmail: config.emailField ? maskEmail(record.fields[config.emailField]) : '',
      }))
  } catch (error) {
    console.error(`[lookup] ${type} 테이블 조회 에러:`, error.message)
    return []
  }
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
  const PREMIUM_TABLE_ID = process.env.AIRTABLE_TABLE_ID || '캠지기 모집 폼'
  const PARTNER_TABLE_ID = process.env.AIRTABLE_PARTNER_CAMPAIGN_TABLE_ID

  if (!API_KEY || !BASE_ID) {
    return jsonResponse({ error: 'Airtable 환경변수가 설정되지 않았습니다.' }, 500)
  }

  try {
    const { businessNumber } = await request.json()

    if (!businessNumber || businessNumber.trim().length < 5) {
      return jsonResponse({ error: '사업자 번호를 입력해주세요.' }, 400)
    }

    const cleanNumber = businessNumber.replace(/[^0-9]/g, '')

    // CHANGED: 프리미엄 + 파트너 테이블 병렬 조회
    const fetchPromises = [
      fetchAccommodationsFromTable(
        PREMIUM_TABLE_ID, cleanNumber, TABLE_CONFIG.premium, API_KEY, BASE_ID, 'premium'
      ),
    ]

    // CHANGED: 파트너 테이블 ID가 설정된 경우에만 파트너 조회 추가
    if (PARTNER_TABLE_ID) {
      fetchPromises.push(
        fetchAccommodationsFromTable(
          PARTNER_TABLE_ID, cleanNumber, TABLE_CONFIG.partner, API_KEY, BASE_ID, 'partner'
        )
      )
    }

    const results = await Promise.all(fetchPromises)
    const flatItems = results.flat()

    if (flatItems.length === 0) {
      return jsonResponse({ error: '해당 사업자 번호로 등록된 캠핑장이 없습니다.' }, 404)
    }

    // CHANGED: 캠핑장명 기준 그룹핑 — 같은 사업자번호로 조회된 결과이므로
    // 캠핑장명이 같으면 연락처가 달라도 한 그룹 (동일 캠핑장의 복수 신청)
    // 캠핑장명이 다르면 별도 그룹 (한 사업자가 여러 캠핑장 운영)
    const groupedMap = new Map()
    for (const item of flatItems) {
      const groupKey = item.name
      const existing = groupedMap.get(groupKey)
      if (existing) {
        existing.types.push({ type: item.type, recordId: item.recordId, budget: item.budget || '' })
        // 연락처가 다를 수 있으므로 모든 phone 보존 (auth에서 활용)
        if (item.phone && !existing.phones.includes(item.phone)) {
          existing.phones.push(item.phone)
        }
        // 복수 신청 시 서로 다른 이메일이면 모두 힌트로 보존
        if (item.maskedEmail && !existing.maskedEmails.includes(item.maskedEmail)) {
          existing.maskedEmails.push(item.maskedEmail)
        }
      } else {
        groupedMap.set(groupKey, {
          name: item.name,
          names: [item.name],
          phones: item.phone ? [item.phone] : [],
          maskedEmails: item.maskedEmail ? [item.maskedEmail] : [],
          types: [{ type: item.type, recordId: item.recordId, budget: item.budget || '' }],
        })
      }
    }
    // CHANGED: 클라이언트에 phone은 전송하지 않음 (보안). 이메일은 마스킹본만 전송
    const accommodations = Array.from(groupedMap.values()).map((group) => ({
      name: group.name,
      names: group.names,
      types: group.types,
      maskedEmails: group.maskedEmails,
    }))

    return jsonResponse({ success: true, accommodations })
  } catch (error) {
    return jsonResponse({ error: error.message }, 500)
  }
}

export const config = {
  path: '/api/dashboard/lookup',
}
