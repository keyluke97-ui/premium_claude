// dashboard-report.js - 모집 부진 캠핑장 진단 리포트
// 3대 진단 축: 가격 경쟁력 / 매력 점수 / 시간(노출 일수·콘텐츠 기한)
// 추세: 신청 후 경과일 버킷별 평균 모집률 (모든 레코드 기준)
// 인증 없음 — 링크 노출 기반 게이팅. 검색엔진 노출 방지 권장.
//
// Query:
//   ?threshold=0      모집률 0%만 (기본값)
//   ?threshold=0.3    모집률 30% 미만
//   ?threshold=0.5    모집률 50% 미만
//   ?threshold=0.8    모집률 80% 미만

import { buildCorsHeaders } from './jwt-utils.js'

const CORS_HEADERS = buildCorsHeaders('GET, OPTIONS')
const FORM_TABLE_DEFAULT = '캠지기 모집 폼'

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: CORS_HEADERS })
}

/** Airtable 페이징 fetch — 전체 레코드 수집 */
async function fetchAllRecords(baseId, tableId, apiKey) {
  let all = []
  let offset = null
  do {
    const url =
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableId)}` +
      `?pageSize=100${offset ? `&offset=${encodeURIComponent(offset)}` : ''}`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } })
    if (!res.ok) throw new Error(`Airtable 응답 오류 (${res.status})`)
    const json = await res.json()
    all = all.concat(json.records || [])
    offset = json.offset
  } while (offset)
  return all
}

function textLength(value) {
  if (!value || typeof value !== 'string') return 0
  return [...value].length
}

function multiCount(value) {
  return Array.isArray(value) ? value.length : 0
}

function calcRequested(f) {
  return f['총 모집 인원'] || 0
}

function calcAssigned(f) {
  return f['총 신청 인원'] || 0
}

/** 등급별 평균 단가 계산 (해당 등급 모집 인원 > 0인 레코드의 단가 평균) */
function gradeAvgPrice(records, gradeKey) {
  const fieldMap = {
    icon: { req: '⭐️ 모집 희망 인원', price: '아이콘 크리에이터 협찬 제안 금액' },
    partner: { req: '✔️ 모집 인원', price: '파트너 크리에이터 협찬 제안 금액' },
    rising: { req: '🔥 모집 인원', price: '라이징 협찬 제안 금액' },
  }
  const { req, price } = fieldMap[gradeKey]
  const prices = records
    .map((r) => ({ req: r.fields[req] || 0, p: r.fields[price] || 0 }))
    .filter((x) => x.req > 0 && x.p > 0)
    .map((x) => x.p)
  if (prices.length === 0) return 0
  return Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
}

/** 특장점 텍스트 평균 길이 */
function attractionTextAvg(records) {
  const lengths = records.map((r) => textLength(r.fields['숙소의 특장점']))
  return lengths.length > 0
    ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length)
    : 0
}

/** 지역별 평균 모집률 (모집 인원 > 0인 레코드 기준, 0~1) */
function regionAvgRecruitRates(records) {
  const byRegion = new Map()
  for (const r of records) {
    const req = calcRequested(r.fields)
    if (req <= 0) continue
    const region = r.fields['숙소 위치'] || '(미입력)'
    const rate = (calcAssigned(r.fields) || 0) / req
    if (!byRegion.has(region)) byRegion.set(region, [])
    byRegion.get(region).push(rate)
  }
  const result = {}
  for (const [region, arr] of byRegion) {
    result[region] = arr.reduce((a, b) => a + b, 0) / arr.length
  }
  return result
}

/** 한 캠핑장 레코드 → 진단 객체 */
function buildDiagnostic(record, avgPrices, avgFeatureLength, regionAvgs) {
  const f = record.fields
  const created = f['Created']
  const deadline = f['⏰ 콘텐츠 제작 기한']
  const now = Date.now()
  const ONE_DAY = 1000 * 60 * 60 * 24

  const daysSinceCreated = created
    ? Math.floor((now - new Date(created).getTime()) / ONE_DAY)
    : null
  const daysUntilDeadline = deadline
    ? Math.floor((new Date(deadline).getTime() - now) / ONE_DAY)
    : null

  // 1) 가격 진단
  const price = {
    icon: {
      mine: f['아이콘 크리에이터 협찬 제안 금액'] || 0,
      requested: f['⭐️ 모집 희망 인원'] || 0,
      avg: avgPrices.icon,
    },
    partner: {
      mine: f['파트너 크리에이터 협찬 제안 금액'] || 0,
      requested: f['✔️ 모집 인원'] || 0,
      avg: avgPrices.partner,
    },
    rising: {
      mine: f['라이징 협찬 제안 금액'] || 0,
      requested: f['🔥 모집 인원'] || 0,
      avg: avgPrices.rising,
    },
  }
  for (const k of ['icon', 'partner', 'rising']) {
    const d = price[k]
    d.deltaPct = d.avg > 0 ? Math.round(((d.mine - d.avg) / d.avg) * 100) : 0
    d.isBelow = d.requested > 0 && d.mine > 0 && d.mine < d.avg
  }
  price.anyBelow = price.icon.isBelow || price.partner.isBelow || price.rising.isBelow

  // 2) 매력 진단 (6 체크포인트 = 100점)
  const featureLength = textLength(f['숙소의 특장점'])
  const hasPhoto = multiCount(f['숙소 전경 (30mb 이하)']) > 0
  const hasLink = !!f['숙소 링크 (캠핏 내 상세페이지만 삽입 가능)']
  const facilityCount = multiCount(f['부대시설'])
  const viewpointCount = multiCount(f['뷰/포인트 요소'])
  const siteTypeCount = multiCount(f['제공 가능한 사이트 종류'])

  const checks = {
    featureOk: featureLength >= Math.max(100, avgFeatureLength * 0.8),
    photoOk: hasPhoto,
    linkOk: hasLink,
    facilityOk: facilityCount >= 3,
    viewpointOk: viewpointCount >= 2,
    siteTypeOk: siteTypeCount >= 2,
  }
  const passed = Object.values(checks).filter(Boolean).length
  const attractionScore = Math.round((passed / 6) * 100)

  const attraction = {
    featureLength,
    avgFeatureLength,
    hasPhoto,
    hasLink,
    facilityCount,
    viewpointCount,
    siteTypeCount,
    checks,
    score: attractionScore,
  }

  // 3) 지역 비교
  const region = f['숙소 위치'] || '(미입력)'
  const regionAvg = regionAvgs[region] || 0

  // 권장 액션
  const recommendations = []
  if (price.anyBelow) {
    const below = []
    if (price.icon.isBelow)
      below.push(`아이콘 ${price.icon.mine.toLocaleString()}원 (평균 ${price.icon.avg.toLocaleString()}원)`)
    if (price.partner.isBelow)
      below.push(`파트너 ${price.partner.mine.toLocaleString()}원 (평균 ${price.partner.avg.toLocaleString()}원)`)
    if (price.rising.isBelow)
      below.push(`라이징 ${price.rising.mine.toLocaleString()}원 (평균 ${price.rising.avg.toLocaleString()}원)`)
    recommendations.push({
      severity: 'high',
      label: '단가 인상 제안',
      detail: `평균 미만: ${below.join(' · ')}`,
    })
  }
  if (!checks.featureOk) {
    recommendations.push({
      severity: featureLength < 50 ? 'high' : 'medium',
      label: '특장점 보강 요청',
      detail: `현재 ${featureLength}자 (전체 평균 ${avgFeatureLength}자)`,
    })
  }
  if (!hasPhoto) {
    recommendations.push({ severity: 'high', label: '숙소 전경 사진 업로드 요청' })
  }
  if (!hasLink) {
    recommendations.push({ severity: 'medium', label: '캠핏 상세페이지 링크 누락' })
  }
  if (daysSinceCreated !== null && daysSinceCreated >= 14) {
    recommendations.push({
      severity: 'high',
      label: `신청 후 ${daysSinceCreated}일 경과, 매칭 0건`,
      detail: f['입금내역 확인']
        ? '입금완료 — CS 카톡 발송 / 노출 보강 검토'
        : '미입금 상태 — 환불 안내 적합',
    })
  }
  if (daysUntilDeadline !== null && daysUntilDeadline >= 0 && daysUntilDeadline < 14) {
    recommendations.push({
      severity: 'medium',
      label: `콘텐츠 기한 ${daysUntilDeadline}일 남음`,
      detail: '크리에이터 회피 가능성',
    })
  }
  if (regionAvg > 0 && regionAvg >= 0.5) {
    recommendations.push({
      severity: 'low',
      label: `같은 지역 평균 ${Math.round(regionAvg * 100)}% — 매력 보강이 효과적`,
    })
  }

  return {
    recordId: record.id,
    name: f['숙소 이름을 적어주세요.'] || '(이름 없음)',
    region,
    plan: f['선택플랜'] || null,
    budget: f['선택 예산'] || null,
    requested: calcRequested(f),
    assigned: calcAssigned(f),
    paymentConfirmed: f['입금내역 확인'] === true,
    balance: f['실입금 필요 금액'] || 0,
    notes: f['비고'] || '',
    isDiscounted: f['첫신청할인'] === true,

    createdAt: created || null,
    deadline: deadline || null,
    daysSinceCreated,
    daysUntilDeadline,

    price,
    attraction,
    regionAvgRecruitRate: regionAvg,

    recommendations,
  }
}

/** 신청 후 경과일 → 버킷 라벨 */
const TREND_BUCKETS = [
  { key: '0-7', label: '0–7일', min: 0, max: 7 },
  { key: '8-14', label: '8–14일', min: 8, max: 14 },
  { key: '15-30', label: '15–30일', min: 15, max: 30 },
  { key: '31-60', label: '31–60일', min: 31, max: 60 },
  { key: '60+', label: '60일 이상', min: 61, max: Infinity },
]

function bucketOfDays(days) {
  if (days == null || days < 0) return null
  return TREND_BUCKETS.find((b) => days >= b.min && days <= b.max) || null
}

/** 전체 레코드 기준 — 경과일 버킷별 평균 모집률 */
function computeTrend(records) {
  const buckets = TREND_BUCKETS.map((b) => ({ key: b.key, label: b.label, n: 0, rateSum: 0 }))
  const ONE_DAY = 1000 * 60 * 60 * 24
  const now = Date.now()

  for (const r of records) {
    const req = calcRequested(r.fields)
    if (req <= 0 || !r.fields['Created']) continue
    const days = Math.floor((now - new Date(r.fields['Created']).getTime()) / ONE_DAY)
    const bucket = bucketOfDays(days)
    if (!bucket) continue
    const target = buckets.find((b) => b.key === bucket.key)
    target.n += 1
    target.rateSum += Math.min(1, calcAssigned(r.fields) / req)
  }

  return buckets.map((b) => ({
    bucket: b.label,
    n: b.n,
    avgRate: b.n > 0 ? b.rateSum / b.n : 0,
  }))
}

/** threshold 쿼리 파싱 — 안전한 값으로 클램프 */
function parseThreshold(raw) {
  const allowed = [0, 0.3, 0.5, 0.8]
  const v = parseFloat(raw)
  if (Number.isNaN(v)) return 0
  return allowed.includes(v) ? v : 0
}

export default async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('', { status: 200, headers: CORS_HEADERS })
  }
  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const API_KEY = process.env.AIRTABLE_API_KEY
  const BASE_ID = process.env.AIRTABLE_BASE_ID
  const FORM_TABLE = process.env.AIRTABLE_TABLE_ID || FORM_TABLE_DEFAULT

  if (!API_KEY || !BASE_ID) {
    return jsonResponse({ error: '서버 환경변수가 설정되지 않았습니다.' }, 500)
  }

  const url = new URL(request.url)
  const threshold = parseThreshold(url.searchParams.get('threshold'))

  try {
    const records = await fetchAllRecords(BASE_ID, FORM_TABLE, API_KEY)

    const avgPrices = {
      icon: gradeAvgPrice(records, 'icon'),
      partner: gradeAvgPrice(records, 'partner'),
      rising: gradeAvgPrice(records, 'rising'),
    }
    const avgFeatureLength = attractionTextAvg(records)
    const regionAvgs = regionAvgRecruitRates(records)
    const trend = computeTrend(records)

    // 모집률 임계값 필터:
    //   threshold === 0  → 0%만 (assigned === 0)
    //   threshold > 0   → rate < threshold (모집 인원 > 0인 레코드 중)
    const filtered = records
      .filter((r) => {
        const req = calcRequested(r.fields)
        if (req <= 0) return false
        const assigned = calcAssigned(r.fields)
        if (threshold === 0) return assigned === 0
        return assigned / req < threshold
      })
      .map((r) => buildDiagnostic(r, avgPrices, avgFeatureLength, regionAvgs))
      .sort((a, b) => (b.daysSinceCreated || 0) - (a.daysSinceCreated || 0))

    return jsonResponse({
      success: true,
      totalCampsites: records.length,
      filteredCount: filtered.length,
      threshold,
      averages: {
        prices: avgPrices,
        featureLength: avgFeatureLength,
      },
      trend,
      campsites: filtered,
    })
  } catch (error) {
    return jsonResponse({ error: error.message }, 500)
  }
}

export const config = {
  path: '/api/dashboard/report',
}
