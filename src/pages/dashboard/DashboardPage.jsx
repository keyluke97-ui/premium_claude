// DashboardPage.jsx - 캠지기 대시보드 메인 페이지 (프리미엄/파트너 탭 전환 지원)
// CHANGED: 탭 전환 UI 추가 — ?tab=partner 쿼리파라미터로 상태 관리

import { Component, useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  fetchDashboardData,
  fetchPartnerData,
  getAccommodationName,
  getAvailableTypes, // CHANGED: getDashboardType 대신 getAvailableTypes 사용
  getPremiumRecordIds,
  isAuthenticated,
  clearAuth,
} from '../../utils/dashboardApi'
import StatusCard from './components/StatusCard'
import RecruitmentProgress from './components/RecruitmentProgress'
import CreatorList from './components/CreatorList'
import KakaoGuideSheet from './components/KakaoGuideSheet'
import RefundFlowModal from './components/RefundFlowModal'
import PartnerStatusCard from './components/PartnerStatusCard'
import PartnerCreatorList from './components/PartnerCreatorList'
import PartnerActionButtons from './components/PartnerActionButtons'
import { BRAND_GREEN, BACKGROUND_COLOR, TEXT_MUTED, BORDER_COLOR } from '../../constants/designTokens'

// CHANGED: 탭 라벨 설정
const TAB_CONFIG = {
  premium: { label: '프리미엄 협찬' },
  partner: { label: '캠핏 파트너' },
}

class DashboardErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, errorMessage: '' }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error.message }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex flex-col items-center justify-center px-5 text-center"
          style={{ backgroundColor: BACKGROUND_COLOR }}
        >
          <p className="text-white text-sm mb-2">예상치 못한 오류가 발생했습니다.</p>
          <p className="text-xs mb-6" style={{ color: TEXT_MUTED }}>{this.state.errorMessage}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-xl text-sm font-medium min-h-[44px]"
            style={{ backgroundColor: BRAND_GREEN, color: '#000000' }}
          >
            페이지 새로고침
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

/** 로딩 스피너 컴포넌트 */
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5" style={{ backgroundColor: BACKGROUND_COLOR }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <svg className="animate-spin w-8 h-8 mx-auto mb-4" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke={BRAND_GREEN} strokeWidth="3" opacity="0.2" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke={BRAND_GREEN} strokeWidth="3" strokeLinecap="round" />
        </svg>
        <p className="text-sm" style={{ color: TEXT_MUTED }}>대시보드를 불러오는 중...</p>
      </motion.div>
    </div>
  )
}

