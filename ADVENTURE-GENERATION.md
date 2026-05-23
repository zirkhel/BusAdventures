# Bus Adventures — Adventure Generation Prompt
_For use with Grok / ChatGPT / Claude_

---

## Step 1: Theme

Start with a concrete theme. Examples:
- Abandoned Soviet research station
- Sunken Victorian steamship
- Neon-lit hacker apartment, 2047
- Medieval monastery with a sealed crypt
- Deep-sea drilling platform, crew missing

State: **setting**, **tone**, **player goal**, **what went wrong**.

---

## Step 2: Room Graph

Design 6–10 rooms. For each room state:
- **ID** (snake_case, no spaces)
- **Title** (display name)
- **Purpose** (one sentence — what does this room do for the player?)
- **Exits** (which rooms connect, which direction)
- **Contains** (items, if any)

Draw a grid or list. Ensure:
- No dead ends (every room has at least 2 exits, or is a deliberate terminal)
- One hub room the player returns to
- One dangerous room with a hazard

---

## Step 3: Items (3–5)

For each item:
- **ID** (snake_case)
- **Name** (display)
- **Tags** — choose from: `key pry_tool sharp weapon_like light_source wearable readable medical flammable heavy electrical evidence consumable respirator injectable`
- **Where found**
- **Used where** (room + effect)
- **canCarry / canHold / canWear**

---

## Step 4: Puzzle Chain

Write the core progression as numbered steps:
1. Player starts in X
2. Player finds item A
3. Item A used in room B → unlocks path to C
4. Player finds item D in C
5. Item D used in room E → win condition

Every puzzle step must have a clear **hint** visible before the solution.

---

## Step 5: Death Condition

One mandatory death. Options:
- **commandPressure** — room kills after N commands (basement, flooding, fire)
- **visitCount** — room kills after N visits
- **enterRequires** — blocked without protection (chemical, cold, radiation)

---

## Output Format

Produce two files: `rooms.js` and `items.js`

### rooms.js format
```js
export const ROOMS = {
  room_id: {
    title: "Display Name",
    gridPosition: { col: 0, row: 0 },
    media: "image_key",
    fx: null,                    // "mist" | "flicker" | null
    baseDescription: "...",
    itemText: {
      item_id: { present: "...", taken: "..." }
    },
    states: {
      default: { description: "...", fx: null, media: "image_key" },
    },
    mediaStates: [],
    enterRequires: null,
    exits: {
      north: "room_id",          // open exit
      east: {                    // locked exit
        to: "room_id",
        condition: { flag: "flagName" },
        lockedText: "...",
      },
    },
    hazards: [],
    actions: [],
    objects: {},
    flavourTargets: {},
    win: false,
  },
};
```

### items.js format
```js
export const ITEMS = {
  item_id: {
    name: "Display Name",
    icon: "item_id",
    aliases: ["item_id", "alt name"],
    description: "Short description.",
    tags: ["tag1", "tag2"],
    canCarry: true,
    canHold: false,
    canWear: false,
    pickupText: "You take it.",
    dropText: "You set it down.",
    defaultActions: {
      look: "...", use: "...", read: "...",
    },
    contextActions: [
      {
        room: "room_id",
        verbs: ["use", "inject"],
        condition: null,
        requires: null,
        effects: {
          setGlobalFlag: "flagName",
          setRoomState: { room: "room_id", state: "state_name" },
          removeItem: "item_id",
        },
        successText: "...",
        failText: "...",
      }
    ],
  },
};
```

---

## Rules to follow

- Exits: open exits are plain strings `"room_id"`, NOT `{ to: "x", type: "open" }`
- Conditions use engine keys only (see ENGINE-STATE.md)
- Effects use engine keys only (see ENGINE-STATE.md)
- Every item needs at least 3 aliases
- Every room action needs at least 3 verbs and 3 targets
- flavourTargets must be objects with id, aliases, examineText — not string arrays
- Special exits are unreliable — use room actions with wide verb/target lists instead
- enterRequires uses `{ condition: {...}, failText: "..." }` — not hazard.onEnter
