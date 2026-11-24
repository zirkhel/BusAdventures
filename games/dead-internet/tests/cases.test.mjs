// Cases, reports per case and epilogues (phase 5, U0).
//   node --test games/dead-internet/tests/*.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { loadRaw, loadWorld } from "../tools/lib/node-world.mjs";
import { buildWorld } from "../core/world.js";
import { Game, replay } from "../core/game.js";
import { serialize, deserialize } from "../core/save.js";
import { SCENARIOS } from "../tools/lib/scenarios.mjs";

const world = await loadWorld();

/** The real world plus a second playable case, to prove nothing assumes a single case. */
async function twoCaseWorld() {
  const raw = structuredClone(await loadRaw());
  raw.mysteries.push({ id: "test_case", title: "Test Case", status: "playable", claims: [], endings: [],
    publishing: { channels: [{ id: "test_paper", name: "Test Paper" }] } });
  return buildWorld(raw);
}

function collect(g) {
  g.start();
  if (g.w.mysteries.has("test_case")) assert.ok(g.start("test_case").ok, "a second case can be started");
  g.search("Mara Quinn obituary"); g.open("A02"); g.open("A11");
  const e1 = g.save({ artifact: "A02" }).id, e2 = g.save({ artifact: "A11" }).id;
  g.search("Theo Quinn"); g.search("Brightline Media");
  const h = g.hypothesize({ subject: "brightline", predicate: "operates", object: "acc_maraquinn", evidence: [e1] }).id;
  const n = g.note("Check the photo dates.").id;
  const t = g.addEvent({ title: "Mara dies", date: { kind: "exact", value: "2025-07-02" }, evidence: [{ id: e1, stance: "supports" }] }).id;
  return { e1, e2, h, n, t };
}

test("new Casebook items are unclassified and nothing is linked to a case automatically", async () => {
  const g = new Game(await twoCaseWorld());
  const { e1, e2, h, n, t } = collect(g);
  assert.deepEqual(g.cases().map(c => c.id), ["quiet_account", "test_case"], "only started cases are offered, never seeds");
  const cb = g.casebook();
  for (const x of [...cb.evidence, ...cb.hypotheses, ...cb.notes, ...cb.timeline]) assert.deepEqual(x.cases, [], `${x.id} starts unclassified`);
  // One, several or none
  assert.ok(g.setCases("evidence", e1, ["quiet_account"]).ok);
  assert.ok(g.setCases("hypothesis", h, ["quiet_account", "test_case"]).ok);
  assert.ok(g.setCases("note", n, []).ok);
  assert.ok(g.setCases("event", t, ["test_case"]).ok);
  assert.deepEqual(g.s.evidence.find(x => x.id === e1).cases, ["quiet_account"]);
  assert.deepEqual(g.s.evidence.find(x => x.id === e2).cases, [], "other items are untouched");
  assert.deepEqual(g.s.hypotheses[0].cases, ["quiet_account", "test_case"]);
  assert.equal(g.setCases("note", n, ["project_echo"]).error, "unknown_case", "a seed mystery is not a case yet");
  assert.equal(g.setCases("evidence", "E999", []).error, "unknown_item");
  assert.equal(g.setCases("thing", e1, []).error, "bad_kind");
  // Editing an event keeps its cases unless the player changes them
  g.editEvent(t, { title: "Mara dies on Route 9" });
  assert.deepEqual(g.s.timeline[0].cases, ["test_case"]);
});

test("a report belongs to one case and uses that case's channels and claims", async () => {
  const g = new Game(await twoCaseWorld());
  const { h, t } = collect(g);
  assert.equal(g.publish("connect", [h]).error, "no_case", "with two cases, a report must say which");
  assert.deepEqual(g.channels("test_case").map(c => c.id).sort(), ["connect", "test_paper", "threadline"]);
  assert.ok(!g.channels("test_case").some(c => c.id === "daily_record"), "Dana's channel belongs to The Quiet Account");
  assert.equal(g.publish("daily_record", [h], { case: "test_case" }).error, "channel_unavailable");
  assert.equal(g.publish("connect", [h], { case: "project_echo" }).error, "unknown_case");

  const r = g.publish("test_paper", [h], { case: "test_case", events: [t] });
  assert.ok(r.ok);
  const rep = g.s.reports.at(-1);
  assert.equal(rep.case, "test_case");
  assert.equal(rep.items[0].claim, null, "claims of another case are not matched");
  assert.deepEqual(rep.events.map(e => [e.id, e.title, e.supportSources]), [[t, "Mara dies", 1]]);
  const view = g.casebook().reports[0];
  assert.equal(view.case, "test_case");
  assert.deepEqual(view.events.map(e => e.title), ["Mara dies"]);
  assert.equal("truth" in view.items[0], false, "the Casebook never shows truth");
  assert.equal("supportSources" in view.events[0], false);
});

test("with one case on offer, old-style publish calls still work and belong to it", () => {
  const sc = SCENARIOS.find(s => s.id === "lights_out") ?? SCENARIOS[0];
  const g = new Game(world, { seed: 1 });
  sc.run(g);
  assert.ok(g.s.reports.length);
  for (const r of g.s.reports) assert.equal(r.case, "quiet_account");
});

test("endings carry epilogues, and a closing ending closes its case without ending the game", () => {
  const sc = SCENARIOS.find(s => s.id === "lights_out");
  assert.ok(sc, "lights_out scenario exists");
  const g = new Game(world, { seed: 1 });
  sc.run(g);
  const ends = g.endings();
  const lo = ends.find(e => e.id === "lights_out");
  assert.ok(lo && lo.title && lo.epilogue && lo.closes);
  assert.equal(g.caseStatus("quiet_account"), "closed");
  // The world goes on
  assert.ok(g.sleep().ok);
  g.search("cats");
  for (const m of world.mysteries.values()) for (const e of m.endings || []) assert.ok(e.title && e.epilogue, `${m.id}:${e.id} has an epilogue`);
});

test("version 3 saves migrate: items become unclassified, reports get their case", () => {
  const g = new Game(world);
  const { h } = collect(g);
  g.s.trust.dana = 5;
  g.publish("connect", [h]);
  const old = structuredClone(g.s);
  old.saveVersion = 3;
  for (const k of ["evidence", "hypotheses", "notes", "timeline"]) for (const x of old[k]) delete x.cases;
  for (const r of old.reports) delete r.case;
  const { state } = deserialize(world, serialize(old));
  assert.equal(state.saveVersion, 5);
  for (const k of ["evidence", "hypotheses", "notes", "timeline"]) for (const x of state[k]) assert.deepEqual(x.cases, [], `${k} ${x.id}`);
  assert.equal(state.reports[0].case, "quiet_account");
});

test("cases and reports replay deterministically", async () => {
  const w2 = await twoCaseWorld();
  const g = new Game(w2, { seed: 3 });
  const { e1, h, t } = collect(g);
  g.setCases("evidence", e1, ["test_case"]);
  g.publish("test_paper", [h], { case: "test_case", events: [t] });
  const r = replay(w2, { seed: 3 }, g.s.log);
  assert.deepEqual(r.s.reports, g.s.reports);
  assert.deepEqual(r.s.evidence, g.s.evidence);
});
