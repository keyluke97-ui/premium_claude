# 캠지기 프리미엄 협찬 대시보드 — 핸드오버 문서

> **최종 작성일**: 2026-03-14 (로그인 3중 인증 + modify 로직 개선 반영)
> **프로젝트 위치**: `camjigi_claude/premium_dashboard/`
> **배포 플랫폼**: Netlify (SPA + Serverless Functions)
> **GitHub**: `keyluke97-ui/premium_claude`

---

## 1. 프로젝트 개요

이 프로젝트는 **두 개의 독립적인 웹 앱**이 하나의 도메인에 공존하는 구조다.

| 구분 | 기존 퍼널 | 캠지기 대시보드 (신규) |
|------|-----------|----------------------|
| 사용자 | 캠지기 (캠핑장 운영자) — 신규 신청 | 캠지기 — 기존 신청 건 관리 |
| 경로 | `/` | `/dashboard/login`, `/dashboard` |
| 핵심 기능 | 프리미엄 협찬 신청 폼 (퍼널) | 신청 현황 조회, 인원 변경, 환불 요청 |
| 데이터 | Airtable 직접 호출 (프론트) | Netlify Functions → Airtable (백엔드) |
| 인증 | 없음 | 사업자번호 + 캠핑장 선택 + 연락처 뒷자리 4자리 → JWT |

**핵심 제약**: 기존 퍼널(`FunnelPage.jsx`)은 절대 수정하지 않는다. 대시보드는 완전히 별도 경로·별도 컴포넌트로 분리되어 있다.

---

## 2. 기술 스택

| 영역 | 기술 | 버전 |
|------|------|------|
| 프레임워크 | React | 18.2 |
| 빌드 | Vite | 5.x |
| 라우팅 | react-router-dom | 7.13 |
| 스타일링 | Tailwind CSS | 3.4 |
| 애니메이션 | Framer Motion | 11.x |
| 아이콘 | lucide-react | 0.263 |
| 백엔드 | Netlify Serverless Functions | Node.js 18 |
| DB | Airtable API | — |
| 인증 | 자체 JWT (Node.js `crypto`, HS256) | — |

외부 라이브러리 설치 없이 JWT를 구현했다 (`netlify/functions/jwt-utils.js`). 별도 `jsonwebtoken` 패키지 불필요.

---

## 3. 폴더 구조

```
premium_dashboard/
├── index.html                          # Vite 진입점
├── package.json                        # 의존성
├── netlify.toml                        # Netlify 배포 설정
├── vite.config.js                      # Vite 설정
├── tailwind.config.js                  # Tailwind 설정
├── postcss.config.js                   # PostCSS 설정
├── .env.example                        # 환경변수 템플릿 (퍼널용)
├── .context/current_status.md          # 프로젝트 진행 상태 메모
│
├── netlify/functions/                  # ★ 서버리스 백엔드
│   ├── jwt-utils.js                    # JWT 생성/검증 유틸
│   ├── dashboard-lookup.js             # 사업자번호 → 캠핑장 목록
│   ├── dashboard-auth.js               # 로그인 → JWT 발급
│   ├── dashboard-data.js               # 대시보드 데이터 조회
│   ├── dashboard-modify.js             # 크루 인원 변경
│   ├── dashboard-refund.js             # 환불 요청
│   └── submit.js                       # 기존 퍼널용 (건드리지 말 것)
│
├── src/
│   ├── main.jsx                        # 엔트리포인트 (BrowserRouter 래핑)
│   ├── App.jsx                         # ★ 라우터 정의
│   │
│   ├── constants/
│   │   └── designTokens.js             # 대시보드 디자인 토큰 중앙 관리
│   │
│   ├── utils/
│   │   ├── dashboardApi.js             # ★ 대시보드 API 클라이언트
│   │   └── airtable.js                 # 기존 퍼널용 (건드리지 말 것)
│   │
│   ├── pages/
│   │   ├── FunnelPage.jsx              # 기존 퍼널 (★ 절대 수정 금지)
│   │   └── dashboard/
│   │       ├── LoginPage.jsx           # 로그인 페이지
│   │       ├── DashboardPage.jsx       # 메인 대시보드
│   │       └── components/
│   │           ├── StatusCard.jsx      # 결제 현황 카드
│   │           ├── RecruitmentProgress.jsx  # 등급별 모집 진행률
│   │           ├── CreatorList.jsx     # 배정 크리에이터 목록
│   │           ├── ModifyCrewModal.jsx # 인원 변경 바텀시트 모달
│   │           └── RefundModal.jsx     # 환불 요청 바텀시트 모달
│   │
│   ├── components/                     # 기존 퍼널용 컴포넌트
│   │   ├── CreatorGuideSheet.jsx
│   │   └── steps/                      # 퍼널 스텝 컴포넌트들
│   │
│   ├── data/                           # 기존 퍼널용 데이터
│   │   ├── agreements.js
│   │   └── packages.js
│   │
│   └── styles/
│       └── index.css                   # Tailwind 디렉티브 + 전역 스타일
│
└── dist/                               # 빌드 산출물 (Netlify가 서빙)
```

