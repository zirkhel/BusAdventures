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
    assert.deepEqual(c.items.map(x => x.copy), ["Archive copy", "Live page"]);
    assert.ok(c.changes.text.some(x => x.op !== "same"), `${id} changed between the copies`);
  }
});

test("the player's saved copies are their own rows, never folded into Seeker's copy", async () => {
  const { w, g, show } = await game();
  show(ABOUT); g.open(ABOUT);
  const old = g.view(ABOUT).cachedVersions[0];
  g.open(ABOUT, old);
  const live = g.save({ artifact: ABOUT }).id;
  const kept = g.save({ artifact: ABOUT, version: old }).id;
  g.save({ artifact: ABOUT, quote: { text: "Kestrel" } });     // an excerpt belongs in Casebook, not the Archive
  let ar = g.archive(ABOUT);
  assert.deepEqual(ar.entries.map(x => x.kind), ["cached", "saved", "saved", "current"]);
  assert.deepEqual(ar.entries.map(x => x.evidence ?? null), [null, kept, live, null]);
  assert.deepEqual(ar.entries[1].ref, { evidence: kept });
  // Compare with the live page: only from an older, different copy.
  assert.deepEqual(ar.entries.map(x => x.withCurrent), [true, true, false, false]);
  assert.deepEqual(ar.entries.map(x => x.sameAsCurrent), [false, false, true, false]);
  assert.equal(ar.current, 3); assert.equal(ar.noCurrent, null);
  let c = g.compare(archivePair(ar, 1, 3));
  assert.deepEqual(c.items.map(x => x.copy), ["Your saved copy", "Live page"]);
  // Seeker loses its copy: the player's saved one is still there, as their own.
  const v = w.artifacts.get(ABOUT).versions.find(x => x.id === old);
  v.cached = false;
  try {
    ar = g.archive(ABOUT);
    assert.deepEqual(ar.entries.map(x => x.kind), ["saved", "saved", "current"]);
    c = g.compare(archivePair(ar, 0, 2));
    assert.ok(!c.error && c.items.every(x => !x.error));
  } finally { v.cached = true; }
});

test("a saved copy still opens after the original is locked; nothing else of the page shows", async () => {
  const { g, show } = await game();
  const LOCKED = "A24", site = "brightline_portal";
  show(LOCKED);
  const login = g.logins().find(l => l.site === site);
  assert.ok(g.login(site, login.user, login.pass).ok);
  g.open(LOCKED);
  const mine = g.save({ artifact: LOCKED }).id;
  const text = g.evidenceView(mine).text;
  delete g.s.loggedIn[site];                                     // what the rule action "logout" does
  assert.ok(g.view(LOCKED).locked, "the original is locked now");
  const ar = g.archive(LOCKED);
  assert.equal(ar.status, "locked");
  assert.deepEqual(ar.entries.map(x => x.kind), ["saved"], "only the player's own copy");
  assert.deepEqual(ar.entries[0].ref, { evidence: mine });
  assert.equal(ar.current, -1); assert.equal(ar.noCurrent, "locked");
  assert.equal(ar.entries[0].withCurrent, false, "no live page to compare with");
  const v = g.evidenceView(mine);
  assert.ok(!v.error && v.text === text, "the saved copy opens as it was saved");
  const c = g.compare([ar.entries[0].ref, { artifact: LOCKED }]);
  assert.ok(c.items[1].error, "the locked page itself is never compared");
});

test("a saved copy still opens after the original is deleted; no other copy stands in as live", async () => {
  const { g, show } = await game();
  show(TEAM); g.open(TEAM);
  const liveVer = g.view(TEAM).versionId;
  const mine = g.save({ artifact: TEAM }).id;
  g.s.artifacts[TEAM] = { ...g.s.artifacts[TEAM], live: null };   // what the rule action "setLive" with no version does
  assert.equal(g.view(TEAM).error, "deleted");
  const ar = g.archive(TEAM);
  assert.equal(ar.status, "deleted");
  // Seeker also kept the last live version; the player's copy of it is still listed as their own.
  assert.deepEqual(ar.entries.map(x => x.kind), ["cached", "cached", "saved"]);
  assert.deepEqual(ar.entries.slice(1).map(x => x.version), [liveVer, liveVer]);
  assert.ok(!ar.entries.some(x => x.kind === "current"));
  assert.equal(ar.current, -1); assert.equal(ar.noCurrent, "deleted");
  assert.ok(ar.entries.every(x => !x.withCurrent && !x.sameAsCurrent), "nothing is compared 'with current'");
  assert.ok(!g.evidenceView(mine).error, "the saved copy opens");
  // The two copies the player can see still compare with each other.
  const c = g.compare(archivePair(ar, 2, 0));
  assert.ok(!c.error && c.items.every(x => !x.error));
  assert.deepEqual(c.items.map(x => x.copy), ["Archive copy", "Your saved copy"]);
  // Hidden (gone) works the same way.
  g.s.artifacts[TEAM] = { ...g.s.artifacts[TEAM], live: liveVer, visible: false };
  const gone = g.archive(TEAM);
  assert.equal(gone.noCurrent, "gone");
  assert.deepEqual(gone.entries.map(x => x.kind), ["cached", "cached", "saved"]);
  assert.ok(gone.entries.every(x => !x.withCurrent));
});

test("a deleted page keeps its copies; a locked page with no saved copy shows nothing", async () => {
  const { g, show } = await game();
  show(DELETED);
  const vid = g.view(DELETED).cachedVersions[0];
  // The "not available" page already offers Seeker's copy, so its Archive opens before any copy is read.
  assert.deepEqual(g.archive(DELETED).entries.map(x => x.version), [vid]);
  const ar = g.archive(DELETED);
  assert.equal(ar.status, "deleted");
  assert.deepEqual(ar.entries.map(x => x.kind), ["cached"]);
  assert.equal(ar.canCompare, false, "one copy: nothing to compare");
  assert.equal(ar.noCurrent, "deleted");
  assert.ok(ar.title, "the title comes from the copy");
  show("A24"); g.open("A24");
  assert.equal(g.archive("A24").error, "not_seen", "a sign-in page alone is not seeing the page");
  g.s.seen.A24 = 1;                                              // seen once, signed out since, nothing saved
  const locked = g.archive("A24");
  assert.equal(locked.status, "locked");
  assert.deepEqual(locked.entries, []);
  assert.equal(locked.title, "", "not even the title of the page behind the sign-in");
  assert.equal(locked.canCompare, false);
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
    // "Current" is only ever the live page itself, never another copy standing in for it.
    if (ar.current >= 0) assert.deepEqual(ar.entries[ar.current].ref, { artifact: id });
    else assert.ok(ar.entries.every(x => !x.withCurrent) && ar.noCurrent, id);
    for (const x of ar.entries.filter(x => x.withCurrent)) assert.ok(ar.entries.indexOf(x) < ar.current && x.version !== ar.entries[ar.current].version, id);
    for (let i = 0; i + 1 < ar.entries.length; i++) {
      const c = g.compare(archivePair(ar, i, i + 1));
      assert.ok(!c.error && c.items.every(x => !x.error), id);
      pairs++;
    }
  }
  assert.ok(pairs >= 10, `pages with copies to compare (${pairs})`);
  assert.equal(JSON.stringify(g.s), before, "the Archive and the comparison are queries");
});
