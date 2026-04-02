// PartnerActionButtons.jsx - 파트너 협찬 대시보드 하단 액션 버튼 (변경/취소 → 카카오톡 유도)

import { motion } from 'framer-motion'
import { BRAND_GREEN, TEXT_MUTED } from '../../../constants/designTokens'

const KAKAO_LINK = 'http://pf.kakao.com/_fBxaQG/chat'

export default function PartnerActionButtons() {
  return (
    <motion.div
      className="space-y-3 mt-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      {/* 변경/취소 요청 → 카카오톡 */}
      <a
        href={KAKAO_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full py-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 min-h-[48px]"
        style={{ backgroundColor: '#FEE500', color: '#191919' }}
        aria-label="카카오톡 채널에서 변경/취소 문의하기 (새 창)"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M9 1.5C4.86 1.5 1.5 4.136 1.5 7.385c0 2.072 1.364 3.895 3.43 4.95l-.88 3.28a.188.188 0 0 0 .274.204L8.4 13.22a9.4 9.4 0 0 0 .6.038c4.14 0 7.5-2.636 7.5-5.885C16.5 4.137 13.14 1.5 9 1.5z"
            fill="#191919"
          />
        </svg>
        변경/취소 문의하기
      </a>

      {/* 하단 안내 */}
      <p className="text-center text-xs pt-2" style={{ color: TEXT_MUTED }}>
        캠페인 변경 및 취소는{' '}
        <a
          href={KAKAO_LINK}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: BRAND_GREEN }}
        >
          카카오톡 채널
        </a>
        을 통해 요청해주세요
      </p>
    </motion.div>
  )
}
