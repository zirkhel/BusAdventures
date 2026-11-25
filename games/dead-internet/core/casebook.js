// @ts-check
// Casebook: saved evidence, free-text notes, structured hypotheses and published reports.
//
// The casebook never tells the player whether a hypothesis is right or well supported.
// It shows facts about the player's own work: how many pieces of evidence are linked and
// how many sources they visibly come from (core/provenance.js). Hidden origins (`source`),
// hidden mentions and truth are only consulted when a report is published, to decide what
// happens in the world. A reviewer (Dana) judges like a person would, from what she can see:
// she can be fooled by sources that look independent but are not.

import { investigate } from "./discovery.js";
import { asArray, fill } from "./util.js";
import { viewArtifact, savedArtifactView, supportsOf, mentionsOf, sourceOf } from "./artifacts.js";
import { applyEffects, fire } from "./rules.js";
import { nameOf, str } from "./world.js";
import { isCase, soleCase } from "./cases.js";
import { apparentSource, visibleRefsOfEvidence, establishedAliasesOfEvidence } from "./provenance.js";
import { forgetInQuestions, forgetInLinks, isDirected } from "./workbench.js";
import { ownCount } from "./sources.js";

// ── Evidence ────────────────────────────────────────────────────────────────

/**
 * Save something as evidence.
 * @param {any} g
 * @param {{artifact?:string, version?:string, message?:string, image?:string, note?:string, quote?:{text:string}}} ref
 */
export function saveEvidence(g, ref) {
  const s = g.s;
  const quote = ref.quote == null ? null : String(ref.quote.text || "").trim();
  if (quote === "") return { error: "empty_quote" };
  let snapshot = null;
  if (ref.artifact) {
    if (s.seen[ref.artifact] == null) return { error: "not_seen" };
    snapshot = viewArtifact(g, ref.artifact, ref.version ? { version: ref.version } : {});
    if (snapshot.error || snapshot.locked) {
      const saved = s.evidence.find(e => e.artifact === ref.artifact && e.version === ref.version);
      if (!saved) return { error: "not_available" };
      snapshot = savedArtifactView(g, saved.id);
      if (snapshot.error) return { error: "not_available" };
    }
    if (ref.image) {
      const imgs = [...asArray(snapshot.images), ...asArray(snapshot.video?.frames).map(f => f.image), snapshot.video?.poster];
      if (!imgs.includes(ref.image)) return { error: "image_not_in_artifact" };
    }
  } else if (ref.message) {
    const m = s.messages.find(m => m.id === ref.message);
    if (!m || m.from === "player") return { error: "unknown_message" };
  } else return { error: "nothing_to_save" };

  const version = snapshot?.versionId ?? null;
  const same = s.evidence.find(e => e.artifact === (ref.artifact ?? null) && e.version === version &&
    e.message === (ref.message ?? null) && e.image === (ref.image ?? null) && (e.quote?.text ?? null) === quote);
  if (same) return { ok: true, id: same.id, duplicate: true };

  const e = { id: `E${s.nextId++}`, artifact: ref.artifact ?? null, version, message: ref.message ?? null,
    image: ref.image ?? null, note: ref.note ?? "", day: s.day, cases: [],
    opened: null, marks: { reviewed: null, important: false, doubtful: false }, shelf: null,
    ...(quote ? { quote: { text: quote } } : {}), ...(snapshot ? { snapshot: structuredClone(snapshot) } : {}) };
  s.evidence.push(e);
  if (ref.artifact) fire(g, "evidence.save", { artifact: ref.artifact });
  return { ok: true, id: e.id };
}

export function removeEvidence(g, id) {
  const s = g.s;
  s.evidence = s.evidence.filter(e => e.id !== id);
  for (const h of s.hypotheses) { h.evidence = h.evidence.filter(x => x !== id); h.against = asArray(h.against).filter(x => x !== id); }
  forgetInQuestions(g, "evidence", id);
  forgetInLinks(g, id);
  return { ok: true };
}