**수정 가능 영역**: `src/pages/dashboard/`, `src/utils/dashboardApi.js`, `netlify/functions/dashboard-*.js`
**수정 금지 영역**: `src/pages/FunnelPage.jsx`, `src/components/`, `src/data/`, `src/utils/airtable.js`, `netlify/functions/submit.js`

---

## 4. 라우팅

`src/App.jsx`에서 정의. Lazy loading + Suspense 적용.

| 경로 | 컴포넌트 | 설명 |
|------|----------|------|
| `/` | `FunnelPage` | 프리미엄 협찬 신청 퍼널 (기존) |
| `/dashboard/login` | `LoginPage` | 사업자번호 입력 → 캠핑장 선택 |
| `/dashboard` | `DashboardPage` | 메인 대시보드 (인증 필요) |
| `*` | `Navigate to /` | 나머지 경로 → 퍼널로 리다이렉트 |

`netlify.toml`의 `[[redirects]]`가 모든 경로를 `index.html`로 보내서 SPA 라우팅을 처리한다.

---

## 5. 인증 플로우

```
[사용자] Step 1: 사업자번호 입력
    ↓
[POST /api/dashboard/lookup]  →  Airtable "캠지기 모집 폼" 테이블 조회
    ↓                              → 해당 사업자번호의 캠핑장 이름 배열 반환
[사용자] Step 2: 캠핑장 선택 + 연락처 뒷자리 4자리 입력
    ↓                          (캠핑장 1개면 자동 선택, 여러 개면 선택 UI)
[POST /api/dashboard/auth]    →  사업자번호 + 캠핑장명 + 연락처 뒷자리 검증
    ↓                              → Airtable 레코드의 '연락처' 필드 뒷자리와 비교
    ↓                              → 3가지 모두 일치 시 JWT 토큰 생성 (24시간 만료)
[클라이언트] sessionStorage에 토큰 저장
    ↓
[GET /api/dashboard/data]     →  Authorization: Bearer {token}
                                   → JWT 검증 후 데이터 반환
```

**JWT payload 구조**:
```json
{
  "recordId": "recXXXXXXXX",          // Airtable 레코드 ID
  "accommodationName": "캠핑장이름",
  "businessNumber": "1234567890",
  "iat": 1710000000,
  "exp": 1710086400                    // +24시간
}
```

**SessionStorage 키**:
- `camjigi_dashboard_token` — JWT 토큰
- `camjigi_accommodation_name` — 캠핑장 이름 (UI 표시용)

---

## 6. API 엔드포인트

모든 API는 `netlify/functions/` 디렉토리의 서버리스 함수로 구현. 프론트엔드는 `src/utils/dashboardApi.js`를 통해 호출한다.

