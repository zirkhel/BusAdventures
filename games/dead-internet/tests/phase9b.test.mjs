// Phase 9 finish: tips, notification senders, endings as developments, graphics production.
//   node --test games/dead-internet/tests/*.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { join } from "node:path";
import { loadWorld, GAME_DIR } from "../tools/lib/node-world.mjs";
import { Game } from "../core/game.js";

const world = await loadWorld();
const exists = p => access(join(GAME_DIR, p)).then(() => true, () => false);

test("tips and the introduction never name people, places, accounts or cases", () => {
  const T = world.strings.tips;
  const texts = [T.introTitle, T.introLead, ...T.introPoints, ...Object.values(T.list).flatMap(t => [t.title, t.text])];
  const names = new Set();
  for (const e of world.entities.values()) for (const n of [e.name, ...(e.aliases || [])]) if (n && n.length > 3) names.add(n.toLowerCase());
  for (const a of world.accounts.values()) { names.add(String(a.handle).toLowerCase().replace(/^@/, "")); if (a.displayName?.length > 3) names.add(a.displayName.toLowerCase()); }
  for (const m of world.mysteries.values()) names.add(m.title.toLowerCase());
  for (const t of texts) for (const n of names) assert.ok(!new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(t.toLowerCase()), `tip “${t}” names ${n}`);
  for (const k of ["read", "image", "search", "save", "message", "theory", "report", "sleep", "outcome"]) assert.ok(T.list[k], k);
});

test("every notification says who it is from", () => {
  const g = new Game(world, { seed: 1 }); g.start();
  for (const n of g.s.notifications) assert.ok(n.ref || n.from, JSON.stringify(n));
  for (const m of world.mysteries.values()) for (const e of m.endings || []) for (const fx of e.effects || []) {
    if (fx.notify) assert.ok(fx.notify.ref || fx.notify.from, `${m.id}:${e.id}`);
  }
});

test("an ending reads as a development of the case, with the day it happened", () => {
  const g = new Game(world, { seed: 1 }); g.start();
  const m = world.mysteries.get("quiet_account");
  const e = m.endings.find(x => !(x.requiresEnding || []).length);
  // Force the ending's conditions by recording it the way checkEndings does.
  g.s.endings.push(`${m.id}:${e.id}`); g.s.fired[`ending:${m.id}:${e.id}`] = g.s.day;
  const v = g.endings().find(x => x.id === e.id);
  assert.equal(v.day, g.s.day);
});

test("the ComfyUI list covers every image that is not final, and every final file exists", async () => {
  const cat = JSON.parse(await readFile(join(GAME_DIR, "graphics/catalog.json"), "utf8"));
  const how = JSON.parse(await readFile(join(GAME_DIR, "graphics/comfyui.json"), "utf8"));
  const ids = new Set(cat.images.map(i => i.id));
  for (const id of Object.keys(how)) assert.ok(ids.has(id), `comfyui.json: unknown id ${id}`);
  for (const i of cat.images) {
    if (i.status === "final") { assert.ok(await exists(i.file), `${i.id}: final but ${i.file} is missing`); continue; }
    if (i.kind === "logo") continue;
    const m = how[i.id];
    assert.ok(m || i.derivedFrom, `${i.id}: no production method`);
    if (m?.method === "derive") assert.ok(ids.has(m.from), `${i.id}: derives from unknown ${m.from}`);
  }
  for (const [k, r] of Object.entries(cat.references || {})) assert.ok(await exists(r.file), `reference ${k}: ${r.file} is missing`);
});
