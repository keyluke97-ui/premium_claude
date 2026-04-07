// LoginPage.jsx - 캠지기 대시보드 로그인 (사업자번호 + 캠핑장 선택 + 연락처 뒷자리 4자리)
// CHANGED: 캠핑장 그룹핑 UI — 동일 캠핑장의 프리미엄/파트너를 하나로 표시, types 배열 전달

import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { lookupAccommodations, login, isAuthenticated } from '../../utils/dashboardApi'
import { BRAND_GREEN, BACKGROUND_COLOR, CARD_BACKGROUND, BORDER_COLOR, TEXT_MUTED } from '../../constants/designTokens'

// CHANGED: 협찬 유형별 배지 설정
const TYPE_BADGE = {
  premium: { label: '프리미엄', color: '#FFD700', backgroundColor: 'rgba(255,215,0,0.12)' },
  partner: { label: '파트너', color: BRAND_GREEN, backgroundColor: `${BRAND_GREEN}12` },
}

/** CHANGED: 캠핑장명 표시 — names 배열이 있고 2개 이상이면 대표명 + 별칭 표시 */
function displayAccommodationName(item) {
  const names = item.names || [item.name]
  if (names.length <= 1) return item.name
  return item.name
}

/** 캠핑장명이 프리미엄/파트너에서 다를 때 보조 이름 표시 */
function getAlternateNames(item) {
  const names = item.names || [item.name]
  if (names.length <= 1) return null
  return names.slice(1)
}

/** 사업자번호 포맷: 000-00-00000 */
function formatBusinessNumber(value) {
  const digits = value.replace(/[^0-9]/g, '').slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
}

function extractDigits(formatted) {
  return formatted.replace(/[^0-9]/g, '')
}

