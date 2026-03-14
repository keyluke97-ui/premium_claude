// dashboard-modify.js - 미배정 슬롯의 등급 간 인원 변경 + 가격 재계산

import { verifyToken, extractToken, buildCorsHeaders } from './jwt-utils.js' // CHANGED: sanitizeForFormula 제거 - 오퍼 테이블 조회 불필요

// CHANGED: S-2 - CORS 헤더를 buildCorsHeaders로 교체 (ALLOWED_ORIGIN 환경변수 지원)
const CORS_HEADERS = buildCorsHeaders('POST, OPTIONS')

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: CORS_HEADERS })
}

/** 등급별 단가 (VAT 별도) */
const UNIT_PRICES = {
  icon: 300000,
  partner: 100000,
  rising: 50000,
}

/** VAT 포함 총액 계산 */
function calculateTotal(crew) {
  const subtotal =
    crew.icon * UNIT_PRICES.icon +
    crew.partner * UNIT_PRICES.partner +
    crew.rising * UNIT_PRICES.rising
  return Math.round(subtotal * 1.1)
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
  const JWT_SECRET = process.env.JWT_SECRET
  const FORM_TABLE = process.env.AIRTABLE_TABLE_ID || '캠지기 모집 폼'

  if (!API_KEY || !BASE_ID || !JWT_SECRET) {
    return jsonResponse({ error: '서버 환경변수가 설정되지 않았습니다.' }, 500)
  }

  // JWT 인증
  const token = extractToken(request) // CHANGED: M-1 - 로컬 extractToken 제거, 공통 유틸 사용
  if (!token) {
    return jsonResponse({ error: '인증 토큰이 필요합니다.' }, 401)
  }

  const verification = verifyToken(token, JWT_SECRET)
  if (!verification.valid) {
    return jsonResponse({ error: verification.error }, 401)
  }

  const { recordId, accommodationName } = verification.payload

  try {
    const { newCrew } = await request.json()

    // newCrew 검증: { icon: number, partner: number, rising: number }
    if (
      !newCrew ||
      typeof newCrew.icon !== 'number' ||
      typeof newCrew.partner !== 'number' ||
      typeof newCrew.rising !== 'number'
    ) {
      return jsonResponse(
        { error: '변경할 인원 정보가 올바르지 않습니다. { icon, partner, rising } 형식이어야 합니다.' },
        400
      )
    }

    if (newCrew.icon < 0 || newCrew.partner < 0 || newCrew.rising < 0) {
      return jsonResponse({ error: '모집 인원은 0 이상이어야 합니다.' }, 400)
    }

    // CHANGED: C-3 - 총 인원 0 허용 방지: 합계가 0이면 거부
    const totalNewCrew = newCrew.icon + newCrew.partner + newCrew.rising
    if (totalNewCrew === 0) {
      return jsonResponse({ error: '총 모집 인원은 1명 이상이어야 합니다.' }, 400)
    }

    // CHANGED: 오퍼 테이블 조회 제거 → 모집 폼의 '신청 가능 인원' 수식 필드로 배정 상태 판단
    const formRecordUrl = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(FORM_TABLE)}/${recordId}`

    const formResponse = await fetch(formRecordUrl, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    })

    if (!formResponse.ok) {
      return jsonResponse({ error: '신청 정보를 찾을 수 없습니다.' }, 404)
    }

    const formRecord = await formResponse.json()
    const formFields = formRecord.fields

    const currentCrew = {
      icon: formFields['⭐️ 모집 희망 인원'] || 0,
      partner: formFields['✔️ 모집 인원'] || 0,
      rising: formFields['🔥 모집 인원'] || 0,
    }

    // CHANGED: 신청 가능 인원 수식 필드에서 배정 인원 역산
    // 배정 인원 = 모집 인원 - 신청 가능 인원
    // null/undefined → 모집 인원 0인 등급은 미사용이므로 신청 가능도 0으로 간주
    const availableSlots = {
      icon: formFields['⭐️ 신청 가능 인원'] ?? null,
      partner: formFields['✔️ 신청 가능 인원'] ?? null,
      rising: formFields['🔥 신청 가능 인원'] ?? null,
    }

    /** 등급별 배정 인원 계산 (엣지케이스 포함) */
    function getAssignedCount(crewCount, available) {
      // 모집 인원이 0이면 미사용 등급 → 배정 0
      if (crewCount === 0) return 0
      // 신청 가능 인원 필드가 null/undefined → 데이터 누락, 안전하게 모집 인원 전체를 배정된 것으로 처리
      if (available === null || available === undefined) return crewCount
      // 음수 방지 (초과 배정 등 비정상 상태)
      const assigned = crewCount - available
      return Math.max(0, assigned)
    }

    const assignedByGrade = {
      icon: getAssignedCount(currentCrew.icon, availableSlots.icon),
      partner: getAssignedCount(currentCrew.partner, availableSlots.partner),
      rising: getAssignedCount(currentCrew.rising, availableSlots.rising),
    }

    // 3) 변경 요청 인원이 이미 배정된 인원보다 적은지 확인 (감소만 차단, 증가는 허용)
    if (newCrew.icon < assignedByGrade.icon) {
      return jsonResponse(
        { error: `아이콘 등급은 이미 ${assignedByGrade.icon}명이 배정되어 ${assignedByGrade.icon}명 미만으로 줄일 수 없습니다.` },
        400
      )
    }
    if (newCrew.partner < assignedByGrade.partner) {
      return jsonResponse(
        { error: `파트너 등급은 이미 ${assignedByGrade.partner}명이 배정되어 ${assignedByGrade.partner}명 미만으로 줄일 수 없습니다.` },
        400
      )
    }
    if (newCrew.rising < assignedByGrade.rising) {
      return jsonResponse(
        { error: `라이징 등급은 이미 ${assignedByGrade.rising}명이 배정되어 ${assignedByGrade.rising}명 미만으로 줄일 수 없습니다.` },
        400
      )
    }

    // 4) 가격 재계산
    const oldTotal = calculateTotal(currentCrew)
    const newTotal = calculateTotal(newCrew)
    const priceDifference = newTotal - oldTotal

    // 5) Airtable 모집 인원 필드 업데이트
    const updatePayload = {
      fields: {
        '⭐️ 모집 희망 인원': newCrew.icon,
        '✔️ 모집 인원': newCrew.partner,
        '🔥 모집 인원': newCrew.rising,
        '아이콘 크리에이터 협찬 제안 금액': UNIT_PRICES.icon,
        '파트너 크리에이터 협찬 제안 금액': UNIT_PRICES.partner,
        '라이징 협찬 제안 금액': UNIT_PRICES.rising,
      },
    }

    const updateResponse = await fetch(formRecordUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatePayload),
    })

    if (!updateResponse.ok) {
      // CHANGED: S-4 - detail 필드 제거: Airtable 내부 오류 메시지를 클라이언트에 노출하지 않음
      return jsonResponse({ error: '인원 변경 저장에 실패했습니다.' }, 500)
    }

    return jsonResponse({
      success: true,
      previousCrew: currentCrew,
      newCrew,
      previousTotal: oldTotal,
      newTotal,
      priceDifference,
      needsAdditionalPayment: priceDifference > 0,
      bankInfo: priceDifference > 0
        ? {
            bank: '하나은행',
            account: '225-910068-71204',
            holder: '(주) 넥스트에디션',
            amount: priceDifference,
          }
        : null,
    })
  } catch (error) {
    return jsonResponse({ error: error.message }, 500)
  }
}

export const config = {
  path: '/api/dashboard/modify',
}
