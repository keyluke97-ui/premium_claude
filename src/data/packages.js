import { Zap, Star, TrendingUp, Sparkles, Crown, Layers } from 'lucide-react'
// CHANGED: 단가는 src/constants/pricing.js 단일 출처를 쓴다 (Netlify Functions와 공용).
import {
  PRICE_TIER,
  TIER_UNIT_PRICES,
  unitPricesForTier,
  crewPrice,
  withVat,
  isPlanDiscountEligible,
} from '../constants/pricing'

/**
 * 기본가 단가 (VAT 별도 / 1객실 기준) — 화면 라벨용 뷰.
 * 숫자는 pricing.js 의 기본가 테이블에서 그대로 읽는다. 여기에 값을 적어두지 말 것.
 */
export const PRICING = {
  icon: { label: '아이콘', price: TIER_UNIT_PRICES[PRICE_TIER.BASE].icon },
  partner: { label: '파트너', price: TIER_UNIT_PRICES[PRICE_TIER.BASE].partner },
  rising: { label: '라이징', price: TIER_UNIT_PRICES[PRICE_TIER.BASE].rising },
}

/** crew 구성에서 총 금액 계산 (VAT 별도) — 기본가 기준 */
export function calcCrewPrice(crew) {
  return crewPrice(crew, PRICE_TIER.BASE)
}

/** crew 구성에서 VAT 포함 금액 계산 — 기본가 기준 */
export function calcCrewPriceWithVat(crew) {
  return withVat(calcCrewPrice(crew))
}

const PACKAGES = {
  70: {
    label: '70만원',
    subtitle: '최대 효과를 원하는 캠핑장',
    emoji: '💎',
    color: '#FF7300',
    plans: [
      {
        id: 'allinone-70',
        name: '올인원 플랜',
        badge: '올인원',
        composition: '아이콘 1 + 파트너 2 + 라이징 1',
        total: '총 4명',
        crew: { icon: 1, partner: 2, rising: 1 },
        price: 700000,
        priceWithVat: 770000,
        effect: '전 등급 크리에이터가 총출동하는 풀패키지',
        Icon: Crown,
        accent: '#01DF82',
        bgGradient: 'linear-gradient(135deg, #0D2818 0%, #1A1A2E 100%)',
      },
      {
        id: 'bigicon-70',
        name: '대박 아이콘 플랜',
        badge: '대박',
        composition: '아이콘 2 + 라이징 1',
        total: '총 3명',
        crew: { icon: 2, partner: 0, rising: 1 },
        price: 700000,
        priceWithVat: 770000,
        effect: '아이콘 2명이 만드는 대박 노출 효과',
        Icon: Zap,
        accent: '#01DF82',
        bgGradient: 'linear-gradient(135deg, #0D2818 0%, #1A1A2E 100%)',
      },
      {
        id: 'volume-70',
        name: '물량 라이징 플랜',
        badge: '물량',
        composition: '파트너 2 + 라이징 4',
        total: '총 6명',
        crew: { icon: 0, partner: 2, rising: 4 },
        price: 700000,
        priceWithVat: 770000,
        effect: '6명이 만드는 대규모 콘텐츠 물량',
        Icon: Layers,
        accent: '#01DF82',
        bgGradient: 'linear-gradient(135deg, #0D2818 0%, #1A1A2E 100%)',
      },
    ],
  },
  50: {
    label: '50만원',
    subtitle: '효과와 효율 모두 잡는 캠핑장',
    emoji: '⭐',
    color: '#1975FF',
    plans: [
      {
        id: 'best-50', // CHANGED: signature-50 → best-50 (베스트 플랜 리네이밍)
        name: '베스트 플랜',
        badge: '베스트',
        recommended: '가장 많이 찾는', // CHANGED(10-29): 판매 1위 — 추천 뱃지 자리에 표시
        composition: '아이콘 1 + 라이징 2',
        total: '총 3명',
        crew: { icon: 1, partner: 0, rising: 2 },
        price: 500000,
        priceWithVat: 550000,
        effect: '가장 인기 있는 구성, 노출+후기 동시 확보',
        Icon: Zap,
        accent: '#01DF82',
        bgGradient: 'linear-gradient(135deg, #0D2818 0%, #1A1A2E 100%)',
      },
      {
        id: 'rich-50',
        name: '알찬 프로 플랜',
        badge: '알찬',
        composition: '파트너 2 + 라이징 2',
        total: '총 4명',
        crew: { icon: 0, partner: 2, rising: 2 },
        price: 500000,
        priceWithVat: 550000,
        effect: '고퀄 리뷰와 다양한 후기의 균형',
        Icon: Star,
        accent: '#01DF82',
        bgGradient: 'linear-gradient(135deg, #0D2818 0%, #1A1A2E 100%)',
      },
      {
        id: 'spread-50',
        name: '확산 플랜',
        badge: '확산',
        composition: '라이징 5명',
        total: '총 5명',
        crew: { icon: 0, partner: 0, rising: 5 },
        price: 500000,
        priceWithVat: 550000,
        effect: '5명이 동시에 퍼뜨리는 확산 효과',
        Icon: TrendingUp,
        accent: '#01DF82',
        bgGradient: 'linear-gradient(135deg, #0D2818 0%, #1A1A2E 100%)',
      },
    ],
  },
  30: {
    label: '30만원',
    subtitle: '합리적인 시작을 원하는 캠핑장',
    emoji: '🌱',
    color: '#01DF82',
    plans: [
      {
        id: 'onepick-30',
        name: '원픽 플랜',
        badge: '원픽',
        composition: '아이콘 1명',
        total: '총 1명',
        crew: { icon: 1, partner: 0, rising: 0 },
        price: 300000,
        priceWithVat: 330000,
        effect: '강력한 한 방의 대형 노출',
        Icon: Zap,
        accent: '#01DF82',
        bgGradient: 'linear-gradient(135deg, #0D2818 0%, #1A1A2E 100%)',
      },
      {
        id: 'value-30',
        name: '실속 파트너 플랜',
        badge: '실속',
        composition: '파트너 2명',
        total: '총 2명',
        crew: { icon: 0, partner: 2, rising: 0 },
        price: 300000,
        priceWithVat: 330000,
        effect: '고퀄 리뷰 2편으로 검색 상위 점령',
        Icon: Star,
        accent: '#01DF82',
        bgGradient: 'linear-gradient(135deg, #0D2818 0%, #1A1A2E 100%)',
      },
      {
        id: 'beginner-30',
        name: '입문 플랜',
        badge: '입문',
        composition: '라이징 3명',
        total: '총 3명',
        crew: { icon: 0, partner: 0, rising: 3 },
        price: 300000,
        priceWithVat: 330000,
        effect: '3편의 풍성한 체험 후기 확보',
        Icon: Sparkles,
        accent: '#01DF82',
        bgGradient: 'linear-gradient(135deg, #0D2818 0%, #111111 100%)',
      },
    ],
  },
  15: {
    label: '10~25만원',
    subtitle: '부담 없이 시작하는 첫 협찬',
    emoji: '👋',
    color: '#A0AEC0',
    plans: [
      {
        id: 'starter-15',
        name: '스타터 플랜',
        badge: '스타터',
        composition: '파트너 1 + 라이징 1',
        total: '총 2명',
        crew: { icon: 0, partner: 1, rising: 1 },
        price: 250000,
        priceWithVat: 275000,
        effect: '고퀄 리뷰 + 체험 후기를 동시에 확보',
        Icon: Layers,
        accent: '#01DF82',
        bgGradient: 'linear-gradient(135deg, #0D2818 0%, #1A1A2E 100%)',
      },
      {
        id: 'taste-15',
        name: '맛보기 플랜',
        badge: '맛보기',
        composition: '파트너 1명',
        total: '총 1명',
        crew: { icon: 0, partner: 1, rising: 0 },
        price: 150000,
        priceWithVat: 165000,
        effect: '프리미엄 협찬, 가볍게 첫 경험',
        Icon: Star,
        accent: '#01DF82',
        bgGradient: 'linear-gradient(135deg, #1A1A2E 0%, #111111 100%)',
      },
      {
        id: 'rising-exp-15',
        name: '라이징 체험 플랜',
        badge: '체험',
        composition: '라이징 1명',
        total: '총 1명',
        crew: { icon: 0, partner: 0, rising: 1 },
        price: 100000,
        priceWithVat: 110000,
        effect: '가장 가볍게 시작하는 첫 협찬 체험',
        Icon: Sparkles,
        accent: '#01DF82',
        bgGradient: 'linear-gradient(135deg, #0D2818 0%, #111111 100%)',
      },
    ],
  },
}

