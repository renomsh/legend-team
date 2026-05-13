/**
 * m-config.ts — PD-079 / D-181 Phase 4
 *
 * m_config.json read helper. 임계값·regex 패턴 단일 출처(SOT) 접근.
 * D4 박제: 코드 내 임계값/패턴 리터럴 금지 — 본 모듈 경유.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ROOT } from './utils';

export interface MConfig {
  similarity: {
    previewThreshold: number;
    dedupeThreshold: number;
  };
  migration: {
    mode: string;
  };
  idPatterns: {
    decision: string;
    pendingDeferral: string;
  };
  version: string;
}

const CONFIG_PATH = path.join(ROOT, 'memory', 'shared', 'm_config.json');

let cached: MConfig | null = null;

export function getMConfig(forceReload = false): MConfig {
  if (cached && !forceReload) return cached;
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(`m_config.json not found: ${CONFIG_PATH}`);
  }
  const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
  const parsed = JSON.parse(raw) as MConfig;
  if (
    typeof parsed?.similarity?.previewThreshold !== 'number' ||
    typeof parsed?.similarity?.dedupeThreshold !== 'number' ||
    typeof parsed?.idPatterns?.decision !== 'string' ||
    typeof parsed?.idPatterns?.pendingDeferral !== 'string'
  ) {
    throw new Error('m_config.json: 필수 필드 누락 또는 타입 오류');
  }
  cached = parsed;
  return parsed;
}

export function resetMConfigCache(): void {
  cached = null;
}

if (require.main === module) {
  console.log(JSON.stringify(getMConfig(), null, 2));
}
