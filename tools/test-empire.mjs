#!/usr/bin/env node
// Engine tests mapped to the acceptance criteria in the project plan (§15).
//   node tools/test-empire.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { Empire, createState } from '../empire/engine/empire.js';
import { seededRng } from '../empire/engine/curves.js';
import { validateTheme } from '../empire/engine/validate.js';
import { exportSave, importSave } from '../empire/engine/save.js';
import { sheetGrid } from '../empire/ui/scene.js';

const load = id => JSON.parse(readFileSync(`games/${id}/theme.json`, 'utf8'));
const fighter = load('fighter-empire'), bus = load('bus-empire'), quest = load('quest-empire'), space = load('space-empire'), xxx = load('xxx-empire'), ninja = load('ninja-empire');
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

test('2  tre karakterplasser og tre oppgraderinger per rom', () => {
  for (const th of [fighter, bus, quest, space, xxx, ninja]) for (const r of th.rooms) { assert.equal(r.characters.length, 3); assert.equal(r.upgrades.length, 3); }
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
  assert.ok(Math.abs(off.earned - copy.totalIncome() * 3600 * (fighter.economy.offlineRate ?? 1)) < 1e-6);
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

test('12b Quest Empire (RPG) kjører på samme motor med egne ord', () => {
  assert.equal(validateTheme(quest).errors.length, 0);
  const e = mk(quest); e.buildRoom('cellar'); e.state.coins = 1e6; assert.ok(e.openBooster().ok);
  e.state.fragments['cellar.rat'] = 2; assert.ok(e.levelUp({ kind: 'character', id: 'cellar.rat' }).ok);
  assert.equal(quest.presentation.labels.hire, 'Defeat');
});

test('12c Space Empire: tredje tema, kun konfigurasjon', () => {
  assert.equal(validateTheme(space).errors.length, 0);
  const e = mk(space); e.buildRoom('moon'); e.state.coins = 1e6; assert.ok(e.openBooster().ok);
  e.state.fragments['moon.bot'] = 2; assert.ok(e.levelUp({ kind: 'character', id: 'moon.bot' }).ok);
  assert.equal(space.presentation.labels.hire, 'Deploy');
});

test('12d XXX Empire: 8 rom, kun konfigurasjon — start, inntekt, pakker, oppgradering, events, prestige', () => {
  assert.equal(validateTheme(xxx).errors.length, 0);
  assert.equal(xxx.rooms.length, 8);
  for (const r of xxx.rooms) { assert.equal(r.events.length, 1); assert.deepEqual(r.upgrades.map(u => u.rarity).sort(), ['common', 'epic', 'rare']); }
  t = 9_000_000;
  const e = mk(xxx);
  assert.ok(e.buildRoom('alley').ok);                                   // 1 start
  assert.ok(e.advance(10) > 0);                                         // 2 inntekt
  e.state.coins = 1e9; const b = e.openBooster(); assert.ok(b.ok && b.rewards.length === 3);   // 3 pakker
  e.state.fragments['alley.lola'] = 9; assert.ok(e.levelUp({ kind: 'character', id: 'alley.lola' }).ok);
  assert.ok(e.levelUp({ kind: 'character', id: 'alley.lola' }).ok);     // 4 oppgradering (karakter)
  e.state.fragments['alley.cashbox'] = 9; assert.ok(e.levelUp({ kind: 'upgrade', id: 'alley.cashbox' }).ok);   // 4 objekt
  e.state.fragments['alley'] = 9; assert.ok(e.levelUp({ kind: 'room', id: 'alley' }).ok);                  // romnivå
  e.state.rooms.alley.level = 3; e.state.characters['alley.rick'] = 1;
  const ev = e.runEvent('alley.rush', t); assert.ok(ev.ok && ev.outcome.cinematic);                     // 6 event
  assert.ok(e.buildRoom('motel').ok && e.buildRoom('studio').ok);
  assert.equal(e.quoteBuild('mansion').reason, 'prestige-locked');
  e.state.rooms.studio.level = 10; e.state.characters['studio.rita'] = 1; e.state.characters['studio.dave'] = 1;
  assert.ok(e.prestige().ok); assert.equal(e.roomLimit(), 4); assert.equal(e.prestigeMultiplier(), 2);   // 5 prestige
  const p = e; p.state.prestige.level = xxx.prestige.tiers.length; assert.equal(p.roomLimit(), 8);
  assert.equal(xxx.prestige.name, 'Rebrand');
});

test('12e Ninja Empire: 8 rom, kun konfigurasjon — start, inntekt, pakker, oppgradering, events med fire utfall, prestige', () => {
  assert.equal(validateTheme(ninja).errors.length, 0);
  assert.equal(ninja.rooms.length, 8);
  for (const r of ninja.rooms) { assert.equal(r.events.length, 1); assert.equal(r.events[0].outcomes.length, 4); }
  t = 9_000_000;
  const e = mk(ninja);
  assert.ok(e.buildRoom('training').ok); assert.ok(e.advance(10) > 0);
  e.state.coins = 1e9; const b = e.openBooster(); assert.ok(b.ok && b.rewards.length === 3);
  e.state.fragments['training.taro'] = 9; assert.ok(e.levelUp({ kind: 'character', id: 'training.taro' }).ok);
  e.state.fragments['training.rack'] = 9; assert.ok(e.levelUp({ kind: 'upgrade', id: 'training.rack' }).ok);
  e.state.rooms.training.level = 3; e.state.characters['training.yuki'] = 1;
  const ev = e.runEvent('training.trial', t); assert.ok(ev.ok && ev.outcome.cinematic);
  assert.ok(e.buildRoom('village').ok && e.buildRoom('rooftops').ok);
  assert.equal(e.quoteBuild('temple').reason, 'prestige-locked');
  e.state.rooms.rooftops.level = 10; e.state.characters['rooftops.riku'] = 1; e.state.characters['rooftops.akira'] = 1;
  assert.ok(e.prestige().ok); assert.equal(e.roomLimit(), 4);
  e.state.prestige.level = ninja.prestige.tiers.length; assert.equal(e.roomLimit(), 8);
  assert.equal(ninja.prestige.name, 'Rebirth of the Clan'); assert.equal(ninja.booster.name, 'Secret Scroll');
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
  assert.equal(s.coins, fighter.economy.startCoins ?? 0); assert.deepEqual(s.rooms, {}); assert.deepEqual(s.characters, {}); assert.deepEqual(s.fragments, {});
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

test('previewGain stemmer med faktisk inntektsøkning og endrer ikke tilstand', () => {
  const e = mk(); e.buildRoom('alley'); e.state.coins = 1e12; e.state.characters = { 'alley.mick': 1, 'alley.knuckles': 1 };
  for (const tg of [{ kind: 'room', id: 'alley' }, { kind: 'upgrade', id: 'alley.bookie' }, { kind: 'character', id: 'alley.mick' }, { kind: 'character', id: 'alley.ana' }]) {
    e.state.fragments[tg.id] = 99;
    const snap = JSON.stringify(e.state), g = e.previewGain(tg);
    assert.equal(JSON.stringify(e.state), snap);
    const before = e.totalIncome(); e.levelUp(tg);
    assert.ok(Math.abs(e.totalIncome() - before - g.income) < 1e-9, tg.id);
  }
});

test('gear har Common/Rare/Epic: sjeldnere trekkes sjeldnere og gir mer per nivå', () => {
  for (const r of fighter.rooms) assert.deepEqual(r.upgrades.map(u => u.rarity).sort(), ['common', 'epic', 'rare']);
  const e = mk(); e.buildRoom('alley'); const n = { common: 0, rare: 0, epic: 0 };
  for (let i = 0; i < 3000; i++) { e.state.coins = 1e12; for (const r of e.openBooster().rewards) if (r.kind === 'upgrade') n[r.rarity]++; e.state.fragments = {}; }
  assert.ok(n.common > n.rare && n.rare > n.epic, JSON.stringify(n));
  const by = r => fighter.rooms[0].upgrades.find(u => u.rarity === r).id;
  assert.ok(e.upgradeIncomePerLevel(by('epic')) > e.upgradeIncomePerLevel(by('rare')));
  assert.ok(e.upgradeIncomePerLevel(by('rare')) > e.upgradeIncomePerLevel(by('common')));
  e.state.coins = 0;
  assert.ok(e.quoteLevel({ kind: 'upgrade', id: by('epic') }).coins > e.quoteLevel({ kind: 'upgrade', id: by('common') }).coins);
});

test('alle rom har en event, og alle seks rom kan nås via prestige', () => {
  assert.equal(fighter.rooms.length, 6);
  for (const r of fighter.rooms) assert.ok(r.events?.length >= 1, r.id);
  const e = mk(); e.state.prestige.level = fighter.prestige.tiers.length; assert.equal(e.roomLimit(), 6);
});

test('åpne flere pakker: stopper når pengene er brukt opp', () => {
  const e = mk(); e.buildRoom('alley');
  const price = e.boosterPrice(); e.state.coins = price * 4 + 1;
  const r = e.openBoosters(10);
  assert.ok(r.ok); assert.ok(r.opened >= 4, String(r.opened)); assert.equal(r.rewards.length, r.opened * fighter.booster.draws);
  e.state.coins = 0; assert.equal(e.openBoosters(10).reason, 'coins');
});

test('lagring fra eldre temaversjon tåler fjernede rom', () => {
  const st = createState(fighter); st.rooms.ghost = { level: 3, upgrades: {} }; st.rooms.alley = { level: 2 };
  const e = mk(fighter, st); assert.ok(!e.state.rooms.ghost); assert.equal(e.upgradeLevel('alley.bookie'), 0);
});

test('spritesheet: én rad som før, og rutenett med kolonner og rader', () => {
  assert.deepEqual(sheetGrid({ frames: 8 }), { frames: 8, cols: 8, rows: 1 });
  assert.deepEqual(sheetGrid({ frames: 24, columns: 6, rows: 4 }), { frames: 24, cols: 6, rows: 4 });
  assert.deepEqual(sheetGrid({ frames: 24, columns: 6 }), { frames: 24, cols: 6, rows: 4 });
  assert.deepEqual(sheetGrid({ frames: 22, rows: 4 }), { frames: 22, cols: 6, rows: 4 });
  const th = structuredClone(xxx), sp = th.rooms[0].characters[0].sprite;
  Object.assign(sp, { frames: 24, columns: 6, rows: 4 }); assert.equal(validateTheme(th).errors.length, 0);
  sp.rows = 3; assert.ok(validateTheme(th).errors.some(e => e.includes('rutenett')));
});

for (const [s, n] of results) console.log(s, n);
const fails = results.filter(r => r[0] === 'FAIL').length;
console.log(`\n${results.length - fails}/${results.length} ok`);
process.exit(fails ? 1 : 0);
