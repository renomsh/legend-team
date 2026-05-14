---
role: zero-m2
turnId: 5
phase: experiment-m2
sessionId: session_246
topicId: topic_206
date: 2026-05-13
mode: M2
---

# Zero M2 (Delegated) — engineering:tech-debt audit on scripts/lib/topic-status.ts

Zero입니다. 본 케이스에 대해 외부 skill `engineering:tech-debt`를 재량 호출하여 일반화된 SOP 기반 tech-debt audit을 수행합니다. legend-team 특수 컨텍스트(D-F·D-104-s130 등)는 부차적 참고로만 다루고, 1차 기준은 소프트웨어 엔지니어링 standard입니다.

## §1 외부 skill 호출 사유 (Zero 재량 판단)

본 케이스를 M2(외부 위임)로 처리한 판단 근거:

1. **표준 패턴 풀 우위**: `topic-status.ts`는 "SOT + mirror 동시 갱신" 표준 패턴 구현체로, 일반화된 tech-debt 분류 체계(test debt·error handling·type safety)가 legend-team 흡수본의 협소한 시그니처(stale TODO·dead code·중복 정의)보다 적출 표면이 넓습니다.
2. **코드 도구 코드**: 메타-자산이 아닌 *도구* 코드이므로 self-exclusion(D-146) 위반 위험 0. 외부 위임 안전 영역.
3. **컨텍스트 의존도 낮음**: 본 파일의 부채는 대부분 일반화된 패턴(any 회피·테스트 커버리지·atomic write)에 속하며 legend-team 고유 컨벤션 지식이 필수가 아님.
4. **B5(자기평가 편향) 회피**: 흡수본 Cut 도구의 자기 정의 영역을 자기가 평가할 때 발생하는 편향을 외부 표준으로 우회.

D2 적용: 외부 skill description은 *추정 SOP*. 본 audit의 분류 체계는 standard 7-category로 가치 중립 적용 [T1/A1/O1].

## §2 7 카테고리 체크

### Cat 1. Code Smells

| # | 발견 | 위치 | Severity |
|---|---|---|---|
| C1-1 | **Duplicate try/catch + readFileSync + JSON.parse + Object.assign + writeFileSync 블록** — SOT 갱신(L63–79)과 mirror 갱신(L89–97)이 거의 동일 구조. 추출 가능. | L63–79 vs L89–97 | Medium |
| C1-2 | **Magic literal `'id'`로 record indexing** — `t['id'] === topicId`. 타입 안전 약화 + 키 typo 시 silent miss. | L66 | Low |
| C1-3 | **Mixed return shape from happy path / not-found / catch** — `{ sotUpdated, mirrorUpdated, warnings }`를 3 곳에서 별도 return. early-return 누락 시 mirror 갱신이 SOT 미갱신 상태에서도 시도될 수 있는 *형식상* 위험은 차단되어 있으나 가독성·유지보수성 저하. | L70, L78, L86, L99 | Low |

### Cat 2. Outdated Patterns

| # | 발견 | 위치 | Severity |
|---|---|---|---|
| C2-1 | **Synchronous fs API 전용** — `readFileSync`/`writeFileSync`. Node 20+ 환경에서 `fs.promises` 또는 `node:fs/promises` 채택이 표준. CLI 1회성 헬퍼면 허용 가능하나 hook chain에서 호출 시 이벤트 루프 블로킹. | L64, L74, L90, L93 | Low–Medium |
| C2-2 | **`new Date().toISOString().slice(0, 10)`로 ISO date 추출** — 표준이지만 timezone 의존. UTC 의도면 명시, local 의도면 부적합. 의도 불명. | L55 | Low |

### Cat 3. Test Debt

| # | 발견 | 위치 | Severity |
|---|---|---|---|
| C3-1 | **테스트 파일 부재 가능성** — `scripts/lib/topic-status.test.ts` 또는 `__tests__/topic-status.spec.ts`의 존재가 본 파일에서 확인되지 않음. SOT 갱신 헬퍼는 핵심 인프라(D-F)로서 회귀 테스트 우선순위 최상. | (외부 파일) | **High** |
| C3-2 | **Edge case 미검증**: ① topic_index.json 깨진 JSON ② topics[] 배열 부재 ③ topic_meta.json은 있으나 비어있는 객체 ④ 동시 write race condition ⑤ readonly 파일. 코드에 케이스 분기 없음. | 전체 | Medium |
| C3-3 | **반환값 `UpdateResult`가 호출자에서 검증되는지 미보장** — `warnings`만 채우고 throw 없으므로 호출자 누락 시 silent fail. 계약 테스트 필요. | L36–40 | Medium |

