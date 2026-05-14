---
role: arki
turnId: 0
phase: framing
sessionId: session_246
topicId: topic_206
date: 2026-05-13
invocationMode: subagent
---

# Arki — PD-075 Zero 외부 skill 흡수 재검토

Arki입니다. 구조 분석 첫 주자로 발언드립니다.

## 1. 사실관계 검증

| 항목 | 확인 결과 | 출처 |
|---|---|---|
| Zero spec L28 "외부 skill 호출 폐기" 명분 | "외부 skill 파일 부재 확인" 명시 [T4/A4/O5] | `memory/roles/personas/role-zero.md` L28 |
| Zero spec L49 "레거시" 표기 | "engineering:tech-debt, simplify skill — 본 페르소나 흡수로 외부 호출 폐기" [T4/A4/O5] | 동 L49 |
| 외부 skill 실제 존재 | 시스템 reminder 노출 — `engineering:tech-debt`, `simplify`, `engineering:code-review` 등 호출 가능 상태 [T4/A2/O3] | available-skills 리스트 |
| dispatch_config rules.zero | `scope_areas: [tech-debt, security-review, simplify]`, `session_isolation: shared`, `auto_hook: false`, `internal_tools: [Cut, Refine, Audit]`, `supersedes: [D-110]` [T4/A4/O5] | `memory/shared/dispatch_config.json` |
| D-119 본문 | "Cut/Refine/Audit 3 스킬은 페르소나 내부 도구로 격하" [T4/A4/O5] | decision_ledger D-119 |
| D-146 | self-exclusion 일반 원칙 SOT를 Zero persona로 이전, anchor governance는 Edi 분담 [T4/A4/O5] | decision_ledger D-146 |
| anchor governance | Edi 분담 — Zero 제외 [T4/A4/O5] | role-zero.md L26·L58, D-125 |

**핵심 사실관계 결론** [T3/A2/O3]: Zero spec L28의 폐기 명분("외부 skill 파일 부재")은 **현재 시점 사실과 불일치**. 외부 skill 3종(`engineering:tech-debt`, `simplify`, `engineering:code-review`)이 실재. 단, 흡수 결정 자체(D-119 본문)는 "파일 부재" 외에 **legend-team 컨텍스트 내재화**라는 별도 합리적 근거를 내포함 — 명분 부정합이 결정 부정합으로 직결되지는 않음.

## 2. 3 옵션 구조 비교

| 축 | (a) 흡수 유지 + 참조 정정 | (b) 참조 정정만 (기능 유지) | (c) 위임 전환 (wrapper) |
|---|---|---|---|
| **호출 비용** | 0 round-trip (즉시 실행) | 0 round-trip | +1 round-trip per Cut/Refine/Audit |
| **SOT 일관성** | 단일 SOT (persona spec) | 단일 SOT | 이중 SOT — 외부 skill spec + Zero wrapper. drift 위험 |
| **D2 (도구 설명 거짓 전제)** | 자체 통제, false claim 표면적 0 | 동일 | 외부 skill description false 가능성 노출. 행위 검증 의무 추가 |
| **D-125·D-146·D-133 정합** | 완전 정합 (현 spec 유지) | 완전 정합 | anchor governance Edi 분담은 유지 가능. self-exclusion 일반 원칙은 wrapper에 재선언 필요 |
| **운영 부담** | 낮음 — 스펙 L28·L49 한 줄 정정 | 낮음 (a)와 동일 운영 | 중간 — 외부 skill 버전 변경 추적, 호환성 매트릭스 유지 |
| **정제 품질 (legend-team 컨텍스트)** | 내재화 우수 (메타-자산 self-exclusion·박제 Edi 분담·NCL legacy 등 인지) | 동일 | 일반화된 SOP 적용 — legend-team 메타-자산 회피 의무 외부 skill에 미반영. 별도 가드 필요 |
| **결정 비용 (변경 크기)** | 매우 작음 (문구 2줄) | 매우 작음 | 큼 — wrapper 코드, dispatch 분기, 테스트 |

## 3. 권고

**옵션 (b) 참조 정정** — 명분 문구만 사실에 맞게 교체, 흡수 기능 유지. [T3/A1/O3]

### 사유 (3가지 이내)

