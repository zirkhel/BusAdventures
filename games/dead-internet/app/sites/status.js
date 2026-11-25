// @ts-check
// Site-styled 404 and maintenance, plus the Browser-owned parked and
// "can't be reached" screens. No new story wording: titles and body
// come from the site's notFound block, or from the fixed Browser phrases
// in WEBSITES.md.

import { h, icon } from "../ui.js";
import { designFor, notFoundOf, hostOf } from "../../core/sites.js";
import { logoOf, navItems, navLink, footerOf } from "./chrome.js";
import { isoDate } from "./index.js";

function themeStyle(design) {
  const p = design?.theme?.palette || {};
  /** @type {any} */
  const s = {};
  if (p.bg) s["--site-bg"] = p.bg;
  if (p.ink) s["--site-ink"] = p.ink;
  if (p.accent) s["--site-accent"] = p.accent;
  if (design?.theme?.radius != null) s["--site-radius"] = `${design.theme.radius}px`;
  return s;
}

function siteName(phone, site) {
  const pf = site.platform ? phone.g.w.platforms.get(site.platform) : null;
  return pf?.name || site.domain || site.id;
}

function siteOfId(phone, siteId) {
  return siteId ? phone.g.w.sites.get(siteId) : null;
}

export function siteForView(phone, v) {
  const w = phone.g.w;
  if (v?.loginSite && w.sites.has(v.loginSite)) return w.sites.get(v.loginSite);
  if (v?.loginSite) {
    for (const s of w.sites.values()) if (s.id === v.loginSite || s.platform === v.loginSite) return s;
  }
  const host = hostOf(v?.url || "");
  const id = host && w.siteByDomain.get(host);
  return id ? w.sites.get(id) : null;
}

/**
 * Logo, nav and footer in the site's current design, with a main area supplied by the caller.
 * @param {any} phone
 * @param {{ site: any, kind: string, title: string, url?: string }} opts
 * @param {...any} main
 */
export function renderSiteFrame(phone, opts, ...main) {
  const { site, kind, title, url } = opts;
  const date = isoDate(phone);
  const design = designFor(site, {}, date) || { template: "landing", variant: "default", theme: {}, nav: [] };
  const items = navItems(phone, site, design);
  const name = siteName(phone, site);
  const article = h(`article.page.site-page.tmpl-${design.template || "landing"}.var-${design.variant || "default"}.page-status`,
    { style: themeStyle(design), "data-site": site.id, "data-status": kind });
  article.append(h("div.site-shell",
    h("header.site-head",
      h("div.site-brand", logoOf(phone, design, site), h("div.site-wordmark",
        h("div.mast", design.header?.mast || name),
        design.header?.tagline ? h("div.site-tagline", design.header.tagline) : null)),
      items.length ? h("nav.site-nav", items.map(it => navLink(phone, it))) : null),
    h("div.site-main", ...main),
    footerOf(design, name)));
  return phone.ctx.block(article, { title, url });
}

export function renderNotFound(phone, desc) {
  const site = siteOfId(phone, desc.site);
  if (!site) return renderUnreachable(phone, desc);
  const nf = notFoundOf(site);
  return renderSiteFrame(phone, { site, kind: "notfound", title: nf.title, url: desc.url },
    h("h1", nf.title),
    h("p.p", nf.text),
    desc.url ? h("div.muted", desc.url) : null);
}

export function renderMaintenance(phone, desc) {
  const site = siteOfId(phone, desc.site);
  if (!site) return renderUnreachable(phone, desc);
  const nf = notFoundOf(site);
  const title = "We'll be back soon";
  const text = nf.maintenance || "This site is temporarily down for maintenance.";
  return renderSiteFrame(phone, { site, kind: "maintenance", title, url: desc.url },
    h("h1", title),
    h("p.p", text),
    desc.url ? h("div.muted", desc.url) : null);
}

export function renderSiteHome(phone, desc) {
  const site = siteOfId(phone, desc.site);
  if (!site) return renderUnreachable(phone, desc);
  const name = siteName(phone, site);
  const design = designFor(site, {}, isoDate(phone));
  const tag = design?.header?.tagline;
  return renderSiteFrame(phone, { site, kind: "sitehome", title: name, url: desc.url || site.domain },
    h("h1", name),
    tag ? h("p.p", tag) : null);
}

/** Generic parking page — not the old site's chrome, because the domain changed hands. */
export function renderParked(phone, desc) {
  const host = desc.url ? hostOf(desc.url) : (siteOfId(phone, desc.site)?.domain || "");
  const title = "This domain may be for sale";
  return h("article.page.k-parked",
    h("div.parked",
      h("div.parked-mark", "FOR SALE"),
      h("h1", title),
      h("p", `The domain ${host || "this address"} is parked. It may be available for purchase.`),
      host ? h("div.muted", host) : null));
}

/** Browser-owned error. Not drawn in the dead site's old style. */
export function renderUnreachable(phone, desc) {
  const host = desc.url ? hostOf(desc.url) : (siteOfId(phone, desc.site)?.domain || desc.url || "This site");
  return h("article.page.k-unreachable",
    h("div.gone.unreachable",
      icon("globe", "big"),
      h("h1", "This site can't be reached"),
      h("p", `${host}'s server IP address could not be found.`),
      desc.url ? h("div.muted", desc.url) : null,
      h("button.btn", { onclick: () => phone.search(host) }, "Search Seeker for cached copies")));
}

/** Sign-in form inside the site's chrome, when we know the site. */
export function renderSiteLogin(phone, v, form) {
  const site = siteForView(phone, v);
  if (!site) return null;
  return renderSiteFrame(phone, { site, kind: "login", title: v.title || "Sign in", url: v.url }, form);
}
