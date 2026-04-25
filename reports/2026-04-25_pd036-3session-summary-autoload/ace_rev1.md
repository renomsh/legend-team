---
session_id: session_098
topic: pd036-3session-summary-autoload
role: ace
rev: 1
date: 2026-04-25
---

# Ace 프레이밍 — PD-036 3세션 summary 자동 로드 시스템

## Step 0 — Topic Lifecycle 판정
- **topicType**: `implementation`
- **parentTopicId 후보**: `topic_099` (pd023-resume-self-scores-mvp, framing 성격의 D-077 모토픽)
  - 근거: D-077 박제 출처가 topic_099 arki rev2/rev3, PD-036의 fromTopic 일치
  - Master 승인 시 topic_index에 `parentTopicId: "topic_099"` 기록
- **resolveCondition (PD-036)**: 구현 완료 + 3세션 자동 summary 생성 확인 + `/open` step 3.5 브리핑 동작

## Step 0b — PD 교차검증 (3행)
- **children**: 없음 (PD-036은 단독 구현 토픽, sub-PD 분기 없음)
- **git**: D-077 박제 후 sync-system-state.ts에 recentSessionSummaries 관련 커밋 없음 → 미구현 확정
- **artifacts**: `system_state.json`에 `recentSessionSummaries` 필드 부재 / `session_index.json`에 `oneLineSummary`·`decisionsAdded` 필드 부재 / `topic_index.json`에 `closedInSession` 부재 → 3축 모두 신규

---

## 1. 토픽 정의 (What)
**3세션 분량의 핵심 컨텍스트를 `/open` 시 자동으로 Master 앞에 펼쳐서, 세션 간 정보 휘발로 인한 오진·재작업을 차단할 수 있는가?**

D-077 설계(Arki rev2/rev3)를 실제 동작 코드로 떨어뜨리는 작업입니다. 스키마 신설 + 생성 주체(sync-system-state) 확장 + 소비 경로(open.md) 통합, 이 3축을 한 세션 안에 닫는 것이 목표입니다.

---

## 2. 결정 축 (Master 선택 필요)

| # | 축 | 옵션 A | 옵션 B | Ace 1차 권고 |
|---|---|---|---|---|
| D1 | summary 생성 시점 | `/close` 시 sync-system-state가 자동 갱신 | 별도 커맨드로 수동 트리거 | **A** (저마찰 원칙, 누락 방지) |
| D2 | `oneLineSummary` 출처 | Claude(Edi)가 close 시 작성 → session_index 박제 | sync 스크립트가 정형 추출(decisions+outcome 결합) | **A** (의미 압축은 LLM, 1줄 한정) |
| D3 | window 길이 | 고정 3 | 설정 가능(default 3) | **A** (D-077 명시값, 변동 시 재결정) |
| D4 | 저장 위치 | session_index에 2필드 박제 + system_state에 derived 캐시 | system_state 단일 박제 | **A** (원본/캐시 분리, sync 재계산 가능) |
| D5 | `/open` 노출 형식 | step 3.5 별도 섹션 "최근 3세션 요약" | step 3 이연항목 안에 인라인 | **A** (시각적 분리, 스킵 안 됨) |
| D6 | `closedInSession` 채움 시점 | `/close` 시 finalize hook에서 일괄 set | 신규 토픽 생성 시 빈값, close시 채움 | **B** (기본 null, close 시 set — 명확) |

→ Master, 위 6축 중 이의 있는 항목만 짚어주시면 나머지는 권고안으로 진행하겠습니다.

---

## 3. 범위 In/Out

**In**
- `system_state.json`에 `recentSessionSummaries[]` 필드 신설 (최신 3개)
- `session_index.json` 엔트리에 `oneLineSummary`, `decisionsAdded[]` 2필드 신설
- `topic_index.json` 엔트리에 `closedInSession` 1필드 신설
- `scripts/sync-system-state.ts` 확장 — 위 3축 read + recentSessionSummaries 합성
- `.claude/commands/open.md` step 3.5에 자동 브리핑 블록 추가 (또는 3.5 → 3.5+3.6 분리)
- `.claude/hooks/session-end-finalize.js`에서 `oneLineSummary`·`decisionsAdded`·`closedInSession` 박제 로직 추가
- 검증: 1회 `/close` 사이클 돌려 실제 system_state에 3개 항목 누적 확인

**Out**
- summary 자동 요약 알고리즘 고도화 (Edi 1줄 작성으로 충분)
- 과거 97세션 소급 채움 (legacy 무가치 — D-022 외부 앵커 원칙)
- Dashboard UI 노출 (별도 PD로 분기)
- N>3 윈도우 확장 / 사용자 설정 (D3=A 채택 시)

---

## 4. 핵심 전제
- **3세션은 D-077 확정값**: window 변경은 별도 결정 필요, 본 세션 범위 외
- **session_index는 append-only**: D-028에 따라 `append-session.ts`만 수정 — 신규 2필드도 해당 스크립트에 반영 필요 (Arki 점검 항목)
- **fast-path 원칙 유지**: system_state는 derived, 원본은 session_index/topic_index — sync 재실행으로 100% 복원 가능해야 함
- **Edi 1줄 박제 부담**: close 체크리스트에 "oneLineSummary 작성" 1줄 추가, 토큰 부담 미미

---

## 5. executionPlanMode 선언
- **mode: `plan`** — Grade B 구현 토픽 + 3축 동시 변경(스키마/스크립트/커맨드) → Arki 4섹션 실행계획 필수
- Phase 분해 권고: P1 스키마 신설 → P2 sync 확장 → P3 finalize hook 박제 → P4 open.md 통합 → P5 1사이클 검증
- 의존: P1 → P2,P3 / P2 ← P3 결과 / P4 ← P2 / P5 = 전체 게이트

---

## 6. 역할 호출 설계
- **Arki** (1차) — 스키마 정합성(append-only 호환), finalize hook 진입점, sync-system-state 확장 지점, Phase 실행계획 4섹션
- **Riki** — 부하/정합성 리스크: (a) sync 재계산 시 oneLineSummary 손실 가능성, (b) closedInSession 미충실 토픽의 join 실패, (c) 3세션 window edge case(retroactive·legacy 세션 혼입), 각 항목에 mitigation 병기 필수
- **Fin** — 토큰 비용 영향: `/open` 시 추가 로드 분량(3세션×약 200자) vs 현재 openTopics+pendingDeferrals, ROI 판정
- **Vera 미포함** — 시각 산출물 없음
- **Ace 종합검토** → **Dev** 구현 → **Edi** 박제

호출 순서: Arki → Riki → Fin → Ace 종합 → Dev → Edi

---

Master, 위 결정 축 6개 + 역할 호출 순서 확인 부탁드립니다. 이의 없으시면 Arki 호출하겠습니다.