/** Hidden canon: real source key, supported claims and authored mentions. Scoring only, never shown. */
export function evidenceFacts(g, e) {
  if (e.message) {
    const m = g.s.messages.find(m => m.id === e.message);
    return { source: m?.source ?? m?.thread ?? "unknown", supports: asArray(m?.supports), mentions: [...asArray(m?.mentions), m?.thread] };
  }
  const a = g.w.artifacts.get(e.artifact);
  if (e.image) {
    const img = g.w.images.get(e.image);
    return { source: img?.source ?? a?.source ?? e.artifact, supports: [...asArray(img?.supports)], mentions: [...asArray(img?.depicts), ...mentionsOf(g, e.artifact, e.version ?? undefined)] };
  }
  return { source: sourceOf(g, e.artifact, e.version ?? undefined), supports: supportsOf(g, e.artifact, e.version ?? undefined), mentions: mentionsOf(g, e.artifact, e.version ?? undefined) };
}

// ── Hypotheses ──────────────────────────────────────────────────────────────

function kindOf(g, id) {
  if (g.w.accounts.has(id)) return "account";
  const e = g.w.entities.get(id);
  return e ? e.kind : null;
}

/** Check a [subject] [predicate] [object] triple against the predicate definition. */
function checkTriple(g, h) {
  const p = g.w.predicates.get(h.predicate);
  if (!p) return "unknown_predicate";
  if (!h.subject || !g.s.known[h.subject]) return "unknown_subject";
  if (!asArray(p.subjectKinds).includes(kindOf(g, h.subject))) return "bad_subject";
  if (p.arity === 2) {
    if (!h.object || !g.s.known[h.object]) return "unknown_object";
    if (!asArray(p.objectKinds).includes(kindOf(g, h.object))) return "bad_object";
  }
  return null;
}

// A theory is the player's own words (`title`) and/or a structured claim
// [subject] [predicate] [object]. Only a structured claim can be published (see publish).
// `evidence` is the evidence the player counts FOR it (unchanged from earlier saves, and the
// only list scoring reads); `against` is evidence the player counts against it. Status,
// its history and alternatives are the player's own judgments: no rule or score reads them.

export const THEORY_STATUSES = ["open", "convinced", "rejected"];

/** Whether a theory has a structured claim (and so can be published). */
export function isStructured(h) { return !!(h && h.predicate); }

const wantsTriple = h => h.subject != null || h.predicate != null || h.object != null;

export function createHypothesis(g, h) {
  const title = String(h.title ?? "").trim();
  const structured = wantsTriple(h);
  const p = structured ? g.w.predicates.get(h.predicate) : null;
  const hyp = { id: `H${g.s.nextId++}`, title, subject: structured ? h.subject ?? null : null, predicate: structured ? h.predicate ?? null : null,
    object: p?.arity === 2 ? h.object : null, evidence: [], against: [], note: h.note ?? "", day: g.s.day, cases: [],
    status: "open", statusLog: [{ day: g.s.day, status: "open" }], alternatives: [] };
  if (!structured && !title) return { error: "empty_theory" };
  const err = structured ? checkTriple(g, hyp) : null;
  if (err) return { error: err };
  for (const id of asArray(h.evidence)) if (g.s.evidence.some(e => e.id === id) && !hyp.evidence.includes(id)) hyp.evidence.push(id);
  for (const id of asArray(h.against)) if (g.s.evidence.some(e => e.id === id) && !hyp.evidence.includes(id) && !hyp.against.includes(id)) hyp.against.push(id);
  g.s.hypotheses.push(hyp);
  return { ok: true, id: hyp.id };
}

/**
 * Edit the player's words, note or structured claim. `predicate: null` removes the structured
 * claim (only if the theory has its own words). Evidence, status and alternatives have their own actions.
 */
export function updateHypothesis(g, id, patch) {
  const h = g.s.hypotheses.find(h => h.id === id);
  if (!h) return { error: "unknown_hypothesis" };
  const next = { ...h };
  if ("title" in patch) next.title = String(patch.title ?? "").trim();
  if ("note" in patch) next.note = String(patch.note ?? "");
  if ("predicate" in patch && patch.predicate == null) { next.subject = null; next.predicate = null; next.object = null; }
  else for (const k of ["subject", "predicate", "object"]) if (k in patch) next[k] = patch[k] ?? null;
  if (isStructured(next) && g.w.predicates.get(next.predicate)?.arity !== 2) next.object = null;
  if (!isStructured(next) && (next.subject != null || next.object != null)) return { error: "unknown_predicate" };
  if (!isStructured(next) && !next.title) return { error: "empty_theory" };
  const err = isStructured(next) ? checkTriple(g, next) : null;
  if (err) return { error: err };
  Object.assign(h, next);
  return { ok: true };
}

