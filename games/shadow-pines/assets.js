// games/shadow-pines/assets.js
// Media resolver and item icons for Shadow Over Iron Pines.
// SVG fallbacks are used until real images are added.

"use strict";

const ROOM_MEDIA = {
  __intro__:                   img("intro",                       "mist",    SVG_OUTER_WALL()),
  outer_wall:                  img("outer_wall",                  "mist",    SVG_OUTER_WALL()),
  courtyard_default:           img("courtyard_default",           "mist",    SVG_COURTYARD()),
  courtyard_alerted:           img("courtyard_alerted",           "flicker", SVG_COURTYARD_ALERTED()),
  courtyard_smoke:             img("courtyard_smoke",             "mist",    SVG_COURTYARD_SMOKE()),
  watch_tower:                 img("watch_tower",                 "flicker", SVG_WATCH_TOWER()),
  watch_tower_empty:           img("watch_tower_empty",           "flicker", SVG_WATCH_TOWER()),
  main_hall:                   img("main_hall",                   "mist",    SVG_MAIN_HALL()),
  archive_default:             img("archive_default",             "flicker", SVG_ARCHIVE()),
  archive_alarm:               img("archive_alarm",               "flicker", SVG_ARCHIVE_ALARM()),
  tea_room:                    img("tea_room",                    null,      SVG_TEA_ROOM()),
  tea_room_opened:             img("tea_room_opened",             null,      SVG_TEA_ROOM()),
  servant_corridor:            img("servant_corridor",            "mist",    SVG_CORRIDOR()),
  storage_cellar:              img("storage_cellar",              null,      SVG_CELLAR()),
  storage_cellar_empty_rack:   img("storage_cellar_empty_rack",   null,      SVG_CELLAR()),
  escape_tunnel:               img("escape_tunnel",               "mist",    SVG_TUNNEL()),
  escape_tunnel_open:          img("escape_tunnel_open",          "mist",    SVG_TUNNEL_OPEN()),
  roof_path:                   img("roof_path",                   "mist",    SVG_ROOF()),
};

function img(key, fx, svgFallback) {
  return { type: "img", src: `assets/rooms/${key}.png`, fx, svgFallback };
}

export function getMedia(mediaKey, state, roomStateName) {
  return ROOM_MEDIA[mediaKey] || ROOM_MEDIA["__intro__"];
}

export function getItemIcon(itemId) {
  const svg = ITEM_SVG[itemId] || FALLBACK_ICON;
  return `<img src="assets/items/${itemId}.png"
    style="width:100%;height:100%;object-fit:contain"
    onerror="this.outerHTML=this.dataset.fb"
    data-fb="${svg.replace(/"/g, '&quot;')}"
    alt="">`;
}

