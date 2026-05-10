"use strict";
/**
 * lib/utils.ts — shared utilities for legend-team scripts
 * Centralizes readJson, writeJson, appendLog, nextId
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
exports.ROOT = void 0;
exports.readJson = readJson;
exports.writeJson = writeJson;
exports.appendLog = appendLog;
exports.nextId = nextId;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
exports.ROOT = path.resolve(__dirname, '..', '..');
const APP_LOG = path.join(exports.ROOT, 'logs', 'app.log');
function readJson(absPath, fallback) {
    if (!fs.existsSync(absPath))
        return fallback;
    const raw = fs.readFileSync(absPath, 'utf8').trim();
    if (!raw)
        return fallback;
    return JSON.parse(raw);
}
function writeJson(absPath, content) {
    fs.writeFileSync(absPath, JSON.stringify(content, null, 2) + '\n', 'utf8');
}
function appendLog(context, message) {
    const line = `[${new Date().toISOString()}] [${context}] ${message}\n`;
    fs.appendFileSync(APP_LOG, line, 'utf8');
}
/**
 * Generate next sequential ID from a list of entries with `id` field.
 * @param entries - array of objects with `id` string field
 * @param prefix - e.g. 'MF-', 'E-', 'session_'
 */
function nextId(entries, prefix) {
    const nums = entries
        .filter(e => e && e.id)
        .map(e => parseInt(e.id.replace(prefix, ''), 10))
        .filter(n => !isNaN(n));
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    return `${prefix}${String(next).padStart(3, '0')}`;
}
//# sourceMappingURL=utils.js.map