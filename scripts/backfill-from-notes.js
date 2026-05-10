#!/usr/bin/env ts-node
"use strict";
/**
 * backfill-from-notes.ts
 * session_index.json의 각 세션 note 텍스트를 파싱하여
 * 누락된 역할(특히 Nova)을 agentsCompleted에 보강한다.
 *
 * 부정 문맥 제외: "미호출", "안 채택", "미참여", "Nova 없음"
 *
 * 사용법: ts-node scripts/backfill-from-notes.ts [--dry-run]
 */
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
const SESSION_INDEX_PATH = path.join(ROOT, 'memory', 'sessions', 'session_index.json');
// 한글 패턴 제거 — "아키"가 "아키텍처"로 오인되는 등 false positive 발생.
// note는 영문 역할명을 일관되게 사용하므로 영문 word boundary로 충분.
const ROLE_PATTERNS = [
    { name: 'ace', regex: /\bAce\b/ },
    { name: 'arki', regex: /\bArki\b/ },
    { name: 'fin', regex: /\bFin\b/ },
    { name: 'riki', regex: /\bRiki\b/ },
    { name: 'nova', regex: /\bNova\b/ },
    { name: 'edi', regex: /\b(Edi|Editor)\b/ },
    { name: 'vera', regex: /\bVera\b/ },
    { name: 'dev', regex: /\bDev\b/ },
];
// 부정 문맥: "Nova 미호출", "Arki 안 채택" 등
function isNegated(note, role) {
    const lower = note.toLowerCase();
    const idx = lower.indexOf(role.toLowerCase());
    if (idx < 0)
        return false;
    // role 등장 위치 ±15자 내 부정어 검색
    const window = note.slice(Math.max(0, idx - 15), Math.min(note.length, idx + role.length + 15));
    return /미호출|안\s*채택|미참여|없음|제외|미사용/.test(window);
}
function main() {
    const dryRun = process.argv.includes('--dry-run');
    if (dryRun)
        console.log('🔍 Dry-run 모드\n');
    const data = JSON.parse(fs.readFileSync(SESSION_INDEX_PATH, 'utf8'));
    let updated = 0;
    for (const s of data.sessions) {
        if (!s.note)
            continue;
        const detected = [];
        for (const { name, regex } of ROLE_PATTERNS) {
            if (regex.test(s.note) && !isNegated(s.note, name)) {
                detected.push(name);
            }
        }
        if (detected.length === 0)
            continue;
        // 기존 agentsCompleted (case 정규화)와 병합
        const existing = new Set((s.agentsCompleted ?? []).map(r => r.toLowerCase()));
        const added = detected.filter(r => !existing.has(r));
        if (added.length === 0)
            continue;
        const merged = Array.from(new Set([...(s.agentsCompleted ?? []).map(r => r.toLowerCase()), ...detected]));
        console.log(`✅ ${s.sessionId}: +[${added.join(', ')}] → [${merged.join(', ')}]`);
        if (!dryRun)
            s.agentsCompleted = merged;
        updated++;
    }
    if (!dryRun) {
        data.lastUpdated = new Date().toISOString();
        fs.writeFileSync(SESSION_INDEX_PATH, JSON.stringify(data, null, 2), 'utf8');
        JSON.parse(fs.readFileSync(SESSION_INDEX_PATH, 'utf8'));
        console.log(`\n✅ ${updated}개 세션 업데이트`);
    }
    else {
        console.log(`\n🔍 ${updated}개 세션 업데이트 예정`);
    }
}
main();
//# sourceMappingURL=backfill-from-notes.js.map