// ui/shell.js
// Injects all game UI HTML into <body> and wires all shared interaction.
// Call initShell() before startGame().
//
// Usage:
//   import { initShell } from "../../ui/shell.js";
//   initShell({ handleCommand, game: GAME });
//
// GAME object is read for intro/win text and about content.
// All fields are optional — shell falls back to sensible defaults.

export function initShell({ handleCommand, game = {} }) {

  const intro = game.intro || {};
  const win   = game.win   || {};

  function esc(s) {
    return String(s || '').replace(/[&<>"']/g,
      c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[c]));
  }

  // ── Inject HTML ───────────────────────────────────────────────────────────
  document.body.insertAdjacentHTML('afterbegin', `

<!-- INTRO -->
<div id="introScreen" class="screen">
  <div id="introImage" class="intro-scene"><img src="assets/intro.png" onerror="this.style.display='none'"></div>
  <div class="intro-body">
    <h1>${esc(intro.title || game.title || '')}</h1>
    <h2>${esc(intro.subtitle || '')}</h2>
    ${(intro.text || '').split('\n\n').map(p => `<p>${esc(p)}</p>`).join('')}
    <button id="startBtn" class="btn-primary">${esc(intro.startLabel || 'Begin')}</button>
  </div>
</div>

<!-- GAME -->
<div id="gameScreen" class="screen hidden">
  <div class="game-layout">
    <div id="scene" class="scene flex-none"></div>
    <div class="action-bar flex-none">
      <button id="settingsBtn" class="action-btn">⚙</button>
    </div>
    <div class="section-header flex-none" id="invToggle">
      <span id="invTitle">Inventory (0)</span>
      <span id="invArrow">▾</span>
    </div>
    <div id="inventory" class="inv-list flex-none"></div>
    <div class="section-header flex-none" id="roomTitleEl">
      <span id="roomTitle">Room</span>
      <span id="descToggle">▾</span>
    </div>
    <div id="roomDesc" class="room-desc flex-none">
      <div id="roomText" class="room-text"></div>
    </div>
    <div class="input-bar flex-none" id="inputBar">
      <div class="input-bar-inner" id="inputTrigger">
        <span class="input-bar-prompt">❯</span>
        <span class="input-bar-text" id="inputBarText">Enter command…</span>
      </div>
    </div>
    <div id="exits" class="exits flex-none"></div>
    <div class="input-bar-spacer"></div>
    <div id="outputBox" class="output-box">
      <div id="outputInner" class="output-inner"></div>
    </div>
  </div>
</div>

<!-- DEATH -->
<div id="deathScreen" class="screen hidden">
  <div id="deathImage" class="intro-scene"></div>
  <div class="intro-body">
    <h1 class="red">You Died</h1>
    <p id="deathText" class="muted"></p>
    <button id="continueBtn" class="btn-primary">Continue</button>
  </div>
</div>

<!-- WIN -->
<div id="winScreen" class="screen hidden">
  <div id="winImage" class="intro-scene"></div>
  <div class="intro-body">
    <h1 class="green">${esc(win.title || 'Escaped')}</h1>
    <p class="muted">${esc(win.text || '')}</p>
    <button id="playAgainBtn" class="btn-primary">${esc(win.playAgainLabel || 'Play again')}</button>
  </div>
</div>

<!-- Settings menu -->
<div id="settingsMenu" class="float-menu hidden">
  <button id="helpBtn"    class="float-item">Help / Commands</button>
  <button id="restartBtn" class="float-item red-text">Restart</button>
  <button id="backBtn"    class="float-item">← Game Select</button>
  <button id="aboutBtn"   class="float-item">About</button>
</div>

<!-- About overlay -->
<div id="aboutOverlay" class="about-overlay hidden">
  <div class="about-panel">
    <button class="about-close" id="aboutClose">✕</button>
    <div class="about-content">
      <div class="about-logo">BUS<span>/</span>ADVENTURES</div>
      <div class="about-version">${esc(game.version || '')} — ${esc(intro.title || game.title || '')}</div>
      ${(game.about || []).map(p => `<p class="about-body">${esc(p)}</p>`).join('')}
      ${game.contact ? `
      <div class="about-divider">— CONTACT —</div>
      <a class="about-contact" href="mailto:${esc(game.contact)}">${esc(game.contact)}</a>
      ` : ''}
      <div class="about-footer">© 2025 Anders Risvold</div>
    </div>
  </div>
</div>

<!-- Hidden input — keyboard trigger only -->
<form id="commandForm" autocomplete="off" style="position:fixed;top:-500px;opacity:0;pointer-events:none">
  <input id="commandInput" autocomplete="off" autocorrect="off"
    autocapitalize="off" spellcheck="false" enterkeyhint="send">
</form>

`);

  // ── Elements ──────────────────────────────────────────────────────────────
  const outputBox    = document.getElementById('outputBox');
  const outputInner  = document.getElementById('outputInner');
  const roomDesc     = document.getElementById('roomDesc');
  const descToggle   = document.getElementById('descToggle');
  const cmdInput     = document.getElementById('commandInput');
  const settingsBtn  = document.getElementById('settingsBtn');
  const settingsMenu = document.getElementById('settingsMenu');
  const inputBar     = document.getElementById('inputBar');
  const inputBarText = document.getElementById('inputBarText');
  const aboutOverlay = document.getElementById('aboutOverlay');
  const gameLayout   = document.querySelector('.game-layout');

  let descCollapsed = false;
  let currentRoomId = null;

  // ── Viewport height lock ──────────────────────────────────────────────────
  function onViewport() {
    if (!window.visualViewport) return;
    if (gameLayout) gameLayout.style.height = window.visualViewport.height + 'px';
  }
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', onViewport);
    window.visualViewport.addEventListener('scroll', onViewport);
    onViewport();
  }

  // ── Collapse / expand desc ────────────────────────────────────────────────
  function collapse() {
    if (descCollapsed) return;
    descCollapsed = true;
    roomDesc.classList.add('collapsed');
    descToggle.textContent = '▸';
  }
  function expand() {
    descCollapsed = false;
    roomDesc.classList.remove('collapsed');
    descToggle.textContent = '▾';
  }
  function collapseAll() {
    collapse();
    const inv = document.getElementById('inventory');
    if (inv.classList.contains('open')) {
      inv.classList.remove('open');
      document.getElementById('invArrow').textContent = '▾';
    }
  }

  // ── Renderer hooks ────────────────────────────────────────────────────────
  window._resetUI = () => {
    currentRoomId = null;
    outputInner.innerHTML = '';
    expand();
  };

  window._onRoomEnter = (roomId) => {
    currentRoomId = roomId;
    outputInner.innerHTML = '';
    expand();
    outputBox.scrollTop = 0;
  };

  window._onCommand = (cmd, text, type) => {
    const entry = document.createElement('div');
    entry.className = `output-entry ${type || 'neutral'}`;
    entry.innerHTML =
      `<span class="ocmd">&gt; ${esc(cmd)}</span>` +
      (text ? `<span class="otxt">${esc(text)}</span>` : '');
    outputInner.prepend(entry);
    outputBox.scrollTop = 0;
  };

  // ── Input bar ─────────────────────────────────────────────────────────────
  function focusInput() {
    cmdInput.value = '';
    inputBarText.textContent = '';
    inputBar.classList.add('active');
    collapseAll();
    cmdInput.focus();
  }

  document.getElementById('inputTrigger').addEventListener('click', focusInput);
  outputBox.addEventListener('click', focusInput);

  document.getElementById('commandForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const val = cmdInput.value.trim();
    cmdInput.value = '';
    cmdInput.blur();
    inputBar.classList.remove('active');
    inputBarText.textContent = 'Enter command…';
    if (!val) return;
    collapse();
    handleCommand(val);
  });

  cmdInput.addEventListener('input', () => {
    inputBarText.textContent = cmdInput.value || '';
  });

  cmdInput.addEventListener('blur', () => {
    inputBar.classList.remove('active');
    if (!cmdInput.value) inputBarText.textContent = 'Enter command…';
  });

  // ── Room title tap ────────────────────────────────────────────────────────
  document.getElementById('roomTitleEl').addEventListener('click', () => {
    descCollapsed ? expand() : collapse();
  });

  // ── Inventory ─────────────────────────────────────────────────────────────
  document.getElementById('invToggle').addEventListener('click', () => {
    const inv = document.getElementById('inventory');
    inv.classList.toggle('open');
    document.getElementById('invArrow').textContent =
      inv.classList.contains('open') ? '▴' : '▾';
  });

  // ── Settings ──────────────────────────────────────────────────────────────
  settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const r = settingsBtn.getBoundingClientRect();
    settingsMenu.style.top  = (r.bottom + 6) + 'px';
    settingsMenu.style.left = r.left + 'px';
    settingsMenu.classList.toggle('hidden');
  });
  document.addEventListener('click', () => settingsMenu.classList.add('hidden'));
  document.getElementById('helpBtn').addEventListener('click', () => {
    settingsMenu.classList.add('hidden');
    handleCommand('help');
  });
  document.getElementById('restartBtn').addEventListener('click', () => settingsMenu.classList.add('hidden'));
  document.getElementById('backBtn').addEventListener('click', () => {
    settingsMenu.classList.add('hidden');
    window.location.href = '../../index.html';
  });

  // ── About ─────────────────────────────────────────────────────────────────
  document.getElementById('aboutBtn').addEventListener('click', () => {
    settingsMenu.classList.add('hidden');
    aboutOverlay.classList.remove('hidden');
  });
  document.getElementById('aboutClose').addEventListener('click', () => {
    aboutOverlay.classList.add('hidden');
  });
  aboutOverlay.addEventListener('click', (e) => {
    if (e.target === aboutOverlay) aboutOverlay.classList.add('hidden');
  });
}