/** 에러 표시 컴포넌트 */
function ErrorDisplay({ message, onRetry }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5" style={{ backgroundColor: BACKGROUND_COLOR }}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center w-full"
        style={{ maxWidth: 448 }}
      >
        <div
          className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4"
          style={{ backgroundColor: 'rgba(255,68,68,0.15)' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              stroke="#FF4444"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="text-sm text-white mb-2">데이터를 불러올 수 없습니다</p>
        <p className="text-xs mb-6" style={{ color: TEXT_MUTED }}>{message}</p>
        <button
          onClick={onRetry}
          className="px-6 py-3 rounded-xl text-sm font-medium min-h-[44px]"
          style={{ backgroundColor: BRAND_GREEN, color: '#000000' }}
        >
          다시 시도
        </button>
      </motion.div>
    </div>
  )
}

/** CHANGED: 프리미엄/파트너 탭 전환 UI — availableTypes가 2개 이상일 때만 렌더링 */
function DashboardTabs({ availableTypes, activeTab, onTabChange }) {
  if (availableTypes.length < 2) return null

  return (
    <div
      className="flex rounded-xl p-1 mb-5"
      style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
    >
      {availableTypes.map((tabType) => {
        const isActive = activeTab === tabType
        const tabLabel = TAB_CONFIG[tabType]?.label || tabType
        return (
          <button
            key={tabType}
            onClick={() => onTabChange(tabType)}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all min-h-[40px]"
            style={{
              backgroundColor: isActive ? BRAND_GREEN : 'transparent',
              color: isActive ? '#000000' : TEXT_MUTED,
            }}
          >
            {tabLabel}
          </button>
        )
      })}
    </div>
  )
}

/** 대시보드 헤더 (캠핑장 이름 + 로그아웃) */
function DashboardHeader({ accommodationName, onLogout, activeTab, availableTypes }) {
  // CHANGED: 탭이 1개면 서브타이틀 표시, 2개면 탭 UI로 대체하므로 서브타이틀 간소화
  const subtitle = availableTypes.length < 2
    ? (activeTab === 'partner' ? '파트너 협찬 대시보드' : '프리미엄 협찬 대시보드')
    : '협찬 대시보드'

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-bold text-white truncate">{accommodationName}</h1>
        <p className="text-xs" style={{ color: TEXT_MUTED }}>{subtitle}</p>
      </div>
      <button
        onClick={onLogout}
        className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-medium shrink-0 min-h-[44px]"
        style={{
          backgroundColor: 'rgba(255,255,255,0.06)',
          color: TEXT_MUTED,
          border: `1px solid ${BORDER_COLOR}`,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path
            d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        로그아웃
      </button>
    </div>
  )
}

/** 입금 미확인 배너 (프리미엄 전용) */
function PaymentPendingBanner() {
  return (
    <motion.div
      className="rounded-xl px-4 py-3 mb-4 flex items-start gap-3"
      style={{
        backgroundColor: 'rgba(255,140,0,0.08)',
        border: '1px solid rgba(255,140,0,0.25)',
      }}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5">
        <path
          d="M12 9v4m0 4h.01M12 2L2 20h20L12 2z"
          stroke="#FF8C00"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p className="text-xs leading-relaxed" style={{ color: '#FF8C00' }}>
        입금이 아직 확인되지 않았습니다. 아래 신청 정보 카드를 확인 후 입금해주세요.
      </p>
    </motion.div>
  )
}

/** 하단 액션 버튼 영역 (프리미엄 전용: 인원 변경 + 환불 요청) */
function ActionButtons({ canRefund, isFullyRecruited, onModify, onRefund }) {
  return (
    <motion.div
      className="space-y-3 mt-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      <button
        onClick={onModify}
        disabled={isFullyRecruited}
        className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all"
        style={{
          backgroundColor: isFullyRecruited ? '#333333' : BRAND_GREEN,
          color: isFullyRecruited ? TEXT_MUTED : '#000000',
          cursor: isFullyRecruited ? 'not-allowed' : 'pointer',
        }}
      >
        {isFullyRecruited ? '모집 완료 — 변경 불가' : '인원 변경 요청'}
      </button>

      {canRefund && (
        <button
          onClick={onRefund}
          className="w-full py-3 rounded-xl text-sm font-medium transition-all"
          style={{
            backgroundColor: 'transparent',
            color: '#FF6B6B',
            border: '1px solid rgba(255,107,107,0.3)',
          }}
        >
          환불 요청
        </button>
      )}

      <p className="text-center text-xs pt-2" style={{ color: TEXT_MUTED }}>
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
    </motion.div>
  )
}

function DashboardPage() {
  const navigate = useNavigate()
  // CHANGED: useSearchParams로 ?tab= 쿼리파라미터 관리
  const [searchParams, setSearchParams] = useSearchParams()

  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [kakaoGuideType, setKakaoGuideType] = useState(null)
  const [showRefundModal, setShowRefundModal] = useState(false)

  // CHANGED: sessionStorage에서 사용 가능한 타입 목록 1회만 파싱 (매 렌더 JSON.parse 방지)
  const [availableTypes] = useState(() => getAvailableTypes())
  // CHANGED: 복수 프리미엄 recordId 배열 (단일 신청이면 null)
  const [premiumRecordIds] = useState(() => getPremiumRecordIds())

  // CHANGED: 현재 활성 탭 — URL ?tab= 파라미터 기반, 없으면 availableTypes 첫 번째
  const tabParam = searchParams.get('tab')
  const activeTab = (tabParam && availableTypes.includes(tabParam))
    ? tabParam
    : availableTypes[0] || 'premium'

  // CHANGED: 복수 프리미엄 신청 시 선택된 recordId — URL ?rid= 파라미터 기반
  const ridParam = searchParams.get('rid')
  const activeRecordId = (premiumRecordIds && ridParam && premiumRecordIds.includes(ridParam))
    ? ridParam
    : (premiumRecordIds ? premiumRecordIds[0] : null)

  /** CHANGED: 탭 전환 핸들러 — URL 쿼리파라미터 업데이트 */
  const handleTabChange = useCallback((newTab) => {
    setSearchParams({ tab: newTab }, { replace: true })
  }, [setSearchParams])

  /** CHANGED: 복수 프리미엄 신청 건 전환 핸들러 */
  const handleRecordChange = useCallback((rid) => {
    setSearchParams({ tab: 'premium', rid }, { replace: true })
  }, [setSearchParams])

  /** 대시보드 데이터 로드 — activeTab에 따라 다른 API 호출 */
  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = activeTab === 'partner'
        ? await fetchPartnerData()
        : await fetchDashboardData(activeRecordId)
      setDashboardData(data)
    } catch (fetchError) {
      if (fetchError.message.includes('인증이 만료')) {
        navigate('/dashboard/login', { replace: true })
        return
      }
      setError(fetchError.message)
    } finally {
      setLoading(false)
    }
  }, [navigate, activeTab, activeRecordId])

  // 인증 확인 + 데이터 로드
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/dashboard/login', { replace: true })
      return
    }
    loadData()
  }, [navigate, loadData])

  /** 로그아웃 */
  const handleLogout = useCallback(() => {
    clearAuth()
    navigate('/dashboard/login', { replace: true })
  }, [navigate])

  const handleOpenModify = useCallback(() => {
    setKakaoGuideType('modify')
  }, [])

  const handleOpenRefund = useCallback(() => {
    setShowRefundModal(true)
  }, [])

  const handleCloseRefundModal = useCallback(() => {
    setShowRefundModal(false)
  }, [])

  const handleCloseKakaoGuide = useCallback(() => {
    setKakaoGuideType(null)
  }, [])

  // 로딩 상태
  if (loading) {
    return <LoadingSpinner />
  }

  // 에러 상태
  if (error) {
    return <ErrorDisplay message={error} onRetry={loadData} />
  }

  // 데이터 없음
  if (!dashboardData) {
    return <ErrorDisplay message="대시보드 데이터가 없습니다." onRetry={loadData} />
  }

  const accommodationName = getAccommodationName()
    || dashboardData?.application?.accommodationName
    || dashboardData?.campaign?.accommodationName
    || '캠핑장'

  return (
    <div className="min-h-screen pb-8" style={{ backgroundColor: BACKGROUND_COLOR }}>
      <div className="w-full mx-auto px-5 pt-6" style={{ maxWidth: 448 }}>
        {/* 헤더 */}
        <DashboardHeader
          accommodationName={accommodationName}
          onLogout={handleLogout}
          activeTab={activeTab}
          availableTypes={availableTypes}
        />

        {/* CHANGED: 탭 전환 UI — availableTypes가 2개 이상일 때만 */}
        <DashboardTabs
          availableTypes={availableTypes}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        {/* CHANGED: activeTab에 따라 콘텐츠 분기 */}
        <AnimatePresence mode="wait">
          {activeTab === 'partner' ? (
            <motion.div
              key="partner-content"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <PartnerDashboardContent
                dashboardData={dashboardData}
              />
            </motion.div>
          ) : (
            <motion.div
              key="premium-content"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <PremiumDashboardContent
                dashboardData={dashboardData}
                accommodationName={accommodationName}
                onModify={handleOpenModify}
                onRefund={handleOpenRefund}
                premiumRecordIds={premiumRecordIds}
                activeRecordId={activeRecordId}
                onRecordChange={handleRecordChange}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 프리미엄 전용 모달/시트 */}
      <AnimatePresence>
        {kakaoGuideType && (
          <KakaoGuideSheet
            type={kakaoGuideType}
            accommodationName={accommodationName}
            onClose={handleCloseKakaoGuide}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRefundModal && (
          <RefundFlowModal
            recruitment={dashboardData?.recruitment}
            totalAssigned={dashboardData?.totalAssigned}
            accommodationName={accommodationName}
            onClose={handleCloseRefundModal}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

/** CHANGED: 복수 프리미엄 신청 건 선택 칩 — 선택예산으로 구분 표시 */
function PremiumRecordSelector({ recordIds, activeRecordId, budgetLabels, onSelect }) {
  if (!recordIds || recordIds.length < 2) return null

  return (
    <div className="mb-4">
      <p className="text-xs mb-2" style={{ color: TEXT_MUTED }}>신청 건 선택</p>
      <div className="flex gap-2 flex-wrap">
        {recordIds.map((rid, idx) => {
          const isActive = rid === activeRecordId
          const label = budgetLabels?.[rid] || `${idx + 1}차 신청`
          return (
            <button
              key={rid}
              onClick={() => onSelect(rid)}
              className="px-3 py-2 rounded-lg text-xs font-medium transition-all min-h-[36px]"
              style={{
                backgroundColor: isActive ? `${BRAND_GREEN}20` : 'rgba(255,255,255,0.06)',
                border: `1px solid ${isActive ? BRAND_GREEN : BORDER_COLOR}`,
                color: isActive ? BRAND_GREEN : TEXT_MUTED,
              }}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** CHANGED: 프리미엄 대시보드 콘텐츠 — DashboardPage에서 분리 */
function PremiumDashboardContent({ dashboardData, accommodationName, onModify, onRefund, premiumRecordIds, activeRecordId, onRecordChange }) {
  const {
    application,
    recruitment,
    totalRequested,
    totalAssigned,
    creators,
    canRefund,
    isFullyRecruited,
  } = dashboardData

  const paymentConfirmed = application?.paymentConfirmed === true

  // 복수 신청: 활성 레코드는 실제 예산으로 표시, 나머지는 순번으로 표시
  const budgetLabels = premiumRecordIds
    ? Object.fromEntries(premiumRecordIds.map((rid, idx) => {
      if (rid === activeRecordId && application?.selectedBudget) {
        return [rid, `${application.selectedBudget}`]
      }
      return [rid, `${idx + 1}차 신청`]
    }))
    : null

  return (
    <>
      {/* CHANGED: 복수 프리미엄 신청 건 선택 칩 */}
      <PremiumRecordSelector
        recordIds={premiumRecordIds}
        activeRecordId={activeRecordId}
        budgetLabels={budgetLabels}
        onSelect={onRecordChange}
      />

      {!paymentConfirmed && <PaymentPendingBanner />}

      <div className="space-y-4">
        <StatusCard application={application} />
        <RecruitmentProgress
          recruitment={recruitment}
          totalRequested={totalRequested}
          totalAssigned={totalAssigned}
        />
        <CreatorList creators={creators} />
      </div>

      <ActionButtons
        canRefund={canRefund}
        isFullyRecruited={isFullyRecruited}
        onModify={onModify}
        onRefund={onRefund}
      />
    </>
  )
}

/** CHANGED: 파트너 대시보드 콘텐츠 — DashboardPage에서 분리 */
function PartnerDashboardContent({ dashboardData }) {
  const { campaign, creators } = dashboardData

  return (
    <>
      <div className="space-y-4">
        <PartnerStatusCard campaign={campaign} />
        <PartnerCreatorList creators={creators} />
      </div>

      <PartnerActionButtons />
    </>
  )
}

export default function DashboardPageWithErrorBoundary(props) {
  return (
    <DashboardErrorBoundary>
      <DashboardPage {...props} />
    </DashboardErrorBoundary>
  )
}
