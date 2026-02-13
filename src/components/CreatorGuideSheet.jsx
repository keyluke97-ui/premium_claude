import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink } from 'lucide-react'

const TIERS = [
  {
    stars: '⭐️⭐️⭐️',
    name: '아이콘 크리에이터',
    price: '30만원 / 1객실',
    color: '#FF383C',
    bg: 'rgba(255,56,60,0.08)',
    border: 'rgba(255,56,60,0.2)',
    desc: '캠핏 소속 크리에이터 중 상위 20%.\n한 번의 방문으로 가장 많은 사람에게\n우리 캠핑장을 알릴 수 있습니다.',
    recommend: '개장 시즌 전 대규모 홍보가 필요하거나,\n예약 문의를 한 번에 끌어올리고 싶을 때',
    examples: [
      { label: '유튜브 예시', url: 'https://www.youtube.com/watch?v=uI6dRB0H5rg&t=78s' },
      { label: '인스타 예시', url: 'https://www.instagram.com/reel/DHKNfS2y1U7/' },
    ],
  },
  {
    stars: '⭐️⭐️',
    name: '파트너 크리에이터',
    price: '10만원 / 1객실',
    color: '#1975FF',
    bg: 'rgba(25,117,255,0.08)',
    border: 'rgba(25,117,255,0.2)',
    desc: '꾸준한 조회수와 팔로워를 가진 중견 크리에이터.\n가장 많은 인원이 이 등급에 속해 있어\n다양한 스타일의 콘텐츠를 받을 수 있습니다.',
    recommend: '검색했을 때 나오는 양질의 후기를\n여러 개 쌓고 싶을 때',
    examples: [
      { label: '인스타 예시', url: 'https://www.instagram.com/p/DKGK1uszDSb/' },
      { label: '블로그 예시', url: 'https://blog.naver.com/shiaru/223959067122' },
    ],
  },
  {
    stars: '⭐️',
    name: '라이징 크리에이터',
    price: '5만원 / 1객실',
    color: '#01DF82',
    bg: 'rgba(1,223,130,0.08)',
    border: 'rgba(1,223,130,0.2)',
    desc: '성장 중인 신예 크리에이터.\n적은 비용으로 다양한 체험 후기와 사진을\n빠르게 확보할 수 있습니다.',
    recommend: '오픈 초기에 후기가 없어서 걱정이거나,\n적은 예산으로 최대한 많은 콘텐츠를 원할 때',
    examples: [
      { label: '인스타 예시 1', url: 'https://www.instagram.com/p/DNp6NODz4p7/' },
      { label: '인스타 예시 2', url: 'https://www.instagram.com/p/DLHERgRPzEk/' },
    ],
  },
]

export default function CreatorGuideSheet({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* 백드롭 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          />

          {/* 바텀시트 */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-1/2 z-50 w-full overflow-hidden"
            style={{
              maxWidth: 448,
              transform: 'translateX(-50%)',
              maxHeight: '88vh',
              borderRadius: '20px 20px 0 0',
              backgroundColor: '#1A1A1A',
              border: '1px solid rgba(255,255,255,0.08)',
              borderBottom: 'none',
            }}
          >
            {/* 드래그 핸들 */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />
            </div>

            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 pt-2 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-white">크리에이터 등급 안내</h3>
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  모든 등급에서 유튜브 · 블로그 · 인스타 활동 크리에이터가 있습니다
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* 스크롤 컨텐츠 */}
            <div
              className="px-5 pb-8 overflow-y-auto"
              style={{ maxHeight: 'calc(88vh - 90px)' }}
            >
              <div className="flex flex-col gap-4">
                {TIERS.map((tier, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.08 }}
                    className="rounded-2xl overflow-hidden"
                    style={{ backgroundColor: tier.bg, border: `1px solid ${tier.border}` }}
                  >
                    {/* 등급 헤더 */}
                    <div className="px-4 pt-4 pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{tier.stars}</span>
                          <span className="text-base font-bold text-white">{tier.name}</span>
                        </div>
                        <span
                          className="px-2.5 py-1 rounded-lg text-xs font-bold"
                          style={{ backgroundColor: tier.color, color: '#fff' }}
                        >
                          {tier.price}
                        </span>
                      </div>

                      {/* 설명 */}
                      <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: 'rgba(255,255,255,0.65)' }}>
                        {tier.desc}
                      </p>
                    </div>

                    {/* 추천 상황 */}
                    <div
                      className="px-4 py-3"
                      style={{ borderTop: `1px solid ${tier.border}` }}
                    >
                      <div className="text-xs font-bold mb-1.5" style={{ color: tier.color }}>
                        이런 캠핑장에 추천해요
                      </div>
                      <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {tier.recommend}
                      </p>
                    </div>

                    {/* 예시 콘텐츠 */}
                    <div
                      className="px-4 py-3 flex gap-2"
                      style={{ borderTop: `1px solid ${tier.border}` }}
                    >
                      {tier.examples.map((ex, j) => (
                        <a
                          key={j}
                          href={ex.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                          style={{
                            backgroundColor: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'rgba(255,255,255,0.6)',
                            textDecoration: 'none',
                          }}
                        >
                          {ex.label}
                          <ExternalLink size={10} />
                        </a>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* 리스크 헷지 안내 */}
              <div
                className="mt-4 p-3.5 rounded-xl"
                style={{ backgroundColor: 'rgba(255,168,0,0.06)', border: '1px solid rgba(255,168,0,0.15)' }}
              >
                <p className="text-xs font-semibold mb-1.5" style={{ color: '#FFA800' }}>
                  안내사항
                </p>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  인플루언서 등급은 평균 역량 기준이며, 개별 콘텐츠 반응은 캠핑장/숙소의 특성 및 시기에 따라 달라질 수 있습니다.
                </p>
                <p className="text-xs leading-relaxed mt-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  따라서 등급은 평균적인 역량 지표로 참고해 주시되, 개별 콘텐츠 반응에는 변동이 발생할 수 있다는 점 양해 부탁드립니다.
                </p>
              </div>

              {/* 닫기 버튼 */}
              <button
                onClick={onClose}
                className="w-full mt-4 py-3.5 rounded-2xl text-sm font-bold transition-all"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                확인했어요
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
