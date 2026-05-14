---
role: dev
session: session_247
topic: topic_207
topicSlug: arki-emergency-hooks
date: 2026-05-14
rev: 1
turnId: 4
invocationMode: subagent
authorship: agent
---

# Dev — Arki 응급 hook 설계 검토 + 검증

## 1. 코드 검토 결과 (Riki FP-1~7 대응)

### 1-1. 코드 품질 (양호)

- 두 hook 모두 stdin JSON 파싱 실패 시 `process.exit(0)` (silent pass) — 안전 측 [T4/A2/O5]
- try/catch 외곽 적용, log append 실패 무시 — fail-safe 패턴 적합 [T4/A2/O5]
- exit code 규약 준수 (차단=2, 통과=0) [T4/A2/O5]
- ENV `NEXUS_EMERGENCY_OVERRIDE=1` 우회 경로 두 hook 공통 — D-187 `ALLOW_MAIN_COMMIT` 패턴 정합 [T4/A2/O5]

### 1-2. Riki FP 7건 대응 평가

| FP | Arki 우려 | 실측 결과 | Dev 판정 |
|---|---|---|---|
| **FP-1** transcript_path SDK 미보장 | hook 미작동 위험 | 본 세션 sage 보고에서 SDK 보장 확인됨 [T3]. 실측 T3 (transcript 미가용)에서 silent pass 작동 [T4/A2/O5] | 대응 적합 |
| **FP-2** 정규식 자연어 비결정성 | false-positive | **실증됨** — T2(`분석해줘`)·T9(`왜 진행해야 하는지 모르겠어`) 모두 `/해줘/` `/진행해/` 부분 매칭으로 false-pass [T4/A2/O5] | **위험 잔존** — 패턴이 너무 관대. 차단보다 통과 쪽 false 더 많음 |
| **FP-3** 응급 우회 자체 차단 | flow 막힘 | ENV 우회 + 광범위한 승인 패턴(20+종)으로 over-approve 방향 — 차단 false-positive 적음 | 완화됨 (단 FP-2 부작용) |
| **FP-4** 차단 무한 루프 | 폭증 | flag 클리어 경로 존재 (Stop hook 재호출 시 unlinkSync). ENV 우회 안전판 | 대응 적합 |
| **FP-5** Hot path I/O | 비용 | 매처가 `Edit\|Write\|Bash\|NotebookEdit`로 좁힘. read-only Bash sub-classification 처리 — Read/Grep/Glob 미적용 | 대응 적합 |
| **FP-6** emergency-disabled 재발 | settings 비동기화 | **현재 sage-gate 동일 패턴 잔존** (`.emergency-disabled` 접미사, settings.json 미동기화) | **별도 처리 필요** |
| **FP-7** 발화 시점 차단 구조적 한계 | LLM 자율 잔존 | Stop hook = 응답 후 검증 → flag → 다음 mutation 차단 (2단 구조). 발화 자체는 검증 못 함 | 구조적 한계 인정, 차선책 적합 |

### 1-3. 추가 발견 (코드 검토)

**D-1. APPROVAL_PATTERNS 과대 매칭 [T4/A2/O5]:** `/해줘/`·`/적용/`·`/박제/`·`/진행/` 단순 substring 매칭. 부정문·질문문 면제 없음. 일상 한국어에서 빈출 단어 → 대부분 mutation 통과 가능성 높음.

**D-2. APPROVAL_PATTERNS SOT 분리 안 됨 [T4/A2/O5]:** Arki Round 1 hardcoding 발견 그대로. `dispatch_config.json` 또는 별도 SOT 분리 필요.

**D-3. Stop hook의 `assertions.length > 0 && !hasLabel` 단일 OR 조건 [T4/A2/O5]:** 라벨 1건만 부착해도 단언 N건 모두 통과. Goodhart 위험. 단언별 라벨 의무화는 정규식으로 어려움 — 의도된 trade-off 추정.

**D-4. flag 박제 경로 cwd 의존 [T4/A2/O5]:** `path.join(process.cwd(), '.nexus_violation_flag.json')` — Stop hook 작동 cwd와 PreToolUse hook 작동 cwd가 다른 경우(서브프로세스·다른 워크트리 등) 연계 실패 가능. 본 세션 워크트리 내 동일 cwd 운영 시 정상.

**D-5. transcript_path 경로 형식 호환성 [T4/A2/O5]:** Windows에서 POSIX `/tmp/...` 경로는 회수 안 됨 (실측). SDK가 절대경로 형식을 어떻게 전달하는지에 따라 silent pass 빈도 달라질 수 있음 — 운영 모니터링 필요.

