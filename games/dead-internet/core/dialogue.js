// @ts-check
// Scripted conversations. The player never types free text to a character: they ask about
// something they know (an entity or account), show something they have read, or pick a
// reply option when one is offered. The character answers from an authored response table.
//
// Character:
//   { id, entity, account, kind: "person"|"autopilot", source, trust:{start,min,max},
//     knows:[claim], believes:[claim], has:[artifact], contactIf?, silentIf?,
//     prompts?: [{ id, label, if? }],
//     responses: [{ id, on, if?, once?, text, attach?, supports?, mentions?, effects?, delayDays? }],
//     fallback?: { ask?:[{if?,text}], show?:[...], reply?:[...], any?:[...] } }
//   on: { any:true } | { ask: id|[ids] } | { show: artifact|[...] } | { showSupports: claim|[...] } | { reply: option }
//
// The engine, not the text, decides what a character reveals: attachments and supports are
// data, and the validator checks them against what the character knows and has.

import { asArray } from "./util.js";
import { check } from "./conditions.js";
import { applyEffects, fire } from "./rules.js";
import { supportsOf } from "./artifacts.js";
import { nameOf, str } from "./world.js";
import { fill } from "./util.js";

export function canContact(g, charId) {
  const c = g.w.characters.get(charId);
  if (!c) return false;
  if (g.w.disabled?.has(charId)) return false;
  if (c.account && g.s.accounts[c.account]?.deleted && !c.contactAfterDelete) return false;
  if (g.s.messages.some(m => m.thread === charId)) return true;
  if (c.contactIf) return check(c.contactIf, g.ctx);
  const profile = c.account ? g.w.profileOf.get(c.account) : null;
  return !!(profile && g.s.seen[profile] != null) || !!g.s.known[c.account];
}

export function availablePrompts(g, charId) {
  const c = g.w.characters.get(charId);
  return asArray(c?.prompts).filter(p => check(p.if, g.ctx) && !g.s.fired[`prompt:${charId}:${p.id}`]);
}

function matchesOn(g, on, msg) {
  if (!on) return false;
  if (on.any) return true;
  if (on.ask != null) return msg.kind === "ask" && asArray(on.ask).includes(msg.topic);
  if (on.show != null) return msg.kind === "show" && asArray(on.show).includes(msg.artifact);
  if (on.showSupports != null) return msg.kind === "show" && asArray(on.showSupports).some(cl => msg.supports.includes(cl));
  if (on.reply != null) return msg.kind === "reply" && asArray(on.reply).includes(msg.option);
  return false;
}

/**
 * Player sends a message. Returns { ok, reply? } or { error }.
 * @param {any} g
 * @param {string} charId
 * @param {{kind:"ask"|"show"|"reply", topic?:string, artifact?:string, version?:string, option?:string}} msg
 */
export function sendMessage(g, charId, msg) {
  const c = g.w.characters.get(charId);
  if (!c) return { error: "unknown_character" };
  if (!canContact(g, charId)) return { error: "cannot_contact" };

  let playerText;
  const m = { ...msg, supports: [] };
  if (msg.kind === "ask") {
    if (!msg.topic || !g.s.known[msg.topic]) return { error: "unknown_topic" };
    playerText = fill(str(g.w, "messages.ask"), { name: nameOf(g.w, msg.topic) });
  } else if (msg.kind === "show") {
    if (!msg.artifact || g.s.seen[msg.artifact] == null) return { error: "not_seen" };
    m.supports = supportsOf(g, msg.artifact, msg.version);
    playerText = fill(str(g.w, "messages.show"), { title: nameOf(g.w, msg.artifact) });
  } else if (msg.kind === "reply") {
    const p = availablePrompts(g, charId).find(p => p.id === msg.option);
    if (!p) return { error: "no_such_option" };
    g.s.fired[`prompt:${charId}:${p.id}`] = g.s.day;
    playerText = p.label;
  } else return { error: "bad_kind" };

  g.s.messages.push({ id: `M${g.s.nextId++}`, thread: charId, from: "player", day: g.s.day, text: playerText,
    kind: msg.kind, topic: msg.topic ?? null, artifact: msg.artifact ?? null, version: msg.version ?? null, attach: [], supports: [] });

  let reply = null;
  if (!(c.silentIf && check(c.silentIf, g.ctx))) reply = resolveResponse(g, c, m);

  fire(g, "message.send", { to: charId, kind: msg.kind, topic: msg.topic, artifact: msg.artifact, option: msg.option, supports: m.supports });
  return { ok: true, reply };
}

function resolveResponse(g, c, m) {
  for (const r of asArray(c.responses)) {
    if (!matchesOn(g, r.on, m)) continue;
    const key = `resp:${c.id}:${r.id}`;
    if (r.once && g.s.fired[key] != null) continue;
    if (r.if && !check(r.if, g.ctx)) continue;
    g.s.fired[key] = g.s.day;
    const message = r.text == null ? null : {
      from: c.id, text: r.text, attach: asArray(r.attach), supports: asArray(r.supports),
      source: r.source ?? c.source ?? c.id, mentions: asArray(r.mentions),
    };
    if (r.delayDays) {
      const later = [...asArray(r.effects)];
      if (message) later.unshift({ message });
      applyEffects(g, [{ later: { days: r.delayDays, do: later } }], { response: key });
      return { pending: true };
    }
    if (message) g.receiveMessage(message);
    applyEffects(g, r.effects, { response: key });
    return message ? { text: message.text } : null;
  }
  const list = [...asArray(c.fallback?.[m.kind]), ...asArray(c.fallback?.any)];
  const fb = list.find(f => check(f.if, g.ctx));
  if (fb) { g.receiveMessage({ from: c.id, text: fb.text, attach: [], supports: [], source: c.source ?? c.id }); return { text: fb.text }; }
  return null;
}

/** Thread with one character, oldest first. */
export function thread(g, charId) { return g.s.messages.filter(m => m.thread === charId); }

/** Characters the player can message right now. */
export function contacts(g) { return [...g.w.characters.keys()].filter(id => canContact(g, id)); }

