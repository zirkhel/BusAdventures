// engine/engine.js
// All game logic. Returns result objects — no DOM access.
//
// Action resolution order:
//   1. Room actions       (contextual consequences, may require tags/items)
//   2. Object actions     (interactive room objects)
//   3. Item contextActions (item + specific room)
//   4. Item defaultActions (item alone, any room)
//   5. Flavour targets    (atmosphere, no puzzle logic)
//   6. Generic fallback

"use strict";

import * as S from "./state.js";
import { parse, canonVerb } from "./parser.js";

// ── Result builder ────────────────────────────────────────────────────────────

function res(text, type = "neutral", opts = {}) {
  return { text, type, ...opts };
  // type: neutral | ok | bad | death | win
  // opts: roomChanged, warning, skipPressure, deathMedia
}

// ── Effects ───────────────────────────────────────────────────────────────────

function applyEffects(effects, sourceRoomId) {
  if (!effects) return;
  const st = S.get();
  const room = sourceRoomId || st.room;

  if (effects.setFlag)       S.setFlag(effects.setFlag, effects.flagValue ?? true);
  if (effects.clearFlag)     S.setFlag(effects.clearFlag, false);
  if (effects.setRoomFlag)   S.setRoomFlag(room, effects.setRoomFlag, effects.flagValue ?? true);
  if (effects.setGlobalFlag) S.setFlag(effects.setGlobalFlag, effects.flagValue ?? true);
  if (effects.setGlobalFlags) {
    (Array.isArray(effects.setGlobalFlags) ? effects.setGlobalFlags : [effects.setGlobalFlags])
      .forEach(f => S.setFlag(f, true));
  }
  if (effects.clearFlags) {
    (Array.isArray(effects.clearFlags) ? effects.clearFlags : [effects.clearFlags])
      .forEach(f => S.setFlag(f, false));
  }

  if (effects.setRoomState) {
    const r = effects.setRoomState.room || room;
    S.setRoomState(r, effects.setRoomState.state);
  }

  if (effects.revealItem)  st.itemLoc[effects.revealItem] = room;
  if (effects.removeItem) {
    st.inventory = st.inventory.filter(x => x !== effects.removeItem);
    st.worn      = st.worn.filter(x => x !== effects.removeItem);
    if (st.held === effects.removeItem) st.held = null;
    st.itemLoc[effects.removeItem] = null;
  }
  if (effects.moveItem) {
    st.itemLoc[effects.moveItem.id] = effects.moveItem.to;
  }
  if (effects.giveItem) {
    st.inventory.push(effects.giveItem);
    st.itemLoc[effects.giveItem] = "inventory";
  }
  if (effects.openExit) {
    // Stored in state, not written into the room data, so it is saved with the
    // game and undone by restart.
    S.openExit(effects.openExit.room || room, effects.openExit.dir, effects.openExit.to);
  }
  if (effects.setCounter) {
    S.setCounter(effects.setCounter.id, effects.setCounter.value);
  }
  if (effects.incCounter) {
    S.incCounter(effects.incCounter.id, effects.incCounter.by ?? 1);
  }
  // goTo is handled by runAction() via arrive(), so enter rules, hazards and
  // win checks run. This fallback only covers direct applyEffects() callers.
  if (effects.goTo) {
    S.get().room = effects.goTo;
    S.incVisit(effects.goTo);
  }
}

// Run a matched action (room, object or item context): apply its effects,
// then handle kill / win / goTo. goTo enters the room properly via arrive().
function runAction(action, roomId) {
  const eff = action.effects || {};
  const { goTo, ...rest } = eff;
  applyEffects(rest, roomId);
  if (eff.kill) { S.save(); return res(eff.killText || "You die.", "death", { deathMedia: eff.deathMedia }); }
  if (eff.win)  { S.save(); return res("", "win"); }
  const text = action.successText || action.text || "Done.";
  if (goTo) {
    const arrived = arrive(goTo, null);
    if (arrived.type === "death" || arrived.type === "win") return arrived;
    arrived.text = [text, arrived.text].filter(Boolean).join("\n\n");
    arrived.type = "ok";
    arrived.sound = eff.playSound || null;
    return arrived;
  }
  S.save();
  return res(text, "ok", { roomChanged: hasRoomChanged(eff), sound: eff.playSound || null });
}

