// Casebook step 2: theories (own words, for/against, status with history, alternatives) and
// open questions in Notes. All of it is the player's own layer: no rule, score or ending reads it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../tools/lib/node-world.mjs";
import { Game, replay } from "../core/game.js";
import { serialize, deserialize } from "../core/save.js";
import { SAVE_VERSION } from "../core/state.js";

async function fixture() {
  const w = await loadWorld();
  const g = new Game(w, { seed: 7 }); g.start();
  const ev = [];
  for (const id of ["A16", "A54", "A55"]) { g.s.artifacts[id] = { visible: true }; g.open(id); ev.push(g.save({ artifact: id }).id); }
  g.investigate("mara"); g.investigate("acc_maraquinn");
  return { w, g, ev };
}

const world = g => structuredClone({ flags: g.s.flags, counters: g.s.counters, trust: g.s.trust, credibility: g.s.credibility,
  fired: g.s.fired, notifications: g.s.notifications, endings: g.s.endings, pending: g.s.pending, messages: g.s.messages, day: g.s.day });

test("save format is at least version 9", () => assert.ok(SAVE_VERSION >= 9));

test("a theory can be the player's own words, a structured claim, or both", async () => {
  const { g } = await fixture();
  assert.equal(g.hypothesize({ title: "   " }).error, "empty_theory");
  const free = g.hypothesize({ title: "The obituary was planted" });
  assert.ok(free.ok);
  const v = g.casebook().hypotheses.find(h => h.id === free.id);
  assert.deepEqual([v.label, v.structured, v.claimLabel, v.status, v.statusLog], ["The obituary was planted", false, null, "open", [{ day: 1, status: "open" }]]);
  // Adding a structured claim later keeps the player's words as the label.
  assert.equal(g.dispatch({ type: "updateHypothesis", id: free.id, patch: { subject: "mara", predicate: "is_dead" } }).ok, true);
  const v2 = g.casebook().hypotheses.find(h => h.id === free.id);
  assert.equal(v2.label, "The obituary was planted");
  assert.equal(v2.structured, true);
  assert.ok(v2.claimLabel && v2.claimLabel !== v2.label);
  // The structure can be removed again, but never leave a theory with nothing in it.
  assert.equal(g.dispatch({ type: "updateHypothesis", id: free.id, patch: { predicate: null } }).ok, true);
  assert.equal(g.casebook().hypotheses.find(h => h.id === free.id).structured, false);
  assert.equal(g.dispatch({ type: "updateHypothesis", id: free.id, patch: { title: "" } }).error, "empty_theory");
  // Structured claims are still checked as before.
  assert.equal(g.hypothesize({ subject: "nobody", predicate: "is_dead" }).error, "unknown_subject");
  assert.equal(g.hypothesize({ title: "x", subject: "mara" }).error, "unknown_predicate");
});

test("evidence is for or against a theory, never both, and both sides are counted by visible source", async () => {
  const { g, ev } = await fixture();
  const h = g.hypothesize({ title: "Mara is not posting herself" }).id;
  g.link(h, ev[0]); g.link(h, ev[1], true, "contradicts"); g.link(h, ev[2], true, "contradicts");
  let v = g.casebook().hypotheses.find(x => x.id === h);
  assert.deepEqual([v.evidenceCount, v.sourceCount, v.againstCount, v.againstSourceCount], [1, 1, 2, 2]);
  g.link(h, ev[1]);   // move from against to for
  v = g.casebook().hypotheses.find(x => x.id === h);
  assert.deepEqual([v.evidence, v.against], [[ev[0], ev[1]], [ev[2]]]);
  g.link(h, ev[2], false);
  assert.deepEqual(g.casebook().hypotheses.find(x => x.id === h).against, []);
  assert.equal(g.link(h, ev[0], true, "maybe").error, "bad_stance");
  g.link(h, ev[2], true, "contradicts");
  g.dispatch({ type: "removeEvidence", id: ev[2] });
  assert.deepEqual(g.casebook().hypotheses.find(x => x.id === h).against, []);
});

