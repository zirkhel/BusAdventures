// Probe for Casebook step 5, point 9 (Anders, 25.11.2026): can a player learn hidden canon by
// asking Dana? A player who trusts her enough can build any claim they can name, link one piece
// of evidence at a time and ask her, as often as they like. This records what she says for every
// (canonical claim, saved evidence) pair, and for each claim with every piece linked, plus whether
// The Daily Record would cut it. Run it in twin worlds that differ only in hidden canon and
// compare: any difference is something the player can learn from her.
import { Game } from "../../core/game.js";
import { gather } from "./scenarios.mjs";
import { apparentSupportOf } from "../../core/casebook.js";

/** Hidden-only twins. Everything the player can read or see stays the same. */
export const twins = {
  /** Every claim's truth flipped (true ↔ false). */
  truth(w) { for (const c of w.claims.values()) c.truth = c.truth === "true" ? "false" : "true"; return w; },
  /** No evidence is tagged as backing any claim: the hidden `supports` lists are emptied. */
  supports(w) {
    for (const a of w.artifacts.values()) { if (a.supports) a.supports = []; for (const v of a.versions) if (v.supports) v.supports = []; }
    for (const img of w.images.values()) if (img.supports) img.supports = [];
    for (const c of w.characters.values()) for (const r of c.responses || []) if (r.supports) r.supports = [];
    for (const r of w.rules) for (const e of r.do || []) if (e.message?.supports) e.message.supports = [];
    return w;
  },
};

/** The same player in any world: the scripted investigation, then saving everything reachable. */
function play(w) {
  const g = new Game(w, { seed: 7 });
  gather(g);
  for (const a of w.artifacts.values()) {
    if (w.disabled?.has(a.id)) continue;
    g.s.artifacts[a.id] = { ...g.s.artifacts[a.id], visible: true };
    const o = g.open(a.id);
    if (!o.ok || o.view?.locked || o.view?.error) continue;
    g.save({ artifact: a.id, version: o.view.versionId });
    for (const im of o.view.images || []) g.save({ artifact: a.id, image: im });
  }
  for (const m of g.s.messages) if (m.from !== "player") g.save({ message: m.id });
  g.s.trust.dana = 99;
  return g;
}

/**
 * @returns {{ single: Record<string,string>, all: Record<string,{text:string, cut:boolean}>, mine: Record<string,string>, triples: any[], evidence: string[] }}
 * single["S1|E12"] is Dana's line for that claim with only that evidence linked.
 */
export function probe(w, twin = null) {
  const g = play(w);
  // The twin's hidden change is made after the same play, so the player's Casebook is identical
  // and only what they can't see differs when they ask (hidden support also drives some world rules).
  if (twin) twin(w);
  // Evidence is keyed by what it is, not by its id, so twins whose ids shift can be compared.
  const keyOf = e => { if (!e.message) return [e.artifact, e.version, e.image].filter(Boolean).join("/");
    const m = g.s.messages.find(m => m.id === e.message); return `msg:${m?.thread}:${m?.text}`; };
  const ev = g.s.evidence.map(e => e.id), key = Object.fromEntries(g.s.evidence.map(e => [e.id, keyOf(e)]));
  const single = {}, all = {}, mine = {}, triples = [];
  for (const c of [...w.claims.values()].sort((a, b) => a.id.localeCompare(b.id))) {
    const t = (c.match || [c])[0];
    for (const id of [t.subject, t.object].filter(Boolean)) g.s.known[id] = g.s.known[id] || { day: g.s.day };
    triples.push({ claim: c.id, ...t });
    for (const e of ev) {
      const h = g.hypothesize({ subject: t.subject, predicate: t.predicate, object: t.object, evidence: [e] });
      if (!h.id) continue;
      single[`${c.id}|${key[e]}`] = g.review("daily_record", [h.id]).lines.map(l => l.text).join(" ");
      g.dispatch({ type: "deleteHypothesis", id: h.id });
    }
    const h = g.hypothesize({ subject: t.subject, predicate: t.predicate, object: t.object, evidence: ev });
    const hyp = g.s.hypotheses.find(x => x.id === h.id);
    all[c.id] = { text: g.review("daily_record", [h.id]).lines.map(l => l.text).join(" "),
      // The same test publish() applies on line `requiresStrong` (core/casebook.js): what a refused publish shows.
      cut: apparentSupportOf(g, hyp).strength !== "strong" };
    // Step 5's notes on the player's own marks, and the report snapshot: these must never differ.
    mine[c.id] = JSON.stringify({ notes: g.editorNotes("daily_record", [h.id]), basis: g.reportBasis([h.id], []) })
      .replace(/"E\d+"/g, "E").replace(/"H\d+"/g, "H");
    g.dispatch({ type: "deleteHypothesis", id: h.id });
  }
  return { single, all, mine, triples, evidence: ev.map(e => key[e]) };
}

/** Pairs whose answer differs between two probes. */
export function differences(a, b) {
  const single = Object.keys(a.single).filter(k => k in b.single && a.single[k] !== b.single[k]);
  const all = Object.keys(a.all).filter(k => JSON.stringify(a.all[k]) !== JSON.stringify(b.all[k]));
  const mine = Object.keys(a.mine).filter(k => a.mine[k] !== b.mine[k]);
  return { single, all, mine };
}