### 6.1 `POST /api/dashboard/lookup`
- **파일**: `dashboard-lookup.js`
- **입력**: `{ businessNumber: "1234567890" }`
- **동작**: Airtable "캠지기 모집 폼" 테이블에서 사업자번호 필터링
- **필터**: `SUBSTITUTE({사업자 번호}, '-', '')='${cleanNumber}'` — Airtable에 하이픈 포함 저장되어 있으므로 양쪽 모두 하이픈 제거 후 비교
- **출력**: `{ success: true, accommodations: [{ name: "캠핑장A", recordId: "recXXX" }, ...] }`
- ⚠️ **주의**: 반환값이 문자열 배열이 아니라 **객체 배열**이다. 프론트에서 `.name`으로 접근해야 한다.

### 6.2 `POST /api/dashboard/auth`
- **파일**: `dashboard-auth.js`
- **입력**: `{ businessNumber: "1234567890", accommodationName: "캠핑장A", phoneLastFour: "1234" }` — 3개 모두 필수
- **동작**: Airtable에서 사업자번호+캠핑장명으로 레코드 조회 → 연락처 뒷자리 4자리 비교 → 일치 시 JWT 생성
- **필터**: `AND({사업자 번호}='${cleanNumber}', {숙소 이름을 적어주세요.}='${sanitizeForFormula(accommodationName)}')`
- **연락처 검증**: Airtable `연락처` 필드에서 숫자만 추출 → 뒷 4자리와 `phoneLastFour` 비교
- **출력**: `{ success: true, token: "eyJ...", accommodationName: "캠핑장A" }`
- **실패 시**: 3가지 중 하나라도 불일치하면 `"인증 정보가 일치하지 않습니다."` (401) — 어떤 항목이 틀렸는지 노출하지 않음

### 6.3 `GET /api/dashboard/data`
- **파일**: `dashboard-data.js`
- **인증**: `Authorization: Bearer {token}` 필수
- **동작**: JWT에서 `recordId` 추출 → 3개 Airtable 테이블 조회
  1. `캠지기 모집 폼` — 신청 정보 (인원, 가격, 상태)
  2. `유료 오퍼 신청 건` — 크리에이터 배정 현황
  3. `인플루언서 컨텐츠 업로드` — 콘텐츠 제출 현황
- **출력**: 통합 대시보드 데이터 (신청 상태, 결제 금액, 모집 진행률, 크리에이터 목록)

### 6.4 `POST /api/dashboard/modify`
- **파일**: `dashboard-modify.js`
- **인증**: Bearer token 필수
- **입력**: `{ newCrew: { icon: 2, partner: 3, rising: 5 } }`
- **동작**: 등급별 배정 인원 이하로는 감소 불가, 증가는 허용. 가격 차액 계산.
- **배정 판단**: `캠지기 모집 폼`의 `신청 가능 인원` 수식 필드 기반. `배정 인원 = 모집 인원 - 신청 가능 인원`
  - ~~기존: `유료 오퍼 신청 건` 테이블 카운팅~~ → **제거됨** (API 호출 1건 절감)
  - 엣지케이스: 모집 인원 0 → 미사용 등급(배정 0), 필드 null → 전체 잠금, 음수 → `Math.max(0)` 보정
- **출력**: `{ success: true, priceDifference: 50000, ... }`
- **가격 로직**: 아이콘 30만, 파트너 10만, 라이징 5만 (VAT별도 ×1.1)

### 6.5 `POST /api/dashboard/refund`
- **파일**: `dashboard-refund.js`
- **인증**: Bearer token 필수
- **입력**: `{ reason: "환불 사유" }`
- **동작**: 전체 모집 완료 전에만 환불 가능. Airtable에 환불 요청 기록.
- **출력**: `{ success: true, message: "...", refundNote: "...", totalRequested: 10, totalAssigned: 3 }`

---

## 7. Airtable 구조

### 베이스 정보
- **Base ID**: `appEGM6qarNr9M7HN`

### 사용 테이블

| 테이블 | Table ID | 용도 |
|--------|----------|------|
| 캠지기 모집 폼 | `tblt5o7BJFOXjfT3c` | 캠지기 신청 정보 (메인) |
| 유료 오퍼 신청 건 | `tblIV8Wk4SLx2Hh91` | 크리에이터 배정 현황 |
| 인플루언서 컨텐츠 업로드 | `tblta2cow9ymKr68J` | 콘텐츠 제출 상태 |

