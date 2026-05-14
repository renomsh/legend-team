---
role: riki
turnId: 2
sessionId: session_248
invocationMode: subagent
---

# riki rev1 — PD-085 적대적 감사

## 결론 (먼저)

Arki Option A 권고는 **방향은 옳지만 4건의 critical 누락**이 있습니다. 치환은 안전하게 가능하나 **Arki가 검증 없이 가정한 전제 3건이 실측에서 위반**되며, 그대로 진행 시 PD-064가 잡으려던 false-positive 표면이 **반대로 확장**됩니다. 적출 4건(🔴 3 / 🟡 1) 박제. [T4/A1/O5]

권고: Option A를 진행하되 R-1·R-2·R-3 mitigation을 **치환 PR과 동시 적용**. 별도 PR로 분리 불가 (회귀 즉시 발생).

---

## 🔴 R-1. legacy 마커 분포는 Arki가 단언한 "1건"이 아니라 최소 **3건**이며 회귀 방향이 위험

[T4/A1/O5 — 실측 grep 결과]

Arki rev1은 "legacy 마커 실측 1건(`2026-05-05_self-score-table-format-unify`)"이라 단언했으나, `reports/*/_zero_condense.json` 29건 키 스키마 grep 실측에서 다음 4 케이스가 헬퍼 치환 시 **종전 인라인 대비 행위가 바뀝니다**:

| 디렉토리 | 키 상태 | 인라인 행위 | 헬퍼 행위 (Option A 후) | 회귀 방향 |
|---|---|---|---|---|
| `2026-05-05_self-score-table-format-unify` | `session`+`topic`+`executedAt` (canonical 키 전무) + `files`(4건) | sessionId 매칭 실패 → **patch 진행 / hasReport=false → fallback** | legacy key → valid=true → **patch skip / hasReport=true** | **행위 역전** (Arki가 의도한 false-positive 제거 — 맞으나 R-3 참조) |
| `2026-05-04_nexus-enhancement` | `sessionId`+`executedAt` (canonical) + `files` **부재** | `Array.isArray(files)`=false → patch 진행 / hasReport=false → fallback (condensed.md hit) | valid=true (files=[]) → L442 `files.includes(fileName)`=false → patch 진행 OK / L510 `length>0`=false → fallback (동치) | **동치 유지** |
| `2026-05-04_open-close-lightweight` | `sessionId`+`completedAt`, `files` **부재** | `Array.isArray(files)`=false → patch 진행 / hasReport=false → fallback (phaseB 산출물 점검 후 미스) | valid=true (files=[]) → L442 patch 진행 OK / L510 fallback | **동치 유지** |
| `2026-05-05_persona-layer-refine-p2` | `sessionId`+`completedAt`, `files` **부재** | 동상 | 동상 | **동치 유지** |

**실재성**: 디스크 실측 4건 (위 표). **확신**: 100% (node require로 키 직접 확인). **기여도**: Arki가 "1건"으로 표기한 회귀 표면이 실측 4건이며 그 중 **1건만 행위 역전**. Master에게 정확한 분포를 알리지 않으면 회귀 디버깅 시 잘못된 가정으로 시간 낭비.

**Mitigation:**
- Dev 구현 PR에 위 표를 그대로 검증 fixture로 박제. G2 게이트에 self-score-table-format-unify (legacy 키 회귀) + nexus-enhancement (files 부재) 2 케이스 명시 추가.
- 치환 후 `node -e "const{readAndValidateMarker}=require('./scripts/lib/zero-condense-marker.js');for(const d of [...]) console.log(d, readAndValidateMarker(...))"` 형태 실측 1회 박제.

**Fallback**: legacy 1건의 행위 역전이 의도와 다르면 (R-3 참조) 헬퍼의 legacy 키 호환 path를 **opt-in 플래그**로 전환하고 caller가 명시적으로 켠다.

---

## 🔴 R-2. completedAt 필수화로 **인라인 통과하던 마커가 헬퍼에서 invalid**가 되는 회귀 — Arki 단언 "안전 방향" 검증 실패

[T4/A1/O3 — 코드 라인 대조]

Arki rev1 §2: "`completedAt` 필수화로 invalid 분기 확장 (안전 방향)."