function hasRoomChanged(effects) {
  if (!effects) return false;
  return !!(
    effects.revealItem || effects.removeItem || effects.moveItem ||
    effects.giveItem   || effects.openExit   || effects.setRoomState ||
    effects.setRoomFlag || effects.goTo ||
    effects.setFlag || effects.clearFlag ||
    effects.setGlobalFlag || effects.setGlobalFlags || effects.clearFlags ||
    effects.setCounter || effects.incCounter
  );
}

// ── Media key resolver ───────────────────────────────────────────────────────
//
// Returns the media key for a room.
// Priority: mediaStates (conditional, first match wins) → named room state's
// media → room media. mediaStates must come first: rooms often give their
// "default" state a media key, which would otherwise hide every mediaState
// (e.g. an item-taken image).
//
// Example in rooms.js:
//   reception: {
//     media: "reception",
//     mediaStates: [
//       { condition: { itemNotHere: "keycard" }, media: "reception_empty" },
//       { condition: { roomState: "flooded" },   media: "reception_flood" },
//     ]
//   }

function resolveMediaKey(roomId) {
  const rid = roomId || S.get().room;
  const r = S.roomDef(rid);
  if (!r) return rid;

  // mediaStates: conditional overrides, first match wins
  for (const ms of (r.mediaStates || [])) {
    if (S.check(ms.condition)) return ms.media;
  }

  // Named room state may define its own media key
  const stateName = S.getRoomState(rid);
  const stateData = r.states?.[stateName];
  if (stateData?.media) return stateData.media;

  return r.media || rid;
}

// ── Room description ──────────────────────────────────────────────────────────

function buildDescription(roomId) {
  const r = S.roomDef(roomId || S.get().room);
  const state = S.getRoomState(roomId || S.get().room);
  const visits = S.visitCount(roomId || S.get().room);

  // Room state overrides base description if defined
  const stateData = r.states?.[state];
  let txt = stateData?.description || r.baseDescription || "";

  // First-visit description replaces base on visit 1
  if (visits === 1 && r.firstVisitDescription) {
    txt = r.firstVisitDescription;
  }

  // Conditional description appends/replaces
  for (const part of (r.descriptionStates || [])) {
    if (!S.check(part.condition)) continue;
    if (part.append)  txt += "\n\n" + part.append;
    if (part.replace) txt = part.replace;
  }

  // Item text substitutions
  for (const [id, parts] of Object.entries(r.itemText || {})) {
    const replacement = S.itemIsInRoom(id, roomId || S.get().room)
      ? (parts.present || "")
      : (parts.taken   || "");
    txt = txt.replace(`{${id}}`, replacement);
  }

  // Player-dropped items (in room but not authored itemText)
  const dropped = S.allItemIds().filter(id =>
    S.itemIsInRoom(id, roomId || S.get().room) &&
    !(r.itemText && r.itemText[id])
  );
  if (dropped.length) {
    txt += "\n\nOn the floor here: " + dropped.map(id => S.itemDef(id).name).join(", ") + ".";
  }

  return txt.trim();
}

function buildExits(roomId) {
  const r = S.roomDef(roomId || S.get().room);
  const state = S.getRoomState(roomId || S.get().room);
  const exits = [];

  // Room state may override exits; exits opened at runtime override both
  const exitSrc = { ...(r.states?.[state]?.exits || r.exits || {}), ...S.openedExits(roomId || S.get().room) };

  for (const [dir, def] of Object.entries(exitSrc)) {
    if (typeof def === "string") {
      exits.push({ dir, to: def, type: "open", label: dir });
      continue;
    }
    // Hidden: invisible until condition met
    if (def.hidden && !S.check(def.condition)) continue;
    // Special: no button, must be typed
    if (def.special) {
      exits.push({ dir, to: def.to, type: "special", label: def.label || dir });
      continue;
    }
    const locked = def.condition && !S.check(def.condition);
    exits.push({
      dir,
      to: def.to,
      type: locked ? "locked" : "open",
      label: def.label || dir,
      lockedText: def.lockedText,
    });
  }
  return exits;
}

// ── Movement ──────────────────────────────────────────────────────────────────