export function deleteHypothesis(g, id) {
  g.s.hypotheses = g.s.hypotheses.filter(h => h.id !== id);
  for (const h of g.s.hypotheses) h.alternatives = asArray(h.alternatives).filter(x => x !== id);
  forgetInQuestions(g, "theories", id);
  return { ok: true };
}

/**
 * Link evidence to a theory for or against it (or unlink with on=false). A piece of evidence is
 * either for or against one theory, never both: linking it one way removes the other.
 */
export function linkEvidence(g, hypId, evId, on = true, stance = "supports") {
  const h = g.s.hypotheses.find(h => h.id === hypId);
  if (!h || !g.s.evidence.some(e => e.id === evId)) return { error: "unknown" };
  if (on && stance !== "supports" && stance !== "contradicts") return { error: "bad_stance" };
  h.evidence = h.evidence.filter(x => x !== evId);
  h.against = asArray(h.against).filter(x => x !== evId);
  if (on) (stance === "contradicts" ? h.against : h.evidence).push(evId);
  return { ok: true };
}

/** The player's own status for a theory. Every change is logged with the day. */
export function setTheoryStatus(g, id, status) {
  const h = g.s.hypotheses.find(h => h.id === id);
  if (!h) return { error: "unknown_hypothesis" };
  if (!THEORY_STATUSES.includes(status)) return { error: "bad_status" };
  if (h.status === status) return { ok: true, unchanged: true };
  h.status = status;
  h.statusLog.push({ day: g.s.day, status });
  return { ok: true };
}

/** Mark two theories as alternative explanations of each other (stored once, shown on both). */
export function linkAlternative(g, aId, bId, on = true) {
  const a = g.s.hypotheses.find(h => h.id === aId), b = g.s.hypotheses.find(h => h.id === bId);
  if (!a || !b || a === b) return { error: "unknown_hypothesis" };
  a.alternatives = a.alternatives.filter(x => x !== bId);
  b.alternatives = b.alternatives.filter(x => x !== aId);
  if (on) a.alternatives.push(bId);
  return { ok: true };
}

/** Alternatives of a theory, in both directions. */
function alternativesOf(g, h) {
  return [...new Set([...asArray(h.alternatives), ...g.s.hypotheses.filter(x => asArray(x.alternatives).includes(h.id)).map(x => x.id)])]
    .filter(id => g.s.hypotheses.some(x => x.id === id));
}

export function addNote(g, text, from, about) {
  const t = String(text ?? "").trim();
  if (!t) return { error: "empty_note" };
  /** @type {any} */
  const n = { id: `N${g.s.nextId++}`, text: t, day: g.s.day, cases: [] };
  if (from && (from.artifact || from.message)) n.from = { artifact: from.artifact ?? null, version: from.version ?? null, message: from.message ?? null };
  // Saving a name you can read marks it as known (so you can ask about it or use it in a theory).
  // Secrets never; and only real ids.
  if (about && investigate(g, about, t).ok) { n.about = about; g.s.saved[about] = g.s.day; }
  g.s.notes.push(n);
  return { ok: true, id: n.id };
}

export function updateNote(g, id, text) {
  const n = g.s.notes.find(n => n.id === id);
  if (!n) return { error: "unknown_note" };
  const t = String(text ?? "").trim();
  if (!t) return { error: "empty_note" };
  n.text = t;
  n.edited = g.s.day;
  return { ok: true };
}

export function deleteNote(g, id) {
  if (!g.s.notes.some(n => n.id === id)) return { error: "unknown_note" };
  g.s.notes = g.s.notes.filter(n => n.id !== id);
  return { ok: true };
}

/** What kind of thing an id is, for the hypothesis builder: "account" or the entity kind. */
export function kindOfId(g, id) { return kindOf(g, id); }

