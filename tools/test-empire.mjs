#!/usr/bin/env node
// Engine tests mapped to the acceptance criteria in the project plan (§15).
//   node tools/test-empire.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { Empire, createState } from '../empire/engine/empire.js';
import { seededRng } from '../empire/engine/curves.js';
import { validateTheme } from '../empire/engine/validate.js';
import { exportSave, importSave } from '../empire/engine/save.js';

const load = id => JSON.parse(readFileSync(`games/${id}/theme.json`, 'utf8'));
const fighter = load('fighter-empire'), bus = load('bus-empire');
let t = 0;
const mk = (theme = fighter, state = null) => new Empire(theme, state, { rng: seededRng(42), now: () => t });
const results = [];
const test = (name, fn) => { try { fn(); results.push(['ok ', name]); } catch (e) { results.push(['FAIL', name + ' — ' + e.message]); } };

test('1  et nytt rom tjener umiddelbart uten karakterer', () => {
  const e = mk(); assert.equal(e.totalIncome(), 0);
  assert.ok(e.buildRoom('alley').ok);
  assert.equal(Object.keys(e.state.characters).length, 0);
  assert.ok(e.totalIncome() > 0);
  assert.ok(e.advance(10) > 0);
});

test('2  tre karakterplasser og to oppgraderingstyper per rom', () => {
  for (const th of [fighter, bus]) for (const r of th.rooms) { assert.equal(r.characters.length, 3); assert.equal(r.upgrades.length, 2); }
});

test('3  karakterer er låst til rommet og har fast sjeldenhet', () => {
  const e = mk();
  for (const c of Object.values(e.characters)) { assert.ok(e.rooms[c.roomId].characters.some(x => x.id === c.id)); assert.ok(['common', 'rare', 'epic'].includes(c.rarity)); }
});

test('4  booster kjøpes med spillvaluta og gir bare innhold fra bygde rom', () => {
  const e = mk(); e.buildRoom('alley');
  e.state.coins = 0; assert.equal(e.openBooster().reason, 'coins');
  for (let i = 0; i < 300; i++) {
    e.state.coins = 1e12;
    const before = e.state.coins, price = e.boosterPrice();
    const r = e.openBooster(); assert.ok(r.ok);
    for (const rw of r.rewards) if (rw.type === 'fragment') assert.equal(rw.roomId, 'alley');
    assert.ok(e.state.coins >= before - price);
  }
  e.buildRoom('gym');
  const seen = new Set();
  for (let i = 0; i < 300; i++) { e.state.coins = 1e12; for (const rw of e.openBooster().rewards) if (rw.roomId) seen.add(rw.roomId); }
  assert.deepEqual([...seen].sort(), ['alley', 'gym']);
});

test('4b Common er vanligere enn Rare, som er vanligere enn Epic', () => {
  const e = mk(); e.buildRoom('alley'); const n = { common: 0, rare: 0, epic: 0 };
  for (let i = 0; i < 2000; i++) { e.state.coins = 1e12; for (const r of e.openBooster().rewards) if (r.rarity) n[r.rarity]++; e.state.characters = {}; e.state.fragments = {}; }
  assert.ok(n.common > n.rare && n.rare > n.epic, JSON.stringify(n));
});

test('5  fragmenter låser opp og oppgraderer karakterer (1, 3, 5, 10)', () => {
  const e = mk(); e.buildRoom('alley'); e.state.coins = 1e9;
  const id = 'alley.knuckles';
  assert.equal(e.levelUp({ kind: 'character', id }).reason, 'fragments');
  e.state.fragments[id] = 3; assert.ok(e.levelUp({ kind: 'character', id }).ok); assert.equal(e.charLevel(id), 1);
  const costs = [];
  for (let l = 1; l < 5; l++) { const q = e.quoteLevel({ kind: 'character', id }); costs.push(q.fragmentCost); e.state.fragments[id] = q.fragmentCost; assert.ok(e.levelUp({ kind: 'character', id }).ok); }
  assert.deepEqual(costs, [1, 3, 5, 10]);
});

test('6  karakter-, rom- og oppgraderingsnivå øker inntekten', () => {
  const e = mk(); e.buildRoom('alley'); e.state.coins = 1e12;
  for (const k of [['room', 'alley'], ['upgrade', 'alley.bookie'], ['character', 'alley.mick'], ['character', 'alley.mick']]) {
    const before = e.totalIncome(); e.state.fragments[k[1]] = 99;
    assert.ok(e.levelUp({ kind: k[0], id: k[1] }).ok, k.join(':')); assert.ok(e.totalIncome() > before, k.join(':'));
  }
});

test('7  tre opplåste karakterer gir full-crew-bonus', () => {
  const e = mk(); e.buildRoom('alley'); e.state.characters = { 'alley.mick': 1, 'alley.knuckles': 1 };
  const two = e.roomBreakdown('alley'); assert.equal(two.setMult, 1);
  e.state.characters['alley.ana'] = 1;
  assert.equal(e.roomBreakdown('alley').setMult, 1 + fighter.economy.fullSetBonus);
});

test('9  eldre rom tjener videre og kan oppgraderes etter at nye er bygget', () => {
  const e = mk(); e.buildRoom('alley'); e.state.coins = 1e9; e.buildRoom('gym');
  assert.ok(e.roomIncome('alley') > 0);
  e.state.fragments.alley = 5; assert.ok(e.levelUp({ kind: 'room', id: 'alley' }).ok);
});

