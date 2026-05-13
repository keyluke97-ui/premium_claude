// ReportPage.jsx - 모집 부진 캠핑장 진단 리포트
// 마스터-디테일: 리스트 → 클릭 시 캠핑장 진단 카드 (가격/매력/시간 3축)
// 임계값 토글: 0%만 / <30% / <50% / <80%
// 추세 카드: 신청 후 경과일 버킷별 평균 모집률 (전체 53건 기준)

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchReport } from '../../utils/reportApi'
import {
  BRAND_GREEN,
  BACKGROUND_COLOR,
  CARD_BACKGROUND,
  TEXT_MUTED,
  BORDER_COLOR,
  DESTRUCTIVE_COLOR,
} from '../../constants/designTokens'

const WARN_ORANGE = '#FF8C00'

const THRESHOLD_OPTIONS = [
  { value: 0, label: '0%만' },
  { value: 0.3, label: '<30%' },
  { value: 0.5, label: '<50%' },
  { value: 0.8, label: '<80%' },
]

function formatWon(value) {
  return `${(value || 0).toLocaleString()}원`
}

function SeverityChip({ severity }) {
  const styleMap = {
    high: { color: DESTRUCTIVE_COLOR, bg: 'rgba(255,107,107,0.12)', label: '높음' },
    medium: { color: WARN_ORANGE, bg: 'rgba(255,140,0,0.12)', label: '중간' },
    low: { color: TEXT_MUTED, bg: 'rgba(255,255,255,0.06)', label: '낮음' },
  }
  const s = styleMap[severity] || styleMap.low
  return (
    <span
      className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
      style={{ color: s.color, backgroundColor: s.bg }}
    >
      {s.label}
    </span>
  )
}

function ScorePill({ score }) {
  const color = score >= 67 ? BRAND_GREEN : score >= 34 ? WARN_ORANGE : DESTRUCTIVE_COLOR
  return (
    <span
      className="text-xs px-2 py-1 rounded-md font-semibold"
      style={{ color, backgroundColor: `${color}15` }}
    >
      매력 {score}점
    </span>
  )
}

function PaymentBadge({ paid }) {
  return (
    <span
      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
      style={{
        color: paid ? BRAND_GREEN : WARN_ORANGE,
        backgroundColor: paid ? `${BRAND_GREEN}15` : 'rgba(255,140,0,0.12)',
      }}
    >
      {paid ? '입금완료' : '미입금'}
    </span>
  )
}

function CampsiteRow({ camp, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl px-4 py-3.5 transition-all"
      style={{ backgroundColor: CARD_BACKGROUND, border: `1px solid ${BORDER_COLOR}` }}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-sm font-semibold text-white truncate flex-1">{camp.name}</span>
        <PaymentBadge paid={camp.paymentConfirmed} />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: TEXT_MUTED }}>
          {camp.region} · {camp.daysSinceCreated != null ? `${camp.daysSinceCreated}일 경과` : '신청일 미상'} · 요청 {camp.requested}명
        </p>
        <ScorePill score={camp.attraction.score} />
      </div>
    </button>
  )
}

function GradePriceRow({ label, mine, avg, requested, deltaPct, isBelow }) {
  if (requested <= 0) return null
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0" style={{ borderColor: BORDER_COLOR }}>
      <span className="text-xs text-white">{label} ({requested}명)</span>
      <div className="text-right">
        <div className="text-xs text-white font-medium">
          {formatWon(mine)}
          {avg > 0 && (
            <span className="ml-2" style={{ color: isBelow ? DESTRUCTIVE_COLOR : BRAND_GREEN }}>
              {isBelow ? '▼' : '▲'} {Math.abs(deltaPct)}%
            </span>
          )}
        </div>
        {avg > 0 && (
          <div className="text-[10px]" style={{ color: TEXT_MUTED }}>
            전체 평균 {formatWon(avg)}
          </div>
        )}
      </div>
    </div>
  )
}

