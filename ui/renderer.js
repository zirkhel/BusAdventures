// ui/renderer.js
// All DOM access lives here. Receives result objects from engine.
// Game-specific hooks can be injected via configure().

"use strict";

import * as S from "../engine/state.js";
import * as E from "../engine/engine.js";
import { renderMedia } from "./fx.js";

// ── Config ────────────────────────────────────────────────────────────────────
// Injected by each game's index.html

let CFG = {
  getMedia:    null,   // fn(roomId, state, roomStateName) → media object
  getItemIcon: null,   // fn(itemId) → HTML string
  hooks:       {},     // optional per-game overrides from overrides/ui-hooks.js
};

function configure(cfg) {
  Object.assign(CFG, cfg);
  if (cfg.hooks) CFG.hooks = cfg.hooks;
}

// ── Selectors ─────────────────────────────────────────────────────────────────

const qs = id => document.getElementById(id);

// ── Screens ───────────────────────────────────────────────────────────────────

const SCREENS = ["introScreen", "gameScreen", "deathScreen", "winScreen"];

function showScreen(name) {
  SCREENS.forEach(id => {
    const el = qs(id);
    if (el) el.classList.toggle("hidden", id !== name);
  });
  CFG.hooks?.onScreenChange?.(name);
}

// ── Media ─────────────────────────────────────────────────────────────────────

function resolveMedia(roomId) {
  if (!CFG.getMedia) return null;
  const mediaKey = E.resolveMediaKey(roomId);
  const stateName = S.getRoomState(roomId);
  return CFG.getMedia(mediaKey, S.get(), stateName);
}

// ── Room render ───────────────────────────────────────────────────────────────

function renderRoom() {
  const roomId = S.get().room;
  const roomDef = S.roomDef(roomId);


  renderMedia(qs("scene"), resolveMedia(roomId));

  const titleEl = qs("roomTitle");
  if (titleEl) titleEl.textContent = roomDef.title;

  const textEl = qs("roomText");
  if (textEl) textEl.textContent = E.buildDescription(roomId);

  renderExits(roomId);
  renderInventory();

  // Notify index.html hooks
  if (typeof window._onRoomEnter === "function") window._onRoomEnter(roomId);

  CFG.hooks?.onRoomRender?.(roomId, roomDef);
}

// ── Exits ─────────────────────────────────────────────────────────────────────

const DIR_ARROWS = {
  north:"↑", south:"↓", east:"→", west:"←",
  up:"⬆", down:"⬇", northeast:"↗", northwest:"↖",
  southeast:"↘", southwest:"↙",
};

function renderExits(roomId) {
  const el = qs("exits");
  if (!el) return;
  el.innerHTML = "";

  const exits = E.buildExits(roomId);
  const visible = exits.filter(ex => ex.type !== "special");
  if (!visible.length) return;

  visible.forEach(ex => {
    const btn = document.createElement("button");
    btn.className = "exit-btn" + (ex.type === "locked" ? " locked" : "");
    const arrow = DIR_ARROWS[ex.dir] || "";
    const label = ex.label || ex.dir;
    btn.innerHTML = arrow
      ? `<span class="exit-arrow">${arrow}</span>${label}`
      : label;
    btn.dataset.dir = ex.dir;
    btn.addEventListener("click", () => handleCommand(ex.dir));
    el.appendChild(btn);
  });
}

// ── Inventory ─────────────────────────────────────────────────────────────────

function renderInventory() {
  const items   = E.inventoryList();
  const titleEl = qs("invTitle");
  const listEl  = qs("inventory");

  if (titleEl) titleEl.textContent = `Inventory (${items.length})`;
  if (!listEl) return;

  if (!items.length) {
    listEl.innerHTML = `<div class="inv-empty">Nothing carried.</div>`;
    return;
  }

  listEl.innerHTML = items.map(it => {
    const iconHtml = CFG.getItemIcon ? CFG.getItemIcon(it.id) : "";
    return `<div class="inv-item" data-id="${esc(it.id)}" tabindex="0">
      <div class="inv-row">
        <span class="inv-icon">${iconHtml}</span>
        <div class="inv-info">
          <strong>${esc(it.name)}</strong>
          <div class="inv-status">${esc(it.status)}</div>
        </div>
      </div>
      <div class="inv-detail hidden">${esc(it.description || "")}</div>
    </div>`;
  }).join("");

  // Tap to expand item detail
  listEl.querySelectorAll(".inv-item").forEach(row => {
    row.addEventListener("click", () => {
      const detail  = row.querySelector(".inv-detail");
      const isOpen  = !detail.classList.contains("hidden");
      // Close all others
      listEl.querySelectorAll(".inv-detail").forEach(d => d.classList.add("hidden"));
      if (!isOpen) {
        detail.classList.remove("hidden");
      }
    });
  });
}

// ── Feedback ──────────────────────────────────────────────────────────────────

function showFeedback(text, type = "neutral", command = null, warning = null) {
  // Notify hooks — they handle rendering
  if (command && typeof window._onCommand === "function") {
    window._onCommand(command, text + (warning ? "\n" + warning : ""), type);
    return;
  }
  // No command (e.g. room enter message) — append to output
  if (text) {
    const inner = document.getElementById("outputInner");
    if (inner) {
      const entry = document.createElement("div");
      entry.className = "output-entry " + type;
      entry.innerHTML = `<span class="otxt">${esc(text).replace(/\n/g,"<br>")}</span>`;
      inner.appendChild(entry);
      const box = document.getElementById("outputBox");
      if (box) box.scrollTop = box.scrollHeight;
    }
  }
}

