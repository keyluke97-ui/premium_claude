# 캠핏 프리미엄 협찬 — 캠지기 신청 퍼널 인수인계 문서

> 최종 작성일: 2026-03-18
> 작성자: Claude (AI Assistant)
> 대상 코드: `camfit-premium/` 디렉토리 (로컬 작업본) / GitHub `keyluke97-ui/premium_claude` 레포의 퍼널 관련 파일
> 배포: Netlify (GitHub main 브랜치 push → 자동 빌드)

---

## §1. 프로젝트 개요

캠지기(캠핑장 운영자)가 프리미엄 협찬을 신청하는 **모바일 최적화 퍼널 페이지**.
6단계 스텝 UI로 구성되며, 최종 제출 시 Netlify Serverless Function을 경유하여 Airtable에 레코드가 생성된다.

### KPI
- **프리미엄 협찬 신청 완료 수** (step 5 도달)

### 기술 스택
| 항목 | 스택 |
|------|------|
| 프론트엔드 | React 18 + Vite |
| 스타일링 | Tailwind CSS + inline style |
| 애니메이션 | Framer Motion |
| 아이콘 | Lucide React |
| 서버리스 | Netlify Functions (ES Module) |
| 데이터 저장 | Airtable REST API |
| 배포 | Netlify (GitHub main 연동 자동 배포) |

---

## §2. 퍼널 흐름 (6단계)

```
Step 0: 인트로 (IntroStep)
  ↓ CTA "30초만에 신청하기" 클릭
Step 1: 예산 선택 (BudgetStep)
  ↓ 예산 금액 선택 (70/50/30/15만원)
  ↓ "직접 결정할게요" 선택 시 → Step 3으로 스킵 (Step 2 건너뜀)
Step 2: 플랜 선택 (PackageStep)
  ↓ 해당 예산 내 플랜 카드 선택
Step 3: 캠핑장 정보 입력 (InfoStep)
  ↓ 필수 필드 검증 통과
Step 4: 유의사항 & 계약 동의 (AgreementStep)
  ↓ 전체 필수 동의 후 "신청 완료하기"
Step 5: 완료 (CompleteStep)
  → 입금 안내 + 신청 내용 요약 표시
```

### 핵심 분기 로직 (`App.jsx`)
- `budget === 'custom'` 선택 시: Step 1 → Step 3 직행 (패키지 선택 스킵)
- 뒤로가기(`goBack`): Step 3에서 `budget === 'custom'`이면 Step 1로, 그 외엔 이전 Step으로

---

## §3. 파일 구조

```
camfit-premium/
├── src/
│   ├── App.jsx                          # 메인 퍼널 컨트롤러 (상태 관리, 네비게이션, 제출)
│   ├── main.jsx                         # 엔트리포인트
│   ├── components/
│   │   └── steps/
│   │       ├── IntroStep.jsx            # Step 0: 인트로 랜딩
│   │       ├── BudgetStep.jsx           # Step 1: 예산 선택
│   │       ├── PackageStep.jsx          # Step 2: 플랜 선택 + 등급 안내 모달
│   │       ├── InfoStep.jsx             # Step 3: 캠핑장 정보 폼
│   │       ├── AgreementStep.jsx        # Step 4: 계약 동의
│   │       └── CompleteStep.jsx         # Step 5: 완료 + 입금 안내
│   ├── data/
│   │   ├── packages.js                  # PRICING 상수 + 10개 플랜 정의
│   │   └── agreements.js                # 계약 약관 + 개인정보 동의 데이터
│   └── utils/
│       └── airtable.js                  # Airtable 제출 함수 (localhost 데모 모드 포함)
├── netlify/
│   └── functions/
│       └── submit.js                    # Serverless: Airtable API 프록시
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## §4. 상태 관리 (`App.jsx`)

모든 상태는 `App.jsx`에서 `useState`로 관리한다. 별도 상태 관리 라이브러리 없음.

| 상태 | 타입 | 용도 |
|------|------|------|
| `step` | number (0~5) | 현재 퍼널 단계 |
| `direction` | 1 or -1 | 슬라이드 애니메이션 방향 |
| `budget` | number \| 'custom' \| null | 선택한 예산 (70/50/30/15 또는 'custom') |
| `selectedPlan` | object \| null | 선택한 플랜 객체 (packages.js의 plan) |
| `formData` | object | 캠핑장 정보 입력값 |
| `errors` | object | 필드별 검증 에러 메시지 |
| `agreements` | `{ contract, privacy }` | 약관 동의 상태 (boolean) |
| `isSubmitting` | boolean | 제출 중 여부 |
| `submitError` | object \| null | 제출 에러 정보 |
| `retryCount` | number | 제출 재시도 횟수 (최대 3회) |

### 에러 처리 전략
- 최대 3회(`MAX_RETRY`) 재시도 가능
- 3회 초과 시 카카오톡 채널(`http://pf.kakao.com/_fBxaQG/chat`)로 유도
- 에러 유형: `network` (네트워크), `server` (서버), `max_retry` (최대 초과)