export default function LoginPage() {
  const navigate = useNavigate()

  const [step, setStep] = useState('input') // 'input' | 'select'
  const [businessNumber, setBusinessNumber] = useState('')
  // CHANGED: 그룹핑된 캠핑장 배열 — { name, types: [{type, recordId}] }
  const [accommodations, setAccommodations] = useState([])
  // CHANGED: 선택된 캠핑장 — { name, types: [{type, recordId}] }
  const [selectedAccommodation, setSelectedAccommodation] = useState(null)
  const [phoneLastFour, setPhoneLastFour] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate])

  /** 1단계: 사업자번호로 캠핑장 조회 */
  const handleLookup = useCallback(async () => {
    const digits = extractDigits(businessNumber)
    if (digits.length !== 10) {
      setError('사업자 번호 10자리를 입력해주세요.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const data = await lookupAccommodations(digits)

      if (!data.accommodations || data.accommodations.length === 0) {
        setError('해당 사업자 번호로 등록된 캠핑장이 없습니다.')
        return
      }

      // CHANGED: lookup 응답이 이미 그룹핑된 형태 { name, types: [{type, recordId}] }
      const accommodationItems = data.accommodations.map((item) => {
        // 하위 호환: 이전 형식 {name, recordId, type} → 새 형식으로 변환
        if (!item.types && item.type) {
          return { name: item.name, types: [{ type: item.type, recordId: item.recordId }] }
        }
        return item
      })
      setAccommodations(accommodationItems)

      if (accommodationItems.length === 1) {
        setSelectedAccommodation(accommodationItems[0])
      }
      setStep('select')
    } catch (lookupError) {
      setError(lookupError.message)
    } finally {
      setLoading(false)
    }
  }, [businessNumber])

  /** 2단계: 캠핑장 선택 + 연락처 뒷자리 입력 후 로그인 */
  const handleLogin = useCallback(
    async () => {
      setLoading(true)
      setError('')

      try {
        const cleanDigits = extractDigits(businessNumber)

        if (!selectedAccommodation) {
          setError('캠핑장을 선택해주세요.')
          return
        }

        const cleanPhone = phoneLastFour.replace(/[^0-9]/g, '')
        if (cleanPhone.length !== 4) {
          setError('연락처 뒷자리 4자리를 입력해주세요.')
          return
        }

        // CHANGED: types 배열 전달 (서버가 복수 타입 JWT 발급)
        await login(cleanDigits, selectedAccommodation.name, cleanPhone, selectedAccommodation.types)
        navigate('/dashboard', { replace: true })
      } catch (loginError) {
        setError(loginError.message)
      } finally {
        setLoading(false)
      }
    },
    [businessNumber, selectedAccommodation, phoneLastFour, navigate]
  )

  /** Enter 키 처리 */
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !loading) {
      if (step === 'input') handleLookup()
      else if (step === 'select' && selectedAccommodation?.name && phoneLastFour.replace(/[^0-9]/g, '').length === 4) handleLogin()
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5"
      style={{ backgroundColor: BACKGROUND_COLOR }}
    >
      <div className="w-full" style={{ maxWidth: 448 }}>
        {/* 로고 / 제목 */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4"
            style={{ backgroundColor: `${BRAND_GREEN}15` }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke={BRAND_GREEN}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white">캠핏 협찬 대시보드</h1>
          <p className="text-sm mt-1" style={{ color: TEXT_MUTED }}>
            신청 현황과 크리에이터 배정을 확인하세요
          </p>
        </div>

        {/* 카드 */}
        <motion.div
          className="rounded-2xl p-6"
          style={{
            backgroundColor: CARD_BACKGROUND,
            border: `1px solid ${BORDER_COLOR}`,
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <AnimatePresence mode="wait">
            {step === 'input' ? (
              <motion.div
                key="input-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <label className="block text-sm font-medium text-white mb-2">
                  사업자 번호
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="000-00-00000"
                  value={businessNumber}
                  onChange={(event) => {
                    setBusinessNumber(formatBusinessNumber(event.target.value))
                    setError('')
                  }}
                  onKeyDown={handleKeyDown}
                  className="w-full px-4 py-3 rounded-xl text-white text-base"
                  style={{
                    backgroundColor: '#252525',
                    border: `1px solid ${error ? '#FF4444' : BORDER_COLOR}`,
                    transition: 'border-color 0.2s',
                  }}
                  autoFocus
                  disabled={loading}
                />
                <p className="text-xs mt-2" style={{ color: TEXT_MUTED }}>
                  협찬 신청 시 입력한 사업자 번호를 입력해주세요
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="select-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center mb-4">
                  <button
                    onClick={() => {
                      setStep('input')
                      setSelectedAccommodation(null)
                      setPhoneLastFour('')
                      setError('')
                    }}
                    className="mr-2 p-2 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
                    style={{ color: TEXT_MUTED }}
                    aria-label="이전 단계로"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                  <span className="text-sm font-medium text-white">본인 확인</span>
                </div>

                {/* CHANGED: 캠핑장 선택 — 그룹핑된 형태, 뱃지 복수 표시 */}
                {accommodations.length > 1 && (
                  <div className="space-y-2">
                    {accommodations.map((item) => {
                      const isSelected = selectedAccommodation?.name === item.name
                      return (
                        <button
                          key={item.types[0]?.recordId || item.name}
                          onClick={() => {
                            setSelectedAccommodation(item)
                            setError('')
                          }}
                          className="w-full text-left px-4 py-3.5 rounded-xl text-sm transition-all min-h-[44px]"
                          style={{
                            backgroundColor: isSelected ? `${BRAND_GREEN}15` : '#252525',
                            border: `1px solid ${isSelected ? BRAND_GREEN : BORDER_COLOR}`,
                            color: isSelected ? BRAND_GREEN : '#FFFFFF',
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <span>{displayAccommodationName(item)}</span>
                              {/* CHANGED: 프리미엄/파트너 캠핑장명이 다를 때 보조 이름 표시 */}
                              {getAlternateNames(item) && (
                                <p className="text-xs mt-0.5 truncate" style={{ color: TEXT_MUTED }}>
                                  = {getAlternateNames(item).join(', ')}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1.5 flex-shrink-0 ml-2">
                              {item.types.map((typeEntry) => {
                                const badge = TYPE_BADGE[typeEntry.type] || TYPE_BADGE.premium
                                return (
                                  <span
                                    key={typeEntry.type}
                                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                                    style={{
                                      color: badge.color,
                                      backgroundColor: badge.backgroundColor,
                                    }}
                                  >
                                    {badge.label}
                                  </span>
                                )
                              })}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* CHANGED: 캠핑장 1개 — 뱃지 복수 표시 */}
                {accommodations.length === 1 && selectedAccommodation && (
                  <div
                    className="px-4 py-3 rounded-xl text-sm mb-4"
                    style={{
                      backgroundColor: `${BRAND_GREEN}15`,
                      border: `1px solid ${BRAND_GREEN}`,
                      color: BRAND_GREEN,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <span>{displayAccommodationName(selectedAccommodation)}</span>
                        {/* CHANGED: 프리미엄/파트너 캠핑장명이 다를 때 보조 이름 표시 */}
                        {getAlternateNames(selectedAccommodation) && (
                          <p className="text-xs mt-0.5 truncate" style={{ color: TEXT_MUTED }}>
                            = {getAlternateNames(selectedAccommodation).join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0 ml-2">
                        {selectedAccommodation.types.map((typeEntry) => {
                          const badge = TYPE_BADGE[typeEntry.type] || TYPE_BADGE.premium
                          return (
                            <span
                              key={typeEntry.type}
                              className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{
                                color: badge.color,
                                backgroundColor: badge.backgroundColor,
                              }}
                            >
                              {badge.label}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* 연락처 뒷자리 4자리 입력 필드 */}
                <div className={accommodations.length > 1 ? 'mt-4' : ''}>
                  <label className="block text-sm font-medium text-white mb-2">
                    연락처 뒷자리 4자리
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="0000"
                    value={phoneLastFour}
                    onChange={(event) => {
                      const digits = event.target.value.replace(/[^0-9]/g, '').slice(0, 4)
                      setPhoneLastFour(digits)
                      setError('')
                    }}
                    onKeyDown={handleKeyDown}
                    className="w-full px-4 py-3 rounded-xl text-white text-base"
                    style={{
                      backgroundColor: '#252525',
                      border: `1px solid ${error ? '#FF4444' : BORDER_COLOR}`,
                      transition: 'border-color 0.2s',
                    }}
                    autoFocus
                    disabled={loading}
                  />
                  <p className="text-xs mt-2" style={{ color: TEXT_MUTED }}>
                    협찬 신청 시 입력한 연락처의 뒷자리 4자리
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 에러 메시지 */}
          <AnimatePresence>
            {error && (
              <motion.p
                className="text-sm mt-3"
                style={{ color: '#FF4444' }}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* 로그인/다음 버튼 */}
          {(() => {
            const isButtonDisabled =
              loading ||
              (step === 'input' && extractDigits(businessNumber).length !== 10) ||
              (step === 'select' && (!selectedAccommodation?.name || phoneLastFour.replace(/[^0-9]/g, '').length !== 4))

            return (
              <button
                onClick={() => {
                  if (step === 'input') handleLookup()
                  else handleLogin()
                }}
                disabled={isButtonDisabled}
                className="w-full mt-5 py-3.5 rounded-xl text-base font-semibold transition-all"
                style={{
                  backgroundColor: isButtonDisabled ? '#333333' : BRAND_GREEN,
                  color: isButtonDisabled ? TEXT_MUTED : '#000000',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    확인 중...
                  </span>
                ) : step === 'input' ? (
                  '다음'
                ) : (
                  '로그인'
                )}
              </button>
            )
          })()}
        </motion.div>

        {/* 하단 안내 */}
        <p className="text-center text-xs mt-6" style={{ color: TEXT_MUTED }}>
          문의사항은{' '}
          <a
            href="http://pf.kakao.com/_fBxaQG/chat"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: BRAND_GREEN }}
          >
            카카오톡 채널
          </a>
          로 연락주세요
        </p>
      </div>
    </div>
  )
}
