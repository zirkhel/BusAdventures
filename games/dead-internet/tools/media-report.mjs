#!/usr/bin/env node
// tools/media-report.mjs — media per platform, and evidence that stands out from its category.
//
//   node games/dead-internet/tools/media-report.mjs
//
// Exits with code 1 if evidence differs a lot from its neighbours (views under ¼ or over 4×
// the category median) and is not marked "outlier": true.

import { loadWorld } from "./lib/node-world.mjs";
import { mediaReport } from "./lib/media.mjs";

const w = await loadWorld();
const { platforms, outliers } = mediaReport(w);
console.log(`${w.meta.id}: ${w.artifacts.size} artifacts, ${w.videos.size} videos, ${w.scripts.size} transcripts\n`);
console.log("platform".padEnd(26) + "items  clips  filler  evidence  comments  true/false/partial");
for (const p of platforms)
  console.log(p.name.padEnd(26) + [p.artifacts, p.clips, p.filler, p.evidence, p.comments].map((n, i) => String(n).padStart([5, 7, 8, 10, 10][i])).join("") +
    `  ${p.truth.true}/${p.truth.false}/${p.truth.partial}`);
if (outliers.length) {
  console.log("\nEvidence that stands out (mark it \"outlier\": true if that is deliberate):");
  for (const o of outliers) console.log(`  WARN ${o.artifact} on ${o.platform}${o.category ? ` (${o.category})` : ""}: ${o.views} views, category median ${o.median}`);
  process.exitCode = 1;
} else console.log("\nNo evidence stands out from its category.");
