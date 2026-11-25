// @ts-check
// Forum template. Variant: classic (2010s Threadline: boards, threads, profiles, pages).

import { h, fmtDate } from "../ui.js";
import { renderBlock } from "./blocks.js";
import { logoOf, navItems, navLink, footerOf, leftoverImages } from "./chrome.js";
import { listedPages, pathOf } from "../../core/sites.js";
import { avatar, img } from "../media.js";

const PHOTO_RE = /\[(?:photo|image|screenshot)[^\]]*\]/i;

/**
 * @param {any} phone
 * @param {{ v: any, a: any, site: any, design: any, blocks: any[], ctx: any, page: string }} o
 */
export function renderForum(phone, o) {
  const { v, a, site, design, blocks, ctx, page } = o;
  const items = navItems(phone, site, design);
  const used = { ...ctx, images: [...(ctx.images || [])] };
  const header = h("header.site-head",
    h("div.site-brand", logoOf(phone, design, site), h("div.site-wordmark",
      h("div.mast", design.header?.mast || "threadline"))),
    items.length ? h("nav.site-nav", items.map(it => navLink(phone, it))) : null);

  let main;
  if (page === "index" || page === "home") main = indexView(phone, site, v, blocks, used);
  else if (page === "board") main = boardView(phone, site, v, a);
  else if (page === "profile") main = profileView(phone, site, v, a, blocks, used);
  else main = threadView(phone, site, v, a, used);

  return h("div.site-shell",
    header,
    h("div.site-main", ...main),
    footerOf(design, "threadline"));
}

function indexView(phone, site, v, blocks, used) {
  const boards = listedPages(phone.g, site.id, { page: "board" });
  return [
    h("h1", phone.ctx.text(v.title || "threadline")),
    h("div.page-body", blocks.map(b => renderBlock(phone, b, used))),
    h("div.forum-boards", boards.map(b =>
      h("button.forum-board", { type: "button", onclick: () => b.url && phone.browse(b.url) },
        h("b", b.title || ("r/" + boardId(b.url))),
        h("span.muted", threadCount(phone, site, boardId(b.url)) + " threads")))),
    ...leftoverImages(phone, used),
  ];
}

function boardView(phone, site, v, a) {
  const board = boardId(a.url);
  const list = listedPages(phone.g, site.id).filter(t =>
    (t.page === "thread" || t.type === "thread") && boardId(t.url) === board && pageNo(t.url) <= 1);
  return [
    h("div.forum-crumb", "threadline › ", board ? `r/${board}` : "board"),
    h("h1", phone.ctx.text(v.title)),
    h("div.forum-threads", list.map(t =>
      h("button.forum-thread", { type: "button", onclick: () => t.url && phone.browse(t.url) },
        h("b", t.title),
        t.date ? h("span.muted", fmtDate(t.date)) : null))),
  ];
}

function threadView(phone, site, v, a, used) {
  const board = boardId(a.url);
  const acc = v.author ? phone.g.w.accounts.get(v.author) : null;
  const images = used.images || [];
  const takeImage = () => images.shift();
  const replies = forumReplies(phone, v.body || "", takeImage, v.id);
  const pages = siblingPages(phone, site, a.url);
  const boardUrl = board ? `${site.domain}/r/${board}` : "";
  return [
    h("div.forum-crumb", "threadline › ",
      board ? h("button.forum-crumb-link", { type: "button", onclick: () => boardUrl && phone.browse(boardUrl) }, `r/${board}`) : "thread"),
    h("h1", phone.ctx.text(v.title)),
    h("div.muted.site-date", acc ? ["started by ", phone.ctx.span(acc.handle, { type: "handle", id: acc.id })] : "", v.date ? ` · ${fmtDate(v.date)}` : ""),
    h("div.page-body.forum-thread-body", replies),
    pages.length > 1 ? pager(phone, pages, a.url) : null,
    ...leftoverImages(phone, used),
  ];
}

