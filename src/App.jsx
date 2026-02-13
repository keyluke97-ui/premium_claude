import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ArrowRight, Send } from 'lucide-react'

import IntroStep from './components/steps/IntroStep'
import BudgetStep from './components/steps/BudgetStep'
import PackageStep from './components/steps/PackageStep'
import InfoStep from './components/steps/InfoStep'
import AgreementStep from './components/steps/AgreementStep'
import CompleteStep from './components/steps/CompleteStep'
import { submitApplication } from './utils/airtable'
import { PRICING } from './data/packages'

/*
 * 퍼널 단계:
 * 0: 인트로
 * 1: 예산 선택
 * 2: 패키지 상세 선택
 * 3: 캠핑장 정보 입력
 * 4: 유의사항 및 계약 동의
 * 5: 완료
 */

const INITIAL_FORM = {
  accommodationName: '',
  representativeName: '',
  phone: '',
  email: '',
  region: '',
  siteTypes: [],
  additionalRequests: '',
}

const INITIAL_AGREEMENTS = {
  contract: false,
  privacy: false,
}

// 프로그레스 바 컴포넌트
function ProgressBar({ step }) {
  const progress = (step / 4) * 100
  return (
    <div className="flex items-center gap-3 px-5 py-2">
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: '#01DF82' }}
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
      <span className="text-xs font-medium whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.4)' }}>
        {step}/4
      </span>
    </div>
  )
}

