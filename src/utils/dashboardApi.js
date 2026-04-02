// dashboardApi.js - 캠지기 대시보드 전용 API 클라이언트
// CHANGED: 복수 협찬 유형(프리미엄+파트너) 탭 전환 지원으로 전면 리팩토링

const API_BASE = ''

/** sessionStorage 키 */
const TOKEN_KEY = 'camjigi_dashboard_token'
const ACCOMMODATION_KEY = 'camjigi_accommodation_name'
// CHANGED: 단일 TYPE_KEY 대신 AVAILABLE_TYPES_KEY로 변경 (복수 유형 지원)
const AVAILABLE_TYPES_KEY = 'camjigi_dashboard_available_types'

/** 인증 정보 저장 */
// CHANGED: availableTypes 배열을 JSON으로 저장
export function saveAuth(token, accommodationName, availableTypes) {
  sessionStorage.setItem(TOKEN_KEY, token)
  sessionStorage.setItem(ACCOMMODATION_KEY, accommodationName)
  if (Array.isArray(availableTypes) && availableTypes.length > 0) {
    sessionStorage.setItem(AVAILABLE_TYPES_KEY, JSON.stringify(availableTypes))
  }
  // CHANGED: 레거시 키 명시적 정리 (혼재 세션 방지)
  sessionStorage.removeItem('camjigi_dashboard_type')
}

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function getAccommodationName() {
  return sessionStorage.getItem(ACCOMMODATION_KEY)
}

// CHANGED: 사용 가능한 협찬 유형 배열 반환 (하위 호환: 기존 단일 type 키도 지원)
export function getAvailableTypes() {
  const stored = sessionStorage.getItem(AVAILABLE_TYPES_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return ['premium']
    }
  }
  // 하위 호환: 기존 단일 type 키가 있으면 배열로 변환
  const legacyType = sessionStorage.getItem('camjigi_dashboard_type')
  if (legacyType) return [legacyType]
  return ['premium']
}

// CHANGED: getDashboardType 유지 (DashboardPage에서 현재 활성 탭 판별에 사용하지 않음, 하위 호환용)
export function getDashboardType() {
  const types = getAvailableTypes()
  return types[0] || 'premium'
}

export function clearAuth() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(ACCOMMODATION_KEY)
  sessionStorage.removeItem(AVAILABLE_TYPES_KEY)
  // 하위 호환: 기존 키도 정리
  sessionStorage.removeItem('camjigi_dashboard_type')
}

export function isAuthenticated() {
  return !!getToken()
}

/** 인증 헤더 생성 */
function authHeaders() {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

/** API 응답 공통 처리 */
async function handleResponse(response) {
  const data = await response.json()

  if (response.status === 401) {
    clearAuth()
    throw new Error(data.error || '인증이 만료되었습니다. 다시 로그인해주세요.')
  }

  if (!response.ok) {
    throw new Error(data.error || '요청 처리에 실패했습니다.')
  }

  return data
}

/** 사업자번호로 캠핑장 목록 조회 */
export async function lookupAccommodations(businessNumber) {
  const response = await fetch(`${API_BASE}/api/dashboard/lookup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ businessNumber }),
  })
  return handleResponse(response)
}

/** 로그인 (사업자번호 + 캠핑장 이름 + 연락처 뒷자리 4자리 + types 배열) */
// CHANGED: types 배열을 서버에 전달, 서버가 복수 타입 JWT 발급
export async function login(businessNumber, accommodationName, phoneLastFour, types) {
  const response = await fetch(`${API_BASE}/api/dashboard/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ businessNumber, accommodationName, phoneLastFour, types }),
  })
  const data = await handleResponse(response)

  if (data.success && data.token) {
    // CHANGED: availableTypes 배열을 sessionStorage에 저장
    saveAuth(data.token, data.accommodationName, data.availableTypes || ['premium'])
  }

  return data
}

/** 프리미엄 대시보드 데이터 조회 */
export async function fetchDashboardData() {
  const response = await fetch(`${API_BASE}/api/dashboard/data`, {
    method: 'GET',
    headers: authHeaders(),
  })
  return handleResponse(response)
}

/** 전액 환불 요청 (환불 사유 + 계좌 정보 + 통장사본 이미지) */
export async function requestRefund({ reason, bankName, accountNumber, accountHolder, bankImageBase64 }) {
  const response = await fetch(`${API_BASE}/api/dashboard/refund`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ reason, bankName, accountNumber, accountHolder, bankImageBase64 }),
  })
  return handleResponse(response)
}

/** 파트너 대시보드 데이터 조회 */
export async function fetchPartnerData() {
  const response = await fetch(`${API_BASE}/api/dashboard/partner-data`, {
    method: 'GET',
    headers: authHeaders(),
  })
  return handleResponse(response)
}
