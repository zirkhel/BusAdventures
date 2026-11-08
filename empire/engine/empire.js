// Empire Engine — Layer A (game mechanics).
// Knows nothing about the DOM, art style or theme. Everything theme-specific
// comes from the theme definition (Layer B, a JSON file).
//
//   const empire = new Empire(themeJson, savedStateOrNull);
//   empire.advance(seconds);           // earn income
//   empire.quoteLevel({kind, id});     // what would this cost?
//   empire.levelUp({kind, id});        // do it
//   empire.openBooster();              // random rewards
//
// Every action returns { ok: true, ... } or { ok: false, reason }.

import { curveAt, weightedPick, pick } from './curves.js';

export const SAVE_VERSION = 1;
const RARITIES = ['common', 'rare', 'epic'];

export class Empire {
  constructor(theme, state = null, { rng = Math.random, now = () => Date.now() } = {}) {
    this.theme = theme;
    this.rng = rng;
    this.now = now;
    this._index();
    this.state = state ? migrateState(state, theme) : createState(theme, now());
  }

  // ───────────────────────────── theme lookup ─────────────────────────────

  _index() {
    const t = this.theme;
    this.roomList = [...t.rooms].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    this.rooms = {}; this.characters = {}; this.upgrades = {}; this.events = {};
    this.roomList.forEach((room, i) => {
      room._index = i;
      this.rooms[room.id] = room;
      for (const c of room.characters) this.characters[c.id] = { ...c, roomId: room.id };
      for (const u of room.upgrades) this.upgrades[u.id] = { ...u, roomId: room.id };
      for (const e of room.events || []) this.events[e.id] = { ...e, roomId: room.id };
    });
  }

  get eco() { return this.theme.economy; }
  rarity(r) { return this.eco.rarities[r]; }

  // ──────────────────────────────── income ────────────────────────────────

  isBuilt(roomId) { return !!this.state.rooms[roomId]; }
  builtRooms() { return this.roomList.filter(r => this.isBuilt(r.id)); }
  charLevel(id) { return this.state.characters[id] || 0; }
  upgradeLevel(id) {
    const u = this.upgrades[id];
    return this.state.rooms[u.roomId]?.upgrades[id] || 0;
  }
  roomLevel(roomId) { return this.state.rooms[roomId]?.level || 0; }
  fragments(id) { return this.state.fragments[id] || 0; }

  characterIncome(charId) {
    const c = this.characters[charId];
    const lvl = this.charLevel(charId);
    if (!lvl) return 0;
    const room = this.rooms[c.roomId];
    const share = pick(c.incomeShare, this.rarity(c.rarity).incomeShare);
    const perLevel = pick(c.incomePerLevel, this.eco.characterLevel.incomePerLevel);
    return room.baseIncome * share * (1 + perLevel * (lvl - 1));
  }

  fullSet(roomId) {
    return this.rooms[roomId].characters.every(c => this.charLevel(c.id) > 0);
  }

  /** Income breakdown for one room, before the prestige multiplier. */
  roomBreakdown(roomId) {
    const room = this.rooms[roomId];
    const L = this.roomLevel(roomId);
    if (!L) return { core: 0, characters: 0, upgradeMult: 1, setMult: 1, total: 0 };
    const perLevel = pick(room.incomePerLevel, this.eco.roomLevel.incomePerLevel);
    const core = room.baseIncome * (1 + perLevel * (L - 1));
    const characters = room.characters.reduce((s, c) => s + this.characterIncome(c.id), 0);
    let upgradeMult = 1;
    for (const u of room.upgrades) {
      const p = pick(u.incomePerLevel, this.eco.upgrade.incomePerLevel);
      upgradeMult *= 1 + p * this.upgradeLevel(u.id);
    }
    const setMult = this.fullSet(roomId) ? 1 + pick(room.fullSetBonus, this.eco.fullSetBonus) : 1;
    return { core, characters, upgradeMult, setMult, total: (core + characters) * upgradeMult * setMult };
  }

  roomIncome(roomId) { return this.roomBreakdown(roomId).total * this.prestigeMultiplier(); }
  totalIncome() { return this.builtRooms().reduce((s, r) => s + this.roomIncome(r.id), 0); }

