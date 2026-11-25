import { test } from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../tools/lib/node-world.mjs";
import { gather } from "../tools/lib/scenarios.mjs";
import { Game } from "../core/game.js";
import { serialize, deserialize } from "../core/save.js";

async function fixture() {
  const w = await loadWorld(), g = new Game(w, { seed: 7 });
  gather(g);
  assert.equal(g.s.fired["resp:dana:evidence"], undefined);
  return { w, g };
}

test("Dana awards evidence trust once total, not once per artifact or day", async () => {
  const { g } = await fixture();
  const before = g.s.trust.dana;
  assert.ok(g.show("dana", "A32").ok);
  assert.equal(g.s.trust.dana, before + 1);
  for (const id of ["A32", "A22", "A32"]) assert.ok(g.show("dana", id).ok);
  assert.equal(g.s.trust.dana, before + 1);
  g.sleep();
  const nextDay = g.s.trust.dana;
  assert.ok(g.show("dana", "A32").ok);
  assert.equal(g.s.trust.dana, nextDay);
});

test("loading a save cannot reset Dana's evidence trust award", async () => {
  const { w, g } = await fixture();
  g.show("dana", "A32");
  const restored = new Game(w, { state: deserialize(w, serialize(g.s)).state });
  const before = restored.s.trust.dana;
  assert.ok(restored.show("dana", "A22").ok);
  assert.equal(restored.s.trust.dana, before);
});

test("an old save retains earned trust but cannot farm another evidence award", async () => {
  const { w, g } = await fixture();
  const response = w.characters.get("dana").responses.find(r => r.id === "evidence");
  delete response.once;
  g.show("dana", "A32");
  g.show("dana", "A32");
  const updated = await loadWorld();
  const restored = new Game(updated, { state: deserialize(updated, serialize(g.s)).state });
  const before = g.s.trust.dana;
  assert.equal(restored.s.trust.dana, before);
  assert.ok(restored.show("dana", "A22").ok);
  assert.equal(restored.s.trust.dana, before);
});
