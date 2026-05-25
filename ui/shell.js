// ui/shell.js
// Injects all game UI and wires all interaction.
// Call initShell({ handleCommand, game: GAME }) before startGame().

export function initShell({ handleCommand, game = {} }) {

  function esc(s) {
    return String(s || '').replace(/[&<>"']/g,
      c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[c]));
  }

  document.body.insertAdjacentHTML('afterbegin', `
<!-- INTRO -->
<div id="introScreen" class="screen">
  <div id="introImage" class="intro-scene"><img src="assets/intro.png" onerror="this.style.display='none'"></div>
  <div class="intro-body">
    <h1 id="shellTitle"></h1>
    <h2 id="shellSubtitle"></h2>
    <div id="shellIntroText"></div>
    <button id="startBtn" class="btn-primary" id="shellStartBtn">Begin</button>
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
    <!-- Visible input bar — always shown, tapping focuses keyboard -->
    <div class="input-bar flex-none" id="inputBar">
      <div class="input-bar-inner" id="inputTrigger">
        <span class="input-bar-prompt">❯</span>
        <span class="input-bar-text" id="inputBarText">Enter command…</span>
      </div>
    </div>
    <div id="exits" class="exits flex-none"></div>
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
    <h1 class="green" id="shellWinTitle">Escaped</h1>
    <p class="muted" id="shellWinText"></p>
    <button id="playAgainBtn" class="btn-primary">Play again</button>
  </div>
</div>

<!-- Settings menu -->
<div id="settingsMenu" class="float-menu hidden">
  <button id="helpBtn" class="float-item">Help / Commands</button>
  <button id="restartBtn" class="float-item red-text">Restart</button>
  <button id="backBtn" class="float-item">← Game Select</button>
  <button id="aboutBtn" class="float-item">About</button>
</div>

<!-- About overlay -->
<div id="aboutOverlay" class="about-overlay hidden">
  <div class="about-panel">
    <button class="about-close" id="aboutClose">✕</button>
    <div class="about-content">
      <div class="about-logo">BUS<span>/</span>ADVENTURES</div>
      <div class="about-version" id="shellAboutVersion"></div>

      <p class="about-body">
        Text adventures were born in the late 1970s. Games like Zork and the Hitchhiker's Guide to the Galaxy proved that a parser, a room graph, and good writing were enough to hold a player for hours.
      </p>
      <p class="about-body">
        Bus Adventures is that format rebuilt for the mobile screen — short, sharp adventures completable in a single bus ride. Same DNA. New engine.
      </p>

      <div class="about-divider">— ENGINE —</div>
      <p class="about-body">
        Custom JavaScript engine. Room graph navigation, item systems, pressure hazards, puzzle logic. Games are plain data files — rooms, items, descriptions. No external dependencies.
      </p>

      <div class="about-divider">— CONTACT —</div>
      <a class="about-contact" href="mailto:anders.risvold@gmail.com">
        anders.risvold@gmail.com
      </a>

      <div class="about-footer">© 2025 Anders Risvold</div>
    </div>
  </div>
</div>

<!-- Command overlay — sits above keyboard on iOS -->
<!-- Hidden input — keyboard trigger only -->
<form id="commandForm" autocomplete="off" style="position:fixed;top:-500px;opacity:0;pointer-events:none">
  <input id="commandInput" autocomplete="off" autocorrect="off"
    autocapitalize="off" spellcheck="false" enterkeyhint="send">
</form>
`);

  // Fyll inn spillspesifikk tekst fra game-objektet
  const intro = game.intro || {};
  const win   = game.win   || {};

  const el = (id) => document.getElementById(id);

  if (intro.title)      el('shellTitle').textContent    = intro.title;
  if (intro.subtitle)   el('shellSubtitle').textContent = intro.subtitle;
  if (intro.startLabel) el('startBtn').textContent      = intro.startLabel;
  if (win.title)        el('shellWinTitle').textContent = win.title;
  if (win.text)         el('shellWinText').textContent  = win.text;
  if (intro.text) {
    el('shellIntroText').innerHTML = intro.text.split('\n\n')
      .map(p => `<p>${esc(p)}</p>`).join('');
  }
  if (game.version) {
    el('shellAboutVersion').textContent = game.version + ' — ' + (intro.title || '');
  }

// ── Configure renderer ────────────────────────────────────────────

// ── Visual viewport: lock layout and position input bar ──────────
const gameLayout = document.querySelector('.game-layout');
function onViewport() {
  if (!window.visualViewport) return;
  const vv = window.visualViewport;
  // Lock game height to visible area
  if (gameLayout) gameLayout.style.height = vv.height + 'px';

}

if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', onViewport);
  window.visualViewport.addEventListener('scroll', onViewport);
  onViewport();
}