function CheckRow({ ok, label, value }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <span style={{ color: ok ? BRAND_GREEN : DESTRUCTIVE_COLOR }}>{ok ? '✓' : '✗'}</span>
        <span className="text-xs text-white">{label}</span>
      </div>
      {value !== undefined && (
        <span className="text-[11px]" style={{ color: TEXT_MUTED }}>
          {value}
        </span>
      )}
    </div>
  )
}

function SectionCard({ title, children }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ backgroundColor: CARD_BACKGROUND, border: `1px solid ${BORDER_COLOR}` }}
    >
      <p className="text-xs font-semibold mb-3" style={{ color: TEXT_MUTED }}>
        {title}
      </p>
      {children}
    </div>
  )
}

function DiagnosticDetail({ camp, onBack }) {
  const { price, attraction, recommendations } = camp

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={onBack}
          className="p-2 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
          style={{ color: TEXT_MUTED }}
          aria-label="목록으로"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-white truncate">{camp.name}</h2>
          <p className="text-xs" style={{ color: TEXT_MUTED }}>
            {camp.region} · 요청 {camp.requested}명 · 매칭 0건
          </p>
        </div>
        <PaymentBadge paid={camp.paymentConfirmed} />
      </div>

      {/* 메타 라인 */}
      <div
        className="rounded-xl p-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px]"
        style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
      >
        {camp.plan && (
          <span style={{ color: TEXT_MUTED }}>
            플랜 <span className="text-white">{camp.plan}</span>
          </span>
        )}
        {camp.budget && (
          <span style={{ color: TEXT_MUTED }}>
            예산 <span className="text-white">{camp.budget}</span>
          </span>
        )}
        {camp.isDiscounted && (
          <span style={{ color: BRAND_GREEN }}>첫 신청 할인 적용</span>
        )}
        {camp.balance > 0 && (
          <span style={{ color: TEXT_MUTED }}>
            잔액 <span className="text-white">{formatWon(camp.balance)}</span>
          </span>
        )}
      </div>

      {/* ① 가격 진단 */}
      <SectionCard title="① 가격 경쟁력 (등급별 단가 vs 전체 평균)">
        <GradePriceRow
          label="⭐️ 아이콘"
          mine={price.icon.mine}
          avg={price.icon.avg}
          requested={price.icon.requested}
          deltaPct={price.icon.deltaPct}
          isBelow={price.icon.isBelow}
        />
        <GradePriceRow
          label="✔️ 파트너"
          mine={price.partner.mine}
          avg={price.partner.avg}
          requested={price.partner.requested}
          deltaPct={price.partner.deltaPct}
          isBelow={price.partner.isBelow}
        />
        <GradePriceRow
          label="🔥 라이징"
          mine={price.rising.mine}
          avg={price.rising.avg}
          requested={price.rising.requested}
          deltaPct={price.rising.deltaPct}
          isBelow={price.rising.isBelow}
        />
        {!price.anyBelow && (
          <p className="text-[11px] mt-2" style={{ color: BRAND_GREEN }}>
            모든 등급 단가가 평균 이상 — 가격 요인 아님
          </p>
        )}
      </SectionCard>

      {/* ② 매력 진단 */}
      <SectionCard title={`② 매력 진단 (점수 ${attraction.score}/100)`}>
        <CheckRow
          ok={attraction.checks.featureOk}
          label="특장점 텍스트"
          value={`${attraction.featureLength}자 / 평균 ${attraction.avgFeatureLength}자`}
        />
        <CheckRow ok={attraction.checks.photoOk} label="숙소 전경 사진" />
        <CheckRow ok={attraction.checks.linkOk} label="캠핏 상세페이지 링크" />
        <CheckRow
          ok={attraction.checks.facilityOk}
          label="부대시설"
          value={`${attraction.facilityCount}개`}
        />
        <CheckRow
          ok={attraction.checks.viewpointOk}
          label="뷰/포인트 요소"
          value={`${attraction.viewpointCount}개`}
        />
        <CheckRow
          ok={attraction.checks.siteTypeOk}
          label="사이트 종류"
          value={`${attraction.siteTypeCount}개`}
        />
      </SectionCard>

      {/* ③ 시간 진단 */}
      <SectionCard title="③ 시간 진단">
        <div className="flex items-center justify-between py-1.5">
          <span className="text-xs text-white">신청 후 경과</span>
          <span
            className="text-xs font-medium"
            style={{
              color:
                camp.daysSinceCreated != null && camp.daysSinceCreated >= 14
                  ? DESTRUCTIVE_COLOR
                  : 'white',
            }}
          >
            {camp.daysSinceCreated != null ? `${camp.daysSinceCreated}일` : '미상'}
          </span>
        </div>
        <div className="flex items-center justify-between py-1.5">
          <span className="text-xs text-white">콘텐츠 기한까지</span>
          <span
            className="text-xs font-medium"
            style={{
              color:
                camp.daysUntilDeadline != null && camp.daysUntilDeadline >= 0 && camp.daysUntilDeadline < 14
                  ? WARN_ORANGE
                  : 'white',
            }}
          >
            {camp.daysUntilDeadline == null
              ? '미상'
              : camp.daysUntilDeadline < 0
              ? `${Math.abs(camp.daysUntilDeadline)}일 초과`
              : `${camp.daysUntilDeadline}일`}
          </span>
        </div>
        {camp.regionAvgRecruitRate > 0 && (
          <div className="flex items-center justify-between py-1.5">
            <span className="text-xs text-white">{camp.region} 평균 모집률</span>
            <span className="text-xs font-medium text-white">
              {Math.round(camp.regionAvgRecruitRate * 100)}%
            </span>
          </div>
        )}
      </SectionCard>

      {/* ④ 권장 액션 */}
      <SectionCard title="④ 권장 액션">
        {recommendations.length === 0 ? (
          <p className="text-xs" style={{ color: TEXT_MUTED }}>
            특이 진단 없음
          </p>
        ) : (
          <div className="space-y-2">
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="rounded-lg p-3"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${BORDER_COLOR}`,
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-xs font-semibold text-white">{rec.label}</p>
                  <SeverityChip severity={rec.severity} />
                </div>
                {rec.detail && (
                  <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
                    {rec.detail}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* 캠지기 비고 */}
      {camp.notes && (
        <SectionCard title="캠지기 비고">
          <p className="text-xs whitespace-pre-wrap" style={{ color: TEXT_MUTED }}>
            {camp.notes}
          </p>
        </SectionCard>
      )}
    </motion.div>
  )
}

/** 추세 카드 — 신청 후 경과일 버킷별 평균 모집률 가로 바 차트 */
function TrendCard({ trend }) {
  const hasData = trend && trend.some((b) => b.n > 0)
  if (!hasData) return null

  return (
    <SectionCard title="📈 신청 후 경과일별 평균 모집률 (전체 기준)">
      <div className="space-y-2.5">
        {trend.map((b) => {
          const pct = Math.round(b.avgRate * 100)
          const isEmpty = b.n === 0
          const color = pct >= 67 ? BRAND_GREEN : pct >= 34 ? WARN_ORANGE : DESTRUCTIVE_COLOR
          return (
            <div key={b.bucket}>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-white">
                  {b.bucket}{' '}
                  <span style={{ color: TEXT_MUTED }}>({b.n}건)</span>
                </span>
                <span className="font-semibold" style={{ color: isEmpty ? TEXT_MUTED : color }}>
                  {isEmpty ? '—' : `${pct}%`}
                </span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
              >
                {!isEmpty && (
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.max(2, pct)}%`, backgroundColor: color }}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-[10px] mt-3" style={{ color: TEXT_MUTED }}>
        같은 신청 경과일대 평균과 비교해서, 우리 캠핑장이 뒤처지는지 한눈에 확인용
      </p>
    </SectionCard>
  )
}

