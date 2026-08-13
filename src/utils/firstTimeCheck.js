// firstTimeCheck.js - 사업자번호로 가격 구분 조회 (PackageStep, InfoStep 공용)
//
// CHANGED: isReturning(boolean) → tier(기본가/신규/재신청) 3단.
// ⚠️ 이 값은 **화면 표시용**이다. 실제 청구 단가는 submit.js 가 서버에서 다시 판정한다.
//    조회에 실패하면 tier 를 주지 않고, 화면은 기본가를 유지한다 (미판정 = 가장 비싼 구분).

import { PRICE_TIER } from '../constants/pricing'

export async function checkFirstTime(businessNumber) {
  const clean = (businessNumber || '').replace(/[^0-9]/g, '')
  if (!/^\d{10}$/.test(clean)) {
    return { error: '올바른 사업자 번호를 입력해주세요 (예: 123-45-67890)' }
  }
  try {
    const res = await fetch('/api/check-first-time', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessNumber }),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.error || '조회 중 오류가 발생했습니다.' }
    // 서버가 tier 를 주지 않는 구버전 응답이면 isReturning 으로 환산
    const tier =
      data.tier || (data.isReturning ? PRICE_TIER.RETURNING : PRICE_TIER.NEW)
    return { tier }
  } catch {
    return { error: '네트워크 오류가 발생했습니다. 다시 시도해주세요.' }
  }
}
