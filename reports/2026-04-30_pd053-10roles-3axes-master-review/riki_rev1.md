---
role: riki
session: session_147
topic: topic_133
date: 2026-04-30
turnId: 1
rev: 1
invocationMode: subagent
---

# Riki — PD-053 Hybrid C 설계 적대적 검토

Riki입니다. Master가 결정한 Hybrid C(L1 mechanical compile + L2 /close 강제 게이트 + L3 silent skip 제거)의 허점을 적출합니다. 원문 정독 후 코드·스킬·정책의 실제 동작 기준으로 판정했습니다. 5건의 실 리스크 + 3건 추가 검출, 마지막에 종합 권고 1단락.

---

### 🔴 R-1. authorship 사칭 — Prime Directive D2 위반 가능성

**시나리오**: L1 mechanical compile이 `reports/{date}_{slug}/edi_rev1.md`를 hook 자동 생성하면, 파일명·경로·디렉토리 구조 모두 "Edi가 작성한 보고서"의 외형과 동일하다. 다음 세션의 `pre-tool-use-task.js` v3가 이 파일을 토픽 layer inject에 사용할 때, LLM은 frontmatter `auto-compiled: true` 플래그를 무시하거나 인식하지 못한 채 "Edi 발언으로 학습"한다. 더 심각하게, `copyEdiReportToSessionContributions`가 이 fallback을 `topics/{topicId}/session_contributions/{sessionId}_edi_report.md`로 복사하면 layer inject 단계에서 "이전 Edi 요약"으로 prepend된다 (현 dispatch-context의 "이전 세션 Edi 요약" 섹션 자리).

**증거**: `session-end-finalize.js:597-619` — copyEdi는 `edi_rev*.md` 파일명만 보고 mtime 최신을 선택. 작성자 검증 없음. role-edi.md 정책 §6은 versionBump 확정을 "Edi LLM 책임"으로 박제했지만 hook 파일 생성과 LLM 발언을 구분할 수단이 없다.

**심각도**: 🔴 critical — Prime Directive D2(도구 description 거짓 전제) 그 자체. hook이 만든 파일이 "edi 보고서"라는 description으로 다음 세션 LLM에 주입되어 모델 설득(D4) 우회 경로가 열린다.

**mitigation**:
1. **파일명 분리** — auto-compile은 `edi_auto_rev1.md` (또는 `_mechanical_summary.md`)로 저장. `edi_rev*.md` 네임스페이스는 LLM Edi 전용으로 보존.
2. **copyEdiReport 가드 강화** — `frontmatter.auto-compiled: true` OR 파일명 패턴 `_auto_` 매칭 시 session_contributions 복사 skip + gaps 박제. silent skip 제거(L3) 원칙과 충돌 안 함 (gaps에 "auto-mechanical fallback, sc 복사 skip" 명시).
3. **dispatch-context layer 분리** — 이전 세션 Edi 요약 섹션을 "Mechanical Session Summary (auto)" vs "Edi Session Report (LLM)" 두 섹션으로 분리. 메인 페르소나 prompt에 "auto는 사실 컴파일이지 Edi 판단 아님" 명시.

**fallback**: mitigation 1~3 모두 실패 시 — L1을 reports/가 아닌 `memory/sessions/auto_summaries/{sessionId}.md` 별도 디렉토리에 저장. reports/ 네임스페이스를 LLM 발언 전용으로 강제 분리.

---

### 🔴 R-2. L2 게이트 우회 4경로 — Grade 오선언, /close 미실행, status 직접박제, 자동 close

**시나리오**: L2가 `/close` 스킬 Step 1.5에서 "Edi turn 없고 Grade ≠ D면 호출"을 강제한다 했다. 다음 우회 경로 모두 게이트를 통과한다:

