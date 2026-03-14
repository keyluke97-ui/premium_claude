// DashboardPage.jsx - 캠지기 대시보드 메인 페이지 (신청 현황 + 모집 진행률 + 크리에이터 목록)

import { Component, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  fetchDashboardData,
  getAccommodationName,
  isAuthenticated,
  clearAuth,
} from '../../utils/dashboardApi'
import StatusCard from './components/StatusCard'
import RecruitmentProgress from './components/RecruitmentProgress'
import CreatorList from './components/CreatorList'
import ModifyCrewModal from './components/ModifyCrewModal' // CHANGED: Task 5c - 모달 import 추가
import RefundModal from './components/RefundModal' // CHANGED: Task 5c - 모달 import 추가
// CHANGED: M-2 - 인라인 토큰 제거, 공통 designTokens에서 import
import { BRAND_GREEN, BACKGROUND_COLOR, TEXT_MUTED, BORDER_COLOR } from '../../constants/designTokens'

// CHANGED: M-4 - 예기치 않은 렌더링 에러를 잡는 Error Boundary 추가
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
            className="px-6 py-2.5 rounded-xl text-sm font-medium"
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
          className="px-6 py-2.5 rounded-xl text-sm font-medium"
          style={{ backgroundColor: BRAND_GREEN, color: '#000000' }}
        >
          다시 시도
        </button>
      </motion.div>
    </div>
  )
}

/** 대시보드 헤더 (캠핑장 이름 + 로그아웃) */
function DashboardHeader({ accommodationName, onLogout }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-bold text-white truncate">{accommodationName}</h1>
        <p className="text-xs" style={{ color: TEXT_MUTED }}>프리미엄 협찬 대시보드</p>
      </div>
      <button
        onClick={onLogout}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0"
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

/** 하단 액션 버튼 영역 (인원 변경 + 환불 요청) */
function ActionButtons({ canRefund, isFullyRecruited, onModify, onRefund }) {
  return (
    <motion.div
      className="space-y-3 mt-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      {/* 인원 변경 버튼 */}
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

      {/* 환불 요청 버튼 */}
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

      {/* 하단 안내 */}
      <p className="text-center text-xs pt-2" style={{ color: TEXT_MUTED }}>
        문의사항은{' '}
        <a
          href="https://pf.kakao.com/_Cxfnxfxj"
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
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModifyModal, setShowModifyModal] = useState(false)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [inlineError, setInlineError] = useState('') // CHANGED: 모달 열기 실패 등 인라인 에러용

  /** 대시보드 데이터 로드 */
  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await fetchDashboardData()
      setDashboardData(data)
    } catch (error) {
      if (error.message.includes('인증이 만료')) {
        navigate('/dashboard/login', { replace: true })
        return
      }
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [navigate])

  // CHANGED: C-1 - 두 개의 useEffect를 하나로 통합 (인증 확인 → 데이터 로드 순서 보장, 레이스 컨디션 제거)
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

  /** 데이터 새로고침 (모달에서 변경 후 호출) */
  const handleDataRefresh = useCallback(() => {
    loadData()
  }, [loadData])

  // CHANGED: 인원 변경 모달 열기 전에 최신 데이터 re-fetch (Race Condition 방지)
  const handleOpenModifyModal = useCallback(async () => {
    setInlineError('')
    try {
      const freshData = await fetchDashboardData()
      setDashboardData(freshData)

      // CHANGED: 최신 데이터 기준으로 모집 완료 여부 재확인
      if (freshData.isFullyRecruited) {
        setInlineError('모집이 완료되어 인원 변경이 불가합니다.')
        return
      }
      setShowModifyModal(true)
    } catch (fetchError) {
      if (fetchError.message.includes('인증이 만료')) {
        navigate('/dashboard/login', { replace: true })
        return
      }
      setInlineError('최신 데이터를 불러오지 못했습니다. 다시 시도해주세요.')
    }
  }, [navigate])

  // CHANGED: 환불 모달도 열기 전 canRefund 재확인
  const handleOpenRefundModal = useCallback(async () => {
    setInlineError('')
    try {
      const freshData = await fetchDashboardData()
      setDashboardData(freshData)

      if (!freshData.canRefund) {
        setInlineError('모집이 완료되어 환불이 불가합니다.')
        return
      }
      setShowRefundModal(true)
    } catch (fetchError) {
      if (fetchError.message.includes('인증이 만료')) {
        navigate('/dashboard/login', { replace: true })
        return
      }
      setInlineError('최신 데이터를 불러오지 못했습니다. 다시 시도해주세요.')
    }
  }, [navigate])

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

  const {
    application,
    recruitment,
    totalRequested,
    totalAssigned,
    creators,
    canRefund,
    isFullyRecruited,
  } = dashboardData

  const accommodationName = getAccommodationName() || application?.accommodationName || '캠핑장'

  return (
    <div className="min-h-screen pb-8" style={{ backgroundColor: BACKGROUND_COLOR }}>
      <div className="w-full mx-auto px-5 pt-6" style={{ maxWidth: 448 }}>
        {/* 헤더 */}
        <DashboardHeader
          accommodationName={accommodationName}
          onLogout={handleLogout}
        />

        {/* 카드 영역 */}
        <div className="space-y-4">
          {/* 신청 정보 카드 */}
          <StatusCard application={application} />

          {/* 모집 현황 카드 */}
          <RecruitmentProgress
            recruitment={recruitment}
            totalRequested={totalRequested}
            totalAssigned={totalAssigned}
          />

          {/* 배정 크리에이터 목록 */}
          <CreatorList creators={creators} />
        </div>

        {/* 액션 버튼 */}
        {/* CHANGED: 인라인 에러 배너 (모달 열기 실패 시 표시) */}
        {inlineError && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-xl px-4 py-3"
            style={{
              backgroundColor: 'rgba(255,68,68,0.1)',
              border: '1px solid rgba(255,68,68,0.25)',
            }}
          >
            <p className="text-sm" style={{ color: '#FF4444' }}>{inlineError}</p>
          </motion.div>
        )}

        {/* CHANGED: 모달 열기 전 최신 데이터 re-fetch 핸들러로 교체 */}
        <ActionButtons
          canRefund={canRefund}
          isFullyRecruited={isFullyRecruited}
          onModify={handleOpenModifyModal}
          onRefund={handleOpenRefundModal}
        />
      </div>

      {/* 모달 영역 */}
      <AnimatePresence>
        {showModifyModal && (
          <ModifyCrewModal
            application={application}
            recruitment={recruitment}
            onClose={() => setShowModifyModal(false)}
            onSuccess={handleDataRefresh}
          />
        )}
        {showRefundModal && (
          <RefundModal
            totalRequested={totalRequested}
            totalAssigned={totalAssigned}
            onClose={() => setShowRefundModal(false)}
            onSuccess={handleDataRefresh}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// CHANGED: M-4 - DashboardErrorBoundary로 감싼 래퍼를 default export
export default function DashboardPageWithErrorBoundary(props) {
  return (
    <DashboardErrorBoundary>
      <DashboardPage {...props} />
    </DashboardErrorBoundary>
  )
}
