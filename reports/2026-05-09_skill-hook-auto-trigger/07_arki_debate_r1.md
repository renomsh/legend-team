# Arki — Phase 4 debate r1 (plugin recommend system arch)

> **Master 정정 후**: 대상 = plugin skill ~150+. 레전드팀 12개는 정상 사용 중. 기존 BLOCK 폐기, 새 방식 = "프롬프트 입력 시 추천 → 하나씩 자동 적용".

## 결론 먼저

| 축 | 권고 |
|---|---|
| Hook 위치 | **UserPromptSubmit** (단일 후보) |
| SOT | **별도 캐시 파일** `memory/shared/plugin_skill_index.json` |
| 매칭 알고리즘 | **하이브리드** — 1차 키워드/태그 substring 필터(top-10) → 2차 LLM 의도 분류(top-3) |
| 적용 모드 | **추천 + Master 1키 선택** (자동 1순위 호출 금지 — D2/D4) |
| Phase | 3단계 (인덱스 수집 → 매칭 PoC → hook 통합) |

## §1 구조 설계

### Hook 위치 — UserPromptSubmit 단일안
- PreToolUse(Skill) — Master가 이미 호출한 후, 늦음 → 기각
- 첫 assistant turn 자체 추론 — D4 위배 → 기각
- PostUserMessage — UserPromptSubmit과 중복 → 기각

### SOT — `plugin_skill_index.json`
```json
{
  "version": "1.0",
  "lastSync": "2026-05-09T...",
  "skills": [{
    "name": "anthropic-skills:pdf-extract",
    "namespace": "anthropic-skills",
    "description": "...",
    "descriptionHash": "sha256:...",
    "verifiedBehavior": null,
    "tags": ["pdf", "extract"],
    "trustLevel": "unverified" | "verified" | "blocked"
  }]
}
```
수집 채널: (a) `/help` 또는 plugin manifest 1차 (b) system-reminder cross-check (c) hash diff 변경 감지

### 매칭 알고리즘 — 하이브리드
| 옵션 | 장 | 단 |
|---|---|---|
| (a) 키워드 substring | 결정론·D4 부합·빠름 | recall 낮음 |
| (b) embedding | recall 좋음 | 임베딩 인프라 필요 |
| (c) LLM 자체 분류 | 의도 파악 강 | 매 prompt 호출=비용 |
| **(d) 하이브리드** | 결정론 + 의미 | 구현 복잡도 중 |

**키워드 substring이 D4 위배인가?** 아니다. substring=결정론 매칭, 출력=추천 후보일 뿐 자동 실행 아님. 자동 1순위 호출로 가면 D4 위배.

### 추천 출력 형식
```
[Plugin Skill 추천 — UserPromptSubmit hook]
1. anthropic-skills:pdf-extract  (match: 0.82)
2. data:csv-analyze              (match: 0.61)

선택: 1키 입력 또는 무시. 30초 무응답 = 무시.
```
system-reminder 채널로 prepend (prompt 본문 변조 금지).

## §2 D2 / D4 대응

### D2 (description 거짓 전제)
- 신뢰 못 함. descriptionHash 변경 시 trustLevel 자동 unverified 강등
- 행위 검증 = Master `/skill-verify <name>` 1회 사용 후 승격 (별도 토픽)
- blocked skill은 추천 풀에서 자동 제외
- 인덱스 손상 시 hook 추천 생략하고 정상 통과 (fail-open)

### D4 (모델 설득 무력화)
- 매칭 1차 = 코드 결정론
- 자동 1순위 호출 = D4 위배 (모델 자가설득 가능). **기본 금지**
- "하나씩 자동 적용" Master 발언 해석 = "1키 선택으로 하나씩"으로 재정의 제안

## §3 Phase 분해

| Phase | 산출물 | Gate |
|---|---|---|
| 1. 인덱스 수집 | `plugin_skill_index.json` 빌드 스크립트 + 1회 sync | G1: skill ≥100건, hash 안정 |
| 2. 매칭 PoC | substring+tag 필터 함수, dry-run | G2: 샘플 prompt 20건 top-3 적합도 ≥70% |
| 3. Hook 통합 | UserPromptSubmit hook + Master 선택 UI | G3: FP 노이즈 허용선 통과 |

**의존**: P1 → P2 → P3 직렬. **롤백**: hook disable flag 1줄. **중단 조건**: G2 적합도 <50% → (d)→(b) 전환.

## §4 핵심 리스크 + mitigation

| 리스크 | mitigation | fallback |
|---|---|---|
| FP 노이즈 — 매 prompt 무관 추천 | 매칭 점수 임계(≥0.5)·top-3 상한 | 임계 미달 시 출력 생략 |
| plugin 의존성 lock-in | hash diff → trustLevel 강등 | fail-open |
| D2 — description 신뢰 | trustLevel 3단계 + 행위 검증 | unverified는 `?` 표기 |
| 추천이 prompt 의도 왜곡 | system-reminder prepend (본문 불변) | 30초 timeout |
| 150+ 인덱스 유지비 | manual/weekly cron | stale 7일 허용 |
| Riki 반박: 추천 자체 인지 오염 | 1키 선택 + 무응답=무시 | enabled flag로 즉시 비활성 |
| Fin 반박: 임베딩 비용 | Phase 2까지는 substring만 | 비용 0 시작 |

## Master 결정 필요
1. "하나씩 자동 적용" = (A) Master 1키 선택 / (B) top-1 자동 호출 → **권고: A**
2. 인덱스 수집 채널 = (A) `/help` 파싱 / (B) plugin manifest / (C) system-reminder 누적 → **권고: B 가능 시, 아니면 A**
3. trustLevel 검증 토픽 별도 분리 동의?

```
[ROLE:arki-debate-r1] struct_clr:4 match_alg_jdg:hybrid-d phase_cnt:3 aud_rcl:0.5 spc_lck:N
```
