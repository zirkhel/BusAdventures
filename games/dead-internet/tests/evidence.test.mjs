import { test } from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../tools/lib/node-world.mjs";
import { Game, replay } from "../core/game.js";
import { serialize, deserialize } from "../core/save.js";
import { gather } from "../tools/lib/scenarios.mjs";

async function fixture() {
  const w = await loadWorld();
  const g = new Game(w, { seed: 7 }); g.start(); g.open("A16");
  const id = g.save({ artifact: "A16" }).id;
  return { w, g, id, e: g.s.evidence.find(e => e.id === id) };
}

test("opening does not review; marks, comments and shelving survive save and replay", async () => {
  const { w, g, id, e } = await fixture();
  g.editEvidence(id, { opened: true });
  assert.equal(e.opened, 1); assert.equal(e.marks.reviewed, null);
  g.editEvidence(id, { reviewed: true, important: true, doubtful: true, note: "My own conclusion" });
  const ev = g.addEvent({ title: "Something happened", date: { kind: "unknown" }, evidence: [{ id, stance: "contradicts" }] }).id;
  g.investigate("mara");
  const hy = g.hypothesize({ subject: "mara", predicate: "is_dead", evidence: [id] }).id;
  assert.equal(g.setCases("evidence", id, ["quiet_account"]).ok, true);
  const before = structuredClone({ event: g.s.timeline, hypotheses: g.s.hypotheses, cases: e.cases });
  g.editEvidence(id, { shelf: "irrelevant" });
  assert.equal(e.shelvedDay, 1);
  g.editEvidence(id, { shelf: null });
  assert.deepEqual({ event: g.s.timeline, hypotheses: g.s.hypotheses, cases: e.cases }, before);
  assert.equal(e.note, "My own conclusion");
  assert.ok(ev && hy);
  assert.deepEqual(deserialize(w, serialize(g.s)).state, JSON.parse(JSON.stringify(g.s)));
  assert.deepEqual(replay(w, { seed: 7 }, g.s.log).s, g.s);
  g.editEvidence(id, { reviewed: false }); assert.equal(e.marks.reviewed, null);
  const state = structuredClone(g.s);
  assert.equal(g.editEvidence(id, { shelf: "secret", note: "bad" }).error, "bad_shelf");
  assert.deepEqual(g.s, state);
});

test("saved pages pin the visible version without granting access to unseen versions", async () => {
  const { w, g, id, e } = await fixture();
  const original = g.evidenceView(id);
  assert.ok(e.version); assert.ok(e.snapshot);
  const a = w.artifacts.get("A16");
  a.versions.push({ id: "new", body: "Changed after saving" });
  g.s.artifacts.A16 = { live: "new", visible: true };
  assert.equal(g.view("A16").body, "Changed after saving");
  assert.deepEqual(g.evidenceView(id), original);
  assert.equal(g.save({ artifact: "A16", version: "not-seen" }).error, "not_available");
  assert.equal(g.evidenceView("not-saved").error, "unknown_evidence");
  g.s.artifacts.A16 = { live: null, visible: false };
  assert.deepEqual(g.evidenceView(id), original);
  const returned = g.evidenceView(id); returned.body = "Tampered";
  assert.deepEqual(g.evidenceView(id), original);
  assert.ok(!("supports" in original) && !("source" in original) && !("mentions" in original));
});

test("excerpts remain distinct evidence with source and version; messages deduplicate", async () => {
  const { g, e } = await fixture();
  const text = e.snapshot.body.slice(0, 30);
  const first = g.save({ artifact: "A16", quote: { text } });
  assert.notEqual(first.id, e.id);
  assert.equal(g.save({ artifact: "A16", quote: { text } }).id, first.id);
  assert.equal(g.s.evidence.find(x => x.id === first.id).version, e.version);
  assert.equal(g.save({ artifact: "A16", quote: { text: " " } }).error, "empty_quote");
  const m = g.s.messages.find(m => m.from !== "player");
  const saved = g.save({ message: m.id });
  assert.equal(g.save({ message: m.id }).id, saved.id);
  assert.notEqual(g.save({ message: m.id, quote: { text: m.text.slice(0, 20) } }).id, saved.id);
  assert.equal(g.s.notes.length, 0);
});

test("v6 migration retains notes, explicit versions and links without guessing judgments", async () => {
  const { w, g, e } = await fixture();
  e.note = "Old comment";
  g.addEvent({ title: "Old event", date: { kind: "unknown" }, evidence: [{ id: e.id, stance: "supports" }] });
  const old = JSON.parse(serialize(g.s)); old.saveVersion = old.state.saveVersion = 6;
  for (const item of old.state.evidence) for (const key of ["marks", "opened", "shelf", "snapshot"]) delete item[key];
  w.artifacts.get("A16").versions.push({ id: "later", body: "Replacement" });
  old.state.artifacts.A16 = { live: "later" };
  const state = deserialize(w, old).state;
  assert.equal(state.saveVersion, 7);
  assert.equal(state.evidence[0].note, "Old comment");
  assert.equal(state.evidence[0].version, e.version);
  assert.equal(state.evidence[0].snapshot.body, e.snapshot.body);
  assert.deepEqual(state.evidence[0].marks, { reviewed: null, important: false, doubtful: false });
  assert.equal(state.evidence[0].opened, null);
  assert.deepEqual(state.timeline, g.s.timeline);
});

test("personal judgments and shelving cannot change Dana or published consequences", async () => {
  const w = await loadWorld(); const g = new Game(w, { seed: 7 }); const r = gather(g);
  const other = new Game(w, { state: structuredClone(g.s) });
  for (const e of other.s.evidence) other.editEvidence(e.id, { reviewed: true, important: true, doubtful: true, shelf: "finished", note: "I disagree" });
  assert.deepEqual(other.review("daily_record", [r.h2, r.h3]), g.review("daily_record", [r.h2, r.h3]));
  assert.deepEqual(other.publish("daily_record", [r.h2, r.h3]), g.publish("daily_record", [r.h2, r.h3]));
  for (const key of ["endings", "flags", "trust", "published", "exposed", "artifacts"]) assert.deepEqual(other.s[key], g.s[key]);
});

