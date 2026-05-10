#!/usr/bin/env ts-node
/**
 * test-p6-blind-parallel-domain.ts
 * D-170-A1 P6 — pre-tool-use-task.js blind-parallel domain prepend 검증
 * session_209, topic_176
 *
 * 시나리오:
 *   D1. operationMode 없음 → domain prepend 없음 (기존 동작 무변화)
 *   D2. operationMode='blind-parallel', role=arki → domain 주입 확인
 *   D3. operationMode='blind-parallel', role=riki → domain 주입 확인
 *   D4. operationMode='blind-parallel', role=unknown → 경고 마커 (unknown role)
 *   D5. operationMode='blind-parallel', role=arki, role_domain_template 미존재 → 경고 마커
 *   D6. operationMode='blind-parallel' + gateMarker 동시 → 둘 다 주입
 */
export {};
//# sourceMappingURL=test-p6-blind-parallel-domain.d.ts.map