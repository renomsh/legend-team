/**
 * m-schema-validator.ts — PD-079 / D-181 Phase 3
 *
 * m_* 파일/엔트리 스키마 검증. 외부 의존 없는 type-guard.
 * 단일 출처: 스키마 이름·필드명·regex가 본 모듈에서만 정의됨.
 *
 * exports:
 *   - validateMDecisionEntry(entry): {valid, errors}
 *   - validateMPendingDeferralEntry(entry): {valid, errors}
 *   - validateMTopicIndexFile(content): {valid, errors}  (전체 파일 단위)
 *
 * D4 정합: 코드 자체에서 enforcement. 코멘트 의존 금지.
 */

// ── Schema constants (단일 출처) ────────────────────────────────────────────

export const SCHEMA_M_DECISION_LEDGER = 'm_decision_ledger.v1';
export const SCHEMA_M_PENDING_DEFERRALS = 'm_pending_deferrals.v1';
export const SCHEMA_M_TOPIC_INDEX = 'm_topic_index.v1';

export const RE_M_DECISION_ID = /^mD-\d{3}$/;
export const RE_M_PENDING_DEFERRAL_ID = /^mPD-\d{3}$/;
export const RE_M_TOPIC_ID = /^mtopic_\d{3}_W[a-f0-9]{4,16}$/i;
export const RE_ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const MPD_STATUS_ENUM = new Set(['pending', 'resolved']);

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

// ── mD entry ────────────────────────────────────────────────────────────────

export function validateMDecisionEntry(entry: unknown): ValidationResult {
  const errors: string[] = [];
  if (!isObject(entry)) {
    return { valid: false, errors: ['entry must be an object'] };
  }
  // mId
  if (!isNonEmptyString(entry.mId)) {
    errors.push('mId missing or not string');
  } else if (!RE_M_DECISION_ID.test(entry.mId)) {
    errors.push(`mId does not match ${RE_M_DECISION_ID} (got ${entry.mId})`);
  }
  // date
  if (!isNonEmptyString(entry.date)) {
    errors.push('date missing or not string');
  } else if (!RE_ISO_DATE.test(entry.date)) {
    errors.push(`date does not match ISO YYYY-MM-DD (got ${entry.date})`);
  }
  // mtopicId
  if (!isNonEmptyString(entry.mtopicId)) {
    errors.push('mtopicId missing or not string');
  } else if (!RE_M_TOPIC_ID.test(entry.mtopicId)) {
    errors.push(`mtopicId does not match ${RE_M_TOPIC_ID} (got ${entry.mtopicId})`);
  }
  // axis
  if (!isNonEmptyString(entry.axis)) {
    errors.push('axis missing or empty');
  }
  // summary
  if (!isNonEmptyString(entry.summary)) {
    errors.push('summary missing or empty');
  }
  // optional fields type check
  if (entry.decision !== undefined && typeof entry.decision !== 'string') {
    errors.push('decision must be string when present');
  }
  if (entry.caveats !== undefined && typeof entry.caveats !== 'string') {
    errors.push('caveats must be string when present');
  }
  if (entry.relatedDecisions !== undefined) {
    if (!Array.isArray(entry.relatedDecisions)) {
      errors.push('relatedDecisions must be array when present');
    } else if (!entry.relatedDecisions.every((x) => typeof x === 'string')) {
      errors.push('relatedDecisions[] must be all strings');
    }
  }
  return { valid: errors.length === 0, errors };
}

// ── mPD entry ───────────────────────────────────────────────────────────────

export function validateMPendingDeferralEntry(entry: unknown): ValidationResult {
  const errors: string[] = [];
  if (!isObject(entry)) {
    return { valid: false, errors: ['entry must be an object'] };
  }
  if (!isNonEmptyString(entry.mpdId)) {
    errors.push('mpdId missing or not string');
  } else if (!RE_M_PENDING_DEFERRAL_ID.test(entry.mpdId)) {
    errors.push(
      `mpdId does not match ${RE_M_PENDING_DEFERRAL_ID} (got ${entry.mpdId})`
    );
  }
  if (!isNonEmptyString(entry.fromSession)) {
    errors.push('fromSession missing or empty');
  }
  if (!isNonEmptyString(entry.fromMTopic)) {
    errors.push('fromMTopic missing or empty');
  } else if (!RE_M_TOPIC_ID.test(entry.fromMTopic)) {
    errors.push(
      `fromMTopic does not match ${RE_M_TOPIC_ID} (got ${entry.fromMTopic})`
    );
  }
  if (!isNonEmptyString(entry.createdAt)) {
    errors.push('createdAt missing or empty');
  }
  if (!isNonEmptyString(entry.item)) {
    errors.push('item missing or empty');
  }
  if (!isNonEmptyString(entry.status)) {
    errors.push('status missing or not string');
  } else if (!MPD_STATUS_ENUM.has(entry.status)) {
    errors.push(
      `status must be one of ${Array.from(MPD_STATUS_ENUM).join('|')} (got ${entry.status})`
    );
  }
  return { valid: errors.length === 0, errors };
}

// ── m_topic_index file (전체 파일 단위) ─────────────────────────────────────

export function validateMTopicIndexFile(content: unknown): ValidationResult {
  const errors: string[] = [];
  if (!isObject(content)) {
    return { valid: false, errors: ['file content must be object'] };
  }
  if (content.schema !== SCHEMA_M_TOPIC_INDEX) {
    errors.push(
      `schema must be "${SCHEMA_M_TOPIC_INDEX}" (got ${JSON.stringify(content.schema)})`
    );
  }
  if (!isNonEmptyString(content.worktreeId)) {
    errors.push('worktreeId missing or empty');
  }
  // topics 배열 (m_topic_index 는 'topics' 키 사용 — m-types.ts MTopicIndex 정합)
  if (!Array.isArray(content.topics)) {
    errors.push('topics must be array');
  } else {
    content.topics.forEach((t, i) => {
      if (!isObject(t)) {
        errors.push(`topics[${i}] not object`);
        return;
      }
      if (!isNonEmptyString(t.mtopicId)) {
        errors.push(`topics[${i}].mtopicId missing`);
      } else if (!RE_M_TOPIC_ID.test(t.mtopicId)) {
        errors.push(`topics[${i}].mtopicId regex fail (got ${t.mtopicId})`);
      }
      if (!isNonEmptyString(t.worktreeId)) {
        errors.push(`topics[${i}].worktreeId missing`);
      } else if (t.worktreeId !== content.worktreeId) {
        errors.push(
          `topics[${i}].worktreeId mismatch (file=${content.worktreeId}, entry=${t.worktreeId})`
        );
      }
      if (!isNonEmptyString(t.title)) {
        errors.push(`topics[${i}].title missing`);
      }
      if (!isNonEmptyString(t.status)) {
        errors.push(`topics[${i}].status missing`);
      }
    });
  }
  return { valid: errors.length === 0, errors };
}

// CLI smoke
if (require.main === module) {
  const sample = {
    mId: 'mD-001',
    date: '2026-05-13',
    mtopicId: 'mtopic_001_Wabcdef12',
    axis: 'test',
    summary: 'test summary',
  };
  console.log(JSON.stringify(validateMDecisionEntry(sample), null, 2));
}
