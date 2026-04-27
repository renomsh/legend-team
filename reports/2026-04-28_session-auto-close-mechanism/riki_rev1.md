---
turnId: 3
invocationMode: subagent
role: riki
topic: session-auto-close-mechanism
session: current
date: 2026-04-28
---

# Riki — 자연어 자동 close의 14단계 강제력 적대 점검

Riki입니다. Master 질문 핵심에 직격합니다: **자연어 트리거 자동 close는 14단계 체크리스트를 전부 강제하지 않습니다.** 게다가 Master의 "여러 번 다시 close" 경험은 git log에 명백한 지문으로 남아 있습니다.

---

### 🔴 R-1. 동일 슬러그 2회 commit이 4건 — Master 재트리거의 직접 증거

git log 최근 30개 중:
- `dashboard-maintenance-home-growth-system` → 39244b3 (27일 19:25) **+** 5eefdb7 (27일 22:42)
- `topic-session-1-to-n-open-rule` → a3e9c1a **+** 443269d
- `dashboard-home-layout-unification` → 26734e0 **+** e1675cd
- `dashboard-maintenance-followup` → 7f7a2bb **+** ac29a89

39244b3↔5eefdb7 diff(`git diff --stat`)에서 2차 close가 추가로 건드린 파일: `decision_ledger.json`, `master_feedback_log.json`, `ace_memory.json`, `dev_memory.json`, `edi_memory.json`(rename 포함), `glossary.json`, `project_charter.json`, `topic_index.json`, `composite_inputs.json`, **session_index.json 374줄 변경**. **즉 1차 close는 단계 3·4·6·7을 전혀 수행하지 않았다**. 2차 close(Master 재요청)가 비로소 14단계 본체를 발동시킨 것이다. 파손 범위: 단발 close가 verbose 슬러그여도 silently 부분 누락.

### 🔴 R-2. "session end: auto" commit 3건은 hook chain만 작동, LLM 단계 1~7 전무

af41e55·8a771f5·1086a41 stat 비교: `dist/data/`·`logs/`·`token_log`·`dashboard_data`·`signature_metrics_aggregate`만 변경. **`memory/roles/*_memory.json`·`decision_ledger.json`·`master_feedback_log.json`·`reports/` 어디에도 손대지 않음**. 이는 LLM이 status=closed를 선행 박제하지 않은 채 Stop hook fallback push만 발동한 케이스. session-end-finalize.js:382-385 가드(`status==="closed"` 선행) 때문에 finalize 자체도 skip되어 Turn[] 전파·oneLineSummary placeholder조차 박히지 않았을 가능성. **3 of 30 = 10% 무성 누락률**. 파손: 학습 누적 손실 + 결정 박제 갭 + 피드백 캡처 실패가 검출되지 않고 통과.

### 🟡 R-3. checklist log는 "INFO/WARN"만 출력하고 진행을 막지 않음

`logs/app.log` session_113·115·118 모두 `[checklist] [WARN] topic_index: topic not found` 또는 `reportPath not found` 발생했지만, 다음 줄 즉시 `END session_NNN` 로깅 + L2-writer 진행. **WARN이 게이트가 아니라 알림이다**. 파손: 단계 4(topic_index 갱신) 누락이 WARN으로 흘러나가도 자동 close는 그대로 success 처리. Master는 dashboard에서 사후 발견할 수밖에 없음.

### 🟡 R-4. 단계 5 oneLineSummary 누락은 finalize hook이 placeholder로 메우는 구조 (Arki F-118d 참조)

LLM이 oneLineSummary를 안 쓰면 finalize가 자동 placeholder 박제 → 외형상 "채워짐" → Edi 역검사도 통과. 즉 **누락이 silent하게 정상으로 위장된다**. session_117(39244b3) editor_rev1.md만 단일 등록된 점도 단계 1(reports 저장) 부분이행 신호.

---

### 기각 (의도적 제외)

- "hook이 가끔 실패할 수도" — `hook-diagnostics.log` 최근 50줄에 hook 실패 로그 없음. 추측성이라 제외.
- decision_ledger 형식 일탈 — 본 토픽 결정 범위 밖.
- L2/L3 worktree 경로(`C:\Users\문성훈\.omnara\...`) 이중 기록 — Master 단일 머신 운용엔 영향 없음. 제외.

---

### 권고

**14단계 강제 보장 메커니즘 필요한가? Y.** 최소 게이트 2개:

1. **Stop hook 진입 시 status≠"closed"이면 LLM에게 "단계 1~7 미수행" 경보를 띄우고 14단계 자동 적용 모드 트리거** — 현재는 가드가 silent skip만 함.
2. **단계 3·4·6·7 deltacheck 후크** — close 직전·직후 `decision_ledger.json`·`master_feedback_log.json`·`role_memory.json`·`topic_index.json` mtime이 현재 sessionId 범위에서 변경됐는지 확인. 미변경 + decisions/feedback 후보 존재 시 BLOCK.

```yaml
# self-scores
crt_rcl: Y
cr_val: 4
prd_rej: Y
fp_rt: 0.10
```
