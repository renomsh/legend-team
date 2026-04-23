// PD-023 P1 — seed signatureMetrics block into each role_memory.json (one-time bootstrap)
import * as fs from "fs";
import * as path from "path";
import type { Metric } from "./lib/signature-metrics-types";

const ROLES_DIR = path.join(__dirname, "..", "memory", "roles");

// 29 metrics — 4 axes (learning / quality / judgment-consistency / execution-transfer) × 8 roles
const METRICS: Record<string, Partial<Metric>[]> = {
  ace: [
    base("ace.angle_novelty", "ang_nov", "ace", "learning", "0-5", "higher-better", "프레이밍 각도 신선도 — 기존 프레임과 차별 정도", ["Master 명시 피드백 '신선하다'/'전형'"]),
    base("ace.reframe_trigger", "rfrm_trg", "ace", "judgment-consistency", "Y/N", "higher-better", "재프레이밍이 결정 변경을 유발했는지", ["decision_ledger D-xxx 변경 기록"], { rater: { type: "external", by: "master" }, raterWeights: { master: 1 }, timing: "deferred" }),
    base("ace.orchestration_hit_rate", "orc_hit", "ace", "judgment-consistency", "ratio", "higher-better", "역할 호출 순서가 사후 best-fit과 일치한 비율", ["session 종료 시 turn 기록"], { validityCheck: "quarterly" }),
    base("ace.context_carryover", "ctx_car", "ace", "execution-transfer", "0-5", "higher-better", "이전 세션 결정·맥락 누락 없이 인계 정도", ["context_brief.md 검토"]),
    base("ace.master_friction", "mst_fr", "ace", "judgment-consistency", "0-5", "lower-better", "세션 내 Master 명시 마찰(좌절·재요청·원복) 횟수", ["master_feedback_log 부정 신호"]),
  ],
  arki: [
    base("arki.structural_finding_density", "str_fd", "arki", "quality", "0-5", "higher-better", "발언당 구조 결함 발견 밀도", ["arki_rev*.md finding 카운트"]),
    base("arki.self_audit_rounds", "sa_rnd", "arki", "learning", "0-5", "higher-better", "토픽 내 자가감사 라운드 수 (4축 균형)", ["session notes 'audit-round-N'"], { stratifyBy: "grade" }),
    base("arki.audit_finding_recall", "aud_rcl", "arki", "quality", "ratio", "higher-better", "Riki cross-review에서 Arki 미발견 비율의 역수", ["riki_rev*.md 보강 항목"], { timing: "deferred", validityCheck: "quarterly" }),
    base("arki.spec_lock_rate", "spc_lck", "arki", "execution-transfer", "Y/N", "higher-better", "Dev 인계 spec이 P0a~P5 동안 변경 없이 유지", ["spec frontmatter status:locked-for-dev"]),
  ],
  fin: [
    base("fin.roi_pre_post_delta", "roi_dl", "fin", "judgment-consistency", "0-5", "higher-better", "사전 ROI 직관 vs 사후 실제 비용 일치 정도", ["session 종결 후 cost_log"], { timing: "deferred", validityCheck: "quarterly" }),
    base("fin.redundancy_call", "rdn_cal", "fin", "quality", "Y/N", "higher-better", "과투자/중복 신호 발견 시 1회 이상 명시 호출", ["fin_rev*.md '기각' 또는 '과투자' 키워드"]),
    base("fin.cost_estimate_accuracy", "cst_acc", "fin", "judgment-consistency", "ratio", "higher-better", "Fin 추정 cost ±20% 안에 실제 cost 포함된 비율", ["token_log.json 실측"], { timing: "deferred", validityCheck: "quarterly" }),
    base("fin.cost_alert_lead", "cst_alt", "fin", "execution-transfer", "Y/N", "higher-better", "예산/리소스 초과 신호를 Master 인지 전 1회 이상 선제 호출", ["fin_rev*.md '경보' 키워드 + token_log 임계 도달"], { leadingIndicator: true }),
  ],
  riki: [
    base("riki.critical_recall", "crt_rcl", "riki", "quality", "ratio", "higher-better", "사후 명시된 critical risk 중 Riki가 사전 식별한 비율", ["evidence_index status:open critical"], { rater: { type: "external", by: "ace" }, raterWeights: { ace: 1 }, timing: "deferred" }),
    base("riki.productive_rejection", "prd_rej", "riki", "learning", "Y/N", "higher-better", "기각된 옵션 중 Master/Ace가 사후 동의한 비율 (1건 이상)", ["session_notes '기각'"]),
    base("riki.false_positive_rate", "fp_rt", "riki", "quality", "ratio", "lower-better", "Riki가 critical로 표기했으나 사후 무영향 판정된 비율", ["evidence_index status:resolved-noimpact"], { timing: "deferred" }),
    base("riki.cross_review_value", "cr_val", "riki", "quality", "Y/N", "higher-better", "Arki 자가감사가 못 잡은 항목 1건 이상 보강", ["riki_rev*.md '보강' 항목"]),
  ],
  nova: [
    base("nova.speculative_axis_count", "spc_axs", "nova", "learning", "0-5", "higher-better", "제시한 대안 축 수 (관습 외)", ["nova_rev*.md axis 수"], { aggregation: "invoked-sessions-only" }),
    base("nova.promotion_rate", "prm_rt", "nova", "judgment-consistency", "ratio", "higher-better", "Nova 제안이 Master 승인 후 D-xxx로 박힌 비율", ["decision_ledger 'Nova' 출처"], { aggregation: "invoked-sessions-only", timing: "deferred", validityCheck: "quarterly" }),
  ],
  dev: [
    base("dev.gate_pass_rate", "gt_pas", "dev", "execution-transfer", "ratio", "higher-better", "Phase 게이트 G0~Gn 통과 비율 (재시도 X 1패스)", ["phase_dod.json 통과 기록"]),
    base("dev.spec_drift_count", "spc_drf", "dev", "quality", "0-5", "lower-better", "spec과 어긋난 의사결정 횟수 (스코프 외 추가/누락)", ["session notes '스펙 외'"]),
    base("dev.regression_zero", "reg_zr", "dev", "quality", "Y/N", "higher-better", "회귀 테스트 fixture diff 0", ["test-regression.ts 결과"]),
  ],
  vera: [
    base("vera.token_consistency", "tk_cns", "vera", "quality", "0-5", "higher-better", "디자인 토큰 적용 일관성 (역할 색상·spacing·typography)", ["dist/ 빌드 시각 검수"], { aggregation: "invoked-sessions-only" }),
    base("vera.spec_compliance", "spc_cpl", "vera", "quality", "ratio", "higher-better", "Vera Design System 적용 비율", ["component spec 매핑"], { aggregation: "invoked-sessions-only" }),
  ],
  editor: [
    base("editor.artifact_completeness", "art_cmp", "editor", "quality", "ratio", "higher-better", "세션 종결 시 reports/{role}_rev*.md 작성 비율", ["reports 디렉토리 조사"]),
    base("editor.gap_flag_count", "gap_fc", "editor", "judgment-consistency", "0-5", "lower-better", "current_session.gaps에 누락된 항목 수 (Edi 자체 검수)", ["current_session.json gaps 누락"]),
    base("editor.cross_session_continuity", "cs_cnt", "editor", "execution-transfer", "0-5", "higher-better", "차기 세션 인계용 메모/PD 등록 충분도", ["pendingDeferrals 등록 적시성"]),
    base("editor.session_close_compliance", "scc", "editor", "execution-transfer", "Y/N", "higher-better", "Session End 8단계 체크리스트 전 항목 통과", ["session-log.ts gap 0"]),
  ],
};

