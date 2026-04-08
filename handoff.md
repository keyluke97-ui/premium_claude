# 프리미엄 대시보드 — 핸드오버 문서

> 최종 업데이트: 2026-04-07
> 작업자: Claude (Cowork)

---

## 현재 상태 요약

| 기능 | 상태 | 비고 |
|------|------|------|
| 파트너 탭 통합 (Phase 1~3) | 완료, 미배포 | 환경변수 2개 추가 후 배포 필요 |
| 첫 신청 할인 시스템 | 완료, 배포됨 | Airtable 필드 + 퍼널 UI + API |
| 15만원 티어 확장 (3개 플랜) | 완료, 배포됨 | 스타터 추천 + 라이징 체험 + 맛보기 |
| UX 카피 개선 | 완료, 배포됨 | 예산 선택 hint + 가장 인기 태그 |
| 색상 통일 | 완료, 배포됨 | 모든 플랜 accent → #01DF82 |

---

## 2026-04-07 작업 내용: 첫 신청 할인 시스템

### 추가된 파일

| 파일 | 설명 |
|------|------|
| `netlify/functions/check-first-time.js` | 사업자번호로 Airtable 조회 → `{ isFirstTime: true/false }` 반환. POST `/api/check-first-time` |

### 수정된 파일

| 파일 | 변경 |
|------|------|
| `src/data/packages.js` | 15만원 티어 3개 플랜 확장 (스타터/맛보기/라이징 체험). `DISCOUNT_PRICING` 상수 + `computeDiscountedPlan()` 함수 추가. 모든 플랜에 `discountEligible` 플래그 추가. accent 색상 #01DF82 통일 |
| `src/components/steps/PackageStep.jsx` | 사업자번호 입력+조회 UI (sessionStorage 연동). 할인 대상 플랜만 선별 할인가 표시. TierSummaryBar 할인 단가 표시. BreakdownLine 할인가 지원. 추천 배지 렌더링. 등급 안내 버튼 가시성 개선 |
| `src/components/steps/BudgetStep.jsx` | 라벨 15만원→10~25만원. subtitle/hint 구체화. 50만원에 "가장 인기" 태그 |
| `src/components/steps/InfoStep.jsx` | sessionStorage에서 사업자번호 복원 → 읽기전용 표시 |
| `netlify/functions/submit.js` | `selectedPlan` 디스트럭처링 추가. 할인 시 단가 분기 (25만/12만/7만). `첫신청할인`(체크박스) + `할인전금액` Airtable 필드 매핑 |

### Airtable 스키마 변경

`캠지기 모집 폼` 테이블 (`tblt5o7BJFOXjfT3c`)에 2개 필드 추가 완료:
- `첫신청할인` (Checkbox)
- `할인전금액` (Number, precision 0)

### 할인 적용 규칙

| 플랜 | 구성 | discountEligible | 할인가 |
|------|------|-----------------|--------|
| 라이징 체험 | 라이징1 | true | 7만 |
| 맛보기 | 파트너1 | true | 12만 |
| 스타터 | 파트너1+라이징1 | true | 19만 |
| 원픽 | 아이콘1 | true | 25만 |
| 실속 파트너 | 파트너2 | true | 24만 |
| **입문** | **라이징3** | **false** | 정가 30만 |
| 베스트 | 아이콘1+라이징2 | true | 39만 |
| 알찬 프로 | 파트너2+라이징2 | true | 38만 |
| **확산** | **라이징5** | **false** | 정가 50만 |
| 올인원 | 아이콘1+파트너2+라이징1 | true | 56만 |
| 대박 아이콘 | 아이콘2+라이징1 | true | 57만 |
| 물량 라이징 | 파트너2+라이징4 | true | 52만 |
| **직접 선택(custom)** | — | **false** | 정가 |

### 할인 단가 (DISCOUNT_PRICING)

| 등급 | 정가 | 할인가 | 캠핏 수수료 |
|------|------|--------|-----------|
| 아이콘 | 30만 | 25만 | 1만 |
| 파트너 | 15만 | 12만 | 1만 |
| 라이징 | 10만 | 7만 | 1만 |

### 데이터 플로우

