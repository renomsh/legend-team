/**
 * freeze-mock-fixture.js — Phase 2 G2 박제 (session_105, topic_082)
 *
 * Spec: reports/2026-04-25_dashboard-redesign-ux-responsive-phase2/vr-infra-spec.md §2-2
 *
 * data/dashboard_data.json → tests/vr/fixtures/dashboard.mock.json
 * R-1 mitigation (a): 모든 timestamp 필드를 FROZEN_TS로 강제.
 * R-1 mitigation: meta.loaded = true 강제.
 *
 * 환경변수: VR_FROZEN_TS (기본 '2026-01-01T00:00:00Z')
 */

const fs = require('fs');
const path = require('path');

// SRC 자동 탐색: data/ → memory/shared/ 순. 환경변수 VR_FIXTURE_SRC 우선.
const SRC_CANDIDATES = [
  process.env.VR_FIXTURE_SRC,
  path.resolve(__dirname, '..', 'data', 'dashboard_data.json'),
  path.resolve(__dirname, '..', 'memory', 'shared', 'dashboard_data.json'),
].filter(Boolean);
const SRC = SRC_CANDIDATES.find((p) => fs.existsSync(p)) || SRC_CANDIDATES[1];
const DEST = path.resolve(__dirname, '..', 'tests', 'vr', 'fixtures', 'dashboard.mock.json');
const FROZEN_TS = process.env.VR_FROZEN_TS || '2026-01-01T00:00:00Z';

function deepNormalizeTimestamps(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(deepNormalizeTimestamps);
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (/(At|Date|Time|timestamp)$/i.test(k) && typeof v === 'string') {
      out[k] = FROZEN_TS;
    } else {
      out[k] = deepNormalizeTimestamps(v);
    }
  }
  return out;
}

function freezeMockFixture(srcPath = SRC, destPath = DEST) {
  if (!fs.existsSync(srcPath)) {
    throw new Error(`source not found: ${srcPath}`);
  }
  const raw = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
  const frozen = deepNormalizeTimestamps(raw);
  if (frozen.meta && typeof frozen.meta === 'object') {
    frozen.meta.loaded = true;
  }
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, JSON.stringify(frozen, null, 2));
  const size = fs.statSync(destPath).size;
  return { destPath, size };
}

if (require.main === module) {
  try {
    const { destPath, size } = freezeMockFixture();
    console.log(`[freeze-mock-fixture] PASS — ${destPath} (${size} bytes)`);
  } catch (e) {
    console.error(`[freeze-mock-fixture] FAIL — ${e.message}`);
    process.exit(1);
  }
}

module.exports = { freezeMockFixture, deepNormalizeTimestamps, FROZEN_TS };
