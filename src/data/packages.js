import { Zap, Star, TrendingUp, Sparkles } from 'lucide-react'

/**
 * 단가 기준 (VAT 별도 / 1객실 기준) — 고정 금액
 * - 아이콘(Icon): 300,000원
 * - 파트너(Partner): 100,000원
 * - 라이징(Rising): 50,000원
 */

export const PRICING = {
  icon: { label: '아이콘', price: 300000 },
  partner: { label: '파트너', price: 100000 },
  rising: { label: '라이징', price: 50000 },
}

/** 예산 → Airtable 선택플랜 매핑 */
export const BUDGET_TO_PLAN_TIER = {
  50: '프리미엄 플러스',
  30: '프리미엄',
  15: '스탠다드',
  custom: '직접 선택할게요',
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
  50: {
    label: '50만원',
    subtitle: '최대 효과를 원하는 캠핑장',
    emoji: '💎',
    color: '#FF7300',
    plans: [
      {
        id: 'icon-50',
        name: '대박 아이콘 플랜',
        badge: '대박',
        composition: '아이콘 1 + 파트너 2',
        total: '총 3명',
        crew: { icon: 1, partner: 2, rising: 0 },
        price: 500000,
        priceWithVat: 550000,
        effect: '압도적 노출 (10만+ 유튜버 방문)',
        Icon: Zap,
        accent: '#FF383C',
        bgGradient: 'linear-gradient(135deg, #2D1B1B 0%, #1A1A2E 100%)',
      },
      {
        id: 'pro-50',
        name: '알찬 프로 플랜',
        badge: '알찬',
        composition: '파트너 3 + 라이징 4',
        total: '총 7명',
        crew: { icon: 0, partner: 3, rising: 4 },
        price: 500000,
        priceWithVat: 550000,
        effect: '고퀄리티 리뷰 및 상세페이지 활용',
        Icon: Star,
        accent: '#1975FF',
        bgGradient: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)',
      },
      {
        id: 'rising-50',
        name: '물량 라이징 플랜',
        badge: '물량',
        composition: '파트너 2 + 라이징 6',
        total: '총 8명',
        crew: { icon: 0, partner: 2, rising: 6 },
        price: 500000,
        priceWithVat: 550000,
        effect: 'SNS/블로그 도배 효과',
        Icon: TrendingUp,
        accent: '#01DF82',
        bgGradient: 'linear-gradient(135deg, #0D2818 0%, #1A1A2E 100%)',
      },
    ],
  },
  30: {
    label: '30만원',
    subtitle: '효율적인 마케팅을 원하는 캠핑장',
    emoji: '⭐',
    color: '#1975FF',
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
        effect: '강력한 임팩트',
        Icon: Zap,
        accent: '#9047FF',
        bgGradient: 'linear-gradient(135deg, #1A1025 0%, #1A1A2E 100%)',
      },
      {
        id: 'best-30',
        name: '베스트 플랜',
        badge: '베스트',
        composition: '파트너 2 + 라이징 2',
        total: '총 4명',
        crew: { icon: 0, partner: 2, rising: 2 },
        price: 300000,
        priceWithVat: 330000,
        effect: '검색 상위 노출 + 다양한 후기',
        Icon: Star,
        accent: '#FFC107',
        bgGradient: 'linear-gradient(135deg, #2D2614 0%, #1A1A2E 100%)',
      },
      {
        id: 'spread-30',
        name: '확산 플랜',
        badge: '확산',
        composition: '라이징 6명',
        total: '총 6명',
        crew: { icon: 0, partner: 0, rising: 6 },
        price: 300000,
        priceWithVat: 330000,
        effect: '풍성한 후기 확보',
        Icon: TrendingUp,
        accent: '#1975FF',
        bgGradient: 'linear-gradient(135deg, #0F1B2E 0%, #1A1A2E 100%)',
      },
    ],
  },
  15: {
    label: '15만원',
    subtitle: '합리적인 시작을 원하는 캠핑장',
    emoji: '🌱',
    color: '#01DF82',
    plans: [
      {
        id: 'partner-15',
        name: '실속 파트너 플랜',
        badge: '실속',
        composition: '파트너 1 + 라이징 1',
        total: '총 2명',
        crew: { icon: 0, partner: 1, rising: 1 },
        price: 150000,
        priceWithVat: 165000,
        effect: '가성비 고퀄 리뷰',
        Icon: Star,
        accent: '#727CF5',
        bgGradient: 'linear-gradient(135deg, #1A1A2E 0%, #1E1530 100%)',
      },
      {
        id: 'starter-15',
        name: '입문 스타터 플랜',
        badge: '입문',
        composition: '라이징 3명',
        total: '총 3명',
        crew: { icon: 0, partner: 0, rising: 3 },
        price: 150000,
        priceWithVat: 165000,
        effect: '오픈 초기 입소문',
        Icon: Sparkles,
        accent: '#01DF82',
        bgGradient: 'linear-gradient(135deg, #0D2818 0%, #111111 100%)',
      },
    ],
  },
}

export default PACKAGES
