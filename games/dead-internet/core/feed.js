// @ts-check
// Feeds (TokTok, and later the newspapers' front pages): what a platform shows when the
// player just scrolls.
//
// The feed is deterministic and blind to the investigation. It reads only:
//   the platform, each item's category (category or section), popularity (stats.views),
//   date, author, and the player's explicit interaction on that platform
//   (follows, likes, "not interested"), plus a hash of the seed and the day.
// It never reads supports, mentions, claims, cases or Seeker history, so evidence never
// floats to the top and nothing in the feed hints at relevance.
//
// Two tabs: "forYou" (everything, ranked) and "following" (followed accounts, newest first).
// Liking or following gives no knowledge and fills no tool (discovery is unchanged).
// Watching a clip is opening it: the clip is seen, its creator and captioned names encountered.

import { isVisible, liveVersionId, getVersion, resolveVersion } from "./artifacts.js";
import { check } from "./conditions.js";

/** Empty media state (state.media). */
export function initMedia() {
  return { follows: {}, likes: {}, notInterested: {} };
}

/** 32-bit FNV-1a hash → [0, 1). Same seed, day and id → same value. */
function hash01(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0) / 4294967296;
}

const categoryOf = a => a.category ?? a.section ?? null;

/** Items a platform can show in its feed right now (live, visible, not behind a login). */
function candidates(g, platform) {
  const out = [];
  for (const a of g.w.artifacts.values()) {
    if (a.platform !== platform || a.type === "profile" || a.feed === false) continue;
    if (!isVisible(g, a.id)) continue;
    const vid = liveVersionId(g, a);
    if (vid == null) continue;
    if (a.access && !check(a.access, g.ctx)) continue;
    const r = resolveVersion(a, getVersion(a, vid));
    out.push({ a, r, date: r.date ?? a.date ?? "", views: r.stats?.views ?? 0 });
  }
  return out;
}

/** The player's taste on this platform, from explicit interaction only. */
function taste(g, platform) {
  const m = g.s.media || initMedia();
  const cat = new Map(), author = new Map();
  const bump = (map, k, n) => { if (k != null) map.set(k, (map.get(k) || 0) + n); };
  for (const id of Object.keys(m.likes)) {
    const a = g.w.artifacts.get(id);
    if (a?.platform === platform) { bump(cat, categoryOf(a), 1); bump(author, a.author, 1); }
  }
  for (const id of Object.keys(m.notInterested)) {
    const a = g.w.artifacts.get(id);
    if (a?.platform === platform) { bump(cat, categoryOf(a), -2); bump(author, a.author, -3); }
  }
  return { cat, author, follows: m.follows, hidden: m.notInterested };
}

/**
 * A page of the feed.
 * @param {any} g
 * @param {{platform:string, tab?:"forYou"|"following", offset?:number, limit?:number}} opts
 * @returns {{items:string[], total:number}}  artifact ids
 */
export function feed(g, opts) {
  const tab = opts.tab ?? "forYou", offset = opts.offset ?? 0, limit = opts.limit ?? 10;
  const t = taste(g, opts.platform);
  let list = candidates(g, opts.platform).filter(x => !t.hidden[x.a.id]);
  if (tab === "following") {
    list = list.filter(x => x.a.author && t.follows[x.a.author]);
    list.sort((x, y) => String(y.date).localeCompare(String(x.date)) || x.a.id.localeCompare(y.a.id));
  } else {
    const day = g.s.day, seed = g.s.seed;
    const score = x => {
      let s = Math.log10(x.views + 1);                                  // popularity
      s += 0.8 * (t.cat.get(categoryOf(x.a)) || 0);                     // categories you liked
      s += 0.6 * (t.author.get(x.a.author) || 0);                       // creators you liked
      if (x.a.author && t.follows[x.a.author]) s += 2;                  // creators you follow
      s += 3 * hash01(`${seed}:${day}:${x.a.id}`);                      // daily shuffle
      return s;
    };
    const scored = list.map(x => ({ x, s: score(x) }));
    scored.sort((p, q) => q.s - p.s || p.x.a.id.localeCompare(q.x.a.id));
    list = scored.map(p => p.x);
  }
  return { items: list.slice(offset, offset + limit).map(x => x.a.id), total: list.length };
}

/**
 * A newspaper's own lists: newest first, never ranked. Front page, a section, or an author.
 * Only items that are live, visible and not dated after today. Like the feed, it never reads
 * supports, mentions, claims or cases.
 * @param {any} g
 * @param {{platform:string, section?:string|null, author?:string|null, offset?:number, limit?:number}} opts
 * @returns {{items:string[], total:number}}
 */
export function newsList(g, opts) {
  const today = g.date;
  let list = candidates(g, opts.platform).filter(x => !x.date || String(x.date).slice(0, 10) <= today);
  if (opts.section) list = list.filter(x => categoryOf(x.a) === opts.section);
  if (opts.author) list = list.filter(x => x.a.author === opts.author || x.r.byline.includes(opts.author));
  list.sort((x, y) => String(y.date).localeCompare(String(x.date)) || x.a.id.localeCompare(y.a.id));
  const offset = opts.offset ?? 0, limit = opts.limit ?? 20;
  return { items: list.slice(offset, offset + limit).map(x => x.a.id), total: list.length };
}

/** Follow or unfollow an account. Only accounts the player has met. */
export function follow(g, account, on = true) {
  if (!g.w.accounts.has(account)) return { error: "unknown_account" };
  if (g.s.encountered[account] == null && !g.s.known[account]) return { error: "not_encountered" };
  if (on) g.s.media.follows[account] = g.s.day; else delete g.s.media.follows[account];
  return { ok: true };
}

/** Like or unlike something the player has seen. */
export function like(g, artifact, on = true) {
  if (!g.w.artifacts.has(artifact)) return { error: "unknown_artifact" };
  if (g.s.seen[artifact] == null) return { error: "not_seen" };
  if (on) g.s.media.likes[artifact] = g.s.day; else delete g.s.media.likes[artifact];
  return { ok: true };
}

/** "Not interested": the item leaves the feed and its category and creator sink. Feed only. */
export function notInterested(g, artifact, on = true) {
  if (!g.w.artifacts.has(artifact)) return { error: "unknown_artifact" };
  if (on) g.s.media.notInterested[artifact] = g.s.day; else delete g.s.media.notInterested[artifact];
  return { ok: true };
}

/** What the presentation layer may show about the player's own interaction. */
export function mediaView(g) {
  const m = g.s.media || initMedia();
  return { follows: Object.keys(m.follows), likes: Object.keys(m.likes), notInterested: Object.keys(m.notInterested) };
}

/** Save migration 5 → 6. */
export function migrateMedia(s) { if (!s.media) s.media = initMedia(); }
