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
