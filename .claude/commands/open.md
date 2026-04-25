# /open — 레전드팀 토픽 오픈

사용자가 토픽 오픈을 요청했습니다. 아래 Session Start 체크리스트를 순서대로 실행하세요.

## 체크리스트

1. `memory/sessions/current_session.json` 읽기 — 이전 세션이 열려있는지 확인. 열려있으면 먼저 닫아야 한다고 Master에게 알림.
2. `memory/shared/system_state.json` 읽기 (fast-path) — nextSessionId, openTopics, recentDecisions, pendingDeferrals 추출
3. **이연 항목 List-up** — openTopics + pendingDeferrals를 Master에게 브리핑
3.5. **[context_brief 자동 로드]** `npx ts-node scripts/load-context-briefs.ts` 실행.
   - hold=null인 openTopics의 context_brief.md를 자동 로드해 Master에게 요약 브리핑
   - 파일 없는 토픽은 조용히 스킵 (오류 아님) — 신규 토픽도 context_brief 미생성 상태이므로 자동 스킵
   - 출력이 비어있으면 "활성 context_brief 없음"으로 보고 후 진행
3.5-b. **[최근 3세션 요약 브리핑]**
   - `system_state.json`의 `recentSessionSummaries[]` 배열을 읽어 Master에게 브리핑:
     - 각 항목: `{sessionId}: {topicSlug} — {oneLineSummary} (결정: {decisionsAdded.join(', ')})`
   - 배열이 비어있거나 필드 없으면 "최근 세션 요약 없음 (oneLineSummary 미기록)" 출력 후 진행
3.6. **[자동 종결 dry-run 배치]** (D-057, session_067)
   - `npx ts-node scripts/auto-close-topics.ts` — framing 토픽 중 모든 children이 completed면 종결 제안 출력 (무변경)
   - `npx ts-node scripts/resolve-pending-deferrals.ts` — resolveCondition 매칭 PD 전이 제안 + stale 리포트
   - 제안이 있으면 Master에게 리스트업. 저마찰 원칙: 무응답=보류 (적용하려면 --apply 재호출)
   - 제안 0건이면 조용히 스킵
4. `memory/sessions/session_index.json` 읽기 — 마지막 session ID 확인하여 다음 ID 생성
5. **Grade 판정** (아래 Grade 판정 규칙 참조) — `grade` 결정 후 Framing Level 선택
6. `current_session.json`을 새 세션 정보로 업데이트:
   - 새 sessionId (session_NNN)
   - topic, topicSlug
   - status: "open"
   - startedAt: 현재 시각 (ISO 8601)
   - mode: 확인된 모드 (기본값: observation)
   - grade: 판정된 grade (S/A/B/C)
   - framingLevel: 0/1/2
   - framingSkipped: true/false
7. **[필수·자동]** `npx ts-node scripts/create-topic.ts "<topic title>" <topicSlug>` 실행 — topic_index.json에 새 엔트리 자동 등록. Edit 도구로 수동 추가 금지. (D-047, 재발 방지 — session_036~041의 topic_index 등록 누락 사고 원인 해소)
   - 실행 후 출력된 topic_id를 `current_session.json.topicId`에 기록
   - grade 필드는 create-topic.ts가 topic_index 기록 후, 별도 Edit으로 해당 엔트리에 `grade: "<S|A|B|C>"` 추가
   - topic_index.json은 `compareTopicDesc` 기준 desc 정렬 상태로 유지됨 (create-topic.ts가 자동 정렬)
8. 세션 오픈 완료 보고 후, **Framing Level에 따라 첫 주자 결정**

---

## Grade 판정 규칙

### 1. Master 명시 우선
토픽 앞에 단일 문자 `S` `A` `B` `C` 중 하나가 오면 grade로 인식:
- `/open B 대시보드 버그` → grade: B
- `/open A 전략 설계` → grade: A
- 앞에 grade 문자 없으면 키워드 자동 추론 (아래 표 참고)

### 2. 키워드 자동 추론 (명시 없을 때)

| 토픽 키워드 | 추론 grade | 비고 |
|---|---|---|
| bug, fix, 버그, 수정, 오류, 배포, deploy, patch | C | ops/data-fix도 포함 |
| ops, 운영, 점검, 확인, 로그 | C | |
| 신규 기능, 설계, 아키텍처, 프로토콜, 전략 | A | 기본 전략 |
| 역할 도입, 시스템 개편, 전면 재설계, 핵심 결정 | S | 최고 복잡도 |
| 그 외 | A | 안전 방향 기본값 |

### 3. Grade → Framing Level 매핑

| Grade | Level | Framing 방식 | 첫 주자 |
|---|---|---|---|
| S | L2 | `ace-framing` 스킬 전체 | Ace |
| A | L2 | `ace-framing` 스킬 전체 | Ace |
| B | L2 | `ace-framing` 스킬 전체 | Ace |
| C | L0 | 프레이밍 없음 | Dev 직행 (또는 최소 역할) |

### 4. C/B grade Dev 판정 스텝 (필수)
C/B grade로 진행 중 Dev 또는 Riki가 "구조적 문제"로 판정 시:
→ `framingSkipped: true`였더라도 Ace 즉시 재소집 → L2로 전환

---

## 규칙
- 기본 grade: A (키워드 매칭 실패 시)
- 기본 모드: Observation Mode
- 사용자가 "$argument"에 토픽 제목을 포함했으면 그대로 사용
- 이전 세션이 닫히지 않았으면 경고 후 Master 판단 대기
- grade 판정 결과를 세션 오픈 보고 시 명시 (예: "Grade: C → L0, Dev 직행")
