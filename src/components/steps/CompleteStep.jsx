// CompleteStep.jsx - 신청 완료 페이지 (입금 안내 + 신청 요약)
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Copy, CreditCard, Building2, Clock, LayoutDashboard } from 'lucide-react'
import { useState } from 'react'
// CHANGED: 하드코딩된 단가 제거 → packages.js의 calcCrewPriceWithVat로 통일
import { calcCrewPriceWithVat } from '../../data/packages'

// 대시보드 로그인 경로 (동일 도메인 내)
const DASHBOARD_LOGIN_PATH = '/dashboard/login'

function formatPrice(n) {
  return n.toLocaleString('ko-KR') + '원'
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  )
}

export default function CompleteStep({ budget, plan, formData, crew }) {
  const [copied, setCopied] = useState(false)
  // hasCopied: 복사 버튼 최초 클릭 후 true로 전환, 이후 리셋 없음 → 대시보드 링크 노출 트리거
  const [hasCopied, setHasCopied] = useState(false)
  const accountNumber = '225-910068-71204'

  // CHANGED: 하드코딩 단가(PARTNER 100000, RISING 50000) 제거
  // packages.js의 PRICING 기준 calcCrewPriceWithVat 사용으로 단가 불일치 해소
  const computedPrice = (() => {
    if (plan?.priceWithVat) return plan.priceWithVat
    const crewData = crew || plan?.crew || { icon: 0, partner: 0, rising: 0 }
    const priceWithVat = calcCrewPriceWithVat(crewData)
    return priceWithVat > 0 ? priceWithVat : 0
  })()

  const handleCopy = () => {
    const doCopy = () => {
      setCopied(true)
      setHasCopied(true) // CHANGED: 최초 복사 시 대시보드 링크 노출
      setTimeout(() => setCopied(false), 2000)
    }
    // clipboard API 지원 시
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(accountNumber).then(doCopy).catch(() => {
        // fallback: execCommand
        fallbackCopy()
      })
    } else {
      fallbackCopy()
    }
    function fallbackCopy() {
      const textarea = document.createElement('textarea')
      textarea.value = accountNumber
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      try { document.execCommand('copy'); doCopy() } catch {} // eslint-disable-line
      document.body.removeChild(textarea)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10 text-center">
      {/* 성공 아이콘 */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 12,
          delay: 0.1,
        }}
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ backgroundColor: '#01DF82', boxShadow: '0 8px 32px rgba(1,223,130,0.3)' }}
      >
        <Check size={40} color="#000" strokeWidth={3} />
      </motion.div>

      {/* 메시지 */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <h2 className="text-2xl font-extrabold text-white mb-2">
          신청이 완료되었습니다!
        </h2>
        <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
          아래 계좌 입금 후 협찬이 오픈되며, 관련 내용은 하기 적어주신 이메일로 발송됩니다.
        </p>
      </motion.div>

      {/* 결제 안내 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="w-full rounded-2xl p-5 text-left mb-4"
        style={{
          backgroundColor: 'rgba(1,223,130,0.06)',
          border: '1px solid rgba(1,223,130,0.15)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <CreditCard size={16} style={{ color: '#01DF82' }} />
          <span className="text-sm font-bold" style={{ color: '#01DF82' }}>입금 안내</span>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Building2 size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>하나은행</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-white tracking-wide">{accountNumber}</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                backgroundColor: copied ? 'rgba(1,223,130,0.15)' : 'rgba(255,255,255,0.08)',
                color: copied ? '#01DF82' : 'rgba(255,255,255,0.6)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Copy size={12} />
              {copied ? '복사됨!' : '복사'}
            </button>
          </div>
          <div className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            예금주: <span className="text-white font-semibold">(주) 넥스트에디션</span>
          </div>
          {computedPrice > 0 && (
            <div
              className="mt-1 p-3 rounded-lg flex justify-between items-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
            >
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>입금 금액 (VAT 포함)</span>
              <span className="text-base font-bold" style={{ color: '#01DF82' }}>
                {formatPrice(computedPrice)}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Clock size={12} style={{ color: '#FFC107' }} />
          <span className="text-xs" style={{ color: '#FFC107' }}>선수납 방식 — 입금 확인 후 협찬이 진행됩니다</span>
        </div>
      </motion.div>

      {/* 요약 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="w-full rounded-2xl p-5 text-left"
        style={{
          backgroundColor: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="text-sm font-bold text-white mb-4">신청 내용 요약</div>
        <div className="flex flex-col gap-3">
          <SummaryRow label="캠핑장" value={formData.accommodationName} />
          <SummaryRow
            label="예산"
            value={budget === 'custom' || plan?.id === 'custom' ? '맞춤 상담' : `${budget}만원`}
          />
          {plan && <SummaryRow label="선택 플랜" value={plan.name} />}
          <SummaryRow label="대표자" value={formData.representativeName} />
          <SummaryRow label="연락처" value={formData.phone} />
          <SummaryRow label="이메일" value={formData.email} />
          {formData.region && <SummaryRow label="소재 권역" value={formData.region} />}
        </div>
      </motion.div>

      {/* 대시보드 링크 — 계좌 복사 후 노출 */}
      <AnimatePresence>
        {hasCopied && (
          <motion.a
            href={DASHBOARD_LOGIN_PATH}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl mt-4"
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              textDecoration: 'none',
              display: 'flex',
            }}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard size={16} style={{ color: '#01DF82', flexShrink: 0 }} />
              <div className="text-left">
                <div className="text-sm font-semibold text-white">신청 현황 확인하기</div>
                <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  입금 완료 후 대시보드에서 진행 상황을 확인하세요
                </div>
              </div>
            </div>
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>→</span>
          </motion.a>
        )}
      </AnimatePresence>

      {/* 안내 메시지 */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-xs mt-6 leading-relaxed"
        style={{ color: 'rgba(255,255,255,0.35)' }}
      >
        문의사항이 있으시면 카카오톡 채널로 연락주세요
      </motion.p>
    </div>
  )
}
