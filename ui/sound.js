// ui/sound.js
// Shared synthesized sound for Bus Adventures — music and effects made in code, no audio files.
//
// Usage (classic script, works in any game page):
//   <script src="../../ui/sound.js"></script>
//   BASound.play('coin');                 // one-shot effect (see SFX below)
//   BASound.play('hit', { pitch: 1.2 });  // optional pitch / vol
//   BASound.music.play('spooky');         // loop a mood from MOODS (or pass your own track object)
//   BASound.music.rate(1.1);              // tempo multiplier (e.g. speed up per level)
//   BASound.music.stop();
//   BASound.button();                     // sound on/off button (auto-added next to #btnMeny if present)
//
// One setting for the whole platform: localStorage "busadv_audio" ("true"/"false"),
// the same key ui/audio.js uses, so turning sound off anywhere turns it off everywhere.
//
// Script-tag options:  data-button="auto" (default) | "none" | "tr" | "tl" | "br" | "bl"
//                      data-anchor="#menu"  put the button just before that element
(function () {
  'use strict';
  if (window.BASound) return;

  const KEY = 'busadv_audio';
  let enabled = true;
  try { const v = localStorage.getItem(KEY); if (v !== null) enabled = v === 'true'; } catch (e) {}

  let ac = null, master = null, sfxBus = null, musBus = null, noiseBuf = null, unlocked = false;
  const listeners = [];

  function ctx() {
    if (!ac) {
      try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
      const comp = ac.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 4;
      master = ac.createGain(); master.gain.value = enabled ? 1 : 0;
      master.connect(comp).connect(ac.destination);
      sfxBus = ac.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(master);
      musBus = ac.createGain(); musBus.gain.value = 0.42; musBus.connect(master);
      noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ac.state === 'suspended' && !document.hidden) ac.resume();
    return ac;
  }
  function unlock() { if (ctx()) unlocked = true; }
  ['pointerdown', 'touchstart', 'touchend', 'mousedown', 'keydown', 'click'].forEach(ev =>
    document.addEventListener(ev, unlock, { capture: true, passive: true }));
  document.addEventListener('visibilitychange', () => {
    if (!ac) return;
    if (document.hidden) ac.suspend(); else if (unlocked) { ac.resume(); seq.resync(); }
  });

  function setEnabled(v) {
    enabled = !!v;
    try { localStorage.setItem(KEY, String(enabled)); } catch (e) {}
    if (ac && master) master.gain.setTargetAtTime(enabled ? 1 : 0, ac.currentTime, 0.04);
    if (enabled) seq.resync();
    listeners.forEach(fn => { try { fn(enabled); } catch (e) {} });
  }

  // ---------- primitives ----------
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  // tone: oscillator with optional pitch slide
  function tone(o) {
    const a = ctx(); if (!a || !enabled) return;
    const t = a.currentTime + (o.delay || 0), dur = o.dur || 0.1;
    const osc = a.createOscillator(), g = a.createGain();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(o.f, t);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t + dur);
    const v = (o.vol == null ? 0.2 : o.vol);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + (o.attack || 0.004));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = osc;
    if (o.lp) { const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; osc.connect(f); node = f; }
    node.connect(g).connect(o.bus || sfxBus);
    osc.start(t); osc.stop(t + dur + 0.03);
  }
  // noise: filtered noise burst with optional filter sweep
  function noise(o) {
    const a = ctx(); if (!a || !enabled) return;
    const t = a.currentTime + (o.delay || 0), dur = o.dur || 0.1;
    const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    src.buffer = noiseBuf; src.loop = dur > 0.9;
    f.type = o.ft || 'bandpass'; f.frequency.setValueAtTime(o.freq || 1200, t); f.Q.value = o.q || 1;
    if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + dur);
    const v = (o.vol == null ? 0.25 : o.vol);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + (o.attack || 0.003));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(o.bus || sfxBus);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.03);
  }
  const notes = (seq, step, o) => seq.forEach((f, i) => tone(Object.assign({}, o, { f, delay: (o.delay || 0) + i * step })));

  // ---------- effects library ----------
  // each takes p = pitch multiplier, v = volume multiplier
  const SFX = {
    click:    (p, v) => tone({ f: 1800 * p, f2: 900 * p, dur: 0.035, vol: 0.12 * v }),
    select:   (p, v) => tone({ f: 660 * p, dur: 0.06, vol: 0.12 * v, type: 'square' }),
    confirm:  (p, v) => notes([660 * p, 990 * p], 0.06, { dur: 0.09, vol: 0.12 * v }),
    back:     (p, v) => notes([660 * p, 440 * p], 0.06, { dur: 0.09, vol: 0.1 * v }),
    error:    (p, v) => notes([220 * p, 160 * p], 0.11, { dur: 0.14, vol: 0.14 * v, type: 'square' }),
    start:    (p, v) => notes([523 * p, 659 * p, 784 * p, 1047 * p], 0.07, { dur: 0.12, vol: 0.12 * v }),
    coin:     (p, v) => { tone({ f: 988 * p, dur: 0.06, vol: 0.13 * v }); tone({ f: 1319 * p, dur: 0.22, vol: 0.13 * v, delay: 0.06 }); },
    pickup:   (p, v) => tone({ f: 600 * p, f2: 1400 * p, dur: 0.12, vol: 0.13 * v, type: 'triangle' }),
    powerup:  (p, v) => notes([392, 523, 659, 784, 1047].map(f => f * p), 0.05, { dur: 0.08, vol: 0.11 * v }),
    cash:     (p, v) => { noise({ freq: 5000 * p, dur: 0.05, vol: 0.12 * v, ft: 'highpass' }); notes([1568 * p, 2093 * p], 0.05, { dur: 0.15, vol: 0.1 * v, type: 'triangle', delay: 0.03 }); },
    jump:     (p, v) => tone({ f: 300 * p, f2: 750 * p, dur: 0.16, vol: 0.13 * v, type: 'square' }),
    land:     (p, v) => { tone({ f: 140 * p, f2: 60 * p, dur: 0.1, vol: 0.2 * v, type: 'sine' }); noise({ freq: 400, dur: 0.06, vol: 0.08 * v }); },
    step:     (p, v) => noise({ freq: 700 * p, dur: 0.04, vol: 0.07 * v, q: 2 }),
    shoot:    (p, v) => tone({ f: 900 * p, f2: 220 * p, dur: 0.09, vol: 0.11 * v, type: 'square' }),
    laser:    (p, v) => tone({ f: 1600 * p, f2: 300 * p, dur: 0.14, vol: 0.1 * v, type: 'sawtooth' }),
    shotgun:  (p, v) => { noise({ freq: 1500 * p, f2: 300, dur: 0.25, vol: 0.32 * v, q: 0.7 }); tone({ f: 120 * p, f2: 50, dur: 0.15, vol: 0.25 * v, type: 'sine' }); },
    swing:    (p, v) => noise({ freq: 600 * p, f2: 2400 * p, dur: 0.12, vol: 0.12 * v, q: 3 }),
    whoosh:   (p, v) => noise({ freq: 400 * p, f2: 1800 * p, dur: 0.25, vol: 0.12 * v, q: 2 }),
    hit:      (p, v) => { noise({ freq: 900 * p, dur: 0.07, vol: 0.25 * v, q: 1.5 }); tone({ f: 200 * p, f2: 90 * p, dur: 0.08, vol: 0.2 * v, type: 'square' }); },
    thud:     (p, v) => { tone({ f: 110 * p, f2: 45 * p, dur: 0.18, vol: 0.32 * v, type: 'sine' }); noise({ freq: 300, dur: 0.08, vol: 0.1 * v }); },
    hurt:     (p, v) => { tone({ f: 420 * p, f2: 140 * p, dur: 0.22, vol: 0.16 * v, type: 'sawtooth', lp: 1800 }); noise({ freq: 800, dur: 0.1, vol: 0.12 * v }); },
    explode:  (p, v) => { noise({ freq: 1000 * p, f2: 120, dur: 0.5, vol: 0.38 * v, q: 0.6, ft: 'lowpass' }); tone({ f: 90 * p, f2: 35, dur: 0.4, vol: 0.3 * v, type: 'sine' }); },
    boom:     (p, v) => { noise({ freq: 700 * p, f2: 60, dur: 1.1, vol: 0.45 * v, q: 0.5, ft: 'lowpass' }); tone({ f: 70 * p, f2: 25, dur: 0.9, vol: 0.4 * v, type: 'sine' }); },
    splash:   (p, v) => { noise({ freq: 1200 * p, f2: 400, dur: 0.4, vol: 0.25 * v, q: 0.8 }); noise({ freq: 3000 * p, dur: 0.2, vol: 0.1 * v, ft: 'highpass', delay: 0.05 }); },
    bubble:   (p, v) => tone({ f: 300 * p, f2: 900 * p, dur: 0.08, vol: 0.1 * v, type: 'sine' }),
    sonar:    (p, v) => { tone({ f: 1250 * p, dur: 0.9, vol: 0.1 * v, type: 'sine', attack: 0.01 }); tone({ f: 1250 * p, dur: 0.6, vol: 0.035 * v, type: 'sine', delay: 0.35 }); },
    torpedo:  (p, v) => { noise({ freq: 500 * p, f2: 1500 * p, dur: 0.5, vol: 0.14 * v, q: 2 }); tone({ f: 180 * p, dur: 0.3, vol: 0.08 * v, type: 'sawtooth', lp: 600 }); },
    thunder:  (p, v) => { noise({ freq: 2500 * p, f2: 200, dur: 0.15, vol: 0.4 * v, q: 0.5 }); noise({ freq: 400 * p, f2: 60, dur: 1.6, vol: 0.4 * v, q: 0.4, ft: 'lowpass', delay: 0.06 }); },
    zap:      (p, v) => { tone({ f: 2400 * p, f2: 200 * p, dur: 0.18, vol: 0.12 * v, type: 'sawtooth' }); noise({ freq: 4000, dur: 0.12, vol: 0.12 * v, ft: 'highpass' }); },
    alarm:    (p, v) => notes([880 * p, 660 * p, 880 * p, 660 * p], 0.12, { dur: 0.11, vol: 0.12 * v, type: 'square' }),
    warn:     (p, v) => tone({ f: 880 * p, dur: 0.12, vol: 0.12 * v, type: 'square' }),
    tick:     (p, v) => tone({ f: 2000 * p, dur: 0.02, vol: 0.07 * v, type: 'square' }),
    beep:     (p, v) => tone({ f: 880 * p, dur: 0.08, vol: 0.12 * v, type: 'square' }),
    perfect:  (p, v) => notes([784, 1047, 1319, 1568].map(f => f * p), 0.045, { dur: 0.12, vol: 0.12 * v, type: 'triangle' }),
    combo:    (p, v) => tone({ f: 880 * p, f2: 1760 * p, dur: 0.1, vol: 0.12 * v, type: 'triangle' }),
    miss:     (p, v) => tone({ f: 300 * p, f2: 180 * p, dur: 0.18, vol: 0.12 * v, type: 'square' }),
    lifeLost: (p, v) => notes([494, 466, 440, 415].map(f => f * p), 0.1, { dur: 0.14, vol: 0.13 * v, type: 'square' }),
    levelup:  (p, v) => notes([523, 659, 784, 1047, 784, 1047].map(f => f * p), 0.08, { dur: 0.12, vol: 0.12 * v }),
    win:      (p, v) => { notes([523, 523, 523, 698].map(f => f * p), 0.12, { dur: 0.13, vol: 0.12 * v }); tone({ f: 1047 * p, dur: 0.6, vol: 0.12 * v, delay: 0.5, type: 'square' }); },
    gameover: (p, v) => notes([392, 330, 262, 196].map(f => f * p), 0.2, { dur: 0.3, vol: 0.13 * v, type: 'triangle' }),
    crowd:    (p, v) => { for (let i = 0; i < 6; i++) tone({ f: (180 + Math.random() * 200) * p, f2: (260 + Math.random() * 260) * p, dur: 0.9, vol: 0.03 * v, type: 'sawtooth', lp: 1300, delay: Math.random() * 0.1 }); noise({ freq: 1100, dur: 0.9, vol: 0.08 * v, q: 0.8 }); },
    boo:      (p, v) => { for (let i = 0; i < 6; i++) tone({ f: (200 + Math.random() * 120) * p, f2: (120 + Math.random() * 60) * p, dur: 0.9, vol: 0.03 * v, type: 'sawtooth', lp: 900, delay: Math.random() * 0.1 }); },
    drum:     (p, v) => { tone({ f: 130 * p, f2: 55 * p, dur: 0.35, vol: 0.35 * v, type: 'sine' }); noise({ freq: 250 * p, dur: 0.12, vol: 0.15 * v }); },
    bell:     (p, v) => { tone({ f: 1320 * p, dur: 0.8, vol: 0.09 * v, type: 'sine' }); tone({ f: 3170 * p, dur: 0.4, vol: 0.03 * v, type: 'sine' }); },
    flute:    (p, v) => tone({ f: 880 * p, dur: 0.25, vol: 0.1 * v, type: 'sine', attack: 0.03 }),
    honk:     (p, v) => { tone({ f: 370 * p, dur: 0.22, vol: 0.12 * v, type: 'sawtooth', lp: 1400 }); tone({ f: 466 * p, dur: 0.22, vol: 0.1 * v, type: 'sawtooth', lp: 1400 }); },
    engine:   (p, v) => tone({ f: 70 * p, f2: 95 * p, dur: 0.3, vol: 0.1 * v, type: 'sawtooth', lp: 400 }),
    reload:   (p, v) => { noise({ freq: 3000 * p, dur: 0.04, vol: 0.15 * v, q: 3 }); noise({ freq: 2200 * p, dur: 0.05, vol: 0.15 * v, q: 3, delay: 0.12 }); },
    spray:    (p, v) => noise({ freq: 3500 * p, dur: 0.3, vol: 0.12 * v, ft: 'highpass', attack: 0.03 }),
    pop:      (p, v) => { tone({ f: 600 * p, f2: 120 * p, dur: 0.06, vol: 0.2 * v, type: 'square' }); noise({ freq: 2000, dur: 0.05, vol: 0.15 * v }); },
  };
  function play(name, o) {
    if (window.__basLog) window.__basLog.push(name); // test hook
    if (!enabled) return;
    const fn = SFX[name]; if (!fn) return;
    o = o || {};
    const p = (o.pitch || 1) * (o.vary === false ? 1 : 0.97 + Math.random() * 0.06);
    try { fn(p, o.vol == null ? 1 : o.vol); } catch (e) {}
  }

  // ---------- music ----------
  // Track: { bpm, swing, parts: [{ wave, vol, env, notes: "A3 - . E4", lp, vib }], drums: { kick, snare, hat, tom } }
  // notes: one token per step (8th notes unless step set). "." rest, "-" hold previous note.
  function parseNotes(str) {
    const toks = str.replace(/\|/g, ' ').trim().split(/\s+/), out = [];
    toks.forEach((t, i) => {
      if (t === '.' ) return;
      if (t === '-') { for (let k = out.length - 1; k >= 0; k--) { if (out[k].end === i) { out[k].end = i + 1; break; } } return; }
      const m = /^([A-G])(#|b)?(-?\d)$/.exec(t); if (!m) return;
      const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
      out.push({ step: i, end: i + 1, midi: 12 * (+m[3] + 1) + base });
    });
    return { list: out, len: toks.length };
  }
  const MOODS = {};
  function mood(name, t) { MOODS[name] = t; }

  // spooky — Lich Tower
  mood('spooky', { bpm: 84, parts: [
    { wave: 'triangle', vol: 0.5, env: 'pluck', notes: 'A2 . A2 . E2 . A2 . | F2 . F2 . C3 . F2 . | D2 . D2 . A2 . D2 . | E2 . E2 . B2 . G#2 .' },
    { wave: 'triangle', vol: 0.12, env: 'pad', notes: 'C4 - - - - - - - | A3 - - - - - - - | F3 - - - - - - - | B3 - - - - - - -' },
    { wave: 'sine', vol: 0.22, env: 'lead', vib: 6, notes: 'E5 - - - C5 - D5 - | F5 - - - E5 - C5 - | D5 - - - F5 - A5 - | G#5 - - - - - . .' },
  ], drums: { kick: 'x.......', hat: '....x...' } });
  // asylum — Ward B (ambient)
  mood('asylum', { bpm: 60, parts: [
    { wave: 'sine', vol: 0.4, env: 'pad', notes: 'A1 - - - - - - - | A1 - - - - - - - | Bb1 - - - - - - - | A1 - - - - - - -' },
    { wave: 'triangle', vol: 0.08, env: 'pad', notes: 'C3 - - - - - - - | Eb3 - - - - - - - | D3 - - - - - - - | C#3 - - - - - - -' },
    { wave: 'sine', vol: 0.1, env: 'bell', notes: '. . . . E6 . . . | . . . . . . . . | . . F6 . . . . . | . . . . . . B5 .' },
  ], drums: { kick: 'x.x.............................' } });
  // arcade — Space Watch, City Bomber
  mood('arcade', { bpm: 150, parts: [
    { wave: 'square', vol: 0.22, env: 'pluck', lp: 1400, notes: 'E2 E3 E2 E3 E2 E3 E2 E3 | C2 C3 C2 C3 C2 C3 C2 C3 | D2 D3 D2 D3 D2 D3 D2 D3 | B1 B2 B1 B2 B1 B2 B1 B2' },
    { wave: 'square', vol: 0.13, env: 'lead', notes: 'B4 . E5 . G5 . F#5 E5 | G5 . E5 . C5 . D5 . | F#5 . D5 . A4 . B4 C5 | D#5 - - . B4 - - .' },
  ], drums: { kick: 'x...x...', snare: '..x...x.', hat: 'xxxxxxxx' } });
  // action — Flock, Heli Rescue, Missile Command
  mood('action', { bpm: 132, parts: [
    { wave: 'sawtooth', vol: 0.22, env: 'pluck', lp: 900, notes: 'D2 D2 D3 D2 D2 D2 D3 D2 | Bb1 Bb1 Bb2 Bb1 Bb1 Bb1 Bb2 Bb1 | C2 C2 C3 C2 C2 C2 C3 C2 | A1 A1 A2 A1 A1 A1 A2 A1' },
    { wave: 'square', vol: 0.12, env: 'lead', notes: 'D5 - F5 - A5 - G5 F5 | F5 - D5 - Bb4 - - - | C5 - E5 - G5 - F5 E5 | E5 - C#5 - A4 - - -' },
  ], drums: { kick: 'x...x.x.', snare: '..x...x.', hat: 'xxxxxxxx' } });
  // deepsea — Kraken, Periscope
  mood('deepsea', { bpm: 66, parts: [
    { wave: 'sine', vol: 0.45, env: 'pad', notes: 'C2 - - - - - - - | Ab1 - - - - - - - | F1 - - - - - - - | G1 - - - - - - -' },
    { wave: 'triangle', vol: 0.09, env: 'pad', notes: 'Eb3 - - - - - - - | C3 - - - - - - - | Ab2 - - - - - - - | B2 - - - - - - -' },
    { wave: 'sine', vol: 0.12, env: 'bell', notes: 'G5 . . . . . . . | . . . . Eb5 . . . | C5 . . . . . . . | . . . . D5 . . .' },
  ], drums: { kick: 'x.......' } });
  // cheeky — Chemtrails, Grab the Money
  mood('cheeky', { bpm: 124, parts: [
    { wave: 'triangle', vol: 0.45, env: 'pluck', notes: 'C3 . G2 . C3 . G2 . | A2 . E2 . A2 . E2 . | F2 . C3 . F2 . C3 . | G2 . D3 . G2 . B2 .' },
    { wave: 'square', vol: 0.06, env: 'pluck', lp: 2000, notes: '. E4 . E4 . E4 . E4 | . C4 . C4 . C4 . C4 | . A4 . A4 . A4 . A4 | . B4 . B4 . B4 . B4' },
    { wave: 'square', vol: 0.11, env: 'lead', notes: 'G4 . C5 . E5 . D5 C5 | A4 . . C5 E5 . . . | F5 . E5 . D5 . C5 . | D5 . G4 . B4 . D5 .' },
  ], drums: { kick: 'x...x...', snare: '..x...x.', hat: '.x.x.x.x' } });
  // drive — Dobbeltvakt, Bus Empire
  mood('drive', { bpm: 136, parts: [
    { wave: 'sawtooth', vol: 0.2, env: 'pluck', lp: 1000, notes: 'A2 . A2 A3 A2 . A2 A3 | D2 . D2 D3 D2 . D2 D3 | E2 . E2 E3 E2 . E2 E3 | A2 . A2 A3 A2 . E2 E3' },
    { wave: 'square', vol: 0.11, env: 'lead', notes: 'C#5 - E5 - A5 - E5 - | F#5 - D5 - A4 - D5 - | E5 - G#5 - B5 - G#5 - | A5 - - - E5 - C#5 -' },
  ], drums: { kick: 'x...x...', snare: '..x...x.', hat: 'x.xxx.xx' } });
  // retro — Baloon Crazy (home-computer style)
  mood('retro', { bpm: 128, parts: [
    { wave: 'square', vol: 0.08, env: 'pluck', notes: 'A3 C4 E4 C4 A3 C4 E4 C4 | G3 B3 D4 B3 G3 B3 D4 B3 | F3 A3 C4 A3 F3 A3 C4 A3 | E3 G#3 B3 G#3 E3 G#3 B3 G#3' },
    { wave: 'triangle', vol: 0.4, env: 'pluck', notes: 'A1 . A2 . A1 . A2 . | G1 . G2 . G1 . G2 . | F1 . F2 . F1 . F2 . | E1 . E2 . E1 . E2 .' },
    { wave: 'square', vol: 0.12, env: 'lead', notes: 'A4 - - - C5 - B4 - | G4 - - - B4 - A4 - | F4 - - - A4 - G4 - | E4 - G#4 - B4 - E5 -' },
  ], drums: { kick: 'x...x...', snare: '....x...' } });
  // storm — Seven Strikes
  mood('storm', { bpm: 104, parts: [
    { wave: 'sawtooth', vol: 0.16, env: 'pluck', lp: 700, notes: 'E2 E2 E2 E2 E2 E2 E2 E2 | E2 E2 E2 E2 E2 E2 E2 E2 | C2 C2 C2 C2 C2 C2 C2 C2 | B1 B1 B1 B1 B1 B1 B1 B1' },
    { wave: 'triangle', vol: 0.2, env: 'lead', vib: 5, notes: 'E5 - - - G5 - F#5 - | E5 - B4 - - - - - | C5 - E5 - G5 - A5 - | F#5 - D#5 - B4 - - -' },
  ], drums: { tom: 'x.....x.', kick: 'x.......' } });
  // march — Respect My Authority, Forest Pacification
  mood('march', { bpm: 112, parts: [
    { wave: 'triangle', vol: 0.45, env: 'pluck', notes: 'G2 . D2 . G2 . D2 . | Eb2 . Bb1 . Eb2 . Bb1 . | D2 . A1 . D2 . F#2 . | G2 . D2 . G2 - - .' },
    { wave: 'sawtooth', vol: 0.09, env: 'lead', lp: 1600, notes: 'D5 - D5 D5 G5 - - . | G5 - F5 Eb5 D5 - - . | F#5 - A5 - D5 - C5 Bb4 | A4 - G4 - - - . .' },
  ], drums: { kick: 'x...x...', snare: 'x.xx..x.' } });
  // folk — Grizzly (flute over a drone)
  mood('folk', { bpm: 120, parts: [
    { wave: 'triangle', vol: 0.35, env: 'pad', notes: 'D3 - - - A2 - - - | G2 - - - D3 - - - | A2 - - - E3 - - - | D3 - A2 - D3 - - -' },
    { wave: 'sine', vol: 0.18, env: 'lead', vib: 5, notes: 'F#5 A5 B5 A5 F#5 E5 D5 E5 | B4 D5 G5 F#5 E5 D5 B4 - | A4 C#5 E5 A5 G5 E5 C#5 E5 | D5 - F#5 - D5 - - -' },
  ], drums: { kick: 'x...x...', hat: '..x...x.' } });
  // space — Moon Buggy, Space Empire
  mood('space', { bpm: 116, parts: [
    { wave: 'triangle', vol: 0.15, env: 'pluck', notes: 'A3 C4 E4 A4 E4 C4 A3 C4 | F3 A3 C4 F4 C4 A3 F3 A3 | C4 E4 G4 C5 G4 E4 C4 E4 | G3 B3 D4 G4 D4 B3 G3 B3' },
    { wave: 'sine', vol: 0.4, env: 'pad', notes: 'A1 - - - - - - - | F1 - - - - - - - | C2 - - - - - - - | G1 - - - - - - -' },
    { wave: 'sine', vol: 0.14, env: 'lead', vib: 4, notes: 'E5 - - - - - - - | C5 - - - A4 - - - | G5 - - - E5 - - - | D5 - - - B4 - - -' },
  ], drums: { kick: 'x.......', hat: '..x...x.' } });
  // idle — base for the Empire games
  mood('idle', { bpm: 84, parts: [
    { wave: 'triangle', vol: 0.4, env: 'pluck', notes: 'C2 - - - G2 - E2 - | A1 - - - E2 - G2 - | D2 - - - A2 - F2 - | G1 - - - D2 - B1 -' },
    { wave: 'triangle', vol: 0.07, env: 'pad', notes: 'E4 - - - - - - - | C4 - - - - - - - | F4 - - - - - - - | F4 - - - - - - -' },
    { wave: 'triangle', vol: 0.07, env: 'pad', notes: 'B4 - - - - - - - | G4 - - - - - - - | C5 - - - - - - - | B4 - - - - - - -' },
    { wave: 'sine', vol: 0.13, env: 'bell', notes: '. . G5 . E5 . . . | . . E5 . C5 . . . | . . F5 . A5 . . . | . . D5 . B4 . G4 .' },
  ], drums: { kick: 'x.....x.', snare: '....x...', hat: 'x.x.x.x.' } });
  // ninja — Ninja Empire, Shadow Over Iron Pines
  mood('ninja', { bpm: 96, parts: [
    { wave: 'triangle', vol: 0.2, env: 'pluck', notes: 'A4 . E5 . F5 E5 D5 . | A4 . Bb4 . D5 - - . | E5 . F5 . A5 . F5 E5 | D5 . Bb4 . A4 - - .' },
    { wave: 'sine', vol: 0.35, env: 'pad', notes: 'A2 - - - - - - - | D2 - - - - - - - | F2 - - - - - - - | E2 - - - - - - -' },
  ], drums: { tom: 'x..x..x.', kick: 'x.......' } });
  // tavern — Quest Empire (6/8 jig)
  mood('tavern', { bpm: 150, parts: [
    { wave: 'triangle', vol: 0.4, env: 'pluck', notes: 'D3 . A2 D3 . A2 | G2 . D3 G2 . D3 | D3 . A2 D3 . A2 | A2 . E3 A2 . C#3' },
    { wave: 'square', vol: 0.09, env: 'lead', lp: 2500, notes: 'F#5 E5 D5 A4 D5 F#5 | G5 F#5 E5 D5 B4 G4 | F#5 A5 F#5 E5 D5 B4 | A4 C#5 E5 A5 - .' },
  ], drums: { kick: 'x..x..', hat: '.xx.xx' } });
  // fighter — Fighter Empire (rock)
  mood('fighter', { bpm: 140, parts: [
    { wave: 'sawtooth', vol: 0.18, env: 'pluck', lp: 1100, notes: 'E2 E2 E2 E2 G2 G2 A2 A2 | E2 E2 E2 E2 D2 D2 B1 B1 | E2 E2 E2 E2 G2 G2 A2 A2 | C3 C3 B2 B2 A2 A2 G2 G2' },
    { wave: 'sawtooth', vol: 0.1, env: 'pluck', lp: 1400, notes: 'B2 B2 B2 B2 D3 D3 E3 E3 | B2 B2 B2 B2 A2 A2 F#2 F#2 | B2 B2 B2 B2 D3 D3 E3 E3 | G3 G3 F#3 F#3 E3 E3 D3 D3' },
  ], drums: { kick: 'x.x...x.', snare: '..x...x.', hat: 'xxxxxxxx' } });
  // lounge — XXX Empire (swing)
  mood('lounge', { bpm: 92, swing: 0.22, parts: [
    { wave: 'triangle', vol: 0.45, env: 'pluck', notes: 'D2 . F2 . A2 . C3 . | G2 . B2 . D3 . F3 . | C2 . E2 . G2 . B2 . | A2 . C#3 . E3 . G3 .' },
    { wave: 'sine', vol: 0.08, env: 'pad', notes: 'F4 - - - - - - - | F4 - - - - - - - | E4 - - - - - - - | C#4 - - - - - - -' },
    { wave: 'sawtooth', vol: 0.07, env: 'lead', lp: 1200, vib: 4, notes: '. . A4 - C5 - D5 - | . . B4 - D5 - F5 - | E5 - - - D5 C5 B4 - | A4 - - - . . . .' },
  ], drums: { hat: 'x.x.x.x.', snare: '....x...' } });

  function drum(kind, t, vol) {
    const a = ac, bus = musBus;
    if (kind === 'kick') {
      const o = a.createOscillator(), g = a.createGain();
      o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
      g.gain.setValueAtTime(0.55 * vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(g).connect(bus); o.start(t); o.stop(t + 0.2);
    } else if (kind === 'tom') {
      const o = a.createOscillator(), g = a.createGain();
      o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(60, t + 0.3);
      g.gain.setValueAtTime(0.45 * vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o.connect(g).connect(bus); o.start(t); o.stop(t + 0.36);
    } else {
      const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
      s.buffer = noiseBuf;
      const snare = kind === 'snare';
      f.type = snare ? 'bandpass' : 'highpass'; f.frequency.value = snare ? 1800 : 7000;
      const v = (snare ? 0.22 : 0.07) * vol, d = snare ? 0.12 : 0.04;
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      s.connect(f).connect(g).connect(bus); s.start(t, Math.random() * 0.5); s.stop(t + d + 0.02);
    }
  }
  function voice(part, midi, t, dur) {
    const a = ac, o = a.createOscillator(), g = a.createGain();
    o.type = part.wave || 'square'; o.frequency.setValueAtTime(mtof(midi), t);
    let node = o;
    if (part.lp) { const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = part.lp; o.connect(f); node = f; }
    if (part.vib) { const l = a.createOscillator(), lg = a.createGain(); l.frequency.value = 5.5; lg.gain.value = part.vib; l.connect(lg).connect(o.frequency); l.start(t); l.stop(t + dur + 0.3); }
    const v = part.vol || 0.2, env = part.env || 'lead';
    g.gain.setValueAtTime(0.0001, t);
    if (env === 'pluck') {
      g.gain.exponentialRampToValueAtTime(v, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.12, dur * 0.95));
    } else if (env === 'bell') {
      g.gain.exponentialRampToValueAtTime(v, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
      dur = 1.6;
    } else {
      const atk = env === 'pad' ? 0.15 : 0.02;
      g.gain.exponentialRampToValueAtTime(v, t + atk); g.gain.setValueAtTime(v, t + Math.max(atk, dur - 0.06));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur + (env === 'pad' ? 0.25 : 0.05));
    }
    node.connect(g).connect(musBus); o.start(t); o.stop(t + dur + 0.35);
  }

  const seq = {
    track: null, parsed: null, step: 0, nextT: 0, timer: null, mult: 1, len: 0,
    play(t) {
      const track = typeof t === 'string' ? MOODS[t] : t;
      if (!track) return;
      if (this.track === track && this.timer) return; // already playing
      this.stop(true);
      this.track = track; this.mult = 1; this.step = 0;
      this.parsed = track.parts.map(p => Object.assign({}, p, parseNotes(p.notes)));
      this.len = Math.max.apply(null, this.parsed.map(p => p.len));
      this.resync();
      this.timer = setInterval(() => this.tick(), 30);
    },
    stop(quick) {
      if (this.timer) clearInterval(this.timer);
      this.timer = null; this.track = null;
      if (ac && musBus && !quick) { musBus.gain.cancelScheduledValues(ac.currentTime); musBus.gain.setValueAtTime(musBus.gain.value, ac.currentTime); musBus.gain.linearRampToValueAtTime(0.0001, ac.currentTime + 0.3); musBus.gain.linearRampToValueAtTime(0.42, ac.currentTime + 0.35); }
    },
    rate(m) { this.mult = Math.max(0.5, Math.min(2, m || 1)); },
    resync() { if (ac) this.nextT = ac.currentTime + 0.06; },
    tick() {
      if (!ac || !this.track || ac.state !== 'running') return;
      if (!enabled) { this.resync(); return; }
      if (this.nextT < ac.currentTime - 0.25) this.resync();
      const stepDur = 60 / (this.track.bpm * this.mult) / 2;
      while (this.nextT < ac.currentTime + 0.12) {
        const i = this.step % this.len;
        const sw = (this.track.swing && i % 2 === 1) ? stepDur * this.track.swing : 0;
        const t = this.nextT + sw;
        for (const p of this.parsed) {
          const li = i % p.len;
          for (const n of p.list) if (n.step === li) voice(p, n.midi, t, (n.end - n.step) * stepDur);
        }
        const dr = this.track.drums || {};
        for (const k in dr) { const pat = dr[k]; if (pat[i % pat.length] === 'x') drum(k, t, 1); }
        this.step++; this.nextT += stepDur;
      }
    },
  };

  // ---------- on/off button ----------
  const ICON_ON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const ICON_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9l6 6M22 9l-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  function button(opt) {
    opt = opt || {};
    if (document.getElementById('baSnd')) return document.getElementById('baSnd');
    const b = document.createElement('button');
    b.id = 'baSnd'; b.type = 'button';
    b.setAttribute('aria-label', 'Sound on/off');
    const css = 'display:inline-flex;align-items:center;justify-content:center;border:0;cursor:pointer;line-height:0;touch-action:manipulation;';
    const anchor = opt.anchor ? document.querySelector(opt.anchor) : null;
    if (anchor) {
      const cs = getComputedStyle(anchor);
      b.style.cssText = css + `padding:5px 9px;margin-right:6px;border-radius:${cs.borderRadius};background:${cs.backgroundColor};color:${cs.color};border-bottom:${cs.borderBottomWidth} solid ${cs.borderBottomColor};`;
      anchor.parentNode.insertBefore(b, anchor);
    } else {
      const pos = opt.pos || 'tr', [v, h] = [pos[0] === 't' ? 'top' : 'bottom', pos[1] === 'r' ? 'right' : 'left'];
      b.style.cssText = css + `position:fixed;${v}:calc(env(safe-area-inset-${v}) + 8px);${h}:calc(env(safe-area-inset-${h}) + 8px);z-index:9999;width:34px;height:34px;border-radius:50%;background:rgba(0,0,0,.55);color:#e6e6e6;border:1px solid rgba(255,255,255,.25);`;
      document.body.appendChild(b);
    }
    const paint = () => { b.innerHTML = enabled ? ICON_ON : ICON_OFF; b.firstChild.style.cssText = 'width:15px;height:15px;fill:currentColor'; b.style.opacity = enabled ? '1' : '.55'; };
    paint(); listeners.push(paint);
    const toggle = e => { e.preventDefault(); e.stopPropagation(); unlock(); setEnabled(!enabled); if (enabled) play('click'); };
    b.addEventListener('click', toggle);
    b.addEventListener('touchend', e => { toggle(e); }, { passive: false });
    b.addEventListener('touchstart', e => e.stopPropagation(), { passive: true });
    b.addEventListener('pointerdown', e => e.stopPropagation());
    return b;
  }
  // keyboard shortcut: M toggles sound everywhere (ignored while typing)
  document.addEventListener('keydown', e => {
    if ((e.key === 'm' || e.key === 'M') && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const tag = (e.target && e.target.tagName) || '';
      if (/INPUT|TEXTAREA|SELECT/.test(tag) || (e.target && e.target.isContentEditable)) return;
      if (window.BASound_noMKey) return;
      setEnabled(!enabled);
    }
  });

  // ---------- watcher: drive sound from a game's state, no changes to game logic ----------
  // BASound.watch({
  //   state: () => S,                         // current state object (a new object = a new game)
  //   mood: 'spooky',                         // music while playing(s) is true
  //   playing: s => s && !s.paused && !s.over,
  //   rate: s => 1 + s.wave * 0.02,           // optional tempo multiplier
  //   on: { 'score+': 'coin', 'liv-': 'lifeLost', 'over!': 'gameover', 'shots#+': 'shoot',
  //         'kol~': 'step', 'perk!': 'powerup' },  // + up, - down, ! becomes truthy, ~ any change, # array length
  //   every: (s, dt, prev) => {}              // optional custom per-frame hook
  // })
  // A value can be a sound name, [name, {pitch, vol}], or a function (s, delta) => void.
  function watch(cfg) {
    let obj, prev = {}, lastPlay = {}, lastT = 0;
    const rules = Object.keys(cfg.on || {}).map(k => {
      const m = /^(.*?)(#?)([+\-!~])$/.exec(k);
      return { key: k, path: m[1], len: !!m[2], op: m[3], act: cfg.on[k] };
    });
    const get = (s, r) => {
      let v = s;
      for (const part of r.path.split('.')) { if (v == null) return undefined; v = v[part]; }
      return r.len ? (v && v.length != null ? v.length : 0) : v;
    };
    const fire = (r, s, d) => {
      const a = r.act, now = performance.now();
      if (typeof a === 'function') { try { a(s, d); } catch (e) {} return; }
      const [name, o] = Array.isArray(a) ? a : [a, null];
      if (lastPlay[name] && now - lastPlay[name] < 45) return;
      lastPlay[name] = now; play(name, o);
    };
    function loop(t) {
      requestAnimationFrame(loop);
      let s; try { s = cfg.state(); } catch (e) { s = null; }
      const dt = lastT ? Math.min(0.1, (t - lastT) / 1000) : 0; lastT = t;
      if (s !== obj || !s) { obj = s; prev = {}; if (s) rules.forEach(r => { prev[r.key] = get(s, r); }); }
      else {
        for (const r of rules) {
          const v = get(s, r), p = prev[r.key];
          if (r.op === '+' && typeof v === 'number' && typeof p === 'number' && v > p) fire(r, s, v - p);
          else if (r.op === '-' && typeof v === 'number' && typeof p === 'number' && v < p) fire(r, s, p - v);
          else if (r.op === '!' && v && !p) fire(r, s, 1);
          else if (r.op === '~' && v !== p && p !== undefined) fire(r, s, v);
          prev[r.key] = v;
        }
        if (cfg.every) { try { cfg.every(s, dt); } catch (e) {} }
      }
      let on = false; try { on = !!(s && (cfg.playing ? cfg.playing(s) : true)); } catch (e) {}
      if (on && cfg.mood) { seq.play(cfg.mood); if (cfg.rate) { try { seq.rate(cfg.rate(s)); } catch (e) {} } }
      else if (seq.track && seq.owner === cfg) seq.stop();
      if (on) seq.owner = cfg;
    }
    requestAnimationFrame(loop);
  }

  window.BASound = {
    watch,
    play, tone, noise, SFX, MOODS, mood,
    music: { play: t => seq.play(t), stop: q => seq.stop(q), rate: m => seq.rate(m), get playing() { return !!seq.track; } },
    enabled: () => enabled, setEnabled, toggle: () => setEnabled(!enabled), onChange: fn => listeners.push(fn),
    button, unlock,
  };

  // auto-place the button once the page is ready
  const me = document.currentScript, mode = (me && me.dataset.button) || 'auto';
  if (mode !== 'none') {
    const place = () => {
      const anchor = me && me.dataset.anchor;
      if (anchor && document.querySelector(anchor)) button({ anchor });
      else if (mode === 'auto') button(document.getElementById('btnMeny') ? { anchor: '#btnMeny' } : { pos: 'tr' });
      else button({ pos: mode });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', place); else place();
  }
})();
