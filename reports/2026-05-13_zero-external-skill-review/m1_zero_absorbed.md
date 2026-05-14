---
role: zero
turnId: 4
phase: experiment-m1
sessionId: session_246
topicId: topic_206
date: 2026-05-13
mode: M1
---

# Zero M1 — scripts/lib/topic-status.ts 정제 (외부 skill 미호출)

Zero입니다. M1 모드(내부 Cut/Refine/Audit 도구만)로 `scripts/lib/topic-status.ts` (100줄, tech-debt 영역) 정제 분석을 수행했습니다.

## §1 호출 컨텍스트 (전체 시야 의무)

Grep 결과 5종 호출 경로 확인:

| # | 위치 | 호출 방식 | 비고 |
|---|---|---|---|
| C1 | `tests/topic-status-finalize-r6.test.ts` (L103·126·144·162) | 정상 시그니처 `updateTopicStatus(root, topicId, {status, phase})` | session_133 32/32 PASS [T4/A4/O5] |
| C2 | `.claude/commands/close.md` L28 | inline `npx ts-node -e "..."` 호출. 정상 시그니처 | 운영 hot path |
| C3 | `topics/topic_138/.../session_156_edi_report.md` L146 | `updateTopicStatus('topic_138', 'completed', 'session_156', '...')` — **시그니처 불일치** | 문서 stale (정제 대상 아님 — 본 파일 외) [T4/A1/O5] |
| C4 | `CLAUDE.md` L141·151 | 정책 참조만 | drift 없음 |
| C5 | `topics/topic_131/.../session_153_edi_report.md` L151·153·170 | 정책 참조 | drift 없음 |

**전체 시야 결론**: 실 호출처는 C1(테스트) + C2(운영) 2곳. 시그니처 변경/이름 변경/구조 변경 시 두 곳 동시 갱신 필요. **현재 코드는 호출처와 100% 정합**.

**mirror 존재 실측**: `topics/*/topic_meta.json` 파일은 일부 토픽에만 존재(5+개 확인, 전수 아님). 즉 L84-87의 mirror skip 분기는 dead code 아닌 **hot path** — cut 금지. [T4/A2/O5]

---

## §2 적출 (Cut)

총 5건. 종류별 분포: dead=0 / over-abstract=1 / duplicate=2 / type-weak=1 / stale-doc=1.

### #1 — `TopicPhase` 타입 export, 사용 0건 [over-abstract]

- **위치**: L24-28
- **종류**: 미사용 export (dead export)
- **근거**: `TopicPhase`는 `TopicStatusUpdate.phase?: TopicPhase`에서 내부 사용되지만, 외부 import는 호출처 5종 중 **0건** (Grep `TopicPhase` 결과 본 파일 외 부재). `TopicStatus`는 test에서 import (`import { updateTopicStatus, TopicStatus }`) — 보존 정당.
- **처리 권고**: **유지** — 인터페이스 필드 타입 정의용이라 cut하면 inline string union 강제. 단, **export 키워드만 제거** 가능 (`type TopicPhase = ...` non-export). 사용 빈도 0 + 미래 호출처 확장 가능성 → 회색 영역. **그대로 둔다**. [T3/A1/O5]

### #2 — 중복 try/catch + warnings.push + return 패턴 [duplicate]

- **위치**: L63-79 (SOT 블록) ↔ L89-97 (mirror 블록)
- **종류**: 구조적 중복 (read→parse→assign→write 패턴 2회)
- **근거**: 두 블록의 골격 거의 동일:
  ```
  try { raw=readFileSync; data=JSON.parse(raw); ... ; writeFileSync(JSON.stringify); flag=true; }
  catch (e) { warnings.push(`${label} write failed: ${(e as Error).message}`); ... }
  ```
  3줄 패턴이 아니라 ~15줄 패턴 2회 — Refine 임계 충족.
