// ui/fx.js
// Visual and ambient FX hooks. Stateless — called by renderer.
// Games can override via overrides/ui-hooks.js.

"use strict";

// Apply FX class to scene element based on room fx + state
function applySceneFX(sceneEl, fx) {
  if (!sceneEl) return;
  // Strip all fx classes
  sceneEl.className = sceneEl.className
    .replace(/\bfx-\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  sceneEl.className = "scene";
  if (fx) sceneEl.classList.add("fx-" + fx);
}

// Render media into a scene element
// media: { type: "svg"|"img"|"video", src, fx }
function renderMedia(el, media) {
  if (!el) return;
  if (!media) {
    el.innerHTML = defaultPlaceholder();
    return;
  }

  applySceneFX(el, media.fx || null);

  if (media.type === "svg") {
    el.innerHTML = media.src;
  } else if (media.type === "video") {
    el.innerHTML = `<video src="${esc(media.src)}" autoplay loop muted playsinline></video>`;
  } else {
    el.innerHTML = `<img src="${esc(media.src)}" alt="">`;
  }
}

// Placeholder when media is missing
function defaultPlaceholder() {
  return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
    <rect width="1280" height="720" fill="#111"/>
    <text x="640" y="370" text-anchor="middle" font-size="28"
      font-family="monospace" fill="#333">[ no image ]</text>
  </svg>`;
}

function esc(s) {
  return String(s || "").replace(/[&<>"']/g, c =>
    ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c])
  );
}

export { renderMedia, applySceneFX, defaultPlaceholder };
