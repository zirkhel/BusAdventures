// assets.js — media keys → images, and item icons.
//
// Every "media" key used in rooms.js (room media, states, mediaStates,
// deathMedia, winMedia) needs an entry here. Until the PNG exists, a labelled
// placeholder is shown so you can see which key a room is asking for.
// Special keys: __intro__ (intro screen), __death__ and __win__ (end screens).
"use strict";

const ROOM_MEDIA = {
  __intro__:       img("rooms/lobby.png",            "mist"),
  __death__:       img("screens/death.png",          null),
  __win__:         img("screens/win.png",            null),

  lobby:           img("rooms/lobby.png",            "flicker"),
  lobby_empty:     img("rooms/lobby_empty.png",      "flicker"),   // torch taken
  hallway:         img("rooms/hallway.png",          null),
  hallway_open:    img("rooms/hallway_open.png",     null),        // state: unlocked
  storeroom:       img("rooms/storeroom.png",        "mist"),
  death_storeroom: img("screens/death_storeroom.png", null),
  outside:         img("rooms/outside.png",          null),
};

// fx: "mist" | "flicker" | null — scene effect from ui/style.css
function img(path, fx) {
  return { type: "img", src: "assets/" + path, fx };
}

export function getMedia(mediaKey) {
  const entry = ROOM_MEDIA[mediaKey];
  // Unknown key: show its name instead of silently reusing another image.
  // (tools/validate-adventure.mjs reports these as errors.)
  if (!entry) return { type: "svg", src: placeholder(mediaKey + " — not in assets.js"), fx: null, missing: true };
  return { ...entry, svgFallback: placeholder(mediaKey) };
}

function placeholder(label) {
  return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
    <rect width="1280" height="720" fill="#0b0d12"/>
    <rect x="40" y="40" width="1200" height="640" fill="none" stroke="#22283a" stroke-width="4" stroke-dasharray="16 12"/>
    <text x="640" y="372" text-anchor="middle" font-size="40" font-family="monospace" fill="#3c4560">${label}</text>
  </svg>`;
}

// ── Item icons: assets/items/<itemId>.png, SVG fallback below ───────────────

const ITEM_SVG = {
  // my_item: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">...</svg>`,
};

const FALLBACK_ICON = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="10" width="44" height="44" rx="8" fill="#1e2230" stroke="#4a5060" stroke-width="2"/>
  <text x="32" y="40" text-anchor="middle" font-size="28" fill="#505a6a">?</text>
</svg>`;

export function getItemIcon(itemId) {
  const svg = ITEM_SVG[itemId] || FALLBACK_ICON;
  return `<img src="assets/items/${itemId}.png"
    style="width:100%;height:100%;object-fit:contain"
    onerror="this.outerHTML=this.dataset.fb"
    data-fb="${svg.replace(/"/g, "&quot;")}"
    alt="">`;
}
