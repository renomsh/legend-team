/**
 * Auto-push script for Legend Team
 * Called at session end to commit and push changes to GitHub
 *
 * Usage: node scripts/auto-push.js [commit-message]
 * Default message: "session update: {date}"
 */

const { execSync } = require('child_process');
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

function autoPush() {
  const message = process.argv[2] || `session update: ${new Date().toISOString().split('T')[0]}`;

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
  const paths = ['memory/', 'reports/', 'app/', 'scripts/', 'CLAUDE.md', 'logs/'];
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

    // Merge from the main repo's working directory (where main is checked out)
    try {
      execSync(`git merge ${currentBranch} --ff-only`, {
        cwd: mainRoot, encoding: 'utf8', stdio: 'pipe'
      });
      console.log(`[auto-push] Merged ${currentBranch} into main.`);
    } catch (e) {
      console.error(`[auto-push] Fast-forward merge failed. Manual merge required.`);
      console.error(e.stderr || e.message);
      return;
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