1. **Grade C/D 오선언**: 토픽이 실제로 A/B인데 Master·Ace가 "C로 충분" 판단(피드백 메모리: `feedback_ace_grade_intent_check.md`) → L2 미발동 → 정책상 L1 base만 박제 → 실질 Edi 누락. s145가 정확히 이 패턴 (persona 재설계는 본질 A/S인데 grade 선언 누락).
2. **/close 미실행**: CLAUDE.md "Auto-close sessions" 룰(2026-04-22)이 `/close` 명령 없이 자동 close를 허용. 자동 close 경로는 Step 1.5를 통과하지 않는다 — `current_session.json`을 직접 `status: "closed"`로 Edit한 후 SessionEnd hook이 발동하면 L2가 영원히 발동하지 않는다.
3. **status 직접박제**: LLM이 자가 설득("이번만 예외, 빨리 닫자")으로 current_session.json을 직접 Edit. Prime Directive D4 위반이지만 enforcement가 /close 스킬 안에만 있으면 우회됨.
4. **2회차 close**: 1차 close에서 L2 발동→Edi 호출→Master "그냥 진행"→Edi skip→gaps 박제. 2차 close 재실행 시 turns에 Edi placeholder가 이미 있어(L1+ensureEdiInAgents) `hasEdi=true` → L2가 "이미 있음" 오판 → 게이트 무력화.

**증거**: `close.md:13` — status 변경은 LLM 자율 Edit. 게이트 hook 없음. `session-end-finalize.js:51-71` `ensureEdiInAgents`는 turns에 placeholder를 push하므로 `turnRoles.includes('edi')` 체크가 placeholder도 true 반환.

**심각도**: 🔴 critical — 게이트가 우회 가능하면 게이트로 부르면 안 된다. 특히 (2)는 메모리 룰(auto-close)과 직접 충돌.

**mitigation**:
1. 게이트를 `/close` 스킬이 아닌 `pre-session-end` hook으로 이동 — `current_session.json` status가 closed로 전환되는 시점 코드(hook)에서 Grade 검증 + LLM Edi turn 검증. 우회 차단의 단일 지점.
2. L2 검증은 "turns에 edi가 있냐"가 아니라 "turns에 edi이고 source='agent' (Agent 툴 경유) 또는 reportPath에 edi_rev*.md가 실존하냐"로 강화. PD-052 source 마킹 활용.
3. Auto-close 룰 수정: 자동 close 발동 조건에 "Grade가 C/D이거나 Edi LLM 호출 완료 (검증된)" 추가. CLAUDE.md "Auto-close sessions" 줄에 박제.

**fallback**: hook 이동 불가 시 — /close 스킬에 "Step 1.5 skip 발생 시 sess.gaps에 `edi-llm-bypass` type 박제 + `system_state.openMasterAlerts`에 prepend" 강제. Master 다음 세션 시작 시 즉시 알림.

---

### 🟡 R-3. L1 거짓 정보 위험 — turns 빈 세션의 mechanical 결과물

**시나리오**: s145처럼 turns가 거의 비어있는 세션에서 L1이 동작하면:
- "결정 흐름 표"는 1~2줄 placeholder
- "Master 결정"은 빈 배열
- "역할별 기여 통합"은 통째로 누락 (10개 섹션 중 3~4개가 사실상 빈칸)
- `oneLineSummary`는 finalize hook의 placeholder `[summary 없음 — slug]`가 그대로 박제됨 (line 129)

이 빈껍데기가 `edi_rev1.md`로 reports에 박히고 session_contributions에 복사되어 다음 세션 LLM context에 들어가면, **"이전 세션은 결정 사항이 없었다"는 거짓 신호**를 LLM이 학습한다. 실제로는 turns 박제 누락 사고였는데 mechanical fallback이 사고를 "정상 종결"로 표백한다.

**증거**: 메모리 룰 `feedback_data_category_label_vs_essence.md` — 라벨만 보고 실체 귀속 금지. mechanical compile은 정확히 "라벨(파일 존재)을 만들어 실체(LLM 판단) 누락을 가린다."