function go(dir) {
  const d = (dir || "").toLowerCase().trim();
  const norm = ({
    n:"north", s:"south", e:"east", w:"west", u:"up", d:"down",
    ne:"northeast", nw:"northwest", se:"southeast", sw:"southwest",
    north:"north", south:"south", east:"east", west:"west",
    up:"up", down:"down",
    northeast:"northeast", northwest:"northwest",
    southeast:"southeast", southwest:"southwest",
  }[d] || d);

  const r = S.currentRoom();
  const state = S.getRoomState();
  const exitSrc = { ...(r.states?.[state]?.exits || r.exits || {}), ...S.openedExits() };
  const exitDef = exitSrc[norm];

  if (!exitDef) return res("You cannot go that way.", "bad");

  const def = typeof exitDef === "string" ? { to: exitDef } : exitDef;

  if (def.hidden && !S.check(def.condition)) return res("You cannot go that way.", "bad");
  if (def.condition && !S.check(def.condition)) {
    return res(def.lockedText || "The way is blocked.", "bad");
  }
  if (!def.to) return res("You cannot go that way.", "bad");

  return enterRoom(def.to, norm);
}

function enterRoom(targetId, moveDir) {
  const target = S.roomDef(targetId);
  if (!target) return res("That way leads nowhere.", "bad");

  // enterRequires — soft block on room entry
  if (target.enterRequires) {
    const req = target.enterRequires;
    if (!S.check(req.condition || req)) {
      return res(req.failText || "The way is blocked.", "bad");
    }
  }

  return arrive(targetId, moveDir);
}

// Put the player in a room and run everything that belongs to entering it:
// enter rules, entry/visit hazards with warnings, win. Used by normal movement
// and by action goTo effects, so both behave the same.
function arrive(targetId, moveDir) {
  const target = S.roomDef(targetId);
  if (!target) return res("That way leads nowhere.", "bad");

  S.get().room = targetId;
  S.incVisit(targetId);

  const visits = S.visitCount(targetId);

  // enterRules — effects + optional text on enter
  let enterText = null;
  for (const rule of (target.enterRules || [])) {
    if (rule.onFirstEnter && visits > 1) continue;
    if (!S.check(rule.condition)) continue;
    applyEffects(rule.effects, targetId);
    if (rule.text) enterText = rule.text;
  }

  // Hazard: instant death on enter (e.g. no mask in chemical room)
  const entryHazard = (target.hazards || []).find(h => h.type === "onEnter");
  if (entryHazard && !S.check(entryHazard.safeIf)) {
    return res(entryHazard.deathText || "You die.", "death", { deathMedia: entryHazard.deathMedia });
  }

  // Visit-count death + warning stages (disabledIf switches the hazard off)
  const visitHazard = (target.hazards || []).find(h =>
    h.type === "visitCount" && !(h.disabledIf && S.check(h.disabledIf)));
  if (visitHazard && visits > (visitHazard.safeUnder ?? 999)) {
    return res(visitHazard.deathText || "You die.", "death", { deathMedia: visitHazard.deathMedia });
  }
  let visitWarning = null;
  if (visitHazard) {
    for (const stage of (visitHazard.warningStages || []).slice().reverse()) {
      if (visits >= stage.at) { visitWarning = stage.text; break; }
    }
  }

  // Win
  if (target.win && S.check(target.win === true ? null : target.win)) {
    return res("", "win");
  }

  S.save();
  const moveLine = moveDir ? "You move " + moveDir + "." : "";
  const text = [moveLine, enterText].filter(Boolean).join("\n\n");
  return res(text, "neutral", { roomChanged: true, warning: visitWarning });
}

// ── Items ─────────────────────────────────────────────────────────────────────

function take(target) {
  const id = S.findVisibleItem(target);
  if (!id || !S.itemIsInRoom(id)) return res("You do not see that here.", "bad");
  const def = S.itemDef(id);
  if (def.canCarry === false) return res("You cannot take that.", "bad");

  const st = S.get();
  st.inventory.push(id);
  st.itemLoc[id] = "inventory";
  S.save();
  return res(def.pickupText || "Taken: " + def.name + ".", "ok", { roomChanged: true });
}

function drop(target) {
  const id = S.findCarriedItem(target);
  if (!id) return res("You are not carrying that.", "bad");
  const def = S.itemDef(id);

  const st = S.get();
  st.inventory = st.inventory.filter(x => x !== id);
  st.worn      = st.worn.filter(x => x !== id);
  if (st.held === id) st.held = null;
  st.itemLoc[id] = st.room;
  S.save();
  return res(def.dropText || "Dropped: " + def.name + ".", "neutral", { roomChanged: true });
}

