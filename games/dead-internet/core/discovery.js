// @ts-check
// What the player knows about people, organisations, accounts and places. Kept apart from
// the world, which knows everything.
//
//   unknown       exists in the world, never met
//   encountered   appeared in content the player opened (a name in an article, a message)
//   investigated  the player did something with it: searched for it, opened its profile,
//                 picked an action on it, or it wrote to them              (state: s.known)
//   saved         the player saved it to the Casebook                       (state: s.saved)
//
// Only investigated and saved things reach the player's tools: conversation topics,
// theory pickers, search suggestions, Casebook groups. Opening an article only encounters.

import { scanText, accountForHandle } from "./refs.js";

/** Can this id ever be shown to the player as a topic? */
export function isPublicRef(g, id) {
  if (!id) return false;
  if (g.w.entities.has(id)) return !g.w.entities.get(id).secret;
  return g.w.accounts.has(id);
}

export function encounter(g, id) {
  if (!isPublicRef(g, id)) return;
  if (g.s.encountered[id] == null) g.s.encountered[id] = g.s.day;
}

/** Mark as investigated. Returns false for secrets and unknown ids. */
export function markInvestigated(g, id) {
  if (!isPublicRef(g, id)) return false;
  encounter(g, id);
  g.s.known[id] = true;
  return true;
}

/** @returns {"unknown"|"encountered"|"investigated"|"saved"} */
export function discoveryState(g, id) {
  if (g.s.saved[id] != null) return "saved";
  if (g.s.known[id]) return "investigated";
  if (g.s.encountered[id] != null) return "encountered";
  return "unknown";
}

/** Does a text spell out this id's own name or handle (not an alias)? */
export function namesExactly(g, id, text) {
  const t = String(text || "").trim().toLowerCase().replace(/^@/, "");
  if (!t) return false;
  const e = g.w.entities.get(id);
  if (e) return e.name.toLowerCase() === t;
  const acc = g.w.accounts.get(id);
  return !!acc && (String(acc.handle).toLowerCase().replace(/^@/, "") === t || String(acc.displayName || "").toLowerCase() === t);
}

/**
 * The player acts on a name (context menu). Allowed for what they have met, or when the text
 * they acted on is the name itself. Never for secrets.
 */
export function investigate(g, id, text) {
  if (!isPublicRef(g, id)) return { error: "unknown_ref" };
  const met = g.s.encountered[id] != null || g.s.known[id] || g.s.saved[id] != null;
  if (!met && !namesExactly(g, id, text)) return { error: "not_encountered" };
  markInvestigated(g, id);
  return { ok: true, id };
}

/**
 * A typed search investigates the names in the query when the search finds something, or when
 * the player has met them already. An alias only counts for something already met, so guessing
 * a nickname never tells the player whose it is.
 */
export function investigateQuery(g, query, hadResults) {
  // A handle typed without its @ still names the account.
  for (const tok of String(query).split(/\s+/)) {
    const acc = tok.length > 2 ? accountForHandle(g.w, tok.replace(/[.,;:!?]+$/, "")) : null;
    if (acc && (hadResults || g.s.encountered[acc] != null)) markInvestigated(g, acc);
  }
  for (const sp of scanText(g.w, query)) {
    if (!sp.id || !isPublicRef(g, sp.id)) continue;
    const met = g.s.encountered[sp.id] != null || g.s.known[sp.id];
    if (sp.alias ? met : (met || hadResults)) markInvestigated(g, sp.id);
  }
}

/** Version 1 saves marked everything mentioned in opened content as known. Rebuild the split. */
export function migrateDiscovery(s, w) {
  const all = s.known || {};
  s.encountered = {};
  for (const id of Object.keys(all)) s.encountered[id] = s.day ?? 1;
  s.saved = {};
  const known = {};
  const add = id => { if (id && (w.entities.has(id) || w.accounts.has(id)) && !w.entities.get(id)?.secret) known[id] = true; };
  for (const id of w.meta.startKnown || []) add(id);
  for (const m of s.messages || []) {
    if (m.from === "player" && m.kind === "ask") add(m.topic);
    const c = w.characters.get(m.thread);
    if (c) { add(c.entity); add(c.account); }
  }
  for (const id of Object.keys(s.seen || {})) { const a = w.artifacts.get(id); if (a?.type === "profile") add(a.author); }
  for (const h of s.hypotheses || []) { add(h.subject); add(h.object); }
  for (const q of s.searches || []) for (const sp of scanText(w, q.q)) if (sp.id && !sp.alias && all[sp.id]) add(sp.id);
  s.known = known;
  for (const id of Object.keys(known)) if (s.encountered[id] == null) s.encountered[id] = s.day ?? 1;
  return s;
}
