import { motion } from 'framer-motion'
import { Users, CheckCircle } from 'lucide-react'
import PACKAGES from '../../data/packages'

function formatPrice(n) {
  return n.toLocaleString('ko-KR') + '원'
}

export default function PackageStep({ budget, selected, onSelect }) {
  const pkg = PACKAGES[budget]
  if (!pkg) return null

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
        {pkg.plans.map((plan, i) => {
          const isSelected = selected?.id === plan.id
          const Icon = plan.Icon
          return (
            <motion.button
              key={plan.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.08 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(plan)}
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
      </div>
    </motion.div>
  )
}
