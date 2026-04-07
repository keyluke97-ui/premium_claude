// dashboard-partner-data.js - 파트너 협찬 대시보드 데이터 조회 (캠페인 정보 + 매칭 크리에이터)

import { verifyToken, extractToken, buildCorsHeaders, sanitizeForFormula } from './jwt-utils.js'
// CHANGED: GRADE_INFO, MAX_RECORDS_OFFERS를 공통 상수 파일에서 import (중복 제거)
import { GRADE_INFO, MAX_RECORDS_OFFERS } from './shared-constants.js'

const CORS_HEADERS = buildCorsHeaders('GET, OPTIONS')

// 모집 상태 한글 라벨
const RECRUITMENT_STATUS_LABELS = {
  '오픈전': '오픈전',
  '모집중': '모집중',
  '마감': '마감',
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: CORS_HEADERS })
}

/** 파트너 신청 레코드를 크리에이터 객체로 변환 */
function mapApplicationToCreator(record) {
  const fields = record.fields

  // lookup 필드는 배열로 반환되므로 첫 번째 요소 추출
  const channelNameRaw = fields['크리에이터 채널명 (from 크리에이터)']
  const channelName = Array.isArray(channelNameRaw) ? channelNameRaw[0] || '채널명 없음' : channelNameRaw || '채널명 없음'

  const channelTypeRaw = fields['채널 종류 (from 크리에이터)']
  const channelType = Array.isArray(channelTypeRaw) ? channelTypeRaw[0] || null : channelTypeRaw || null

  const gradeRaw = fields['등급화 (from 크리에이터)']
  const gradeNumber = Array.isArray(gradeRaw) ? gradeRaw[0] ?? null : gradeRaw ?? null

  const gradeInfo = GRADE_INFO[gradeNumber] || null

  return {
    applicationId: record.id,
    channelName,
    channelType,
    grade: gradeNumber,
    gradeEmoji: gradeInfo?.emoji || '',
    gradeLabel: gradeInfo?.label || '미분류',
    status: fields['신청 상태'] || '신청완료',
    checkInDate: fields['입실일'] || null,
    checkInSite: fields['입실 사이트'] || null,
    cancelOrChange: fields['예약 취소/변경'] || null,
  }
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
  const PARTNER_CAMPAIGN_TABLE = process.env.AIRTABLE_PARTNER_CAMPAIGN_TABLE_ID
  const PARTNER_APPLICATION_TABLE = process.env.AIRTABLE_PARTNER_APPLICATION_TABLE_ID

  if (!API_KEY || !BASE_ID || !JWT_SECRET) {
    return jsonResponse({ error: '서버 환경변수가 설정되지 않았습니다.' }, 500)
  }

  if (!PARTNER_CAMPAIGN_TABLE) {
    return jsonResponse({ error: '파트너 캠페인 테이블이 설정되지 않았습니다.' }, 500)
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

  // CHANGED: JWT 구조 변경 대응 — partnerRecordId 우선, 하위 호환으로 type='partner'인 경우 recordId도 지원
  const { partnerRecordId, recordId: legacyRecordId, type: legacyType } = verification.payload
  const recordId = partnerRecordId || (legacyType === 'partner' ? legacyRecordId : null)

  if (!recordId) {
    return jsonResponse({ error: '파트너 대시보드 접근 권한이 없습니다.' }, 403)
  }

  try {
    // 1. 파트너 캠페인 레코드 단건 조회 (recordId로 직접 접근)
    const campaignUrl = `https://api.airtable.com/v0/${BASE_ID}/${PARTNER_CAMPAIGN_TABLE}/${recordId}`
    const campaignResponse = await fetch(campaignUrl, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    })

    if (!campaignResponse.ok) {
      return jsonResponse({ error: '파트너 캠페인 정보를 찾을 수 없습니다.' }, 404)
    }

    const campaignRecord = await campaignResponse.json()
    const campaignFields = campaignRecord.fields

    // 캠페인 데이터 구성
    const campaignData = {
      accommodationName: campaignFields['캠핑장명'] || '',
      packageType: campaignFields['패키지 유형'] || '',
      weekdayDiscount: campaignFields['평일 할인 금액'] || 0,
      weekendDiscount: campaignFields['주말 할인 금액'] || 0,
      accommodationType: campaignFields['숙박 타입'] || '',
      recruitmentStatus: campaignFields['모집 상태'] || '오픈전',
      recruitmentStatusLabel: RECRUITMENT_STATUS_LABELS[campaignFields['모집 상태']] || campaignFields['모집 상태'] || '오픈전',
      iconRequested: campaignFields['⭐️ 모집 희망 인원'] || 0,
      partnerRequested: campaignFields['✔️ 모집 희망 인원'] || 0,
      risingRequested: campaignFields['🔥 모집 희망 인원'] || 0,
      // CHANGED: 신청 가능 인원은 단일 number 필드 (사용자가 수동 생성)
      availableSlots: campaignFields['신청가능인원'] || 0,
      visitStartDate: campaignFields['크리에이터 방문 가능 시작일'] || null,
      visitEndDate: campaignFields['크리에이터 방문 가능 종료일'] || null,
      couponStartDate: campaignFields['쿠폰 유효 시작일'] || null,
      couponEndDate: campaignFields['쿠폰 유효 종료일'] || null,
      holidayCoupon: campaignFields['공휴일 쿠폰 적용'] === true,
      introduction: campaignFields['숙소 소개'] || '',
      contact: campaignFields['연락처'] || '',
    }

    // 2. 파트너 신청(크리에이터) 테이블 조회 — 해당 캠페인에 링크된 레코드
    let creators = []

    if (PARTNER_APPLICATION_TABLE) {
      // 캠페인 레코드 ID 기준으로 필터링
      const safeCampaignName = sanitizeForFormula(campaignData.accommodationName)
      // CHANGED: 구분자 래핑으로 부분 매칭 방지 + 실제 필드명은 '캠핑장명 (from 캠페인)'
      const applicationFilter = encodeURIComponent(
        `FIND('|||${safeCampaignName}|||','|||'&ARRAYJOIN({캠핑장명 (from 캠페인)},'|||')&'|||')`
      )
      const applicationFields = [
        '크리에이터 채널명 (from 크리에이터)',
        '채널 종류 (from 크리에이터)',
        '등급화 (from 크리에이터)',
        '신청 상태',
        '입실일',
        '입실 사이트',
        '예약 취소/변경',
      ].map(fieldName => 'fields%5B%5D=' + encodeURIComponent(fieldName)).join('&')

      const applicationUrl =
        `https://api.airtable.com/v0/${BASE_ID}/${PARTNER_APPLICATION_TABLE}` +
        `?filterByFormula=${applicationFilter}&${applicationFields}&maxRecords=${MAX_RECORDS_OFFERS}`

      try {
        const applicationResponse = await fetch(applicationUrl, {
          headers: { Authorization: `Bearer ${API_KEY}` },
        })

        if (applicationResponse.ok) {
          const applicationData = await applicationResponse.json()
          const allCreators = (applicationData.records || []).map(mapApplicationToCreator)

          // 취소된 크리에이터 제외
          creators = allCreators.filter(creator => creator.cancelOrChange !== '취소')
        }
      } catch (applicationError) {
        // 크리에이터 조회 실패 시 빈 배열로 graceful degradation
        console.error('[dashboard-partner-data] 크리에이터 조회 실패:', applicationError.message)
      }
    }

    // 모집 현황 집계
    const totalRequested = campaignData.iconRequested + campaignData.partnerRequested + campaignData.risingRequested
    const confirmedCreators = creators.filter(creator => creator.status === '확정')
    const totalConfirmed = confirmedCreators.length

    return jsonResponse({
      success: true,
      campaign: campaignData,
      creators,
      totalRequested,
      totalConfirmed,
      totalApplied: creators.length,
    })
  } catch (error) {
    console.error('[dashboard-partner-data] 에러:', error.message)
    return jsonResponse({ error: error.message }, 500)
  }
}

export const config = {
  path: '/api/dashboard/partner-data',
}
