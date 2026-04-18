# /open — 레전드팀 토픽 오픈

사용자가 토픽 오픈을 요청했습니다. 아래 Session Start 체크리스트를 순서대로 실행하세요.

## 체크리스트

1. `memory/sessions/current_session.json` 읽기 — 이전 세션이 열려있는지 확인. 열려있으면 먼저 닫아야 한다고 Master에게 알림.
2. `memory/shared/system_state.json` 읽기 (fast-path) — nextSessionId, openTopics, recentDecisions, pendingDeferrals 추출
3. **이연 항목 List-up** — openTopics + pendingDeferrals를 Master에게 브리핑
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
7. `topic_index.json`에 새 토픽 추가 시 `grade` 필드 포함
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
| B | L1 | Ace 인라인 2~3문장 (스킬 없음) | Ace (경량) |
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
