// dashboard-refund.js - 환불 요청 (전체 모집 완료 전에만 가능)

import { verifyToken, extractToken, sanitizeForFormula, buildCorsHeaders } from './jwt-utils.js' // CHANGED: M-1 - 공통 유틸 import

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
    // CHANGED: 환불 요청 시 계좌 정보 필드 추가 수신
    const { reason, bankName, accountNumber, accountHolder } = await request.json()

    if (!reason || reason.trim().length === 0) {
      return jsonResponse({ error: '환불 사유를 입력해주세요.' }, 400)
    }

    if (!bankName || !accountNumber || !accountHolder) {
      return jsonResponse({ error: '환불 계좌 정보(은행, 계좌번호, 예금주명)를 모두 입력해주세요.' }, 400)
    }

    // CHANGED: P-1 - 순차 fetch → Promise.all 병렬 처리 (두 요청은 서로 독립적)
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

    const totalRequested =
      (formFields['⭐️ 모집 희망 인원'] || 0) +
      (formFields['✔️ 모집 인원'] || 0) +
      (formFields['🔥 모집 인원'] || 0)

    // 2) 배정된 크리에이터 수 집계
    let totalAssigned = 0
    if (offerResponse.ok) {
      const offerData = await offerResponse.json()
      totalAssigned = (offerData.records || []).length
    }

    // 3) 환불 가능 여부 확인: 전체 모집 완료 전에만 가능
    const isFullyRecruited = totalAssigned >= totalRequested && totalRequested > 0
    if (isFullyRecruited) {
      return jsonResponse(
        { error: '모든 크리에이터가 배정 완료되어 환불이 불가능합니다.' },
        400
      )
    }

    // 4) 환불 요청 정보를 전용 필드에 저장 + 비고에도 기록 유지
    // CHANGED: 비고 우회 방식 → 전용 필드(환불 은행, 계좌번호, 예금주명, 환불 요청일)에 직접 저장
    const currentNotes = formFields['비고'] || ''
    const now = new Date()
    const timestamp = now.toISOString().slice(0, 16).replace('T', ' ')
    const refundNote = `[환불요청 ${timestamp}] ${reason.trim()}`
    const updatedNotes = currentNotes
      ? `${currentNotes}\n${refundNote}`
      : refundNote

    const updateResponse = await fetch(formRecordUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          '비고': updatedNotes,
          '환불 은행': bankName,
          '계좌번호': accountNumber,
          '예금주명': accountHolder,
          '환불 요청일': now.toISOString(),
        },
      }),
    })

    if (!updateResponse.ok) {
      // CHANGED: S-4 - detail 필드 제거: Airtable 내부 오류 메시지를 클라이언트에 노출하지 않음
      return jsonResponse({ error: '환불 요청 저장에 실패했습니다.' }, 500)
    }

    return jsonResponse({
      success: true,
      message: '환불 요청이 접수되었습니다. 담당자가 확인 후 연락드리겠습니다.',
      refundNote,
      totalRequested,
      totalAssigned,
    })
  } catch (error) {
    return jsonResponse({ error: error.message }, 500)
  }
}

export const config = {
  path: '/api/dashboard/refund',
}