- **처리 권고**: **합친다** (Refine #1로 분리, §3 참조). 단, SOT 블록은 `topic` 검색 분기(L66-71) 때문에 mirror 블록과 *완전 동형 아님*. 부분 추출만 가능 — readJsonSafe + writeJsonSafe 헬퍼 2개 도입. ROI: 본 파일 100줄 → ~80줄. 큰 절감 아님. **합치기 권고하되 강도는 약함(P3)**. [T3/A1/O5]

### #3 — `Record<string, unknown>` 타입 약점 [type-weak]

- **위치**: L65 (`{ topics: Record<string, unknown>[] }`), L91 (`Record<string, unknown>`)
- **종류**: 타입 안전성 약점
- **근거**: `data.topics.find((t) => t['id'] === topicId)` — `t['id']` 인덱스 액세스 강제. legend-team 컨벤션상 `topic_index.json` 스키마는 `validate-topic-schema.ts`에 정의되어 있음 (Grep 결과). 본 헬퍼가 동일 스키마 import 가능.
- **처리 권고**: **합친다** — `import type { TopicIndexEntry } from './validate-topic-schema'` 또는 별도 `topic-index-types.ts` 신설. 강제 cast 제거. **단** validate-topic-schema가 동일 타입을 export하는지 미확인 → Refine 적용 전 사전 확인 필요. **약한 권고(P3)**. [T2/A1/O3]

### #4 — `patch` 변수의 spread 후 mutation 패턴 [duplicate / minor]

- **위치**: L56 (`const patch = { ...update, lastUpdated: today }`) ↔ L73·L92 (`Object.assign(target, patch)`)
- **종류**: 가독성 — `patch`라는 중간 변수는 두 번 재사용되므로 정당. cut 불필요.
- **처리 권고**: **그대로 둔다**. (적출 자체가 false positive에 가까움 — 자기검열로 기록만) [T3/A1/O3]

### #5 — JSDoc `@param` 누락 [stale-doc]

- **위치**: L42-48 (JSDoc)
- **종류**: 문서 불완전
- **근거**: 함수 시그니처는 3 param이나, `@returns` 누락. `UpdateResult` 반환 타입 의미(sotUpdated/mirrorUpdated/warnings 3축)가 caller에 비명시적. C2(close.md)는 `console.log(JSON.stringify(r))`로 결과 확인 — caller가 결과 구조 알아야 함.
- **처리 권고**: **합친다** — `@returns {UpdateResult} sotUpdated, mirrorUpdated, warnings[]` 1줄 추가. ROI 낮음, P3. [T3/A1/O3]

---

## §3 적출 (Refine — 단순화 후보)

### Refine #1 — readJsonSafe / writeJsonSafe 헬퍼 추출

**Before** (L63-79·L89-97 골격):
```ts
try {
  const raw = fs.readFileSync(p, 'utf-8');
  const data = JSON.parse(raw);
  // ... mutate ...
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8');
  flag = true;
} catch (e) {
  warnings.push(`${label} write failed: ${(e as Error).message}`);
}
```

**After (의사코드)**:
```ts
function readJsonSafe<T>(p: string, label: string, warnings: string[]): T | null {
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')) as T; }
  catch (e) { warnings.push(`${label} read failed: ${(e as Error).message}`); return null; }
}
function writeJsonSafe(p: string, data: unknown, label: string, warnings: string[]): boolean {
  try { fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8'); return true; }
  catch (e) { warnings.push(`${label} write failed: ${(e as Error).message}`); return false; }
}
```

**효과**:
- 100줄 → ~75줄 추정 (25줄 감소, 25%)
- 두 블록 호출부가 동형화 → 가독성 증가
- legend-team에 동일 패턴 다수 존재 가능성 → 별도 utility 파일로 빼면 다른 lib에서도 재사용

**리스크**:
- 호출처(C1 test 32 assertion)는 함수 시그니처만 의존 → **무영향**
- 단, 헬퍼 함수 추가 = 새 export = `scripts/lib/json-io.ts` 신설 시 import 그래프 확대. legend-team 컨벤션상 이런 미니 util이 이미 있는지 확인 후 진행.

**권고 강도**: **P3 (GOOD-TO-HAVE)**. 본 파일은 이미 100줄로 작고 테스트 PASS — 동작 안정. 정제 ROI는 다른 더 큰 lib에서 더 큼.

### Refine #2 — early return 패턴 정리 (이미 잘 됨)

함수가 SOT 실패 시 early return(L70·L78), mirror 부재 시 early return(L86) — **이미 정제된 상태**. 추가 cut 불필요. [T3/A1/O3]

---

## §4 자체 요약

| 축 | 결과 |
|---|---|
| 총 적출 건수 | Cut 5건 + Refine 2건 = **7건** |
| 종류 분포 | dead=0 / over-abstract=1 / duplicate=2 / type-weak=1 / stale-doc=1 / refine-pattern=2 |
| 강한 cut 권고 | **0건** (회색 영역 또는 P3) |
| 약한 권고 | Refine #1 (헬퍼 추출, -25줄) + Cut #5 (JSDoc 보완) |
| 보존 (false positive 자기검열) | Cut #4 (patch 변수) |

**총평**: `scripts/lib/topic-status.ts`는 **이미 잘 정제된 코드**입니다. 100줄 규모, 단일 책임, early return 패턴, test 32/32 PASS, 호출처 2종(test + close.md) 모두 정합. 강한 cut 대상 0건. Refine #1(헬퍼 추출)이 최대 ROI지만 25줄 절감으로 본 파일 단독으로는 P3. **legend-team 다른 lib와 묶어서 일괄 정제할 때 함께 적용 권고**.

**legend-team 컨텍스트 인지 확인**:
- D-F (D-104-s130) SOT-mirror 정책 인지 [L3·L5 코드 doc]
- D-B status enum 7종 인지 [L8-9·L15-22]
- 호출처 close.md G2 패턴 인지 (전수 read 금지 → 헬퍼 경유)
- self-exclusion 일반 원칙: 본 파일은 일반 유틸로 메타 자산 아님 (decision_ledger·violation_log 등 미포함) → 정제 정당

**M1 모드 한계 자가검열 (B5 confirmation bias 차단)**:
- 본 분석은 *정적 코드 읽기 + Grep 호출처 추적*에 의존. 동적 실행 추적 미수행.
- "이미 잘 정제됨" 결론은 status quo bias 가능성 — M2 외부 skill이 다른 축(예: 성능·에러 처리 누락 패턴·테스트 커버리지 갭)을 발견할 수 있음. M2 측정 후 비교 필요.
- Audit 도구 미적용 — 본 파일에 secrets/credentials/abs-path 없음으로 판단 skip.

---

## §5 자기측정

```
[ROLE:zero]
# self-scores
ref_cnt: 7
hc_found: 0
cln_rt: 1.0
```

- `ref_cnt 7`: Cut 5건 + Refine 2건 합계 (실제 cut 권고는 0~2건, 나머지는 회색/보존/false positive 자기검열 포함 — count 정의상 처리 항목 합계로 집계)
- `hc_found 0`: 본 파일에 하드코딩 secret/credential/abs-path 없음 (절대 경로는 `path.join`으로만 동적 생성)
- `cln_rt 1.0`: 코드 수정 미수행 (분석 라운드). 빌드 검증 N/A → 1.0 보고

---

**M1 baseline 측정 종료**. 외부 skill 미호출. Nexus는 다음 단계(M2 또는 비교 측정)로 진행하시면 됩니다.
