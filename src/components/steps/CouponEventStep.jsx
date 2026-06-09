// CouponEventStep.jsx - 팔로워 쿠폰 이벤트 (프리미엄 퍼널 선택형 스텝)
// 기본 ON(옵트아웃) + 추천 프리셋 사전선택. "실 예약 전환" 프레이밍으로 옵트인 유도.
// 쿠폰 배포 크리에이터는 별도 모집하지 않고, 선택한 프리미엄 플랜의 crew(아이콘/파트너/라이징)에서 파생함.
// 기간은 일수(N일)만 표기 — 구체적 dates는 매칭일 확정 후 운영자가 채움 (약관 제11조 정합).
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, Calendar, Users, Ticket, Clock, Minus, Plus, HelpCircle, Sparkles, TrendingUp, Gift, SlidersHorizontal } from 'lucide-react'
import {
  DISCOUNT_PRESETS,
  DISCOUNT_RANGE,
  COUPON_APPLY_DAYS,
  COUPON_PER_CREATOR_PRESETS,
  VISIT_PERIOD,
  COUPON_PERIOD,
} from '../../constants/config'
import { formatDiscount } from '../../utils/coupons'
import CreatorGuideSheet from '../CreatorGuideSheet'

// 프리미엄 crew 키 → 등급 라벨/이모지 (⭐️/✔️/🔥 = 아이콘/파트너/라이징)
const TIER_LABELS = {
  icon: { label: '아이콘', emoji: '⭐️' },
  partner: { label: '파트너', emoji: '✔️' },
  rising: { label: '라이징', emoji: '🔥' },
}

function SectionLabel({ icon: Icon, text, right }) {
  return (
    <div className="flex items-center gap-2 mb-2.5 text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
      <Icon size={15} style={{ color: 'rgba(255,255,255,0.4)' }} />
      <span>{text}</span>
      {right && <span className="ml-auto">{right}</span>}
    </div>
  )
}

// ── 선택 버튼 (할인 프리셋 / 인당 쿠폰 공용) ──
function PresetButton({ label, sublabel, isSelected, onClick }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="flex-1 rounded-xl text-center transition-all"
      style={{
        padding: '14px 8px',
        backgroundColor: isSelected ? 'rgba(1,223,130,0.1)' : 'rgba(255,255,255,0.04)',
        border: `1.5px solid ${isSelected ? '#01DF82' : 'rgba(255,255,255,0.1)'}`,
        cursor: 'pointer',
        color: '#fff',
      }}
    >
      <div className="text-base font-bold mb-1">{label}</div>
      <div className="text-xs" style={{ color: isSelected ? '#01DF82' : 'rgba(255,255,255,0.4)' }}>{sublabel}</div>
    </motion.button>
  )
}

// ── 기간 표시 카드 (일수 기반, 매칭일 확정 후 운영자가 dates 채움) ──
function PeriodDisplayCard({ totalDays, subText }) {
  return (
    <div
      className="rounded-xl px-4 py-4 mb-3 text-center"
      style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="text-base font-bold text-white" style={{ letterSpacing: -0.3 }}>
        매칭일부터 <span style={{ color: '#01DF82' }}>{totalDays}일</span>
      </div>
      {subText && (
        <div className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>{subText}</div>
      )}
    </div>
  )
}

