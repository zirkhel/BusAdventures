#!/usr/bin/env node
// tools/graphics-report.mjs — writes graphics/GRAPHICS.md from graphics/catalog.json.
// The catalogue is the source of truth; the Markdown is a readable overview for production.
//
//   node games/dead-internet/tools/graphics-report.mjs

import { writeFile, access } from "node:fs/promises";
import { join } from "node:path";
import { GAME_DIR } from "./lib/node-world.mjs";
import { loadCatalog } from "./lib/graphics.mjs";

const cat = await loadCatalog();
const byId = new Map(cat.images.map(g => [g.id, g]));
const exists = p => access(join(GAME_DIR, p)).then(() => true, () => false);
const children = id => cat.images.filter(g => g.derivedFrom === id).map(g => g.id);

const rows = [];
for (const g of cat.images) {
  const status = (await exists(g.file)) ? "final file" : g.status;
  const dep = [g.derivedFrom ? `from ${g.derivedFrom}: ${g.transform}` : children(g.id).length ? `original for ${children(g.id).join(", ")}` : "",
    g.character ? `face: ${g.character}` : "", (g.dependsOn || []).length ? `needs ${g.dependsOn.join(", ")}` : ""].filter(Boolean).join("; ");
  rows.push(`| ${g.id} | \`${g.file}\` | ${g.width}×${g.height} | ${g.kind} | ${g.priority === "optional" ? "optional" : "required"} | ${status} | ${(g.usedIn || []).join(", ")} | ${dep} | ${g.brief.replace(/\|/g, "/")} |`);
}
const order = [];
const visit = g => { if (!g || order.includes(g.id)) return; if (g.derivedFrom) visit(byId.get(g.derivedFrom)); (g.dependsOn || []).forEach(d => visit(byId.get(d))); order.push(g.id); };
cat.images.forEach(visit);

const md = `# Dead Internet — grafikkoversikt

_Generert fra \`graphics/catalog.json\` av \`tools/graphics-report.mjs\`. Rediger katalogen, ikke denne fila._

${cat.about}

## Stil
${Object.entries(cat.style).map(([k, v]) => `- **${k}:** ${v}`).join("\n")}

## Faste karakterer
${Object.entries(cat.characters).map(([k, v]) => `- **${k}:** ${v}`).join("\n")}

## Slik byttes et bilde
1. Lag bildet etter beskrivelsen og lagre det med nøyaktig filnavn og størrelse fra tabellen.
2. Bilder som er avledet av et original (beskåret, speilvendt) lages ved å bearbeide originalen, ikke ved å generere på nytt. Ellers finner ikke bildesøket i spillet sammenhengen.
3. Sett \`status\` til \`final\` i katalogen og kjør \`node games/dead-internet/tools/validate.mjs\`.
4. Inntil fila finnes, bruker spillet \`assets/placeholders/<ID>.svg\` (lages av \`tools/make-placeholders.mjs\`).

## Status
- Påkrevd: ${cat.images.filter(g => g.priority !== "optional").length} bilder. Valgfritt: ${cat.images.filter(g => g.priority === "optional").length}. Ferdige filer: ${(await Promise.all(cat.images.map(g => exists(g.file)))).filter(Boolean).length}.
- «face: X» betyr at bildet viser en fast person. Lag først én ansiktsreferanse per person (se Faste karakterer) og bruk den i alle bildene av vedkommende.
- «needs X» betyr at bildet lages fra X (for eksempel et profilbilde laget av en logo).

## Produksjonsrekkefølge
${order.join(" → ")}

## Alle bilder
| ID | Fil | Størrelse | Type | Prioritet | Status | Brukt i | Avhengighet | Beskrivelse |
|---|---|---|---|---|---|---|---|---|
${rows.join("\n")}
`;
await writeFile(join(GAME_DIR, "graphics", "GRAPHICS.md"), md);
console.log(`wrote graphics/GRAPHICS.md (${cat.images.length} images)`);