/** 임계값 토글 버튼 그룹 */
function ThresholdToggle({ value, onChange }) {
  return (
    <div
      className="flex rounded-xl p-1 mb-4"
      style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
    >
      {THRESHOLD_OPTIONS.map((opt) => {
        const isActive = value === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="flex-1 py-2 rounded-lg text-xs font-medium transition-all min-h-[36px]"
            style={{
              backgroundColor: isActive ? BRAND_GREEN : 'transparent',
              color: isActive ? '#000000' : TEXT_MUTED,
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export default function ReportPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedRecordId, setSelectedRecordId] = useState(null)
  const [threshold, setThreshold] = useState(0)

  const loadData = useCallback(async (t) => {
    setLoading(true)
    setError('')
    try {
      const result = await fetchReport(t)
      setData(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData(threshold)
  }, [threshold, loadData])

  const handleThresholdChange = useCallback((next) => {
    setSelectedRecordId(null)
    setThreshold(next)
  }, [])

  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-5"
        style={{ backgroundColor: BACKGROUND_COLOR }}
      >
        <svg className="animate-spin w-8 h-8 mb-3" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke={BRAND_GREEN} strokeWidth="3" opacity="0.2" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke={BRAND_GREEN} strokeWidth="3" strokeLinecap="round" />
        </svg>
        <p className="text-xs" style={{ color: TEXT_MUTED }}>리포트를 불러오는 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-5"
        style={{ backgroundColor: BACKGROUND_COLOR }}
      >
        <p className="text-sm text-white mb-2">리포트를 불러올 수 없습니다</p>
        <p className="text-xs mb-6" style={{ color: TEXT_MUTED }}>{error}</p>
        <button
          onClick={() => loadData(threshold)}
          className="px-6 py-3 rounded-xl text-sm font-medium"
          style={{ backgroundColor: BRAND_GREEN, color: '#000000' }}
        >
          다시 시도
        </button>
      </div>
    )
  }

  if (!data) return null

  const selected = selectedRecordId
    ? data.campsites.find((c) => c.recordId === selectedRecordId)
    : null

  const thresholdLabel = THRESHOLD_OPTIONS.find((o) => o.value === threshold)?.label || ''
  const emptyText = threshold === 0
    ? '모집률 0%인 캠핑장이 없습니다.'
    : `모집률 ${thresholdLabel} 캠핑장이 없습니다.`

  return (
    <div className="min-h-screen pb-8" style={{ backgroundColor: BACKGROUND_COLOR }}>
      <div className="w-full mx-auto px-5 pt-6" style={{ maxWidth: 448 }}>
        {/* 헤더 */}
        <div className="mb-4">
          <h1 className="text-lg font-bold text-white">모집 부진 리포트</h1>
          <p className="text-xs" style={{ color: TEXT_MUTED }}>
            전체 {data.totalCampsites}건 중 {thresholdLabel}{' '}
            <span className="text-white font-semibold">{data.filteredCount}건</span>
          </p>
        </div>

        <AnimatePresence mode="wait">
          {selected ? (
            <DiagnosticDetail
              key="detail"
              camp={selected}
              onBack={() => setSelectedRecordId(null)}
            />
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              {/* 임계값 토글 */}
              <ThresholdToggle value={threshold} onChange={handleThresholdChange} />

              {/* 추세 카드 */}
              <TrendCard trend={data.trend} />

              {/* 캠핑장 리스트 */}
              <div className="space-y-2">
                {data.campsites.length === 0 ? (
                  <div
                    className="rounded-xl p-6 text-center"
                    style={{ backgroundColor: CARD_BACKGROUND, border: `1px solid ${BORDER_COLOR}` }}
                  >
                    <p className="text-sm text-white mb-1">🎉 해당 임계값 충족 캠핑장 없음</p>
                    <p className="text-xs" style={{ color: TEXT_MUTED }}>{emptyText}</p>
                  </div>
                ) : (
                  data.campsites.map((camp) => (
                    <CampsiteRow
                      key={camp.recordId}
                      camp={camp}
                      onClick={() => setSelectedRecordId(camp.recordId)}
                    />
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
