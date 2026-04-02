// PartnerCreatorList.jsx - 파트너 협찬 매칭 크리에이터 목록 (채널명, 등급, 채널 종류, 입실일, 상태)

import { motion } from 'framer-motion'
import { BRAND_GREEN, CARD_BACKGROUND, BORDER_COLOR, TEXT_MUTED } from '../../../constants/designTokens'

// 등급 배지 색상 (프리미엄 CreatorList와 동일 매핑)
const GRADE_BADGE_COLORS = {
  3: { background: '#FFD70020', color: '#FFD700' },
  2: { background: `${BRAND_GREEN}20`, color: BRAND_GREEN },
  1: { background: '#FF6B0025', color: '#FF8C00' },
}

// 신청 상태 색상
const STATUS_COLORS = {
  '신청완료': { background: 'rgba(255,140,0,0.12)', text: '#FF8C00' },
  '확정': { background: `${BRAND_GREEN}15`, text: BRAND_GREEN },
  '취소': { background: 'rgba(255,107,107,0.12)', text: '#FF6B6B' },
}

// 채널 종류 라벨
const CHANNEL_TYPE_LABELS = {
  '인스타': '📸 인스타',
  '유튜브': '▶️ 유튜브',
}

/** 날짜 포맷: YYYY-MM-DD → MM/DD(요일), 없으면 null */
function formatDate(dateString) {
  if (!dateString) return null
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    const dayNames = ['일', '월', '화', '수', '목', '금', '토']
    const month = date.getMonth() + 1
    const day = date.getDate()
    const dayOfWeek = dayNames[date.getDay()]
    return `${month}/${day}(${dayOfWeek})`
  } catch {
    return dateString
  }
}

/** 단일 크리에이터 카드 */
function PartnerCreatorCard({ creator, index }) {
  const badgeColor = GRADE_BADGE_COLORS[creator.grade] || { background: 'rgba(255,255,255,0.08)', color: TEXT_MUTED }
  const statusColor = STATUS_COLORS[creator.status] || STATUS_COLORS['신청완료']
  const channelLabel = CHANNEL_TYPE_LABELS[creator.channelType] || creator.channelType || ''

  return (
    <motion.div
      className="rounded-xl p-4"
      style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        border: `1px solid ${BORDER_COLOR}`,
      }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
    >
      {/* 상단: 채널명 + 등급 뱃지 */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-white truncate block">
            {creator.channelName}
          </span>
          {channelLabel && (
            <span className="text-xs mt-0.5 block" style={{ color: TEXT_MUTED }}>
              {channelLabel}
            </span>
          )}
        </div>

        <span
          className="px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap ml-2"
          style={{
            backgroundColor: badgeColor.background,
            color: badgeColor.color,
          }}
        >
          {creator.gradeEmoji} {creator.gradeLabel}
        </span>
      </div>

      {/* 하단: 상태 + 입실일 + 사이트 */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <span className="text-xs block mb-0.5" style={{ color: TEXT_MUTED }}>상태</span>
          <span
            className="text-xs font-medium"
            style={{ color: statusColor.text }}
          >
            {creator.status}
          </span>
        </div>
        <div>
          <span className="text-xs block mb-0.5" style={{ color: TEXT_MUTED }}>체크인</span>
          {creator.checkInDate ? (
            <span className="text-xs text-white">{formatDate(creator.checkInDate)}</span>
          ) : (
            <span className="text-xs" style={{ color: '#FF8C00' }}>조율 중</span>
          )}
        </div>
        <div>
          <span className="text-xs block mb-0.5" style={{ color: TEXT_MUTED }}>사이트</span>
          {creator.checkInSite ? (
            <span className="text-xs text-white">{creator.checkInSite}</span>
          ) : (
            <span className="text-xs" style={{ color: '#FF8C00' }}>조율 중</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function PartnerCreatorList({ creators }) {
  // 확정/신청완료만 표시 (취소는 API에서 이미 필터됨, 방어적 코딩)
  const visibleCreators = (creators || []).filter(creator => creator.status !== '취소')
  const confirmedCount = visibleCreators.filter(creator => creator.status === '확정').length

  if (visibleCreators.length === 0) {
    return (
      <motion.div
        className="rounded-2xl p-5"
        style={{
          backgroundColor: CARD_BACKGROUND,
          border: `1px solid ${BORDER_COLOR}`,
        }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${BRAND_GREEN}15` }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M12 7a4 4 0 1 0-8 0 4 4 0 0 0 8 0zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
                stroke={BRAND_GREEN}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="text-base font-bold text-white">매칭 크리에이터</h2>
        </div>

        <div className="text-center py-8">
          <p className="text-sm" style={{ color: TEXT_MUTED }}>
            아직 매칭된 크리에이터가 없습니다.
          </p>
          <p className="text-xs mt-1" style={{ color: TEXT_MUTED }}>
            크리에이터가 신청하면 이곳에 표시됩니다.
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="rounded-2xl p-5"
      style={{
        backgroundColor: CARD_BACKGROUND,
        border: `1px solid ${BORDER_COLOR}`,
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
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
                d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M12 7a4 4 0 1 0-8 0 4 4 0 0 0 8 0zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
                stroke={BRAND_GREEN}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="text-base font-bold text-white">매칭 크리에이터</h2>
        </div>

        <div className="flex items-center gap-2">
          {confirmedCount > 0 && (
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ backgroundColor: `${BRAND_GREEN}15`, color: BRAND_GREEN }}
            >
              확정 {confirmedCount}명
            </span>
          )}
          <span
            className="text-xs font-medium px-3 py-1 rounded-full"
            style={{
              backgroundColor: 'rgba(255,255,255,0.06)',
              color: TEXT_MUTED,
            }}
          >
            전체 {visibleCreators.length}명
          </span>
        </div>
      </div>

      {/* 크리에이터 카드 목록 */}
      <div className="space-y-3">
        {visibleCreators.map((creator, index) => (
          <PartnerCreatorCard
            key={creator.applicationId || index}
            creator={creator}
            index={index}
          />
        ))}
      </div>
    </motion.div>
  )
}
