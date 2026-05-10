#!/usr/bin/env ts-node
"use strict";
/**
 * backfill-agents.ts
 * topic_index.json의 reportFiles에서 역할명을 추출하여
 * session_index.json 엔트리에 agentsCompleted를 소급 주입.
 *
 * 파일명 규칙: {role}_rev{n}.md → role 추출
 * 데이터 품질: 'backfill' (참여 여부만, 발화 순서/재호출 정보 없음)
 *
 * 사용법: ts-node scripts/backfill-agents.ts [--dry-run]
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
const TOPIC_INDEX_PATH = path.join(ROOT, 'memory', 'shared', 'topic_index.json');
const KNOWN_ROLES = new Set(['ace', 'arki', 'fin', 'riki', 'nova', 'edi', 'vera', 'dev']);
function extractRolesFromReportFiles(reportFiles) {
    const roles = [];
    for (const f of reportFiles) {
        const match = f.match(/^([a-z\-]+)_rev/);
        if (match && match[1]) {
            const role = match[1].replace('-', '');
            // ace-review → ace
            const normalized = role === 'acereview' ? 'ace' : role;
            if (KNOWN_ROLES.has(normalized) && !roles.includes(normalized)) {
                roles.push(normalized);
            }
        }
    }
    return roles;
}
function main() {
    const dryRun = process.argv.includes('--dry-run');
    if (dryRun)
        console.log('🔍 Dry-run 모드 — 파일 수정 없음\n');
    const sessionIndex = JSON.parse(fs.readFileSync(SESSION_INDEX_PATH, 'utf8'));
    const topicIndex = JSON.parse(fs.readFileSync(TOPIC_INDEX_PATH, 'utf8'));
    // topicSlug → reportFiles 맵 구성
    const slugToFiles = new Map();
    for (const t of topicIndex.topics) {
        if (t.reportPath && t.reportFiles && t.reportFiles.length > 0) {
            // reportPath 마지막 세그먼트가 topicSlug와 유사
            const slug = t.reportPath.replace(/^.*\/\d{4}-\d{2}-\d{2}_/, '');
            if (slug)
                slugToFiles.set(slug, t.reportFiles);
            // topicSlug 직접 저장도 시도
            if (t.topicSlug)
                slugToFiles.set(t.topicSlug, t.reportFiles);
        }
    }
    let updated = 0;
    let skipped = 0;
    for (const session of sessionIndex.sessions) {
        // 이미 agentsCompleted가 있으면 건너뜀
        if (session.agentsCompleted && session.agentsCompleted.length > 0) {
            skipped++;
            continue;
        }
        const files = slugToFiles.get(session.topicSlug);
        if (!files || files.length === 0) {
            console.log(`⚠️  ${session.sessionId} (${session.topicSlug}): reportFiles 없음 — 스킵`);
            skipped++;
            continue;
        }
        const roles = extractRolesFromReportFiles(files);
        if (roles.length === 0) {
            console.log(`⚠️  ${session.sessionId}: 역할 추출 실패 (files: ${files.join(', ')})`);
            skipped++;
            continue;
        }
        console.log(`✅ ${session.sessionId} (${session.topicSlug}): [${roles.join(', ')}]`);
        if (!dryRun) {
            session.agentsCompleted = roles;
        }
        updated++;
    }
    if (!dryRun) {
        sessionIndex.lastUpdated = new Date().toISOString();
        fs.writeFileSync(SESSION_INDEX_PATH, JSON.stringify(sessionIndex, null, 2), 'utf8');
        // 검증
        JSON.parse(fs.readFileSync(SESSION_INDEX_PATH, 'utf8'));
        console.log(`\n✅ backfill 완료: ${updated}개 업데이트, ${skipped}개 스킵`);
        console.log('⚠️  데이터 품질 주의: backfill 데이터는 참여 여부만 반영 (발화 순서/재호출 정보 없음)');
    }
    else {
        console.log(`\n🔍 Dry-run 결과: ${updated}개 업데이트 예정, ${skipped}개 스킵`);
    }
}
main();
//# sourceMappingURL=backfill-agents.js.map