---

## §5. 예산 & 플랜 체계

### 5-1. 예산 구간 (`BudgetStep.jsx`)

| 예산 | 라벨 | 서브타이틀 | 이모지 |
|------|------|-----------|--------|
| 70만원 | 최대 효과를 원하는 캠핑장 | 💎 | #FF7300 |
| 50만원 | 효과와 효율 모두 잡는 캠핑장 | ⭐ | #1975FF |
| 30만원 | 합리적인 시작을 원하는 캠핑장 | 🌱 | #01DF82 |
| 15만원 | 가볍게 시작해보고 싶은 캠핑장 | 👋 | #A0AEC0 |
| 직접 결정 | 맞춤 상담을 통해 최적의 플랜 | ✏️ | #727CF5 |

### 5-2. 크리에이터 등급 단가 (`packages.js` → `PRICING`)

| 등급 | 단가 (VAT 별도) | 색상 |
|------|-----------------|------|
| 아이콘 (Icon) | 300,000원 | #FF383C |
| 파트너 (Partner) | 150,000원 | #1975FF |
| 라이징 (Rising) | 100,000원 | #01DF82 |

> **주의**: 이전 단가는 아이콘 30만 / 파트너 10만 / 라이징 5만이었으나, 2026-03-18 세션에서 파트너 15만 / 라이징 10만으로 상향 반영됨.

### 5-3. 전체 플랜 목록 (10개, 4개 예산 구간)

#### 70만원 (3개)

| ID | 이름 | 구성 | 총원 | 가격(VAT별도) | VAT포함 |
|----|------|------|------|-------------|---------|
| allinone-70 | 올인원 플랜 | 아이콘1 + 파트너2 + 라이징1 | 4명 | 700,000 | 770,000 |
| bigicon-70 | 대박 아이콘 플랜 | 아이콘2 + 라이징1 | 3명 | 700,000 | 770,000 |
| volume-70 | 물량 라이징 플랜 | 파트너2 + 라이징4 | 6명 | 700,000 | 770,000 |

#### 50만원 (3개)

| ID | 이름 | 구성 | 총원 | 가격(VAT별도) | VAT포함 |
|----|------|------|------|-------------|---------|
| best-50 | 베스트 플랜 | 아이콘1 + 라이징2 | 3명 | 500,000 | 550,000 |
| rich-50 | 알찬 프로 플랜 | 파트너2 + 라이징2 | 4명 | 500,000 | 550,000 |
| spread-50 | 확산 플랜 | 라이징5 | 5명 | 500,000 | 550,000 |

#### 30만원 (3개)

| ID | 이름 | 구성 | 총원 | 가격(VAT별도) | VAT포함 |
|----|------|------|------|-------------|---------|
| onepick-30 | 원픽 플랜 | 아이콘1 | 1명 | 300,000 | 330,000 |
| value-30 | 실속 파트너 플랜 | 파트너2 | 2명 | 300,000 | 330,000 |
| beginner-30 | 입문 플랜 | 라이징3 | 3명 | 300,000 | 330,000 |

#### 15만원 (1개)

| ID | 이름 | 구성 | 총원 | 가격(VAT별도) | VAT포함 |
|----|------|------|------|-------------|---------|
| taste-15 | 맛보기 플랜 | 파트너1 | 1명 | 150,000 | 165,000 |

---

## §6. 데이터 제출 흐름

```
[프론트엔드]
  submitApplication({ budget, selectedPlan, formData })
    ↓
  POST /api/submit (JSON body)
    ↓
[Netlify Serverless Function: submit.js]
  환경변수 검증 → Airtable REST API POST
    ↓
[Airtable: "협찬신청" 테이블]
  레코드 생성
```

### 6-1. Airtable 필드 매핑

| Airtable 필드 | 소스 | 타입 |
|---------------|------|------|
| 캠핑장이름 | `formData.accommodationName` | Single line text |
| 대표자명 | `formData.representativeName` | Single line text |
| 연락처 | `formData.phone` | Phone number |
| 이메일 | `formData.email` | Email |
| 소재권역 | `formData.region` | Single select |
| 선택예산 | `${budget}만원` 또는 `'맞춤상담'` | Single select |
| 선택플랜 | `selectedPlan?.name` 또는 `'맞춤 상담 요청'` | Single line text |
| 추가요청 | `formData.additionalRequests` | Long text |
| 신청일시 | `new Date().toISOString()` | Date |

