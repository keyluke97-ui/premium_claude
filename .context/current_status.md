# Camfit Premium — Project Status

> 최종 업데이트: 2026-03-03
> Repo: `keyluke97-ui/premium_claude`
> 배포: Netlify (GitHub main push → 자동 배포)

---

## 1. 프로젝트 개요

캠핑장 대상 인플루언서 협찬 마케팅 신청 퍼널 웹앱.
캠핑장 사업자가 예산 선택 → 크리에이터 플랜 선택 → 정보 입력 → 약관 동의 → 신청 완료까지 6단계 퍼널을 거침.

- **Stack**: React 18 + Vite 5 + Tailwind CSS 3.4 + Framer Motion
- **Backend**: Netlify Serverless Function → Airtable API
- **Target**: 모바일 최적화 (max-width 448px)

---

## 2. 구현 완료 기능

### 퍼널 흐름 (6 Steps)

| Step | 컴포넌트 | 기능 |
|------|----------|------|
| 0 | `IntroStep` | 랜딩/인트로 화면, CTA 버튼 |
| 1 | `BudgetStep` | 예산 선택 (15/30/50만원 + 직접선택) |
| 2 | `PackageStep` | 플랜 상세 선택 or 커스텀 크루 카운터 |
| 3 | `InfoStep` | 캠핑장 정보 입력 (이름, 대표자, 연락처, 이메일, 권역, 사이트종류, 홍보문구) |
| 4 | `AgreementStep` | 이용약관 + 개인정보 동의 (개별 조항 critical ack 포함) |
| 5 | `CompleteStep` | 완료 화면 (입금 안내, 계좌번호 복사, 신청 요약) |

### 핵심 기능

- **예산별 플랜 매핑**: 15/30/50만원 각각 2~3개 플랜 제공 (`src/data/packages.js`)
- **커스텀 크루 선택**: '직접 선택할게요' → 아이콘/파트너/라이징 인원 카운터 (상한 10명)
- **가격 자동 계산**: 아이콘 30만, 파트너 10만, 라이징 5만 (VAT 별도) — `PRICING`, `calcCrewPrice()`, `calcCrewPriceWithVat()`
- **폼 유효성 검증**: 필수 필드 (캠핑장명, 대표자, 연락처, 이메일, 권역, 사이트종류) + 전화번호/이메일 포맷 검증
- **약관 동의**: 전체 동의 + 개별 동의 + critical 조항 개별 확인 (제2,5,7,8,9,13조)
- **Airtable 제출**: Netlify Serverless Function 경유 → Airtable '캠지기 모집 폼' 테이블
- **로컬 데모 모드**: localhost에서는 API 호출 없이 콘솔 로그만 출력
- **브라우저 뒤로가기 방어**: history API로 폼 이탈 방지
- **더블 제출 방지**: `useRef` lock + `isSubmitting` state 이중 방어
- **계좌번호 복사**: clipboard API + execCommand fallback (Safari/구 Android)
- **모바일 safe-area**: `env(safe-area-inset-bottom)` 노치 디바이스 대응

### UI/UX

