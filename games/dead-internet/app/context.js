// @ts-check
// The Context Action System. Shared by every app; no app has its own copy.
//
//  - text(str)       turns content text into nodes. Names, handles, addresses, dates and numbers
//                    found by the core scanner (core/refs.js) become plain spans that carry a
//                    reference. They look exactly like the text around them.
//  - block(el, o)    marks an element as readable content with an origin (page, message, note).
//  - A single tap on any word inside a block opens a bottom sheet of actions for that word or
//    reference. Words that are not references work too (search, copy, save), so being tappable
//    never says that something matters.
//  - Selecting text (long press) shows a bar to search, copy or save the selection.
//  - register(action) adds an action. Actions say which reference types they apply to and may
//    have a `when` test. Tests may only use what the player can already see or do anyway.

import { h, icon } from "./ui.js";

/** @typedef {{type:string, text:string, id?:string|null, alias?:boolean, image?:string, artifact?:string, version?:string|null, context?:string}} Ref */
/** @typedef {{app?:string, artifact?:string, version?:string|null, message?:string, title?:string, selected?:boolean}} Origin */
/**
 * An action. Picking it counts as investigating the reference (core/discovery.js) unless
 * `investigates` is false (copying a name is not investigating it).
 * @typedef {{id:string, icon?:string, types:string[]|"*", label:string|((ref:Ref, phone:any)=>string), investigates?:boolean,
 *   when?:(ref:Ref, origin:Origin, phone:any)=>boolean, run:(ref:Ref, origin:Origin, phone:any)=>void}} Action
 */

