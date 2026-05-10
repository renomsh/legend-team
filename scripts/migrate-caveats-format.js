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
/**
 * scripts/migrate-caveats-format.ts (D-145, topic_145, session_168)
 *
 * 목적:
 *   PD-056 본체 구현 Phase 0 — caveats 형식 통일 + caveatsMeta 5필드 entry-level 부착.
 *   - caveats: string → string[] 통일 (D-141은 이미 array, 무손실 보존)
 *   - caveatsMeta {acked, ackedBySession, ackedAt, resolvedAt, resolvedBySession} 부여
 *
 * 사용:
 *   ts-node scripts/migrate-caveats-format.ts          # dry-run (변경 미반영)
 *   ts-node scripts/migrate-caveats-format.ts --apply  # 실제 반영
 *
 * 멱등성: 이미 caveatsMeta 부여된 entry는 skip. 재실행 시 idempotent.
 */
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const LEDGER_PATH = path.join(__dirname, '..', 'memory', 'shared', 'decision_ledger.json');
const APPLY = process.argv.includes('--apply');
// Master 결정 (session_168, 작업지시 Phase 0 명시값)
const META_MAP = {
    'D-137': {
        acked: true,
        ackedBySession: 'session_168',
        ackedAt: '2026-05-02',
        resolvedAt: '2026-05-01',
        resolvedBySession: 'session_161',
    },
    'D-138': {
        acked: true,
        ackedBySession: 'session_168',
        ackedAt: '2026-05-02',
        resolvedAt: null,
        resolvedBySession: null,
    },
    'D-141': {
        acked: true,
        ackedBySession: 'session_168',
        ackedAt: '2026-05-02',
        resolvedAt: '2026-05-02',
        resolvedBySession: 'session_168',
    },
    'D-142': {
        acked: true,
        ackedBySession: 'session_168',
        ackedAt: '2026-05-02',
        resolvedAt: '2026-05-02',
        resolvedBySession: 'session_168',
    },
    'D-143': {
        acked: true,
        ackedBySession: 'session_168',
        ackedAt: '2026-05-02',
        resolvedAt: null,
        resolvedBySession: null,
    },
    'D-144': {
        acked: true,
        ackedBySession: 'session_168',
        ackedAt: '2026-05-02',
        resolvedAt: '2026-05-02',
        resolvedBySession: 'session_168',
    },
};
function main() {
    const raw = fs.readFileSync(LEDGER_PATH, 'utf8');
    const ledger = JSON.parse(raw);
    if (!Array.isArray(ledger.decisions)) {
        console.error('[FATAL] decision_ledger.json: decisions[] missing');
        process.exit(2);
    }
    const report = [];
    let changed = 0;
    for (const id of Object.keys(META_MAP)) {
        const entry = ledger.decisions.find((d) => d.id === id);
        if (!entry) {
            console.error(`[WARN] ${id} not found in ledger`);
            continue;
        }
        const before = Array.isArray(entry.caveats)
            ? `array[${entry.caveats.length}]`
            : typeof entry.caveats;
        // caveats 형식 통일
        if (typeof entry.caveats === 'string') {
            entry.caveats = [entry.caveats];
            changed++;
        }
        else if (!Array.isArray(entry.caveats)) {
            entry.caveats = entry.caveats ? [String(entry.caveats)] : [];
            changed++;
        }
        // (이미 array면 보존)
        const after = `array[${entry.caveats.length}]`;
        // caveatsMeta 부여 (멱등)
        let metaApplied = false;
        if (!entry.caveatsMeta) {
            entry.caveatsMeta = META_MAP[id];
            metaApplied = true;
            changed++;
        }
        report.push({ id, caveatsBefore: before, caveatsAfter: after, metaApplied });
    }
    // 결과 출력
    console.log('=== migrate-caveats-format.ts (Phase 0) ===');
    console.log('mode:', APPLY ? 'APPLY' : 'DRY-RUN');
    console.log('');
    for (const r of report) {
        console.log(`  ${r.id}: caveats ${r.caveatsBefore} → ${r.caveatsAfter} | caveatsMeta ${r.metaApplied ? 'applied' : 'skipped(already)'}`);
    }
    console.log('');
    console.log(`총 변경: ${changed} 필드`);
    if (APPLY && changed > 0) {
        fs.writeFileSync(LEDGER_PATH, JSON.stringify(ledger, null, 2) + '\n', 'utf8');
        console.log('[OK] decision_ledger.json 저장 완료');
    }
    else if (!APPLY) {
        console.log('[INFO] DRY-RUN — 파일 미저장. --apply 옵션으로 반영');
    }
    else {
        console.log('[NOOP] 변경 없음 (이미 마이그레이션 완료)');
    }
}
main();
//# sourceMappingURL=migrate-caveats-format.js.map