// Empire Engine — local save. Storage is injected so the simulator can run without a browser.
// Saves are plain JSON. A player who edits their save is welcome to.

import { Empire, SAVE_VERSION } from './empire.js';

export function saveKey(theme) { return `ba_empire_${theme.id}`; }

export function loadEmpire(theme, { storage = globalThis.localStorage, rng, now } = {}) {
  let raw = null;
  try { raw = JSON.parse(storage?.getItem(saveKey(theme)) || 'null'); } catch { raw = null; }
  if (raw && raw.themeId !== theme.id) raw = null;
  const empire = new Empire(theme, raw, { rng, now });
  const offline = raw ? empire.catchUp() : null;
  return { empire, offline, isNew: !raw };
}

export function saveEmpire(empire, { storage = globalThis.localStorage } = {}) {
  try { storage?.setItem(saveKey(empire.theme), JSON.stringify(empire.snapshot())); return true; }
  catch { return false; }
}

export function exportSave(empire) {
  return JSON.stringify({ format: 'bus-adventures-empire', saveVersion: SAVE_VERSION, state: empire.snapshot() }, null, 1);
}

/** Returns a new Empire built from exported text, or throws with a readable message. */
export function importSave(theme, text, opts = {}) {
  const data = JSON.parse(text);
  const state = data.state || data;
  if (state.themeId !== theme.id) throw new Error(`Lagringen er fra «${state.themeId}», ikke «${theme.id}».`);
  return new Empire(theme, state, opts);
}

export function clearSave(theme, { storage = globalThis.localStorage } = {}) {
  storage?.removeItem(saveKey(theme));
}
