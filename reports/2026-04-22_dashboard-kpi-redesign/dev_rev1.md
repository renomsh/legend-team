---
session: session_072
topic: dashboard-kpi-redesign
role: dev
rev: 1
date: 2026-04-22
---

# session_072 Dev Report — PD-NEW-A/B/C

## PD-NEW-A: 대시보드 KPI 개편 (topic_075, Grade B)

### 변경 사항
- `app/dashboard-upgrade.html`: "Tokens" KPI → "I/O Tokens" 레이블 변경
- `kTokensSub` 정적 텍스트: "입력+출력 · canonical (D-059)"
- `totalTokens` JS 계산: `totalBillable` → `ioTokens` (input+output only)
- `sparkTokens`: ioTokens 기준으로 전환
- Cost panel 앞 "비용 (Secondary)" 섹션 레이블 추가

### 검증
- I/O Tokens KPI 표시: **7.1M** (session_071 확인값 7.09M과 정합 ✅)
- CC 대시보드 7.9M과의 9.3% 차이 = session_072 미반영분 (E-014 문서화)

---

## PD-NEW-B: 캐시 효율 보조 패널 + raw 합 접기 (topic_076, Grade B)

### 변경 사항
- `scripts/compute-dashboard.ts`: tokenUsage에 `ioTokens`, `cacheCreate`, `cacheRead` 필드 추가
- `app/dashboard-upgrade.html`: `<details>` 접기 패널 추가 (기본 닫힘)
  - 컬럼: I/O(=canonical KPI) / Cache Create / Cache Read / Total(raw 4필드)
  - toggle 시 ▶/▼ 아이콘 전환

---

## PD-NEW-C: D-059 evidence 등록 + Anthropic 공식 문서 앵커 (topic_077, Grade C)

### 변경 사항
- `memory/shared/evidence_index.json`:
  - E-014: status `open` → `resolved-D-059` + resolvedNote + externalAnchor(token-counting docs)
  - E-015 신규: D-059 이행 기록 + externalAnchor(models overview/pricing)
- 외부 앵커 URLs:
  - https://docs.anthropic.com/en/docs/build-with-claude/token-counting
  - https://docs.anthropic.com/en/docs/about-claude/models
