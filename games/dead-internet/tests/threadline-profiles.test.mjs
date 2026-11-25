// Threadline profiles: accountByHandle() gives an account id; the profile needs the account itself,
// for its name and the threads it started (app/sites/forum.js).
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../tools/lib/node-world.mjs";
import { Game } from "../core/game.js";
import { profileAccount, threadsStartedBy } from "../app/sites/forum.js";

const world = await loadWorld();
const g = new Game(world);
// The same handle index as app/phone.js: lowercase, with and without @, mapped to account ids.
const handles = new Map();
for (const acc of world.accounts.values()) {
  const k = String(acc.handle).toLowerCase();
  handles.set(k, acc.id); handles.set(k.replace(/^@/, ""), acc.id);
}
const phone = { g, accountByHandle: h => handles.get(String(h).toLowerCase()) || null };
const site = world.sites.get("threadline");
const profiles = [...world.artifacts.values()].filter(a => a.site === "threadline" && /\/u\/[^/]+$/.test(a.url || ""));

test("truthseeker_88's profile shows its name and both threads it started", () => {
  assert.equal(typeof phone.accountByHandle("truthseeker_88"), "string", "the lookup gives an id");
  const acc = profileAccount(phone, "truthseeker_88");
  assert.equal(acc?.id, "acc_truthseeker");
  assert.equal(acc.displayName || acc.handle, "truthseeker_88");
  assert.deepEqual(threadsStartedBy(phone, site, acc).map(t => t.id).sort(), ["A16", "A62"]);
});

test("every Threadline profile resolves to its account; started threads are first pages by that account", () => {
  assert.ok(profiles.length >= 9);
  for (const p of profiles) {
    const handle = p.url.split("/").pop();
    const acc = profileAccount(phone, handle);
    assert.ok(acc && typeof acc === "object", `${p.id} (${handle}) has an account`);
    assert.ok(acc.displayName || acc.handle, `${handle} has a name`);
    for (const t of threadsStartedBy(phone, site, acc)) {
      assert.equal(t.author, acc.id, `${handle}: ${t.id}`);
      assert.doesNotMatch(t.url, /[?&]page=([2-9]|\d{2,})/, `${handle}: ${t.id} is a first page`);
    }
  }
  // Theo only answers on page 4 of truthseeker's thread (A17); he started nothing.
  assert.deepEqual(threadsStartedBy(phone, site, profileAccount(phone, "theo_q")), []);
  for (const h of ["harbor_hank", "millgirl_77", "quietreader", "earlyboat", "pier3rod", "cablekit", "savingthrow"])
    assert.ok(threadsStartedBy(phone, site, profileAccount(phone, h)).length > 0, h);
});
