---
role: riki
session: session_242
topic: topic_204
topicSlug: nexus-architecture-audit
date: 2026-05-12
rev: 1
---

# Riki — 4건 + G1 진행 가능성 감사 + D-143 supersede 적출

## 1. C1 — CLAUDE.md 75 D-refs 감축
- 실측 313라인, **41개 unique D-ref** [T4/A1/O5]. Arki "75건 = 1ref/4줄"은 숫자 부풀림 [T4/A1/O3]. 실제 1ref/7.6줄. +0.1 cap 이미 존재 [T3/A4/O5]
- **CAUTION** — 절박도 Arki 주장보다 낮음. supersede 체인 보존 의무
- 병행세션: SAFE

## 2. C2 — SessionEnd hook 단일 entry 위험
- settings.json SessionEnd = `auto-push.js` 단일 entry [T4/A1/O5]
- `auto-push.js:148-176` 실측: preSteps 5단계 직렬 + 첫 실패 시 `return false` → `process.exit(1)` [T4/A1/O5]
- tokens.js 실패하면 finalize.js·dashboard·build.js 전부 skip
- **GO** — 권장: (b) auto-push.js 내부 try/catch 격리 (preSteps 간 데이터 전달 단절 회피)
- 병행세션: SAFE

## 3. decision_ledger.json → JSONL 전환
- shape `{decisions:[...], lastUpdated}` 188 entries [T4/A1/O5]
- mutate 패턴 강함: status enum 8종 + supersededBy 사후 추가 + lastUpdated 매 변경 mutate
- JSONL의 "마지막 줄=최신" 컨벤션은 mutate 부재 전제 → 현 운영과 정면 충돌
- **NO-GO (현 형태 ADR)**. 대안: status 변경 이벤트만 별도 JSONL, 본체는 JSON 유지
- 병행세션: **IMPACT** — D-181 m_decision_ledger_{worktreeId}.json array shape 가정. m_* grep 0건 (미구현)

## 4. topic_meta.json SOT 승격
- topic_index.json read 사이트 **68건** [T4/A1/O5]
- D-F(2026-04-28) 박제 supersede 필요. fan-out I/O
- **NO-GO**. ROI 음수 의심
- 병행세션: **IMPACT** — D-181 m_topic_index_{worktreeId}.json 본문 의미 모호화

## 5. G1 — finalize.js 재분해 (Master 컨텍스트 환기)
- 실측 **1,893 라인** [T4/A1/O5]. git log 59 커밋
- 통합 결정 박제 D-NNN grep 미발견 — 단, ledger 188건 전수 정독 못함 (자가 검증 한계)
- **GO** (orchestrator 유지 + 모듈 분리 패턴). Node startup 부하 무변동
- 병행세션: SAFE

## D-143 정면 적출 (Riki R-3 후속)

전수 grep 결과 D-143 (session_165) 본문:
> "Arki Opt-1(config-driven refactor·helper·try/catch·G1) 폐기 — over-engineered. Master 통찰('에디만 추가하면 되는 문제 아니야?') 직접 적출."

본 세션 G1 권고는 **D-143을 재차 위반**. supersede 결정 박제 필수 또는 G1 폐기.

## 종합 진행 권고

| # | 항목 | 권고 | 병행세션 |
|---|---|---|---|
| **1순위** | C2 (auto-push 내부 try/catch) | **즉시 GO** | SAFE |
| **2순위** | G1 재분해 | **GO** (D-143 supersede 박제 후) | SAFE |
| 3순위 | C1 D-ref 감축 | **CAUTION** | SAFE |
| **보류** | #3 JSONL 전환 | **NO-GO** | IMPACT |
| **보류** | #4 topic_meta SOT | **NO-GO** | IMPACT |

## 추가 적출 (Arki 미커버)

- **R-1** 외부 ADR 권고 출처 검증 부재 — Arki ADR 무비판 채택 흔적 [T2/A1/O3]
- **R-2** m_* 파일 grep 0건 — PD-079 미구현 상태에서 본체 스키마 변경 시 m_* 선행 설계 부담 [T4/A1/O5]
- **R-3** G1 통합 결정 D-NNN 미확인 — ledger 188건 전수 정독 한계 [T2/A1/O3]. Edi 박제 직전 cross-check 의무

## 자가 검증 한계 (D-185)

- decision_ledger 188 entries 중 D-181 본문만 확인 — G1 통합 결정 D-NNN 부재 단언은 grep 결과 기반
- topic_index read 사이트 68건 array shape 의존 여부 정독 없음
- 외부 ADR 원문 미열람
- T4 자가 부여는 근거 형식만 보장 — 충분성은 자가 판정 불가
