// shared-constants.js - Netlify Functions 간 공유 상수 (테이블 설정, 등급 매핑, 조회 제한)

/**
 * Airtable 테이블별 필드명 설정
 * - premium: 캠지기 모집 폼 (프리미엄 협찬)
 * - partner: 파트너 캠페인 (파트너 협찬)
 */
export const TABLE_CONFIG = {
  premium: {
    businessNumberField: '사업자 번호',
    accommodationNameField: '숙소 이름을 적어주세요.',
    phoneField: '연락처',
    label: '프리미엄 협찬',
  },
  partner: {
    businessNumberField: '사업자번호',
    accommodationNameField: '캠핑장명',
    phoneField: '연락처',
    label: '파트너 협찬',
  },
}

/**
 * 크리에이터 등급 숫자 → 등급 정보 매핑
 * 3=아이콘⭐️, 2=파트너✔️, 1=라이징🔥
 */
export const GRADE_INFO = {
  3: { emoji: '⭐️', label: '아이콘' },
  2: { emoji: '✔️', label: '파트너' },
  1: { emoji: '🔥', label: '라이징' },
}

/** Airtable 조회 제한 상수 */
export const MAX_RECORDS_LOOKUP = 50
export const MAX_RECORDS_OFFERS = 100
