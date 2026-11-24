// Time is the player's to move: only sleeping advances it. Known deadlines.
//   node --test games/dead-internet/tests/*.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { loadRaw, loadWorld } from "../tools/lib/node-world.mjs";
import { buildWorld } from "../core/world.js";
import { Game } from "../core/game.js";

const world = await loadWorld();

test("reading, searching and browsing never move time; sleeping moves it exactly one day", () => {
  const g = new Game(world);
  g.start();
  const d0 = g.dayInfo();
  assert.equal(d0.day, 1);
  assert.equal(d0.date, world.meta.startDate);
  g.search("Mara Quinn"); g.open("A02"); g.open("A53"); g.scrollFeed("connect"); g.save({ artifact: "A02" });
  assert.equal(g.s.day, 1, "no action other than sleep advances the day");
  assert.equal(d0.nextDate, "2026-03-10");
  g.sleep();
  assert.deepEqual([g.dayInfo().day, g.dayInfo().date], [2, "2026-03-10"]);
});

test("a deadline is only shown once the player has met it, and never after it passed", () => {
  const g = new Game(world);
  g.start();
  assert.deepEqual(g.deadlines(), [], "the vote date is unknown until the player reads it somewhere");
  g.open("A53");
  const [d] = g.deadlines();
  assert.equal(d.id, "waterfront_vote");
  assert.equal(d.date, "2026-03-16", "case day 8 of a case started on day 1");
  assert.equal(d.daysLeft, 7);
  for (let i = 0; i < 6; i++) g.sleep();
  assert.equal(g.deadlines()[0].daysLeft, 1);
  g.sleep();
  assert.deepEqual(g.deadlines(), [], "once the vote has happened (or was postponed), the deadline is gone");
});

test("the news notification about the vote also makes the date known", () => {
  const g = new Game(world);
  g.start();
  g.sleep(); g.sleep();
  assert.equal(g.deadlines().length, 1, "the vote confirmation arrived on case day 3");
});

test("deadlines count from each case's own start, and only for active cases", async () => {
  const raw = structuredClone(await loadRaw());
  raw.mysteries.push({ id: "test_case", title: "Test Case", status: "playable", claims: [], endings: [], start: { menu: true },
    deadlines: [{ id: "hearing", label: "Hearing", caseDay: 3 }] });
  const g = new Game(buildWorld(raw));
  g.start();
  g.sleep(); g.sleep();
  assert.ok(!g.deadlines().some(d => d.id === "hearing"), "not started, not shown");
  g.start("test_case");
  const d = g.deadlines().find(x => x.id === "hearing");
  assert.equal(d.day, 5, "case started on day 3, so case day 3 is day 5");
  assert.equal(d.caseTitle, "Test Case");
});
