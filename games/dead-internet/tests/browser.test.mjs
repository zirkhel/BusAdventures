// Browser address resolution, bookmarks, text size, forward stack and save migration (W3).
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../tools/lib/node-world.mjs";
import { Game } from "../core/game.js";
import { serialize, deserialize } from "../core/save.js";
import { SAVE_VERSION } from "../core/state.js";
import {
  resolveBrowse, toggleBookmark, isBookmarked, stepTextSize, textScale, TEXT_SIZES,
  emptyBrowserState, migrateBrowser, newBrowseSession, sessionPush, sessionBack, sessionForward,
} from "../core/browser.js";
import { siteStatus } from "../core/sites.js";

const world = await loadWorld();

function fakeWorld() {
  const artifacts = new Map([
    ["HOME", { id: "HOME", url: "live.example", page: "home", title: "Live Home" }],
    ["SUB", { id: "SUB", url: "live.example/about", page: "about", title: "About" }],
    ["GONEP", { id: "GONEP", url: "gone.example/old", page: "page", title: "Old" }],
  ]);
  const sites = new Map([
    ["live", { id: "live", domain: "live.example", designs: [], status: [], notFound: { title: "Missing", text: "No." } }],
    ["gone", { id: "gone", domain: "gone.example", designs: [], status: [{ from: "2020-01-01", state: "gone" }] }],
    ["parked", { id: "parked", domain: "parked.example", designs: [], status: [{ from: "2021-01-01", state: "parked" }] }],
    ["maint", { id: "maint", domain: "maint.example", designs: [], status: [{ from: "2026-01-01", state: "maintenance" }] }],
    ["empty", { id: "empty", domain: "empty.example", designs: [], status: [] }],
  ]);
  const siteByDomain = new Map([...sites.values()].map(s => [s.domain, s.id]));
  const artifactByUrl = new Map();
  for (const a of artifacts.values()) artifactByUrl.set(a.url, a.id);
  return { artifacts, sites, siteByDomain, artifactByUrl };
}

const fw = fakeWorld();
const DAY = "2026-03-09";

test("resolveBrowse: exact page, bare domain home, unknown path is a site 404", () => {
  assert.equal(resolveBrowse(fw, "live.example/about", DAY).kind, "page");
  assert.equal(resolveBrowse(fw, "https://live.example/about", DAY).artifact, "SUB");
  const home = resolveBrowse(fw, "live.example", DAY);
  assert.equal(home.kind, "page");
  assert.equal(home.artifact, "HOME");
  const nf = resolveBrowse(fw, "live.example/no-such-page", DAY);
  assert.equal(nf.kind, "notfound");
  assert.equal(nf.site, "live");
  assert.equal(nf.url, "live.example/no-such-page");
});

test("resolveBrowse: a domain with no homepage opens a site home, not a search", () => {
  const r = resolveBrowse(fw, "empty.example", DAY);
  assert.equal(r.kind, "sitehome");
  assert.equal(r.site, "empty");
});

test("resolveBrowse: gone, parked and maintenance take precedence over a matching URL", () => {
  assert.equal(resolveBrowse(fw, "gone.example/old", DAY).kind, "gone");
  assert.equal(resolveBrowse(fw, "parked.example", DAY).kind, "parked");
  assert.equal(resolveBrowse(fw, "maint.example/any", DAY).kind, "maintenance");
  // Before the maintenance window the same host would be a 404 (no pages).
  assert.equal(resolveBrowse(fw, "maint.example/any", "2025-12-01").kind, "notfound");
});

test("resolveBrowse: unknown host is a Seeker search, as before", () => {
  const r = resolveBrowse(fw, "totally-unknown.example/path", DAY);
  assert.equal(r.kind, "search");
  assert.equal(r.q, "totally-unknown.example/path");
  const words = resolveBrowse(fw, "eastfield waterfront", DAY);
  assert.equal(words.kind, "search");
});

