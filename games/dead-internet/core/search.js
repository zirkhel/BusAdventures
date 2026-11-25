// @ts-check
// Seeker, the in-game search engine. Free text: any query works.
// What decides whether something is found is how each artifact is indexed:
//   full   – normal ranking on title, author and body
//   weak   – only when every query word matches (2+ words), or on a keyword hit
//   exact  – only on a keyword hit (codes, domains, addresses): rewards a precise guess
//   none   – never in results (reachable only by being given or linked)
// Deleted or changed artifacts can still be found through cached versions, but only on a
// precise match (all words or a keyword), so the cache rewards deliberate digging.
// "quoted phrases" match the exact phrase. Transcripts of clips are searched like text.
// Forgiving like a real engine, and only that: light stemming (plural, -ing, -ed), small typos
// in longer words, and a partial-match fallback when no page has enough of the words. Typos and
// the fallback only reach "full" pages that the exact words would find anyway, so they never
// surface a hidden page or a name the player has not spelt. Ranking never knows what matters to a case. When a query obviously names a website (site name, brand or domain from the W1 model), that site's official page is always listed first, like a real engine.
// opts.platform limits a search to one app (TokTok search, a newspaper's own search).

import { asArray } from "./util.js";
import { isVisible, liveVersionId, cachedVersions, resolveVersion, getVersion, transcriptOf, shownDate } from "./artifacts.js";
import { imageRoot, mirrorParity, videoImages } from "./world.js";
import { check } from "./conditions.js";
import { officialSitesForQuery, siteDisplayName, siteStatus } from "./sites.js";
import { homeArtifact } from "./browser.js";

const STOP = new Set(("a an the and or of in on at to for is are was were be been it its this that with by from as " +
  "about into how what who why when where which does did do i you he she they we my your his her their our " +
  "me us them not no yes but if so than then there here s").split(" "));

