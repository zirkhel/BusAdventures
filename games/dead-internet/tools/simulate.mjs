#!/usr/bin/env node
// tools/simulate.mjs — plays The Quiet Account without a user interface.
//
//   node games/dead-internet/tools/simulate.mjs              all scripted scenarios + explorers
//   node games/dead-internet/tools/simulate.mjs lights_out   one scenario, with a full transcript
//
// Scripted scenarios check that designed routes reach their endings. Explorers are automatic
// players that try everything a curious player could; they show what is reachable and where
// the investigation ends up if it publishes on day 6.

import { loadWorld } from "./lib/node-world.mjs";
import { Game } from "../core/game.js";
import { SCENARIOS } from "./lib/scenarios.mjs";
import { explore } from "./lib/explorer.mjs";

const only = process.argv[2];
const w = await loadWorld();
let failed = 0;

for (const sc of SCENARIOS.filter(s => !only || s.id === only)) {
  const g = new Game(w, { seed: 1, playerName: "Sam" });
  const transcript = [];
  if (only) g.on("*", (type, p) => {
    if (type === "message") transcript.push(`  day ${g.s.day} ${p.from === "player" ? "you" : p.from}: ${p.text}`);
    if (type === "notify" && !p.ref?.message) transcript.push(`  day ${g.s.day} 🔔 ${p.text}`);
    if (type === "ending") transcript.push(`  day ${g.s.day} ★ ending: ${p.ending}`);
  });
  sc.run(g);
  const checks = sc.expect(g);
  const ok = checks.every(([, v]) => v);
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"} ${sc.id} — ${sc.title}`);
  for (const [label, v] of checks) if (!v || only) console.log(`     ${v ? "✓" : "✗"} ${label}`);
  console.log(`     day ${g.s.day}, ${g.s.log.length} actions, credibility ${g.s.credibility}, endings: ${g.s.endings.map(e => e.split(":")[1]).join(", ") || "none"}`);
  if (only) console.log(transcript.join("\n"));
}

if (!only) {
  for (const mode of ["cautious", "reckless"]) {
    const t = Date.now();
    const { game: g } = explore(w, { mode, publishOnDay: 6 });
    const seen = Object.keys(g.s.seen).length;
    console.log(`EXPLORER ${mode}: ${seen}/${w.artifacts.size} artifacts opened, ${g.s.evidence.length} evidence, ` +
      `${g.s.searches.length} searches, endings: ${g.s.endings.map(e => e.split(":")[1]).join(", ") || "none"} (${Date.now() - t} ms)`);
  }
}
process.exit(failed ? 1 : 0);
