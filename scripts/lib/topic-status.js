"use strict";
/**
 * topic-status.ts
 * D-F (D-104-s130 / topic_127 P4, 2026-04-28)
 *
 * topic_index.json(SOT) + topics/{topicId}/topic_meta.json(mirror) 동시 갱신 헬퍼.
 * SOT 갱신 실패 시 mirror 갱신 중단 — 부분 갱신으로 인한 표류 방지.
 *
 * D-B status enum 7종:
 *   open | framing | design-approved | implementing | completed | suspended | cancelled
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
exports.updateTopicStatus = updateTopicStatus;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * topic_index.json(SOT)와 topics/{topicId}/topic_meta.json(mirror)를 동시 갱신.
 *
 * @param root  프로젝트 루트 경로 (절대 경로)
 * @param topicId  e.g. "topic_127"
 * @param update  변경할 필드만 포함 (partial update)
 */
function updateTopicStatus(root, topicId, update) {
    const warnings = [];
    const today = new Date().toISOString().slice(0, 10);
    const patch = { ...update, lastUpdated: today };
    // ── 1. SOT: memory/shared/topic_index.json ───────────────────────────────
    const indexPath = path.join(root, 'memory', 'shared', 'topic_index.json');
    let sotUpdated = false;
    let mirrorUpdated = false;
    try {
        const raw = fs.readFileSync(indexPath, 'utf-8');
        const data = JSON.parse(raw);
        const topic = data.topics.find((t) => t['id'] === topicId);
        if (!topic) {
            warnings.push(`SOT: topic ${topicId} not found in topic_index.json`);
            return { sotUpdated, mirrorUpdated, warnings };
        }
        Object.assign(topic, patch);
        fs.writeFileSync(indexPath, JSON.stringify(data, null, 2), 'utf-8');
        sotUpdated = true;
    }
    catch (e) {
        warnings.push(`SOT write failed: ${e.message}`);
        return { sotUpdated, mirrorUpdated, warnings };
    }
    // ── 2. mirror: topics/{topicId}/topic_meta.json ──────────────────────────
    const metaPath = path.join(root, 'topics', topicId, 'topic_meta.json');
    if (!fs.existsSync(metaPath)) {
        warnings.push(`mirror: ${metaPath} not found — skipping mirror update`);
        return { sotUpdated, mirrorUpdated, warnings };
    }
    try {
        const raw = fs.readFileSync(metaPath, 'utf-8');
        const meta = JSON.parse(raw);
        Object.assign(meta, patch);
        fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
        mirrorUpdated = true;
    }
    catch (e) {
        warnings.push(`mirror write failed: ${e.message}`);
    }
    return { sotUpdated, mirrorUpdated, warnings };
}
//# sourceMappingURL=topic-status.js.map