// Site model and public-view tests.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { publicView, isHiddenViewKey, PUBLIC_VIEW_KEYS } from "../core/site-view.js";

const dir = dirname(fileURLToPath(import.meta.url));

test("publicView keeps display fields and drops hidden canon", () => {
  const v = publicView({
    id: "A40", type: "page", platform: "northgate_site", url: "northgatedev.com/waterfront",
    title: "Eastfield Waterfront", body: "1,200 new homes.", date: "2026-02-01",
    images: ["IMG12"], versionId: "v1", cached: true, author: null,
    supports: ["S3"], mentions: ["northgate"], source: "northgate",
    filler: true, hidden: true, covers: ["x"], pool: "news", keywords: ["secret"],
  });
  assert.equal(v.id, "A40");
  assert.equal(v.title, "Eastfield Waterfront");
  assert.equal(v.body, "1,200 new homes.");
  assert.equal(v.url, "northgatedev.com/waterfront");
  assert.equal(v.versionId, "v1");
  assert.equal(v.cached, true);
  assert.deepEqual(v.images, ["IMG12"]);
  for (const k of ["supports", "mentions", "source", "filler", "hidden", "covers", "pool", "keywords"]) {
    assert.equal(k in v, false, k);
  }
});

test("publicView drops unknown keys and never invents fields", () => {
  const v = publicView({ id: "X", inventedCanon: "nope", truth: "true" });
  assert.deepEqual(Object.keys(v), ["id"]);
});

test("hidden key list covers the WEBSITES.md §6.5 names", () => {
  for (const k of ["supports", "mentions", "source", "filler", "hidden", "covers", "pool"]) {
    assert.equal(isHiddenViewKey(k), true, k);
  }
  assert.ok(PUBLIC_VIEW_KEYS.includes("title"));
  assert.ok(PUBLIC_VIEW_KEYS.includes("blocks"));
  assert.ok(PUBLIC_VIEW_KEYS.includes("body"));
  assert.ok(PUBLIC_VIEW_KEYS.includes("url"));
  assert.ok(PUBLIC_VIEW_KEYS.includes("versionId"));
  assert.ok(PUBLIC_VIEW_KEYS.includes("cached"));
});

test("renderers and future site templates import publicView", () => {
  const render = readFileSync(join(dir, "../app/render.js"), "utf8");
  assert.match(render, /import \{ publicView \} from "\.\.\/core\/site-view\.js"/);
  assert.match(render, /v = publicView\(v\)/);
});

import { loadRaw, loadWorld } from "../tools/lib/node-world.mjs";
import { validateWorld } from "../tools/lib/validate-world.mjs";
import { Game } from "../core/game.js";
import { designFor, siteStatus, siteIdOf, listedPages, hostOf, EMAIL_ONLY_DOMAINS } from "../core/sites.js";

const world = await loadWorld();

test("the Dead Internet world loads every site and passes the site validator", async () => {
  const raw = await loadRaw();
  assert.ok((raw.sites || []).length >= 25, "site configs are loaded");
  const { issues } = validateWorld(raw, { reachability: false, knockout: false });
  const bad = issues.filter(i => i.level === "ERROR" && (String(i.where).startsWith("site") || i.where === "site-ref"));
  assert.deepEqual(bad.map(i => `${i.where}: ${i.msg}`), []);
});

test("every URL artifact resolves to a registered site", () => {
  const missing = [];
  for (const a of world.artifacts.values()) {
    if (!a.url) continue;
    const host = hostOf(a.url);
    if (!host || EMAIL_ONLY_DOMAINS.has(host)) continue;
    if (!siteIdOf(world, a)) missing.push(`${a.id} ${a.url}`);
  }
  assert.deepEqual(missing, []);
});

test("Eastfield Neighbors is gone; Harbor Dental and transit are live", () => {
  const gone = world.sites.get("eastfield_neighbors");
  assert.equal(siteStatus(gone, "2026-03-09").state, "gone");
  assert.equal(siteStatus(gone, "2022-01-01").state, "live");
  assert.equal(siteStatus(world.sites.get("harbordental"), "2026-03-09").state, "live");
  assert.equal(siteStatus(world.sites.get("caldertransit"), "2026-03-09").state, "live");
});

test("dated designs: Eastfield Notes switches theme on 2025-10-22", () => {
  const site = world.sites.get("eastfieldnotes");
  assert.equal(designFor(site, { date: "2025-06-20", cached: true }).id, "d2012");
  assert.equal(designFor(site, { date: "2025-10-22" }, "2026-03-09").id, "d2025");
  assert.equal(designFor(site, { date: "2025-05-14" }, "2026-03-09").id, "d2025");
});

test("listedPages hides A41 until it is shown, and keeps A15 off the live blog", () => {
  const g = new Game(world, { seed: 1 });
  g.start();
  const news = listedPages(g, "northgate", { page: "article" });
  assert.equal(news.some(a => a.id === "A41"), false);
  const posts = listedPages(g, "eastfieldnotes", { page: "post" });
  assert.equal(posts.some(a => a.id === "A15"), false, "Save the Mill is not live");
  assert.ok(posts.some(a => a.id === "A33"));
});

test("existing Quiet Account page wording is unchanged", () => {
  const body = id => world.artifacts.get(id).versions.find(v => v.id === "v1").body;
  assert.match(body("A40"), /1,200 new homes/);
  assert.match(body("A53"), /Ana Ruiz represents Eastfield/);
  assert.match(body("A14"), /a librarian's notes on the old girl/);
});
