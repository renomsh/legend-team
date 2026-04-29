/**
 * Auto-push script for Legend Team
 * Called at session end to commit and push changes to GitHub
 *
 * Usage: node scripts/auto-push.js [commit-message]
 * Default message: "session update: {date}"
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

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

function syncClaudeDir(mainRoot) {
  // 워크트리 안의 .claude/ → main repo .claude/ 동기화
  // 워크트리가 아닌 경우(ROOT === mainRoot) 스킵
  if (!mainRoot || path.resolve(mainRoot) === path.resolve(ROOT)) return;

  const src = path.join(ROOT, '.claude');
  const dst = path.join(mainRoot, '.claude');
  if (!fs.existsSync(src)) return;

  function copyDir(s, d) {
    fs.mkdirSync(d, { recursive: true });
    for (const entry of fs.readdirSync(s, { withFileTypes: true })) {
      // worktrees/, scratch/ 하위는 복사 금지
      if (entry.name === 'worktrees' || entry.name === 'scratch') continue;
      const sp = path.join(s, entry.name);
      const dp = path.join(d, entry.name);
      if (entry.isDirectory()) {
        copyDir(sp, dp);
      } else {
        fs.copyFileSync(sp, dp);
      }
    }
  }

  copyDir(src, dst);
  console.log('[auto-push] Synced .claude/ worktree → main repo');
}

function runHookChain() {
  const steps = [
    'node .claude/hooks/session-end-tokens.js',
    'node .claude/hooks/session-end-finalize.js',
    'npx ts-node scripts/finalize-self-scores.ts',
    'npx ts-node scripts/compute-signature-metrics.ts',
    'npx ts-node scripts/compute-dashboard.ts',
    'npx ts-node scripts/validate-prime-directive.ts',
    'node scripts/build.js',
  ];
  for (const cmd of steps) {
    try {
      execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
    } catch (e) {
      console.error(`[auto-push] Hook chain step failed: ${cmd}`);
      console.error(e.message);
      return false;
    }
  }
  return true;
}

function autoPush() {
  const message = process.argv[2] || `session update: ${new Date().toISOString().split('T')[0]}`;

  console.log('[auto-push] Running hook chain (finalize → compute → build)...');
  if (!runHookChain()) {
    console.error('[auto-push] Aborting: hook chain failed.');
    process.exit(1);
  }

  console.log('[auto-push] Checking for changes...');

  // Check if there are changes
  const status = run('git status --porcelain');
  if (!status || status.trim() === '') {
    console.log('[auto-push] No changes to push.');
    return;
  }

  console.log('[auto-push] Changes detected:');
  console.log(status);

  // Stage all tracked + new files (memory, reports, app, scripts)
  const paths = ['memory/', 'reports/', 'app/', 'scripts/', 'CLAUDE.md', 'logs/', 'dist/', '.claude/'];
  for (const p of paths) {
    run(`git add "${p}"`);
  }

  // Commit
  const commitResult = run(`git commit -m "${message}"`);
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

    const mainRoot = getMainRepoRoot();
    if (!mainRoot) {
      console.error('[auto-push] Could not resolve main repo root. Manual merge required.');
      return;
    }

    // .claude/ 동기화 후 main repo에서 add + commit (변경분 있을 때만)
    syncClaudeDir(mainRoot);
    try {
      execSync('git add .claude/', { cwd: mainRoot, encoding: 'utf8', stdio: 'pipe' });
      execSync(`git commit -m "sync: .claude from worktree ${currentBranch}"`, {
        cwd: mainRoot, encoding: 'utf8', stdio: 'pipe'
      });
      console.log('[auto-push] Committed .claude/ sync to main.');
    } catch {
      // 변경 없으면 commit 실패 — 정상
    }

    // Merge from the main repo's working directory (where main is checked out)
    try {
      execSync(`git merge ${currentBranch} --ff-only`, {
        cwd: mainRoot, encoding: 'utf8', stdio: 'pipe'
      });
      console.log(`[auto-push] Merged ${currentBranch} into main.`);
    } catch {
      // ff 불가(sync commit으로 diverged) → --no-ff로 재시도
      try {
        execSync(`git merge ${currentBranch} --no-ff -m "merge: ${currentBranch}"`, {
          cwd: mainRoot, encoding: 'utf8', stdio: 'pipe'
        });
        console.log(`[auto-push] Merged ${currentBranch} into main (no-ff).`);
      } catch (e2) {
        console.error(`[auto-push] Merge failed. Manual merge required.`);
        console.error(e2.stderr || e2.message);
        return;
      }
    }

    // Push main from the main repo root
    try {
      execSync('git push origin main', {
        cwd: mainRoot, encoding: 'utf8', stdio: 'pipe'
      });
      console.log('[auto-push] Pushed main to origin successfully.');
    } catch (e) {
      console.error('[auto-push] Push failed. Manual push required.');
      console.error(e.stderr || e.message);
    }
  } else {
    // On main — push directly
    const pushResult = run('git push origin main');
    if (pushResult !== null) {
      console.log('[auto-push] Pushed to origin successfully.');
    } else {
      console.error('[auto-push] Push failed. Manual push required.');
    }
  }
}

autoPush();
