// jwt-utils.js - Node.js crypto 기반 간이 JWT 유틸. 외부 의존성 없음.
import { createHmac, timingSafeEqual } from 'crypto' // CHANGED: S-5 - timingSafeEqual 추가

const ALGORITHM = 'HS256'
const TOKEN_EXPIRY_HOURS = 24

function base64UrlEncode(buffer) {
  const base64String = typeof buffer === 'string'
    ? Buffer.from(buffer).toString('base64')
    : buffer.toString('base64')
  return base64String.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(encodedString) {
  const padded = encodedString.replace(/-/g, '+').replace(/_/g, '/') +
    '='.repeat((4 - (encodedString.length % 4)) % 4)
  return Buffer.from(padded, 'base64').toString('utf8')
}

/**
 * JWT 토큰 생성
 * @param {object} payload - 토큰에 담을 데이터 (recordId 등)
 * @param {string} secret - JWT_SECRET 환경변수
 * @returns {string} JWT 토큰
 */
export function signToken(payload, secret) {
  const header = { alg: ALGORITHM, typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)

  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + TOKEN_EXPIRY_HOURS * 3600,
  }

  const headerEncoded = base64UrlEncode(JSON.stringify(header))
  const payloadEncoded = base64UrlEncode(JSON.stringify(fullPayload))
  const signatureInput = `${headerEncoded}.${payloadEncoded}`

  const signature = base64UrlEncode(
    createHmac('sha256', secret).update(signatureInput).digest()
  )

  return `${headerEncoded}.${payloadEncoded}.${signature}`
}

/**
 * JWT 토큰 검증 + 디코드
 * @param {string} token - JWT 토큰 문자열
 * @param {string} secret - JWT_SECRET 환경변수
 * @returns {{ valid: boolean, payload?: object, error?: string }}
 */
export function verifyToken(token, secret) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return { valid: false, error: '유효하지 않은 토큰 형식' }
    }

    const [headerEncoded, payloadEncoded, signatureEncoded] = parts

    // CHANGED: S-5 - 타이밍 공격 방지: timingSafeEqual로 서명 비교
    const expectedSignature = base64UrlEncode(
      createHmac('sha256', secret).update(`${headerEncoded}.${payloadEncoded}`).digest()
    )

    const bufferExpected = Buffer.from(expectedSignature)
    const bufferReceived = Buffer.from(signatureEncoded)
    const signatureValid =
      bufferExpected.length === bufferReceived.length &&
      timingSafeEqual(bufferExpected, bufferReceived)

    if (!signatureValid) {
      return { valid: false, error: '토큰 서명이 유효하지 않습니다' }
    }

    // 만료 확인
    const payload = JSON.parse(base64UrlDecode(payloadEncoded))
    const now = Math.floor(Date.now() / 1000)

    if (payload.exp && payload.exp < now) {
      return { valid: false, error: '토큰이 만료되었습니다' }
    }

    return { valid: true, payload }
  } catch (error) {
    return { valid: false, error: `토큰 검증 실패: ${error.message}` }
  }
}

// CHANGED: M-1 - 공통 유틸 추가. 모든 function 파일에서 import해서 사용한다.

/**
 * Authorization 헤더에서 Bearer 토큰 추출
 * @param {Request} request
 * @returns {string|null}
 */
export function extractToken(request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  return authHeader.slice(7)
}

/**
 * Airtable filterByFormula 인젝션 방지: 작은따옴표 이스케이프
 * @param {string} value
 * @returns {string}
 */
export function sanitizeForFormula(value) {
  return String(value).replace(/'/g, "''")
}

/**
 * CORS 헤더 생성 (ALLOWED_ORIGIN 환경변수 우선 적용)
 * @param {string} methods - 허용할 HTTP 메서드 목록 ex) 'GET, OPTIONS'
 * @returns {object}
 */
export function buildCorsHeaders(methods) {
  return {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*', // CHANGED: S-2 - env로 CORS 출처 제한
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  }
}