### 등급 체계

| 등급 번호 | 이름 | 이모지 | 단가 (VAT별도) |
|-----------|------|--------|---------------|
| 1 | 아이콘 | ⭐️ | 300,000원 |
| 2 | 파트너 | ✔️ | 100,000원 |
| 3 | 라이징 | 🔥 | 50,000원 |

VAT 포함 총액 = (아이콘수×30만 + 파트너수×10만 + 라이징수×5만) × 1.1

### 입금 계좌
- 하나은행 225-910068-71204
- 예금주: (주) 넥스트에디션

---

## 8. 환경변수

### Netlify 대시보드에서 설정해야 하는 변수 (서버리스 함수용)

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `AIRTABLE_API_KEY` | Airtable Personal Access Token | `pat...` |
| `AIRTABLE_BASE_ID` | Airtable Base ID | `appEGM6qarNr9M7HN` |
| `AIRTABLE_TABLE_ID` | 캠지기 모집 폼 테이블 ID | `tblt5o7BJFOXjfT3c` |
| `AIRTABLE_OFFER_TABLE_ID` | 유료 오퍼 신청 건 테이블 ID | `tblIV8Wk4SLx2Hh91` |
| `AIRTABLE_CONTENT_TABLE_ID` | 인플루언서 컨텐츠 업로드 테이블 ID | `tblta2cow9ymKr68J` |
| `JWT_SECRET` | JWT 서명용 시크릿 키 | 임의 문자열 (32자 이상 권장) |

### .env.example (로컬 개발 / 퍼널 전용)

```
VITE_AIRTABLE_API_KEY=your_airtable_api_key_here
VITE_AIRTABLE_BASE_ID=your_airtable_base_id_here
VITE_AIRTABLE_TABLE_NAME=협찬신청
```

> `VITE_` 접두사 변수는 프론트엔드(퍼널)용. 대시보드 백엔드는 `VITE_` 없이 Netlify 환경변수로만 접근.

---

## 9. 디자인 토큰

대시보드 전체에 일관되게 사용하는 색상 상수. `src/constants/designTokens.js`에 중앙 관리되며, 각 컴포넌트에서 import하여 사용한다.

| 토큰 | 값 | 용도 |
|------|-----|------|
| `BRAND_GREEN` | `#01DF82` | 캠핏 브랜드 그린, CTA, 진행률 바 |
| `BACKGROUND_COLOR` | `#111111` | 페이지 배경 |
| `CARD_BACKGROUND` | `#1A1A1A` | 카드/섹션 배경 |
| `BORDER_COLOR` | `rgba(255,255,255,0.08)` | 구분선, 카드 테두리 |
| `TEXT_MUTED` | `rgba(255,255,255,0.5)` | 보조 텍스트 |
| `OVERLAY_COLOR` | `rgba(0,0,0,0.7)` | 모달 오버레이 |

추가 색상:
- 환불/위험 액션: `#FF6B6B` (destructive red)
- 모바일 최대 너비: `448px` (`max-w-md`)

---

## 10. 프론트엔드 컴포넌트 구조

### LoginPage.jsx (~380줄)
- 2단계 플로우: Step 1 사업자번호 입력 → Step 2 캠핑장 선택 + 연락처 뒷자리 4자리 입력
- `formatBusinessNumber()`: 자동 하이픈 포맷 (`000-00-00000`)
- 이미 인증된 상태면 `/dashboard`로 자동 리다이렉트
- 캠핑장 1개일 때: 자동 선택 + 캠핑장명 표시, 연락처 뒷자리만 입력하면 로그인
- 캠핑장 여러 개일 때: 캠핑장 선택 UI + 연락처 뒷자리 입력
- lookup 응답의 `{ name, recordId }` 객체에서 `name`만 추출하여 사용 (`typeof` 체크 포함)

