/**
 * Netlify Serverless Function — Airtable 프록시
 *
 * Airtable API 키를 서버에서만 사용하므로 프론트엔드에 노출되지 않습니다.
 * Netlify 대시보드 > Site settings > Environment variables 에서 설정:
 *   - AIRTABLE_API_KEY
 *   - AIRTABLE_BASE_ID
 *   - AIRTABLE_TABLE_NAME (선택, 기본값: 협찬신청)
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
  const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || '협찬신청'

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
    const { budget, selectedPlan, formData } = body

    const payload = {
      records: [
        {
          fields: {
            캠핑장이름: formData.accommodationName || '',
            대표자명: formData.representativeName || '',
            연락처: formData.phone || '',
            이메일: formData.email || '',
            소재권역: formData.region || '',
            선택예산: budget === 'custom' ? '맞춤상담' : `${budget}만원`,
            선택플랜: selectedPlan?.name || '맞춤 상담 요청',
            추가요청: formData.additionalRequests || '',
            신청일시: new Date().toISOString(),
          },
        },
      ],
    }

    const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}`
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
