// Media core (M1): article fields, videos and transcripts, light accounts, the feed,
// platform search, frame search, save migration and the validator's media rules.
// The pool is virtual (added through loadContent), so the real content stays untouched.
//   node --test games/dead-internet/tests/*.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { CONTENT_DIR } from "../tools/lib/node-world.mjs";
import { loadContent } from "../core/content.js";
import { buildWorld } from "../core/world.js";
import { validateWorld } from "../tools/lib/validate-world.mjs";
import { Game, replay } from "../core/game.js";
import { serialize, deserialize } from "../core/save.js";
import { SAVE_VERSION } from "../core/state.js";
import { mediaReport } from "../tools/lib/media.mjs";

// ── A small TokTok pool ─────────────────────────────────────────────────────
const CREATORS = ["kaylacooks", "beanthecat", "drivetimedan", "gymrat", "plantmom"];
const POOL = {
  "pools/toktok/platforms.json": [{ id: "toktok", name: "TokTok", kind: "video", domain: "toktok.app" }],
  "pools/toktok/sites.json": [{ id: "toktok", domain: "toktok.app", platform: "toktok",
    designs: [{ id: "d1", from: "2020-01-01", template: "legacy" }],
    status: [{ from: "2020-01-01", state: "live" }] }],
  "pools/toktok/creators.json": CREATORS.map(h => ({ id: `acc_tt_${h}`, platform: "toktok", handle: `@${h}`, displayName: h, pool: "toktok", created: "2024-01-01" })),
  "pools/toktok/images.json": [
    { id: "IMGK0", kind: "photo", caption: "A kitchen set" },
    { id: "VID0001P", kind: "frame", derivedFrom: "IMGK0" },
    { id: "VID0001F1", kind: "frame", derivedFrom: "IMGK0" },
    { id: "VID0002F1", kind: "frame", derivedFrom: "IMGK0" },
  ],
  "pools/toktok/scripts.json": [{ id: "SCR_today", text: "I was today years old when I learned you can freeze lemons whole." }],
  "pools/toktok/videos.json": [
    { id: "VID0001", kind: "clip", duration: 14, poster: "VID0001P", frames: [{ t: 3, image: "VID0001F1" }], script: "SCR_today",
      scenes: [{ from: 0, to: 14, location: "loc_kitchen_set_03" }], meta: { uploaded: "2025-08-01 21:14", device: "Lumen 9" }, source: "tt-kayla" },
    { id: "VID0002", kind: "clip", duration: 9, frames: [{ t: 2, image: "VID0002F1" }], script: "SCR_today",
      scenes: [{ from: 0, to: 9, location: "loc_kitchen_set_03" }], meta: { uploaded: "2025-08-02 08:02" }, source: "tt-plant" },
  ],
  "pools/toktok/clips.json": Array.from({ length: 20 }, (_, i) => {
    const n = String(i + 1).padStart(5, "0"), creator = CREATORS[i % CREATORS.length];
    const clip = { id: `TT-${n}`, type: "video", platform: "toktok", author: `acc_tt_${creator}`, url: `toktok.app/@${creator}/${n}`,
      date: `2025-08-${String(1 + (i % 28)).padStart(2, "0")}`, category: ["food", "pets", "cars", "fitness"][i % 4],
      stats: { views: 1000 * ((i * 7919) % 97 + 1) }, source: `tt-${creator}`, filler: true,
      versions: [{ id: "v1", title: `clip ${n}`, body: `#fyp clip by ${creator}` }] };
    if (i === 0) Object.assign(clip, { video: "VID0001", comments: [
      { id: "c1", account: "acc_tt_beanthecat", date: "2025-08-01 21:20", text: "my cat does this 😭", likes: 4120 },
      { id: "c2", account: "acc_tt_gymrat", date: "2025-08-01 22:00", text: "fake", deletedIn: "v2" }] },
      { versions: [{ id: "v1", title: "lemon hack", body: "#fyp #kitchen", cached: true }, { id: "v2", title: "lemon hack", body: "#fyp #kitchen (edited)" }] });
    if (i === 4) clip.video = "VID0002";
    return clip;
  }),
  "pools/dailyrecord/articles.json": [{
    id: "DR-2025-0141", type: "article", platform: "dailyrecord", date: "2025-08-03", source: "dailyrecord", section: "lifestyle",
    byline: ["Staff"], corrections: [{ date: "2025-08-04", text: "An earlier version misspelled the café's name." }],
    refs: ["TT-00001", "toktok.app/@kaylacooks"], related: ["TT-00002"], sponsored: { by: "brightline" }, covers: ["mara"], pool: "news-dailyrecord",
    versions: [{ id: "v1", title: "The lemon trick everyone is talking about", body: "A clip from a Port Calder kitchen went viral this week." }] }],
};
/** Real content + the pool + extra virtual files (e.g. a mystery pack listed in `mysteries`). */
const withPool = (extra = {}, mysteries = []) => loadContent(async p => {
  if (p in extra) return structuredClone(extra[p]);
  if (p in POOL) return structuredClone(POOL[p]);
  const data = JSON.parse(await readFile(join(CONTENT_DIR, p), "utf8"));
  if (p !== "manifest.json") return data;
  const f = data.files, more = (k, ...xs) => { f[k] = [...[].concat(f[k] || []), ...xs]; };
  more("platforms", "pools/toktok/platforms.json"); more("sites", "pools/toktok/sites.json"); more("accounts", "pools/toktok/creators.json");
  more("images", "pools/toktok/images.json"); more("scripts", "pools/toktok/scripts.json"); more("videos", "pools/toktok/videos.json");
  more("artifacts", "pools/toktok/clips.json", "pools/dailyrecord/articles.json");
  data.mysteries.push(...mysteries);
  return data;
});
const world = buildWorld(await withPool());
const started = (w = world, seed = 1) => { const g = new Game(w, { seed }); g.start(); return g; };

