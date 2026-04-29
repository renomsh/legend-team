---
role: fin
topic: topic_132
session: session_144
turnId: 4
invocationMode: subagent
date: 2026-04-30
---

# Fin — Master-first 모드 옵션 2 (hook 박제) 유지 비용 평가

## 0. Arki 실행계획 오염 감사
본 발언은 Fin 비용 평가 단독. Arki 실행계획 미포함 → 감사 대상 없음. **N/A Clean.**

## 1. 초기 구현 비용

| 항목 | 추정 LOC | 근거 |
|---|---|---|
| `user-prompt-submit-master-first.js` | 180~250 | Master 발언 분류 + 자가검사 결과 inject. 비교: `pre-tool-use-task-sage-gate.js` 162 LOC (단일 차단), 본 hook은 분류 + inject 2단 → 1.3배. |
| `pre-tool-use-task-master-first.js` | 100~150 | Grade B+ Task 호출 정합 체크. 단일 게이트 → sage-gate 162와 비슷. |
| `master_first_config.json` | 30~50 | 트리거 조건·분류 키워드 사전. |
| 테스트(Riki 검증·dev 회귀) | 80~120 | 옵션 2 실효성 검증. 자가검사 누락 케이스 재현 fixture. |
| **합계** | **390~570 LOC** | dispatch hook 신규 1건 평균(s130~s140 박제 패턴). |

작업 turn 수: dev 직접 구현 2~3 turn + Riki 회귀 검증 1 turn + Arki 구조 검토 1 turn. PD-052(사칭 차단 hook) resolved 의존성 확인 필요.

## 2. 세션당 런타임 비용

발동 모델: **Master 발언당 1회** + **Grade B+ Task 호출당 1회**.

- 평균 세션: Master 발언 8~15회, Task 호출 5~10회 (recent 50 sessions 기준 추정).
- Grade B+ 세션 비율: ~70% (Grade C/D 제외).
- hook 본체 처리: Node.js 동기 분기 ~50~150ms/회. **무시 가능.**
- **숨은 비용 (자가검사 LLM 호출)**: 자가검사가 LLM call이면 echo trigger 분류에 ~500~1500 input tokens + ~200 output tokens × 8~15회/세션 = **세션당 4~25K tokens 추가**. opus 단가 기준 세션당 **$0.06~$0.40 추가**.
- 만약 자가검사가 키워드 매칭 only (LLM 미호출)이면 토큰 비용 0, **false negative 위험 급증** (역전 구간 발생).

## 3. 유지·디버깅 비용

- **False positive 빈도**: 정상 Master 발언을 echo trigger로 오판 시 매 발언마다 자가검사 강제 → Master 인지부하 폭증. 키워드 기반이면 5~15% 오판 추정. LLM 분류면 1~3% 추정.
- **Hook 충돌**: 기존 hook 7건과 PreToolUse(Task) 체인. sage-gate(D-128 exclusive)와 우선순위 충돌 가능 — `dispatch_config.json` 게이트 순서 명시 필요.
- **로그 정비**: `logs/master-first.log` rotate 미설정 시 세션 50회마다 ~5MB 누적 (token_log 패턴 기준).
- **D2 위반 잔존 위험**: hook description ≠ 실동작 (Prime Directive D2). 박제 후 회귀 spike 테스트 의무 (Riki 영역).

## 4. 회피 비용 (옵션 2 미박제 시)

s139 echo chamber 사례 = **Master 의도 1회 오판 → 토픽 1.5~2 세션 회귀 + revision_history 누적 + Master 재설명 인지부하**. Wingspread Statement(1998) precautionary principle 준용: 누적 회귀비용 = (오판 빈도 × 토픽당 회복 세션 × 세션당 비용). Grade B+ 세션 50회당 1건 재발 가정 시, **연간 8~12 세션 손실 = $50~$200 + Master 신뢰자본 훼손 (비재무, 누적성)**.

## 5. ROI 결론

- **즉시 효과**: Master 발언 직후 자가검사 강제 → echo chamber 재발 차단. 측정 가능 (false positive 율로 검증).
- **간접 효과**: Sage 시점 미스매치 보완, D-126 read-only 한계 보완 → 메타시스템 자체검증 성숙. **누적성 있음.**
- **재투자 자원**: 동일 hook 패턴이 후속 페르소나 drift 차단에 재사용 가능 (재무 관점 비재무 자산 — D-013 참조).
- **권고**: **옵션 2 박제 진행.** 초기 비용 ~500 LOC + 세션당 +$0.06~$0.40는 회피 비용(연 $50~$200 + 신뢰자본)보다 **낮음**. 단 **3개 조건부**:
  1. 자가검사는 키워드 1차 + LLM 2차 (Goodhart 방지: 키워드만이면 metric gaming 회귀, Strathern 1997)
  2. PD-052 resolved 이후 활성화 (warn-only 모드 → enforce 단계 분리)
  3. 30 세션 후 false positive 율 측정 → ≥10% 시 재설계

**Anchor**: Strathern (1997) "Improving ratings: audit in the British University system" — 측정이 목표화되면 측정 자체가 왜곡된다. 자가검사 키워드 단독 운영 금지 근거.

---

[ROLE:fin]
# self-scores
cst_acc: 0.70
roi_dl: 4
rdn_cal: Y
cst_alt: Y

FIN_WRITE_DONE: reports/2026-04-30_master-first-mode/fin_rev1.md
