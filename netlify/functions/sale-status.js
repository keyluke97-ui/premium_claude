// sale-status.js - 동계맞이 할인이 지금 켜져 있는지 화면에 알려준다
//
// CHANGED: AUTUMN_SALE 스위치는 서버(price-tier.js)에서만 읽혀서, off 로 내려도
//   PackageStep 의 "할인 진행 중" 안내가 그대로 남았다(청구는 기본가인데 화면은 할인 안내).
//   화면용 VITE_ 변수를 따로 두면 두 값이 또 갈리므로, 같은 환경변수·같은 isSaleOn() 을 쓰는 이 엔드포인트로 노출한다.

import { buildCorsHeaders } from './jwt-utils.js'
import { isSaleOn } from '../../src/constants/pricing.js'

const CORS_HEADERS = buildCorsHeaders('GET, OPTIONS')

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('', { status: 200, headers: CORS_HEADERS })
  }
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: CORS_HEADERS })
  }
  return new Response(
    JSON.stringify({ saleOn: isSaleOn(process.env.AUTUMN_SALE) }),
    { status: 200, headers: CORS_HEADERS }
  )
}

export const config = {
  path: '/api/sale-status',
}
