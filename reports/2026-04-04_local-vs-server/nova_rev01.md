---
topic: topic_003
title: 로컬 업그레이드 vs 서버 이전
agent: nova
revision: 1
date: 2026-04-04
status: speculative
invocation: master-requested
---

# NOVA — 비정규 관점 (투기적)

## 대안 제시: GitHub 모바일 앱만으로 충분할 수 있다

GitHub Private Repo의 모바일 앱이 이미 마크다운 렌더링을 지원.
정적 사이트 빌드 자체가 불필요할 수 있음.

### 장점
- 뷰어 코드 유지보수 0
- 보안은 GitHub repo 접근 제어에 위임
- D-003 위반 가능성 0

### 단점
- 커스텀 대시보드 뷰 불가
- JSON 파일 가독성 떨어짐

### 판단
Master가 시각적 현황 보드를 원하면 옵션 A(정적 사이트)가 맞음.
→ Master는 D-006에서 A를 선택. Nova 대안은 채택되지 않음.