test("articles and clips show their media fields, never the hidden ones", () => {
  const g = started();
  const art = g.open("DR-2025-0141").view;
  assert.equal(art.section, "lifestyle");
  assert.deepEqual(art.byline, ["Staff"]);
  assert.equal(art.corrections[0].date, "2025-08-04");
  assert.deepEqual(art.refs, ["TT-00001", "toktok.app/@kaylacooks"]);
  assert.deepEqual(art.sponsored, { by: "brightline" });
  assert.equal("covers" in art, false, "covers is authoring data");
  assert.equal("pool" in art, false);

  const clip = g.open("TT-00001").view;
  assert.equal(clip.video.id, "VID0001");
  assert.equal(clip.video.duration, 14);
  assert.deepEqual(clip.video.frames, [{ t: 3, image: "VID0001F1" }]);
  for (const k of ["scenes", "source", "script", "derivedFrom"]) assert.equal(k in clip.video, false, `${k} is hidden`);
  assert.match(clip.transcript, /today years old/);
  assert.deepEqual(clip.comments.map(c => c.id), ["c1"], "c2 was deleted in v2, the live version");
  assert.equal("deletedIn" in clip.comments[0], false);
  const old = g.view("TT-00001", "v1");
  assert.ok(old.cached && old.comments.some(c => c.id === "c2"), "the cached older version still has the comment");
});

test("search: platform filter, transcript phrases, light accounts as authors", () => {
  const g = started();
  const all = g.search("today years old").results.map(r => r.artifact);
  assert.ok(all.includes("TT-00001") && all.includes("TT-00005"), "both clips with the same script");
  const phrase = g.search('"i was today years old"', { platform: "toktok" }).results;
  assert.deepEqual([...new Set(phrase.map(r => r.artifact))].sort(), ["TT-00001", "TT-00005"]);
  assert.ok(phrase.every(r => r.platform === "toktok"));
  assert.deepEqual(g.search("lemon", { platform: "dailyrecord" }).results.map(r => r.artifact), ["DR-2025-0141"]);
  assert.ok(!g.search("lemon", { platform: "dailyrecord" }).results.some(r => r.platform === "toktok"));
  assert.equal(g.search("lemon", { platform: "nope" }).error, "unknown_platform");
  assert.ok(g.search("kaylacooks").results.some(r => r.artifact === "TT-00001"), "a light account is an author like any other");
});

