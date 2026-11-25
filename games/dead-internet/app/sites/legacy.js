// @ts-check
// Legacy template. Variants: 2002, 2008. Full top nav, table-ish layout,
// small type, quirks (best-viewed, counters). Hit targets stay at least 44px.

import { h, fmtDate } from "../ui.js";
import { renderBlock } from "./blocks.js";
import { logoOf, navItems, navLink, footerOf, leftoverImages, takeHero } from "./chrome.js";

/**
 * @param {any} phone
 * @param {{ v: any, site: any, design: any, blocks: any[], ctx: any, page: string }} o
 */
export function renderLegacy(phone, o) {
  const { v, site, design, blocks, ctx, page } = o;
  const items = navItems(phone, site, design);
  const name = siteName(phone, site);
  const used = { ...ctx, images: [...(ctx.images || [])] };
  const body = [];
  const hero = !blocks.some(b => b.t === "hero") ? takeHero(design, used, page) : null;
  if (hero) body.push(renderBlock(phone, { t: "hero", image: hero }, used));
  for (const b of blocks) body.push(renderBlock(phone, b, used));
  body.push(...leftoverImages(phone, used));
  const best = design.header?.bestViewed || (design.variant === "2008"
    ? "Best viewed in Internet Explorer 6 at 1024×768"
    : "Best viewed with Netscape or Internet Explorer");
  return h("div.site-shell",
    h("header.site-head",
      h("div.site-brand", logoOf(phone, design, site), h("div.site-wordmark",
        h("div.mast", design.header?.mast || name),
        design.header?.tagline ? h("div.site-tagline", design.header.tagline) : null)),
      items.length ? h("nav.site-nav.site-nav-full", items.map(it => navLink(phone, it))) : null),
    h("div.site-main",
      h("table.site-legacy-table", h("tbody", h("tr",
        h("td.site-legacy-cell",
          h("h1", phone.ctx.text(v.title)),
          v.date ? h("div.muted.site-date", fmtDate(v.date)) : null,
          h("div.page-body", body))))),
      h("div.site-quirk.quirk-best", best)),
    footerOf(design, name));
}

function siteName(phone, site) {
  const pf = site.platform ? phone.g.w.platforms.get(site.platform) : null;
  return pf?.name || site.domain || site.id;
}