// ── Elements ──────────────────────────────────────────────────────
const outputBox   = document.getElementById('outputBox');
const outputInner = document.getElementById('outputInner');
const roomDesc    = document.getElementById('roomDesc');
const descToggle  = document.getElementById('descToggle');
const cmdInput    = document.getElementById('commandInput');
const settingsBtn = document.getElementById('settingsBtn');
const settingsMenu= document.getElementById('settingsMenu');

let descCollapsed = false;
let currentRoomId = null;

// ── Collapse / expand desc ────────────────────────────────────────
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

// ── Renderer hooks ────────────────────────────────────────────────
window._resetUI = () => {
  currentRoomId = null;
  outputInner.innerHTML = '';
  expand();
};

window._onRoomEnter = (roomId) => {
  if (roomId === currentRoomId) return;
  currentRoomId = roomId;
  outputInner.innerHTML = '';
  expand();
  outputBox.scrollTop = 0;
};

window._onCommand = (cmd, text, type) => {
  const entry = document.createElement('div');
  entry.className = `output-entry ${type||'neutral'}`;
  entry.innerHTML =
    `<span class="ocmd">&gt; ${esc(cmd)}</span>` +
    (text ? `<span class="otxt">${esc(text)}</span>` : '');
  outputInner.prepend(entry);
  // column-reverse + prepend = newest at visual top
  outputBox.scrollTop = 0;
};

// startBtn wired by renderer

// ── Input bar ─────────────────────────────────────────────────────
const inputBar     = document.getElementById('inputBar');
const inputBarText = document.getElementById('inputBarText');

function collapseAll() {
  // Collapse room description
  if (!descCollapsed) collapse();
  // Collapse inventory
  const inv = document.getElementById('inventory');
  if (inv.classList.contains('open')) {
    inv.classList.remove('open');
    document.getElementById('invArrow').textContent = '▾';
  }
}

function focusInput() {
  cmdInput.value = '';
  inputBarText.textContent = '';
  inputBar.classList.add('active');
  collapseAll();
  cmdInput.focus();
}

// Tap input bar or output box → open keyboard
document.getElementById('inputTrigger').addEventListener('click', focusInput);
outputBox.addEventListener('click', focusInput);

// Submit on enter
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

// Live text mirroring in input bar
cmdInput.addEventListener('input', () => {
  inputBarText.textContent = cmdInput.value || '';
});

cmdInput.addEventListener('blur', () => {
  inputBar.classList.remove('active');
  if (!cmdInput.value) inputBarText.textContent = 'Enter command…';
});

// ── Room title tap ────────────────────────────────────────────────
document.getElementById('roomTitleEl').addEventListener('click', () => {
  descCollapsed ? expand() : collapse();
});

// ── Inventory ─────────────────────────────────────────────────────
document.getElementById('invToggle').addEventListener('click', () => {
  const inv = document.getElementById('inventory');
  inv.classList.toggle('open');
  document.getElementById('invArrow').textContent =
    inv.classList.contains('open') ? '▴' : '▾';
});

// ── Settings ──────────────────────────────────────────────────────
settingsBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const r = settingsBtn.getBoundingClientRect();
  settingsMenu.style.top  = (r.bottom + 6) + 'px';
  settingsMenu.style.left = r.left + 'px';
  settingsMenu.classList.toggle('hidden');
});
document.addEventListener('click', () => settingsMenu.classList.add('hidden'));
document.getElementById('helpBtn').addEventListener('click', () => settingsMenu.classList.add('hidden'));
document.getElementById('restartBtn').addEventListener('click', () => settingsMenu.classList.add('hidden'));
document.getElementById('backBtn').addEventListener('click', () => {
  settingsMenu.classList.add('hidden');
  window.location.href = '../../index.html';
});

// About overlay
const aboutOverlay = document.getElementById('aboutOverlay');
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

function esc(s) {
  return String(s||'').replace(/[&<>"']/g,
    c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
}