test("a clip can be found by searching one of its frames", () => {
  const g = started();
  assert.equal(g.searchImage("VID0001F1").error, "not_seen", "frames of unseen clips are not searchable");
  g.watch("TT-00001");
  const r = g.searchImage("VID0001F1");
  assert.ok(r.ok);
  assert.ok(r.results.some(x => x.artifact === "TT-00005"), "the other clip from the same kitchen set");
});

test("the feed is deterministic and blind to evidence", async () => {
  const a = started(world, 7), b = started(world, 7);
  const fa = a.feed("toktok", "forYou", 0, 20), fb = b.feed("toktok", "forYou", 0, 20);
  assert.deepEqual(fa, fb);
  assert.equal(fa.total, 20);
  // Make some clips evidence: the feed must not change.
  const raw = await withPool();
  for (const c of raw.artifacts.filter(x => x.platform === "toktok").slice(0, 5)) { c.supports = ["S1"]; c.mentions = ["mara"]; }
  const marked = started(buildWorld(raw), 7);
  assert.deepEqual(marked.feed("toktok", "forYou", 0, 20), fa, "supports and mentions do not move anything");
  // Seeker history does not change it either.
  a.search("kaylacooks"); a.search("plantmom lemons");
  assert.deepEqual(a.feed("toktok", "forYou", 0, 20), fb);
  // A new day reshuffles.
  a.sleep(); b.sleep();
  assert.deepEqual(a.feed("toktok", "forYou", 0, 20), b.feed("toktok", "forYou", 0, 20));
  assert.ok(a.feed("toktok").items.every(id => world.artifacts.get(id).platform === "toktok"));
});

test("follow, like and not interested shape the feed and nothing else", () => {
  const g = started();
  const before = { known: { ...g.s.known }, enc: { ...g.s.encountered } };
  assert.equal(g.follow("acc_tt_plantmom").error, "not_encountered", "only accounts the player has met");
  assert.equal(g.like("TT-00003").error, "not_seen");
  const r = g.scrollFeed("toktok");
  assert.ok(r.ok && r.items.length === 10);
  g.watch("TT-00001");                                   // by kaylacooks, food
  assert.ok(g.s.seen["TT-00001"] != null);
  assert.ok(g.s.encountered.acc_tt_kaylacooks != null, "watching encounters the creator");
  assert.equal(g.discovery("acc_tt_kaylacooks"), "encountered", "but does not investigate");
  const enc = { ...g.s.encountered }, known = { ...g.s.known };
  assert.ok(g.follow("acc_tt_kaylacooks").ok);
  assert.ok(g.like("TT-00001").ok);
  assert.deepEqual(g.s.encountered, enc, "follow and like give no knowledge");
  assert.deepEqual(g.s.known, known);
  assert.ok(Object.keys(before.known).every(k => g.s.known[k]));
  const following = g.feed("toktok", "following", 0, 20);
  assert.ok(following.items.length && following.items.every(id => world.artifacts.get(id).author === "acc_tt_kaylacooks"));
  const dates = following.items.map(id => world.artifacts.get(id).date);
  assert.deepEqual(dates, [...dates].sort().reverse(), "following is newest first");
  // A followed and liked creator rises past clips nobody interacted with
  const neutral = id => { const a = world.artifacts.get(id); return a.author !== "acc_tt_kaylacooks" && a.category !== "food"; };
  const above = (game, id) => { const l = game.feed("toktok", "forYou", 0, 20).items; return l.slice(0, l.indexOf(id)).filter(neutral).length; };
  const plain = started();
  const pick = ["TT-00006", "TT-00011", "TT-00016"].sort((x, y) => above(plain, y) - above(plain, x))[0];
  assert.ok(above(plain, pick) > 0, "the test needs something to overtake");
  assert.ok(above(g, pick) < above(plain, pick));
  // Not interested
  const top = g.feed("toktok").items[0];
  assert.ok(g.notInterested(top).ok);
  assert.ok(!g.feed("toktok", "forYou", 0, 20).items.includes(top));
  assert.deepEqual(g.media(), { follows: ["acc_tt_kaylacooks"], likes: ["TT-00001"], notInterested: [top] });
  assert.ok(g.like("TT-00001", false).ok);
  assert.deepEqual(g.media().likes, []);
  // Replays exactly
  const again = replay(world, { seed: 1 }, g.s.log);
  assert.deepEqual(again.s.media, g.s.media);
  assert.deepEqual(again.feed("toktok", "forYou", 0, 20), g.feed("toktok", "forYou", 0, 20));
});

