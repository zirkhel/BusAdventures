// Casebook step 3: comparison and the player's links between evidence. The comparison lines up
// visible fields and never concludes; links are the player's own claims, read by no rule or score.
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../tools/lib/node-world.mjs";
import { Game, replay } from "../core/game.js";
import { serialize, deserialize } from "../core/save.js";
import { SAVE_VERSION } from "../core/state.js";
import { textChanges } from "../core/compare.js";

const PAGE = "W-kestrel-0005";   // About Kestrel: a current page and a cached 2014 copy

async function fixture() {
  const w = await loadWorld();
  const g = new Game(w, { seed: 7 }); g.start();
  const ev = [];
  for (const id of ["A16", "A54", "A55", PAGE]) { g.s.artifacts[id] = { ...g.s.artifacts[id], visible: true }; g.open(id); ev.push(g.save({ artifact: id }).id); }
  return { w, g, ev };
}

const world = g => structuredClone({ flags: g.s.flags, counters: g.s.counters, trust: g.s.trust, credibility: g.s.credibility,
  fired: g.s.fired, notifications: g.s.notifications, endings: g.s.endings, pending: g.s.pending, messages: g.s.messages, day: g.s.day,
  evidence: g.s.evidence, hypotheses: g.s.hypotheses });

test("save format is version 10", () => assert.equal(SAVE_VERSION, 10));

test("comparison lines up what is visible and says which fields differ", async () => {
  const { g, ev } = await fixture();
  const c = g.compare([{ evidence: ev[1] }, { evidence: ev[2] }]);
  assert.equal(c.items.length, 2);
  for (const it of c.items) {
    assert.equal(it.kind, "page");
    assert.equal(it.copy, "Your saved copy");
    assert.ok(it.title && it.source && it.text !== undefined);
    for (const hidden of ["supports", "mentions", "operatedBy", "truth"]) assert.ok(!(hidden in it), `no ${hidden}`);
    assert.ok(!JSON.stringify(it).includes('"source":"garden"'), "no hidden source key");
  }
  assert.equal(c.differs.source, true, "two persona accounts look like two sources");
  assert.equal(c.samePage, false);
  assert.equal(c.changes, null);
  assert.equal(c.saved, true);
  assert.equal(g.compare([{ evidence: ev[0] }]).error, "need_two");
});

test("two copies of the same page show paragraph changes; only reachable versions can be compared", async () => {
  const { g, w } = await fixture();
  const view = g.view(PAGE);
  const old = view.cachedVersions[0];
  const c = g.compare([{ artifact: PAGE, version: old }, { artifact: PAGE }]);
  assert.deepEqual(c.items.map(x => x.copy), ["Archive copy", "Live page"]);
  assert.equal(c.samePage, true);
  assert.ok(c.changes.text.some(x => x.op !== "same"), "the 2014 copy differs from today's page");
  assert.equal(c.saved, false);
  // A version the player cannot reach is not shown, and nothing unseen can be compared.
  assert.equal(g.compare([{ artifact: PAGE, version: "v1999" }, { artifact: PAGE }]).items[0].error, "not_available");
  // A version that is neither live nor cached stays out of reach, as in the Browser.
  const art = w.artifacts.get(PAGE), v2014 = art.versions.find(v => v.id === old);
  v2014.cached = false;
  assert.equal(g.compare([{ artifact: PAGE, version: old }, { artifact: PAGE }]).items[0].error, "not_available");
  v2014.cached = true;
  const unseen = [...w.artifacts.values()].find(a => g.s.seen[a.id] == null);
  assert.equal(g.compare([{ artifact: unseen.id }, { artifact: PAGE }]).items[0].error, "not_seen");
  assert.deepEqual(textChanges("a\n\nb\n\nc", "a\n\nc\n\nd").map(x => x.op + ":" + x.text), ["same:a", "removed:b", "same:c", "added:d"]);
});

test("images show their caption and image info; messages their sender and day", async () => {
  const { g, w } = await fixture();
  const withImage = [...w.artifacts.values()].find(a => { if (g.s.seen[a.id] == null) return false; const v = g.view(a.id); return !v.error && (v.images || []).length; })
    ?? (() => { const a = [...w.artifacts.values()].find(a => (a.images || []).length && !a.access); g.s.artifacts[a.id] = { visible: true }; g.open(a.id); return a; })();
  const v = g.view(withImage.id);
  const im = g.save({ artifact: withImage.id, version: v.versionId, image: v.images[0] }).id;
  g.dispatch({ type: "message", to: "theo", msg: { kind: "ask", topic: "mara" } });
  const c = g.compare([{ evidence: im }, { artifact: withImage.id, image: v.images[0] }]);
  assert.equal(c.items[0].kind, "image");
  assert.equal(c.items[0].image, v.images[0]);
  assert.deepEqual(c.items[0].imageInfo, { caption: w.images.get(v.images[0]).caption ?? "", meta: w.images.get(v.images[0]).meta ? { ...w.images.get(v.images[0]).meta } : null });
  assert.equal(g.compare([{ evidence: im }, { artifact: withImage.id, image: "NOPE" }]).items[1].error, "image_not_in_artifact");
  const m = g.s.messages.find(x => x.from !== "player");
  if (m) {
    const mc = g.compare([{ message: m.id }, { evidence: im }]);
    assert.equal(mc.items[0].kind, "message");
    assert.equal(mc.items[0].day, m.day);
    assert.ok(!("supports" in mc.items[0]) && !("mentions" in mc.items[0]));
  }
});

