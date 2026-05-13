/**
 * topic-create-common.ts — PD-079 / D-181 Phase 1
 *
 * create-topic.ts에서 공통 함수 추출. m-topic 생성기 등 다른 모듈에서 재사용.
 *
 * - nextId      : utils.ts에서 re-export (단일 출처 유지)
 * - compareTopicDesc : migrate-topic-index.ts에서 re-export
 * - slugify     : 본 파일에서 정의 (create-topic.ts와 동일 로직)
 */

export { nextId } from './utils';
export { compareTopicDesc } from '../migrate-topic-index';

/** 한글/영문 title → URL-safe slug. create-topic.ts와 동일 로직. */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 50);
}
