// PD-023 P0b — Derived weighted-mean composition (spec §2.2 DerivedComposition, §10)
import type { DerivedComposition, Metric } from "./signature-metrics-types";
import { applyPolarity } from "./metric-normalizer";

export interface DerivedInput {
  metricId: string;
  normalizedScore: number | null;
}

export interface DerivedResult {
  value: number | null;
  reason?: string; // why null, if applicable
}

export function computeDerived(
  composition: DerivedComposition,
  inputs: DerivedInput[],
  metricLookup: (id: string) => Metric | undefined,
): DerivedResult {
  if (composition.formula !== "weighted-mean") {
    throw new Error(`E-018 derived formula not supported: ${composition.formula}`);
  }
  const inputMap = new Map(inputs.map(i => [i.metricId, i.normalizedScore]));

  const present: { weight: number; value: number }[] = [];
  let nullSeen = false;

  for (const cfg of composition.inputs) {
    const score = inputMap.get(cfg.metricId);
    if (score === null || score === undefined) {
      nullSeen = true;
      if (composition.nullPolicy === "propagate-null") {
        return { value: null, reason: `propagate-null: ${cfg.metricId} missing` };
      }
      if (composition.nullPolicy === "zero-fill") {
        present.push({ weight: cfg.weight, value: 0 });
      }
      // weight-renormalize: skip
      continue;
    }
    let v = score;
    if (composition.polarityNormalized) {
      const m = metricLookup(cfg.metricId);
      if (m) v = applyPolarity(v, m.polarity);
    }
    present.push({ weight: cfg.weight, value: v });
  }

  if (present.length === 0) return { value: null, reason: "no inputs" };
  const totalW = present.reduce((s, p) => s + p.weight, 0);
  if (totalW === 0) return { value: null, reason: "zero total weight" };
  const sum = present.reduce((s, p) => s + p.weight * p.value, 0);
  const mean = sum / totalW;
  const out: DerivedResult = { value: Math.round(mean * 10) / 10 };
  if (nullSeen) out.reason = `partial: ${present.length}/${composition.inputs.length} present`;
  return out;
}
