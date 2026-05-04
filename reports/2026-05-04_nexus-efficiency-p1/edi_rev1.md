---
topicId: topic_160
topicTitle: "Nexus 효율화 Part1"
role: edi
phase: synthesis
revision: 1
date: 2026-05-04
sessionId: session_187
report_status: final
---

# Edi 산출물 — topic_160 Nexus 효율화 Part1

Edi입니다. session_187 결과물을 정리합니다.

---

## 세션 요약

**주제:** Nexus 효율화 Part1 — /open 시 발생하는 ~57K 토큰 원인 분석 및 경감 조치

**Grade:** B | **모드:** Observation | **세션 ID:** session_187

---

## 확정된 발견 및 조치

### 1. 토큰 원인 분석 (Arki)

| 구분 | 내용 |
|---|---|
| **원인** | 시스템 프롬프트 `cache_create_input_tokens` = 48,817 |
| **구성** | User-controlled ~13K + Claude Code 인프라 ~35K (MCP tool schemas, skill list, server instructions) |
| **파일 읽기 기여** | /open 체크리스트의 Read 호출은 소규모 (캐시 히트 구조) |
| **핵심 결론** | 57K는 파일 내용이 아닌 Claude Code 시스템 프롬프트이 소모 |

**Arki 자기평가 오류 기록:** str_fd 4→2, sa_rnd 2→1 (파일 크기=토큰 소비 가정 오류)

### 2. MCP 정리 (실행 완료)

**삭제 (사용자 직접 app UI에서):** ~8개 불필요 MCP 제거

**유지/추가:**
- Sequential Thinking: `npx -y @modelcontextprotocol/server-sequential-thinking` (CLI 추가 완료)
- GitHub MCP: 이미 연결 확인

**Phase 2 예약 (topic_200 이후):**
- Brave Search 또는 Exa (웹 검색)
- Slack MCP (메시지 통합)
- Google Drive MCP (문서 접근)

### 3. MEMORY.md 경감 (실행 완료)

| 항목 | 수치 |
|---|---|
| 변경 전 | 39개 파일, 7,207B |
| 변경 후 | 30개 파일, 5,664B |
| 감축 | -9개, -1,543B (-21%), 약 -386 토큰 |

**삭제된 메모리:**
- 역할 색상 통일 (이미 전체 지정)
- 토픽 분화 신중
- 구현 3세션 이내 원칙
- 자기평가 외부평가 공존 설계
- Top 0.1% 신뢰 자가평가 허용
- Nova 자동 추천 on expansion
- Arki 자기감사 Master 압박 수용
- 외부 플러그인 검토 축
- 분석 리포트 액션 금지 (Arki 리스크 mitigation 의무가 상위 포괄)
- 에디터 호칭

**유지된 메모리:**
- 기업 DB 매핑 전략 레슨런
- 실무용 병기 (ROI 우선)
- 기타 30개

### 4. Nexus Intent Confirm 규칙 추가 (정책 반영)

**문제:** Master 메시지 불충분 시에도 Nexus가 의도 확인 없이 Arki를 바로 dispatch

**조치:** `nexus_memory_open.json` → `orchestration.intentConfirm` 필드 추가
```
"Master 메시지가 불충분하면(목적·대상·기대결과 중 최소 1개 미명시) 첫 역할 dispatch 전
Nexus가 주제·scope를 질문한다. 모든 Grade·모든 세션 적용."
```

**추가 반영:** `.claude/commands/open.md` Step 8에 포인터 추가

---

## 미결 사항

없음. 세션 목표 (원인 분석 + MCP 정리 + MEMORY 경감 + 정책 반영) 모두 완료.

---

## 버전 범프 판정

- `nexus_memory_open.json` 정책 신규 필드 → +0.01
- `MEMORY.md` 구조 정리 → 정책 변경 아님 → 0

**권고:** +0.01 적용

---

[ROLE:edi]
# self-scores
artifact_compile: complete
version_bump_confirm: +0.01
anchor_governance: N/A