실측 코드:
- 인라인 L446: `marker.sessionId === _sessionId && Array.isArray(marker.files) && marker.files.includes(fileName)` — **completedAt 미검사**. completedAt 부재여도 patch skip 통과.
- 헬퍼 L121~123: `if (!completedAt) return { valid: false, reason: '...' }` — completedAt 부재 시 즉시 invalid.

분포 실측: `completedAt` 부재 + `executedAt` 부재 + `sessionId` 존재 + `files` 존재 케이스는 위 grep 결과 **0건**. 따라서 **현재 디스크 상**으로는 행위 변화 없음. **그러나** 향후 caller가 마커 박제 시 completedAt을 빠뜨리면(부분 마커 박제 패턴 — `decision-status-standardize` 디렉토리는 `condense_skipped` 플래그가 존재) 인라인은 통과하던 게이트를 헬퍼는 차단.

이게 "안전 방향"인지 "회귀"인지는 **policy 결정**이지 Arki가 자가 판정할 사항이 아닙니다. PD-085 resolveCondition은 "두 인라인 read 치환 + test 4건 PASS"로 한정되며, **검증 엄격성 변경을 무단 포함하면 PD scope creep**입니다.

**실재성**: 코드 라인 대조로 확정. **확신**: 100%. **기여도**: scope 위반은 Riki 책임 영역(D-185 권한외 등급 = V3 위반과 정합).

**Mitigation:**
- Master에게 명시 확인: "completedAt 필수화 = OK(엄격화 의도) / NG(scope creep, 헬퍼만 read 호환 추가)" 분기.
- OK 분기: PD-085 resolveCondition에 "completedAt 필수화 적용"을 명시 박제. 별도 D-NNN 후보.
- NG 분기: Option A 변형 — 헬퍼 호출 결과를 caller가 받되 `valid:false && reason.startsWith('missing completedAt')`은 caller가 인라인 fallback 처리 (행위 동치 보장).

**Fallback**: Master 무응답 시 NG 보수 분기 채택 (PD scope 준수 우선).

---

## 🔴 R-3. self-score-table-format-unify 1건 회귀 — "false-positive 제거"는 Arki 추정, **실측 검증 없음**

[T3/A1/O3 → 추정성 단언 적출]

Arki rev1 §3 부작용: "legacy 키 마커 호환 자동 획득 → `self-score-table-format-unify/_zero_condense.json` 실측 1건의 잠재 false-positive 표면 제거"

실측 마커:
```json
{"session":"session_191","topic":"topic_164","executedAt":"2026-05-05T00:00:00Z","files":["arki_condensed.md","jobs_condensed.md","dev_condensed.md","riki_condensed.md"],"executor":"zero",...}
```

이 마커는 **session_191** 컨텍스트에서 박제됨. **현재(session_248)** 헬퍼 read 시 `sess.sessionId=session_248`이므로 sessionId mismatch → valid:false. 즉, **legacy 키 호환은 동일 세션 내 read에서만 의미** 있고, 과거 세션 마커는 어차피 mismatch로 차단됨.

따라서 Arki의 "false-positive 표면 제거" 주장은 **현재 분포에서 거짓**. 실제 회귀 시나리오는: session_191이 다시 활성화되거나, legacy 키만 박제하는 코드 경로가 어딘가에 잔존하는 경우. 후자는 `writeMarker`가 SOT라면 발생 불가하지만 검증 없음.

**실재성**: 코드 라인 + 데이터 대조. **확신**: 95% (writeMarker 외 박제 경로 0건임을 grep으로 추가 검증 필요). **기여도**: Arki "안전 방향" 주장의 근거 토대가 부정확. Master가 "PD-085가 어떤 회귀를 제거하는가" 질문 시 Arki rev1 인용은 위양성.

**Mitigation:**
- Dev 구현 전 `grep -rn "_zero_condense" --include="*.js" --include="*.ts"` 실측해서 `writeMarker` 외 박제 경로 0건 확인 박제.
- 0건 확인되면 Arki "false-positive 제거" 문장을 "legacy 키 박제 경로 차단(SOT writeMarker 단일화 유지)"로 정정해서 D-NNN 박제.

**Fallback**: 박제 경로 ≥1 발견 시 PD-085 scope에 "legacy 박제 경로 제거" 추가 또는 별도 PD 분기.

---

