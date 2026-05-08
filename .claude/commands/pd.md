# /pd — 이연 항목(PendingDeferral) 등록·삭제·조회

세션 내외 어디서든 아이디어·해야 할 일을 이연 항목으로 빠르게 관리.

ARGUMENTS: $ARGUMENTS

## 인수 해석

| 입력 패턴 | 동작 |
|---|---|
| 인수 없음 또는 `list` | 현재 pending 목록 출력 |
| `rm PD-NNN` 또는 `remove PD-NNN` | 해당 ID 삭제 |
| 그 외 텍스트 | 새 PD 항목 등록 |

note 추가 시: `<내용> --note="<메모>"`

## 실행 규칙

Bash 툴로 아래 명령을 호출한다. 인수에 공백이 있으면 쌍따옴표로 감싼다.

```
# 목록
npx ts-node scripts/manage-pd.ts list

# 등록
npx ts-node scripts/manage-pd.ts add "<ARGUMENTS>"

# 삭제
npx ts-node scripts/manage-pd.ts rm <ID>
```

스크립트가 current_session.json에서 fromSession·fromTopic을 자동 주입한다.

## 출력

스크립트 stdout을 그대로 보여준다. 추가 해설 없음.
