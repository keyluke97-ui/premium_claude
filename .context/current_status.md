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
