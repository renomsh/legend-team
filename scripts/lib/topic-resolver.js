"use strict";
/**
 * lib/topic-resolver.ts — topic path resolution from topic_index.json
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
exports.resolveTopicPaths = resolveTopicPaths;
exports.resolveControlPath = resolveControlPath;
const path = __importStar(require("path"));
const utils_1 = require("./utils");
const TOPIC_INDEX_PATH = path.join(utils_1.ROOT, 'memory/shared/topic_index.json');
function resolveTopicPaths(topicId) {
    const index = (0, utils_1.readJson)(TOPIC_INDEX_PATH, { topics: [], lastUpdated: '' });
    const entry = index.topics.find(t => t.id === topicId);
    return {
        controlPath: entry?.controlPath ?? `topics/${topicId}`,
        reportPath: entry?.reportPath ?? `topics/${topicId}/reports`,
    };
}
function resolveControlPath(topicId) {
    return resolveTopicPaths(topicId).controlPath;
}
//# sourceMappingURL=topic-resolver.js.map