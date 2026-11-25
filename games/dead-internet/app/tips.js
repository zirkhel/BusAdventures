// @ts-check
// Introduction and contextual tips. Universal: the texts (strings.tips) talk about the phone and
// the ways of investigating, never about people, places, cases or answers, so they hold for every
// mystery. A tip shows once, the first time a mechanic is used, in a small card that does not
// block the screen, one at a time. Tips can be turned off, read again and shown again from Settings.
// Preferences are per device (not per save): they are about the player, not the game.

import { h, icon } from "./ui.js";
import { TipFlow, loadPrefs, savePrefs, newGamePrefs } from "./tips-state.js";

/** Storage that may be missing or blocked: then preferences live in memory only. */
function store() { try { return globalThis.localStorage; } catch { return null; } }

export class Tips {
  /** @param {any} phone */
  constructor(phone) {
    this.phone = phone;
    this.flow = new TipFlow(loadPrefs(store()), p => savePrefs(store(), p));
    this.box = h("div.tipbox", { role: "status", "aria-live": "polite" });
  }

  get S() { return this.phone.g.w.strings.tips || {}; }
  /** @type {{off:boolean, seen:string[], introDone:boolean}} */
  get p() { return this.flow.p; }
  get current() { return this.flow.current; }

  get on() { return !this.p.off; }
  setOn(on) { this.flow.setOn(on); if (!on) this.#clear(); }
  /** "Show intro tips again": only forgets which tips were seen. They come back one at a time, in context. */
  reset() { this.flow.resetSeen(); }
  /** A new game starts with tips on (called by Start over, before the reload). */
  newGame() { this.flow.p = newGamePrefs(); savePrefs(store(), this.flow.p); }
  /** Keys of all tips, in the order they are listed. */
  keys() { return Object.keys(this.S.list || {}); }

  /**
   * The first time a mechanic is used. Nothing if tips are off, the tip was shown before or the
   * introduction has not been dismissed yet. If another tip is on screen, this one waits its turn
   * (only while the player stays on this screen).
   */
  trigger(key, anchor = null) {
    if (!this.S.list?.[key]) return;
    if (this.flow.offer(key, anchor) === "shown") this.#render(key);
  }

  #render(key) {
    const t = this.S.list[key];
    this.box.replaceChildren(h("div.tip", { "data-tip": key },
      h("div.tip-head", icon("info"), h("b", t.title)),
      h("div.tip-text", t.text),
      h("div.tip-btns",
        h("button.tip-off", { onclick: () => this.setOn(false) }, this.S.turnOff),
        h("button.tip-ok", { onclick: () => this.hide() }, this.S.gotIt))));
    this.box.classList.add("on");
    this.phone.root.classList.add("tip-on");   // room below the content, so nothing stays hidden under the card
  }

  #clear() { this.box.classList.remove("on"); this.box.replaceChildren(); this.phone.root.classList.remove("tip-on"); }
  #after(next) { if (next && this.S.list?.[next]) this.#render(next); else this.#clear(); }

  /** Called on every render: a tip for an earlier screen is dismissed (it stays seen). */
  follow(anchor) { if (this.flow.current && this.flow.anchor !== anchor) this.#after(this.flow.follow(anchor)); else this.flow.follow(anchor); }

  /** Dismissed: the next tip waiting for this screen, if any, takes its place. */
  hide() { this.#after(this.flow.dismiss()); }

  /** The short general introduction, on the first unlock (and from Settings). */
  intro(force = false) {
    if (this.p.introDone && !force) return false;
    const S = this.S, ph = this.phone;
    const done = on => { this.p.introDone = true; if (!force) this.p.off = !on; savePrefs(store(), this.p); ph.closeOverlay(); };
    const box = h("div.sheet.intro-sheet", { role: "dialog", "aria-modal": "true", "aria-label": S.introTitle },
      h("div.it-body",
        h("h2.it-title", S.introTitle),
        h("p.it-lead", S.introLead),
        h("ol.it-points", (S.introPoints || []).map(t => h("li", t)))),
      h("button.sheet-item.it-go", { onclick: () => done(true) }, S.introStart),
      force ? null : h("button.sheet-item.cancel.it-notips", { onclick: () => done(false) }, S.introNoTips));
    ph.overlay.replaceChildren(h("div.sheet-bg", box));
    ph.overlay.classList.add("open");
    return true;
  }

  /** All tips in one list (Settings → Read all tips). */
  all() {
    const S = this.S, ph = this.phone;
    const box = h("div.sheet.tips-all", { role: "dialog", "aria-modal": "true", "aria-label": S.settingsAll },
      h("div.it-body",
        h("h2.it-title", S.settingsAll),
        this.keys().map(k => h("div.ta-item", h("b", S.list[k].title), h("div", S.list[k].text)))),
      h("button.sheet-item.cancel", { onclick: () => ph.closeOverlay() }, S.gotIt));
    const bg = h("div.sheet-bg", { onclick: e => { if (e.target === bg) ph.closeOverlay(); } }, box);
    ph.overlay.replaceChildren(bg);
    ph.overlay.classList.add("open");
  }
}