- 다크 테마 (#111111 배경)
- 브랜드 컬러: #01DF82 (그린)
- Framer Motion 슬라이드 전환 (direction-aware)
- 프로그레스 바 (step/4)
- 입력 필드 포커스 하이라이트 + 에러 스타일링

---

## 3. 최근 해결한 이슈

### [P0] 에러 핸들링 강화 — `364784a` (2026-03-03)

**문제**: 제출 실패 시 `catch` 블록에서 `goTo(5)`가 호출되어 에러 상황에서도 완료 화면이 표시됨.

**해결**:
- `retryCount` state + `MAX_RETRY = 3` 상수 추가
- 에러 타입 3단계 분기:
  - **network**: `Failed to fetch` / `NetworkError` → "네트워크 연결을 확인해 주세요"
  - **server**: HTTP 4xx/5xx → "신청 중 문제가 발생했습니다"
  - **max_retry**: 3회 이상 실패 → "카카오톡 채널로 직접 문의해 주세요" + 카카오 버튼
- 에러 배너 UI: 빨간(1~2회) → 노란(3회+) + 카카오톡 링크 버튼
- 버튼 텍스트: 에러 시 "다시 시도하기"로 변경
- `airtable.js`: try-catch로 `NetworkError` / `ServerError` prefix 구분
- 카카오톡 채널 URL: `http://pf.kakao.com/_fBxaQG/chat`

### 이전 수정 이력

| 커밋 | 날짜 | 내용 |
|------|------|------|
| `e146b2d` | 2026-02-24 | 숙소 홍보 문구 입력란 추가 (promotion → Airtable) |
| `f6d1382` | 2026-02-24 | 직접선택 시 예산 '맞춤 상담' 표시 + 완료 안내 문구 수정 |
| `53734e4` | 2026-02-13 | 전체 버그 수정 8건 (하단 네비 중앙정렬, 더블제출 방지, clipboard fallback, 크루 상한, 전화번호 검증, step 0 방어, 뒤로가기 방어, safe-area) |
| `d70b002` | 2026-02-13 | CompleteStep 빈 화면 버그 수정 (priceWithVat undefined) |

---

## 4. 데이터 플로우 & 로직

### 제출 프로세스

```
[사용자 입력] → App.jsx handleSubmit()
  ↓
submitApplication() (src/utils/airtable.js)
  ↓
fetch('/api/submit') → Netlify Serverless Function
  ↓
netlify/functions/submit.js → Airtable API
  ↓
성공: goTo(5) 완료 화면
실패: submitError state → 에러 배너 표시
  └─ 3회 실패: 카카오톡 폴백
```

### Airtable 필드 매핑

| 프론트엔드 | Airtable 필드명 |
|-----------|----------------|
| formData.accommodationName | 숙소 이름을 적어주세요. |
| formData.representativeName | 대표자명 |
| formData.phone | 연락처 |
| formData.email | 캠지기님 이메일 |
| formData.region | 숙소 위치 |
| budget / selectedPlan | 선택예산 |
| planTier | 선택플랜 |
| crew.icon | 아이콘 크리에이터 협찬 제안 금액 |
| crew.icon | ⭐️ 모집 희망 인원 |
| crew.partner | 파트너 크리에이터 협찬 제안 금액 |
| crew.partner | ✔️ 모집 인원 |
| crew.rising | 라이징 협찬 제안 금액 |
| crew.rising | 🔥 모집 인원 |
| agreements | 동의합니다. / 프리미엄 협찬 관련 동의 사항 |
| formData.additionalRequests | 비고 |

### 가격 구조

| 크리에이터 등급 | 단가 (VAT 별도) |
|---------------|----------------|
| 아이콘 (Icon) | 300,000원 |
| 파트너 (Partner) | 100,000원 |
| 라이징 (Rising) | 50,000원 |

---

## 5. 파일 구조

```
camfit-premium/
├── netlify.toml              # Netlify 빌드 설정
├── netlify/functions/
│   └── submit.js             # Airtable 프록시 서버리스 함수
├── src/
│   ├── App.jsx               # 메인 앱 (퍼널 상태관리, 라우팅)
│   ├── main.jsx              # React 엔트리포인트
│   ├── index.css             # Tailwind 임포트
│   ├── components/steps/
│   │   ├── IntroStep.jsx     # Step 0: 랜딩
│   │   ├── BudgetStep.jsx    # Step 1: 예산 선택
│   │   ├── PackageStep.jsx   # Step 2: 플랜 선택 / 커스텀 크루
│   │   ├── InfoStep.jsx      # Step 3: 정보 입력
│   │   ├── AgreementStep.jsx # Step 4: 약관 동의
│   │   └── CompleteStep.jsx  # Step 5: 완료
│   ├── data/
│   │   ├── packages.js       # 예산별 플랜 데이터 + PRICING 상수
│   │   └── agreements.js     # 약관 데이터 (조항별)
│   └── utils/
│       └── airtable.js       # Airtable 제출 유틸 (NetworkError/ServerError 분기)
└── .context/
    └── current_status.md     # 이 파일
```

---

## 6. 환경변수 (Netlify)

| 변수명 | 용도 |
|--------|------|
| `AIRTABLE_API_KEY` | Airtable Personal Access Token |
| `AIRTABLE_BASE_ID` | Airtable Base ID |
| `AIRTABLE_TABLE_NAME` | 테이블명 (캠지기 모집 폼) |

---

## 7. 알려진 이슈 & Next Steps

### 현재 알려진 이슈

| 우선순위 | 이슈 | 설명 |
|---------|------|------|
| P1 | 성능 최적화 | PackageStep 카드 리스트 — 플랜 개수가 늘어나면 rerender 최적화 필요 (React.memo) |
| P1 | 접근성 | 키보드 네비게이션, aria-label 미구현 |
| P2 | 에러 로깅 | 에러 발생 시 Sentry 등 외부 모니터링 미연동 |
| P2 | GA/이벤트 트래킹 | 퍼널 단계별 전환율 추적 미구현 |
| P2 | OG 메타태그 | SNS 공유 시 미리보기 미설정 |

### Next Steps (제안)

1. **퍼널 전환율 트래킹** — GA4 or 자체 이벤트 로깅 (step 진입/이탈 시점)
2. **에러 모니터링** — Sentry 연동 (submitError 자동 리포트)
3. **A/B 테스트 기반** — 인트로 CTA 문구, 플랜 순서 등 전환율 최적화
4. **CRM 연동 강화** — Airtable → Slack 알림 자동화 (신규 신청 즉시 알림)
5. **접근성 개선** — WCAG 2.1 AA 기준 키보드/스크린리더 대응

---

## 8. [P0 예정 작업] 첫 신청 할인 패키지 시스템 (2026-04-07 확정)

> 다음 세션에서 구현 예정. 상세 플랜: `.claude/plans/reactive-swinging-spindle.md`

### 8-1. 배경

대시보드 데이터 분석(https://camfit-premium-dashboard.vercel.app/) 결과:
- 수요가 15~33만원 구간에 집중 (전체 캠핑장의 58%)
- 15만원 티어는 맛보기 플랜 1개뿐이라 선택지 부족
- 파트너 등급 신청률 85%로 과열, 아이콘/라이징은 35%로 저조
- 첫 신청 캠핑장의 진입 허들을 낮춰 신규 유입 확대 필요

### 8-2. 확정된 첫 신청 할인 단가 (등급별 고정, 정산 구조 유지)

| 등급 | 정가 | 첫 신청가 | 할인액 | 캠핏 수수료 | 크리에이터 실수령 |
|------|------|---------|--------|-----------|--------------|
| 아이콘 | 30만 | **25만** | -5만 | 2만→**1만** | 28만→**24만** (↓4만) |
| 파트너 | 15만 | **12만** | -3만 | 2만→**1만** | 13만→**11만** (↓2만) |
| 라이징 | 10만 | **7만** | -3만 | 2만→**1만** | 8만→**6만** (↓2만) |

> 캠핏 수수료: 전 등급 일괄 2만→1만 인하
> 첫 신청 판단 기준: 사업자번호 기준, 프리미엄 협찬 최초 신청 여부

### 8-3. 할인 적용 대상 패키지 (라이징 only 대형 패키지 제외)

쏠림 방지를 위해 **라이징만으로 구성된 패키지 중 2슬롯 이상은 할인 미적용**.
라이징 체험(1슬롯)은 진입 상품이므로 할인 적용.

| 플랜 | 구성 | 정가 | 첫신청가 | 할인율 | 할인 |
|------|------|------|---------|--------|------|
| 라이징 체험 (신규) | 라이징1 | 10만 | **7만** | 30% | **O** |
| 맛보기 | 파트너1 | 15만 | **12만** | 20% | **O** |
| 스타터 (신규) | 파트너1+라이징1 | 25만 | **19만** | 24% | **O** |
| 원픽 | 아이콘1 | 30만 | **25만** | 17% | **O** |
| 실속 파트너 | 파트너2 | 30만 | **24만** | 20% | **O** |
| 입문 | 라이징3 | 30만 | 30만 | - | **X** |
| 베스트 | 아이콘1+라이징2 | 50만 | **39만** | 22% | **O** |
| 알찬 프로 | 파트너2+라이징2 | 50만 | **38만** | 24% | **O** |
| 확산 | 라이징5 | 50만 | 50만 | - | **X** |
| 올인원 | 아이콘1+파트너2+라이징1 | 70만 | **56만** | 20% | **O** |
| 대박 아이콘 | 아이콘2+라이징1 | 70만 | **57만** | 19% | **O** |
| 물량 라이징 | 파트너2+라이징4 | 70만 | **52만** | 26% | **O** |

### 8-4. 15만원 티어 확장 → '10~25만원'

기존 맛보기 플랜 1개 → 3개 플랜으로 확장:

| 플랜 | 구성 | 가격 (VAT별도) | 비고 |
|------|------|--------------|------|
| 라이징 체험 플랜 (신규) | 라이징 1명 | 10만원 | 최저가 진입 상품 |
| 맛보기 플랜 (기존) | 파트너 1명 | 15만원 | 기존 유지 |
| 스타터 플랜 (신규) | 파트너1 + 라이징1 | 25만원 | 2등급 조합 |

BudgetStep 라벨: `'15만원'` → `'10~25만원'`
PACKAGES 키: `15` 유지 (App.jsx 라우팅 호환)

### 8-5. 구현 범위 & 수정 파일

| 순서 | 파일 | 작업 |
|------|------|------|
| 0 | Airtable `협찬신청` 테이블 | `사업자번호`, `첫신청할인`, `할인전금액` 필드 추가 |
| 1 | `src/data/packages.js` | 15만원 티어 3플랜 확장 + DISCOUNT_PRICING export + computeDiscountedPlan 함수 |
| 2 | `src/components/steps/BudgetStep.jsx` | value:15 라벨 `'10~25만원'`으로 변경 |
| 3 | `netlify/functions/check-first-time.js` | **신규 생성** — 사업자번호로 Airtable 조회 → 첫 신청 여부 반환 |
| 4 | `src/components/steps/PackageStep.jsx` | 사업자번호 입력 UI + 할인가 표시 + 할인 미적용 패키지 구분 |
| 5 | `src/components/steps/InfoStep.jsx` | sessionStorage에서 사업자번호 읽어 formData에 전달 + 읽기전용 표시 |
| 6 | `netlify/functions/submit.js` | 필드 매핑 3줄 추가 (사업자번호, 첫신청할인, 할인전금액) |

### 8-6. 기술적 제약

- **FunnelPage.jsx 수정 금지** — 스텝 흐름 변경 불가, PackageStep 내부에서 사업자번호 입력 처리
- **submit.js는 필드 매핑만 추가** — 구조/로직 변경 불가
- **sessionStorage**로 스텝 간 데이터 전달 (bizNumber, isFirstTime)
- **ES Module 문법만** 사용 (Netlify Functions)
- **기존 dashboard-lookup.js** 패턴 참고하여 check-first-time.js 작성
- 등급별 단가 구조(정가/할인가 고정) 유지 — 패키지별 임의 할인율 적용 금지 (정산 일관성)

### 8-7. 검증 방법

1. `npm run build` — 빌드 성공
2. 로컬 퍼널 테스트: 10~25만원 티어 → 3플랜 표시 확인
3. 사업자번호 입력 → 할인가/미적용 패키지 구분 표시 확인
4. 제출 payload에 사업자번호, 첫신청할인, 할인전금액 포함 확인
5. Netlify 배포 후 `/api/check-first-time` 엔드포인트 동작 확인
