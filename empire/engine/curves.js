// Empire Engine — small helpers for configurable curves and random picks.
// Pure functions, no DOM.

/**
 * Read step n (1-based) from a curve definition.
 *  number                         → constant
 *  [1,3,5,10]                     → list, last value repeats
 *  { list:[...], thenAdd: 5 }     → list, then +5 per step
 *  { list:[...], thenGrowth: 1.5 }→ list, then ×1.5 per step
 *  { base: 10, growth: 1.3 }      → base × growth^(n-1)
 */
export function curveAt(curve, n) {
  if (curve == null) return 0;
  if (typeof curve === 'number') return curve;
  if (Array.isArray(curve)) curve = { list: curve };
  if (curve.list) {
    const list = curve.list;
    if (n <= list.length) return list[n - 1];
    const last = list[list.length - 1];
    const extra = n - list.length;
    if (curve.thenAdd != null) return last + curve.thenAdd * extra;
    if (curve.thenGrowth != null) return Math.ceil(last * curve.thenGrowth ** extra);
    return last;
  }
  if (curve.base != null) return curve.base * (curve.growth ?? 1) ** (n - 1);
  return 0;
}

/** Pick one item by weight. weightOf(item) must return >= 0. Returns null if all weights are 0. */
export function weightedPick(items, weightOf, rng = Math.random) {
  let total = 0;
  for (const it of items) total += Math.max(0, weightOf(it));
  if (total <= 0) return null;
  let roll = rng() * total;
  for (const it of items) {
    roll -= Math.max(0, weightOf(it));
    if (roll < 0) return it;
  }
  return items[items.length - 1];
}

/** Small seedable RNG (mulberry32) — handy for the simulator and tests. */
export function seededRng(seed = 1) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const pick = (...vals) => vals.find(v => v !== undefined && v !== null);
