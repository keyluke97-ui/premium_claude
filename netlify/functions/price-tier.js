// price-tier.js - 사업자번호로 가격 구분(기본가/신규/재신청)을 판정하는 공용 로직
//
// check-first-time.js(화면 미리보기)와 submit.js(최종 저장)가 **같은 함수**를 쓴다.
// 판정이 두 곳에 따로 구현되면 화면과 청구가 갈라진다.

import { sanitizeForFormula } from './jwt-utils.js'
import { TABLE_CONFIG } from './shared-constants.js'
import { PRICE_TIER, isSaleOn } from '../../src/constants/pricing.js'

/**
 * 조회 자체가 실패했을 때 던진다.
 * ⚠️ 기본가로 삼키지 않는다 — 조회를 "건너뛴" 것과 조회가 "실패한" 것은 다르다.
 *    전자는 캠지기의 선택이라 기본가가 맞지만, 후자는 우리 인프라 사고인데
 *    조용히 기본가로 저장하면 화면에서 안내한 할인가보다 비싸게 청구된다.
 *    실패는 에러로 올려 신청을 중단시키고, 캠지기가 재시도하게 한다.
 */
export class PriceTierLookupError extends Error {
  constructor(message) {
    super(message)
    this.name = 'PriceTierLookupError'
  }
}

/** 재시도 대기 (지수 백오프) */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * 방금 만든 자기 레코드를 이력으로 오인하지 않기 위한 유예 시간.
 * 제출이 Airtable에 레코드를 만든 뒤 응답만 유실되면 캠지기가 재시도하는데,
 * 그때 1차 레코드가 "신청 이력"으로 잡혀 신규 → 재신청으로 단가가 올라갔다.
 * 이 창 안의 레코드는 같은 신청 세션으로 보고 이력에서 제외한다.
 */
const SELF_RECORD_GRACE_MS = 10 * 60 * 1000

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
 * - 이벤트가 꺼져 있으면(AUTUMN_SALE=off) 기본가
 * - 사업자번호가 형식에 안 맞으면 기본가
 * - 최근 10분 밖의 신청 이력이 있으면 재신청, 없으면 신규
 *   (체크박스 '프렌들리' 건 = 캠핏이 비용 부담한 신청은 이력에서 제외. 캠핑장 속성인
 *    '프렌들리 캠핑장(내부 확인용)'과 다르다 — 이쪽은 신청 건 단위다.)
 * - 조회 실패는 PriceTierLookupError 로 던진다 (기본가로 삼키지 않는다)
 */
export async function resolvePriceTier({ apiKey, baseId, tableId, businessNumber, now = Date.now() }) {
  if (!isSaleOn(process.env.AUTUMN_SALE)) return PRICE_TIER.BASE
  if (!isValidBusinessNumber(businessNumber)) return PRICE_TIER.BASE

  const clean = normalizeBusinessNumber(businessNumber)
  const fieldName = TABLE_CONFIG.premium.businessNumberField
  const filterFormula = encodeURIComponent(
    `AND(SUBSTITUTE({${fieldName}}, '-', '')='${sanitizeForFormula(clean)}', NOT({프렌들리}))`
  )
  // maxRecords=5: 한 건만 받으면 그 한 건이 방금 만든 재시도 레코드일 때
  // 그보다 오래된 진짜 이력을 못 본다.
  const url =
    `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableId)}` +
    `?filterByFormula=${filterFormula}&maxRecords=5&fields%5B%5D=${encodeURIComponent(fieldName)}`

  const MAX_ATTEMPTS = 3
  let lastError = null

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) await sleep(250 * 2 ** (attempt - 1)) // 250ms, 500ms

    let response
    try {
      response = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } })
    } catch (err) {
      lastError = err
      continue
    }

    if (response.ok) {
      const data = await response.json()
      const records = Array.isArray(data.records) ? data.records : []
      // 유예 창 안의 레코드(= 같은 신청 세션의 중복 생성분)는 이력에서 제외한다.
      const priorRecords = records.filter((record) => {
        const created = Date.parse(record?.createdTime)
        if (!Number.isFinite(created)) return true // 생성시각 불명이면 보수적으로 이력으로 본다
        return now - created > SELF_RECORD_GRACE_MS
      })
      return priorRecords.length > 0 ? PRICE_TIER.RETURNING : PRICE_TIER.NEW
    }

    lastError = new Error(`Airtable 조회 실패 (${response.status})`)
    // 429(rate limit)·5xx 만 재시도 가치가 있다. 그 외 4xx 는 다시 해도 같다.
    if (response.status !== 429 && response.status < 500) break
  }

  throw new PriceTierLookupError(
    `가격 구분 조회에 실패했습니다. 잠시 후 다시 시도해주세요. (${lastError?.message || 'unknown'})`
  )
}
