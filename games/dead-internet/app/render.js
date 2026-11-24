// @ts-check
// Renders an artifact view (from game.view / game.open) as a page in the style of its
// platform. Shared by Browser, Connect and Messages. Text is never parsed as HTML.

import { h, icon, fmtDate, onLongPress } from "./ui.js";
import { img, avatar } from "./media.js";

const PHOTO_RE = /\[(?:photo|image|screenshot)[^\]]*\]/i;
// email | url/domain | @handle (handle must start a word)
const LINK_RE = /([\w.+\-•]+@[a-z0-9\-]+(?:\.[a-z0-9\-]+)+)|((?:https?:\/\/)?(?:[a-z0-9\-]+\.)+(?:com|net|co|org|blog|link|io|gov|social|search|app|me)(?:\/[^\s,;)"'”’]*)?)|((?:^|(?<=[\s(]))@[a-z0-9_]+)/gi;

/**
 * Turn plain text into nodes with tappable links, emails and handles.
 * @param {any} phone
 * @param {string} text
 */
export function linkify(phone, text) {
  const out = [];
  let last = 0;
  for (const m of String(text).matchAll(LINK_RE)) {
    const s = m[0], at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    if (m[1]) out.push(h("a.lnk", { href: "#", onclick: ev => { ev.preventDefault(); phone.browse(m[1].replace(/^[•.]+/, "")); } }, s));
    else if (m[2]) {
      const url = s.replace(/[.]+$/, "");
      out.push(h("a.lnk", { href: "#", onclick: ev => { ev.preventDefault(); phone.browse(url); } }, url));
      if (url.length < s.length) out.push(s.slice(url.length));
    } else if (m[3]) {
      const acc = phone.accountByHandle(s);
      out.push(acc ? h("a.lnk.handle", { href: "#", onclick: ev => { ev.preventDefault(); phone.openAccount(acc); } }, s) : s);
    }
    last = at + s.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Paragraphs with line breaks kept. */
function para(phone, text, cls = "p") {
  const lines = String(text).split("\n");
  return h(`p.${cls}`, lines.map((l, i) => [linkify(phone, l), i < lines.length - 1 ? h("br") : null]));
}

/** A tappable image. Long press or tap opens the image viewer. */
export function figure(phone, imageId, ctx) {
  const el = h("figure.fig", img(imageId, { alt: phone.g.w.images.get(imageId)?.caption || "" }));
  el.addEventListener("click", () => phone.viewImage(imageId, ctx));
  return el;
}

/**
 * Render the body of an artifact view.
 * @param {any} phone
 * @param {any} v  view from game.view()
 * @param {{context?:string}} [o]
 */
export function renderArtifact(phone, v, o = {}) {
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
        h("div.reply-head", avatar(w, handleAcc, 22), h("b", fm[1]), fm[2] ? h("span.tag", "OP") : null),
        h("div.reply-body", linkify(phone, fm[3]))));
      if (PHOTO_RE.test(fm[3])) { const im = takeImage(); if (im) blocks.push(figure(phone, im, ctx)); }
      continue;
    }
    if (cm) {
      flush();
      const handleAcc = phone.accountByHandle(cm[1]);
      blocks.push(h("div.comment", avatar(w, handleAcc, 28),
        h("div.comment-bubble", h("div.comment-head",
          handleAcc ? h("a.lnk.handle", { href: "#", onclick: e => { e.preventDefault(); phone.openAccount(handleAcc); } }, cm[1]) : h("b", cm[1]),
          cm[2] ? h("span.muted", ` · ${cm[2]}`) : null), linkify(phone, cm[3]))));
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

  const page = h(`article.page.k-${kind}.pf-${v.platform}`);
  page.append(header(phone, v, a, acc, pf, kind));
  if (kind === "news" && blocks[0]?.tagName === "P") {
    // "Local news · Obituaries" kicker and "By …" byline
    const first = blocks[0].textContent || "";
    if (/·/.test(first) && first.length < 60) { blocks[0].className = "kicker"; }
    const by = blocks.find(b => /^By /.test(b.textContent || ""));
    if (by) by.className = "byline";
  }
  page.append(h("div.page-body", blocks));
  if (o.context !== "message") page.append(h("div.page-foot", v.url ? h("span", v.url) : null, v.date ? h("span", fmtDate(v.date)) : null));
  return page;
}

function header(phone, v, a, acc, pf, kind) {
  const w = phone.g.w;
  if (kind === "social") {
    const isProfile = v.type === "profile";
    return h("header.soc-head", { class: isProfile ? "profile" : "" },
      avatar(w, v.author, isProfile ? 72 : 40),
      h("div.soc-names",
        h("b", acc?.displayName || v.title),
        acc ? h("a.lnk.handle", { href: "#", onclick: e => { e.preventDefault(); phone.openAccount(acc.id); } }, acc.handle) : null,
        !isProfile && v.date ? h("span.muted", fmtDate(v.date)) : null));
  }
  if (kind === "forum") {
    return h("header.forum-head", h("div.crumb", "threadline › " + (v.url || "").split("/").slice(2, 3).join("")),
      h("h1", v.title), h("div.muted", acc ? `started by ${acc.handle}` : "", v.date ? ` · ${fmtDate(v.date)}` : ""));
  }
  if (kind === "news") return h("header.news-head", h("div.mast", pf?.name || ""), h("h1", v.title), v.date ? h("div.muted", fmtDate(v.date)) : null);
  if (kind === "blog") return h("header.blog-head", h("div.mast", pf?.name || ""), h("h1", v.title), v.date ? h("div.muted", fmtDate(v.date)) : null);
  if (kind === "messaging") {
    return h("header.doc-head", h("div.doc-type", v.type === "email" ? "Email" : v.type === "image" ? "Image" : "Document"), h("h1", v.title), v.date ? h("div.muted", fmtDate(v.date)) : null);
  }
  if (kind === "registry") return h("header.reg-head", h("div.mast", "Port Calder", h("small", "City Portal")), h("h1", v.title));
  return h("header.site-head", h("div.mast", pf?.name || v.url?.split("/")[0] || ""), h("h1", v.title));
}

/** Locked page with a sign-in form. */
export function renderLogin(phone, v, onDone) {
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
  const has = (v.cachedVersions || []).length > 0;
  const msg = v.error === "deleted" ? "This content has been deleted." :
    v.error === "gone" ? "This page isn't available. It may have been removed, or the account was suspended." :
      "This page can't be found.";
  return h("article.page.k-gone",
    h("div.gone", icon("globe", "big"), h("h1", "Not available"), h("p", msg), v.url ? h("div.muted", v.url) : null,
      has ? h("button.btn", { onclick: () => onCached(v.cachedVersions[v.cachedVersions.length - 1]) }, "Seeker cached copy") : null));
}

export { onLongPress };
