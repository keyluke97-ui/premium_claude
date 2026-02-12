import { motion } from 'framer-motion'
import { Phone, Mail, MapPin, Building, Users, MessageSquare, AlertCircle, ChevronDown } from 'lucide-react'

const REGIONS = [
  '경기도',
  '강원도',
  '충청도',
  '경상도',
  '전라도',
  '제주도',
]

const fields = [
  {
    key: 'accommodationName',
    label: '캠핑장 이름',
    placeholder: '예: 별빛 캠핑장',
    Icon: Building,
    required: true,
  },
  {
    key: 'representativeName',
    label: '대표자명',
    placeholder: '홍길동',
    Icon: Users,
    required: true,
  },
  {
    key: 'phone',
    label: '연락처',
    placeholder: '010-1234-5678',
    Icon: Phone,
    type: 'tel',
    required: true,
  },
  {
    key: 'email',
    label: '이메일',
    placeholder: 'example@email.com',
    Icon: Mail,
    type: 'email',
    required: true,
  },
]

export default function InfoStep({ data, onChange, errors }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="px-5 pt-8 pb-6"
    >
      <h2 className="text-2xl font-extrabold text-white leading-tight mb-2">
        캠핑장 정보를
        <br />
        알려주세요
      </h2>
      <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.45)' }}>
        정확한 정보를 입력하시면 더 빠르게 진행됩니다
      </p>

      <div className="flex flex-col gap-5">
        {fields.map((field, i) => {
          const Icon = field.Icon
          const hasError = errors[field.key]

          return (
            <motion.div
              key={field.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <label className="flex items-center gap-1.5 text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
                <Icon size={15} style={{ color: 'rgba(255,255,255,0.4)' }} />
                {field.label}
                {field.required && <span style={{ color: '#FF383C' }}>*</span>}
              </label>
              <input
                type={field.type || 'text'}
                value={data[field.key] || ''}
                onChange={(e) => onChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full text-base text-white transition-colors duration-200"
                style={{
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: `1.5px solid ${hasError ? '#FF383C' : 'rgba(255,255,255,0.12)'}`,
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = hasError ? '#FF383C' : '#01DF82'
                  e.target.style.boxShadow = hasError
                    ? '0 0 0 3px rgba(255,56,60,0.15)'
                    : '0 0 0 3px rgba(1,223,130,0.15)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = hasError ? '#FF383C' : 'rgba(255,255,255,0.12)'
                  e.target.style.boxShadow = 'none'
                }}
              />
              {hasError && (
                <div className="flex items-center gap-1 mt-1.5 text-xs" style={{ color: '#FF383C' }}>
                  <AlertCircle size={12} />
                  {hasError}
                </div>
              )}
            </motion.div>
          )
        })}

        {/* 소재 권역 드롭다운 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: fields.length * 0.05 }}
        >
          <label className="flex items-center gap-1.5 text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
            <MapPin size={15} style={{ color: 'rgba(255,255,255,0.4)' }} />
            숙소 위치 (권역)
            <span style={{ color: '#FF383C' }}>*</span>
          </label>
          <div className="relative">
            <select
              value={data.region || ''}
              onChange={(e) => onChange('region', e.target.value)}
              className="w-full text-base appearance-none transition-colors duration-200"
              style={{
                padding: '14px 40px 14px 16px',
                borderRadius: 12,
                border: `1.5px solid ${errors.region ? '#FF383C' : 'rgba(255,255,255,0.12)'}`,
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: data.region ? '#FFFFFF' : 'rgba(255,255,255,0.35)',
                outline: 'none',
                WebkitAppearance: 'none',
                cursor: 'pointer',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = errors.region ? '#FF383C' : '#01DF82'
                e.target.style.boxShadow = errors.region
                  ? '0 0 0 3px rgba(255,56,60,0.15)'
                  : '0 0 0 3px rgba(1,223,130,0.15)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = errors.region ? '#FF383C' : 'rgba(255,255,255,0.12)'
                e.target.style.boxShadow = 'none'
              }}
            >
              <option value="" disabled>권역을 선택해주세요</option>
              {REGIONS.map((r) => (
                <option key={r} value={r} style={{ backgroundColor: '#1A1A1A', color: '#FFFFFF' }}>
                  {r}
                </option>
              ))}
            </select>
            <ChevronDown
              size={18}
              style={{
                position: 'absolute',
                right: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.4)',
                pointerEvents: 'none',
              }}
            />
          </div>
          {errors.region && (
            <div className="flex items-center gap-1 mt-1.5 text-xs" style={{ color: '#FF383C' }}>
              <AlertCircle size={12} />
              {errors.region}
            </div>
          )}
        </motion.div>

        {/* 추가 요청사항 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: (fields.length + 1) * 0.05 }}
        >
          <label className="flex items-center gap-1.5 text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
            <MessageSquare size={15} style={{ color: 'rgba(255,255,255,0.4)' }} />
            추가 요청사항
          </label>
          <textarea
            value={data.additionalRequests || ''}
            onChange={(e) => onChange('additionalRequests', e.target.value)}
            placeholder="특별히 원하시는 사항이 있다면 적어주세요"
            rows={3}
            className="w-full text-base text-white resize-y"
            style={{
              padding: '14px 16px',
              borderRadius: 12,
              border: '1.5px solid rgba(255,255,255,0.12)',
              backgroundColor: 'rgba(255,255,255,0.05)',
              outline: 'none',
              fontFamily: 'inherit',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#01DF82'
              e.target.style.boxShadow = '0 0 0 3px rgba(1,223,130,0.15)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255,255,255,0.12)'
              e.target.style.boxShadow = 'none'
            }}
          />
        </motion.div>
      </div>
    </motion.div>
  )
}