  /** Earn income for `seconds`. Returns coins earned. */
  advance(seconds) {
    if (seconds <= 0) return 0;
    const earned = this.totalIncome() * seconds;
    this._gain(earned);
    return earned;
  }

  _gain(amount) {
    this.state.coins += amount;
    this.state.stats.totalEarned += amount;
    this.state.stats.runEarned += amount;
  }

  /** Offline income since state.lastSeen. Call once after loading. */
  catchUp(nowMs = this.now()) {
    const away = Math.max(0, (nowMs - (this.state.lastSeen || nowMs)) / 1000);
    const capH = this.eco.offlineCapHours;
    const counted = capH == null ? away : Math.min(away, capH * 3600);
    const rate = pick(this.eco.offlineRate, 1);
    const earned = this.totalIncome() * counted * rate;
    this._gain(earned);
    this.state.lastSeen = nowMs;
    return { awaySeconds: away, countedSeconds: counted, earned };
  }

  // ───────────────────────────── building rooms ───────────────────────────

  /** Number of rooms allowed in the current prestige level. */
  roomLimit() {
    const p = this.theme.prestige;
    if (!p) return this.roomList.length;
    let limit = p.startRooms ?? this.roomList.length;
    for (let i = 0; i < this.state.prestige.level && i < p.tiers.length; i++) {
      limit = pick(p.tiers[i].roomLimit, limit);
    }
    return Math.min(limit, this.roomList.length);
  }

  quoteBuild(roomId) {
    const room = this.rooms[roomId];
    if (!room) return { ok: false, reason: 'unknown-room' };
    if (this.isBuilt(roomId)) return { ok: false, reason: 'built' };
    if (room._index >= this.roomLimit()) return { ok: false, reason: 'prestige-locked', coins: room.price };
    const prev = this.roomList[room._index - 1];
    if (prev && !this.isBuilt(prev.id)) return { ok: false, reason: 'previous-room', coins: room.price };
    const coins = room.price;
    if (this.state.coins < coins) return { ok: false, reason: 'coins', coins };
    return { ok: true, coins };
  }

  buildRoom(roomId) {
    const q = this.quoteBuild(roomId);
    if (!q.ok) return q;
    this.state.coins -= q.coins;
    const upgrades = {};
    for (const u of this.rooms[roomId].upgrades) upgrades[u.id] = 0;
    this.state.rooms[roomId] = { level: 1, upgrades };
    return { ok: true, roomId };
  }

  // ─────────────────────────────── levelling ──────────────────────────────
  // target = { kind: 'room' | 'character' | 'upgrade', id }
  // Room level, character level and upgrade level all cost fragments AND coins.
  // Character unlock (level 0 → 1) costs fragments only (unless unlockSeconds set).

  quoteLevel({ kind, id }) {
    if (kind === 'room') return this._quoteRoom(id);
    if (kind === 'character') return this._quoteCharacter(id);
    if (kind === 'upgrade') return this._quoteUpgrade(id);
    return { ok: false, reason: 'unknown-kind' };
  }

  _finishQuote(q) {
    q.have = this.fragments(q.fragmentKey);
    if (q.maxed) return { ...q, ok: false, reason: 'max' };
    if (!this.isBuilt(q.roomId)) return { ...q, ok: false, reason: 'room-not-built' };
    if (q.have < q.fragmentCost) return { ...q, ok: false, reason: 'fragments' };
    if (this.state.coins < q.coins) return { ...q, ok: false, reason: 'coins' };
    return { ...q, ok: true };
  }

  _quoteRoom(roomId) {
    const room = this.rooms[roomId];
    const cfg = this.eco.roomLevel;
    const L = this.roomLevel(roomId);
    const max = pick(room.maxLevel, cfg.maxLevel);
    const cost = pick(room.levelCost, cfg.cost);
    return this._finishQuote({
      kind: 'room', id: roomId, roomId, action: 'level', from: L, to: L + 1, maxLevel: max, maxed: L >= max,
      fragmentKey: roomId,
      fragmentCost: curveAt(pick(room.levelFragments, cfg.fragments), Math.max(L, 1)),
      coins: Math.round(room.baseIncome * cost.seconds * cost.growth ** (Math.max(L, 1) - 1)),
    });
  }

