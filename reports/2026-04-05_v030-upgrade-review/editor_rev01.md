---
topic: v0.3.0 업그레이드 항목 검토 (운영 부채 청산)
role: editor
revision: 1
date: 2026-04-05
status: final
accessed_assets:
  - file: reports/2026-04-05_v030-upgrade-review/ace_rev02.md
    scope: 최종 실행 리스트
  - file: reports/2026-04-05_v030-upgrade-review/arki_rev01.md
    scope: 설계 확정 사항
  - file: reports/2026-04-05_v030-upgrade-review/riki_rev01.md
    scope: 실행 분류
---

# EDITOR — 실행 지시서 및 세션 결과 정리

## 세션 결과 요약

**session_005** — v0.3.0 운영 부채 청산 라운드

### 확정된 의사결정

| ID | 내용 |
|---|---|
| D-010 | build-report.ts = standalone publish compiler. build.js = packaging only. published/ 신설. |
| D-011 | frontmatter status = master-approved 단일화. approved 폐기. |
| D-012 | session 확인 루프: sessionLogCalled 플래그(임시) + session_index.json 원장(최종). |

### 실행 완료 항목 (게이트 1+2)

| ID | 항목 | 결과 |
|---|---|---|
| OP-01 | master_feedback_log.json JSON 수정 + D-007 보정 + MF-004 추가 | 완료 |
| OP-03 | run-debate.ts deprecated 처리 (package.json 참조로 _archived/ 이동은 다음 세션) | 완료(부분) |
| OP-05 | frontmatter status migration (4개 파일 master-approved 통일) | 완료 |
| OP-06 | session_index.json gap 기록 | 완료 |
| OP-04 | sessionLogCalled 플래그 + session-log.ts 갱신 + CLAUDE.md 체크리스트 갱신 | 완료 |

### 이연 항목 (게이트 3 — 다음 세션)

| ID | 항목 | 조건 |
|---|---|---|
| OP-02 | build-report.ts 전면 재설계 + published/ 신설 + build.js 수정 + data-loader.js 갱신 | 게이트 1+2 완료 확인 후 한 번에 완주 |
| OP-03 (이동) | run-debate.ts → scripts/_archived/ 이동 + package.json debate 스크립트 제거 | 다음 세션 |

### 손대지 않은 항목 (정책 결정 선행 필요)

- retroactive: true 등 비표준 frontmatter 필드
- topic.html path fallback (OP-02 완료 후 정리)
- topics/topic_001/ 디렉토리 처우

## 실행 지시서 (게이트 3 — 다음 세션용)

### OP-02 착수 조건 확인 체크리스트
```
□ master_feedback_log.json 파싱 가능 확인
□ session_index.json에 이번 세션 기록 확인
□ 이전 OP 항목 모두 닫힘 확인
```

### OP-02 실행 순서
1. `scripts/build-report.ts` 전면 재작성
   - 입력: `memory/shared/topic_index.json` + `reports/{dir}/*.md`
   - 출력: `published/topics_manifest.json`, `published/decisions_summary.json`
2. `scripts/build.js` 수정
   - DATA_SOURCES에 `{ src: 'published', dest: 'data/published' }` 추가
3. `app/js/data-loader.js` 갱신
   - `getTopicsManifest()` 추가 → `published/topics_manifest.json`
   - `getDecisionsSummary()` 추가 → `published/decisions_summary.json`
4. 검증: `ts-node scripts/build-report.ts` → `published/` 생성 확인
5. 검증: `node scripts/build.js` → `dist/data/published/` 포함 확인
6. 배포 후 뷰어 확인

### OP-03 완료 처리
1. `package.json`에서 `"debate": "ts-node scripts/run-debate.ts"` 제거
2. `scripts/run-debate.ts` → `scripts/_archived/run-debate.ts` 이동
