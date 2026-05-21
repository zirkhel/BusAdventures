// games/template/assets.js
// Replace all placeholder content with your game's visuals.
//
// Room media: each key matches a room id in game.js (plus "__intro__")
// Item icons: each key matches an item id in game.js
//
// media type can be:
//   "svg"   — inline SVG string (no external file needed)
//   "img"   — path to image file, e.g. "assets/rooms/start.jpg"
//   "video" — path to video file, e.g. "assets/rooms/start.mp4"
//
// fx can be: "mist" | "flicker" | null

"use strict";

export const ROOM_MEDIA = {

  __intro__: {
    type: "svg",
    fx: "mist",
    src: `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
      <rect width="1280" height="720" fill="#111"/>
      <text x="640" y="380" text-anchor="middle"
        font-size="64" font-family="serif" fill="#555">
        YOUR GAME
      </text>
    </svg>`,
  },

  // One entry per room id in game.js
  start: {
    type: "svg",
    fx: null,
    src: `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
      <rect width="1280" height="720" fill="#181818"/>
      <text x="640" y="380" text-anchor="middle"
        font-size="40" font-family="serif" fill="#444">
        Starting Room
      </text>
    </svg>`,
  },

  // Example: image file
  // forest: {
  //   type: "img",
  //   fx: "mist",
  //   src: "assets/rooms/forest.jpg",
  // },

  // Example: video
  // fire_room: {
  //   type: "video",
  //   fx: null,
  //   src: "assets/rooms/fire.mp4",
  // },

};

// 64x64 SVG icons for inventory items.
// Key matches item id in game.js.
export const ITEM_ICONS = {

  // example_item: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  //   <circle cx="32" cy="32" r="24" fill="#555"/>
  //   <text x="32" y="38" text-anchor="middle" font-size="20" fill="#ccc">?</text>
  // </svg>`,

};

// Fallback icon shown when item has no entry above
const FALLBACK_ICON = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect x="8" y="8" width="48" height="48" rx="8" fill="#2a2a2a" stroke="#555" stroke-width="2"/>
  <text x="32" y="40" text-anchor="middle" font-size="28" fill="#666">?</text>
</svg>`;

// Called by renderer for each room transition
export function getMedia(roomId, state) {
  return ROOM_MEDIA[roomId] || ROOM_MEDIA["__intro__"];
}

// Called by renderer for each inventory item
export function getItemIcon(itemId) {
  return ITEM_ICONS[itemId] || FALLBACK_ICON;
}
