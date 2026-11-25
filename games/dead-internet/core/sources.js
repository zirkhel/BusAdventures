// @ts-check
// Source assessment (Casebook step 4). The player's own judgement of each visible source:
// do I trust it, is it who it claims to be, which other sources do I think share its origin,
// and a comment. Sources are the visible keys from core/provenance.js (apparentSource), the
// same keys a step 2 question links to, so a source card and a question mean the same source.
//
// Everything here is written only by the player. Nothing checks whether it is right, no rule,
// score, ending or reviewer reads it (Dana changes in step 5, not here), and it never reads
// hidden canon: no `source`, `supports`, `mentions`, `operatedBy`, facts or claims.
// tests/twin.test.mjs checks that every view is identical in worlds that differ only there.

import { apparentSource } from "./provenance.js";
import { asArray } from "./util.js";

export const SOURCE_ANSWERS = ["yes", "unsure", "no"];
export const SOURCE_QUESTIONS = ["trust", "authentic"];

const blank = () => ({ trust: null, authentic: null, sameAs: [], note: "" });

/** Visible sources among the saved evidence: key → { label, evidence ids }. */
function visible(g) {
  const by = new Map();
  for (const e of g.s.evidence) {
    const src = apparentSource(g, e);
    if (!by.has(src.key)) by.set(src.key, { key: src.key, label: src.label, evidence: [] });
    by.get(src.key).evidence.push(e.id);
  }
  return by;
}

/** The player's assessment of a source, or an empty one. Never written by the game. */
function viewOf(g, key) { return g.s.sourceViews?.[key] ?? null; }

/**
 * Answer one or more of the card's questions: { trust, authentic } in yes|unsure|no or null
 * (not answered), and { note }. Only a source the player can see (it has saved evidence).
 */
export function assessSource(g, key, patch = {}) {
  if (!visible(g).has(key)) return { error: "unknown_source" };
  for (const q of SOURCE_QUESTIONS) if (q in patch && patch[q] !== null && !SOURCE_ANSWERS.includes(patch[q])) return { error: "bad_answer" };
  const s = g.s;
  s.sourceViews ??= {};
  const v = s.sourceViews[key] ??= { ...blank(), day: s.day };
  const before = JSON.stringify([v.trust, v.authentic, v.note]);
  for (const q of SOURCE_QUESTIONS) if (q in patch) v[q] = patch[q];
  if ("note" in patch) v.note = String(patch.note ?? "");
  if (JSON.stringify([v.trust, v.authentic, v.note]) !== before) v.edited = s.day;
  return { ok: true };
}

/**
 * "Same origin as …" between two visible sources, both ways. The player's opinion: it merges
 * the two in the player's own count of independent sources, and nothing more.
 */
export function linkSources(g, a, b, on = true) {
  if (a === b) return { error: "same_source" };
  const vis = visible(g);
  if (on && !(vis.has(a) && vis.has(b))) return { error: "unknown_source" };
  const s = g.s;
  s.sourceViews ??= {};
  for (const [x, y] of [[a, b], [b, a]]) {
    const v = s.sourceViews[x] ?? (on ? (s.sourceViews[x] = { ...blank(), day: s.day }) : null);
    if (!v) continue;
    const had = v.sameAs.includes(y);
    v.sameAs = v.sameAs.filter(k => k !== y);
    if (on) v.sameAs.push(y);
    if (had !== on) v.edited = s.day;
  }
  return { ok: true };
}

/**
 * The player's groups of sources: union of their "Same origin as" answers on source cards and
 * their "Same origin" links between two pieces of evidence (step 3), which here mean that the
 * two pieces' visible sources share an origin. Only over sources the player can see.
 * @returns {Map<string,string>} source key → group key (the first key in the group, sorted)
 */
export function playerGroups(g, vis = visible(g)) {
  const parent = new Map([...vis.keys()].map(k => [k, k]));
  const find = k => { while (parent.get(k) !== k) k = /** @type {string} */ (parent.get(k)); return k; };
  const join = (a, b) => { if (!parent.has(a) || !parent.has(b)) return; const [x, y] = [find(a), find(b)].sort(); if (x !== y) parent.set(y, x); };
  for (const [key, v] of Object.entries(g.s.sourceViews || {})) for (const other of asArray(v.sameAs)) join(key, other);
  const srcOf = id => { const e = g.s.evidence.find(x => x.id === id); return e ? apparentSource(g, e).key : null; };
  for (const l of g.s.links || []) if (l.kind === "same_origin") { const a = srcOf(l.a), b = srcOf(l.b); if (a && b) join(a, b); }
  return new Map([...parent.keys()].map(k => [k, find(k)]));
}

/**
 * Counts for a list of evidence: visible sources, the player's own count after their "same
 * origin" answers and links, and how many of those sources the player answered "No" for.
 * The player's count is theirs; the game never says whether it is right.
 */
export function ownCount(g, ids) {
  const vis = visible(g);
  const groups = playerGroups(g, vis);
  const keys = new Set(asArray(ids).map(id => g.s.evidence.find(e => e.id === id)).filter(Boolean).map(e => apparentSource(g, e).key));
  const own = new Set([...keys].map(k => groups.get(k) ?? k));
  const said = (k, q) => viewOf(g, k)?.[q] === "no";
  return { sources: keys.size, own: own.size,
    notTrusted: [...keys].filter(k => said(k, "trust")).length, notAuthentic: [...keys].filter(k => said(k, "authentic")).length };
}

