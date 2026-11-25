// Punkt 9 (25.11.2026): tips one at a time, "Show intro tips again", tips on in a new game,
// preferences kept across loading and restarts, Casebook help, and no leaks in help texts.
//   node --test --test-concurrency=1 games/dead-internet/tests/tips-help.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { TipFlow, defaultPrefs, loadPrefs, savePrefs, resetSeen, newGamePrefs, TIPS_KEY } from "../app/tips-state.js";
import { loadWorld } from "../tools/lib/node-world.mjs";
import { Game } from "../core/game.js";
import { serialize, deserialize } from "../core/save.js";

const world = await loadWorld();

function memStore() { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), m }; }
const ready = () => ({ ...defaultPrefs(), introDone: true });

test("Show intro tips again only clears which tips were seen", () => {
  const p = { off: true, seen: ["read", "save", "theory"], introDone: true };
  assert.deepEqual(resetSeen(p), { off: true, seen: [], introDone: true });
  const st = memStore();
  const f = new TipFlow({ ...p, seen: [...p.seen] }, q => savePrefs(st, q));
  f.resetSeen();
  assert.deepEqual(loadPrefs(st), { off: true, seen: [], introDone: true }, "on/off and the introduction are untouched");
  assert.equal(f.current, null, "nothing is shown by the reset itself");
});

test("after a reset, tips come back one at a time, only where the mechanic is used", () => {
  const f = new TipFlow({ ...ready(), seen: ["read", "link", "review"] });
  f.resetSeen();
  assert.equal(f.current, null);
  const reportScreen = { kind: "report" };
  assert.equal(f.offer("report", reportScreen), "shown");
  assert.equal(f.offer("review", reportScreen), "queued", "a second tip waits; never two on screen");
  assert.equal(f.current, "report");
  assert.deepEqual(f.p.seen, ["report"], "a waiting tip is not marked seen");
  assert.equal(f.dismiss(), "review", "the next one for this screen appears when the first is dismissed");
  assert.equal(f.dismiss(), null);
  // A waiting tip for a screen the player has left is dropped unseen, and comes back next time.
  const linkScreen = { kind: "link" }, other = { kind: "main" };
  assert.equal(f.offer("read", other), "shown");
  assert.equal(f.offer("link", linkScreen), "queued");
  f.follow(other);
  assert.equal(f.queue.length, 0);
  assert.equal(f.p.seen.includes("link"), false);
  f.dismiss();
  assert.equal(f.offer("link", linkScreen), "shown");
  assert.equal(f.offer("link", linkScreen), "skipped", "a tip shows once");
});

test("tips wait for the introduction and stay quiet when turned off", () => {
  const f = new TipFlow(defaultPrefs());
  assert.equal(f.offer("read", 1), "skipped");
  f.p.introDone = true;
  f.setOn(false);
  assert.equal(f.offer("read", 1), "skipped");
  f.setOn(true);
  assert.equal(f.offer("read", 1), "shown");
});

test("a new game starts with tips on; loading a save and restarting keep the setting", () => {
  assert.deepEqual(newGamePrefs(), { off: false, seen: [], introDone: false });
  const st = memStore();
  savePrefs(st, { off: true, seen: ["read"], introDone: true });
  // Restarting the app: preferences are read back from the device.
  assert.deepEqual(loadPrefs(st), { off: true, seen: ["read"], introDone: true });
  // Loading a save: the save format holds no tip preferences, so loading cannot change them.
  const g = new Game(world, { seed: 1 }); g.start();
  const text = serialize(g.s);
  assert.equal(/introDone|ba_deadinternet_tips/.test(text), false, "tip preferences are not in the save");
  deserialize(world, text);
  assert.deepEqual(loadPrefs(st), { off: true, seen: ["read"], introDone: true });
  // Broken or old stored preferences fall back to defaults, field by field.
  st.setItem(TIPS_KEY, "{not json"); assert.deepEqual(loadPrefs(st), defaultPrefs());
  st.setItem(TIPS_KEY, JSON.stringify({ off: true })); assert.deepEqual(loadPrefs(st), { off: true, seen: [], introDone: false });
});

test("Casebook help: the approved texts, verbatim", () => {
  const H = world.strings.help;
  assert.equal(H.topics.supports_dana.title, "Supporting links and Dana");
  assert.equal(H.topics.supports_dana.text, "Dana considers the supporting links you make between evidence added in support of the claim. The link is your assessment. It doesn't confirm that the evidence or the claim is correct.");
  assert.equal(H.supportsShort, "Dana considers this connection when reviewing evidence linked as supporting your claim. It doesn't confirm that either item proves the claim.");
  for (const k of ["supports_direction", "aliases", "sources", "dana"]) assert.ok(H.topics[k]?.title && H.topics[k]?.text, k);
});

test("help and tip texts reveal nothing hidden: no names but Dana, no claims, never 'confirmed independent'", () => {
  const H = world.strings.help, T = world.strings.tips;
  const texts = [H.title, H.lead, H.supportsShort, H.supportsMore, H.aliasHead,
    ...Object.values(H.topics).flatMap(t => [t.title, t.text]), ...Object.values(T.list).flatMap(t => [t.title, t.text]), ...T.introPoints];
  const dana = world.entities.get("dana");
  const allowed = new Set(["dana", dana?.name?.toLowerCase()].filter(Boolean));
  const names = new Set();
  for (const e of world.entities.values()) for (const n of [e.name, ...(e.aliases || [])]) if (n && n.length > 2) names.add(n.toLowerCase());
  for (const a of world.accounts.values()) { names.add(String(a.handle).toLowerCase().replace(/^@/, "")); if (a.displayName?.length > 2) names.add(a.displayName.toLowerCase()); }
  for (const m of world.mysteries.values()) {
    names.add(m.title.toLowerCase());
    for (const c of m.claims || []) names.add(String(c.id).toLowerCase());
  }
  for (const ch of world.channels.values()) names.add(String(ch.name).toLowerCase());
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  for (const t of texts) {
    const low = t.toLowerCase();
    for (const n of names) if (!allowed.has(n)) assert.ok(!new RegExp(`\\b${esc(n)}\\b`).test(low), `“${t}” names ${n}`);
    assert.ok(!/confirmed independent|are independent\b|proves? (that|the claim is true)/.test(low), `“${t}” overclaims`);
  }
});