test("the live world: Neighbors is gone, jazz is parked, a Northgate typo is a 404", () => {
  assert.equal(siteStatus(world.sites.get("eastfield_neighbors"), DAY).state, "gone");
  assert.equal(resolveBrowse(world, "eastfieldneighbors.net", DAY).kind, "gone");
  assert.equal(siteStatus(world.sites.get("portcalderjazz"), DAY).state, "parked");
  assert.equal(resolveBrowse(world, "portcalderjazz.com", DAY).kind, "parked");
  const nf = resolveBrowse(world, "northgatedev.com/no-such-page", DAY);
  assert.equal(nf.kind, "notfound");
  assert.equal(nf.site, "northgate");
  const waterfront = resolveBrowse(world, "northgatedev.com/waterfront", DAY);
  assert.equal(waterfront.kind, "page");
  assert.equal(waterfront.artifact, "A40");
});

test("bookmarks toggle by URL and survive serialize/deserialize", () => {
  const g = new Game(world, { seed: 1 });
  g.start();
  assert.deepEqual(g.s.browser, emptyBrowserState());
  const on = toggleBookmark(g.s, { url: "northgatedev.com/waterfront", title: "Eastfield Waterfront", artifact: "A40", day: 1 });
  assert.equal(on, true);
  assert.equal(isBookmarked(g.s, "https://northgatedev.com/waterfront"), true);
  const { state } = deserialize(world, serialize(g.s));
  assert.equal(state.saveVersion, SAVE_VERSION);
  assert.equal(isBookmarked(state, "northgatedev.com/waterfront"), true);
  assert.equal(state.browser.bookmarks[0].title, "Eastfield Waterfront");
  assert.equal(toggleBookmark(state, { url: "northgatedev.com/waterfront" }), false);
  assert.equal(isBookmarked(state, "northgatedev.com/waterfront"), false);
});

test("a version-7 save migrates to an empty browser field", () => {
  const g = new Game(world, { seed: 1 });
  g.start();
  const old = JSON.parse(serialize(g.s));
  old.saveVersion = old.state.saveVersion = 7;
  delete old.state.browser;
  const { state } = deserialize(world, old);
  assert.equal(state.saveVersion, SAVE_VERSION);
  assert.deepEqual(state.browser, emptyBrowserState());
  // migrateBrowser also fills a missing field on a current-looking object
  const bare = { flags: {} };
  migrateBrowser(bare);
  assert.equal(bare.browser.textSize, 1);
  assert.deepEqual(bare.browser.bookmarks, []);
});

test("text size steps stay inside the scale table", () => {
  const s = { browser: emptyBrowserState() };
  assert.equal(textScale(s), 1);
  stepTextSize(s, 1);
  assert.equal(s.browser.textSize, 2);
  stepTextSize(s, 1);
  stepTextSize(s, 1);
  assert.equal(s.browser.textSize, TEXT_SIZES.length - 1);
  stepTextSize(s, 1);
  assert.equal(s.browser.textSize, TEXT_SIZES.length - 1);
  stepTextSize(s, -1);
  assert.ok(s.browser.textSize < TEXT_SIZES.length - 1);
});

test("forward stack: back, forward, and a new navigation clears forward", () => {
  const sess = newBrowseSession();
  sessionPush(sess, { kind: "page", url: "a" });
  sessionPush(sess, { kind: "page", url: "b" });
  assert.equal(sess.stack.at(-1).url, "b");
  assert.equal(sessionBack(sess), true);
  assert.equal(sess.stack.at(-1).url, "a");
  assert.equal(sess.forward.at(-1).url, "b");
  assert.equal(sessionForward(sess), true);
  assert.equal(sess.stack.at(-1).url, "b");
  assert.equal(sess.forward.length, 0);
  sessionBack(sess);
  sessionPush(sess, { kind: "page", url: "c" });
  assert.equal(sess.forward.length, 0);
  assert.equal(sess.stack.at(-1).url, "c");
  assert.equal(sessionBack(sess), true);
  assert.equal(sessionForward(sess), true);
  // cannot go forward past the end, or back from the home root alone
  const root = newBrowseSession();
  assert.equal(sessionBack(root), false);
  assert.equal(sessionForward(root), false);
});

