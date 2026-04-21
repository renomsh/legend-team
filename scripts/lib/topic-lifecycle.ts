/**
 * topic-lifecycle.ts
 * D-056 (session_066) + D-057 (session_067) — 토픽 생명주기 스키마.
 *
 * 핵심 모델:
 * - topicType: framing / implementation / standalone / undefined(legacy)
 * - parentTopicId + childTopicIds: framing ↔ implementation 관계
 * - resolveCondition: PD 자동 전이 트리거 (자연어 string)
 *
 * 레거시 호환: topicType undefined 허용. 기존 68개 토픽 무변경.
 * 신규 토픽(session_067+)부터 정식 적용.
 */

export type TopicType = 'framing' | 'implementation' | 'standalone';

export interface TopicLifecycleFields {
  topicType?: TopicType;
  parentTopicId?: string | null;
  childTopicIds?: string[];
}

export interface PendingDeferralLifecycleFields {
  resolveCondition?: string | null;
}

/** topicType 존재 여부 기반 판정 */
export function isLifecycleAware(topic: TopicLifecycleFields): boolean {
  return topic.topicType !== undefined;
}

/** framing 토픽 자동 종결 가능 여부: 모든 children completed */
export function canAutoClose(
  topic: TopicLifecycleFields & { status: string },
  childStatuses: Record<string, string>
): { eligible: boolean; reason: string } {
  if (topic.topicType !== 'framing') {
    return { eligible: false, reason: 'not-framing-type' };
  }
  if (topic.status === 'completed' || topic.status === 'closed') {
    return { eligible: false, reason: 'already-closed' };
  }
  const children = topic.childTopicIds ?? [];
  if (children.length === 0) {
    return { eligible: false, reason: 'no-children' };
  }
  const openChildren = children.filter(
    (cid) => childStatuses[cid] !== 'completed' && childStatuses[cid] !== 'closed'
  );
  if (openChildren.length > 0) {
    return {
      eligible: false,
      reason: `open-children:${openChildren.join(',')}`,
    };
  }
  return { eligible: true, reason: 'all-children-completed' };
}

/** 스키마 drift 검증: topicType 존재 시 parent/child 정합성 */
export interface LifecycleValidationIssue {
  topicId: string;
  issue: string;
  severity: 'error' | 'warn';
}

export function validateLifecycleSchema(
  topics: Array<{ id: string } & TopicLifecycleFields>
): LifecycleValidationIssue[] {
  const issues: LifecycleValidationIssue[] = [];
  const byId = new Map(topics.map((t) => [t.id, t]));

  for (const t of topics) {
    if (t.topicType === undefined) continue;

    if (t.topicType === 'framing') {
      const children = t.childTopicIds ?? [];
      for (const cid of children) {
        const child = byId.get(cid);
        if (!child) {
          issues.push({
            topicId: t.id,
            issue: `child ${cid} not found`,
            severity: 'error',
          });
          continue;
        }
        if (child.parentTopicId !== t.id) {
          issues.push({
            topicId: t.id,
            issue: `child ${cid} parentTopicId mismatch (expected ${t.id}, got ${child.parentTopicId ?? 'null'})`,
            severity: 'error',
          });
        }
      }
    }

    if (t.topicType === 'implementation') {
      if (!t.parentTopicId) {
        issues.push({
          topicId: t.id,
          issue: 'implementation topic missing parentTopicId',
          severity: 'error',
        });
      } else {
        const parent = byId.get(t.parentTopicId);
        if (!parent) {
          issues.push({
            topicId: t.id,
            issue: `parent ${t.parentTopicId} not found`,
            severity: 'error',
          });
        } else if (!(parent.childTopicIds ?? []).includes(t.id)) {
          issues.push({
            topicId: t.id,
            issue: `parent ${t.parentTopicId} does not include this topic in childTopicIds`,
            severity: 'error',
          });
        }
      }
    }

    if (t.topicType === 'standalone') {
      if (t.parentTopicId) {
        issues.push({
          topicId: t.id,
          issue: 'standalone topic should not have parentTopicId',
          severity: 'warn',
        });
      }
      if ((t.childTopicIds ?? []).length > 0) {
        issues.push({
          topicId: t.id,
          issue: 'standalone topic should not have childTopicIds',
          severity: 'warn',
        });
      }
    }
  }
  return issues;
}

/** resolveCondition 자연어 매칭 — 공백·대소문자 무시 substring */
export function matchesResolveCondition(
  condition: string,
  signal: string
): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[\s\-_]+/g, '');
  const c = norm(condition);
  const s = norm(signal);
  if (!c || !s) return false;
  return s.includes(c) || c.includes(s);
}
