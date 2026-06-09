// coupons.js - 팔로워 쿠폰 이벤트 포맷 유틸

/**
 * 할인 금액을 "2만원"/"15,000원" 형식으로 변환
 */
export function formatDiscount(amount) {
  if (!amount) return '-'
  if (amount >= 10000 && amount % 10000 === 0) {
    return `${amount / 10000}만원`
  }
  return `${amount.toLocaleString()}원`
}
