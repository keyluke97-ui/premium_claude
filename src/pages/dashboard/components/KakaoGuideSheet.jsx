// KakaoGuideSheet.jsx - 인원 변경 요청 시 카카오톡 채널 상담 안내 바텀시트

import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BRAND_GREEN,
  CARD_BACKGROUND,
  BORDER_COLOR,
  TEXT_MUTED,
  OVERLAY_COLOR,
} from '../../../constants/designTokens'

const KAKAO_LINK = 'http://pf.kakao.com/_fBxaQG/chat'

const GUIDE_CONTENT = {
  modify: {
    title: '인원 변경 요청',
    description:
      '인원 변경은 담당자와 카카오톡 상담을 통해 처리됩니다.\n아래 버튼을 눌러 상담을 시작해주세요.',
    buttonLabel: '카카오톡으로 인원 변경 상담',
    buildMessage: (accommodationName) =>
      `[인원 변경 요청]\n캠핑장명: ${accommodationName}\n\n변경 희망 사항을 알려주세요.`,
  },
}

/** 카카오톡 상담 안내 바텀시트 */
export default function KakaoGuideSheet({ type, accommodationName, onClose }) {
  const guide = GUIDE_CONTENT[type]
  const [copied, setCopied] = useState(false)

  const handleCopyAndOpen = useCallback(async () => {
    if (!guide) return

    const message = guide.buildMessage(accommodationName)
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
    } catch {
      // 클립보드 접근 실패 시에도 카카오톡 오픈
    }
    window.open(KAKAO_LINK, '_blank', 'noopener,noreferrer')
  }, [guide, accommodationName])

  if (!guide) return null

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: OVERLAY_COLOR }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full rounded-t-2xl"
        style={{
          maxWidth: 448,
          maxHeight: '88vh',
          backgroundColor: CARD_BACKGROUND,
          border: `1px solid ${BORDER_COLOR}`,
          borderBottom: 'none',
          overflowY: 'auto',
        }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(event) => event.stopPropagation()}
      >
        {/* 드래그 핸들 */}
        <div className="flex justify-center pt-4 pb-1">
          <div
            className="w-10 h-1 rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
          />
        </div>

        <div className="px-6 pb-8">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-5 mt-2">
            <h3 className="text-base font-bold text-white">{guide.title}</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke={TEXT_MUTED}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {/* 안내 문구 */}
          <div
            className="rounded-xl p-4 mb-5"
            style={{
              backgroundColor: 'rgba(1,223,130,0.06)',
              border: '1px solid rgba(1,223,130,0.15)',
            }}
          >
            <p
              className="text-sm leading-relaxed whitespace-pre-line"
              style={{ color: 'rgba(255,255,255,0.7)' }}
            >
              {guide.description}
            </p>
          </div>

          {/* 캠핑장명 표시 */}
          <div
            className="rounded-xl p-4 mb-5"
            style={{
              backgroundColor: 'rgba(255,255,255,0.02)',
              border: `1px solid ${BORDER_COLOR}`,
            }}
          >
            <p className="text-xs mb-1" style={{ color: TEXT_MUTED }}>
              캠핑장명
            </p>
            <p className="text-sm font-medium text-white">{accommodationName}</p>
          </div>

          {/* 카카오톡 상담 버튼 */}
          <button
            onClick={handleCopyAndOpen}
            className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
            style={{ backgroundColor: '#FEE500', color: '#191600' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <ellipse cx="12" cy="10.5" rx="10" ry="8" fill="#191600" />
              <path
                d="M8 10c0-2.21 1.79-4 4-4s4 1.79 4 4c0 1.5-.82 2.8-2.04 3.5l.54 2L11.5 14H11c-1.66 0-3-1.34-3-3z"
                fill="#FEE500"
              />
            </svg>
            {copied ? '내용 복사됨 — 카카오톡에 붙여넣기' : guide.buttonLabel}
          </button>

          {copied && (
            <p
              className="text-xs text-center mt-2"
              style={{ color: BRAND_GREEN }}
            >
              ✓ 상담 내용이 클립보드에 복사되었습니다
            </p>
          )}

          {/* 하단 안내 */}
          <p className="text-xs text-center mt-4" style={{ color: TEXT_MUTED }}>
            상담 시간: 평일 10:00 ~ 18:00
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