const TOKEN_RE = /[a-z0-9]+(?:[._@'\-][a-z0-9]+)*/g;

export function normalize(text) {
  return String(text || "").toLowerCase().replace(/[’‘]/g, "'").replace(/[“”]/g, '"');
}

/** A word and its light stems: plural -s/-es, -ing, -ed (posted → post, voting → vote). */
export function stems(p) {
  const out = [p];
  if (p.length > 3 && p.endsWith("s") && !p.endsWith("ss")) out.push(p.slice(0, -1));
  if (p.length > 4 && p.endsWith("es")) out.push(p.slice(0, -2));
  if (p.length > 5 && p.endsWith("ing")) out.push(p.slice(0, -3), p.slice(0, -3) + "e");
  if (p.length > 4 && p.endsWith("ed")) out.push(p.slice(0, -2), p.slice(0, -1));
  return out;
}

/**
 * Edit distance where a swap of two neighbouring letters counts as one typo
 * (optimal string alignment). Stops early once it exceeds max and returns max + 1.
 */
export function editDistance(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let pp = null, prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      let d = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (pp && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d = Math.min(d, pp[j - 2] + 1);
      cur[j] = d;
      if (d < best) best = d;
    }
    if (best > max) return max + 1;
    pp = prev; prev = cur;
  }
  return prev[b.length];
}

/** How many typos a word may have: none under 5 letters, one from 5, two from 9. */
const typoBudget = t => t.length >= 9 ? 2 : t.length >= 5 ? 1 : 0;

/** Words and their parts, with light stems. */
export function tokenize(text) {
  const out = new Set();
  for (let tok of normalize(text).match(TOKEN_RE) || []) {
    tok = tok.replace(/'s$/, "");
    const parts = [tok, ...tok.split("@"), ...tok.split(/[._@'\-]/)];
    for (const p of parts) {
      if (!p || STOP.has(p)) continue;
      for (const x of stems(p)) out.add(x);
    }
  }
  return out;
}

/** Query terms: compound tokens are kept whole (bl-ops.net must match bl-ops.net). */
function queryTerms(q) {
  const terms = [];
  for (const tok of normalize(q).match(TOKEN_RE) || []) {
    if (STOP.has(tok)) continue;
    if (!terms.some(t => t[0] === tok)) terms.push(stems(tok));
  }
  return terms;
}

function docFields(g, a, v) {
  const acc = a.author ? g.w.accounts.get(a.author) : null;
  const r = resolveVersion(a, v);
  // Bylines count as authors. A clip's transcript is searchable text, like a caption.
  const by = r.byline.map(b => { const x = g.w.accounts.get(b); return x ? `${x.handle} ${x.displayName}` : String(b); }).join(" ");
  const said = r.video ? transcriptOf(g.w, r.video) : "";
  return {
    title: tokenize(r.title),
    author: tokenize(`${acc ? `${acc.handle} ${acc.displayName}` : ""} ${by}`),
    body: tokenize(`${r.body} ${said} ${a.url || ""}`),
    phrase: normalize(`${r.title} ${r.body} ${said} ${a.url || ""}`).replace(/\s+/g, " "),
    r,
  };
}

function keywordHit(a, qNorm, qTerms) {
  for (const kw of asArray(a.keywords)) {
    const k = normalize(kw).trim();
    if (!k) continue;
    if (qNorm === k || qNorm.includes(k)) return true;
    const kt = [...(normalize(k).match(TOKEN_RE) || [])];
    if (kt.length && kt.every(t => qTerms.some(q => q.includes(t)))) return true;
  }
  return false;
}

function snippet(body, terms) {
  const text = String(body || "").replace(/\s+/g, " ");
  const low = normalize(text);
  let at = -1;
  for (const t of terms) { const i = low.indexOf(t[0]); if (i >= 0 && (at < 0 || i < at)) at = i; }
  if (at < 0) return text.slice(0, 140);
  const start = Math.max(0, at - 50);
  return (start ? "…" : "") + text.slice(start, start + 140) + (start + 140 < text.length ? "…" : "");
}

/**
 * @param {any} g game
 * @param {string} query
 * @param {{limit?:number, platform?:string|string[]}} [opts]  platform: search inside one app
 */
export function search(g, query, opts = {}) {
  const limit = opts.limit ?? 12;
  const strict = run(g, query, opts, false);
  const base = (strict.length || opts.noFallback) ? strict : run(g, query, opts, true);
  return applyOfficialRank(g, query, opts, base).slice(0, limit);
}

/** Does a term (one of its stems) nearly match a word in the set? Typos only, never on short words. */
function fuzzyHas(set, variants) {
  const t = variants[0], max = typoBudget(t);
  if (!max) return false;
  for (const w of set) if (w.length >= 4 && w[0] === t[0] && editDistance(t, w, max) <= max) return true;
  return false;
}

function run(g, query, opts, partial) {
  const platforms = opts.platform ? asArray(opts.platform) : null;
  const raw = String(query || "").trim();
  const phraseMatch = raw.match(/^"(.+)"$/);
  const qNorm = normalize(raw).replace(/^"|"$/g, "").replace(/\s+/g, " ").trim();
  const terms = queryTerms(qNorm);
  if (!terms.length && !phraseMatch) return [];
  const flat = terms.flat();
  const results = [];

  for (const a of g.w.artifacts.values()) {
    const level = a.index || "full";
    if (level === "none") continue;
    if (platforms && !platforms.includes(a.platform)) continue;
    const kwHit = keywordHit(a, qNorm, flat);

    const evaluate = (v, cached) => {
      const f = docFields(g, a, v);
      let matched = 0, weight = 0;
      if (phraseMatch) {
        if (!f.phrase.includes(qNorm)) return null;
        matched = terms.length || 1; weight = 3;
      } else {
        // Typos only count on "full" pages that are live: a near miss never opens the cache
        // or a page that needs the exact word.
        const forgiving = level === "full" && !cached;
        for (const variants of terms) {
          let w = 0;
          for (const t of variants) {
            if (f.title.has(t)) w = Math.max(w, 3);
            else if (f.author.has(t)) w = Math.max(w, 2);
            else if (f.body.has(t)) w = Math.max(w, 1);
          }
          if (!w && forgiving) w = fuzzyHas(f.title, variants) ? 1.5 : fuzzyHas(f.author, variants) ? 1 : fuzzyHas(f.body, variants) ? 0.5 : 0;
          if (w) { matched++; weight += w; }
        }
      }
      const n = Math.max(terms.length, 1);
      const coverage = matched / n;
      let include = false;
      if (partial) include = !cached && level === "full" && matched > 0;
      else if (cached) include = kwHit || (phraseMatch ? matched > 0 : coverage === 1);
      else if (level === "full") include = kwHit || (matched > 0 && coverage >= 0.5);
      else if (level === "weak") include = kwHit || (phraseMatch ? matched > 0 : coverage === 1 && n >= 2);
      else if (level === "exact") include = kwHit;
      else if (level === "cache") include = false;
      if (!include) return null;
      let score = weight * coverage * coverage + (kwHit ? 10 : 0);
      if (level === "weak") score *= 0.5;
      if (cached) score *= 0.6;
      if (a.filler) score *= 0.9;
      return { score, f };
    };

    // Live version
    if (isVisible(g, a.id) && level !== "cache") {
      const vid = liveVersionId(g, a);
      if (vid != null) {
        const locked = a.access && !check(a.access, g.ctx);
        if (locked) {
          // Only the sign-in page is indexed.
          const lt = tokenize(`${a.lockedTitle || a.title} ${a.url || ""}`);
          const m = terms.filter(vs => vs.some(t => lt.has(t))).length;
          if (kwHit || (m > 0 && m / terms.length >= 0.5)) {
            results.push({ artifact: a.id, title: a.lockedTitle || a.title, snippet: a.url || "", url: a.url, platform: a.platform,
              date: a.date, cached: false, versionId: null, locked: true, score: m * 2 });
          }
        } else {
          const hit = evaluate(getVersion(a, vid), false);
          if (hit) results.push({ artifact: a.id, title: hit.f.r.title, snippet: snippet(hit.f.r.body, terms), url: a.url,
            platform: a.platform, date: shownDate(g, a, hit.f.r).date, cached: false, versionId: vid, locked: false, score: hit.score,
            ...(partial ? { partial: true } : {}) });
        }
      }
    }
    // Cached versions (never in the partial fallback)
    if (!partial) for (const v of cachedVersions(g, a)) {
      const hit = evaluate(v, true);
      if (hit) results.push({ artifact: a.id, title: hit.f.r.title, snippet: snippet(hit.f.r.body, terms), url: a.url,
        platform: a.platform, date: hit.f.r.date, cached: true, versionId: v.id, locked: false, score: hit.score });
    }
  }

  results.sort((x, y) => y.score - x.score || String(y.date).localeCompare(String(x.date)) || x.artifact.localeCompare(y.artifact));
  return results;
}

/**
 * Search by image. Finds other uses of the same original picture.
 * Mirrored copies are only found with flip: true ("Flip & search"). Key frames and posters
 * count as images of their clip, so "Search by frame" finds reused footage.
 */
export function searchImage(g, imageId, opts = {}) {
  const w = g.w;
  if (!w.images.has(imageId)) return [];
  const root = imageRoot(w, imageId);
  const want = mirrorParity(w, imageId) ^ (opts.flip ? 1 : 0);
  const out = [];
  for (const img of w.images.values()) {
    if (img.id === imageId || w.disabled?.has(img.id)) continue;
    if (imageRoot(w, img.id) !== root) continue;
    if (mirrorParity(w, img.id) !== want) continue;
    for (const aid of w.imageUse.get(img.id) || []) {
      const a = w.artifacts.get(aid);
      if ((a.index || "full") === "none") continue;
      if (isVisible(g, aid) && liveVersionId(g, a) != null) {
        const live = getVersion(a, liveVersionId(g, a));
        if (shows(w, resolveVersion(a, live), img.id)) {
          out.push({ artifact: aid, image: img.id, title: resolveVersion(a, live).title, url: a.url, platform: a.platform, cached: false, versionId: live.id });
          continue;
        }
      }
      for (const v of cachedVersions(g, a)) {
        if (shows(w, resolveVersion(a, v), img.id)) {
          out.push({ artifact: aid, image: img.id, title: resolveVersion(a, v).title, url: a.url, platform: a.platform, cached: true, versionId: v.id });
          break;
        }
      }
    }
  }
  return out;
}

/** Does a version show the image (in its pictures, or as a frame or poster of its clip)? */
function shows(w, r, imageId) {
  return asArray(r.images).includes(imageId) || (r.video != null && videoImages(w, r.video).includes(imageId));
}

/** In-fiction metadata ("Image info"). */
export function imageInfo(g, imageId) {
  const img = g.w.images.get(imageId);
  if (!img) return null;
  return { id: img.id, kind: img.kind, caption: img.caption ?? "", meta: img.meta ?? null };
}


const OFFICIAL_SCORE = 10000;

const STATUS_SNIPPET = {
  gone: "This site can't be reached",
  parked: "This domain may be for sale",
  maintenance: "We'll be back soon",
};

/**
 * When the query clearly names a website, put that site's official landing first.
 * In-app searches (a newspaper, Connect) are left alone. Hidden pages stay hidden.
 * Gone and parked sites still appear, and opening them follows the site status.
 * @param {any} g
 * @param {string} query
 * @param {{platform?:string|string[]}} opts
 * @param {any[]} results
 */
function applyOfficialRank(g, query, opts, results) {
  if (opts.platform) return results;
  const matches = officialSitesForQuery(g.w, query);
  if (!matches.length) return results;
  const promoted = [];
  const used = new Set();
  for (const { site, strength } of matches) {
    const land = officialLanding(g, site);
    if (!land) continue;
    land.score = OFFICIAL_SCORE + strength * 10;
    if (land.artifact) {
      const existing = results.find(r => r.artifact === land.artifact && !r.cached);
      if (existing) {
        existing.score = land.score;
        existing.official = true;
        existing.site = site.id;
        promoted.push(existing);
        used.add(existing);
        continue;
      }
    }
    promoted.push(land);
  }
  const rest = results.filter(r => !used.has(r));
  return [...promoted, ...rest];
}

function officialLanding(g, site) {
  const date = String(g.date || "").slice(0, 10);
  const st = siteStatus(site, date);
  const title = siteDisplayName(g.w, site);
  const url = site.domain;
  if (st.state === "gone" || st.state === "parked" || st.state === "maintenance") {
    return {
      official: true, kind: st.state, site: site.id, artifact: null,
      title, snippet: STATUS_SNIPPET[st.state], url,
      platform: site.platform || null, date: st.from || null,
      cached: false, versionId: null, locked: false,
    };
  }
  const home = homeArtifact(g.w, site);
  if (home && isVisible(g, home)) {
    const a = g.w.artifacts.get(home);
    const locked = !!(a.access && !check(a.access, g.ctx));
    const vid = locked ? null : liveVersionId(g, a);
    return {
      official: true, kind: "page", site: site.id, artifact: home,
      title: locked ? (a.lockedTitle || a.title || title) : (a.title || title),
      snippet: a.url || url, url: a.url || url, platform: a.platform,
      date: a.date, cached: false, versionId: vid, locked,
    };
  }
  return {
    official: true, kind: "sitehome", site: site.id, artifact: null,
    title, snippet: url, url, platform: site.platform || null,
    date: null, cached: false, versionId: null, locked: false,
  };
}
