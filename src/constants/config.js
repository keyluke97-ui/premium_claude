// config.js - 팔로워 쿠폰 이벤트(통합 퍼널) 설정값
// camfit-partner v3에서 이식. 프리미엄 퍼널의 선택형 쿠폰 이벤트 스텝에서 사용.
// 신원/사이트종류/권역은 프리미엄 InfoStep이 이미 수집하므로 여기엔 포함하지 않음.

// 방문 가능 기간 (일 단위)
// defaultDays 60 = 프리미엄 협찬 약관 제11조 '신청 후 2개월 이내 방문'과 정합.
export const VISIT_PERIOD = {
  defaultDays: 60,
  minimumDays: 30,
  maximumDays: 120,
  adjustmentStep: 15,
}

// 쿠폰 유효 기간 (방문 종료 후 버퍼 + 연장)
export const COUPON_PERIOD = {
  contentCreationDays: 14,
  minimumBenefitDays: 30,
  adjustmentStep: 15,
  maximumExtensions: 2,
}

// 할인 금액 프리셋 + 직접 설정 범위
export const DISCOUNT_PRESETS = [
  { value: 10000, label: '1만원', sublabel: '부담 없이' },
  { value: 20000, label: '2만원', sublabel: '⭐ 추천', recommended: true },
  { value: 30000, label: '3만원', sublabel: '최대 노출' },
]

export const DISCOUNT_RANGE = {
  minimum: 10000,
  maximum: 50000,
  step: 5000,
}

// 쿠폰 적용 요일 (Airtable `쿠폰 적용 요일` 필드 옵션과 1:1 매핑)
export const COUPON_APPLY_DAYS = [
  { id: 'weekday_only',            airtableValue: '평일전용',         label: '평일만',            description: '일~목 입실 시 할인 적용' },
  { id: 'weekday_weekend',         airtableValue: '평일+주말(금토)',  label: '평일 + 주말',        description: '일~토 입실 시 할인 적용', recommended: true },
  { id: 'weekday_weekend_holiday', airtableValue: '평일+주말+공휴일', label: '평일 + 주말 + 공휴일', description: '공휴일 포함 전체 기간 할인 적용' },
]

// 쿠폰을 배포하는 크리에이터는 프리미엄 패키지에서 모집한 그 크리에이터들임.
// 따라서 쿠폰 이벤트는 별도 모집 규모를 받지 않고, 선택한 프리미엄 플랜의 crew(아이콘/파트너/라이징)에서 인원을 파생함.

// 인당 팔로워 쿠폰 프리셋
export const COUPON_PER_CREATOR_PRESETS = [
  { value: 10, label: '10장', sublabel: '테스트' },
  { value: 20, label: '20장', sublabel: '⭐ 추천', recommended: true },
  { value: 30, label: '30장', sublabel: '최대 노출' },
]

// 쿠폰 이벤트 스텝 기본값(옵트아웃) — 추천 프리셋 사전선택
// 모집 인원은 프리미엄 플랜 crew에서 파생하므로 여기에 없음.
export const COUPON_EVENT_DEFAULTS = {
  enabled: true,
  discount: 20000,
  couponApplyDays: 'weekday_weekend',
  couponPerCreator: 20,
}
