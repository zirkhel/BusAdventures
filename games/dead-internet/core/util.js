// @ts-check
// Small helpers shared by the core. No DOM, no I/O.

/** @template T @param {T} v @returns {T} */
export function deepClone(v) { return structuredClone(v); }

/** @returns {any[]} */
export function asArray(v) { return v == null ? [] : Array.isArray(v) ? v : [v]; }

/**
 * Index a list of objects by `id`. Throws on missing or duplicate ids.
 * @template {{id:string}} T
 * @param {T[]|undefined} list
 * @param {string} what
 * @returns {Map<string,T>}
 */
export function indexById(list, what) {
  const m = new Map();
  for (const x of list || []) {
    if (!x || typeof x.id !== "string" || !x.id) throw new Error(`${what}: entry without id`);
    if (m.has(x.id)) throw new Error(`${what}: duplicate id "${x.id}"`);
    m.set(x.id, x);
  }
  return m;
}

/** Add n days to an ISO date (YYYY-MM-DD). */
export function addDays(iso, n) {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Replace {name} placeholders. Unknown placeholders are left as they are. */
export function fill(template, vars) {
  return String(template).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

/** Deterministic random numbers (mulberry32). The seed lives in state.rng so saves are reproducible. */
export function nextRandom(state) {
  let t = (state.rng = (state.rng + 0x6d2b79f5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
