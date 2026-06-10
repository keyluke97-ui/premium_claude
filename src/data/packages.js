import { Zap, Star, TrendingUp, Sparkles, Crown, Layers } from 'lucide-react'

/**
 * 단가 기준 (VAT 별도 / 1객실 기준)
 * - 아이콘(Icon): 300,000원
 * - 파트너(Partner): 150,000원
 * - 라이징(Rising): 100,000원
 */

export const PRICING = {
  icon: { label: '아이콘', price: 300000 },
  partner: { label: '파트너', price: 150000 }, // CHANGED: 100000 → 150000 (캠지기 제안 금액 상향)
  rising: { label: '라이징', price: 100000 }, // CHANGED: 50000 → 100000 (캠지기 제안 금액 상향)
}

/** crew 구성에서 총 금액 계산 (VAT 별도) */
export function calcCrewPrice(crew) {
  return (
    PRICING.icon.price * (crew.icon || 0) +
    PRICING.partner.price * (crew.partner || 0) +
    PRICING.rising.price * (crew.rising || 0)
  )
}

/** crew 구성에서 VAT 포함 금액 계산 */
export function calcCrewPriceWithVat(crew) {
  return Math.round(calcCrewPrice(crew) * 1.1)
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
        discountEligible: true,
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
        discountEligible: true,
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
        discountEligible: true,
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
        composition: '아이콘 1 + 라이징 2',
        total: '총 3명',
        crew: { icon: 1, partner: 0, rising: 2 },
        price: 500000,
        priceWithVat: 550000,
        effect: '가장 인기 있는 구성, 노출+후기 동시 확보',
        Icon: Zap,
        accent: '#01DF82',
        bgGradient: 'linear-gradient(135deg, #0D2818 0%, #1A1A2E 100%)',
        discountEligible: true,
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
        discountEligible: true,
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
        discountEligible: false,
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
        discountEligible: true,
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
        discountEligible: true,
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
        discountEligible: false,
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
        recommended: true,
        composition: '파트너 1 + 라이징 1',
        total: '총 2명',
        crew: { icon: 0, partner: 1, rising: 1 },
        price: 250000,
        priceWithVat: 275000,
        effect: '고퀄 리뷰 + 체험 후기를 동시에 확보',
        Icon: Layers,
        accent: '#01DF82',
        bgGradient: 'linear-gradient(135deg, #0D2818 0%, #1A1A2E 100%)',
        discountEligible: true,
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
        discountEligible: true,
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
        discountEligible: true,
      },
    ],
  },
}

/** 재신청 할인 단가 (VAT 별도) */
export const DISCOUNT_PRICING = {
  icon: { label: '아이콘', price: 250000, camfitFee: 10000, creatorFee: 240000 },
  partner: { label: '파트너', price: 120000, camfitFee: 10000, creatorFee: 110000 },
  rising: { label: '라이징', price: 70000, camfitFee: 10000, creatorFee: 60000 },
}

/** 플랜에 재신청 할인을 적용한 새 플랜 객체 반환 */
export function computeDiscountedPlan(plan) {
  if (!plan || !plan.crew || !plan.discountEligible) return plan
  const discountedPrice =
    DISCOUNT_PRICING.icon.price * (plan.crew.icon || 0) +
    DISCOUNT_PRICING.partner.price * (plan.crew.partner || 0) +
    DISCOUNT_PRICING.rising.price * (plan.crew.rising || 0)
  return {
    ...plan,
    originalPrice: plan.price,
    price: discountedPrice,
    priceWithVat: Math.round(discountedPrice * 1.1),
    isDiscounted: true,
  }
}

export default PACKAGES
