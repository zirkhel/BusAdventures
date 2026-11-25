// @ts-check
// Comparison: two or more things side by side, with the fields the player can see lined up.
//
// The screen never concludes anything. It shows what is visibly there (title, where it visibly
// comes from, platform, address, date, which copy, author, caption, image info, the text) and,
// for two copies of the same page, which paragraphs differ. Whether that means anything is the
// player's call (core/workbench.js keeps their links).
//
// Items are saved evidence ({evidence}) or something the player can reach right now
// ({artifact, version?} for a page or one of its cached versions, {artifact, version?, image}
// for a picture on it, {message}). Browser's Archive ("Compare with…", W8) passes version refs.
//
// This module must never read hidden canon: `source`, `supports`, `mentions`, operatedBy,
// claims or facts. tests/twin.test.mjs checks that it gives identical results in twin worlds.

import { asArray } from "./util.js";
import { isDirected } from "./workbench.js";
import { viewArtifact, savedArtifactView } from "./artifacts.js";
import { apparentSource } from "./provenance.js";

/** Who a character visibly is in the player's phone: their account name, or their name. */
function contactLabel(w, charId) {
  const c = w.characters.get(charId);
  const acc = c?.account ? w.accounts.get(c.account) : w.accounts.get(charId);
  return acc ? acc.displayName || acc.handle : w.entities.get(c?.entity)?.name || charId;
}

/** The visible author line of a page: the account's name and handle. */
function authorOf(w, view) {
  const acc = view.author ? w.accounts.get(view.author) : null;
  if (!acc) return null;
  return acc.displayName && acc.handle ? `${acc.displayName} (${acc.handle})` : acc.displayName || acc.handle || null;
}

/** Which copy this is, in the words of Browser's Archive (W8): the player's own copy is never Seeker's. */
function copyLabel(view, saved) {
  if (saved) return "Your saved copy";
  return view.cached ? "Archive copy" : "Live page";
}

/**
 * One item, as the comparison shows it.
 * @returns {any}
 */
function item(g, ref) {
  const s = g.s, w = g.w;
  const e = ref.evidence ? s.evidence.find(x => x.id === ref.evidence) : null;
  if (ref.evidence && !e) return { ref, error: "unknown_evidence" };
  const r = e ? { artifact: e.artifact, version: e.version, image: e.image, message: e.message, quote: e.quote?.text ?? null } : { ...ref, quote: null };
  const base = { ref: e ? { evidence: e.id } : { ...ref }, evidence: e?.id ?? null };
  if (r.message) {
    const m = s.messages.find(x => x.id === r.message);
    if (!m || m.from === "player") return { ...base, error: "unknown_message" };
    const src = apparentSource(g, { message: m.id });
    return { ...base, kind: "message", title: `Message from ${contactLabel(w, m.thread)}`, sourceKey: src.key, source: src.label,
      platform: "Messages", url: null, date: null, day: m.day, copy: e ? "Saved message" : "Message", author: contactLabel(w, m.thread),
      text: String(m.text ?? ""), attachments: asArray(m.attach).map(id => w.artifacts.get(id)?.title ?? id), image: null, imageInfo: null };
  }
  if (!r.artifact) return { ...base, error: "nothing_to_compare" };
  // A saved item shows the copy the player saved; anything else only what they can reach now.
  if (!e && s.seen[r.artifact] == null) return { ...base, error: "not_seen" };
  const view = e ? savedArtifactView(g, e.id) : viewArtifact(g, r.artifact, r.version ? { version: r.version } : {});
  if (view.error || view.locked) return { ...base, error: "not_available" };
  if (r.image && !asArray(view.images).includes(r.image) && view.video?.poster !== r.image && !asArray(view.video?.frames).some(f => f.image === r.image))
    return { ...base, error: "image_not_in_artifact" };
  const src = apparentSource(g, { artifact: r.artifact });
  const pf = w.platforms.get(view.platform);
  const img = r.image ? w.images.get(r.image) : null;
  const kind = r.quote ? "excerpt" : r.image ? "image" : "page";
  return { ...base, kind, artifact: r.artifact, version: view.versionId ?? null,
    title: r.quote ? `“${r.quote}”` : r.image ? img?.caption || "Image" : view.title || "",
    pageTitle: view.title || "", sourceKey: src.key, source: src.label, platform: pf?.name ?? null, url: view.url || null,
    date: view.date ?? null, day: e?.day ?? null, copy: copyLabel(view, !!e), author: authorOf(w, view), byline: asArray(view.byline),
    text: r.quote ?? (r.image ? "" : String(view.body ?? "")), attachments: [],
    image: r.image ?? null, imageInfo: img ? { caption: img.caption ?? "", meta: img.meta ? { ...img.meta } : null } : null };
}

const paragraphs = text => String(text || "").split(/\n\s*\n|\n/).map(p => p.trim()).filter(Boolean);

/** Paragraph-level differences between two texts: same, removed (only in a) or added (only in b). */
export function textChanges(a, b) {
  const x = paragraphs(a), y = paragraphs(b);
  const L = Array.from({ length: x.length + 1 }, () => new Array(y.length + 1).fill(0));
  for (let i = x.length - 1; i >= 0; i--) for (let j = y.length - 1; j >= 0; j--)
    L[i][j] = x[i] === y[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out = [];
  let i = 0, j = 0;
  while (i < x.length && j < y.length) {
    if (x[i] === y[j]) { out.push({ op: "same", text: x[i] }); i++; j++; }
    else if (L[i + 1][j] >= L[i][j + 1]) out.push({ op: "removed", text: x[i++] });
    else out.push({ op: "added", text: y[j++] });
  }
  while (i < x.length) out.push({ op: "removed", text: x[i++] });
  while (j < y.length) out.push({ op: "added", text: y[j++] });
  return out;
}

/**
 * Compare items. Returns the items with their visible fields, which fields differ, the text
 * changes when exactly two copies of the same page are compared, and the player's own links
 * among the saved items. Never an assessment.
 * @param {any} g
 * @param {any[]} refs
 */
export function compareView(g, refs) {
  const items = asArray(refs).map(r => item(g, r));
  if (items.length < 2) return { error: "need_two" };
  const ok = items.filter(x => !x.error);
  const FIELDS = ["kind", "source", "platform", "url", "date", "day", "copy", "author"];
  const differs = Object.fromEntries(FIELDS.map(f => [f, new Set(ok.map(x => JSON.stringify(x[f] ?? null))).size > 1]));
  const pair = ok.length === 2 && items.length === 2 ? ok : null;
  const samePage = !!pair && pair[0].artifact && pair[0].artifact === pair[1].artifact && pair[0].kind === "page" && pair[1].kind === "page";
  const changes = samePage ? { title: pair[0].pageTitle !== pair[1].pageTitle ? [pair[0].pageTitle, pair[1].pageTitle] : null, text: textChanges(pair[0].text, pair[1].text) } : null;
  const ids = new Set(ok.map(x => x.evidence).filter(Boolean));
  const links = (g.s.links || []).filter(l => ids.has(l.a) && ids.has(l.b)).map(l => ({ ...l, directed: isDirected(l.kind) }));
  return { items, differs, samePage, changes, links, saved: items.every(x => x.evidence) };
}
