#!/usr/bin/env node
// tools/validate.mjs — checks the Dead Internet world.
//
//   node games/dead-internet/tools/validate.mjs            all checks
//   node games/dead-internet/tools/validate.mjs --fast     skip simulated players
//   node games/dead-internet/tools/validate.mjs --info     also print INFO lines
//
// Checks references, timelines, source independence, access to core evidence, and
// whether any single artifact, image or person can block the investigation.
// ERROR = must fix. WARN = probably a mistake. INFO = worth a look. Exit code 1 on any ERROR.

import { loadRaw } from "./lib/node-world.mjs";
import { validateWorld } from "./lib/validate-world.mjs";
import { validateGraphics } from "./lib/graphics.mjs";

const args = new Set(process.argv.slice(2));
const raw = await loadRaw();
const t = Date.now();
const { issues } = validateWorld(raw, { reachability: !args.has("--fast"), knockout: !args.has("--fast") });
issues.push(...(await validateGraphics(raw)));

const show = issues.filter(i => i.level !== "INFO" || args.has("--info"));
for (const i of show) console.log(`${i.level.padEnd(5)} ${i.where}: ${i.msg}`);
const n = l => issues.filter(i => i.level === l).length;
console.log(`\n${raw.meta.id} ${raw.meta.contentVersion}: ${raw.artifacts.length} artifacts, ${raw.characters.length} characters, ${raw.images.length} images — ${n("ERROR")} errors, ${n("WARN")} warnings (${Date.now() - t} ms)`);
process.exit(n("ERROR") ? 1 : 0);
