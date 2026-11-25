// Casebook step 4: source assessment. A source card per visible source (the keys a step 2
// question links to): do I trust it, is it who it claims to be, "same origin as", a comment.
// The player's own count of independent sources follows their answers and their "Same origin"
// links. All of it is the player's; no rule, score, reviewer or ending reads it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../tools/lib/node-world.mjs";
import { Game, replay } from "../core/game.js";
import { serialize, deserialize } from "../core/save.js";
import { SAVE_VERSION } from "../core/state.js";
import { supportOf, apparentSupportOf } from "../core/casebook.js";

const TRUTH = "account:acc_truthseeker", MIKE = "account:acc_mike", PAT = "account:acc_pat", KESTREL = "site:kestrel-logistics.com";

async function fixture() {
  const w = await loadWorld();
  const g = new Game(w, { seed: 7 }); g.start();
  const ev = [];
  for (const id of ["A16", "A54", "A55", "W-kestrel-0005"]) { g.s.artifacts[id] = { ...g.s.artifacts[id], visible: true }; g.open(id); ev.push(g.save({ artifact: id }).id); }
  return { w, g, ev };
}

const world = g => structuredClone({ flags: g.s.flags, counters: g.s.counters, trust: g.s.trust, credibility: g.s.credibility,
  fired: g.s.fired, notifications: g.s.notifications, endings: g.s.endings, pending: g.s.pending, messages: g.s.messages, day: g.s.day,
  evidence: g.s.evidence, hypotheses: g.s.hypotheses, links: g.s.links, questions: g.s.questions, known: g.s.known });

test("save format is version 11", () => assert.equal(SAVE_VERSION, 11));

test("a source card starts empty, and only the player fills it in", async () => {
  const { g, ev } = await fixture();
  assert.deepEqual(g.sources().map(s => s.key).sort(), [TRUTH, MIKE, PAT, KESTREL].sort());
  const c = g.sourceCard(MIKE);
  assert.deepEqual([c.label, c.evidence, c.trust, c.authentic, c.note, c.sameAs, c.viaLinks, c.group, c.assessed],
    ["Mike", [ev[1]], null, null, "", [], [], [], false]);
  assert.equal(g.sourceCard("account:acc_nobody").error, "unknown_source", "only sources the player can see");
  assert.equal(g.assessSource("account:acc_nobody", { trust: "yes" }).error, "unknown_source");
  assert.equal(g.assessSource(MIKE, { trust: "maybe" }).error, "bad_answer");
  assert.ok(g.assessSource(MIKE, { trust: "unsure", authentic: "no", note: "Only reposts" }).ok);
  let m = g.sourceCard(MIKE);
  assert.deepEqual([m.trust, m.authentic, m.note, m.assessed, m.day], ["unsure", "no", "Only reposts", true, 1]);
  // An answer can be taken back: "not answered" again.
  g.assessSource(MIKE, { trust: null });
  m = g.sourceCard(MIKE);
  assert.deepEqual([m.trust, m.authentic], [null, "no"]);
});

test("the player's own count follows their 'same origin' answers and links, and nothing else", async () => {
  const { g, ev } = await fixture();
  const h = g.hypothesize({ title: "The three are one voice", evidence: [ev[0], ev[1], ev[2]] }).id;
  const hy = () => g.casebook().hypotheses.find(x => x.id === h);
  assert.deepEqual([hy().sourceCount, hy().ownSourceCount], [3, 3]);
  // On the source card: Mike has the same origin as Pat (both ways).
  assert.ok(g.linkSources(MIKE, PAT).ok);
  assert.deepEqual(g.sourceCard(PAT).sameAs.map(x => x.key), [MIKE]);
  assert.deepEqual([hy().sourceCount, hy().ownSourceCount], [3, 2], "visible count unchanged; the player's own count merges");
  // A "Same origin" link between two pieces of evidence merges their visible sources too.
  g.addLink({ a: ev[2], b: ev[0], kind: "same_origin" });
  assert.equal(hy().ownSourceCount, 1);
  assert.deepEqual(g.sourceCard(TRUTH).viaLinks.map(x => x.key), [PAT]);
  assert.deepEqual(g.sourceCard(TRUTH).group.map(x => x.key).sort(), [MIKE, PAT].sort(), "groups are transitive");
  // Other link kinds and trust answers never change the count.
  g.addLink({ a: ev[0], b: ev[1], kind: "related" });
  g.assessSource(TRUTH, { trust: "no", authentic: "no" });
  assert.equal(hy().ownSourceCount, 1);
  assert.deepEqual([hy().notTrustedFor, hy().notAuthenticFor], [1, 1], "the player's own reservations are counted, not judged");
  // Undo both.
  g.linkSources(PAT, MIKE, false);
  g.removeLink(g.s.links.find(l => l.kind === "same_origin").id);
  assert.deepEqual([hy().sourceCount, hy().ownSourceCount], [3, 3]);
  assert.deepEqual(g.sourceCard(MIKE).sameAs, []);
  assert.equal(g.linkSources(MIKE, MIKE).error, "same_source");
  assert.equal(g.linkSources(MIKE, "account:acc_nobody").error, "unknown_source");
});

test("questions linked to a source (step 2) show on its card", async () => {
  const { g } = await fixture();
  const q = g.addQuestion({ text: "Who runs Mike?", links: { sources: [MIKE] } }).id;
  g.addQuestion({ text: "Elsewhere", links: { sources: [PAT] } });
  assert.deepEqual(g.sourceCard(MIKE).questions, [q]);
});

