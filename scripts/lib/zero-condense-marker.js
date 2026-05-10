"use strict";
/**
 * zero-condense-marker.ts
 * PD-064 P1 (session_194, topic_167, 2026-05-05) — Zero D.Condense 마커 SOT.
 *
 * 결함 #1 (FP) root cause: 마커 키 드리프트(`session`/`topic`/`executedAt` vs `sessionId`/`topicId`/`completedAt`).
 * 해결: 표준 키를 헬퍼로 단일화. legacy migrate는 D-028 정신 보존 위해 회피하고, read 호환만 제공.
 *
 * - writeMarker(reportDir, sess, opts): canonical schema로 박제.
 * - readAndValidateMarker(reportDir, sess): legacy 키 호환 read + 스키마 검증.
 *
 * canonical schema (필수 키): sessionId, topicId, completedAt, files[]
 * legacy 호환 read: marker.sessionId || marker.session  /  marker.topicId || marker.topic  /  marker.completedAt || marker.executedAt
 *
 * Prime Directive D2 정합: 마커 존재만 신뢰 금지 — 실 페이로드 검증.
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
exports.MARKER_FILENAME = void 0;
exports.writeMarker = writeMarker;
exports.readAndValidateMarker = readAndValidateMarker;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
exports.MARKER_FILENAME = '_zero_condense.json';
/**
 * canonical schema로 마커 박제. 존재 시 덮어쓴다.
 * `files`는 디렉토리에서 자동 추출 (*.md, _zero_condense.json 제외) — opts.files로 override 가능.
 */
function writeMarker(reportDir, sess, opts = {}) {
    if (!sess || !sess.sessionId || !sess.topicId) {
        throw new Error('writeMarker: sess.sessionId · sess.topicId 필수');
    }
    if (!fs.existsSync(reportDir)) {
        throw new Error(`writeMarker: reportDir 부재 — ${reportDir}`);
    }
    let files = opts.files;
    if (!files) {
        try {
            files = fs.readdirSync(reportDir)
                .filter(f => f.endsWith('.md'))
                .filter(f => !f.startsWith('_'));
        }
        catch {
            files = [];
        }
    }
    const marker = {
        sessionId: sess.sessionId,
        topicId: sess.topicId,
        completedAt: new Date().toISOString(),
        files,
        ...(opts.refinedRoles ? { refinedRoles: opts.refinedRoles } : {}),
        ...(opts.skippedRoles ? { skippedRoles: opts.skippedRoles } : {}),
        ...(opts.extra || {}),
    };
    const markerPath = path.join(reportDir, exports.MARKER_FILENAME);
    fs.writeFileSync(markerPath, JSON.stringify(marker, null, 2) + '\n', 'utf8');
    return markerPath;
}
/**
 * 마커 read + 검증. legacy 키(`session`/`topic`/`executedAt`) 호환.
 * 파싱 실패·세션 mismatch·필수 키 부재 시 valid=false + reason.
 */
function readAndValidateMarker(reportDir, sess) {
    const markerPath = path.join(reportDir, exports.MARKER_FILENAME);
    if (!fs.existsSync(markerPath)) {
        return { valid: false, reason: `marker file not found: ${markerPath}` };
    }
    let raw;
    try {
        const text = fs.readFileSync(markerPath, 'utf8').trim();
        raw = text ? JSON.parse(text) : null;
    }
    catch (e) {
        return { valid: false, reason: `parseError: ${e.message}` };
    }
    if (!raw || typeof raw !== 'object') {
        return { valid: false, reason: 'marker payload empty or not an object' };
    }
    const m = raw;
    // legacy compat read
    const sessionId = (m.sessionId ?? m.session);
    const topicId = (m.topicId ?? m.topic);
    const completedAt = (m.completedAt ?? m.executedAt);
    const files = Array.isArray(m.files) ? m.files : [];
    if (!sessionId) {
        return { valid: false, reason: 'missing sessionId (also no legacy `session` key)', raw };
    }
    if (!completedAt) {
        return { valid: false, reason: 'missing completedAt (also no legacy `executedAt` key)', raw };
    }
    if (sess.sessionId && sessionId !== sess.sessionId) {
        return {
            valid: false,
            reason: `sessionId mismatch: marker=${sessionId} expected=${sess.sessionId}`,
            raw,
        };
    }
    return {
        valid: true,
        canonical: {
            sessionId,
            topicId: topicId || '',
            completedAt,
            files,
        },
        raw,
    };
}
//# sourceMappingURL=zero-condense-marker.js.map