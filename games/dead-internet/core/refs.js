// @ts-check
// References in text: which parts of a piece of content are names, accounts, addresses,
// dates or reference numbers. No DOM. The presentation layer turns the spans into text the
// player can tap, and decides which actions to offer for each type.
//
// Rules that keep the investigation fair:
//  - Every word can be tapped, so being a reference never marks something as important.
//  - Secret entities are never in the lexicon.
//  - An alias that is also an account handle is an identity claim ("truthseeker_88" is Owen),
//    so it is treated as the handle, never as the person.
//  - Spans keep the text as written. Callers show and search that text, not a canonical name,
//    so tapping an alias never tells the player who it stands for.

const MONTHS = "Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|July?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?";
const TLD = "com|net|co|org|blog|link|io|gov|social|search|app|me|channel|example";

/** Patterns, in priority order. Earlier types win where matches overlap. */
export const PATTERNS = [
  { type: "email", re: new RegExp(String.raw`[\w.+\-•]+@[a-z0-9\-]+(?:\.[a-z0-9\-]+)+`, "gi") },
  { type: "url", re: new RegExp(String.raw`(?:https?:\/\/)?(?:[a-z0-9\-]+\.)+(?:${TLD})\/[^\s,;)"'”’]*[^\s,;)"'”’.:!?]`, "gi") },
  { type: "domain", re: new RegExp(String.raw`(?<![\w@.\-])(?:[a-z0-9\-]+\.)+(?:${TLD})(?![\w\-])`, "gi") },
  { type: "handle", re: /(?<![\w@])@[a-z0-9_.]*[a-z0-9_]/gi },
  { type: "date", re: new RegExp(String.raw`\b(?:${MONTHS})\.? \d{1,2}(?:, \d{4})?\b|\b(?:${MONTHS}) \d{4}\b|\b\d{4}-\d{2}-\d{2}\b`, "g") },
  { type: "refnum", re: /(?<![\w#])#\d{3,}\b|\b[A-Z]{2,5}-\d{2,}(?:-[A-Z0-9]+)*\b/g },
];

const KIND_TYPE = { person: "person", org: "org", place: "place", project: "project", event: "event", system: "term" };

/**
 * Names the world knows how to point at, longest first.
 * @param {any} w world from buildWorld()
 * @returns {{text:string, type:string, id:string|null, alias:boolean}[]}
 */
export function buildLexicon(w) {
  const handles = new Set();
  for (const acc of w.accounts.values()) handles.add(String(acc.handle).toLowerCase().replace(/^@/, ""));
  const out = new Map();
  const add = (text, type, id, alias) => {
    const t = String(text || "").trim();
    if (t.length < 3 || /[()]/.test(t)) return;
    const k = t.toLowerCase();
    if (!out.has(k)) out.set(k, { text: t, type, id, alias });
  };
  for (const e of w.entities.values()) {
    if (e.secret) continue;
    const type = KIND_TYPE[e.kind] || "term";
    add(e.name, type, e.id, false);
    for (const al of e.aliases || []) if (!handles.has(String(al).toLowerCase().replace(/^@/, ""))) add(al, type, e.id, true);
  }
  for (const acc of w.accounts.values()) {
    const handle = String(acc.handle);
    // Connect handles are found by the @ pattern; other platforms' user names go in the lexicon.
    if (!handle.startsWith("@") && !/\.(?:[a-z]+)$/i.test(handle)) add(handle, "handle", acc.id, false);
    if (acc.displayName && acc.displayName !== handle) add(acc.displayName, "account", acc.id, false);
  }
  for (const t of w.raw?.terms || []) {
    add(t.text, t.type || "term", t.id ?? null, false);
    for (const al of t.aliases || []) add(al, t.type || "term", t.id ?? null, true);
  }
  return [...out.values()].sort((a, b) => b.text.length - a.text.length);
}

const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** One regex for the whole lexicon, cached on the world. */
function lexiconMatcher(w) {
  if (!w._lexicon) {
    const lex = buildLexicon(w);
    const byLower = new Map(lex.map(e => [e.text.toLowerCase(), e]));
    const re = lex.length ? new RegExp(`(?<![\\w@.])(?:${lex.map(e => escapeRe(e.text)).join("|")})(?![\\w])`, "gi") : null;
    w._lexicon = { lex, byLower, re };
  }
  return w._lexicon;
}

/** Account id for a handle as written (with or without @), or null. */
export function accountForHandle(w, text) {
  if (!w._handles) {
    w._handles = new Map();
    for (const acc of w.accounts.values()) {
      const k = String(acc.handle).toLowerCase();
      w._handles.set(k, acc.id); w._handles.set(k.replace(/^@/, ""), acc.id);
    }
  }
  return w._handles.get(String(text).toLowerCase()) || w._handles.get(String(text).toLowerCase().replace(/^@/, "")) || null;
}

/**
 * Find references in a text.
 * @param {any} w world
 * @param {string} text
 * @returns {{start:number, end:number, text:string, type:string, id:string|null, alias:boolean}[]}
 */
export function scanText(w, text) {
  const s = String(text ?? "");
  /** @type {{start:number, end:number, text:string, type:string, id:string|null, alias:boolean}[]} */
  const spans = [];
  const free = (a, b) => !spans.some(x => a < x.end && b > x.start);
  for (const p of PATTERNS) {
    p.re.lastIndex = 0;
    for (const m of s.matchAll(p.re)) {
      let t = m[0], at = m.index ?? 0;
      if (p.type === "email") { const lead = t.match(/^\.+/)?.[0] || ""; at += lead.length; t = t.slice(lead.length); }
      if (p.type === "domain" || p.type === "url") t = t.replace(/[.]+$/, "");
      if (!t || !free(at, at + t.length)) continue;
      let id = null;
      if (p.type === "handle") id = accountForHandle(w, t);
      spans.push({ start: at, end: at + t.length, text: t, type: p.type, id, alias: false });
    }
  }
  const { byLower, re } = lexiconMatcher(w);
  if (re) {
    re.lastIndex = 0;
    for (const m of s.matchAll(re)) {
      const at = m.index ?? 0, t = m[0];
      if (!free(at, at + t.length)) continue;
      const e = byLower.get(t.toLowerCase());
      if (!e) continue;
      spans.push({ start: at, end: at + t.length, text: t, type: e.type, id: e.id, alias: e.alias });
    }
  }
  return spans.sort((a, b) => a.start - b.start);
}

/**
 * Search suggestions: earlier searches and names the player has investigated or saved.
 * Never anything they have not acted on.
 * @param {any} g game
 * @param {string} query
 * @param {number} [limit]
 * @returns {{text:string, kind:"history"|"known"}[]}
 */
export function suggest(g, query, limit = 6) {
  const q = String(query || "").trim().toLowerCase();
  const out = [];
  const seen = new Set();
  const add = (text, kind) => {
    const t = String(text || "").trim();
    const k = t.toLowerCase();
    if (!t || seen.has(k) || k === q) return;
    if (q && !matches(k, q)) return;
    seen.add(k); out.push({ text: t, kind });
  };
  for (const s of [...g.s.searches].reverse()) add(s.q, "history");
  // Only what the player has investigated or saved, never names they merely scrolled past.
  if (q) {
    for (const id of g.known()) {
      const e = g.w.entities.get(id);
      if (e) add(e.name, "known");
      const acc = g.w.accounts.get(id);
      if (acc) { add(acc.handle, "known"); if (acc.displayName) add(acc.displayName, "known"); }
    }
  }
  const rank = x => (x.text.toLowerCase().startsWith(q) ? 0 : 1) + (x.kind === "history" ? 0 : 0.2);
  return (q ? out.sort((a, b) => rank(a) - rank(b)) : out).slice(0, limit);
}

/** Every word of the query starts a word in the text (or the text contains the query). */
function matches(text, q) {
  if (q.length >= 4 && text.includes(q)) return true;
  const words = text.split(/[^a-z0-9@]+/).filter(Boolean);
  return q.split(/\s+/).every(part => words.some(w => w.startsWith(part.replace(/^@/, "")) || w.startsWith(part)));
}