test("a card stays when its evidence is removed, and shows again with the source", async () => {
  const { g, ev } = await fixture();
  g.assessSource(PAT, { trust: "no", note: "Same photos as Mike" });
  g.linkSources(PAT, MIKE);
  g.dispatch({ type: "removeEvidence", id: ev[2] });
  assert.equal(g.sourceCard(PAT).error, "unknown_source");
  assert.deepEqual(g.sourceCard(MIKE).sameAs, [], "a source the player can't see now isn't listed");
  assert.equal(g.s.sourceViews[PAT].note, "Same photos as Mike", "but the player's words are kept");
  g.save({ artifact: "A55" });
  assert.deepEqual([g.sourceCard(PAT).trust, g.sourceCard(MIKE).sameAs.map(x => x.key)], ["no", [PAT]]);
});

test("source cards never change the world, the reviewer or support", async () => {
  const { g, ev } = await fixture();
  const h = g.hypothesize({ subject: "mara", predicate: "is_dead", evidence: [ev[0], ev[1], ev[2]] }).id;
  const hyp = g.s.hypotheses.find(x => x.id === h);
  const before = world(g);
  const review = JSON.stringify(g.review("daily_record", [h]));
  const sup = JSON.stringify([supportOf(g, hyp), apparentSupportOf(g, hyp)]);
  g.assessSource(MIKE, { trust: "no", authentic: "no", note: "Fake" });
  g.assessSource(TRUTH, { trust: "yes", authentic: "yes" });
  g.linkSources(MIKE, PAT); g.linkSources(PAT, TRUTH);
  const after = world(g);
  assert.deepEqual(after, before);
  assert.equal(JSON.stringify(g.review("daily_record", [h])), review, "Dana reads no source card (step 5 decides)");
  assert.equal(JSON.stringify([supportOf(g, hyp), apparentSupportOf(g, hyp)]), sup);
  const r = replay(g.w, { seed: 7 }, g.s.log);
  assert.deepEqual(r.s.sourceViews, g.s.sourceViews, "source cards replay exactly");
});

test("publishing gives the same result with or without source cards", async () => {
  const run = async assess => {
    const { g, ev } = await fixture();
    const h = g.hypothesize({ subject: "mara", predicate: "is_dead", evidence: [ev[0], ev[1], ev[2]] }).id;
    if (assess) { g.assessSource(MIKE, { trust: "no" }); g.linkSources(MIKE, PAT); g.linkSources(PAT, TRUTH); }
    const r = g.publish("daily_record", [h]);
    return JSON.stringify({ r, flags: g.s.flags, cred: g.s.credibility, trust: g.s.trust, endings: g.s.endings, notes: g.s.notifications, msgs: g.s.messages.length });
  };
  assert.equal(await run(true), await run(false));
});

/** An older save from today's state. */
function older(s, version) {
  const o = structuredClone(s);
  o.saveVersion = version;
  delete o.sourceViews;
  if (version < 10) delete o.links;
  if (version < 9) { delete o.questions; for (const h of o.hypotheses) { delete h.title; delete h.against; delete h.status; delete h.statusLog; delete h.alternatives; } }
  if (version < 8) delete o.browser;
  return o;
}

for (const version of [10, 9, 8, 7]) {
  test(`a version ${version} save opens as version 11 with empty source cards and everything else intact`, async () => {
    const { w, g, ev } = await fixture();
    if (version >= 10) g.addLink({ a: ev[1], b: ev[2], kind: "same_origin" });
    g.editEvidence(ev[1], { important: true, note: "Same wording" });
    const before = JSON.parse(JSON.stringify(g.s));
    const { state, warnings } = deserialize(w, serialize(older(g.s, version)));
    assert.deepEqual(warnings.filter(x => /dropped/.test(x)), []);
    assert.equal(state.saveVersion, 11);
    assert.deepEqual(state.sourceViews, {});
    assert.deepEqual(state.evidence, before.evidence);
    if (version >= 10) assert.deepEqual(state.links, before.links);
    const g2 = new Game(w, { seed: 7, state });
    assert.ok(g2.assessSource(MIKE, { trust: "unsure" }).ok);
    // A migrated "Same origin" link counts in the player's own count straight away.
    const h = g2.hypothesize({ title: "x", evidence: [ev[1], ev[2]] }).id;
    assert.equal(g2.casebook().hypotheses.find(x => x.id === h).ownSourceCount, version >= 10 ? 1 : 2);
  });
}

test("a version 11 save round-trips source cards; bad answers and one-sided 'same as' are cleaned", async () => {
  const { w, g } = await fixture();
  g.assessSource(MIKE, { trust: "yes", authentic: "unsure", note: "Local dad" });
  g.linkSources(MIKE, PAT);
  assert.deepEqual(deserialize(w, serialize(g.s)).state, JSON.parse(JSON.stringify(g.s)));
  const s = structuredClone(g.s);
  s.sourceViews[TRUTH] = { trust: "certainly", authentic: "no", sameAs: [TRUTH, KESTREL, 7], note: 3, day: 2 };
  s.sourceViews.junk = "x";
  const { state } = deserialize(w, serialize(s));
  assert.deepEqual(state.sourceViews[TRUTH], { trust: null, authentic: "no", sameAs: [KESTREL], note: "3", day: 2 });
  assert.deepEqual(state.sourceViews[KESTREL].sameAs, [TRUTH], "'same as' is mended to go both ways");
  assert.equal("junk" in state.sourceViews, false);
});