test('10 lagring kan eksporteres og gjenopptas, offline-inntekt beregnes', () => {
  t = 1_000_000;
  const e = mk(); e.buildRoom('alley'); e.state.coins = 123;
  const copy = importSave(fighter, exportSave(e), { now: () => t });
  assert.equal(copy.state.coins, 123); assert.ok(copy.isBuilt('alley'));
  const off = copy.catchUp(t + 3600 * 1000);
  assert.ok(Math.abs(off.earned - copy.totalIncome() * 3600) < 1e-6);
  const capped = copy.catchUp(t + 3600e3 + 100 * 3600e3);
  assert.equal(capped.countedSeconds, fighter.economy.offlineCapHours * 3600);
});

test('11 karakterer har plassering og animasjon i konfigurasjon', () => {
  for (const r of fighter.rooms) for (const c of r.characters) for (const k of ['src', 'frames', 'fps', 'x', 'y', 'h']) assert.ok(c.sprite[k] != null, `${c.id}.${k}`);
});

test('12 samme motor kjører et annet tema uten endringer', () => {
  assert.equal(validateTheme(bus).errors.length, 0);
  const e = mk(bus); e.buildRoom('stop'); e.state.coins = 1e6; assert.ok(e.openBooster().ok); assert.ok(e.advance(1) > 0);
});

test('13 ingen nivåøkning uten både fragmenter og valuta', () => {
  const e = mk(); e.buildRoom('alley'); e.state.characters['alley.mick'] = 1;
  for (const tg of [{ kind: 'room', id: 'alley' }, { kind: 'upgrade', id: 'alley.boombox' }, { kind: 'character', id: 'alley.mick' }]) {
    e.state.coins = 1e12; e.state.fragments[tg.id] = 0; assert.equal(e.levelUp(tg).reason, 'fragments');
    e.state.coins = 0; e.state.fragments[tg.id] = 99; assert.equal(e.levelUp(tg).reason, 'coins');
  }
  e.state.coins = 1e9; assert.ok(e.buildRoom('gym').ok, 'nytt rom krever bare valuta');
});

test('14 prestige: synlige krav, reset, permanente bonuser og ny romgrense', () => {
  const e = mk(); e.buildRoom('alley'); e.state.coins = 1e12; e.buildRoom('gym'); e.buildRoom('thai');
  assert.equal(e.quoteBuild('dojo').reason, 'prestige-locked');
  const st = e.prestigeStatus(); assert.equal(st.available, false); assert.ok(st.requirements.length >= 1);
  assert.equal(e.prestige().ok, false);
  e.state.rooms.thai.level = 10; e.state.characters['thai.bob'] = 1; e.state.characters['thai.elbow'] = 1; e.state.fragments['alley.ana'] = 4;
  assert.ok(e.prestigeStatus().available);
  assert.ok(e.prestige().ok);
  const s = e.state;
  assert.equal(s.coins, 0); assert.deepEqual(s.rooms, {}); assert.deepEqual(s.characters, {}); assert.deepEqual(s.fragments, {});
  assert.equal(s.prestige.level, 1); assert.equal(e.prestigeMultiplier(), 2); assert.equal(e.roomLimit(), 4);
  e.buildRoom('alley'); assert.equal(e.totalIncome(), 2 * fighter.rooms[0].baseIncome);
});

test('15 event: utfall, belønning, ingen permanent straff, cooldown', () => {
  t = 5_000_000;
  const e = mk(); e.buildRoom('alley'); e.state.rooms.alley.level = 3; e.state.characters = { 'alley.mick': 1, 'alley.knuckles': 1 };
  const before = JSON.stringify({ c: e.state.characters, r: e.state.rooms });
  const r = e.runEvent('alley.tournament', t); assert.ok(r.ok); assert.ok(r.outcome.cinematic);
  assert.equal(e.eventStatus('alley.tournament', t).reason, 'cooldown');
  assert.equal(JSON.stringify({ c: e.state.characters, r: e.state.rooms }), before);
  const seen = new Set();
  for (let i = 0; i < 200; i++) { t += 601_000; const x = e.runEvent('alley.tournament', t); seen.add(x.outcome.id); assert.ok(e.state.coins >= 0); }
  assert.equal(seen.size, 4);
});

test('15b høyere karakternivå gir bedre odds', () => {
  const e = mk(); e.buildRoom('alley'); e.state.characters = { 'alley.mick': 1, 'alley.knuckles': 1 };
  const low = e.eventWeights('alley.tournament'); e.state.characters = { 'alley.mick': 8, 'alley.knuckles': 8, 'alley.ana': 8 };
  const high = e.eventWeights('alley.tournament');
  const share = (w, id) => w.find(x => x.id === id).weight / w.reduce((s, x) => s + x.weight, 0);
  assert.ok(share(high, 'win') > share(low, 'win')); assert.ok(share(high, 'out') < share(low, 'out'));
});

test('lagring fra eldre temaversjon tåler fjernede rom', () => {
  const st = createState(fighter); st.rooms.ghost = { level: 3, upgrades: {} }; st.rooms.alley = { level: 2 };
  const e = mk(fighter, st); assert.ok(!e.state.rooms.ghost); assert.equal(e.upgradeLevel('alley.bookie'), 0);
});

for (const [s, n] of results) console.log(s, n);
const fails = results.filter(r => r[0] === 'FAIL').length;
console.log(`\n${results.length - fails}/${results.length} ok`);
process.exit(fails ? 1 : 0);
