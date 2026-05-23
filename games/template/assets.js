// assets.js — Media and icon lookups for your game
// Add your room image keys and item SVG fallbacks here.
"use strict";

// ── Room images ───────────────────────────────────────────────────
// Keys must match the "media" field in rooms.js
// Files live in assets/rooms/{key}.png
// SVG is shown if the PNG is missing

const ROOM_MEDIA = {
  __intro__: { file: "assets/rooms/start.png", fx: null },
  start:     { file: "assets/rooms/start.png", fx: null },
  // Add more rooms here:
  // room_id: { file: "assets/rooms/room_id.png", fx: "mist" },
};

export function getMedia(mediaKey, state, roomState) {
  const entry = ROOM_MEDIA[mediaKey] || ROOM_MEDIA["__intro__"];
  if (!entry) return null;
  return {
    type:   "image",
    src:    entry.file,
    fx:     entry.fx || null,
    svgFallback: `<svg viewBox="0 0 160 90" xmlns="http://www.w3.org/2000/svg">
      <rect width="160" height="90" fill="#08090d"/>
      <text x="80" y="48" font-size="10" fill="#2a2e40" font-family="monospace" text-anchor="middle">${mediaKey}</text>
    </svg>`,
  };
}

// ── Item icons ────────────────────────────────────────────────────
// Files live in assets/items/{itemId}.png
// SVG is shown if the PNG is missing

const ITEM_SVG = {
  // Add SVG fallbacks here if desired, keyed by item ID:
  // my_item: `<svg viewBox="0 0 64 64" ...>...</svg>`,
};

const FALLBACK_ICON = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect x="8" y="8" width="48" height="48" rx="6" fill="#1a1c24" stroke="#3a3e50" stroke-width="2"/>
  <text x="32" y="38" font-size="20" fill="#3a3e50" font-family="monospace" text-anchor="middle">?</text>
</svg>`;

export function getItemIcon(itemId) {
  const svg = ITEM_SVG[itemId] || FALLBACK_ICON;
  const enc = encodeURIComponent(svg);
  return '<img src="assets/items/' + itemId + '.png" '
    + 'style="width:100%;height:100%;object-fit:contain" '
    + 'onerror="this.outerHTML=decodeURIComponent(\'' + enc + '\')">';
}
