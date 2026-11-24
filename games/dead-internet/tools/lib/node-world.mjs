// Load the Dead Internet world from disk (Node only).
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadContent } from "../../core/content.js";
import { buildWorld } from "../../core/world.js";

export const GAME_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const CONTENT_DIR = join(GAME_DIR, "content");

export async function loadRaw(dir = CONTENT_DIR) {
  return loadContent(async p => JSON.parse(await readFile(join(dir, p), "utf8")));
}

/** @param {{disabled?: Iterable<string>}} [opts] */
export async function loadWorld(opts = {}, dir = CONTENT_DIR) {
  const w = buildWorld(await loadRaw(dir));
  if (opts.disabled) w.disabled = new Set(opts.disabled);
  return w;
}
