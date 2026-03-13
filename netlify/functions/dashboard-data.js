// dashboard-data.js - 대시보드 데이터 조회 (신청 상태 + 크리에이터 배정 현황)

import { verifyToken, extractToken, sanitizeForFormula, buildCorsHeaders } from './jwt-utils.js' // CHANGED: M-1 - 공통 유틸 import

// CHANGED: S-2 - CORS 헤더를 buildCorsHeaders로 교체 (ALLOWED_ORIGIN 환경변수 지원)
const CORS_HEADERS = buildCorsHeaders('GET, OPTIONS')

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: CORS_HEADERS })
}

/** 등급 숫자를 한글 라벨로 변환 */
function gradeLabel(gradeNumber) {
  const gradeMap = { 1: '아이콘', 2: '파트너', 3: '라이징' }
  return gradeMap[gradeNumber] || `등급${gradeNumber}`
}

/** 등급 숫자를 이모지로 변환 */
function gradeEmoji(gradeNumber) {
  const emojiMap = { 1: '⭐️', 2: '✔️', 3: '🔥' }
  return emojiMap[gradeNumber] || ''
}

export default async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('', { status: 200, headers: CORS_HEADERS })
  }

  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const API_KEY = process.env.AIRTABLE_API_KEY
  const BASE_ID = process.env.AIRTABLE_BASE_ID
  const JWT_SECRET = process.env.JWT_SECRET
  const FORM_TABLE = process.env.AIRTABLE_TABLE_ID || '캠지기 모집 폼'
  const OFFER_TABLE = process.env.AIRTABLE_OFFER_TABLE_ID || '유료 오퍼 신청 건'

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
    // CHANGED: P-1 - 순차 fetch → Promise.all 병렬 처리 (accommodationName은 JWT에서 확보되므로 독립 실행 가능)
    const formRecordUrl = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(FORM_TABLE)}/${recordId}`

    // CHANGED: S-1 - filterByFormula 인젝션 방지: accommodationName 이스케이프 적용
    // CHANGED: P-2 - maxRecords=200 추가 (무제한 조회 방지)
    const offerFilter = encodeURIComponent(
      `{캠핑장명}='${sanitizeForFormula(accommodationName)}'`
    )
    const offerUrl =
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(OFFER_TABLE)}` +
      `?filterByFormula=${offerFilter}&maxRecords=200`

    const [formResponse, offerResponse] = await Promise.all([
      fetch(formRecordUrl, { headers: { Authorization: `Bearer ${API_KEY}` } }),
      fetch(offerUrl, { headers: { Authorization: `Bearer ${API_KEY}` } }),
    ])

    if (!formResponse.ok) {
      return jsonResponse({ error: '신청 정보를 찾을 수 없습니다.' }, 404)
    }

    const formRecord = await formResponse.json()
    const formFields = formRecord.fields

    // 신청 상태 데이터 구성
    const applicationData = {
      accommodationName: formFields['숙소 이름을 적어주세요.'] || accommodationName,
      selectedBudget: formFields['선택 예산'] || '',
      selectedPlan: formFields['선택플랜'] || '',
      region: formFields['숙소 위치'] || '',
      representativeName: formFields['대표자명'] || '',
      phone: formFields['연락처'] || '',
      email: formFields['캠지기님 이메일'] || '',
      crew: {
        icon: {
          requested: formFields['⭐️ 모집 희망 인원'] || 0,
          unitPrice: formFields['아이콘 크리에이터 협찬 제안 금액'] || 300000,
        },
        partner: {
          requested: formFields['✔️ 모집 인원'] || 0,
          unitPrice: formFields['파트너 크리에이터 협찬 제안 금액'] || 100000,
        },
        rising: {
          requested: formFields['🔥 모집 인원'] || 0,
          unitPrice: formFields['라이징 협찬 제안 금액'] || 50000,
        },
      },
      notes: formFields['비고'] || '',
    }

    // 배정된 크리에이터 현황 구성
    let creators = []

    if (offerResponse.ok) {
      const offerData = await offerResponse.json()

      creators = (offerData.records || []).map((record) => {
        const fields = record.fields
        const gradeNumber = fields['등급'] || 0

        return {
          offerId: record.id,
          channelName: fields['채널명'] || '',
          channelUrl: fields['채널 URL'] || '',
          grade: gradeNumber,
          gradeLabel: gradeLabel(gradeNumber),
          gradeEmoji: gradeEmoji(gradeNumber),
          checkInDate: fields['체크인 날짜'] || '',
          site: fields['사이트'] || '',
          status: fields['상태'] || '',
          contentLink: fields['콘텐츠 링크'] || '',
        }
      })
    }

    // 모집 진행률 계산
    const assignedByGrade = { icon: 0, partner: 0, rising: 0 }
    for (const creator of creators) {
      if (creator.grade === 1) assignedByGrade.icon++
      else if (creator.grade === 2) assignedByGrade.partner++
      else if (creator.grade === 3) assignedByGrade.rising++
    }

    const recruitment = {
      icon: {
        requested: applicationData.crew.icon.requested,
        assigned: assignedByGrade.icon,
      },
      partner: {
        requested: applicationData.crew.partner.requested,
        assigned: assignedByGrade.partner,
      },
      rising: {
        requested: applicationData.crew.rising.requested,
        assigned: assignedByGrade.rising,
      },
    }

    const totalRequested =
      recruitment.icon.requested +
      recruitment.partner.requested +
      recruitment.rising.requested
    const totalAssigned =
      recruitment.icon.assigned +
      recruitment.partner.assigned +
      recruitment.rising.assigned

    // 환불 가능 여부: 전체 모집 완료 전에만 가능
    const isFullyRecruited = totalAssigned >= totalRequested && totalRequested > 0
    const canRefund = !isFullyRecruited

    return jsonResponse({
      success: true,
      application: applicationData,
      recruitment,
      totalRequested,
      totalAssigned,
      creators,
      canRefund,
      isFullyRecruited,
    })
  } catch (error) {
    return jsonResponse({ error: error.message }, 500)
  }
}

export const config = {
  path: '/api/dashboard/data',
}
