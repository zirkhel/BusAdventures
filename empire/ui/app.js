// Empire UI — app shell (Layer C). Mounts any theme:
//
//   import { mountEmpire } from '../../empire/ui/app.js';
//   mountEmpire(document.getElementById('empire'), new URL('./theme.json', import.meta.url));

import { loadEmpire, saveEmpire, exportSave, importSave, clearSave } from '../engine/save.js';
import { validateTheme } from '../engine/validate.js';
import { renderScene, releaseScene, sceneSignature, portrait, upgradeStage, makeLayer } from './scene.js';
import { playCinematic } from './cinematic.js';
import { fmt, fmtTime, esc } from './format.js';

const TICK_MS = 250, SAVE_MS = 5000, AWAY_S = 30;

export async function mountEmpire(root, themeUrl) {
  const theme = await (await fetch(themeUrl)).json();
  const { errors, warnings } = validateTheme(theme);
  warnings.forEach(w => console.warn('[empire]', w));
  if (errors.length) {
    root.innerHTML = `<pre class="emp-error">Theme errors:\n${errors.map(esc).join('\n')}</pre>`;
    return;
  }
  const app = new EmpireApp(root, theme, themeUrl);
  app.start();
  return app;
}

class EmpireApp {
  constructor(root, theme, themeUrl) {
    this.root = root;
    this.theme = theme;
    this.asset = src => new URL(src, themeUrl).href;
    this.sym = theme.currency?.symbol ?? '$';
    this.sceneCache = {};
    this.openRoomId = null;      // null = room list, otherwise the room's upgrade page
    this.pushedRoom = false;     // true when the list sits right below us in browser history
    this.listScroll = 0;
    this.justUnlocked = new Set();
  }

  money(n) { return this.sym + fmt(n); }

