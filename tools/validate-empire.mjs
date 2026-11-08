#!/usr/bin/env node
// Validate an Empire theme.   node tools/validate-empire.mjs games/fighter-empire
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { validateTheme } from '../empire/engine/validate.js';

const dir = process.argv[2] || 'games/fighter-empire';
const theme = JSON.parse(readFileSync(join(dir, 'theme.json'), 'utf8'));
const { errors, warnings } = validateTheme(theme);

// Asset files must exist on disk.
const srcs = [];
for (const r of theme.rooms) {
  if (r.background?.src) srcs.push(r.background.src);
  for (const c of r.characters) if (c.sprite?.src) srcs.push(c.sprite.src);
  for (const u of r.upgrades) for (const s of u.visual?.stages || [u.visual || {}]) if (s.src) srcs.push(s.src);
  for (const e of r.events || []) for (const o of e.outcomes) if (o.cinematic?.src) srcs.push(o.cinematic.src);
}
for (const s of srcs) if (!/^https?:|^data:/.test(s) && !existsSync(join(dir, s))) errors.push(`fil mangler: ${s}`);

for (const w of warnings) console.log('WARN ', w);
for (const e of errors) console.log('ERROR', e);
console.log(`${theme.id}: ${theme.rooms.length} rom, ${srcs.length} mediefiler — ${errors.length} feil, ${warnings.length} advarsler`);
process.exit(errors.length ? 1 : 0);
