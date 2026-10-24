#!/usr/bin/env node
// tools/validate-adventure.mjs
// Checks a text adventure's data against what the engine actually supports.
//
//   node tools/validate-adventure.mjs games/ward-b
//   node tools/validate-adventure.mjs            (all games with data/rooms.js)
//
// ERROR = will misbehave in the game. WARN = probably a mistake. INFO = worth a look.
// Exit code 1 if any ERROR.

import { existsSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";

// ── What the engine understands (keep in sync with engine/*.js) ──────────────

const CONDITION_KEYS = new Set([
  "hasItem", "holdsItem", "wearsItem", "itemHere", "itemNotHere", "itemGone",
  "flag", "flagFalse", "roomFlag", "roomState", "visitGte", "itemInRoom",
  "roomStateOf", "counterGte", "heldTag", "carriedTag", "wearingTag",
]);
const REQUIRES_KEYS = new Set(["hasItem", "holdsItem", "wearsItem", "heldTag", "carriedTag", "flag"]);
const EFFECT_KEYS = new Set([
  "setFlag", "clearFlag", "flagValue", "setRoomFlag", "setGlobalFlag", "setGlobalFlags",
  "clearFlags", "setRoomState", "revealItem", "removeItem", "moveItem", "giveItem",
  "openExit", "setCounter", "incCounter", "goTo", "win", "kill", "killText",
  "deathMedia", "playSound",
]);
const ROOM_KEYS = new Set([
  "title", "gridPosition", "media", "fx", "music", "baseDescription", "firstVisitDescription",
  "descriptionStates", "itemText", "states", "mediaStates", "enterRequires", "enterRules",
  "exits", "hazards", "actions", "objects", "flavourTargets", "win", "deathMedia", "winMedia",
]);
const ITEM_KEYS = new Set([
  "name", "icon", "aliases", "description", "tags", "canCarry", "canHold", "canWear",
  "pickupText", "dropText", "heldText", "wornText", "defaultActions", "contextActions",
]);
const HAZARD_TYPES = new Set(["onEnter", "visitCount", "commandPressure"]);

// ── Collect issues ───────────────────────────────────────────────────────────

async function validate(gameDir) {
  const issues = [];
  const err  = (where, msg) => issues.push(["ERROR", where, msg]);
  const warn = (where, msg) => issues.push(["WARN ", where, msg]);
  const info = (where, msg) => issues.push(["INFO ", where, msg]);

  const imp = f => import(pathToFileURL(join(gameDir, f)).href);
  const { GAME }  = await imp("data/game.js");
  const { ROOMS } = await imp("data/rooms.js");
  const { ITEMS } = await imp("data/items.js");
  let assets = null;
  try { assets = await imp("assets.js"); } catch (e) { err("assets.js", "cannot load: " + e.message); }

  const roomIds = new Set(Object.keys(ROOMS));
  const itemIds = new Set(Object.keys(ITEMS));
  const allTags = new Set(Object.values(ITEMS).flatMap(i => i.tags || []));
  const flagsSet = new Map(), flagsRead = new Map(), countersSet = new Set(), countersRead = new Map();
  const mediaUsed = new Map();          // key → where
  const statesSet = [];                 // [room, state, where]
  const itemSources = new Set();        // items that can enter the world
  const graph = new Map([...roomIds].map(r => [r, new Set()]));

  const note = (map, k, where) => { if (!map.has(k)) map.set(k, where); };
  const useMedia = (k, where) => { if (k) note(mediaUsed, k, where); };
  const room = id => roomIds.has(id);
  const item = id => itemIds.has(id);

  if (!room(GAME.startRoom)) err("game.js", `startRoom "${GAME.startRoom}" is not a room`);
  if (!GAME.id) err("game.js", "missing id (used as save key)");

  // Conditions / requires / effects ------------------------------------------
  function checkCondition(c, where, ctxRoom) {
    if (!c) return;
    for (const [k, v] of Object.entries(c)) {
      if (!CONDITION_KEYS.has(k)) { err(where, `unknown condition key "${k}" (ignored by engine → always true)`); continue; }
      if (["hasItem", "holdsItem", "wearsItem", "itemHere", "itemNotHere", "itemGone"].includes(k) && !item(v))
        err(where, `${k}: unknown item "${v}"`);
      if (k === "itemInRoom") { if (!item(v?.id)) err(where, `itemInRoom: unknown item "${v?.id}"`); if (!room(v?.room)) err(where, `itemInRoom: unknown room "${v?.room}"`); }
      if (k === "flag" || k === "flagFalse") note(flagsRead, v, where);
      if (k === "counterGte") note(countersRead, v?.id, where);
      if (["heldTag", "carriedTag", "wearingTag"].includes(k) && !allTags.has(v)) err(where, `${k}: no item has tag "${v}"`);
      if (k === "wearingTag" && !Object.values(ITEMS).some(i => i.canWear && (i.tags || []).includes(v)))
        err(where, `wearingTag "${v}": no wearable item has this tag`);
      if (k === "heldTag" && !Object.values(ITEMS).some(i => i.canHold && (i.tags || []).includes(v)))
        err(where, `heldTag "${v}": no holdable item has this tag`);
      if (k === "roomState" && ctxRoom && v !== "default" && !ROOMS[ctxRoom]?.states?.[v])
        err(where, `roomState "${v}" not defined in room "${ctxRoom}"`);
      if (k === "roomStateOf") {
        if (!room(v?.room)) err(where, `roomStateOf: unknown room "${v?.room}"`);
        else if (v.state !== "default" && !ROOMS[v.room].states?.[v.state]) err(where, `roomStateOf: state "${v.state}" not in "${v.room}"`);
      }
    }
  }
  function checkRequires(r, where) {
    if (!r) return;
    for (const [k, v] of Object.entries(r)) {
      if (!REQUIRES_KEYS.has(k)) { err(where, `requires.${k} is not supported (ignored → always passes). Use condition or one of: ${[...REQUIRES_KEYS].join(", ")}`); continue; }
      if (["hasItem", "holdsItem", "wearsItem"].includes(k) && !item(v)) err(where, `requires.${k}: unknown item "${v}"`);
      if (["heldTag", "carriedTag"].includes(k) && !allTags.has(v)) err(where, `requires.${k}: no item has tag "${v}"`);
      if (k === "heldTag" && !Object.values(ITEMS).some(i => i.canHold && (i.tags || []).includes(v)))
        err(where, `requires.heldTag "${v}": no holdable item has this tag`);
      if (k === "flag") note(flagsRead, v, where);
    }
  }
  function checkEffects(e, where, ctxRoom) {
    if (!e) return;
    for (const [k, v] of Object.entries(e)) {
      if (!EFFECT_KEYS.has(k)) { err(where, `unknown effect key "${k}" (ignored by engine)`); continue; }
      if (["setFlag", "setGlobalFlag"].includes(k)) note(flagsSet, v, where);
      if (k === "clearFlag") note(flagsSet, v, where);
      if (k === "setGlobalFlags" || k === "clearFlags") [].concat(v).forEach(f => note(flagsSet, f, where));
      if (["revealItem", "giveItem"].includes(k)) { if (!item(v)) err(where, `${k}: unknown item "${v}"`); else itemSources.add(v); }
      if (k === "removeItem" && !item(v)) err(where, `removeItem: unknown item "${v}"`);
      if (k === "moveItem") { if (!item(v?.id)) err(where, `moveItem: unknown item "${v?.id}"`); else itemSources.add(v.id); if (!room(v?.to)) err(where, `moveItem: unknown room "${v?.to}"`); }
      if (k === "setRoomState") { const r = v?.room || ctxRoom; statesSet.push([r, v?.state, where]); }
      if (k === "openExit") { const r = v?.room || ctxRoom; if (!room(v?.to)) err(where, `openExit: unknown room "${v?.to}"`); else if (room(r)) graph.get(r).add(v.to); }
      if (k === "goTo") { if (!room(v)) err(where, `goTo: unknown room "${v}"`); else if (room(ctxRoom)) graph.get(ctxRoom).add(v); }
      if (k === "setCounter" || k === "incCounter") countersSet.add(v?.id);
      if (k === "deathMedia") useMedia(v, where);
    }
    if (e.kill && !e.killText) warn(where, "kill without killText (shows 'You die.')");
  }
  function checkAction(a, where, ctxRoom, kind) {
    if (!a.verbs?.length && kind !== "context") err(where, "action has no verbs (never matches)");
    checkCondition(a.condition, where + ".condition", ctxRoom);
    checkRequires(a.requires, where + ".requires");
    checkEffects(a.effects, where + ".effects", ctxRoom);
    if (a.requires && !a.requiresText && !a.failText) warn(where, "requires without requiresText/failText (generic message)");
    if (kind === "room" && a.failText && !a.requires) info(where, "failText is only shown when requires fails — this action has no requires");
  }

  // Rooms --------------------------------------------------------------------
  for (const [rid, r] of Object.entries(ROOMS)) {
    const W = `rooms.${rid}`;
    for (const k of Object.keys(r)) if (!ROOM_KEYS.has(k)) warn(W, `unknown room field "${k}" (ignored)`);
    if (!r.title) err(W, "missing title");
    if (!r.baseDescription && !r.states?.default?.description) err(W, "no baseDescription and no states.default.description");
    useMedia(r.media || rid, W + ".media");
    useMedia(r.deathMedia, W + ".deathMedia");
    useMedia(r.winMedia, W + ".winMedia");

    // placeholders
    const texts = [r.baseDescription, r.firstVisitDescription, ...Object.values(r.states || {}).map(s => s.description)].filter(Boolean);
    for (const t of texts) for (const m of t.matchAll(/\{(\w+)\}/g))
      if (!r.itemText?.[m[1]]) err(W, `description has {${m[1]}} but no itemText.${m[1]} (shows literally)`);
    for (const id of Object.keys(r.itemText || {})) {
      if (!item(id)) err(`${W}.itemText`, `unknown item "${id}"`);
      itemSources.add(id);
      if (!texts.some(t => t.includes(`{${id}}`))) warn(`${W}.itemText.${id}`, `no {${id}} placeholder in any description (text never shown)`);
    }

    // states
    for (const [sn, s] of Object.entries(r.states || {})) {
      useMedia(s.media, `${W}.states.${sn}.media`);
      if (s.image) err(`${W}.states.${sn}`, `"image" is not read — use "media"`);
    }
    if (r.states && !r.states.default && r.baseDescription === undefined) warn(W, "states without default");
    for (const [i, ms] of (r.mediaStates || []).entries()) {
      checkCondition(ms.condition, `${W}.mediaStates[${i}]`, rid);
      useMedia(ms.media, `${W}.mediaStates[${i}]`);
    }
    for (const [i, ds] of (r.descriptionStates || []).entries()) checkCondition(ds.condition, `${W}.descriptionStates[${i}]`, rid);

    // exits
    const exitSets = [r.exits || {}, ...Object.values(r.states || {}).map(s => s.exits).filter(Boolean)];
    for (const ex of exitSets) for (const [dir, def] of Object.entries(ex)) {
      const to = typeof def === "string" ? def : def?.to;
      if (!room(to)) { err(`${W}.exits.${dir}`, `unknown room "${to}"`); continue; }
      graph.get(rid).add(to);
      if (typeof def === "object") {
        checkCondition(def.condition, `${W}.exits.${dir}`, rid);
        if (def.type === "open") warn(`${W}.exits.${dir}`, `use a plain string for open exits`);
        if (def.hidden && !def.condition) warn(`${W}.exits.${dir}`, "hidden exit without condition (never shown, always usable)");
        if (def.condition && !def.hidden && !def.special && !def.lockedText) warn(`${W}.exits.${dir}`, "locked exit without lockedText");
      }
    }

    // entry
    if (r.enterRequires && /\b(die|dies|dead|death|fall|falls|killed)\b/i.test(r.enterRequires.failText || ""))
      warn(`${W}.enterRequires`, "failText sounds like death, but enterRequires only blocks entry — use a hazard { type: \"onEnter\", safeIf, deathText }");
    if (r.enterRequires) {
      if (r.enterRequires.condition === undefined && !Object.keys(r.enterRequires).some(k => CONDITION_KEYS.has(k)))
        warn(`${W}.enterRequires`, "no condition");
      checkCondition(r.enterRequires.condition || r.enterRequires, `${W}.enterRequires`, rid);
    }
    for (const [i, rule] of (r.enterRules || []).entries()) {
      checkCondition(rule.condition, `${W}.enterRules[${i}]`, rid);
      checkEffects(rule.effects, `${W}.enterRules[${i}]`, rid);
    }

    // hazards
    for (const [i, h] of (r.hazards || []).entries()) {
      const H = `${W}.hazards[${i}]`;
      if (!HAZARD_TYPES.has(h.type)) { err(H, `unknown hazard type "${h.type}"`); continue; }
      useMedia(h.deathMedia, H + ".deathMedia");
      if (h.type === "onEnter") checkCondition(h.safeIf, H + ".safeIf", rid);
      if (h.type === "visitCount") {
        if (h.safeUnder === undefined) err(H, "visitCount without safeUnder (never kills)");
        checkCondition(h.disabledIf, H + ".disabledIf", rid);
        if (h.condition) warn(H, "visitCount ignores condition — use disabledIf");
      }
      if (h.type === "commandPressure") {
        if (h.maxCommands) err(H, "use threshold, not maxCommands");
        if (!h.threshold) err(H, "commandPressure without threshold (never kills)");
        if (!h.counter) warn(H, "no counter id (defaults to pressure_<room>)");
        else countersSet.add(h.counter);
        checkCondition(h.condition, H + ".condition", rid);
        if (h.disabledIf) warn(H, "commandPressure ignores disabledIf — use condition");
      }
      const stages = h.warningStages || [];
      for (let j = 1; j < stages.length; j++) if (stages[j].at <= stages[j - 1].at) warn(H, "warningStages not in ascending order");
      const limit = h.type === "visitCount" ? h.safeUnder : h.type === "commandPressure" ? h.threshold - 1 : null;
      if (limit != null && stages.length && stages[stages.length - 1].at < limit)
        warn(H, `no last warning: final safe step is ${limit} but the last warningStage is at ${stages[stages.length - 1].at} — add { at: ${limit}, text: "..." } so the player knows the next step kills`);
      if (limit != null && !stages.length) warn(H, "deadly hazard with no warningStages");
    }

    // actions / objects / flavour
    for (const [i, a] of (r.actions || []).entries()) checkAction(a, `${W}.actions[${a.id || i}]`, rid, "room");
    for (const [oid, o] of Object.entries(r.objects || {})) {
      if (!o.aliases?.length) warn(`${W}.objects.${oid}`, "no aliases (only the id matches)");
      checkCondition(o.visibleCondition, `${W}.objects.${oid}.visibleCondition`, rid);
      for (const [i, a] of (o.actions || []).entries()) checkAction(a, `${W}.objects.${oid}.actions[${i}]`, rid, "object");
    }
    for (const [fid, f] of Object.entries(r.flavourTargets || {}))
      if (typeof f !== "object" || !f.aliases) err(`${W}.flavourTargets.${fid}`, "must be an object with id, aliases, examineText");
  }

  for (const [r, s, where] of statesSet) {
    if (!room(r)) err(where, `setRoomState: unknown room "${r}"`);
    else if (s !== "default" && !ROOMS[r].states?.[s]) err(where, `setRoomState: state "${s}" not defined in "${r}"`);
  }

  // Items --------------------------------------------------------------------
  for (const [iid, it] of Object.entries(ITEMS)) {
    const W = `items.${iid}`;
    for (const k of Object.keys(it)) if (!ITEM_KEYS.has(k)) warn(W, `unknown item field "${k}" (ignored)`);
    if (!it.name) err(W, "missing name");
    if (!itemSources.has(iid)) err(W, "never placed: no itemText in any room and no giveItem/revealItem/moveItem");
    if ((it.aliases || []).length < 2) warn(W, "fewer than 2 aliases");
    for (const [i, ca] of (it.contextActions || []).entries()) {
      const where = `${W}.contextActions[${i}]`;
      for (const rr of [].concat(ca.room || [])) if (!room(rr)) err(where, `unknown room "${rr}"`);
      checkAction(ca, where, typeof ca.room === "string" ? ca.room : null, "context");
      // shadowed by a room action that already handles the same verbs in that room?
      for (const rr of [].concat(ca.room || [])) {
        const ra = (ROOMS[rr]?.actions || []).find(a =>
          (a.verbs || []).some(v => (ca.verbs || ["use"]).includes(v)) &&
          (a.targets || []).some(t => [iid, ...(it.aliases || [])].includes(t)));
        if (ra) info(where, `room "${rr}" has an action for the same verbs/item (${ra.id || "unnamed"}) — it runs first, so this contextAction never does`);
      }
    }
    if (assets) {
      const icon = join(gameDir, "assets/items", `${iid}.png`);
      if (!existsSync(icon)) info(W, `no assets/items/${iid}.png (SVG fallback icon)`);
    }
  }

  // Flags & counters ---------------------------------------------------------
  for (const [f, where] of flagsRead) if (!flagsSet.has(f)) err(where, `flag "${f}" is checked but never set`);
  for (const [f, where] of flagsSet) if (!flagsRead.has(f)) info(where, `flag "${f}" is set but never checked`);
  for (const [c, where] of countersRead) if (!countersSet.has(c)) err(where, `counter "${c}" is checked but never set`);

  // Media --------------------------------------------------------------------
  if (assets?.getMedia) {
    for (const k of ["__intro__", "__death__", "__win__"]) useMedia(k, "screens");
    const fallback = assets.getMedia("__intro__");
    for (const [k, where] of mediaUsed) {
      const m = assets.getMedia(k);
      if (!m || m.missing || (k !== "__intro__" && m === fallback)) {
        (k.startsWith("__") ? warn : err)(where, `media key "${k}" not in assets.js (falls back to intro image)`);
        continue;
      }
      if (m.type !== "svg" && m.src && !existsSync(join(gameDir, m.src)))
        (m.svgFallback ? info : err)(where, `media "${k}": file ${m.src} missing${m.svgFallback ? " (SVG fallback shown)" : ""}`);
    }
  }

  // Reachability -------------------------------------------------------------
  const seen = new Set([GAME.startRoom]), queue = [GAME.startRoom];
  while (queue.length) for (const n of graph.get(queue.shift()) || []) if (!seen.has(n)) { seen.add(n); queue.push(n); }
  for (const r of roomIds) if (!seen.has(r)) warn(`rooms.${r}`, "not reachable from startRoom (ignoring conditions)");
  const winViaRoom   = Object.entries(ROOMS).some(([id, r]) => r.win && seen.has(id));
  const winViaAction = Object.values(ROOMS).some(r => [...(r.actions || []), ...Object.values(r.objects || {}).flatMap(o => o.actions || [])].some(a => a.effects?.win))
                    || Object.values(ITEMS).some(i => (i.contextActions || []).some(a => a.effects?.win));
  if (!winViaRoom && !winViaAction) err("game", "no way to win (no reachable win room, no win effect)");

  return issues;
}

// ── CLI ──────────────────────────────────────────────────────────────────────

const root = resolve(new URL("..", import.meta.url).pathname);
let dirs = process.argv.slice(2).map(d => resolve(d));
if (!dirs.length) dirs = readdirSync(join(root, "games")).map(d => join(root, "games", d)).filter(d => existsSync(join(d, "data/rooms.js")));

let errors = 0;
for (const dir of dirs) {
  const issues = await validate(dir);
  const n = t => issues.filter(i => i[0].trim() === t).length;
  console.log(`\n${dir.replace(root + "/", "")}: ${n("ERROR")} errors, ${n("WARN")} warnings, ${n("INFO")} info`);
  for (const [lvl, where, msg] of issues) console.log(`  ${lvl}  ${where}: ${msg}`);
  errors += n("ERROR");
}
process.exit(errors ? 1 : 0);
