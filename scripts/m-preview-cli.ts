/**
 * m-preview-cli.ts — PD-079 / D-181 Phase 5 (opt-in)
 *
 * silent-1 자동 마이그레이션은 Master UI 호출 0건이 원칙(D2 + Riki R-3).
 * 본 CLI는 opt-in으로만 호출 — closed mtopic preview를 인쇄, 변경 0.
 *
 * 사용: npx ts-node scripts/m-preview-cli.ts
 */

import {
  scanClosedMTopics,
  buildPreview,
  loadOfficialLedger,
  loadOfficialPDs,
} from './lib/migration-preview';

function main(): void {
  const closedAll = scanClosedMTopics();
  if (closedAll.length === 0) {
    console.log('[m-preview] closed mtopics: 0');
    return;
  }
  const officialLedger = loadOfficialLedger();
  const officialPDs = loadOfficialPDs();
  const previews = closedAll.map((c) => buildPreview(c, officialLedger, officialPDs));
  console.log(JSON.stringify({ count: previews.length, previews }, null, 2));
}

if (require.main === module) {
  main();
}
