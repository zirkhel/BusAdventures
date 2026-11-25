// Probe for Casebook step 5, point 9 (Anders, 25.11.2026): can a player learn hidden canon by
// asking Dana or publishing through The Daily Record? A player who trusts her enough can build any
// claim they can name, link one piece of evidence at a time and ask her, as often as they like.
// This records what she says for every (claim, saved evidence) pair, for each claim with every
// piece linked (with and without Supports links between them), and what a real publish does:
// refused or not, her lines, what was cut and what went out. Run it in twin worlds that differ
// only in hidden canon and compare: any difference is something the player can learn from her.
import { Game } from "../../core/game.js";
import { gather } from "./scenarios.mjs";
import { initialForm } from "../../core/provenance.js";

/** Drop the world's lookup caches after a twin changes it, so nothing stale hides a leak. */
function fresh(w) { delete w._lexicon; delete w._handles; delete w._names; return w; }

/** Visible text of an artifact version, for the hidden-person twins. */
const textOf = (a, v) => [a.url, v.title ?? a.title, v.body ?? a.body, ...(v.comments ?? a.comments ?? []).map(c => c.text)].filter(Boolean).join("\n");

/**
 * Hidden-only twins. Everything the player can read or see stays the same. A twin runs after the
 * same play (so the Casebook is identical), unless it is marked beforePlay: then it must not change
 * anything the player sees, and the probe checks that the saved evidence is the same.
 * @type {Record<string, ((w:any, g?:any) => any) & {beforePlay?:boolean}>}
 */
