---
role: riki
session: session_182
topic: topic_157
topicSlug: open-close-lightweight
turnId: 1
invocationMode: subagent
date: 2026-05-04
rev: 3
---

RIKI_WRITE_DONE: reports/2026-05-04_open-close-lightweight/riki_rev3.md

# Riki — `/open` 매핑 테이블 설계 리스크 감사

---

## TL;DR

**확인된 실질 리스크 2건.**

🔴 R-1: 이 설계는 `/open` 토큰 과부하의 근본 원인을 겨냥하지 않는다. 현재 75K 부담의 핵심은 dispatch-context inject (역할 policy + 이전 발언 전문)이며, `open_routing_config.json` lookup으로는 해당 레이어를 건드리지 못한다.

🟡 R-2: `grade × topicType × isNew` 3-키 조합이 실제 `/open` 분기 결정을 충분히 커버하지 못한다. Master가 세션 중간에 Grade를 변경하는 경우, 또는 기존 토픽이 role 전환 없이 새 scope로 확장되는 경우를 이 키셋이 표현하지 못한다.

---

## R-1. 🔴 틀린 문제를 풀고 있을 가능성

### 근거 (원문 수치 인용)

Arki 보고서 §1 분석 결과: D-1~D-10 분류 결정 중 실질 LLM 판단 필요 항목 = 2건(Grade A/S 경계, role memory 파일 선택). 나머지 8건은 이미 규칙으로 치환 가능하다고 Arki 자신이 인정.

그런데 이 분류 결정들은 `/open` 컨텍스트 크기에 기여하는가? dispatch-context 블록 실측(session_182 현재 ~75K)을 보면, 이 75K의 구성은:
- 공통 policy `_common.md` + 역할 persona 레이어: ~8,500 bytes (Arki 실측)
- 이전 역할 발언 전문 inject: session_182 turn 0 = arki_rev2.md 약 9,346 bytes
- Edi 이전 세션 요약 inject: session_181 edi_rev1.md (수천 bytes)
- Master-first 헤더, system state, 기타

**Arki 설계가 절감하는 것: LLM이 분류 결정 시 읽는 파일 수 (D-7 `topic_load_manifest.json` 1건 절감 등).**

**Arki 설계가 절감하지 못하는 것: dispatch-context가 inject하는 policy 텍스트 + 이전 발언 전문 레이어.** 이 레이어는 `open_routing_config.json` 도입 여부와 무관하게 hook이 자동 prepend한다. 세션 181 edi_rev1에서 G-1(post-tool-use-task.js 검증)·G-2(MAX_CHARS_PER_REPORT → dispatch_config.json 이전)·G-3·G-6이 미해결로 남아 있으며, 이 항목들이 dispatch-context 크기를 직접 제어하는 경로다.

**실패 시 파손 범위:** `open_routing_config.json` 구현·검증에 세션을 소비하고도 `/open` 토큰 75K가 유의미하게 줄지 않는 결과가 나올 수 있다. 이 설계가 session_182의 목표("오픈·클로즈 경량화")에 직접 기여하는지 Master 확인이 필요하다.

**완화 조건:** Master가 이 세션의 목표를 "dispatch-context 크기 감소"가 아닌 "/open 분류 결정 구조화(deterministic화)"로 명시한다면 R-1은 소멸. 두 목표는 다른 문제다. 현재 topic slug는 "open-close-lightweight"이고 session_181 edi_rev1 §1에서 "서브에이전트 프롬프트 자체 정제(보고서 내용 간결화)" 방향이 미착수 상태로 명시되어 있음 — 이 방향이 미완결인 상태에서 방향이 전환된 것인지 확인 필요.

---

## R-2. 🟡 3-키 매핑의 런타임 불변 가정

### 근거 (원문 §2-1 인용)

> "Key = { grade, topicType, isNew }" — "D-3: `/open topic_NNN` 패턴 유무 (규칙 — 패턴 매칭 결정적)"

이 설계는 key가 `/open` 호출 시점에 확정되고 세션 내내 불변임을 전제한다.

**실제 발생하는 케이스:**
1. Master가 `/open` 후 "아 이거 S급으로 하자"라고 grade를 바꾸면, 이미 lookup된 `loadFiles[]`와 `roleSequence[]`는 무효화된다. 현재 설계에 re-key 트리거가 없다.
2. `isNew=false` (기존 토픽 재사용)인데 세션 중 scope가 확장되어 신규 역할 투입이 필요해지면, `B_standalone_existing`에 고정된 `roleSequence`가 Nexus 판단을 제약한다. CLAUDE.md §Operating Protocol에서 Nexus는 "역할 순서 재정의·재호출"을 판단 권한으로 갖는데, config `roleSequence`가 이를 덮어쓰는 형태로 구현되면 충돌.

**실패 시 파손 범위:** 미드세션 Grade 변경 시 wrong `loadFiles`로 진행, 누락 context 발생 — 오진·재작업(memory feedback 기준). 또는 Nexus가 config를 무시하고 LLM 자율 판단으로 돌아가면, 설계의 deterministic 효과가 0이 됨.

**완화 조건:** config가 "초기값 제안"으로만 사용되고 Nexus가 언제든 override 가능하도록 명문화. `roleSequence`를 강제 실행 명령이 아닌 "default suggestion"으로 스키마에 표현. Arki §4 경계 조건 테이블에 "Master가 `/open` 직후 Grade 변경" 케이스 추가.

---

## 기각 항목 (의도적 제외)

- Arki §5 P-1(fallback 병행 운용)·P-2(hook 신설 불필요)·P-3(gradeKeywords SOT 이전) 재나열 — 이미 Arki가 전제로 명시. 중복.
- `topicType 알고리즘 분산` (Arki 1차 MUST_NOW): Arki가 해법까지 정의 완료. Riki 슬롯 낭비.
- `gradeKeywords 3곳 중복` (Arki 2차 SHOULD): 구조 개선 항목. Master가 모를 수 있는 실질 리스크 아님.
- JSON 파싱 에러, 파일 miss 경보: Arki §4 경계 조건 테이블에 이미 포함됨.

---

[ROLE:riki]
# self-scores
crt_rcl: Y
cr_val: 4
prd_rej: Y
fp_rt: 0.10