function takeAll() {
  const st = S.get();
  const room = st.room;
  // Finn alle items i rommet som kan tas
  const ids = Object.entries(st.itemLoc)
    .filter(([id, loc]) => loc === room)
    .map(([id]) => id)
    .filter(id => {
      const def = S.itemDef(id);
      return def && def.canCarry !== false;
    });

  if (!ids.length) return res("There is nothing here to take.", "bad");

  // Items a room action guards (e.g. the archive scroll that sets off the
  // alarm) are not swept up silently — the first one runs its room action.
  const guarded = ids.filter(id => findRoomAction(takeIntent(id)));
  const plain   = ids.filter(id => !guarded.includes(id));

  plain.forEach(id => {
    st.inventory.push(id);
    st.itemLoc[id] = "inventory";
  });
  S.save();
  const lines = [];
  if (plain.length) lines.push("Taken: " + plain.map(id => S.itemDef(id).name).join(", ") + ".");
  if (guarded.length) {
    const r = tryRoomActions(takeIntent(guarded[0]));
    if (r.type === "death" || r.type === "win") return r;
    lines.push(r.text);
  }
  return res(lines.join("\n\n"), "ok", { roomChanged: true });
}

function dropAll() {
  const st = S.get();
  const ids = [...st.inventory];

  if (!ids.length) return res("You are not carrying anything.", "bad");

  ids.forEach(id => {
    st.inventory = st.inventory.filter(x => x !== id);
    st.worn      = st.worn.filter(x => x !== id);
    if (st.held === id) st.held = null;
    st.itemLoc[id] = st.room;
  });
  S.save();
  const names = ids.map(id => S.itemDef(id).name).join(", ");
  return res("Dropped: " + names + ".", "neutral", { roomChanged: true });
}

function wear(target) {
  const id = S.findCarriedItem(target);
  if (!id) return res("You are not carrying that.", "bad");
  const def = S.itemDef(id);
  if (!def.canWear) return res("That is not something you can wear.", "bad");
  if (!S.get().worn.includes(id)) S.get().worn.push(id);
  S.save();
  return res(def.wornText || def.defaultActions?.wear || "You put on the " + def.name + ".", "ok");
}

function removeWorn(target) {
  const id = S.findCarriedItem(target);
  if (!id || !S.wearsItem(id)) return res("You are not wearing that.", "bad");
  S.get().worn = S.get().worn.filter(x => x !== id);
  S.save();
  return res("You remove the " + S.itemDef(id).name + ".", "neutral");
}

function hold(target) {
  const id = S.findCarriedItem(target);
  if (!id) return res("You are not carrying that.", "bad");
  const def = S.itemDef(id);
  if (!def.canHold) return res("That is not useful to hold ready.", "bad");
  S.get().held = id;
  S.save();
  return res(def.heldText || def.defaultActions?.hold || "You hold the " + def.name + " ready.", "ok");
}

// ── Examine ───────────────────────────────────────────────────────────────────

function examine(target) {
  if (!target) {
    // "look" alone — return current room description as feedback text
    // Also trigger room re-render to update image/exits
    const desc = buildDescription(S.get().room);
    return res(desc, "neutral", { roomChanged: true, skipHistory: true });
  }

  // Item in room or inventory
  const id = S.findVisibleItem(target);
  if (id) {
    const def = S.itemDef(id);
    return res(def.defaultActions?.look || def.description || "Nothing special about it.", "neutral");
  }

  const r = S.currentRoom();

  // Interactive objects
  const obj = findObject(r, target);
  if (obj) {
    if (obj.visibleCondition && !S.check(obj.visibleCondition))
      return res("You do not see that here.", "bad");
    return res(obj.examineText || obj.defaultActions?.look || "Nothing notable.", "neutral");
  }

  // Flavour targets
  const flavour = findFlavour(r, target);
  if (flavour) {
    return res(flavour.examineText || flavour.lookText || "Just part of the room.", "neutral");
  }

  return res("There is nothing more to learn from that.", "neutral");
}

// ── Use / action dispatch ─────────────────────────────────────────────────────
//
// Resolution order:
//   1. Room actions
//   2. Object actions
//   3. Item contextActions (item + room)
//   4. Item defaultActions (item anywhere)
//   5. Flavour target response
//   6. Generic fallback

