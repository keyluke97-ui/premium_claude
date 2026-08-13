// pricing.js - 협찬 단가 단일 출처 (프론트엔드 + Netlify Functions 공용)
//
// ⚠️ 이 파일에는 의존성을 추가하지 말 것.
//    netlify/functions/*.js 가 직접 import 하므로, lucide-react·framer-motion 같은
//    브라우저 전용 패키지나 import.meta.env 를 넣으면 함수 번들이 깨진다.
//    환경변수는 각 실행 환경에서 읽어 isSaleOn()에 넘긴다.

/**
 * 가격 구분 — Airtable `가격 구분`(단일 선택) 옵션명과 1:1로 대응한다.
 * 값을 바꾸면 Airtable 옵션·수식도 함께 바꿔야 한다.
 */
export const PRICE_TIER = {
  BASE: '기본가',
  NEW: '신규',
  RETURNING: '재신청',
}

/**
 * 가격 구분별 등급 단가 (VAT 별도 / 1객실 1인 기준)
 * - 기본가: 사업자번호 미판정 · 할인 제외 플랜(확산·입문·직접구성)
 * - 신규:   해당 사업자번호의 신청 이력이 없음
 * - 재신청: 신청 이력이 있음
 */
export const TIER_UNIT_PRICES = {
  [PRICE_TIER.BASE]: { icon: 300000, partner: 150000, rising: 100000 },
  [PRICE_TIER.NEW]: { icon: 250000, partner: 120000, rising: 80000 },
  [PRICE_TIER.RETURNING]: { icon: 270000, partner: 130000, rising: 90000 },
}

/**
 * 가을 맞이 할인 스위치.
 * 'off' 로 두면 신규·재신청 판정을 무시하고 **전원 기본가**로 돌아간다.
 * (재신청 할인도 함께 사라진다 — 이벤트를 통째로 내리는 스위치다.)
 * 값이 없으면 켜짐이 기본값이라, 배포만으로 이벤트가 시작된다.
 */
export function isSaleOn(flag) {
  return String(flag ?? 'on').trim().toLowerCase() !== 'off'
}

/** 가격 구분이 유효한 값인지 (알 수 없는 값은 기본가로 떨어뜨린다) */
export function normalizeTier(tier) {
  return TIER_UNIT_PRICES[tier] ? tier : PRICE_TIER.BASE
}

/** 가격 구분에 해당하는 등급별 단가 */
export function unitPricesForTier(tier) {
  return TIER_UNIT_PRICES[normalizeTier(tier)]
}

/** 크루 구성 총액 (VAT 별도) */
export function crewPrice(crew, tier) {
  const p = unitPricesForTier(tier)
  return (
    p.icon * (crew?.icon || 0) +
    p.partner * (crew?.partner || 0) +
    p.rising * (crew?.rising || 0)
  )
}

/** VAT 포함 금액 */
export function withVat(amount) {
  return Math.round(amount * 1.1)
}

/** 기본가 대비 할인 적용 여부 — Airtable `이벤트 할인` 체크박스에 그대로 들어간다 */
export function isDiscountedTier(tier) {
  return normalizeTier(tier) !== PRICE_TIER.BASE
}

/**
 * 할인 제외 플랜 id — 신규·재신청 판정과 무관하게 항상 기본가로 계산한다.
 * packages.js 의 plans[].discountEligible 은 이 목록에서 파생되고,
 * submit.js 도 클라이언트가 보낸 플래그가 아니라 이 목록으로 판정한다.
 * (화면과 청구가 같은 근거를 보게 하려면 목록이 한 곳에만 있어야 한다.)
 */
export const DISCOUNT_INELIGIBLE_PLAN_IDS = [
  'spread-50', // 확산 플랜 (라이징 5)
  'beginner-30', // 입문 플랜 (라이징 3)
  'custom', // 직접 선택할게요
]

export function isPlanDiscountEligible(planId) {
  return !!planId && !DISCOUNT_INELIGIBLE_PLAN_IDS.includes(planId)
}
