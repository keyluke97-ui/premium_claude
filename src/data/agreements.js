const AGREEMENTS = [
  {
    id: 'contract',
    title: '서비스 이용약관 (계약서 갈음)',
    required: true,
    summary: '본 내용은 계약서에 갈음합니다. 동의 없이는 프리미엄 협찬 진행이 불가합니다.',
    clauses: [
      {
        num: '제1조',
        title: '매칭 시점',
        text: '크리에이터가 공고 확인 후 신청한 시점에 \'매칭 완료\'로 간주됩니다.',
      },
      {
        num: '제2조',
        title: '변경 불가',
        text: '매칭 완료 이후에는 크리에이터 변경, 인원 축소, 금액 조정 등 협찬 조건 변경이 불가합니다.',
        critical: true,
      },
      {
        num: '제3조',
        title: '기준',
        text: '협찬 금액은 크리에이터 협찬 1건(1객실) 기준이며, 제안 인원수에 따라 총액이 산정됩니다.',
      },
      {
        num: '제4조',
        title: '부가세',
        text: '협찬 금액은 부가세 별도이며, 입금 시 공급가와 부가세를 포함한 총액을 납부해야 합니다.',
      },
      {
        num: '제5조',
        title: '선수납',
        text: '본 서비스의 유료협찬 비용은 선수납 방식이며, 해당 금액은 협찬 집행을 위한 중개 집행 요청금입니다.',
        critical: true,
      },
      {
        num: '제6조',
        title: '변동성',
        text: '협찬은 지원 상황에 따라 모집 미달 혹은 취소 등이 발생할 수 있습니다.',
      },
      {
        num: '제7조',
        title: '환불',
        text: '부분 집행 시, 집행 완료 건을 제외한 미집행 금액에 한해서만 환불이 가능합니다.',
        critical: true,
      },
      {
        num: '제8조',
        title: '성과 면책',
        text: '콘텐츠의 조회수·반응 등 성과는 보장되지 않습니다. (크리에이터 등급은 평균 지표임)',
        critical: true,
      },
      {
        num: '제9조',
        title: '퀄리티 면책',
        text: '표현 방식, 연출 등 주관적 요소를 이유로 환불·재제작 요구는 불가합니다.',
        critical: true,
      },
      {
        num: '제10조',
        title: '수정',
        text: '사실 정보 오류에 한해 1회 수정 가능하며, 연출·구성에 대한 수정 요청은 불가합니다.',
      },
      {
        num: '제11조',
        title: '진행 기한 및 미제출',
        text: '크리에이터는 매칭 완료 후 2개월 이내 방문을 완료하며, 퇴실일로부터 14일 이내 콘텐츠를 업로드합니다. 미제출 시 동일 등급 대체 매칭을 진행하며 숙박권 금전 보상은 불가합니다.',
      },
      {
        num: '제12조',
        title: '분쟁',
        text: '캠핏은 소통을 지원하나, 최종 분쟁 해결은 당사자 간 합의를 원칙으로 합니다.',
      },
      {
        num: '제13조',
        title: '노쇼 및 페널티',
        text: '인플루언서의 노쇼(No-show) 또는 개인 사정으로 인한 예약 취소 시 발생하는 수수료 및 숙박비는 보상되지 않습니다.',
        critical: true,
        exception: {
          title: '페널티 미부여 사유',
          items: [
            '가족 및 본인의 질병, 사망, 사고',
            '천재지변',
            '위 내용을 제외한 기타 불가피한 사유',
          ],
        },
      },
    ],
  },
  {
    id: 'privacy',
    title: '개인정보 수집·이용 동의',
    required: true,
    summary: '서비스 제공을 위한 최소한의 정보를 수집합니다.',
    clauses: [
      { num: '수집 항목', text: '숙소명, 대표자명, 연락처, 이메일, 소재 권역' },
      { num: '이용 목적', text: '협찬 서비스 진행, 일정 안내, 레포트 수신' },
      { num: '보유 기간', text: '서비스 종료 후 1년 (동의 철회 시 즉시 파기)' },
    ],
  },
]

// 팔로워 쿠폰 이벤트 약관 (쿠폰 이벤트 ON일 때만 AgreementStep에 추가 노출)
// 단순 필수 동의 항목 — critical 개별 동의 없음(계약 약관의 CRITICAL_INDICES와 분리).
export const COUPON_AGREEMENT = {
  id: 'coupon',
  title: '팔로워 쿠폰 이벤트 약관',
  required: true,
  summary: '팔로워 쿠폰 이벤트를 함께 진행하는 경우 적용됩니다.',
  clauses: [
    {
      num: '제1조',
      title: '쿠폰 할인 부담',
      text: '캠지기는 팔로워 쿠폰이 사용된 예약 1건당 신청 시 설정한 할인 금액을 부담합니다. 예약 박수와 무관하게 쿠폰 1장은 1건의 예약에 1회 적용되며, 선택한 쿠폰 적용 요일 범위 내 평일·주말·공휴일 동일 금액 할인이 적용됩니다. 쿠폰이 사용되지 않은 경우 비용은 발생하지 않습니다.',
    },
    {
      num: '제2조',
      title: '쿠폰 발급·유효 기간',
      text: '쿠폰은 매칭된 크리에이터 콘텐츠를 통해 팔로워에게 발급되며, 신청 시 설정한 쿠폰 유효 기간 내에만 사용할 수 있습니다.',
    },
    {
      num: '제3조',
      title: '캠페인 마감·변경',
      text: '쿠폰 이벤트는 모집 인원 충족 시 자동 마감되며, 진행 중 임의 조건 변경은 불가합니다. 변경이 필요한 경우 회사에 요청해야 합니다.',
    },
    {
      num: '제4조',
      title: '노쇼 시 쿠폰 보류',
      text: '매칭된 크리에이터가 방문하지 않는 경우 대체 매칭이 진행되며, 그 기간 동안 쿠폰은 자동 보류되어 캠지기 부담이 발생하지 않습니다.',
    },
  ],
}

// contract.clauses 중 critical=true인 항목의 인덱스 — 단일 출처
// FunnelPage(검증)와 AgreementStep(UI)가 모두 import해서 사용.
const CONTRACT_AGREEMENT = AGREEMENTS.find((a) => a.id === 'contract')
export const CRITICAL_CONTRACT_INDICES = CONTRACT_AGREEMENT
  ? CONTRACT_AGREEMENT.clauses
      .map((c, i) => (c.critical ? i : -1))
      .filter((i) => i >= 0)
  : []

export default AGREEMENTS