  _quoteCharacter(charId) {
    const c = this.characters[charId];
    const room = this.rooms[c.roomId];
    const cfg = this.eco.characterLevel;
    const rar = this.rarity(c.rarity);
    const lvl = this.charLevel(charId);
    const max = pick(c.maxLevel, cfg.maxLevel);
    if (lvl === 0) {
      const unlockSec = pick(c.unlockSeconds, rar.unlockSeconds, 0);
      return this._finishQuote({
        kind: 'character', id: charId, roomId: c.roomId, action: 'unlock', from: 0, to: 1, maxLevel: max, maxed: false,
        fragmentKey: charId,
        fragmentCost: pick(c.unlockFragments, rar.unlockFragments),
        coins: Math.round(room.baseIncome * unlockSec),
      });
    }
    const cost = pick(c.levelCost, cfg.cost);
    const factor = pick(c.costFactor, rar.costFactor, 1);
    return this._finishQuote({
      kind: 'character', id: charId, roomId: c.roomId, action: 'level', from: lvl, to: lvl + 1, maxLevel: max, maxed: lvl >= max,
      fragmentKey: charId,
      // fragments[0] is the cost of level 1→2, fragments[1] of 2→3 …
      fragmentCost: curveAt(pick(c.levelFragments, cfg.fragments), lvl),
      coins: Math.round(room.baseIncome * cost.seconds * factor * cost.growth ** (lvl - 1)),
    });
  }

  _quoteUpgrade(upgId) {
    const u = this.upgrades[upgId];
    const room = this.rooms[u.roomId];
    const cfg = this.eco.upgrade;
    const lvl = this.upgradeLevel(upgId);
    const max = pick(u.maxLevel, cfg.maxLevel);
    const cost = pick(u.levelCost, cfg.cost);
    return this._finishQuote({
      kind: 'upgrade', id: upgId, roomId: u.roomId, action: lvl === 0 ? 'unlock' : 'level', from: lvl, to: lvl + 1,
      maxLevel: max, maxed: lvl >= max,
      fragmentKey: upgId,
      fragmentCost: curveAt(pick(u.levelFragments, cfg.fragments), lvl + 1),
      coins: Math.round(room.baseIncome * cost.seconds * cost.growth ** lvl),
    });
  }

  /**
   * What the next level would add, ignoring whether it is affordable.
   * Returns { income: added income per second (incl. prestige), roomShare: fraction of the room's current income }
   * or null when maxed. Used by the UI to show the benefit on every button.
   */
  previewGain(target) {
    const q = this.quoteLevel(target);
    if (q.maxed || !this.isBuilt(q.roomId)) return null;
    const saved = JSON.stringify(this.state);
    const before = this.totalIncome();
    const roomBefore = this.roomIncome(q.roomId);
    if (q.kind === 'room') this.state.rooms[q.id].level = q.to;
    if (q.kind === 'character') this.state.characters[q.id] = q.to;
    if (q.kind === 'upgrade') this.state.rooms[q.roomId].upgrades[q.id] = q.to;
    const income = this.totalIncome() - before;
    this.state = JSON.parse(saved);
    return { income, roomShare: roomBefore > 0 ? income / roomBefore : null, completesCrew: q.kind === 'character' && q.action === 'unlock' && this._wouldCompleteCrew(q) };
  }

  _wouldCompleteCrew(q) {
    return this.rooms[q.roomId].characters.every(c => c.id === q.id || this.charLevel(c.id) > 0);
  }

  levelUp(target) {
    const q = this.quoteLevel(target);
    if (!q.ok) return q;
    this.state.coins -= q.coins;
    this.state.fragments[q.fragmentKey] = q.have - q.fragmentCost;
    if (q.kind === 'room') this.state.rooms[q.id].level = q.to;
    if (q.kind === 'character') this.state.characters[q.id] = q.to;
    if (q.kind === 'upgrade') this.state.rooms[q.roomId].upgrades[q.id] = q.to;
    return { ...q, ok: true };
  }

