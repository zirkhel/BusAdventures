// @ts-check
// Timeline: the player's own reconstruction of events. Not a summary of the canonical story.
// Everything in an event is what the player entered or picked. Nothing here reads canon,
// facts, claims or secret entities, so nothing can be corrected or hinted at.
// Wrong dates, events that never happened and events that contradict each other are allowed.
//
// Event:
//   { id, title, description, note,
//     date: { kind: "exact", value: "YYYY-MM-DD", time?: "HH:MM" }
//         | { kind: "approx", value: "YYYY" | "YYYY-MM" | "YYYY-MM-DD", label?: string }
//         | { kind: "range", from: "YYYY-MM-DD", to: "YYYY-MM-DD" }
//         | { kind: "unknown" },
//     dateSource?: string     which date the player chose ("published", "taken", "in text"…), free text
//     about: [entity/account ids]   only things the player has investigated or saved
//     evidence: [{ id, stance: "supports" | "contradicts" }]
//     theories: [hypothesis ids]
//     source?: { artifact?, version?, message?, image? }   where it was created from (no evidence implied)
//     cases: [case ids]       empty = unclassified (the default); never filled in automatically
//     day, edited? }

import { isPublicRef } from "./discovery.js";
import { cleanCases } from "./cases.js";

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const APPROX = /^\d{4}(?:-\d{2}(?:-\d{2})?)?$/;
const TIME = /^\d{2}:\d{2}$/;

/** Clean and check a date. Never compares it with anything in the world. */
export function normalizeDate(d) {
  if (!d || d.kind === "unknown") return { ok: { kind: "unknown" } };
  if (d.kind === "exact") {
    if (!ISO_DAY.test(String(d.value || "")) || !validDay(d.value)) return { error: "bad_date" };
    const out = { kind: "exact", value: d.value };
    if (d.time) { if (!TIME.test(d.time)) return { error: "bad_time" }; out.time = d.time; }
    return { ok: out };
  }
  if (d.kind === "approx") {
    if (!APPROX.test(String(d.value || ""))) return { error: "bad_date" };
    const out = { kind: "approx", value: d.value };
    if (d.label) out.label = String(d.label).slice(0, 40);
    return { ok: out };
  }
  if (d.kind === "range") {
    if (!ISO_DAY.test(String(d.from || "")) || !ISO_DAY.test(String(d.to || "")) || !validDay(d.from) || !validDay(d.to)) return { error: "bad_date" };
    // A range the wrong way round is kept as entered: the player may be wrong.
    return { ok: { kind: "range", from: d.from, to: d.to } };
  }
  return { error: "bad_date" };
}

