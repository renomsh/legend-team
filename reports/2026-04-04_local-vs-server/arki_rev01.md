---
topic: topic_003
title: 로컬 업그레이드 vs 서버 이전
agent: arki
revision: 1
date: 2026-04-04
status: completed
---

# ARKI — 구조 분석 및 실행 설계

## 구조 진단
현재 시스템의 읽기/쓰기 경로 분리:
- 쓰기: Master ↔ Claude Code → 로컬 파일
- 읽기: 로컬에서 직접 파일 열기

## 아키텍처 옵션
| 옵션 | 설명 | 비용 | 권고 |
|---|---|---|---|
| A. Git Push → 정적 사이트 | Cloudflare Pages | $0 | ✅ 선택 |
| B. VPS + 파일 서버 | Node.js 서버 | $5-10/월 | 과잉 |
| C. 클라우드 동기화 | Dropbox/OneDrive | $0 | 모바일 UX 열악 |

## 실행 설계 (Master 지시 후)

### D-003 수정 권고 (Master 승인)
- 읽기 인터랙션과 다중 페이지 허용
- 쓰기 인터랙션만 금지
- 핵심 구분: 읽기 vs 쓰기

### D-007 수정 권고 (Master 승인)
- 전체 배포 (memory/master/ 포함)
- Master가 유일 사용자, Cloudflare Access 인증으로 보안 확보

### 구현된 구조
```
app/
├── index.html          (Dashboard)
├── topic.html          (토픽 상세)
├── decisions.html      (결정 원장)
├── session.html        (세션 현황)
├── feedback.html       (Master 피드백)
├── css/style.css
└── js/
    ├── data-loader.js  (fetch 기반 데이터 로드)
    ├── md-renderer.js  (마크다운 → HTML)
    └── nav.js          (네비게이션)
```

### 빌드/배포 파이프라인
```
Claude Code → git push → GitHub Private Repo → Cloudflare Pages 자동 빌드 → dist/ 서빙
```