function PeriodAdjustButton({ icon: Icon, label, onClick, disabled }) {
  return (
    <motion.button
      whileTap={disabled ? {} : { scale: 0.96 }}
      onClick={onClick}
      disabled={disabled}
      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition-all"
      style={{
        padding: '12px 0',
        backgroundColor: disabled ? 'transparent' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${disabled ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.12)'}`,
        color: disabled ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.6)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Icon size={14} />
      {label}
    </motion.button>
  )
}

export default function CouponEventStep({
  enabled,
  onToggle,
  discount,
  onDiscountChange,
  couponApplyDays,
  onCouponApplyDaysChange,
  couponPerCreator,
  onCouponPerCreatorChange,
  crew,
  visitPeriodDays,
  couponPeriodDays,
  couponExtraDays,
  onVisitPeriodChange,
  onCouponExtraChange,
}) {
  const [showGuide, setShowGuide] = useState(false)
  const [showVisitAdjust, setShowVisitAdjust] = useState(false)

  const isPresetDiscount = DISCOUNT_PRESETS.some((p) => p.value === discount)
  const [isCustomDiscount, setIsCustomDiscount] = useState(discount != null && !isPresetDiscount)

  const handlePresetDiscount = (value) => {
    setIsCustomDiscount(false)
    onDiscountChange(value)
  }
  const handleCustomDiscount = () => {
    setIsCustomDiscount(true)
    if (!discount || isPresetDiscount) onDiscountChange(DISCOUNT_RANGE.minimum)
  }

  const handleVisitShrink = () => {
    const confirmed = window.confirm('방문 가능 기간을 줄이면 크리에이터 매칭률이 저하될 수 있어요.\n\n변경하시겠어요?')
    if (confirmed) onVisitPeriodChange(-VISIT_PERIOD.adjustmentStep)
  }

  const couponMaxExtra = COUPON_PERIOD.adjustmentStep * COUPON_PERIOD.maximumExtensions

  // 쿠폰 배포 크리에이터 = 선택한 프리미엄 플랜의 crew
  const crewTotal = (crew?.icon || 0) + (crew?.partner || 0) + (crew?.rising || 0)
  const crewBreakdown = ['icon', 'partner', 'rising']
    .filter((k) => (crew?.[k] || 0) > 0)
    .map((k) => `${TIER_LABELS[k].emoji} ${TIER_LABELS[k].label} ${crew[k]}`)
    .join(' · ')
  const totalCoupons = crewTotal * (couponPerCreator || 0)
  const maxBurden = totalCoupons * (discount || 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="px-5 pt-8 pb-6"
    >
      <h2 className="text-2xl font-extrabold text-white leading-tight mb-2">
        팔로워 쿠폰으로
        <br />
        실 예약까지 이어보세요
      </h2>
      <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.45)' }}>
        크리에이터 콘텐츠를 본 팔로워에게 할인 쿠폰을 뿌려 실제 예약 전환을 만드는 옵션이에요
      </p>

      {/* ON/OFF 토글 카드 */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 rounded-2xl mb-5 text-left transition-all duration-200"
        style={{
          border: `2px solid ${enabled ? '#01DF82' : 'rgba(255,255,255,0.12)'}`,
          backgroundColor: enabled ? 'rgba(1,223,130,0.08)' : 'rgba(255,255,255,0.03)',
          cursor: 'pointer',
        }}
      >
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: enabled ? 'rgba(1,223,130,0.15)' : 'rgba(255,255,255,0.06)' }}
        >
          <Gift size={22} style={{ color: enabled ? '#01DF82' : 'rgba(255,255,255,0.4)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-white">팔로워 쿠폰 이벤트</span>
            <span
              className="px-1.5 py-0.5 rounded text-xs font-bold"
              style={{ backgroundColor: 'rgba(1,223,130,0.15)', color: '#01DF82' }}
            >
              추천
            </span>
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {enabled ? '함께 진행해요 · 미사용 시 비용 없음' : '꺼짐 · 협찬만 진행돼요'}
          </div>
        </div>
        {/* 스위치 */}
        <div
          className="flex-shrink-0 rounded-full transition-all duration-200"
          style={{
            width: 46,
            height: 26,
            backgroundColor: enabled ? '#01DF82' : 'rgba(255,255,255,0.15)',
            padding: 3,
            display: 'flex',
            justifyContent: enabled ? 'flex-end' : 'flex-start',
            alignItems: 'center',
          }}
        >
          <motion.div layout className="rounded-full" style={{ width: 20, height: 20, backgroundColor: '#fff' }} />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {enabled ? (
          <motion.div
            key="config"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {/* 가치 소구 배너 */}
            <div
              className="flex items-start gap-2.5 p-3.5 rounded-xl mb-6"
              style={{ backgroundColor: 'rgba(1,223,130,0.06)', border: '1px solid rgba(1,223,130,0.18)' }}
            >
              <TrendingUp size={18} style={{ color: '#01DF82', flexShrink: 0, marginTop: 1 }} />
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                협찬 콘텐츠는 <strong style={{ color: '#01DF82' }}>인지</strong>를, 팔로워 쿠폰은 <strong style={{ color: '#01DF82' }}>실 예약</strong>을 만듭니다.
                쿠폰은 <strong style={{ color: '#fff' }}>사용된 예약 건당</strong>에만 비용이 발생하고, 미사용 시 부담이 없어요.
              </div>
            </div>

            {/* 1. 팔로워 할인 금액 */}
            <SectionLabel icon={Wallet} text="팔로워 할인 금액" />
            <div className="flex gap-2 mb-3">
              {DISCOUNT_PRESETS.map((preset) => (
                <PresetButton
                  key={preset.value}
                  label={preset.label}
                  sublabel={preset.sublabel}
                  isSelected={!isCustomDiscount && discount === preset.value}
                  onClick={() => handlePresetDiscount(preset.value)}
                />
              ))}
              <PresetButton label="직접" sublabel="설정" isSelected={isCustomDiscount} onClick={handleCustomDiscount} />
            </div>

            <AnimatePresence>
              {isCustomDiscount && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-xl p-4 mb-5 overflow-hidden"
                  style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="flex justify-between mb-2">
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>할인 금액</span>
                    <span className="text-sm font-semibold" style={{ color: '#01DF82' }}>{formatDiscount(discount)}</span>
                  </div>
                  <input
                    type="range"
                    min={DISCOUNT_RANGE.minimum}
                    max={DISCOUNT_RANGE.maximum}
                    step={DISCOUNT_RANGE.step}
                    value={discount || DISCOUNT_RANGE.minimum}
                    onChange={(e) => onDiscountChange(Number(e.target.value))}
                    className="w-full"
                    style={{ accentColor: '#01DF82' }}
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{formatDiscount(DISCOUNT_RANGE.minimum)}</span>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{formatDiscount(DISCOUNT_RANGE.maximum)}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 2. 쿠폰 적용 입실 요일 */}
            <div className="pt-2">
              <SectionLabel icon={Calendar} text="쿠폰 적용 입실 요일" />
              <div className="flex flex-col gap-2 mb-6">
                {COUPON_APPLY_DAYS.map((option) => {
                  const isSelected = couponApplyDays === option.id
                  return (
                    <motion.button
                      key={option.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onCouponApplyDaysChange(option.id)}
                      className="flex items-center justify-between rounded-xl text-left transition-all"
                      style={{
                        padding: '12px 14px',
                        backgroundColor: isSelected ? 'rgba(1,223,130,0.1)' : 'rgba(255,255,255,0.04)',
                        border: `1.5px solid ${isSelected ? '#01DF82' : 'rgba(255,255,255,0.1)'}`,
                        cursor: 'pointer',
                      }}
                    >
                      <div>
                        <div className="text-sm font-semibold text-white">{option.label}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{option.description}</div>
                      </div>
                      {isSelected && <span className="text-lg" style={{ color: '#01DF82' }}>✓</span>}
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {/* 3. 쿠폰 배포 크리에이터 (프리미엄 플랜에서 파생, 읽기 전용) */}
            <SectionLabel
              icon={Users}
              text="쿠폰 배포 크리에이터"
              right={
                <button
                  onClick={() => setShowGuide(true)}
                  className="flex items-center gap-1 text-xs font-medium"
                  style={{ background: 'none', border: 'none', color: '#01DF82', cursor: 'pointer' }}
                >
                  <HelpCircle size={12} /> 등급이 뭐예요?
                </button>
              }
            />
            <div
              className="rounded-xl px-4 py-3.5 mb-6"
              style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>협찬으로 모집한 크리에이터</span>
                <span className="text-base font-bold text-white">{crewTotal}명</span>
              </div>
              {crewBreakdown && (
                <div className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{crewBreakdown}</div>
              )}
              <div className="text-xs mt-2 pt-2" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                위 단계에서 선택한 협찬 크리에이터가 콘텐츠를 통해 팔로워에게 쿠폰을 배포합니다 (인원은 선택한 플랜에 따라 결정).
              </div>
            </div>

            {/* 4. 인당 팔로워 쿠폰 */}
            <SectionLabel icon={Ticket} text="인당 팔로워 쿠폰" />
            <div className="flex gap-2 mb-4">
              {COUPON_PER_CREATOR_PRESETS.map((preset) => (
                <PresetButton
                  key={preset.value}
                  label={preset.label}
                  sublabel={preset.sublabel}
                  isSelected={couponPerCreator === preset.value}
                  onClick={() => onCouponPerCreatorChange(preset.value)}
                />
              ))}
            </div>

            {/* 추가 예약 유치 프레이밍 */}
            {crewTotal > 0 && couponPerCreator && discount && (
              <div
                className="rounded-xl px-4 py-3.5 mb-6"
                style={{ backgroundColor: 'rgba(1,223,130,0.08)', border: '1px solid rgba(1,223,130,0.25)' }}
              >
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>📢 팔로워 쿠폰 발급</span>
                  <span className="text-sm font-bold" style={{ color: '#01DF82' }}>
                    {crewTotal}명 × {couponPerCreator}장 = {totalCoupons}장
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>🎯 최대 추가 예약 유치</span>
                  <span className="text-sm font-bold" style={{ color: '#01DF82' }}>최대 {totalCoupons}건</span>
                </div>
                <div className="text-xs pt-2.5" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  💰 쿠폰 사용 시 예약 건당 {formatDiscount(discount)} 할인 ·{' '}
                  <strong style={{ color: '#01DF82', fontWeight: 700 }}>미사용 시 비용 없음</strong>
                </div>
                <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)', lineHeight: 1.4 }}>
                  (전 쿠폰 소진 시 최대 {maxBurden.toLocaleString()}원 할인 부담)
                </div>
              </div>
            )}

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '4px 0 20px' }} />

            {/* 5. 방문 가능 기간 (기본 노출, 조정은 버튼 뒤로 숨김 — 권장 대상 아님) */}
            <div className="mb-6">
              <SectionLabel icon={Calendar} text="크리에이터 방문 가능 기간" />
              <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                프리미엄 협찬 정책(매칭 후 2개월 이내 방문)에 맞춘 기본값이에요
              </p>
              <PeriodDisplayCard totalDays={visitPeriodDays} />
              {!showVisitAdjust ? (
                <div className="text-center">
                  <button
                    onClick={() => setShowVisitAdjust(true)}
                    className="inline-flex items-center gap-1.5 text-xs"
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}
                  >
                    <SlidersHorizontal size={12} /> 기간 조정하기
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <PeriodAdjustButton icon={Minus} label="15일 줄이기" onClick={handleVisitShrink} disabled={visitPeriodDays <= VISIT_PERIOD.minimumDays} />
                  <PeriodAdjustButton icon={Plus} label="15일 늘리기" onClick={() => onVisitPeriodChange(VISIT_PERIOD.adjustmentStep)} disabled={visitPeriodDays >= VISIT_PERIOD.maximumDays} />
                </div>
              )}
            </div>

            {/* 6. 쿠폰 유효 기간 (늘리기만 — 줄이기 없음) */}
            <div>
              <SectionLabel icon={Clock} text="쿠폰 유효 기간" />
              <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                캠퍼가 할인 쿠폰을 사용할 수 있는 기간입니다
              </p>
              <PeriodDisplayCard
                totalDays={couponPeriodDays}
                subText={`방문 종료 후 콘텐츠 제작(${COUPON_PERIOD.contentCreationDays}일) + 최소 혜택(${COUPON_PERIOD.minimumBenefitDays}일) 포함`}
              />
              <div className="flex gap-2">
                <PeriodAdjustButton icon={Plus} label="15일 늘리기" onClick={() => onCouponExtraChange(COUPON_PERIOD.adjustmentStep)} disabled={couponExtraDays >= couponMaxExtra} />
              </div>
              {couponExtraDays > 0 && (
                <div className="text-center mt-2">
                  <button
                    onClick={() => onCouponExtraChange(-COUPON_PERIOD.adjustmentStep)}
                    className="text-xs"
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    추가한 {couponExtraDays}일 되돌리기
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="off"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-2.5 p-4 rounded-xl"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Sparkles size={18} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0, marginTop: 1 }} />
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
              쿠폰 이벤트 없이 프리미엄 협찬만 진행합니다. 위 스위치를 켜면 팔로워에게 할인 쿠폰을 제공해
              <strong style={{ color: '#01DF82' }}> 실제 예약 전환</strong>까지 노려볼 수 있어요. (미사용 시 추가 비용 없음)
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CreatorGuideSheet open={showGuide} onClose={() => setShowGuide(false)} />
    </motion.div>
  )
}
