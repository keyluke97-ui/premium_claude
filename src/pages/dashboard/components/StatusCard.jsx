// StatusCard.jsx - 프리미엄 협찬 신청 상태 카드 (신청 정보 + 결제 요약)

import { motion } from 'framer-motion'
// CHANGED: Item 4 - 인라인 토큰 제거, 공통 designTokens에서 import
import { BRAND_GREEN, CARD_BACKGROUND, BORDER_COLOR, TEXT_MUTED } from '../../../constants/designTokens'

/** 숫자를 한국 원화 포맷으로 변환 */
function formatCurrency(value) {
  if (!value && value !== 0) return '-'
  return new Intl.NumberFormat('ko-KR').format(value) + '원'
}

/** VAT 포함 총액 계산 */
function calculateTotal(crew) {
  const subtotal =
    (crew.icon.requested * crew.icon.unitPrice) +
    (crew.partner.requested * crew.partner.unitPrice) +
    (crew.rising.requested * crew.rising.unitPrice)
  return Math.round(subtotal * 1.1)
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

export default function StatusCard({ application }) {
  if (!application) return null

  const { accommodationName, selectedPlan, region, crew, representativeName, phone } = application
  const totalAmount = calculateTotal(crew)

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
      <div className="flex items-center gap-2 mb-4">
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
        <h2 className="text-base font-bold text-white">신청 정보</h2>
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

      {/* 상세 정보 */}
      <div
        className="divide-y"
        style={{ borderColor: BORDER_COLOR }}
      >
        <InfoRow label="선택 플랜" value={selectedPlan} />
        <InfoRow label="지역" value={region} />
        <InfoRow label="대표자명" value={representativeName} />
        <InfoRow label="연락처" value={phone} />
      </div>

      {/* 모집 인원 + 금액 요약 */}
      <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${BORDER_COLOR}` }}>
        <p className="text-xs font-medium mb-3" style={{ color: TEXT_MUTED }}>
          모집 인원 / 금액
        </p>
        <div className="space-y-2">
          {crew.icon.requested > 0 && (
            <CrewRow
              emoji="⭐️"
              label="아이콘"
              count={crew.icon.requested}
              unitPrice={crew.icon.unitPrice}
            />
          )}
          {crew.partner.requested > 0 && (
            <CrewRow
              emoji="✔️"
              label="파트너"
              count={crew.partner.requested}
              unitPrice={crew.partner.unitPrice}
            />
          )}
          {crew.rising.requested > 0 && (
            <CrewRow
              emoji="🔥"
              label="라이징"
              count={crew.rising.requested}
              unitPrice={crew.rising.unitPrice}
            />
          )}
        </div>

        {/* 총 결제 금액 */}
        <div
          className="flex justify-between items-center mt-3 pt-3"
          style={{ borderTop: `1px solid ${BORDER_COLOR}` }}
        >
          <span className="text-sm font-medium text-white">총 결제 금액 (VAT 포함)</span>
          <span className="text-base font-bold" style={{ color: BRAND_GREEN }}>
            {formatCurrency(totalAmount)}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

/** 등급별 모집 인원 행 */
function CrewRow({ emoji, label, count, unitPrice }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-white">
        {emoji} {label} {count}명
      </span>
      <span className="text-sm" style={{ color: TEXT_MUTED }}>
        {formatCurrency(unitPrice)} × {count}
      </span>
    </div>
  )
}
