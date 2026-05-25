// games/ward-b/assets.js
// Media resolver and item icons.
//
// Image files go in assets/rooms/ and assets/items/
// SVG fallbacks are used when image files are not present.
//
// mediaKey → { type, src, fx }
// type: "img" | "svg" | "video"

"use strict";

// ── Room media ────────────────────────────────────────────────────
// Add your image files to assets/rooms/ matching these keys.
// SVG fallbacks are shown until real images are added.

const ROOM_MEDIA = {

  __intro__: img("reception", "mist", SVG_RECEPTION()),
  __death__:        { type: "img", src: "assets/screens/death.png",          fx: null, svgFallback: SVG_DEATH_BASEMENT() },
  death_basement:   { type: "img", src: "assets/screens/death_basement.png",  fx: null, svgFallback: SVG_DEATH_BASEMENT() },
  death_stairwell:  { type: "img", src: "assets/screens/death_stairwell.png", fx: "mist", svgFallback: SVG_STAIRWELL() },
  __win__:   { type: "img", src: "assets/screens/win.png",   fx: null, svgFallback: SVG_OUTSIDE() },
  reception: img("reception", "mist", SVG_RECEPTION()),
  reception_empty: img("reception_empty", "mist", SVG_RECEPTION()),  // keycard taken
  corridor:  img("corridor", "flicker", SVG_CORRIDOR()),
  records:   img("records", "mist", SVG_RECORDS()),
  pharmacy:  img("pharmacy", null, SVG_PHARMACY()),
  surgery:   img("surgery", "flicker", SVG_SURGERY()),
  surgery_sedated: img("surgery_sedated", null, SVG_SURGERY_SEDATED()),
  observation: img("observation", null, SVG_OBSERVATION()),
  courtyard: img("courtyard", "mist", SVG_COURTYARD()),
  escape_gate: img("escape_gate", null, SVG_ESCAPE_GATE()),
  escape_gate_open: img("escape_gate_open", null, SVG_ESCAPE_GATE_OPEN()),
  outside:   img("outside", null, SVG_OUTSIDE()),
  stairwell: img("stairwell", "mist", SVG_STAIRWELL()),
  basement:  img("basement", "mist", SVG_BASEMENT()),
  "death-basement": img("death-basement", "mist", SVG_DEATH_BASEMENT()),

};

// Helper: try image file first, fall back to inline SVG
function img(key, fx, svgFallback) {
  return {
    type: "img",
    src: `assets/rooms/${key}.png`,
    fx,
    svgFallback,
  };
}

// ── Media resolver ────────────────────────────────────────────────
// Called by renderer with the resolved media key (from engine.resolveMediaKey)

export function getMedia(mediaKey, state, roomStateName) {
  return ROOM_MEDIA[mediaKey] || ROOM_MEDIA["__intro__"];
}

// ── Item icons ────────────────────────────────────────────────────

export function getItemIcon(itemId) {
  const svg = ITEM_SVG[itemId] || FALLBACK_ICON;
  return `<img src="assets/items/${itemId}.png"
    style="width:100%;height:100%;object-fit:contain"
    onerror="this.outerHTML=this.dataset.fb"
    data-fb="${svg.replace(/"/g, '&quot;')}"
    alt="">`;
}


const ITEM_SVG = {
  keycard: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="20" width="48" height="28" rx="5" fill="#aaa898" stroke="#4a4850" stroke-width="3"/>
    <path d="M16 30h22M16 38h14" stroke="#5a2a2a" stroke-width="4" stroke-linecap="round"/>
    <circle cx="46" cy="34" r="5" fill="#7a2828"/>
    <text x="18" y="36" font-size="9" fill="#4a4440" font-family="monospace">WARD B</text>
  </svg>`,
  mask: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 32c0-14 40-14 40 0v10c0 9-8 14-20 14S12 51 12 42z" fill="#6a6e76" stroke="#d0c8b8" stroke-width="3"/>
    <circle cx="24" cy="36" r="5" fill="#080c10"/>
    <circle cx="40" cy="36" r="5" fill="#080c10"/>
    <ellipse cx="32" cy="46" rx="10" ry="3" fill="#242830" opacity=".5"/>
  </svg>`,
  sedative: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <rect x="16" y="22" width="32" height="26" rx="6" fill="#d4be88" stroke="#4a3e28" stroke-width="3"/>
    <rect x="22" y="16" width="20" height="10" rx="3" fill="#c0aa70" stroke="#4a3e28" stroke-width="2"/>
    <path d="M32 22v26M19 35h26" stroke="#8a3a34" stroke-width="4" stroke-linecap="round"/>
  </svg>`,
  crowbar: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <path d="M48 10 Q54 10 54 16 L54 20 Q54 24 50 24 L18 52 Q14 56 10 54 Q8 50 12 46 L40 14 Q44 10 48 10Z" fill="#6a6a6a" stroke="#3a3a3a" stroke-width="2"/>
    <path d="M46 12 L52 18" stroke="#9a9a9a" stroke-width="2"/>
  </svg>`,
};