// Add 1 derived cross-role health score to reach 29
const DERIVED: Partial<Metric> = {
  id: "session.health_score",
  shortKey: "hlth",
  role: "session",
  scope: "cross-role",
  axis: "quality",
  type: "derived",
  scale: "percentile",
  polarity: "higher-better",
  construct: "세션 전반 건강도 (역할별 quality axis 가중평균)",
  externalAnchor: ["Master 사후 만족도 정성 회고"],
  validityCheck: "quarterly",
  rater: { type: "automated", by: "auto:weighted-mean" },
  raterWeights: { auto: 1 },
  timing: "immediate",
  aggregation: "all-sessions",
  baselineSessions: 10,
  lifecycleState: "active",
  inputPriority: "core",
  defaultStrategy: "explicit-only",
  missingPenalty: "silent",
  applicableTopicTypes: ["framing", "implementation", "standalone"],
  participationExpectedTopicTypes: ["framing", "implementation", "standalone"],
  computedBy: "compute-signature-metrics.ts",
  composition: {
    formula: "weighted-mean",
    inputs: [
      { metricId: "ace.orchestration_hit_rate", weight: 1 },
      { metricId: "arki.structural_finding_density", weight: 1 },
      { metricId: "fin.redundancy_call", weight: 0.5 },
      { metricId: "riki.critical_recall", weight: 1 },
      { metricId: "dev.regression_zero", weight: 1 },
      { metricId: "editor.artifact_completeness", weight: 0.5 },
    ],
    polarityNormalized: true,
    nullPolicy: "weight-renormalize",
  },
};

