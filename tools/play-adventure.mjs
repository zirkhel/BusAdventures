#!/usr/bin/env node
// tools/play-adventure.mjs
// Runs commands through the engine without a browser — for testing puzzles,
// phrasings and walkthroughs.
//
//   node tools/play-adventure.mjs games/ward-b "take keycard" n n "take mask"
//   node tools/play-adventure.mjs games/ward-b --file walkthrough.txt
//
// Prints each command, the response, any warning, and the room/media after it.

import { readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(new URL("..", import.meta.url).pathname);
const [dirArg, ...rest] = process.argv.slice(2);
if (!dirArg) { console.log("usage: play-adventure.mjs <gameDir> <cmd>... | --file <path>"); process.exit(2); }
const dir = resolve(dirArg);

const cmds = rest[0] === "--file"
  ? readFileSync(rest[1], "utf8").split("\n").map(s => s.trim()).filter(s => s && !s.startsWith("#"))
  : rest;

const imp = f => import(pathToFileURL(f).href);
const S = await imp(join(root, "engine/state.js"));
const E = await imp(join(root, "engine/engine.js"));
const { GAME }  = await imp(join(dir, "data/game.js"));
const { ROOMS } = await imp(join(dir, "data/rooms.js"));
const { ITEMS } = await imp(join(dir, "data/items.js"));

S.init({ game: GAME, rooms: ROOMS, items: ITEMS });
S.fresh();
S.incVisit(S.get().room);

const line = s => s.replace(/\s*\n+\s*/g, " / ");
console.log(`[${S.get().room} | ${E.resolveMediaKey()}]`);
for (const c of cmds) {
  const r = E.runCommand(c);
  const tag = r.type === "death" ? "DEATH" : r.type === "win" ? "WIN" : r.type;
  console.log(`> ${c}\n    ${tag}: ${line(r.text || "")}` +
    (r.warning ? `\n    WARNING: ${line(r.warning)}` : "") +
    (r.deathMedia ? `\n    deathMedia: ${r.deathMedia}` : "") +
    `\n    [${S.get().room} | ${E.resolveMediaKey()} | inv: ${S.get().inventory.join(",") || "-"}]`);
  if (r.type === "death" || r.type === "win") break;
}