/**
 * Evidence as the casebook shows it: who and what is visibly named in it (known, non-secret
 * ids only) and where it visibly comes from. Never its hidden source, mentions or claims.
 * @returns {{about:string[], source:string, sourceLabel:string, aliases:{text:string, id:string, name:string, evidence:string}[]}}
 */
export function evidenceAbout(g, e) {
  const about = visibleRefsOfEvidence(g, e).filter(id => id && g.s.known[id] && !g.w.entities.get(id)?.secret &&
    (g.w.entities.has(id) || g.w.accounts.has(id)));
  const src = apparentSource(g, e);
  // Nicknames this item uses that another saved piece introduced, shown so the player can see why
  // it counts as naming them. Only names in the item itself: never names borrowed through a link.
  const aliases = establishedAliasesOfEvidence(g, e).filter(x => about.includes(x.id))
    .map(x => ({ text: x.text, id: x.id, name: nameOf(g.w, x.id), evidence: x.evidence }));
  return { about, source: src.key, sourceLabel: src.label, aliases };
}

/** The structured claim as a sentence. A theory without one falls back to the player's words. */
export function hypothesisLabel(g, h) {
  if (!isStructured(h)) return String(h.title || "");
  const p = g.w.predicates.get(h.predicate);
  return fill(p?.template ?? "{subject} {predicate} {object}", { subject: nameOf(g.w, h.subject), object: nameOf(g.w, h.object), predicate: p?.label ?? h.predicate });
}

/** How a theory reads in the Casebook: the player's words first, otherwise the structured claim. */
export function theoryLabel(g, h) { return h.title || hypothesisLabel(g, h); }

/** Evidence count and visibly distinct sources for a list of evidence ids. */
function counts(g, ids) {
  const items = asArray(ids).map(id => g.s.evidence.find(e => e.id === id)).filter(Boolean);
  return { n: items.length, sources: new Set(items.map(e => apparentSource(g, e).key)).size };
}

/** Every visible source among the saved evidence, for pickers: key, label, how much evidence. */
export function visibleSources(g) {
  const by = new Map();
  for (const e of g.s.evidence) {
    const src = apparentSource(g, e);
    if (!by.has(src.key)) by.set(src.key, { key: src.key, label: src.label, count: 0 });
    by.get(src.key).count++;
  }
  return [...by.values()];
}

/** What the casebook shows: counts only, never an assessment. */
export function casebookView(g) {
  return {
    evidence: g.s.evidence.map(e => ({ ...e })),
    notes: g.s.notes.map(n => ({ ...n })),
    hypotheses: g.s.hypotheses.map(h => {
      const forC = counts(g, h.evidence), against = counts(g, h.against);
      // The player's own count (core/sources.js): their "same origin" answers and links merge sources.
      const ownFor = ownCount(g, h.evidence), ownAgainst = ownCount(g, h.against);
      return { ...h, label: theoryLabel(g, h), structured: isStructured(h), claimLabel: isStructured(h) ? hypothesisLabel(g, h) : null,
        evidenceCount: forC.n, sourceCount: forC.sources, againstCount: against.n, againstSourceCount: against.sources,
        ownSourceCount: ownFor.own, ownAgainstSourceCount: ownAgainst.own, notTrustedFor: ownFor.notTrusted, notAuthenticFor: ownFor.notAuthentic,
        alternatives: alternativesOf(g, h), statusLog: h.statusLog.map(x => ({ ...x })) };
    }),
    // The player's own questions (core/workbench.js). Only ever written by the player.
    questions: (g.s.questions || []).map(q => ({ ...q, links: structuredClone(q.links), statusLog: q.statusLog.map(x => ({ ...x })) })),
    // The player's own links between evidence (core/workbench.js).
    links: (g.s.links || []).map(l => ({ ...l, directed: isDirected(l.kind) })),
    // The player's own timeline, for reports later. Events carry only what the player entered.
    timeline: (g.s.timeline || []).map(e => ({ ...e })),
    reports: g.s.reports.map(r => ({ id: r.id, day: r.day, case: r.case, channel: r.channel, items: r.items.map(i => ({ label: i.label })),
      // With a snapshot (step 5) the cut claims read as they were worded then; older reports fall back to the theory now.
      cut: asArray(r.cut).map(id => { const t = r.snapshot?.theories?.find(x => x.hypothesis === id); if (t) return t.claimLabel;
        const h = g.s.hypotheses.find(x => x.id === id); return h ? hypothesisLabel(g, h) : null; }).filter(Boolean),
      events: asArray(r.events).map(e => ({ id: e.id, title: e.title, date: e.date })),
      // The player's own Casebook when the report went out (step 5): counts and reservations, never truth.
      snapshot: r.snapshot ? structuredClone(r.snapshot) : null })),
  };
}

