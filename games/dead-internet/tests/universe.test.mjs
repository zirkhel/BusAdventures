// One universe, many mysteries (U1): content packs, case states, relative deadlines,
// character extensions, per-mystery validation and narrative layers.
//   node --test games/dead-internet/tests/*.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { CONTENT_DIR, loadWorld } from "../tools/lib/node-world.mjs";
import { loadContent } from "../core/content.js";
import { buildWorld } from "../core/world.js";
import { validateWorld } from "../tools/lib/validate-world.mjs";
import { Game } from "../core/game.js";

const world = await loadWorld();

/** The real content plus extra (virtual) files, e.g. a second mystery pack. */
async function loadWith(extra = {}, manifestPatch = m => m) {
  return loadContent(async p => {
    if (p in extra) return structuredClone(extra[p]);
    const data = JSON.parse(await readFile(join(CONTENT_DIR, p), "utf8"));
    return p === "manifest.json" ? manifestPatch(data) : data;
  });
}

const ECHO = {
  id: "echo_test", title: "Echo Test", status: "playable",
  start: { discover: { flag: "echo_found" }, known: ["dana"] },
  layers: { reveal: [5], hint: [6], background: [] },
  claims: ["E1"], evidence: [],
  files: { canon: "canon.json", rules: "rules.json", characters: "characters.json", artifacts: ["artifacts.json"] },
  endings: [{ id: "done", title: "Done", epilogue: "It ends.", closes: true, if: { exposed: { claim: "E1", beforeCaseDay: 3, allowWeak: true } }, effects: [] }],
};
const ECHO_FILES = {
  "mysteries/echo/mystery.json": ECHO,
  "mysteries/echo/canon.json": { claims: [{ id: "E1", label: "Echo", truth: "true", match: [{ subject: "brightline", predicate: "operates", object: "acc_maraquinn" }] }] },
  "mysteries/echo/rules.json": [{ id: "echo_day1", when: { event: "day.start", match: { caseDay: 2 } }, do: [{ setFlag: "echo_day2" }] }],
  "mysteries/echo/characters.json": [{ extends: "dana", knows: ["echo_test_fact"] }],
  "mysteries/echo/artifacts.json": [],
};
const withEcho = () => loadWith(ECHO_FILES, m => ({ ...m, mysteries: [...m.mysteries, "mysteries/echo/mystery.json"] }));

test("the content is one universe plus mystery packs", () => {
  assert.equal(world.packOf.get("B01"), "universe", "background content belongs to the universe");
  assert.equal(world.packOf.get("A02"), "quiet_account");
  assert.ok(world.rules.every(r => r.case === "quiet_account"), "the vote and other story rules belong to the case");
  const qa = world.mysteries.get("quiet_account");
  assert.ok(qa.start.menu && qa.start.known.includes("mara") && qa.testing.coreClaims.length);
  assert.deepEqual(qa.layers.reveal, [1, 2]);
  assert.ok(!qa.layers.reveal.includes(5) && !qa.layers.hint.includes(6), "The Quiet Account does not reveal layers 5–7");
  assert.equal(world.meta.startKnown, undefined, "the premise is the mystery's, not the universe's");
  for (const m of world.mysteries.values()) if (m.status === "seed") assert.equal(m.files, undefined);
});

test("a mystery can extend a universe character", async () => {
  const raw = await withEcho();
  const dana = raw.characters.find(c => c.id === "dana");
  assert.ok(dana.knows.includes("echo_test_fact"));
  assert.ok(dana.knows.length > 1, "the universe's knowledge is kept");
  assert.equal(raw.characters.filter(c => c.id === "dana").length, 1);
});

test("cases: start from the menu, discover in the world, several at once, closing one does not stop the rest", async () => {
  const w = buildWorld(await withEcho());
  const g = new Game(w, { seed: 1 });
  assert.equal(g.caseStatus("echo_test"), "available");
  assert.deepEqual(g.menuCases(), ["quiet_account"], "only start.menu cases are on the start screen");
  g.start();
  assert.equal(g.caseStatus("quiet_account"), "active");
  assert.equal(g.caseStatus("echo_test"), "available");
  g.sleep();
  assert.ok(!g.s.flags.echo_day2, "rules of a case that has not started do not run");
  // Something in the world starts the second case on day 2
  g.s.flags.echo_found = true;
  g.search("anything");
  assert.equal(g.caseStatus("echo_test"), "active");
  assert.equal(g.s.cases.echo_test.startedDay, 2);
  assert.ok(g.known().includes("dana"), "the case premise becomes known when it starts");
  assert.deepEqual(g.cases().map(c => c.id), ["quiet_account", "echo_test"]);
  g.sleep();                                     // day 3 = case day 2
  assert.ok(g.s.flags.echo_day2, "caseDay counts from the case's own start");
  // Case day 2 < 3: still before the case's deadline although the world is on day 3
  g.s.exposed.E1 = { day: g.s.day, channel: "connect", strength: "weak" };
  g.checkEndings();
  assert.equal(g.caseStatus("echo_test"), "closed");
  assert.equal(g.caseStatus("quiet_account"), "active", "the other case goes on");
  assert.ok(g.sleep().ok, "the world goes on");
});

test("a locked case becomes available when its requirements hold", async () => {
  const echo = { ...ECHO, requires: { caseClosed: "quiet_account" } };
  const w = buildWorld(await loadWith({ ...ECHO_FILES, "mysteries/echo/mystery.json": echo }, m => ({ ...m, mysteries: [...m.mysteries, "mysteries/echo/mystery.json"] })));
  const g = new Game(w, { seed: 1 });
  g.start();
  assert.equal(g.caseStatus("echo_test"), "locked");
  assert.equal(g.start("echo_test").error, "case_locked");
  g.s.cases.quiet_account.status = "closed";
  g.search("anything");
  assert.equal(g.caseStatus("echo_test"), "available");
});

test("the validator checks each mystery: evidence lists and narrative layers", async () => {
  const raw = await withEcho();
  // Universe background content may become evidence only when the mystery lists it.
  const filler = raw.artifacts.find(a => raw.packOf[a.id] === "universe");
  filler.supports = ["E1"];
  let issues = validateWorld(raw, { reachability: false }).issues.filter(i => i.level === "ERROR");
  assert.ok(issues.some(i => i.where === `artifact ${filler.id}` && /does not list it in evidence/.test(i.msg)));
  raw.mysteries.find(m => m.id === "echo_test").evidence = [filler.id];
  // Layer 5 supports E1: echo_test may reveal layer 5.
  filler.layer = 5;
  issues = validateWorld(raw, { reachability: false }).issues.filter(i => i.level === "ERROR");
  assert.deepEqual(issues.filter(i => i.where === `artifact ${filler.id}`), []);
  // The Quiet Account may not reveal layer 5: its own content at layer 5 that supports a claim is an error.
  const a02 = raw.artifacts.find(a => a.id === "A02");
  a02.layer = 6;
  issues = validateWorld(raw, { reachability: false }).issues.filter(i => i.level === "ERROR");
  assert.ok(issues.some(i => i.where === "artifact A02" && /outside what quiet_account may touch/.test(i.msg)));
});

test("new games and old saves agree on case states", async () => {
  const { serialize, deserialize } = await import("../core/save.js");
  const g = new Game(world); g.start();
  const old = structuredClone(g.s);
  old.saveVersion = 4; delete old.cases;
  const { state } = deserialize(world, serialize(old));
  assert.deepEqual(state.cases, g.s.cases);
});
