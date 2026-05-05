---
title: "PD-065 signatureMetrics 잔재 위생 — Riki 리스크 감사"
role: riki
topicId: topic_168
date: 2026-05-05
turnId: 1
invocationMode: subagent
grade: B
---

# Riki — PD-065 리스크 감사

## 감사 기준 (3대 필터)

- **실재성**: 실제로 발생 가능한 결함인가
- **확신**: 파일 직접 확인을 통한 증거 기반 확신
- **기여도**: mitigation이 의사결정에 실질적 영향을 주는가

---

## 직접 파일 확인 결과

### Arki "수정 불가" 판단 검증

**app/growth.html (L390)**
```
if (flags?.flags?.signatureMetricsEnabled === false){
```
→ `signatureMetricsEnabled` 키를 직접 string 매칭으로 읽음. **런타임 하드 참조 확인. Arki 판단 정확.**

**memory/shared/feature_flags.json**
```
"signatureMetricsEnabled": true,
"signatureMetricsCardsVisible": true
```
→ app/growth.html과 test-p0b-smoke.ts가 둘 다 이 키를 직접 assert. **Arki 판단 정확.**

**scripts/compile-metrics-registry.ts (L92-94)**
```ts
if (Array.isArray(mem.signatureMetrics) && mem.signatureMetrics.length > 0 && !Array.isArray(mem.metrics)) {
  console.warn(`... dead 'signatureMetrics' key; rename to 'metrics' (D-092)`);
}
```
→ 마이그레이션 감지 안전망. 제거 시 역할 메모리가 구 키 그대로 남아있어도 경고 없이 통과. **Arki 판단 정확.**

**scripts/test-p0b-smoke.ts (L101)**
```ts
ok("feature_flags signatureMetricsEnabled=true", ff.flags.signatureMetricsEnabled === true);
```
→ 키 이름 변경 시 테스트 즉시 fail. **Arki 판단 정확.**

**결론: Arki "수정 불가" 4개 파일 판단은 모두 근거 있음. 뒤집을 항목 없음.**

---

## 리스크 보고

### 🟡 R-1. seed-signature-metrics.ts — "유보" 결정의 리스크

**Arki 분류**: "조건부 — 스크립트 용도 재검토 필요"(카테고리 A). 수정 여부를 이번 토픽 범위 밖으로 넘겼다.

**실제 위험**: 이 스크립트(L139)는 현재도 `mem.signatureMetrics = metrics` 로 구 키에 쓴다. 만약 누군가 "메트릭 초기화가 필요하다"고 판단해 재실행하면 D-092 이후 `metrics` 키로 이관된 역할 메모리를 `signatureMetrics` 키로 덮어쓴다. `compile-metrics-registry.ts`의 dead-key 경고(L92-94)가 발화하지만, **경고만 발행할 뿐 실행을 막지는 않는다.**

**파손 범위**: 8개 역할 메모리에서 `metrics` 키 누락 → `compile-metrics-registry.ts`가 `if (!Array.isArray(mem.metrics)) continue;` (L96)로 건너뜀 → metrics_registry.json에 역할 지표 0건 → growth 대시보드 빈 화면.

**완화 조건**:
- MUST: 파일 상단에 `// DEPRECATED — D-092 이후 재실행 금지. 재초기화 필요 시 memory/roles/{role}_memory.json의 metrics 키를 직접 편집.` 주석 1줄 추가
- fallback: 주석 추가가 "정책 문서 수정"으로 판단된다면, PD-065 종결 전 system_state에 `seed-signature-metrics.ts: DEPRECATED, re-execution forbidden` 항목 추가

**Arki 판단 보강**: Arki는 이 스크립트를 "별도 결정 유보"로 분류했으나, 유보 자체가 재실행 리스크를 남긴다. 이번 토픽에서 deprecated 주석 1줄만 추가하면 처리 완료 — 별도 결정 생성 불필요.

---

### 🟢 R-2. 역사 기록 41개 보존 — 검색 혼란 가능성 심사

**Arki 분류**: 보존 필수.

**실재성 검토**: "나중에 검색 혼란"은 가능성이 있으나, 이 시스템에서 역사 기록은 `session_contributions/` 하위에 분리되어 있고 `compile-metrics-registry.ts`·`compute-dashboard.ts` 등 런타임 파이프라인이 이 경로를 스캔하지 않는다. 실재하는 파손 경로 없음.

**판정**: 3대 필터 — 실재성 **미통과**. 이 항목은 리스크로 분류하지 않음. Arki 보존 판단 지지.

---

### 🟢 R-3. memory/specs/page-checklist/growth.md 수정 — NICE 우선순위 타당성 심사

**Arki 분류**: NICE(최하위). 설명 텍스트 보강 1줄.

**실재성 검토**: 이 파일은 운영 spec이지만, 수정 내용이 코멘트 추가이고 `signatureMetricsEnabled` 키 이름 자체는 유지한다. 런타임 영향 없음. NICE 분류 적절.

**판정**: 실재성 미통과. 리스크 없음. Arki 판단 지지.

---

## Arki 판단 뒤집는 항목

없음. 4개 "수정 불가" 분류 모두 직접 파일 확인으로 근거 확인.

단, **seed-signature-metrics.ts를 "유보"로 남기는 것**은 이번 토픽에서 deprecated 주석 1줄로 해결 가능한 항목을 별도 결정으로 밀어내는 불필요한 마찰 발생. 이번 수정 대상에 포함 권장.

---

## 수정 대상 최종 의견

| # | 파일 | Arki 우선순위 | Riki 의견 |
|---|---|---|---|
| 1 | `memory/roles/personas/role-vera.md` | MUST_NOW | 동의 |
| 2 | `memory/growth/phase_dod.json` | MUST_NOW | 동의 |
| 3 | `memory/growth/composite_inputs.json` | SHOULD | 동의 |
| 4 | `memory/growth/rollback_playbook.md` | SHOULD | 동의 — rollback_playbook.md L44의 키 이름 자체는 유지(런타임 키) |
| 5 | `memory/specs/page-checklist/growth.md` | NICE | 동의 |
| **6** | **`scripts/seed-signature-metrics.ts`** | **조건부 유보** | **SHOULD — deprecated 주석 1줄 추가. 별도 결정 불필요** |

---

[ROLE:riki]
# self-scores
crt_rcl: 0.00
cr_val: Y
prd_rej: Y
fp_rt: 0.00
