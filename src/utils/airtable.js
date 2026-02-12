/**
 * Airtable 제출 — Netlify Serverless Function 경유
 *
 * 보안: API 키가 프론트엔드에 노출되지 않음.
 * Netlify 대시보드에서 환경변수를 설정하면 자동으로 동작합니다.
 *
 * Airtable Base에 아래 필드를 생성하세요:
 *   - 캠핑장이름 (Single line text)
 *   - 대표자명 (Single line text)
 *   - 연락처 (Phone number)
 *   - 이메일 (Email)
 *   - 소재권역 (Single select: 경기도, 강원도, 충청도, 경상도, 전라도, 제주도)
 *   - 선택예산 (Single select: 50만원, 30만원, 15만원, 맞춤상담)
 *   - 선택플랜 (Single line text)
 *   - 추가요청 (Long text)
 *   - 신청일시 (Date)
 */

export async function submitApplication(data) {
  const { budget, selectedPlan, formData } = data

  // 로컬 개발 시 데모 모드 (API 엔드포인트가 없을 때)
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log('[Demo Mode] 제출 데이터:', JSON.stringify({ budget, selectedPlan: selectedPlan?.name, formData }, null, 2))
    await new Promise((r) => setTimeout(r, 1200))
    return { success: true, demo: true }
  }

  // 프로덕션: Netlify Serverless Function 호출
  const response = await fetch('/api/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ budget, selectedPlan, formData }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`API Error (${response.status}): ${errorBody}`)
  }

  return await response.json()
}
