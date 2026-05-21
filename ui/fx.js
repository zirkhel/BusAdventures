// ui/fx.js
// Visual and ambient FX hooks. Stateless — called by renderer.

"use strict";

function applySceneFX(sceneEl, fx) {
  if (!sceneEl) return;
  sceneEl.className = "scene";
  if (fx) sceneEl.classList.add("fx-" + fx);
}

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
    // type === "img"
    // Create img, append to scene el.
    // On error: replace entire scene content with SVG fallback.
    el.innerHTML = "";
    const img = document.createElement("img");
    img.src = media.src;
    img.alt = "";
    img.style.cssText = "width:100%;height:100%;object-fit:cover;display:block";
    if (media.svgFallback) {
      img.addEventListener("error", () => {
        el.innerHTML = media.svgFallback;
      }, { once: true });
    }
    el.appendChild(img);
  }
}

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
