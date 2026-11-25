// @ts-check
// Site model (WEBSITES.md W1). Artifacts remain the unit of search, cache and
// evidence. A site holds dated designs, navigation, status and a 404. Nothing
// here writes to the DOM.

import { isVisible, isLive } from "./artifacts.js";

const NAV_STATES = new Set(["login", "maintenance", "dead", "external"]);

/** Domains that appear only as email (or as an email host). Not public websites. */
export const EMAIL_ONLY_DOMAINS = new Set(["calder-mail.com", "bl-ops.net"]);

/** @param {string} url */
export function hostOf(url) {
  if (!url) return "";
  const s = String(url).trim();
  const noProto = s.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "");
  return noProto.split("/")[0].split("?")[0].split("#")[0].toLowerCase();
}

/** @param {string} href */
export function pathOf(url) {
  if (!url) return "/";
  const s = String(url).trim().replace(/^[a-z][a-z0-9+.-]*:\/\//i, "");
  const slash = s.indexOf("/");
  let path = slash < 0 ? "/" : s.slice(slash);
  path = path.split("?")[0].split("#")[0];
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path || "/";
}

/** Join a site domain with a relative href. */
export function absoluteUrl(domain, href) {
  if (!href) return domain || "";
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(href) || (href.includes(".") && !href.startsWith("/") && !href.startsWith("#"))) {
    return href.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "");
  }
  const path = href.startsWith("/") ? href : `/${href}`;
  const clean = path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
  return (domain || "") + (clean === "/" ? "" : clean);
}

/**
 * Attach site indexes to a world. Called from buildWorld.
 * @param {any} w
 * @param {any[]} sites
 */
export function indexSites(w, sites) {
  /** @type {Map<string, any>} */
  w.sites = new Map();
  /** @type {Map<string, string>} */
  w.siteByDomain = new Map();
  /** @type {Map<string, string>} */
  w.siteByPlatform = new Map();
  /** @type {Map<string, string>} */
  w.artifactByUrl = new Map();

  /** @type {Map<string, string[]>} */
  const platforms = new Map();
  for (const s of sites || []) {
    w.sites.set(s.id, s);
    for (const d of domainsOf(s)) w.siteByDomain.set(d, s.id);
    if (s.platform) {
      if (!platforms.has(s.platform)) platforms.set(s.platform, []);
      platforms.get(s.platform).push(s.id);
    }
  }
  for (const [p, ids] of platforms) if (ids.length === 1) w.siteByPlatform.set(p, ids[0]);
  for (const a of w.artifacts.values()) {
    if (a.url) w.artifactByUrl.set(normUrl(a.url), a.id);
  }
  return w;
}

function domainsOf(s) {
  const out = [];
  if (s.domain) out.push(String(s.domain).toLowerCase());
  for (const d of s.domains || []) if (d) out.push(String(d).toLowerCase());
  return out;
}

