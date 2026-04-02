# 프리미엄 대시보드 — 파트너 탭 통합 핸드오버

> 최종 업데이트: 2026-03-31
> 작업자: Claude (Cowork)

---

## 현재 상태: Phase 1~3 완료 (인증 + API + UI)

### Phase 1 완료 — 인증 흐름 확장

| 파일 | 변경 내용 |
|------|----------|
| `netlify/functions/dashboard-lookup.js` | 프리미엄(캠지기 모집 폼) + 파트너(파트너 캠페인) 테이블 병렬 조회. 각 항목에 `type: 'premium' | 'partner'` 태그 포함 |
| `netlify/functions/dashboard-auth.js` | `type` 필드 기반 테이블 분기 인증. JWT payload에 `type` 포함. 테이블별 필드명 차이(사업자 번호 vs 사업자번호, 숙소 이름을 적어주세요. vs 캠핑장명) 처리 |
| `src/utils/dashboardApi.js` | `login()`에 `type` 파라미터 추가. sessionStorage에 `camjigi_dashboard_type` 키 저장. `getDashboardType()` 함수 추가 |
| `src/pages/dashboard/LoginPage.jsx` | 캠핑장 목록에 협찬 유형 배지(프리미엄=금색, 파트너=그린) 표시. 타이틀 '캠핏 협찬 대시보드'로 변경. `login()` 호출 시 `type` 전달 |

### Phase 2 완료 — 파트너 대시보드 API

| 파일 | 변경 내용 |
|------|----------|
| `netlify/functions/dashboard-partner-data.js` | **신규 생성.** 파트너 캠페인 + 파트너 신청(크리에이터) 테이블 조회. JWT type='partner' 검증. 캠페인 정보(패키지, 할인금액, 모집상태, 방문/쿠폰 일정) + 매칭 크리에이터 목록(채널명, 등급, 채널종류, 입실일, 상태) 반환. API 경로: `/api/dashboard/partner-data` |
| `src/utils/dashboardApi.js` | `fetchPartnerData()` 함수 추가 — `/api/dashboard/partner-data` GET 호출 |

### Phase 3 완료 — 대시보드 UI 파트너 분기

| 파일 | 변경 내용 |
|------|----------|
| `src/pages/dashboard/components/PartnerStatusCard.jsx` | **신규 생성.** 캠페인 정보 카드 — 패키지 유형, 숙박 타입, 할인금액(평일/주말), 모집 상태 배지, 모집 희망 인원, 방문/쿠폰 일정, 숙소 소개 |
| `src/pages/dashboard/components/PartnerCreatorList.jsx` | **신규 생성.** 매칭 크리에이터 목록 — 채널명, 채널 종류(인스타/유튜브), 등급, 신청 상태(신청완료/확정), 입실일, 사이트. 확정 인원 별도 카운트 |
| `src/pages/dashboard/components/PartnerActionButtons.jsx` | **신규 생성.** 카카오톡 변경/취소 문의 CTA 버튼 |
| `src/pages/dashboard/DashboardPage.jsx` | `getDashboardType()` 기반 분기 추가. partner면 파트너 전용 컴포넌트 렌더링, premium이면 기존 로직 유지. 헤더 서브타이틀 타입별 분기 |

### 빌드 검증

- `npm run build` 성공 (문법 에러 없음)
- DashboardPage 번들: 49.96KB (gzip 11.34KB) — 파트너 컴포넌트 3개 포함

---

## 배포 전 필수 작업

### Netlify 환경변수 추가

| 변수명 | 값 | 비고 |
|--------|-----|------|
| `AIRTABLE_PARTNER_CAMPAIGN_TABLE_ID` | `tbl5X4YNIow179dTQ` | 파트너 캠페인 테이블 ID |
| `AIRTABLE_PARTNER_APPLICATION_TABLE_ID` | `tblAc3fbe3oA67Ppo` | 파트너 신청(크리에이터) 테이블 ID |

기존 환경변수는 변경 없음:
- `AIRTABLE_API_KEY` (기존)
- `AIRTABLE_BASE_ID` = `appEGM6qarNr9M7HN` (기존)
- `AIRTABLE_TABLE_ID` = `tblt5o7BJFOXjfT3c` (기존, 캠지기 모집 폼)
- `JWT_SECRET` (기존)

### 파트너 캠페인 테이블 사업자번호 필드

파트너 캠페인 테이블의 `사업자번호` 필드는 존재하지만, 현재 캠지기 신청 퍼널(camfit-partner)에서 아직 수집하지 않음. 사용자가 별도 수정 예정.

---

## 다음 세션 작업

### 배포 및 E2E 테스트

- [ ] Netlify 환경변수 2개 추가 (AIRTABLE_PARTNER_CAMPAIGN_TABLE_ID, AIRTABLE_PARTNER_APPLICATION_TABLE_ID)
- [ ] `npm run build` 후 Netlify 배포
- [ ] 프리미엄 캠지기 로그인 → 기존 대시보드 정상 동작 확인 (regression)
- [ ] 파트너 캠지기 로그인 → 파트너 대시보드 정상 동작 확인
- [ ] 동일 사업자번호에 프리미엄+파트너 모두 있는 경우 로그인 흐름 테스트

### 향후 개선 (Phase 5+)

- [ ] 동일 캠지기가 프리미엄+파트너 모두 신청한 경우 탭 전환 UI 추가
- [ ] 파트너 대시보드에 모집 진행률 바 추가 (현재는 StatusCard 내 인원 수만 표시)
- [ ] 파트너 신청 테이블의 `캠핑장명 (from 파트너 캠페인)` lookup 필드가 실제로 존재하는지 Airtable에서 확인 필요

---

## 핵심 설계 결정 (확정)

| # | 결정 | 근거 |
|---|------|------|
| 1 | 대시보드를 premium_dashboard에 탭으로 통합 | 캠지기가 하나의 URL로 프리미엄+파트너 모두 관리. 인증 인프라 재활용 |
| 2 | 인증: 두 테이블 동시 조회, 같은 사업자번호 = 동일 캠핑장 | 나중에 프리미엄도 복수 신청 가능하므로 이 구조가 맞음 |
| 3 | 변경/취소: 카카오톡 인입으로 처리 | 대시보드 내 직접 수정 기능 미구현 |
| 4 | 쿠폰 코드 미노출 | 사용자 확정 |
| 5 | 매칭 크리에이터 정보 표시 | 사용자 확정 — 파트너 신청 테이블에서 조회 |
| 6 | JWT payload에 type 포함 | 대시보드에서 프리미엄/파트너 데이터 분기에 사용 |
| 7 | 파트너 API를 별도 엔드포인트로 분리 | dashboard-data.js 수정 대신 dashboard-partner-data.js 신규 생성 — 기존 프리미엄 로직에 영향 없음 |

---

## 테이블 필드명 차이 주의

| 항목 | 프리미엄 (캠지기 모집 폼) | 파트너 (파트너 캠페인) |
|------|---|---|
| 사업자번호 | `사업자 번호` (공백 O) | `사업자번호` (공백 X) |
| 캠핑장명 | `숙소 이름을 적어주세요.` | `캠핑장명` |
| 연락처 | `연락처` | `연락처` (동일) |
| 테이블 ID | `tblt5o7BJFOXjfT3c` | `tbl5X4YNIow179dTQ` |

---

## 수정 금지 파일 (리마인더)

- `src/pages/FunnelPage.jsx` — 프리미엄 퍼널 (read-only)
- `netlify/functions/submit.js` — 프리미엄 퍼널 제출 (read-only)

---
마지막 업데이트: 2026-03-31
