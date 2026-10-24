# Bus Adventures — Engine State
_Last updated: 2026-10-24 (engine rework: room-action-first dispatch, media order, goTo via arrive, tools)_

## Architecture

### File structure
```
BusAdventures/
  engine/
    parser.js       ← verb synonyms, input → { verb, word, target, on }
    state.js        ← mutable state, conditions, save/load (+ old-save migration)
    engine.js       ← action resolution, hazards, effects
  ui/
    renderer.js     ← DOM, screens, inventory, feedback, death/win media
    shell.js        ← injects the game UI and wires input/menus
    fx.js           ← media rendering, SVG fallback
    audio.js        ← background music / sfx
    style.css       ← all layout and components
  games/
    <game>/
      index.html    ← imports data + assets + hooks, calls configure/initShell/startGame
      style.css     ← CSS variables only
      assets.js     ← getMedia(key), getItemIcon(id)
      overrides/ui-hooks.js ← optional hooks (onScreenChange, onRoomRender, onDeath, onWin)
      data/game.js · rooms.js · items.js   ← pure data (the editor reads/writes these)
      assets/rooms · assets/items · assets/screens
    template/       ← working example game — copy this to start a new one
  tools/
    validate-adventure.mjs ← checks a game's data against what the engine supports
    play-adventure.mjs     ← runs commands through the engine in the terminal
  editor/index.html ← GitHub API editor
  index.html        ← landing page
```

### New game
1. Copy `games/template` to `games/<slug>`, set a new `id` in `data/game.js` (it is the save key).
2. Write rooms/items, add media keys to `assets.js`.
3. `node tools/validate-adventure.mjs games/<slug>` — fix every ERROR.
4. `node tools/play-adventure.mjs games/<slug> "take x" n "use x on y"` — play the walkthrough and the phrasings a player might try.
5. Add a card on the landing page.

### UI
- `renderer.wireControls` owns: startBtn, continueBtn, playAgainBtn, restartBtn, helpBtn.
- `shell.js` owns: input bar/form, room title toggle, inventory toggle, settings menu, about, back buttons.
- Window hooks set by shell, called by renderer: `_resetUI()`, `_onRoomEnter(id)` (clears output), `_onCommand(cmd, text, type)`.
- Each command's response (and any hazard warning on a new line) is prepended to `#outputInner`.

---

## Parser
- Returns `{ verb, word, target, on }`. `verb` is canonical ("push"), `word` is what was typed ("press").
- Unknown verbs keep the first word: "crawl through breach" → `{ verb: "unknown", word: "crawl", target: "through breach" }`.
- `"use X on/with/in/into/to/at Y"` → `target: X, on: Y`. Leading articles/prepositions are stripped.
- "put mask on" → wear, "take mask off" → remove.

## Action resolution (stops at first match)
1. **Room actions** — tried first for every verb (take, go, look, use, room-specific verbs…).
   - Verb matches if the action lists the canonical verb, the typed word, or a synonym of it.
   - Target match is whole-word ("iv line" matches "iv"; "lantern" does not match "lanterns").
   - An action matching the main target beats one matching only the `on` part.
   - `look <thing>`: if the thing is an item, object or flavour target, its text is shown instead (hints come before solutions).
   - A room-specific verb typed alone ("crawl", "jump") matches.
   - `requires` fails → `requiresText || failText`. `failText` is only used for that.
2. Object actions
3. Item contextActions (item + room) — item may be named as target or `on`
   - then the named object's `useText`
4. Item defaultActions
5. Flavour target text
6. Generic fallback

Built-in verb handlers (take, drop, wear, hold, go, look…) only run if no room action matched.
`take all` does not sweep up items a room action guards (runs that action instead).

---

