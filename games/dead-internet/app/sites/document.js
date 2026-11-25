// @ts-check
// Document template. Variant: viewer (Docshare: filename, shared via link, view only, expired).

import { h, fmtDate } from "../ui.js";
import { renderBlock } from "./blocks.js";
import { logoOf, navItems, navLink, footerOf, leftoverImages } from "./chrome.js";
import { pathOf } from "../../core/sites.js";

/**
 * @param {any} phone
 * @param {{ v: any, a: any, site: any, design: any, blocks: any[], ctx: any, page: string }} o
 */
export function renderDocument(phone, o) {
  const { v, site, design, blocks, ctx, page } = o;
  const items = navItems(phone, site, design);
  const used = { ...ctx, images: [...(ctx.images || [])] };
  const name = "Docshare";
  const header = h("header.site-head",
    h("div.site-brand", logoOf(phone, design, site), h("div.site-wordmark",
      h("div.mast", design.header?.mast || name))),
    items.length ? h("nav.site-nav", items.map(it => navLink(phone, it))) : null);

  if (page === "home" || page === "page") {
    return h("div.site-shell",
      header,
      h("div.site-main",
        h("h1", phone.ctx.text(v.title)),
        v.date ? h("div.muted.site-date", fmtDate(v.date)) : null,
        h("div.page-body", blocks.map(b => renderBlock(phone, b, used))),
        ...leftoverImages(phone, used)),
      footerOf(design, name));
  }

  if (page === "expired") {
    return h("div.site-shell",
      header,
      h("div.site-main.doc-expired",
        h("h1", phone.ctx.text(v.title || "This link has expired")),
        h("div.page-body", blocks.map(b => renderBlock(phone, b, used)))),
      footerOf(design, name));
  }

  const file = filenameOf(v);
  return h("div.site-shell",
    header,
    h("div.site-main",
      h("div.doc-meta",
        h("div.doc-file", file),
        h("div.muted", "Shared via link · View only"),
        v.date ? h("div.muted", fmtDate(v.date)) : null),
      h("h1", phone.ctx.text(v.title)),
      h("div.page-body.doc-paper", blocks.map(b => renderBlock(phone, b, used))),
      ...leftoverImages(phone, used)),
    footerOf(design, name));
}

function filenameOf(v) {
  const p = pathOf(v.url || "") || "";
  const last = p.split("/").filter(Boolean).pop() || "";
  if (last) return last;
  return String(v.title || "document").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".txt";
}
