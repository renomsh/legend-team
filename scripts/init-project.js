"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ROOT = path.resolve(__dirname, '..');
// Folders that must exist for the system to operate
const REQUIRED_FOLDERS = [
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
const BASE_FILES = [
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
function ensureFolder(relPath) {
    const abs = path.join(ROOT, relPath);
    const existed = fs.existsSync(abs);
    if (!existed) {
        fs.mkdirSync(abs, { recursive: true });
    }
    return { relPath, created: !existed };
}
function seedFile(relPath, content) {
    const abs = path.join(ROOT, relPath);
    const existsWithContent = fs.existsSync(abs) && fs.readFileSync(abs, 'utf8').trim().length > 0;
    if (!existsWithContent) {
        fs.writeFileSync(abs, JSON.stringify(content, null, 2) + '\n', 'utf8');
    }
    return { relPath, created: !existsWithContent };
}
function run() {
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
//# sourceMappingURL=init-project.js.map