**심각도**: 🟡 medium — 데이터 무결성 위반은 발생하나 즉각 실행 왜곡으로 이어지진 않음. 단 Prime Directive D3(저장소 오염 전제)와 정합 — 단일 파일 단언 금지.

**mitigation**:
1. L1에 신호 보강 헤더 의무: "⚠ AUTO-COMPILED — turns count={N}, decisions count={M}. {N or M} == 0이면 Edi LLM 미호출 → Master 검토 필요"를 본문 최상단 박제. LLM이 다음 세션에 읽을 때 1줄 안에 경고 인식.
2. `oneLineSummary` placeholder 시 — L1이 "Edi 미호출 — turns N건, master decisions M건, gaps K건. 자동 컴파일 fallback." 형태로 fact-only summary 자동 생성. 빈 placeholder 박제 금지.
3. dashboard에 "auto-compiled fallback" 카운터 패널 추가 — Master 가시성 확보.

**fallback**: mitigation 실패 시 — turns count가 임계(예: 3) 미만인 세션은 L1 자체 skip + gaps에 `mechanical-skip-low-signal` 박제. 빈껍데기 reports를 만들 바엔 안 만든다.

---

### 🟡 R-4. versionBump 책임 충돌 — Edi LLM 미호출 세션의 자동 confirmed

**시나리오**: D-130에서 versionBump 확정은 Edi LLM 책임 (role-edi.md §6.2). Nexus는 `versionBumpSuggested`만 박제, Edi가 검증·override·확정한다. 그런데 L1 mechanical compile에 "versionBump 확정" 섹션이 들어간다고 했다. Edi LLM 미호출 세션에서 L1이 versionBumpSuggested를 그대로 "확정"으로 박제하면:

- `applyVersionBump` (line 842)은 `sess.versionBump.to`를 보고 project_charter에 자동 전파
- 하지만 L1은 LLM이 아니라 hook이므로 "to" 필드 박제 권한이 없어야 한다
- 만약 L1 spec이 `versionBump.value`만 박제하고 `to`는 박제 안 한다면 `applyVersionBump`가 skip — OK
- 그런데 L1이 `versionBumpSuggested`를 본문에 인용만 하고 `versionBump` 박제는 안 하는 spec이면 충돌은 없으나 Edi의 override 권한(§6.3)은 완전히 우회됨 (Edi LLM 호출 안 됐으니 검증 없음)

**증거**: role-edi.md §6.4 — "versionBumpSuggested 부재 시 Edi는 확정 step 자체를 생략"이라 명시. 하지만 "**부재 시**"만 언급. **존재하는데 Edi LLM 미호출** 케이스가 명시 안 됨. 이 케이스에서 L1이 박제하면 D-130 위반.

**심각도**: 🟡 medium — project_charter의 version 정확도가 떨어지는 정도. 즉각 실행 왜곡은 아니나 누적되면 버전 신호 신뢰도 훼손.

**mitigation**:
1. L1 spec에 "versionBump 확정" 섹션은 **인용만** 하고 `versionBump` 필드 박제 금지 명시. "Edi LLM 호출 시에만 확정"이 단일 룰.
2. role-edi.md §6.4에 "Edi LLM 미호출 + versionBumpSuggested 존재 시 → 다음 세션 시작 시 Master 알림 (openMasterAlerts)" 박제. 책임 위임 단절 방지.
3. `applyVersionBump`에 `confirmedBy === 'edi'` AND `confirmedAt` 존재 검증 가드 추가. 가드 실패 시 transfer skip + log.

**fallback**: 게이트 강화 실패 시 — Edi LLM 미호출 세션의 versionBump는 **무조건 0** (capacity·structural 다 0). project_charter 진실성을 누적 정확도로 회복.

---

### 🟡 R-5. 재발 방지 실패 — fallback이 사고를 가린다

