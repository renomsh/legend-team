# 공통 정책 (모든 역할 서브에이전트 공통)

## Write 계약 (필수)

발언 완료 후 **반드시** 다음 경로에 저장:
- 메인이 `WRITE_PATH`로 지정한 경로에 발언 전문 write
- 경로 미지정 시: `reports/{오늘날짜}_{slug}/{role}_rev{n}.md`
- 저장 후 메인에게 "{ROLE}_WRITE_DONE: {실제저장경로}" 를 응답 첫 줄에 포함 (역할명 대문자)

## Frontmatter link 의무 (D-067, session_091, topic_096)

신규 세션의 모든 역할 report frontmatter에 다음 필드 의무 기록:
- `turnId: <정수>` — 본 발언이 매핑되는 `current_session.json.turns[*].turnIdx` 값. 메인이 호출 시점에 알려주거나, 알려주지 않으면 PostToolUse(Task) hook이 자동 박제한 이후의 정수를 사용.
- `invocationMode: subagent` — 본 서브에이전트 호출은 항상 subagent 모드.
- 누락 시 SessionEnd finalize hook이 gaps에 박제하여 9 기준 #5 위반 경보.

## Self-Score YAML 출력 계약 (PD-023 §5.1 준수, PD-035 박제)

발언 본문 말미에 다음 블록을 **채팅 응답(tool_response)에 반드시 포함** (파일 저장만으로는 파서에 전달되지 않음):

```
[ROLE:{역할명소문자}]
# self-scores
<key1>: <value>
<key2>: <value>
```

- `[ROLE:ace]` / `[ROLE:arki]` 등 역할명 소문자 마커를 `# self-scores` 블록 **바로 위** 에 반드시 출력 (파서 역할 식별 필수)
- 역할별 지표 키는 `policies/role-{r}.md` 참조 (scale·정의 단일 출처: `memory/growth/metrics_registry.json` — D-092)

### 공통 기록 규칙
- 발언 관련 있는 지표만 자가 선택 기록 (미관련 생략 허용)
- 미입력 → 직전 세션 값 상속 (3연속 생략 시 finalize 경보)
- scale: 0-5 정수 / Y·N / ratio 0~1 소수2자리 / percentile 0~100 정수
- 참여 판정: `session-end-finalize.js`가 turns[] median·0.3 임계로 기계적 산출 (자가 YAML은 참고용)

## 컨텍스트 활용 지시 (공통)

메인이 제공하는 파일 경로 목록에서 **필요한 것만** 선택적으로 Read하여 참조.
- 역할 메모리: `memory/roles/{role}_memory.json` Read 권장
- 이전 역할 발언: 제공된 경로 목록 Read (hook v2/v3가 본문 자동 prepend함 — 중복 Read 불필요)
- 공유 자산: `memory/shared/decision_ledger.json`, `memory/shared/topic_index.json` 등은 필요 시에만

## Shared Asset Protocol (공통)

자산 활용 의무: `evidence_index.json`·`glossary.json`·`decision_ledger.json` — 상세는 CLAUDE.md §Asset Protocols (D-012).

## 자기소개 제약 (F-013, session_090, 공통)

자기소개는 "{역할명}입니다" 또는 "{역할 정체성} {역할명}입니다"만 사용.
- **금지**: spec에 없는 이름 자가 생성, 레퍼런스 인물명 자가 정체성화
- 레퍼런스 인물은 사고 모델일 뿐 자기 정체성 아님. persona drift 방어 의무.

## 검증 의무 — verification-before-completion (공통)

코드 파일(`.ts/.js/.py` 등) 작성·수정 후, 완료/done 선언 전 반드시:
1. **실행** — 해당 산출물을 실제로 실행·호출한다
2. **출력 확인** — 기대 결과와 실제 결과를 대조한다
3. **증거 기록** — 확인한 출력을 보고에 포함한다

증거 없는 완료 선언 = 미완료. "방금 작성했으니 맞을 거야" 합리화 금지.
