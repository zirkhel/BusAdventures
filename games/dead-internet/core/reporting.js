// @ts-check
// Reporting with the player's own judgements (Casebook step 5).
//
// Two things live here, and both are only about the player's own Casebook:
//
//   editorNotes     what the editor (Dana) says *before* publishing about what the player has
//                   marked themselves: evidence they linked against a claim, their own count of
//                   independent sources ("same origin"), sources they don't trust or doubt are
//                   who they claim to be, and theories they rejected. It is advice. It never says
//                   whether a claim is true, and it is kept apart from review() (her comment on how
//                   the sources look) and from publish() (what the world does afterwards).
//   reportBasis     a snapshot of the player's Casebook behind each claim and event when a report
//                   goes out, stored on the report so it doesn't change when theories are revised.
//
// Nothing here is read by publish(), scoring, rules, the world's reaction or the endings
// (Anders, 25.11.2026: Dana reading the player's reservations is no reason to change the
// scoring rules). It never reads hidden canon: only the player's layer and apparentSource,
// through core/sources.js. tests/twin.test.mjs checks that it is identical in twin worlds.

import { asArray, fill } from "./util.js";
import { str } from "./world.js";
import { ownCount } from "./sources.js";
import { isStructured, theoryLabel, hypothesisLabel } from "./casebook.js";

const has = (g, id) => g.s.evidence.some(e => e.id === id);
const n = (k, one, many) => k === 1 ? one : many.replace("{n}", String(k));

/**
 * The player's own Casebook behind one theory: how much evidence for and against they linked,
 * how many sources it visibly comes from, how many by their own count, and their reservations.
 * Counts only, never an assessment.
 */
export function theoryBasis(g, h) {
  const forIds = asArray(h.evidence).filter(id => has(g, id)), againstIds = asArray(h.against).filter(id => has(g, id));
  const f = ownCount(g, forIds), a = ownCount(g, againstIds);
  return { hypothesis: h.id, label: theoryLabel(g, h), claimLabel: isStructured(h) ? hypothesisLabel(g, h) : null, status: h.status ?? "open",
    evidence: forIds.length, against: againstIds.length, sources: f.sources, own: f.own, againstSources: a.sources, ownAgainst: a.own,
    notTrusted: f.notTrusted, notAuthentic: f.notAuthentic };
}

/** The same for a timeline event: supporting and contradicting evidence, visible and own counts. */
export function eventBasis(g, ev) {
  const ids = stance => asArray(ev.evidence).filter(x => x.stance === stance && has(g, x.id)).map(x => x.id);
  const s = ownCount(g, ids("supports")), c = ownCount(g, ids("contradicts"));
  return { id: ev.id, title: ev.title, date: { ...ev.date }, supporting: ids("supports").length, contradicting: ids("contradicts").length,
    supportSources: s.sources, ownSupportSources: s.own, contradictSources: c.sources, ownContradictSources: c.own };
}

/** What the player's Casebook said about a report's claims and events. Stored with the report. */
export function reportBasis(g, hypIds, eventIds = []) {
  const hyps = asArray(hypIds).map(id => g.s.hypotheses.find(h => h.id === id)).filter(isStructured);
  const evs = asArray(eventIds).map(id => (g.s.timeline || []).find(e => e.id === id)).filter(Boolean);
  return { day: g.s.day, theories: hyps.map(h => theoryBasis(g, h)), events: evs.map(ev => eventBasis(g, ev)) };
}

/**
 * The editor's notes on what the player has marked themselves, before publishing. Only for a
 * channel with a reviewer who will talk to the player. Each note quotes the player's own
 * judgement back; none of them says whether the claim is true, and none changes what publishing
 * does (the editor's cut and the world's scoring are in publish(), unchanged).
 * @returns {{ok:true, notes:{hypothesis:string, kind:string, text:string}[]} | {error:string}}
 */
export function editorNotes(g, channelId, hypIds) {
  const ch = g.w.channels.get(channelId);
  if (!ch || !ch.reviewer) return { error: "no_reviewer" };
  if ((g.s.trust[ch.reviewer] ?? 0) < (ch.minTrust ?? 0)) return { ok: true, notes: [] };
  const T = key => { const v = str(g.w, `review.${ch.reviewer}.own.${key}`); return v.startsWith("[") ? null : v; };
  const notes = [];
  for (const id of asArray(hypIds)) {
    const h = g.s.hypotheses.find(x => x.id === id);
    if (!isStructured(h)) continue;
    const b = theoryBasis(g, h);
    const vars = { claim: b.claimLabel,
      against: n(b.against, "1 piece of evidence", "{n} pieces of evidence"),
      own: n(b.own, "1 source", "{n} sources"), visible: b.sources,
      notTrusted: n(b.notTrusted, "1 of the sources", "{n} of the sources"),
      notAuthentic: n(b.notAuthentic, "1 source is who it claims to be", "{n} sources are who they claim to be") };
    const add = (kind, when) => { const t = when ? T(kind) : null; if (t) notes.push({ hypothesis: h.id, kind, text: fill(t, vars) }); };
    add("rejected", b.status === "rejected");
    add("against", b.against > 0);
    add("ownCount", b.own < b.sources);
    add("notTrusted", b.notTrusted > 0);
    add("notAuthentic", b.notAuthentic > 0);
  }
  return { ok: true, notes };
}

/** Save migration 11 → 12: reports published before step 5 have no snapshot. Nothing is inferred. */
export function migrateReports(s) {
  for (const r of asArray(s.reports)) if (!("snapshot" in r)) r.snapshot = null;
}

/** Clean loaded snapshots: an object with lists, or nothing. */
export function cleanReports(s) {
  migrateReports(s);
  for (const r of asArray(s.reports)) {
    const x = r.snapshot;
    r.snapshot = x && typeof x === "object" && Array.isArray(x.theories) && Array.isArray(x.events) ? x : null;
  }
}
