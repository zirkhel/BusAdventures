# Bus Adventures — Designer Guide
_What a room does, what you can put in a room, and what you can do across a whole game._
_Matches the engine as of 2026-10-24. Technical reference: ENGINE-STATE.md._

---

## Design rules (house style)

1. **Every deadly hazard gives a last warning** on the final safe step, and it says plainly that the next step kills.
2. **If a text describes a death, it is a death.** Use a hazard, not `enterRequires` (which only blocks).
3. **Every description names its exits** — including every room state's description.
4. **The hint is visible before the solution.** `look at <thing>` shows the thing's own text before any room action fires.
5. **Every puzzle accepts the obvious phrasings.** Test them with `tools/play-adventure.mjs`.

`node tools/validate-adventure.mjs games/<game>` checks rules 1–3 and most data mistakes.

---

## 1. What happens in a room

### Entering (normal movement and `goTo` work the same way)
1. `enterRequires` is checked. If it fails the player stays where they were and sees `failText`.
2. The player moves in. The room's visit count goes up by 1.
3. `enterRules` run (effects, optional text, optionally first visit only).
4. `onEnter` hazard: death unless `safeIf` holds.
5. `visitCount` hazard: death when visits > `safeUnder`; otherwise the warning for the current stage.
6. `win` room: the game is won.

### Each command (first match wins)
1. **Room `actions`** — tried first for every verb, including take, go, look.
2. **Object actions**
3. **Item `contextActions`** for this room
4. **Object `useText`**
5. **Item `defaultActions`**
6. **Flavour target text**
7. **Generic reply**

Exception: `look at X` shows X's own text if X is an item, object or flavour target in the room.
After the command, a `commandPressure` hazard adds 1 (help and inventory do not count) and may warn or kill.

### What the player sees
- **Image:** `mediaStates` (first match) → room state's `media` → room `media`.
- **Text:** room state's `description` (or `baseDescription`) → replaced by `firstVisitDescription` on visit 1 → `descriptionStates` applied → `{item}` placeholders filled → items dropped here listed.
- **Exit buttons:** open, locked (shown, blocked), hidden (shown once the condition holds); special exits have no button.
- **Warnings:** on their own line under the response.

---

## 2. What you can put in a room

### Text
```js
baseDescription: "Shelves of paper. {key}\n\nThe hallway is west.",
firstVisitDescription: "...",                     // replaces the text on the first visit only
descriptionStates: [
  { condition: { flag: "roofPathRevealed" }, append: "An open panel leads up to the roof to the south." },
  { condition: { flag: "flooded" }, replace: "Water to the knees. The hallway is west." },
],
itemText: {
  key: { present: "A brass key hangs on a nail.", taken: "An empty nail." },   // fills {key}
},
```
The room whose `itemText` names an item is where that item starts.

### Room states
```js
states: {
  default:  { description: "The fire exit is locked. The lobby is south." },
  unlocked: { description: "The fire exit stands open. The lobby is south.", media: "hallway_open",
              exits: { south: "lobby", north: "outside" }, music: "calm" },
},
```
Switch with the effect `setRoomState: { room: "hallway", state: "unlocked" }`.
A state's `description` replaces `baseDescription` — so it must name the exits too.

### Image and sound
```js
media: "storeroom",
mediaStates: [ { condition: { itemNotHere: "key" }, media: "storeroom_empty" } ],
deathMedia: "death_storeroom",      // death screen for deaths in this room
winMedia:   "win_roof",
music: "rain",                      // a state's music is only used if the room has none
```
Scene effects (mist, flicker) are set per image in `assets.js`, not in the room.

### Exits
```js
exits: {
  south: "lobby",                                                          // open
  north: { to: "outside", condition: { flag: "exitUnlocked" },
           lockedText: "The fire exit is locked. There is a key slot." },   // locked: button shown
  east:  { to: "vault", hidden: true, condition: { flag: "panelFound" } },  // hidden until condition
  down:  { to: "pit", special: true },                                      // no button, must be typed
}
```
Prefer room actions with wide verb lists over `special` exits.

### Entering
```js
enterRequires: { condition: { wearingTag: "respirator" }, failText: "The fumes drive you back." },  // blocks, never kills
enterRules: [
  { onFirstEnter: true, condition: null, effects: null, text: "Your footsteps sound wrong here." },
  { condition: { flag: "alarm" }, effects: { setFlag: "seenByGuard" }, text: "A guard turns." },
],
```

### Hazards
```js
hazards: [
  { type: "onEnter", safeIf: { hasItem: "climbing_claws" },
    deathText: "Your foot slides and the courtyard rushes up.", deathMedia: "death_fall" },

  { type: "visitCount", safeUnder: 4,                      // 5th visit kills
    disabledIf: { flag: "smokeCoverUsed" },
    warningStages: [ { at: 2, text: "A guard slows." }, { at: 3, text: "The patrol tightens." },
                     { at: 4, text: "One more pass and they will have you." } ],   // last warning
    deathText: "Steel flashes through the rain." },

  { type: "commandPressure", counter: "basementPressure", threshold: 6,   // 6th command kills
    condition: { flag: "scrollTaken" },                                   // optional: only counts while true
    warningStages: [ { at: 2, text: "Water moves below." }, { at: 4, text: "The light flickers." },
                     { at: 5, text: "Something is right beside you. Get out — now." } ],
    deathText: "Something in the dark reaches you." },
],
```
- The warning shown is the highest stage with `at <=` the count, so a stage repeats until the next one.
- The last stage must sit on the final safe step: `safeUnder` for visitCount, `threshold - 1` for commandPressure.
- A pressure counter keeps its value when the player leaves and comes back.

