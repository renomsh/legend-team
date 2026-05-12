/**
 * Auto-push script for Legend Nexus
 * Called at session end to commit and push changes to GitHub
 *
 * Usage: node scripts/auto-push.js [commit-message]
 * Default message: "session update: {date}"
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// PD-073 / optionA: reduce ts-node cold start for subprocess calls
process.env.TS_NODE_TRANSPILE_ONLY = '1';

const ROOT = path.resolve(__dirname, '..');

const TIMING_LOG = path.join(ROOT, 'logs', 'close-timing.log');
const __timings = [];
function timed(label, fn) {
  const t0 = Date.now();
  let ok = true;
  let err;
  try {
    return fn();
  } catch (e) {
    ok = false;
    err = e;
    throw e;
  } finally {
    const ms = Date.now() - t0;
    __timings.push({ label, ms, ok });
    console.log(`[auto-push:timing] ${label}: ${ms}ms${ok ? '' : ' (FAILED)'}`);
  }
}
function flushTimings() {
  try {
    fs.mkdirSync(path.dirname(TIMING_LOG), { recursive: true });
    const total = __timings.reduce((a, t) => a + t.ms, 0);
    const entry = {
      ts: new Date().toISOString(),
      total_ms: total,
      steps: __timings.slice(),
    };
    fs.appendFileSync(TIMING_LOG, JSON.stringify(entry) + '\n', 'utf8');
    console.log(`[auto-push:timing] TOTAL: ${total}ms (logged → logs/close-timing.log)`);
  } catch (e) {
    console.error('[auto-push:timing] flush failed:', e.message);
  }
}
process.on('exit', flushTimings);

function run(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' });
  } catch (e) {
    console.error(`[auto-push] Command failed: ${cmd}`);
    console.error(e.stderr || e.message);
    return null;
  }
}

function getCurrentBranch() {
  const branch = run('git rev-parse --abbrev-ref HEAD');
  return branch ? branch.trim() : null;
}

function getMainRepoRoot() {
  // In a worktree, find the main repo's working directory
  const commonDir = run('git rev-parse --git-common-dir');
  if (!commonDir) return null;
  const resolved = path.resolve(ROOT, commonDir.trim());
  // .git/worktrees/xxx -> go up to .git, then up to repo root
  if (resolved.includes('worktrees')) {
    return path.resolve(resolved, '..', '..');
  }
  // Already in main repo (.git)
  return path.resolve(resolved, '..');
}

// syncClaudeDir 제거 (PD-086, 2026-05-12)
// .claude/ 변경은 워크트리 commit → merge로 main에 전파됨.
// main 워킹디렉토리 직접 write 경로 제거 — D-187 commit 차단과 정합.

const STATE_PATH_IN_MAIN = (mainRoot) => path.join(mainRoot, 'memory', 'shared', 'system_state.json');

function writeMergeFailureAlert(mainRoot, branch, message) {
  try {
    const p = STATE_PATH_IN_MAIN(mainRoot);
    if (!fs.existsSync(p)) return;
    const state = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (!Array.isArray(state.worktreeMergeFailures)) state.worktreeMergeFailures = [];
    if (!state.worktreeMergeFailures.some(f => f.branch === branch)) {
      state.worktreeMergeFailures.push({
        branch,
        detectedAt: new Date().toISOString(),
        message: String(message).slice(0, 300),
      });
      state.lastUpdated = new Date().toISOString();
      fs.writeFileSync(p, JSON.stringify(state, null, 2) + '\n', 'utf8');
      console.error(`[auto-push] ⚠ merge 실패 경보 기록 → system_state.worktreeMergeFailures (${branch})`);
    }
  } catch (e) {
    console.error('[auto-push] merge 실패 경보 기록 오류:', e.message);
  }
}

function clearMergeFailureAlert(mainRoot, branch) {
  try {
    const p = STATE_PATH_IN_MAIN(mainRoot);
    if (!fs.existsSync(p)) return;
    const state = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (!Array.isArray(state.worktreeMergeFailures)) return;
    const before = state.worktreeMergeFailures.length;
    state.worktreeMergeFailures = state.worktreeMergeFailures.filter(f => f.branch !== branch);
    if (state.worktreeMergeFailures.length < before) {
      state.lastUpdated = new Date().toISOString();
      fs.writeFileSync(p, JSON.stringify(state, null, 2) + '\n', 'utf8');
    }
  } catch (e) {
    console.error('[auto-push] merge 경보 해제 오류:', e.message);
  }
}

// syncHookDiagnosticsFromMain 제거 (PD-086, 2026-05-12)
// session-end-tokens.js의 main-write 경로 제거(cwd guard)로 main 측 hook-diagnostics 생성 차단.
// build.js는 hook-diagnostics 미참조 — 제거 안전.

function runHookChain(mainRoot) {
  // PD-073: register ts-node once for in-process requires
  // skipProject/ignoreDeprecations: bypass TS5011/TS5107 from tsconfig rootDir+include combination
  try {
    require('ts-node').register({
      transpileOnly: true,
      skipProject: true,
      compilerOptions: {
        module: 'commonjs',
        target: 'es2020',
        esModuleInterop: true,
        skipLibCheck: true,
        ignoreDeprecations: '6.0',
      },
    });
  } catch (_e) {}

  function ip(label, fn) { return { label, fn }; }

  const preSteps = [
    'node .claude/hooks/session-end-tokens.js',
    'node .claude/hooks/session-end-finalize.js',
    ip('npx ts-node scripts/finalize-self-scores.ts', () => {
      require(path.join(ROOT, 'scripts/finalize-self-scores.ts')).finalize();
    }),
    ip('npx ts-node scripts/compute-signature-metrics.ts', () => {
      require(path.join(ROOT, 'scripts/compute-signature-metrics.ts')).compute();
    }),
    ip('npx ts-node scripts/compute-dashboard.ts', () => {
      require(path.join(ROOT, 'scripts/compute-dashboard.ts')).main();
    }),
    ip('npx ts-node scripts/validate-prime-directive.ts', () => {
      const { validate } = require(path.join(ROOT, 'scripts/validate-prime-directive.ts'));
      const result = validate();
      if (!result.ok) throw new Error(`[validate-prime-directive] ${result.message}`);
      console.log(`[validate-prime-directive] OK (${result.actual.substring(0, 12)}...)`);
    }),
  ];
  // C2 (session_242): preSteps try/catch 격리 — best-effort. 한 단계 실패해도 후속 진행.
  // 실패 누적 후 끝에 current_session.json gaps 박제.
  const stepFailures = [];
  for (const step of preSteps) {
    const label = typeof step === 'string' ? step : step.label;
    const fn = typeof step === 'string' ? () => execSync(step, { cwd: ROOT, stdio: 'inherit', env: { ...process.env, TS_NODE_TRANSPILE_ONLY: '1' } }) : step.fn;
    try {
      timed(label, fn);
    } catch (e) {
      console.error(`[auto-push] Hook chain step failed: ${label}`);
      console.error(e.message);
      stepFailures.push({ label, message: String(e && e.message || e) });
    }
  }
  if (stepFailures.length > 0) {
    console.error(`[auto-push] ${stepFailures.length}/${preSteps.length} preSteps failed (continuing best-effort).`);
    try {
      const sessPath = path.join(ROOT, 'memory', 'sessions', 'current_session.json');
      const raw = fs.readFileSync(sessPath, 'utf8');
      const sess = JSON.parse(raw);
      if (!Array.isArray(sess.gaps)) sess.gaps = [];
      for (const f of stepFailures) {
        sess.gaps.push({
          type: 'hook-chain-step-failed',
          severity: 'high',
          label: f.label,
          message: f.message,
          addedBy: 'auto-push.runHookChain',
          addedAt: new Date().toISOString(),
        });
      }
      fs.writeFileSync(sessPath, JSON.stringify(sess, null, 2) + '\n', 'utf8');
    } catch (gapErr) {
      console.error('[auto-push] Failed to record gaps:', gapErr.message);
    }
  }
  try {
    timed('node scripts/build.js', () => execSync('node scripts/build.js', { cwd: ROOT, stdio: 'inherit' }));
  } catch (e) {
    console.error('[auto-push] Hook chain step failed: node scripts/build.js');
    console.error(e.message);
    return false;
  }
  return true;
}

function autoPush() {
  const message = process.argv[2] || `session update: ${new Date().toISOString().split('T')[0]}`;
  const mainRoot = getMainRepoRoot();

  console.log('[auto-push] Running hook chain (finalize → compute → build)...');
  if (!timed('runHookChain(total)', () => runHookChain(mainRoot))) {
    console.error('[auto-push] Aborting: hook chain failed.');
    process.exit(1);
  }

  console.log('[auto-push] Checking for changes...');

  // Check if there are changes
  const status = timed('git status', () => run('git status --porcelain'));
  if (!status || status.trim() === '') {
    console.log('[auto-push] No changes to push.');
    return;
  }

  console.log('[auto-push] Changes detected:');
  console.log(status);

  // Stage all tracked + new files (memory, reports, app, scripts)
  const paths = ['memory/', 'reports/', 'app/', 'scripts/', 'CLAUDE.md', 'logs/', '.claude/'];
  timed('git add (all paths)', () => {
    for (const p of paths) {
      run(`git add "${p}"`);
    }
  });

  // Commit
  const commitResult = timed('git commit', () => run(`git commit -m "${message}"`));
  if (!commitResult) {
    console.log('[auto-push] Nothing to commit or commit failed.');
    return;
  }
  console.log('[auto-push] Committed:', message);

  const currentBranch = getCurrentBranch();
  console.log(`[auto-push] Current branch: ${currentBranch}`);

  if (currentBranch && currentBranch !== 'main') {
    // Running in a worktree — merge into main before pushing
    console.log(`[auto-push] Worktree detected. Merging ${currentBranch} → main...`);

    if (!mainRoot) {
      console.error('[auto-push] Could not resolve main repo root. Manual merge required.');
      return;
    }

    // .claude/ 변경은 워크트리 commit → merge로 main에 전파됨.
    // syncClaudeDir 제거됨 (PD-086) — main 워킹디렉토리 직접 write 차단.

    // Merge from the main repo's working directory (where main is checked out)
    let mergeOk = false;
    try {
      timed('git merge --ff-only', () => execSync(`git merge ${currentBranch} --ff-only`, {
        cwd: mainRoot, encoding: 'utf8', stdio: 'pipe'
      }));
      console.log(`[auto-push] Merged ${currentBranch} into main.`);
      mergeOk = true;
    } catch {
      // ff 불가(sync commit으로 diverged) → --no-ff로 재시도
      try {
        timed('git merge --no-ff', () => execSync(`git merge ${currentBranch} --no-ff -m "merge: ${currentBranch}"`, {
          cwd: mainRoot, encoding: 'utf8', stdio: 'pipe'
        }));
        console.log(`[auto-push] Merged ${currentBranch} into main (no-ff).`);
        mergeOk = true;
      } catch (e2) {
        console.error(`[auto-push] Merge failed. Manual merge required.`);
        console.error(e2.stderr || e2.message);
        writeMergeFailureAlert(mainRoot, currentBranch, e2.stderr || e2.message || 'merge failed');
        return;
      }
    }

    // 머지 성공 시 이전 실패 경보 해제
    if (mergeOk) clearMergeFailureAlert(mainRoot, currentBranch);

    // Push main from the main repo root
    try {
      timed('git push origin main (worktree)', () => execSync('git push origin main', {
        cwd: mainRoot, encoding: 'utf8', stdio: 'pipe'
      }));
      console.log('[auto-push] Pushed main to origin successfully.');
    } catch (e) {
      console.error('[auto-push] Push failed. Manual push required.');
      console.error(e.stderr || e.message);
    }
  } else {
    // On main — push directly
    const pushResult = timed('git push origin main', () => run('git push origin main'));
    if (pushResult !== null) {
      console.log('[auto-push] Pushed to origin successfully.');
    } else {
      console.error('[auto-push] Push failed. Manual push required.');
    }
  }
}

autoPush();
