// @ts-check
// Wiki template. Variant: standard (Calderpedia-style: TOC, tools, Talk, history, Random).

import { h, fmtDate } from "../ui.js";
import { renderBlock } from "./blocks.js";
import { logoOf, navItems, navLink, footerOf, leftoverImages } from "./chrome.js";
import { listedPages, pathOf } from "../../core/sites.js";

/**
 * @param {any} phone
 * @param {{ v: any, a: any, site: any, design: any, blocks: any[], ctx: any, page: string }} o
 */
export function renderWiki(phone, o) {
  const { v, a, site, design, blocks, ctx, page } = o;
  const items = navItems(phone, site, design);
  const used = { ...ctx, images: [...(ctx.images || [])] };
  const header = h("header.site-head",
    h("div.site-brand", logoOf(phone, design, site), h("div.site-wordmark",
      h("div.mast", design.header?.mast || "Calderpedia"))),
    items.length ? h("nav.site-nav", items.map(it => navLink(phone, it))) : null);

  const tools = wikiTools(phone, site, a, page);
  const side = h("aside.wiki-side",
    h("h2", "Navigation"),
    h("button.wiki-side-link", { type: "button", onclick: () => phone.browse(site.domain) }, "Main page"),
    h("button.wiki-side-link", { type: "button", onclick: () => randomArticle(phone, site, a) }, "Random article"),
    tools.length ? h("h2", "This page") : null,
    ...tools);

  let main;
  if (page === "random") {
    main = [h("p.p", "Use Random article in the menu to open a page.")];
  } else if (page === "history") {
    main = [h("div.page-body", blocks.map(b => renderBlock(phone, b, used))), ...leftoverImages(phone, used)];
  } else if (page === "talk") {
    main = [h("div.page-body", blocks.map(b => renderBlock(phone, b, used))), ...leftoverImages(phone, used)];
  } else {
    const text = (v.body || blocks.filter(b => b.t === "text").map(b => b.text || b.body || "").join("\n\n") || "");
    const parsed = parseWiki(text);
    const toc = parsed.headings.length >= 2 ? wikiToc(parsed.headings) : null;
    const bodyNodes = parsed.parts.map(p => p.type === "h" ? h("h2", { id: p.id }, p.text) : wikiPara(phone, p.text));
    const other = blocks.filter(b => b.t && b.t !== "text").map(b => renderBlock(phone, b, used));
    main = [
      toc,
      ...other,
      h("div.page-body.wiki-body", bodyNodes),
      parsed.refs.length ? h("section.wiki-refs", h("h2", "References"), parsed.refs.map((r, i) => h("div.wiki-ref", h("b", `[${i + 1}] `), wikiText(phone, r)))) : null,
      ...leftoverImages(phone, used),
    ];
  }

  return h("div.site-shell",
    header,
    h("div.wiki-layout",
      side,
      h("div.site-main",
        h("h1", phone.ctx.text(displayTitle(v.title))),
        v.date ? h("div.muted.site-date", page === "article" ? `Last edited ${fmtDate(v.date)}` : fmtDate(v.date)) : null,
        ...main)),
    footerOf(design, "Calderpedia"));
}

function displayTitle(title) {
  return String(title || "").replace(/\s+—\s+Calderpedia\s*$/i, "") || title;
}

function wikiTools(phone, site, a, page) {
  const tools = [];
  const url = a?.url || "";
  const title = articleKey(url);
  if (!title || page === "main" || page === "home") return tools;
  const g = phone.g;
  const pages = listedPages(g, site.id);
  const hist = pages.find(p => (p.page === "history" || p.type === "history") && articleKey(p.url) === title);
  const talk = pages.find(p => (p.page === "talk" || p.type === "talk") && articleKey(p.url) === title);
  const art = pages.find(p => (p.page === "article" || !p.page) && articleKey(p.url) === title && p.url && !/[?&]action=/.test(p.url) && !/\/Talk:/.test(p.url));
  if (page !== "article" && art?.url) {
    tools.push(h("button.wiki-side-link", { type: "button", onclick: () => phone.browse(art.url) }, "Article"));
  }
  if (talk?.url) tools.push(h("button.wiki-side-link", { type: "button", onclick: () => phone.browse(talk.url) }, "Talk"));
  if (hist?.url) tools.push(h("button.wiki-side-link", { type: "button", onclick: () => phone.browse(hist.url) }, "View history"));
  return tools;
}

/** Key used to pair an article with its Talk and history pages. */
export function articleKey(url) {
  let p = pathOf(url || "") || "";
  p = p.replace(/^\//, "");
  p = p.replace(/\/history$/i, "");
  p = p.replace(/^Talk:/i, "");
  p = p.replace(/^Special:.*/i, "");
  return decodeURIComponent(p).trim();
}

function randomArticle(phone, site, current) {
  const posts = listedPages(phone.g, site.id, { page: "article" })
    .filter(a => a.url && a.id !== current?.id && !/[?&]action=/.test(a.url) && !/\/Talk:/.test(a.url));
  if (!posts.length) return;
  const pick = posts[Math.floor(Math.random() * posts.length)];
  if (pick.url) phone.browse(pick.url);
}

function parseWiki(text) {
  const lines = String(text || "").split("\n");
  const headings = [];
  const parts = [];
  const refs = [];
  let buf = [];
  let inRefs = false;
  const flush = () => { if (buf.length) { parts.push({ type: "p", text: buf.join("\n") }); buf = []; } };
  for (const raw of lines) {
    const m = raw.match(/^==\s*(.+?)\s*==\s*$/);
    if (m) {
      flush();
      const name = m[1];
      if (/^references$/i.test(name)) { inRefs = true; continue; }
      inRefs = false;
      const id = "h-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      headings.push({ id, text: name });
      parts.push({ type: "h", id, text: name });
      continue;
    }
    if (inRefs) {
      const rm = raw.match(/^\s*\[(\d+)\]\s*(.*)$/);
      if (rm) { refs[Number(rm[1]) - 1] = rm[2]; continue; }
      if (raw.trim()) refs.push(raw.trim());
      continue;
    }
    buf.push(raw);
  }
  flush();
  return { headings, parts: parts.filter(p => p.type === "h" || String(p.text).trim()), refs: refs.filter(Boolean) };
}

function wikiToc(headings) {
  return h("nav.wiki-toc",
    h("b", "Contents"),
    headings.map((hd, i) => h("a.wiki-toc-link", { href: "#" + hd.id, onclick: ev => { ev.preventDefault(); document.getElementById(hd.id)?.scrollIntoView(); } }, `${i + 1} ${hd.text}`)));
}

function wikiPara(phone, text) {
  const lines = String(text).split("\n");
  return h("p.p", lines.map((l, i) => [wikiText(phone, l), i < lines.length - 1 ? h("br") : null]));
}

// Keep the authored URL as the destination, but show an encyclopedia-style title.
function wikiText(phone, text) {
  return String(text).split(/(calderpedia\.org\/[^\s,()]+)/g).map(part => {
    if (!part.startsWith("calderpedia.org/")) return phone.ctx.text(part);
    const url = part.replace(/[.;]+$/, "");
    const suffix = part.slice(url.length);
    const label = decodeURIComponent(url.slice("calderpedia.org/".length)).replaceAll("_", " ");
    return [h("a.wiki-article-link", { href: `https://${url}`, onclick: e => { e.preventDefault(); e.stopPropagation(); phone.browse(url); } }, label), suffix];
  });
}
