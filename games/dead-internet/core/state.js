// @ts-check
// Everything that changes during play lives in one plain, serialisable object.
// The world (authored content) is never modified; the state only stores differences.

export const SAVE_VERSION = 1;

/**
 * @param {any} w world from buildWorld()
 * @param {{seed?:number, playerName?:string}} [opts]
 */
export function createState(w, opts = {}) {
  const trust = {};
  for (const c of w.characters.values()) trust[c.id] = c.trust?.start ?? 0;
  const known = {};
  for (const id of w.meta.startKnown || []) known[id] = true;
  const name = (opts.playerName || "").trim() || w.meta.player?.defaultName || "Sam";
  return {
    saveVersion: SAVE_VERSION,
    worldId: w.meta.id,
    contentVersion: w.meta.contentVersion,
    seed: opts.seed ?? 1,
    rng: (opts.seed ?? 1) >>> 0,
    playerName: name,
    started: false,
    day: w.meta.startDay ?? 1,
    nextId: 1,
    flags: {},
    counters: {},
    trust,
    credibility: w.meta.credibilityStart ?? 50,
    /** artifact id → { visible?:boolean, live?:string|null, wasVisible?:boolean } */
    artifacts: {},
    /** account id → { deleted?:boolean } */
    accounts: {},
    /** artifact id → day first opened */
    seen: {},
    /** entity or account id → true; drives which topics the player can ask about */
    known,
    /** queries typed, in order */
    searches: [],
    /** all direct messages, both directions */
    messages: [],
    /** effects scheduled for a later day: { day, effects, source } */
    pending: [],
    /** notifications for the presentation layer: { id, day, text, ref? , read } */
    notifications: [],
    /** casebook */
    evidence: [],
    hypotheses: [],
    notes: [],
    reports: [],
    /** claim key → { day, channel } for every claim ever published */
    published: {},
    /** claim id → { day, channel, strength } for true claims published with support */
    exposed: {},
    /** site id → true */
    loggedIn: {},
    /** "rule:<id>" / "resp:<char>:<id>" → day fired, for once-only behaviour */
    fired: {},
    endings: [],
    /** action log for replay and debugging */
    log: [],
  };
}

export function newId(s, prefix) { return `${prefix}${s.nextId++}`; }
