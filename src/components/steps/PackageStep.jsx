// PackageStep.jsx - 플랜 선택 단계 (등급별 단가 breakdown + TierSummaryBar 포함)
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, CheckCircle, Minus, Plus, Settings2, HelpCircle, Zap, Star, TrendingUp } from 'lucide-react'
import PACKAGES, { PRICING, calcCrewPrice, calcCrewPriceWithVat } from '../../data/packages'
import CreatorGuideSheet from '../CreatorGuideSheet'

function formatPrice(number) {
  return number.toLocaleString('ko-KR') + '원'
}

function formatPriceShort(number) {
  if (number >= 10000) {
    return (number / 10000) + '만'
  }
  return number.toLocaleString('ko-KR')
}

const MAX_CREW_PER_TIER = 10

// CHANGED: 등급별 색상 매핑 추가
const TIER_COLORS = {
  icon: '#FF383C',
  partner: '#1975FF',
  rising: '#01DF82',
}

// CHANGED: 등급별 아이콘 매핑 추가
const TIER_ICONS = {
  icon: Zap,
  partner: Star,
  rising: TrendingUp,
}

// CHANGED: 등급별 단가 요약 바 컴포넌트
function TierSummaryBar() {
  return (
    <div
      className="flex items-center justify-between rounded-xl px-4 py-3 mb-5"
      style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {Object.entries(PRICING).map(([key, tier], index) => {
        const TierIcon = TIER_ICONS[key]
        const tierColor = TIER_COLORS[key]
        return (
          <div key={key} className="flex items-center gap-1.5">
            {index > 0 && (
              <span className="mr-2 text-xs" style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
            )}
            <TierIcon size={13} color={tierColor} />
            <span className="text-xs font-semibold" style={{ color: tierColor }}>{tier.label}</span>
            <span className="text-xs font-bold text-white">{formatPriceShort(tier.price)}</span>
          </div>
        )
      })}
    </div>
  )
}

// CHANGED: 플랜 카드 내 등급별 단가 breakdown 라인 컴포넌트
function BreakdownLine({ crew }) {
  if (!crew) return null

  const parts = Object.entries(crew)
    .filter(([, count]) => count > 0)
    .map(([tier, count]) => {
      const tierData = PRICING[tier]
      const tierColor = TIER_COLORS[tier]
      return { tier, count, label: tierData.label, unitPrice: tierData.price, tierColor }
    })

  if (parts.length === 0) return null

  return (
    <div
      className="flex flex-wrap items-center gap-x-1.5 gap-y-1 mt-1 text-xs"
      style={{ color: 'rgba(255,255,255,0.35)' }}
    >
      {parts.map((part, index) => (
        <span key={part.tier} className="flex items-center gap-0.5">
          {index > 0 && <span className="mr-0.5">+</span>}
          <span style={{ color: part.tierColor, fontWeight: 600 }}>{part.label}</span>
          <span>{formatPriceShort(part.unitPrice)}</span>
          <span>×{part.count}</span>
        </span>
      ))}
    </div>
  )
}

// 인원 카운터 컴포넌트
function Counter({ label, price, value, onChange, emoji }) {
  const atMax = value >= MAX_CREW_PER_TIER
  return (
    <div
      className="flex items-center justify-between py-3 px-4 rounded-xl"
      style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-center gap-3">
        <span className="text-lg">{emoji}</span>
        <div>
          <div className="text-sm font-semibold text-white">{label}</div>
          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {formatPrice(price)}/명
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{
            backgroundColor: value > 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
            border: 'none',
            cursor: value > 0 ? 'pointer' : 'default',
            color: value > 0 ? '#fff' : 'rgba(255,255,255,0.2)',
          }}
        >
          <Minus size={14} />
        </button>
        <span className="text-lg font-bold text-white w-6 text-center">{value}</span>
        <button
          onClick={() => !atMax && onChange(value + 1)}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{
            backgroundColor: atMax ? 'rgba(255,255,255,0.08)' : '#01DF82',
            border: 'none',
            cursor: atMax ? 'not-allowed' : 'pointer',
            color: atMax ? 'rgba(255,255,255,0.3)' : '#000',
          }}
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  )
}

