// config.js - 팔로워 쿠폰 이벤트(통합 퍼널) 설정값
// camfit-partner v3에서 이식. 프리미엄 퍼널의 선택형 쿠폰 이벤트 스텝에서 사용.
// 신원/사이트종류/권역은 프리미엄 InfoStep이 이미 수집하므로 여기엔 포함하지 않음.

// 방문 가능 기간 (일 단위)
//
// CHANGED(2026-08-28): minimumDays 30 → 60.
//   기한이 한 달 이내인 공고는 크리에이터 일정이 이미 ~1달 선점돼 있어 신규 신청이
//   들어오지 않는다. 실측(포털, 08-28): 잔여 자리가 있는 공고 14건 중 7건이
//   기한 문제로 못 채워지는 상태였다. 하한을 올려 모집 가능 기간을 구조적으로 확보한다.
//
// 🔴 약관 제11조는 이제 **숫자를 갖지 않는다** — "캠지기가 신청 시 설정한 방문 가능 기간
//    이내"로 개정(2026-08-28). 여기 숫자를 바꿔도 약관 개정·동의 재수집이 필요 없다.
//    대신 실제 값은 화면(CouponEventStep·CompleteStep)에 반드시 노출돼야 한다 —
//    약관이 숫자를 말하지 않으므로 그 고지가 유일한 통로다.
export const VISIT_PERIOD = {
  defaultDays: 60,
  minimumDays: 60,
  maximumDays: 120,
  adjustmentStep: 15,
}

/**
 * 쿠폰 이벤트를 신청하지 않은 건의 콘텐츠 제작 개월수(고정).
 * 비쿠폰 건은 `방문 가능 기간(일수)`를 수집하지 않으므로 파생할 입력이 없다.
 * @see deriveProductionMonths
 */
export const DEFAULT_PRODUCTION_MONTHS = 3

/**
 * Airtable `기본 제작 개월수`로 저장할 값.
 *
 * 🔴 이 필드는 **아무도 쓰지 않고 있었다**(2026-08-28 확인) — 퍼널·자동화 어디도 쓰지 않아
 *    운영자가 손으로 채웠고, 안 채운 6건은 포뮬러가
 *    `DATEADD(Created, 0, 'months')`로 계산해 **생성 즉시 만료**된 상태였다.
 *    퍼널이 쓰기 시작하면 그 경로가 사라진다.
 *
 * 공식은 `ceil(방문일수 / 30) + 1`. `+1`이 제작분(퇴실 후 14일)을 덮는다.
 *   60일 → 3개월 · 90일 → 4개월 · 120일 → 5개월
 *
 * ⚠️ 방문 기간에서 **파생**시키는 이유: 두 값을 따로 받으면 서로를 모른 채 어긋난다.
 *    방문 120일인데 제작 2개월이면 방문도 하기 전에 기한이 끝난다.
 */
export function deriveProductionMonths(visitPeriodDays) {
  const days = Number(visitPeriodDays)
  if (!Number.isFinite(days) || days <= 0) return DEFAULT_PRODUCTION_MONTHS
  return Math.ceil(days / 30) + 1
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
  { id: 'weekday_weekend',         airtableValue: '평일+주말(금토)',  label: '평일 + 주말',        description: '일~토 입실 시 할인 적용' },
  { id: 'weekday_weekend_holiday', airtableValue: '평일+주말+공휴일', label: '평일 + 주말 + 공휴일', description: '공휴일 포함 전체 기간 할인 적용', recommended: true },
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
  couponApplyDays: 'weekday_weekend_holiday',
  couponPerCreator: 20,
}
