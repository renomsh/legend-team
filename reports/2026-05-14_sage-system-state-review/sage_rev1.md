---
role: sage
session: session_247
topic: topic_207
topicSlug: sage-system-state-review
date: 2026-05-14
rev: 1
turns: [0, 1]
authorship: agent
---

# Sage — 시스템 상태 점검 + Nexus 반복 패턴 진단

## Turn 0 — 3축 시스템 점검

### 축 1. worktreeMergeFailures 누적 (D-187 정합)

**관찰 (T4/A0/O5):**
- system_state.worktreeMergeFailures 2건 (claude/practical-pare-60a262 02:27, claude/zen-dewdney-2c01e4 03:27) 동일 파일쌍(self_scores.jsonl + dashboard_data.json)
- .gitattributes L12·L15 두 파일 merge=ours 등재 정상
- 두 워크트리 git config: core.hooksPath + merge.ours.driver=true 정상

**핵심 단언 (T4/A2/O5):** 실패 원인은 충돌 해결 단계가 아닌 **머지 직전 working tree dirty**. merge=ours driver는 충돌 해결 단계 작동, working tree 미커밋 변경 시 git이 머지 자체를 시작 못 함.

**누적 vs 단발 (T3/A2/O5):** **누적 패턴**. 1시간 간격 2건 동일 파일쌍. PD-086(분리 항목 명기, CLAUDE.md L91)이 SOT인데 system_state.pendingDeferrals 명단에 부재 → 추적 부재.

**자기기만 신호 (T3/A2/O3):** D-187 박제 시 "차단 완성"으로 인식. 실제로는 **충돌 해결 단계만 차단**, 머지-전 working tree 오염 잔존.

### 축 2. PendingDeferrals 누적 (13건)

**관찰 (T4/A0/O5):**
- 명단 13건 (Nexus 프롬프트 "11건" 오차 +2)
- topic_197 클러스터: PD-079·088·089·090·091·092 = 6건
- topic_200 클러스터: PD-083·084 = 2건
- resolveCondition 명기 PD-085·087만 = 2/13 (15%)
- 가장 오래된 PD-075 (2026-05-10) → 4일 age

**핵심 단언 (T4/A2/O5):** **11/13 resolveCondition 미명기 = D-056/D-057 자동 전이 시스템 84% 무력화**. PD가 "Master 수동 검토 무한 큐"로 변질.

**자기기만 신호 (T3/A2/O5):** D-056 박제 시 "PD 자동 전이"가 정상 동작 전제, 실제 운영은 미명기 디폴트. registry-vs-실제 갭 = D2 prime directive 시스템 레벨 위반.

### 축 3. session_246 gaps 패턴 (D-194 정합)

**관찰 (T4/A0/O5):**
- session_index.json session_246 entry: gaps 필드 부재 (grep 0 hit)
- reports/2026-05-13_zero-external-skill-review/edi_rev1.md §6: missing-report 4건만 명기
- 실제 reports/ 디렉토리: ace_synthesis.md, zero_rev1·rev2·m1·m2·m3, edi_rev1.md 모두 존재

**Nexus 프롬프트 "gaps 8건" 정정 (T2/A0/O3):** missing-report 4건만 cross-check 가능 출처에서 확인. inline-role-header-mismatch 4건은 session_index/edi_rev1 미발견 — current_session.json에는 8건이지만 session_index 전파 시 4건 누락 = **gap propagation 결함 추가 발견**.

**핵심 단언 (T4/A2/O5):** 실제 패턴은 **hook 패턴 정밀도 결함 4건**. ace_synthesis.md, zero m1/m2/m3_*.md 같은 변형 파일명을 hook이 `{role}_rev*.md` 단일 패턴으로 인식 못 함.

**자기기만 신호 (T4/A2/O5):** Edi가 §6에서 "별도 PD 후보, 본 토픽 OUT" 분리 명시했으나 PD 등록 안 됨. **D-194 박제 직후 본인 위반**.

### 메타 패턴 (3축 횡단)

**M-1. resolveCondition 누락 = 시스템 자기기만 공통 메커니즘 (T3/A2/O5)**
- 축 1: PD-086이 PD 명단 부재
- 축 2: 11/13 미명기로 자동 전이 무력
- 축 3: Edi가 분리 명시했으나 PD 등록 누락
- 공통: "분리 처리 의도"가 행위(PD 등록 + resolveCondition 명기)로 이어지지 않음. D-056/D-057 description "자동 전이" vs 실제 "수동 무한 큐" = D2 위반.

**M-2. 박제 직후 즉시 위반 패턴 (T2/A1/O3, sample size 1)**
- session_246: D-194 박제 + 본인 §6 위반
- session_245: D-187 박제 전제(PD-086) 등록 누락
- 추세 단언은 sample 부족 — 다음 1~2 세션 cross-check 의무

