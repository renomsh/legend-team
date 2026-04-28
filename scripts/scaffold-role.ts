#!/usr/bin/env ts-node
/**
 * scaffold-role.ts — 8역할 페르소나 레이어 inject 100% 검증 (G3 게이트).
 *
 * buildPersonaLayer() 동작을 시뮬레이션:
 *   1. _common.md 존재 확인
 *   2. policies/role-{r}.md 존재 확인 (없으면 WARN — P3 완료 기준 필수)
 *   3. personas/role-{r}.md 존재 확인 (없으면 FAIL — PERSONA_INJECT_FAILED 발생 경로)
 *   4. 파일 존재 시 PERSONA_OVER_CAP 마커 없음 확인
 *
 * 종료 코드: 0=PASS, 1=FAIL
 */

import * as fs from 'fs';
import * as path from 'path';

const CWD = process.cwd();
const ROLES = ['ace', 'arki', 'fin', 'riki', 'nova', 'dev', 'edi', 'vera'];
const PERSONAS_DIR = path.join(CWD, 'memory', 'roles', 'personas');
const POLICIES_DIR = path.join(CWD, 'memory', 'roles', 'policies');
const COMMON_PATH = path.join(POLICIES_DIR, '_common.md');
const COMMON_CAP_LINES = 100;

interface RoleResult {
  role: string;
  commonOk: boolean;
  personaExists: boolean;
  policyExists: boolean;
  overCapMarker: boolean;
  pass: boolean;
}

function checkCommon(): { exists: boolean; lineCount: number } {
  if (!fs.existsSync(COMMON_PATH)) return { exists: false, lineCount: 0 };
  const lines = fs.readFileSync(COMMON_PATH, 'utf8').split('\n').length;
  return { exists: true, lineCount: lines };
}

function checkRole(role: string): RoleResult {
  const personaPath = path.join(PERSONAS_DIR, `role-${role}.md`);
  const policyPath = path.join(POLICIES_DIR, `role-${role}.md`);

  const personaExists = fs.existsSync(personaPath);
  const policyExists = fs.existsSync(policyPath);

  let overCapMarker = false;
  if (personaExists) {
    const content = fs.readFileSync(personaPath, 'utf8');
    overCapMarker = content.includes('⚠ PERSONA_OVER_CAP');
  }

  const pass = personaExists && policyExists && !overCapMarker;

  return {
    role,
    commonOk: true,
    personaExists,
    policyExists,
    overCapMarker,
    pass,
  };
}

function main() {
  console.log('[scaffold-role] G3 게이트 검증 시작\n');

  // _common.md 점검
  const common = checkCommon();
  if (!common.exists) {
    console.error('[FAIL] _common.md 없음 — 공통 정책 누락');
    process.exit(1);
  }
  const capStatus = common.lineCount > COMMON_CAP_LINES ? `⚠ CAP 초과 (${common.lineCount}줄 > ${COMMON_CAP_LINES})` : `OK (${common.lineCount}줄)`;
  console.log(`  _common.md : ${capStatus}`);

  // 역할별 점검
  let allPass = true;
  const results: RoleResult[] = [];

  for (const role of ROLES) {
    const r = checkRole(role);
    results.push(r);
    if (!r.pass) allPass = false;
  }

  console.log('\n  역할별 결과:');
  console.log('  ' + '-'.repeat(60));
  for (const r of results) {
    const persona = r.personaExists ? '✅ persona' : '❌ persona MISSING';
    const policy  = r.policyExists  ? '✅ policy'  : '⚠  policy MISSING';
    const cap     = r.overCapMarker ? ' ❌ PERSONA_OVER_CAP' : '';
    const status  = r.pass ? '[PASS]' : '[FAIL]';
    console.log(`  ${status} ${r.role.padEnd(8)} | ${persona} | ${policy}${cap}`);
  }

  console.log('\n' + '='.repeat(62));

  if (common.lineCount > COMMON_CAP_LINES) {
    console.warn(`⚠ _common.md ${common.lineCount}줄 — 100줄 cap 초과. gaps에 박제 권고.`);
    allPass = false;
  }

  if (allPass) {
    console.log('[scaffold-role] G3 PASS — 8역할 inject 100% 검증 완료');
    process.exit(0);
  } else {
    const failedRoles = results.filter(r => !r.pass).map(r => r.role).join(', ');
    console.error(`[scaffold-role] G3 FAIL — 미완성 역할: ${failedRoles}`);
    process.exit(1);
  }
}

main();