/** One source card: what the player sees and what they said. Only for a visible source. */
export function sourceCard(g, key) { return card(g, key, context(g)); }

/**
 * What every card needs once: visible sources, each evidence's source, and the player's own
 * "same origin" graph between visible sources, with where each edge comes from: the card
 * answers (`sameAs`) or "Same origin" links between evidence (`links`, by link id).
 */
function context(g) {
  const vis = visible(g);
  const srcOf = new Map();
  for (const x of vis.values()) for (const id of x.evidence) srcOf.set(id, x.key);
  /** @type {Map<string, Map<string, {sameAs:boolean, links:string[]}>>} */
  const edges = new Map([...vis.keys()].map(k => [k, new Map()]));
  const edge = (a, b) => {
    if (!vis.has(a) || !vis.has(b) || a === b) return null;
    for (const [x, y] of [[a, b], [b, a]]) if (!edges.get(x).has(y)) edges.get(x).set(y, { sameAs: false, links: [] });
    return [edges.get(a).get(b), edges.get(b).get(a)];
  };
  for (const [key, v] of Object.entries(g.s.sourceViews || {})) for (const other of asArray(v.sameAs)) edge(key, other)?.forEach(e => { e.sameAs = true; });
  for (const l of g.s.links || []) if (l.kind === "same_origin") edge(srcOf.get(l.a), srcOf.get(l.b))?.forEach(e => { if (!e.links.includes(l.id)) e.links.push(l.id); });
  return { vis, groups: playerGroups(g, vis), srcOf, edges };
}

/** Shortest path from `key` to every source in its group: the sources it goes through. */
function pathsFrom(edges, key) {
  const via = new Map([[key, []]]);
  const queue = [key];
  while (queue.length) {
    const k = /** @type {string} */ (queue.shift());
    for (const n of [...edges.get(k).keys()].sort()) if (!via.has(n)) { via.set(n, k === key ? [] : [...via.get(k), k]); queue.push(n); }
  }
  return via;
}

function card(g, key, { vis, groups, edges }) {
  const src = vis.get(key);
  if (!src) return { error: "unknown_source" };
  const v = viewOf(g, key) ?? blank();
  const label = k => vis.get(k)?.label ?? null;
  const mine = edges.get(key);
  // "Same origin" links between this source's evidence and another source's evidence. They
  // join the two in the player's count, but never write to the card's own "same origin as".
  const viaLinks = [...mine].filter(([, e]) => e.links.length).map(([k, e]) => ({ key: k, label: label(k), links: [...e.links] }))
    .sort((a, b) => String(a.label).localeCompare(String(b.label)) || a.key.localeCompare(b.key));
  const via = pathsFrom(edges, key);
  const group = [...vis.keys()].filter(k => k !== key && groups.get(k) === groups.get(key)).sort();
  const setAside = src.evidence.filter(id => g.s.evidence.find(e => e.id === id)?.shelf).length;
  return {
    key, label: src.label, evidence: [...src.evidence], setAside,
    trust: v.trust ?? null, authentic: v.authentic ?? null, note: v.note ?? "",
    day: v.day ?? null, edited: v.edited ?? null,
    sameAs: asArray(v.sameAs).filter(k => vis.has(k)).map(k => ({ key: k, label: label(k) })),
    viaLinks,
    // Everything the player's answers and links put in one group with this source. A source
    // that is only joined through others is indirect, and `via` names the sources between.
    group: group.map(k => { const p = via.get(k) ?? []; return { key: k, label: label(k), direct: mine.has(k), via: p.map(x => ({ key: x, label: label(x) })) }; }),
    questions: (g.s.questions || []).filter(q => asArray(q.links?.sources).includes(key)).map(q => q.id),
    assessed: !!(v.trust || v.authentic || v.note || asArray(v.sameAs).length),
  };
}

/** Every visible source with the player's answers, for the Sources list. */
export function sourcesView(g) {
  const ctx = context(g);
  return [...ctx.vis.values()].map(x => card(g, x.key, ctx)).sort((a, b) => b.evidence.length - a.evidence.length || a.label.localeCompare(b.label));
}

/** Save migration 10 → 11: source cards start empty. Nothing is inferred. */
export function migrateSources(s) {
  s.sourceViews = s.sourceViews && typeof s.sourceViews === "object" && !Array.isArray(s.sourceViews) ? s.sourceViews : {};
}

/** Clean loaded source views: known answers, string keys, no self links, both directions. */
export function cleanSources(s) {
  migrateSources(s);
  const out = {};
  for (const [key, v] of Object.entries(s.sourceViews)) {
    if (!v || typeof v !== "object") continue;
    const ans = x => SOURCE_ANSWERS.includes(x) ? x : null;
    out[key] = { trust: ans(v.trust), authentic: ans(v.authentic), sameAs: [...new Set(asArray(v.sameAs).filter(k => typeof k === "string" && k !== key))],
      note: String(v.note ?? ""), day: Number.isFinite(v.day) ? v.day : 1, ...(Number.isFinite(v.edited) ? { edited: v.edited } : {}) };
  }
  for (const [key, v] of Object.entries(out)) for (const k of v.sameAs) {
    out[k] ??= { ...blank(), day: v.day };
    if (!out[k].sameAs.includes(key)) out[k].sameAs.push(key);
  }
  s.sourceViews = out;
}