function use(p) {
  const { verb, target, on } = p;
  const r = S.currentRoom();
  const roomId = S.get().room;

  // 1 ── Room actions — already tried by runCommand() before any verb handler.

  // 2 ── Object actions ───────────────────────────────────────────────────────
  const obj = findObject(r, target);
  if (obj && obj.actions) {
    for (const action of obj.actions) {
      if (!verbMatches(action.verbs, p)) continue;
      if (!S.check(action.condition)) continue;
      return runAction(action, roomId);
    }
    if (obj.useText) return res(obj.useText, "neutral");
  }

  // 3 ── Item contextActions ──────────────────────────────────────────────────
  const itemId = S.findCarriedItem(target);
  if (itemId) {
    const def = S.itemDef(itemId);

    for (const ca of (def.contextActions || [])) {
      const roomOk = !ca.room ||
        ca.room === roomId ||
        (Array.isArray(ca.room) && ca.room.includes(roomId));
      const verbOk = !ca.verbs || verbMatches(ca.verbs, p);
      if (!roomOk || !verbOk) continue;
      if (!S.check(ca.condition)) continue;

      if (ca.requires && !checkRequires(ca.requires)) {
        return res(ca.requiresText || "You do not have what you need for that.", "bad");
      }
      return runAction(ca, roomId);
    }

    // 4 ── Item defaultActions ───────────────────────────────────────────────
    const fallback = def.defaultActions?.[verb] || def.defaultActions?.use;
    if (fallback) return res(fallback, "neutral");
  }

  // 5 ── Flavour target ───────────────────────────────────────────────────────
  const flavour = findFlavour(r, target);
  if (flavour) {
    const flavText = flavour[verb + "Text"] || flavour.useText || flavour.examineText;
    if (flavText) return res(flavText, "neutral");
  }

  // 6 ── Generic fallback ─────────────────────────────────────────────────────
  return res("That does not seem useful here.", "bad");
}

// ── Pressure / hazard tick ────────────────────────────────────────────────────
//
// Called after every command in rooms with commandPressure hazards.
// Returns a warning string to append, or null.

function tickPressure() {
  const r = S.currentRoom();
  const roomId = S.get().room;
  let warning = null;
  let death = null;
  let deathMedia = null;

  for (const hazard of (r.hazards || [])) {
    if (hazard.type !== "commandPressure") continue;
    if (!S.check(hazard.condition)) continue;

    S.incCounter(hazard.counter || ("pressure_" + roomId));
    const count = S.getCounter(hazard.counter || ("pressure_" + roomId));

    // Death threshold
    if (count >= hazard.threshold) {
      death = hazard.deathText || "Something in the room finally reaches you.";
      deathMedia = hazard.deathMedia || null;
      break;
    }

    // Warning stages
    for (const stage of (hazard.warningStages || []).slice().reverse()) {
      if (count >= stage.at) {
        warning = stage.text;
        break;
      }
    }
  }

  return { warning, death, deathMedia };
}

// ── Inventory list ────────────────────────────────────────────────────────────

function inventoryList() {
  return S.get().inventory.map(id => {
    const def = S.itemDef(id);
    return {
      id,
      name: def.name,
      icon: def.icon,
      description: def.defaultActions?.look || def.description,
      status: S.wearsItem(id) ? "worn" : S.holdsItem(id) ? "held" : "carried",
      tags: def.tags || [],
    };
  });
}

// ── Help ──────────────────────────────────────────────────────────────────────

function helpText() {
  return `Commands:
look · look [thing] · examine [thing]
take [item] · drop [item]
wear [item] · hold [item]
use [item] · read [item] · open [thing]
north/south/east/west/up/down (or n/s/e/w/u/d)

Some exits are hidden. Some must be typed, not clicked.`;
}

// ── Main command dispatcher ───────────────────────────────────────────────────

// Room actions are tried first for every verb that takes a target (take, look,
// go, drop, use, room-specific verbs...). That is what lets a room override the
// generic handlers, e.g. "take scroll" triggering the archive alarm.
function findRoomAction(p) {
  if (["empty", "help", "inventory"].includes(p.verb)) return null;
  if (p.verb === "look" && !p.target) return null;
  const r = S.currentRoom();
  for (const action of (r.actions || [])) {
    if (!verbMatches(action.verbs, p)) continue;
    const tl = action.targets || action.target;
    const targetOk = matchesTarget(tl, p.target)
      || (p.on && matchesTarget(tl, p.on))
      // a room-specific verb typed on its own ("crawl", "leap") is enough
      || (p.verb === "unknown" && !p.target);
    if (!targetOk) continue;
    if (!S.check(action.condition)) continue;
    return action;
  }
  return null;
}