### Actions (the room's own commands)
```js
actions: [
  {
    id: "unlock_exit",
    verbs:   ["use", "unlock", "open", "turn", "insert", "put"],
    targets: ["key", "slot", "key slot", "exit", "fire exit", "door"],
    condition:    { flagFalse: "exitUnlocked" },        // when the action exists at all
    requires:     { hasItem: "key" },                    // what the player needs
    requiresText: "The slot needs a key.",               // shown when requires fails
    successText:  "The key turns. The fire exit unlocks.",
    effects: { setFlag: "exitUnlocked", setRoomState: { room: "hallway", state: "unlocked" }, removeItem: "key" },
  },
],
```
- **Verbs** match the typed word or any synonym ("press" = push, "climb" = go, "grab" = take).
- **A room can invent single-word verbs** ("crawl", "leap", "steal"). They work alone or with a target.
- **Targets match on whole words.** "iv line" matches "iv", but "lantern" does not match "lanterns".
- **The named thing wins.** In "use claws on cord", an action that targets "claws" beats one that only targets "cord".
- **`requires` supports only** `hasItem`, `holdsItem`, `wearsItem`, `heldTag`, `carriedTag`, `flag`.
- **`condition` hides the action.** If it fails, nothing is said and the next match is tried. If the player needs feedback in that situation, add a second action with the opposite condition.

### Objects and flavour
```js
objects: {
  slot: { id: "slot", aliases: ["slot", "key slot", "push bar"],
          examineText: "A brass key slot.",                  // look / examine
          useText: "It needs a key.",                        // use/open/push with no matching action
          visibleCondition: { flag: "lightsOn" },            // hidden from examine until true
          actions: [ { verbs: ["push"], effects: {...}, successText: "..." } ] },
},
flavourTargets: {
  lights: { id: "lights", aliases: ["lights"], examineText: "They hum.",
            touchText: "Warm.", smellText: "Ozone.", readText: "...", useText: "..." },
},
```

### Winning
`win: true` on a room wins on entry. An action can also win with `effects: { win: true }`.

---

## 3. The whole game

### game.js
```js
export const GAME = {
  id: "my-adventure",              // save key — never reuse between games
  title: "My Adventure",
  startRoom: "lobby",
  version: "1.0",                  // shown in About
  intro: { title, subtitle, text, startLabel, firstText },   // firstText: shown under the first room
  win:   { title, text, playAgainLabel },
};
```

### Items
```js
key: {
  name: "Brass Key", icon: "key", aliases: ["key", "brass key"],
  description: "...", tags: ["key"],
  canCarry: true, canHold: true, canWear: false,
  pickupText, dropText, heldText, wornText,
  defaultActions: { look: "...", use: "...", read: "...", smell: "..." },     // per verb, anywhere
  contextActions: [ { room: "hallway", verbs: ["use"], condition, requires, requiresText,
                      effects: {...}, successText: "..." } ],               // this item in that room
},
```
- One item can be **held** at a time (`hold key`). Several can be **worn**.
- **Tags** let puzzles accept any fitting item: `wearingTag: "respirator"`, `heldTag: "pry_tool"`, `carriedTag: "medical"`.
- `canCarry: false` makes an item visible but impossible to take.
- A room action for the same verb and item runs first and hides the contextAction. The validator reports this.

### Conditions (all keys must hold — there is no "or")
```
hasItem  holdsItem  wearsItem  wearingTag  heldTag  carriedTag
itemHere  itemNotHere  itemGone  itemInRoom: { id, room }
flag  flagFalse  roomFlag  roomState  roomStateOf: { room, state }
visitGte  counterGte: { id, n }
```
`itemHere`, `roomFlag`, `roomState` and `visitGte` refer to the room the player is in.

### Effects
```
setFlag  setGlobalFlag  clearFlag  setGlobalFlags: []  clearFlags: []  (flagValue)
setRoomFlag  setRoomState: { room, state }
giveItem  removeItem  revealItem  moveItem: { id, to }
openExit: { room?, dir, to }        // saved with the game, undone by restart
setCounter: { id, value }  incCounter: { id, by }
goTo: "room"                        // a full room entry: rules, hazards, warnings, win
win: true    kill: true, killText, deathMedia    playSound: "key"
```

### Look and sound
- **`assets.js`** maps every media key to an image. The special keys are `__intro__`, `__death__` and `__win__`. Missing PNGs show a labelled placeholder.
- **`style.css`** holds CSS variables only.
- **`overrides/ui-hooks.js`** offers `onScreenChange`, `onRoomRender`, `onDeath` and `onWin`. Return `true` to replace the default.
- **Audio** lives in `assets/audio/`. Use room or state `music`, and the `playSound` effect.

### Saving
Saving is automatic in the browser. Old saves survive changes to the game, because new items and fields are filled in.

---

## Not possible today
- **"Or" in conditions.** Write two actions instead.
- **Timers.** Only commands and visits are counted.
- **Dialogue.** `talk` is just a verb.
- **Checkpoints.** Death returns to the intro.
- **Multi-word room verbs.** Room-invented verbs are single words.
- **Game-specific synonyms.** `configureParser()` exists in the parser but no game wires it yet.

---

## Workflow
1. Copy `games/template` → `games/<slug>`. Set a new `id`.
2. Write `data/rooms.js` and `data/items.js`, then add the media keys to `assets.js`.
3. Run `node tools/validate-adventure.mjs games/<slug>` and fix every ERROR and WARN.
4. Run `node tools/play-adventure.mjs games/<slug> "take x" n "use x on y" ...` with the walkthrough and the phrasings a player would try.
5. Add a card on the landing page and push.
