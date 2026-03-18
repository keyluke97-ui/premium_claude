// RefundFlowModal.jsx - 환불 요청 플로우 모달
// Step 1 (select): 전액 / 부분 환불 선택
// Step 2a (full): 전액 환불 폼 (사유 + 계좌 정보 + 통장사본 이미지)
// Step 2b (partial): 부분 환불 상담 정보 입력 → 카카오톡 연결
// Step 3 (success): 전액 환불 제출 완료

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { requestRefund } from '../../../utils/dashboardApi'
import {
  BRAND_GREEN,
  CARD_BACKGROUND,
  BORDER_COLOR,
  TEXT_MUTED,
  OVERLAY_COLOR,
  DESTRUCTIVE_COLOR,
  WARNING_BACKGROUND,
  WARNING_BORDER,
} from '../../../constants/designTokens'

const BANK_OPTIONS = [
  '국민은행', '신한은행', '하나은행', '우리은행', 'NH농협은행',
  'IBK기업은행', '카카오뱅크', '토스뱅크', '케이뱅크', 'SC제일은행',
  '대구은행', '부산은행', '경남은행', '광주은행', '전북은행',
  '제주은행', '수협은행', '신협', '새마을금고', '우체국',
]

const KAKAO_LINK = 'http://pf.kakao.com/_fBxaQG/chat'

// 클라이언트 이미지 압축
async function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = (event) => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        const MAX_DIM = 1920
        const ratio = Math.min(MAX_DIM / img.width, MAX_DIM / img.height, 1)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * ratio)
        canvas.height = Math.round(img.height * ratio)
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.75))
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  })
}

// 부분 환불 상담 내용 클립보드 복사용 텍스트 생성
function buildPartialRefundSummary({ accommodationName, recruitment, keepIcon, keepPartner, keepRising, additionalNote }) {
  const lines = [
    '[부분 환불 상담 요청]',
    `캠핑장명: ${accommodationName}`,
    '',
    '■ 현재 배정 현황',
    `  아이콘 크리에이터: ${recruitment.icon.assigned}명`,
    `  파트너 크리에이터: ${recruitment.partner.assigned}명`,
    `  라이징 크리에이터: ${recruitment.rising.assigned}명`,
    '',
    '■ 남기고 싶은 인원',
    `  아이콘 크리에이터: ${keepIcon}명`,
    `  파트너 크리에이터: ${keepPartner}명`,
    `  라이징 크리에이터: ${keepRising}명`,
  ]
  if (additionalNote.trim()) {
    lines.push('', '■ 추가 요청사항', `  ${additionalNote.trim()}`)
  }
  return lines.join('\n')
}

// ─── 공통 바텀시트 래퍼 ───────────────────────────────────────────────────────
function BottomSheet({ onClose, children }) {
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
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-4 pb-1">
          <div
            className="w-10 h-1 rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
          />
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}

