/* Bus Adventures — shared gamepad support (Xbox/XInput, Legion Go, Steam Deck,
 * DualSense, 8BitDo …) via the standard Gamepad API.
 *
 * Include in any game page:
 *   <script src="../../ui/gamepad.js" data-a="Space" data-b="z"></script>
 *
 * What it does
 *   1. Game input   D-pad / left stick / face buttons are turned into the keys
 *                   (or on-screen buttons) the game already understands.
 *   2. Menu nav     When buttons/links appear (menus, game over, text-adventure
 *                   choices, empire screens) a yellow focus ring shows up.
 *                   D-pad/stick moves it, A presses, B leaves menu mode.
 *                   SELECT / LB / RB enter menu mode at any time.
 *   3. Pointer      The right stick moves an on-screen pointer, RT taps/holds.
 *                   Works in every touch-only game.
 *
 * Configuration (data-* attributes on the script tag)
 *   data-up / -down / -left / -right   D-pad + left stick   (default arrow keys)
 *   data-a / -b / -x / -y              face buttons         (default A=Space)
 *   data-lb / -rb / -lt / -rt          shoulders/triggers   (default RT=tap)
 *   data-start                         START button         (default: press the
 *                                      page's MENU/PAUSE button)
 *   data-rstick="cursor|arrows|wasd|none"   right stick     (default cursor)
 *   data-lstick="dirs|cursor|none"          left stick      (default dirs)
 *   data-focus=".exit-btn,#inputTrigger"  what gets focus first (in priority order)
 *   data-nav="overlay|all|off"   when menu mode switches on by itself:
 *                                overlay = new buttons in a menu/game-over overlay
 *                                (action games), all = any new button (menu pages)
 *
 * A binding value is one of
 *   a key name        Space, Enter, Escape, ArrowLeft, z, f …  (keydown/keyup)
 *   a CSS selector    #left  .hit[data-l="0"]   (pointerdown/pointerup on it)
 *   tap               pointer tap/hold at the on-screen cursor
 *   none / empty      nothing
 */
