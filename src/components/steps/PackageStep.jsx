import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, CheckCircle, Minus, Plus, Settings2 } from 'lucide-react'
import PACKAGES, { PRICING, calcCrewPrice, calcCrewPriceWithVat } from '../../data/packages'

function formatPrice(n) {
  return n.toLocaleString('ko-KR') + '원'
}

/** 인원 카운터 컴포넌트 */
function Counter({ label, price, value, onChange, emoji }) {
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
          onClick={() => onChange(value + 1)}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{
            backgroundColor: '#01DF82',
            border: 'none',
            cursor: 'pointer',
            color: '#000',
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
  const [isCustom, setIsCustom] = useState(selected?.id === 'custom')

  if (!pkg) return null

  const handleCustomToggle = () => {
    setIsCustom(true)
    // 기본 crew 설정
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
        어떤 플랜이 끌리시나요?
      </h2>
      <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.45)' }}>
        {pkg.subtitle}에 딱 맞는 플랜이에요
      </p>

      <div className="flex flex-col gap-4">
        {/* 기존 플랜 목록 */}
        {pkg.plans.map((plan, i) => {
          const isSelected = !isCustom && selected?.id === plan.id
          const Icon = plan.Icon
          return (
            <motion.button
              key={plan.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.08 }}
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
              <div className="p-5 flex justify-between items-start" style={{ background: plan.bgGradient }}>
                <div>
                  <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold mb-2" style={{ backgroundColor: plan.accent, color: '#000' }}>
                    {plan.badge}
                  </span>
                  <div className="text-lg font-bold text-white">{plan.name}</div>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                  <Icon size={22} color={plan.accent} />
                </div>
              </div>
              <div className="px-5 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={15} style={{ color: 'rgba(255,255,255,0.4)' }} />
                  <span className="text-sm font-semibold text-white">{plan.composition}</span>
                  <span className="px-2 py-0.5 rounded-md text-xs font-semibold" style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
                    {plan.total}
                  </span>
                </div>
                <div className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>{plan.effect}</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-base font-bold" style={{ color: plan.accent }}>{formatPrice(plan.price)}</span>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>VAT 포함 {formatPrice(plan.priceWithVat)}</span>
                </div>
              </div>
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
      </div>
    </motion.div>
  )
}