export const twins = {
  /** Every claim's truth flipped, and the derived facts emptied. */
  truth(w) { for (const c of w.claims.values()) c.truth = c.truth === "true" ? "false" : "true"; w.facts.length = 0; return fresh(w); },
  /** No evidence is tagged as backing any claim: the hidden `supports` lists are emptied in the world. */
  supports(w) {
    for (const a of w.artifacts.values()) { if (a.supports) a.supports = []; for (const v of a.versions) if (v.supports) v.supports = []; }
    for (const img of w.images.values()) if (img.supports) img.supports = [];
    for (const c of w.characters.values()) for (const r of c.responses || []) if (r.supports) r.supports = [];
    for (const r of w.rules) for (const e of r.do || []) if (e.message?.supports) e.message.supports = [];
    return fresh(w);
  },
  /** As above, and the copies of `supports` in the save's received messages. */
  supportsAll(w, g) { twins.supports(w); for (const m of g?.s.messages || []) if (m.supports) m.supports = []; return fresh(w); },
  /** Each claim's supports moved to the next claim, also in the save, so "non-empty" checks are caught too. */
  supportsShuffled(w, g) {
    const ids = [...w.claims.keys()], next = Object.fromEntries(ids.map((id, i) => [id, ids[(i + 1) % ids.length]]));
    const mv = l => Array.isArray(l) ? l.map(x => next[x] ?? x) : l;
    for (const a of w.artifacts.values()) { a.supports = mv(a.supports); for (const v of a.versions) v.supports = mv(v.supports); }
    for (const img of w.images.values()) img.supports = mv(img.supports);
    for (const c of w.characters.values()) for (const r of c.responses || []) r.supports = mv(r.supports);
    for (const m of g?.s.messages || []) m.supports = mv(m.supports);
    return fresh(w);
  },
  /** Hidden mentions emptied everywhere, also where an alias is in the text. */
  mentionsEmpty(w, g) {
    for (const a of w.artifacts.values()) { a.mentions = []; for (const v of a.versions) if (v.mentions) v.mentions = []; }
    for (const c of w.characters.values()) for (const r of c.responses || []) if (r.mentions) r.mentions = [];
    for (const m of g?.s.messages || []) if (m.mentions) m.mentions = [];
    return fresh(w);
  },
  /** Hidden mentions listing every entity and account. */
  mentionsAll(w, g) {
    const all = [...w.entities.keys(), ...w.accounts.keys()];
    for (const a of w.artifacts.values()) { a.mentions = all; for (const v of a.versions) v.mentions = all; }
    for (const c of w.characters.values()) for (const r of c.responses || []) r.mentions = all;
    for (const m of g?.s.messages || []) m.mentions = all;
    return fresh(w);
  },
  /** No predefined claims at all. */
  claimsGone(w) { w.claims.clear(); return fresh(w); },
  /** Decoy claims on the probed triples, with their own review texts and bold flags, all true. */
  claimsDecoy(w) {
    for (const c of [...w.claims.values()]) { c.bold = !c.bold; c.review = { strong: "DECOY", weak: "DECOY", none: "DECOY" }; c.truth = "true"; }
    return fresh(w);
  },
  /** Hidden origin: who really runs every account, whether it is human, hidden sources. */
  provenance(w) {
    for (const acc of w.accounts.values()) { acc.operatedBy = "echo"; acc.isHuman = !acc.isHuman; }
    for (const a of w.artifacts.values()) { a.source = "echo"; for (const v of a.versions) if (v.source) v.source = "echo"; }
    for (const e of w.entities.values()) if ("isHuman" in e) e.isHuman = !e.isHuman;
    return fresh(w);
  },
  /**
   * Hidden people with the same initials (Anders, 25.11.2026, answer 3): for every person, one
   * secret and one never-named person "X. Surname" alike, listed in the hidden `mentions` of every
   * page that names the original, so they are "encountered" in play. "M. Quinn" must still be Mara.
   */
  hiddenPeopleAdded: Object.assign((w) => {
    const people = [...w.entities.values()].filter(e => e.kind === "person" && !e.secret && initialForm(e.name));
    for (const e of people) {
      const last = e.name.split(/\s+/).at(-1), ini = e.name[0];
      for (const [suffix, secret] of [["hidden", true], ["unnamed", false]]) {
        const id = `zz_${e.id}_${suffix}`;
        w.entities.set(id, { id, kind: "person", name: `${ini}zz${suffix} ${last}`, secret, isHuman: true });
        for (const a of w.artifacts.values()) for (const v of a.versions) {
          const t = textOf(a, v);
          if (t.includes(e.name) || t.includes(initialForm(e.name))) v.mentions = [...(v.mentions ?? a.mentions ?? []), id];
        }
      }
    }
    return fresh(w);
  }, { beforePlay: true }),
  /** Every person the player has not visibly met (not a topic, not named in the Casebook, not a contact) removed. */
  hiddenPeopleRemoved(w, g) {
    const texts = g.s.evidence.map(e => {
      if (e.message) return g.s.messages.find(m => m.id === e.message)?.text ?? "";
      const a = w.artifacts.get(e.artifact); const v = a?.versions.find(x => x.id === e.version) ?? a?.versions[0];
      return a ? textOf(a, v) : "";
    }).join("\n").toLowerCase();
    const contacts = new Set([...w.characters.values()].map(c => c.entity));
    for (const e of [...w.entities.values()]) {
      if (e.kind !== "person" || g.s.known[e.id] || contacts.has(e.id)) continue;
      const forms = [e.name, ...(e.aliases || []), initialForm(e.name)].filter(Boolean).map(f => f.toLowerCase());
      if (forms.some(f => texts.includes(f))) continue;
      w.entities.delete(e.id);
    }
    return fresh(w);
  },
};

/** Claims that are not predefined, one per predicate, so the probe also covers what the canon has no entry for. */
export const extraTriples = [
  { claim: "X-is_dead", subject: "iris", predicate: "is_dead" },
  { claim: "X-operates", subject: "owen", predicate: "operates", object: "acc_junopark" },
  { claim: "X-not_real", subject: "renee", predicate: "not_real" },
  { claim: "X-paid", subject: "brightline", predicate: "paid", object: "daily_record" },
  { claim: "X-caused", subject: "theo", predicate: "caused", object: "evt_mara_death" },
  { claim: "X-altered", subject: "kestrel", predicate: "altered", object: "acc_eastfieldnotes" },
  { claim: "X-knew_about", subject: "dana", predicate: "knew_about", object: "evt_mara_death" },
  { claim: "X-connected_to", subject: "mara", predicate: "connected_to", object: "kestrel" },
];

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

/** State as the player could compare it, without the action log. */
const stateKey = s => JSON.stringify({ ...s, log: undefined });