test("status changes are logged with the day; alternatives show on both theories", async () => {
  const { g } = await fixture();
  const a = g.hypothesize({ title: "Brightline runs the account" }).id;
  const b = g.hypothesize({ title: "Theo runs the account" }).id;
  g.setTheoryStatus(a, "convinced");
  g.sleep();
  g.setTheoryStatus(a, "rejected");
  assert.equal(g.setTheoryStatus(a, "rejected").unchanged, true);
  assert.equal(g.setTheoryStatus(a, "right").error, "bad_status");
  const day2 = g.s.day;
  assert.deepEqual(g.casebook().hypotheses.find(x => x.id === a).statusLog,
    [{ day: 1, status: "open" }, { day: 1, status: "convinced" }, { day: day2, status: "rejected" }]);
  assert.equal(g.linkAlternative(a, a).error, "unknown_hypothesis");
  g.linkAlternative(a, b);
  const view = () => Object.fromEntries(g.casebook().hypotheses.map(h => [h.id, h.alternatives]));
  assert.deepEqual(view(), { [a]: [b], [b]: [a] });
  g.linkAlternative(b, a);   // the same pair again does not duplicate
  assert.deepEqual(view(), { [a]: [b], [b]: [a] });
  g.dispatch({ type: "deleteHypothesis", id: b });
  assert.deepEqual(view(), { [a]: [] });
});

test("questions live in Notes, link only to what the player can see, and keep their history", async () => {
  const { g, w, ev } = await fixture();
  const h = g.hypothesize({ title: "Someone else posts as Mara" }).id;
  const src = g.evidenceAbout(ev[1]).source;
  assert.equal(g.addQuestion({ text: " " }).error, "empty_question");
  const secret = [...w.entities.values()].find(e => e.secret);
  if (secret) assert.equal(g.addQuestion({ text: "?", links: { topics: [secret.id] } }).error, "bad_link");
  assert.equal(g.addQuestion({ text: "?", links: { topics: ["calvin"] } }).error, "bad_link", "not investigated yet");
  assert.equal(g.addQuestion({ text: "?", links: { sources: ["site:nowhere.example"] } }).error, "bad_link");
  const q = g.addQuestion({ text: "Who paid for the account?", links: { evidence: [ev[0]], topics: ["mara"], sources: [src], theories: [h] } }).id;
  assert.ok(q);
  assert.equal(g.setCases("question", q, ["quiet_account"]).ok, true);
  g.linkQuestion(q, "topics", "acc_maraquinn");
  g.editQuestion(q, { status: "answered", answer: "Brightline, per the invoice" });
  g.editQuestion(q, { status: "open" });
  g.editQuestion(q, { status: "dropped" });
  assert.equal(g.editQuestion(q, { status: "solved" }).error, "bad_status");
  const v = g.casebook().questions.find(x => x.id === q);
  assert.deepEqual(v.links, { evidence: [ev[0]], topics: ["mara", "acc_maraquinn"], sources: [src], theories: [h] });
  assert.deepEqual(v.statusLog.map(x => x.status), ["open", "answered", "open", "dropped"]);
  assert.equal(v.answer, "Brightline, per the invoice");
  assert.deepEqual(v.cases, ["quiet_account"]);
  g.dispatch({ type: "removeEvidence", id: ev[0] });
  g.dispatch({ type: "deleteHypothesis", id: h });
  assert.deepEqual(g.casebook().questions[0].links.evidence, []);
  assert.deepEqual(g.casebook().questions[0].links.theories, []);
  // The fixture makes pages visible directly, so compare the player's layer after replay.
  const r = replay(w, { seed: 7 }, g.s.log);
  assert.deepEqual([r.s.questions, r.s.hypotheses], [g.s.questions, g.s.hypotheses], "questions and theories replay exactly");
  assert.equal(g.deleteQuestion(q).ok, true);
  assert.equal(g.casebook().questions.length, 0);
});

test("only structured claims are reviewed and published; the player's own words stay private", async () => {
  const { g, ev } = await fixture();
  g.s.trust.dana = 99;
  const free = g.hypothesize({ title: "Something is off", evidence: [ev[0]] }).id;
  assert.deepEqual(g.review("daily_record", [free]).lines, []);
  assert.equal(g.publish("daily_record", [free]).error, "empty_report");
  assert.equal(g.s.reports.length, 0);
});

