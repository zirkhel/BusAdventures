#!/usr/bin/env node
// Balance simulator. Plays a theme with a simple greedy bot and prints milestones.
//
//   node tools/simulate-empire.mjs games/fighter-empire                 # active player, 12 h
//   node tools/simulate-empire.mjs games/fighter-empire --check 30m     # opens the game every 30 min
//   node tools/simulate-empire.mjs games/fighter-empire --hours 48 --seed 7 --prestiges 2
//
// The bot is deliberately dumb: it is a ruler for comparing tunings, not a model of a real player.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Empire } from '../empire/engine/empire.js';
import { seededRng } from '../empire/engine/curves.js';

const args = process.argv.slice(2);
const dir = args.find(a => !a.startsWith('--')) || 'games/fighter-empire';
const opt = (name, def) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : def; };
const dur = s => { const m = /^(\d+(?:\.\d+)?)([smh]?)$/.exec(s); return m ? +m[1] * ({ s: 1, m: 60, h: 3600, '': 1 }[m[2]]) : 10; };

const theme = JSON.parse(readFileSync(join(dir, 'theme.json'), 'utf8'));
const hours = +opt('hours', 12);
const check = dur(opt('check', '10s'));       // how often the player acts
const maxPrestiges = +opt('prestiges', 3);
const seed = +opt('seed', 1);

let t = 0;
const empire = new Empire(theme, null, { rng: seededRng(seed), now: () => t * 1000 });
const log = [];
const fmtT = s => s < 3600 ? `${(s / 60).toFixed(1)} min` : `${(s / 3600).toFixed(2)} t`;
const fmtN = n => n >= 1e9 ? (n / 1e9).toFixed(2) + 'B' : n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : n.toFixed(1);
const note = msg => log.push(`${fmtT(t).padStart(10)}  ${msg}`);
const seen = new Set();

function targets() {
  const out = [];
  for (const r of empire.builtRooms()) {
    out.push({ kind: 'room', id: r.id });
    for (const c of r.characters) out.push({ kind: 'character', id: c.id });
    for (const u of r.upgrades) out.push({ kind: 'upgrade', id: u.id });
  }
  return out;
}

function act() {
  // 1. prestige when possible
  if (empire.state.prestige.level < maxPrestiges && empire.prestigeStatus().available) {
    note(`PRESTIGE → nivå ${empire.state.prestige.level + 1}  (inntekt før: ${fmtN(empire.totalIncome())}/s)`);
    empire.prestige(); seen.clear();
  }
  for (let guard = 0; guard < 200; guard++) {
    // 2. build next room
    const next = empire.roomList.find(r => !empire.isBuilt(r.id));
    if (next && empire.quoteBuild(next.id).ok) {
      empire.buildRoom(next.id); note(`bygger ${next.name}  (${fmtN(next.price)})`); continue;
    }
    // 3. best affordable level-up by income gained per coin
    let best = null;
    for (const tg of targets()) {
      const q = empire.quoteLevel(tg);
      if (!q.ok) continue;
      const before = empire.totalIncome();
      const snap = JSON.stringify(empire.state);
      empire.levelUp(tg);
      const gain = empire.totalIncome() - before;
      empire.state = JSON.parse(snap);
      const score = gain / Math.max(q.coins, 1);
      if (!best || score > best.score) best = { tg, score, q };
    }
    if (best) {
      const r = empire.levelUp(best.tg);
      const key = `${r.kind}:${r.id}:${r.to}`;
      if (r.kind === 'character' && r.action === 'unlock') note(`låser opp ${empire.characters[r.id].name} (${empire.characters[r.id].rarity})`);
      if (r.kind === 'room' && r.to % 5 === 0 && !seen.has(key)) note(`${empire.rooms[r.id].name} nivå ${r.to}`);
      seen.add(key);
      continue;
    }
    // 4. save for the next room if it is close, otherwise buy a pack
    if (next && empire.quoteBuild(next.id).reason === 'coins' && next.price < empire.totalIncome() * 300) break;
    const price = empire.boosterPrice();
    if (empire.state.coins >= price) { empire.openBooster(); continue; }
    break;
  }
  // 5. events
  for (const id of Object.keys(empire.events)) {
    if (empire.eventStatus(id, t * 1000).ok) {
      const r = empire.runEvent(id, t * 1000);
      if (!seen.has('ev:' + id)) { note(`event ${empire.events[id].name}: ${r.outcome.label}`); seen.add('ev:' + id); }
    }
  }
}

const end = hours * 3600;
let nextReport = 3600;
while (t < end) {
  act();
  const step = Math.min(check, end - t);
  empire.advance(step);
  t += step;
  if (t >= nextReport) {
    const s = empire.state;
    note(`— status: ${fmtN(empire.totalIncome())}/s, kasse ${fmtN(s.coins)}, rom ${empire.builtRooms().length}, karakterer ${Object.keys(s.characters).length}, pakker ${s.stats.boostersOpened}, prestige ${s.prestige.level}`);
    nextReport += 3600;
  }
}

console.log(`${theme.name} — bot handler hvert ${fmtT(check)}, ${hours} t, seed ${seed}\n`);
console.log(log.join('\n'));