## Conditions (all optional, all must pass)
```js
{ hasItem: "keycard" }  { holdsItem: "crowbar" }  { wearsItem: "mask" }
{ wearingTag: "respirator" }  { heldTag: "pry_tool" }  { carriedTag: "medical" }
{ itemHere: "x" }  { itemNotHere: "x" }  { itemGone: "x" }
{ itemInRoom: { id: "crowbar", room: "basement" } }
{ flag: "x" }  { flagFalse: "x" }  { roomFlag: "x" }
{ roomState: "sedated" }  { roomStateOf: { room: "surgery", state: "sedated" } }
{ visitGte: 3 }  { counterGte: { id: "x", n: 4 } }
```
Unknown keys are ignored (= always true) — the validator flags them.

`requires` (actions) supports only: `hasItem, holdsItem, wearsItem, heldTag, carriedTag, flag`.

## Effects
```js
setFlag / setGlobalFlag / clearFlag / setGlobalFlags: [] / clearFlags: []  (flagValue: optional value)
setRoomFlag: "x"
setRoomState: { room: "surgery", state: "sedated" }
revealItem / removeItem / giveItem: "item_id"
moveItem: { id, to }
openExit: { room?, dir, to }     // stored in game state; Restart undoes it
setCounter / incCounter: { id, value | by }
goTo: "room_id"                  // enters the room properly: enter rules, hazards, warnings, win
win: true
kill: true, killText: "...", deathMedia: "key"
playSound: "sfx_key"
```

## Exits
```js
north: "room_id"                                                   // open
east:  { to, condition, lockedText }                               // locked (button shown)
east:  { to, hidden: true, condition }                             // hidden until condition
east:  { to, special: true, condition }                            // no button, must be typed
```

## Hazards
```js
enterRequires: { condition: {...}, failText: "..." }               // blocks entry (not death)
hazards: [
  { type: "onEnter", safeIf: {...}, deathText, deathMedia? },
  { type: "visitCount", safeUnder: 2, disabledIf?: {...}, warningStages: [{ at, text }], deathText, deathMedia? },
  { type: "commandPressure", counter: "id", threshold: 6, condition?: {...},
    warningStages: [{ at, text }], deathText, deathMedia? },
]
```
- visitCount: death when visits > safeUnder. Warning = highest stage with `at <= visits`.
- commandPressure: every command in the room (not help/inventory) adds 1; death at threshold. Counter persists after leaving.
- Death screen image: hazard/action `deathMedia` → room `deathMedia` → `__death__` → room image.

## Rooms
Fields: `title, gridPosition, media, fx, music, baseDescription, firstVisitDescription, descriptionStates,
itemText, states, mediaStates, enterRequires, enterRules, exits, hazards, actions, objects, flavourTargets,
win, deathMedia, winMedia`.
- `itemText: { id: { present, taken } }` replaces `{id}` in the description. An item's start room is the room whose itemText names it.
- `states: { default: { description, media?, exits? }, other: {...} }` — set with `setRoomState`.
- `enterRules: [{ onFirstEnter?, condition, effects, text }]`.
- `descriptionStates: [{ condition, append | replace }]`.

## Media
Resolution for a room image: **mediaStates (first match) → room state's media → room media**.
mediaStates come first so an item-taken image wins even when the default state names a media key.
Scene `fx` comes from the entry in `assets.js`.

## Items
`name, icon, aliases, description, tags, canCarry, canHold, canWear, pickupText, dropText, heldText, wornText,
defaultActions: { look, use, read, … }, contextActions: [{ room, verbs, condition, requires, requiresText, effects, successText }]`.
A contextAction is skipped if a room action handles the same verbs first (validator reports these).

## Saves
`localStorage["busadv_" + game.id]`. On load, missing state fields and items added since the save are filled in;
removed items are dropped. A save pointing at a room that no longer exists is ignored.

---

## Known decisions
- iOS Safari keyboard: hidden input + input bar (no fixed overlay input).
- Prefer room `actions` with wide verb/target lists over `special` exits.

## Deployed
- GitHub: github.com/zirkhel/BusAdventures
- Vercel: bus-adventures.vercel.app — push to main → auto-deploy