export default function PackageStep({ budget, selected, onSelect, customCrew, onCustomCrewChange }) {
  const pkg = PACKAGES[budget]
  const isDirectCustom = budget === 'custom'
  const [isCustom, setIsCustom] = useState(selected?.id === 'custom')
  const [showGuide, setShowGuide] = useState(false)

  if (!pkg && !isDirectCustom) return null

  const handleCustomToggle = () => {
    setIsCustom(true)
    const crew = customCrew || { icon: 0, partner: 0, rising: 0 }
    onCustomCrewChange(crew)
    onSelect({
      id: 'custom',
      name: '직접 선택할게요',
      crew,
    })
  }

  const handleCrewChange = (tier, value) => {
    const newCrew = { ...customCrew, [tier]: value }
    onCustomCrewChange(newCrew)
    onSelect({
      id: 'custom',
      name: '직접 선택할게요',
      crew: newCrew,
    })
  }

  const handlePlanSelect = (plan) => {
    setIsCustom(false)
    onSelect(plan)
  }

  const customTotal = customCrew ? calcCrewPrice(customCrew) : 0
  const customTotalWithVat = customCrew ? calcCrewPriceWithVat(customCrew) : 0
  const customHeadcount = customCrew ? (customCrew.icon + customCrew.partner + customCrew.rising) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="px-5 pt-8 pb-6"
    >
      <h2 className="text-2xl font-extrabold text-white leading-tight mb-2">
        {isDirectCustom ? '크리에이터를 직접 구성해보세요' : '어떤 플랜이 끌리시나요?'}
      </h2>
      <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>
        {isDirectCustom
          ? '등급별 인원과 금액을 자유롭게 설정하세요'
          : `${pkg.subtitle}에 딱 맞는 플랜이에요`}
      </p>

      {/* 크리에이터 등급 안내 버튼 */}
      <button
        onClick={() => setShowGuide(true)}
        className="flex items-center gap-1.5 mb-5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
        style={{
          backgroundColor: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.55)',
          cursor: 'pointer',
        }}
      >
        <HelpCircle size={14} />
        크리에이터 등급이 뭔가요?
      </button>

      <CreatorGuideSheet open={showGuide} onClose={() => setShowGuide(false)} />

      {/* CHANGED: 등급별 단가 요약 바 추가 */}
      <TierSummaryBar />

      {/* 직접 선택 모드: 크루 카운터만 표시 */}
      {isDirectCustom && (
        <div className="flex flex-col gap-3">
          <Counter
            label="아이콘 크리에이터"
            price={PRICING.icon.price}
            value={customCrew.icon}
            onChange={(v) => handleCrewChange('icon', v)}
            emoji="⭐️"
          />
          <Counter
            label="파트너 크리에이터"
            price={PRICING.partner.price}
            value={customCrew.partner}
            onChange={(v) => handleCrewChange('partner', v)}
            emoji="✔️"
          />
          <Counter
            label="라이징 크리에이터"
            price={PRICING.rising.price}
            value={customCrew.rising}
            onChange={(v) => handleCrewChange('rising', v)}
            emoji="🔥"
          />

          {customHeadcount > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 rounded-xl mt-1"
              style={{ backgroundColor: 'rgba(114,124,245,0.08)', border: '1px solid rgba(114,124,245,0.2)' }}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>총 인원</span>
                <span className="text-sm font-bold text-white">{customHeadcount}명</span>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>금액 (VAT 별도)</span>
                <span className="text-base font-bold" style={{ color: '#727CF5' }}>{formatPrice(customTotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>실 입금 금액 (VAT 포함)</span>
                <span className="text-sm font-semibold" style={{ color: '#01DF82' }}>{formatPrice(customTotalWithVat)}</span>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* 일반 모드: 사전 플랜 + 직접 선택 */}
      {!isDirectCustom && <div className="flex flex-col gap-4">
        {/* 기존 플랜 목록 */}
        {pkg.plans.map((plan, planIndex) => {
          const isSelected = !isCustom && selected?.id === plan.id
          const PlanIcon = plan.Icon
          return (
            <motion.button
              key={plan.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: planIndex * 0.08 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handlePlanSelect(plan)}
              className="w-full rounded-2xl text-left overflow-hidden transition-all duration-200"
              style={{
                border: `2px solid ${isSelected ? '#01DF82' : 'rgba(255,255,255,0.1)'}`,
                backgroundColor: 'rgba(255,255,255,0.03)',
                boxShadow: isSelected ? '0 0 24px rgba(1,223,130,0.12)' : 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              {/* 카드 상단: 배지 + 플랜명 */}
              <div className="p-5 flex justify-between items-start" style={{ background: plan.bgGradient }}>
                <div>
                  <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold mb-2" style={{ backgroundColor: plan.accent, color: '#000' }}>
                    {plan.badge}
                  </span>
                  <div className="text-lg font-bold text-white">{plan.name}</div>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                  <PlanIcon size={22} color={plan.accent} />
                </div>
              </div>

              {/* 카드 하단: 구성 + breakdown + 가격 */}
              <div className="px-5 py-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users size={15} style={{ color: 'rgba(255,255,255,0.4)' }} />
                  <span className="text-sm font-semibold text-white">{plan.composition}</span>
                  <span className="px-2 py-0.5 rounded-md text-xs font-semibold" style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
                    {plan.total}
                  </span>
                </div>

                {/* CHANGED: 등급별 단가 breakdown 추가 */}
                <BreakdownLine crew={plan.crew} />

                <div className="text-sm mt-3 mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>{plan.effect}</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-base font-bold" style={{ color: plan.accent }}>{formatPrice(plan.price)}</span>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>VAT 포함 {formatPrice(plan.priceWithVat)}</span>
                </div>
              </div>

              {/* 선택됨 표시 */}
              {isSelected && (
                <div className="py-3 flex items-center justify-center gap-2 text-sm font-semibold" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(1,223,130,0.08)', color: '#01DF82' }}>
                  <CheckCircle size={16} /> 선택됨
                </div>
              )}
            </motion.button>
          )
        })}

        {/* 직접 선택할게요 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: pkg.plans.length * 0.08 }}
        >
          <button
            onClick={handleCustomToggle}
            className="w-full rounded-2xl text-left overflow-hidden transition-all duration-200"
            style={{
              border: `2px solid ${isCustom ? '#727CF5' : 'rgba(255,255,255,0.1)'}`,
              backgroundColor: isCustom ? 'rgba(114,124,245,0.06)' : 'rgba(255,255,255,0.03)',
              boxShadow: isCustom ? '0 0 24px rgba(114,124,245,0.12)' : 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <div className="p-5 flex justify-between items-center" style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #1E1530 100%)' }}>
              <div>
                <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold mb-2" style={{ backgroundColor: '#727CF5', color: '#fff' }}>
                  맞춤
                </span>
                <div className="text-lg font-bold text-white">직접 선택할게요</div>
                <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  등급별 인원을 자유롭게 구성하세요
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                <Settings2 size={22} color="#727CF5" />
              </div>
            </div>
          </button>

          {/* 커스텀 인원 설정 UI */}
          {isCustom && customCrew && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
              className="mt-3 flex flex-col gap-3"
            >
              <Counter
                label="아이콘 크리에이터"
                price={PRICING.icon.price}
                value={customCrew.icon}
                onChange={(v) => handleCrewChange('icon', v)}
                emoji="⭐️"
              />
              <Counter
                label="파트너 크리에이터"
                price={PRICING.partner.price}
                value={customCrew.partner}
                onChange={(v) => handleCrewChange('partner', v)}
                emoji="✔️"
              />
              <Counter
                label="라이징 크리에이터"
                price={PRICING.rising.price}
                value={customCrew.rising}
                onChange={(v) => handleCrewChange('rising', v)}
                emoji="🔥"
              />

              {/* 합계 표시 */}
              {customHeadcount > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 rounded-xl mt-1"
                  style={{ backgroundColor: 'rgba(114,124,245,0.08)', border: '1px solid rgba(114,124,245,0.2)' }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>총 인원</span>
                    <span className="text-sm font-bold text-white">{customHeadcount}명</span>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>금액 (VAT 별도)</span>
                    <span className="text-base font-bold" style={{ color: '#727CF5' }}>{formatPrice(customTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>실 입금 금액 (VAT 포함)</span>
                    <span className="text-sm font-semibold" style={{ color: '#01DF82' }}>{formatPrice(customTotalWithVat)}</span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>}
    </motion.div>
  )
}
