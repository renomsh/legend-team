---
role: edi
session: session_198
topic: topic_171
topicSlug: nexus-pc-hardware-upgrade
date: 2026-05-05
rev: 1
---

# Legend Nexus 노트북 업그레이드 — 세션 정리 (session_198)

## 토픽 요약
LG 그램(i7/16GB) 발열·성능 한계 → MacBook Pro 16" M5 Max 전환 검토. RAM만 미결.

## 확정 스펙

| 항목 | 확정값 |
|---|---|
| 모델 | MacBook Pro 16" |
| 칩 | M5 Max 상위 (18코어 CPU / 40코어 GPU / 16코어 Neural Engine) |
| SSD | 2TB |
| RAM | **미결 — 64GB(749만원) vs 128GB(869만원)** |

## RAM 미결: 64GB vs 128GB

### 64GB (749만원) 논거
- Arki 분석 기준 충족 (29~37GB 최소, 64GB 목표)
- Claude Code API 기반 — 로컬 LLM·렌더링 없음
- 2014 Mac Pro 경험: 과스펙 지출 선례

### 128GB (869만원, +120만원) 논거
- 메모리 솔더링 — 교체 불가, 비대칭 리스크
- Legend Nexus 멀티에이전트 오케스트레이션은 실제로 무거운 시스템
- 시스템 1개월, 성장 속도 빠름 — 3년 천장 도달 가능성

### 제외 확정
- M5 Pro 64GB (579만원): RAM 천장 동일, Pro가 더 합리적
- M5 Max 64GB (749만원): Pro 대비 170만원 추가지만 RAM 천장 동일 → 제외
- M5 Pro 64GB vs M5 Max 128GB가 실질 선택지

## 구매 전 선행 작업 (hook 패치 — macOS 전환 전 필수)

| 항목 | 내용 |
|---|---|
| R-2 🔴 | `shell: isWin` 패턴 7곳 → `shell: true` 통일 |
| R-3 🔴 | spawnSync 실패 시 `sess.gaps` 박제 추가 (무음 실패 방지) |
| R-4 🟡 | `__dirname` → CWD 기반으로 정리 |

미완료 시 macOS 전환 직후 세션 기록 무음 오염 가능.

## 다음 액션

1. Master RAM 결정 (64GB vs 128GB)
2. hook 패치 토픽 오픈 (Grade C)
3. macOS 전환 후 G3·G4 검증 게이트 통과 확인
4. 구형 그램 — G5(Master 명시 승인) 이전 반드시 보존
