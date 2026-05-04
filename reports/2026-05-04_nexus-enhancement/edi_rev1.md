---
topic: Nexus 고도화
topicId: topic_159
sessionId: session_186
grade: B
date: 2026-05-04
author: edi
revision: 1
---

# Nexus 고도화 — 세션 종결 산출물

## 요약

session_186은 Nexus(메인 하네스) 운영 부담 경량화를 목표로 진행되었다. CLAUDE.md / MEMORY.md / open.md 3개 핵심 컨텍스트 파일을 합계 -26% 축소(39,954B → 29,615B)했고, MCP 7종·Skill 3종을 OFF 처리해 자동 컨텍스트 주입량을 줄였다. 결정으로는 Viewer Policy 한정 조항(D-002)을 inline 폐기했다. topic_200부터 실무 투입 선언은 별도 결정 박제 없이 Master 판정으로 보류했다.

## 결정 사항

| ID | 내용 | 처리 |
|---|---|---|
| D-002 폐기 | Viewer Policy의 read-only 다중 페이지 정적 viewer / JSX·React 금지 / write 금지 조항을 해제 | CLAUDE.md inline 박제 (decision_ledger 별도 박제는 Master 판단) |
| D-154 | topic_200부터 실무 투입 선언 | 박제 보류 — Master 판정으로 별도 결정 박제 불요 |

## 변경 내역

### 파일·바이트 표

| 파일 | 이전 (B) | 이후 (B) | 절감 |
|---|---|---|---|
| CLAUDE.md | 24,395 | 19,969 | -18% |
| MEMORY.md | 8,329 | 7,207 | -13% |
| open.md | 7,230 | 2,439 | -66% |
| **합계** | **39,954** | **29,615** | **-26%** |

### 구체 항목

- **CLAUDE.md**: 중복·구식 조항 정리. D-002 Viewer Policy 한정 조항 inline 폐기 반영.
- **MEMORY.md**: 개인 자동 메모리 압축 (정착 정책 재진술 제거).
- **open.md**: `/open` 커맨드 절차서 -66% 대폭 압축 (가장 큰 절감폭).

## MCP/플러그인 정리 결과

### MCP — OFF 처리 (7건)

- claude-in-chrome
- ccd_session_mgmt (+ ccd_directory / ccd_session 동반 OFF)
- biorxiv
- slack
- PubMed
- ChEMBL
- c-trials

### MCP — 유지

Claude_Preview, pdf-viewer, cloudflare, computer-use, scheduled-tasks, mcp-registry

### Skill — OFF 처리 (3건)

anthropic-skills 中:
- brand-guidelines
- algorithmic-art
- slack-gif-creator

### Skill — 유지

나머지 전부 (사업전략팀 scope에 부합)

## 잔여·후속

- **bio-research skill 유지 확정** — 분석도구로 유효, OFF 대상에서 제외.
- **CLAUDE.md 추가 축소 보류** — 품질 우선 판단으로 더 이상 압축하지 않음.
- **D-002 decision_ledger 박제** — inline 폐기는 완료. 결정 원장 별도 박제 여부는 Master 판단 대기.
- **topic_200 실무 투입 전환** — 결정 박제 없이 운영. 후속 토픽에서 자연 발효.

### versionBump 확정

- 자동 감지: +0.1 (structural) — CLAUDE.md / MEMORY.md / open.md 변경
- 감지 근거: CLAUDE.md (project instructions) 변경 + Skill 절차서(open.md) 변경
- 변경 파일: 3건 (+ MCP/Skill OFF 운영 변경)
- **Edi 판단**: 동의
- **확정값**: +0.1
- **사유**: CLAUDE.md inline에서 D-002 조항을 폐기한 정책 변경이 발생했으므로 structural 분류가 타당하다.

[ROLE:edi]
# self-scores
gp_acc: 0.85
scc: Y
cs_cnt: 4
art_cmp: 1.00
gap_fc: 1