1. **결정의 본질 = 흡수 정당성은 "파일 부재"가 아니라 "legend-team 컨텍스트 내재화"** [T3/A2/O3]. D-119 본문도 외부 skill 부재가 아니라 "페르소나 내부 도구로 격하"라는 구조적 판단을 명시. spec L28의 "(외부 skill 파일 부재 확인)" 괄호 주석이 사후 추가된 보강 명분으로 보임 — 사실 변경 시 명분만 정정하면 충분.
2. **D2(도구 설명 거짓 전제) 원칙과 정합** [T4/A4/O5]. 외부 skill의 description은 false claim 가능 전제. 흡수 유지는 자체 통제 표면을 보존하고 행위 검증 의무를 최소화.
3. **변경 비용 최소, 회귀 위험 0** [T3/A1/O3]. 옵션 (c) 위임 전환은 dispatch 분기·테스트·메타-자산 self-exclusion 재선언 등 부수 변경을 수반. 현 시점 호출 비용 절감을 정당화할 정량 근거 없음.

### 정정 대상 문구 (옵션 b 실행 시)

- `memory/roles/personas/role-zero.md` L28: `"Cut/Refine/Audit 3 도구를 외부 skill로 호출 — 내부 흡수 (외부 skill 파일 부재 확인)"` → `"Cut/Refine/Audit 3 도구를 외부 skill로 호출 — 내부 흡수 (legend-team 컨텍스트 내재화 우선, 외부 skill 의존 배제)"`
- L49: `"(레거시: engineering:tech-debt, simplify skill — 본 페르소나 흡수로 외부 호출 폐기.)"` → `"(외부 skill engineering:tech-debt·simplify는 실재하나 의도적으로 호출 배제. legend-team 메타-자산 self-exclusion·anchor governance Edi 분담 등 컨텍스트 내재화를 위해 흡수 유지.)"`

## 4. 반례 1건 (D-185 적용)

**가능 실패 시나리오**: 외부 skill `engineering:tech-debt` / `simplify`가 향후 legend-team이 흡수본에 미반영한 **best practice 패턴**(예: 신규 보안 취약점 시그니처, 새 정적 분석 휴리스틱)을 지속 업데이트할 경우, 흡수본은 stale 상태로 drift. [T2/A1/O1]

- **놓친 축**: "외부 skill의 진화 속도 vs 내부 흡수본의 보강 빈도" 비교 미수행. 현재 데이터로는 추정 불가.
- **mitigation**: 분기별 1회 외부 skill description·changelog를 Zero가 Audit 대상으로 read하여 신규 패턴 inbound 수동 검토. 흡수본은 유지하되 패턴만 cherry-pick.
- **fallback**: drift가 실측되면(예: Zero가 놓친 보안 hardcoding을 외부 audit이 잡는 사고 1건) 옵션 (c) 위임 전환 재검토.

## 5. 경계 조건

설계가 깨지는 조건:
- 외부 skill이 legend-team `dispatch_config`·`decision_ledger`·`session_isolation` 등 내부 SOT를 직접 read·write 시도 시 → 흡수 우위 결정적
- 반대로 Zero 흡수본이 6개월간 정제 품질 실측 0건(false negative 누적) 시 → 위임 전환 정당화

## 6. 자기감사 (1차)

- structuration: SOT 분리 명확 (persona vs policy vs dispatch_config). No issue at this dimension.
- hardcoding: 권고 옵션 (b)는 문구만 정정 — 추가 하드코딩 없음. No issue.
- efficiency: 옵션 (c) 위임은 round-trip 비용만 추가, 품질 향상 미증명. 권고 (b) 효율 우위. No issue.
- extensibility: 미래 외부 skill 채택 가능성은 반례 mitigation에서 cherry-pick 경로로 확보. No issue.

종료 기준 충족 (발견 0 + NICE/DEFER 범위) — 추가 라운드 생략 가능. Master 또는 Ace 종합검토 판단에 위임.

## Self-Score

```
[ROLE:arki]
# self-scores
aud_rcl: 0.50
str_fd: 1
spc_lck: N
sa_rnd: 1
```

ARKI_WRITE_DONE: reports/2026-05-13_zero-external-skill-review/arki_rev1.md
