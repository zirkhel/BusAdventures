// @ts-check
// Player judgments only. No rules, scoring, truth or automatic assessment.
import { liveVersionId, savedArtifactView } from "./artifacts.js";
import { apparentSource } from "./provenance.js";
import { asArray } from "./util.js";

export function updateEvidence(g, id, patch = {}) {
  const e = g.s.evidence.find(x => x.id === id);
  if (!e) return { error: "unknown_evidence" };
  if ("shelf" in patch && ![null, "irrelevant", "finished"].includes(patch.shelf)) return { error: "bad_shelf" };
  if (patch.opened) e.opened ??= g.s.day;
  if ("note" in patch) e.note = String(patch.note);
  for (const key of ["reviewed", "important", "doubtful"]) {
    if (key in patch) e.marks[key] = key === "reviewed" ? (patch[key] ? g.s.day : null) : !!patch[key];
  }
  if ("shelf" in patch) { e.shelf = patch.shelf; e.shelvedDay = patch.shelf ? g.s.day : null; }
  return { ok: true };
}

export function migrateEvidence(s, w) {
  for (const e of s.evidence) {
    e.opened = null;
    e.marks = { reviewed: null, important: false, doubtful: false };
    e.shelf = null;
    const a = w.artifacts.get(e.artifact);
    // Old saves with no version cannot recover an unknown historical copy. Pin the
    // current version at migration; never replace an explicit saved version.
    if (a && !e.version) e.version = liveVersionId({ s }, a);
    if (a && e.version) {
      const v = savedArtifactView({ s, w }, e.id);
      if (!v.error) e.snapshot = v;
    }
  }
}

// ── Questions ───────────────────────────────────────────────────────────────
// Open questions are the player's own lines ("Who paid for the account?"). They live in Notes,
// can be linked to evidence, people and things the player knows, visible sources, theories and
// cases, and the player marks them answered, sets them aside or reopens them. The game never
// writes a question and no rule reads them.

export const QUESTION_STATUSES = ["open", "answered", "dropped"];
export const QUESTION_LINKS = ["evidence", "topics", "sources", "theories"];

const emptyLinks = () => ({ evidence: [], topics: [], sources: [], theories: [] });

/** Whether `ref` is something the player may link a question to: only what they can see or made. */
function linkable(g, kind, ref) {
  const s = g.s, w = g.w;
  if (kind === "evidence") return s.evidence.some(e => e.id === ref);
  if (kind === "theories") return s.hypotheses.some(h => h.id === ref);
  if (kind === "topics") return !!s.known[ref] && (w.entities.has(ref) || w.accounts.has(ref)) && !w.entities.get(ref)?.secret;
  if (kind === "sources") return typeof ref === "string" && s.evidence.some(e => apparentSource(g, e).key === ref);
  return false;
}

export function addQuestion(g, q = {}) {
  const text = String(q.text ?? "").trim();
  if (!text) return { error: "empty_question" };
  const links = emptyLinks();
  for (const kind of QUESTION_LINKS) for (const ref of asArray(q.links?.[kind])) {
    if (!linkable(g, kind, ref)) return { error: "bad_link" };
    if (!links[kind].includes(ref)) links[kind].push(ref);
  }
  const s = g.s;
  const item = { id: `Q${s.nextId++}`, text, day: s.day, status: "open", statusLog: [{ day: s.day, status: "open" }], answer: "", links, cases: [] };
  (s.questions ??= []).push(item);
  return { ok: true, id: item.id };
}

export function updateQuestion(g, id, patch = {}) {
  const q = (g.s.questions || []).find(x => x.id === id);
  if (!q) return { error: "unknown_question" };
  if ("text" in patch && !String(patch.text ?? "").trim()) return { error: "empty_question" };
  if ("status" in patch && !QUESTION_STATUSES.includes(patch.status)) return { error: "bad_status" };
  if ("text" in patch) { q.text = String(patch.text).trim(); q.edited = g.s.day; }
  if ("answer" in patch) q.answer = String(patch.answer ?? "");
  if ("status" in patch && patch.status !== q.status) { q.status = patch.status; q.statusLog.push({ day: g.s.day, status: patch.status }); }
  return { ok: true };
}

export function linkQuestion(g, id, kind, ref, on = true) {
  const q = (g.s.questions || []).find(x => x.id === id);
  if (!q) return { error: "unknown_question" };
  if (!QUESTION_LINKS.includes(kind)) return { error: "bad_kind" };
  if (on && !linkable(g, kind, ref)) return { error: "bad_link" };
  q.links[kind] = q.links[kind].filter(x => x !== ref);
  if (on) q.links[kind].push(ref);
  return { ok: true };
}