test("feed events reach rules, for mood only", async () => {
  const rules = [{ id: "doom", when: { event: "feed.scroll", match: { platform: "toktok" } }, once: true,
    do: [{ notify: { text: "stop doomscrolling", from: "connect" } }] }];
  const raw = await withPool({ "pools/rules.json": rules });
  raw.rules.push(...rules);
  const g = started(buildWorld(raw));
  g.scrollFeed("toktok");
  assert.ok(g.s.notifications.some(n => n.text === "stop doomscrolling"));
});

test("the validator checks media and keeps evidence out of feed-only reach", async () => {
  const errors = raw => validateWorld(raw, { reachability: false }).issues.filter(i => i.level === "ERROR");
  let raw = await withPool();
  assert.deepEqual(errors(raw), [], "the pool is valid: light accounts need no operator");

  // Broken media references
  raw.videos[0].frames.push({ t: 99, image: "NOPE" });
  raw.artifacts.find(a => a.id === "DR-2025-0141").related = ["TT-99999"];
  raw.artifacts.find(a => a.id === "TT-00001").comments[0].replyTo = "c9";
  let e = errors(raw);
  assert.ok(e.some(i => i.where === "video VID0001" && /unknown image NOPE/.test(i.msg)));
  assert.ok(e.some(i => /outside the clip/.test(i.msg)));
  assert.ok(e.some(i => /related: unknown artifact TT-99999/.test(i.msg)));
  assert.ok(e.some(i => /reply to unknown comment c9/.test(i.msg)));

  // A mystery clip that supports a claim but is only in the feed
  const ECHO = { id: "echo_test", title: "Echo", status: "playable", start: { discover: { flag: "x" } }, layers: { reveal: [1], hint: [], background: [] },
    claims: ["E1"], evidence: [], files: { canon: "canon.json", artifacts: ["artifacts.json"] }, endings: [] };
  const clip = { id: "TT-90001", type: "video", platform: "toktok", author: "acc_tt_gymrat", date: "2025-08-03", source: "tt-gym", index: "none",
    supports: ["E1"], versions: [{ id: "v1", title: "leg day", body: "" }] };
  const files = { "mysteries/echo/mystery.json": ECHO, "mysteries/echo/artifacts.json": [clip],
    "mysteries/echo/canon.json": { claims: [{ id: "E1", label: "Echo", truth: "true", match: [{ subject: "brightline", predicate: "operates", object: "acc_maraquinn" }] }] } };
  const withEcho = () => withPool(files, ["mysteries/echo/mystery.json"]);
  raw = await withEcho();
  e = errors(raw);
  assert.ok(e.some(i => i.where === "artifact TT-90001" && /only be found in a feed/.test(i.msg)));
  raw.artifacts.find(a => a.id === "TT-90001").index = "weak";
  assert.ok(!errors(raw).some(i => i.where === "artifact TT-90001"), "searchable: fine");

  // Searchable is not findable: an evidence clip found only by search needs a lead in other content
  const warns = r => validateWorld(r, { reachability: false }).issues.filter(i => i.level === "WARN");
  raw = await withEcho();
  raw.accounts.push({ id: "acc_tt_nobody", platform: "toktok", handle: "@nobody_xq", displayName: "nobody", pool: "toktok" });
  Object.assign(raw.artifacts.find(a => a.id === "TT-90001"), { index: "weak", author: "acc_tt_nobody", video: "VID0002" });
  assert.ok(warns(raw).some(i => i.where === "artifact TT-90001" && /nothing else in the content leads to it/.test(i.msg)));
  raw.artifacts.find(a => a.id === "DR-2025-0141").versions[0].body += " Watch @nobody_xq for more.";
  assert.ok(!warns(raw).some(i => i.where === "artifact TT-90001"), "a handle written in an article is a lead");

  // Unresolved canon: a claim may not depend on who runs a light account
  raw = await withEcho();
  raw.artifacts.find(a => a.id === "TT-90001").index = "weak";
  raw.canon.claims.find(c => c.id === "E1").match = [{ subject: "brightline", predicate: "operates", object: "acc_tt_gymrat" }];
  assert.ok(errors(raw).some(i => i.where === "claim E1" && /unresolved canon/.test(i.msg)));

  // Rules on feed events may not have consequences
  raw = await withPool();
  raw.rules.push({ id: "bad_like", when: { event: "video.like" }, do: [{ credibility: 5 }, { trust: { id: "dana", delta: 1 } }] });
  raw.rules.push({ id: "ok_scroll", when: { event: "feed.scroll" }, do: [{ later: { days: 1, do: [{ notify: { text: "hi", from: "connect" } }] } }] });
  // ...nor single out a clip, a creator or the player's progress
  raw.rules.push({ id: "hint_view", when: { event: "video.view", match: { artifact: "TT-00001" } }, do: [{ notify: { text: "hmm", from: "connect" } }] });
  raw.rules.push({ id: "hint_seen", when: { event: "feed.scroll" }, if: { all: [{ seen: "A02" }] }, do: [{ notify: { text: "hmm", from: "connect" } }] });
  raw.rules.push({ id: "ok_platform", when: { event: "video.view", match: { platform: "toktok" } }, if: { flag: "x" }, do: [{ notify: { text: "lol", from: "connect" } }] });
  e = errors(raw);
  assert.ok(e.some(i => i.where === "rule hint_view" && /may only match on platform, tab, not artifact/.test(i.msg)));
  assert.ok(e.some(i => i.where === "rule hint_seen" && /what the player has found \(seen\)/.test(i.msg)));
  assert.ok(!e.some(i => i.where === "rule ok_platform"));
  assert.ok(e.some(i => i.where === "rule bad_like" && /credibility, trust/.test(i.msg)));
  assert.ok(!e.some(i => i.where === "rule ok_scroll"));
});

