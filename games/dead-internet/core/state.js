// @ts-check
// Everything that changes during play lives in one plain, serialisable object.
// The world (authored content) is never modified; the state only stores differences.

import { initCases } from "./cases.js";
import { initMedia } from "./feed.js";
import { emptyBrowserState } from "./browser.js";

export const SAVE_VERSION = 9;

/**
 * @param {any} w world from buildWorld()
 * @param {{seed?:number, playerName?:string}} [opts]
 */
export function createState(w, opts = {}) {
  const trust = {};
  for (const c of w.characters.values()) trust[c.id] = c.trust?.start ?? 0;
  const known = {};
  // Universe premise only. Each mystery adds its own premise when it starts (core/cases.js).
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
    /** mystery id → { status: locked|available|active|closed, startedDay?, closedDay? } */
    cases: initCases(w),
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
    /** Discovery (see core/discovery.js). known = investigated: drives topics, theory pickers, suggestions */
    known,
    /** entity or account id → day it first appeared in content the player opened */
    encountered: Object.fromEntries(Object.keys(known).map(id => [id, w.meta.startDay ?? 1])),
    /** entity or account id → day the player saved it to the Casebook */
    saved: {},
    /** queries typed, in order */
    searches: [],
    /** all direct messages, both directions */
    messages: [],
    /** effects scheduled for a later day: { day, effects, source } */
    pending: [],
    /** notifications for the presentation layer: { id, day, text, ref? , read } */
    notifications: [],
    /** casebook. Every item has cases: [] (empty = unclassified, see core/cases.js) */
    evidence: [],
    hypotheses: [],
    notes: [],
    /** the player's own open questions (core/workbench.js), shown in Notes. Never read by rules */
    questions: [],
    /** the player's own timeline of events (core/timeline.js) */
    timeline: [],
    /** published reports, each about exactly one case */
    reports: [],
    /** claim key → { day, channel } for every claim ever published */
    published: {},
    /** claim id → { day, channel, strength } for true claims published with support */
    exposed: {},
    /** site id → true */
    loggedIn: {},
    /** feeds: follows, likes, "not interested" (account/artifact id → day). Never read by rules for consequences */
    media: initMedia(),
    /** Browser bookmarks and text size (core/browser.js). The forward stack is session-only. */
    browser: emptyBrowserState(),
    /** "rule:<id>" / "resp:<char>:<id>" → day fired, for once-only behaviour */
    fired: {},
    endings: [],
    /** action log for replay and debugging */
    log: [],
  };
}

export function newId(s, prefix) { return `${prefix}${s.nextId++}`; }
