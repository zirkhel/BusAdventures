// @ts-check
// Cases (mysteries) as the player's Casebook sees them.
//
// The Casebook belongs to the player, not to a case. Every item (evidence, theory, note,
// timeline event) has `cases: []`. An empty list means unclassified, which is the default.
// Nothing is linked to a case automatically: the player picks one, several or none.
// A report always belongs to exactly one case.
//
// Case lifecycle (state.cases): locked → available → active → closed.
//   locked     the mystery has `requires` that do not hold yet
//   available  can be started from the start screen (start.menu) or by something in the
//              world (start.discover, a condition checked after every action)
//   active     started: its rules, endings and channels are live
//   closed     an ending with closes: true was reached. The world and other cases go on.
// Several cases can be active at once. Knowledge, evidence and consequences are universe
// state and carry over. Only cases the player has started are offered in the Casebook.

import { asArray } from "./util.js";
import { fire } from "./rules.js";

/** Seeds are named in the world but have no content yet. */
export const playable = m => m && m.status !== "seed";

/** Initial case states for a new game. */
export function initCases(w) {
  const out = {};
  for (const m of w.mysteries.values()) if (playable(m)) out[m.id] = { status: m.requires ? "locked" : "available" };
  return out;
}

/** Cases the player has started (active or closed). */
export function caseList(g) {
  return Object.entries(g.s.cases || {}).filter(([, c]) => c.status === "active" || c.status === "closed")
    .map(([id, c]) => ({ id, title: g.w.mysteries.get(id)?.title || id, status: c.status }));
}

/** Cases that can be started from the start screen right now. */
export function menuCases(g) {
  return Object.entries(g.s.cases || {}).filter(([id, c]) => c.status === "available" && g.w.mysteries.get(id)?.start?.menu).map(([id]) => id);
}

/** Day the case started (for beforeCaseDay and caseDay), or undefined. */
export function caseStart(g, id) { return g.s.cases?.[id]?.startedDay; }

/** Start a case: its premise becomes known, its start artifacts appear, its rules go live. */
export function startCase(g, id) {
  const m = g.w.mysteries.get(id), c = g.s.cases?.[id];
  if (!m || !c) return { error: "unknown_case" };
  if (c.status === "active" || c.status === "closed") return { ok: true, already: true };
  if (c.status === "locked") return { error: "case_locked" };
  c.status = "active"; c.startedDay = g.s.day;
  for (const k of m.start?.known || []) { g.s.known[k] = true; if (g.s.encountered[k] == null) g.s.encountered[k] = g.s.day; }
  for (const a of m.start?.artifacts || []) g.s.artifacts[a] = { ...g.s.artifacts[a], visible: true, wasVisible: true };
  fire(g, "case.start", { case: id });
  return { ok: true };
}

export function closeCase(g, id) {
  const c = g.s.cases?.[id];
  if (c && c.status === "active") { c.status = "closed"; c.closedDay = g.s.day; }
}

/** After every action: unlock cases whose requirements hold, and start cases found in the world. */
export function updateCases(g) {
  for (const [id, c] of Object.entries(g.s.cases || {})) {
    const m = g.w.mysteries.get(id);
    if (c.status === "locked" && g.check(m.requires)) c.status = "available";
    if (c.status === "available" && m.start?.discover && g.check(m.start.discover)) startCase(g, id);
  }
}

export function isCase(g, id) { return caseList(g).some(c => c.id === id); }

/** The only case on offer, if there is exactly one. Used when an old action has no case. */
export function soleCase(g) { const l = caseList(g); return l.length === 1 ? l[0].id : null; }

/** @returns {{ok:string[]} | {error:string}} */
export function cleanCases(g, list) {
  const out = [...new Set(asArray(list))];
  for (const id of out) if (!isCase(g, id)) return { error: "unknown_case" };
  return { ok: out };
}

const LISTS = { evidence: "evidence", hypothesis: "hypotheses", note: "notes", event: "timeline" };

/** Set which cases an item belongs to. An empty list makes it unclassified. */
export function setCases(g, kind, id, cases) {
  const key = LISTS[kind];
  if (!key) return { error: "bad_kind" };
  const item = g.s[key].find(x => x.id === id);
  if (!item) return { error: "unknown_item" };
  const c = cleanCases(g, cases);
  if ("error" in c) return c;
  item.cases = c.ok;
  return { ok: true };
}

/** Filter for Casebook lists: null = all, "" = unclassified, otherwise a case id. */
export function inFilter(item, filter) {
  if (filter == null) return true;
  const c = asArray(item.cases);
  return filter === "" ? c.length === 0 : c.includes(filter);
}

/** Endings the player has reached, with their epilogues. No conditions, no truth. */
export function endingsView(g) {
  return g.s.endings.map(key => {
    const [mid, eid] = key.split(":");
    const m = g.w.mysteries.get(mid);
    const e = asArray(m?.endings).find(x => x.id === eid);
    return { key, case: mid, caseTitle: m?.title || mid, id: eid, title: e?.title || null, epilogue: e?.epilogue || null, closes: !!e?.closes };
  });
}

/** "locked" | "available" | "active" | "closed" (or "unknown" for a seed). The world goes on either way. */
export function caseStatus(g, id) { return g.s.cases?.[id]?.status ?? "unknown"; }

/** Save migration 4 → 5: case states. Old saves played the first start-screen case from day one. */
export function migrateCaseStates(s, w) {
  s.cases = {};
  for (const m of w.mysteries.values()) if (playable(m)) s.cases[m.id] = { status: m.requires ? "locked" : "available" };
  const first = [...w.mysteries.values()].find(m => playable(m) && m.start?.menu) ?? [...w.mysteries.values()].find(playable);
  if (first && s.started) {
    const closed = (s.endings || []).some(k => { const [mid, eid] = k.split(":"); return mid === first.id && w.mysteries.get(mid)?.endings?.find(e => e.id === eid)?.closes; });
    s.cases[first.id] = { status: closed ? "closed" : "active", startedDay: w.meta.startDay ?? 1 };
  }
}

/** Add `cases: []` to every Casebook item and a case to every report (save migration 3 → 4). */
export function migrateCases(s, w) {
  for (const k of ["evidence", "hypotheses", "notes", "timeline"]) for (const x of s[k] || []) if (!Array.isArray(x.cases)) x.cases = [];
  // Reports made before cases existed all belonged to the only playable case.
  const first = [...w.mysteries.values()].find(m => playable(m) && m.start?.menu)?.id ?? [...w.mysteries.values()].find(playable)?.id ?? null;
  for (const r of s.reports || []) if (!r.case) r.case = first;
}