const FALLBACK_ICON = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="10" width="44" height="44" rx="8" fill="#1e2230" stroke="#4a5060" stroke-width="2"/>
  <text x="32" y="40" text-anchor="middle" font-size="28" fill="#505a6a">?</text>
</svg>`;

// ── SVG fallbacks ─────────────────────────────────────────────────
// Used until real images are added. Delete once you have real art.

function SVG_INTRO() { return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><defs><radialGradient id="rg" cx="50%" cy="50%" r="60%"><stop offset="0%" stop-color="#1c2230"/><stop offset="100%" stop-color="#030407"/></radialGradient></defs><rect width="1280" height="720" fill="url(#rg)"/><rect x="140" y="100" width="1000" height="480" rx="14" fill="#0f1219" stroke="#3a404f" stroke-width="6"/><circle cx="640" cy="350" r="100" fill="#080a0f" stroke="#6b2828" stroke-width="10"/><text x="640" y="370" text-anchor="middle" fill="#b33a3a" font-size="48" font-family="Georgia,serif" letter-spacing="8">WARD B</text></svg>`; }
function SVG_RECEPTION() { return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><rect width="1280" height="720" fill="#10131b"/><rect x="0" y="560" width="1280" height="160" fill="#090a0d"/><rect x="120" y="310" width="1040" height="210" rx="10" fill="#231e1c" stroke="#4a3c34" stroke-width="5"/><rect x="760" y="140" width="230" height="140" fill="#040508" stroke="#40475a" stroke-width="8"/><text x="165" y="260" fill="#505a6a" font-size="52" font-family="Georgia,serif">RECEPTION</text></svg>`; }
function SVG_CORRIDOR() { return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><rect width="1280" height="720" fill="#0b0d14"/><path d="M170 70h940L930 670H350z" fill="#14182a" stroke="#383c4e" stroke-width="6"/><path d="M505 110h270l35 540H470z" fill="#060709"/><circle cx="640" cy="185" r="42" fill="#b88040" opacity=".5" class="glow"/></svg>`; }
function SVG_RECORDS() { return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><rect width="1280" height="720" fill="#111420"/><g stroke="#424a5c" stroke-width="6" fill="#1e2230"><rect x="125" y="175" width="265" height="365"/><rect x="440" y="135" width="255" height="415"/><rect x="745" y="185" width="335" height="355"/></g><circle cx="320" cy="560" r="58" fill="#d4b86a" opacity=".3"/></svg>`; }
function SVG_PHARMACY() { return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><rect width="1280" height="720" fill="#10131a"/><rect x="145" y="110" width="990" height="460" fill="#181d2b" stroke="#464e64" stroke-width="7"/><g fill="#080b10" stroke="#2e3545" stroke-width="4"><rect x="205" y="165" width="195" height="315"/><rect x="430" y="165" width="195" height="315"/><rect x="655" y="165" width="195" height="315"/><rect x="880" y="165" width="195" height="315"/></g><rect x="548" y="335" width="98" height="52" rx="10" fill="#d4c08a" stroke="#6b5a30" stroke-width="4"/></svg>`; }
function SVG_SURGERY() { return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><rect width="1280" height="720" fill="#0b0c11"/><ellipse cx="640" cy="580" rx="440" ry="95" fill="#060709"/><rect x="350" y="410" width="580" height="72" rx="22" fill="#1e2430" stroke="#5e6578" stroke-width="6"/><circle cx="640" cy="165" r="92" fill="#d8c07a" opacity=".22" class="glow"/><path d="M640 0v165" stroke="#3a404e" stroke-width="8"/></svg>`; }
function SVG_SURGERY_SEDATED() { return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><rect width="1280" height="720" fill="#080a0e"/><ellipse cx="640" cy="580" rx="440" ry="95" fill="#040507"/><rect x="350" y="410" width="580" height="72" rx="22" fill="#1a1e2a" stroke="#4a5060" stroke-width="6"/><circle cx="640" cy="165" r="92" fill="#7ab0d8" opacity=".10"/><circle cx="920" cy="340" r="12" fill="#40c060" opacity=".9"/></svg>`; }
function SVG_OBSERVATION() { return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><rect width="1280" height="720" fill="#09090e"/><g fill="#0d0e14" stroke="#2a2d3a" stroke-width="4"><rect x="100" y="160" width="220" height="340"/><rect x="360" y="160" width="220" height="340"/><rect x="620" y="160" width="220" height="340"/><rect x="880" y="160" width="220" height="340"/></g><path d="M0 530h1280" stroke="#1a1d28" stroke-width="3"/></svg>`; }
function SVG_COURTYARD() { return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><rect width="1280" height="720" fill="#060809"/><rect y="520" width="1280" height="200" fill="#0f1510"/><path d="M115 105h1050l-65 420H180z" fill="#13171e" stroke="#363f52" stroke-width="7"/><circle cx="640" cy="340" r="40" fill="#581a1a"/></svg>`; }
function SVG_ESCAPE_GATE() { return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><rect width="1280" height="720" fill="#070809"/><g stroke="#5a6070" stroke-width="12" fill="none"><line x1="420" y1="80" x2="420" y2="660"/><line x1="530" y1="80" x2="530" y2="660"/><line x1="640" y1="80" x2="640" y2="660"/><line x1="750" y1="80" x2="750" y2="660"/><line x1="860" y1="80" x2="860" y2="660"/></g><rect x="350" y="320" width="580" height="80" rx="10" fill="#2a1a1a" stroke="#8a3030" stroke-width="6"/></svg>`; }
function SVG_ESCAPE_GATE_OPEN() { return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><rect width="1280" height="720" fill="#070809"/><g stroke="#5a6070" stroke-width="12" fill="none" opacity=".4"><line x1="420" y1="80" x2="480" y2="660"/><line x1="530" y1="80" x2="560" y2="660"/><line x1="640" y1="80" x2="640" y2="660"/></g><rect x="350" y="390" width="320" height="12" rx="4" fill="#6a6a6a"/><circle cx="900" cy="370" r="60" fill="#d8e8b0" opacity=".15"/></svg>`; }
function SVG_OUTSIDE() { return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><rect width="1280" height="720" fill="#080c10"/><rect y="480" width="1280" height="240" fill="#0c1008"/><circle cx="640" cy="200" r="80" fill="#c8d8f0" opacity=".12"/><path d="M0 480 Q320 460 640 470 Q960 480 1280 465" fill="none" stroke="#1a2018" stroke-width="8"/></svg>`; }
function SVG_STAIRWELL() { return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><rect width="1280" height="720" fill="#090b10"/><path d="M185 95h910v530H185z" fill="#13161e" stroke="#363c4e" stroke-width="7"/><path d="M325 610h630v-80H405v-86h462v-80H490v-86h302v-80H572" fill="none" stroke="#484e62" stroke-width="30"/><g fill="#7a2525" opacity=".6"><circle cx="385" cy="210" r="18"/><circle cx="495" cy="298" r="15"/><circle cx="580" cy="386" r="22"/></g></svg>`; }
function SVG_BASEMENT() { return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><rect width="1280" height="720" fill="#060708"/><rect y="460" width="1280" height="260" fill="#080c0a" opacity=".9"/><rect x="100" y="100" width="1080" height="580" rx="8" fill="none" stroke="#1a2020" stroke-width="6"/><circle cx="200" cy="180" r="30" fill="#8a1a1a" opacity=".7"/><rect x="900" y="200" width="180" height="320" rx="4" fill="#0d1010" stroke="#2a3030" stroke-width="4"/></svg>`; }
function SVG_DEATH_BASEMENT() { return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><rect width="1280" height="720" fill="#030405"/><rect y="400" width="1280" height="320" fill="#040808"/><circle cx="640" cy="360" r="200" fill="#0a0505" stroke="#3a0808" stroke-width="6" opacity=".8"/><text x="640" y="380" text-anchor="middle" fill="#6a1010" font-size="52" font-family="Georgia,serif" letter-spacing="4">THE DARK</text></svg>`; }