```
PackageStep: 사업자번호 입력 → /api/check-first-time 조회 → isFirstTime 판단
  ↓ sessionStorage에 bizNumber, isFirstTime 저장
  ↓ 플랜 선택 시 discountEligible이면 computeDiscountedPlan() 적용
  ↓ selectedPlan = { ...plan, isDiscounted: true, originalPrice, price(할인가) }

InfoStep: sessionStorage에서 bizNumber 복원 → 읽기전용 표시 → formData에 반영

FunnelPage: submitApplication({ budget, selectedPlan, formData, crew, planTier })

submit.js: selectedPlan.isDiscounted → 할인 단가 적용 → Airtable 전송
  - 아이콘 협찬 제안 금액: 25만/30만
  - 파트너 협찬 제안 금액: 12만/15만
  - 라이징 협찬 제안 금액: 7만/10만
  - 첫신청할인: true/false
  - 할인전금액: originalPrice 또는 0
```

### 엣지 케이스 처리 완료

- 사업자번호 변경 시 할인 플랜 정가 복원 (원본 못 찾으면 isDiscounted/originalPrice 수동 제거)
- TierSummaryBar: custom 모드에서 할인가 미표시
- custom 플랜 객체에 `discountEligible: false` 명시
- 할인 미대상 플랜(입문/확산)은 첫 신청이어도 정가 유지
- check-first-time API 에러 시 UI 상태 보존

### 추가 작업 (코드 리뷰 후)

- 모든 플랜 accent 색상 `#01DF82`로 통일 (기존 빨강/보라/노랑/파랑 제거)
- BudgetStep: subtitle 구체화 + hint 추가 + 50만원 "가장 인기" 태그
- 스타터 플랜 최상단 노출 + `recommended: true`
- 크리에이터 등급 안내 버튼 가시성 개선 (그린 테두리 + 굵은 텍스트)
- 코드 리뷰 P0/P1 수정: 플랜 복원 안전장치 + custom 할인 격리
- 엣지 케이스 22개 전수 검증 완료 (P0/P1 0건)

### 알려진 LOW 이슈 (수정 불필요)

1. check-first-time.js에 localhost demo 모드 없음 (로컬 개발 시 Airtable 필요)
2. API 응답 중 컴포넌트 언마운트 시 React 경고 가능 (크래시 없음)

---

## 파트너 탭 통합 (이전 세션, 미배포)

### Phase 1~3 완료 — 인증 + API + UI

상세 내용은 이전 핸드오버 참조. 핵심 변경:
- `dashboard-lookup.js`: 프리미엄+파트너 테이블 병렬 조회
- `dashboard-auth.js`: type 기반 분기 인증, JWT에 type 포함
- `dashboard-partner-data.js`: 파트너 캠페인+크리에이터 데이터 API
- `PartnerStatusCard.jsx`, `PartnerCreatorList.jsx`, `PartnerActionButtons.jsx`: 파트너 대시보드 UI
- `DashboardPage.jsx`: type 기반 프리미엄/파트너 렌더링 분기

### 배포 전 필수 작업

| 작업 | 상태 |
|------|------|
| Netlify 환경변수: `AIRTABLE_PARTNER_CAMPAIGN_TABLE_ID` = `tbl5X4YNIow179dTQ` | 미완료 |
| Netlify 환경변수: `AIRTABLE_PARTNER_APPLICATION_TABLE_ID` = `tblAc3fbe3oA67Ppo` | 미완료 |
| 프리미엄 캠지기 로그인 regression 테스트 | 미완료 |
| 파트너 캠지기 로그인 E2E 테스트 | 미완료 |

---

## 수정 금지 파일

- `src/pages/FunnelPage.jsx` — 퍼널 오케스트레이터 (read-only)
- `netlify/functions/submit.js` — Airtable 필드 매핑 추가만 허용 (구조 변경 금지)

## 테이블 필드명 차이 주의

| 항목 | 프리미엄 (캠지기 모집 폼) | 파트너 (파트너 캠페인) |
|------|---|---|
| 사업자번호 | `사업자 번호` (공백 O) | `사업자번호` (공백 X) |
| 캠핑장명 | `숙소 이름을 적어주세요.` | `캠핑장명` |
| 테이블 ID | `tblt5o7BJFOXjfT3c` | `tbl5X4YNIow179dTQ` |

---

## GitHub

- Repo: `keyluke97-ui/premium_claude`
- Branch: `main`
- 최근 커밋: `118d6e6` (코드 리뷰 P0/P1 수정) → `5eb9a3d` (색상 통일) → `bb89f70` (UX 카피) → `118d6e6` (엣지케이스 수정)

---
마지막 업데이트: 2026-04-07
