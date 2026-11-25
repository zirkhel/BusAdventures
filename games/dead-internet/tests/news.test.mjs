// The Daily Record and Unfiltered (M2): news lists, the papers' content, daily stories.
//   node --test games/dead-internet/tests/*.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { loadWorld, loadRaw } from "../tools/lib/node-world.mjs";
import { validateWorld } from "../tools/lib/validate-world.mjs";
import { Game } from "../core/game.js";
import { mediaReport } from "../tools/lib/media.mjs";
import { fire } from "../core/rules.js";

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
  const dates = items.map(id => g.view(id).publishedDate);
  assert.deepEqual(dates, [...dates].sort().reverse(), "newest first, by first publication");
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

test("a story develops from day to day: honest updates say so, quiet edits do not", () => {
  const g = started();
  g.sleep();                                                       // day 2: the break
  assert.equal(g.view("DR-2026-0090").versionId, "v1");
  g.sleep();                                                       // day 3: first update
  let v = g.view("DR-2026-0090");
  assert.equal(v.versionId, "v2");
  assert.equal(v.publishedDate, "2026-03-10", "still first published on the day of the break");
  assert.ok(v.date > v.publishedDate && !v.silent && v.corrections.length, "an honest update, with a correction");
  g.sleep(); g.sleep();                                            // day 5: second update
  v = g.view("DR-2026-0090");
  assert.equal(v.versionId, "v3");
  assert.deepEqual(v.cachedVersions, ["v1", "v2"], "earlier versions stay readable in the cache");
  assert.equal(g.view("DR-2026-0090", "v1").title, "Water main break floods Harbor Street");
  const tip = g.view("UF-2026-0091");
  assert.ok(tip.versionId === "v2" && tip.silent, "Unfiltered changes its tip without a word");
  // An update does not move a story back to the top of the paper
  const front = g.news("dailyrecord", { limit: 6 }).items;
  assert.ok(front.indexOf("DR-2026-0095") < front.indexOf("DR-2026-0090"));
  g.sleep(); g.sleep(); g.sleep();                                 // day 8
  assert.deepEqual(g.view("DR-2026-0099").related, ["DR-2026-0090"], "the follow-up links back");
});

test("the papers report what the player caused, dated the day it happened", () => {
  const g = started();
  for (const id of ["A67", "A68", "A69"]) {
    const a = world.artifacts.get(id);
    assert.ok(a.hidden && a.datedOnShow && !(a.supports || []).length, `${id}: hidden, dated when shown, supports nothing`);
  }
  g.sleep(); g.sleep();                                            // day 3
  fire(g, "report.published", { channel: "threadline", case: "quiet_account", claims: [], exposed: [] });
  assert.ok(!g.news("unfiltered", { limit: 50 }).items.includes("A69"));
  g.sleep();                                                       // day 4
  assert.ok(g.news("unfiltered", { limit: 5 }).items.includes("A69"), "Unfiltered picks up the player's post the next day");
  assert.equal(g.view("A69").date.slice(0, 10), g.date, "dated the day it appeared");
  assert.ok(g.s.notifications.some(n => n.ref?.artifact === "A69"));
  // The vote: without an exposed money trail it passes, and the paper says so.
  while (g.s.day < 8) g.sleep();
  assert.ok(g.s.flags.vote_passed);
  assert.ok(g.news("dailyrecord", { limit: 5 }).items.includes("A68") && !g.view("A67").title);
  assert.equal(g.view("A68").date.slice(0, 10), g.date);
});

// Intended crack (DEVPLAN, layers 4–5): a festival volunteer who died is quoted months later.
// Keep it. Do not "fix" the date, the quote or the obituary.
test("intended crack: Walter Brennan is quoted in February 2026, after his death", async () => {
  const a = world.artifacts.get("DR-2026-0051");
  assert.ok(a, "the planning article exists");
  assert.equal(a.layer, 5);
  assert.equal(a.date, "2026-02-12");
  const body = a.versions.map(v => v.body || "").join("\n");
  assert.match(body, /Walter Brennan/);
  assert.match(body, /Five thousand ducks/);
  const walt = world.entities.get("walter_brennan");
  assert.equal(walt.died, "2025-10-31");
  assert.ok(a.date > walt.died, "quoted after his death");
  const issues = validateWorld(await loadRaw(), { reachability: false, knockout: false }).issues
    .filter(i => i.level !== "INFO" && /DR-2026-0051|walter_brennan|bf-walter-brennan/.test(`${i.where} ${i.msg}`));
  assert.deepEqual(issues, [], "the validator does not flag the crack");
});

// Anders, 25 Nov 2026: Harbor Festival is always in October, and the 2025 duck race has one winner.
test("Harbor Festival is in October everywhere, and the 2025 duck race has one winner", () => {
  const month = d => String(d).slice(5, 7);
  // Pages and photos from a festival day.
  for (const id of ["B06", "DR-2025-0322", "UF-2025-0052", "W-eastfieldnotes-0016", "W-eastfieldnotes-0022"]) {
    const a = world.artifacts.get(id);
    assert.equal(month(a.date), "10", `${id} ${a.date}`);
    for (const c of a.comments || []) assert.equal(month(c.date), "10", `${id} ${c.id}`);
  }
  for (const id of ["NIMG0001", "WEB0018", "WEB0034"]) assert.equal(month(world.images.get(id).meta.taken), "10", id);
  assert.equal(world.entities.get("evt_festival").date, "2025-10-11");
  // Festival days are Saturdays (the 2025 race is "on Saturday", 11 October).
  for (const d of ["2025-10-11", "2022-10-08", "2021-10-09", world.images.get("WEB0034").meta.taken.slice(0, 10)])
    assert.equal(new Date(d + "T12:00:00Z").getUTCDay(), 6, d);
  // No text about the festival puts it in July or summer, and none tells of a move.
  for (const a of world.artifacts.values()) {
    const text = [a.title, ...a.versions.flatMap(v => [v.title, v.body]), ...(a.comments || []).map(c => c.text)].filter(Boolean).join("\n");
    if (!/harbou?r festival|duck race|festival weekend/i.test(text)) continue;
    assert.doesNotMatch(text, /\bJuly\b|\bsummer\b|\bmoved to October\b/i, a.id);
  }
  const winners = [...world.artifacts.values()].flatMap(a => a.versions.flatMap(v => [...String(v.body || "").matchAll(/won by duck (?:number |#)(\d+(?:,\d{3})*)/g)].map(m => [a.id, m[1]])));
  assert.ok(winners.length >= 2, "both reports name the winner");
  assert.deepEqual([...new Set(winners.map(w => w[1]))], ["3,117"], JSON.stringify(winners));
});
