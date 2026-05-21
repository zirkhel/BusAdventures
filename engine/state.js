// engine/state.js
// All mutable runtime state. No DOM, no game data, no rendering.

"use strict";

let _adv = null;   // { game, rooms, items } — set by init()
let _st  = null;   // runtime state object
let _key = null;   // localStorage key

// ── Init ──────────────────────────────────────────────────────────────────────

function init(adventure) {
  _adv = adventure;
  _key = "busadv_" + adventure.game.id;
}

function fresh() {
  // Build initial item locations from room itemText declarations
  const itemLoc = {};
  for (const id of Object.keys(_adv.items || {})) {
    const homeRoom = Object.entries(_adv.rooms).find(
      ([, r]) => r.itemText && r.itemText[id]
    )?.[0] || null;
    itemLoc[id] = homeRoom;
  }

  _st = {
    room:         _adv.game.startRoom,
    inventory:    [],          // item ids carried
    worn:         [],          // item ids worn
    held:         null,        // item id held ready (one at a time)
    itemLoc,                   // itemId → roomId | "inventory" | null
    roomStates:   {},          // roomId → stateName string
    roomFlags:    {},          // roomId → { flagName: value }
    globalFlags:  {},          // flagName → value
    counters:     {},          // counterId → number (pressure, visits, custom)
    dead:         false,
    won:          false,
  };
  return _st;
}

// ── Accessors ─────────────────────────────────────────────────────────────────

function get()           { return _st; }
function adv()           { return _adv; }
function roomDef(id)     { return _adv.rooms[id]; }
function currentRoom()   { return _adv.rooms[_st.room]; }
function itemDef(id)     { return _adv.items[id]; }
function allItemIds()    { return Object.keys(_adv.items || {}); }

// ── Item queries ──────────────────────────────────────────────────────────────

function hasItem(id)              { return _st.inventory.includes(id); }
function wearsItem(id)            { return _st.worn.includes(id); }
function holdsItem(id)            { return _st.held === id; }
function itemIsInRoom(id, roomId) { return _st.itemLoc[id] === (roomId ?? _st.room); }

function itemHasTag(id, tag) {
  return (_adv.items[id]?.tags || []).includes(tag);
}

// Find carried item by name/alias
function findCarriedItem(text) {
  text = (text || "").toLowerCase();
  return allItemIds().find(id => {
    if (!hasItem(id)) return false;
    const def = itemDef(id);
    return [id, def.name.toLowerCase(), ...(def.aliases || []).map(a => a.toLowerCase())]
      .some(a => text === a || text.includes(a));
  });
}

// Find item in room or inventory by name/alias
function findVisibleItem(text) {
  text = (text || "").toLowerCase();
  return allItemIds().find(id => {
    if (!hasItem(id) && !itemIsInRoom(id)) return false;
    const def = itemDef(id);
    return [id, def.name.toLowerCase(), ...(def.aliases || []).map(a => a.toLowerCase())]
      .some(a => text === a || text.includes(a));
  });
}

// Find any carried item matching a tag
function findCarriedByTag(tag) {
  return allItemIds().find(id => hasItem(id) && itemHasTag(id, tag));
}

// ── Room state ────────────────────────────────────────────────────────────────

function getRoomState(roomId) {
  return _st.roomStates[roomId ?? _st.room] || "default";
}

function setRoomState(roomId, stateName) {
  _st.roomStates[roomId] = stateName;
}

// ── Flags ─────────────────────────────────────────────────────────────────────

function getFlag(name)                    { return _st.globalFlags[name] ?? false; }
function setFlag(name, value = true)      { _st.globalFlags[name] = value; }
function getRoomFlag(roomId, name)        { return (_st.roomFlags[roomId] || {})[name] ?? false; }
function setRoomFlag(roomId, name, value = true) {
  if (!_st.roomFlags[roomId]) _st.roomFlags[roomId] = {};
  _st.roomFlags[roomId][name] = value;
}

// ── Counters (visits, pressure, custom) ──────────────────────────────────────

function getCounter(id)          { return _st.counters[id] ?? 0; }
function incCounter(id, by = 1)  { _st.counters[id] = getCounter(id) + by; }
function setCounter(id, val)     { _st.counters[id] = val; }

function visitCount(roomId)      { return getCounter("visit_" + (roomId ?? _st.room)); }
function incVisit(roomId)        { incCounter("visit_" + (roomId ?? _st.room)); }

// ── Persistence ───────────────────────────────────────────────────────────────

function save() {
  try { localStorage.setItem(_key, JSON.stringify(_st)); } catch {}
}

function load() {
  try {
    const raw = localStorage.getItem(_key);
    if (raw) { _st = JSON.parse(raw); return true; }
  } catch {}
  return false;
}

function clear() {
  try { localStorage.removeItem(_key); } catch {}
}

// ── Condition evaluator ───────────────────────────────────────────────────────
//
// Conditions are plain objects. All keys are optional.
// All present keys must pass for condition to be true.
//
// Supported keys:
//   hasItem       — player carries item id
//   holdsItem     — player holds item id ready
//   wearsItem     — player wears item id
//   itemHere      — item is in current room
//   itemInRoom    — { id, room } item is in specific room
//   flag          — global flag is truthy
//   flagFalse     — global flag is falsy
//   roomFlag      — flag on current room
//   roomState     — current room is in this state
//   roomStateOf   — { room, state } named room is in state
//   visitGte      — visited current room >= n times
//   counterGte    — { id, n } counter >= n
//   heldTag       — player holds an item with this tag
//   carriedTag    — player carries any item with this tag

function check(cond) {
  if (!cond) return true;
  if (cond.hasItem      && !hasItem(cond.hasItem))                      return false;
  if (cond.holdsItem    && !holdsItem(cond.holdsItem))                  return false;
  if (cond.wearsItem    && !wearsItem(cond.wearsItem))                  return false;
  if (cond.itemHere     && !itemIsInRoom(cond.itemHere))                return false;
  if (cond.flag         && !getFlag(cond.flag))                         return false;
  if (cond.flagFalse    &&  getFlag(cond.flagFalse))                    return false;
  if (cond.roomFlag     && !getRoomFlag(_st.room, cond.roomFlag))       return false;
  if (cond.roomState    &&  getRoomState(_st.room) !== cond.roomState)  return false;
  if (cond.visitGte     &&  visitCount(_st.room) < cond.visitGte)       return false;
  if (cond.itemInRoom   && !itemIsInRoom(cond.itemInRoom.id, cond.itemInRoom.room)) return false;
  if (cond.roomStateOf  &&  getRoomState(cond.roomStateOf.room) !== cond.roomStateOf.state) return false;
  if (cond.counterGte   &&  getCounter(cond.counterGte.id) < cond.counterGte.n) return false;
  if (cond.heldTag      && !findCarriedByTag(cond.heldTag))             return false;
  if (cond.carriedTag   && !findCarriedByTag(cond.carriedTag))          return false;
  return true;
}

export {
  init, fresh, get, adv,
  roomDef, currentRoom, itemDef, allItemIds,
  hasItem, wearsItem, holdsItem, itemIsInRoom, itemHasTag,
  findCarriedItem, findVisibleItem, findCarriedByTag,
  getRoomState, setRoomState,
  getFlag, setFlag, getRoomFlag, setRoomFlag,
  getCounter, incCounter, setCounter, visitCount, incVisit,
  save, load, clear,
  check,
};
