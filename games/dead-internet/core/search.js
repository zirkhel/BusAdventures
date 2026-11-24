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
// opts.platform limits a search to one app (TokTok search, a newspaper's own search).

import { asArray } from "./util.js";
import { isVisible, liveVersionId, cachedVersions, resolveVersion, getVersion, transcriptOf } from "./artifacts.js";
import { imageRoot, mirrorParity, videoImages } from "./world.js";
import { check } from "./conditions.js";

const STOP = new Set(("a an the and or of in on at to for is are was were be been it its this that with by from as " +
  "about into how what who why when where which does did do i you he she they we my your his her their our " +
  "me us them not no yes but if so than then there here s").split(" "));

const TOKEN_RE = /[a-z0-9]+(?:[._@'\-][a-z0-9]+)*/g;

export function normalize(text) {
  return String(text || "").toLowerCase().replace(/[’‘]/g, "'").replace(/[“”]/g, '"');
}

/** Words and their parts, with a light plural stem. */
export function tokenize(text) {
  const out = new Set();
  for (let tok of normalize(text).match(TOKEN_RE) || []) {
    tok = tok.replace(/'s$/, "");
    const parts = [tok, ...tok.split("@"), ...tok.split(/[._@'\-]/)];
    for (const p of parts) {
      if (!p || STOP.has(p)) continue;
      out.add(p);
      if (p.length > 3 && p.endsWith("s") && !p.endsWith("ss")) out.add(p.slice(0, -1));
    }
  }
  return out;
}

/** Query terms: compound tokens are kept whole (bl-ops.net must match bl-ops.net). */
function queryTerms(q) {
  const terms = [];
  for (const tok of normalize(q).match(TOKEN_RE) || []) {
    if (STOP.has(tok)) continue;
    const variants = [tok];
    if (tok.length > 3 && tok.endsWith("s") && !tok.endsWith("ss")) variants.push(tok.slice(0, -1));
    if (!terms.some(t => t[0] === tok)) terms.push(variants);
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
        for (const variants of terms) {
          let w = 0;
          for (const t of variants) {
            if (f.title.has(t)) w = Math.max(w, 3);
            else if (f.author.has(t)) w = Math.max(w, 2);
            else if (f.body.has(t)) w = Math.max(w, 1);
          }
          if (w) { matched++; weight += w; }
        }
      }
      const n = Math.max(terms.length, 1);
      const coverage = matched / n;
      let include = false;
      if (cached) include = kwHit || (phraseMatch ? matched > 0 : coverage === 1);
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
            platform: a.platform, date: hit.f.r.date, cached: false, versionId: vid, locked: false, score: hit.score });
        }
      }
    }
    // Cached versions
    for (const v of cachedVersions(g, a)) {
      const hit = evaluate(v, true);
      if (hit) results.push({ artifact: a.id, title: hit.f.r.title, snippet: snippet(hit.f.r.body, terms), url: a.url,
        platform: a.platform, date: hit.f.r.date, cached: true, versionId: v.id, locked: false, score: hit.score });
    }
  }

  results.sort((x, y) => y.score - x.score || String(y.date).localeCompare(String(x.date)) || x.artifact.localeCompare(y.artifact));
  return results.slice(0, limit);
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
