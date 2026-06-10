// firstTimeCheck.js - 사업자번호로 재신청 여부 조회 (PackageStep, InfoStep 공용)
// 반환 isReturning: true = 기존 신청 이력 있는 재신청자(할인 대상)

export async function checkFirstTime(businessNumber) {
  const clean = (businessNumber || '').replace(/[^0-9]/g, '')
  if (!/^\d{10}$/.test(clean)) {
    return { error: '올바른 사업자 번호를 입력해주세요 (예: 123-45-67890)' }
  }
  try {
    const res = await fetch('/api/check-first-time', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessNumber }),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.error || '조회 중 오류가 발생했습니다.' }
    return { isReturning: data.isReturning }
  } catch {
    return { error: '네트워크 오류가 발생했습니다. 다시 시도해주세요.' }
  }
}
