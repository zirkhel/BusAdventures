// @ts-check
// Renders an artifact view (from game.view / game.open) as a page in the style of its
// platform. Shared by Browser, Connect and Messages. Text is never parsed as HTML.

import { h, icon, fmtDate, onLongPress } from "./ui.js";
import { img, avatar } from "./media.js";
import { publicView } from "../core/site-view.js";
import { canRenderSite, renderSite } from "./sites/index.js";

const PHOTO_RE = /\[(?:photo|image|screenshot)[^\]]*\]/i;

/**
 * Content text as nodes. Names, handles, addresses, dates and numbers carry a reference for the
 * context menu, but look exactly like the rest of the text. See app/context.js.
 * @param {any} phone
 * @param {string} text
 */
export function richText(phone, text) { return phone.ctx.text(text); }

/** @deprecated kept for older callers: same as richText. */
export const linkify = richText;

/** Paragraphs with line breaks kept. */
function para(phone, text, cls = "p") {
  const lines = String(text).split("\n");
  return h(`p.${cls}`, lines.map((l, i) => [richText(phone, l), i < lines.length - 1 ? h("br") : null]));
}

/** An image. A tap opens its context menu (view, metadata, image search, save). */
export function figure(phone, imageId, ctx) {
  const el = h("figure.fig", img(imageId, { alt: phone.g.w.images.get(imageId)?.caption || "" }));
  el.addEventListener("click", () => phone.ctx.open({ type: "image", text: "", image: imageId, artifact: ctx?.artifact }, ctx));
  return el;
}

/** A handle or name in a page header: plain text that opens the context menu. */
function who(phone, text, accId, tag = "span") {
  const acc = accId ? phone.g.w.accounts.get(accId) : null;
  const ref = acc && String(text) === acc.handle ? { type: "handle", id: accId } : acc ? { type: "account", id: accId } : { type: "text" };
  const sp = phone.ctx.span(text, ref);
  return tag === "b" ? h("b", sp) : sp;
}

/**
 * Render the body of an artifact view.
 * @param {any} phone
 * @param {any} v  view from game.view()
 * @param {{context?:string}} [o]
 */
export function renderArtifact(phone, v, o = {}) {
  v = publicView(v);
  if (canRenderSite(phone, v)) return renderSite(phone, v, o);
  const g = phone.g, w = g.w;
  const a = w.artifacts.get(v.id);
  const acc = v.author ? w.accounts.get(v.author) : null;
  const pf = w.platforms.get(v.platform);
  const kind = pf?.kind || "site";
  const ctx = { artifact: v.id, version: v.versionId };

  // Images: the avatar goes in the header, the rest are placed at [Photo] markers or after the text.
  let images = [...(v.images || [])];
  if (acc?.avatar) images = images.filter(i => i !== acc.avatar);
  const takeImage = () => images.shift();

  const lines = String(v.body || "").split("\n");
  const blocks = [];
  let buf = [];
  const flush = () => { if (buf.length) { blocks.push(para(phone, buf.join("\n"))); buf = []; } };

  for (const raw of lines) {
    const line = raw.trimEnd();
    // Forum replies: "name: text" / "name (OP): text"
    const fm = kind === "forum" && line.match(/^([\w.\-]{2,30})( \(OP\))?: (.+)$/);
    // Social comments: "@handle (12:31): text" or "Comment from @handle: text"
    const cm = kind === "social" && (line.match(/^(@[\w.]+)(?: \(([^)]+)\))?: (.+)$/) || line.match(/^Comment from (@[\w.]+)()?: (.+)$/));
    if (fm) {
      flush();
      const handleAcc = phone.accountByHandle(fm[1]);
      blocks.push(h("div.reply", { class: fm[2] ? "op" : "" },
        h("div.reply-head", avatar(w, handleAcc, 22), h("b", phone.ctx.span(fm[1], { type: "handle", id: handleAcc })), fm[2] ? h("span.tag", "OP") : null),
        h("div.reply-body", richText(phone, fm[3]))));
      if (PHOTO_RE.test(fm[3])) { const im = takeImage(); if (im) blocks.push(figure(phone, im, ctx)); }
      continue;
    }
    if (cm) {
      flush();
      const handleAcc = phone.accountByHandle(cm[1]);
      blocks.push(h("div.comment", avatar(w, handleAcc, 28),
        h("div.comment-bubble", h("div.comment-head",
          h("b", phone.ctx.span(cm[1], { type: "handle", id: handleAcc })),
          cm[2] ? h("span.muted", ` · ${cm[2]}`) : null), richText(phone, cm[3]))));
      continue;
    }
    if (kind === "social" && /^[\d,.]+k? (likes|comments)\b|^\d+ comments ·/i.test(line)) { flush(); blocks.push(h("div.stats", line)); continue; }
    if (/^\(.*removed.*\)$/i.test(line)) { flush(); blocks.push(h("div.removed", line)); continue; }
    if (PHOTO_RE.test(line)) {
      const rest = line.replace(PHOTO_RE, "").trim();
      if (rest) buf.push(rest);
      flush();
      const im = takeImage();
      if (im) blocks.push(figure(phone, im, ctx));
      else blocks.push(h("div.photo-missing", icon("image"), line.match(PHOTO_RE)?.[0]));
      continue;
    }
    if (line === "") { flush(); continue; }
    buf.push(line);
  }
  flush();
  for (const im of images) blocks.push(figure(phone, im, ctx));

  const page = phone.ctx.block(h(`article.page.k-${kind}.pf-${v.platform}`), { artifact: v.id, version: v.versionId, title: v.title });
  page.append(header(phone, v, a, acc, pf, kind));
  if (kind === "news" && blocks[0]?.tagName === "P") {
    // Older articles write the kicker ("Local news · Obituaries") and "By …" in the text. When the
    // article has a structured section or byline, the header shows those and the text lines go.
    const first = blocks[0].textContent || "";
    if (/·/.test(first) && first.length < 60) { if (v.section) blocks.shift(); else blocks[0].className = "kicker"; }
    const by = blocks.findIndex(b => /^By /.test(b.textContent || "") && (b.textContent || "").length < 80);
    if (by >= 0) { if (v.byline?.length) blocks.splice(by, 1); else blocks[by].className = "byline"; }
  }
  page.append(h("div.page-body", blocks));
  page.append(...extras(phone, v, o));
  if (o.context !== "message") page.append(h("div.page-foot", v.url ? h("span", phone.ctx.span(v.url, { type: "url" })) : null, v.date ? h("span", fmtDate(v.date)) : null));
  return page;
}

