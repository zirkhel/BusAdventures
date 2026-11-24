// Seeker forgives like a real search engine: stems, small typos and a partial-match fallback.
// It never ranks by what matters to a case, and a near miss never reveals what the exact
// words would not.
//   node --test games/dead-internet/tests/*.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../tools/lib/node-world.mjs";
import { Game } from "../core/game.js";
import { editDistance, stems, search } from "../core/search.js";

const world = await loadWorld();
const fresh = () => { const g = new Game(world, { seed: 1 }); g.start(); return g; };
const ids = r => r.map(x => x.artifact);

test("edit distance counts swaps as one typo and stops early", () => {
  assert.equal(editDistance("brightline", "brigthline", 2), 1);
  assert.equal(editDistance("northgate", "nortgate", 1), 1);
  assert.equal(editDistance("kestrel", "kestral", 1), 1);
  assert.equal(editDistance("library", "harbour", 1), 2);
});

test("light stems: plurals, -ing and -ed", () => {
  assert.ok(stems("voting").includes("vote"));
  assert.ok(stems("posted").includes("post"));
  assert.ok(stems("accounts").includes("account"));
  assert.deepEqual(stems("vote"), ["vote"]);
});

test("a small typo in a longer word finds the same live pages", () => {
  const g = fresh();
  const right = new Set(ids(search(g, "Brightline")));
  const typo = ids(search(g, "Brigthline"));
  assert.ok(typo.length > 0);
  for (const id of typo) assert.ok(right.has(id), `${id} only found through the typo`);
});

test("short words get no typo tolerance", () => {
  const g = fresh();
  assert.deepEqual(ids(search(g, "Mzra")), []);
});

test("many words: pages with most of them, or a marked partial fallback", () => {
  const g = fresh();
  const r = search(g, "mara quinn librarian bicycle crash");
  assert.ok(r.length > 0 && r.every(x => !x.partial));
  const p = search(g, "zzqx yyqw mill");
  assert.ok(p.length > 0, "fallback finds pages with some of the words");
  assert.ok(p.every(x => x.partial && !x.cached && (world.artifacts.get(x.artifact).index || "full") === "full"));
});

test("typos and the fallback never reach hidden, cached, weak or exact pages", () => {
  const g = fresh();
  const mutate = w => w.length >= 5 ? w.slice(0, 2) + w[3] + w[2] + w.slice(4) : null;
  for (const a of world.artifacts.values()) {
    const level = a.index || "full";
    if (level === "full" || level === "none") continue;
    for (const kw of a.keywords || []) {
      const words = String(kw).toLowerCase().split(/\s+/);
      const typo = words.map(w => mutate(w) ?? w).join(" ");
      if (typo === String(kw).toLowerCase()) continue;
      assert.ok(!ids(search(g, typo)).includes(a.id), `${a.id} (${level}) found by the typo "${typo}"`);
    }
  }
  for (const q of ["Brigthline", "nortgate developement", "zzqx yyqw mill", "eastfield libary"]) {
    for (const x of search(g, q)) {
      const a = world.artifacts.get(x.artifact);
      if (x.partial || !search(g, q.replace(/brigthline/i, "brightline")).length) assert.equal(a.index || "full", "full", `${q} → ${x.artifact}`);
    }
  }
});

test("the vote date is in natural content from day 1", () => {
  const g = fresh();
  assert.deepEqual(g.deadlines(), []);
  const r = search(g, "week ahead");
  assert.ok(ids(r).includes("DR-2026-0085"));
  g.open("DR-2026-0085");
  assert.deepEqual(g.deadlines().map(d => d.id), ["waterfront_vote"]);
});
