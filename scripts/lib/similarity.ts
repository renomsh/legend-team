/**
 * similarity.ts — PD-079 / D-181 Phase 4
 *
 * Char trigram + cosine. 한국어 안정. 외부 의존 0.
 *
 * K-6 fallback: 알고리즘 교체 시 본 모듈만 재구현 (similarity() 시그니처 유지).
 * 임계값은 m_config.json — 본 모듈은 임계 미사용 (raw score만 반환).
 */

const N = 3;

/** Char N-gram (n=3). 소문자 변환, 공백·구두점 보존(정보량 유지). */
export function trigrams(text: string): Map<string, number> {
  const out = new Map<string, number>();
  if (!text) return out;
  const s = text.toLowerCase();
  if (s.length < N) {
    out.set(s, 1);
    return out;
  }
  for (let i = 0; i <= s.length - N; i++) {
    const g = s.slice(i, i + N);
    out.set(g, (out.get(g) ?? 0) + 1);
  }
  return out;
}

/** 표준 cosine. 0~1. 빈 벡터는 0. */
export function cosine(a: Map<string, number>, b: Map<string, number>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const v of a.values()) na += v * v;
  for (const v of b.values()) nb += v * v;
  // dot product: iterate smaller map
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  for (const [k, v] of small) {
    const w = large.get(k);
    if (w !== undefined) dot += v * w;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  if (denom === 0) return 0;
  return dot / denom;
}

/** 단일 API. trigram+cosine. */
export function similarity(textA: string, textB: string): number {
  return cosine(trigrams(textA ?? ''), trigrams(textB ?? ''));
}

if (require.main === module) {
  const a = process.argv[2] ?? '';
  const b = process.argv[3] ?? '';
  console.log(similarity(a, b).toFixed(4));
}
