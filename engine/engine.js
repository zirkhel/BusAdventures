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
import { parse } from "./parser.js";

// ── Result builder ────────────────────────────────────────────────────────────

function res(text, type = "neutral", opts = {}) {
  return { text, type, ...opts };
  // type: neutral | ok | bad | death | win
  // opts: roomChanged, warning, skipPressure
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
    const r = S.roomDef(effects.openExit.room || room);
    if (r) r.exits[effects.openExit.dir] = effects.openExit.to;
  }
  if (effects.setCounter) {
    S.setCounter(effects.setCounter.id, effects.setCounter.value);
  }
  if (effects.incCounter) {
    S.incCounter(effects.incCounter.id, effects.incCounter.by ?? 1);
  }
  if (effects.goTo) {
    S.get().room = effects.goTo;
    S.incVisit(effects.goTo);
  }
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
// Returns the media key for a room, checking mediaStates conditions first.
// mediaStates is an ordered array — first matching condition wins.
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

  // Named room state may define its own media key
  const stateName = S.getRoomState(rid);
  const stateData = r.states?.[stateName];
  if (stateData?.media) return stateData.media;

  // mediaStates: conditional overrides, first match wins
  for (const ms of (r.mediaStates || [])) {
    if (S.check(ms.condition)) return ms.media;
  }

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

  // Room state may override exits
  const exitSrc = r.states?.[state]?.exits || r.exits || {};

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
  const exitSrc = r.states?.[state]?.exits || r.exits || {};
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
    return res(entryHazard.deathText || "You die.", "death");
  }

  // Visit-count death + warning stages
  const visitHazard = (target.hazards || []).find(h => h.type === "visitCount");
  if (visitHazard && visits > (visitHazard.safeUnder ?? 999)) {
    return res(visitHazard.deathText || "You die.", "death");
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

  ids.forEach(id => {
    st.inventory.push(id);
    st.itemLoc[id] = "inventory";
  });
  S.save();
  const names = ids.map(id => S.itemDef(id).name).join(", ");
  return res("Taken: " + names + ".", "ok", { roomChanged: true });
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

function use(verb, target, on) {
  const r = S.currentRoom();
  const roomId = S.get().room;

  // 1 ── Room actions ─────────────────────────────────────────────────────────
  for (const action of (r.actions || [])) {
    const verbOk   = action.verbs?.includes(verb);
    const targetOk = matchesTarget(action.targets || action.target, target)
                   || (on && matchesTarget(action.targets || action.target, on));
    if (!verbOk || !targetOk) continue;
    if (!S.check(action.condition)) continue;

    // requires: item id OR tag
    if (action.requires) {
      const reqOk = checkRequires(action.requires);
      if (!reqOk) return res(action.failText || "You do not have what you need for that.", "bad");
    }

    applyEffects(action.effects, roomId);
    S.save();
    if (action.effects?.kill) return res(action.effects.killText || "You die.", "death");
    if (action.effects?.win)  return res("", "win");
    return res(action.successText || action.text || "Done.", "ok",
      { roomChanged: hasRoomChanged(action.effects), sound: action.effects?.playSound || null });
  }

  // 2 ── Object actions ───────────────────────────────────────────────────────
  const obj = findObject(r, target);
  if (obj && obj.actions) {
    for (const action of obj.actions) {
      if (!action.verbs?.includes(verb)) continue;
      if (!S.check(action.condition)) continue;
      applyEffects(action.effects, roomId);
      S.save();
      return res(action.successText || action.text || "Done.", "ok",
        { roomChanged: hasRoomChanged(action.effects) });
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
      const verbOk = !ca.verbs || ca.verbs.includes(verb);
      if (!roomOk || !verbOk) continue;
      if (!S.check(ca.condition)) continue;

      if (ca.requires && !checkRequires(ca.requires)) {
        return res(ca.requiresText || "You do not have what you need for that.", "bad");
      }
      applyEffects(ca.effects, roomId);
      S.save();
      if (ca.effects?.kill) return res(ca.effects.killText || "You die.", "death");
      if (ca.effects?.win)  return res("", "win");
      return res(ca.successText || ca.text || "Done.", "ok",
        { roomChanged: hasRoomChanged(ca.effects), sound: ca.effects?.playSound || null });
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

  for (const hazard of (r.hazards || [])) {
    if (hazard.type !== "commandPressure") continue;
    if (!S.check(hazard.condition)) continue;

    S.incCounter(hazard.counter || ("pressure_" + roomId));
    const count = S.getCounter(hazard.counter || ("pressure_" + roomId));

    // Death threshold
    if (count >= hazard.threshold) {
      death = hazard.deathText || "Something in the room finally reaches you.";
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

  return { warning, death };
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

function runCommand(rawInput) {
  const p = parse(rawInput);
  let result;

  switch (p.verb) {
    case "empty":     result = res("You wait. Nothing changes.", "neutral"); break;
    case "unknown": {
      // Try room actions before giving up — rooms define their own verbs
      const _ru = S.currentRoom();
      let _foundU = false;
      for (const _au of (_ru.actions || [])) {
        const _vOk = _au.verbs?.includes(p.verb) || _au.verbs?.includes(p.target);
        const _tOk = !_au.targets || matchesTarget(_au.targets || _au.target, p.target) || matchesTarget(_au.targets || _au.target, p.verb);
        if (_vOk && _tOk && S.check(_au.condition)) {
          if (_au.requires && !checkRequires(_au.requires)) {
            result = res(_au.requiresText || _au.failText || "You do not have what you need.", "bad");
          } else {
            applyEffects(_au.effects, S.get().room);
            S.save();
            if (_au.effects?.win) result = res("", "win");
            else result = res(_au.successText || "Done.", "ok", { roomChanged: hasRoomChanged(_au.effects) });
          }
          _foundU = true;
          break;
        }
      }
      if (!_foundU) result = res("Nothing answers that intention.", "bad");
      break;
    }
    case "help":      return res(helpText(), "neutral", { skipPressure: true });
    case "inventory": return res("", "neutral", { inventoryOnly: true, skipPressure: true });

    case "go": {
      const _r = S.currentRoom();
      let _matched = false;
      for (const _act of (_r.actions || [])) {
        const _vOk = _act.verbs?.includes("go");
        const _tOk = matchesTarget(_act.targets || _act.target, p.target);
        if (_vOk && _tOk && S.check(_act.condition)) {
          if (_act.requires && !checkRequires(_act.requires)) {
            result = res(_act.requiresText || _act.failText || "You do not have what you need.", "bad");
          } else {
            applyEffects(_act.effects, S.get().room);
            S.save();
            if (_act.effects?.win) result = res("", "win");
            else result = res(_act.successText || "Done.", "ok", { roomChanged: hasRoomChanged(_act.effects) });
          }
          _matched = true;
          break;
        }
      }
      if (!_matched) result = go(p.target);
      break;
    }
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
      result = use(p.verb, p.target, p.on); break;

    default:
      result = res("Nothing answers that intention.", "bad");
  }

  // Pressure tick (unless action says skip)
  if (!result.skipPressure && result.type !== "death" && result.type !== "win") {
    const pressure = tickPressure();
    if (pressure.death) {
      return res(pressure.death, "death");
    }
    if (pressure.warning) {
      result.warning = pressure.warning;
    }
  }

  return result;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function matchesTarget(targetList, input) {
  if (!targetList || targetList.length === 0) return true;
  if (!input) return false;
  return targetList.some(t => input === t || input.includes(t) || t.includes(input));
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
  enterRoom, applyEffects, tickPressure,
};