test("a link is always exactly two pieces of evidence", async () => {
  const { g, ev } = await fixture();
  assert.equal(g.addLink({ a: ev[0], kind: "related" }).error, "need_two");
  assert.equal(g.addLink({ a: ev[0], b: ev[0], kind: "related" }).error, "need_two", "not with itself");
  assert.equal(g.addLink({ items: [ev[0], ev[1], ev[2]], kind: "related" }).error, "need_two", "no group links");
  assert.equal(g.addLink({ items: [ev[0], ev[1]], kind: "related" }).error, "need_two", "only a and b");
  assert.equal(g.addLink({ a: ev[0], b: "E999", kind: "related" }).error, "unknown_evidence");
  assert.equal(g.addLink({ a: ev[0], b: ev[1], kind: "proves" }).error, "bad_kind");
  assert.deepEqual(g.s.links, []);
  const id = g.addLink({ a: ev[0], b: ev[1], kind: "related" }).id;
  assert.deepEqual(Object.keys(g.s.links[0]).sort(), ["a", "b", "day", "id", "kind", "note"]);
  assert.equal(g.editLink(id, { a: ev[2], items: [ev[2]] }).ok, true, "patch cannot change the pair");
  assert.deepEqual([g.s.links[0].a, g.s.links[0].b], [ev[0], ev[1]]);
});

test("links: six kinds, direction for supports and possibly manipulated, one per pair, kind and direction", async () => {
  const { g, w, ev } = await fixture();
  const kinds = ["supports", "contradicts", "related", "same_origin", "manipulated", "unrelated"];
  const ids = kinds.map(kind => g.addLink({ a: ev[1], b: ev[2], kind }).id);
  assert.equal(new Set(ids).size, 6);
  assert.deepEqual(g.casebook().links.map(l => l.directed), [true, false, false, false, true, false]);
  // Undirected: b–a is the same link as a–b (a new reason replaces the old one).
  for (const [i, kind] of kinds.entries()) if (!["supports", "manipulated"].includes(kind)) {
    const again = g.addLink({ a: ev[2], b: ev[1], kind, note: "Both only repost" });
    assert.deepEqual([again.duplicate, again.id], [true, ids[i]], kind);
  }
  assert.equal(g.casebook().links.find(l => l.id === ids[3]).note, "Both only repost");
  assert.equal(g.addLink({ a: ev[1], b: ev[2], kind: "supports" }).duplicate, true, "same direction is the same link");
  // Directed: the other way round is a different claim and a different link.
  const back = g.addLink({ a: ev[2], b: ev[1], kind: "supports" });
  assert.ok(back.ok && !back.duplicate && back.id !== ids[0]);
  const ref = g.addLink({ a: ev[2], b: ev[1], kind: "manipulated", note: "Cropped?" });
  assert.ok(ref.ok && !ref.duplicate);
  const sup = g.casebook().links.find(l => l.id === ids[0]);
  assert.deepEqual([sup.a, sup.b], [ev[1], ev[2]], "a supports b, in the order given");
  // Swapping a directed link onto an existing one is refused; an undirected swap is just the same link.
  assert.equal(g.editLink(ids[0], { swap: true }).error, "duplicate_link");
  g.removeLink(back.id);
  assert.equal(g.editLink(ids[0], { swap: true }).ok, true);
  assert.deepEqual([g.s.links.find(l => l.id === ids[0]).a, g.s.links.find(l => l.id === ids[0]).b], [ev[2], ev[1]]);
  assert.equal(g.editLink(ids[2], { swap: true }).ok, true, "undirected swap is harmless");
  // Changing the kind follows the same rule.
  assert.equal(g.editLink(ids[0], { kind: "contradicts" }).error, "duplicate_link", "contradicts already exists, either way round");
  g.removeLink(ids[1]);
  assert.equal(g.editLink(ids[0], { kind: "contradicts", note: "Dates don't match" }).ok, true);
  assert.equal(g.casebook().links.find(l => l.id === ids[0]).kind, "contradicts");
  assert.equal(g.editLink(ids[5], { kind: "manipulated" }).error, "duplicate_link", "A suspected against B exists");
  assert.equal(g.editLink(ids[5], { kind: "manipulated", swap: true }).error, "duplicate_link", "so does B suspected against A");
  g.removeLink(ref.id);
  assert.equal(g.editLink(ids[5], { kind: "manipulated", swap: true }).ok, true);
  // The comparison shows links whose two ends are both compared.
  const other = g.addLink({ a: ev[0], b: ev[1], kind: "related" }).id;
  assert.equal(g.compare([{ evidence: ev[1] }, { evidence: ev[2] }]).links.length, g.s.links.length - 1);
  assert.equal(g.compare([{ evidence: ev[0] }, { evidence: ev[1] }, { evidence: ev[2] }]).links.length, g.s.links.length);
  // A removed piece of evidence takes its links with it.
  g.dispatch({ type: "removeEvidence", id: ev[2] });
  assert.deepEqual(g.casebook().links.map(l => l.id), [other]);
  const r = replay(w, { seed: 7 }, g.s.log);
  assert.deepEqual(r.s.links, g.s.links, "links replay exactly");
});