// CHANGED: plans[].discountEligible 리터럴을 제거하고 pricing.js 의 제외 목록에서 파생한다.
//   submit.js 도 같은 목록으로 판정하므로, 화면과 청구가 어긋날 수 없다.
Object.values(PACKAGES).forEach((pkg) => {
  pkg.plans.forEach((plan) => {
    plan.discountEligible = isPlanDiscountEligible(plan.id)
  })
})

/**
 * CHANGED: 재신청 단일 할인 → 가격 구분 3단(기본가·신규·재신청)으로 확장.
 * 단가 테이블은 pricing.js 로 옮겼다. 화면에서 등급별 단가가 필요하면 이 함수를 쓴다.
 */
export function tierUnitPrices(tier) {
  const p = unitPricesForTier(tier)
  return {
    icon: { label: '아이콘', price: p.icon },
    partner: { label: '파트너', price: p.partner },
    rising: { label: '라이징', price: p.rising },
  }
}

/**
 * 플랜에 가격 구분을 적용한 **새 플랜 객체**를 반환한다.
 * - 할인 제외 플랜(discountEligible=false)·기본가는 원본을 그대로 돌려준다.
 *   카탈로그의 plan.price 는 기본가 crew 합계와 일치하므로 재계산이 불필요하다.
 * - 원본을 변형하지 않으므로 구분이 바뀌면 카탈로그에서 원본을 다시 읽어 왕복할 수 있다.
 */
export function computePlanPrice(plan, tier) {
  if (!plan || !plan.crew) return plan
  if (!plan.discountEligible || !tier || tier === PRICE_TIER.BASE) return plan
  const price = crewPrice(plan.crew, tier)
  return {
    ...plan,
    originalPrice: plan.price,
    price,
    priceWithVat: withVat(price),
    priceTier: tier,
    isDiscounted: true,
  }
}

export default PACKAGES
