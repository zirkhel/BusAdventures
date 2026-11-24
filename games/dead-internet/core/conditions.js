// @ts-check
// Declarative conditions used by rules, dialogue, artifacts and endings.
// A condition is an object; every key must hold. An array means "all of".
//
//   { flag: "x" }                      { flagFalse: ["x", "y"] }
//   { counterGte: { id, n } }          { counterLt: { id, n } }
//   { dayGte: 3 }  { dayLt: 8 }
//   { trustGte: { id, n } }            { trustLt: { id, n } }
//   { credibilityGte: 40 }             { credibilityLt: 40 }
//   { seen: "A05" }  { notSeen: "A05" } { saved: "A05" }
//   { visible: "A21" }                 { live: "A21" }  (has a live version)
//   { accountActive: "acc_x" }         { loggedIn: "brightline_portal" }
//   { known: "brightline" }            (entity or account known to the player)
//   { exposed: "S2" } or { exposed: { claim, channel?, beforeDay?, beforeCaseDay?, allowWeak? } }
//                                      beforeCaseDay counts from the day the case started (day 1)
//   { caseActive: "id" } { caseClosed: "id" } { caseStarted: "id" }   (case states, core/cases.js)
//   { published: "F1" }                (any publication of that claim, true or not)
//   { reportsGte: 1 } { reportsLt: 1 }
//   { all: [...] } { any: [...] } { not: {...} }

import { asArray } from "./util.js";

export const CONDITION_KEYS = new Set([
  "all", "any", "not", "flag", "flagFalse", "counterGte", "counterLt", "dayGte", "dayLt",
  "trustGte", "trustLt", "credibilityGte", "credibilityLt", "seen", "notSeen", "saved",
  "visible", "live", "accountActive", "loggedIn", "known", "exposed", "published",
  "reportsGte", "reportsLt", "caseActive", "caseClosed", "caseStarted",
]);

/**
 * @typedef {object} CondCtx
 * @property {any} s                       state
 * @property {(id:string)=>number} trust
 * @property {(id:string)=>boolean} isVisible
 * @property {(id:string)=>boolean} isLive
 * @property {(id:string)=>boolean} accountActive
 * @property {number} [caseStart]          day the current case started (rules and endings of a mystery)
 */

/** @param {any} cond @param {CondCtx} ctx @returns {boolean} */
export function check(cond, ctx) {
  if (cond == null) return true;
  if (Array.isArray(cond)) return cond.every(c => check(c, ctx));
  for (const [k, v] of Object.entries(cond)) if (!test(k, v, ctx)) return false;
  return true;
}

function test(k, v, ctx) {
  const s = ctx.s;
  switch (k) {
    case "all": return asArray(v).every(c => check(c, ctx));
    case "any": return asArray(v).some(c => check(c, ctx));
    case "not": return !check(v, ctx);
    case "flag": return asArray(v).every(f => !!s.flags[f]);
    case "flagFalse": return asArray(v).every(f => !s.flags[f]);
    case "counterGte": return (s.counters[v.id] || 0) >= v.n;
    case "counterLt": return (s.counters[v.id] || 0) < v.n;
    case "dayGte": return s.day >= v;
    case "dayLt": return s.day < v;
    case "trustGte": return ctx.trust(v.id) >= v.n;
    case "trustLt": return ctx.trust(v.id) < v.n;
    case "credibilityGte": return s.credibility >= v;
    case "credibilityLt": return s.credibility < v;
    case "seen": return asArray(v).every(id => id in s.seen);
    case "notSeen": return asArray(v).every(id => !(id in s.seen));
    case "saved": return asArray(v).every(id => s.evidence.some(e => e.artifact === id));
    case "visible": return asArray(v).every(id => ctx.isVisible(id));
    case "live": return asArray(v).every(id => ctx.isLive(id));
    case "accountActive": return asArray(v).every(id => ctx.accountActive(id));
    case "loggedIn": return !!s.loggedIn[v];
    case "known": return asArray(v).every(id => !!s.known[id]);
    case "exposed": {
      const spec = typeof v === "string" ? { claim: v } : v;
      const e = s.exposed[spec.claim];
      if (!e) return false;
      if (e.strength !== "strong" && !spec.allowWeak) return false;
      if (spec.channel && !asArray(spec.channel).includes(e.channel)) return false;
      if (spec.beforeDay != null && !(e.day < spec.beforeDay)) return false;
      if (spec.beforeCaseDay != null && !(e.day - (ctx.caseStart ?? 1) + 1 < spec.beforeCaseDay)) return false;
      return true;
    }
    case "published": return asArray(v).every(c => c in s.published);
    case "reportsGte": return s.reports.length >= v;
    case "reportsLt": return s.reports.length < v;
    case "caseActive": return asArray(v).every(id => s.cases?.[id]?.status === "active");
    case "caseClosed": return asArray(v).every(id => s.cases?.[id]?.status === "closed");
    case "caseStarted": return asArray(v).every(id => ["active", "closed"].includes(s.cases?.[id]?.status));
    default: throw new Error(`Unknown condition "${k}"`);
  }
}
