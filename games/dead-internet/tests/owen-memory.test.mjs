import { test } from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../tools/lib/node-world.mjs";
import { Game } from "../core/game.js";
import { serialize, deserialize } from "../core/save.js";

async function fixture() {
  const w = await loadWorld(), g = new Game(w, { seed: 7 }); g.start();
  for (const id of ["acc_truthseeker", "mara", "theo", "calder_mill", "static_channel", "calvin", "brightline", "acc_theoquinn"]) g.s.known[id] = true;
  assert.ok(g.ask("owen", "mara").ok); // Introduction, not the answer to the question.
  return { w, g, c: w.characters.get("owen") };
}
function show(g, id, version) {
  g.s.artifacts[id] = { ...g.s.artifacts[id], visible: true };
  assert.ok(g.open(id).ok);
  return g.show("owen", id, version);
}

test("Owen answers known topics first, then remembers without adding evidence or effects", async () => {
  const { g, c } = await fixture();
  const r = c.responses.find(r => r.id === "mara");
  assert.equal(g.ask("owen", "mara").reply.text, r.text);
  const trust = g.s.trust.owen;
  assert.equal(g.ask("owen", "mara").reply.text, r.repeatText);
  assert.deepEqual(g.s.messages.at(-1).supports, []);
  assert.deepEqual(g.s.messages.at(-1).attach, []);
  assert.equal(g.s.trust.owen, trust);
});

test("unknown people and topics get distinct answers; only an actual fallback counts as answered", async () => {
  const { g, c } = await fixture();
  assert.equal(g.ask("owen", "calvin").reply.text, c.memory.unknownPerson.replace("{name}", "Calvin Marsh"));
  assert.equal(g.ask("owen", "calvin").reply.text, c.memory.repeatAsk);
  assert.equal(g.ask("owen", "brightline").reply.text, c.memory.unknownTopic);
  // An account is not automatically its named person.
  assert.equal(g.ask("owen", "acc_theoquinn").reply.text, c.memory.unknownTopic);
  assert.equal(g.ask("owen", "theo").reply.text, c.responses.find(r => r.id === "theo").text);
});

test("asking before the trust threshold does not consume Static Channel; its reminder has no attachment", async () => {
  const { g, c } = await fixture();
  g.ask("owen", "calder_mill"); g.ask("owen", "calder_mill");
  assert.equal(g.s.fired["resp:owen:static"], undefined);
  show(g, "A22"); // Existing agency response earns trust; unchanged condition.
  assert.equal(g.s.trust.owen, 4);
  assert.equal(g.ask("owen", "calder_mill").reply.text, c.responses.find(r => r.id === "static").text);
  assert.deepEqual(g.s.messages.at(-1).attach, ["A44"]);
  assert.equal(g.ask("owen", "static_channel").reply.text, c.responses.find(r => r.id === "static").repeatText);
  assert.deepEqual(g.s.messages.at(-1).attach, []);
});

test("repeated evidence yields no additional trust and never blocks a newly eligible response", async () => {
  const { g, c } = await fixture();
  const agency = c.responses.find(r => r.id === "agency");
  agency.if = { flag: "test_owen_ready" };
  show(g, "A22");
  assert.equal(show(g, "A22").reply.text, c.memory.repeatShow);
  g.s.flags.test_owen_ready = true;
  assert.equal(show(g, "A22").reply.text, agency.text);
  assert.equal(g.s.trust.owen, 4);
  assert.equal(show(g, "A22").reply.text, c.memory.repeatShow);
  assert.equal(g.s.trust.owen, 4);
});

test("conversation memory survives loading; an older save uses existing fired response keys", async () => {
  const { w, g, c } = await fixture();
  g.ask("owen", "calvin"); g.ask("owen", "theo"); show(g, "A22");
  const loaded = new Game(w, { state: deserialize(w, serialize(g.s)).state });
  assert.equal(loaded.ask("owen", "calvin").reply.text, c.memory.repeatAsk);
  assert.equal(loaded.ask("owen", "theo").reply.text, c.responses.find(r => r.id === "theo").repeatText);
  assert.equal(show(loaded, "A22").reply.text, c.memory.repeatShow);
  // Old saves already recorded authored replies even before repeatText existed.
  g.s.fired["resp:owen:paper"] = 0; g.s.known.dana = true;
  assert.equal(g.ask("owen", "dana").reply.text, c.responses.find(r => r.id === "paper").repeatText);
});

test("a different visible page version is not treated as the same evidence", async () => {
  const { g, c } = await fixture();
  show(g, "A12", "v1");
  assert.equal(show(g, "A12", "v1").reply.text, c.memory.repeatShow);
  assert.notEqual(show(g, "A12", "v2").reply.text, c.memory.repeatShow);
});
