/**
 * Netlify Serverless Function — Airtable 프록시
 *
 * Airtable API 키를 서버에서만 사용하므로 프론트엔드에 노출되지 않습니다.
 * Netlify 대시보드 > Site settings > Environment variables 에서 설정:
 *   - AIRTABLE_API_KEY
 *   - AIRTABLE_BASE_ID
 *   - AIRTABLE_TABLE_NAME (선택, 기본값: 캠지기 모집 폼)
 *   - AUTUMN_SALE (선택, 기본값: on / 'off' 로 두면 전원 기본가)
 */

import { resolvePriceTier } from './price-tier.js'
import {
  PRICE_TIER,
  unitPricesForTier,
  crewPrice,
  withVat,
  isDiscountedTier,
  isPlanDiscountEligible,
} from '../../src/constants/pricing.js'
// 제작 개월수는 화면과 **같은 함수**로 파생시킨다 — 각자 계산하면 저장값과 고지값이 갈린다.
import { deriveProductionMonths, DEFAULT_PRODUCTION_MONTHS } from '../../src/constants/config.js'

export default async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('', {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const API_KEY = process.env.AIRTABLE_API_KEY
  const BASE_ID = process.env.AIRTABLE_BASE_ID
  const TABLE = process.env.AIRTABLE_TABLE_ID || process.env.AIRTABLE_TABLE_NAME || '캠지기 모집 폼'

  if (!API_KEY || !BASE_ID) {
    return new Response(
      JSON.stringify({ error: 'Airtable 환경변수가 설정되지 않았습니다.' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }

  try {
    const body = await req.json()
    const { budget, formData, crew, planTier, selectedPlan, couponEvent } = body

    // CHANGED: 가격 구분(기본가/신규/재신청)을 **서버가 직접 판정**한다.
    //   이전에는 클라이언트가 보낸 selectedPlan.isDiscounted 를 그대로 믿었다. 그래서
    //   조회 버튼 미클릭·blur 미발생·sessionStorage 캐시 같은 브라우저 사정으로 판정이
    //   새면 그대로 저장됐고, 값 조작도 가능했다. 여기서 다시 판정하면 모든 신청이
    //   반드시 한 번은 판정을 거친다.
    //   할인 제외 플랜은 사업자번호와 무관하게 기본가다 — 판정도 플랜 id 로 한다
    //   (클라이언트가 보낸 discountEligible 플래그를 믿지 않는다).
    const planId = selectedPlan?.id
    const priceTier = isPlanDiscountEligible(planId)
      ? await resolvePriceTier({
          apiKey: API_KEY,
          baseId: BASE_ID,
          tableId: TABLE,
          businessNumber: formData?.businessNumber,
        })
      : PRICE_TIER.BASE

    const unitPrices = unitPricesForTier(priceTier)
    const ICON_PRICE = unitPrices.icon
    const PARTNER_PRICE = unitPrices.partner
    const RISING_PRICE = unitPrices.rising

    // 할인전금액 = 같은 크루 구성의 기본가 총액 (VAT 별도). 기본가 신청은 0 — 기존 표기 유지.
    const basePriceTotal = isDiscountedTier(priceTier) ? crewPrice(crew, PRICE_TIER.BASE) : 0

    // CHANGED: 팔로워 쿠폰 이벤트 필드 매핑 (옵트인 시에만. OFF면 빈 객체 → 기존 프리미엄 신청과 동일)
    // 쿠폰 배포 크리에이터 = 프리미엄 crew와 동일인 → 기존 '⭐️/✔️/🔥 모집 인원' 필드를 재사용.
    // 기간(일수)은 신청자 선택값. 날짜 4개는 '신청일' 기준으로 환산해 저장(운영자가 매칭 후 보정 가능).
    // '총 팔로워 쿠폰 수'(Airtable formula) = (⭐️+✔️+🔥 모집 인원) × 인당 팔로워 쿠폰 으로 자동 계산.
    // 신청일 기준 날짜 환산 (KST 기준, 날짜 전용 필드이므로 YYYY-MM-DD)
    const couponDates = couponEvent?.enabled
      ? (() => {
          const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000)
          const toDateStr = (offsetDays) =>
            new Date(kstNow.getTime() + offsetDays * 86400000).toISOString().slice(0, 10)
          return {
            '크리에이터 방문 가능 시작일': toDateStr(0),
            '크리에이터 방문 가능 종료일': toDateStr(couponEvent.visitPeriodDays || 0),
            '쿠폰 유효 시작일': toDateStr(0),
            '쿠폰 유효 종료일': toDateStr(couponEvent.couponPeriodDays || 0),
          }
        })()
      : {}

    const couponFields = couponEvent?.enabled
      ? {
          '쿠폰이벤트희망': true,
          '할인 금액': couponEvent.discount || 0,
          '쿠폰 적용 요일': couponEvent.couponApplyDays || '',
          '인당 팔로워 쿠폰': couponEvent.couponPerCreator || 0,
          '쿠폰 이벤트 약관 동의': '동의',
          '방문 가능 기간(일수)': couponEvent.visitPeriodDays || 0,
          '기본 제작 개월수': deriveProductionMonths(couponEvent.visitPeriodDays),
          '쿠폰 유효 기간(일수)': couponEvent.couponPeriodDays || 0,
          ...couponDates,
        }
      : {
          '쿠폰이벤트희망': false,
          // 비쿠폰 건은 `방문 가능 기간(일수)`를 수집하지 않아 파생할 입력이 없다 → 고정값.
          '기본 제작 개월수': DEFAULT_PRODUCTION_MONTHS,
        }

    const payload = {
      records: [
        {
          fields: {
            // 기본 정보 — Airtable 필드명 그대로
            '숙소 이름을 적어주세요.': formData.accommodationName || '',
            '대표자명': formData.representativeName || '',
            '연락처': formData.phone || '',
            '캠지기님 이메일': formData.email || '',
            '사업자 번호': formData.businessNumber || '', // CHANGED: 사업자 번호 필드 매핑 추가
            '숙소 위치': formData.region || '',

            // 예산 & 플랜 — Airtable 필드명·옵션 그대로
            '선택 예산': (budget === 'custom' || body.selectedPlan?.id === 'custom')
              ? '직접 결정할게요'
              : `${budget}만원 (vat 별도)`,
            '선택플랜': planTier || '',

            // 아이콘 크리에이터
            '아이콘 크리에이터 협찬 제안 금액': crew.icon > 0 ? ICON_PRICE : 0,
            '⭐️ 모집 희망 인원': crew.icon || 0,

            // 파트너 크리에이터
            '파트너 크리에이터 협찬 제안 금액': crew.partner > 0 ? PARTNER_PRICE : 0,
            '✔️ 모집 인원': crew.partner || 0,

            // 라이징 크리에이터
            '라이징 협찬 제안 금액': crew.rising > 0 ? RISING_PRICE : 0,
            '🔥 모집 인원': crew.rising || 0,

            // 사이트 종류
            '제공 가능한 사이트 종류': formData.siteTypes || [],

            // 숙소 특장점
            '숙소의 특장점': formData.promotion || '',

            // CHANGED: 가격 구분 3단. '이벤트 할인'·'할인전금액'은 서버 판정 결과에서 파생한다.
            //   ⚠️ Airtable 수식(캠핏수수료·⭐️/✔️/🔥 협찬 제안 금액)은 **건드리지 않았다.**
            //      신규·재신청 모두 수수료 10,000이라 기존 `이벤트 할인` 분기가 그대로 정답이다.
            //      '가격 구분'은 (1) 신규/재신청 집계 (2) dashboard-modify 의 단가 폴백 용도다.
            //      구분별로 수수료를 다르게 가져갈 때가 오면 그때 수식을 이 필드로 옮긴다.
            '가격 구분': priceTier, // fldF2gMvjzM7rWywI (기본가/신규/재신청)
            '이벤트 할인': isDiscountedTier(priceTier),
            '할인전금액': basePriceTotal,

            // 동의 & 비고
            '동의합니다.': '동의',
            '프리미엄 협찬 관련 동의 사항': '동의',
            '캠지기인스타그램': formData.instagramId || '',
            '비고': formData.additionalRequests || '',

            // 팔로워 쿠폰 이벤트 (옵트인 시에만 키 추가)
            ...couponFields,
          },
        },
      ],
    }

    const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}`
    const airtableRes = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!airtableRes.ok) {
      const errText = await airtableRes.text()
      return new Response(
        JSON.stringify({ error: `Airtable 오류 (${airtableRes.status})`, detail: errText }),
        {
          status: airtableRes.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    const result = await airtableRes.json()
    // CHANGED: 완료 화면이 **서버가 실제로 저장한 금액**을 그대로 쓰도록 응답에 실어 보낸다.
    //   클라이언트가 따로 계산하면 판정이 어긋났을 때 화면과 청구가 갈라진다.
    const pricing = {
      priceTier,
      unitPrices,
      subtotal: crewPrice(crew, priceTier),
      totalWithVat: withVat(crewPrice(crew, priceTier)),
      basePriceTotal,
      isDiscounted: isDiscountedTier(priceTier),
    }
    return new Response(JSON.stringify({ success: true, data: result, pricing }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}

export const config = {
  path: '/api/submit',
}
