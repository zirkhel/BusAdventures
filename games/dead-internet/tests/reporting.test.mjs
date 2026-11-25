// Casebook step 5: reporting with the player's own judgements. Before publishing, the editor
// (Dana) comments on what the player has marked themselves: evidence against, their own count
// of independent sources, sources they don't trust or doubt, rejected theories. A report keeps a
// snapshot of the player's Casebook behind it. The Timeline shows the player's own count, labelled.
// None of it changes what publishing does: the editor's cut, scoring, the world and the endings
// read exactly what they read before (Anders, 25.11.2026).
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../tools/lib/node-world.mjs";
import { Game, replay } from "../core/game.js";
import { serialize, deserialize } from "../core/save.js";
import { SAVE_VERSION } from "../core/state.js";
import { supportOf, apparentSupportOf } from "../core/casebook.js";

const MIKE = "account:acc_mike", PAT = "account:acc_pat", TRUTH = "account:acc_truthseeker";

async function fixture() {
  const w = await loadWorld();
  const g = new Game(w, { seed: 7 }); g.start();
  const ev = [];
  for (const id of ["A16", "A54", "A55", "A56", "W-kestrel-0005"]) { g.s.artifacts[id] = { ...g.s.artifacts[id], visible: true }; g.open(id); ev.push(g.save({ artifact: id }).id); }
  g.investigate("mara");
  g.s.trust.dana = 10;
  const h = g.hypothesize({ subject: "mara", predicate: "is_dead", evidence: [ev[1], ev[2], ev[3]] }).id;
  return { w, g, ev, h };
}

const world = g => structuredClone({ flags: g.s.flags, counters: g.s.counters, trust: g.s.trust, credibility: g.s.credibility,
  fired: g.s.fired, notifications: g.s.notifications, endings: g.s.endings, pending: g.s.pending, messages: g.s.messages, day: g.s.day,
  published: g.s.published, exposed: g.s.exposed });

test("save format is version 12", () => assert.equal(SAVE_VERSION, 12));

test("the editor has nothing to add when the player has marked nothing", async () => {
  const { g, h } = await fixture();
  assert.deepEqual(g.editorNotes("daily_record", [h]), { ok: true, notes: [] });
  assert.equal(g.editorNotes("connect", [h]).error, "no_reviewer", "only a channel with an editor");
});