### 6-2. 환경변수 (Netlify Dashboard에서 설정)

| 변수명 | 설명 | 필수 |
|--------|------|------|
| `AIRTABLE_API_KEY` | Airtable Personal Access Token | ✅ |
| `AIRTABLE_BASE_ID` | Airtable Base ID | ✅ |
| `AIRTABLE_TABLE_NAME` | 테이블명 (기본값: `협찬신청`) | 선택 |

### 6-3. 로컬 개발 데모 모드
`localhost`에서 실행 시 실제 API 호출 없이 콘솔 로그만 출력하고 1.2초 딜레이 후 성공 반환.

---

## §7. 폼 검증 규칙 (`App.jsx` → `validateForm`)

| 필드 | 검증 조건 | 에러 메시지 |
|------|-----------|------------|
| accommodationName | 빈 값 불가 | 캠핑장 이름을 입력해주세요 |
| representativeName | 빈 값 불가 | 대표자명을 입력해주세요 |
| phone | 빈 값 불가 | 연락처를 입력해주세요 |
| email | 빈 값 불가 + 이메일 형식 | 이메일을 입력해주세요 / 올바른 이메일 형식을 입력해주세요 |
| region | 미선택 불가 | 소재 권역을 선택해주세요 |

> 이메일 정규식: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

### 소재 권역 옵션 (InfoStep.jsx)
경기도, 강원도, 충청도, 경상도, 전라도, 제주도 (6개)

---

## §8. 약관 동의 체계 (`agreements.js`)

두 개의 필수 동의 항목으로 구성. 모두 동의해야 제출 가능.

| ID | 제목 | 필수 | 조항 수 |
|----|------|------|---------|
| `contract` | 서비스 이용약관 (계약서 갈음) | ✅ | 13조 |
| `privacy` | 개인정보 수집·이용 동의 | ✅ | 3항 |

### 서비스 이용약관 핵심 조항 (critical 표시된 것)
- **제2조**: 매칭 완료 후 조건 변경 불가
- **제5조**: 선수납 방식
- **제7조**: 미집행 금액만 환불 가능
- **제8조**: 성과 미보장 (면책)
- **제9조**: 주관적 퀄리티 사유 환불 불가
- **제13조**: 노쇼 페널티 (예외 사유 3가지 존재)

> **참고**: 약관 데이터에는 하드코딩된 금액이 없음 — "협찬 금액은 크리에이터 협찬 1건(1객실) 기준"과 같이 일반적 표현만 사용.

---

## §9. 완료 화면 (`CompleteStep.jsx`)

신청 완료 후 표시되는 정보:

### 입금 안내
- 은행: **하나은행**
- 계좌: **225-910068-71204** (복사 버튼 제공)
- 예금주: **(주) 넥스트에디션**
- 입금 금액: `plan.priceWithVat` (VAT 포함가)
- 안내: "선수납 방식 — 입금 확인 후 협찬이 진행됩니다"

### 신청 내용 요약
캠핑장명, 예산, 선택 플랜, 대표자, 연락처, 이메일, 소재 권역

---

## §10. UI/UX 특징

### 디자인 시스템
- **배경**: `#0A0A0A` (인트로), `#111111` (퍼널 본문)
- **메인 액센트**: `#01DF82` (캠핏 그린)
- **에러**: `#FF383C`
- **경고**: `#FFC107`
- **모바일 최적화**: `max-width: 448px` (md 기준), 터치 영역 최소 44px

### 애니메이션
- 스텝 전환: 슬라이드(direction 기반 좌/우) + 페이드
- 버튼: `whileTap={{ scale: 0.97~0.98 }}`
- 요소 진입: `y: 12~20` → `y: 0` + stagger delay
- 스프링: 바텀시트에 `type: 'spring', damping: 25, stiffness: 300`

### 프로그레스 바
- Step 1~4 구간에서 표시
- `progress = (step / 4) * 100`
- Step 0(인트로), Step 5(완료)에서는 미표시

### 하단 네비게이션
- Step 2~4에서만 표시 (`showBottomNav`)
- 고정 위치(`fixed bottom-0`), 최대 448px

---

## §11. GitHub 레포와의 차이점

로컬 `camfit-premium/` 디렉토리와 GitHub `keyluke97-ui/premium_claude` 레포는 **구조가 다르다**.