  // ─────────────────────────────── boosters ───────────────────────────────

  boosterPrice() {
    const b = this.theme.booster;
    return Math.max(b.minPrice ?? 0, Math.round(this.totalIncome() * b.priceSeconds));
  }

  /** Things a booster can currently give. Only content from built rooms. */
  boosterPool() {
    const exclude = this.theme.booster.excludeMaxed !== false;
    const pool = { character: [], room: [], upgrade: [] };
    for (const room of this.builtRooms()) {
      for (const c of room.characters) {
        const maxed = this.charLevel(c.id) >= pick(c.maxLevel, this.eco.characterLevel.maxLevel);
        if (!(exclude && maxed)) pool.character.push(this.characters[c.id]);
      }
      if (!(exclude && this.quoteLevel({ kind: 'room', id: room.id }).maxed)) pool.room.push(room);
      for (const u of room.upgrades) {
        if (!(exclude && this.quoteLevel({ kind: 'upgrade', id: u.id }).maxed)) pool.upgrade.push(this.upgrades[u.id]);
      }
    }
    return pool;
  }

  openBooster({ free = false } = {}) {
    const b = this.theme.booster;
    const price = free ? 0 : this.boosterPrice();
    if (this.state.coins < price) return { ok: false, reason: 'coins', coins: price };
    if (!this.builtRooms().length) return { ok: false, reason: 'no-rooms' };
    this.state.coins -= price;
    const incomeAtOpen = Math.max(this.totalIncome(), 1);
    const rewards = [];
    const bs = this.state.booster;
    const pityDue = b.epicPity && bs.sinceEpic + 1 >= b.epicPity;
    let gotEpic = false;

    for (let i = 0; i < b.draws; i++) {
      const pool = this.boosterPool();
      const forceEpic = pityDue && !gotEpic && i === b.draws - 1 && pool.character.some(c => c.rarity === 'epic');
      const slot = forceEpic ? 'character' : weightedPick(Object.keys(b.slotWeights), k => {
        if (k === 'coins') return b.slotWeights.coins;
        return pool[k]?.length ? b.slotWeights[k] : 0;
      }, this.rng);
      let reward;
      if (slot === 'character') {
        const rarities = RARITIES.filter(r => pool.character.some(c => c.rarity === r));
        const rarity = forceEpic ? 'epic' : weightedPick(rarities, r => b.rarityWeights[r], this.rng);
        const ch = weightedPick(pool.character.filter(c => c.rarity === rarity), () => 1, this.rng);
        reward = { type: 'fragment', kind: 'character', id: ch.id, roomId: ch.roomId, rarity, amount: 1 };
        if (rarity === 'epic') gotEpic = true;
      } else if (slot === 'room') {
        const room = weightedPick(pool.room, () => 1, this.rng);
        reward = { type: 'fragment', kind: 'room', id: room.id, roomId: room.id, amount: 1 };
      } else if (slot === 'upgrade') {
        const u = weightedPick(pool.upgrade, () => 1, this.rng);
        reward = { type: 'fragment', kind: 'upgrade', id: u.id, roomId: u.roomId, amount: 1 };
      } else {
        const [lo, hi] = b.coinsSeconds;
        const amount = Math.round(incomeAtOpen * (lo + (hi - lo) * this.rng()));
        reward = { type: 'coins', amount };
      }
      rewards.push(reward);
    }

    for (const r of rewards) {
      if (r.type === 'coins') this._gain(r.amount);
      else this.state.fragments[r.id] = this.fragments(r.id) + r.amount;
    }
    bs.opened += 1;
    bs.sinceEpic = gotEpic ? 0 : bs.sinceEpic + 1;
    this.state.stats.boostersOpened += 1;
    return { ok: true, price, rewards, pity: forceEpicUsed(rewards, pityDue) };
  }

  // ──────────────────────────── requirements ──────────────────────────────
  // Shared by prestige and events. Each returns { met, current, target }.

