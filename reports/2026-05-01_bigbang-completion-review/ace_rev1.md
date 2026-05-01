---
role: ace
session: session_160
topic: topic_141
topicSlug: bigbang-completion-review
date: 2026-05-01
turnId: 0
invocationMode: subagent
rev: 1
---

# Ace — 구조·흐름 판정

## Step 0: topicType 판정

- topicType: standalone (기존 유지)
- parentTopicId: null
- 실질 질문: "Edi 자동화 Grade C/D mechanical fallback 운영이 Grade A/B/S Edi LLM 누락과 혼재되고 있는가?"

## 구조(Structure) 판정

**판정 대상:** session-end-finalize.js Edi 자동화 로직 — synthesizeMechanicalEdiReport + auditEdiLlmInvocation Grade 분기

**코드 확인 결과:**

1. auditEdiLlmInvocation (line 845-962)
   - Grade A/B/S → LLM Edi 미호출 시 다축 4신호 박제 (gaps edi-llm-skipped severity=high + openMasterAlerts + master_feedback_log + log)
   - Grade C/D → enforcement 면제 (info-level gaps mechanical-fallback-graded만)

2. synthesizeMechanicalEdiReport (line 683-827)
   - LLM Edi 파일 부재 시 Grade 무관하게 edi_auto_rev1.md 생성
   - auto-compiled: true 마킹으로 LLM 산출물과 네임스페이스 분리

3. detectVersionBump (line 1064-)
   - Grade C/D → skip (line 1075-1078)
   - bugfix 카테고리의 grade === 'C' || 'D' 조건(line 1133-1134)은 dead code (상위 분기에서 이미 return)

**구조적 발견:**
- 설계 의도 올바름: Grade C/D mechanical fallback은 정상 경로
- 현재 gaps 원인: session_159-160이 Grade A인데 Edi LLM 서브에이전트 미호출
- 구조적 약점 1: LLM Edi 검출 신호 2가지뿐 (turns.source==='agent' OR edi_rev*.md 존재) — turns source 미마킹 시 false-positive 가능
- 구조적 약점 2: synthesizeMechanicalEdiReport는 Grade 무관 동작 → Grade A에서 기계 산출물 + 4신호 경보 동시 발생

**Trade-off:** mechanical fallback(세션 기록 무결성) vs Grade A 산출물 품질 저하. 시스템이 탐지는 하되 차단하지 않는 warn-only 설계.

## 흐름(System) 판정

**현재 흐름:**
```
Grade A 세션
  → Edi LLM 미호출
  → edi_auto_rev1.md 생성 (이미 확인됨)
  → edi-llm-skipped (high) 4신호 박제
  → versionBumpSuggested confirmedBy: null 유지
```

**리스크(측정 가능):** edi-llm-skipped gap 누적 → session_contributions에 mechanical fallback 쌓임 → 다음 세션 컨텍스트 품질 저하

**불확실성:** Grade A에서 Edi LLM 미호출 패턴이 구조적 문제인지 운영 실수인지 불명확

**적응 가능성:** hook에 `if (llmEdiExists) return` 분기 존재 — LLM Edi 호출만 하면 구조 변경 없이 해소 가능

## 결정축

"Grade A 세션에서 Edi LLM 미호출 반복 원인을 먼저 진단할 것인가, 현 session에서 Edi LLM을 지금 호출할 것인가?"

- Option A — 원인 진단 우선: Arki에게 Edi 발동 실패 패턴 분석 요청
- Option B — 즉시 Edi LLM 호출: edi_rev1.md 생성 → gap 해소, 원인은 deferred

Trade-off: A는 재발 방지, B는 빠른 gap 해소

## 지속 가능성 판정

**Conditional.** mechanical fallback 구조 자체는 D-131 설계대로 동작 중. 단, Grade A에서 Edi LLM 반복 미호출 패턴이 지속되면 경보 피로(alert fatigue) 위험.

## executionPlanMode

`conditional` — Master 결정 후 분기 갈림

## 다음 주자

Master 결정 대기.
- Option A → Arki
- Option B → Dev