test("version 5 saves migrate to an empty media state", () => {
  const g = started();
  g.watch("TT-00001");
  const old = structuredClone(g.s);
  old.saveVersion = 5; delete old.media;
  const { state } = deserialize(world, serialize(old));
  assert.equal(state.saveVersion, SAVE_VERSION);
  assert.deepEqual(state.media, { follows: {}, likes: {}, notInterested: {} });
  // Follows and likes of content that no longer exists are dropped
  g.like("TT-00001"); g.s.media.likes["TT-gone"] = 1;
  const { state: s2, warnings } = deserialize(world, serialize(g.s));
  assert.deepEqual(Object.keys(s2.media.likes), ["TT-00001"]);
  assert.ok(warnings.some(w => /likes TT-gone/.test(w)));
});

test("the media report counts per platform and flags evidence that stands out", async () => {
  const raw = await withPool();
  let r = mediaReport(buildWorld(raw));
  const tt = r.platforms.find(p => p.id === "toktok");
  assert.equal(tt.artifacts, 20);
  assert.equal(tt.clips, 2);
  assert.equal(tt.comments, 2);
  assert.deepEqual(r.outliers, []);
  // A clip with far fewer views than its category would be a visible hint
  const c = raw.artifacts.find(a => a.id === "TT-00002");
  Object.assign(c, { supports: ["S1"], stats: { views: 10 } });
  r = mediaReport(buildWorld(raw));
  assert.deepEqual(r.outliers.map(o => o.artifact), ["TT-00002"]);
  assert.equal(r.platforms.find(p => p.id === "toktok").evidence, 1);
  c.outlier = true;
  assert.deepEqual(mediaReport(buildWorld(raw)).outliers, [], "unless it is deliberate");
});