function base(
  id: string, shortKey: string, role: string, axis: Metric["axis"],
  scale: Metric["scale"], polarity: Metric["polarity"],
  construct: string, externalAnchor: string[],
  overrides: Partial<Metric> = {},
): Partial<Metric> {
  return {
    id, shortKey, role, scope: "role", axis, type: "base",
    scale, polarity, construct, externalAnchor,
    validityCheck: "monthly",
    rater: { type: "self", by: role },
    raterWeights: { [role]: 1 },
    timing: "immediate",
    aggregation: "all-sessions",
    baselineSessions: 10,
    lifecycleState: "active",
    inputPriority: shortKey.includes("nov") || shortKey.includes("rcl") || shortKey.includes("hit") ? "core" : "extended",
    defaultStrategy: "previous-session-value",
    missingPenalty: "warn",
    applicableTopicTypes: ["framing", "implementation", "standalone"],
    participationExpectedTopicTypes: participationByRole(role),
    ...overrides,
  };
}

function participationByRole(role: string): ("framing" | "implementation" | "standalone")[] {
  switch (role) {
    case "dev": return ["implementation", "standalone"];
    case "editor": return ["framing", "implementation", "standalone"];
    case "nova":
    case "vera": return []; // invoked-only, never expected
    default: return ["framing", "standalone"];
  }
}

let totalSeeded = 0;
for (const [role, metrics] of Object.entries(METRICS)) {
  const file = path.join(ROLES_DIR, `${role}_memory.json`);
  if (!fs.existsSync(file)) {
    console.warn(`  WARN  ${role}_memory.json not found, skipping`);
    continue;
  }
  const mem = JSON.parse(fs.readFileSync(file, "utf8"));
  mem.signatureMetrics = metrics;
  mem.applicableTopicTypes = role === "nova" || role === "vera" ? ["framing", "standalone"]
    : role === "dev" ? ["implementation", "standalone"]
    : ["framing", "implementation", "standalone"];
  fs.writeFileSync(file, JSON.stringify(mem, null, 2) + "\n");
  totalSeeded += metrics.length;
  console.log(`  seeded ${metrics.length} metrics into ${role}_memory.json`);
}

// Write derived to a shared file (no role owns it)
const derivedFile = path.join(__dirname, "..", "memory", "growth", "derived_metrics.json");
fs.writeFileSync(derivedFile, JSON.stringify({ derived: [DERIVED] }, null, 2) + "\n");
totalSeeded += 1;
console.log(`  seeded 1 derived metric → derived_metrics.json`);

console.log(`\n[total seeded] ${totalSeeded} metrics`);
if (totalSeeded !== 29) {
  console.error(`  EXPECTED 29, got ${totalSeeded}`);
  process.exit(1);
}
