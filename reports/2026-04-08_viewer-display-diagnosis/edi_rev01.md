---
topic: topic_008
title: 현황판 점검 — topic_007 표시 오류 원인 분석 및 수복
role: editor
revision: 1
date: 2026-04-08
session: session_010
status: completed
---

# Editor — 세션 기록

## 토픽 요약

**현상**: topic_007 뷰어에서 `fin_rev01.md` 내부에 Dashboard 전체 UI가 렌더링됨. 파일 목록 불일치.

**근본 원인**: session_009 세션 종료 시 `reports/2026-04-08_storage-quality-review/` 디렉토리와 MD 5개 파일이 실제로 생성되지 않음. `topic_index.json`에만 등록된 채 커밋됨.

**연쇄 오류 경로**:
```
파일 미생성 → build.js 무검증 → manifest에 허위 파일 등록
→ CF Pages SPA 모드 → 404 대신 index.html(200) 반환
→ mdToHtml HTML 미이스케이프 → Dashboard UI가 fin 내부에 렌더링
```

---

## 수복 완료 항목

| 항목 | 파일 | 게이트 |
|------|------|--------|
| session_009 보고서 5개 생성 | `reports/2026-04-08_storage-quality-review/*.md` | — |
| href XSS 차단 (sanitizeHref) | `app/js/md-renderer.js` | 렌더링 |
| JSON 필드 escHtml 적용 | `app/topic.html` | 렌더링 |
| published 토픽 빌드 차단 | `scripts/build.js` | 배포 |
| CF SPA 모드 비활성화 | `app/_redirects` | CF Pages |
| reportFiles 교차검증 | `scripts/session-log.ts` | 세션 종료 |

---

## 커밋 이력

| 커밋 | 내용 |
|------|------|
| `c833d86` | session_009 report 파일 5개 + build.js 교차검증 |
| `b7b0072` | XSS 패치 + JSON escHtml + build exit(1) + _redirects |
| `c0e50a8` | session-log.ts reportFiles 교차검증 |

---

## 방어 계층 (이번 세션 수립)

```
세션 종료 → session-log.ts WARN (누락 파일 목록)
배포 전   → build.js exit(1) (published + 파일 없음)
렌더링    → sanitizeHref + escHtml
```

## 미결 사항

- CF SPA 모드 대시보드 직접 확인 (Master 판단)
- session-log.ts WARN은 차단하지 않음 — D-011 원칙 유지

**Nova 미호출**