### DashboardPage.jsx (~300줄)
- JWT 유효성 확인 후 데이터 로딩
- 3개 섹션 카드 + 2개 모달 + 카카오 문의 버튼
- 로그아웃 시 `clearAuth()` → `/dashboard/login`으로 이동

### StatusCard.jsx (158줄)
- 결제 금액, 입금 상태, 신청일, 등급별 인원 표시
- 입금 계좌 정보 포함

### RecruitmentProgress.jsx (143줄)
- 등급별 모집 진행률을 프로그레스 바로 표시
- 배정 인원 / 요청 인원 비율

### CreatorList.jsx (223줄)
- 배정된 크리에이터 목록 (이름, 등급, 콘텐츠 제출 상태)
- 콘텐츠 미제출 시 회색, 제출 완료 시 그린 표시

### ModifyCrewModal.jsx (408줄)
- 바텀시트 모달 (Framer Motion spring 애니메이션: `damping: 25, stiffness: 300`)
- 등급별 +/- 버튼으로 인원 조정
- 변경 전후 가격 차액 실시간 계산
- 미배정 슬롯 내에서만 변경 가능

### RefundModal.jsx (270줄)
- 바텀시트 모달, destructive 컬러(`#FF6B6B`)
- 환불 사유 입력 → 확인 → API 호출
- 전체 모집 완료 전에만 환불 가능

---

## 11. 카카오톡 채널 연동

대시보드 하단에 카카오톡 문의 버튼이 있다.

- **채널 URL**: `https://pf.kakao.com/_Cxfnxfxj`
- 새 탭(`_blank`)으로 열림

---

## 12. 배포 방법

### Netlify 자동 배포 (GitHub 연동 시)
1. GitHub `keyluke97-ui/premium_claude` 레포에 push
2. Netlify가 자동으로 빌드 + 배포

### 수동 배포
```bash
cd premium_dashboard
npm install
npm run build          # dist/ 디렉토리에 빌드 산출물 생성
netlify deploy --prod  # Netlify CLI로 배포
```

### 로컬 개발
```bash
npm install
netlify dev            # Vite dev server + Netlify Functions 에뮬레이션
```
> `netlify dev`를 써야 서버리스 함수(`/api/dashboard/*`)가 로컬에서도 동작한다.

---

## 13. 유지보수 시 주의사항

1. **FunnelPage.jsx 수정 금지**: 기존 퍼널은 독립적으로 운영 중. 대시보드 작업이 퍼널에 영향을 주면 안 된다.
2. **submit.js 수정 금지**: 기존 퍼널의 서버리스 함수. 대시보드와 무관.
3. **airtable.js 수정 금지**: 기존 퍼널의 Airtable 유틸. 대시보드는 `dashboardApi.js`를 사용.
4. **디자인 토큰 변경 시**: `src/constants/designTokens.js` 파일 하나만 수정하면 전체 반영된다.
5. **JWT_SECRET 변경 시**: 기존에 발급된 모든 토큰이 무효화된다.
6. **Airtable 테이블 구조 변경 시**: `dashboard-data.js`의 필드 매핑을 반드시 함께 업데이트.

---

## 14. 코드리뷰 수정 이력 (2026-03-13)

코드리뷰에서 발견된 보안·성능·유지보수·정합성 이슈를 수정한 내역.

### 완료된 수정 (✅)

