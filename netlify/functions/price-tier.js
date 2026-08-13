// price-tier.js - 사업자번호로 가격 구분(기본가/신규/재신청)을 판정하는 공용 로직
//
// check-first-time.js(화면 미리보기)와 submit.js(최종 저장)가 **같은 함수**를 쓴다.
// 판정이 두 곳에 따로 구현되면 화면과 청구가 갈라진다.

import { sanitizeForFormula } from './jwt-utils.js'
import { TABLE_CONFIG } from './shared-constants.js'
import { PRICE_TIER, isSaleOn } from '../../src/constants/pricing.js'

/** 하이픈·공백 제거 후 숫자만 */
export function normalizeBusinessNumber(value) {
  return String(value || '').replace(/[^0-9]/g, '')
}

export function isValidBusinessNumber(value) {
  return /^\d{10}$/.test(normalizeBusinessNumber(value))
}

/**
 * 사업자번호로 가격 구분을 판정한다.
 *
 * - 이벤트가 꺼져 있으면(AUTUMN_SALE=off) 무조건 기본가
 * - 사업자번호가 형식에 안 맞으면 기본가
 * - `캠지기 모집 폼`에 이력이 있으면 재신청, 없으면 신규
 * - 조회에 실패하면 **기본가**로 떨어뜨린다.
 *   미판정을 가장 비싼 구분으로 두는 것이 이 설계의 원칙이다 —
 *   조회를 건너뛰거나 실패하는 것이 이득이 되면 안 된다.
 */
export async function resolvePriceTier({ apiKey, baseId, tableId, businessNumber }) {
  if (!isSaleOn(process.env.AUTUMN_SALE)) return PRICE_TIER.BASE
  if (!isValidBusinessNumber(businessNumber)) return PRICE_TIER.BASE

  const clean = normalizeBusinessNumber(businessNumber)
  const fieldName = TABLE_CONFIG.premium.businessNumberField
  const filterFormula = encodeURIComponent(
    `SUBSTITUTE({${fieldName}}, '-', '')='${sanitizeForFormula(clean)}'`
  )
  const url =
    `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableId)}` +
    `?filterByFormula=${filterFormula}&maxRecords=1&fields%5B%5D=${encodeURIComponent(fieldName)}`

  // 일시적 실패는 1회 재시도. 그래도 안 되면 기본가.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } })
      if (!response.ok) continue
      const data = await response.json()
      const hasHistory = !!(data.records && data.records.length > 0)
      return hasHistory ? PRICE_TIER.RETURNING : PRICE_TIER.NEW
    } catch (_) {
      // 다음 시도로
    }
  }
  return PRICE_TIER.BASE
}
