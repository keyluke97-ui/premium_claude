import { motion } from 'framer-motion'
import { Check, Copy, CreditCard, Building2, Clock, LayoutDashboard, CalendarClock } from 'lucide-react'
import { useState } from 'react'

// 대시보드 로그인 경로 (동일 도메인 내)
const DASHBOARD_LOGIN_PATH = '/dashboard/login'

function formatPrice(n) {
  return n.toLocaleString('ko-KR') + '원'
}

// 클립보드 복사 헬퍼 — clipboard API 실패 시 execCommand로 fallback
function copyToClipboard(text, onSuccess) {
  const fallback = () => {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    try { document.execCommand('copy'); onSuccess() } catch {} // eslint-disable-line
    document.body.removeChild(ta)
  }
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(onSuccess).catch(fallback)
  } else {
    fallback()
  }
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  )
}

// 앞으로 일정 타임라인 스텝
function TimelineItem({ step, title, detail, highlight = false }) {
  return (
    <li className="flex gap-3">
      <div
        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
        style={{
          backgroundColor: highlight ? 'rgba(1,223,130,0.15)' : 'rgba(255,255,255,0.06)',
          color: highlight ? '#01DF82' : 'rgba(255,255,255,0.5)',
        }}
      >
        {step}
      </div>
      <div className="flex-1 pt-0.5">
        <div
          className="text-sm font-semibold"
          style={{ color: highlight ? '#fff' : 'rgba(255,255,255,0.85)' }}
        >
          {title}
        </div>
        <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {detail}
        </div>
      </div>
    </li>
  )
}

export default function CompleteStep({ budget, plan, formData, crew }) {
  const [copied, setCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const accountNumber = '225-910068-71204'
  const dashboardUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${DASHBOARD_LOGIN_PATH}`
      : DASHBOARD_LOGIN_PATH

  // 가격 계산 (plan에 priceWithVat이 없을 수 있음)
  const ICON_PRICE = 300000
  const PARTNER_PRICE = 100000
  const RISING_PRICE = 50000

  const computedPrice = (() => {
    if (plan?.priceWithVat) return plan.priceWithVat
    const c = crew || plan?.crew || { icon: 0, partner: 0, rising: 0 }
    const base = (c.icon || 0) * ICON_PRICE + (c.partner || 0) * PARTNER_PRICE + (c.rising || 0) * RISING_PRICE
    return base > 0 ? Math.round(base * 1.1) : 0
  })()

  const handleCopy = () => {
    copyToClipboard(accountNumber, () => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleLinkCopy = () => {
    copyToClipboard(dashboardUrl, () => {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    })
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

      {/* 앞으로 일정 타임라인 */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full rounded-2xl p-5 text-left mt-4"
        style={{
          backgroundColor: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <CalendarClock size={14} style={{ color: '#01DF82' }} />
          <span className="text-sm font-bold text-white">앞으로 일정</span>
        </div>
        <ol className="flex flex-col gap-3">
          <TimelineItem step="1" title="입금 확인" detail="영업일 내 확인" />
          <TimelineItem step="2" title="크리에이터 모집 & 매칭" detail="공고 후 크리에이터 신청 순" />
          <TimelineItem
            step="3"
            title="매칭 후 2개월 이내 방문"
            detail="크리에이터가 직접 방문해 1박 체험"
            highlight
          />
          <TimelineItem
            step="4"
            title="퇴실 후 14일 이내 콘텐츠 업로드"
            detail="채널별 콘텐츠 게시 완료"
            highlight
          />
        </ol>
      </motion.div>

      {/* 대시보드 링크 저장 블록 — 상시 노출 */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="w-full rounded-2xl p-5 text-left mt-4"
        style={{
          backgroundColor: 'rgba(1,223,130,0.05)',
          border: '1px solid rgba(1,223,130,0.22)',
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <LayoutDashboard size={14} style={{ color: '#01DF82' }} />
          <span className="text-sm font-bold text-white">대시보드 링크를 저장해 두세요</span>
        </div>
        <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.55)' }}>
          매칭된 크리에이터, 체크인일, 콘텐츠를 한 곳에서 확인할 수 있어요.
        </p>

        <div
          className="flex items-center justify-between gap-2 p-3 rounded-lg mb-3"
          style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}
        >
          <span
            className="text-xs truncate"
            style={{ color: '#01DF82', fontFamily: 'ui-monospace, monospace' }}
          >
            {dashboardUrl}
          </span>
          <button
            onClick={handleLinkCopy}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0"
            style={{
              backgroundColor: linkCopied ? 'rgba(1,223,130,0.15)' : 'rgba(255,255,255,0.08)',
              color: linkCopied ? '#01DF82' : 'rgba(255,255,255,0.7)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Copy size={12} />
            {linkCopied ? '복사됨!' : '복사'}
          </button>
        </div>

        <a
          href={DASHBOARD_LOGIN_PATH}
          className="w-full flex items-center justify-between px-4 py-3 rounded-lg mb-3"
          style={{
            backgroundColor: 'rgba(1,223,130,0.1)',
            textDecoration: 'none',
          }}
        >
          <span className="text-sm font-semibold" style={{ color: '#01DF82' }}>
            지금 대시보드 열어보기
          </span>
          <span className="text-sm" style={{ color: '#01DF82' }}>→</span>
        </a>

        <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
          복사 후 카카오톡 '나에게' 또는 브라우저 북마크에 저장해두세요. 동일 링크가 이메일에도 발송됩니다.
        </p>
      </motion.div>

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
