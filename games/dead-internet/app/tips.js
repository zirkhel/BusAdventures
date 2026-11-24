// @ts-check
// Introduction and contextual tips. Universal: the texts (strings.tips) talk about the phone and
// the ways of investigating, never about people, places, cases or answers, so they hold for every
// mystery. A tip shows once, the first time a mechanic is used, in a small card that does not
// block the screen. Tips can be turned off, read again and reset from Settings.
// Preferences are per device (not per save): they are about the player, not the game.

import { h, icon } from "./ui.js";

const KEY = "ba_deadinternet_tips";

export class Tips {
  /** @param {any} phone */
  constructor(phone) {
    this.phone = phone;
    /** @type {{off:boolean, seen:string[], introDone:boolean}} */
    this.p = { off: false, seen: [], introDone: false };
    try { Object.assign(this.p, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch { /* storage blocked: defaults */ }
    this.box = h("div.tipbox", { role: "status", "aria-live": "polite" });
    /** Key of the tip on screen, if any. */
    this.current = null;
  }

  get S() { return this.phone.g.w.strings.tips || {}; }
  #save() { try { localStorage.setItem(KEY, JSON.stringify(this.p)); } catch { /* keep in memory */ } }

  get on() { return !this.p.off; }
  setOn(on) { this.p.off = !on; if (!on) this.hide(); this.#save(); }
  reset() { this.p.seen = []; this.p.off = false; this.#save(); }
  /** Keys of all tips, in the order they are listed. */
  keys() { return Object.keys(this.S.list || {}); }

  /**
   * The first time a mechanic is used. Does nothing if tips are off, the tip was shown before,
   * the introduction has not been dismissed yet, or another tip is on screen (it comes back
   * the next time the mechanic is used).
   */
  trigger(key, anchor = null) {
    const t = this.S.list?.[key];
    if (!t || this.p.off || !this.p.introDone || this.p.seen.includes(key) || this.current) return;
    this.p.seen.push(key); this.#save();
    this.current = key;
    /** The screen the tip belongs to: it goes away when the player moves on. */
    this.anchor = anchor;
    this.box.replaceChildren(h("div.tip", { "data-tip": key },
      h("div.tip-head", icon("info"), h("b", t.title)),
      h("div.tip-text", t.text),
      h("div.tip-btns",
        h("button.tip-off", { onclick: () => this.setOn(false) }, this.S.turnOff),
        h("button.tip-ok", { onclick: () => this.hide() }, this.S.gotIt))));
    this.box.classList.add("on");
    this.phone.root.classList.add("tip-on");   // room below the content, so nothing stays hidden under the card
  }

  /** Called on every render: a tip for an earlier screen is dismissed (it stays seen). */
  follow(anchor) { if (this.current && this.anchor !== anchor) this.hide(); }

  hide() { this.current = null; this.box.classList.remove("on"); this.box.replaceChildren(); this.phone.root.classList.remove("tip-on"); }

  /** The short general introduction, on the first unlock (and from Settings). */
  intro(force = false) {
    if (this.p.introDone && !force) return false;
    const S = this.S, ph = this.phone;
    const done = on => { this.p.introDone = true; if (!force) this.p.off = !on; this.#save(); ph.closeOverlay(); };
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
