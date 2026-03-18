import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

// CHANGED: 예산 구간 15/30/50 → 30/50/70 으로 변경 (캠지기 제안 금액 상향 반영)
const budgetOptions = [
  { value: 70, label: '70만원', subtitle: '최대 효과를 원하는 캠핑장', emoji: '💎', color: '#FF7300' },
  { value: 50, label: '50만원', subtitle: '효과와 효율 모두 잡는 캠핑장', emoji: '⭐', color: '#1975FF' },
  { value: 30, label: '30만원', subtitle: '합리적인 시작을 원하는 캠핑장', emoji: '🌱', color: '#01DF82' },
  { value: 15, label: '15만원', subtitle: '가볍게 시작해보고 싶은 캠핑장', emoji: '👋', color: '#A0AEC0' }, // CHANGED: 15만원 맛보기 티어 추가
  { value: 'custom', label: '직접 선택할게요', subtitle: '등급별 인원을 자유롭게 구성하세요', emoji: '✏️', color: '#727CF5' },
]

export default function BudgetStep({ selected, onSelect }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="px-5 pt-8 pb-6"
    >
      <h2 className="text-2xl font-extrabold text-white leading-tight mb-2">
        얼마 정도의 예산을
        <br />
        생각하고 계신가요?
      </h2>
      <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.45)' }}>
        예산에 딱 맞는 플랜을 추천해 드릴게요 <span style={{ color: 'rgba(255,255,255,0.3)' }}>(VAT 별도)</span>
      </p>

      <div className="flex flex-col gap-3">
        {budgetOptions.map((option, i) => {
          const isSelected = selected === option.value
          return (
            <motion.button
              key={option.value}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(option.value)}
              className="w-full flex items-center gap-4 p-5 rounded-2xl text-left transition-all duration-200"
              style={{
                border: `2px solid ${isSelected ? '#01DF82' : 'rgba(255,255,255,0.1)'}`,
                backgroundColor: isSelected ? 'rgba(1,223,130,0.08)' : 'rgba(255,255,255,0.04)',
                boxShadow: isSelected ? '0 0 20px rgba(1,223,130,0.1)' : 'none',
                cursor: 'pointer',
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ backgroundColor: `${option.color}18` }}
              >
                {option.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-lg font-bold text-white">{option.label}</div>
                <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {option.subtitle}
                </div>
              </div>
              {isSelected && (
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#01DF82' }}>
                  <Check size={14} color="#000" strokeWidth={3} />
                </div>
              )}
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}
