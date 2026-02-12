import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import AGREEMENTS from '../../data/agreements'

function Checkbox({ checked, onChange, size = 22 }) {
  return (
    <button
      onClick={onChange}
      className="flex items-center justify-center flex-shrink-0 transition-all duration-200"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.23,
        border: `2px solid ${checked ? '#01DF82' : 'rgba(255,255,255,0.2)'}`,
        backgroundColor: checked ? '#01DF82' : 'transparent',
        padding: 0,
        cursor: 'pointer',
      }}
    >
      {checked && <Check size={size * 0.6} color="#000" strokeWidth={3} />}
    </button>
  )
}

export default function AgreementStep({ agreements, onToggle, onToggleAll }) {
  const [expandedId, setExpandedId] = useState(null)
  const allChecked = Object.values(agreements).every(Boolean)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="px-5 pt-8 pb-6"
    >
      <h2 className="text-2xl font-extrabold text-white leading-tight mb-2">
        마지막으로
        <br />
        확인해 주세요
      </h2>
      <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.45)' }}>
        아래 내용에 동의하시면 신청이 완료됩니다
      </p>

      {/* 전체 동의 버튼 */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onToggleAll}
        className="w-full flex items-center gap-3 p-4 rounded-2xl mb-4 transition-all duration-200"
        style={{
          border: `2px solid ${allChecked ? '#01DF82' : 'rgba(255,255,255,0.12)'}`,
          backgroundColor: allChecked ? 'rgba(1,223,130,0.08)' : 'rgba(255,255,255,0.03)',
          cursor: 'pointer',
        }}
      >
        <Checkbox checked={allChecked} onChange={onToggleAll} size={26} />
        <span className="text-base font-bold text-white">전체 동의하기</span>
      </motion.button>

      {/* 개별 약관 */}
      <div className="flex flex-col gap-2">
        {AGREEMENTS.map((agreement, i) => {
          const isChecked = agreements[agreement.id]
          const isExpanded = expandedId === agreement.id

          return (
            <motion.div
              key={agreement.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="rounded-xl overflow-hidden"
              style={{
                border: `1px solid ${isChecked ? 'rgba(1,223,130,0.2)' : 'rgba(255,255,255,0.08)'}`,
                backgroundColor: 'rgba(255,255,255,0.03)',
              }}
            >
              <div className="flex items-center gap-3 px-4 py-3.5">
                <Checkbox
                  checked={isChecked}
                  onChange={() => onToggle(agreement.id)}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    <span style={{ color: '#01DF82', fontWeight: 700 }}>
                      [필수]
                    </span>{' '}
                    {agreement.title}
                  </span>
                </div>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : agreement.id)}
                  className="p-1"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}
                >
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div
                      className="px-4 pb-4 pt-0"
                      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <p className="text-xs mt-3 mb-3 font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {agreement.summary}
                      </p>

                      {/* 조항 목록 */}
                      <div className="flex flex-col gap-2.5">
                        {agreement.clauses.map((clause, j) => (
                          <div key={j}>
                            <div className="flex gap-2">
                              <span
                                className="text-xs font-bold flex-shrink-0 mt-0.5"
                                style={{ color: '#01DF82', minWidth: 42 }}
                              >
                                {clause.num}
                              </span>
                              <div className="flex-1">
                                {clause.title && (
                                  <span className="text-xs font-semibold text-white">
                                    {clause.title}{' '}
                                  </span>
                                )}
                                <span className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                                  {clause.text}
                                </span>
                              </div>
                            </div>

                            {/* 제13조 예외 사항 */}
                            {clause.exception && (
                              <div
                                className="mt-2 ml-11 p-3 rounded-lg"
                                style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                              >
                                <div className="flex items-center gap-1.5 mb-2">
                                  <AlertTriangle size={12} style={{ color: '#FFC107' }} />
                                  <span className="text-xs font-semibold" style={{ color: '#FFC107' }}>
                                    {clause.exception.title}
                                  </span>
                                </div>
                                {clause.exception.items.map((item, k) => (
                                  <div key={k} className="flex gap-2 mb-1 last:mb-0">
                                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>•</span>
                                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{item}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
