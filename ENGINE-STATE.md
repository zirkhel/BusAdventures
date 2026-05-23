# Bus Adventures — Engine State
_Last updated: v42_

## Architecture

### File structure
```
BusAdventures/
  engine/
    parser.js       ← verb synonyms, input → {verb, target}
    state.js        ← mutable state, conditions, save/load
    engine.js       ← action resolution, hazards, effects
  ui/
    renderer.js     ← DOM, screen switching, inventory, feedback
    fx.js           ← media rendering, SVG fallback
  games/
    ward-b/
      index.html    ← game entry, UI hooks, overlay command input
      style.css     ← horror theme
      assets.js     ← getMedia(), getItemIcon()
      data/
        game.js     ← title, intro, win settings
        rooms.js    ← all room definitions
        items.js    ← all item definitions
      assets/
        rooms/      ← PNG images keyed by media field
        items/      ← PNG icons keyed by item id
    template/       ← blank copy for new games
  editor/
    index.html      ← GitHub API editor
  index.html        ← landing page
```

### Screen flow
- All screens are `<div id="Xscreen" class="screen">` — `.hidden` toggles `display:none`
- `showScreen()` in renderer toggles `.hidden` on all SCREENS array entries
- No `window._showScreen` hook — renderer handles screens directly
- `startBtn` wired by renderer `wireControls()` only — not by index.html

### Command input
- Output box is tappable — opens `#cmdOverlay` (position:fixed, justify-content:flex-end)
- `#commandForm` is inside overlay — renderer wires submit
- Overlay closes on submit or ✕ button
- No fixed input bar — overlay approach avoids iOS keyboard layout shift

### UI hooks (window globals set by index.html, called by renderer)
```js
window._resetUI()        // called on restart/continue/play again
window._onRoomEnter(id)  // called on every room change — resets history
window._onCommand(cmd, text, type)  // called after each command response
```

### Output model
- `#outputBox` is scrollable, flex:1, fills remaining height
- `#outputInner` holds `.output-entry` divs (cmd + response)
- No single feedback div — each command appends a new entry
- Room desc collapses on first input event

---

## Engine: Action Resolution (5-tier, stops at first match)
1. Room actions (no item needed)
2. Object actions (interactive room objects)
3. Item contextActions (item + specific room)
4. Item defaultActions (item alone, any room)
5. Flavour target response
6. Generic fallback

---

## Engine: Conditions (all optional, all must pass)
```js
{ hasItem: "keycard" }          // in inventory
{ holdsItem: "crowbar" }        // held (active hand)
{ wearsItem: "mask" }           // worn
{ wearingTag: "respirator" }    // wears any item with this tag
{ heldTag: "pry_tool" }         // holds any item with this tag
{ carriedTag: "medical" }       // carries any item with this tag
{ itemHere: "sedative" }        // item is in current room
{ itemNotHere: "keycard" }      // item is NOT in current room
{ itemGone: "sedative" }        // item removed from world
{ flag: "patientCalmed" }       // global flag is true
{ flagFalse: "gateForcedOpen" } // global flag is false/missing
{ roomFlag: "lever_pulled" }    // room-local flag
{ roomState: "sedated" }        // current room in this state
{ roomStateOf: { room: "surgery", state: "sedated" } }
{ visitGte: 3 }                 // visited room N+ times
{ counterGte: { id: "x", n: 4 } }
{ itemInRoom: { id: "crowbar", room: "basement" } }
```

---

## Engine: Effects
```js
setFlag / clearFlag / setGlobalFlag
setRoomFlag: "flag_id"
setRoomState: { room: "surgery", state: "sedated" }
revealItem: "item_id"
removeItem: "item_id"
moveItem: { id: "item_id", to: "room_id" }
giveItem: "item_id"
openExit: { dir: "east", to: "observation" }
setCounter / incCounter
goTo: "room_id"             // teleport player
win: true                   // trigger win screen
```

---

## Engine: Exit Types
```js
// Open
north: "room_id"

// Locked (button shown, blocked until condition met)
east: { to: "room_id", condition: { flag: "x" }, lockedText: "..." }

// Hidden (no button until condition met)
east: { to: "room_id", hidden: true, condition: { flag: "x" } }

// Special (no button, must be typed — use action instead where possible)
east: { to: "room_id", special: true, condition: { flag: "x" } }
```

---

## Engine: Hazards
```js
// Soft block on entry
enterRequires: {
  condition: { wearingTag: "respirator" },
  failText: "You pull back instinctively."
}

// Visit count escalation
hazards: [{ type: "visitCount", safeUnder: 2, deathText: "...",
  warningStages: [{ at: 2, text: "..." }] }]

// Command pressure death
hazards: [{ type: "commandPressure", counter: "id", threshold: 6,
  warningStages: [{ at: 2, text: "..." }, { at: 4, text: "..." }],
  deathText: "..." }]
```

---

## Engine: Room States
```js
states: {
  default: { description: "...", fx: "flicker", media: "room_key" },
  sedated: { description: "...", fx: null, media: "room_sedated" }
}
```

---

## Engine: Media States (conditional image swap)
```js
mediaStates: [
  { condition: { itemNotHere: "keycard" }, media: "reception_empty" },
]
```

---

## Engine: Item Schema
```js
{
  name, icon, aliases, description, tags,
  canCarry, canHold, canWear,
  pickupText, dropText, heldText, wornText,
  defaultActions: { look, hold, wear, use, read, inject, smell, touch, swing, attack, force, drop },
  contextActions: [{
    room, verbs, condition, requires, requiresText,
    effects, successText, failText
  }]
}
```

---

## Known issues / decisions
- `special` exits unreliable with parser — use room `actions` with wide verb/target lists instead
- iOS Safari keyboard: overlay approach (position:fixed flex-end) works — do NOT use fixed input bar
- `wireControls` in renderer wires: startBtn, continueBtn, playAgainBtn, restartBtn, helpBtn
- index.html wires: invToggle, roomTitleEl, outputBox, cmdForm, settingsBtn, backBtn
- No double-wiring — renderer and index.html own separate elements

---

## Deployed
- GitHub: github.com/zirkhel/BusAdventures (private)
- Vercel: bus-adventures.vercel.app
- Deploy: push to main → auto-deploy