**시나리오**: s145 누락 사고의 진단 핵심은 "Edi가 호출되지 않았다는 사실 자체가 즉시 보였어야 한다"였다. Hybrid C는 mechanical fallback으로 *외형상* 보고서를 만들어버린다. 다음 s145형 사고 발생 시:

- gaps에 `edi-llm-skipped` 1줄 박제 (silent skip 제거 L3)
- 하지만 reports/에는 `edi_rev1.md` 존재 (L1)
- session_contributions에 `_edi_report.md` 존재 (R-1 미적용 시)
- dashboard·session_index에 "agentsCompleted: [..., edi]" (ensureEdiInAgents)

표면 신호는 모두 "정상". gaps 1줄만 다르다. 메모리 룰 `feedback_arki_full_system_view.md`(코드 한 축 단언 금지)·Prime Directive D3와 정합 위반 — 단일 신호(gaps)에 의존하면 다축 검증 깨진다.

**증거**: 진단 트리거가 "session_contributions/_edi_report.md 부재 → Master가 알아챔"이었음. fallback 도입 후 이 트리거 자체가 소실됨.

**심각도**: 🟡 medium — 사고 재발률은 동일, 적발률만 떨어진다.

**mitigation**:
1. **다축 신호 박제** 의무 — Edi LLM 미호출 시 (a) gaps `edi-llm-skipped`, (b) `system_state.openMasterAlerts` prepend, (c) `master_feedback_log.json` auto-entry (severity=high, status=pending), (d) dashboard 패널 카운터 +1, (e) reports/edi_auto_rev1.md frontmatter `auto-compiled: true` + 파일명 분리(R-1). 5축 동시 박제.
2. 다음 세션 `/open` Step 3.6에 "직전 세션 Edi LLM 미호출 detected — 검토 필요" 브리핑 강제.
3. 30세션 누적 게이트: Edi LLM 미호출 세션이 30세션 중 5건 초과 시 critical alert + 시스템 점검.

**fallback**: 다축 박제 실패 시 — L1 자체 폐기, "Edi LLM 미호출 세션은 reports/ 비워두고 gaps만 박제" 원칙 복귀. 빈 reports가 더 정직한 신호.

---

### 🟢 R-6. gaps 알람 피로 — silent skip 제거의 신호 둔감화

**시나리오**: L3가 silent skip 제거. fallback 박제 시마다 gaps에 entry 누적. Grade D 세션이 대거 발생하는 단순 작업 토픽 시즌에 gaps 폭증 → 진짜 critical gap이 묻힘. 메모리 룰 `feedback_riki_no_opposition_for_opposition.md`와 정합 — 약한 신호로 슬롯 채우기 안 됨.

**증거**: Grade D는 L2 미발동(설계 명시) + L1만 동작 + L3 silent skip 제거. 매 D 세션마다 fallback gap 박제. D-130 후 일상 변경 다수 발생 가능.

**심각도**: 🟢 minor — 즉각 실행 왜곡 없음. 신호 noise 증가만.

**mitigation**:
1. gaps `type` 분류 강화: `mechanical-fallback-graded` (Grade D 정상 케이스, severity=info) vs `edi-llm-skipped` (Grade A/B/S 비정상 케이스, severity=critical). dashboard 필터 분리.
2. Grade D는 gaps 박제 자체를 skip하고 dashboard 카운터만 +1 (info 레벨).

**fallback**: 분류 실패 시 — gaps 신호 신뢰도 분기점 무너지므로 L3 silent skip 제거를 Grade A/B/S 한정으로 축소.

---

### 🟢 R-7. backward compatibility — rev 번호 충돌