function profileView(phone, site, v, a, blocks, used) {
  const handle = String(pathOf(a.url || "") || "").split("/").filter(Boolean).pop() || "";
  const acc = phone.accountByHandle?.(handle) || [...phone.g.w.accounts.values()].find(x =>
    x.handle === handle || x.handle === `@${handle}` || x.displayName === handle);
  const started = acc ? listedPages(phone.g, site.id).filter(t =>
    (t.page === "thread" || t.type === "thread") && t.author === acc.id && pageNo(t.url) <= 1) : [];
  return [
    h("div.forum-crumb", "threadline › user"),
    h("h1", acc ? phone.ctx.span(acc.displayName || acc.handle, { type: "handle", id: acc.id }) : phone.ctx.text(v.title)),
    acc?.handle ? h("div.muted", acc.handle) : null,
    h("div.page-body", blocks.map(b => renderBlock(phone, b, used))),
    started.length ? h("div.forum-threads", h("h2", "Threads started"), started.map(t =>
      h("button.forum-thread", { type: "button", onclick: () => t.url && phone.browse(t.url) },
        h("b", t.title), t.date ? h("span.muted", fmtDate(t.date)) : null))) : null,
    ...leftoverImages(phone, used),
  ];
}

/** Parse the existing thread body format: "name: text" / "name (OP): text". */
export function forumReplies(phone, body, takeImage, artifactId) {
  const w = phone.g.w;
  const lines = String(body || "").split("\n");
  const blocks = [];
  let buf = [];
  const flush = () => { if (buf.length) { blocks.push(plainPara(phone, buf.join("\n"))); buf = []; } };
  for (const raw of lines) {
    const line = raw.trimEnd();
    const fm = line.match(/^([\w.\-]{2,30})( \(OP\))?: (.+)$/);
    if (fm) {
      flush();
      const handleAcc = phone.accountByHandle(fm[1]);
      blocks.push(h("div.reply", { class: fm[2] ? "op" : "" },
        h("div.reply-head", avatar(w, handleAcc, 22), h("b", phone.ctx.span(fm[1], { type: "handle", id: handleAcc })), fm[2] ? h("span.tag", "OP") : null),
        h("div.reply-body", phone.ctx.text(fm[3]))));
      if (PHOTO_RE.test(fm[3])) {
        const im = takeImage && takeImage();
        if (im) blocks.push(figureOf(phone, im, artifactId));
      }
      continue;
    }
    if (PHOTO_RE.test(line)) {
      const rest = line.replace(PHOTO_RE, "").trim();
      if (rest) buf.push(rest);
      flush();
      const im = takeImage && takeImage();
      if (im) blocks.push(figureOf(phone, im, artifactId));
      continue;
    }
    if (line === "") { flush(); continue; }
    buf.push(line);
  }
  flush();
  return blocks;
}

function plainPara(phone, text) {
  const lines = String(text).split("\n");
  return h("p.p", lines.map((l, i) => [phone.ctx.text(l), i < lines.length - 1 ? h("br") : null]));
}

function figureOf(phone, imageId, artifactId) {
  const el = h("figure.fig", img(imageId, { alt: phone.g.w.images.get(imageId)?.caption || "" }));
  el.addEventListener("click", () => phone.ctx.open({ type: "image", text: "", image: imageId, artifact: artifactId }, { artifact: artifactId }));
  return el;
}

export function boardId(url) {
  const p = pathOf(url || "") || "";
  const m = p.match(/^\/(?:t|r)\/([^/?#]+)/);
  return m ? m[1] : "";
}

function threadCount(phone, site, board) {
  return listedPages(phone.g, site.id).filter(t =>
    (t.page === "thread" || t.type === "thread") && boardId(t.url) === board && pageNo(t.url) <= 1).length;
}

function pageNo(url) {
  const m = String(url || "").match(/[?&]page=(\d+)/);
  return m ? Number(m[1]) : 1;
}

function baseThread(url) {
  return String(url || "").replace(/[?&]page=\d+/, "").replace(/\?$/, "");
}

function siblingPages(phone, site, url) {
  const base = baseThread(url);
  return listedPages(phone.g, site.id)
    .filter(t => (t.page === "thread" || t.type === "thread") && baseThread(t.url) === base)
    .sort((a, b) => pageNo(a.url) - pageNo(b.url));
}

function pager(phone, pages, currentUrl) {
  return h("div.forum-pager", pages.map(p =>
    h("button.forum-page", {
      type: "button",
      class: pageNo(p.url) === pageNo(currentUrl) ? "on" : "",
      onclick: () => p.url && phone.browse(p.url),
    }, `Page ${pageNo(p.url)}`)));
}
