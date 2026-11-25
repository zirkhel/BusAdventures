// @ts-check
// Landing template, saas variant (Faceless Stock and other marketing homes).
// Other landing variants stay on the thin simple chrome.

import { h, fmtDate } from "../ui.js";
import { renderBlock } from "./blocks.js";
import { logoOf, navItems, navLink, footerOf, leftoverImages, takeHero } from "./chrome.js";
import { renderSimple } from "./simple.js";

/**
 * @param {any} phone
 * @param {{ v: any, site: any, design: any, blocks: any[], ctx: any, page: string }} o
 */
export function renderLanding(phone, o) {
  if (o.design?.variant && o.design.variant !== "saas") return renderSimple(phone, o);
  const { v, site, design, blocks, ctx, page } = o;
  const items = navItems(phone, site, design);
  const used = { ...ctx, images: [...(ctx.images || [])] };
  const body = [];
  const hero = !blocks.some(b => b.t === "hero") ? takeHero(design, used, page) : null;
  if (hero) body.push(renderBlock(phone, { t: "hero", image: hero }, used));
  for (const b of blocks) body.push(renderBlock(phone, b, used));
  body.push(...leftoverImages(phone, used));
  const pf = site.platform ? phone.g.w.platforms.get(site.platform) : null;
  const name = pf?.name || site.domain || site.id;
  return h("div.site-shell",
    h("header.site-head",
      h("div.site-brand", logoOf(phone, design, site), h("div.site-wordmark",
        h("div.mast", design.header?.mast || name),
        design.header?.tagline ? h("div.site-tagline", design.header.tagline) : null)),
      items.length ? h("nav.site-nav", items.map(it => navLink(phone, it))) : null),
    h("div.site-main",
      h("h1", phone.ctx.text(v.title)),
      v.date ? h("div.muted.site-date", fmtDate(v.date)) : null,
      h("div.page-body", body)),
    footerOf(design, name));
}
