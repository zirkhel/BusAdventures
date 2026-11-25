// @ts-check
// Browser address resolution, bookmarks and the text-size setting.
// Kept free of the DOM so tests and save migration can use it.

import { hostOf, pathOf, siteStatus, siteIdOf, notFoundOf, normUrl } from "./sites.js";

/** Scale steps for the Browser text-size control (A− / A+). */
export const TEXT_SIZES = [0.85, 1, 1.15, 1.3];
export const DEFAULT_TEXT_SIZE = 1;

export function emptyBrowserState() {
  return { bookmarks: [], textSize: DEFAULT_TEXT_SIZE };
}

/** Fill in the browser field on a save (version 8). */
export function migrateBrowser(s) {
  const b = s.browser && typeof s.browser === "object" ? s.browser : {};
  const size = Number(b.textSize);
  s.browser = {
    bookmarks: Array.isArray(b.bookmarks) ? b.bookmarks.filter(x => x && x.url) : [],
    textSize: Number.isInteger(size) && size >= 0 && size < TEXT_SIZES.length ? size : DEFAULT_TEXT_SIZE,
  };
  return s;
}

/**
 * Decide what typing an address in the Browser should do.
 * A known domain with an unknown path is that site's 404, not a Seeker search.
 * An unknown domain is a search, as before. A bare domain opens the homepage.
 *
 * @param {any} w
 * @param {string} text
 * @param {string} [date]
 * @returns {{kind:string, artifact?:string, site?:string, url?:string, q?:string}}
 */
export function resolveBrowse(w, text, date) {
  let raw = String(text || "").trim();
  if (raw.includes("•") && raw.includes("@")) raw = raw.split("@").pop() || raw;
  if (!raw) return { kind: "empty" };

  const host = hostOf(raw);
  const path = pathOf(raw);
  const siteId = host && w.siteByDomain?.get(host);
  const site = siteId && w.sites.get(siteId);
  const url = host ? (path === "/" ? host : `${host}${path}`) : raw;

  if (site) {
    const st = siteStatus(site, date);
    if (st.state === "gone") return { kind: "gone", site: siteId, url };
    if (st.state === "parked") return { kind: "parked", site: siteId, url };
    if (st.state === "maintenance") return { kind: "maintenance", site: siteId, url };

    const exact = findByUrl(w, raw) || findByUrl(w, url);
    if (exact) return { kind: "page", artifact: exact, url: w.artifacts.get(exact)?.url || url };

    if (path === "/") {
      const home = homeArtifact(w, site);
      if (home) return { kind: "page", artifact: home, url: w.artifacts.get(home)?.url || site.domain };
      return { kind: "sitehome", site: siteId, url: site.domain };
    }
    return { kind: "notfound", site: siteId, url };
  }

  const id = findByUrl(w, raw) || (host && findByUrl(w, url));
  if (id) return { kind: "page", artifact: id, url: w.artifacts.get(id)?.url || url };
  return { kind: "search", q: raw };
}

function findByUrl(w, value) {
  if (!value || !w.artifactByUrl) return null;
  return w.artifactByUrl.get(normUrl(value)) || null;
}

export function homeArtifact(w, site) {
  const domain = site.domain;
  for (const cand of [domain, `${domain}/`, `${domain}/index`, `${domain}/home`]) {
    const id = findByUrl(w, cand);
    if (id) return id;
  }
  for (const a of w.artifacts.values()) {
    if (siteIdOf(w, a) !== site.id) continue;
    if (a.page === "home" || a.page === "front" || pathOf(a.url || "") === "/") return a.id;
  }
  return null;
}

export function isBookmarked(s, url) {
  const n = normUrl(url || "");
  return !!(n && (s.browser?.bookmarks || []).some(b => normUrl(b.url) === n));
}

/**
 * Toggle a bookmark. Returns true if it is now bookmarked.
 * @param {any} s
 * @param {{url:string, title?:string, artifact?:string, version?:string, day?:number}} entry
 */
export function toggleBookmark(s, entry) {
  if (!s.browser) migrateBrowser(s);
  const n = normUrl(entry.url || "");
  if (!n) return false;
  const list = s.browser.bookmarks;
  const i = list.findIndex(b => normUrl(b.url) === n);
  if (i >= 0) { list.splice(i, 1); return false; }
  list.push({
    url: n,
    title: entry.title || n,
    artifact: entry.artifact || null,
    version: entry.version ?? null,
    day: entry.day ?? null,
  });
  return true;
}

export function textScale(s) {
  const i = s.browser?.textSize ?? DEFAULT_TEXT_SIZE;
  return TEXT_SIZES[i] ?? 1;
}

/** @param {any} s @param {number} delta  -1 or +1 */
export function stepTextSize(s, delta) {
  if (!s.browser) migrateBrowser(s);
  const next = Math.max(0, Math.min(TEXT_SIZES.length - 1, (s.browser.textSize ?? DEFAULT_TEXT_SIZE) + delta));
  s.browser.textSize = next;
  return next;
}

export { notFoundOf };

/** Session-only back/forward stack (not written to the save). */
export function newBrowseSession() {
  return { stack: [{ kind: "home" }], forward: [] };
}

export function sessionPush(sess, desc) {
  sess.forward = [];
  sess.stack.push(desc);
  return sess;
}

export function sessionBack(sess) {
  if (sess.stack.length <= 1) return false;
  sess.forward.push(sess.stack.pop());
  return true;
}

export function sessionForward(sess) {
  if (!sess.forward.length) return false;
  sess.stack.push(sess.forward.pop());
  return true;
}
