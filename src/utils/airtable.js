/**
 * Airtable 제출 — Netlify Serverless Function 경유
 *
 * 보안: API 키가 프론트엔드에 노출되지 않음.
 * Netlify 대시보드에서 환경변수를 설정하면 자동으로 동작합니다.
 *
 * Airtable 테이블: 캠지기 모집 폼
 * 필드 매핑:
 *   - 숙소 이름을 적어주세요. (singleLineText)
 *   - 대표자명 (singleLineText)
 *   - 연락처 (phoneNumber)
 *   - 캠지기님 이메일 (email)
 *   - 숙소 위치 (singleSelect)
 *   - 선택예산 (singleSelect)
 *   - 선택플랜 (singleSelect)
 *   - 아이콘 크리에이터 협찬 제안 금액 (number)
 *   - ⭐️ 모집 희망 인원 (number)
 *   - 파트너 크리에이터 협찬 제안 금액 (number)
 *   - ✔️ 모집 인원 (number)
 *   - 라이징 협찬 제안 금액 (number)
 *   - 🔥 모집 인원 (number)
 *   - 동의합니다. (singleLineText)
 *   - 프리미엄 협찬 관련 동의 사항 (singleLineText)
 *   - 비고 (singleLineText)
 */

import {
  PRICE_TIER,
  normalizeTier,
  unitPricesForTier,
  crewPrice,
  withVat,
  isDiscountedTier,
  isPlanDiscountEligible,
} from '../constants/pricing'

export async function submitApplication(data) {
  const { budget, selectedPlan, formData, crew, planTier, couponEvent } = data

  // 로컬 개발 시 데모 모드 (API 엔드포인트가 없을 때)
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    // CHANGED: 데모 모드도 서버와 동일한 형태의 pricing 을 돌려준다.
    //   그래야 로컬에서 완료 화면이 프로덕션과 같은 경로(서버 금액 반영)를 탄다.
    //   실제 판정은 서버가 하므로, 여기서는 화면이 믿고 있는 구분을 그대로 쓴다.
    const demoTier = normalizeTier(
      typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('priceTier') : null
    )
    const effectiveTier = isPlanDiscountEligible(selectedPlan?.id) ? demoTier : PRICE_TIER.BASE
    const subtotal = crewPrice(crew, effectiveTier)
    const pricing = {
      priceTier: effectiveTier,
      unitPrices: unitPricesForTier(effectiveTier),
      subtotal,
      totalWithVat: withVat(subtotal),
      basePriceTotal: isDiscountedTier(effectiveTier) ? crewPrice(crew, PRICE_TIER.BASE) : 0,
      isDiscounted: isDiscountedTier(effectiveTier),
    }
    console.log('[Demo Mode] 제출 데이터:', JSON.stringify({
      budget,
      selectedPlan: selectedPlan?.name,
      planTier,
      crew,
      formData,
      couponEvent,
      pricing,
    }, null, 2))
    await new Promise((r) => setTimeout(r, 1200))
    return { success: true, demo: true, pricing }
  }

  // 프로덕션: Netlify Serverless Function 호출
  let response
  try {
    response = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ budget, selectedPlan, formData, crew, planTier, couponEvent }),
    })
  } catch (fetchErr) {
    // fetch 자체 실패 = 네트워크 문제
    throw new Error('NetworkError: ' + fetchErr.message)
  }

  if (!response.ok) {
    let errorBody = ''
    try {
      errorBody = await response.text()
    } catch (_) {}
    throw new Error(`ServerError (${response.status}): ${errorBody}`)
  }

  return await response.json()
}