test("the editor quotes the player's own reservations back, one note each", async () => {
  const { g, ev, h } = await fixture();
  g.link(h, ev[0], true, "contradicts");
  g.linkSources(MIKE, PAT);
  g.assessSource(MIKE, { trust: "no", authentic: "no" });
  g.assessSource(PAT, { trust: "unsure" }); // unsure is not a reservation that is counted
  g.setTheoryStatus(h, "rejected");
  const notes = g.editorNotes("daily_record", [h]).notes;
  assert.deepEqual(notes.map(n => n.kind), ["rejected", "against", "ownCount", "notTrusted", "notAuthentic"]);
  const text = notes.map(n => n.text).join("\n");
  assert.match(text, /you've rejected this theory yourself/);
  assert.match(text, /you've linked 1 piece of evidence against it yourself/);
  assert.match(text, /By your own count that's 2 sources, not 3\./);
  assert.match(text, /you don't trust 1 of the sources behind it/);
  assert.match(text, /you doubt 1 source is who it claims to be/);
  assert.doesNotMatch(text, /\b(true|false|correct|wrong|right)\b/i, "she never says whether the claim is right");
  // No notes while the editor doesn't trust the player enough to talk.
  g.s.trust.dana = 0;
  assert.deepEqual(g.editorNotes("daily_record", [h]).notes, []);
});

test("the editor's notes are advice only: review, the cut, scoring and the world are unchanged", async () => {
  const run = async marked => {
    const { g, ev, h } = await fixture();
    const hyp = g.s.hypotheses.find(x => x.id === h);
    const review = JSON.stringify(g.review("daily_record", [h]));
    const sup = JSON.stringify([supportOf(g, hyp), apparentSupportOf(g, hyp)]);
    if (marked) {
      g.link(h, ev[0], true, "contradicts");
      g.linkSources(MIKE, PAT); g.addLink({ a: ev[2], b: ev[3], kind: "same_origin" });
      g.assessSource(MIKE, { trust: "no", authentic: "no" });
      const before = world(g);
      assert.ok(g.editorNotes("daily_record", [h]).notes.length >= 3);
      assert.deepEqual(world(g), before, "asking for the notes changes nothing");
      assert.equal(JSON.stringify(g.review("daily_record", [h])), review, "her comment on how the sources look is unchanged");
      assert.equal(JSON.stringify([supportOf(g, { ...hyp, against: [] }), apparentSupportOf(g, { ...hyp, against: [] })]), sup);
    }
    const r = g.publish("daily_record", [h]);
    const out = r.ok ? { cut: r.report.cut, items: r.report.items } : r;
    return JSON.stringify({ out, w: world(g), reviewAfter: g.review("daily_record", [h]) });
  };
  assert.equal(await run(true), await run(false), "publishing gives the same result with or without the player's reservations");
});

test("a report keeps a snapshot of the player's Casebook, and it doesn't change afterwards", async () => {
  const { g, ev, h } = await fixture();
  g.link(h, ev[0], true, "contradicts");
  g.linkSources(MIKE, PAT);
  g.assessSource(MIKE, { trust: "no" });
  const t = g.addEvent({ title: "The post", date: { kind: "exact", value: "2025-07-02" }, evidence: [{ id: ev[1], stance: "supports" }, { id: ev[2], stance: "supports" }, { id: ev[0], stance: "contradicts" }] });
  const preview = g.reportBasis([h], [t.id]);
  const r = g.publish("connect", [h], { events: [t.id] });
  assert.ok(r.ok);
  const rep = g.casebook().reports.at(-1);
  assert.ok(rep, "published");
  const snap = rep.snapshot;
  assert.deepEqual({ ...snap, cut: undefined }, { ...preview, cut: undefined }, "the builder shows what the report will store");
  assert.deepEqual(snap.theories[0], { hypothesis: h, label: "Mara Quinn is dead", claimLabel: "Mara Quinn is dead", status: "open",
    evidence: 3, against: 1, sources: 3, own: 2, againstSources: 1, ownAgainst: 1, notTrusted: 1, notAuthentic: 0,
    words: "", note: "", connections: [],
    reasons: [ev[1], ev[2], ev[3], ev[0]].map((id, k) => ({ evidence: id, stance: k < 3 ? "for" : "against", title: g.evidenceView(id).title, note: "" })) });
  assert.equal(snap.events[0].description, "");
  assert.deepEqual([snap.events[0].supporting, snap.events[0].supportSources, snap.events[0].ownSupportSources, snap.events[0].contradicting], [2, 2, 1, 1]);
  assert.deepEqual(snap.cut, []);
  // Revising the theory and the source cards afterwards doesn't rewrite the report.
  g.linkSources(MIKE, PAT, false); g.assessSource(MIKE, { trust: null }); g.link(h, ev[0], false, "contradicts");
  assert.ok(g.dispatch({ type: "updateHypothesis", id: h, patch: { title: "Changed my mind" } }).ok);
  assert.deepEqual(g.casebook().reports.at(-1).snapshot, snap);
  // And it replays exactly.
  assert.deepEqual(replay(g.w, { seed: 7 }, g.s.log).s.reports, g.s.reports);
});

test("historical reports never change when the player later edits the Casebook; published and cut are kept apart", async () => {
  const { g, ev, h } = await fixture();
  // A second claim on Mara with two other visible sources, so The Daily Record publishes one and cuts the other.
  const more = ["A06", "A17"].map(id => { g.s.artifacts[id] = { ...g.s.artifacts[id], visible: true }; g.open(id); return g.save({ artifact: id }).id; });
  const strong = g.hypothesize({ subject: "mara", predicate: "is_dead", title: "The death notice is real", note: "Dana wrote it herself", evidence: more }).id;
  g.dispatch({ type: "updateHypothesis", id: h, patch: { title: "The friends say so", note: "Three friends, same week" } });
  g.editEvidence(ev[1], { note: "Mike sounds sure" });
  g.addLink({ a: ev[1], b: ev[2], kind: "related", note: "Same wording" });
  g.link(h, ev[0], true, "contradicts");
  const t = g.addEvent({ title: "The post", description: "What the friends wrote", date: { kind: "exact", value: "2025-07-02" }, evidence: [{ id: ev[1], stance: "supports" }] });
  const r = g.publish("daily_record", [strong, h], { events: [t.id] });
  assert.ok(r.ok, "one claim gets through");
  assert.deepEqual(r.report.cut, [h], "the other is cut by the editor");
  const before = structuredClone(g.casebook().reports.at(-1));
  const snap = before.snapshot;
  const theory = id => snap.theories.find(x => x.hypothesis === id);
  assert.deepEqual(snap.cut, [h]);
  assert.deepEqual([theory(strong).words, theory(strong).note, theory(h).words, theory(h).note],
    ["The death notice is real", "Dana wrote it herself", "The friends say so", "Three friends, same week"]);
  assert.equal(theory(h).reasons.find(x => x.evidence === ev[1]).note, "Mike sounds sure");
  assert.deepEqual(theory(h).reasons.find(x => x.evidence === ev[0]).stance, "against");
  assert.deepEqual(theory(h).connections, [{ kind: "related", a: ev[1], b: ev[2], note: "Same wording" }]);
  assert.equal(snap.events[0].description, "What the friends wrote");
  assert.deepEqual(snap.events[0].reasons, [{ evidence: ev[1], stance: "for", title: g.evidenceView(ev[1]).title, note: "Mike sounds sure" }]);
  assert.deepEqual(before.items.map(i => i.label), ["Mara Quinn is dead"]);
  assert.deepEqual(before.cut, ["Mara Quinn is dead"]);
  // Now the player rewrites everything behind it.
  g.investigate("theo");
  const l = g.s.links.find(x => x.a === ev[1] && x.b === ev[2]);
  for (const [what, res] of [
    ["reword", g.dispatch({ type: "updateHypothesis", id: strong, patch: { title: "Not so sure", note: "" } })],
    ["change the claim", g.dispatch({ type: "updateHypothesis", id: h, patch: { subject: "theo", predicate: "is_dead" } })],
    ["evidence note", g.editEvidence(ev[1], { note: "Changed" })],
    ["connection", g.dispatch({ type: "updateLink", id: l.id, patch: { note: "Never mind", kind: "unrelated" } })],
    ["event", g.dispatch({ type: "updateEvent", id: t.id, patch: { title: "Renamed", description: "Rewritten" } })],
    ["status", g.setTheoryStatus(strong, "rejected")],
    ["source card", g.assessSource(MIKE, { trust: "no" })],
    ["unlink", g.link(strong, more[0], false)],
    ["delete", g.dispatch({ type: "deleteHypothesis", id: h })],
  ]) assert.ok(res.ok, `fixture: ${what} (${JSON.stringify(res)})`);
  assert.equal(g.s.hypotheses.find(x => x.id === strong).title, "Not so sure");
  assert.deepEqual(g.casebook().reports.at(-1), before, "the report reads exactly as it did when it went out");
  assert.ok(g.dispatch({ type: "removeEvidence", id: ev[1] }).ok);
  assert.deepEqual(g.casebook().reports.at(-1), before, "removing event evidence preserves its frozen reference and note");
  const restored = new Game(g.w, { state: deserialize(g.w, serialize(g.s)).state });
  assert.deepEqual(restored.casebook().reports.at(-1), before, "event evidence survives save and reload");
});

test("timeline events show the player's own count next to the visible sources", async () => {
  const { g, ev } = await fixture();
  const t = g.addEvent({ title: "x", date: { kind: "unknown" }, evidence: [{ id: ev[1], stance: "supports" }, { id: ev[2], stance: "supports" }, { id: ev[3], stance: "supports" }, { id: ev[0], stance: "contradicts" }] });
  const view = () => g.timeline().find(e => e.id === t.id);
  assert.deepEqual([view().supports, view().supportSources, view().ownSupportSources, view().contradictSources], [3, 3, 3, 1]);
  g.linkSources(MIKE, PAT); g.addLink({ a: ev[2], b: ev[3], kind: "same_origin" });
  assert.deepEqual([view().supportSources, view().ownSupportSources], [3, 1], "visible count unchanged; the player's own count merges");
  g.linkSources(TRUTH, MIKE);
  assert.equal(view().ownContradictSources, 1, "the count is per side");
});

/** An older save from today's state. */
function older(s, version) {
  const o = structuredClone(s);
  o.saveVersion = version;
  for (const r of o.reports) delete r.snapshot;
  if (version < 11) delete o.sourceViews;
  if (version < 10) delete o.links;
  if (version < 9) { delete o.questions; for (const h of o.hypotheses) { delete h.title; delete h.against; delete h.status; delete h.statusLog; delete h.alternatives; } }
  if (version < 8) delete o.browser;
  return o;
}

for (const version of [11, 10, 9, 8, 7]) {
  test(`a version ${version} save with a published report opens as version 12; the old report has no snapshot`, async () => {
    const { w, g, h } = await fixture();
    g.publish("connect", [h]);
    assert.ok(g.s.reports.length, "fixture: a report");
    const before = JSON.parse(JSON.stringify(g.s));
    const { state, warnings } = deserialize(w, serialize(older(g.s, version)));
    assert.deepEqual(warnings.filter(x => /dropped/.test(x)), []);
    assert.equal(state.saveVersion, 12);
    assert.deepEqual(state.reports.map(r => r.snapshot), before.reports.map(() => null), "nothing is inferred for old reports");
    assert.deepEqual(state.reports.map(r => ({ ...r, snapshot: undefined })), before.reports.map(r => ({ ...r, snapshot: undefined })));
    assert.deepEqual(state.evidence, before.evidence);
    const g2 = new Game(w, { seed: 7, state });
    assert.equal(g2.casebook().reports[0].snapshot, null);
    assert.ok(g2.editorNotes("daily_record", [h]).ok);
  });
}

test("a version 12 save round-trips snapshots; a broken snapshot is dropped", async () => {
  const { w, g, h } = await fixture();
  g.publish("connect", [h]);
  assert.deepEqual(deserialize(w, serialize(g.s)).state, JSON.parse(JSON.stringify(g.s)));
  const s = structuredClone(g.s);
  s.reports[0].snapshot = { theories: "x" };
  assert.equal(deserialize(w, serialize(s)).state.reports[0].snapshot, null);
});