  checkRequirement(req) {
    let current = 0;
    switch (req.type) {
      case 'roomBuilt': current = this.isBuilt(req.room) ? 1 : 0; return { ...req, current, target: 1, met: current >= 1 };
      case 'roomLevel': current = this.roomLevel(req.room); break;
      case 'charactersUnlocked': {
        const chars = req.room ? this.rooms[req.room].characters : Object.values(this.characters);
        current = chars.filter(c => this.charLevel(c.id) > 0).length; break;
      }
      case 'characterLevelSum': {
        const chars = req.room ? this.rooms[req.room].characters : Object.values(this.characters);
        current = chars.reduce((s, c) => s + this.charLevel(c.id), 0); break;
      }
      case 'upgradeLevel': current = this.upgradeLevel(req.upgrade); break;
      case 'runEarned': current = this.state.stats.runEarned; break;
      default: return { ...req, current: 0, target: req.min, met: false };
    }
    return { ...req, current, target: req.min, met: current >= req.min };
  }

  checkAll(reqs = []) {
    const list = reqs.map(r => this.checkRequirement(r));
    return { met: list.every(r => r.met), list };
  }

  // ─────────────────────────────── prestige ───────────────────────────────

  prestigeMultiplier() {
    const p = this.theme.prestige;
    let m = 1;
    if (!p) return m;
    for (let i = 0; i < this.state.prestige.level && i < p.tiers.length; i++) {
      m = pick(p.tiers[i].incomeMultiplier, m);
    }
    return m;
  }

  prestigeStatus() {
    const p = this.theme.prestige;
    if (!p) return { available: false, reason: 'no-prestige' };
    const tier = p.tiers[this.state.prestige.level];
    if (!tier) return { available: false, reason: 'final', level: this.state.prestige.level };
    const check = this.checkAll(tier.requires);
    return {
      available: check.met, level: this.state.prestige.level, tier,
      requirements: check.list,
      effects: { incomeMultiplier: pick(tier.incomeMultiplier, this.prestigeMultiplier()), roomLimit: pick(tier.roomLimit, this.roomLimit()) },
    };
  }

  /** Voluntary reset. The UI must ask the player to confirm before calling this. */
  prestige() {
    const st = this.prestigeStatus();
    if (!st.available) return { ok: false, reason: st.reason || 'requirements' };
    const keep = {
      prestige: { level: this.state.prestige.level + 1 },
      stats: { ...this.state.stats, prestiges: this.state.stats.prestiges + 1, runEarned: 0 },
      settings: this.state.settings,
    };
    const fresh = createState(this.theme, this.now());
    this.state = { ...fresh, ...keep };
    return { ok: true, level: this.state.prestige.level, effects: st.effects };
  }

  // ──────────────────────────────── events ────────────────────────────────

  eventStatus(eventId, nowMs = this.now()) {
    const ev = this.events[eventId];
    const rec = this.state.events[eventId] || { runs: 0, lastRun: 0 };
    const built = this.isBuilt(ev.roomId);
    const check = this.checkAll(ev.unlock);
    const once = ev.repeatable === false && rec.runs > 0;
    const cooldownLeft = Math.max(0, (rec.lastRun + (ev.cooldownSeconds || 0) * 1000 - nowMs) / 1000);
    const coins = Math.round(this.rooms[ev.roomId].baseIncome * (ev.costSeconds || 0));
    let reason = null;
    if (!built) reason = 'room-not-built';
    else if (!check.met) reason = 'locked';
    else if (once) reason = 'done';
    else if (cooldownLeft > 0) reason = 'cooldown';
    else if (this.state.coins < coins) reason = 'coins';
    return { ok: !reason, reason, unlocked: built && check.met, requirements: check.list, cooldownLeft, coins, runs: rec.runs };
  }

  /** Outcome weights after character skill is applied. */
  eventWeights(eventId) {
    const ev = this.events[eventId];
    const chars = ev.skillFrom === 'none' ? [] : this.rooms[ev.roomId].characters;
    const skill = chars.reduce((s, c) => s + this.charLevel(c.id), 0);
    return ev.outcomes.map(o => ({ id: o.id, weight: Math.max(o.minWeight ?? 1, o.weight + (o.skillWeight || 0) * skill) }));
  }

