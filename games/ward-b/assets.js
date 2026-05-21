// games/ward-b/assets.js
// All visual assets. SVG inline — no external dependencies.

"use strict";

const ROOM_MEDIA = {
  __intro__: {
    type: "svg", fx: "mist",
    src: `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
      <defs><radialGradient id="rg" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stop-color="#1c2230"/>
        <stop offset="100%" stop-color="#030407"/>
      </radialGradient></defs>
      <rect width="1280" height="720" fill="url(#rg)"/>
      <rect x="140" y="100" width="1000" height="480" rx="14" fill="#0f1219" stroke="#3a404f" stroke-width="6"/>
      <path d="M300 490 L980 210" stroke="#22283a" stroke-width="20"/>
      <circle cx="640" cy="350" r="100" fill="#080a0f" stroke="#6b2828" stroke-width="10"/>
      <text x="640" y="370" text-anchor="middle" fill="#b33a3a" font-size="48" font-family="Georgia,serif" letter-spacing="8">WARD B</text>
    </svg>`,
  },
  reception: {
    type: "svg", fx: "mist",
    src: `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
      <rect width="1280" height="720" fill="#10131b"/>
      <rect x="0" y="560" width="1280" height="160" fill="#090a0d"/>
      <rect x="120" y="310" width="1040" height="210" rx="10" fill="#231e1c" stroke="#4a3c34" stroke-width="5"/>
      <rect x="760" y="140" width="230" height="140" fill="#040508" stroke="#40475a" stroke-width="8"/>
      <rect x="270" y="368" width="220" height="58" fill="#342823"/>
      <rect x="320" y="390" width="90" height="30" rx="4" fill="#aaa090" stroke="#8a3535" stroke-width="3"/>
      <text x="165" y="260" fill="#505a6a" font-size="52" font-family="Georgia,serif">RECEPTION</text>
      <path d="M640 60v500" stroke="#282d3d" stroke-width="10"/>
    </svg>`,
  },
  corridor: {
    type: "svg", fx: "flicker",
    src: `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
      <rect width="1280" height="720" fill="#0b0d14"/>
      <path d="M170 70h940L930 670H350z" fill="#14182a" stroke="#383c4e" stroke-width="6"/>
      <path d="M505 110h270l35 540H470z" fill="#060709"/>
      <g fill="#282d3b">
        <rect x="230" y="175" width="145" height="88"/>
        <rect x="905" y="200" width="145" height="88"/>
        <rect x="250" y="355" width="118" height="78"/>
        <rect x="912" y="380" width="118" height="78"/>
      </g>
      <circle cx="640" cy="185" r="42" fill="#b88040" opacity=".5" class="glow"/>
    </svg>`,
  },
  records: {
    type: "svg", fx: "mist",
    src: `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
      <rect width="1280" height="720" fill="#111420"/>
      <g stroke="#424a5c" stroke-width="6" fill="#1e2230">
        <rect x="125" y="175" width="265" height="365"/>
        <rect x="440" y="135" width="255" height="415"/>
        <rect x="745" y="185" width="335" height="355"/>
      </g>
      <g fill="#6a5c44">
        <rect x="165" y="215" width="165" height="18"/>
        <rect x="490" y="195" width="145" height="18"/>
        <rect x="785" y="255" width="205" height="18"/>
        <rect x="165" y="265" width="120" height="18"/>
        <rect x="490" y="245" width="100" height="18"/>
      </g>
      <circle cx="320" cy="560" r="58" fill="#d4b86a" opacity=".3"/>
    </svg>`,
  },
  pharmacy: {
    type: "svg",
    src: `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
      <rect width="1280" height="720" fill="#10131a"/>
      <rect x="145" y="110" width="990" height="460" fill="#181d2b" stroke="#464e64" stroke-width="7"/>
      <g fill="#080b10" stroke="#2e3545" stroke-width="4">
        <rect x="205" y="165" width="195" height="315"/>
        <rect x="430" y="165" width="195" height="315"/>
        <rect x="655" y="165" width="195" height="315"/>
        <rect x="880" y="165" width="195" height="315"/>
      </g>
      <rect x="548" y="335" width="98" height="52" rx="10" fill="#d4c08a" stroke="#6b5a30" stroke-width="4"/>
      <text x="597" y="370" text-anchor="middle" font-size="19" fill="#2a2010" font-family="monospace">SED</text>
    </svg>`,
  },
  surgery: {
    type: "svg", fx: "flicker",
    src: `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
      <rect width="1280" height="720" fill="#0b0c11"/>
      <ellipse cx="640" cy="580" rx="440" ry="95" fill="#060709"/>
      <rect x="350" y="410" width="580" height="72" rx="22" fill="#1e2430" stroke="#5e6578" stroke-width="6"/>
      <path d="M350 420 Q640 395 930 420" fill="none" stroke="#3a3d50" stroke-width="4"/>
      <circle cx="640" cy="165" r="92" fill="#d8c07a" opacity=".22" class="glow"/>
      <path d="M640 0v165" stroke="#3a404e" stroke-width="8"/>
      <path d="M245 130 C400 210 410 295 408 390" stroke="#282d3e" stroke-width="8" fill="none"/>
      <path d="M1035 130 C880 210 870 295 872 390" stroke="#282d3e" stroke-width="8" fill="none"/>
    </svg>`,
  },
  surgery_sedated: {
    type: "svg",
    src: `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
      <rect width="1280" height="720" fill="#080a0e"/>
      <ellipse cx="640" cy="580" rx="440" ry="95" fill="#040507"/>
      <rect x="350" y="410" width="580" height="72" rx="22" fill="#1a1e2a" stroke="#4a5060" stroke-width="6"/>
      <circle cx="640" cy="165" r="92" fill="#7ab0d8" opacity=".10" class="glow"/>
      <path d="M640 0v165" stroke="#2a3040" stroke-width="8"/>
      <circle cx="920" cy="340" r="12" fill="#40c060" opacity=".9"/>
    </svg>`,
  },
  stairwell: {
    type: "svg", fx: "mist",
    src: `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
      <rect width="1280" height="720" fill="#090b10"/>
      <path d="M185 95h910v530H185z" fill="#13161e" stroke="#363c4e" stroke-width="7"/>
      <path d="M325 610h630v-80H405v-86h462v-80H490v-86h302v-80H572" fill="none" stroke="#484e62" stroke-width="30"/>
      <g fill="#7a2525" opacity=".6">
        <circle cx="385" cy="210" r="18"/>
        <circle cx="495" cy="298" r="15"/>
        <circle cx="580" cy="386" r="22"/>
      </g>
      <text x="640" y="148" fill="#6a2828" font-size="48" text-anchor="middle" font-family="Georgia,serif" letter-spacing="4">DO NOT COUNT</text>
    </svg>`,
  },
  courtyard: {
    type: "svg", fx: "mist",
    src: `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
      <rect width="1280" height="720" fill="#060809"/>
      <rect y="520" width="1280" height="200" fill="#0f1510"/>
      <path d="M115 105h1050l-65 420H180z" fill="#13171e" stroke="#363f52" stroke-width="7"/>
      <path d="M475 525l42-278h246l42 278z" fill="#0a0c0e" stroke="#484e5e" stroke-width="6"/>
      <circle cx="640" cy="340" r="40" fill="#581a1a"/>
      <path d="M535 538c38-78 178-78 216 0" fill="none" stroke="#c0ac74" stroke-width="8"/>
    </svg>`,
  },
};

// Media resolver — called by renderer with roomId, state, roomStateName
export function getMedia(roomId, state, roomStateName) {
  // Surgery has two visual states
  if (roomId === "surgery" && roomStateName === "sedated") {
    return ROOM_MEDIA["surgery_sedated"];
  }
  return ROOM_MEDIA[roomId] || ROOM_MEDIA["__intro__"];
}

// Item icons — 64x64 SVG
export function getItemIcon(itemId) {
  return ITEM_ICONS[itemId] || FALLBACK_ICON;
}

const ITEM_ICONS = {
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
    <text x="32" y="42" text-anchor="middle" font-size="8" fill="#5a2a28" font-family="monospace">SED</text>
  </svg>`,
};

const FALLBACK_ICON = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="10" width="44" height="44" rx="8" fill="#1e2230" stroke="#4a5060" stroke-width="2"/>
  <text x="32" y="40" text-anchor="middle" font-size="28" fill="#505a6a">?</text>
</svg>`;