// ─── Step 1: 전액 / 부분 선택 ────────────────────────────────────────────────
// CHANGED: totalAssigned > 0이면 전액 환불 비활성 + 안내 문구
function StepSelect({ totalAssigned, onSelectFull, onSelectPartial, onClose }) {
  const hasMatchedCreators = totalAssigned > 0

  return (
    <BottomSheet onClose={onClose}>
      <div className="px-6 pb-8">
        <div className="flex items-center justify-between mb-6 mt-2">
          <h3 className="text-base font-bold text-white">환불 요청</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke={TEXT_MUTED} strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <p className="text-sm mb-5" style={{ color: TEXT_MUTED }}>
          환불 유형을 선택해주세요.
        </p>

        {/* CHANGED: 전액 환불 — 매칭 완료 건 있으면 비활성 */}
        <button
          onClick={hasMatchedCreators ? undefined : onSelectFull}
          disabled={hasMatchedCreators}
          className="w-full text-left rounded-xl p-4 mb-3 transition-colors"
          style={{
            backgroundColor: hasMatchedCreators ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${hasMatchedCreators ? 'rgba(255,255,255,0.04)' : BORDER_COLOR}`,
            opacity: hasMatchedCreators ? 0.5 : 1,
            cursor: hasMatchedCreators ? 'not-allowed' : 'pointer',
          }}
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-white">전액 환불</p>
            {hasMatchedCreators && (
              <span
                className="px-2 py-0.5 rounded-md text-xs font-medium"
                style={{ backgroundColor: 'rgba(255,107,107,0.1)', color: DESTRUCTIVE_COLOR }}
              >
                불가
              </span>
            )}
          </div>
          <p className="text-xs" style={{ color: TEXT_MUTED }}>
            {hasMatchedCreators
              ? `매칭 완료된 크리에이터(${totalAssigned}명)가 있어 전액 환불이 불가합니다.`
              : '협찬을 전면 취소하고 전액을 환불 받습니다.'}
          </p>
        </button>

        {/* 부분 환불 */}
        <button
          onClick={onSelectPartial}
          className="w-full text-left rounded-xl p-4 transition-colors"
          style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER_COLOR}` }}
        >
          <p className="text-sm font-semibold text-white mb-1">부분 환불</p>
          <p className="text-xs" style={{ color: TEXT_MUTED }}>
            매칭되지 않은 인원분의 금액을 환불 받습니다.
            담당자와 카카오톡 상담 후 처리됩니다.
          </p>
        </button>
      </div>
    </BottomSheet>
  )
}

