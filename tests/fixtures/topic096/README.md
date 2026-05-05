# tests/fixtures/topic096

D-067~D-070 regression test fixtures (session_091, topic_096).

기존 fixtures (snapshot_1~5.json)는 9 기준 도입 이전 — 호환 불가. 본 디렉토리에 신설.

각 테스트는 임시 디렉토리(os.tmpdir())에 minimal session_index.json + reports 디렉토리를 동적 생성하여
finalize hook 또는 lib 함수를 격리 실행한다. 정적 fixture 파일은 본 README와 sample reports만 보관.