test("the player layer never changes the world", async () => {
  const { g, ev } = await fixture();
  const before = world(g);
  const hs = [g.hypothesize({ title: "A" }).id, g.hypothesize({ subject: "mara", predicate: "is_dead" }).id, g.hypothesize({ title: "C", subject: "acc_maraquinn", predicate: "not_real" }).id];
  let seed = 3;
  const rnd = n => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
  const qs = [];
  for (let i = 0; i < 300; i++) {
    const h = hs[rnd(hs.length)], e = ev[rnd(ev.length)];
    switch (rnd(7)) {
      case 0: g.link(h, e, rnd(3) > 0, rnd(2) ? "supports" : "contradicts"); break;
      case 1: g.setTheoryStatus(h, ["open", "convinced", "rejected"][rnd(3)]); break;
      case 2: g.linkAlternative(h, hs[rnd(hs.length)], rnd(2) === 0); break;
      case 3: qs.push(g.addQuestion({ text: `Q${i}`, links: { evidence: [e], theories: [h] } }).id); break;
      case 4: if (qs.length) g.editQuestion(qs[rnd(qs.length)], { status: ["open", "answered", "dropped"][rnd(3)], answer: "a" }); break;
      case 5: if (qs.length) g.linkQuestion(qs[rnd(qs.length)], "topics", "mara", rnd(2) === 0); break;
      case 6: g.dispatch({ type: "updateHypothesis", id: h, patch: { note: `n${i}` } }); break;
    }
  }
  assert.deepEqual(world(g), before);
});

/** A save written in an older format, from today's state. */
function older(s, version) {
  const o = structuredClone(s);
  o.saveVersion = version;
  delete o.questions;
  delete o.links; delete o.sourceViews;
  for (const h of o.hypotheses) { delete h.title; delete h.against; delete h.status; delete h.statusLog; delete h.alternatives; }
  if (version < 8) delete o.browser;
  return o;
}

for (const version of [8, 7]) {
  test(`a version ${version} save keeps theories, links, notes and evidence and opens as the current version`, async () => {
    const { w, g, ev } = await fixture();
    const h = g.hypothesize({ subject: "mara", predicate: "is_dead", evidence: [ev[0], ev[1]], note: "Check the date" }).id;
    g.note("My own note");
    g.editEvidence(ev[0], { important: true, note: "Odd timing" });
    g.setCases("hypothesis", h, ["quiet_account"]);
    const text = serialize(older(g.s, version));
    assert.equal(JSON.parse(text).saveVersion, version);
    const { state, warnings } = deserialize(w, text);
    assert.deepEqual(warnings.filter(x => /dropped/.test(x)), []);
    assert.equal(state.saveVersion, SAVE_VERSION);
    const t = state.hypotheses.find(x => x.id === h);
    assert.deepEqual([t.evidence, t.against, t.status, t.statusLog, t.alternatives, t.title, t.note, t.cases],
      [[ev[0], ev[1]], [], "open", [{ day: 1, status: "open" }], [], "", "Check the date", ["quiet_account"]]);
    assert.deepEqual(state.questions, []);
    assert.equal(state.notes[0].text, "My own note");
    assert.equal(state.evidence.find(e => e.id === ev[0]).note, "Odd timing");
    assert.equal(state.evidence.find(e => e.id === ev[0]).marks.important, true);
    if (version === 7) assert.ok(Array.isArray(state.browser.bookmarks));
    // The migrated game keeps working with the new actions.
    const g2 = new Game(w, { seed: 7, state });
    g2.link(h, ev[2], true, "contradicts");
    assert.equal(g2.casebook().hypotheses.find(x => x.id === h).againstCount, 1);
    assert.ok(g2.addQuestion({ text: "Why July?", links: { theories: [h] } }).ok);
  });
}

test("a version 9 save round-trips; a theory whose relation disappeared keeps the player's words", async () => {
  const { w, g, ev } = await fixture();
  const a = g.hypothesize({ title: "My words", subject: "mara", predicate: "is_dead", evidence: [ev[0]] }).id;
  const b = g.hypothesize({ title: "Other", against: [ev[1]] }).id;
  g.linkAlternative(a, b); g.setTheoryStatus(b, "rejected");
  g.addQuestion({ text: "Who?", links: { evidence: [ev[1]], theories: [a, b] } });
  assert.deepEqual(deserialize(w, serialize(g.s)).state, JSON.parse(JSON.stringify(g.s)));
  const s = structuredClone(g.s);
  s.hypotheses[0].predicate = "gone_relation";
  const { state } = deserialize(w, serialize(s));
  assert.deepEqual([state.hypotheses[0].title, state.hypotheses[0].predicate, state.hypotheses[0].evidence], ["My words", null, [ev[0]]]);
});
