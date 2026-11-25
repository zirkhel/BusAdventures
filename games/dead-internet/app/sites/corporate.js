// @ts-check
// Corporate template. Variants: glossy, agency, industrial, and others later.

import { h, fmtDate } from "../ui.js";
import { renderBlock } from "./blocks.js";
import { logoOf, navItems, navLink, footerOf, leftoverImages, takeHero } from "./chrome.js";

/**
 * @param {any} phone
 * @param {{ v: any, site: any, design: any, blocks: any[], ctx: any, page: string }} o
 */
export function renderCorporate(phone, o) {
  const { v, site, design, blocks, ctx, page } = o;
  const items = navItems(phone, site, design);
  const nav = h("nav.site-nav", items.map(it => navLink(phone, it)));
  const toggle = h("button.site-menu-btn", { type: "button", "aria-label": "Menu", "aria-expanded": "false",
    onclick: () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    } }, h("span"), h("span"), h("span"));
  const header = h("header.site-head",
    h("div.site-brand", logoOf(phone, design, site), h("div.site-wordmark",
      h("div.mast", design.header?.mast || siteName(phone, site)),
      design.header?.tagline ? h("div.site-tagline", design.header.tagline) : null)),
    toggle, nav);

  // First image (or theme.hero) becomes a banner on marketing pages; wording stays.
  const used = { ...ctx, images: [...(ctx.images || [])] };
  const body = [];
  const hero = !blocks.some(b => b.t === "hero") ? takeHero(design, used, page) : null;
  if (hero) body.push(renderBlock(phone, { t: "hero", image: hero }, used));
  for (const b of blocks) body.push(renderBlock(phone, b, used));
  body.push(...leftoverImages(phone, used));

  return h("div.site-shell",
    header,
    h("div.site-main",
      h("h1", phone.ctx.text(v.title)),
      v.date && page !== "project" ? h("div.muted.site-date", fmtDate(v.date)) : null,
      h("div.page-body", body)),
    footerOf(design, siteName(phone, site)));
}

function siteName(phone, site) {
  const pf = site.platform ? phone.g.w.platforms.get(site.platform) : null;
  return pf?.name || site.domain || site.id;
}
