// @ts-check
// Provenance as the player can see it. Never canon.
//
// The world knows where every piece of content really comes from (artifact.source,
// message.source) and who it is really about (mentions). Those are hidden: two accounts that
// look unrelated may share one hidden source, and that is exactly what the player is meant
// to work out. Everything the Casebook shows, and everything a character judges, is built
// from this module instead:
//
//   apparentSource   who or what the evidence visibly comes from: the sender of a message,
//                    the account that posted, the person who sent an attachment, the URL of
//                    a hosted document, or the website.
//   visibleRefs      the names that are visibly in the content (its text, author, byline,
//                    comments), as established for the player (namesIn below). Hidden
//                    `mentions` never decide a name.
//
// This module must never read artifact/version/image `source`, `supports`, `mentions` on
// their own, accounts' operatedBy, facts, claims or canon. tests/twin.test.mjs checks that the
// Casebook gives identical results in a world where those hidden fields are different.

import { asArray } from "./util.js";
import { getVersion, liveVersionId, resolveVersion } from "./artifacts.js";
import { scanText, accountForHandle } from "./refs.js";

/** @typedef {{key:string, label:string}} Apparent */

/** The contact the player sees for a character: their account if they have one. */
function contactSource(g, charId) {
  const w = g.w;
  const c = w.characters.get(charId);
  const accId = c?.account ?? (w.accounts.has(charId) ? charId : null);
  const acc = accId ? w.accounts.get(accId) : null;
  if (acc) return { key: `account:${accId}`, label: acc.displayName || acc.handle };
  return { key: `contact:${charId}`, label: w.entities.get(c?.entity)?.name || charId };
}

function accountSource(g, accId) {
  const acc = g.w.accounts.get(accId);
  return { key: `account:${accId}`, label: acc?.displayName || acc?.handle || accId };
}

/** The first message the player received with this artifact attached. */
function deliveredBy(g, artifactId) {
  return g.s.messages.find(m => m.from !== "player" && asArray(m.attach).includes(artifactId)) ?? null;
}

