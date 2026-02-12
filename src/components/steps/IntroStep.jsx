import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

const painPoints = [
  { icon: '🤔', text: '캠핑을 모르는 인플루언서가 와서 당황하셨나요?' },
  { icon: '📢', text: '우리 숙소를 크리에이터에게 알리고 싶으신가요?' },
  { icon: '💪', text: '캠핏이 공고부터 매칭까지 한 번에 해결해 드립니다' },
]

export default function IntroStep({ onStart }) {
  return (
    <div
      className="min-h-screen flex flex-col justify-center px-6 py-10 relative overflow-hidden"
      style={{ background: '#0A0A0A' }}
    >
      {/* 배경 글로우 */}
      <div
        className="absolute rounded-full"
        style={{
          top: -100, right: -80, width: 300, height: 300,
          background: 'radial-gradient(circle, rgba(1,223,130,0.12) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          bottom: -60, left: -80, width: 200, height: 200,
          background: 'radial-gradient(circle, rgba(25,117,255,0.08) 0%, transparent 70%)',
        }}
      />

      {/* 로고 & 헤드라인 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-10 relative z-10"
      >
        <p className="text-sm font-bold tracking-widest mb-3" style={{ color: '#01DF82' }}>
          CAMFIT PREMIUM
        </p>
        <h1 className="text-3xl font-extrabold text-white leading-tight">
          캠핑장 협찬 마케팅,
          <br />
          <span style={{ color: '#01DF82' }}>가장 쉽게</span> 시작하세요
        </h1>
        <p className="text-sm mt-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
          캠핏에 입점하셨다면, 이제는 직접 제안할 수 있습니다
        </p>
      </motion.div>

      {/* 페인포인트 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="flex flex-col gap-3 mb-10 relative z-10"
      >
        {painPoints.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
            style={{
              backgroundColor: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <span className="text-xl flex-shrink-0">{item.icon}</span>
            <span className="text-white text-sm font-medium leading-snug">{item.text}</span>
          </div>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        whileTap={{ scale: 0.97 }}
        onClick={onStart}
        className="w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 relative z-10"
        style={{
          backgroundColor: '#01DF82',
          color: '#000000',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 0 30px rgba(1,223,130,0.3)',
        }}
      >
        30초만에 신청하기
        <ArrowRight size={20} />
      </motion.button>
    </div>
  )
}
