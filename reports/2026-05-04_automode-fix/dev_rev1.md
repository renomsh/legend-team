---
session: session_180
topic: topic_156
role: dev
rev: 1
date: 2026-05-04
grade: C
---

# 자동모드 비활성화 수정 — Dev 리포트

## 증상

Claude Code 재부팅 후 자동 모드(bypass permission prompts)가 비활성화 상태로 초기화됨.

## 근본 원인

Claude Code 설정 계층 **shallow merge** 동작:

| 파일 | 역할 |
|------|------|
| `~/.claude/settings.json` | user-level: `permissions: { defaultMode: "bypassPermissions" }` |
| `.claude/settings.json` | project-level |
| `.claude/settings.local.json` | local (auto-managed): `permissions: { allow: [...] }` |

`.claude/settings.local.json`의 `permissions` 객체가 user-level `permissions`를 **완전히 덮어씀** → `defaultMode` 필드 소멸.

`settings.local.json`은 Claude Code가 auto-approve 항목을 자동으로 `allow[]`에 추가하는 파일이므로, 재부팅 시마다 `defaultMode` 없는 상태로 유지됨.

## 수정 내용

### 1. `~/.claude/settings.json` (user-level)

```diff
- "defaultMode": "auto"
+ "defaultMode": "bypassPermissions"
```

`"auto"` 모드는 새로운/알 수 없는 명령에 여전히 프롬프트를 띄울 수 있음. `"bypassPermissions"`는 모든 권한 체크를 완전히 우회.

### 2. `.claude/settings.local.json` (local, auto-managed)

```diff
  "permissions": {
+   "defaultMode": "bypassPermissions",
    "allow": [...]
  }
```

`permissions` 객체 내에 `defaultMode` 추가 → shallow merge 시에도 `defaultMode` 보존.

## 검증

- 설정 변경 후 재시작 없이 즉시 Auto Mode 활성화 확인 (`## Auto Mode Active` 시스템 리마인더 출력)
- 훅 조사 결과: 모든 훅 pass/no-op, 자동 모드 차단 이벤트 0건 (근본 원인 아님 확인)

## 주의

`settings.local.json`은 Claude Code가 자동 관리하므로, 향후 Claude Code 업데이트로 파일이 재생성될 경우 `defaultMode` 필드가 누락될 수 있음. 이 경우 다시 수동으로 추가 필요.