function header(phone, v, a, acc, pf, kind) {
  const w = phone.g.w;
  if (kind === "social") {
    const isProfile = v.type === "profile";
    return h("header.soc-head", { class: isProfile ? "profile" : "" },
      isProfile && acc?.avatar
        // A profile picture is small on a phone: a tap opens it full size in the image viewer.
        ? h("button.avatar-open", { "aria-label": w.images.get(acc.avatar)?.caption || "Profile picture", onclick: () => phone.viewImage(acc.avatar, { artifact: v.id }) }, avatar(w, v.author, 84))
        : avatar(w, v.author, isProfile ? 72 : 40),
      h("div.soc-names",
        acc ? who(phone, acc.displayName || acc.handle, acc.id, "b") : h("b", v.title),
        acc ? h("span.handle", who(phone, acc.handle, acc.id)) : null,
        !isProfile && v.date ? h("span.muted", fmtDate(v.date)) : null));
  }
  if (kind === "forum") {
    return h("header.forum-head", h("div.crumb", "threadline › " + (v.url || "").split("/").slice(2, 3).join("")),
      h("h1", phone.ctx.text(v.title)), h("div.muted", acc ? ["started by ", who(phone, acc.handle, acc.id)] : "", v.date ? ` · ${fmtDate(v.date)}` : ""));
  }
  if (kind === "news") return h("header.news-head",
    h("div.mast", pf?.app?.logo || pf?.name || ""),
    v.sponsored ? h("div.np-sponsor", "Sponsored by ", phone.ctx.span(w.entities.get(v.sponsored.by)?.name || v.sponsored.by, { type: "org", id: v.sponsored.by })) : null,
    v.section ? h("div.kicker", sectionName(pf, v.section)) : null,
    h("h1", phone.ctx.text(v.title)),
    v.byline?.length ? h("div.byline", "By ", v.byline.map((b, i) => [i ? (i === v.byline.length - 1 ? " and " : ", ") : "",
      w.accounts.has(b) ? phone.ctx.span(w.accounts.get(b).displayName || b, { type: "account", id: b }) : b])) : null,
    newsDates(v));
  if (kind === "blog") return h("header.blog-head", h("div.mast", pf?.name || ""), h("h1", phone.ctx.text(v.title)), v.date ? h("div.muted", fmtDate(v.date)) : null);
  if (kind === "messaging") {
    return h("header.doc-head", h("div.doc-type", v.type === "email" ? "Email" : v.type === "image" ? "Image" : "Document"), h("h1", phone.ctx.text(v.title)), v.date ? h("div.muted", fmtDate(v.date)) : null);
  }
  if (kind === "registry") return h("header.reg-head", h("div.mast", pf?.mast || pf?.name || "", pf?.mastSub ? h("small", pf.mastSub) : null), h("h1", phone.ctx.text(v.title)));
  return h("header.site-head", h("div.mast", pf?.name || v.url?.split("/")[0] || ""), h("h1", phone.ctx.text(v.title)));
}

/** "Mar 10, 2026 · Updated Mar 11, 09:10": the paper's own note that a story changed. Quiet edits say nothing. */
function newsDates(v) {
  const pub = v.publishedDate ?? v.date;
  if (!pub) return null;
  const upd = v.date && v.date !== pub && !v.silent ? v.date : null;
  return h("div.muted.np-dates", fmtDate(pub), upd ? h("span.np-updated", ` · Updated ${fmtDate(upd)}`) : null);
}

