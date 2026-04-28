---
sessionId: session_137
topicId: topic_126
role: riki
rev: 1
date: 2026-04-29
turnId: 2
invocationMode: subagent
---

RIKI_WRITE_DONE: reports/2026-04-29_score-update-bug/riki_rev1.md

# Riki — 수정 방향 리스크 감사 (session_137)

Riki입니다. Dev 발언 기반, 코드 직접 인용 기준으로만 감사합니다.

---

## 감사 전제: Dev 발견 요약

**근본 원인**: `post-tool-use-task.js`의 `extractSelfScores(toolResponse)`가 `tool_response`에서 `# self-scores` 블록을 파싱하는데, 실제 블록은 파일에 있고 `tool_response`에는 요약만 반환된다.

**수정 방향 (Option A)**: `finalize-self-scores.ts`에 `reports/` 디렉토리 스캔 경로 추가. frontmatter `role:` 필드로 역할 식별.

---

## R-1. 🔴 Critical — `parseYamlBlocks`는 `[ROLE:xxx]` 마커 전용. frontmatter `role:` 필드를 인식하지 못한다

**코드 증거** (`scripts/finalize-self-scores.ts` line 62–63):
```ts
const roleMarker = line.match(/^\[ROLE:(\w+)\]$/);
if (roleMarker) { flush(); currentRole = roleMarker[1]!; continue; }
```

**실제 파일 frontmatter** (`reports/2026-04-28_pd033-agent-continuity-design/riki_rev1.md`):
```
---
role: riki
session: session_123
...
---
```

**파손 범위**: Option A(파일 스캔 + frontmatter role 식별)를 구현할 때, `parseYamlBlocks`를 그대로 재사용하면 역할이 전혀 식별되지 않는다. `[ROLE:riki]` 마커가 파일에 없기 때문이다. 실제 확인한 세션_123, session_136, session_137 보고서 파일 모두 frontmatter `role:` 형식이며 `[ROLE:xxx]` 마커는 0건이다.

**완화 조건**: Option A 구현 시 `parseYamlBlocks`를 수정하거나, 파일 스캔 전용 파서를 별도로 작성해야 한다. frontmatter `---` 블록에서 `role:` 값을 추출한 뒤 `currentRole`로 설정하는 경로 추가가 필요하다.

---

## R-2. 🟡 Medium — 중복 집계 위험: finalize가 호출될 때마다 같은 파일을 재파싱할 수 있다

**코드 증거** (`scripts/auto-push.js` line 75, Dev 발언 인용):
```js
'npx ts-node scripts/finalize-self-scores.ts',   // hook chain 3번째
```

**현재 구조**: `finalize`는 `sessionId`를 키로 중복 기록을 방지하는 로직이 없다. `appendScore`가 같은 `(sessionId, role, metricId)` 조합으로 중복 append를 차단하는지 `self-scores-writer.ts`를 확인해야 한다.

**파손 범위**: 세션 종료 후 재실행(예: 디버깅 재호출) 시 동일 sessionId로 레코드가 중복 적재될 경우 `compute-dashboard`의 집계값이 왜곡된다.

**완화 조건**: `scripts/lib/self-scores-writer.ts`의 `appendScore` 내부에서 중복 체크 로직 확인 필요. 없으면 finalize 진입 시 `sessionId` 기준 기존 레코드 존재 여부 확인 후 스킵 처리 추가.

---

## R-3. 🟡 Medium — `turns[].selfScores` 경로의 상태가 불명확하다 — D-092와의 정합성

**코드 증거** (`finalize-self-scores.ts` line 122–127):
```ts
for (const t of info.turns) {
  if (t.selfScores && Object.keys(t.selfScores).length > 0) {
    const cur = roleScores.get(t.role) ?? {};
    roleScores.set(t.role, { ...cur, ...t.selfScores });
  }
}
```

**D-092 정책 인용** (CLAUDE.md):
> 역할 turn 박제 시 `selfScores: {shortKey: value, ...}` 동봉, 점수만 남기면 됨.

**현실**: `post-tool-use-task.js` `extractSelfScores(tool_response)` → null → `turns[].selfScores = {}`. 경로가 살아있지만 입력이 0이다. Option A(파일 스캔)가 구현되면 이 경로와 파일 스캔 경로가 **동시에** `roleScores.set(t.role, ...)` 에 쓴다. 파일 스캔 결과가 먼저 적재되고, turns[]가 나중에 오면 빈 turns[]가 덮어쓰지 않지만, 순서에 따라 파일 스캔 결과가 씹힐 수 있다.

**완화 조건**: Option A 구현 시 파일 스캔 경로가 turns[] 이후에 실행되도록 순서 고정하거나, 병합 방향을 명시(`fileScores 우선 > turns[] 보완`). 두 경로 중 어느 쪽이 SOT인지 단일 정의 필요.

---

## 의도적 기각

다음 항목은 검토 후 확신 부족으로 제외:

- `applicableTopicTypes` 필터 오작동 가능성: 실증 확인 결과 registry 41건 전체가 `['framing', 'implementation', 'standalone']`을 포함. 현 session_137(`standalone`)에서 필터 통과 정상.
- `metrics_registry.json` shortKey 미매핑: `resolveMetricId`가 shortKey → fullId 양방향 매핑을 지원. session_129 정상 적재 이력이 기존 키 매핑이 작동함을 증명.

---

## 요약

| 등급 | ID | 제목 | 핵심 |
|---|---|---|---|
| 🔴 | R-1 | parseYamlBlocks가 frontmatter role 미인식 | Option A 구현 시 역할 식별 0건 — 파서 수정 필수 |
| 🟡 | R-2 | 중복 집계 위험 | appendScore 중복 방지 로직 존재 여부 미확인 |
| 🟡 | R-3 | turns[] vs 파일 스캔 경로 충돌 | 병합 SOT 단일화 필요 |

**R-1이 Critical**: Option A를 그대로 구현하면 파일에서 `# self-scores`를 읽어도 역할 미식별로 `roleScores` map에 아무것도 들어가지 않는다. 수정 전에 반드시 처리해야 한다.

---

```yaml
# self-scores
crt_rcl: Y
cr_val: 4
prd_rej: Y
fp_rt: 0.10
```