### Cat 4. Documentation Debt

| # | 발견 | 위치 | Severity |
|---|---|---|---|
| C4-1 | **JSDoc 일부만 — `updateTopicStatus`에만 있음, exported types(`TopicStatus`·`TopicPhase`·`TopicStatusUpdate`·`UpdateResult`)에는 없음**. 외부 소비자 onboarding 비용 발생. | L15–40 | Low |
| C4-2 | **반환값 의미가 doc 미기재** — `sotUpdated=true && mirrorUpdated=false` 상태의 의미(SOT만 갱신, mirror 부재 or 실패), 호출자 권장 대응 미기재. | L36–40, L49–53 | Low–Medium |
| C4-3 | **`hold` 필드 의미·null vs undefined 차이 미기재** — `hold?: string | null`로 두 값 모두 허용되나 의미론 차이 doc 없음. | L33 | Low |

### Cat 5. Dependency Debt

| # | 발견 | 위치 | Severity |
|---|---|---|---|
| C5-1 | **`fs`/`path` core module만 사용** — 외부 라이브러리 의존성 없음. CVE risk 없음. **해당 없음** (depth 측면 clean). | — | — |
| C5-2 | (참고) atomic write 미적용 — `fs.writeFileSync` 직접 호출은 중간 crash 시 파일 truncate 위험. `write-file-atomic` 같은 표준 패턴 미채택. | L74, L93 | Medium |

### Cat 6. Architectural Debt

| # | 발견 | 위치 | Severity |
|---|---|---|---|
| C6-1 | **No transactional rollback** — SOT 갱신 성공 후 mirror 갱신 실패 시 SOT를 되돌리지 않음. "부분 갱신 방지"라는 헤더 주석(L6)과 실제 동작 일부 mismatch — mirror 부재는 warning + 종료, mirror **write 실패**는 sot=true·mirror=false 상태로 종료. 의도일 수 있으나 명시 doc 부재. | L84–97 | Medium |
| C6-2 | **Side-effecting function** — 파일 IO를 직접 수행. dependency injection 부재로 테스트 시 fs mock 강제 필요. `fsLike` 파라미터 또는 별도 IO layer 분리 가능. | 전체 | Low–Medium |
| C6-3 | **Concurrency 보호 없음** — 두 호출자가 동시 진입 시 lost update 가능. lockfile 또는 atomic compare-and-swap 미적용. | L63–79, L89–97 | Medium |

### Cat 7. Type Safety Debt

| # | 발견 | 위치 | Severity |
|---|---|---|---|
| C7-1 | **`Record<string, unknown>[]` 약한 타입** — `data.topics`을 `Record<string, unknown>[]`로 캐스팅. `Topic` 인터페이스 정의·재사용 부재로 indexing 오타·필드 누락이 컴파일 시점 catch 안 됨. | L65, L66 | **High** |
| C7-2 | **`(e as Error)` 강제 캐스트 2회** — `unknown`을 `Error`로 단정. Error가 아닌 throw value(string·plain object) 대응 부재. `e instanceof Error ? e.message : String(e)` 패턴 표준. | L77, L96 | Low |
| C7-3 | **`patch: Record<string, unknown>`** — `Object.assign(topic, patch)`로 미정의 키가 SOT에 머지될 가능성. `TopicStatusUpdate` 외 키 inject 차단 부재. | L56, L73, L92 | Medium |
| C7-4 | **`topic['id']` 인덱싱** — 위 C1-2와 연결. `Topic` 인터페이스 정의 시 `topic.id` 직접 접근 가능. | L66 | Low |

## §3 우선순위 표 (Severity × Effort × ROI × Priority)

