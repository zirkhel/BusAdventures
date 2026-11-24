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
//                    comments). An alias only counts if the content's authors list it,
//                    so an alias never tells whose it is.
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

/** Ids for the names in a text. Aliases count only when `listed` (authored) includes them. */
function refsIn(g, text, listed) {
  const out = new Set();
  for (const sp of scanText(g.w, text)) {
    if (!sp.id) continue;
    if (sp.alias && !listed.has(sp.id)) continue;
    out.add(sp.id);
  }
  return out;
}

/**
 * Names visibly in an artifact version (or the live one): scanned text, author, byline and
 * comment authors. Hidden `mentions` only decide whether an alias in the text counts.
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
  const out = refsIn(g, visibleText(g, a, r), new Set(r.mentions));
  if (a.author) out.add(a.author);
  for (const b of r.byline) out.add(b);
  for (const c of asArray(r.comments)) if (c.author) out.add(c.author);
  return [...out];
}

/** Names visibly in a message: its text and its sender. */
export function visibleRefsOfMessage(g, m) {
  if (!m) return [];
  const out = refsIn(g, m.text, new Set(asArray(m.mentions)));
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
