// Empire UI — scene renderer (Layer C).
// Turns a room definition + engine state into layered DOM. All placement comes from theme data:
//
//   x, y  — anchor point in % of the scene (anchor = bottom centre, i.e. the feet)
//   h     — height in % of the scene height (width follows the image's aspect ratio)
//   z     — layer order (background is 0)
//   flip  — mirror horizontally
//
// Media types (the "asset contract"):
//   { type:'sprite', src, frames, fps }   horizontal strip spritesheet (default when frames is set)
//   { type:'image',  src }                still image or animated WebP/GIF/SVG
//   { type:'video',  src }                looping muted video (no alpha on iOS Safari — see doc)
//   { type:'emoji',  char }               text/emoji placeholder, any style
//
// Nothing here is theme specific.

const sprites = new Set();
let rafStarted = false;

function startLoop() {
  if (rafStarted) return; rafStarted = true;
  const tick = now => {
    for (const s of sprites) {
      // A scene can be detached for a long time (e.g. while a room page is open) and then shown
      // again, so detached sprites are only skipped. They are removed by releaseScene().
      if (!s.el.isConnected) continue;
      if (!s.visible || s.paused) continue;
      const frame = Math.floor(((now - s.t0) / 1000) * s.fps) % s.frames;
      if (frame !== s.frame) {
        s.frame = frame;
        s.el.style.backgroundPositionX = s.frames > 1 ? `${(frame / (s.frames - 1)) * 100}%` : '0%';
      }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

const io = typeof IntersectionObserver !== 'undefined'
  ? new IntersectionObserver(entries => {
      for (const e of entries) for (const s of sprites) if (s.el === e.target) s.visible = e.isIntersecting;
    })
  : null;

/** Stop animating every sprite inside a scene element that is being thrown away. */
export function releaseScene(sceneEl) {
  for (const s of sprites) if (sceneEl.contains(s.el)) { sprites.delete(s); io?.unobserve(s.el); }
}

export function mediaType(m) {
  if (m.type) return m.type;
  if (m.char) return 'emoji';
  if (m.frames) return 'sprite';
  if (/\.(mp4|webm|mov)$/i.test(m.src || '')) return 'video';
  return 'image';
}

/** Create one positioned layer element. `asset(src)` resolves paths relative to the theme. */
export function makeLayer(m, asset, extraClass = '') {
  const type = mediaType(m);
  let el;
  if (type === 'sprite') {
    el = document.createElement('div');
    el.className = 'emp-layer emp-sprite ' + extraClass;
    el.style.backgroundImage = `url("${asset(m.src)}")`;
    el.style.backgroundSize = `${(m.frames || 1) * 100}% 100%`;
    if (m.frameAspect) el.style.aspectRatio = m.frameAspect;
    else {
      const img = new Image();
      img.onload = () => { el.style.aspectRatio = `${img.naturalWidth / (m.frames || 1)} / ${img.naturalHeight}`; };
      img.src = asset(m.src);
    }
    const s = { el, frames: m.frames || 1, fps: m.fps || 8, t0: performance.now() - Math.random() * 1000, frame: -1, visible: true };
    sprites.add(s); io?.observe(el); startLoop();
  } else if (type === 'video') {
    el = document.createElement('video');
    Object.assign(el, { src: asset(m.src), autoplay: true, loop: m.loop !== false, muted: true, playsInline: true });
    el.className = 'emp-layer ' + extraClass;
  } else if (type === 'emoji') {
    el = document.createElement('div');
    el.className = 'emp-layer emp-emoji ' + extraClass;
    el.textContent = m.char;
  } else {
    el = document.createElement('img');
    el.className = 'emp-layer ' + extraClass;
    el.src = asset(m.src); el.alt = ''; el.draggable = false;
  }
  el.style.left = `${m.x}%`;
  el.style.top = `${m.y}%`;
  el.style.height = `${m.h}%`;
  el.style.zIndex = String(10 + (m.z ?? 1));
  if (type === 'emoji') el.style.fontSize = `${m.h * 0.8}cqh`;
  if (m.flip) el.classList.add('emp-flip');
  return el;
}

/** Which upgrade image applies at this level (highest stage with minLevel <= level). */
export function upgradeStage(visual, level) {
  if (!visual || level <= 0) return null;
  if (!visual.stages) return visual;
  let best = null;
  for (const s of visual.stages) if (level >= (s.minLevel ?? 1)) best = s;
  return best ? { ...visual, ...best } : null;
}

/** Signature of everything that changes the scene's look; re-render only when it changes. */
export function sceneSignature(room, empire) {
  const c = room.characters.map(ch => (empire.charLevel(ch.id) > 0 ? 1 : 0)).join('');
  const u = room.upgrades.map(up => upgradeStage(up.visual, empire.upgradeLevel(up.id))?.src || '-').join('|');
  return c + '/' + u + '/' + (empire.isBuilt(room.id) ? 1 : 0);
}

export function renderScene(container, room, empire, asset, { justUnlocked = new Set() } = {}) {
  container.innerHTML = '';
  container.classList.add('emp-scene');
  const bg = room.background || {};
  if (bg.src) {
    const img = document.createElement(/\.(mp4|webm)$/i.test(bg.src) ? 'video' : 'img');
    img.className = 'emp-bg';
    if (img.tagName === 'VIDEO') Object.assign(img, { autoplay: true, loop: true, muted: true, playsInline: true });
    img.src = asset(bg.src); img.alt = '';
    container.appendChild(img);
  }
  if (bg.color) container.style.background = bg.color;

  for (const up of room.upgrades) {
    const v = upgradeStage(up.visual, empire.upgradeLevel(up.id));
    if (v) container.appendChild(makeLayer(v, asset, 'emp-upgrade'));
  }
  for (const ch of room.characters) {
    const m = ch.sprite || { char: '🙂', x: 50, y: 92, h: 30 };
    if (empire.charLevel(ch.id) > 0) {
      container.appendChild(makeLayer(m, asset, 'emp-actor' + (justUnlocked.has(ch.id) ? ' emp-pop' : '')));
    } else {
      const ghost = document.createElement('div');
      ghost.className = 'emp-ghost';
      ghost.style.left = `${m.x}%`; ghost.style.top = `${m.y}%`;
      ghost.textContent = '?';
      ghost.title = `${ch.name} — not hired yet`;
      container.appendChild(ghost);
    }
  }
}

/** A small static portrait (first frame) for UI tiles and pack cards. */
export function portrait(ch, asset) {
  const m = ch.sprite;
  const el = document.createElement('div');
  el.className = 'emp-portrait';
  if (!m) { el.textContent = '🙂'; return el; }
  const t = mediaType(m);
  if (t === 'emoji') { el.textContent = m.char; el.classList.add('emp-portrait-emoji'); }
  else if (t === 'sprite') {
    el.style.backgroundImage = `url("${asset(m.src)}")`;
    el.style.backgroundSize = `${(m.frames || 1) * 100}% 100%`;
    if (m.flip) el.classList.add('emp-flip');
  } else el.style.backgroundImage = `url("${asset(m.src)}")`;
  return el;
}
