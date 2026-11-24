// @ts-check
// Rules and effects: the simulation. The world changes only through effects, and effects
// run only when a rule fires, a character responds, or an ending is reached.
//
// Rule:   { id, when: { event, match? }, if?, do: [effects], once?: true, case? }
//         A rule from a mystery pack has `case`: it only runs once that case has started, and
//         day.start gets `caseDay` (1 on the day the case started) to match on.
// Events: game.start, day.start {day}, search {query, terms, platform}, artifact.open {artifact, version},
//         message.send {to, kind, topic?, artifact?, option?}, evidence.save {artifact},
//         image.search {image, flip}, login {site}, report.published {channel, case, claims},
//         case.start {case}, video.view {artifact, platform}, video.like {artifact},
//         feed.scroll {platform, tab, offset}. Feed events are for mood only: the validator
//         lets their rules send messages and notifications, nothing with consequences.
// match:  each key must equal the payload value; an array means "any of"; if the payload
//         value is an array, it must contain the expected value.
//
// Effects (each is an object with one key):
//   setFlag, clearFlag, incCounter {id,n?}, setCounter {id,n}, trust {id,delta},
//   credibility <delta>, show <artifact> (a `datedOnShow` artifact is dated that day), hide <artifact>, setLive {artifact, version|null},
//   deleteAccount <account>, restoreAccount <account>, logout <site>,
//   message {from|fromAccount, text, attach?, supports?, source?, mentions?},
//   notify {text, ref? | from? (platform id)}, know <entity|account>, later {days, do:[effects]}

import { asArray, fill } from "./util.js";
import { check } from "./conditions.js";

export const EFFECT_KEYS = new Set([
  "setFlag", "clearFlag", "incCounter", "setCounter", "trust", "credibility", "show", "hide",
  "setLive", "deleteAccount", "restoreAccount", "logout", "message", "notify", "know", "later",
]);

function matchValue(expected, actual) {
  if (Array.isArray(expected)) return expected.some(e => matchValue(e, actual));
  if (Array.isArray(actual)) return actual.includes(expected);
  return expected === actual;
}

export function matches(match, payload) {
  for (const [k, v] of Object.entries(match || {})) if (!matchValue(v, payload?.[k])) return false;
  return true;
}

/** Fire an event: run every matching rule in authored order. */
export function fire(g, event, payload = {}) {
  for (const r of g.w.rules) {
    if (r.when?.event !== event) continue;
    let p = payload, ctx = g.ctx;
    if (r.case) {
      const c = g.s.cases?.[r.case];
      if (!c || (c.status !== "active" && c.status !== "closed")) continue;
      p = event === "day.start" ? { ...payload, caseDay: g.s.day - c.startedDay + 1 } : payload;
      ctx = g.caseCtx(r.case);
    }
    if (!matches(r.when.match, p)) continue;
    const key = `rule:${r.id}`;
    if (r.once !== false && g.s.fired[key] != null) continue; // rules are once-only unless once:false
    if (r.if && !check(r.if, ctx)) continue;
    g.s.fired[key] = g.s.day;
    applyEffects(g, r.do, { rule: r.id });
  }
}

/** Apply a list of effects. `src` is only used for debugging and pending entries. */
export function applyEffects(g, effects, src = {}) {
  const s = g.s;
  for (const eff of asArray(effects)) {
    for (const [k, v] of Object.entries(eff)) {
      switch (k) {
        case "setFlag": for (const f of asArray(v)) s.flags[f] = true; break;
        case "clearFlag": for (const f of asArray(v)) delete s.flags[f]; break;
        case "incCounter": s.counters[v.id] = (s.counters[v.id] || 0) + (v.n ?? 1); break;
        case "setCounter": s.counters[v.id] = v.n; break;
        case "trust": {
          const c = g.w.characters.get(v.id);
          const min = c?.trust?.min ?? -10, max = c?.trust?.max ?? 10;
          s.trust[v.id] = Math.max(min, Math.min(max, (s.trust[v.id] ?? 0) + v.delta));
          break;
        }
        case "credibility": s.credibility = Math.max(0, Math.min(100, s.credibility + v)); break;
        case "show": for (const id of asArray(v)) { const o = s.artifacts[id]; s.artifacts[id] = { ...o, visible: true, wasVisible: true, ...(g.w.artifacts.get(id)?.datedOnShow && !o?.shownOn ? { shownOn: g.date } : {}) }; } g.emit("artifact.changed", { ids: asArray(v) }); break;
        case "hide": for (const id of asArray(v)) { s.artifacts[id] = { ...s.artifacts[id], visible: false, wasVisible: true }; } g.emit("artifact.changed", { ids: asArray(v) }); break;
        case "setLive": s.artifacts[v.artifact] = { ...s.artifacts[v.artifact], live: v.version ?? null }; g.emit("artifact.changed", { ids: [v.artifact] }); break;
        case "deleteAccount": for (const id of asArray(v)) s.accounts[id] = { ...s.accounts[id], deleted: true }; g.emit("account.changed", { ids: asArray(v) }); break;
        case "restoreAccount": for (const id of asArray(v)) s.accounts[id] = { ...s.accounts[id], deleted: false }; break;
        case "logout": delete s.loggedIn[v]; break;
        case "message": g.receiveMessage(v); break;
        case "notify": g.notify(typeof v === "string" ? { text: v } : v); break;
        case "know": for (const id of asArray(v)) s.known[id] = true; break;
        case "later": s.pending.push({ day: s.day + (v.days ?? 1), effects: v.do, src }); break;
        default: throw new Error(`Unknown effect "${k}"`);
      }
    }
  }
}

/** Run effects scheduled for the current day. */
export function runPending(g) {
  const due = g.s.pending.filter(p => p.day <= g.s.day);
  g.s.pending = g.s.pending.filter(p => p.day > g.s.day);
  for (const p of due) applyEffects(g, p.effects, p.src);
}

export function text(g, t) { return fill(t, { player: g.s.playerName }); }