// ── Death / Win ───────────────────────────────────────────────────────────────

function renderDeath(text) {
  if (CFG.hooks?.onDeath?.(text) === true) return;
  const roomId  = S.get().room;
  const roomDef = S.roomDef(roomId);
  S.clear();
  showScreen("deathScreen");
  // Priority: room.deathMedia → __death__ → room image
  const deathMedia =
    (roomDef?.deathMedia && CFG.getMedia?.(roomDef.deathMedia, S.get(), "default")) ||
    CFG.getMedia?.("__death__", S.get(), "default") ||
    resolveMedia(roomId);
  renderMedia(qs("deathImage"), deathMedia);
  const el = qs("deathText");
  if (el) el.textContent = text;
}

function renderWin() {
  if (CFG.hooks?.onWin?.() === true) return;
  const roomId  = S.get().room;
  const roomDef = S.roomDef(roomId);
  S.clear();
  showScreen("winScreen");
  // Priority: room.winMedia → __win__ → room image
  const winMedia =
    (roomDef?.winMedia && CFG.getMedia?.(roomDef.winMedia, S.get(), "default")) ||
    CFG.getMedia?.("__win__", S.get(), "default") ||
    resolveMedia(roomId);
  renderMedia(qs("winImage"), winMedia);
}

// ── Command handler ───────────────────────────────────────────────────────────

function handleCommand(input) {
  const raw = (input || "").trim();
  if (!raw) return;

  // Special internal command from startBtn
  if (raw === "__start__") {
    S.fresh();
    if (typeof window._resetUI === "function") window._resetUI();
    S.incVisit(S.get().room);
    renderRoom();
    if (typeof window._showScreen === "function") window._showScreen("gameScreen");
    S.save();
    return;
  }

  const result = E.runCommand(raw);

  // "look" does NOT expand desc — result shows in feedback

  if (result.type === "death") { renderDeath(result.text); return; }
  if (result.type === "win")   { renderWin(); return; }

  if (result.inventoryOnly) {
    renderInventory();
    // Build inventory text for output box
    const items = E.inventoryList();
    let invText;
    if (!items.length) {
      invText = "You are carrying nothing.";
    } else {
      invText = items.map(it => {
        const status = it.status === "worn" ? " (worn)" : it.status === "held" ? " (held)" : "";
        return it.name + status;
      }).join("\n");
    }
    showFeedback(invText, "neutral", raw);
    return;
  }

  if (result.roomChanged) renderRoom();
  showFeedback(result.text || "", result.type, raw, result.warning || null);
}

// ── Startup ───────────────────────────────────────────────────────────────────

function startGame(adventure) {
  S.init(adventure);

  const hasSave = S.load();
  if (!hasSave) S.fresh();

  const startLabel = adventure.game.intro?.startLabel || "Begin";
  const startBtnEl = qs("startBtn");
  if (startBtnEl) startBtnEl.textContent = startLabel;

  wireControls(adventure);

  const st = S.get();
  if (hasSave && !st.dead && !st.won) {
    renderRoom();
    showFeedback("You continue where you left off.", "neutral");
  } else {
    S.fresh();
    showScreen("introScreen");
    renderMedia(qs("introImage"), CFG.getMedia?.("__intro__", S.get(), "default"));
  }
}

function wireControls(adventure) {
  // All UI wiring is handled by index.html
  // Renderer only wires what index.html cannot: startBtn, continueBtn, playAgainBtn, restartBtn
  
  qs("startBtn")?.addEventListener("click", () => {
    S.fresh();
    if (typeof window._resetUI === "function") window._resetUI();
    S.incVisit(S.get().room);
    showScreen("gameScreen");
    renderRoom();
    if (adventure.game.intro?.firstText) showFeedback(adventure.game.intro.firstText);
    S.save();
  });

  qs("continueBtn")?.addEventListener("click", () => {
    S.clear(); S.fresh();
    if (typeof window._resetUI === "function") window._resetUI();
    showScreen("introScreen");
    renderMedia(qs("introImage"), CFG.getMedia?.("__intro__", S.get(), "default"));
  });

  qs("playAgainBtn")?.addEventListener("click", () => {
    S.clear(); S.fresh();
    if (typeof window._resetUI === "function") window._resetUI();
    showScreen("introScreen");
    renderMedia(qs("introImage"), CFG.getMedia?.("__intro__", S.get(), "default"));
  });

  qs("restartBtn")?.addEventListener("click", () => {
    if (!confirm("Restart from the beginning?")) return;
    S.clear(); S.fresh();
    if (typeof window._resetUI === "function") window._resetUI();
    showScreen("introScreen");
    renderMedia(qs("introImage"), CFG.getMedia?.("__intro__", S.get(), "default"));
  });

  qs("helpBtn")?.addEventListener("click", () => handleCommand("help"));
}

// ── Utility ───────────────────────────────────────────────────────────────────

function esc(s) {
  return String(s || "").replace(/[&<>"']/g, c =>
    ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c])
  );
}

export { configure, startGame, handleCommand, renderRoom, renderInventory, renderDeath, renderWin, showFeedback, showScreen };
