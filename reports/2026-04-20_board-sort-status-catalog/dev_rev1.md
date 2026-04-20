---
role: dev
session: session_044
topic: board-sort-status-catalog
topicId: topic_047
grade: B
date: 2026-04-20
report_status: final
---

# Dev rev1 — board 정렬 버그 + 상태값 카탈로그 + PD-16/17 정리

## 문제
1. Board home 토픽 순서가 3,2,1 → 36,37로 뒤엉킴. 최근 10개 desc 요구.
2. PD-16/17이 완료 작업인데도 pendingDeferrals에 잔존.
3. `closed` 상태값 하드코딩 잔존 — 카탈로그화 요청.

## 진단
- 정렬 버그 근인: `app/index.html`이 `.reverse()`만 사용 → 파일 배열 순서 의존. topic_index.json 자체가 비정렬 상태였음 (044, 043, 042, 036, 001~015…).
- 등록 누락: session_036~041에서 /open이 수동 Edit 사용 → topic_index 등록 빠짐. 실제 작업은 모두 완료(D-041/042, role_memory 갱신 확인) but registration gap.
- 중복: topic_013이 COPD Track B와 원 topic_013 두 개로 존재.
- 고아: reports/2026-04-08_upgrade-delta-pack 폴더만 있고 index 엔트리 없음.

## 해결 (3중 방어)
1. **파일 자체 정렬** — `scripts/migrate-topic-index.ts`에 `compareTopicDesc` 자연정렬(숫자 desc, suffix 처리: `topic_010a` > `topic_010`) 구현. 1회 실행으로 41개 재정렬.
2. **앱 레이어 정렬** — `app/js/nav.js`에 `sortTopicsDesc` 추가. `app/index.html`이 `.reverse()` 대신 호출.
3. **Append 정렬** — `scripts/create-topic.ts`가 push 후 `compareTopicDesc`로 재정렬 후 저장.

## Status 카탈로그
- `memory/shared/status_catalog.json` 신설. statuses = [open, in-progress, completed, suspended], aliases = {closed: completed}.
- `app/js/nav.js` statusBadge가 카탈로그 참조 (하드코딩 제거, 색상/라벨도 카탈로그에서).
- `src/types/index.ts`에서 `closed` 타입 제거.
- `.claude/commands/close.md`에 카탈로그 참조 명시.

## 재발 방지
- `.claude/commands/open.md` step 7에 **[필수·자동]** 항목 추가 — `npx ts-node scripts/create-topic.ts` 자동 호출. Edit 수동 등록 금지.
- 토픽 번호 공백(037~041)은 보존 — hook 사고 흔적.

## 정비
- 중복 topic_013 → topic_045 (COPD Track B, `_migrationNote` 부착).
- 고아 upgrade-delta-pack → topic_046 신규 등록.
- 현 세션 → topic_047 등록.
- system_state.json: PD-016, PD-017 status=resolved.

## 버전/결정
- project_charter v1.11 → **v1.12** (하드코딩 잔존 치유 범위 반영).
- **D-047** 확정: 상태 카탈로그 단일 원천 + /open auto-create 강제 + 중간지점 정비.

## 검증
- `node scripts/build.js` 완료 — 43 topics, 47 decisions 반영.
- Preview(port 8095) DOM 확인: top 10 = 047, 046, 045, 044, 043, 042, 036, 035, 034, 033 (desc 확정).

## 미진행
- 번호 재사용(Master 선호 038) — 다음 세션 요청 시 `create-topic.ts`에 `--id` 옵션 추가 예정.