---

## 2. 본 세션 직접 검증 결과

cwd: `C:\Projects\legend-team\.claude\worktrees\nifty-bartik-629613`

| 케이스 | 입력 | 기대 | 실제 | 판정 |
|---|---|---|---|---|
| T1 | Edit + 승인("진행해") + transcript | exit 0 (pass) | exit 0, log: pass | PASS |
| T2 | Write + "분석해줘"·"보여줘" + transcript | exit 2 (block) | exit 0, **`/해줘/` 매칭 → pass** | **FP-2 실증** |
| T3 | Edit + transcript_path 누락 | exit 0 (silent pass) | exit 0, log: transcript-unavailable | PASS |
| T4 | T2 + ENV NEXUS_EMERGENCY_OVERRIDE=1 | exit 0 | exit 0, log: emergency-override | PASS |
| T5 | Write tmp_test.txt | exit 0 (exempt) | exit 0, log: exempt-path | PASS |
| T6 | Bash `git status` | exit 0 (exempt) | exit 0, log: exempt-readonly-bash | PASS |
| T7 | Bash `rm -rf foo` + 승인 없음 | exit 2 (block) | exit 2, **차단 작동** | PASS |
| T8 | Write + "잘못됐어"·"틀렸어" + Win 경로 | exit 2 | exit 2, **차단 작동** | PASS |
| T9 | Write + "왜 진행해야 하는지 모르겠어" | exit 2 (의도) | exit 0, **`/진행해/` 매칭 → pass** | **FP-2 실증** |
| T10b | Stop hook + 단언 4건 + 라벨 없음 (긴 텍스트) | flag 박제 + warn | flag 박제됨, stderr warn 출력 | PASS |
| T11 | Stop hook + 라벨 [T4/A2/O5] 부착 | flag 클리어 (텍스트 짧으면 exempt) | exempt: too-short (74자) | PASS (조건부) |
| T12 | flag 활성 상태 + Edit | exit 2 (블록) | exit 2, **flag 기반 차단 작동** | PASS |

**핵심 검증 결과 [T4/A2/O5]:**
- Hook 2 단순 매처(승인 키워드 부재) 차단: **작동**
- Stop hook 단언+라벨 검증: **작동**
- Stop→PreToolUse flag 연계 차단: **작동**
- 응급 우회: **작동**
- **FP-2 (false-positive 통과 방향): 실증됨** — `/해줘/`·`/진행해/` 부분 매칭이 일상 한국어에서 자주 발생

---

## 3. 진행 항목

**없음.** 두 hook 파일은 디스크에 존재하나 settings.json 미등록 = 작동 안 함.

settings.json 등록은 직전 Master 명시 "등록 진행 취소" 발언 후 원복된 상태. 본 세션 Master 발언 "아키가 설계한 내용에 대해 Dev가 검토하고 진행해"가 settings.json 재등록을 포함하는지 명확하지 않음 → **Master 명시 재승인 없이는 등록 금지** (자율 결정 차단 정합).

기타 mutation 작업도 모두 보류:
- sage-gate `.emergency-disabled` 복원 — Master 결정 #4 대기
- decision_ledger schema=v2 마이그 원복 — Master 미승인 잔존, 정정 권한 외
- PD-094 본문 검토 — 직접 수정 권한 외 (보고만)

---

## 4. 보류 항목 (Master 추가 결정 대기)

### 4-1. Arki Master 결정 7건 중 미해결

- **#1** "넣어두었다" hook 위치 — 본 워크트리 발견 0건 [T4/A2/O5]
- **#2** PreToolUse stdin transcript_path 보장 — 본 세션 sage 분석에서 보장 확인됨 [T3/A2/O3, sage 인용]
- **#3** AssistantMessage/Stop 매처 SDK 지원 — Stop 매처 가용 확인 [T3/A2/O3, sage 인용]
- **#4** sage-gate `.emergency-disabled` 처리 — **잔존**
- **#5** ENV var 명명 규칙 — 현재 `NEXUS_EMERGENCY_OVERRIDE` 사용. D-187 `ALLOW_MAIN_COMMIT`과 다른 명명 — 통합 정책 결정 필요
- **#6** Phase 1 즉시 도입 vs spec 동결 후 Dev 위임 — Master 명시 "Dev가 검토하고 진행해"로 도입 방향. settings 등록 명시 승인 별도 필요
- **#7** 정책 박제 메타 패턴(Sage M-1) 자기재현 risk — Hook 풀세트 도입 자체가 D-185 옵션 B 기각 사유 정합 (운영 검증 후 판단)

