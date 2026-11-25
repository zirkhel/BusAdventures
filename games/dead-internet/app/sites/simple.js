// @ts-check
// Thin chrome for templates that are not yet fully designed (landing, legacy,
// personal, wiki, document). Logo, optional nav, a hero image, then the
// original page text. Forum, news, app and anonymous stay on their existing
// renderers; static.channel stays raw.

import { h, fmtDate } from "../ui.js";
import { renderBlock } from "./blocks.js";
import { logoOf, navItems, navLink, footerOf, leftoverImages, takeHero } from "./chrome.js";

/**
 * @param {any} phone
 * @param {{ v: any, site: any, design: any, blocks: any[], ctx: any, page: string }} o
 */
export function renderSimple(phone, o) {
  const { v, site, design, blocks, ctx, page } = o;
  const items = navItems(phone, site, design);
  const used = { ...ctx, images: [...(ctx.images || [])] };
  const body = [];
  const hero = !blocks.some(b => b.t === "hero") ? takeHero(design, used, page) : null;
  if (hero) body.push(renderBlock(phone, { t: "hero", image: hero }, used));
  for (const b of blocks) body.push(renderBlock(phone, b, used));
  body.push(...leftoverImages(phone, used));
  const name = siteName(phone, site);
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

function siteName(phone, site) {
  const pf = site.platform ? phone.g.w.platforms.get(site.platform) : null;
  return pf?.name || site.domain || site.id;
}