function normUrl(url) {
  return String(url || "").trim().replace(/^[a-z][a-z0-9+.-]*:\/\//i, "").replace(/\/$/, "").toLowerCase();
}

/** Site id for an artifact, via explicit field, URL host or platform. */
export function siteIdOf(w, artifact) {
  if (!artifact) return null;
  if (artifact.site && w.sites.has(artifact.site)) return artifact.site;
  const host = hostOf(artifact.url);
  if (host && w.siteByDomain.has(host)) return w.siteByDomain.get(host);
  if (artifact.platform && w.siteByPlatform.has(artifact.platform)) return w.siteByPlatform.get(artifact.platform);
  return null;
}

export function siteOf(w, artifact) {
  const id = siteIdOf(w, artifact);
  return id ? w.sites.get(id) : null;
}

/**
 * Site status at a date: live, parked, gone, maintenance.
 * @param {any} site
 * @param {string} [date]
 */
export function siteStatus(site, date) {
  if (!site) return { state: "live" };
  const rows = [...(site.status || [])].filter(r => r && r.from && (!date || r.from <= date));
  rows.sort((a, b) => a.from < b.from ? -1 : a.from > b.from ? 1 : 0);
  const last = rows[rows.length - 1];
  return last ? { state: last.state || "live", design: last.design, from: last.from } : { state: "live" };
}

/**
 * Design in effect for a version. Cached/historical views use the version date
 * (or a locked design id). Live views use the game date when given, so a theme
 * change applies to unchanged live pages.
 * @param {any} site
 * @param {{date?: string, design?: string, cached?: boolean}} [version]
 * @param {string} [asOf]  game date for a live view
 */
export function designFor(site, version = {}, asOf) {
  if (!site) return null;
  const designs = [...(site.designs || [])].sort((a, b) => (a.from || "") < (b.from || "") ? -1 : 1);
  if (version.design) {
    const locked = designs.find(d => d.id === version.design);
    if (locked) return locked;
  }
  const when = version.cached || !asOf ? (version.date || asOf || "") : asOf;
  let pick = designs[0] || null;
  for (const d of designs) if (!when || (d.from || "") <= when) pick = d;
  return pick || null;
}

/**
 * Resolve a nav href (relative or absolute) against a site.
 * @returns {{ artifact?: string, url: string, state?: string, external?: boolean }}
 */
export function resolveHref(w, site, href) {
  if (!href) return { url: "", state: "dead" };
  const raw = String(href);
  if (raw.startsWith("#")) return { url: raw, state: "external" };
  const abs = absoluteUrl(site?.domain, raw);
  const id = w.artifactByUrl.get(normUrl(abs));
  if (id) return { artifact: id, url: abs };
  return { url: abs, state: "dead" };
}

/**
 * Pages of a site (optionally of one page type) listed for the player.
 * Hidden or unlisted pages stay out. A cached view only includes pages dated
 * on or before the cache date.
 * @param {any} g  Game
 * @param {string} siteId
 * @param {{ page?: string, asOf?: string, cached?: boolean }} [opts]
 */
export function listedPages(g, siteId, opts = {}) {
  const w = g.w;
  const out = [];
  for (const a of w.artifacts.values()) {
    if (siteIdOf(w, a) !== siteId) continue;
    if (opts.page && (a.page || defaultPageType(a)) !== opts.page) continue;
    if (a.listed === false) continue;
    const date = a.date || a.versions?.[0]?.date || "";
    if (opts.asOf && date && date > opts.asOf) continue;
    if (opts.cached) {
      // historical list: any page that has (or had) a version at or before asOf
      if (!a.versions?.some(v => !opts.asOf || !v.date || v.date <= opts.asOf)) continue;
    } else if (!isLive(g, a.id)) {
      continue;
    }
    if (!opts.cached && !isVisible(g, a.id)) continue;
    out.push(a);
  }
  out.sort((a, b) => String(b.date || "") < String(a.date || "") ? -1 : 1);
  return out;
}

function defaultPageType(a) {
  if (a.page) return a.page;
  if (a.type === "article") return "article";
  if (a.type === "post") return "post";
  if (a.type === "thread") return "thread";
  if (a.type === "profile") return "profile";
  if (a.type === "record") return "record";
  if (a.type === "document") return "document";
  if (a.url && pathOf(a.url) === "/") return "home";
  return a.type || "page";
}

/** Page type used by templates and lists. */
export function pageTypeOf(a) {
  return defaultPageType(a);
}

export function notFoundOf(site) {
  return site?.notFound || { title: "Page not found", text: "That page does not exist." };
}

export { NAV_STATES };

/** Blocks for a version: authored blocks, or one text block from body. */
export function blocksOf(version, artifact) {
  const v = version || {};
  if (Array.isArray(v.blocks) && v.blocks.length) return v.blocks;
  const body = v.body ?? artifact?.body ?? "";
  if (body) return [{ t: "text", text: body }];
  return [];
}