| ID | 분류 | 내용 | 수정 파일 |
|----|------|------|----------|
| S-1 | 보안 | Airtable `filterByFormula` 인젝션 방지 — `sanitizeForFormula` 적용 | `jwt-utils.js`, `dashboard-auth.js`, `dashboard-data.js`, `dashboard-modify.js`, `dashboard-refund.js` |
| S-2 | 보안 | CORS `*` 와일드카드 → `ALLOWED_ORIGIN` 환경변수 기반 `buildCorsHeaders` | 위 5개 함수 전체 |
| S-4 | 보안 | 에러 응답에서 Airtable 내부 정보(`detail` 필드) 노출 제거 | 위 5개 함수 전체 |
| S-5 | 보안 | JWT 서명 검증 시 `timingSafeEqual` 상수 시간 비교 적용 | `jwt-utils.js` |
| P-1 | 성능 | 순차 Airtable API 호출 → `Promise.all` 병렬 호출 전환 | `dashboard-data.js`, `dashboard-modify.js`, `dashboard-refund.js` |
| P-2 | 성능 | 무제한 Airtable 쿼리에 `maxRecords` 상한 추가 | `dashboard-lookup.js`(50), `dashboard-data.js`(200), `dashboard-modify.js`(200), `dashboard-refund.js`(200) |
| M-1 | 유지보수 | 5개 함수의 중복 JWT/CORS/보안 코드를 `jwt-utils.js`로 추출 | `jwt-utils.js` (신규), 5개 함수 전체 |
| M-2 | 유지보수 | 인라인 디자인 토큰을 `src/constants/designTokens.js`로 중앙화 | `designTokens.js` (신규), `DashboardPage.jsx`, `ModifyCrewModal.jsx` |
| M-3 | 유지보수 | 불필요한 `handleSuccessClose` 래퍼 함수 제거, `onClose` 직접 전달 | `ModifyCrewModal.jsx` |
| M-4 | 유지보수 | React ErrorBoundary 클래스 컴포넌트 추가 (`DashboardErrorBoundary`) | `DashboardPage.jsx` |
| C-1 | 정합성 | 두 개의 `useEffect` race condition 위험 → 하나로 통합 | `DashboardPage.jsx` |
| C-3 | 정합성 | 인원 변경 시 총 인원 0명 허용 → `totalNewCrew === 0` 차단 추가 | `dashboard-modify.js` |

### 미완료 수정 (⏳)

| ID | 분류 | 내용 | 이유 |
|----|------|------|------|
| S-3 | 보안 | `sessionStorage` JWT 저장 → XSS 취약 | httpOnly 쿠키 전환 필요. **프론트만으로 해결 불가** — 백엔드(`dashboard-auth.js`)에서 `Set-Cookie` 응답 + 전 함수에서 쿠키 파싱 로직 추가 + 프론트의 `dashboardApi.js` `credentials: 'include'` 전환이 동시에 이루어져야 함. 개발팀과 협의 후 별도 작업으로 진행 권장. |
| — | 코드품질 | 일부 함수 30줄 초과 | `verifyToken`(36줄), `ActionButtons`(52줄), `SuccessResult`(80줄), `ModifyCrewModal`(130줄), `dashboard-data` 핸들러(157줄). Netlify 단일 핸들러 패턴 및 JSX 구조상 현시점 분리 시 오히려 가독성 저하. 기능 추가 시 자연스럽게 리팩토링 가능. |

### 신규 추가된 파일

| 파일 | 목적 |
|------|------|
| `netlify/functions/jwt-utils.js` | JWT 생성/검증, formula 인젝션 방지, CORS 헤더 빌드 공유 유틸 |
| `src/constants/designTokens.js` | 대시보드 디자인 토큰 중앙 관리 |

### 신규 환경변수

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `ALLOWED_ORIGIN` | CORS 허용 오리진 | 미설정 시 `*` (기존 동작 유지) |

> ⚠️ **배포 전 필수**: Netlify 대시보드에서 `ALLOWED_ORIGIN`을 실 도메인(`https://your-domain.com`)으로 설정할 것.

---

## 15. 버그 수정 이력 (2026-03-14, 로그인 플로우)

사업자번호 `532-87-02049`로 로그인 시도 시 실패하는 문제를 3단계에 걸쳐 수정.

### 버그 1: SPA 라우팅 미작동 (이전 세션에서 수정 완료)

| 항목 | 내용 |
|------|------|
| 증상 | `/dashboard/login` 접속 시 퍼널 페이지(`/`)가 표시됨 |
| 원인 | React Router 미설정. `App.jsx`에 라우트 정의가 없었고, `main.jsx`에 `BrowserRouter` 래핑 없었음 |
| 수정 | `App.jsx`에 `Routes`/`Route` 추가, `main.jsx`에 `BrowserRouter` 래핑, `FunnelPage.jsx` 분리 |
| 커밋 | 이전 세션에서 완료 |

