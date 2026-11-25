// W8: Browser's Archive lists every copy of one address the player can open (Seeker's cached
// copies, the current page, their own saved copies), oldest first, and hands two of them to the
// Casebook comparison. It only reads what the player could already open, and changes nothing.
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../tools/lib/node-world.mjs";
import { Game } from "../core/game.js";
import { archivePair } from "../core/archive.js";

const ABOUT = "W-kestrel-0005";     // About Kestrel: current page and a cached 2014 copy
const TEAM = "A20";                 // Brightline Team: current page and a cached 2024 copy
const DELETED = "DR-2025-0418";     // a Daily Record story that was deleted; one cached copy

async function game() {
  const w = await loadWorld();
  const g = new Game(w, { seed: 7 }); g.start();
  const show = id => { g.s.artifacts[id] = { ...g.s.artifacts[id], visible: true }; };
  return { w, g, show };
}

test("the Archive is for pages the player has seen", async () => {
  const { g, show } = await game();
  show(ABOUT);
  assert.equal(g.archive(ABOUT).error, "not_seen");
  assert.equal(g.archive("nope").error, "unknown");
  g.open(ABOUT);
  assert.ok(!g.archive(ABOUT).error);
});

test("copies are listed oldest first, and two of them compare in Casebook", async () => {
  const { g, show } = await game();
  for (const id of [ABOUT, TEAM]) {
    show(id); g.open(id);
    const ar = g.archive(id);
    assert.equal(ar.status, "live");
    assert.deepEqual(ar.entries.map(x => x.kind), ["cached", "current"], id);
    assert.ok(ar.entries[0].date < ar.entries[1].date, "oldest first");
    assert.equal(ar.canCompare, true);
    assert.deepEqual(ar.entries[1].ref, { artifact: id });
    assert.deepEqual(ar.entries[0].ref, { artifact: id, version: g.view(id).cachedVersions[0] });
    // The pair is always oldest first, whichever order the player ticked them in.
    const refs = archivePair(ar, 1, 0);
    assert.deepEqual(refs, [ar.entries[0].ref, ar.entries[1].ref]);
    const c = g.compare(refs);
    assert.ok(!c.error && c.items.every(x => !x.error), id);
    assert.equal(c.samePage, true);
    assert.deepEqual(c.items.map(x => x.copy), ["Cached copy", "Current page"]);
    assert.ok(c.changes.text.some(x => x.op !== "same"), `${id} changed between the copies`);
  }
});

test("saved copies are marked, and a saved copy that is no longer anywhere else is listed", async () => {
  const { w, g, show } = await game();
  show(ABOUT); g.open(ABOUT);
  const old = g.view(ABOUT).cachedVersions[0];
  g.open(ABOUT, old);
  const live = g.save({ artifact: ABOUT }).id;
  const kept = g.save({ artifact: ABOUT, version: old }).id;
  g.save({ artifact: ABOUT, quote: { text: "Kestrel" } });     // an excerpt is not a copy of the page
  let ar = g.archive(ABOUT);
  assert.equal(ar.entries.length, 2);
  assert.deepEqual(ar.entries.map(x => x.saved), [[kept], [live]]);
  // Seeker loses its copy: the player's saved one is still there, as their own.
  const v = w.artifacts.get(ABOUT).versions.find(x => x.id === old);
  v.cached = false;
  try {
    ar = g.archive(ABOUT);
    assert.deepEqual(ar.entries.map(x => x.kind), ["saved", "current"]);
    assert.deepEqual(ar.entries[0].ref, { evidence: kept });
    const c = g.compare(archivePair(ar, 0, 1));
    assert.ok(!c.error && c.items.every(x => !x.error));
    assert.deepEqual(c.items.map(x => x.copy), ["Saved copy", "Current page"]);
  } finally { v.cached = true; }
});

test("a deleted page keeps its copies; a page behind a sign-in shows none", async () => {
  const { g, show } = await game();
  show(DELETED);
  const vid = g.view(DELETED).cachedVersions[0];
  g.open(DELETED, vid);
  const ar = g.archive(DELETED);
  assert.equal(ar.status, "deleted");
  assert.deepEqual(ar.entries.map(x => x.kind), ["cached"]);
  assert.equal(ar.canCompare, false, "one copy: nothing to compare");
  assert.ok(ar.title, "the title comes from the copy");
  show("A24"); g.open("A24");
  assert.equal(g.archive("A24").error, "not_seen", "a sign-in page alone is not seeing the page");
  g.s.seen.A24 = 1;                                              // seen once, signed out since
  const locked = g.archive("A24");
  assert.equal(locked.status, "locked");
  assert.deepEqual(locked.entries, []);
});

test("the Archive only offers what the player can open, and changes nothing", async () => {
  const { w, g, show } = await game();
  for (const a of w.artifacts.values()) { if (w.disabled?.has(a.id)) continue; show(a.id); g.open(a.id); }
  const before = JSON.stringify(g.s);
  let pairs = 0;
  for (const id of Object.keys(g.s.seen)) {
    const ar = g.archive(id);
    if (ar.error) continue;
    for (const x of ar.entries) {
      if (x.kind === "cached") assert.ok(!g.view(id, x.version).error, `${id} ${x.version} can be opened`);
      if (x.kind === "current") assert.equal(g.view(id).versionId, x.version);
    }
    for (let i = 0; i + 1 < ar.entries.length; i++) {
      const c = g.compare(archivePair(ar, i, i + 1));
      assert.ok(!c.error && c.items.every(x => !x.error), id);
      pairs++;
    }
  }
  assert.ok(pairs >= 10, `pages with copies to compare (${pairs})`);
  assert.equal(JSON.stringify(g.s), before, "the Archive and the comparison are queries");
});
