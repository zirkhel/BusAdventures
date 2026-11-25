// Casebook step 5, point 9 (Anders, 25.11.2026): can a player learn hidden canon by asking Dana?
//
// A player who trusts her enough can build any claim they can name, link one piece of evidence at
// a time and ask her, as often as they like. tools/lib/dana-probe.mjs records every answer. Here
// it runs in twin worlds that differ only in hidden canon: everything the player reads is the same.
//
// Finding (25.11.2026): her comment does not read truth, but it does read the hidden `supports`
// tags through matchClaim/apparentSupportOf (core/casebook.js), and so does the Daily Record cut.
// That is a relevance answer key. Anders decides what to do (DEVPLAN, Steg 5, punkt 9); until then
// the supports twin is a todo test: it reports the leak without failing the suite. When a fix
// lands, remove `todo` and the test must pass.
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../tools/lib/node-world.mjs";
import { probe, twins, differences } from "../tools/lib/dana-probe.mjs";

const real = probe(await loadWorld());
const truthTwin = probe(await loadWorld(), twins.truth);
const supportsTwin = probe(await loadWorld(), twins.supports);

test("the probe asks Dana about every canonical claim with every saved piece of evidence", () => {
  assert.equal(real.triples.length, 13);
  assert.ok(real.evidence.length > 500, `${real.evidence.length} pieces`);
  assert.ok(Object.keys(real.single).length > 6000);
});

test("Dana never reveals truth: worlds that differ only in what is true get the same answers and cuts", () => {
  assert.deepEqual(differences(real, truthTwin), { single: [], all: [], mine: [] });
});

test("the step 5 notes and report snapshots never depend on hidden support", () => {
  assert.deepEqual(differences(real, supportsTwin).mine, []);
});

test("Dana never reveals which evidence is tagged as backing a claim (hidden supports)", { todo: "point 9: awaiting Anders' decision (DEVPLAN Steg 5)" }, () => {
  const d = differences(real, supportsTwin);
  assert.deepEqual({ single: d.single.length, all: d.all.length }, { single: 0, all: 0 },
    `${d.single.length} single-evidence answers and ${d.all.length} all-evidence answers/cuts differ, e.g. ${d.single.slice(0, 3).join(", ")}`);
});