| 항목 | 로컬 `camfit-premium/` | GitHub 레포 |
|------|----------------------|-------------|
| 라우팅 | 퍼널만 단독 | React Router: `/` 퍼널 + `/dashboard/*` 대시보드 |
| 등급 안내 | `PackageStep.jsx` 내 `TierInfoModal` | 별도 `CreatorGuideSheet.jsx` 바텀시트 |
| 플랜 데이터 구조 | `breakdown: [{ tier, count }]` 배열 | `crew: { icon, partner, rising }` 객체 |
| 가격 계산 | `PRICING` export + `BreakdownLine` 컴포넌트 | `calcCrewPrice`, `calcCrewPriceWithVat` 함수 |

> **중요**: 단가 변경 등 수정 시 양쪽 모두 반영해야 한다. GitHub 레포가 실제 배포본이므로 최종 반영은 GitHub 레포 기준.

---

## §12. 단가 변경 시 수정 체크리스트

단가가 변경될 때 아래 파일을 **모두** 확인·수정해야 한다.

### 로컬 `camfit-premium/`
1. `src/data/packages.js` → `PRICING` 상수 + 각 플랜의 `price`, `priceWithVat`
2. `src/components/steps/PackageStep.jsx` → `TIER_DESCRIPTIONS` 내 텍스트 (필요 시)

### GitHub 레포 (`keyluke97-ui/premium_claude`)
1. `src/data/packages.js` → `PRICING`, `calcCrewPrice`, `calcCrewPriceWithVat`
2. `src/components/CreatorGuideSheet.jsx` → 등급별 `price` 텍스트
3. `src/components/steps/BudgetStep.jsx` → 예산 옵션 라벨
4. `netlify/functions/submit.js` → `PARTNER_PRICE`, `RISING_PRICE` 상수
5. `netlify/functions/dashboard-modify.js` → `DEFAULT_UNIT_PRICES` 폴백
6. `src/pages/dashboard/components/ModifyCrewModal.jsx` → 폴백 `unitPrices`

### VAT 계산 규칙
- VAT = 공급가 × 10%
- `priceWithVat = price × 1.1`
- 예: 700,000원 → 770,000원

---

## §13. 2026-03-18 변경 이력

이번 세션에서 적용된 변경사항:

### 단가 상향
- 파트너: 100,000원 → **150,000원**
- 라이징: 50,000원 → **100,000원**
- 아이콘: 300,000원 (변경 없음)

### 플랜 이름 직관화 (10개)
| 이전 | 변경 후 |
|------|--------|
| 시그니처 플랜 | 베스트 플랜 |
| 밸런스 플랜 | 알찬 프로 플랜 |
| 웨이브 플랜 | 확산 플랜 |
| 더블 아이콘 플랜 | 대박 아이콘 플랜 |
| 매스 라이징 플랜 | 물량 라이징 플랜 |
| 듀오 플랜 | 실속 파트너 플랜 |
| 트리플 라이징 플랜 | 입문 플랜 |

### 15만원 맛보기 티어 추가
- `BudgetStep.jsx`에 15만원 옵션 추가
- `packages.js`에 `15` 키 + `taste-15` 플랜 추가
- 구성: 파트너 1명 / 150,000원 (VAT 포함 165,000원)

### 예산 구간 변경
- 이전: 15만/30만/50만 + custom
- 변경 후: **70만/50만/30만/15만** + custom

---

## §14. 주의사항 및 유지보수 팁

1. **`agreements.js`는 단가 변경 영향 없음**: 일반적 표현만 사용하므로 단가 변경 시 수정 불요.
2. **Airtable `선택예산` 필드**: Single select 타입이므로, 새 예산 구간 추가 시 Airtable 측에서도 옵션 추가 필요. 현재 옵션: `70만원`, `50만원`, `30만원`, `15만원`, `맞춤상담`.
3. **카카오톡 채널 URL**: `http://pf.kakao.com/_fBxaQG/chat` — 변경 시 `App.jsx`의 `KAKAO_CHANNEL_URL` 상수 수정.
4. **입금 계좌**: `CompleteStep.jsx`에 하드코딩. 변경 시 해당 파일의 `accountNumber` 상수 수정.
5. **로컬 데모 모드**: `localhost`에서는 Airtable 실제 제출이 이루어지지 않음. 프로덕션 테스트는 Netlify deploy preview에서 수행.
6. **Airtable 환경변수 미설정 시**: 서버리스 함수가 500 에러를 반환하며, 프론트에서 재시도 UI 표시.

---

## §15. 향후 개선 사항

- [ ] 단가 변경 시 영향받는 파일 목록 관리 자동화 (대시보드 인수인계 문서에도 동일 건 기재)
- [ ] Airtable `선택예산` 필드 자동 동기화
- [ ] 폼 데이터 로컬 스토리지 임시 저장 (이탈 방지)
- [ ] 전화번호 포맷 자동 정리 (하이픈 자동 삽입)
- [ ] 캠핏 앱 내 웹뷰 연동 시 인증 토큰 전달 방식 검토
