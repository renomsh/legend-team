/**
 * validate-topic-schema.ts
 * D-052 topic_meta.json phase × hold 검증기.
 * topic_phase_catalog.json + hold_reasons_catalog.json 런타임 로드.
 *
 * 사용:
 *   npx ts-node scripts/validate-topic-schema.ts                        # topics/ 전체 검사
 *   npx ts-node scripts/validate-topic-schema.ts topic_058              # 특정 토픽 검사
 *   npx ts-node scripts/validate-topic-schema.ts --path topics/topic_058/topic_meta.json
 *
 * 함수 export: assertPhase(), assertHold(), validateTopicMeta()
 */

import fs from 'fs';
import path from 'path';

const CWD = process.cwd();
const TOPIC_PHASE_CATALOG_PATH = path.join(CWD, 'memory', 'shared', 'topic_phase_catalog.json');
const HOLD_REASONS_CATALOG_PATH = path.join(CWD, 'memory', 'shared', 'hold_reasons_catalog.json');
const TOPICS_DIR = path.join(CWD, 'topics');

interface TopicPhaseCatalog {
  phases: string[];
  aliases: Record<string, string>;
  deprecated: string[];
}

interface HoldReasonsCatalog {
  reasons: string[];
  aliases: Record<string, string>;
  deprecated: string[];
}

interface HoldState {
  heldAt: string;
  heldAtPhase: string | null;
  reason: string;
  note?: string;
}

interface TopicMeta {
  id?: string;
  phase?: string | null;
  hold?: HoldState | null;
  legacy?: boolean;
  [key: string]: unknown;
}

export interface TopicValidationResult {
  topicId: string;
  ok: boolean;
  errors: string[];
  warnings: string[];
}

function readJson(p: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function loadPhaseCatalog(): TopicPhaseCatalog {
  const raw = readJson(TOPIC_PHASE_CATALOG_PATH) as TopicPhaseCatalog | null;
  if (!raw?.phases) {
    throw new Error(`topic_phase_catalog.json 로드 실패: ${TOPIC_PHASE_CATALOG_PATH}`);
  }
  return raw;
}

function loadHoldReasonsCatalog(): HoldReasonsCatalog {
  const raw = readJson(HOLD_REASONS_CATALOG_PATH) as HoldReasonsCatalog | null;
  if (!raw?.reasons) {
    throw new Error(`hold_reasons_catalog.json 로드 실패: ${HOLD_REASONS_CATALOG_PATH}`);
  }
  return raw;
}

/**
 * phase 값이 catalog에서 허용된 값인지 검사.
 * phases ∪ aliases.keys() ∪ deprecated 모두 허용 (D-052 spec).
 * null은 legacy 토픽 허용값.
 */
export function assertPhase(value: string | null | undefined, catalog?: TopicPhaseCatalog): void {
  if (value === null || value === undefined) return;
  const c = catalog ?? loadPhaseCatalog();
  const validSet = new Set([...c.phases, ...Object.keys(c.aliases ?? {}), ...(c.deprecated ?? [])]);
  if (!validSet.has(value)) {
    throw new Error(`유효하지 않은 topic phase: "${value}". 허용값: ${[...validSet].join(', ')}`);
  }
}

/**
 * hold 객체가 catalog 규칙을 준수하는지 검사.
 * null은 active 상태 허용값.
 */
export function assertHold(hold: HoldState | null | undefined, catalog?: HoldReasonsCatalog): void {
  if (hold === null || hold === undefined) return;
  const c = catalog ?? loadHoldReasonsCatalog();
  const validSet = new Set([...c.reasons, ...Object.keys(c.aliases ?? {}), ...(c.deprecated ?? [])]);
  if (!hold.reason) {
    throw new Error('hold.reason 누락');
  }
  if (!validSet.has(hold.reason)) {
    throw new Error(`유효하지 않은 hold.reason: "${hold.reason}". 허용값: ${[...validSet].join(', ')}`);
  }
  if (!hold.heldAt) {
    throw new Error('hold.heldAt 누락 (ISO 8601 날짜 필요)');
  }
}

export function validateTopicMeta(topicId: string, meta: TopicMeta): TopicValidationResult {
  const result: TopicValidationResult = { topicId, ok: true, errors: [], warnings: [] };

  if (meta.legacy === true) {
    result.warnings.push('legacy:true — phase/hold 검증 스킵 (null 보장 권장)');
    if (meta.phase !== null && meta.phase !== undefined) {
      result.warnings.push(`legacy 토픽에 phase="${meta.phase}" 설정됨 — null 권장`);
    }
    return result;
  }

  try {
    const phaseCatalog = loadPhaseCatalog();
    assertPhase(meta.phase as string | null, phaseCatalog);
  } catch (e) {
    result.errors.push(String(e));
    result.ok = false;
  }

  try {
    const holdCatalog = loadHoldReasonsCatalog();
    assertHold(meta.hold as HoldState | null, holdCatalog);
  } catch (e) {
    result.errors.push(String(e));
    result.ok = false;
  }

  return result;
}

function printResult(r: TopicValidationResult): void {
  const status = r.ok ? '✓ OK' : '✗ FAIL';
  console.log(`\n[${status}] ${r.topicId}`);
  if (r.errors.length > 0) r.errors.forEach(e => console.log(`  ERROR: ${e}`));
  if (r.warnings.length > 0) r.warnings.forEach(w => console.log(`  WARN:  ${w}`));
}

function main(): void {
  const args = process.argv.slice(2);
  const results: TopicValidationResult[] = [];

  if (args.includes('--path')) {
    const idx = args.indexOf('--path');
    const filePath = args[idx + 1];
    if (!filePath) { console.error('--path 뒤에 파일 경로 필요'); process.exit(1); }
    const meta = readJson(path.resolve(CWD, filePath)) as TopicMeta | null;
    if (!meta) { console.error(`파일 읽기 실패: ${filePath}`); process.exit(1); }
    results.push(validateTopicMeta(meta.id ?? path.basename(path.dirname(filePath)), meta));
  } else if (args.length > 0 && !args[0]!.startsWith('--')) {
    const topicId = args[0] as string;
    const metaPath = path.join(TOPICS_DIR, topicId, 'topic_meta.json');
    const meta = readJson(metaPath) as TopicMeta | null;
    if (!meta) { console.error(`topic_meta.json 없음: ${metaPath}`); process.exit(1); }
    results.push(validateTopicMeta(topicId, meta));
  } else {
    if (!fs.existsSync(TOPICS_DIR)) {
      console.error(`topics/ 디렉토리 없음: ${TOPICS_DIR}`);
      process.exit(1);
    }
    const topicDirs = fs.readdirSync(TOPICS_DIR).filter(d =>
      fs.existsSync(path.join(TOPICS_DIR, d, 'topic_meta.json'))
    );
    for (const dir of topicDirs) {
      const meta = readJson(path.join(TOPICS_DIR, dir, 'topic_meta.json')) as TopicMeta | null;
      if (meta) results.push(validateTopicMeta(dir, meta));
    }
    if (results.length === 0) {
      console.log('검사할 topic_meta.json 없음');
      process.exit(0);
    }
  }

  results.forEach(printResult);
  const failCount = results.filter(r => !r.ok).length;
  console.log(`\n총 ${results.length}개 토픽 검사 — OK: ${results.length - failCount}, FAIL: ${failCount}`);
  process.exit(failCount > 0 ? 1 : 0);
}

if (require.main === module) {
  main();
}
