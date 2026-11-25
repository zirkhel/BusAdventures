// @ts-check
// Personal template. Variants: geocities (handmade 1990s/2000s pages) and
// club (a small volunteer or community site). Guestbook, counters, webring
// and broken-image quirks are just blocks; hit targets stay at least 44px.

import { h, fmtDate } from "../ui.js";
import { renderBlock } from "./blocks.js";
import { logoOf, navItems, navLink, footerOf, leftoverImages, takeHero } from "./chrome.js";

/**
 * @param {any} phone
 * @param {{ v: any, site: any, design: any, blocks: any[], ctx: any, page: string }} o
 */
export function renderPersonal(phone, o) {
  const { v, site, design, blocks, ctx, page } = o;
  const items = navItems(phone, site, design);
  const name = siteName(phone, site);
  const used = { ...ctx, images: [...(ctx.images || [])] };
  const body = [];
  const hero = !blocks.some(b => b.t === "hero") ? takeHero(design, used, page) : null;
  if (hero) body.push(renderBlock(phone, { t: "hero", image: hero }, used));
  for (const b of blocks) body.push(renderBlock(phone, b, used));
  body.push(...leftoverImages(phone, used));
  const updated = design.header?.updated ? `Last updated: ${design.header.updated}` : null;
  return h("div.site-shell",
    h("header.site-head",
      h("div.site-brand", logoOf(phone, design, site), h("div.site-wordmark",
        h("div.mast", design.header?.mast || name),
        design.header?.tagline ? h("div.site-tagline", design.header.tagline) : null)),
      items.length ? h("nav.site-nav.site-nav-full", items.map(it => navLink(phone, it))) : null),
    h("div.site-main",
      updated ? h("div.site-updated", updated) : null,
      h("h1", phone.ctx.text(v.title)),
      v.date && page !== "guestbook" ? h("div.muted.site-date", fmtDate(v.date)) : null,
      h("div.page-body", body),
      quirks(design),
      comments(phone, v, page)),
    footerOf(design, name));
}

function quirks(design) {
  const hder = design.header || {};
  const out = [];
  if (hder.construction) out.push(h("div.site-quirk.quirk-construction", hder.construction === true ? "UNDER CONSTRUCTION" : hder.construction));
  for (const text of hder.broken || []) {
    out.push(h("div.site-quirk.quirk-broken", h("div.broken-img", "X"), h("div.muted", text)));
  }
  if (hder.counter) out.push(h("div.site-quirk.quirk-counter", "You are visitor number ", h("span.counter", hder.counter)));
  if (hder.webring) {
    const w = hder.webring;
    out.push(h("div.site-quirk.quirk-webring",
      h("div", w.title || "Webring"),
      w.prev ? h("div", "Previous: " + w.prev) : null,
      w.next ? h("div", "Next: " + w.next) : null));
  }
  return out.length ? h("div.site-quirks", out) : null;
}

function comments(phone, v, page) {
  const items = v.comments || [];
  if (!items.length && page !== "guestbook") return null;
  if (!items.length) return h("section.site-comments", h("div.muted", "No comments yet."));
  return h("section.site-comments",
    h("h2", "Guestbook"),
    items.map(c => h("div.site-comment",
      h("div.cm-head",
        h("b", commentName(phone, c)),
        c.date ? h("span.muted", ` · ${fmtDate(c.date)}`) : null),
      h("div.cm-text", phone.ctx.text(c.text || "")))));
}


function commentName(phone, c) {
  if (c.author || c.name) return c.author || c.name;
  const acc = c.account ? phone.g.w.accounts.get(c.account) : null;
  return acc?.displayName || acc?.handle || c.account || "A visitor";
}

function siteName(phone, site) {
  const pf = site.platform ? phone.g.w.platforms.get(site.platform) : null;
  return pf?.name || site.domain || site.id;
}
