// reportApi.js - 모집 리포트 API 클라이언트 (인증 없음, 링크 노출 기반 게이팅)

export async function fetchReport(threshold = 0) {
  const response = await fetch(`/api/dashboard/report?threshold=${threshold}`, {
    method: 'GET',
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || '리포트를 불러오지 못했습니다.')
  }
  return data
}
