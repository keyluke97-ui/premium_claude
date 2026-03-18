// dashboard-data.js - 대시보드 데이터 조회 (신청 상태 + 크리에이터 배정 현황)

import { verifyToken, extractToken, buildCorsHeaders } from './jwt-utils.js'

const CORS_HEADERS = buildCorsHeaders('GET, OPTIONS')

// CHANGED: 등급 번호 → 라벨/이모지 매핑
const GRADE_MAP = {
  1: { label: '아이콘', emoji: '⭐️' },
  2: { label: '파트너', emoji: '✔️' },
  3: { label: '라이징', emoji: '🔥' },
}

// CHANGED: Airtable formula 내 특수문자 이스케이프
function sanitizeForFormula(value) {
  if (!value) return ''
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: CORS_HEADERS })
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
  const OFFER_TABLE = process.env.AIRTABLE_OFFER_TABLE_ID || '유료 오퍼 신청 건' // CHANGED: 오퍼 테이블 추가

  if (!API_KEY || !BASE_ID || !JWT_SECRET) {
    return jsonResponse({ error: '서버 환경변수가 설정되지 않았습니다.' }, 500)
  }

  // JWT 인증
  const token = extractToken(request)
  if (!token) {
    return jsonResponse({ error: '인증 토큰이 필요합니다.' }, 401)
  }

  const verification = verifyToken(token, JWT_SECRET)
  if (!verification.valid) {
    return jsonResponse({ error: verification.error }, 401)
  }

  const { recordId, accommodationName } = verification.payload

  try {
    // 캠지기 모집 폼 레코드 단건 조회
    const formRecordUrl = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(FORM_TABLE)}/${recordId}`

    const formResponse = await fetch(formRecordUrl, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    })

    if (!formResponse.ok) {
      return jsonResponse({ error: '신청 정보를 찾을 수 없습니다.' }, 404)
    }

    const formRecord = await formResponse.json()
    const formFields = formRecord.fields

    // CHANGED: 입금 확인 체크박스 필드 읽기
    const paymentConfirmed = formFields['입금내역 확인'] === true

    // 신청 상태 데이터 구성
    const applicationData = {
      accommodationName: formFields['숙소 이름을 적어주세요.'] || accommodationName,
      selectedBudget: formFields['선택 예산'] || '',
      selectedPlan: formFields['선택플랜'] || '',
      region: formFields['숙소 위치'] || '',
      representativeName: formFields['대표자명'] || '',
      phone: formFields['연락처'] || '',
      email: formFields['캠지기님 이메일'] || '',
      paymentConfirmed, // CHANGED: 입금 확인 상태 포함
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

    // 배정 인원을 캠지기 모집 폼의 카운트 필드에서 직접 읽음
    const assignedByGrade = {
      icon: formFields['아이콘 크리에이터 신청 수'] || 0,
      partner: formFields['파트너 크리에이터 신청 수'] || 0,
      rising: formFields['라이징 크리에이터 신청 수'] || 0,
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

    // CHANGED: 유료 오퍼 신청 건 테이블에서 배정 크리에이터 조회
    let creators = []
    try {
      const safeName = sanitizeForFormula(applicationData.accommodationName)
      const filterFormula = `AND(FIND("${safeName}", ARRAYJOIN({숙소 이름을 적어주세요. (from 숙소 이름 (유료 오퍼ㅏ))})), {예약 취소/변경} != "취소")`
      const offerUrl = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(OFFER_TABLE)}?filterByFormula=${encodeURIComponent(filterFormula)}&maxRecords=50`

      const offerResponse = await fetch(offerUrl, {
        headers: { Authorization: `Bearer ${API_KEY}` },
      })

      if (offerResponse.ok) {
        const offerData = await offerResponse.json()
        creators = (offerData.records || []).map((record) => {
          const fields = record.fields
          // 등급화 lookup 필드에서 첫 번째 값 추출
          const gradeRaw = fields['등급화 (from 크리에이터 채널명 (크리에이터 명단)) (from 크리에이터 채널명(프리미엄 협찬 신청)) 2']
          const gradeNumber = Array.isArray(gradeRaw) ? gradeRaw[0] : gradeRaw
          const gradeInfo = GRADE_MAP[gradeNumber] || { label: '미분류', emoji: '❓' }

          // 채널 URL lookup 필드에서 첫 번째 값 추출
          const channelUrlRaw = fields['채널 URL']
          const channelUrl = Array.isArray(channelUrlRaw) ? channelUrlRaw[0] : (channelUrlRaw || '')

          return {
            offerId: record.id,
            channelName: fields['크리에이터 채널명'] || '채널명 없음',
            channelUrl,
            grade: gradeNumber || 0,
            gradeLabel: gradeInfo.label,
            gradeEmoji: gradeInfo.emoji,
            checkInDate: fields['입실일'] || '',
            site: fields['입실 사이트'] || '',
            contentLink: '',
          }
        })
      }
    } catch (offerError) {
      // CHANGED: 오퍼 조회 실패 시에도 대시보드 데이터는 정상 반환
      console.error('오퍼 조회 실패:', offerError.message)
    }

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