import { search } from "../core/search.js";
import { officialSitesForQuery } from "../core/sites.js";

function first(g, q, opts) {
  return search(g, q, opts)[0];
}

test("Seeker puts the official site first for a brand, name or domain", () => {
  const g = new Game(world, { seed: 1 });
  g.start();
  const cases = [
    ["kestrel", "kestrel-logistics.com", "kestrel"],
    ["Kestrel Logistics", "kestrel-logistics.com", "kestrel"],
    ["kestrel-logistics.com", "kestrel-logistics.com", "kestrel"],
    ["northgate", "northgatedev.com", "northgate"],
    ["NGD", "northgatedev.com", "northgate"],
    ["brightline", "brightlinemedia.co", "brightline"],
    ["port calder", "portcalder.gov", "city"],
    ["eastfield notes", "eastfieldnotes.blog", "eastfieldnotes"],
  ];
  for (const [q, url, site] of cases) {
    const r = first(g, q);
    assert.ok(r, q);
    assert.equal(r.official, true, q);
    assert.equal(r.site, site, q);
    assert.equal(r.url === url || r.url.startsWith(url), true, `${q} → ${r.url}`);
    const rest = search(g, q);
    const newsOrSocial = rest.findIndex(x => ["dailyrecord", "unfiltered", "connect", "threadline"].includes(x.platform));
    if (newsOrSocial >= 0) assert.equal(newsOrSocial > 0, true, `${q}: official before news/social`);
  }
  assert.equal(first(g, "eastfield notes").artifact, "A14");
});

test("gone and parked official sites still appear first, and behave by status", () => {
  const g = new Game(world, { seed: 1 });
  g.start();
  const gone = first(g, "eastfield neighbors");
  assert.equal(gone.official, true);
  assert.equal(gone.kind, "gone");
  assert.equal(gone.url, "eastfieldneighbors.net");
  assert.equal(gone.artifact, null);
  assert.equal(resolveBrowse(world, gone.url, "2026-03-09").kind, "gone");
  const parked = first(g, "portcalderjazz");
  assert.equal(parked.official, true);
  assert.equal(parked.kind, "parked");
  assert.equal(parked.url, "portcalderjazz.com");
  assert.equal(resolveBrowse(world, parked.url, "2026-03-09").kind, "parked");
});

test("official ranking does not run inside an app search, and does not reveal hidden pages", () => {
  const g = new Game(world, { seed: 1 });
  g.start();
  const paper = search(g, "kestrel", { platform: "dailyrecord" });
  assert.ok(paper.length);
  assert.equal(paper[0].official, undefined);
  assert.equal(paper[0].platform, "dailyrecord");
  const ng = search(g, "northgate");
  assert.equal(ng.some(r => r.artifact === "A41"), false);
});

test("a generic or mixed query is not treated as a site name", () => {
  const g = new Game(world, { seed: 1 });
  g.start();
  assert.deepEqual(officialSitesForQuery(world, "eastfield"), []);
  assert.deepEqual(officialSitesForQuery(world, "calder"), []);
  assert.deepEqual(officialSitesForQuery(world, "logistics"), []);
  assert.deepEqual(officialSitesForQuery(world, "kestrel warehouse"), []);
  assert.equal(first(g, "kestrel warehouse").official, undefined);
  assert.equal(first(g, "kestrel warehouse").artifact, "DR-2026-0031");
});

test("searching a parked domain does not investigate other names", () => {
  const g = new Game(world, { seed: 1 });
  g.start();
  const known = { ...g.s.known };
  const encountered = { ...g.s.encountered };
  g.search("portcalderjazz");
  assert.deepEqual(g.s.known, known);
  assert.deepEqual(g.s.encountered, encountered);
});