---

## Turn 1 — Nexus 반복 패턴 진단 (DVA)

### 패턴 명명: Declaration-Verification Asymmetry (DVA)

**3 세션 cross-check sample:**

| 세션 | 사례 | DVA 형태 | [T/A/O] |
|---|---|---|---|
| 235 | PD-80 D.Condense=false 통과 단언 → fabrication | DVA-A 사실 단언형 | T1을 T4처럼 발화 |
| 246 | D-193 정책 박제 → 실질 SOP 미흡수 | DVA-B 정책 박제형 | A3을 O5처럼 발화 |
| 247 turn 0 | "gaps 8건" 단언 → Sage 적출 정정 | DVA-A | T1을 T3처럼 발화 |

**DVA 표준 형태 3가지 (모두 D4 위반):**
- DVA-A 사실 단언형: 검증 안 한 수치/상태를 검증된 듯 발화
- DVA-B 정책 박제형: 정책 선언 = 실행 완료로 자가 등치
- DVA-C 자가 등급 인플레이션: T·A·O 자가 부여로 검증 우회

**빈도 추정 (T2/A1/O3):** 최근 13 세션(235~247) 중 명시 적출 3건. 암묵 누락 추정 다수 (Master 미적출 ≠ 무사고).

### 구조적 원인 진단 (D4 정합 우선)

| 원인 | 검증 | 결론 [등급] |
|---|---|---|
| (a) LLM 자가 통제 한계 | D-185 본문: "T4 자가 부여가 fabrication을 막지 않는다" 명시 | **확정** [T4/A3/O5] |
| (b) Hook 부재 | validate-prime-directive는 CLAUDE.md 텍스트 변조만 검증, 발화 D1~D4 위반 미검증. D-185 enforcement hook 0건 | **확정** [T4/A2/O5] |
| (c) 자가 측정 결함 (D-183) | D-184 본문: "충분성은 자가 판정 불가" 명시 | **확정 (구조적)** [T4/A3/O5] |
| (d) 정책 박제 = 해결 착각 | D-185 박제일(05-12) 이틀 후(05-14) 동일 패턴 재발 | **확정 (메타)** [T4/A3/O5] |

**핵심 진단 (T3/A2/O3):** Nexus 결함의 본질은 LLM 한계 + **"정책 박제로 해결한 것처럼 자가 안도"** 메타 패턴. D-185 자체가 "정책 = 해결" 거짓 안도 부여.

### 옵션 카드 (5개)

| # | 옵션 | 메커니즘 | 비용 | D4 정합 | 부작용 |
|---|---|---|---|---|---|
| **O1** | 수치 단언 출처 매칭 hook (PostToolUse, MVP) | 자동 검증 (모델 판단 0) | 중상 (false-positive 우려) | 상 | 영역 한정 시 완화 |
| **O2** | 응답 전 자가체크 슬롯 의무화 (UserPromptSubmit) | prompt 강제 | 저 | 중 (Goodhart 위험) | 응답 길이↑ |
| **O3** | Master/Riki 외부 검증 게이트 | 운영 패턴 | 저 | 중 (LLM 의존) | Master 인지 부담↑ |
| **O4** | decision_ledger schema에 enforcementMechanism + selfNullifyByDate 필드 강제 | 메타 D4 enforce | 중 (마이그) | 상 | 정책 박제 속도↓ |
| **O5** | 읽기 전 출처 declaration 강제 (PreToolUse) | 형식 사고 강제 | 저-중 | 중 (Goodhart) | 노이즈↑ |

### Sage 권고 1순위 (T3/A1/O3)

**조건부 O4(1순위) + O1 MVP(병행), O2/O5 기각, O3 보조**

- O4 1순위: D-185 박제 자체가 "prompt-only 무한 박제 루프"의 구조적 증상. 이 메타 루프를 차단해야 함.
- O1 MVP: 수치/카운트 단언 한정 (turn 0 "gaps 8건" 직접 대응). 별도 Grade B 토픽 분리.
- O2/O5: 형식 슬롯 = Goodhart 위험 (D-092 정합).
- O3: enforce는 코드, 발견은 Riki. 단독 의존 금지.

### 자기참조 caveat (R-1)

본 분석은 turn 0 발견을 인용했으나 decision_ledger D-185 본문·prime_directive·hook grep 3축 cross-check로 단일 자기참조 회피. R-1 잔존 risk: "Sage가 Nexus 결함 진단을 과대 평가" 가능 — Master 외부 판단으로 최종 게이트.

박제 권한 0 — D-NNN 박제·PD 등록·정책 변경 모두 Edi/Master 위임. 본 분석은 권고만.
