# PD-064 Condensed — session_194 / topic_167 / Grade B

PD-064 = Edi subagent gate + close hook 검증 false positive 3건. 본 문서는 Arki(구조 진단) → Riki(축소 권고) → Ace(Riki 채택) → Dev(P1~P4 구현) 흐름을 결정 단위로 압축.

---

## 결함 #1 — zero-condense gate FP

- **원인**: `pre-tool-use-task.js` `evaluateZeroCondenseGate`가 `marker.sessionId` 키만 read. session_191 마커는 legacy 키(`session`/`topic`/`executedAt`)로 박제 → 비교가 항상 `undefined === sess.sessionId` → false → silent BLOCK. `try {} catch {}` 빈 핸들러가 파싱 에러도 삼킴.
- **채택 수정 (Riki 축소안)**: 마이그레이션 스크립트 폐기. SOT 헬퍼 `scripts/lib/zero-condense-marker.{ts,js}` 신규 — `writeMarker` / `readAndValidateMarker`. legacy 키는 read 시 호환만(`marker.sessionId || marker.session` 등), 신규 박제는 canonical 강제. silent catch 제거 + `parseError` BLOCK 메시지 노출. role-zero policy에 헬퍼 사용 의무 명문화.
- **검증 결과**: 5/5 단위 테스트 PASS. session_191(legacy)·session_193(canonical) 모두 valid=true. session mismatch FP 시뮬레이션 정상 BLOCK.

## 결함 #2 — inline-role-header-mismatch FP

- **원인**: `session-end-finalize.js` `validateInlineRoleHeaders` L476이 `turns[turnId]`로 array index를 turnIdx와 동일시. 우연히 일치하는 현재 세션은 OK지만 D-048 phase 분리/병합 시 skip 가능 → fragile. 추가로 KNOWN 리스트에 `jobs/zero/sage/vera` 누락 → 정상 H1 silent skip.
- **채택 수정**: `scripts/lib/turn-types.{ts,js}`에 `findTurnById(turns, turnIdx)` export + "globally unique within session, not array position" 주석 명문화. `validateInlineRoleHeaders`는 헬퍼 사용으로 교체, KNOWN을 `memory/shared/role_registry.json` SOT read로 대체(designer alias 보존). turn 미존재 시 `turn-not-found` gap(turns 비어있을 땐 skip). Map 캐시 도입 안 함(ROI 0, Riki R1).
- **검증 결과**: findTurnById 7/7 PASS. SOT read 결과 11 + designer = 12 KNOWN. H1 grep 신규 mismatch 후보 0건.

## 결함 #3 — versionBump 충돌 우선순위 미정의

- **원인**: hook이 `versionBumpSuggested` 박제 후 Edi가 inline 다른 value로 override 시 충돌 판정 분기 0건. session_191은 #1 cascade로 Edi turn 자체 미발생 → `confirmedBy:null` 종결.
- **채택 수정 (Riki 축소안)**: 자동 reconcile 룰(Arki a/b/c) 도입 보류 — D-130 "Edi 단일 책임" 잠식 위험. `checkVersionBumpConfirmation` Edi confirmed 분기에 차이 감지만 추가 → suggested ≠ confirmed + `overrideReason` 부재 시 `version-bump-suggested-vs-confirmed-diff` info gap. role-edi.md §6.3에 versionBumpSuggested 먼저 read + value 차이 시 overrideReason 필수 명문화. dispatch_config rules.edi에 `version_bump_override_requires_reason: true` 추가.
- **검증 결과**: dispatch_config JSON 파싱 OK. finalize.js syntax PASS.

## 결함 #4 (G2 신규) — Edi dispatch 부재 misclassification

- **원인 (Riki G2)**: Edi 호출조차 없는 세션이 `version-bump-edi-unconfirmed`로 박제됨 → 진짜 root("Edi dispatch 자체 실패")가 가려짐.
- **채택 수정 (Dev P4)**: `agentsCompleted` + `turns[]`로 Edi dispatch 여부 판정 → 부재 시 `version-bump-edi-not-dispatched` (ref: PD-064-P4) 별도 type. early-return 가드는 신/구 type 모두 체크.
- **검증 결과**: finalize.js syntax PASS. 분기 진입 path grep 명확.

---

## 종합 검증 (Dev)

| 항목 | 결과 |
|---|---|
| `node --check` 양 hook | PASS |
| `tsc --noEmit` 신규 .ts | 0 errors |
| zero-condense-marker 단위 테스트 | 5/5 PASS |
| findTurnById 단위 테스트 | 7/7 PASS |
| 실제 마커 게이트 통과 (legacy + canonical) | FP 제거 확인 |
| H1 grep 신규 mismatch 후보 | 0건 |
| role_registry SOT read | 12 KNOWN (designer alias 포함) |

## 잔여 위험 (Dev)

- R1 (낮음): findTurnById O(n) — 현 세션당 turn 100건 미만 ROI 영향 없음.
- R2 (낮음): legacy turn(turnIdx 누락) 섞이면 turn-not-found 양산 가능. 현 가드는 `turns.length > 0` 한정 — 추가 가드는 사고 발생 시 도입.
- R3 (info): suggested-vs-confirmed-diff는 severity info — Edi 자율 준수 의존. N세션 모니터링 후 상향 검토.

## versionBump 후보

- 변경: hooks 2종 + scripts/lib 신규 2종 + role policy 2종 + dispatch_config — decision_ledger 미변경.
- 카테고리: capacity bump 후보 (+0.01). 본 세션 단일 기능 패치 묶음 1회.
- 확정 책임: Edi (D-130/D-143).

## 인계

- PD-064 status open → resolved 변경은 Edi 영역.
- 본 세션 변경물 anchor 박제(decision_ledger / topic_index / system_state) 미수행 — Edi 단일 책임.

---

## Zero 정제 노트

3 영역 시야로 본 세션 변경물 review. 발견 1건만 기록(저ROI 권장 — 자동 트리거 아님).

- **(simplify, 정보)**: `zero-condense-marker.ts` ↔ `.js` 두 파일 의미 동일 유지 의무가 헤더 주석에만 있음. drift 방지 강제 메커니즘 부재 — 그러나 ts-node 미도입 hook 환경 제약상 sidecar 패턴 자체는 합리. 별도 정제 불요.
- **(tech-debt, 패스)**: 본 세션 추가된 `findTurnById`·`writeMarker`·`readAndValidateMarker`·gap 분기 모두 구체 결함 대응 — dead code·조기 추상화 없음.
- **(security-review, 패스)**: 신규 코드 hardcoded secrets/credentials/절대 경로 0건. dispatch_config 신 필드는 boolean flag, 민감정보 없음.

정제 대상 없음 — 3 영역 패스.
