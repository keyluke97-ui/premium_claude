// CouponEventCard.jsx - 프리미엄 협찬에 포함된 팔로워 쿠폰 이벤트 조건 카드
// 캠지기 모집 폼의 쿠폰 이벤트 조건만 표시. 분배 진행률·크리에이터별 코드는 다루지 않음.

import { motion } from 'framer-motion'
import { BRAND_GREEN, CARD_BACKGROUND, BORDER_COLOR, TEXT_MUTED } from '../../../constants/designTokens'

/** 숫자를 한국 원화 포맷으로 변환 */
function formatCurrency(value) {
  if (!value && value !== 0) return '-'
  return new Intl.NumberFormat('ko-KR').format(value) + '원'
}

/** 날짜 포맷: YYYY-MM-DD → MM/DD (KST 기준, 파싱 실패 시 원본 반환) */
function formatDate(dateString) {
  if (!dateString) return null
  const parts = dateString.split('-')
  if (parts.length !== 3) return dateString
  const month = parseInt(parts[1], 10)
  const day = parseInt(parts[2], 10)
  if (isNaN(month) || isNaN(day)) return dateString
  return `${month}/${day}`
}

/** 일정 행 — dates 있으면 날짜 범위, 없으면 '매칭일부터 N일', 둘 다 없으면 미렌더 */
function PeriodRow({ label, startDate, endDate, periodDays }) {
  let value
  if (startDate && endDate) {
    value = `${formatDate(startDate)} ~ ${formatDate(endDate)}`
  } else if (periodDays) {
    value = `매칭일부터 ${periodDays}일`
  } else {
    return null
  }
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs" style={{ color: TEXT_MUTED }}>{label}</span>
      <span className="text-xs text-white">{value}</span>
    </div>
  )
}

const cardStyle = {
  backgroundColor: CARD_BACKGROUND,
  border: `1px solid ${BORDER_COLOR}`,
}

const cardMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, delay: 0.15 },
}

export default function CouponEventCard({ couponEvent }) {
  // 비활성: 이벤트 미진행 안내 (쿠폰이벤트희망=false 또는 데이터 없음)
  if (!couponEvent || couponEvent.active !== true) {
    return (
      <motion.div className="rounded-2xl p-5" style={cardStyle} {...cardMotion}>
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
          >
            <span className="text-base opacity-50" aria-hidden="true">🎟️</span>
          </div>
          <h2 className="text-base font-bold" style={{ color: TEXT_MUTED }}>
            팔로워 쿠폰 이벤트
          </h2>
        </div>
        <p className="text-sm" style={{ color: TEXT_MUTED }}>
          이 캠페인은 팔로워 쿠폰 이벤트를 진행하지 않습니다.
        </p>
      </motion.div>
    )
  }

  const {
    discount,
    couponApplyDays,
    couponPerCreator,
    totalFollowerCoupon,
    visitPeriodDays,
    couponPeriodDays,
    visitStartDate,
    visitEndDate,
    couponStartDate,
    couponEndDate,
  } = couponEvent

  const hasSchedule =
    visitStartDate || couponStartDate || visitPeriodDays || couponPeriodDays

  return (
    <motion.div className="rounded-2xl p-5" style={cardStyle} {...cardMotion}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${BRAND_GREEN}15` }}
          >
            <span className="text-base" aria-hidden="true">🎟️</span>
          </div>
          <h2 className="text-base font-bold text-white">팔로워 쿠폰 이벤트</h2>
        </div>
        <span
          className="px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{ backgroundColor: `${BRAND_GREEN}15`, color: BRAND_GREEN }}
        >
          진행 중
        </span>
      </div>

      {/* 혜택 조건 */}
      <div className="divide-y" style={{ borderColor: BORDER_COLOR }}>
        <div className="flex justify-between items-center py-2">
          <span className="text-sm" style={{ color: TEXT_MUTED }}>쿠폰 적용 요일</span>
          <span className="text-sm font-medium text-white">{couponApplyDays || '-'}</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="text-sm" style={{ color: TEXT_MUTED }}>팔로워 혜택</span>
          <span className="text-sm font-medium" style={{ color: BRAND_GREEN }}>
            쿠폰 1건당 {formatCurrency(discount)} 할인
          </span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="text-sm" style={{ color: TEXT_MUTED }}>크리에이터 1명당</span>
          <span className="text-sm font-medium text-white">{couponPerCreator}장</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="text-sm" style={{ color: TEXT_MUTED }}>총 발행 예정 쿠폰</span>
          <span className="text-sm font-medium text-white">{totalFollowerCoupon}장</span>
        </div>
      </div>

      {/* 기회 리프레이밍 — 비용이 아닌 공실 채우기 기회로 표현 */}
      <div className="mt-4 rounded-xl px-4 py-3" style={{ backgroundColor: `${BRAND_GREEN}10` }}>
        <p className="text-sm font-semibold" style={{ color: BRAND_GREEN }}>
          팔로워 신규 예약 유치 — 최대 {totalFollowerCoupon}건
        </p>
        <p className="text-xs mt-1" style={{ color: TEXT_MUTED }}>
          비어있을 수 있던 사이트를 팔로워 예약으로 채웁니다.
        </p>
      </div>

      {/* 일정 — 매칭 전엔 '매칭일부터 N일', 매칭 후엔 날짜 범위 */}
      {hasSchedule && (
        <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${BORDER_COLOR}` }}>
          <p className="text-xs font-medium mb-3" style={{ color: TEXT_MUTED }}>일정</p>
          <div className="space-y-2">
            <PeriodRow
              label="크리에이터 방문 가능"
              startDate={visitStartDate}
              endDate={visitEndDate}
              periodDays={visitPeriodDays}
            />
            <PeriodRow
              label="쿠폰 유효 기간"
              startDate={couponStartDate}
              endDate={couponEndDate}
              periodDays={couponPeriodDays}
            />
          </div>
        </div>
      )}
    </motion.div>
  )
}
