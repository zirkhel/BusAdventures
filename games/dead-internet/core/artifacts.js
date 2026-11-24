// @ts-check
// Artifacts: everything the player can read. Posts, profiles, articles, pages, documents,
// records, images. Each artifact has one or more versions. The state can change which
// version is live (or delete it), hide or reveal it. Versions marked `cached` stay readable
// through the search engine's cache after they stop being live.

import { check } from "./conditions.js";
import { asArray } from "./util.js";

/** @returns {string|null} id of the live version, or null if deleted */
export function liveVersionId(g, a) {
  const o = g.s.artifacts[a.id];
  if (o && "live" in o) return o.live;
  if ("live" in a) return a.live;
  return a.versions[a.versions.length - 1].id;
}

export function accountActive(g, accId) {
  if (!accId || !g.w.accounts.has(accId)) return true;
  return !g.s.accounts[accId]?.deleted;
}

/** Can the artifact be found and opened live right now (ignoring login)? */
export function isVisible(g, id) {
  const a = g.w.artifacts.get(id);
  if (!a) return false;
  if (g.w.disabled?.has(id)) return false;
  const o = g.s.artifacts[id];
  if (o && "visible" in o) { if (!o.visible) return false; }
  else {
    if (a.hidden) return false;
    if (a.visibleIf && !check(a.visibleIf, g.ctx)) return false;
  }
  if (a.author && !accountActive(g, a.author)) return false;
  return true;
}

export function isLive(g, id) {
  const a = g.w.artifacts.get(id);
  return !!a && isVisible(g, id) && liveVersionId(g, a) != null;
}

/** Has the artifact ever been public, so that the cache could have a copy? */
function everPublic(g, a) {
  const o = g.s.artifacts[a.id];
  if (o?.wasVisible) return true;
  if (a.hidden) return false;
  return true;
}

/** Versions readable through the cache (not counting the live version). */
export function cachedVersions(g, a) {
  if (g.w.disabled?.has(a.id)) return [];
  if (!everPublic(g, a)) return [];
  const live = isVisible(g, a.id) ? liveVersionId(g, a) : null;
  return a.versions.filter(v => v.cached && v.id !== live);
}

export function getVersion(a, vid) { return a.versions.find(v => v.id === vid) || null; }

/** Merge artifact-level fields with a version's overrides. */
export function resolveVersion(a, v) {
  return {
    title: v.title ?? a.title,
    body: v.body ?? a.body ?? "",
    date: v.date ?? a.date,
    images: v.images ?? a.images ?? [],
    supports: v.supports ?? a.supports ?? [],
    mentions: [...new Set([...asArray(a.mentions), ...asArray(v.mentions)])],
    source: v.source ?? a.source ?? a.id,
    // Media fields (all optional). covers and pool are authoring data and never shown.
    section: v.section ?? a.section ?? null,
    byline: asArray(v.byline ?? a.byline),
    corrections: asArray(v.corrections ?? a.corrections),
    related: asArray(v.related ?? a.related),
    refs: asArray(v.refs ?? a.refs),
    sponsored: v.sponsored ?? a.sponsored ?? null,
    comments: commentsIn(a, v),
    video: v.video ?? a.video ?? null,
    stats: v.stats ?? a.stats ?? null,
    breaking: !!(v.breaking ?? a.breaking),
  };
}

/** Comments visible in a version: a comment with deletedIn is gone from that version on. */
function commentsIn(a, v) {
  const at = a.versions.indexOf(v);
  return asArray(v.comments ?? a.comments).filter(c => {
    if (!c.deletedIn) return true;
    const d = a.versions.findIndex(x => x.id === c.deletedIn);
    return d < 0 || at < d;
  }).map(({ deletedIn, ...c }) => c);
}

/** What the player sees of a video: never its scenes, location, source or script id. */
export function videoView(w, id) {
  const v = w.videos.get(id);
  if (!v) return null;
  return { id: v.id, duration: v.duration ?? null, poster: v.poster ?? null, frames: asArray(v.frames).map(f => ({ t: f.t, image: f.image })),
    audio: v.audio ?? null, meta: v.meta ?? null };
}

/** Transcript of a clip: the video's own text, or its script's. */
export function transcriptOf(w, videoId) {
  const v = w.videos.get(videoId);
  if (!v) return "";
  return v.transcript ?? w.scripts.get(v.script)?.text ?? "";
}

/**
 * What the player sees when opening an artifact.
 * @param {any} g
 * @param {string} id
 * @param {{version?:string}} [opts] version: read a cached version
 */
export function viewArtifact(g, id, opts = {}) {
  const a = g.w.artifacts.get(id);
  if (!a) return { error: "unknown" };
  const base = { id, type: a.type, platform: a.platform, url: a.url, author: a.author ?? null };
  if (opts.version) {
    const v = getVersion(a, opts.version);
    const live = isVisible(g, id) ? liveVersionId(g, a) : null;
    const ok = v && (v.id === live || cachedVersions(g, a).some(c => c.id === v.id));
    if (!ok) return { ...base, error: "not_available" };
    return { ...base, versionId: v.id, cached: v.id !== live, ...media(g, resolveVersion(a, v)) };
  }
  if (!isVisible(g, id)) {
    const cached = cachedVersions(g, a);
    return cached.length ? { ...base, error: "gone", cachedVersions: cached.map(v => v.id) } : { ...base, error: "not_available" };
  }
  if (a.access && !check(a.access, g.ctx)) {
    return { ...base, locked: true, loginSite: a.loginSite ?? null, title: a.lockedTitle ?? a.title };
  }
  const vid = liveVersionId(g, a);
  if (vid == null) {
    const cached = cachedVersions(g, a);
    return { ...base, error: "deleted", cachedVersions: cached.map(v => v.id) };
  }
  const v = getVersion(a, vid);
  return { ...base, versionId: vid, cached: false, cachedVersions: cachedVersions(g, a).map(c => c.id), ...media(g, resolveVersion(a, v)) };
}

/** Player-facing media: the video object (without hidden canon) and its transcript. */
function media(g, r) {
  if (!r.video) return r;
  return { ...r, video: videoView(g.w, r.video), transcript: transcriptOf(g.w, r.video) };
}

/** Supports (claim ids) of a specific version, or of the live/latest one. */
export function supportsOf(g, id, vid) {
  const a = g.w.artifacts.get(id);
  if (!a) return [];
  const v = getVersion(a, vid ?? liveVersionId(g, a) ?? a.versions[a.versions.length - 1].id) || a.versions[0];
  return resolveVersion(a, v).supports;
}

/** Source key of a specific version (cached copies can come from a different source than the live page). */
export function sourceOf(g, id, vid) {
  const a = g.w.artifacts.get(id);
  if (!a) return id;
  const v = getVersion(a, vid ?? liveVersionId(g, a) ?? a.versions[0].id) || a.versions[0];
  return resolveVersion(a, v).source;
}

export function mentionsOf(g, id, vid) {
  const a = g.w.artifacts.get(id);
  if (!a) return [];
  const v = getVersion(a, vid ?? liveVersionId(g, a) ?? a.versions[0].id) || a.versions[0];
  const m = resolveVersion(a, v).mentions;
  if (a.author) m.push(a.author);
  return m;
}