export default function App() {
  // ── State ──
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [budget, setBudget] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [agreements, setAgreements] = useState(INITIAL_AGREEMENTS)
  const [customCrew, setCustomCrew] = useState({ icon: 0, partner: 0, rising: 0 })
  // critical 조항 개별 동의 (key: clause index, value: boolean)
  const [criticalAcks, setCriticalAcks] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ── Navigation ──
  const goTo = useCallback(
    (newStep) => {
      setDirection(newStep > step ? 1 : -1)
      setStep(newStep)
    },
    [step]
  )

  const goBack = useCallback(() => {
    // custom 예산 + step2(크루 카운터) → step1(예산)로 직접 복귀
    if (step === 2 && budget === 'custom') {
      goTo(1)
    } else {
      goTo(step - 1)
    }
  }, [step, budget, goTo])

  // ── Handlers ──
  const handleBudgetSelect = useCallback(
    (value) => {
      setBudget(value)
      setSelectedPlan(null)
      setCustomCrew({ icon: 0, partner: 0, rising: 0 })
      setTimeout(() => {
        if (value === 'custom') {
          // 직접 선택: 크루 카운터 전용 모드로 PackageStep 진입
          setSelectedPlan({ id: 'custom', name: '직접 선택할게요', crew: { icon: 0, partner: 0, rising: 0 } })
        }
        goTo(2)
      }, 300)
    },
    [goTo]
  )

  const handlePlanSelect = useCallback((plan) => {
    setSelectedPlan(plan)
  }, [])

  const handleFormChange = useCallback((key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      if (prev[key]) {
        const next = { ...prev }
        delete next[key]
        return next
      }
      return prev
    })
  }, [])

  const handleAgreementToggle = useCallback((id) => {
    setAgreements((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const handleCriticalAck = useCallback((clauseIndex) => {
    setCriticalAcks((prev) => ({ ...prev, [clauseIndex]: !prev[clauseIndex] }))
  }, [])

  // critical 조항 인덱스 (agreements.js 의 contract.clauses 기준)
  const CRITICAL_INDICES = [1, 4, 6, 7, 8, 12] // 제2,5,7,8,9,13조

  const allCriticalAcked = CRITICAL_INDICES.every((i) => criticalAcks[i])

  const handleToggleAll = useCallback(() => {
    const allChecked = Object.values(agreements).every(Boolean) && allCriticalAcked
    const newVal = !allChecked
    setAgreements({ contract: newVal, privacy: newVal })
    if (newVal) {
      const newAcks = {}
      CRITICAL_INDICES.forEach((i) => { newAcks[i] = true })
      setCriticalAcks((prev) => ({ ...prev, ...newAcks }))
    } else {
      setCriticalAcks({})
    }
  }, [agreements, allCriticalAcked])

  // ── Validation ──
  const validateForm = useCallback(() => {
    const e = {}
    if (!formData.accommodationName.trim()) e.accommodationName = '캠핑장 이름을 입력해주세요'
    if (!formData.representativeName.trim()) e.representativeName = '대표자명을 입력해주세요'
    if (!formData.phone.trim()) e.phone = '연락처를 입력해주세요'
    if (!formData.email.trim()) {
      e.email = '이메일을 입력해주세요'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      e.email = '올바른 이메일 형식을 입력해주세요'
    }
    if (!formData.region) e.region = '소재 권역을 선택해주세요'
    if (!formData.siteTypes || formData.siteTypes.length === 0) e.siteTypes = '사이트 종류를 1개 이상 선택해주세요'
    setErrors(e)
    return Object.keys(e).length === 0
  }, [formData])

  const allRequiredAgreed = agreements.contract && agreements.privacy && allCriticalAcked

  // ── Submit ──
  const handleSubmit = useCallback(async () => {
    if (!allRequiredAgreed || isSubmitting) return
    setIsSubmitting(true)
    try {
      // crew 구성 결정: 커스텀이면 customCrew, 아니면 plan.crew
      const crew = selectedPlan?.id === 'custom'
        ? customCrew
        : selectedPlan?.crew || { icon: 0, partner: 0, rising: 0 }

      // 선택플랜: 실제 플랜명 전송 (커스텀 크루 선택이면 '직접 선택할게요')
      const planTier = selectedPlan?.name || '직접 선택할게요'

      await submitApplication({ budget, selectedPlan, formData, crew, planTier })
      goTo(5)
    } catch (err) {
      console.error('Submit error:', err)
      goTo(5)
    } finally {
      setIsSubmitting(false)
    }
  }, [allRequiredAgreed, isSubmitting, budget, selectedPlan, formData, customCrew, goTo])

  // ── Next 버튼 핸들러 ──
  const handleNext = useCallback(() => {
    if (step === 2 && selectedPlan) {
      // 커스텀 플랜인데 인원이 0이면 진행 불가
      if (selectedPlan.id === 'custom') {
        const total = customCrew.icon + customCrew.partner + customCrew.rising
        if (total === 0) return
      }
      goTo(3)
    } else if (step === 3) {
      if (validateForm()) goTo(4)
    } else if (step === 4) {
      handleSubmit()
    }
  }, [step, selectedPlan, customCrew, goTo, validateForm, handleSubmit])

  // ── Button 상태 ──
  const getButtonConfig = () => {
    switch (step) {
      case 2: {
        const isCustomEmpty = selectedPlan?.id === 'custom' && (customCrew.icon + customCrew.partner + customCrew.rising) === 0
        return {
          text: !selectedPlan ? '플랜을 선택해주세요' : isCustomEmpty ? '인원을 1명 이상 선택해주세요' : '다음',
          disabled: !selectedPlan || isCustomEmpty,
          icon: <ArrowRight size={18} />,
        }
      }
      case 3:
        return {
          text: '다음',
          disabled: false,
          icon: <ArrowRight size={18} />,
        }
      case 4:
        return {
          text: isSubmitting ? '신청 중...' : '신청 완료하기',
          disabled: !allRequiredAgreed || isSubmitting,
          icon: <Send size={18} />,
        }
      default:
        return null
    }
  }

  const btnConfig = getButtonConfig()
  const showHeader = step >= 1 && step <= 4
  const showBottomNav = step >= 2 && step <= 4

  // ── Animation Variants ──
  const slideVariants = {
    enter: (d) => ({
      x: d > 0 ? 60 : -60,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (d) => ({
      x: d > 0 ? -60 : 60,
      opacity: 0,
    }),
  }

  // ── Render ──
  return (
    <div
      className="max-w-md mx-auto min-h-screen flex flex-col relative"
      style={{ backgroundColor: '#111111' }}
    >
      {/* 헤더: 뒤로가기 + 프로그레스 */}
      {showHeader && (
        <div
          className="sticky top-0 z-20 pt-2"
          style={{ backgroundColor: '#111111' }}
        >
          <div className="flex items-center px-2">
            <button
              onClick={goBack}
              className="p-2 transition-colors"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}
            >
              <ChevronLeft size={24} />
            </button>
            <div className="flex-1">
              <ProgressBar step={step} />
            </div>
          </div>
        </div>
      )}

      {/* 스텝 콘텐츠 */}
      <div
        className="flex-1 overflow-x-hidden"
        style={{ paddingBottom: showBottomNav ? 100 : 0 }}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {step === 0 && <IntroStep onStart={() => goTo(1)} />}
            {step === 1 && (
              <BudgetStep selected={budget} onSelect={handleBudgetSelect} />
            )}
            {step === 2 && (
              <PackageStep
                budget={budget}
                selected={selectedPlan}
                onSelect={handlePlanSelect}
                customCrew={customCrew}
                onCustomCrewChange={setCustomCrew}
              />
            )}
            {step === 3 && (
              <InfoStep
                data={formData}
                onChange={handleFormChange}
                errors={errors}
              />
            )}
            {step === 4 && (
              <AgreementStep
                agreements={agreements}
                onToggle={handleAgreementToggle}
                onToggleAll={handleToggleAll}
                criticalAcks={criticalAcks}
                onCriticalAck={handleCriticalAck}
              />
            )}
            {step === 5 && (
              <CompleteStep
                budget={budget}
                plan={selectedPlan}
                formData={formData}
                crew={selectedPlan?.id === 'custom' ? customCrew : selectedPlan?.crew}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 하단 네비게이션 */}
      {showBottomNav && btnConfig && (
        <div
          className="fixed bottom-0 left-1/2 w-full z-30"
          style={{
            maxWidth: 448,
            transform: 'translateX(-50%)',
            padding: '12px 20px 32px',
            backgroundColor: '#111111',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <motion.button
            whileTap={btnConfig.disabled ? {} : { scale: 0.98 }}
            onClick={handleNext}
            disabled={btnConfig.disabled}
            className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200"
            style={{
              backgroundColor: btnConfig.disabled ? 'rgba(255,255,255,0.1)' : '#01DF82',
              color: btnConfig.disabled ? 'rgba(255,255,255,0.3)' : '#000000',
              border: 'none',
              cursor: btnConfig.disabled ? 'not-allowed' : 'pointer',
              boxShadow: btnConfig.disabled
                ? 'none'
                : '0 4px 16px rgba(1,223,130,0.3)',
            }}
          >
            {isSubmitting ? (
              <span className="animate-pulse">신청 중...</span>
            ) : (
              <>
                {btnConfig.text}
                {btnConfig.icon}
              </>
            )}
          </motion.button>
        </div>
      )}
    </div>
  )
}