const ITEM_SVG = {
  cloth_mask: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 30c0-12 40-12 40 0v10c0 8-8 13-20 13S12 48 12 40z" fill="#c8b89a" stroke="#6a5a3a" stroke-width="3"/>
    <path d="M18 30c0 0 14-6 28 0" fill="none" stroke="#9a8a6a" stroke-width="2"/>
    <line x1="12" y1="32" x2="4" y2="28" stroke="#8a7a5a" stroke-width="3"/>
    <line x1="52" y1="32" x2="60" y2="28" stroke="#8a7a5a" stroke-width="3"/>
  </svg>`,

  climbing_claws: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 50 L28 20 L36 22 L30 50z" fill="#6a6a6a" stroke="#3a3a3a" stroke-width="2"/>
    <path d="M14 46 Q10 30 18 14" fill="none" stroke="#5a5a5a" stroke-width="4" stroke-linecap="round"/>
    <path d="M22 46 Q18 30 26 14" fill="none" stroke="#5a5a5a" stroke-width="4" stroke-linecap="round"/>
    <path d="M30 46 Q26 30 34 14" fill="none" stroke="#5a5a5a" stroke-width="4" stroke-linecap="round"/>
    <rect x="12" y="44" width="30" height="10" rx="4" fill="#4a3a2a" stroke="#2a1a0a" stroke-width="2"/>
  </svg>`,

  smoke_bomb: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="32" cy="38" rx="18" ry="16" fill="#2a2a2a" stroke="#1a1a1a" stroke-width="3"/>
    <rect x="26" y="20" width="12" height="10" rx="3" fill="#3a3a3a" stroke="#1a1a1a" stroke-width="2"/>
    <path d="M30 10 Q28 6 32 4 Q36 6 34 10" fill="none" stroke="#8a8a6a" stroke-width="3"/>
    <circle cx="32" cy="38" r="6" fill="#1a1a1a"/>
  </svg>`,

  shuriken: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 8 L38 28 L56 32 L38 36 L32 56 L26 36 L8 32 L26 28z" fill="#8a8a8a" stroke="#4a4a4a" stroke-width="2"/>
    <circle cx="32" cy="32" r="5" fill="#4a4a4a"/>
    <path d="M32 8 L38 28 L56 32 L38 36 L32 56 L26 36 L8 32 L26 28z" fill="none" stroke="#c0c0c0" stroke-width="1" opacity=".4"/>
  </svg>`,

  oil_lantern: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <rect x="22" y="24" width="20" height="26" rx="4" fill="#c8a050" stroke="#6a4a10" stroke-width="3"/>
    <rect x="26" y="16" width="12" height="10" rx="2" fill="#a08030" stroke="#6a4a10" stroke-width="2"/>
    <circle cx="32" cy="14" r="4" fill="#606060" stroke="#3a3a3a" stroke-width="2"/>
    <ellipse cx="32" cy="36" rx="7" ry="9" fill="#f0c830" opacity=".6"/>
    <line x1="10" y1="14" x2="54" y2="14" stroke="#606060" stroke-width="3"/>
    <line x1="32" y1="50" x2="32" y2="56" stroke="#6a4a10" stroke-width="3"/>
    <ellipse cx="32" cy="56" rx="8" ry="3" fill="#4a3010" opacity=".7"/>
  </svg>`,

  sealed_scroll: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <rect x="14" y="20" width="36" height="28" rx="3" fill="#d4b87a" stroke="#6a4a10" stroke-width="3"/>
    <ellipse cx="14" cy="34" rx="6" ry="14" fill="#b89050" stroke="#6a4a10" stroke-width="2"/>
    <ellipse cx="50" cy="34" rx="6" ry="14" fill="#b89050" stroke="#6a4a10" stroke-width="2"/>
    <rect x="24" y="30" width="16" height="8" rx="3" fill="#8a2020" stroke="#4a0a0a" stroke-width="2"/>
    <line x1="20" y1="28" x2="44" y2="28" stroke="#9a7030" stroke-width="1.5" opacity=".5"/>
    <line x1="20" y1="34" x2="44" y2="34" stroke="#9a7030" stroke-width="1.5" opacity=".5"/>
    <line x1="20" y1="40" x2="44" y2="40" stroke="#9a7030" stroke-width="1.5" opacity=".5"/>
  </svg>`,
};

const FALLBACK_ICON = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="10" width="44" height="44" rx="8" fill="#1e2230" stroke="#4a5060" stroke-width="2"/>
  <text x="32" y="40" text-anchor="middle" font-size="28" fill="#505a6a">?</text>