// ── Truth and support (internal, used when publishing) ──────────────────────

function sameTriple(a, b) {
  return a.subject === b.subject && a.predicate === b.predicate && (a.object ?? null) === (b.object ?? null);
}

/**
 * Canonical claim that this hypothesis states, if any. With a case, only that case's claims
 * count; everything else is judged from the world model (universe canon).
 */
export function matchClaim(g, h, caseId = null) {
  const own = caseId ? new Set(asArray(g.w.mysteries.get(caseId)?.claims)) : null;
  for (const c of g.w.claims.values()) {
    if (own && !own.has(c.id)) continue;
    const variants = c.match ? asArray(c.match) : [c];
    if (variants.some(v => sameTriple(v, h))) return c;
  }
  return null;
}

/** @returns {"true"|"false"|"partial"|"unknown"} */
export function truthOf(g, h, caseId = null) {
  const c = matchClaim(g, h, caseId);
  if (c) return c.truth;
  const p = g.w.predicates.get(h.predicate);
  const w = g.w;
  switch (p?.truth) {
    case "facts":
      return w.facts.some(f => sameTriple(f, h)) ? "true" : "false";
    case "operatedBy": {
      const acc = w.accounts.get(h.object);
      // No operatedBy (a light account) is unresolved canon: nobody knows who runs it.
      if (acc && acc.operatedBy === undefined) return "unknown";
      return acc && acc.operatedBy === h.subject ? "true" : "false";
    }
    case "notHuman": {
      const acc = w.accounts.get(h.subject);
      if (acc) {
        if (acc.operatedBy === undefined) return "unknown";
        const who = w.entities.get(acc.claimsToBe);
        if (who && who.isHuman === false) return "true";
        // An account run by someone other than the person it claims to be is a fake persona.
        return acc.operatedBy !== acc.claimsToBe ? "true" : "false";
      }
      const e = w.entities.get(h.subject);
      if (!e || e.isHuman == null) return "unknown";
      return e.isHuman === false ? "true" : "false";
    }
    case "relation": {
      const linked = (x, y) => {
        const e = w.entities.get(x), acc = w.accounts.get(x);
        if (e && asArray(e.relations).some(r => r.to === y)) return true;
        if (acc && (acc.claimsToBe === y || acc.operatedBy === y)) return true;
        return false;
      };
      return linked(h.subject, h.object) || linked(h.object, h.subject) ? "true" : "false";
    }
    default: return "unknown";
  }
}

/** Independent sources among the linked evidence that actually back this hypothesis. */
export function supportOf(g, h, caseId = null) {
  const c = matchClaim(g, h, caseId);
  const sources = new Set();
  for (const id of h.evidence) {
    const e = g.s.evidence.find(e => e.id === id);
    if (!e) continue;
    const f = evidenceFacts(g, e);
    const backs = c ? f.supports.includes(c.id)
      : f.mentions.includes(h.subject) && (h.object == null || f.mentions.includes(h.object));
    if (backs) sources.add(f.source);
  }
  const n = sources.size;
  return { claim: c?.id ?? null, sources: [...sources], strength: n >= 2 ? "strong" : n === 1 ? "weak" : "none" };
}

