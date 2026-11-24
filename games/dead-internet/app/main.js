// @ts-check
// Boot: load the world with fetch, restore or start a game, and hand it to the phone.

import { loadContent } from "../core/content.js";
import { buildWorld } from "../core/world.js";
import { Game } from "../core/game.js";
import { serialize, deserialize, saveTo, loadFrom, clearSave } from "../core/save.js";
import { loadCatalog } from "./media.js";
import { Phone } from "./phone.js";
import { h } from "./ui.js";

const root = /** @type {HTMLElement} */ (document.getElementById("phone"));
const CONTENT = new URL("../content/", import.meta.url).href;

/** localStorage can throw (private mode, blocked storage). Fall back to memory. */
function storage() {
  try { const k = "__di_test"; localStorage.setItem(k, "1"); localStorage.removeItem(k); return localStorage; }
  catch {
    const m = new Map();
    return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) };
  }
}
const store = storage();

let world, phone;

async function boot() {
  try {
    const [raw] = await Promise.all([
      loadContent(p => fetch(CONTENT + p).then(r => { if (!r.ok) throw new Error(`${p}: ${r.status}`); return r.json(); })),
      loadCatalog(),
    ]);
    world = buildWorld(raw);
  } catch (err) {
    root.replaceChildren(h("div.boot", h("b", "Couldn't load the game."), h("div", String(err?.message || err))));
    return;
  }
  let saved = null;
  try { saved = loadFrom(store, world); } catch (err) { console.warn("Save could not be read:", err); }
  if (saved) run(new Game(world, { state: saved.state }), false);
  else intro();
}

function intro() {
  const S = world.strings.intro;
  const name = /** @type {HTMLInputElement} */ (h("input.name-input", { type: "text", maxlength: 20, autocomplete: "off", autocapitalize: "words",
    placeholder: world.meta.player?.defaultName || "Sam", "aria-label": S.namePrompt }));
  const start = e => {
    e.preventDefault();
    const playerName = name.value.trim().replace(/\s+/g, " ").slice(0, 20) || world.meta.player?.defaultName || "Sam";
    const g = new Game(world, { seed: (Date.now() % 2147483647) >>> 0, playerName });
    g.start();
    run(g, true);
  };
  root.replaceChildren(h("div.intro",
    h("div.intro-top", h("h1", S.title), h("div.tagline", S.tagline)),
    h("p.intro-text", S.text),
    h("form.intro-form", { onsubmit: start }, h("label", S.namePrompt, name), h("button.btn.primary", { type: "submit" }, S.start))));
}

function run(game, fresh) {
  game.on("state", () => saveTo(store, world, game.s));
  saveTo(store, world, game.s);
  phone = new Phone(root, game, {
    restart() { clearSave(store, world); location.reload(); },
    exportSave() {
      const blob = new Blob([serialize(game.s)], { type: "application/json" });
      const a = h("a", { href: URL.createObjectURL(blob), download: `dead-internet-day${game.s.day}.json` });
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    },
    async importSave(file) {
      try {
        const { state, warnings } = deserialize(world, await file.text());
        if (warnings.length) console.info("Import:", warnings);
        saveTo(store, world, state);
        location.reload();
      } catch (err) { phone.toast(`Import failed: ${err?.message || err}`); }
    },
  });
  phone.lock();
  /** @type {any} */ (window).deadInternet = { game, phone, world };
}

boot();