  /** Picks and stores the outcome. The renderer plays the cinematic afterwards. */
  runEvent(eventId, nowMs = this.now()) {
    const st = this.eventStatus(eventId, nowMs);
    if (!st.ok) return st;
    const ev = this.events[eventId];
    this.state.coins -= st.coins;
    const weights = this.eventWeights(eventId);
    const pickId = weightedPick(weights, w => w.weight, this.rng).id;
    const outcome = ev.outcomes.find(o => o.id === pickId);
    const rewards = [];
    for (const r of outcome.rewards || []) {
      if (r.type === 'coins') {
        const amount = Math.round(this.roomIncome(ev.roomId) * r.seconds);
        this._gain(amount); rewards.push({ type: 'coins', amount });
      } else if (r.type === 'fragments') {
        const pool = (r.scope === 'room' ? this.rooms[ev.roomId].characters.map(c => this.characters[c.id]) : this.boosterPool().character)
          .filter(c => !r.rarity || c.rarity === r.rarity);
        for (let i = 0; i < (r.count || 1); i++) {
          const c = weightedPick(pool, () => 1, this.rng);
          if (!c) break;
          this.state.fragments[c.id] = this.fragments(c.id) + 1;
          rewards.push({ type: 'fragment', kind: 'character', id: c.id, roomId: c.roomId, rarity: c.rarity, amount: 1 });
        }
      } else if (r.type === 'booster') {
        for (let i = 0; i < (r.count || 1); i++) {
          const b = this.openBooster({ free: true });
          if (b.ok) rewards.push(...b.rewards);
        }
      }
    }
    const rec = this.state.events[eventId] || { runs: 0, lastRun: 0, history: [] };
    rec.runs += 1; rec.lastRun = nowMs;
    rec.history = [...(rec.history || []), outcome.id].slice(-20);
    this.state.events[eventId] = rec;
    return { ok: true, eventId, outcome, rewards, weights };
  }

  // ───────────────────────────────── save ─────────────────────────────────

  snapshot(nowMs = this.now()) {
    this.state.lastSeen = nowMs;
    return JSON.parse(JSON.stringify(this.state));
  }
}

function forceEpicUsed(rewards, pityDue) {
  return !!pityDue && rewards.some(r => r.rarity === 'epic');
}

export function createState(theme, nowMs = Date.now()) {
  return {
    saveVersion: SAVE_VERSION,
    themeId: theme.id,
    coins: theme.economy.startCoins ?? 0,
    lastSeen: nowMs,
    rooms: {},        // roomId → { level, upgrades: { upgradeId → level } }   (built rooms only)
    characters: {},   // characterId → level   (unlocked only)
    fragments: {},    // characterId | roomId | upgradeId → count
    booster: { opened: 0, sinceEpic: 0 },
    prestige: { level: 0 },
    events: {},       // eventId → { runs, lastRun, history }
    stats: { totalEarned: 0, runEarned: 0, boostersOpened: 0, prestiges: 0 },
    settings: {},
  };
}

/** Upgrade old saves and drop ids that no longer exist in the theme. */
export function migrateState(raw, theme) {
  const base = createState(theme, raw.lastSeen ?? Date.now());
  const s = { ...base, ...raw,
    booster: { ...base.booster, ...raw.booster },
    prestige: { ...base.prestige, ...raw.prestige },
    stats: { ...base.stats, ...raw.stats },
    settings: { ...base.settings, ...raw.settings } };
  // (future) if (s.saveVersion < 2) { ... }
  s.saveVersion = SAVE_VERSION;
  const roomIds = new Set(theme.rooms.map(r => r.id));
  for (const id of Object.keys(s.rooms)) {
    if (!roomIds.has(id)) { delete s.rooms[id]; continue; }
    const room = theme.rooms.find(r => r.id === id);
    const ups = {};
    for (const u of room.upgrades) ups[u.id] = s.rooms[id].upgrades?.[u.id] || 0;
    s.rooms[id].upgrades = ups;
  }
  return s;
}
