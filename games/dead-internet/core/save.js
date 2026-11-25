// @ts-check
// Saving and loading. Storage is injected (localStorage in the browser, a Map in tests).
// Saves are plain JSON with a format tag and a version number, so they can be exported,
// imported and migrated when the state shape or the content changes.

import { migrateEvidence } from "./workbench.js";
import { SAVE_VERSION } from "./state.js";
import { migrateDiscovery } from "./discovery.js";
import { migrateCases, migrateCaseStates } from "./cases.js";
import { migrateMedia } from "./feed.js";
import { migrateBrowser } from "./browser.js";

export const SAVE_FORMAT = "dead-internet-save";

/** Migrations from version n to n+1. Add one whenever the state shape changes. */
const MIGRATIONS = {
  // 1 → 2: discovery states. Opening content used to make every mentioned name "known".
  1: (s, w) => { migrateDiscovery(s, w); s.saveVersion = 2; return s; },
  // 2 → 3: the Timeline. Starts empty: it is built by the player, never from the story.
  2: s => { s.timeline = []; s.saveVersion = 3; return s; },
  // 3 → 4: cases. Everything already in the Casebook becomes unclassified; old reports get their case.
  3: (s, w) => { migrateCases(s, w); s.saveVersion = 4; return s; },
  // 4 → 5: case states (universe split). The case an old save played is active from day one.
  4: (s, w) => { migrateCaseStates(s, w); s.saveVersion = 5; return s; },
  6: (s, w) => { migrateEvidence(s, w); s.saveVersion = 7; return s; },
  // 7 → 8: Browser bookmarks and text size. Forward is session-only and starts empty.
  7: s => { migrateBrowser(s); s.saveVersion = 8; return s; },
  // 5 → 6: media. No follows, likes or "not interested" yet.
  5: s => { migrateMedia(s); s.saveVersion = 6; return s; },
};

export function serialize(state) {
  return JSON.stringify({ format: SAVE_FORMAT, saveVersion: state.saveVersion, state });
}

/**
 * Parse, migrate and clean a save so it fits the current world.
 * References to content that no longer exists are dropped instead of crashing the game.
 * @returns {{state:any, warnings:string[]}}
 */
export function deserialize(w, text) {
  const data = typeof text === "string" ? JSON.parse(text) : text;
  if (data?.format !== SAVE_FORMAT) throw new Error("Not a Dead Internet save.");
  let s = data.state;
  if (s.worldId !== w.meta.id) throw new Error(`Save belongs to world "${s.worldId}", not "${w.meta.id}".`);
  while (s.saveVersion < SAVE_VERSION) {
    const m = MIGRATIONS[s.saveVersion];
    if (!m) throw new Error(`No migration from save version ${s.saveVersion}.`);
    s = m(s, w);
  }
  if (s.saveVersion > SAVE_VERSION) throw new Error("Save is from a newer version of the game.");

  const warnings = [];
  const drop = (what, id) => warnings.push(`dropped ${what} ${id}`);
  for (const id of Object.keys(s.seen)) if (!w.artifacts.has(id)) { delete s.seen[id]; drop("seen", id); }
  for (const id of Object.keys(s.artifacts)) if (!w.artifacts.has(id)) { delete s.artifacts[id]; drop("artifact state", id); }
  s.evidence = s.evidence.filter(e => {
    const ok = e.message ? s.messages.some(m => m.id === e.message) : w.artifacts.has(e.artifact);
    if (!ok) drop("evidence", e.id);
    return ok;
  });
  for (const h of s.hypotheses) h.evidence = h.evidence.filter(id => s.evidence.some(e => e.id === id));
  s.hypotheses = s.hypotheses.filter(h => {
    const ok = w.predicates.has(h.predicate);
    if (!ok) drop("hypothesis", h.id);
    return ok;
  });
  for (const ev of s.timeline || []) {
    ev.evidence = ev.evidence.filter(x => s.evidence.some(e => e.id === x.id));
    ev.theories = ev.theories.filter(id => s.hypotheses.some(h => h.id === id));
    ev.about = ev.about.filter(id => w.entities.has(id) || w.accounts.has(id));
  }
  for (const k of ["evidence", "hypotheses", "notes", "timeline"])
    for (const x of s[k] || []) x.cases = (Array.isArray(x.cases) ? x.cases : []).filter(id => w.mysteries.has(id));
  for (const [k, ok] of [["follows", id => w.accounts.has(id)], ["likes", id => w.artifacts.has(id)], ["notInterested", id => w.artifacts.has(id)]])
    for (const id of Object.keys(s.media[k])) if (!ok(id)) { delete s.media[k][id]; drop(k, id); }
  for (const id of Object.keys(s.trust)) if (!w.characters.has(id)) delete s.trust[id];
  for (const c of w.characters.values()) if (!(c.id in s.trust)) s.trust[c.id] = c.trust?.start ?? 0;
  if (s.browser && Array.isArray(s.browser.bookmarks)) {
    s.browser.bookmarks = s.browser.bookmarks.filter(b => {
      if (!b?.url) return false;
      if (b.artifact && !w.artifacts.has(b.artifact)) { delete b.artifact; delete b.version; }
      return true;
    });
  }
  if (s.contentVersion !== w.meta.contentVersion) warnings.push(`content ${s.contentVersion} → ${w.meta.contentVersion}`);
  s.contentVersion = w.meta.contentVersion;
  return { state: s, warnings };
}

export function saveKey(w) { return `ba_deadinternet_${w.meta.id}`; }

export function saveTo(storage, w, state) {
  try { storage.setItem(saveKey(w), serialize(state)); return true; } catch { return false; }
}

/** @returns {{state:any, warnings:string[]}|null} */
export function loadFrom(storage, w) {
  const raw = storage.getItem(saveKey(w));
  if (!raw) return null;
  return deserialize(w, raw);
}

export function clearSave(storage, w) { storage.removeItem(saveKey(w)); }
