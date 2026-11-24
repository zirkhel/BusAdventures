// The Daily Record and Unfiltered (M2): news lists, the papers' content, daily stories.
//   node --test games/dead-internet/tests/*.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../tools/lib/node-world.mjs";
import { Game } from "../core/game.js";
import { mediaReport } from "../tools/lib/media.mjs";

const world = await loadWorld();
const started = () => { const g = new Game(world, { seed: 1 }); g.start(); return g; };
const articles = pf => [...world.artifacts.values()].filter(a => a.platform === pf && a.type === "article");

test("both papers are apps made from platform data", () => {
  for (const id of ["dailyrecord", "unfiltered"]) {
    const pf = world.platforms.get(id);
    assert.equal(pf.app?.template, "news", `${id} is a news app`);
    assert.ok(pf.app.sections.length >= 6);
    for (const a of articles(id)) if (a.section) assert.ok(pf.app.sections.includes(a.section), `${a.id}: section ${a.section}`);
  }
});

test("a paper's list is newest first, never ranked, and never shows tomorrow's paper", () => {
  const g = started();
  const { items, total } = g.news("dailyrecord", { limit: 500 });
  assert.equal(items.length, total);
  const dates = items.map(id => g.view(id).date ?? world.artifacts.get(id).date);
  assert.deepEqual(dates, [...dates].sort().reverse(), "newest first");
  assert.ok(dates.every(d => d.slice(0, 10) <= g.date), "nothing dated after today");
  assert.ok(!items.includes("DR-2026-0090"), "Tuesday's water main is not news on Monday");
  assert.ok(!items.includes("A46"), "the archive page is not a story");
  assert.ok(!items.includes("DR-2025-0418"), "a deleted story is gone from the paper");
  // Sections and authors
  const ob = g.news("dailyrecord", { section: "obituaries", limit: 50 }).items;
  assert.ok(ob.includes("A11") && ob.every(id => g.view(id).section === "obituaries"));
  const dana = g.news("dailyrecord", { author: "acc_danareyes", limit: 50 }).items;
  assert.ok(["A11", "A12", "B22"].every(id => dana.includes(id)), "Dana's page lists her stories");
});

test("new stories appear on their day, breaking ones with a notification", () => {
  const g = started();
  g.sleep();                                                       // day 2
  assert.ok(g.news("dailyrecord", { limit: 5 }).items.includes("DR-2026-0090"));
  assert.ok(g.news("unfiltered", { limit: 5 }).items.includes("UF-2026-0091"));
  assert.ok(g.s.notifications.some(n => n.ref?.artifact === "DR-2026-0090" && /Breaking/.test(n.text)));
  const v = g.view("DR-2026-0090");
  assert.ok(v.breaking && v.comments.length);
  for (let i = 0; i < 6; i++) g.sleep();                           // day 8
  for (const id of ["DR-2026-0093", "UF-2026-0094", "DR-2026-0095", "UF-2026-0099", "DR-2026-0097", "DR-2026-0098", "DR-2026-0099", "DR-2026-0708"])
    assert.ok(g.news(world.artifacts.get(id).platform, { limit: 200 }).items.includes(id), `${id} is out by day 8`);
});

test("Daily Record content: corrections, changes, removals, sponsors, obituaries, comments", () => {
  const dr = articles("dailyrecord");
  assert.ok(dr.length >= 45, `${dr.length} articles`);
  const count = f => dr.filter(f).length;
  assert.ok(count(a => a.corrections?.length) >= 6, "corrections");
  assert.ok(count(a => a.versions.length > 1 && a.live !== null && !/removed/.test(a.versions.at(-1).body)) >= 4, "changed stories");
  assert.ok(count(a => a.live === null || /has been removed/.test(a.versions.at(-1).body ?? "")) >= 3, "removed stories");
  assert.ok(dr.some(a => a.live === null && !a.versions.some(v => /removed/.test(v.body ?? ""))), "one is removed without a word");
  assert.ok(count(a => a.sponsored) >= 5, "sponsored");
  assert.ok(count(a => a.section === "obituaries") >= 6, "obituaries");
  assert.ok(count(a => a.comments?.length) >= 12, "comment sections");
  const writers = new Set(dr.flatMap(a => a.byline || []).filter(b => world.accounts.has(b)));
  assert.ok(writers.size >= 8, `${writers.size} writers with pages`);
});

test("Unfiltered content: writers, leaks with documents, and five events both papers cover", () => {
  const uf = articles("unfiltered");
  assert.ok(uf.length >= 25 && uf.length <= 35, `${uf.length} articles`);
  const writers = new Set(uf.flatMap(a => a.byline || []).filter(b => world.accounts.has(b)));
  assert.equal(writers.size, 4);
  const leaks = uf.filter(a => a.section === "leaks");
  assert.ok(leaks.length >= 4 && leaks.every(a => (a.refs || []).some(r => world.artifacts.get(r)?.platform === "docshare")), "every leak has its document");
  const covered = pf => new Set(articles(pf).flatMap(a => a.covers || []));
  const both = [...covered("dailyrecord")].filter(e => covered("unfiltered").has(e));
  assert.ok(both.length >= 5, `${both.length} events covered by both`);
  // Two pictures both papers use, one of them cropped
  const pics = pf => new Set(articles(pf).flatMap(a => a.images || []));
  const shared = [...pics("unfiltered")].filter(i => pics("dailyrecord").has(i) || pics("dailyrecord").has(world.images.get(i)?.derivedFrom));
  assert.ok(shared.length >= 2);
  assert.ok(shared.some(i => world.images.get(i).derivedFrom), "one is a crop of the other paper's photo");
});

test("the cropped festival photo leads back to the Daily Record's original", () => {
  const g = started();
  g.open("UF-2025-0052");
  const r = g.searchImage("NIMG0002");
  assert.ok(r.ok && r.results.some(x => x.artifact === "DR-2025-0322"));
});

test("articles render their extras: byline accounts, corrections, related, comments", () => {
  const g = started();
  const v = g.open("DR-2026-0058").view;
  assert.equal(v.section, "breaking");
  assert.deepEqual(v.byline, ["acc_dr_jsoto"]);
  assert.match(v.corrections[0].text, /14,000/);
  assert.deepEqual(v.related, ["DR-2026-0060"]);
  assert.ok(v.comments.some(c => c.replyTo));
  const old = g.view("DR-2026-0058", "v1");
  assert.ok(old.cached && /40,000/.test(old.body), "the first version is in the cache");
  // Reading a byline only encounters the writer; it does not investigate them
  assert.equal(g.discovery("acc_dr_jsoto"), "encountered", "a byline is met by reading, not investigated");
});

test("the media report shows both papers, with no quota", () => {
  const r = mediaReport(world);
  const dr = r.platforms.find(p => p.id === "dailyrecord"), uf = r.platforms.find(p => p.id === "unfiltered");
  assert.ok(dr.artifacts >= 45 && uf.artifacts >= 25);
  assert.ok(dr.comments >= 85 && uf.comments >= 20, `${dr.comments} / ${uf.comments} comments`);
  assert.deepEqual(r.outliers, []);
});