export function deleteQuestion(g, id) {
  if (!(g.s.questions || []).some(x => x.id === id)) return { error: "unknown_question" };
  g.s.questions = g.s.questions.filter(x => x.id !== id);
  return { ok: true };
}

/** Drop a removed piece of evidence or a deleted theory from every question. */
export function forgetInQuestions(g, kind, ref) {
  for (const q of g.s.questions || []) q.links[kind] = q.links[kind].filter(x => x !== ref);
}

/**
 * Save migration 8 → 9: theories get "against", a status with history and alternatives;
 * questions start empty. Every existing link stays "for", and nothing is inferred.
 */
export function migrateTheories(s) {
  for (const h of s.hypotheses || []) {
    h.title ??= "";
    h.against = Array.isArray(h.against) ? h.against : [];
    h.status ??= "open";
    h.statusLog = Array.isArray(h.statusLog) ? h.statusLog : [{ day: h.day ?? 1, status: h.status }];
    h.alternatives = Array.isArray(h.alternatives) ? h.alternatives : [];
  }
  s.questions = Array.isArray(s.questions) ? s.questions : [];
}

// ── Links between evidence ──────────────────────────────────────────────────
// The player's own claims about how two or more pieces of evidence relate. They are shown on
// the evidence card, in comparisons and in theories. Nothing checks whether they are right,
// and no rule, score or reviewer reads them.

export const LINK_KINDS = ["supports", "contradicts", "related", "same_origin", "manipulated", "unrelated"];
/** Kinds with a direction: "a supports b", and "a may be manipulated, with b as the reference". */
export const DIRECTED_LINKS = ["supports", "manipulated"];
export const isDirected = kind => DIRECTED_LINKS.includes(kind);

/** One link per pair, kind and direction: for undirected kinds a–b and b–a are the same link. */
export function sameLink(x, kind, a, b) {
  if (x.kind !== kind) return false;
  return (x.a === a && x.b === b) || (!isDirected(kind) && x.a === b && x.b === a);
}

/**
 * Link exactly two pieces of evidence: { a, b, kind, note }. For directed kinds the order is the
 * meaning (a supports b; a is suspected, b is the reference). A link that already exists is
 * returned with duplicate: true (a new note replaces the old one). The game never judges it.
 */
export function addLink(g, link = {}) {
  const s = g.s;
  const { a, b } = link;
  if (a == null || b == null || a === b || "items" in link) return { error: "need_two" };
  if (![a, b].every(id => s.evidence.some(e => e.id === id))) return { error: "unknown_evidence" };
  if (!LINK_KINDS.includes(link.kind)) return { error: "bad_kind" };
  const note = String(link.note ?? "").trim();
  s.links ??= [];
  const same = s.links.find(x => sameLink(x, link.kind, a, b));
  if (same) { if (note && note !== same.note) { same.note = note; same.edited = s.day; } return { ok: true, id: same.id, duplicate: true }; }
  const l = { id: `L${s.nextId++}`, a, b, kind: link.kind, note, day: s.day };
  s.links.push(l);
  return { ok: true, id: l.id };
}

/** Change kind, note or direction ({ swap: true }). The pair itself never changes. */
export function updateLink(g, id, patch = {}) {
  const l = (g.s.links || []).find(x => x.id === id);
  if (!l) return { error: "unknown_link" };
  if ("kind" in patch && !LINK_KINDS.includes(patch.kind)) return { error: "bad_kind" };
  const kind = patch.kind ?? l.kind;
  const [a, b] = patch.swap ? [l.b, l.a] : [l.a, l.b];
  if (g.s.links.some(x => x !== l && sameLink(x, kind, a, b))) return { error: "duplicate_link" };
  const before = JSON.stringify([l.kind, l.a, l.b, l.note]);
  Object.assign(l, { kind, a, b });
  if ("note" in patch) l.note = String(patch.note ?? "").trim();
  if (JSON.stringify([l.kind, l.a, l.b, l.note]) !== before) l.edited = g.s.day;
  return { ok: true };
}

export function removeLink(g, id) {
  if (!(g.s.links || []).some(x => x.id === id)) return { error: "unknown_link" };
  g.s.links = g.s.links.filter(x => x.id !== id);
  return { ok: true };
}

/** A removed piece of evidence takes its links with it: a link always has two ends. */
export function forgetInLinks(g, evId) {
  if (!g.s.links) return;
  g.s.links = g.s.links.filter(l => l.a !== evId && l.b !== evId);
}

/** Save migration 9 → 10: links between evidence start empty. Nothing is inferred. */
export function migrateLinks(s) { s.links = Array.isArray(s.links) ? s.links : []; }
