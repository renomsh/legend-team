# Dev — Riki #2 적용 (topic_163, session_190)

## 변경
`memory/roles/policies/role-zero.md` 호출 조건 § self-exclusion bullet 1줄 제거.

```diff
 - on-demand. 매 세션 호출 X. 정제 필요 시 Master/Nexus 호출.
 - `session_isolation: "shared"` — Sage와 달리 다른 페르소나와 공존 가능
-- Self-exclusion 일반 원칙은 `memory/roles/personas/role-zero.md` SOT 참조 (D-146)
```

## 근거
강제 제약 § line 114(`Self-exclusion 의무: ... persona SOT (D-146) 참조`)가 enforcement 형태로 동일 정보 cover. 컨텍스트 활용 지시 § line 130(actionable) 보존 (Riki 권고).

## 검증
- 4,873B → 4,782B (-91B, Riki 추정 ~150B 대비 보수)
- persona SOT(D-146) 참조 1곳 유지 (line 113)
- 파일 구조 무파괴

## Self-Score
fix_cnt: 1 / runtime_pass: 1 / hardcode_cnt: 0
