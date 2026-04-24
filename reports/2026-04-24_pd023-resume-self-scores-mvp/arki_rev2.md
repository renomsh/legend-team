---
session_id: session_094
topic: pd023-resume-self-scores-mvp
role: arki
rev: 2
date: 2026-04-24
---

# Arki — Drift Map v2 + PD-031 Root Cause v2

## 오진 수정
- Riki의 hook chain 실측 공격 수용. auto-push.js → session-end-tokens → session-end-finalize → compute-dashboard → build 전 체인 검수 결과, 파서/추출 경로 모두 **정상 동작** 확인.
- 10건 YAML 기록 자체가 정확히 `memory/roles/personas/` 중 dev/editor 2역할에서만 나온 것. 파서는 들어온 YAML을 100% 처리함.

## Root Cause v2
- **결함은 pipeline이 아니라 입력 공급선**: 8역할(ace/arki/fin/riki/nova/dev/editor/vera) 중 dev·editor persona 프롬프트에만 YAML 블록 생성 instruction이 있음. 나머지 6역할은 생성 지시 자체가 없음 → 기록 0건은 당연 결과.
- 해결책: Phase 3-supplementary — 8역할 페르소나/서브에이전트 프롬프트에 YAML 블록 생성 instruction 편입.

## 교훈
- 파일 1개만 보고 단정 금지. hook chain 전수 확인 + 실측 증거 우선. → D-078 프로토콜 v2로 박제.
