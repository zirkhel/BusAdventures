// Graphics catalogue checks. The catalogue (graphics/catalog.json) is the production list:
// stable ids, file names, sizes, prompts and which manipulated copies depend on which
// originals. The engine only knows image ids, so any file can be replaced without code changes.
import { readFile, access } from "node:fs/promises";
import { join } from "node:path";
import { GAME_DIR } from "./node-world.mjs";

export async function loadCatalog() {
  return JSON.parse(await readFile(join(GAME_DIR, "graphics", "catalog.json"), "utf8"));
}

const exists = p => access(p).then(() => true, () => false);

export async function validateGraphics(raw) {
  const issues = [];
  const err = (where, msg) => issues.push({ level: "ERROR", where, msg });
  const warn = (where, msg) => issues.push({ level: "WARN", where, msg });
  const info = (where, msg) => issues.push({ level: "INFO", where, msg });
  let cat;
  try { cat = await loadCatalog(); } catch (e) { err("graphics", `cannot read graphics/catalog.json: ${e.message}`); return issues; }
  const byId = new Map();
  for (const g of cat.images) {
    if (byId.has(g.id)) err(`graphic ${g.id}`, "duplicate id");
    byId.set(g.id, g);
    for (const k of ["file", "width", "height", "kind", "brief"]) if (g[k] == null) err(`graphic ${g.id}`, `missing ${k}`);
    if (!/^assets\/images\/[a-z0-9_\-]+\.(webp|png|jpg|svg)$/.test(g.file || "")) err(`graphic ${g.id}`, `file name must be assets/images/<lowercase>.webp|png|jpg|svg`);
    if (!(await exists(join(GAME_DIR, "assets", "placeholders", `${g.id}.svg`)))) warn(`graphic ${g.id}`, "no placeholder (run tools/make-placeholders.mjs)");
    if (await exists(join(GAME_DIR, g.file))) info(`graphic ${g.id}`, "final file present");
  }
  for (const g of cat.images) {
    if (g.derivedFrom && !byId.has(g.derivedFrom)) err(`graphic ${g.id}`, `derivedFrom unknown ${g.derivedFrom}`);
    if (g.derivedFrom) {
      const o = byId.get(g.derivedFrom);
      if (o && g.status === "final" && o.status !== "final") warn(`graphic ${g.id}`, `final, but its original ${o.id} is not: regenerate after the original`);
    }
  }
  for (const img of raw.images) {
    const g = byId.get(img.id);
    if (!g) { err(`image ${img.id}`, "in the world but not in graphics/catalog.json"); continue; }
    if ((img.derivedFrom ?? null) !== (g.derivedFrom ?? null)) err(`image ${img.id}`, `derivedFrom differs: world ${img.derivedFrom}, catalogue ${g.derivedFrom}`);
  }
  const worldIds = new Set(raw.images.map(i => i.id));
  for (const g of cat.images) if (!worldIds.has(g.id) && g.kind !== "logo" && g.kind !== "ui") warn(`graphic ${g.id}`, "not used by the world");
  return issues;
}
