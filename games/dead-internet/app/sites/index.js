// @ts-check
// Template engine for in-game websites (W2). Browser owns the chrome above the
// page; the template owns everything inside the article.

import { h } from "../ui.js";
import { publicView } from "../../core/site-view.js";
import { siteOf, designFor, blocksOf, pageTypeOf } from "../../core/sites.js";
import { getVersion } from "../../core/artifacts.js";
import { renderCorporate } from "./corporate.js";
import { renderGovernment } from "./government.js";
import { renderBlog } from "./blog.js";

const TEMPLATES = {
  corporate: renderCorporate,
  government: renderGovernment,
  blog: renderBlog,
};

/**
 * True when this view belongs to a site whose template is implemented.
 * @param {any} phone
 * @param {any} v
 */
export function canRenderSite(phone, v) {
  return !!templateFor(phone, v);
}

function templateFor(phone, v) {
  const w = phone.g.w;
  const a = w.artifacts.get(v.id);
  const site = siteOf(w, a);
  if (!site) return null;
  const ver = v.versionId ? getVersion(a, v.versionId) : null;
  const asOf = v.cached ? (v.date || ver?.date) : isoDate(phone);
  const design = designFor(site, ver || { date: v.date, cached: v.cached }, asOf);
  if (!design || !TEMPLATES[design.template]) return null;
  return { a, site, design, ver, render: TEMPLATES[design.template] };
}

function isoDate(phone) {
  const d = phone.g.date;
  if (!d) return "";
  if (typeof d === "string") return d.slice(0, 10);
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d).slice(0, 10);
}

/**
 * Render a site page. The view is re-whitelisted here so templates never see canon.
 * @param {any} phone
 * @param {any} v
 * @param {{context?: string}} [o]
 */
export function renderSite(phone, v, o = {}) {
  v = publicView(v);
  const found = templateFor(phone, v);
  if (!found) return null;
  const { a, site, design, render } = found;
  const ctx = { artifact: v.id, version: v.versionId, images: [...(v.images || [])] };
  const blocks = blocksOf({ body: v.body, blocks: v.blocks }, a);
  const page = pageTypeOf({ ...a, page: a.page || v.page, type: v.type, url: v.url });
  const article = phone.ctx.block(
    h(`article.page.site-page.tmpl-${design.template}.var-${design.variant || "default"}.page-${page}`,
      { class: v.platform ? `pf-${v.platform}` : "", style: themeStyle(design), "data-site": site.id, "data-design": design.id }),
    { artifact: v.id, version: v.versionId, title: v.title });
  article.append(render(phone, { v, a, site, design, blocks, ctx, page, o }));
  return article;
}

function themeStyle(design) {
  const p = design.theme?.palette || {};
  /** @type {any} */
  const s = {};
  if (p.bg) s["--site-bg"] = p.bg;
  if (p.ink) s["--site-ink"] = p.ink;
  if (p.accent) s["--site-accent"] = p.accent;
  if (design.theme?.radius != null) s["--site-radius"] = `${design.theme.radius}px`;
  return s;
}

export { logoOf, navItems, navLink, footerOf, leftoverImages } from './chrome.js';
export { blocksOf, listedPages } from '../../core/sites.js';
export { isoDate };
