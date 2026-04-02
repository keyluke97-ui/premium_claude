// PartnerStatusCard.jsx - 파트너 협찬 캠페인 상태 카드 (패키지 정보 + 할인금액 + 모집 상태 + 방문/쿠폰 일정)

import { motion } from 'framer-motion'
import { BRAND_GREEN, CARD_BACKGROUND, BORDER_COLOR, TEXT_MUTED } from '../../../constants/designTokens'

// 모집 상태별 색상
const STATUS_COLORS = {
  '오픈전': { background: 'rgba(255,140,0,0.12)', text: '#FF8C00' },
  '모집중': { background: `${BRAND_GREEN}15`, text: BRAND_GREEN },
  '마감': { background: 'rgba(255,255,255,0.06)', text: TEXT_MUTED },
}

/** 숫자를 한국 원화 포맷으로 변환 */
function formatCurrency(value) {
  if (!value && value !== 0) return '-'
  return new Intl.NumberFormat('ko-KR').format(value) + '원'
}

/** 날짜 포맷 (YYYY-MM-DD → MM/DD) */
function formatDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}/${day}`
}

/** 단일 정보 행 */
function InfoRow({ label, value, highlight = false }) {
  return (
    <div className="flex justify-between items-center py-2">
      <span className="text-sm" style={{ color: TEXT_MUTED }}>{label}</span>
      <span
        className="text-sm font-medium"
        style={{ color: highlight ? BRAND_GREEN : '#FFFFFF' }}
      >
        {value || '-'}
      </span>
    </div>
  )
}

/** 모집 상태 배지 */
function RecruitmentStatusBadge({ status }) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS['오픈전']
  return (
    <span
      className="px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: colors.background, color: colors.text }}
    >
      {status}
    </span>
  )
}

/** 일정 정보 블록 */
function ScheduleBlock({ label, startDate, endDate }) {
  if (!startDate && !endDate) return null
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs" style={{ color: TEXT_MUTED }}>{label}</span>
      <span className="text-xs text-white">
        {formatDate(startDate)} ~ {formatDate(endDate)}
      </span>
    </div>
  )
}

export default function PartnerStatusCard({ campaign }) {
  if (!campaign) return null

  const {
    accommodationName,
    packageType,
    weekdayDiscount,
    weekendDiscount,
    accommodationType,
    recruitmentStatus,
    iconRequested,
    partnerRequested,
    risingRequested,
    visitStartDate,
    visitEndDate,
    couponStartDate,
    couponEndDate,
    holidayCoupon,
    introduction,
    contact,
  } = campaign

  const totalRequested = iconRequested + partnerRequested + risingRequested

  return (
    <motion.div
      className="rounded-2xl p-5"
      style={{
        backgroundColor: CARD_BACKGROUND,
        border: `1px solid ${BORDER_COLOR}`,
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* 카드 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${BRAND_GREEN}15` }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                stroke={BRAND_GREEN}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="text-base font-bold text-white">캠페인 정보</h2>
        </div>
        <RecruitmentStatusBadge status={recruitmentStatus} />
      </div>

      {/* 캠핑장 이름 강조 */}
      <div
        className="rounded-xl px-4 py-3 mb-4"
        style={{ backgroundColor: `${BRAND_GREEN}10` }}
      >
        <p className="text-xs mb-1" style={{ color: TEXT_MUTED }}>캠핑장</p>
        <p className="text-base font-bold" style={{ color: BRAND_GREEN }}>
          {accommodationName}
        </p>
      </div>

      {/* 기본 정보 */}
      <div className="divide-y" style={{ borderColor: BORDER_COLOR }}>
        <InfoRow label="패키지 유형" value={packageType} />
        <InfoRow label="숙박 타입" value={accommodationType} />
        <InfoRow label="연락처" value={contact} />
      </div>

      {/* 할인 금액 */}
      <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${BORDER_COLOR}` }}>
        <p className="text-xs font-medium mb-3" style={{ color: TEXT_MUTED }}>
          크리에이터 할인 금액
        </p>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-white">평일 할인</span>
            <span className="text-sm font-medium" style={{ color: BRAND_GREEN }}>
              {formatCurrency(weekdayDiscount)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-white">주말 할인</span>
            <span className="text-sm font-medium" style={{ color: BRAND_GREEN }}>
              {formatCurrency(weekendDiscount)}
            </span>
          </div>
        </div>
      </div>

      {/* 모집 인원 */}
      {totalRequested > 0 && (
        <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${BORDER_COLOR}` }}>
          <p className="text-xs font-medium mb-3" style={{ color: TEXT_MUTED }}>
            모집 희망 인원
          </p>
          <div className="space-y-2">
            {iconRequested > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-white">⭐️ 아이콘 {iconRequested}명</span>
              </div>
            )}
            {partnerRequested > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-white">✔️ 파트너 {partnerRequested}명</span>
              </div>
            )}
            {risingRequested > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-white">🔥 라이징 {risingRequested}명</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 일정 정보 */}
      {(visitStartDate || couponStartDate) && (
        <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${BORDER_COLOR}` }}>
          <p className="text-xs font-medium mb-3" style={{ color: TEXT_MUTED }}>
            일정
          </p>
          <div className="space-y-2">
            <ScheduleBlock
              label="방문 가능 기간"
              startDate={visitStartDate}
              endDate={visitEndDate}
            />
            <ScheduleBlock
              label="쿠폰 유효 기간"
              startDate={couponStartDate}
              endDate={couponEndDate}
            />
            {holidayCoupon && (
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: TEXT_MUTED }}>공휴일 쿠폰</span>
                <span className="text-xs" style={{ color: BRAND_GREEN }}>적용</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 숙소 소개 (있을 때만) */}
      {introduction && (
        <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${BORDER_COLOR}` }}>
          <p className="text-xs font-medium mb-2" style={{ color: TEXT_MUTED }}>숙소 소개</p>
          <p className="text-sm text-white leading-relaxed whitespace-pre-line">{introduction}</p>
        </div>
      )}
    </motion.div>
  )
}