const stripQuery = url => String(url || "").split(/[?#]/)[0];

/**
 * Where a piece of evidence visibly comes from.
 * @param {any} g
 * @param {{artifact?:string|null, message?:string|null}} e
 * @returns {Apparent}
 */
export function apparentSource(g, e) {
  const w = g.w;
  if (e.message) {
    const m = g.s.messages.find(x => x.id === e.message);
    return contactSource(g, m?.thread ?? "unknown");
  }
  const a = w.artifacts.get(e.artifact);
  if (!a) return { key: `unknown:${e.artifact}`, label: "Unknown" };
  // Whoever posted it, as shown on the page.
  if (a.author && w.accounts.has(a.author)) return accountSource(g, a.author);
  // A private file (email, attachment) comes from the person who sent it to you.
  const via = deliveredBy(g, a.id);
  if (via) return contactSource(g, via.thread);
  const url = stripQuery(a.url);
  const domain = url.split("/")[0];
  const pf = w.platforms.get(a.platform);
  // A post on a social site belongs to the handle in its address.
  const handle = url.match(/^[^/]+\/(@[\w.]+)/)?.[1];
  if (handle) {
    const acc = accountForHandle(w, handle);
    return acc ? accountSource(g, acc) : { key: `handle:${domain}/${handle.toLowerCase()}`, label: handle };
  }
  // A hosted document or a forum thread is its own source: the site only carries it.
  if (url && (a.type === "document" || pf?.kind === "forum")) return { key: `page:${url}`, label: url };
  if (domain) return { key: `site:${domain}`, label: pf?.name && pf.domain === domain ? pf.name : domain };
  return { key: `platform:${a.platform}`, label: pf?.name || "Unknown" };
}

/**
 * Text the player can read in one version of an artifact (what references are scanned in).
 * @returns {string}
 */
function visibleText(g, a, r) {
  const parts = [a.url, r.title, r.body];
  for (const c of asArray(r.comments)) parts.push(c.text, c.author ? `@${String(g.w.accounts.get(c.author)?.handle || "").replace(/^@/, "")}` : "");
  for (const im of asArray(r.images)) parts.push(g.w.images.get(im)?.caption);
  return parts.filter(Boolean).join("\n");
}

// ── Names the player can see (point 9, Anders 25.11.2026) ───────────────────────────────
// A name in visible text counts for an entity only when it is visibly established:
//   1. a full name, or a handle or display name for an account (refs.js). A loose first name in
//      running text ("Pat", "Mike", "Lindsay", "Tom") is not read as the account that uses it as
//      its display name. Visible account identity is kept apart from this: the sender, author,
//      byline and comment authors are added by account id (visibleRefsOfArtifact/-Message), and
//      the visible origin comes from apparentSource, so a post by @harborwalkerpat still has that
//      account as its origin and still names that account (the account, never the person);
//   2. a short form of a full name: an authored alias that is a run of the name's words
//      (optionally after "the") or contains the whole name, or "Initial. Surname" for a person;
//   3. a nickname (any other authored alias) once a saved piece of evidence introduces it as
//      "Full Name (alias)" or "alias (Full Name)";
//   4. an event named "<Full Name>'s <noun>", by "<form>'s <noun>" or "<noun> of <form>".
// A form is ambiguous when another *visible* candidate fits it: a topic the player has
// investigated, or someone whose full name is in their Casebook. Hidden people, secret
// entities and hidden `mentions` never decide anything here.

const lower = s => String(s ?? "").toLowerCase();
const words = s => lower(s).split(/\s+/).filter(Boolean);
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Is the alias a short form of the name: a run of its words (after an optional "the"), or the name plus more? */
export function isShortForm(alias, name) {
  const al = lower(alias), nm = lower(name);
  if (al.includes(nm)) return true;
  const a = words(al.replace(/^the\s+/, "")), n = words(nm);
  for (let i = 0; a.length && i + a.length <= n.length; i++) if (a.every((x, j) => n[i + j] === x)) return true;
  return false;
}

/** "M. Quinn" for "Mara Quinn"; null when the name has no first and last word. */
export function initialForm(name) {
  const n = String(name).split(/\s+/);
  return n.length >= 2 && /^[A-Z]/.test(n[0]) && /^[A-Z][a-z]/.test(n[n.length - 1]) ? `${n[0][0]}. ${n[n.length - 1]}` : null;
}

/** World tables, cached on the world (rebuilt when a test changes the world: delete w._names). */
function nameTables(w) {
  if (w._names) return w._names;
  const ents = [...w.entities.values()].filter(e => !e.secret);
  const owners = new Map(); // lower form -> Set(entity ids) that the form can stand for
  const own = (f, id) => { if (!f) return; const k = lower(f); if (!owners.has(k)) owners.set(k, new Set()); owners.get(k).add(id); };
  const full = new Map(); // lower full name -> Set(ids)
  const nick = new Map(); // lower nickname -> entity id
  const formsOf = new Map(); // entity id -> its forms (for event names)
  for (const e of ents) {
    if (!full.has(lower(e.name))) full.set(lower(e.name), new Set());
    full.get(lower(e.name)).add(e.id);
    const fs = [e.name];
    for (const al of e.aliases || []) {
      if (isShortForm(al, e.name)) { own(al, e.id); own(String(al).replace(/^the\s+/i, ""), e.id); fs.push(al); }
      else nick.set(lower(al), e.id);
    }
    if (e.kind === "person") {
      const ini = initialForm(e.name);
      if (ini) { own(ini, e.id); fs.push(ini); }
      // Every capitalised word of a person's name is a form someone could use for them, so a
      // shared first or last name makes a short form ambiguous.
      for (const wd of String(e.name).split(/\s+/)) if (/^[A-Z][a-z]+$/.test(wd)) own(wd, e.id);
    }
    formsOf.set(e.id, fs);
  }
  const events = [];
  for (const e of ents) {
    const m = e.kind === "event" && String(e.name).match(/^(.+)'s (\w+)$/);
    const who = m && ents.find(x => x.name === m[1]);
    if (!who) continue;
    const alt = formsOf.get(who.id).map(esc).join("|");
    events.push({ id: e.id, who: who.id, re: new RegExp(`(?<![\\w])(?:(${alt})'s ${m[2]}|${m[2]} of (${alt}))(?![\\w])`, "gi") });
  }
  w._names = { owners, full, nick, events, spans: new Map() };
  return w._names;
}

/** Visible text of every saved piece of evidence (set aside included; removed evidence is gone). */
function casebookTexts(g) {
  const out = [];
  for (const e of g.s.evidence || []) {
    if (e.message) { const m = g.s.messages.find(x => x.id === e.message); if (m) out.push({ evidence: e.id, text: m.text }); continue; }
    const a = g.w.artifacts.get(e.artifact); if (!a) continue;
    const v = getVersion(a, e.version) || a.versions[0];
    out.push({ evidence: e.id, text: visibleText(g, a, resolveVersion(a, v)) });
  }
  return out;
}

/**
 * What the player's Casebook establishes: nicknames it introduces (alias -> {id, evidence}) and
 * people and things whose full name it shows. Cached per Casebook contents.
 */
const quickCache = new WeakMap(); // evidence array -> {quick, w, data}
const sigCache = new Map(); // full signature -> data (a few recent Casebooks)
function casebookNames(g) {
  const list = g.s.evidence || [];
  const quick = `${list.length}:${list[0]?.id}:${list.at(-1)?.id}`;
  const q = quickCache.get(list);
  const tables = nameTables(g.w);
  if (q && q.quick === quick && q.data.tables === tables) return q.data;
  const sig = list.map(e => `${e.id}:${e.artifact ?? ""}:${e.version ?? ""}:${e.message ?? ""}:${e.image ?? ""}`).join("|");
  let data = sigCache.get(sig);
  if (!data || data.tables !== tables) {
    const { nick, full } = tables;
    const introduced = new Map(), named = new Set();
    for (const { evidence, text } of casebookTexts(g)) {
      const t = lower(text);
      for (const [al, id] of nick) {
        if (introduced.has(al)) continue;
        const nm = lower(g.w.entities.get(id).name);
        if (t.includes(`${nm} (${al})`) || t.includes(`${al} (${nm})`)) introduced.set(al, { id, evidence });
      }
      for (const sp of scanText(g.w, text)) if (sp.id && !sp.alias && full.has(lower(sp.text))) named.add(sp.id);
    }
    data = { tables, introduced, named };
    sigCache.set(sig, data);
    if (sigCache.size > 16) sigCache.delete(sigCache.keys().next().value);
  }
  quickCache.set(list, { quick, data });
  return data;
}

/** Can the player see this candidate: a topic they investigated, or a full name in their Casebook? */
const visibleCandidate = (g, cb, id) => !!g.s.known?.[id] || cb.named.has(id);

/**
 * Who a short form stands for, or null. `owner` is the entity whose authored alias it is (if any):
 * it keeps the form unless another visible candidate fits. A form with no authored owner (an
 * initial form) needs exactly one visible candidate.
 */
function resolveForm(g, cb, text, owner = null) {
  const ids = nameTables(g.w).owners.get(lower(text));
  if (!ids) return null;
  const others = [...ids].filter(id => id !== owner && visibleCandidate(g, cb, id));
  if (owner) return others.length ? null : owner;
  return others.length === 1 ? others[0] : null;
}

/**
 * Names visibly established in a text, with how each nickname was established.
 * @returns {{ids:Set<string>, aliases:{text:string, id:string, evidence:string}[]}}
 */
export function namesInDetail(g, text) {
  const { owners, full, events } = nameTables(g.w);
  const cb = casebookNames(g);
  const ids = new Set(), aliases = [];
  const str = String(text ?? "");
  const tables = nameTables(g.w);
  let spans = tables.spans.get(str);
  if (!spans) { spans = scanText(g.w, str); if (tables.spans.size > 20000) tables.spans.clear(); tables.spans.set(str, spans); }
  for (const sp of spans) {
    if (!sp.id) continue;
    const k = lower(sp.text);
    if (!sp.alias) {
      // A loose first name in the text ("Pat") that is only an account's display name is not read as
      // that account. The sender's own identity is added by id elsewhere, never through this text.
      if (sp.type === "account" && /^[A-Z][a-z]+$/.test(sp.text.trim())) continue;
      // A full name shared by two visible entities names neither.
      const same = full.get(k);
      if (!same || same.size <= 1 || [...same].filter(id => visibleCandidate(g, cb, id)).length <= 1) ids.add(sp.id);
      continue;
    }
    if (owners.has(k) || owners.has(k.replace(/^the\s+/, ""))) {
      const id = resolveForm(g, cb, owners.has(k) ? sp.text : sp.text.replace(/^the\s+/i, ""), sp.id);
      if (id) ids.add(id);
      continue;
    }
    const intro = cb.introduced.get(k);
    if (intro && intro.id === sp.id) { ids.add(sp.id); aliases.push({ text: sp.text, id: sp.id, evidence: intro.evidence }); }
  }
  for (const m of str.matchAll(/(?<![\w.])([A-Z])\. ([A-Z][a-z]+)(?![\w])/g)) { const id = resolveForm(g, cb, m[0]); if (id) ids.add(id); }
  for (const ev of events) for (const m of str.matchAll(ev.re)) {
    const form = m[1] ?? m[2];
    const who = full.get(lower(form))?.has(ev.who) ? ev.who : resolveForm(g, cb, form, owners.get(lower(form))?.has(ev.who) && !/^[A-Z]\. /.test(form) ? ev.who : null);
    if (who === ev.who) { ids.add(ev.id); break; }
  }
  return { ids, aliases };
}

/** Ids visibly established in a text (see above). */
export function namesIn(g, text) { return namesInDetail(g, text).ids; }

/**
 * Names visibly in an artifact version (or the live one): scanned text, author, byline and
 * comment authors. Never hidden `mentions`.
 * @param {any} g
 * @param {string} id
 * @param {string} [vid]
 * @returns {string[]}
 */
export function visibleRefsOfArtifact(g, id, vid) {
  const a = g.w.artifacts.get(id);
  if (!a) return [];
  const v = getVersion(a, vid ?? liveVersionId(g, a) ?? a.versions[0].id) || a.versions[0];
  const r = resolveVersion(a, v);
  const out = namesIn(g, visibleText(g, a, r));
  if (a.author) out.add(a.author);
  for (const b of r.byline) out.add(b);
  for (const c of asArray(r.comments)) if (c.author) out.add(c.author);
  return [...out];
}

/** Names visibly in a message: its text and its sender. */
export function visibleRefsOfMessage(g, m) {
  if (!m) return [];
  const out = namesIn(g, m.text);
  const c = g.w.characters.get(m.thread);
  if (c?.account) out.add(c.account);
  if (c?.entity) out.add(c.entity);
  return [...out];
}

/** Names visibly in a piece of evidence. An image adds its caption to the page it was on. */
export function visibleRefsOfEvidence(g, e) {
  if (e.message) return visibleRefsOfMessage(g, g.s.messages.find(m => m.id === e.message));
  return visibleRefsOfArtifact(g, e.artifact, e.version ?? undefined);
}

/** Nicknames a piece of evidence uses that the Casebook established, and where (for "About"). */
export function establishedAliasesOfEvidence(g, e) {
  if (e.message) { const m = g.s.messages.find(x => x.id === e.message); return m ? namesInDetail(g, m.text).aliases : []; }
  const a = g.w.artifacts.get(e.artifact);
  if (!a) return [];
  const v = getVersion(a, e.version ?? liveVersionId(g, a) ?? a.versions[0].id) || a.versions[0];
  return namesInDetail(g, visibleText(g, a, resolveVersion(a, v))).aliases;
}
