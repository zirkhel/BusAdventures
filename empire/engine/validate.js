// Empire Engine — theme validator. Used by tools/validate-empire.mjs and (later) the Empire Editor.
// Returns { errors: [], warnings: [] }. Errors break the game; warnings are worth a look.

const RARITIES = ['common', 'rare', 'epic'];
const REQ_TYPES = ['roomBuilt', 'roomLevel', 'charactersUnlocked', 'characterLevelSum', 'upgradeLevel', 'runEarned'];

export function validateTheme(theme) {
  const errors = [], warnings = [];
  const err = m => errors.push(m), warn = m => warnings.push(m);
  const ids = new Map();
  const claim = (id, where) => {
    if (!id || typeof id !== 'string') return err(`${where}: mangler id`);
    if (ids.has(id)) err(`${where}: id «${id}» er allerede brukt av ${ids.get(id)}`);
    else ids.set(id, where);
  };

  if (!theme.id) err('theme.id mangler (brukes som lagringsnøkkel)');
  const eco = theme.economy;
  if (!eco) err('theme.economy mangler');
  else {
    for (const r of RARITIES) if (!eco.rarities?.[r]) err(`economy.rarities.${r} mangler`);
    for (const k of ['roomLevel', 'characterLevel', 'upgrade']) {
      if (!eco[k]) err(`economy.${k} mangler`);
      else if (!eco[k].cost?.seconds) err(`economy.${k}.cost.seconds mangler`);
    }
  }
  if (!Array.isArray(theme.rooms) || !theme.rooms.length) err('theme.rooms er tom');

  const roomIds = new Set(), upgradeIds = new Set();
  for (const room of theme.rooms || []) {
    const w = `rom «${room.id}»`;
    claim(room.id, w); roomIds.add(room.id);
    if (typeof room.price !== 'number') err(`${w}: price mangler`);
    if (!(room.baseIncome > 0)) err(`${w}: baseIncome må være > 0`);
    if (room.characters?.length !== 3) err(`${w}: må ha nøyaktig 3 karakterer (har ${room.characters?.length ?? 0})`);
    if (room.upgrades?.length !== 2) err(`${w}: må ha nøyaktig 2 oppgraderinger (har ${room.upgrades?.length ?? 0})`);
    for (const c of room.characters || []) {
      claim(c.id, `karakter i ${w}`);
      if (!RARITIES.includes(c.rarity)) err(`karakter «${c.id}»: ugyldig rarity «${c.rarity}»`);
      if (!c.sprite) warn(`karakter «${c.id}»: ingen sprite — vises som plassholder`);
      else checkPlacement(c.sprite, `karakter «${c.id}»`, err);
    }
    for (const u of room.upgrades || []) {
      claim(u.id, `oppgradering i ${w}`); upgradeIds.add(u.id);
      if (u.visual) checkPlacement(u.visual, `oppgradering «${u.id}»`, err);
    }
    for (const e of room.events || []) {
      const ew = `event «${e.id}»`;
      claim(e.id, ew);
      if (!e.outcomes?.length) err(`${ew}: ingen utfall`);
      for (const o of e.outcomes || []) {
        if (!(o.weight >= 0)) err(`${ew}/${o.id}: weight mangler`);
        for (const r of o.rewards || []) {
          if (!['coins', 'fragments', 'booster'].includes(r.type)) err(`${ew}/${o.id}: ukjent belønning «${r.type}»`);
          if (r.type === 'coins' && r.seconds < 0) err(`${ew}/${o.id}: negativ belønning — dårlige utfall skal ikke straffe permanent`);
        }
      }
      (e.unlock || []).forEach(rq => checkReq(rq, ew, err));
    }
  }

  const sorted = [...(theme.rooms || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  sorted.forEach((r, i) => {
    if (i > 0 && r.price <= sorted[i - 1].price) warn(`rom «${r.id}» er ikke dyrere enn forrige rom`);
    if (i > 0 && r.baseIncome <= sorted[i - 1].baseIncome) warn(`rom «${r.id}» tjener ikke mer enn forrige rom`);
  });

  const b = theme.booster;
  if (!b) err('theme.booster mangler');
  else {
    if (!(b.draws > 0)) err('booster.draws må være > 0');
    if (!b.slotWeights) err('booster.slotWeights mangler');
    for (const r of RARITIES) if (b.rarityWeights?.[r] == null) err(`booster.rarityWeights.${r} mangler`);
    if (b.rarityWeights && !(b.rarityWeights.common >= b.rarityWeights.rare && b.rarityWeights.rare >= b.rarityWeights.epic))
      warn('booster.rarityWeights: Common bør være vanligst, Epic sjeldnest');
  }

  const p = theme.prestige;
  if (p) {
    let limit = p.startRooms ?? 0;
    if (limit > (theme.rooms?.length || 0)) warn('prestige.startRooms er større enn antall rom');
    (p.tiers || []).forEach((t, i) => {
      if (!t.requires?.length) err(`prestige.tiers[${i}]: må ha synlige krav`);
      (t.requires || []).forEach(rq => checkReq(rq, `prestige.tiers[${i}]`, err));
      if (t.roomLimit != null && t.roomLimit < limit) warn(`prestige.tiers[${i}]: roomLimit går ned`);
      limit = t.roomLimit ?? limit;
    });
  }

  function checkReq(rq, where, e) {
    if (!REQ_TYPES.includes(rq.type)) return e(`${where}: ukjent kravtype «${rq.type}»`);
    if (rq.room && !roomIds.has(rq.room)) e(`${where}: krav peker på ukjent rom «${rq.room}»`);
    if (rq.upgrade && !upgradeIds.has(rq.upgrade)) e(`${where}: krav peker på ukjent oppgradering «${rq.upgrade}»`);
  }

  return { errors, warnings };
}

function checkPlacement(v, where, err) {
  for (const k of ['x', 'y', 'h']) if (typeof v[k] !== 'number') err(`${where}: plassering mangler «${k}» (prosent av scenen)`);
}
