// Casebook step 5, point 9 (Anders, 25.11.2026): can a player learn hidden canon by asking Dana or
// by publishing through The Daily Record?
//
// A player who trusts her enough can build any claim they can name, link one piece of evidence at
// a time and ask her, as often as they like. tools/lib/dana-probe.mjs records every answer, and
// what a real publish does (refused or not, her lines, what was cut and what went out). Here it
// runs in twin worlds that differ only in hidden canon: truth and facts, `supports` (also the copies
// in saved messages, and shuffled between claims), `mentions` (empty and full, also where an alias
// is in the text), the claim list (gone, or decoys with their own wording), hidden origin, and
// hidden people with matching initials (added or removed). Any difference fails the suite.
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../tools/lib/node-world.mjs";
import { probe, twins, differences } from "../tools/lib/dana-probe.mjs";
import { Game } from "../core/game.js";

const real = probe(await loadWorld());

test("the probe asks Dana about every canonical claim and one extra claim per predicate, with every saved piece", () => {
  assert.equal(real.triples.length, 13 + 8);
  assert.ok(real.evidence.length > 500, `${real.evidence.length} pieces`);
  assert.ok(Object.keys(real.single).length > 10000);
  // Both outcomes occur, so the comparison covers cuts, refusals and what goes out.
  const outcomes = Object.values(real.all).flatMap(a => [a.plain.publish, a.linked.publish]);
  assert.ok(outcomes.some(p => p.refused) && outcomes.some(p => p.published), "some publish, some refused");
});

test("a refused publish leaves the game state as it was", () => {
  assert.deepEqual(real.refusalChangedState, []);
});

for (const name of Object.keys(twins)) {
  test(`Dana's review, refusal and cut are identical in the "${name}" twin (hidden canon only)`, async () => {
    const twin = probe(await loadWorld(), twins[name]);
    const d = differences(real, twin);
    const first = d.single[0] ?? d.all[0] ?? d.mine[0] ?? d.evidence[0];
    assert.deepEqual(d, { single: [], all: [], mine: [], evidence: [] },
      `first difference: ${first}\n  real: ${JSON.stringify(real.single[first] ?? real.all[first] ?? real.mine[first])}\n  twin: ${JSON.stringify(twin.single[first] ?? twin.all[first] ?? twin.mine[first])}`);
  });
}

// ── False claims pass on the same visible terms as true ones (Anders, 25.11.2026) ─────────────

/** A fresh game with the given pages saved and the theory built: returns Dana's line and the publish. */
function attempt(w, claim, pages, links) {
  const g = new Game(w, { seed: 7 });
  g.start();
  const ids = {};
  for (const a of pages) {
    g.s.artifacts[a] = { ...g.s.artifacts[a], visible: true };
    const o = g.open(a);
    g.save({ artifact: a, version: o.view?.versionId });
    ids[a] = g.s.evidence.at(-1).id;
  }
  for (const id of [claim.subject, claim.object].filter(Boolean)) g.s.known[id] = true;
  for (const [a, b] of links) g.addLink({ a: ids[a], b: ids[b], kind: "supports" });
  g.s.trust.dana = 99;
  const h = g.hypothesize({ ...claim, evidence: pages.map(a => ids[a]) });
  const label = g.hypothesisLabel(g.s.hypotheses.find(x => x.id === h.id));
  const line = g.review("daily_record", [h.id]).lines[0].text.replace(`"${label}"`, "{claim}");
  const r = g.publish("daily_record", [h.id]);
  return { line, refused: !!r.refused, published: (r.report?.items ?? []).length };
}

const S2 = { subject: "brightline", predicate: "operates", object: "acc_maraquinn" };
const F2 = { subject: "theo", predicate: "operates", object: "acc_maraquinn" };
// Each pair: a page that visibly names only the first party, and an @maraquinn post naming only the account.
const S2pages = ["A19", "A47"], F2pages = ["A06", "A47"];

test("F2 (false) and S2 (true) with the same visible structure get the same line and the same outcome", async () => {
  const w = await loadWorld();
  for (const [links, expect] of [[[], "refused"], [[[0, 1]], "refused"], [[[0, 1], [1, 0]], "published"]]) {
    const s2 = attempt(w, S2, S2pages, links.map(([a, b]) => [S2pages[a], S2pages[b]]));
    const f2 = attempt(w, F2, F2pages, links.map(([a, b]) => [F2pages[a], F2pages[b]]));
    assert.equal(f2.line, s2.line, `same words with ${links.length} links`);
    assert.equal(s2.refused, expect === "refused"); assert.equal(f2.refused, expect === "refused");
    if (expect === "published") { assert.equal(s2.published, 1); assert.equal(f2.published, 1); }
  }
});

test("the outcome does not change when the hidden truth of S2 and F2 is swapped", async () => {
  const w = await loadWorld();
  const before = [attempt(w, S2, S2pages, [["A19", "A47"], ["A47", "A19"]]), attempt(w, F2, F2pages, [["A06", "A47"], ["A47", "A06"]])];
  const w2 = await loadWorld();
  w2.claims.get("S2").truth = "false"; w2.claims.get("F2").truth = "true";
  const after = [attempt(w2, S2, S2pages, [["A19", "A47"], ["A47", "A19"]]), attempt(w2, F2, F2pages, [["A06", "A47"], ["A47", "A06"]])];
  assert.deepEqual(after, before);
});
