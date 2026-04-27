---
role: ace
topic: topic_117
session: session_116
date: 2026-04-27
rev: 1
phase: framing
---

# Ace 프레이밍 — Topic-세션 1:다 구조

## 현황 진단
`/open` 스킬 7번은 무조건 `create-topic.ts` 실행. 토픽 번호 명시 여부 체크 로직 없음. 구조적 버그.

## 핵심 결정축
분기 기준: Master가 `/open` 시 기존 토픽 ID를 명시했는가?
- 명시 있음 → 기존 토픽에 새 세션 append
- 명시 없음 → 기존대로 신규 토픽 생성

## 범위
**In:** 7번 분기 로직 추가 / 기존 토픽 재사용 처리 / current_session.json topicId 정확 기록
**Out:** create-topic.ts 수정 불필요 / topic_index.json 스키마 변경 불필요 / 신규 스크립트 불필요

## 구현 방향
7번 항목을 분기 A (기존 토픽 재사용) + 분기 B (신규 토픽 생성)으로 재작성.
Grade 판정 규칙 §0 추가 — 토픽 ID 명시 감지 최우선.

## 결론
스킬 파일 텍스트 수정만으로 완결. Grade B 단일 세션 완결 가능.