/**
 * @returns {{ single: Record<string,string>, all: Record<string,any>, mine: Record<string,string>, triples: any[], evidence: string[], refusalChangedState: string[] }}
 * single["S1|A11/v1"] is Dana's line for that claim with only that evidence linked.
 */
export function probe(w, twin = null) {
  if (twin?.beforePlay) twin(w);
  const g = play(w);
  // The claims to ask about are taken before the twin, so a twin without claims asks the same.
  const claimList = [...w.claims.values()].map(c => ({ claim: c.id, ...structuredClone((c.match || [c])[0]) }))
    .sort((a, b) => a.claim.localeCompare(b.claim)).concat(extraTriples);
  if (twin && !twin.beforePlay) twin(w, g);
  // Evidence is keyed by what it is, not by its id, so twins whose ids shift can be compared.
  const keyOf = e => { if (!e.message) return [e.artifact, e.version, e.image].filter(Boolean).join("/");
    const m = g.s.messages.find(m => m.id === e.message); return `msg:${m?.thread}:${m?.text}`; };
  const ev = g.s.evidence.map(e => e.id), key = Object.fromEntries(g.s.evidence.map(e => [e.id, keyOf(e)]));
  const single = {}, all = {}, mine = {}, triples = [], refusalChangedState = [];
  const lines = hid => g.review("daily_record", [hid]).lines.map(l => l.text).join(" ");
  /** A real publish on a copy of the state: what the player sees, never what the world scores. */
  const publish = hid => {
    const snap = structuredClone(g.s);
    const before = stateKey(g.s);
    const r = g.publish("daily_record", [hid]);
    const out = { refused: !!r.refused, error: r.error ?? null, lines: (r.lines ?? []).map(l => l.text), cut: (r.report?.cut ?? []).length,
      published: (r.report?.items ?? []).length };
    if (r.refused && stateKey(g.s) !== before) refusalChangedState.push(hid);
    g.s = snap;
    return out;
  };
  for (const t of claimList) {
    for (const id of [t.subject, t.object].filter(Boolean)) g.s.known[id] = g.s.known[id] || true;
    triples.push(t);
    for (const e of ev) {
      const h = g.hypothesize({ subject: t.subject, predicate: t.predicate, object: t.object, evidence: [e] });
      if (!h.id) continue;
      single[`${t.claim}|${key[e]}`] = lines(h.id);
      g.dispatch({ type: "deleteHypothesis", id: h.id });
    }
    const h = g.hypothesize({ subject: t.subject, predicate: t.predicate, object: t.object, evidence: ev });
    const plain = { text: lines(h.id), publish: publish(h.id) };
    // Every piece supports the next one, so names borrowed through links are exercised too.
    const nLinks = (g.s.links || []).length;
    for (let i = 0; i + 1 < ev.length; i++) g.addLink({ a: ev[i], b: ev[i + 1], kind: "supports" });
    const linked = { text: lines(h.id), publish: publish(h.id) };
    g.s.links = g.s.links.slice(0, nLinks);
    all[t.claim] = { plain, linked };
    // Step 5's notes on the player's own marks, and the report snapshot: these must never differ.
    mine[t.claim] = JSON.stringify({ notes: g.editorNotes("daily_record", [h.id]), basis: g.reportBasis([h.id], []) })
      .replace(/"E\d+"/g, "E").replace(/"H\d+"/g, "H");
    g.dispatch({ type: "deleteHypothesis", id: h.id });
  }
  return { single, all, mine, triples, evidence: ev.map(e => key[e]), refusalChangedState };
}

/** Pairs whose answer differs between two probes, plus saved evidence that differs (beforePlay twins). */
export function differences(a, b) {
  const single = Object.keys(a.single).filter(k => a.single[k] !== b.single[k]);
  const all = Object.keys(a.all).filter(k => JSON.stringify(a.all[k]) !== JSON.stringify(b.all[k]));
  const mine = Object.keys(a.mine).filter(k => a.mine[k] !== b.mine[k]);
  const evidence = a.evidence.join("\n") === b.evidence.join("\n") ? [] : ["saved evidence differs"];
  return { single, all, mine, evidence };
}
