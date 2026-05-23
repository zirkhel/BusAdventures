// ui/fx.js
"use strict";

function applySceneFX(sceneEl, fx) {
  if (!sceneEl) return;
  // Remove only fx classes, preserve existing classes
  sceneEl.className = sceneEl.className
    .split(" ").filter(c => !c.startsWith("fx-")).join(" ").trim();
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
    el.innerHTML = "";
    const v = document.createElement("video");
    v.src = media.src;
    v.autoplay = true;
    v.loop = true;
    v.muted = true;
    v.playsInline = true;
    el.appendChild(v);
  } else {
    // type === "img" — create element, fall back to SVG on error
    el.innerHTML = "";
    const img = document.createElement("img");
    img.alt = "";
    if (media.svgFallback) {
      img.addEventListener("error", () => {
        // Replace entire scene content with fallback SVG
        el.innerHTML = media.svgFallback;
        // Ensure SVG fills scene
        const svg = el.querySelector("svg");
        if (svg) {
          svg.style.width = "100%";
          svg.style.height = "100%";
          svg.style.display = "block";
        }
      }, { once: true });
    }
    img.src = media.src; // set src after event listener
    el.appendChild(img);
  }
}

function defaultPlaceholder() {
  return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
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
