// @ts-check
// Landing template. Variants: saas (W5), smallbiz (W6). The parked state is
// owned by the Browser (status.js); a cached pre-parking design can still use
// this template.

import { h, fmtDate } from "../ui.js";
import { renderBlock } from "./blocks.js";
import { logoOf, navItems, navLink, footerOf, leftoverImages, takeHero } from "./chrome.js";
import { renderSimple } from "./simple.js";

/**
 * @param {any} phone
 * @param {{ v: any, site: any, design: any, blocks: any[], ctx: any, page: string }} o
 */
export function renderLanding(phone, o) {
  const variant = o.design?.variant;
  if (variant && variant !== "saas" && variant !== "smallbiz") return renderSimple(phone, o);
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
  const isSmall = variant === "smallbiz";
  const nav = items.length
    ? h(isSmall ? "nav.site-nav.site-nav-full" : "nav.site-nav", items.map(it => navLink(phone, it)))
    : null;
  return h("div.site-shell",
    h("header.site-head",
      h("div.site-brand", logoOf(phone, design, site), h("div.site-wordmark",
        h("div.mast", design.header?.mast || name),
        design.header?.tagline ? h("div.site-tagline", design.header.tagline) : null)),
      nav),
    h("div.site-main",
      h("h1", phone.ctx.text(v.title)),
      v.date ? h("div.muted.site-date", fmtDate(v.date)) : null,
      h("div.page-body", body)),
    footerOf(design, name));
}
