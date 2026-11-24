// Tests on the real world: The Quiet Account.
//   node --test games/dead-internet/tests/*.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { loadRaw, loadWorld } from "../tools/lib/node-world.mjs";
import { validateWorld } from "../tools/lib/validate-world.mjs";
import { validateGraphics } from "../tools/lib/graphics.mjs";
import { SCENARIOS } from "../tools/lib/scenarios.mjs";
import { explore } from "../tools/lib/explorer.mjs";
import { Game, replay } from "../core/game.js";
import { serialize, deserialize } from "../core/save.js";

const world = await loadWorld();

test("content validates with no errors (including reachability and single points of failure)", async () => {
  const raw = await loadRaw();
  const { issues } = validateWorld(raw, {});
  issues.push(...(await validateGraphics(raw)));
  const bad = issues.filter(i => i.level !== "INFO");
  assert.deepEqual(bad.map(i => `${i.level} ${i.where}: ${i.msg}`), []);
});

for (const sc of SCENARIOS) {
  test(`scenario: ${sc.title}`, () => {
    const g = new Game(world, { seed: 1 });
    sc.run(g);
    for (const [label, ok] of sc.expect(g)) assert.ok(ok, label);
  });
}

test("a cautious automatic player can expose the case through the Daily Record", () => {
  const { game } = explore(world, { mode: "cautious", publishOnDay: 6 });
  assert.ok(game.s.endings.includes("quiet_account:lights_out"));
});

test("no published report ever reveals truth in the casebook view", () => {
  const g = new Game(world, { seed: 1 });
  SCENARIOS.find(s => s.id === "lights_out").run(g);
  const text = JSON.stringify(g.casebook());
  for (const word of ['"truth"', '"strength"', '"claim"', "S2", "S3"]) assert.ok(!text.includes(word), word);
});

test("save in the middle of the case, load, and continue identically", () => {
  const g = new Game(world, { seed: 3, playerName: "Robin" });
  g.start(); g.search("Mara Quinn obituary"); g.open("A11"); g.open("A02"); g.ask("persona_mara", "evt_mara_death"); g.sleep();
  const { state } = deserialize(world, serialize(g.s));
  const a = new Game(world, { state }), b = g;
  for (const x of [a, b]) { x.search("Theo Quinn"); x.open("A06"); x.sleep(); }
  assert.deepEqual(JSON.parse(JSON.stringify(a.s)), JSON.parse(JSON.stringify(b.s)));
  assert.ok(a.view("A45").error == null, "the persona's reply post appeared on day 2");
});

test("replaying the action log reproduces the state exactly", () => {
  const g = new Game(world, { seed: 5 });
  SCENARIOS.find(s => s.id === "who_paid_whom").run(g);
  const r = replay(world, { seed: 5 }, g.s.log);
  assert.deepEqual(r.s, g.s);
});

test("free search: any query works and precise queries are rewarded", () => {
  const g = new Game(world); g.start();
  const ids = q => g.search(q).results.map(r => r.artifact);
  assert.ok(ids("chowder").length > 0, "background content answers everyday queries");
  assert.ok(ids("xylophone quantum").length === 0);
  assert.ok(!ids("persona brief").includes("A22"), "the leaked brief is not found by vague words");
  assert.ok(ids("MARA_Q").includes("A22"), "…but the exact code finds it");
  assert.ok(ids("bl-ops.net").includes("A19"));
  assert.ok(ids("Save the Mill").includes("A15"), "the deleted post is in the cache");
  assert.ok(!ids("Renee Okafor").some(id => !["A10", "A20"].includes(id) && !world.artifacts.get(id).filler),
    "Renee barely exists outside Brightline's own pages");
});

test("notes can be added, edited and deleted; empty notes are refused", () => {
  const g = new Game(world); g.start();
  assert.ok(g.note("   ").error);
  const { id } = g.note("bl-ops.net = Brightline?");
  assert.ok(g.editNote(id, "bl-ops.net is Brightline's portal").ok);
  assert.equal(g.s.notes[0].text, "bl-ops.net is Brightline's portal");
  assert.ok(g.editNote(id, "").error);
  assert.ok(g.deleteNote(id).ok);
  assert.equal(g.s.notes.length, 0);
  assert.ok(g.deleteNote(id).error);
  const r = replay(world, {}, g.s.log);
  assert.deepEqual(r.s.notes, g.s.notes);
});

test("topics and evidence views give names, kinds and sources, never claims", () => {
  const g = new Game(world); g.start();
  g.open("A05");
  const e = g.save({ artifact: "A05" }).id;
  const t = g.topics();
  assert.ok(t.some(x => x.id === "acc_maraquinn" && x.kind === "account"));
  assert.ok(t.some(x => x.id === "mara" && x.kind === "person"));
  assert.ok(!t.some(x => world.entities.get(x.id)?.secret), "secret entities are never topics");
  const about = g.evidenceAbout(e);
  assert.ok(about.about.includes("acc_maraquinn"));
  assert.equal(typeof about.source, "string");
  assert.ok(!JSON.stringify(about).includes("S8"), "no claim ids leak");
});

test("a conversation started from the phone: ask, show saved evidence, get a reply option", () => {
  const g = new Game(world); g.start();
  g.search("Theo Quinn"); g.open("A06");
  assert.ok(g.contacts().includes("theo"));
  assert.equal(g.ask("theo", "calder_mill").error, "unknown_topic", "you can only ask about what you know");
  g.open("A05");                                   // the post mentions the Mill
  assert.ok(g.ask("theo", "calder_mill").ok); g.ask("theo", "calder_mill");
  g.searchImage("IMG01"); g.open("A33");
  const ev = g.save({ artifact: "A33" }).id;
  const e = g.s.evidence.find(x => x.id === ev);
  const before = g.thread("theo").length;
  g.show("theo", e.artifact, e.version ?? undefined);
  const th = g.thread("theo");
  assert.ok(th.length > before + 1, "Theo answered");
  assert.ok(th.some(m => m.attach?.includes("A32")), "Theo forwarded his emails");
});
