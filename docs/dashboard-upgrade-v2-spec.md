# Dashboard Upgrade ver2 — Spec (Legend Nexus 진입)

> **Topic:** topic_144 / **Session:** session_167 / **Date:** 2026-05-02
> 본 문서는 topic_144 산출물 중 **Phase 4 (ackedButUnresolved schema)** 명세만 박제. 본체 구현은 child 토픽 분화 권고 (Riki R-6 mitigation 정합).

---

## 1. ackedButUnresolved SOT 결정

**SOT:** `memory/shared/decision_ledger.json` 각 entry의 `caveats` 필드 (Dev G-0 권고 1택).

**근거:**
- 운영 흔적 5건 vs `topics/{id}/open_issues.json` 0건
- D-124 본문 "재정의 필요" 명문화 → caveats가 사실상 그 자리를 메우고 있음 (D-141, D-143)
- dashboard_data.json 파이프라인에 이미 포함 → 신규 패널 추가 비용 0

**대체 후보 폐기:**
- `topics/{id}/open_issues.json` — dead schema (entry 0건). 향후 deprecated 권고
- 별도 `ackedButUnresolved.json` 신설 — 운영 흔적 0, 이중 박제 위험

---

## 2. caveats 형식 통일

**현재 (혼재):** `string | string[]`

**제안 (통일):** `string[]` 단일 형식.

**메타 필드 (각 caveat string은 그대로 두고 entry 단위 메타로 확장):**

```jsonc
{
  "id": "D-NNN",
  "caveats": ["…문장1…", "…문장2…"],
  "caveatsMeta": {
    "acked": false,
    "ackedAt": null,
    "ackedBySession": null,
    "resolvedAt": null
  }
}
```

대안 (caveat 항목별 메타 — 더 정밀하나 마이그레이션 비용 큼):

```jsonc
{
  "caveats": [
    { "text": "…문장1…", "acked": false, "ackedAt": null, "ackedBySession": null, "resolvedAt": null },
    { "text": "…문장2…", "acked": true, "ackedAt": "2026-05-02", "ackedBySession": "session_167", "resolvedAt": null }
  ]
}
```

**권고:** entry 단위 메타가 MVP. 항목별 메타는 v2 child 토픽 검토.

---

## 3. ackedButUnresolved 패널 조건

```
acked === true
&& resolvedAt === null
&& (currentSessionNum - ackedBySessionNum) >= 2   // ack TTL 2 세션 (D-124 정합)
```

이 조건을 만족하는 caveat은 dashboard `ackedButUnresolved` 패널에 prepend.

---

## 4. 기존 5건 caveats 분류 — Master 1회 결정 항목

caveat 보유 entry: **D-130, D-132, D-133, D-141, D-143** (5건).

마이그레이션 시 자동 분류 금지 (메모리 [no_retro_without_value] 위반). Master 1회 inline 결정 필요:

| Entry | caveat 요지 | acked? | resolved? |
|---|---|---|---|
| D-130 | (caveat 본문 inline 확인 필요) | TBD | TBD |
| D-132 | (caveat 본문 inline 확인 필요) | TBD | TBD |
| D-133 | (caveat 본문 inline 확인 필요) | TBD | TBD |
| D-141 | Riki R-1 recallReason 추출 로직 | TBD | TBD |
| D-143 | rules.edi config가 hook에서 read 안 됨 | TBD | TBD |

기본값(자동 적용 금지): `{acked: false, ackedAt: null, ackedBySession: null, resolvedAt: null}`.

---

## 5. 본체 구현 = child 토픽 분화 권고

다음 항목들은 본 토픽(topic_144) 범위 외, child 토픽으로 분화:

1. **schema 마이그레이션 스크립트** — `scripts/migrate-caveats-format.ts` 신설. string → string[] 통일 + caveatsMeta 부여.
2. **compute-dashboard.ts 집계 함수** — `computeAckedButUnresolved(decisions, currentSessionNum)`.
3. **dashboard_data.json 신규 필드** — `ackedButUnresolved: [{decisionId, caveat, ackedBySession, ageInSessions}]`.
4. **dashboard 패널 신설** — dashboard-upgrade.html 신규 panel + GRADE_COLORS 정합 색.
5. **0건 케이스 빈 상태 처리** — 패널 자체는 항상 표시, 0건일 때 "현재 미해결 ack 0건 ✅" 메시지.
6. **D-124 후속 결정 박제** — caveatsMeta schema 공식화 결정 ID.

PD 등록 권고 (Edi 단계에서 수행):
- 제목: "ackedButUnresolved 본체 구현 — caveatsMeta schema + dashboard 패널 신설"
- resolveCondition: schema 마이그레이션 + 패널 표시 + 5건 분류 결정 박제 완료
- dependsOn: 본 토픽 (topic_144) closed

---

## 6. forbid 정합 (본 spec 박제 단계)

- ✅ history 소급 변경 없음 — 본 문서는 신설
- ✅ historical text 변경 없음
- ✅ `package.json` `name` 필드 미접촉
- ✅ 본 spec 단계는 코드 변경 0건 — 명세만 박제

---

DEV_SPEC_DONE: docs/dashboard-upgrade-v2-spec.md