/**
 * The visible basis for a claim, as a reviewer sees it (point 9, Anders 25.11.2026). Never
 * hidden canon: no supports, truth, mentions, claim list or hidden origin.
 *
 * A piece in the claim's for-list counts when the names visibly established in it cover every
 * party (subject, and object if there is one), or when the player linked it "X supports Y" to
 * another piece in the for-list and the two together cover every party. X, the supporting
 * piece, borrows Y's own names for this claim; Y gains nothing, and names Y borrowed itself are
 * not passed on (one hop). Only "supports" links count. A link adds no origin and confirms no
 * independence: n is the number of distinct visible origins among the pieces that count.
 * @returns {{claim:null, sources:string[], n:number, strength:"strong"|"weak"|"none", counted:string[]}}
 */
export function apparentSupportOf(g, h, caseId = null) {
  const parties = [h.subject, h.object].filter(x => x != null);
  const linked = asArray(h.evidence).map(id => g.s.evidence.find(e => e.id === id)).filter(Boolean);
  const refs = new Map(linked.map(e => [e.id, visibleRefsOfEvidence(g, e)]));
  const covers = (...ids) => parties.every(p => ids.some(id => refs.get(id).includes(p)));
  const counted = new Set(linked.filter(e => covers(e.id)).map(e => e.id));
  for (const l of asArray(g.s.links)) if (l.kind === "supports" && refs.has(l.a) && refs.has(l.b) && covers(l.a, l.b)) counted.add(l.a);
  const sources = new Set(linked.filter(e => counted.has(e.id)).map(e => apparentSource(g, e).key));
  const n = sources.size;
  return { claim: null, sources: [...sources], n, strength: n >= 2 ? "strong" : n === 1 ? "weak" : "none", counted: [...counted] };
}

const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
/** Numbers as words in what a character says ("two different visible origins"); digits stay in overviews. */
export const numberWord = n => NUMBER_WORDS[n] ?? String(n);

// ── Review and publishing ───────────────────────────────────────────────────

/**
 * Which line a reviewer uses: about her own outlet (the channel's visible `outlet`), then the
 * predicate's own lines, then big claims (the predicate's `bold`), then the usual ones. Only the
 * relation the player chose and the channel decide; never whether the claim is predefined.
 * none and one go with a cut, several with going forward (reviewed channels require strong).
 */
export function reviewKey(g, ch, h, n) {
  const level = n >= 2 ? "several" : n === 1 ? "one" : "none";
  const R = `review.${ch.reviewer}.v`;
  const has = k => typeof str(g.w, k) === "string" && !str(g.w, k).startsWith("[");
  if (ch.outlet && (h.subject === ch.outlet || h.object === ch.outlet)) return `${R}.ownOutlet.${level}`;
  if (has(`${R}.predicate.${h.predicate}.${level}`)) return `${R}.predicate.${h.predicate}.${level}`;
  if (g.w.predicates.get(h.predicate)?.bold) return `${R}.bold.${level}`;
  return `${R}.${level}`;
}

/**
 * A reviewer's journalistic comment on source strength. Never on truth. The reviewer only
 * knows what she can see (apparentSupportOf), so she can be wrong or manipulated.
 */
export function review(g, channelId, hypIds, opts = {}) {
  const ch = g.w.channels.get(channelId);
  if (!ch || !ch.reviewer) return { error: "no_reviewer" };
  const caseId = opts.case ?? ch.case ?? soleCase(g);
  if ((g.s.trust[ch.reviewer] ?? 0) < (ch.minTrust ?? 0)) return { ok: true, lines: [{ text: str(g.w, `review.${ch.reviewer}.noTrust`) }] };
  const lines = [];
  for (const id of hypIds) {
    const h = g.s.hypotheses.find(h => h.id === id);
    if (!h || !isStructured(h)) continue;
    const sup = apparentSupportOf(g, h, caseId);
    lines.push({ hypothesis: id, text: fill(str(g.w, reviewKey(g, ch, h, sup.n)), { claim: hypothesisLabel(g, h), n: numberWord(sup.n), object: nameOf(g.w, h.object) }) });
  }
  return { ok: true, lines };
}

/** Which channels a case can publish through: the universe's own and the case's. */
export function channelsFor(g, caseId) {
  return [...g.w.channels.values()].filter(c => (!c.case || c.case === caseId) && (!c.if || g.check(c.if)));
}

