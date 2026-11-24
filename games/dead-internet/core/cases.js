// @ts-check
// Cases (mysteries) as the player's Casebook sees them.
//
// The Casebook belongs to the player, not to a case. Every item (evidence, theory, note,
// timeline event) has `cases: []`. An empty list means unclassified, which is the default.
// Nothing is linked to a case automatically: the player picks one, several or none.
// A report always belongs to exactly one case.
//
// Until the universe split (U1) adds state.cases, the cases on offer are the mysteries in
// the world that are not seeds. Nothing here reads claims, canon or endings conditions.

import { asArray } from "./util.js";

/** Cases the player can classify items under and report on. */
export function caseList(g) {
  return [...g.w.mysteries.values()].filter(m => m.status !== "seed" && m.status !== "locked").map(m => ({ id: m.id, title: m.title || m.id }));
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

/** "open" until an ending that closes the case has been reached. The world goes on either way. */
export function caseStatus(g, id) {
  return endingsView(g).some(e => e.case === id && e.closes) ? "closed" : "open";
}

/** Add `cases: []` to every Casebook item and a case to every report (save migration 3 → 4). */
export function migrateCases(s, w) {
  for (const k of ["evidence", "hypotheses", "notes", "timeline"]) for (const x of s[k] || []) if (!Array.isArray(x.cases)) x.cases = [];
  // Reports made before cases existed all belonged to the only playable case.
  const first = [...w.mysteries.values()].find(m => m.status !== "seed" && m.status !== "locked")?.id ?? null;
  for (const r of s.reports || []) if (!r.case) r.case = first;
}