function validDay(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

/** Sort key from the player's own date. Unknown dates sort last. */
export function sortKey(ev) {
  const d = ev.date || { kind: "unknown" };
  if (d.kind === "exact") return `${d.value}T${d.time || "99:99"}`;
  if (d.kind === "approx") return d.value.length === 4 ? `${d.value}-06-30T~` : d.value.length === 7 ? `${d.value}-15T~` : `${d.value}T~`;
  if (d.kind === "range") return `${d.from}T~`;
  return "~";
}

function cleanEvent(g, input, base = {}) {
  const title = String(input.title ?? base.title ?? "").trim();
  if (!title) return { error: "empty_title" };
  const nd = normalizeDate("date" in input ? input.date : base.date);
  if (nd.error) return { error: nd.error };
  const about = [...new Set(input.about ?? base.about ?? [])];
  // Only what the player has investigated or saved, so the editor can never offer an unknown name.
  for (const id of about) if (!isPublicRef(g, id) || !(g.s.known[id] || g.s.saved[id] != null)) return { error: "unknown_ref" };
  const evidence = [];
  for (const x of input.evidence ?? base.evidence ?? []) {
    if (!g.s.evidence.some(e => e.id === x.id)) return { error: "unknown_evidence" };
    if (x.stance !== "supports" && x.stance !== "contradicts") return { error: "bad_stance" };
    if (!evidence.some(y => y.id === x.id)) evidence.push({ id: x.id, stance: x.stance });
  }
  const theories = [...new Set(input.theories ?? base.theories ?? [])];
  for (const id of theories) if (!g.s.hypotheses.some(h => h.id === id)) return { error: "unknown_hypothesis" };
  const cs = cleanCases(g, input.cases ?? base.cases ?? []);
  if ("error" in cs) return cs;
  /** @type {any} */
  const ev = { title: title.slice(0, 140), description: String(input.description ?? base.description ?? "").trim(), note: String(input.note ?? base.note ?? "").trim(),
    date: nd.ok, about, evidence, theories, cases: cs.ok };
  const ds = String(input.dateSource ?? base.dateSource ?? "").trim();
  if (ds) ev.dateSource = ds.slice(0, 40);
  const src = input.source ?? base.source;
  if (src && (src.artifact || src.message)) ev.source = { artifact: src.artifact ?? null, version: src.version ?? null, message: src.message ?? null, image: src.image ?? null };
  return { ok: ev };
}

export function createEvent(g, input) {
  const r = cleanEvent(g, input || {});
  if (r.error) return r;
  const ev = { id: `T${g.s.nextId++}`, ...r.ok, day: g.s.day };
  g.s.timeline.push(ev);
  return { ok: true, id: ev.id };
}

export function updateEvent(g, id, patch) {
  const i = g.s.timeline.findIndex(e => e.id === id);
  if (i < 0) return { error: "unknown_event" };
  const cur = g.s.timeline[i];
  const r = cleanEvent(g, patch || {}, cur);
  if (r.error) return r;
  g.s.timeline[i] = { id, ...r.ok, day: cur.day, edited: g.s.day };
  return { ok: true, id };
}

export function deleteEvent(g, id) {
  if (!g.s.timeline.some(e => e.id === id)) return { error: "unknown_event" };
  g.s.timeline = g.s.timeline.filter(e => e.id !== id);
  return { ok: true };
}

/** Attach evidence (supports / contradicts) or detach it (stance null). */
export function linkEventEvidence(g, eventId, evId, stance) {
  const ev = g.s.timeline.find(e => e.id === eventId);
  if (!ev) return { error: "unknown_event" };
  if (!g.s.evidence.some(e => e.id === evId)) return { error: "unknown_evidence" };
  ev.evidence = ev.evidence.filter(x => x.id !== evId);
  if (stance === "supports" || stance === "contradicts") ev.evidence.push({ id: evId, stance });
  else if (stance != null) return { error: "bad_stance" };
  return { ok: true };
}

export function linkEventTheory(g, eventId, hypId, on = true) {
  const ev = g.s.timeline.find(e => e.id === eventId);
  if (!ev) return { error: "unknown_event" };
  if (!g.s.hypotheses.some(h => h.id === hypId)) return { error: "unknown_hypothesis" };
  ev.theories = ev.theories.filter(x => x !== hypId);
  if (on) ev.theories.push(hypId);
  return { ok: true };
}

/** Keep links valid when evidence or a theory is removed. */
export function forgetEvidence(g, evId) { for (const ev of g.s.timeline) ev.evidence = ev.evidence.filter(x => x.id !== evId); }
export function forgetTheory(g, hypId) { for (const ev of g.s.timeline) ev.theories = ev.theories.filter(x => x !== hypId); }

const cmp = (x, y) => (x < y ? -1 : x > y ? 1 : 0);

/** The player's timeline, sorted only by the player's own dates. Stable for equal keys. */
export function timelineView(g) {
  return g.s.timeline.map((e, i) => ({ e, i })).sort((a, b) => cmp(sortKey(a.e), sortKey(b.e)) || a.i - b.i)
    .map(({ e }) => ({ ...e, supports: e.evidence.filter(x => x.stance === "supports").length, contradicts: e.evidence.filter(x => x.stance === "contradicts").length }));
}

// ── Dates in text and on things, for prefilling (never for checking) ─────────

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/**
 * Read a date as written ("Jan 20, 2026", "July 2025", "Mar 10", "2025-07-04").
 * A day without a year takes `yearHint` and is marked as a guess. Returns null if it is not a date.
 * @returns {{date:any, guessedYear?:boolean} | null}
 */
export function parseDateText(text, yearHint) {
  const t = String(text || "").trim();
  let m = t.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}:\d{2}))?/);
  if (m) { const d = normalizeDate({ kind: "exact", value: `${m[1]}-${m[2]}-${m[3]}`, time: m[4] }); return d.ok ? { date: d.ok } : null; }
  m = t.match(/^([A-Za-z]{3,9})\.? (\d{1,2})(?:, (\d{4}))?$/);
  if (m) {
    const mi = MONTHS.indexOf(m[1].slice(0, 3).toLowerCase());
    if (mi < 0) return null;
    const year = m[3] || yearHint;
    if (!year) return null;
    const d = normalizeDate({ kind: "exact", value: `${year}-${String(mi + 1).padStart(2, "0")}-${String(+m[2]).padStart(2, "0")}` });
    return d.ok ? { date: d.ok, guessedYear: !m[3] } : null;
  }
  m = t.match(/^([A-Za-z]{3,9}) (\d{4})$/);
  if (m) {
    const mi = MONTHS.indexOf(m[1].slice(0, 3).toLowerCase());
    if (mi < 0) return null;
    return { date: { kind: "approx", value: `${m[2]}-${String(mi + 1).padStart(2, "0")}` } };
  }
  return null;
}

/**
 * Dates the player can see on a source, to pick from when creating an event: when it was
 * published or changed, the time in a photo's metadata, and dates written in the text.
 * The player decides which one (if any) is the date of the event.
 * @returns {{label:string, date:any, from:string}[]}
 */
export function dateCandidates(g, source) {
  const out = [];
  const add = (label, from, parsed) => { if (parsed && !out.some(o => JSON.stringify(o.date) === JSON.stringify(parsed.date))) out.push({ label, from, date: parsed.date, guessedYear: !!parsed.guessedYear }); };
  if (source?.message) {
    const m = g.s.messages.find(x => x.id === source.message);
    if (m) {
      add("Message received", "received", parseDateText(dayDate(g, m.day)));
      const year = dayDate(g, m.day).slice(0, 4);
      for (const sp of g.scan(m.text)) if (sp.type === "date") add(`“${sp.text}” in the message`, "in text", parseDateText(sp.text, year));
    }
    return out;
  }
  if (!source?.artifact) return out;
  const v = g.view(source.artifact, source.version || undefined);
  if (v.error || v.locked) return out;
  const year = String(v.date || g.date).slice(0, 4);
  if (v.date) add(v.cached ? "Date of this copy" : "Published", v.cached ? "copy" : "published", parseDateText(v.date));
  for (const im of source.image ? [source.image] : []) {
    const taken = g.imageInfo(im)?.meta?.taken;
    if (taken) add("Photo taken (metadata)", "metadata", parseDateText(taken));
  }
  for (const sp of g.scan(`${v.title || ""}\n${v.body || ""}`)) if (sp.type === "date") add(`“${sp.text}” in the text`, "in text", parseDateText(sp.text, year));
  return out;
}

function dayDate(g, day) {
  const start = g.w.meta.startDate, d0 = g.w.meta.startDay ?? 1;
  const [y, m, d] = start.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + (day - d0)));
  return t.toISOString().slice(0, 10);
}