function sectionName(pf, id) {
  return pf?.app?.sectionLabels?.[id] ?? String(id).replace(/(^|[-_ ])(\w)/g, (m, sp, c) => (sp ? " " : "") + c.toUpperCase());
}

/** Corrections, related stories, references and comments, when the article has them. */
function extras(phone, v, o) {
  const g = phone.g, w = g.w, out = [];
  const openIn = id => phone.openArtifact(id, undefined, o.app && phone.appFor(id) === o.app ? o.app : phone.appFor(id));
  if (v.corrections?.length) out.push(h("aside.corrections", h("b", v.corrections.length > 1 ? "Corrections" : "Correction"),
    v.corrections.map(c => h("p", c.date ? h("span.muted", `${fmtDate(c.date)}: `) : null, phone.ctx.text(c.text)))));
  const titleOf = id => { const x = g.view(id); return x.error || x.locked ? null : x.title; };
  const related = (v.related || []).map(id => ({ id, title: titleOf(id) })).filter(x => x.title);
  if (related.length) out.push(h("aside.related", h("b", "Related"), related.map(x => h("button.rel-item", { onclick: () => openIn(x.id) }, x.title))));
  const refs = (v.refs || []).map(r => w.artifacts.has(r) ? { id: r, title: titleOf(r) } : { url: r }).filter(x => x.url || x.title);
  if (refs.length) out.push(h("aside.refs", h("b", "Sources and links"),
    refs.map(x => x.id ? h("button.rel-item", { onclick: () => openIn(x.id) }, x.title) : h("div.ref-url", phone.ctx.span(x.url, { type: "url" })))));
  if (v.comments?.length) out.push(comments(phone, v));
  return out;
}

/** Structured comments, sorted Top or Newest (a view choice only). */
function comments(phone, v) {
  const w = phone.g.w;
  const list = h("div.cm-list");
  const byId = new Map(v.comments.map(c => [c.id, c]));
  const draw = mode => {
    const roots = v.comments.filter(c => !c.replyTo || !byId.has(c.replyTo));
    const order = mode === "new" ? (a, b) => String(b.date).localeCompare(String(a.date)) : (a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (b.likes || 0) - (a.likes || 0);
    const one = (c, reply) => {
      const acc = w.accounts.get(c.account);
      return h("div.cm", { class: reply ? "reply" : "" }, avatar(w, c.account, reply ? 22 : 28),
        h("div.cm-body",
          h("div.cm-head", acc ? h("b", phone.ctx.span(acc.handle, { type: "handle", id: c.account })) : h("b", c.account),
            c.pinned ? h("span.tag", "Pinned") : null, c.date ? h("span.muted", ` · ${fmtDate(c.date)}`) : null),
          h("div.cm-text", phone.ctx.text(c.text)),
          c.likes ? h("div.cm-likes.muted", `♥ ${c.likes.toLocaleString("en-US")}`) : null));
    };
    list.replaceChildren(...[...roots].sort(order).flatMap(c => [one(c, false), ...v.comments.filter(r => r.replyTo === c.id).map(r => one(r, true))]));
    seg.querySelectorAll("button").forEach(b => b.classList.toggle("on", b.dataset.m === mode));
  };
  const seg = h("div.seg.small", h("button", { "data-m": "top", onclick: () => draw("top") }, "Top"), h("button", { "data-m": "new", onclick: () => draw("new") }, "Newest"));
  const box = h("section.comments", h("div.cm-title", h("b", `${v.comments.length} comment${v.comments.length === 1 ? "" : "s"}`), seg), list);
  draw("top");
  return box;
}

/** Locked page with a sign-in form. */
export function renderLogin(phone, v, onDone) {
  v = publicView(v);
  const user = h("input", { type: "text", autocomplete: "off", autocapitalize: "off", spellcheck: "false", placeholder: "Username" });
  const pass = h("input", { type: "password", autocomplete: "off", placeholder: "Password" });
  const err = h("div.form-err");
  const submit = e => {
    e.preventDefault();
    const r = phone.g.login(v.loginSite, user.value, pass.value);
    if (r.error) { err.textContent = phone.str("errors.login_failed"); pass.value = ""; }
    else onDone();
  };
  return h("article.page.k-login",
    h("div.login-card", icon("lock", "big"), h("h1", v.title), h("div.muted", v.url || ""),
      h("form", { onsubmit: submit }, user, pass, err, h("button.btn.primary", { type: "submit" }, "Sign in"))));
}

/** Page that is gone, deleted or never existed. */
export function renderGone(phone, v, onCached) {
  v = publicView(v);
  const has = (v.cachedVersions || []).length > 0;
  const msg = v.error === "deleted" ? "This content has been deleted." :
    v.error === "gone" ? "This page isn't available. It may have been removed, or the account was suspended." :
      "This page can't be found.";
  return h("article.page.k-gone",
    h("div.gone", icon("globe", "big"), h("h1", "Not available"), h("p", msg), v.url ? h("div.muted", v.url) : null,
      has ? h("button.btn", { onclick: () => onCached(v.cachedVersions[v.cachedVersions.length - 1]) }, "Seeker cached copy") : null));
}

export { onLongPress };
