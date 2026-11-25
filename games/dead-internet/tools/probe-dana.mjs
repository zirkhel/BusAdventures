// Prints what a player can learn by asking Dana (Casebook step 5, point 9).
// node games/dead-internet/tools/probe-dana.mjs
import { loadWorld } from "./lib/node-world.mjs";
import { probe, twins, differences } from "./lib/dana-probe.mjs";

const real = probe(await loadWorld());
console.log(`Probed ${real.triples.length} canonical claims × ${real.evidence.length} saved pieces of evidence (${Object.keys(real.single).length} single-evidence questions).`);
for (const [name, mutate] of Object.entries(twins)) {
  const twin = probe(await loadWorld(), mutate);
  const d = differences(real, twin);
  console.log(`\nTwin "${name}" (hidden only): ${d.single.length} single-evidence answers differ, ${d.all.length} all-evidence answers differ.`);
  for (const k of d.single.slice(0, 6)) console.log(`  ${k}\n    real: ${real.single[k]}\n    twin: ${twin.single[k]}`);
  for (const k of d.all) console.log(`  ${k} (all linked)\n    real: ${JSON.stringify(real.all[k])}\n    twin: ${JSON.stringify(twin.all[k])}`);
}
const w = await loadWorld();
console.log("\nWith every piece of evidence linked (real world):");
for (const t of real.triples) {
  const c = w.claims.get(t.claim);
  // A single piece she counts: anything but her "nothing backs this" line, and for big claims anything but the "big claim" line.
  const lines = real.evidence.map(e => real.single[`${t.claim}|${e}`] ?? "");
  const base = lines.filter(Boolean).sort((x, y) => lines.filter(l => l === y).length - lines.filter(l => l === x).length)[0];
  const relevant = lines.filter(l => l && l !== base).length;
  console.log(`  ${t.claim} truth=${c.truth.padEnd(7)} cut=${String(real.all[t.claim].cut).padEnd(5)} single pieces she accepts: ${String(relevant).padStart(3)}  "${real.all[t.claim].text}"`);
}