| # | 발견 | Sev | Effort | ROI | Priority Score* |
|---|---|---|---|---|---|
| C3-1 | 회귀 테스트 부재 | **High** | Medium (1d) | high | **★★★★★** |
| C7-1 | `Topic` 인터페이스 부재 (약한 타입) | **High** | Small (1–4h) | high | **★★★★★** |
| C5-2 | Atomic write 미적용 | Medium | Small (1–4h) | high | **★★★★** |
| C6-1 | Transactional rollback 부재 + doc gap | Medium | Small (1–4h) | mid | **★★★** |
| C6-3 | Concurrency 보호 없음 | Medium | Medium (1d) | mid | **★★★** |
| C1-1 | SOT/mirror 갱신 블록 중복 → extract helper | Medium | Small (1–4h) | mid | **★★★** |
| C7-3 | `patch` 약 타입 키 inject 위험 | Medium | Trivial (<1h) | mid | **★★★** |
| C3-2 | Edge case 분기 부재 | Medium | Medium (1d) | mid | **★★** |
| C3-3 | UpdateResult 계약 검증 미강제 | Medium | Small (1–4h) | mid | **★★** |
| C2-1 | Sync fs API | Low–Medium | Medium (1d) | low | ★★ |
| C4-2 | 반환 상태 의미 doc 누락 | Low–Medium | Trivial (<1h) | mid | ★★ |
| C6-2 | DI 부재 (테스트 가능성) | Low–Medium | Medium (1d) | low | ★★ |
| C7-2 | `(e as Error)` 강제 캐스트 | Low | Trivial (<1h) | low | ★ |
| C1-2/C7-4 | `t['id']` 인덱싱 → 인터페이스화 | Low | Trivial (<1h) | low | ★ |
| C1-3 | early-return 가독성 | Low | Trivial (<1h) | low | ★ |
| C2-2 | ISO date timezone 의도 명시 | Low | Trivial (<1h) | low | ★ |
| C4-1 | exported types JSDoc | Low | Trivial (<1h) | low | ★ |
| C4-3 | `hold` null vs undefined doc | Low | Trivial (<1h) | low | ★ |

*Priority Score 산정: Severity 가중치(High=3·Medium=2·Low=1) × ROI 가중치(high=3·mid=2·low=1) / Effort 가중치(Trivial=1·Small=2·Medium=3·Large=4). 별 5개 = 핵심, 1개 = 권장.

## §4 권고 액션 (Top 5)

1. **`Topic` 인터페이스 정의 + `data.topics` 강타입화** (C7-1, C7-3, C7-4, C1-2 동시 해소) — `interface Topic { id: string; status: TopicStatus; phase?: TopicPhase; hold?: string | null; lastUpdated?: string; ... }` 추가 후 `JSON.parse` 결과를 `{ topics: Topic[] }`로 캐스팅. Effort Small, ROI high.
2. **회귀 테스트 슈트 추가** (C3-1, C3-2, C3-3) — happy path·topic not found·corrupt JSON·mirror 부재·write failure 5 시나리오 + `UpdateResult` 검증 계약 테스트. SOT 헬퍼는 회귀 영향 범위 최상위. Effort Medium, ROI high.
3. **Atomic write 도입** (C5-2) — `fs.writeFileSync(tmpPath, data); fs.renameSync(tmpPath, finalPath)` 패턴 또는 `write-file-atomic`. 두 갱신 모두 적용. Effort Small, ROI high.
4. **SOT/mirror 갱신 헬퍼 추출 + transactional 의도 명시** (C1-1, C6-1) — `applyJsonPatch(filePath, predicateFn, patch): { updated, warnings }` 같은 내부 함수로 중복 제거. mirror 실패 시 SOT 롤백 정책을 명시 doc + 코드 일치.
5. **`(e as Error)` → narrowing 패턴** (C7-2) — `e instanceof Error ? e.message : String(e)`. Trivial fix지만 비-Error throw 시 silent corruption 차단.

---

## 마무리

총 **18 발견** (Code Smells 3 / Outdated 2 / Test 3 / Doc 3 / Dependency 1+1 참고 / Architectural 3 / Type Safety 4). 그중 **High 2건**(C3-1·C7-1), **Medium 9건**, 나머지 **Low**.

본 audit은 일반화된 SOP 적용 결과이며, legend-team 특수 컨텍스트(D-F·D-104-s130 SOT 정책)를 1차 기준으로 삼지 않았습니다. 그러므로 발견 항목 중 일부(예: C6-1 mirror 실패 시 SOT 롤백 미적용)는 legend-team 의도("부분 갱신 방지 = SOT 성공 후 mirror는 best-effort warning")와 충돌 가능하며, 채택 전 M1 흡수본 또는 Arki/Master 컨텍스트 확인이 필요합니다.

ZERO-M2_WRITE_DONE: reports/2026-05-13_zero-external-skill-review/m2_zero_delegated.md
