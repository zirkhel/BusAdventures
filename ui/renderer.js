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
  showScreen("gameScreen");

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
    return `<div class="inv-item" data-id="${esc(it.id)}">
      <span class="inv-icon">${iconHtml}</span>
      <div class="inv-info">
        <strong>${esc(it.name)}</strong>
        <div class="inv-status">${esc(it.status)}</div>
      </div>
    </div>`;
  }).join("");
}

// ── Feedback ──────────────────────────────────────────────────────────────────

function showFeedback(text, type = "neutral", command = null, warning = null) {
  const el = qs("feedback");
  if (!el) return;
  el.className = "feedback " + type;

  let html = command
    ? `<span class="cmd">&gt; ${esc(command)}</span>`
    : "";

  if (text) {
    html += `<span class="feedback-text">${esc(text).replace(/\n/g, "<br>")}</span>`;
  }

  if (warning) {
    html += `<span class="feedback-warning">${esc(warning)}</span>`;
  }

  el.innerHTML = html;

  // Notify history hook
  if (command && typeof window._onCommand === "function") {
    window._onCommand(command, text + (warning ? "\n" + warning : ""), type);
  }
}

// ── Death / Win ───────────────────────────────────────────────────────────────

function renderDeath(text) {
  if (CFG.hooks?.onDeath?.(text) === true) return;  // hook can handle it
  S.clear();
  showScreen("deathScreen");
  renderMedia(qs("deathImage"), resolveMedia(S.get().room));
  const el = qs("deathText");
  if (el) el.textContent = text;
}

function renderWin() {
  if (CFG.hooks?.onWin?.() === true) return;
  S.clear();
  showScreen("winScreen");
  renderMedia(qs("winImage"), resolveMedia(S.get().room));
}

// ── Command handler ───────────────────────────────────────────────────────────

function handleCommand(input) {
  const raw = (input || "").trim();
  if (!raw) return;

  const result = E.runCommand(raw);

  if (result.type === "death") { renderDeath(result.text); return; }
  if (result.type === "win")   { renderWin(); return; }

  if (result.inventoryOnly) {
    renderInventory();
    showFeedback("You check your inventory.", "neutral", raw);
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
  // Command form
  qs("commandForm")?.addEventListener("submit", e => {
    e.preventDefault();
    const inp = qs("commandInput");
    const val = inp.value.trim();
    inp.value = "";
    handleCommand(val);
  });

  // Inventory toggle
  qs("invToggle")?.addEventListener("click", () => {
    qs("inventory")?.classList.toggle("open");
    const arrow = qs("invArrow");
    if (arrow) arrow.textContent = qs("inventory")?.classList.contains("open") ? "▴" : "▾";
  });

  // Help
  qs("helpBtn")?.addEventListener("click", () => handleCommand("help"));

  // Restart
  qs("restartBtn")?.addEventListener("click", () => {
    if (!confirm("Restart from the beginning?")) return;
    S.clear(); S.fresh();
    showScreen("introScreen");
    renderMedia(qs("introImage"), CFG.getMedia?.("__intro__", S.get(), "default"));
  });

  // Start game
  qs("startBtn")?.addEventListener("click", () => {
    S.fresh();
    S.incVisit(S.get().room);
    renderRoom();
    showFeedback(adventure.game.intro?.firstText || "");
    S.save();
    qs("commandInput")?.focus();
  });

  // Continue after death
  qs("continueBtn")?.addEventListener("click", () => {
    S.fresh();
    showScreen("introScreen");
    renderMedia(qs("introImage"), CFG.getMedia?.("__intro__", S.get(), "default"));
  });

  // Play again after win
  qs("playAgainBtn")?.addEventListener("click", () => {
    S.fresh();
    showScreen("introScreen");
    renderMedia(qs("introImage"), CFG.getMedia?.("__intro__", S.get(), "default"));
  });
}

// ── Utility ───────────────────────────────────────────────────────────────────

function esc(s) {
  return String(s || "").replace(/[&<>"']/g, c =>
    ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c])
  );
}

export { configure, startGame, handleCommand, renderRoom, renderInventory, renderDeath, renderWin, showFeedback, showScreen };
