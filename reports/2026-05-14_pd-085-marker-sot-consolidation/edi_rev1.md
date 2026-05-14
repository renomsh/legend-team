---
role: edi
turnId: 7
sessionId: session_248
invocationMode: subagent
accessed_assets:
  - file: memory/shared/topic_index.json
  - file: memory/shared/decision_ledger.json
  - file: memory/shared/evidence_index.json
  - file: memory/shared/glossary.json
  - file: memory/shared/pending_deferrals.json
  - file: memory/shared/system_state.json
  - file: reports/2026-05-14_pd-085-marker-sot-consolidation/arki_rev1.md
  - file: reports/2026-05-14_pd-085-marker-sot-consolidation/riki_rev1.md
  - file: reports/2026-05-14_pd-085-marker-sot-consolidation/dev_rev1.md
  - file: reports/2026-05-14_pd-085-marker-sot-consolidation/zero_rev1.md
  - file: reports/2026-05-14_pd-085-marker-sot-consolidation/condensed.md
---

# edi rev1 — PD-085 종합·박제

EDI_WRITE_DONE: reports/2026-05-14_pd-085-marker-sot-consolidation/edi_rev1.md

## 1. 결론

PD-085 resolveCondition (두 인라인 read → `readAndValidateMarker` 호출 치환 + `files.includes` 잔존 보존 + test 4건 PASS) **전건 충족**. 변경 파일 2건, 게이트 5종 PASS, 회귀 0건, 안전 강화 1건(legacy 박제 경로 SOT 단일화). [근거: dev_rev1 §3 G1~G5, zero_rev1 §3 cross-check 전건 재현]

## 2. 결정 요약

| 항목 | Master 결정 / 산출 |
|---|---|
| 옵션 채택 | Option A (헬퍼 호출 + caller 잔존 검증 유지) |
| Riki R-1·R-2·R-3·R-4 mitigation | 본 PR과 **동시 적용** (Master 지시) |
| R-2 (completedAt 필수화) | OK 분기 채택 — G3-revised 디스크 29건 회귀 0건 실측 확인 |
| versionBump | +0.001 (Grade B 코드 patch, 자동 감지 capacity → Edi 하향 override) |

## 3. 변경 사항

| 파일 | 변경 | net 라인 |
|---|---|---|
| `.claude/hooks/post-tool-use-task.js` | top-level `readAndValidateMarker` require 추가 + L442 인라인 read → 헬퍼 호출 + L510 인라인 read → 헬퍼 호출. caller 잔존 검증(`canonical.files.includes(fileName)` / `length>0 + every(...)`) 유지 | -22 +20 (net -2) |
| `scripts/test-pd80-fix.js` | 인라인 `fs.readFileSync` 재구현 제거 + 헬퍼 import 후 동일 4 케이스 재구성 (Riki R-4 mitigation — G1 게이트 검증력 보강) | -10 +15 |

생성 파일 없음. SOT 헬퍼(`scripts/lib/zero-condense-marker.{ts,js}`) 변경 없음.

## 4. 게이트 결과

| Gate | 정의 | 결과 | 증거 |
|---|---|---|---|
| G1 | `test-pd80-fix.js` 4 케이스 PASS | **PASS 4/4** | dev_rev1 §3 G1 본 실행 출력 + zero_rev1 §3-2 재실행 확인 |
| G2 | legacy 키 fixture 4종 (legacy `session`+`executedAt` / canonical mixed / no sid / mismatch) | **PASS** | dev_rev1 §3 G2 표 (헬퍼 직접 호출 valid/invalid 정합) |
| G3-revised | `completedAt`+`executedAt` 모두 부재 마커 회귀 | **0건 / PASS** | 디스크 29건 전수 grep — `completedAt` 보유 27건, `executedAt`만 보유(legacy) 2건, 둘다 부재 0건 |
| G4 | require 경로 정합 | **PASS** | `pre-tool-use-task.js` L226과 동일 `'../../scripts/lib/zero-condense-marker.js'` |
| G5 | 디스크 walk-through 동치 검증 (29 디렉토리 전수) | **PASS** | TOTAL=29 / helper invalid=0 / behavior changes=**1** (`2026-05-05_self-score-table-format-unify`, sid mismatch로 caller 자연 차단 — 안전 강화 방향) |

## 5. Riki 적출 4건 + Zero 적출 2건 처리 결과

| 적출 | 등급 | mitigation 적용 | 본 박제 반영 |
|---|---|---|---|
| **R-1** (legacy 마커 분포: 실측 4건 회귀 표면, 1건만 행위 역전) | 🔴 | dev_rev1 §3 G5 표로 전수 walk-through 박제 (behavior changes=1) | §4 G5에 명시 — 행위 역전 1건은 sid mismatch로 caller 자연 차단되며 SOT writeMarker 단일화로 신규 박제 경로는 0건 |
| **R-2** (completedAt 필수화 scope creep 우려) | 🔴 | Master "동시 적용" 결정 = OK 분기 채택. G3-revised 디스크 0건 회귀 실측 | §2 결정 표 + 본 §5 행에 명시. **NG fallback 미채택** (Master 명시 결정 정합). [Zero Refine-1 반영] |
| **R-3** (false-positive 제거 단언 검증 부족) | 🔴 | `grep "writeFileSync.*_zero_condense"` → No matches. `writeMarker` SOT 단일 박제 경로 확정 | dev_rev1 §5 정정: "legacy 박제 경로 차단(SOT writeMarker 단일화 유지) + 동일 sid 재활성 시나리오 한정 false-positive 제거" |
| **R-4** (G1 게이트 검증력 약함 — test가 hook 코드 미직접 import) | 🟡 | `test-pd80-fix.js` 헬퍼 import 재작성 (L7 require + L18·L38·L57 `readAndValidateMarker` 호출). 인라인 fs.readFileSync 재구현 제거 | G1 PASS는 이제 hook 치환 분기와 동일 코드 경로 직접 검증 |
| **Zero Refine-1** (Dev §4 R-2 묘사 잔존 위험 명시 보강) | 🟡 | §2 결정 표에 "NG fallback 미채택" 명문화 + G3-revised 실측 0건 회귀 박제 | 본 §2·§5 명시 |
| **Zero Refine-2 / 잔존 위험 묵음** (R-1 fallback opt-in 플래그 미언급) | 🟡 | 본 보고서 §6 후속 트리거에 명시 박제 | §6 후속 트리거 1번 |