**시나리오**: 기존 reports/에 `edi_rev1.md`(LLM 작성)가 있는 상태에서 hook이 재실행되면(/close 재실행), L1이 "파일 없을 때만 작성" 가드로 보호된다 했다. 그런데 가드 로직이 (a) 파일명만 보는지, (b) frontmatter `auto-compiled` 플래그를 보는지, (c) source 마킹을 보는지 미상세. Edi LLM이 rev1을 작성한 후 Master가 수정 요청 → Edi rev2 작성 → /close 재실행 → L1이 "rev1 있음" 감지 → skip OK. 하지만 LLM Edi가 처음에 rev1을 작성했고, 다음 세션 시작 → 이전 close 미완 발견 → /close 다시 실행 → L1이 rev1.md 존재 보고 skip → ensureEdiInAgents가 placeholder push → Edi LLM 미호출인데 turns에 edi 박제됨 → R-2 (4) 패턴.

**증거**: 위 R-2 (4) 참조. 가드 spec 부족.

**심각도**: 🟢 minor — 운영 시나리오에 따라 occasional.

**mitigation**: L1 가드를 "파일명 + frontmatter `auto-compiled: true` 모두 일치 시에만 skip"으로 정의. LLM rev1과 auto rev1을 명확히 구별.

**fallback**: 가드 명세 실패 시 — L1은 파일명을 `edi_auto_rev1.md`로 분리(R-1 mitigation 1과 동일).

---

### 🟢 R-8. session_contributions 오염 cascade

**시나리오**: R-1과 연계. R-1 mitigation 미적용 시 fallback `_edi_report.md`가 다음 세션 `dispatch-context`의 "이전 세션 Edi 요약" 섹션에 자동 inject. 그 다음 페르소나(예: 본 세션의 Riki)가 컨텍스트를 "이전 Edi 종합으로 학습". 만약 fallback이 잘못된 결정 흐름을 mechanical하게 박제했다면(turns 누락분 등), 다음 세션 LLM이 잘못된 전제로 발언 시작. Cascade 효과로 누락 영향이 멀티세션 확산.

**증거**: 본 세션 dispatch-context 자체가 그 메커니즘을 보여줌 — "이전 세션 Edi 기록 없음" 표시되면서 Riki는 "기록 없음"을 전제로 발언하게 됨. fallback이 박혀 있었다면 그 fallback을 "이전 Edi 발언"으로 신뢰하게 됨.

**심각도**: 🟢 minor (단일 세션) → 🟡 medium (3세션 누적 시).

**mitigation**: R-1 mitigation 2 (copyEdiReport 가드) 필수 적용. auto-compiled 파일은 session_contributions 복사 차단.

**fallback**: dispatch-context layer에 "AUTO-MECHANICAL — Edi 판단 아님" 헤더 강제 prepend.

---

## Riki 종합 권고

**진행 OK 조건부**. Hybrid C 방향성은 합리적이다 — L1(데이터 보존)+L2(LLM 게이트)+L3(가시화)의 3층 분리는 NIST SP 800-160 Defense in Depth와 정합한다. 그러나 현 spec 그대로 진행하면 R-1(authorship 사칭)·R-2(게이트 우회 4경로)가 Prime Directive D2/D4를 위반하여 시스템이 자기설득에 무력해진다. **다음 3건은 진행 전 필수 수정**: ① 파일명 분리 (`edi_auto_rev1.md`), ② L2 게이트를 `/close` 스킬에서 hook으로 이동 + auto-close 경로 차단, ③ `copyEdiReportToSessionContributions`에 auto-compiled 플래그 가드 추가. 이 3건 미반영 시 폐기 권고 — fallback이 사고를 가리는 구조는 사고 자체보다 더 위험하다(R-5). 나머지 R-3~R-8은 진행 후 후속 PD로 처리 가능.

[ROLE:riki]
# self-scores
crt_rcl: Y
cr_val: 4
prd_rej: Y
fp_rt: 0.15

RIKI_WRITE_DONE: reports/2026-04-30_pd053-10roles-3axes-master-review/riki_rev1.md
