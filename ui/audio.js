// ui/audio.js
// Shared audio system for all Bus Adventures games.
// Silently does nothing if audio files are missing or browser blocks autoplay.
//
// Usage:
//   import { initAudio, playBg, stopBg, playSfx, setEnabled, isEnabled } from "../../ui/audio.js";
//
// In shell.js: call initAudio() once.
// In rooms.js: add optional { music: "filename" } field (no path, no extension).
// In effects:  add optional { playSound: "filename" } field.

"use strict";

const STORAGE_KEY = "busadv_audio";

let _enabled = true;
let _bgAudio  = null;
let _bgSrc    = null;
let _basePath  = "";

// ── Init ──────────────────────────────────────────────────────────

export function initAudio(basePath = "assets/audio/") {
  _basePath = basePath;

  // Load preference from localStorage
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) _enabled = saved === "true";
  } catch {}
}

// ── Enable / disable ──────────────────────────────────────────────

export function isEnabled() { return _enabled; }

export function setEnabled(val) {
  _enabled = !!val;
  try { localStorage.setItem(STORAGE_KEY, String(_enabled)); } catch {}

  if (!_enabled) {
    _fadeOut(_bgAudio);
  } else if (_bgSrc) {
    _startBg(_bgSrc);
  }
}

// ── Background music ──────────────────────────────────────────────

export function playBg(filename) {
  if (!filename) return;
  const src = _basePath + filename + ".mp3";
  if (src === _bgSrc && _bgAudio && !_bgAudio.paused) return; // already playing
  _bgSrc = src;
  if (!_enabled) return;
  _fadeOut(_bgAudio);
  _startBg(src);
}

export function stopBg() {
  _bgSrc = null;
  _fadeOut(_bgAudio);
  _bgAudio = null;
}

function _startBg(src) {
  try {
    const audio = new Audio();
    audio.loop   = true;
    audio.volume = 0;
    audio.src    = src;

    // Silently ignore missing files
    audio.addEventListener("error", () => {}, { once: true });

    const play = audio.play();
    if (play) {
      play.then(() => {
        _bgAudio = audio;
        _fadeIn(audio, 0.35);
      }).catch(() => {
        // Autoplay blocked or file missing — silently ignore
      });
    }
  } catch {}
}

// ── Sound effects ─────────────────────────────────────────────────

export function playSfx(filename) {
  if (!filename || !_enabled) return;
  try {
    const audio = new Audio(_basePath + filename + ".mp3");
    audio.volume = 0.7;
    audio.addEventListener("error", () => {}, { once: true });
    const play = audio.play();
    if (play) play.catch(() => {});
  } catch {}
}

// ── Fade helpers ──────────────────────────────────────────────────

function _fadeIn(audio, targetVol = 0.35, ms = 1500) {
  if (!audio) return;
  const steps  = 30;
  const delta  = targetVol / steps;
  const delay  = ms / steps;
  let step = 0;
  const id = setInterval(() => {
    step++;
    try { audio.volume = Math.min(targetVol, audio.volume + delta); } catch {}
    if (step >= steps) clearInterval(id);
  }, delay);
}

function _fadeOut(audio, ms = 800) {
  if (!audio) return;
  const startVol = audio.volume;
  const steps    = 20;
  const delta    = startVol / steps;
  const delay    = ms / steps;
  let step = 0;
  const id = setInterval(() => {
    step++;
    try {
      audio.volume = Math.max(0, audio.volume - delta);
      if (step >= steps) {
        audio.pause();
        clearInterval(id);
      }
    } catch {
      clearInterval(id);
    }
  }, delay);
}