### 버그 2: "해당 사업자 번호로 등록된 캠핑장이 없습니다" (lookup 실패)

| 항목 | 내용 |
|------|------|
| 증상 | 사업자번호 입력 후 "등록된 캠핑장이 없습니다" 에러 |
| 원인 | Airtable에 `532-87-02049` (하이픈 포함)으로 저장되어 있는데, 프론트에서 `5328702049` (하이픈 제거)으로 조회. 단순 문자열 비교라 매칭 실패 |
| 수정 | `dashboard-lookup.js`와 `dashboard-auth.js`의 Airtable 필터를 `SUBSTITUTE({사업자 번호}, '-', '')='${cleanNumber}'`로 변경 — Airtable 측 값에서도 하이픈 제거 후 비교 |
| 커밋 | `5b2db4e632694f788a5066ea920162b46a8b9cac` |

### 버그 3: "인증 정보가 일치하지 않습니다" (auth 실패)

| 항목 | 내용 |
|------|------|
| 증상 | lookup은 성공하나 auth 단계에서 실패 |
| 원인 | `LoginPage.jsx`에서 캠핑장이 1개일 때 `handleLogin(digits, data.accommodations[0])` 호출 — `data.accommodations[0]`은 `{ name: "시즌온관광농원캠핑장", recordId: "rec..." }` 객체인데, `handleLogin`은 문자열을 기대함. 결과적으로 auth API에 `[object Object]`가 전달되어 Airtable 매칭 실패 |
| 수정 | (1) `handleLogin(digits, data.accommodations[0].name)` — `.name`으로 문자열 추출, (2) 캠핑장 선택 UI에서 `accommodations.map((acc) => ...)` + `acc.name`으로 변경 |
| 커밋 | `3287b0aebbb922540f9bd2c8d8bbc8dac473e598` |

### 수정 파일 요약

| 파일 | 변경 내용 |
|------|----------|
| `netlify/functions/dashboard-lookup.js` | Airtable 필터에 `SUBSTITUTE` 적용 (하이픈 정규화) |
| `netlify/functions/dashboard-auth.js` | Airtable 필터에 `SUBSTITUTE` 적용 (하이픈 정규화) |
| `src/pages/dashboard/LoginPage.jsx` | 객체→문자열 버그 수정 (`accommodations[0]` → `accommodations[0].name`, `map` 렌더링 수정) |

### ⚠️ 같은 유형 재발 방지 체크포인트

- `dashboard-lookup.js`의 반환값은 **객체 배열** `[{ name, recordId }]`이다. 프론트에서 이 값을 사용할 때는 반드시 `.name`으로 문자열을 추출해야 한다.
- Airtable에 저장된 사업자번호는 **하이픈 포함** 형태(`532-87-02049`)다. 조회 시 반드시 `SUBSTITUTE`로 하이픈을 제거한 뒤 비교해야 한다.
- 새 Airtable 필드를 필터에 사용할 때, **저장 형식과 조회 형식이 일치하는지** 반드시 확인할 것.

---

## 16. 기능 개선 이력 (2026-03-14, 로그인 3중 인증 + modify 로직 개선)

### 16-1. 로그인 3중 인증 적용

기존 사업자번호만으로 로그인 가능한 구조에서, 3가지 조건이 모두 일치해야 인증되도록 강화.

| 항목 | 기존 | 변경 후 |
|------|------|--------|
| Step 1 | 사업자번호 입력 | 사업자번호 입력 (동일) |
| Step 2 | 캠핑장 선택 → 1개면 바로 로그인 | 캠핑장 선택 + **연락처 뒷자리 4자리 입력** → 1개여도 항상 Step 2 |
| 인증 조건 | 사업자번호 + 캠핑장명 | 사업자번호 + 캠핑장명 + **연락처 뒷자리 4자리** |
| 보안 | 사업자번호(공개정보)만으로 접근 가능 | 연락처 정보 추가로 무단 접근 차단 |

**수정 파일:**