test("links and comparisons never change the world", async () => {
  const { g, ev } = await fixture();
  const before = world(g);
  let seed = 5;
  const rnd = n => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
  const kinds = ["supports", "contradicts", "related", "same_origin", "manipulated", "unrelated"];
  for (let i = 0; i < 300; i++) {
    const a = ev[rnd(ev.length)], b = ev[rnd(ev.length)];
    switch (rnd(4)) {
      case 0: g.addLink({ a, b, kind: kinds[rnd(6)], note: rnd(2) ? `n${i}` : "" }); break;
      case 1: if (g.s.links.length) g.editLink(g.s.links[rnd(g.s.links.length)].id, { kind: kinds[rnd(6)], swap: !!rnd(2) }); break;
      case 2: if (g.s.links.length) g.removeLink(g.s.links[rnd(g.s.links.length)].id); break;
      case 3: g.compare([{ evidence: a }, { evidence: b }, { artifact: PAGE }]); break;
    }
  }
  assert.deepEqual(world(g), before);
});

function older(s, version) {
  const o = structuredClone(s);
  o.saveVersion = version;
  delete o.links;
  if (version < 9) { delete o.questions; for (const h of o.hypotheses) { delete h.title; delete h.against; delete h.status; delete h.statusLog; delete h.alternatives; } }
  if (version < 8) delete o.browser;
  return o;
}

for (const version of [9, 8, 7]) {
  test(`a version ${version} save opens as version 10 with no links and everything else intact`, async () => {
    const { w, g, ev } = await fixture();
    const h = g.hypothesize({ subject: undefined, title: "Same people", evidence: [ev[1], ev[2]] }).id;
    if (version === 9) g.addQuestion({ text: "Who runs these?", links: { evidence: [ev[1]] } });
    g.editEvidence(ev[1], { important: true, note: "Same wording" });
    const before = JSON.parse(JSON.stringify(g.s));
    const { state, warnings } = deserialize(w, serialize(older(g.s, version)));
    assert.deepEqual(warnings.filter(x => /dropped/.test(x)), []);
    assert.equal(state.saveVersion, 10);
    assert.deepEqual(state.links, []);
    assert.deepEqual(state.evidence, before.evidence);
    assert.deepEqual(state.hypotheses.find(x => x.id === h).evidence, [ev[1], ev[2]]);
    if (version === 9) assert.equal(state.questions[0].text, "Who runs these?");
    const g2 = new Game(w, { seed: 7, state });
    assert.ok(g2.addLink({ a: ev[1], b: ev[2], kind: "same_origin" }).ok);
  });
}

test("a version 10 save round-trips links with their direction; broken, duplicate and group links are cleaned", async () => {
  const { w, g, ev } = await fixture();
  g.addLink({ a: ev[0], b: ev[1], kind: "contradicts", note: "Dates" });
  g.addLink({ a: ev[1], b: ev[0], kind: "supports" });
  g.addLink({ a: ev[0], b: ev[1], kind: "supports" });
  assert.deepEqual(deserialize(w, serialize(g.s)).state, JSON.parse(JSON.stringify(g.s)));
  const s = structuredClone(g.s);
  s.links.push(
    { id: "L900", a: ev[0], b: "E404", kind: "related", note: "", day: 1 },
    { id: "L901", a: ev[0], b: ev[1], kind: "weird", note: "", day: 1 },
    { id: "L902", a: ev[1], b: ev[0], kind: "contradicts", note: "", day: 1 },     // same as the first, other way round
    { id: "L903", a: ev[1], b: ev[1], kind: "related", note: "", day: 1 },
    { id: "L904", items: [ev[0], ev[1], ev[2]], kind: "related", note: "", day: 1 }); // group links are not a thing
  const { state, warnings } = deserialize(w, serialize(s));
  assert.deepEqual(state.links.map(l => l.id), g.s.links.map(l => l.id));
  for (const id of ["L900", "L901", "L902", "L903", "L904"]) assert.ok(warnings.includes(`dropped link ${id}`), id);
});
