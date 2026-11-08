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
//                                         optional blend: 0–1 = share of each frame spent cross-fading
//                                         into the next (good for sheets of separate poses)
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
      const pos = ((now - s.t0) / 1000) * s.fps;
      const frame = Math.floor(pos) % s.frames;
      if (s.blend) {
        // Hold the pose, then fade into the next one during the last `blend` share of the frame.
        const t = Math.min(1, Math.max(0, (pos % 1 - (1 - s.blend)) / s.blend));
        const e = t * t * (3 - 2 * t);
        if (frame !== s.frame) {
          s.frame = frame;
          s.a.style.backgroundPositionX = framePos(frame, s.frames);
          s.b.style.backgroundPositionX = framePos((frame + 1) % s.frames, s.frames);
        }
        // Overlap the fades so the figure never turns see-through halfway.
        s.a.style.opacity = Math.min(1, 2 * (1 - e)).toFixed(3);
        s.b.style.opacity = Math.min(1, 2 * e).toFixed(3);
      } else if (frame !== s.frame) {
        s.frame = frame;
        s.el.style.backgroundPositionX = framePos(frame, s.frames);
      }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function framePos(frame, frames) { return frames > 1 ? `${(frame / (frames - 1)) * 100}%` : '0%'; }

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
    const blend = m.blend > 0 && m.frames > 1 ? Math.min(1, m.blend) : 0;
    const paint = node => {
      node.style.backgroundImage = `url("${asset(m.src)}")`;
      node.style.backgroundSize = `${(m.frames || 1) * 100}% 100%`;
    };
    let a = null, b = null;
    if (blend) {
      a = document.createElement('div'); b = document.createElement('div');
      for (const n of [a, b]) { n.className = 'emp-sprite-frame'; paint(n); el.appendChild(n); }
      b.style.opacity = '0';
    } else paint(el);
    if (m.frameAspect) el.style.aspectRatio = m.frameAspect;
    else {
      const img = new Image();
      img.onload = () => { el.style.aspectRatio = `${img.naturalWidth / (m.frames || 1)} / ${img.naturalHeight}`; };
      img.src = asset(m.src);
    }
    const s = { el, a, b, blend, frames: m.frames || 1, fps: m.fps || 8, t0: performance.now() - Math.random() * 1000, frame: -1, visible: true };
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
      ghost.title = ch.name;
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
    // First frame, cropped to the figure itself, so any frame size or shape fills the card.
    const canvas = document.createElement('canvas');
    canvas.className = 'emp-portrait-canvas';
    el.appendChild(canvas);
    if (m.flip) el.classList.add('emp-flip');
    firstFrame(asset(m.src), m.frames || 1).then(f => {
      canvas.width = f.w; canvas.height = f.h;
      canvas.getContext('2d').drawImage(f.img, f.sx, f.sy, f.w, f.h, 0, 0, f.w, f.h);
    }).catch(() => {});
  } else el.style.backgroundImage = `url("${asset(m.src)}")`;
  return el;
}

const frameCache = new Map();
/** Load a spritesheet once and find the box around the visible pixels of frame 0. */
function firstFrame(src, frames) {
  if (!frameCache.has(src)) frameCache.set(src, new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const fw = Math.floor(img.naturalWidth / frames), fh = img.naturalHeight;
      let box = { sx: 0, sy: 0, w: fw, h: fh };
      try {
        const c = document.createElement('canvas'); c.width = fw; c.height = fh;
        const g = c.getContext('2d'); g.drawImage(img, 0, 0, fw, fh, 0, 0, fw, fh);
        const d = g.getImageData(0, 0, fw, fh).data;
        let x0 = fw, y0 = fh, x1 = -1, y1 = -1;
        for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
          if (d[(y * fw + x) * 4 + 3] > 90) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        }
        if (x1 >= 0) {
          const pad = Math.round(Math.max(x1 - x0, y1 - y0) * 0.08);
          x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(fw - 1, x1 + pad); y1 = Math.min(fh - 1, y1 + pad);
          box = { sx: x0, sy: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
        }
      } catch { /* cross-origin image: use the whole frame */ }
      resolve({ img, ...box });
    };
    img.onerror = reject;
    img.src = src;
  }));
  return frameCache.get(src);
}
