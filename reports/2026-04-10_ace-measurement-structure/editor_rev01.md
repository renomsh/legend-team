---
topic: ace-measurement-structure
title: Ace 측정구조 설계 — masterSelectionPatterns 구현
role: editor
revision: 1
date: 2026-04-10
session: session_013
status: completed
accessed_assets:
  - file: ace_memory.json
    scope: full
  - file: decision_ledger.json
    scope: all_topics
  - file: master_feedback_log.json
    scope: all
  - file: evidence_index.json
    scope: all
---

# Ace 측정구조 설계 — 세션 기록

## 개요
topic_010(역할 재정의)에서 이연된 "Ace memory 측정구조"를 인프라 작업으로 처리.

## 참여 역할
Nova, Arki, Fin, Riki, Ace — Master 지시로 전원 의견 제출.

## 주요 결정

### 1. masterSelectionPatterns 구조
- 기록 단위: Decision(D-NNN) 단위 (전원 합의)
- 저장 위치: ace_memory.json 내부 (Arki)
- stats 필드: 저장하지 않음, 필요 시 계산 (Arki + Riki)

### 2. observations 배열 위치
- Ace 초안: decisions[]와 observations[]를 별도 배열로 분리
- Master 판단: 정형/비정형 분리 자체가 리스크 → Arki에게 확인
- Arki 의견: Decision 레코드 내 observations 필드로 내장 + selectionReason 필수
- **채택: Arki 안** — 별도 배열 대신 레코드 내장

### 3. Ace 발언 프로토콜
- 종합검토 시 `나의 추천` 섹션 필수화
- 추천 없이 "Master가 결정하시면 됩니다" 금지

### 4. lessonLog 기록 기준
- Ace 제안이 기각되고 다른 역할 채택 시
- Master가 Ace 외 역할에 직접 확인 요청 시
- Master가 판단 근거를 직접 설명 시
- Master가 표현을 고칠 때
- 동일 패턴 기각 2회 이상 반복 시

## Master 핵심 피드백
- Ace = Master와 동일화 대상. 다른 역할은 보완/충돌 축.
- 학습 대상은 "선택 흔적": 채택안, 기각안, 수정 이유, 재사용 기준
- 레전드팀은 별도 프로젝트가 아니라 실무의 부산물로 학습해야 함
- Riki의 "채택률 의식 차단" 기각 — Ace는 자기측정 필요

## 실행 결과
- `ace_memory.json`: 3개 분산 배열 → 1개 통합, masterSelectionPatterns + lessonLog 추가
- `agents/ace.md`: 추천 필수화 + 선택 흔적 기록 포맷 추가 (selectionReason 필수)

## 이연 항목
- 과거 토픽(002~010) 소급 기록: 리포트에 명시적 추천이 있는 건만 대상 (미실행)
- 토픽 유형별 호출 세그먼트 + 분류 체계: 다음 토픽으로 확정
