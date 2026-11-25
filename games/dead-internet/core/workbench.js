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