/** Visible sources for and against a timeline event, counted like theories. Never its accuracy. */
function eventSupport(g, ev) {
  const count = stance => new Set(ev.evidence.filter(x => x.stance === stance)
    .map(x => g.s.evidence.find(e => e.id === x.id)).filter(Boolean).map(e => apparentSource(g, e).key)).size;
  return { supportSources: count("supports"), contradictSources: count("contradicts") };
}

/**
 * Publish a report about one case through a channel.
 * opts.case: the case (defaults to the only case on offer); opts.events: timeline event ids to include.
 * Returns { ok, report } or { error } / { refused, lines }.
 */
export function publish(g, channelId, hypIds, opts = {}) {
  const s = g.s, w = g.w;
  const ch = w.channels.get(channelId);
  if (!ch) return { error: "unknown_channel" };
  const caseId = opts.case ?? ch.case ?? soleCase(g);
  if (!caseId) return { error: "no_case" };
  if (!isCase(g, caseId)) return { error: "unknown_case" };
  if ((ch.case && ch.case !== caseId) || (ch.if && !g.check(ch.if))) return { error: "channel_unavailable" };
  // Only theories with a structured claim can be published; the player's own words stay in the Casebook.
  const hyps = asArray(hypIds).map(id => s.hypotheses.find(h => h.id === id)).filter(isStructured);
  const evs = asArray(opts.events).map(id => s.timeline.find(e => e.id === id)).filter(Boolean);
  if (!hyps.length) return { error: "empty_report" };
  if (ch.reviewer && (s.trust[ch.reviewer] ?? 0) < (ch.minTrust ?? 0)) return { refused: true, lines: [{ text: str(w, `review.${ch.reviewer}.noTrust`) }] };

  const scoring = w.mysteries.get(caseId)?.publishing?.scoring ?? w.meta.publishing.scoring;
  const items = [], cut = [];
  for (const h of hyps) {
    // The editor cuts what looks weak to her; the world judges what was really behind it.
    if (ch.requiresStrong && apparentSupportOf(g, h, caseId).strength !== "strong") { cut.push(h.id); continue; }
    const sup = supportOf(g, h, caseId);
    const truth = truthOf(g, h, caseId);
    let delta;
    if (truth === "true") delta = scoring[`true_${sup.strength}`];
    else if (truth === "partial") delta = scoring.partial;
    else if (truth === "false") delta = scoring.false;
    else delta = scoring.unknown ?? 0;
    delta = Math.round(delta * (ch.credibilityWeight ?? 1));
    items.push({ hypothesis: h.id, label: hypothesisLabel(g, h), subject: h.subject, predicate: h.predicate, object: h.object,
      claim: sup.claim, truth, strength: sup.strength, sources: sup.sources, credibility: delta });
  }
  if (!items.length) return { refused: true, lines: review(g, channelId, cut, { case: caseId }).lines ?? [] };

  // Timeline events go in as the player wrote them, with their source counts. They are not judged here.
  const events = evs.map(ev => ({ id: ev.id, title: ev.title, description: ev.description, date: { ...ev.date }, ...eventSupport(g, ev) }));
  const report = { id: `R${s.nextId++}`, day: s.day, case: caseId, channel: channelId, items, cut, events };
  s.reports.push(report);
  const claims = [], exposed = [];
  for (const it of items) {
    s.credibility = Math.max(0, Math.min(100, s.credibility + it.credibility));
    const key = it.claim ?? `${it.subject}|${it.predicate}|${it.object ?? ""}`;
    if (!(key in s.published)) s.published[key] = { day: s.day, channel: channelId };
    if (it.claim) claims.push(it.claim);
    if (it.truth === "true" && it.strength !== "none") {
      const prev = s.exposed[key];
      if (!prev || (prev.strength !== "strong" && it.strength === "strong")) s.exposed[key] = { day: s.day, channel: channelId, strength: it.strength };
      if (it.strength === "strong" && it.claim) exposed.push(it.claim);
    }
  }
  applyEffects(g, ch.onPublish, { channel: channelId });
  fire(g, "report.published", { channel: channelId, case: caseId, claims, exposed });
  g.checkEndings();
  return { ok: true, report: { id: report.id, case: caseId, items: items.map(i => ({ label: i.label })), cut, events: events.map(e => ({ id: e.id, title: e.title })) } };
}