## 🟡 R-4. test-pd80-fix.js는 **본 치환 영역 코드를 직접 import하지 않음** — G1 게이트 결정성 약함

[T4/A1/O5 — 테스트 파일 read 결과]

`scripts/test-pd80-fix.js`는 post-tool-use-task.js의 L442·L510을 **시뮬레이션**할 뿐 require하지 않습니다 (L13~29, L36~46 모두 fs.readFileSync 인라인 재구현). 따라서 본 치환을 적용해도 **test 코드는 변화 없이 4건 PASS**합니다.

이게 의미하는 바: G1 "test 4건 PASS" 게이트는 치환 안전성을 **증명하지 않음**. 인라인을 헬퍼로 바꿔도 테스트는 그대로 통과하기 때문.

**실재성**: 테스트 파일 직접 read. **확신**: 100%. **기여도**: PD-085 resolveCondition이 G1을 핵심 게이트로 명시하나 실제 검증력 부족. Riki가 적출하지 않으면 Master는 "test PASS = 안전"로 오인.

**Mitigation:**
- test-pd80-fix.js를 본 치환 PR과 함께 수정: 인라인 fs.readFileSync 제거 + `readAndValidateMarker` import + 같은 4 케이스 재실행. 행위 동치 확인.
- 추가 케이스 2건 (R-1 표 fixture): legacy 키 + canonical 키 + files 부재 (현재 0건이지만 가상 fixture).

**Fallback**: 수정 누락 시 G1 게이트를 "검증력 약함 — 수동 코드 리뷰 필수" 메모 박제.

---

## 추가 점검 — 적출 없음

- **L510 외곽 `_sessionId` 가드**: L428 `if (topicId && _sessionId && turnPushMode !== 'nexus')` 외부 if. L498~ hasReport 검증은 별도 if 블록이며 `_sessionId` 가드 없음. 하지만 sess.sessionId 부재 시 헬퍼 `if (sess.sessionId && ...)` 조건이 falsy → sessionId mismatch 검사 skip → valid=true 가능. **현재 인라인 L511 `marker.sessionId === _sessionId`는 `_sessionId=undefined`면 marker.sessionId가 truthy 한 한 false**. **헬퍼 치환 시 동치성 깨짐 가능**. 단, L499 `if (reportPath && role && role !== 'unknown')` 가드만 있고 L510은 그 안에서 호출되어 실제로 `_sessionId=undefined` 분기 진입은 L428 외부 블록과 분리됨. → 헬퍼 호출 시 `sess` 객체에 `sessionId` 없으면 mismatch 검사 자체 skip되므로 **잠재 회귀**이나 실측 진입 경로 미확인. R-2 mitigation 대화에서 같이 정합 확인 권고. [T3/A2/O5 — 코드 라인 추적, 진입 경로는 추정]
- **try/catch 제거 가능 단언**: 헬퍼는 fs/parse 가드를 내부 처리하지만 `path.basename`·`fs.readdirSync` 등 caller 측 잔존 호출은 여전히 throw 가능. caller 외곽 try/catch는 보존 권고. [T4/A1/O3]
- **롤백 가능성**: `post-tool-use-task.js` 단일 파일 + `git revert <sha>` 가능. 헬퍼 변경 없으면 단순. [T4/A1/O3]

---

## 적출 요약

| ID | 등급 | 분류 | mitigation 동시 적용 필수? |
|---|---|---|---|
| R-1 | 🔴 | 데이터 분포 단언 오류 | Y |
| R-2 | 🔴 | scope creep (completedAt 필수화) | Y (Master 확인) |
| R-3 | 🔴 | 부작용 단언 검증 부족 | Y |
| R-4 | 🟡 | 게이트 검증력 약함 | Y |

**총 4건 / 🔴 3건 / 🟡 1건**. Arki Option A는 위 4건 mitigation 동시 적용 시 진행 가능.

---

## Nexus 발화 감사 (D-183 cross-review)

이번 세션 Nexus 본체 발화 등급 위반 cross-review는 본 turn 범위 밖 — 별도 호출 시 수행. 본 보고서 자체 자가 등급은 단언별로 본문 인라인 부착 완료.

---

[ROLE:riki]
# self-scores
crt_rcl: 0.75
cr_val: Y
prd_rej: N
fp_rt: 0.0