## 6. 후속 트리거 (잔존)

본 PR로 resolveCondition은 충족됐으나 다음 2개 조건은 향후 모니터링 대상으로 박제합니다.

1. **R-1 fallback — legacy 키 호환 path opt-in 플래그 전환 트리거** [근거: riki_rev1 R-1 Fallback]
   - 조건: legacy 키(`session`/`executedAt`)만 박제된 마커가 **동일 sessionId 컨텍스트에서 caller에 도달**하는 사례가 1건이라도 감지될 경우 (현재 분포에서는 sid mismatch로 자연 차단 중, 회귀 표면 1건은 session_191 재활성 시나리오 한정).
   - 행동: `readAndValidateMarker` 헬퍼의 legacy 키 호환 path를 opt-in 플래그(`{allowLegacyKeys: boolean}`)로 전환 + caller 명시 opt-in. 별도 PD로 분기.

2. **PostToolUse 외 hook(session-end-finalize.js 등)의 `_zero_condense` 인라인 read 경로 잔존 점검** [근거: dev_rev1 §6 자가 검증 한계 + zero_rev1 Step 2 표 마지막 행]
   - 본 PD scope creep 회피로 미수행. 잔존 인라인 read 발견 시 별도 PD로 분기 (PD-085와 분리).

## 7. versionBump 확정

| 항목 | 값 |
|---|---|
| 자동 감지 (versionBumpSuggested) | capacity(+0.01) — `.claude/hooks/post-tool-use-task.js` 변경 감지 |
| Edi 판단 | **하향 override** — Grade B 토픽이며 본 변경은 hook 인라인 read를 SOT 헬퍼 호출로 치환한 코드 patch (PD-085 resolveCondition 충족). 신규 페르소나/정책/decision_ledger 신규 0건. CLAUDE.md D-130 매핑상 "Grade B + bugfix-grade patch"에 해당 |
| 확정값 | **+0.001** |
| from → to | v2.084 → v2.085 |
| overrideReason | 자동 감지는 hook 파일 변경을 capacity(+0.01)로 잡았으나 실질 변경은 인라인 read의 SOT 헬퍼 치환(코드 patch)이며 decision_ledger·페르소나·정책 신규 0건. Grade B 코드 patch 단가 +0.001로 하향. |

박제 구조 (current_session.json):
```json
{
  "value": 0.001,
  "from": "v2.084",
  "to": "v2.085",
  "reason": "PD-085 resolved — post-tool-use-task.js 인라인 마커 read 2곳을 readAndValidateMarker SOT 헬퍼 호출로 치환 + test-pd80-fix.js 헬퍼 import 재작성 + 게이트 5종 PASS",
  "confirmedBy": "edi",
  "confirmedAt": "2026-05-14T15:00:00.000Z",
  "overrideReason": "capacity(+0.01) → bugfix(+0.001) 하향 — Grade B 코드 patch, 신규 정책·페르소나·decision_ledger 0건"
}
```

## 8. anchor governance (D-125)

본 세션 CLAUDE.md 변경 0건, skill 신규 0건. anchor 변경 없음. 외부 anchor 인용 turn에서 출처 식별자 누락 후보 0건.

## 9. 미해결 이슈·Gap

- session_index 전파 시점에 본 보고서(turn 7) frontmatter `turnId` 패치 결과 모니터링 필요 (PD-080 정합 — `_zero_condense.json` 마커 인식 분기 이미 박제됨).
- session.gaps 2건 (riki turn1 missing-report, edi turn5 missing-report — turn5는 본 edi_rev1 박제로 해소).

## 10. 인계 메모

- **본 토픽**: PD-085 resolved 완료. topic_208 status → completed.
- **후속 P-N**:
  - P-1 (모니터링): R-1 fallback opt-in 플래그 전환 트리거 발동 시 별도 PD 분기.
  - P-2 (별도 PD 후보): PostToolUse 외 hook의 `_zero_condense` 인라인 read 경로 점검.

## 11. 세션 종결 readiness 평가

| 기준 (CLAUDE.md auto-close) | 충족 |
|---|---|
| 구현 검증 완료 (빌드 통과·게이트 PASS) | YES — 게이트 5종 PASS |
| 경보 없음 | YES — openMasterAlerts 0건 |
| Master 미결 질문 없음 | YES — R-2 Master 결정 확정, 잔존 옵션은 후속 트리거로 박제 |

→ auto-close 가능.

---

[ROLE:edi]
# self-scores
compile_complete: 1
redact_n: 0
version_bump: 0.001
art_cmp: 1
gp_acc: 1
scc: Y
cs_cnt: 4
gap_fc: 4
