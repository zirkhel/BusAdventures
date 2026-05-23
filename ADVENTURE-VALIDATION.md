# Bus Adventures — Adventure Validation Checklist
_Run against rooms.js and items.js before deploying_

---

## Structural checks

### rooms.js
- [ ] Every room has `title`, `gridPosition`, `media`, `baseDescription`
- [ ] Every room has `exits`, `hazards`, `actions`, `objects`, `flavourTargets`
- [ ] `exits` open exits are plain strings — NOT `{ to: "x", type: "open" }`
- [ ] Locked exits have `condition` AND `lockedText`
- [ ] Hidden exits have `hidden: true` AND `condition`
- [ ] `enterRequires` uses `{ condition: {...}, failText: "..." }` — not `hazard.onEnter`
- [ ] `hazards` commandPressure uses `threshold`, not `maxCommands`
- [ ] `hazards` commandPressure has `counter` field (unique string ID)
- [ ] Room states have `description` and `media` fields (not `image`)
- [ ] `flavourTargets` are objects with `id`, `aliases`, `examineText` — not string arrays
- [ ] `objects` have `id`, `aliases`, `examineText`
- [ ] `itemText` placeholders match actual item IDs

### items.js
- [ ] Every item has `name`, `icon`, `aliases`, `description`, `tags`
- [ ] Every item has `canCarry`, `canHold`, `canWear` booleans
- [ ] Every item has `defaultActions` object
- [ ] Every item has `contextActions` array (can be empty `[]`)
- [ ] `aliases` has at least 3 entries
- [ ] `icon` matches filename in `assets/items/` (without .png)
- [ ] `contextActions` have `room`, `verbs`, `effects`, `successText`

---

## Logic checks

### Conditions
Valid condition keys:
```
hasItem, holdsItem, wearsItem, wearingTag, heldTag, carriedTag,
itemHere, itemNotHere, itemGone, flag, flagFalse, roomFlag,
roomState, roomStateOf, visitGte, counterGte, itemInRoom
```
- [ ] No unknown condition keys
- [ ] `wearingTag` used (not `wearsTag` or `wornTag`)
- [ ] `heldTag` used (not `holdTag` or `holdingTag`)

### Effects
Valid effect keys:
```
setFlag, clearFlag, setGlobalFlag, setRoomFlag,
setRoomState, revealItem, removeItem, moveItem, giveItem,
openExit, setCounter, incCounter, goTo, win
```
- [ ] No unknown effect keys
- [ ] `setRoomState` uses `{ room: "id", state: "name" }` format
- [ ] State names in effects match state names defined in room `states`
- [ ] Flags set in effects are checked in conditions somewhere

---

## Puzzle logic checks

- [ ] Every locked exit has an item or flag that unlocks it
- [ ] Every required item is findable by the player
- [ ] No circular dependency (A requires B which requires A)
- [ ] Win condition is reachable from start room
- [ ] Death condition is avoidable (player has a chance)
- [ ] Every puzzle step has at least one hint visible before the solution

---

## Parser friendliness

- [ ] Items have natural language aliases (not just ID)
- [ ] Room actions have at least 3 verbs covering synonyms
- [ ] Room actions have at least 3 targets covering what player would type
- [ ] contextActions have wide verb lists (use, apply, put, place, inject...)
- [ ] Final escape action has verbs: squeeze, crawl, go, enter, through, climb, escape
- [ ] Final escape action has targets: gap, opening, gate, through, out, crack, hole

---

## Cross-reference checks

- [ ] Every room ID referenced in exits exists in ROOMS
- [ ] Every item ID referenced in itemText exists in ITEMS
- [ ] Every item ID referenced in effects (revealItem, removeItem etc.) exists in ITEMS
- [ ] Every room ID referenced in contextActions exists in ROOMS
- [ ] startRoom in game.js exists in ROOMS

---

## Prompt to run in ChatGPT

```
Here are my rooms.js and items.js for a Bus Adventures game.
Check against this validation list and report all failures:

[paste ADVENTURE-VALIDATION.md]

[paste rooms.js]

[paste items.js]

Report each failure with: file, room/item ID, field, and what's wrong.
```
