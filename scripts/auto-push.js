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

  // Push
  const pushResult = run('git push origin');
  if (pushResult !== null) {
    console.log('[auto-push] Pushed to origin successfully.');
  } else {
    console.error('[auto-push] Push failed. Manual push required.');
  }
}

autoPush();