function tryRoomActions(p) {
  const action = findRoomAction(p);
  if (action) {
    if (action.requires && !checkRequires(action.requires)) {
      return res(action.requiresText || action.failText || "You do not have what you need for that.", "bad");
    }
    return runAction(action, S.get().room);
  }
  return null;
}

// "take" as the room would see it, for one item (used by take all)
const takeIntent = id => ({ verb: "take", word: "take", target: id });

function runCommand(rawInput) {
  const p = parse(rawInput);
  let result = tryRoomActions(p);

  if (!result) switch (p.verb) {
    case "empty":     result = res("You wait. Nothing changes.", "neutral"); break;
    case "unknown":   result = res("Nothing answers that intention.", "bad"); break;
    case "help":      return res(helpText(), "neutral", { skipPressure: true });
    case "inventory": return res("", "neutral", { inventoryOnly: true, skipPressure: true });
    case "go":        result = go(p.target); break;
    case "look":      result = examine(p.target); break;
    case "take":      result = take(p.target); break;
    case "drop":      result = drop(p.target); break;
    case "takeall":   result = takeAll(); break;
    case "dropall":   result = dropAll(); break;
    case "wear":      result = wear(p.target); break;
    case "remove":    result = removeWorn(p.target); break;
    case "hold":      result = hold(p.target); break;

    case "use": case "swipe": case "read": case "open": case "close":
    case "push": case "pull": case "force": case "light":
    case "swing": case "attack": case "cut": case "inject":
    case "throw": case "listen": case "smell": case "touch":
    case "talk":
      result = use(p); break;

    default:
      result = res("Nothing answers that intention.", "bad");
  }

  // Pressure tick (unless action says skip)
  if (!result.skipPressure && result.type !== "death" && result.type !== "win") {
    const pressure = tickPressure();
    if (pressure.death) {
      return res(pressure.death, "death", { deathMedia: pressure.deathMedia });
    }
    if (pressure.warning) {
      // keep a visit warning from entering the room as well
      result.warning = [result.warning, pressure.warning].filter(Boolean).join("\n");
    }
  }

  return result;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Whole-word matching: "iv line" matches "iv", but "lantern" does not match
// "lanterns" and "shuriken" does not match "smoke". Underscores count as spaces.
function matchesTarget(targetList, input) {
  if (!targetList || targetList.length === 0) return true;
  if (!input) return false;
  const list = Array.isArray(targetList) ? targetList : [targetList];
  const words = s => ` ${String(s).toLowerCase().replace(/_/g, " ").trim()} `;
  const inp = words(input);
  return list.some(t => {
    const tw = words(t);
    return inp === tw || inp.includes(tw) || tw.includes(inp);
  });
}

// An action verb list matches the canonical verb ("push"), the typed word
// ("press"), or an alias of it ("press" listed, "push" typed).
function verbMatches(list, p) {
  if (!list) return false;
  return list.some(v => v === p.verb || v === p.word || canonVerb(v) === p.verb);
}

function checkRequires(req) {
  if (!req) return true;
  if (req.hasItem   && !S.hasItem(req.hasItem))             return false;
  if (req.holdsItem && !S.holdsItem(req.holdsItem))         return false;
  if (req.wearsItem && !S.wearsItem(req.wearsItem))         return false;
  if (req.heldTag   && !S.holdsTag(req.heldTag))            return false;
  if (req.carriedTag && !S.findCarriedByTag(req.carriedTag)) return false;
  if (req.flag      && !S.getFlag(req.flag))                return false;
  return true;
}

function findObject(r, target) {
  if (!r.objects || !target) return null;
  return Object.values(r.objects).find(obj =>
    [obj.id, ...(obj.aliases || [])].some(a =>
      a && (target === a || target.includes(a) || a.includes(target))
    )
  ) || null;
}

function findFlavour(r, target) {
  if (!r.flavourTargets || !target) return null;
  return Object.values(r.flavourTargets).find(f =>
    [f.id, ...(f.aliases || [])].some(a =>
      a && (target === a || target.includes(a) || a.includes(target))
    )
  ) || null;
}

export {
  runCommand, go, take, drop, takeAll, dropAll, wear, removeWorn, hold, examine, use,
  buildDescription, buildExits, resolveMediaKey, inventoryList, helpText,
  enterRoom, arrive, applyEffects, tickPressure,
};