  start() {
    const { empire, offline, isNew } = loadEmpire(this.theme);
    this.empire = empire;
    this.applyPalette();
    this.buildShell();
    const fromHash = decodeURIComponent(location.hash.slice(1));
    if (fromHash && this.empire.isBuilt(fromHash)) { this.openRoomId = fromHash; history.replaceState({ room: fromHash }, ''); }
    addEventListener('popstate', e => { this.pushedRoom = !!e.state?.room; this.showView(e.state?.room || null); });
    this.renderRooms();
    if (offline && offline.earned > 0 && offline.awaySeconds > AWAY_S) this.showWelcomeBack(offline);
    else if (isNew) this.showHelp();
    this.lastTick = Date.now();
    this.lastSave = Date.now();
    setInterval(() => this.tick(), TICK_MS);
    const persist = () => saveEmpire(this.empire);
    addEventListener('pagehide', persist);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') persist(); else this.tick();
    });
  }

  applyPalette() {
    const p = this.theme.presentation?.palette || {};
    for (const [k, v] of Object.entries(p)) this.root.style.setProperty(`--emp-${k}`, v);
    if (this.theme.presentation?.fontDisplay) this.root.style.setProperty('--emp-display', this.theme.presentation.fontDisplay);
    if (this.theme.presentation?.sceneAspect) this.root.style.setProperty('--emp-aspect', this.theme.presentation.sceneAspect);
    for (const [r, def] of Object.entries(this.theme.economy.rarities)) if (def.color) this.root.style.setProperty(`--emp-${r}`, def.color);
    document.title = this.theme.name;
  }

  // ───────────────────────────────── loop ─────────────────────────────────

  tick() {
    const now = Date.now();
    const dt = (now - this.lastTick) / 1000;
    this.lastTick = now;
    if (dt > AWAY_S) {
      // Tab was in the background: treat as offline time (same cap and rules).
      this.empire.state.lastSeen = now - dt * 1000;
      const off = this.empire.catchUp(now);
      if (off.earned > 0) this.showWelcomeBack(off);
    } else if (dt > 0) this.empire.advance(dt);
    if (now - this.lastSave > SAVE_MS) { saveEmpire(this.empire); this.lastSave = now; }
    this.refresh();
  }

  // ──────────────────────────────── shell ─────────────────────────────────

  buildShell() {
    const b = this.theme.booster;
    this.root.classList.add('emp');
    this.root.innerHTML = `
      <header class="emp-hud">
        <a class="emp-back" href="../../index.html" aria-label="Back to Bus Adventures">‹</a>
        <div class="emp-hud-main">
          <div class="emp-coins" data-bind="coins"></div>
          <div class="emp-income"><span data-bind="income"></span>/s<span class="emp-prestige-badge" data-bind="prestige"></span></div>
        </div>
        <button class="emp-btn emp-pack-btn" data-act="pack"><span>${esc(b.name || 'Booster')}</span><small data-bind="packPrice"></small></button>
        <button class="emp-icon-btn" data-act="menu" aria-label="Menu">≡</button>
        <button class="emp-hud-rooms" data-act="close-room">‹ All rooms</button>
        <button class="emp-coach" data-act="coach"></button>
      </header>
      <main class="emp-rooms"></main>
      <div class="emp-toast" hidden></div>
      <div class="emp-modal" hidden><div class="emp-modal-card"></div></div>
      <div class="emp-detail" hidden><div class="emp-detail-card"></div></div>`;
    this.roomsEl = this.root.querySelector('.emp-rooms');
    this.modal = this.root.querySelector('.emp-modal');
    this.modalCard = this.root.querySelector('.emp-modal-card');
    this.toastEl = this.root.querySelector('.emp-toast');
    this.coachEl = this.root.querySelector('.emp-coach');
    this.detail = this.root.querySelector('.emp-detail');
    this.detail.addEventListener('click', e => { if (e.target === this.detail) this.closeDetail(); });
    this.root.addEventListener('click', e => this.onClick(e));
    this.modal.addEventListener('click', e => { if (e.target === this.modal && !this.modal.dataset.locked) this.closeModal(); });
  }

  onClick(e) {
    if (this.openRoomId && e.target.closest('.emp-back')) { e.preventDefault(); return this.closeRoom(); }
    const btn = e.target.closest('[data-act]');
    if (!btn || btn.disabled) return;
    const { act, kind, id } = btn.dataset;
    const E = this.empire;
    if (act === 'pack') return this.openPack();
    if (act === 'menu') return this.showMenu();
    if (act === 'help') return this.showHelp();
    if (act === 'coach') return this.followCoach();
    if (act === 'close') return this.closeModal();
    if (act === 'build') {
      const r = E.buildRoom(id);
      if (r.ok) { this.toast(`${E.rooms[id].name} is open for business`); this.renderRooms(); this.save(); }
      return;
    }
    if (act === 'level') {
      const r = E.levelUp({ kind, id });
      if (!r.ok) return this.toast(this.reasonText(r));
      if (kind === 'character' && r.action === 'unlock') {
        this.justUnlocked.add(id);
        this.toast(`${E.characters[id].name} joins the crew!`);
        if (E.fullSet(r.roomId)) setTimeout(() => this.toast(`Full crew in ${E.rooms[r.roomId].name}: +${Math.round(this.fullSetBonus(r.roomId) * 100)}% income`), 1400);
      }
      this.renderRoom(r.roomId); this.save();
      if (this.detailTarget) this.showDetail(this.detailTarget);
      return;
    }
    if (act === 'event') return this.startEvent(id);
    if (act === 'open-room') return this.openRoom(id);
    if (act === 'card') return this.showDetail({ kind, id });
    if (act === 'detail-close') return this.closeDetail();
    if (act === 'close-room') return this.closeRoom();
    if (act === 'prestige') return this.showPrestige();
    if (act === 'prestige-confirm') return this.confirmPrestige();
    if (act === 'prestige-do') return this.doPrestige();
    if (act === 'export') return this.doExport();
    if (act === 'import') return this.doImport();
    if (act === 'reset') return this.confirmReset();
    if (act === 'reset-do') { clearSave(this.theme); location.reload(); }
  }

  fullSetBonus(roomId) { return this.empire.rooms[roomId].fullSetBonus ?? this.theme.economy.fullSetBonus; }

  save() { saveEmpire(this.empire); this.lastSave = Date.now(); }

  reasonText(q) {
    return ({ coins: 'Not enough ' + (this.theme.currency?.name || 'cash').toLowerCase(), fragments: 'Not enough fragments',
      max: 'Already at max level', 'prestige-locked': `Unlocks after ${this.theme.prestige?.name || 'prestige'}`,
      'previous-room': 'Build the previous room first', cooldown: 'Still cooling down', locked: 'Not unlocked yet' })[q.reason] || q.reason;
  }

  // ──────────────────────────────── rooms ─────────────────────────────────

  // ───────────────────────────── navigation ───────────────────────────────
  // The list shows only the scenes, one under the other. Tapping a room opens its own page
  // with all upgrades. The phone's back gesture closes the page (history entry).

  // History holds at most one room page above the list. Going from one room straight to
  // another (e.g. via the coach) replaces the entry, so "All rooms" and the back gesture
  // always land on the list, never on the previous room.
  openRoom(roomId) {
    if (!this.empire.isBuilt(roomId)) return;
    const url = '#' + encodeURIComponent(roomId);
    if (this.openRoomId) history.replaceState({ room: roomId }, '', url);
    else {
      this.listScroll = scrollY;
      history.pushState({ room: roomId }, '', url);
      this.pushedRoom = true;
    }
    this.showView(roomId);
  }

  closeRoom() {
    if (!this.openRoomId) return;
    if (this.pushedRoom) { this.pushedRoom = false; history.back(); }   // popstate shows the list
    else { history.replaceState(null, '', location.pathname + location.search); this.showView(null); }
  }

  showView(roomId) {
    this.openRoomId = roomId && this.empire.isBuilt(roomId) ? roomId : null;
    this.renderRooms();
    if (this.openRoomId) scrollTo(0, 0);
    else requestAnimationFrame(() => scrollTo(0, this.listScroll));
  }

  renderRooms() {
    this.roomsEl.innerHTML = '';
    const E = this.empire;
    if (this.openRoomId && !E.isBuilt(this.openRoomId)) this.openRoomId = null;
    for (const [id, c] of Object.entries(this.sceneCache)) {
      if (!E.isBuilt(id)) { releaseScene(c.el); delete this.sceneCache[id]; }
    }
    this.root.classList.toggle('emp-on-page', !!this.openRoomId);
    this.root.querySelector('.emp-back')?.setAttribute('aria-label', this.openRoomId ? 'Back to all rooms' : 'Back to Bus Adventures');
    const roomsBtn = this.root.querySelector('.emp-hud-rooms');
    if (roomsBtn) roomsBtn.innerHTML = this.openRoomId ? `‹ All rooms <span class="emp-muted">· ${esc(E.rooms[this.openRoomId].name)}</span>` : '‹ All rooms';
    if (this.openRoomId) {
      const card = document.createElement('section');
      card.className = 'emp-room emp-room-page'; card.dataset.room = this.openRoomId;
      this.roomsEl.appendChild(card);
      this.renderRoom(this.openRoomId, card);
      return;
    }
    let shownLocked = 0;
    for (const room of E.roomList) {
      if (E.isBuilt(room.id)) {
        this.roomsEl.appendChild(this.roomTile(room));
      } else if (shownLocked < 2) {
        this.roomsEl.appendChild(this.lockedRoomCard(room));
        shownLocked++;
      }
    }
    const p = document.createElement('section');
    p.className = 'emp-prestige-card';
    p.innerHTML = `<button class="emp-btn emp-wide" data-act="prestige">${esc(this.theme.prestige?.name || 'Prestige')} <small data-bind="prestigeHint"></small></button>`;
    if (this.theme.prestige) this.roomsEl.appendChild(p);
    this.refresh();
  }

  lockedRoomCard(room) {
    const E = this.empire;
    const q = E.quoteBuild(room.id);
    const el = document.createElement('section');
    el.className = 'emp-room emp-room-locked'; el.dataset.room = room.id;
    const lockedByPrestige = q.reason === 'prestige-locked';
    el.innerHTML = `
      <div class="emp-locked-scene" style="background-image:url('${this.asset(room.background?.src || '')}')"></div>
      <div class="emp-locked-body">
        <h2>${esc(room.name)}</h2>
        <p>${esc(room.blurb || '')}</p>
        <p class="emp-muted">Base income ${this.money(room.baseIncome)}/s · 3 new characters · 2 new upgrades</p>
        ${lockedByPrestige
          ? `<div class="emp-lock-note">🔒 Unlocks after ${esc(this.theme.prestige?.name || 'prestige')} ${this.prestigeTierFor(room)}</div>`
          : `<button class="emp-btn emp-wide emp-build" data-act="build" data-id="${room.id}" data-q="build">Build — ${room.price ? this.money(room.price) : 'free'}</button>`}
      </div>`;
    return el;
  }

  prestigeTierFor(room) {
    const p = this.theme.prestige; let limit = p.startRooms;
    for (let i = 0; i < p.tiers.length; i++) { limit = p.tiers[i].roomLimit ?? limit; if (room._index < limit) return `#${i + 1}`; }
    return '';
  }

  /** List view: just the scene with a small label. The whole tile opens the room page. */
  roomTile(room) {
    const E = this.empire;
    const tile = document.createElement('section');
    tile.className = 'emp-room emp-room-tile';
    tile.dataset.room = room.id; tile.dataset.act = 'open-room'; tile.dataset.id = room.id;
    tile.innerHTML = `
      <div class="emp-scene-slot"></div>
      <div class="emp-tile-label">
        <div><h2>${esc(room.name)}</h2>
          <div class="emp-tile-meta">Lv ${E.roomLevel(room.id)} · crew ${room.characters.filter(c => E.charLevel(c.id)).length}/3 · <span data-bind="room-income" data-id="${room.id}"></span></div></div>
        <span class="emp-tile-badge" data-bind="room-badge" data-id="${room.id}"></span>
      </div>`;
    this.attachScene(room, tile.querySelector('.emp-scene-slot'));
    return tile;
  }

  attachScene(room, slot) {
    const sig = sceneSignature(room, this.empire);
    const cached = this.sceneCache[room.id];
    if (cached && cached.sig === sig) { slot.replaceWith(cached.el); return; }
    if (cached) releaseScene(cached.el);
    const sceneEl = document.createElement('div');
    slot.replaceWith(sceneEl);
    renderScene(sceneEl, room, this.empire, this.asset, { justUnlocked: this.justUnlocked });
    this.sceneCache[room.id] = { el: sceneEl, sig };
    this.justUnlocked.clear();
  }

  /** Something in this room can be done right now (hire, level up, event). */
  roomHasAction(roomId) {
    const E = this.empire, room = E.rooms[roomId];
    const targets = [{ kind: 'room', id: roomId }, ...room.characters.map(c => ({ kind: 'character', id: c.id })), ...room.upgrades.map(u => ({ kind: 'upgrade', id: u.id }))];
    return targets.some(t => E.quoteLevel(t).ok) || (room.events || []).some(ev => E.eventStatus(ev.id).ok);
  }

  renderRoom(roomId, card = this.roomsEl.querySelector(`.emp-room-page[data-room="${roomId}"]`)) {
    if (!card) { if (!this.openRoomId) this.renderRooms(); return; }
    const E = this.empire, room = E.rooms[roomId];
    const rar = this.theme.economy.rarities;

    card.innerHTML = `
      <header class="emp-room-head">
        <h2>${esc(room.name)}</h2>
        <span class="emp-room-income" data-bind="room-income" data-id="${roomId}"></span>
      </header>
      <div class="emp-scene-slot"></div>
      <div class="emp-setbonus ${E.fullSet(roomId) ? 'on' : ''}">Full crew bonus +${Math.round(this.fullSetBonus(roomId) * 100)}% ${E.fullSet(roomId) ? '✓' : `· ${room.characters.filter(c => E.charLevel(c.id)).length}/3`}</div>
      ${this.levelRow('room', roomId, 'Room level', '🏠', 'Raises what the room earns on its own.')}
      <div class="emp-chars">${room.characters.map(c => this.charTile(c, rar)).join('')}</div>
      <div class="emp-upgrades">${room.upgrades.map(u => this.levelRow('upgrade', u.id, u.name, '', u.effect)).join('')}</div>
      ${(room.events || []).map(ev => this.eventRow(ev)).join('')}
      <div class="emp-page-foot"><button class="emp-btn emp-wide" data-act="close-room">‹ All rooms</button></div>`;

    this.attachScene(room, card.querySelector('.emp-scene-slot'));
    this.hydrate(card);
    this.refresh();
  }

  charTile(c) {
    return `
      <div class="emp-char">
        ${this.cardFace('character', c.id)}
        <div class="emp-gain emp-gain-short" data-bind="gain" data-short="1" data-kind="character" data-id="${c.id}"></div>
        <button class="emp-btn emp-small" data-act="level" data-kind="character" data-id="${c.id}" data-q="level"></button>
      </div>`;
  }

  // ──────────────────────────────── cards ─────────────────────────────────
  // One card design everywhere: index-card tab with the rarity, a big picture,
  // the name, and the fragment bar at the very bottom. Tap for the big version.

  cardInfo(kind, id) {
    const E = this.empire, rar = this.theme.economy.rarities;
    if (kind === 'character') {
      const c = E.characters[id];
      return { tab: rar[c.rarity].label || c.rarity, color: `var(--emp-${c.rarity})`, name: c.name, pic: `<div data-portrait="${id}"></div>`,
        locked: !E.charLevel(id), sub: c.role, text: c.bio, rarity: c.rarity };
    }
    if (kind === 'upgrade') {
      const u = E.upgrades[id], v = { ...u.visual, ...u.visual?.stages?.[0] };
      return { tab: 'Gear', color: '#d9b45a', name: u.name, pic: v.src ? `<img src="${this.asset(v.src)}" alt="">` : `<span class="emp-face-emoji">${esc(v.char || '⬆')}</span>`,
        locked: !E.upgradeLevel(id), sub: E.rooms[u.roomId].name, text: u.effect };
    }
    const room = E.rooms[id];
    const bg = room.background?.src ? `background-image:url('${this.asset(room.background.src)}')` : `background:${room.background?.color || '#333'}`;
    return { tab: 'Room', color: '#7fb2d9', name: room.name, pic: `<div class="emp-face-room" style="${esc(bg)}"></div>`,
      locked: false, sub: 'Room level', text: room.blurb };
  }

  cardFace(kind, id, { tappable = true, bar = true } = {}) {
    const i = this.cardInfo(kind, id);
    return `
      <div class="emp-face ${i.locked ? 'emp-face-locked' : ''} ${i.rarity ? 'emp-face-' + i.rarity : ''}" style="--rar:${i.color}" ${tappable ? `data-act="card" data-kind="${kind}" data-id="${id}"` : ''}>
        <div class="emp-face-tab">${esc(i.tab)}</div>
        <span class="emp-face-lv" data-bind="lv" data-kind="${kind}" data-id="${id}"></span>
        <div class="emp-face-pic">${i.pic}</div>
        <div class="emp-face-name">${esc(i.name)}</div>
        ${bar ? this.fragBar(kind, id) : ''}
      </div>`;
  }

  hydrate(container) {
    container.querySelectorAll('[data-portrait]').forEach(el => el.replaceWith(portrait(this.empire.characters[el.dataset.portrait], this.asset)));
  }

  showDetail(target) {
    const E = this.empire, { kind, id } = target;
    const i = this.cardInfo(kind, id);
    const q = E.quoteLevel(target);
    const now = E.contribution(target);
    const g = E.previewGain(target);
    const lvl = q.from;
    const levelText = kind === 'character' ? (lvl ? `Level ${lvl} of ${q.maxLevel}` : 'Not hired yet')
      : kind === 'upgrade' ? (lvl ? `Level ${lvl} of ${q.maxLevel}` : 'Not built yet') : `Level ${lvl} of ${q.maxLevel}`;
    const effect = kind === 'character'
      ? `Earns on its own. Each level adds more. ${E.rooms[E.characters[id].roomId].name} gets +${Math.round(this.fullSetBonus(E.characters[id].roomId) * 100)}% when all three are hired.`
      : kind === 'upgrade' ? `Multiplies everything ${esc(E.rooms[E.upgrades[id].roomId].name)} earns: +${Math.round((E.upgrades[id].incomePerLevel ?? this.theme.economy.upgrade.incomePerLevel) * 100)}% per level.`
      : `Raises what the room earns on its own: +${Math.round((E.rooms[id].incomePerLevel ?? this.theme.economy.roomLevel.incomePerLevel) * 100)}% of base income per level.`;
    const btnLabel = kind === 'character' && !lvl ? 'Hire' : kind === 'upgrade' && !lvl ? 'Build' : 'Level up';
    this.detailTarget = target;
    this.detail.querySelector('.emp-detail-card').innerHTML = `
      <div class="emp-detail-face">${this.cardFace(kind, id, { tappable: false })}</div>
      <div class="emp-detail-text">
        <div class="emp-detail-sub" style="color:${i.color}">${esc(i.tab)} · ${esc(i.sub || '')}</div>
        <h3>${esc(i.name)}</h3>
        <div class="emp-muted">${levelText}</div>
        ${i.text ? `<p class="emp-detail-bio">${esc(i.text)}</p>` : ''}
        <h4>Effect</h4>
        <p class="emp-detail-effect">${effect}</p>
        <ul class="emp-detail-stats">
          ${now > 0 ? `<li>Adds now <b>+${this.sym}${fmt(now, { decimals: true })}/s</b></li>` : ''}
          <li>${g ? `${btnLabel} <b class="emp-gain-inline">+${this.sym}${fmt(g.income, { decimals: true })}/s</b>` : 'Max level reached'}</li>
          ${g ? `<li>Costs <b>${q.fragmentCost} fragment${q.fragmentCost === 1 ? '' : 's'}</b>${q.coins ? ` + <b>${this.money(q.coins)}</b>` : ''} <span class="emp-muted">(you have ${q.have})</span></li>` : ''}
        </ul>
        <div class="emp-modal-actions">
          <button class="emp-btn" data-act="detail-close">Close</button>
          ${g ? `<button class="emp-btn emp-accent" data-act="level" data-kind="${kind}" data-id="${id}" data-q="level"></button>` : ''}
        </div>
      </div>`;
    this.hydrate(this.detail);
    this.detail.hidden = false;
    this.refresh();
  }

  closeDetail() { this.detail.hidden = true; this.detailTarget = null; }

  levelRow(kind, id, label, icon = '', sub = '') {
    return `
      <div class="emp-row">
        <div class="emp-row-label" data-act="card" data-kind="${kind}" data-id="${id}">${icon ? `<span class="emp-row-icon">${icon}</span>` : this.upgradeThumb(id)}
          <div><div>${esc(label)} <span class="emp-lv" data-bind="lv" data-kind="${kind}" data-id="${id}"></span></div>
          ${sub ? `<div class="emp-muted emp-sub">${esc(sub)}</div>` : ''}<div class="emp-gain" data-bind="gain" data-kind="${kind}" data-id="${id}"></div>${this.fragBar(kind, id)}</div></div>
        <button class="emp-btn emp-small" data-act="level" data-kind="${kind}" data-id="${id}" data-q="level"></button>
      </div>`;
  }

  upgradeThumb(id) {
    const u = this.empire.upgrades[id];
    const v = { ...u?.visual, ...u?.visual?.stages?.[0] };
    if (v.src) return `<img class="emp-thumb" src="${this.asset(v.src)}" alt="">`;
    return `<span class="emp-row-icon">${esc(v.char || '⬆')}</span>`;
  }

  fragBar(kind, id) {
    return `<div class="emp-frag" data-bind="frag" data-kind="${kind}" data-id="${id}"><div class="emp-frag-fill"></div><span></span></div>`;
  }

  eventRow(ev) {
    return `
      <div class="emp-event">
        <div><div class="emp-event-name">🏆 ${esc(ev.name)}</div><div class="emp-muted emp-sub" data-bind="event" data-id="${ev.id}"></div></div>
        <button class="emp-btn emp-small emp-accent" data-act="event" data-id="${ev.id}" data-q="event">Enter</button>
      </div>`;
  }

  /** Cheap per-tick update of numbers and button states; no DOM rebuild. */
  refresh() {
    const E = this.empire, R = this.root;
    const set = (sel, fn) => R.querySelectorAll(sel).forEach(fn);
    set('[data-bind="coins"]', el => el.textContent = this.money(E.state.coins));
    set('[data-bind="income"]', el => el.textContent = '+' + this.sym + fmt(E.totalIncome(), { decimals: true }));
    set('[data-bind="prestige"]', el => { const l = E.state.prestige.level; el.textContent = l ? ` · ×${E.prestigeMultiplier()}` : ''; });
    const price = E.boosterPrice();
    set('[data-bind="packPrice"]', el => el.textContent = this.money(price));
    set('[data-act="pack"]', el => {
      el.disabled = E.state.coins < price || !E.builtRooms().length;
      el.classList.toggle('emp-ready', !el.disabled);
    });
    this.updateCoach(price);
    set('[data-bind="room-income"]', el => el.textContent = '+' + this.sym + fmt(E.roomIncome(el.dataset.id), { decimals: true }) + '/s');

    set('[data-bind="room-badge"]', el => {
      const on = this.roomHasAction(el.dataset.id);
      el.textContent = on ? 'Upgrade ›' : '›';
      el.classList.toggle('on', on);
    });
    set('[data-q="build"]', el => { el.disabled = !E.quoteBuild(el.dataset.id).ok; });
    set('[data-q="level"]', el => {
      const q = E.quoteLevel({ kind: el.dataset.kind, id: el.dataset.id });
      el.disabled = !q.ok;
      el.classList.toggle('emp-ready', q.ok);
      el.innerHTML = q.maxed ? 'MAX'
        : q.action === 'unlock' && el.dataset.kind === 'character' ? (q.coins ? `Hire ${this.money(q.coins)}` : 'Hire')
        : `${q.action === 'unlock' ? 'Build' : 'Up'} ${this.money(q.coins)}`;
    });
    set('[data-bind="lv"]', el => {
      const q = E.quoteLevel({ kind: el.dataset.kind, id: el.dataset.id });
      if (el.closest('.emp-face')) { el.textContent = q.from ? `Lv ${q.from}` : ''; el.hidden = !q.from; }
      else el.textContent = q.from ? `Lv ${q.from}` : '—';
    });
    set('[data-bind="gain"]', el => {
      const tg = { kind: el.dataset.kind, id: el.dataset.id };
      const g = E.previewGain(tg);
      if (!g) { el.textContent = 'Max level'; el.classList.add('max'); return; }
      el.classList.remove('max');
      const pct = g.roomShare != null && g.roomShare > 0 ? ` (+${g.roomShare >= 0.995 ? fmt(g.roomShare * 100) : (g.roomShare * 100).toFixed(g.roomShare < 0.1 ? 1 : 0)}%)` : '';
      const verb = tg.kind === 'character' && !E.charLevel(tg.id) ? 'Hire' : tg.kind === 'upgrade' && !E.upgradeLevel(tg.id) ? 'Build' : 'Next level';
      const text = el.dataset.short ? `+${this.sym}${fmt(g.income, { decimals: true })}/s${g.completesCrew ? ' ★' : ''}`
        : `${verb}: +${this.sym}${fmt(g.income, { decimals: true })}/s${pct}${g.completesCrew ? ' with crew bonus' : ''}`;
      if (el.textContent !== text) el.textContent = text;
    });
    set('[data-bind="frag"]', el => {
      const q = E.quoteLevel({ kind: el.dataset.kind, id: el.dataset.id });
      const need = q.maxed ? 0 : q.fragmentCost;
      el.querySelector('span').textContent = q.maxed ? 'max' : `${q.have}/${need}`;
      el.querySelector('.emp-frag-fill').style.width = need ? `${Math.min(100, (q.have / need) * 100)}%` : '100%';
      el.classList.toggle('full', q.maxed || q.have >= need);
    });
    set('[data-q="event"]', el => {
      const st = E.eventStatus(el.dataset.id);
      el.disabled = !st.ok;
      el.textContent = st.reason === 'cooldown' ? fmtTime(st.cooldownLeft) : st.coins ? `Enter ${this.money(st.coins)}` : 'Enter';
    });
    set('[data-bind="event"]', el => {
      const st = E.eventStatus(el.dataset.id);
      el.textContent = st.unlocked
        ? (E.events[el.dataset.id].description || '')
        : 'Unlock: ' + st.requirements.map(r => `${this.reqText(r)} ${r.met ? '✓' : `(${fmt(r.current)}/${fmt(r.target)})`}`).join(' · ');
    });
    set('[data-bind="prestigeHint"]', el => {
      const st = E.prestigeStatus();
      el.textContent = st.reason === 'final' ? '· all tiers done' : st.available ? '· ready!' : `· ${st.requirements.filter(r => r.met).length}/${st.requirements.length} goals`;
      el.closest('button').classList.toggle('emp-ready', !!st.available);
    });
  }

  // ──────────────────────────────── coach ─────────────────────────────────
  // One line under the HUD that always says what the best next move is. Tap it to jump there.

  coachStep(price) {
    const E = this.empire, pack = this.theme.booster.name || 'Booster';
    const btn = (kind, id) => `[data-act="level"][data-kind="${kind}"][data-id="${id}"]`;
    if (!E.builtRooms().length) {
      const first = E.roomList[0];
      return { text: `👉 Tap “Build” to open ${first.name}. It starts earning right away.`, target: `[data-act="build"][data-id="${first.id}"]` };
    }
    for (const room of E.builtRooms()) for (const c of room.characters) {
      const q = E.quoteLevel({ kind: 'character', id: c.id });
      if (q.ok && q.action === 'unlock') return { text: `👉 ${c.name} can be hired in ${room.name}. Tap here.`, target: btn('character', c.id), roomId: room.id };
    }
    const next = E.roomList.find(r => !E.isBuilt(r.id));
    if (next && E.quoteBuild(next.id).ok) return { text: `👉 You can afford ${next.name}. Tap to go there and build it.`, target: `[data-act="build"][data-id="${next.id}"]` };
    for (const room of E.builtRooms()) {
      for (const tg of [...room.characters.map(c => ({ kind: 'character', id: c.id })), { kind: 'room', id: room.id }, ...room.upgrades.map(u => ({ kind: 'upgrade', id: u.id }))]) {
        if (E.quoteLevel(tg).ok) return { text: `👉 ${room.name} can be upgraded. Tap here, then a green button.`, target: btn(tg.kind, tg.id), roomId: room.id };
      }
    }
    if (E.state.coins >= price) return { text: `👉 Tap “${pack}” (top right). Packs give fragments for hiring and upgrades.`, target: '[data-act="pack"]' };
    for (const id of Object.keys(E.events)) if (E.eventStatus(id).ok) return { text: `👉 ${E.events[id].name} is open. Try your luck!`, target: `[data-act="event"][data-id="${id}"]`, roomId: E.events[id].roomId };
    if (E.prestigeStatus().available) return { text: `👉 ${this.theme.prestige.name} is ready: start over with a permanent bonus.`, target: '[data-act="prestige"]' };
    const income = E.totalIncome();
    const wait = income > 0 ? (price - E.state.coins) / income : 0;
    return { text: `⏳ Saving for the next ${pack} (${fmtTime(wait)}). Cash keeps coming, even with the game closed.`, target: null };
  }

  updateCoach(price) {
    const step = this.coachStep(price);
    this.coachTarget = step.target;
    this.coachRoom = step.roomId || null;
    if (this.coachEl.textContent !== step.text) this.coachEl.textContent = step.text;
    this.coachEl.classList.toggle('emp-coach-go', !!step.target);
  }

  followCoach() {
    if (!this.coachTarget) return this.showHelp();
    const inHud = this.coachTarget === '[data-act="pack"]';
    if (!inHud && (this.coachRoom || null) !== this.openRoomId) {
      if (this.coachRoom) this.openRoom(this.coachRoom); else this.closeRoom();
      setTimeout(() => this.followCoach(), 350);   // let the view switch (and scroll restore) settle
      return;
    }
    const el = this.root.querySelector(this.coachTarget);
    if (!el) return this.showHelp();
    if (!el.closest('.emp-hud')) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.remove('emp-flash'); void el.offsetWidth; el.classList.add('emp-flash');
    el.addEventListener('animationend', () => el.classList.remove('emp-flash'), { once: true });
  }

  showHelp() {
    const t = this.theme, pack = esc(t.booster.name || 'Booster'), cash = esc(t.currency?.name || 'cash');
    this.openModal(`
      <h3>How it works</h3>
      <ol class="emp-help">
        <li><b>Rooms earn ${cash} every second</b>, even when the game is closed.</li>
        <li><b>Buy ${pack}s</b> (top right). Each pack gives fragments.</li>
        <li><b>Fragments + ${cash}</b> hire characters and level up rooms, characters and gear. That means more income.</li>
        <li><b>Hire all three</b> in a room for a big bonus, then save up for the next room.</li>
        <li>Later: tournaments, and ${esc(t.prestige?.name || 'prestige')}: start over with a permanent bonus.</li>
      </ol>
      <p class="emp-muted">Every upgrade shows what it adds, like <b class="emp-gain-inline">+$2.4/s</b>. A <span class="emp-help-green">green button</span> means you can do it now. Not sure? Tap the line under the ${cash} counter.</p>
      <div class="emp-modal-actions"><button class="emp-btn emp-accent" data-act="close">Let's go</button></div>`);
  }

  reqText(r) {
    const E = this.empire, room = r.room ? E.rooms[r.room]?.name : null;
    switch (r.type) {
      case 'roomBuilt': return `Build ${room}`;
      case 'roomLevel': return `${room} level ${r.min}`;
      case 'charactersUnlocked': return `${r.min} characters${room ? ' in ' + room : ''}`;
      case 'characterLevelSum': return `Character levels ${r.min}${room ? ' in ' + room : ''}`;
      case 'upgradeLevel': return `${E.upgrades[r.upgrade]?.name} level ${r.min}`;
      case 'runEarned': return `Earn ${this.money(r.min)} this run`;
      default: return r.type;
    }
  }

  // ─────────────────────────────── booster ────────────────────────────────

  openPack() {
    const E = this.empire;
    const res = E.openBooster();
    if (!res.ok) return this.toast(this.reasonText(res));
    this.save();
    this.showRewards(`${this.theme.booster.name || 'Booster'}`, res.rewards, { again: true });
    this.renderRooms();
  }

  rewardCard(r) {
    const el = document.createElement('div');
    el.className = 'emp-card';
    let face;
    if (r.type === 'coins') {
      face = `<div class="emp-face" style="--rar:#f1c40f"><div class="emp-face-tab">${esc(this.theme.currency?.name || 'Cash')}</div>
        <div class="emp-face-pic"><span class="emp-face-emoji">💰</span></div><div class="emp-face-name">+${this.money(r.amount)}</div><div class="emp-frag emp-frag-empty"></div></div>`;
    } else {
      face = this.cardFace(r.kind, r.id).replace('emp-face-locked', '');
      if (r.rarity) el.classList.add('emp-card-' + r.rarity);
    }
    el.innerHTML = `<div class="emp-card-back"></div><div class="emp-card-front">${face}</div>`;
    this.hydrate(el);
    return el;
  }

  showRewards(title, rewards, { again = false, extra = '' } = {}) {
    this.openModal(`
      <h3>${esc(title)}</h3>${extra}
      <div class="emp-cards"></div>
      <p class="emp-muted emp-cards-hint">Tap a card to see what it does.</p>
      <div class="emp-modal-actions">
        ${again ? `<button class="emp-btn" data-act="pack">Another — <span data-bind="packPrice"></span></button>` : ''}
        <button class="emp-btn emp-accent" data-act="close">Done</button>
      </div>`);
    const wrap = this.modalCard.querySelector('.emp-cards');
    const cards = rewards.map(r => this.rewardCard(r));
    cards.forEach(c => wrap.appendChild(c));
    // Reveal one by one; a tap reveals all at once.
    let i = 0;
    const flip = () => { if (i < cards.length) { cards[i++].classList.add('flipped'); this.flipTimer = setTimeout(flip, 260); } };
    clearTimeout(this.flipTimer);
    this.flipTimer = setTimeout(flip, 150);
    wrap.addEventListener('click', e => {
      if (cards.every(c => c.classList.contains('flipped'))) return;   // revealed: taps open the card (data-act="card")
      e.stopPropagation(); clearTimeout(this.flipTimer); cards.forEach(c => c.classList.add('flipped'));
    }, true);
    this.refresh();
  }

  // ──────────────────────────────── events ────────────────────────────────

  async startEvent(eventId) {
    const E = this.empire;
    const res = E.runEvent(eventId);
    if (!res.ok) return this.toast(this.reasonText(res));
    this.save();
    const ev = E.events[eventId];
    this.modal.dataset.locked = '1';
    this.openModal(`<div class="emp-cine"></div>`, 'emp-modal-cine');
    await playCinematic(this.modalCard.querySelector('.emp-cine'), res.outcome.cinematic, {
      asset: this.asset, background: this.asset(E.rooms[ev.roomId].background?.src || ''), title: ev.name,
    });
    delete this.modal.dataset.locked;
    this.showRewards(res.outcome.label, res.rewards, { extra: `<p class="emp-muted">${esc(ev.name)}</p>` });
    this.renderRooms();
  }

  // ─────────────────────────────── prestige ───────────────────────────────

  showPrestige() {
    const E = this.empire, p = this.theme.prestige, st = E.prestigeStatus();
    if (st.reason === 'final') return this.openModal(`<h3>${esc(p.name)}</h3><p>You have done every ${esc(p.name)} tier. The empire is yours — keep building.</p><div class="emp-modal-actions"><button class="emp-btn" data-act="close">OK</button></div>`);
    const nextRoom = E.roomList[st.effects.roomLimit - 1];
    this.openModal(`
      <h3>${esc(p.name)} #${st.level + 1}</h3>
      <p class="emp-muted">${esc(p.description || '')}</p>
      <h4>Goals</h4>
      <ul class="emp-reqs">${st.requirements.map(r => `<li class="${r.met ? 'met' : ''}">${r.met ? '✓' : '○'} ${esc(this.reqText(r))} <span class="emp-muted">${fmt(r.current)}/${fmt(r.target)}</span></li>`).join('')}</ul>
      <h4>You keep forever</h4>
      <ul class="emp-reqs"><li>Income ×${st.effects.incomeMultiplier} on everything</li>${st.effects.roomLimit > E.roomLimit() ? `<li>${esc(nextRoom?.name || 'A new room')} can be built</li>` : ''}</ul>
      <h4>You start over with</h4>
      <p class="emp-muted">Starting ${esc(this.theme.currency?.name || "cash")} only, no rooms, no characters, no upgrades, no fragments.</p>
      <div class="emp-modal-actions">
        <button class="emp-btn" data-act="close">Not yet</button>
        <button class="emp-btn emp-accent" data-act="prestige-confirm" ${st.available ? '' : 'disabled'}>${esc(p.name)}…</button>
      </div>`);
  }

  confirmPrestige() {
    this.openModal(`<h3>Are you sure?</h3><p>Everything except your ${esc(this.theme.prestige.name)} bonuses is reset. This cannot be undone.</p>
      <div class="emp-modal-actions"><button class="emp-btn" data-act="close">Cancel</button><button class="emp-btn emp-accent" data-act="prestige-do">Yes, start over</button></div>`);
  }

  doPrestige() {
    const r = this.empire.prestige();
    this.closeModal();
    if (!r.ok) return this.toast(this.reasonText(r));
    this.save();
    this.renderRooms();
    scrollTo({ top: 0, behavior: 'smooth' });
    this.toast(`${this.theme.prestige.name} #${r.level}! Income ×${r.effects.incomeMultiplier}`);
  }

  // ──────────────────────────────── menu ──────────────────────────────────

  showMenu() {
    const s = this.empire.state.stats;
    this.openModal(`
      <h3>${esc(this.theme.name)}</h3>
      <p class="emp-muted">${esc(this.theme.tagline || '')}</p>
      <ul class="emp-stats">
        <li>Earned in total <b>${this.money(s.totalEarned)}</b></li>
        <li>Earned this run <b>${this.money(s.runEarned)}</b></li>
        <li>Packs opened <b>${fmt(s.boostersOpened)}</b></li>
        <li>${esc(this.theme.prestige?.name || 'Prestige')} <b>${this.empire.state.prestige.level}</b></li>
        <li>Offline earnings <b>${this.theme.economy.offlineCapHours == null ? 'unlimited' : 'up to ' + this.theme.economy.offlineCapHours + 'h'}</b></li>
      </ul>
      <div class="emp-modal-actions" style="justify-content:flex-start;margin-top:4px"><button class="emp-btn" data-act="help">How it works</button></div>
      <h4>Save</h4>
      <p class="emp-muted">Your progress lives in this browser. Export it to move it or keep a copy.</p>
      <textarea class="emp-savebox" rows="3" placeholder="Paste a save here to import"></textarea>
      <div class="emp-modal-actions">
        <button class="emp-btn" data-act="export">Export</button>
        <button class="emp-btn" data-act="import">Import</button>
        <button class="emp-btn emp-danger" data-act="reset">Delete save</button>
      </div>
      <div class="emp-modal-actions"><button class="emp-btn emp-accent" data-act="close">Close</button></div>`);
  }

  async doExport() {
    const txt = exportSave(this.empire);
    const box = this.modalCard.querySelector('.emp-savebox');
    box.value = txt; box.select();
    try { await navigator.clipboard.writeText(txt); this.toast('Save copied to clipboard'); } catch { this.toast('Save shown in the box — copy it'); }
  }

  doImport() {
    const txt = this.modalCard.querySelector('.emp-savebox').value.trim();
    if (!txt) return this.toast('Paste a save first');
    try {
      this.empire = importSave(this.theme, txt);
      this.save(); this.closeModal(); this.renderRooms(); this.toast('Save imported');
    } catch (e) { this.toast('Import failed: ' + e.message); }
  }

  confirmReset() {
    this.openModal(`<h3>Delete save?</h3><p>This removes all progress for ${esc(this.theme.name)} in this browser, including ${esc(this.theme.prestige?.name || 'prestige')} bonuses.</p>
      <div class="emp-modal-actions"><button class="emp-btn" data-act="close">Cancel</button><button class="emp-btn emp-danger" data-act="reset-do">Delete everything</button></div>`);
  }

  // ─────────────────────────────── helpers ────────────────────────────────

  showWelcomeBack(off) {
    const capped = off.countedSeconds < off.awaySeconds;
    this.openModal(`<h3>Welcome back</h3>
      <p>You were away ${fmtTime(off.awaySeconds)}. Your empire earned</p>
      <div class="emp-big">${this.money(off.earned)}</div>
      ${capped ? `<p class="emp-muted">Offline earnings count up to ${fmtTime(off.countedSeconds)}.</p>` : ''}
      <div class="emp-modal-actions"><button class="emp-btn emp-accent" data-act="close">Collect</button></div>`);
  }

  openModal(html, cls = '') {
    this.modalCard.className = 'emp-modal-card ' + cls;
    this.modalCard.innerHTML = html;
    this.modal.hidden = false;
  }

  closeModal() { this.modal.hidden = true; this.modalCard.innerHTML = ''; clearTimeout(this.flipTimer); }

  toast(msg) {
    this.toastEl.textContent = msg; this.toastEl.hidden = false;
    this.toastEl.classList.remove('show'); void this.toastEl.offsetWidth; this.toastEl.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => { this.toastEl.hidden = true; }, 2200);
  }
}
