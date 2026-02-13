import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronDown, ChevronUp, AlertTriangle, ShieldAlert } from 'lucide-react'
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

/** 중요 조항 개별 동의 체크박스 */
function CriticalAcknowledge({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      className="flex items-center gap-2 mt-2 ml-11 py-1.5 px-3 rounded-lg transition-all duration-200"
      style={{
        backgroundColor: checked ? 'rgba(1,223,130,0.08)' : 'rgba(255,168,0,0.06)',
        border: `1px solid ${checked ? 'rgba(1,223,130,0.3)' : 'rgba(255,168,0,0.2)'}`,
        cursor: 'pointer',
      }}
    >
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{
          width: 16,
          height: 16,
          borderRadius: 4,
          border: `2px solid ${checked ? '#01DF82' : '#FFA800'}`,
          backgroundColor: checked ? '#01DF82' : 'transparent',
        }}
      >
        {checked && <Check size={10} color="#000" strokeWidth={3} />}
      </div>
      <span
        className="text-xs font-semibold"
        style={{ color: checked ? '#01DF82' : '#FFA800' }}
      >
        {checked ? '동의 완료' : '동의합니다'}
      </span>
    </button>
  )
}

export default function AgreementStep({ agreements, onToggle, onToggleAll, criticalAcks, onCriticalAck }) {
  const [expandedId, setExpandedId] = useState('contract') // 계약 자동 펼침
  const allChecked = Object.values(agreements).every(Boolean)

  // critical 조항 인덱스 추출
  const criticalIndices = useMemo(() => {
    const contract = AGREEMENTS.find((a) => a.id === 'contract')
    if (!contract) return []
    return contract.clauses
      .map((c, i) => (c.critical ? i : -1))
      .filter((i) => i >= 0)
  }, [])

  const allCriticalAcked = criticalIndices.every((i) => criticalAcks?.[i])

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
      <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>
        아래 내용에 동의하시면 신청이 완료됩니다
      </p>

      {/* 중요 조항 미동의 시 안내 배너 */}
      {!allCriticalAcked && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2.5 p-3.5 rounded-xl mb-4"
          style={{
            backgroundColor: 'rgba(255,168,0,0.08)',
            border: '1px solid rgba(255,168,0,0.2)',
          }}
        >
          <ShieldAlert size={18} style={{ color: '#FFA800', flexShrink: 0, marginTop: 1 }} />
          <div>
            <div className="text-xs font-bold mb-0.5" style={{ color: '#FFA800' }}>
              중요 조항 확인 필요
            </div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
              표시된 중요 조항을 확인하고 각각 동의해 주세요
            </div>
          </div>
        </motion.div>
      )}

      {/* 전체 동의 버튼 */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onToggleAll}
        className="w-full flex items-center gap-3 p-4 rounded-2xl mb-4 transition-all duration-200"
        style={{
          border: `2px solid ${allChecked && allCriticalAcked ? '#01DF82' : 'rgba(255,255,255,0.12)'}`,
          backgroundColor: allChecked && allCriticalAcked ? 'rgba(1,223,130,0.08)' : 'rgba(255,255,255,0.03)',
          cursor: 'pointer',
        }}
      >
        <Checkbox checked={allChecked && allCriticalAcked} onChange={onToggleAll} size={26} />
        <span className="text-base font-bold text-white">전체 동의하기</span>
      </motion.button>

      {/* 개별 약관 */}
      <div className="flex flex-col gap-2">
        {AGREEMENTS.map((agreement, i) => {
          const isChecked = agreements[agreement.id]
          const isExpanded = expandedId === agreement.id
          const hasCritical = agreement.clauses?.some((c) => c.critical)

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
                  {hasCritical && !allCriticalAcked && (
                    <span
                      className="inline-flex items-center gap-1 ml-2 px-1.5 py-0.5 rounded text-xs font-bold"
                      style={{ backgroundColor: 'rgba(255,168,0,0.15)', color: '#FFA800', verticalAlign: 'middle' }}
                    >
                      <AlertTriangle size={10} />
                      확인 필요
                    </span>
                  )}
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
                            {/* 조항 행 */}
                            <div
                              className="flex gap-2 p-2 rounded-lg"
                              style={{
                                backgroundColor: clause.critical
                                  ? 'rgba(255,168,0,0.05)'
                                  : 'transparent',
                                borderLeft: clause.critical
                                  ? '3px solid #FFA800'
                                  : '3px solid transparent',
                              }}
                            >
                              <span
                                className="text-xs font-bold flex-shrink-0 mt-0.5"
                                style={{
                                  color: clause.critical ? '#FFA800' : '#01DF82',
                                  minWidth: 42,
                                }}
                              >
                                {clause.critical && (
                                  <AlertTriangle
                                    size={10}
                                    style={{ display: 'inline', marginRight: 2, verticalAlign: 'middle' }}
                                  />
                                )}
                                {clause.num}
                              </span>
                              <div className="flex-1">
                                {clause.title && (
                                  <span
                                    className="text-xs font-semibold"
                                    style={{ color: clause.critical ? '#FFA800' : '#fff' }}
                                  >
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

                            {/* critical 조항 개별 동의 */}
                            {clause.critical && (
                              <CriticalAcknowledge
                                checked={!!criticalAcks?.[j]}
                                onChange={() => onCriticalAck(j)}
                              />
                            )}
                          </div>
                        ))}
                      </div>

                      {/* 계약서 갈음 강조 */}
                      {agreement.id === 'contract' && (
                        <div
                          className="mt-4 p-3 rounded-xl text-center"
                          style={{
                            backgroundColor: 'rgba(255,56,60,0.08)',
                            border: '1px solid rgba(255,56,60,0.2)',
                          }}
                        >
                          <p className="text-xs font-bold" style={{ color: '#FF383C' }}>
                            본 내용은 계약서에 갈음합니다.
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                            상기 내용에 동의 없이는 프리미엄 협찬 진행이 불가합니다.
                          </p>
                        </div>
                      )}
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
