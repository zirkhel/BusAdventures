// @ts-check
// Anonymous template. Variant: terminal (SpillCheck: dark, monospace, minimal).

import { h, fmtDate } from "../ui.js";
import { renderBlock } from "./blocks.js";
import { logoOf, navItems, navLink, footerOf, leftoverImages } from "./chrome.js";

/**
 * @param {any} phone
 * @param {{ v: any, site: any, design: any, blocks: any[], ctx: any, page: string }} o
 */
export function renderAnonymous(phone, o) {
  const { v, site, design, blocks, ctx, page } = o;
  const items = navItems(phone, site, design);
  const used = { ...ctx, images: [...(ctx.images || [])] };
  const name = "SpillCheck";
  return h("div.site-shell",
    h("header.site-head",
      h("div.site-brand", logoOf(phone, design, site), h("div.site-wordmark",
        h("div.mast", design.header?.mast || name),
        h("div.site-tagline", design.header?.tagline || "known-breach lookup"))),
      items.length ? h("nav.site-nav", items.map(it => navLink(phone, it))) : null),
    h("div.site-main",
      h("h1", phone.ctx.text(v.title)),
      v.date && page !== "home" ? h("div.muted.site-date", fmtDate(v.date)) : null,
      h("div.page-body", blocks.map(b => renderBlock(phone, b, used))),
      ...leftoverImages(phone, used)),
    footerOf(design, name));
}
