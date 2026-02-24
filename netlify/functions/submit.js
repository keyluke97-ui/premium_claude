/**
 * Netlify Serverless Function — Airtable 프록시
 *
 * Airtable API 키를 서버에서만 사용하므로 프론트엔드에 노출되지 않습니다.
 * Netlify 대시보드 > Site settings > Environment variables 에서 설정:
 *   - AIRTABLE_API_KEY
 *   - AIRTABLE_BASE_ID
 *   - AIRTABLE_TABLE_NAME (선택, 기본값: 캠지기 모집 폼)
 */

export default async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('', {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const API_KEY = process.env.AIRTABLE_API_KEY
  const BASE_ID = process.env.AIRTABLE_BASE_ID
  const TABLE = process.env.AIRTABLE_TABLE_ID || process.env.AIRTABLE_TABLE_NAME || '캠지기 모집 폼'

  if (!API_KEY || !BASE_ID) {
    return new Response(
      JSON.stringify({ error: 'Airtable 환경변수가 설정되지 않았습니다.' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }

  try {
    const body = await req.json()
    const { budget, formData, crew, planTier } = body

    // 고정 단가
    const ICON_PRICE = 300000
    const PARTNER_PRICE = 100000
    const RISING_PRICE = 50000

    const payload = {
      records: [
        {
          fields: {
            // 기본 정보 — Airtable 필드명 그대로
            '숙소 이름을 적어주세요.': formData.accommodationName || '',
            '대표자명': formData.representativeName || '',
            '연락처': formData.phone || '',
            '캠지기님 이메일': formData.email || '',
            '숙소 위치': formData.region || '',

            // 예산 & 플랜 — Airtable 필드명·옵션 그대로
            '선택 예산': (budget === 'custom' || body.selectedPlan?.id === 'custom')
              ? '직접 결정할게요'
              : `${budget}만원 (vat 별도)`,
            '선택플랜': planTier || '',

            // 아이콘 크리에이터
            '아이콘 크리에이터 협찬 제안 금액': crew.icon > 0 ? ICON_PRICE : 0,
            '⭐️ 모집 희망 인원': crew.icon || 0,

            // 파트너 크리에이터
            '파트너 크리에이터 협찬 제안 금액': crew.partner > 0 ? PARTNER_PRICE : 0,
            '✔️ 모집 인원': crew.partner || 0,

            // 라이징 크리에이터
            '라이징 협찬 제안 금액': crew.rising > 0 ? RISING_PRICE : 0,
            '🔥 모집 인원': crew.rising || 0,

            // 사이트 종류
            '제공 가능한 사이트 종류': formData.siteTypes || [],

            // 동의 & 비고
            '동의합니다.': '동의',
            '프리미엄 협찬 관련 동의 사항': '동의',
            '비고': formData.additionalRequests || '',
          },
        },
      ],
    }

    const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}`
    const airtableRes = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!airtableRes.ok) {
      const errText = await airtableRes.text()
      return new Response(
        JSON.stringify({ error: `Airtable 오류 (${airtableRes.status})`, detail: errText }),
        {
          status: airtableRes.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    const result = await airtableRes.json()
    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}

export const config = {
  path: '/api/submit',
}
