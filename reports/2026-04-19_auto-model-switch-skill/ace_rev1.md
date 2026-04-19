---
session: session_041
topic: auto-model-switch 스킬 파일 생성
role: ace
rev: 1
date: 2026-04-19
grade: B
framingLevel: L1
---

# Ace — 인라인 프레이밍

**범위**: D-042에서 설계된 `auto-model-switch` 스킬을 `writing-skills` 규격에 맞춰 파일로 생성. 트리거: `/open` grade 판정 직후 1회, Grade S/A/B → `/model claude-opus-4-7` 안내. Grade C 또는 이미 Opus 4.7이면 무동작.

**축**: (1) 스킬 위치·네이밍, (2) 트리거 조건 명세, (3) 이미 Opus 계열인 경우 생략 보장.

**함정**: 세션 중간 grade 재조정(D-040) 시 재실행 → 기본 "1회"로 확정. 이미 Opus 4.7 1M 컨텍스트 등 상위 모델 사용 중이면 안내 생략.

## Master 피드백 반영 (세션 중)
- `/fast` → `/model claude-opus-4-7` 수정 (Opus 4.6 혼동 제거)
- Grade B도 발동 범위에 포함 (S/A/B → 안내, C만 제외)
- 이미 Opus 4.7 계열이면 안내 없이 유지
- PD-016 resolved 수정 (system_state 오기 수정)
