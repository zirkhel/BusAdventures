// @ts-check
// Shared site chrome (logo, nav, footer) used by every template.

import { h } from "../ui.js";
import { img } from "../media.js";
import { resolveHref } from "../../core/sites.js";
import { figure } from "./blocks.js";

/** Logo from a design theme: `text:Name` or a graphics catalog id. */
export function logoOf(phone, design, site) {
  const logo = design.theme?.logo;
  const pf = site.platform ? phone.g.w.platforms.get(site.platform) : null;
  const fallback = pf?.name || site.domain || site.id || "";
  if (!logo) return h("span.site-logo-text", fallback);
  if (String(logo).startsWith("text:")) return h("span.site-logo-text", String(logo).slice(5));
  return h("span.site-logo", img(logo, { cls: "site-logo-img", alt: fallback }));
}

export function navItems(phone, site, design) {
  return (design.nav || []).map(link => {
    const r = resolveHref(phone.g.w, site, link.href);
    const url = r.url;
    return { label: link.label || url, url, state: link.state || r.state, artifact: r.artifact };
  });
}

export function goNav(phone, item) {
  if (item.url) phone.browse(item.url);
}

export function navLink(phone, item, cls = "site-nav-link") {
  return h("button", { class: cls, type: "button", onclick: () => goNav(phone, item) }, item.label);
}

export function footerOf(design, fallback) {
  const f = design.footer;
  if (!f) return fallback ? h("div.site-foot", fallback) : null;
  if (typeof f === "string" || f.text) return h("div.site-foot", f.text || f);
  if (f.columns) return h("div.site-foot", f.columns.map(col => h("div.site-foot-col", (col || []).map(line => h("div", line)))));
  return fallback ? h("div.site-foot", fallback) : null;
}

export function leftoverImages(phone, ctx) {
  return (ctx.images || []).map(id => figure(phone, id, ctx));
}

/** Pages that may promote the first (or theme.hero) image to a banner. */
const HERO_PAGES = new Set(["project", "about", "services", "home", "calendar", "page"]);

/**
 * Pull a hero image out of `used.images` so it is not also rendered as a leftover figure.
 * @param {any} design
 * @param {{images?: string[]}} used
 * @param {string} page
 * @returns {string|null}
 */
export function takeHero(design, used, page) {
  if (!HERO_PAGES.has(page)) return null;
  const imgs = used.images || [];
  const preferred = design.theme?.hero;
  if (preferred) {
    const i = imgs.indexOf(preferred);
    if (i >= 0) imgs.splice(i, 1);
    return preferred;
  }
  return imgs.length ? imgs.shift() : null;
}
