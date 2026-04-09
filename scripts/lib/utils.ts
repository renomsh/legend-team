/**
 * lib/utils.ts — shared utilities for legend-team scripts
 * Centralizes readJson, writeJson, appendLog, nextId
 */

import * as fs from 'fs';
import * as path from 'path';

export const ROOT = path.resolve(__dirname, '..', '..');

const APP_LOG = path.join(ROOT, 'logs', 'app.log');

export function readJson<T>(absPath: string, fallback: T): T {
  if (!fs.existsSync(absPath)) return fallback;
  const raw = fs.readFileSync(absPath, 'utf8').trim();
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}

export function writeJson(absPath: string, content: unknown): void {
  fs.writeFileSync(absPath, JSON.stringify(content, null, 2) + '\n', 'utf8');
}

export function appendLog(context: string, message: string): void {
  const line = `[${new Date().toISOString()}] [${context}] ${message}\n`;
  fs.appendFileSync(APP_LOG, line, 'utf8');
}

/**
 * Generate next sequential ID from a list of entries with `id` field.
 * @param entries - array of objects with `id` string field
 * @param prefix - e.g. 'MF-', 'E-', 'session_'
 */
export function nextId(entries: Array<{ id: string }>, prefix: string): string {
  const nums = entries
    .map(e => parseInt(e.id.replace(prefix, ''), 10))
    .filter(n => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `${prefix}${String(next).padStart(3, '0')}`;
}