### 4-2. 신규 결정 필요 항목

- **N1.** APPROVAL_PATTERNS 패턴 좁히기 (`/해줘/`·`/진행해/` 부분 매칭 → 더 보수적 패턴 또는 정확 일치)
- **N2.** Hook 2 settings.json 매처 등록 — 등록 시 매처(`Edit|Write|Bash|NotebookEdit`)와 sage-gate 매처(`Task`)가 다른 PreToolUse 항목으로 분리 (현 settings 구조상 가능)
- **N3.** Stop hook settings.json 매처 등록 — 신규 `Stop` 이벤트 추가 필요
- **N4.** 두 hook의 APPROVAL/ASSERTION/EXEMPT 패턴을 SOT(`memory/shared/dispatch_config.json` 같은 곳)로 분리할지 vs 코드 인라인 유지

---

## 5. 위반 잔존 처리 권고

### 5-1. decision_ledger schema=v2 마이그 (195건)

**상태 [T4/A2/O5]:** `decision_ledger.json` schema field = `decision_ledger.v2`, decisions 195건. `lastMigratedAt`·`lastMigratedBy` 필드 존재 → Nexus 자율 마이그 박제 흔적.

**Master 미승인 단언 [T4/A2/O5]:** 본 세션 Master 발언 어디에도 schema 마이그 승인 명시 없음. PD-094 본문은 "별도 Grade A 토픽 분리 권장"이고 마이그 옵션 (a/b/c) **결정 대기 상태**임에도 (b) 자동 분류 진행된 흔적.

**Dev 권고 [T3/A2/O3]:** **원복 1순위.** Master 미승인 schema 변경은 PD-094 자체에 명시된 "별도 Grade A 토픽" 절차 위반. git 이력에서 마이그 직전 상태로 되돌리는 것이 D4 정합. 단 Dev 직접 mutation 금지 — Master 명시 승인 후 진행.

### 5-2. 임의 스크립트 2건

- `scripts/migrate-enforcement-mechanism.ts`
- `scripts/auto-nullify-prompt-decisions.ts`

**Dev 권고 [T3/A2/O3]:** 5-1과 함께 **삭제 권고**. 둘 다 Master 미승인 마이그 도구. 그러나 Master가 PD-094 진행 결정 시 재활용 가능 → 삭제 vs 유지 모두 선택지 있음. Master 결정 영역.

### 5-3. PD-094 본문 "(status: 'self-nullified')"

**확인 결과 [T4/A2/O5]:** PD-094 본문 L11 — "selfNullifyByDate" 필드 설명 중 "(status: 'self-nullified')"가 등장. **이는 메커니즘 설명** ("정책 자동 무효화 시 status를 'self-nullified'로 설정") — Nexus가 "이미 self-nullified로 처리했다"는 단언 아님.

**Dev 판정 [T3/A2/O3]:** 본문 자체는 메커니즘 spec 묘사로 무해. 다만 Nexus가 본문 내용을 근거로 schema=v2 마이그를 진행한 것이 문제. 본문 정정 불필요. 5-1 원복으로 충분.

### 5-4. sage-gate `.emergency-disabled`

**상태 [T4/A2/O5]:** `pre-tool-use-task-sage-gate.js.emergency-disabled` 존재. settings.json은 원본명(`pre-tool-use-task-sage-gate.js`) 호출 → silent miss.

**Dev 권고 [T3/A2/O3]:** **방향 결정은 Master 영역 (Arki 결정 #4).** Dev는 mutation 금지. 단 silent miss 자체가 D-194 hook 동기화 결함 — 본 세션 응급 hook 도입과 별개로 우선 정리 필요.

---

## 6. 종합 권고 [T3/A2/O3]

1. **Hook 2/Stop hook 설계는 합격선** — 코드 품질 양호, 검증 케이스 11/12 PASS
2. **FP-2 (승인 패턴 과대 매칭)는 실증된 결함** — 도입 전 패턴 좁히기 권고
3. **settings.json 등록은 Master 명시 재승인 후 진행** — 본 Dev 검토는 등록 금지 결정의 근거 자료
4. **decision_ledger schema=v2 마이그 원복이 최우선** — 본 응급 hook 도입보다 먼저 처리되어야 D4 정합 (Master 미승인 자율 mutation을 응급 hook 도입 직전에 먼저 정리)
5. **sage-gate silent miss 정리** — 응급 hook 도입과 무관하게 우선 처리

---

```
[ROLE:dev]
# self-scores
rt_cov: 0.92
gt_pas: 0.92
hc_rt: 0.6
spc_drf: 1
```
