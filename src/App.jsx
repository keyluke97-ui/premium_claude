// App.jsx - 라우터 래퍼. 기존 퍼널과 대시보드를 분리하는 최소 엔트리포인트.
import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'

const FunnelPage = lazy(() => import('./pages/FunnelPage'))
const LoginPage = lazy(() => import('./pages/dashboard/LoginPage'))
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'))

function LoadingFallback() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: '#111111' }}
    >
      <div
        className="w-8 h-8 border-2 rounded-full animate-spin"
        style={{ borderColor: 'rgba(255,255,255,0.1)', borderTopColor: '#01DF82' }}
      />
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* 기존 퍼널 (변경 없음) */}
        <Route path="/" element={<FunnelPage />} />

        {/* 캠지기 대시보드 */}
        <Route path="/dashboard/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* 그 외 경로는 퍼널로 리다이렉트 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
