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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFile = validateFile;
// PD-023 — validate-self-scores: jsonl 전건 구조·일관성 검증 CLI
// CLI: npx ts-node scripts/validate-self-scores.ts [--file <path>]
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ajv_1 = __importDefault(require("ajv"));
const self_scores_writer_1 = require("./lib/self-scores-writer");
const metric_normalizer_1 = require("./lib/metric-normalizer");
const ROOT = path.join(__dirname, "..");
const SCHEMA_PATH = path.join(ROOT, "memory", "schemas", "self-scores.schema.json");
function loadSchema() {
    if (!fs.existsSync(SCHEMA_PATH)) {
        console.warn(`WARN: schema not found at ${SCHEMA_PATH} — schema check skipped`);
        return null;
    }
    const raw = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"));
    const ajv = new ajv_1.default({ allErrors: true, strict: false });
    return ajv.compile(raw);
}
function validateFile(filePath) {
    const report = {
        total: 0,
        valid: 0,
        orphan: 0,
        scaleViolation: 0,
        schemaFail: 0,
        parseFail: 0,
        failures: [],
    };
    if (!fs.existsSync(filePath)) {
        console.error(`E: file not found: ${filePath}`);
        return report;
    }
    (0, self_scores_writer_1.loadRegistry)();
    const validator = loadSchema();
    const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line || !line.trim())
            continue;
        report.total++;
        let rec;
        try {
            rec = JSON.parse(line);
        }
        catch (e) {
            report.parseFail++;
            report.failures.push({ line: i + 1, reason: `parse: ${e.message}` });
            continue;
        }
        let lineOk = true;
        if (validator && !validator(rec)) {
            report.schemaFail++;
            lineOk = false;
            report.failures.push({
                line: i + 1,
                recordId: rec.recordId,
                reason: `schema: ${validator.errors?.map(e => `${e.instancePath} ${e.message}`).join("; ")}`,
            });
        }
        const metric = (0, self_scores_writer_1.findMetric)(rec.metricId);
        if (!metric) {
            report.orphan++;
            lineOk = false;
            report.failures.push({
                line: i + 1,
                recordId: rec.recordId,
                reason: `orphan metricId: ${rec.metricId}`,
            });
        }
        else {
            try {
                (0, metric_normalizer_1.normalize)(rec.rawScore, metric.scale);
            }
            catch (e) {
                report.scaleViolation++;
                lineOk = false;
                report.failures.push({
                    line: i + 1,
                    recordId: rec.recordId,
                    reason: `scale: ${e.message}`,
                });
            }
        }
        if (lineOk)
            report.valid++;
    }
    return report;
}
function parseArgs(argv) {
    const out = {};
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === "--help" || a === "-h")
            out.help = true;
        else if (a === "--file") {
            const next = argv[++i];
            if (next)
                out.file = next;
        }
    }
    return out;
}
if (require.main === module) {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
        console.log("Usage: npx ts-node scripts/validate-self-scores.ts [--file <path>]");
        process.exit(0);
    }
    const target = args.file ? path.resolve(args.file) : self_scores_writer_1.PATHS.jsonl;
    console.log(`validating ${target}`);
    const r = validateFile(target);
    console.log(`total=${r.total} valid=${r.valid} orphan=${r.orphan} scaleViolation=${r.scaleViolation} schemaFail=${r.schemaFail} parseFail=${r.parseFail}`);
    if (r.failures.length > 0) {
        console.log("failures:");
        for (const f of r.failures.slice(0, 20)) {
            console.log(`  line ${f.line}${f.recordId ? ` (${f.recordId})` : ""}: ${f.reason}`);
        }
        if (r.failures.length > 20)
            console.log(`  ... and ${r.failures.length - 20} more`);
    }
    process.exit(r.valid === r.total && r.parseFail === 0 ? 0 : 1);
}
//# sourceMappingURL=validate-self-scores.js.map