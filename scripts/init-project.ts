import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');

// Folders that must exist for the system to operate
const REQUIRED_FOLDERS: string[] = [
  'topics',
  'memory/shared',
  'memory/master',
  'memory/roles',
  'memory/sessions',
  'logs',
  'agents',
  'config',
  'reports',
  'scripts',
  'src/types',
];

// Base JSON files seeded with safe starter content (only written if absent or empty)
const BASE_FILES: Array<{ relPath: string; content: unknown }> = [
  {
    relPath: 'memory/shared/topic_index.json',
    content: { topics: [], lastUpdated: new Date().toISOString() },
  },
  {
    relPath: 'memory/shared/decision_ledger.json',
    content: { decisions: [] },
  },
  {
    relPath: 'memory/shared/evidence_index.json',
    content: { evidence: [] },
  },
  {
    relPath: 'memory/master/master_feedback_log.json',
    content: { feedbackLog: [] },
  },
  {
    relPath: 'memory/sessions/session_index.json',
    content: { sessions: [], lastUpdated: new Date().toISOString() },
  },
  {
    relPath: 'memory/shared/glossary.json',
    content: { terms: [], lastUpdated: new Date().toISOString() },
  },
  {
    relPath: 'memory/shared/project_charter.json',
    content: {},
  },
];

interface FolderResult {
  relPath: string;
  created: boolean;
}

interface FileResult {
  relPath: string;
  created: boolean;
}

function ensureFolder(relPath: string): FolderResult {
  const abs = path.join(ROOT, relPath);
  const existed = fs.existsSync(abs);
  if (!existed) {
    fs.mkdirSync(abs, { recursive: true });
  }
  return { relPath, created: !existed };
}

function seedFile(relPath: string, content: unknown): FileResult {
  const abs = path.join(ROOT, relPath);
  const existsWithContent =
    fs.existsSync(abs) && fs.readFileSync(abs, 'utf8').trim().length > 0;
  if (!existsWithContent) {
    fs.writeFileSync(abs, JSON.stringify(content, null, 2) + '\n', 'utf8');
  }
  return { relPath, created: !existsWithContent };
}

function run(): void {
  console.log('legend-team: init-project');
  console.log(`root: ${ROOT}\n`);

  const folderResults = REQUIRED_FOLDERS.map(ensureFolder);
  const fileResults = BASE_FILES.map(f => seedFile(f.relPath, f.content));

  const createdFolders = folderResults.filter(r => r.created);
  const presentFolders = folderResults.filter(r => !r.created);
  const createdFiles = fileResults.filter(r => r.created);
  const presentFiles = fileResults.filter(r => !r.created);

  if (createdFolders.length > 0) {
    console.log('Folders created:');
    createdFolders.forEach(r => console.log(`  + ${r.relPath}`));
  }
  if (presentFolders.length > 0) {
    console.log('Folders already present:');
    presentFolders.forEach(r => console.log(`  . ${r.relPath}`));
  }

  console.log('');

  if (createdFiles.length > 0) {
    console.log('Files seeded:');
    createdFiles.forEach(r => console.log(`  + ${r.relPath}`));
  }
  if (presentFiles.length > 0) {
    console.log('Files already present (not overwritten):');
    presentFiles.forEach(r => console.log(`  . ${r.relPath}`));
  }

  console.log('\nInit complete.');
}

run();