// ─── Step 2a: 전액 환불 폼 ───────────────────────────────────────────────────
function StepFullRefund({ onBack, onClose, onSuccess }) {
  const [reason, setReason] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imageBase64, setImageBase64] = useState('')
  const [imageError, setImageError] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)
  const submitLockRef = useRef(false)

  const canSubmit =
    reason.trim().length > 0 &&
    bankName.length > 0 &&
    accountNumber.trim().length > 0 &&
    accountHolder.trim().length > 0 &&
    imageBase64.length > 0 &&
    !loading

  const handleImageChange = useCallback(async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImageError('')
    if (!file.type.startsWith('image/')) {
      setImageError('이미지 파일만 업로드 가능합니다.')
      return
    }

    try {
      const compressed = await compressImage(file)
      setImageFile(file)
      setImageBase64(compressed)
    } catch {
      setImageError('이미지 처리 중 오류가 발생했습니다. 다른 파일을 선택해주세요.')
    }
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || submitLockRef.current) return
    submitLockRef.current = true
    setLoading(true)
    setError('')

    try {
      const response = await requestRefund({
        reason: reason.trim(),
        bankName,
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.trim(),
        bankImageBase64: imageBase64,
      })
      if (onSuccess) onSuccess(response)
    } catch (submitError) {
      if (submitError.message?.includes('인증이 만료')) {
        window.location.href = '/dashboard/login'
        return
      }
      setError(submitError.message || '환불 요청 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
      submitLockRef.current = false
    }
  }, [canSubmit, reason, bankName, accountNumber, accountHolder, imageBase64, onSuccess])

  return (
    <BottomSheet onClose={onClose}>
      <div className="px-6 pb-8">
        <div className="flex items-center gap-2 mb-5 mt-2">
          <button
            onClick={onBack}
            className="p-1 rounded-lg"
            style={{ color: TEXT_MUTED }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <h3 className="text-base font-bold text-white">전액 환불</h3>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium mb-2" style={{ color: TEXT_MUTED }}>
            환불 사유 <span style={{ color: DESTRUCTIVE_COLOR }}>*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="환불 사유를 입력해주세요"
            rows={3}
            className="w-full rounded-xl p-4 text-sm text-white placeholder-gray-500 resize-none focus:outline-none"
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: `1px solid ${BORDER_COLOR}`,
            }}
          />
        </div>

        <div
          className="rounded-xl p-4 mb-4"
          style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER_COLOR}` }}
        >
          <p className="text-xs font-medium mb-3" style={{ color: TEXT_MUTED }}>
            환불 계좌 정보
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: TEXT_MUTED }}>
                은행 선택 <span style={{ color: DESTRUCTIVE_COLOR }}>*</span>
              </label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${BORDER_COLOR}`,
                  color: bankName ? '#FFFFFF' : 'rgba(255,255,255,0.35)',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='rgba(255,255,255,0.4)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                }}
              >
                <option value="" disabled>은행을 선택해주세요</option>
                {BANK_OPTIONS.map((bank) => (
                  <option key={bank} value={bank} style={{ backgroundColor: '#1A1A1A', color: '#FFFFFF' }}>
                    {bank}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs mb-1" style={{ color: TEXT_MUTED }}>
                계좌번호 <span style={{ color: DESTRUCTIVE_COLOR }}>*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="'-' 없이 숫자만 입력"
                className="w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none"
                style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER_COLOR}` }}
              />
            </div>

            <div>
              <label className="block text-xs mb-1" style={{ color: TEXT_MUTED }}>
                예금주명 <span style={{ color: DESTRUCTIVE_COLOR }}>*</span>
              </label>
              <input
                type="text"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                placeholder="예금주명을 입력해주세요"
                className="w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none"
                style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER_COLOR}` }}
              />
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium mb-2" style={{ color: TEXT_MUTED }}>
            통장 사본 <span style={{ color: DESTRUCTIVE_COLOR }}>*</span>
            <span className="ml-1 font-normal" style={{ color: 'rgba(255,255,255,0.25)' }}>
              (계좌정보가 보이는 통장 앞면 사진)
            </span>
          </label>

          {imageBase64 ? (
            <div className="relative rounded-xl overflow-hidden" style={{ border: `1px solid ${BRAND_GREEN}` }}>
              <img
                src={imageBase64}
                alt="통장사본 미리보기"
                className="w-full object-cover"
                style={{ maxHeight: 180 }}
              />
              <button
                onClick={() => {
                  setImageFile(null)
                  setImageBase64('')
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
              <div
                className="absolute bottom-0 left-0 right-0 px-3 py-2 text-xs truncate"
                style={{ backgroundColor: 'rgba(0,0,0,0.55)', color: 'rgba(255,255,255,0.7)' }}
              >
                {imageFile?.name}
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-xl py-8 flex flex-col items-center gap-2 transition-colors"
              style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px dashed ${BORDER_COLOR}` }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                  stroke={TEXT_MUTED}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-sm" style={{ color: TEXT_MUTED }}>사진 선택</span>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
                이미지 파일 (자동 압축 처리)
              </span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />

          {imageError && (
            <p className="text-xs mt-2" style={{ color: DESTRUCTIVE_COLOR }}>{imageError}</p>
          )}
        </div>

        {error && (
          <p className="text-sm mb-3" style={{ color: DESTRUCTIVE_COLOR }}>{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
          style={{
            backgroundColor: canSubmit ? DESTRUCTIVE_COLOR : '#333333',
            color: canSubmit ? '#FFFFFF' : TEXT_MUTED,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
          }}
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              처리 중...
            </>
          ) : canSubmit ? '환불 요청 접수' : '필수 항목을 모두 입력해주세요'}
        </button>
      </div>
    </BottomSheet>
  )
}

// ─── Step 2b: 부분 환불 상담 정보 입력 ───────────────────────────────────────
// CHANGED: 매칭 완료된 등급은 카운터 잠금 + '매칭 완료 — 환불 불가' 태그
function StepPartialRefund({ recruitment, accommodationName, onBack, onClose }) {
  // CHANGED: 매칭 완료 등급은 assigned 값으로 고정, 미매칭 등급은 requested 값으로 초기화
  const [keepIcon, setKeepIcon] = useState(String(recruitment.icon.assigned))
  const [keepPartner, setKeepPartner] = useState(String(recruitment.partner.assigned))
  const [keepRising, setKeepRising] = useState(String(recruitment.rising.assigned))
  const [additionalNote, setAdditionalNote] = useState('')
  const [copied, setCopied] = useState(false)

  const summary = buildPartialRefundSummary({
    accommodationName,
    recruitment,
    keepIcon: keepIcon || '0',
    keepPartner: keepPartner || '0',
    keepRising: keepRising || '0',
    additionalNote,
  })

  const handleCopyAndOpen = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(summary)
      setCopied(true)
    } catch {
      // 클립보드 접근 실패 시에도 카카오톡 오픈
    }
    window.open(KAKAO_LINK, '_blank', 'noopener,noreferrer')
  }, [summary])

  // CHANGED: 등급별 잠금 여부 판단 (assigned > 0이면 잠금)
  const tiers = [
    {
      key: 'icon',
      label: '⭐️ 아이콘 크리에이터',
      assigned: recruitment.icon.assigned,
      requested: recruitment.icon.requested,
      value: keepIcon,
      setValue: setKeepIcon,
      isLocked: recruitment.icon.assigned > 0,
    },
    {
      key: 'partner',
      label: '✔️ 파트너 크리에이터',
      assigned: recruitment.partner.assigned,
      requested: recruitment.partner.requested,
      value: keepPartner,
      setValue: setKeepPartner,
      isLocked: recruitment.partner.assigned > 0,
    },
    {
      key: 'rising',
      label: '🔥 라이징 크리에이터',
      assigned: recruitment.rising.assigned,
      requested: recruitment.rising.requested,
      value: keepRising,
      setValue: setKeepRising,
      isLocked: recruitment.rising.assigned > 0,
    },
  ]

  return (
    <BottomSheet onClose={onClose}>
      <div className="px-6 pb-8">
        {/* 헤더 */}
        <div className="flex items-center gap-2 mb-5 mt-2">
          <button onClick={onBack} className="p-1 rounded-lg" style={{ color: TEXT_MUTED }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <h3 className="text-base font-bold text-white">부분 환불 상담</h3>
        </div>

        {/* 안내 */}
        <div
          className="rounded-xl p-4 mb-5"
          style={{ backgroundColor: WARNING_BACKGROUND, border: `1px solid ${WARNING_BORDER}` }}
        >
          <p className="text-xs leading-relaxed" style={{ color: '#E8A838' }}>
            매칭 완료된 크리에이터는 환불 대상에서 제외됩니다.
            미매칭 인원분에 대해서만 환불 상담이 가능합니다.
          </p>
        </div>

        {/* 현재 배정 현황 */}
        <div
          className="rounded-xl p-4 mb-4"
          style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER_COLOR}` }}
        >
          <p className="text-xs font-medium mb-3" style={{ color: TEXT_MUTED }}>현재 배정 현황</p>
          <div className="space-y-1.5">
            {[
              { label: '⭐️ 아이콘', assigned: recruitment.icon.assigned, requested: recruitment.icon.requested },
              { label: '✔️ 파트너', assigned: recruitment.partner.assigned, requested: recruitment.partner.requested },
              { label: '🔥 라이징', assigned: recruitment.rising.assigned, requested: recruitment.rising.requested },
            ].map(({ label, assigned, requested }) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-xs text-white">{label}</span>
                <span className="text-xs" style={{ color: TEXT_MUTED }}>
                  {assigned} / {requested}명 배정
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CHANGED: 남길 인원 입력 — 매칭 완료 등급은 잠금 */}
        <div className="mb-4">
          <p className="text-xs font-medium mb-3" style={{ color: TEXT_MUTED }}>남기고 싶은 인원</p>
          <div className="space-y-3">
            {tiers.map((tier) => (
              <div key={tier.key} className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-white">{tier.label}</span>
                  {/* CHANGED: 매칭 완료 태그 */}
                  {tier.isLocked && (
                    <span
                      className="ml-2 px-1.5 py-0.5 rounded text-xs font-medium"
                      style={{ backgroundColor: 'rgba(255,107,107,0.1)', color: DESTRUCTIVE_COLOR }}
                    >
                      매칭 완료
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={tier.isLocked ? tier.assigned : 0}
                    max={tier.isLocked ? tier.assigned : tier.requested}
                    value={tier.value}
                    onChange={(e) => tier.setValue(e.target.value)}
                    disabled={tier.isLocked}
                    className="w-16 rounded-lg px-3 py-2 text-sm text-center text-white focus:outline-none"
                    style={{
                      backgroundColor: tier.isLocked ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${tier.isLocked ? 'rgba(255,255,255,0.04)' : BORDER_COLOR}`,
                      opacity: tier.isLocked ? 0.5 : 1,
                      cursor: tier.isLocked ? 'not-allowed' : 'text',
                    }}
                  />
                  <span className="text-xs" style={{ color: TEXT_MUTED }}>명</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 추가 요청사항 */}
        <div className="mb-5">
          <label className="block text-xs font-medium mb-2" style={{ color: TEXT_MUTED }}>
            추가 요청사항 <span style={{ color: 'rgba(255,255,255,0.25)' }}>(선택)</span>
          </label>
          <textarea
            value={additionalNote}
            onChange={(e) => setAdditionalNote(e.target.value)}
            placeholder="추가로 전달할 내용을 입력해주세요"
            rows={2}
            className="w-full rounded-xl p-3 text-sm text-white placeholder-gray-500 resize-none focus:outline-none"
            style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER_COLOR}` }}
          />
        </div>

        {/* 복사 안내 */}
        <div
          className="rounded-xl p-3 mb-4"
          style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER_COLOR}` }}
        >
          <p className="text-xs mb-1 font-medium" style={{ color: TEXT_MUTED }}>상담 시 전달될 내용 미리보기</p>
          <pre
            className="text-xs whitespace-pre-wrap leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'inherit' }}
          >
            {summary}
          </pre>
        </div>

        {/* 카카오톡 버튼 */}
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
          {copied ? '내용 복사됨 — 카카오톡에 붙여넣기' : '내용 복사 후 카카오톡 상담 시작'}
        </button>

        {copied && (
          <p className="text-xs text-center mt-2" style={{ color: BRAND_GREEN }}>
            ✓ 상담 내용이 클립보드에 복사되었습니다
          </p>
        )}
      </div>
    </BottomSheet>
  )
}

// ─── Step 3: 전액 환불 완료 ───────────────────────────────────────────────────
function StepSuccess({ result, onClose }) {
  return (
    <BottomSheet onClose={onClose}>
      <div className="px-6 pb-8">
        <div className="text-center py-6">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'rgba(1,223,130,0.1)' }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                stroke={BRAND_GREEN}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h3 className="text-base font-bold text-white mb-2">환불 요청 완료</h3>
          <p className="text-sm leading-relaxed" style={{ color: TEXT_MUTED }}>
            {result?.message || '환불 요청이 접수되었습니다. 담당자가 확인 후 연락드립니다.'}
          </p>

          {result?.refundNote && (
            <div
              className="rounded-xl p-4 text-left mt-4"
              style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER_COLOR}` }}
            >
              <p className="text-xs font-medium mb-1" style={{ color: TEXT_MUTED }}>접수 내역</p>
              <p className="text-sm text-white leading-relaxed">{result.refundNote}</p>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full mt-6 py-3 rounded-xl text-sm font-bold"
            style={{ backgroundColor: BRAND_GREEN, color: '#000000' }}
          >
            확인
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
// CHANGED: totalAssigned prop 추가 (전액 환불 비활성 판단용)
export default function RefundFlowModal({ recruitment, totalAssigned, accommodationName, onClose }) {
  const [step, setStep] = useState('select')
  const [successResult, setSuccessResult] = useState(null)

  const handleSuccess = useCallback((result) => {
    setSuccessResult(result)
    setStep('success')
  }, [])

  return (
    <AnimatePresence mode="wait">
      {step === 'select' && (
        <StepSelect
          key="select"
          totalAssigned={totalAssigned}
          onSelectFull={() => setStep('full')}
          onSelectPartial={() => setStep('partial')}
          onClose={onClose}
        />
      )}
      {step === 'full' && (
        <StepFullRefund
          key="full"
          onBack={() => setStep('select')}
          onClose={onClose}
          onSuccess={handleSuccess}
        />
      )}
      {step === 'partial' && (
        <StepPartialRefund
          key="partial"
          recruitment={recruitment}
          accommodationName={accommodationName}
          onBack={() => setStep('select')}
          onClose={onClose}
        />
      )}
      {step === 'success' && (
        <StepSuccess
          key="success"
          result={successResult}
          onClose={onClose}
        />
      )}
    </AnimatePresence>
  )
}