| 파일 | 변경 내용 |
|------|----------|
| `netlify/functions/dashboard-auth.js` | `phoneLastFour` 파라미터 수신, Airtable `연락처` 필드 조회, 뒷자리 4자리 비교 로직 추가 |
| `src/utils/dashboardApi.js` | `login()` 함수에 `phoneLastFour` 세 번째 인자 추가 |
| `src/pages/dashboard/LoginPage.jsx` | Step 2에 연락처 뒷자리 입력 필드 추가, 캠핑장 1개일 때도 항상 Step 2 이동, lookup 응답에서 name 추출 처리 |

**주의사항:**
- Airtable `연락처` 필드에 값이 비어 있는 레코드는 로그인 불가 (에러 메시지: "인증 정보가 일치하지 않습니다")
- 연락처 전체를 프론트에 노출하지 않음 — 백엔드에서만 비교
- `dashboard-lookup.js`는 수정하지 않음 (캠핑장 목록만 반환, 연락처 미포함)

### 16-2. 인원 변경 배정 판단 로직 개선 (dashboard-modify.js)

기존 `유료 오퍼 신청 건` 테이블 카운팅 방식에서, `캠지기 모집 폼`의 `신청 가능 인원` 수식 필드 기반으로 전환.

| 항목 | 기존 | 변경 후 |
|------|------|--------|
| 배정 인원 판단 | `유료 오퍼 신청 건` 테이블 조회 → 등급별 레코드 카운팅 | `모집 인원 - 신청 가능 인원`으로 역산 |
| API 호출 수 | 2건 (모집 폼 + 오퍼 테이블) | **1건** (모집 폼만) |
| 오퍼 상태 필터링 | 없음 (취소/거절 건도 카운팅) | 해당 없음 (수식 필드가 정확한 값 반영) |
| 감소 차단 | 배정 인원 미만으로 감소 차단 | 동일 (감소만 차단, 증가는 허용) |

**사용하는 Airtable 수식 필드:**

| 필드명 | 설명 |
|--------|------|
| `⭐️ 신청 가능 인원` | 아이콘 등급 남은 슬롯 (수식 필드, 실시간 반영) |
| `✔️ 신청 가능 인원` | 파트너 등급 남은 슬롯 |
| `🔥 신청 가능 인원` | 라이징 등급 남은 슬롯 |

**엣지케이스 처리 (`getAssignedCount` 함수):**

| 케이스 | 처리 |
|--------|------|
| 모집 인원 0, 신청 가능 0 | 미사용 등급 → 배정 0 (모집 마감으로 오판 방지) |
| 신청 가능 인원 필드 null/undefined | 데이터 누락 → 안전하게 모집 인원 전체를 배정된 것으로 처리 (감소 잠금) |
| 신청 가능 인원 음수 (초과 배정) | `Math.max(0, assigned)` 보정 |

**수정 파일:**

| 파일 | 변경 내용 |
|------|----------|
| `netlify/functions/dashboard-modify.js` | 오퍼 테이블 조회 제거, `sanitizeForFormula` import 제거, `getAssignedCount` 함수 추가, 신청 가능 인원 필드 기반 배정 판단 |

**제거된 의존성:**
- `AIRTABLE_OFFER_TABLE_ID` 환경변수 — `dashboard-modify.js`에서 더 이상 사용하지 않음 (단, `dashboard-data.js`에서는 여전히 사용)

---

## 17. 향후 개선 가능 사항

- ~~디자인 토큰을 별도 상수 파일로 중앙화~~ → ✅ 완료 (`src/constants/designTokens.js`)
- JWT 리프레시 토큰 도입 (현재 24시간 만료 후 재로그인 필요)
- 크리에이터 콘텐츠 미리보기 기능
- 대시보드 데이터 캐싱 (현재 매번 Airtable API 호출)
- ~~에러 바운더리 추가 (React ErrorBoundary)~~ → ✅ 완료 (`DashboardErrorBoundary`)
- sessionStorage → httpOnly 쿠키 전환 (S-3, 개발팀 협의 필요)