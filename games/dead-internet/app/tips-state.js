// @ts-check
// Tip preferences and the one-at-a-time queue, without any DOM, so they can be tested in Node.
// Preferences are per device (localStorage), not part of a save: loading a save or reloading the
// app keeps them, and the save format is unchanged (no migration). A new game (Start over) turns
// tips on again and forgets which were seen.

export const TIPS_KEY = "ba_deadinternet_tips";

/** @typedef {{off:boolean, seen:string[], introDone:boolean}} TipPrefs */

/** @returns {TipPrefs} */
export function defaultPrefs() { return { off: false, seen: [], introDone: false }; }

/** Reads stored preferences; anything missing or broken falls back to the defaults. */
export function loadPrefs(storage) {
  const p = defaultPrefs();
  try {
    const raw = JSON.parse(storage?.getItem(TIPS_KEY) || "{}");
    if (typeof raw.off === "boolean") p.off = raw.off;
    if (Array.isArray(raw.seen)) p.seen = raw.seen.filter(k => typeof k === "string");
    if (typeof raw.introDone === "boolean") p.introDone = raw.introDone;
  } catch { /* storage blocked or broken: defaults */ }
  return p;
}

export function savePrefs(storage, p) { try { storage?.setItem(TIPS_KEY, JSON.stringify(p)); } catch { /* keep in memory */ } }

/** "Show intro tips again": forgets which tips were seen. Nothing else changes, nothing is shown now. */
export function resetSeen(p) { return { ...p, seen: [] }; }

/** A new game: tips on, none seen, the introduction again. */
export function newGamePrefs() { return defaultPrefs(); }

/**
 * Which tip is on screen, and which wait for it. A tip is offered for the screen (anchor) where
 * its mechanic is used. If another tip is showing, it waits in line; when the shown tip is
 * dismissed, the next one waiting for the same screen appears. Tips for a screen the player has
 * left are dropped unseen, so they come back the next time that mechanic is used. Never more
 * than one at a time.
 */
export class TipFlow {
  /** @param {TipPrefs} prefs @param {(p:TipPrefs)=>void} [persist] */
  constructor(prefs, persist = () => {}) {
    this.p = prefs; this.persist = persist;
    /** @type {string|null} */ this.current = null;
    /** @type {any} */ this.anchor = null;
    /** @type {{key:string, anchor:any}[]} */ this.queue = [];
  }

  #can(key) { return !this.p.off && this.p.introDone && !this.p.seen.includes(key); }

  /** @returns {"shown"|"queued"|"skipped"} Shown means: put it on screen now (it is marked seen). */
  offer(key, anchor = null) {
    if (!this.#can(key) || this.current === key || this.queue.some(q => q.key === key)) return "skipped";
    if (this.current) { this.queue.push({ key, anchor }); return "queued"; }
    this.#show(key, anchor);
    return "shown";
  }

  #show(key, anchor) { this.current = key; this.anchor = anchor; this.p.seen.push(key); this.persist(this.p); }

  /** The player moved to another screen: tips for other screens go (shown ones stay seen). */
  follow(anchor) {
    this.queue = this.queue.filter(q => q.anchor === anchor);
    if (this.current && this.anchor !== anchor) { this.current = null; this.anchor = null; return this.#next(); }
    return null;
  }

  /** The shown tip was dismissed. Returns the next key to show, if one waits for this screen. */
  dismiss() { const a = this.anchor; this.current = null; this.anchor = null; this.queue = this.queue.filter(q => q.anchor === a); return this.#next(); }

  #next() {
    while (this.queue.length) {
      const q = /** @type {{key:string, anchor:any}} */ (this.queue.shift());
      if (this.#can(q.key)) { this.#show(q.key, q.anchor); return q.key; }
    }
    return null;
  }

  setOn(on) { this.p.off = !on; if (!on) { this.current = null; this.anchor = null; this.queue = []; } this.persist(this.p); }
  resetSeen() { this.p.seen = []; this.queue = []; this.persist(this.p); }
}
