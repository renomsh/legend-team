---
session: session_052
topic: Session History Design Change
role: vera
rev: 1
date: 2026-04-21
---

# Vera — 시각 설계 스펙 + 팔레트 크리틱

## Turn Sequence dot 스펙 (확정)
- nodeR: 8 → 10 (지름 20px)
- gap: 28 → 36
- rowH: 24 → 28
- stroke: #0B0B0D 1.5px (경계 선명화)
- recall stroke: white 2px dashed 4,3
- connector: rgba(139,92,246,.18) 1px

## Role Frequency 차트 (확정)
- ECharts 수평 bar → HTML/CSS 트랙 바 교체
- 레이아웃: dot(8px) + 역할명(52px) + 트랙(flex:1, h:6px, bg:#26262D) + 숫자
- fill: rgba(ROLE_COLOR, .65)

## 팔레트 크리틱 (design:design-critique 활용)
### 확정 팔레트 (v1.13)
- ace: #8B5CF6 (purple) — 전략·권위
- arki: #06B6D4 (cyan) — 기술·구조
- fin: #F59E0B (amber) — 금융·가치
- riki: #EF4444 (red) — 위험·경고
- nova: #10B981 (emerald) — 가능성·투기
- edi: #9CA3AF (gray) — 중립·기능
- dev: #3B82F6 (blue) — 구현·차가움 (의도적 cool 계열)
- vera: #F472B6 (pink) — 미적·크리에이티브

### Cool cluster (ace/arki/dev) — Master 결정으로 수용
dev=blue는 "코딩은 차가워야 한다"는 Master 의도. 수치보다 역할 성격 우선.

## 단일 원천 구조
app/js/role-colors.js — window.ROLE_COLORS + window.ROLE_LABELS
모든 페이지(index.html, session.html, dashboard-upgrade.html) 공유 로드.
