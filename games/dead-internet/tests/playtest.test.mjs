// Phase 9 playtest fixes for The Quiet Account: nothing in the game hands the player a clue.
//   node --test games/dead-internet/tests/*.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { loadWorld, GAME_DIR } from "../tools/lib/node-world.mjs";
import { Game } from "../core/game.js";

const world = await loadWorld();

test("placeholders show only the id and the caption, never how an image was made", async () => {
  const dir = join(GAME_DIR, "assets", "placeholders");
  for (const f of await readdir(dir)) {
    const svg = await readFile(join(dir, f), "utf8");
    assert.ok(!/from IMG|crop|mirror|Not generated|derived/i.test(svg.replace(/scale\(-1 1\)/, "")), `${f} gives away its origin`);
  }
});

test("pages do not narrate the patterns the player is meant to find", () => {
  const narrator = /lands on the hour|arrive within|all on the hour|always exactly on the hour|Every post is a repost|It is unclear why|Nothing else changes|capture date preserved/i;
  for (const a of world.artifacts.values()) for (const v of a.versions) assert.ok(!narrator.test(v.body ?? ""), `${a.id} ${v.id}`);
  for (const i of world.images.values()) assert.ok(!narrator.test(JSON.stringify(i.meta ?? {})), i.id);
});

test("stories the player triggers are dated the day they appear", () => {
  const g = new Game(world, { seed: 1 }); g.start();
  g.sleep(); g.sleep(); g.sleep();                                   // day 4
  g.investigate("acc_calvinmarsh");
  for (let i = 0; i < 3; i++) g.ask("calvin", "brightline");
  if (g.view("A49").error == null) assert.equal(g.view("A49").date.slice(0, 10), g.date);
  for (const id of ["A41", "A42", "A43", "A45", "A49"]) assert.ok(world.artifacts.get(id).datedOnShow, `${id} has no fixed day`);
});

test("an ending reached overnight tells the player and opens the reports", () => {
  const g = new Game(world, { seed: 1 }); g.start();
  while (g.s.day < 8) g.sleep();
  assert.ok(g.s.endings.includes("quiet_account:silence"));
  assert.ok(g.s.notifications.some(n => n.ref?.case === "quiet_account" && /^The Quiet Account: Silence/.test(n.text)));
});

test("the case's names also turn up in ordinary pages", () => {
  const g = new Game(world, { seed: 1 }); g.start();
  const bg = id => world.artifacts.get(id)?.pool === "background-qa" || /^B\d|^DR-|^UF-/.test(id);
  for (const q of ["Brightline", "Northgate", "Waterfront"]) {
    const ids = [...new Set(g.search(q).results.map(r => r.artifact))].slice(0, 10);
    assert.ok(ids.filter(bg).length >= 3, `${q}: ${ids}`);
  }
  for (const a of world.artifacts.values()) if (a.pool === "background-qa") assert.ok(!a.versions.some(v => (v.supports || a.supports || []).length), `${a.id} supports a claim`);
});
