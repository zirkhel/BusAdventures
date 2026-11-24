#!/usr/bin/env node
// tools/make-placeholders.mjs — writes one SVG placeholder per catalogue entry to
// assets/placeholders/<ID>.svg, at the right aspect ratio, labelled with the id and the caption the
// player sees. Never the production brief or the image's origin: a placeholder is in the game, and
// "crop of IMG02" would hand the player the answer.
// Derived images are drawn from their original's colour so the family is visible, and
// mirrored copies show the label mirrored, so image-search behaviour can be tested by eye.
//
//   node games/dead-internet/tools/make-placeholders.mjs
//
// The presentation layer uses assets/images/<file> when it exists, else the placeholder.

import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { GAME_DIR, loadWorld } from "./lib/node-world.mjs";
import { loadCatalog } from "./lib/graphics.mjs";

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const hue = id => [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

function wrap(text, width) {
  const words = String(text).split(/\s+/), lines = [];
  let line = "";
  for (const w of words) { if ((line + " " + w).trim().length > width) { lines.push(line.trim()); line = w; } else line += " " + w; }
  if (line.trim()) lines.push(line.trim());
  return lines.slice(0, 6);
}

const cat = await loadCatalog();
const world = await loadWorld();
const byId = new Map(cat.images.map(g => [g.id, g]));
const root = g => { let c = g; while (c.derivedFrom && byId.has(c.derivedFrom)) c = byId.get(c.derivedFrom); return c; };
const dir = join(GAME_DIR, "assets", "placeholders");
await mkdir(dir, { recursive: true });

for (const g of cat.images) {
  const W = 600, H = Math.round(600 * g.height / g.width);
  const h = hue(root(g).id);
  const mirrored = /mirror/.test(g.transform || "");
  const lines = wrap(world.images.get(g.id)?.caption || (g.kind === "logo" ? g.brief : ""), 46);
  const fs = 16;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<rect width="100%" height="100%" fill="hsl(${h} 30% 22%)"/>
<rect x="12" y="12" width="${W - 24}" height="${H - 24}" fill="none" stroke="hsl(${h} 40% 60%)" stroke-dasharray="8 6"/>
<g ${mirrored ? `transform="translate(${W} 0) scale(-1 1)"` : ""} font-family="system-ui, sans-serif" fill="hsl(${h} 30% 88%)">
<text x="32" y="56" font-size="28" font-weight="700">${esc(g.id)}</text>
<text x="32" y="84" font-size="14" opacity=".8">placeholder · ${g.width}×${g.height}</text>
${lines.map((l, i) => `<text x="32" y="${124 + i * (fs + 6)}" font-size="${fs}">${esc(l)}</text>`).join("\n")}
</g></svg>`;
  await writeFile(join(dir, `${g.id}.svg`), svg);
}
console.log(`wrote ${cat.images.length} placeholders to assets/placeholders/`);