</svg>`;

// ── SVG fallbacks ─────────────────────────────────────────────────
function SVG_OUTER_WALL() { return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><rect width="1280" height="720" fill="#080c10"/><rect y="500" width="1280" height="220" fill="#0a0e08"/><g fill="#0e1218" stroke="#2a3040" stroke-width="8"><rect x="0" y="80" width="180" height="640"/><rect x="1100" y="80" width="180" height="640"/><rect x="160" y="80" width="960" height="420"/></g><g fill="#060a0e" stroke="#1a2030" stroke-width="4"><rect x="220" y="140" width="80" height="120"/><rect x="360" y="180" width="60" height="90"/><rect x="900" y="160" width="70" height="100"/></g><circle cx="640" cy="80" r="40" fill="#c8d0b0" opacity=".08"/></svg>`; }
function SVG_COURTYARD() { return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><rect width="1280" height="720" fill="#080a0c"/><rect y="520" width="1280" height="200" fill="#0a0c08"/><path d="M200 100h880L960 630H320z" fill="#0e1218" stroke="#2a3040" stroke-width="6"/><circle cx="400" cy="300" r="20" fill="#d4a030" opacity=".4"/><circle cx="880" cy="280" r="20" fill="#d4a030" opacity=".4"/><circle cx="640" cy="200" r="20" fill="#d4a030" opacity=".4"/></svg>`; }
function SVG_COURTYARD_ALERTED() { return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><rect width="1280" height="720" fill="#100808"/><rect y="520" width="1280" height="200" fill="#0c0a08"/><path d="M200 100h880L960 630H320z" fill="#180e0a" stroke="#503020" stroke-width="6"/><circle cx="400" cy="300" r="30" fill="#e06020" opacity=".6"/><circle cx="880" cy="280" r="30" fill="#e06020" opacity=".6"/><circle cx="640" cy="200" r="30" fill="#e06020" opacity=".6"/></svg>`; }
function SVG_COURTYARD_SMOKE() { return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><rect width="1280" height="720" fill="#0a0c10"/><rect y="520" width="1280" height="200" fill="#0c0e0a"/><path d="M200 100h880L960 630H320z" fill="#141820" stroke="#303848" stroke-width="6"/><ellipse cx="640" cy="500" rx="500" ry="150" fill="#c0c8d0" opacity=".12"/><ellipse cx="300" cy="560" rx="300" ry="100" fill="#c0c8d0" opacity=".1"/></svg>`; }
function SVG_WATCH_TOWER() { return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><rect width="1280" height="720" fill="#090b10"/><rect x="300" y="80" width="680" height="560" fill="#0e1220" stroke="#2a3044" stroke-width="8"/><rect x="400" y="140" width="480" height="280" fill="#060810"/><g stroke="#3a4050" stroke-width="4" fill="none"><line x1="400" y1="140" x2="880" y2="420"/><line x1="880" y1="140" x2="400" y2="420"/></g><circle cx="640" cy="560" r="30" fill="#d4900a" opacity=".3"/></svg>`; }
function SVG_MAIN_HALL() { return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><rect width="1280" height="720" fill="#0a0c10"/><path d="M160 80h960v560H160z" fill="#101420" stroke="#303848" stroke-width="6"/><g fill="#080c18" stroke="#202840" stroke-width="4"><rect x="200" y="120" width="160" height="440"/><rect x="920" y="120" width="160" height="440"/></g><ellipse cx="640" cy="360" rx="300" ry="200" fill="#c0a040" opacity=".06"/><path d="M160 80h960" stroke="#404858" stroke-width="10"/></svg>`; }
function SVG_ARCHIVE() { return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><rect width="1280" height="720" fill="#080a0e"/><g fill="#0e1018" stroke="#282c38" stroke-width="5"><rect x="100" y="100" width="200" height="520"/><rect x="340" y="100" width="200" height="520"/><rect x="580" y="100" width="200" height="520"/><rect x="820" y="100" width="200" height="520"/><rect x="1060" y="100" width="120" height="520"/></g><g fill="#1a1810" stroke="#3a3418" stroke-width="2" opacity=".6"><rect x="110" y="120" width="180" height="12"/><rect x="110" y="148" width="180" height="12"/><rect x="110" y="176" width="180" height="12"/></g><circle cx="900" cy="580" r="40" fill="#d4b030" opacity=".15"/></svg>`; }
function SVG_ARCHIVE_ALARM() { return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><rect width="1280" height="720" fill="#0c0808"/><g fill="#140e0a" stroke="#382010" stroke-width="5"><rect x="100" y="100" width="200" height="520"/><rect x="340" y="100" width="200" height="520"/><rect x="580" y="100" width="200" height="520"/><rect x="820" y="100" width="200" height="520"/><rect x="1060" y="100" width="120" height="520"/></g><rect x="400" y="0" width="480" height="60" fill="#1a0808" opacity=".8"/><circle cx="640" cy="100" r="80" fill="#c03020" opacity=".2"/></svg>`; }
function SVG_TEA_ROOM() { return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><rect width="1280" height="720" fill="#0c0e0a"/><rect x="100" y="100" width="1080" height="520" fill="#141810" stroke="#303828" stroke-width="6"/><rect x="300" y="500" width="680" height="20" rx="4" fill="#1e2418"/><rect x="500" y="380" width="280" height="140" rx="8" fill="#0e1008" stroke="#282e18" stroke-width="4"/><ellipse cx="640" cy="350" rx="60" ry="40" fill="#8a7040" opacity=".2"/></svg>`; }
function SVG_CORRIDOR() { return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><rect width="1280" height="720" fill="#090a0c"/><path d="M180 80h920L980 660H300z" fill="#0e1018" stroke="#282e38" stroke-width="6"/><path d="M520 100h240L700 650H580z" fill="#050608"/><circle cx="640" cy="200" r="36" fill="#c09030" opacity=".2"/></svg>`; }
function SVG_CELLAR() { return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><rect width="1280" height="720" fill="#070808"/><rect y="480" width="1280" height="240" fill="#090c08"/><g fill="#0d1010" stroke="#1e2820" stroke-width="5"><rect x="100" y="100" width="300" height="380"/><rect x="450" y="100" width="300" height="380"/><rect x="800" y="100" width="380" height="380"/></g><g fill="#1a1810" stroke="#302810" stroke-width="2" opacity=".5"><rect x="120" y="140" width="260" height="14"/><rect x="120" y="168" width="260" height="14"/><rect x="120" y="196" width="260" height="14"/></g></svg>`; }
function SVG_TUNNEL() { return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><rect width="1280" height="720" fill="#060708"/><path d="M200 80 Q640 20 1080 80L1080 660 Q640 720 200 660z" fill="#0c0e14" stroke="#202838" stroke-width="8"/><ellipse cx="640" cy="380" rx="200" ry="280" fill="#040508"/><path d="M0 400h1280" stroke="#1a1e28" stroke-width="3" opacity=".5"/></svg>`; }
function SVG_TUNNEL_OPEN() { return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><rect width="1280" height="720" fill="#060708"/><path d="M200 80 Q640 20 1080 80L1080 660 Q640 720 200 660z" fill="#0c0e14" stroke="#202838" stroke-width="8"/><ellipse cx="640" cy="200" rx="200" ry="150" fill="#1a2830" opacity=".8"/><circle cx="640" cy="200" r="80" fill="#b0c8e0" opacity=".15"/></svg>`; }
function SVG_ROOF() { return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><rect width="1280" height="720" fill="#080a0e"/><path d="M0 300 Q640 200 1280 300L1280 720H0z" fill="#0e1018" stroke="#282e38" stroke-width="6"/><g stroke="#1e2430" stroke-width="3" fill="none"><line x1="0" y1="320" x2="1280" y2="320"/><line x1="0" y1="380" x2="1280" y2="380"/><line x1="0" y1="440" x2="1280" y2="440"/></g><circle cx="200" cy="200" r="60" fill="#c0c8b0" opacity=".06"/><circle cx="1100" cy="180" r="40" fill="#c0c8b0" opacity=".04"/></svg>`; }
