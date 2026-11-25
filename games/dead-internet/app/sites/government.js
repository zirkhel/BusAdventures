// @ts-check
// Government template. Variants: municipal, registry, transit, library.
// Municipal pages show the full nav at the top. Records stay monospaced; other
// page types (person, calendar, notice) use ordinary text.

import { h, fmtDate } from "../ui.js";
import { renderBlock } from "./blocks.js";
import { logoOf, navItems, navLink, footerOf, leftoverImages, takeHero } from "./chrome.js";

/**
 * @param {any} phone
 * @param {{ v: any, site: any, design: any, blocks: any[], ctx: any, page: string }} o
 */
export function renderGovernment(phone, o) {
  const { v, site, design, blocks, ctx, page } = o;
  const items = navItems(phone, site, design);
  const crumbs = breadcrumbs(v.url);
  const header = h("header.site-head",
    h("div.site-brand", logoOf(phone, design, site), h("div.site-wordmark",
      h("div.mast", design.header?.mast || phone.g.w.platforms.get(site.platform)?.mast || phone.g.w.platforms.get(site.platform)?.name || site.domain),
      h("small", design.header?.tagline || phone.g.w.platforms.get(site.platform)?.mastSub || ""))),
    h("nav.site-nav.site-nav-full", items.map(it => navLink(phone, it))));

  const used = { ...ctx, images: [...(ctx.images || [])] };
  const body = [];
  const hero = !blocks.some(b => b.t === "hero") ? takeHero(design, used, page) : null;
  if (hero) body.push(renderBlock(phone, { t: "hero", image: hero }, used));
  for (const b of blocks) body.push(renderBlock(phone, b, used));
  body.push(...leftoverImages(phone, used));

  return h("div.site-shell", { class: `kind-${page}` },
    header,
    crumbs.length ? h("div.site-crumbs", crumbs.map((c, i) => [i ? h("span.sep", "›") : null, h("span", c)])) : null,
    h("div.site-main",
      h("h1", phone.ctx.text(v.title)),
      v.date ? h("div.muted.site-date", fmtDate(v.date)) : null,
      h("div.page-body", body)),
    footerOf(design, phone.g.w.platforms.get(site.platform)?.name || site.domain));
}

function breadcrumbs(url) {
  if (!url) return [];
  const path = String(url).replace(/^[a-z][a-z0-9+.-]*:\/\//i, "");
  const parts = path.split("/").filter(Boolean);
  if (parts.length <= 1) return parts;
  return parts.map((p, i) => (i === 0 ? p : decodeURIComponent(p).replace(/[-_]/g, " ")));
}