const WORD = /[\p{L}\p{N}_'’\-]/u;
const NAMEISH = ["person", "org", "place", "project", "event", "term", "account", "handle"];
const TEXTISH = [...NAMEISH, "text", "date", "refnum"];

export class ContextSystem {
  /** @param {any} phone */
  constructor(phone) {
    this.phone = phone;
    /** @type {Action[]} */
    this.actions = [];
    this.selbar = h("div.selbar");
    phone.root.append(this.selbar);
    phone.screen.addEventListener("click", e => this.#onTap(e));
    let timer = 0;
    document.addEventListener("selectionchange", () => { clearTimeout(timer); timer = window.setTimeout(() => this.#onSelection(), 220); });
  }

  /** @param {Action} a */
  register(a) { this.actions = this.actions.filter(x => x.id !== a.id).concat(a); return this; }

  /**
   * Content text → nodes. References become spans with no visual difference.
   * @param {string} text
   */
  text(text) {
    const s = String(text ?? "");
    const out = [];
    let last = 0;
    for (const sp of this.phone.g.scan(s)) {
      if (sp.start > last) out.push(s.slice(last, sp.start));
      const el = h("span.ref", sp.text);
      /** @type {any} */ (el)._ref = { type: sp.type, text: sp.text, id: sp.id, alias: sp.alias };
      out.push(el);
      last = sp.end;
    }
    if (last < s.length) out.push(s.slice(last));
    return out;
  }

  /** A span for a known reference that is not in running text (a name in a page header). */
  span(text, ref) {
    const el = h("span.ref", text);
    /** @type {any} */ (el)._ref = { text, ...ref };
    return el;
  }

  /**
   * Mark an element as readable content.
   * @template {HTMLElement} T
   * @param {T} el
   * @param {Origin} origin
   * @returns {T}
   */
  block(el, origin) {
    el.classList.add("ctx");
    /** @type {any} */ (el)._origin = origin;
    return el;
  }

  /** Actions that apply to a reference, in registration order. */
  actionsFor(ref, origin = {}) {
    return this.actions.filter(a => (a.types === "*" || a.types.includes(ref.type)) && (!a.when || a.when(ref, origin, this.phone)));
  }

  /**
   * Open the action sheet for a reference.
   * @param {Ref} ref
   * @param {Origin} [origin]
   */
  open(ref, origin = {}) {
    const p = this.phone;
    const items = this.actionsFor(ref, origin).map(a => ({
      label: typeof a.label === "function" ? a.label(ref, p) : a.label, icon: a.icon,
      run: () => { if (a.investigates !== false) investigateRef(ref, p); a.run(ref, origin, p); } }));
    if (origin.message && !p.isSaved({ message: origin.message }))
      items.push({ label: "Save this message to Casebook", icon: "bookmark", run: () => p.saveEvidence({ message: origin.message }), secondary: true });
    const title = ref.type === "image" ? (p.g.w.images.get(ref.image)?.caption || "Image") : ref.text;
    p.actionSheet(title, items);
    if (ref.type === "image") p.tips?.trigger("image");
  }

  // ── Tap ───────────────────────────────────────────────────────────────────
  #onTap(e) {
    const t = /** @type {HTMLElement} */ (e.target);
    if (!(t instanceof Element) || e.defaultPrevented) return;
    if (t.closest("button, a, input, textarea, select, label, figure, .no-ctx")) return;
    const block = /** @type {any} */ (t.closest(".ctx"));
    if (!block) return;
    const sel = getSelection();
    if (sel && !sel.isCollapsed && String(sel).trim()) return;
    const span = /** @type {any} */ (t.closest(".ref"));
    const found = span?._ref || wordAt(e.clientX, e.clientY);
    if (!found) return;
    // The sentence it was in, to prefill a Timeline event (the player edits it).
    const ref = { ...found, context: sentenceAround(t.closest("p, li, .bubble, .reply-body, .comment-bubble, .note-body, .hyp-big, h1") || t, found.text) };
    this.open(ref, block._origin || {});
  }

  // ── Selection ─────────────────────────────────────────────────────────────
  #onSelection() {
    const sel = getSelection();
    const text = sel ? String(sel).replace(/\s+/g, " ").trim() : "";
    const node = sel?.anchorNode;
    const el = node ? (node.nodeType === 1 ? /** @type {Element} */ (node) : node.parentElement) : null;
    const block = /** @type {any} */ (el?.closest(".ctx"));
    if (!text || text.length > 160 || !block || !this.phone.screen.contains(block)) { this.selbar.classList.remove("on"); return; }
    const spans = this.phone.g.scan(text);
    /** @type {Ref} */
    const ref = spans.length === 1 && spans[0].start === 0 && spans[0].end === text.length
      ? { type: spans[0].type, text, id: spans[0].id, alias: spans[0].alias } : { type: "text", text };
    const origin = { ...(block._origin || {}), selected: true };
    const p = this.phone;
    const short = text.length > 22 ? text.slice(0, 21) + "…" : text;
    const done = () => { sel?.removeAllRanges(); this.selbar.classList.remove("on"); };
    this.selbar.replaceChildren(
      h("button", { onclick: () => { done(); p.search(text); } }, icon("search"), h("span", `Search “${short}”`)),
      h("button", { onclick: () => { done(); p.copy(text); } }, h("span", "Copy")),
      h("button", { onclick: () => { done(); p.saveText(ref, origin); } }, h("span", "Save")),
      h("button", { onclick: () => { done(); p.eventFromText(text, origin); } }, h("span", "Event")),
      h("button", { "aria-label": "More actions", onclick: () => { done(); this.open(ref, origin); } }, icon("more")));
    this.selbar.classList.add("on");
  }
}

/** The word (or run of capitalised words, like "Harbor Street") under a point. */
function wordAt(x, y) {
  const d = /** @type {any} */ (document);
  let node = null, off = 0;
  if (d.caretPositionFromPoint) { const p = d.caretPositionFromPoint(x, y); if (p) { node = p.offsetNode; off = p.offset; } }
  else if (d.caretRangeFromPoint) { const r = d.caretRangeFromPoint(x, y); if (r) { node = r.startContainer; off = r.startOffset; } }
  if (!node || node.nodeType !== 3) return null;
  const s = node.data;
  if (off >= s.length || !WORD.test(s[off])) off--;
  if (off < 0 || !WORD.test(s[off])) return null;
  let a = off, b = off + 1;
  while (a > 0 && WORD.test(s[a - 1])) a--;
  while (b < s.length && WORD.test(s[b])) b++;
  // The tap must be on the word itself, not in empty space next to it.
  const range = document.createRange();
  range.setStart(node, a); range.setEnd(node, b);
  if (![...range.getClientRects()].some(r => x >= r.left - 4 && x <= r.right + 4 && y >= r.top - 4 && y <= r.bottom + 4)) return null;
  const cap = i => /\p{Lu}/u.test(s[i] || "");
  if (cap(a)) {
    // Extend over neighbouring capitalised words or numbers separated by one space.
    const wordEnd = i => { let j = i; while (j < s.length && WORD.test(s[j])) j++; return j; };
    while (s[b] === " " && (cap(b + 1) || /\d/.test(s[b + 1] || ""))) b = wordEnd(b + 1);
    while (a > 1 && s[a - 1] === " " && cap(prevWordStart(s, a - 2))) a = prevWordStart(s, a - 2);
  }
  let text = s.slice(a, b).replace(/^['’\-]+|['’\-]+$/g, "").replace(/['’]s$/, "");
  if (text.length < 2) return null;
  return { type: "text", text };
}

/** The sentence of an element's text that contains `text`. */
function sentenceAround(el, text) {
  const raw = String(/** @type {any} */ (el)?.innerText ?? el?.textContent ?? "");
  const all = raw.replace(/[ \t]+/g, " ").trim();
  if (!all) return "";
  const parts = all.split(/\n+|(?<=[.!?])\s+(?=[A-Z0-9"“@])/).map(x => x.trim()).filter(Boolean);
  const i = parts.findIndex(x => x.includes(text));
  // "Pinned post, July 5, 2025:" introduces the line after it.
  const hit = i < 0 ? all : /:$/.test(parts[i]) && parts[i + 1] ? `${parts[i]} ${parts[i + 1]}` : parts[i];
  return hit.length > 280 ? hit.slice(0, 279) + "…" : hit;
}

function prevWordStart(s, i) { while (i > 0 && WORD.test(s[i - 1])) i--; return i; }

// ── Default actions ─────────────────────────────────────────────────────────

/** Acting on a name investigates it. Aliases only count for what the player has met (enforced in core). */
function investigateRef(ref, phone) {
  if (!ref.id || phone.g.discovery(ref.id) === "investigated" || phone.g.discovery(ref.id) === "saved") return;
  phone.g.investigate(ref.id, ref.alias ? "" : ref.text);
}

/** Character the player can write to for a person or account reference. Uses only the public contact list. */
function contactFor(ref, phone) {
  if (!ref.id) return null;
  const g = phone.g;
  for (const c of g.w.characters.values()) {
    if ((c.entity === ref.id || c.account === ref.id) && g.canContact(c.id)) return c.id;
  }
  return null;
}

/** @param {ContextSystem} cs */
export function registerDefaultActions(cs) {
  const w = cs.phone.g.w;
  cs.register({ id: "open-site", icon: "globe", types: ["domain", "url"], label: r => r.type === "url" ? "Open page" : "Open website", run: (r, o, p) => p.browse(r.text) })
    .register({ id: "visit", icon: "globe", types: ["org"], label: "Visit website", when: r => !!w.entities.get(r.id)?.website, run: (r, o, p) => p.browse(w.entities.get(r.id).website) })
    .register({ id: "message", icon: "chat", types: ["person", "account", "handle"], label: "Send message", when: (r, o, p) => !!contactFor(r, p),
      run: (r, o, p) => p.push("messages", { kind: "thread", id: contactFor(r, p) }) })
    .register({ id: "ask", icon: "chat", types: NAMEISH, label: "Ask someone about this…",
      // Offered for any name you have met, if you have anyone to ask. Says nothing about the name itself.
      when: (r, o, p) => !!r.id && p.g.contacts().length > 0 && (!r.alias || ["investigated", "saved"].includes(p.g.discovery(r.id))),
      run: (r, o, p) => p.askAbout(r.id) })
    .register({ id: "theory", icon: "book", types: NAMEISH, label: "Create theory",
      when: (r, o, p) => !!r.id && (!r.alias || ["investigated", "saved"].includes(p.g.discovery(r.id))) &&
        p.g.predicates().some(pr => (pr.subjectKinds || []).includes(p.g.w.entities.get(r.id)?.kind ?? (p.g.w.accounts.has(r.id) ? "account" : ""))),
      run: (r, o, p) => { if (p.g.known().includes(r.id)) p.push("casebook", { kind: "builder", subject: r.id }); } })
    .register({ id: "profile", icon: "people", types: ["person", "account", "handle", "org"], label: "View profile", run: (r, o, p) => p.g.w.accounts.has(r.id) ? p.openAccount(r.id) : p.findProfile(r.text) })
    .register({ id: "search", icon: "search", types: [...TEXTISH, "email", "domain", "url"], label: "Search with Seeker", run: (r, o, p) => p.search(r.text) });
  // Look-ups offered by tools in the world (data: platforms[].lookup).
  for (const pf of w.platforms.values()) {
    if (!pf.lookup) continue;
    cs.register({ id: `lookup-${pf.id}`, icon: "search", types: pf.lookup.types, label: pf.lookup.label || `Check with ${pf.name}`, run: (r, o, p) => p.lookup(pf.id, r.text) });
  }
  // News apps (data: platforms[].app): search the paper, and open an author's page from a byline.
  for (const [pfId, appId] of cs.phone.platformApp || []) {
    const name = w.platforms.get(pfId).name;
    cs.register({ id: `news-search-${pfId}`, icon: "search", types: TEXTISH, label: `Search ${name}`, run: (r, o, p) => p.apps[appId].search(r.text) })
      .register({ id: `news-author-${pfId}`, icon: "people", types: ["account", "handle"], label: `Author page in ${name}`,
        when: (r, o, p) => !!r.id && p.g.news(pfId, { author: r.id, limit: 1 }).total > 0, run: (r, o, p) => p.openAuthor(r.id, appId) });
  }
  cs.register({ id: "connect-search", icon: "people", types: ["text"], label: "Search on Connect", run: (r, o, p) => p.findProfile(r.text) })
    .register({ id: "cached", icon: "clock", types: ["domain", "url"], label: "View cached versions", run: (r, o, p) => p.cachedFor(r.text) })
    // Images
    .register({ id: "img-view", icon: "image", types: ["image"], label: "View image", run: (r, o, p) => p.viewImage(r.image, { artifact: r.artifact, version: o.version }) })
    .register({ id: "img-info", icon: "info", types: ["image"], label: "View metadata", run: (r, o, p) => p.viewImage(r.image, { artifact: r.artifact, version: o.version }, { info: true }) })
    .register({ id: "img-search", icon: "search", types: ["image"], label: "Reverse image search", run: (r, o, p) => p.imageSearch(r.image, false) })
    .register({ id: "img-flip", icon: "flip", types: ["image"], label: "Flip and search", run: (r, o, p) => p.imageSearch(r.image, true) })
    .register({ id: "img-save", icon: "bookmark", types: ["image"], label: "Save as evidence", when: r => !!r.artifact, run: (r, o, p) => p.saveEvidence({ artifact: r.artifact, version: o.version, image: r.image }) })
    // Documents (attachments, linked pages)
    .register({ id: "doc-open", icon: "globe", types: ["document"], label: "Open document", run: (r, o, p) => p.openArtifact(r.artifact, r.version ?? undefined, p.appFor(r.artifact)) })
    .register({ id: "doc-save", icon: "bookmark", types: ["document"], label: "Save as evidence", when: (r, o, p) => { const v = p.g.view(r.artifact, r.version ?? undefined); return !v.error && !v.locked; },
      run: (r, o, p) => {
        const v = p.g.view(r.artifact, r.version ?? undefined);
        // An attachment can be saved straight from the message: saving it means having looked at it.
        if (p.g.s.seen[r.artifact] == null) p.g.open(r.artifact, v.cached ? v.versionId : undefined);
        p.saveEvidence({ artifact: r.artifact, version: v.versionId });
      } })
    .register({ id: "doc-versions", icon: "clock", types: ["document"], label: "View available versions", run: (r, o, p) => p.versions(r.artifact) })
    // Timeline (the player's own reconstruction; nothing is filled in from the story)
    .register({ id: "tl-date", icon: "clock", types: ["date"], label: "Add to Timeline", investigates: false, run: (r, o, p) => p.eventFromDate(r, o) })
    .register({ id: "tl-text", icon: "clock", types: TEXTISH, label: "Create event", investigates: false, when: (r, o) => !!o.selected && r.type !== "date", run: (r, o, p) => p.eventFromText(r.text, o) })
    .register({ id: "tl-image", icon: "clock", types: ["image", "document"], label: "Add to Timeline", investigates: false,
      when: (r, o, p) => r.type === "image" ? !!r.artifact : !p.g.view(r.artifact, r.version ?? undefined).error,
      run: (r, o, p) => p.eventFromSource({ artifact: r.artifact, version: r.version ?? null, image: r.image ?? null }, r.type === "image" ? (p.g.w.images.get(r.image)?.caption || "") : r.text) })
    .register({ id: "tl-attach", icon: "plus", types: ["image", "document"], label: "Attach to existing event…", investigates: false,
      when: (r, o, p) => p.g.s.timeline.length > 0 && !!p.evidenceFor(r),
      run: (r, o, p) => p.attachToEvent(p.evidenceFor(r).id) })
    // Everything that is text
    .register({ id: "save", icon: "bookmark", types: [...TEXTISH, "email", "domain", "url"], label: "Save to Casebook", run: (r, o, p) => p.saveText(r, o) })
    .register({ id: "copy", icon: "copy", investigates: false, types: [...TEXTISH, "email", "domain", "url"],
      label: r => r.type === "email" ? "Copy address" : NAMEISH.includes(r.type) ? "Copy name" : r.type === "url" || r.type === "domain" ? "Copy address" : "Copy",
      run: (r, o, p) => p.copy(r.text) });
}

