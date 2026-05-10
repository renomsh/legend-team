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
 * validate-schema-lifecycle.ts
 * D-057 — topicType/parent/child 정합성 검증기.
 * Gate G1 통과 조건: drift=0, topic_062/066 소급 결과 정합성 확보.
 *
 * 사용:
 *   npx ts-node scripts/validate-schema-lifecycle.ts
 * 종료코드: issues 0건이면 0, 그 외 1.
 */
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const topic_lifecycle_1 = require("./lib/topic-lifecycle");
const TOPIC_INDEX = path.join(__dirname, '..', 'memory', 'shared', 'topic_index.json');
function main() {
    const raw = fs.readFileSync(TOPIC_INDEX, 'utf-8');
    const data = JSON.parse(raw);
    const topics = data.topics.map((t) => ({
        id: t.id,
        topicType: t.topicType,
        parentTopicId: t.parentTopicId ?? null,
        childTopicIds: t.childTopicIds ?? [],
    }));
    const issues = (0, topic_lifecycle_1.validateLifecycleSchema)(topics);
    const awareCount = topics.filter((t) => t.topicType !== undefined).length;
    const legacyCount = topics.length - awareCount;
    console.log(`[validate-schema-lifecycle]`);
    console.log(`  total topics: ${topics.length}`);
    console.log(`  lifecycle-aware: ${awareCount}`);
    console.log(`  legacy (undefined): ${legacyCount}`);
    console.log(`  issues: ${issues.length}`);
    if (issues.length > 0) {
        for (const i of issues) {
            console.log(`  [${i.severity}] ${i.topicId}: ${i.issue}`);
        }
        process.exit(1);
    }
    console.log('  ✓ schema drift = 0');
}
main();
//# sourceMappingURL=validate-schema-lifecycle.js.map