(function () {
  'use strict';
  if (window.__baGamepad) return;
  window.__baGamepad = true;

  const D = (document.currentScript && document.currentScript.dataset) || {};
  const opt = (k, d) => (k in D ? D[k] : d);
  const PID = 4242;                       // synthetic pointerId
  const DEAD = 0.3, ON = 0.5, OFF = 0.35; // stick thresholds (with hysteresis)

  const lstick = opt('lstick', 'dirs');
  const rstick = opt('rstick', 'cursor');
  const cursorGame = lstick === 'cursor';
  // auto menu mode: 'overlay' (action games: only menus/game-over overlays),
  // 'all' (menu-driven pages: any new button), 'off'
  const navAuto = opt('nav', 'overlay');
  const prefer = opt('focus', '');           // selector that gets focus first

  const bind = {
    up: opt('up', 'ArrowUp'), down: opt('down', 'ArrowDown'),
    left: opt('left', 'ArrowLeft'), right: opt('right', 'ArrowRight'),
    a: opt('a', cursorGame ? 'tap' : 'Space'), b: opt('b', ''), x: opt('x', ''), y: opt('y', ''),
    lb: opt('lb', ''), rb: opt('rb', ''), lt: opt('lt', ''), rt: opt('rt', 'tap'),
    start: opt('start', ''),
    r_up: '', r_down: '', r_left: '', r_right: ''
  };
  if (rstick === 'arrows' || rstick === 'wasd') {
    const k = rstick === 'arrows' ? ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'] : ['w', 's', 'a', 'd'];
    bind.r_up = k[0]; bind.r_down = k[1]; bind.r_left = k[2]; bind.r_right = k[3];
  }
  const isSel = v => /^[#.\[]/.test(v);
  const keyName = v => (v === 'Space' ? ' ' : v);
  function codeFor(key) {
    if (key === ' ') return 'Space';
    if (/^[a-z]$/i.test(key)) return 'Key' + key.toUpperCase();
    if (/^[0-9]$/.test(key)) return 'Digit' + key;
    return key;
  }
  const KEYCODES = { ' ': 32, Enter: 13, Escape: 27, ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, Tab: 9 };
  const keyCodeFor = k => KEYCODES[k] || (k.length === 1 ? k.toUpperCase().charCodeAt(0) : 0);

  // ── synthetic events ─────────────────────────────────────────────
  function sendKey(type, key, repeat) {
    const t = (document.activeElement && document.activeElement !== document.body &&
               !document.activeElement.matches('button,a')) ? document.activeElement : document.body;
    const ev = new KeyboardEvent(type, {
      key, code: codeFor(key), keyCode: keyCodeFor(key), which: keyCodeFor(key),
      repeat: !!repeat, bubbles: true, cancelable: true, composed: true
    });
    (t || document).dispatchEvent(ev);
    return ev;
  }
  function sendPtr(type, x, y, target) {
    const down = type !== 'pointerup' && type !== 'pointercancel';
    const ev = new PointerEvent(type, {
      bubbles: true, cancelable: true, composed: true, clientX: x, clientY: y, screenX: x, screenY: y,
      pointerId: PID, pointerType: 'touch', isPrimary: true, width: 20, height: 20,
      button: type === 'pointermove' ? -1 : 0, buttons: down ? 1 : 0, pressure: down ? 0.5 : 0
    });
    target.dispatchEvent(ev);
    return ev;
  }
  // games often call setPointerCapture(e.pointerId); our synthetic id would throw
  const EP = Element.prototype;
  for (const fn of ['setPointerCapture', 'releasePointerCapture']) {
    const orig = EP[fn];
    if (orig) EP[fn] = function (id) { if (id === PID) return; return orig.call(this, id); };
  }
  if (EP.hasPointerCapture) {
    const orig = EP.hasPointerCapture;
    EP.hasPointerCapture = function (id) { return id === PID ? false : orig.call(this, id); };
  }

  // ── overlay: cursor + focus ring ─────────────────────────────────
  let cur = null, ring = null;
  function ui() {
    if (cur || !document.body) return !!cur;
    cur = document.createElement('div');
    cur.setAttribute('data-ba-pad', '');
    cur.style.cssText = 'position:fixed;left:0;top:0;width:22px;height:22px;margin:-11px 0 0 -11px;' +
      'border:2px solid #fff;border-radius:50%;box-shadow:0 0 0 2px #000,inset 0 0 0 2px #000;' +
      'pointer-events:none;z-index:2147483647;display:none;transition:transform .06s';
    ring = document.createElement('div');
    ring.setAttribute('data-ba-pad', '');
    ring.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483646;display:none;' +
      'border:3px solid #ffd84a;border-radius:9px;box-shadow:0 0 0 2px #000,0 0 14px #ffd84a88';
    document.body.appendChild(cur);
    document.body.appendChild(ring);
    return true;
  }
  const C = { x: innerWidth / 2, y: innerHeight / 2, shown: false, idle: 0, held: null };
  function showCursor() { C.shown = true; C.idle = 0; }
  function tapDown() {
    showCursor();
    const t = document.elementFromPoint(C.x, C.y);
    if (!t) return;
    C.held = t;
    sendPtr('pointerdown', C.x, C.y, t);
    if (cur) cur.style.transform = 'scale(.7)';
  }
  function tapUp() {
    const t = C.held; C.held = null;
    if (cur) cur.style.transform = '';
    if (!t) return;
    sendPtr('pointerup', C.x, C.y, t);
    const now = document.elementFromPoint(C.x, C.y);
    if (now && (now === t || t.contains(now) || now.contains(t))) {
      t.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: C.x, clientY: C.y, detail: 1, view: window }));
    }
  }

  // ── element bindings (on-screen game buttons) ────────────────────
  const elHeld = {};
  function elDown(name, sel) {
    const el = document.querySelector(sel);
    if (!el) return;
    const r = el.getBoundingClientRect();
    elHeld[name] = { el, x: r.left + r.width / 2, y: r.top + r.height / 2 };
    sendPtr('pointerdown', elHeld[name].x, elHeld[name].y, el);
  }
  function elUp(name) {
    const h = elHeld[name]; if (!h) return;
    delete elHeld[name];
    sendPtr('pointerup', h.x, h.y, h.el);
  }

  // ── binding activation ───────────────────────────────────────────
  const active = {};     // name -> {v, t, rep}
  const REPEATS = new Set(['up', 'down', 'left', 'right']);
  function press(name) {
    const v = bind[name];
    if (!v || v === 'none') return;
    active[name] = { v, t: 0, rep: 0 };
    if (v === 'tap') tapDown();
    else if (isSel(v)) elDown(name, v);
    else sendKey('keydown', keyName(v));
  }
  function release(name) {
    const a = active[name]; if (!a) return;
    delete active[name];
    if (a.v === 'tap') tapUp();
    else if (isSel(a.v)) elUp(name);
    else sendKey('keyup', keyName(a.v));
  }
  function releaseAll() { for (const n of Object.keys(active)) release(n); }

  // ── menu navigation ──────────────────────────────────────────────
  const SEL = 'button,a[href],[data-act],[onclick],[role="button"],input:not([type="hidden"]),textarea,select,summary';
  const FIELD = 'input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]),textarea,select';
  const bound = () => Object.values(bind).filter(isSel).map(s => [...document.querySelectorAll(s)]).flat();
  const nav = { on: false, el: null, sig: '', prev: new Set(), scanT: 0, list: [] };
  const sigOf = el => el.id ? '#' + el.id :
    el.tagName + '|' + (el.getAttribute('data-act') || '') + '|' + (el.getAttribute('data-id') || '') + '|' +
    (el.getAttribute('data-mode') || '') + '|' + (el.textContent || '').trim().slice(0, 40);

  function usable(el) {
    if (el.disabled || el.closest('[data-ba-pad],[inert],[aria-hidden="true"]')) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 6 || r.height < 6) return false;
    if (el.checkVisibility && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return false;
    const onScreen = r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth;
    if (!onScreen) {
      // allow off-screen items only if a scroll container can bring them in
      return !!scrollParent(el);
    }
    const cx = Math.min(Math.max(r.left + r.width / 2, 1), innerWidth - 2);
    const cy = Math.min(Math.max(r.top + r.height / 2, 1), innerHeight - 2);
    let h = document.elementFromPoint(cx, cy);
    if (h && h.hasAttribute('data-ba-pad')) h = null;
    return !!h && (h === el || el.contains(h) || h.contains(el));
  }
  function scrollParent(el) {
    for (let p = el.parentElement; p; p = p.parentElement) {
      const s = getComputedStyle(p);
      if (/(auto|scroll)/.test(s.overflowY + s.overflowX) && (p.scrollHeight > p.clientHeight || p.scrollWidth > p.clientWidth)) return p;
    }
    const de = document.scrollingElement || document.documentElement;
    return de.scrollHeight > innerHeight + 4 ? de : null;
  }
  function scan() {
    const skip = new Set(bound());
    const set = new Set();
    for (const el of document.querySelectorAll(SEL + (prefer ? ',' + prefer : ''))) if (!skip.has(el)) set.add(el);
    // elements made clickable by script (cursor:pointer) — outermost only
    const all = document.body ? document.body.getElementsByTagName('*') : [];
    for (let i = 0; i < all.length && i < 4000; i++) {
      const el = all[i];
      if (set.has(el) || skip.has(el)) continue;
      if (getComputedStyle(el).cursor !== 'pointer') continue;
      const p = el.parentElement;
      if (p && getComputedStyle(p).cursor === 'pointer') continue;
      if (el.closest(SEL)) continue;
      set.add(el);
    }
    return [...set].filter(usable);
  }
  const area = el => { const r = el.getBoundingClientRect(); return r.width * r.height; };
  function inOverlay(el) {
    for (let p = el; p && p !== document.body; p = p.parentElement) {
      const pos = getComputedStyle(p).position;
      if (pos === 'fixed' || pos === 'absolute') return true;
    }
    return false;
  }
  function pick(list) {
    if (!list.length) return null;
    const ov = list.filter(inOverlay);
    if (ov.length && navAuto !== 'all') list = ov;
    let pr = [];
    for (const sel of prefer ? prefer.split(',') : []) {   // first selector that matches wins
      pr = list.filter(e => e.matches(sel));
      if (pr.length) break;
    }
    if (pr.length) list = pr;
    else {
      const real = list.filter(e => e.matches(SEL) && !e.matches(FIELD));
      if (real.length) list = real;
    }
    const max = Math.max(...list.map(area));
    const big = list.filter(e => area(e) >= max * 0.5);
    big.sort((a, b) => {
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      return (Math.round(ra.top / 12) - Math.round(rb.top / 12)) || (ra.left - rb.left);
    });
    return big[0];
  }
  function focus(el) {
    nav.el = el; nav.sig = el ? sigOf(el) : '';
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.top < 0 || r.bottom > innerHeight || r.left < 0 || r.right > innerWidth) {
      try { el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (e) { }
    }
  }
  function navOn(el) {
    if (!el) return;
    if (!nav.on) releaseAll();
    nav.on = true;
    focus(el);
  }
  function navOff() { nav.on = false; nav.el = null; }
  function refresh(force) {
    const now = performance.now();
    if (!force && now - nav.scanT < 250) return;
    nav.scanT = now;
    const list = scan();
    nav.list = list;
    const fresh = list.filter(e => !nav.prev.has(e));
    nav.prev = new Set(list);
    if (nav.on && nav.el && !list.includes(nav.el)) {
      // element re-rendered or went away
      const same = list.find(e => sigOf(e) === nav.sig);
      if (same) focus(same);
      else if (fresh.length) focus(pick(fresh));
      else navOff();
      return;
    }
    const cand = navAuto === 'all' ? fresh : navAuto === 'overlay' ? fresh.filter(inOverlay) : [];
    if (cand.length && pad.connected) {
      const p = pick(cand);
      if (p && area(p) >= (navAuto === 'all' ? 300 : 2500) && (!nav.on || !list.includes(nav.el) || fresh.includes(p))) {
        if (!nav.on || fresh.length >= 1 && area(p) >= area(nav.el || p) * 0.5) navOn(p);
      }
    }
  }
  function navMove(dx, dy) {
    refresh(true);
    const list = nav.list;
    if (!nav.el || !list.includes(nav.el)) { navOn(pick(list)); return; }
    const f = nav.el.getBoundingClientRect();
    const fx = f.left + f.width / 2, fy = f.top + f.height / 2;
    let best = null, bs = Infinity;
    for (const el of list) {
      if (el === nav.el) continue;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      let along, across;
      if (dx) {
        along = dx > 0 ? r.left - f.right : f.left - r.right;
        if ((cx - fx) * dx <= 2) continue;
        across = Math.max(0, Math.max(r.top, f.top) < Math.min(r.bottom, f.bottom) ? 0 : Math.abs(cy - fy));
      } else {
        along = dy > 0 ? r.top - f.bottom : f.top - r.bottom;
        if ((cy - fy) * dy <= 2) continue;
        across = Math.max(0, Math.max(r.left, f.left) < Math.min(r.right, f.right) ? 0 : Math.abs(cx - fx));
      }
      const s = Math.max(along, 0) + across * 2.5;
      if (s < bs) { bs = s; best = el; }
    }
    if (best) focus(best);
  }
  function navCycle(step) {
    refresh(true);
    const list = nav.list.slice().sort((a, b) => {
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      return (Math.round(ra.top / 12) - Math.round(rb.top / 12)) || (ra.left - rb.left);
    });
    if (!list.length) return;
    if (!nav.on || !list.includes(nav.el)) { navOn(pick(list) || list[0]); return; }
    const i = list.indexOf(nav.el);
    focus(list[(i + step + list.length) % list.length]);
  }
  function navClick() {
    const el = nav.el;
    if (!el) return;
    if (navAuto !== 'all') navOff();     // menu pages keep the ring after a press
    if (el.matches(FIELD)) { try { el.focus(); el.click(); } catch (e) { } return; }
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    // full tap sequence so pointer-driven buttons work as well as click-driven ones
    const pd = sendPtr('pointerdown', x, y, el);
    sendPtr('pointerup', x, y, el);
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: x, clientY: y, detail: 1, view: window }));
    void pd;
    setTimeout(() => refresh(true), 60);
  }
  function startButton() {
    if (bind.start) { press('start'); return; }
    refresh(true);
    const re = /^(menu|pause|ii|≡|☰|❚❚|\|\|)$/i;
    const m = nav.list.find(el => re.test((el.textContent || '').trim()) || re.test(el.getAttribute('aria-label') || ''));
    if (m) { nav.el = m; navClick(); }
  }

  // ── polling ──────────────────────────────────────────────────────
  const pad = { connected: false, prev: {} };
  function readPads() {
    const list = navigator.getGamepads ? navigator.getGamepads() : [];
    const btn = [], axes = [0, 0, 0, 0];
    let any = false;
    for (const g of list) {
      if (!g || !g.connected) continue;
      any = true;
      g.buttons.forEach((b, i) => { if (b && (b.pressed || b.value > 0.5)) btn[i] = true; });
      g.axes.forEach((v, i) => { if (i < 4 && Math.abs(v) > Math.abs(axes[i])) axes[i] = v; });
    }
    return any ? { btn, axes } : null;
  }
  const dirState = { l: {}, r: {} };
  function stickDirs(x, y, st) {
    const out = {};
    const test = (name, v) => { out[name] = st[name] ? v > OFF : v > ON; st[name] = out[name]; };
    test('left', -x); test('right', x); test('up', -y); test('down', y);
    return out;
  }
  let last = 0, navRep = { dir: '', t: 0, n: 0 };
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = last ? Math.min(now - last, 50) : 16; last = now;
    const g = readPads();
    if (!g) {
      if (pad.connected) { pad.connected = false; releaseAll(); navOff(); }
      if (cur) { cur.style.display = 'none'; ring.style.display = 'none'; }
      return;
    }
    if (!ui()) return;
    if (!pad.connected) { pad.connected = true; nav.prev = new Set(); }
    const B = i => !!g.btn[i];
    const [lx, ly, rx, ry] = g.axes;
    const L = lstick === 'dirs' ? stickDirs(lx, ly, dirState.l) : {};
    const R = (rstick === 'arrows' || rstick === 'wasd') ? stickDirs(rx, ry, dirState.r) : {};
    const state = {
      up: B(12) || !!L.up, down: B(13) || !!L.down, left: B(14) || !!L.left, right: B(15) || !!L.right,
      a: B(0), b: B(1), x: B(2), y: B(3), lb: B(4), rb: B(5), lt: B(6), rt: B(7),
      select: B(8), start: B(9),
      r_up: !!R.up, r_down: !!R.down, r_left: !!R.left, r_right: !!R.right
    };
    const P = pad.prev;
    const edge = n => state[n] && !P[n];
    const up = n => !state[n] && P[n];

    refresh(false);

    // cursor movement (right stick, or left stick in cursor games)
    let cx = 0, cy = 0;
    if (rstick === 'cursor') { cx += rx; cy += ry; }
    if (lstick === 'cursor') { cx += lx; cy += ly; }
    const mag = Math.hypot(cx, cy);
    if (mag > DEAD) {
      const sp = 800 * Math.pow(Math.min(mag, 1.4), 2) * dt / 1000;
      C.x = Math.min(Math.max(C.x + cx / mag * sp, 0), innerWidth - 1);
      C.y = Math.min(Math.max(C.y + cy / mag * sp, 0), innerHeight - 1);
      showCursor();
      if (C.held) sendPtr('pointermove', C.x, C.y, C.held);
      else {
        // let elements under the pointer react to hover/leave like a finger dragging
        const t = document.elementFromPoint(C.x, C.y);
        if (t && !t.hasAttribute('data-ba-pad')) sendPtr('pointermove', C.x, C.y, t);
      }
      if (nav.on) navOff();
    } else C.idle += dt;
    if (cursorGame || C.held) C.idle = 0;
    if (C.shown && C.idle > 4000) C.shown = false;
    cur.style.display = C.shown || cursorGame ? 'block' : 'none';
    cur.style.left = C.x + 'px'; cur.style.top = C.y + 'px';

    // menu-mode toggles (only where the game has not claimed the button)
    if (edge('select')) { if (nav.on) navOff(); else navCycle(0); }
    if (edge('lb') && !bind.lb) navCycle(-1);
    if (edge('rb') && !bind.rb) navCycle(1);

    if (nav.on) {
      const dirs = ['up', 'down', 'left', 'right'];
      const d = dirs.find(n => state[n]) || '';
      if (d && d !== navRep.dir) { navRep = { dir: d, t: 0, n: 0 }; step(d); }
      else if (d) {
        navRep.t += dt;
        const lim = navRep.n ? 140 : 380;
        if (navRep.t > lim) { navRep.t = 0; navRep.n++; step(d); }
      } else navRep.dir = '';
      if (edge('a')) navClick();
      else if (edge('b')) navOff();
      if (edge('start')) startButton();
      if (edge('rt')) press('rt');
      if (up('rt')) release('rt');
    } else {
      navRep.dir = '';
      for (const n of Object.keys(state)) {
        if (n === 'select' || n === 'start') continue;
        if ((n === 'lb' || n === 'rb') && !bind[n]) continue;
        if (edge(n)) press(n);
        else if (up(n)) release(n);
        else if (state[n] && active[n] && REPEATS.has(n) && !isSel(active[n].v) && active[n].v !== 'tap') {
          const a = active[n]; a.t += dt;
          if (a.t > (a.rep ? 90 : 400)) { a.t = 0; a.rep++; sendKey('keydown', keyName(a.v), true); }
        }
      }
      if (edge('start')) startButton();
      if (up('start') && active.start) release('start');
    }
    // held elements follow layout changes
    for (const n of Object.keys(active)) if (!state[n] && n !== 'start') release(n);

    if (nav.on && nav.el) {
      const r = nav.el.getBoundingClientRect();
      ring.style.display = 'block';
      ring.style.left = (r.left - 4) + 'px'; ring.style.top = (r.top - 4) + 'px';
      ring.style.width = (r.width + 2) + 'px'; ring.style.height = (r.height + 2) + 'px';
    } else ring.style.display = 'none';

    pad.prev = state;
  }
  function step(d) {
    navMove(d === 'left' ? -1 : d === 'right' ? 1 : 0, d === 'up' ? -1 : d === 'down' ? 1 : 0);
  }
  addEventListener('blur', () => { releaseAll(); if (C.held) tapUp(); });
  addEventListener('gamepadconnected', () => { nav.prev = new Set(); });
  // a real touch/mouse hides the gamepad UI again
  addEventListener('pointerdown', e => { if (e.isTrusted) { navOff(); C.shown = false; } }, true);
  requestAnimationFrame(frame);
})();
