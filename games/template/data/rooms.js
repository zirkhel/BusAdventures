// data/rooms.js — a small working example. Replace it with your own rooms.
// It shows each engine feature once:
//   lobby     item + itemText + mediaStates (image changes when the item is taken)
//   hallway   locked exit, room action with requires, room states
//   storeroom commandPressure hazard with warnings, deathMedia
//   outside   win room
// Check your data with:  node tools/validate-adventure.mjs games/<your-game>
// Play it in the terminal: node tools/play-adventure.mjs games/<your-game> "take torch" n
"use strict";

export const ROOMS = {

  lobby: {
    title: "Lobby",
    gridPosition: { col: 0, row: 1 },
    media: "lobby",
    baseDescription: "Emergency lights paint the lobby red. The front doors are locked. {torch}\n\nA hallway leads north.",
    itemText: {
      // {torch} in the description is replaced by present/taken text.
      // An item's start room is the room whose itemText names it.
      torch: {
        present: "A torch lies on the security desk.",
        taken:   "The security desk is bare.",
      },
    },
    mediaStates: [
      // Checked before everything else; first match wins.
      { condition: { itemNotHere: "torch" }, media: "lobby_empty" },
    ],
    exits: {
      north: "hallway",
    },
    hazards: [],
    actions: [],
    objects: {
      desk:  { id: "desk",  aliases: ["desk", "security desk"], examineText: "Coffee, cold. A logbook with tonight's page torn out." },
      doors: { id: "doors", aliases: ["doors", "front doors", "door"], examineText: "Magnetic locks. Dead without power.", useText: "They do not move." },
    },
    flavourTargets: {
      lights: { id: "lights", aliases: ["lights", "emergency lights"], examineText: "They hum. One of them is dying." },
    },
  },

  hallway: {
    title: "Hallway",
    gridPosition: { col: 0, row: 0 },
    media: "hallway",
    states: {
      // Room states replace the description (and optionally media) when set
      // by an effect: setRoomState: { room: "hallway", state: "unlocked" }.
      default:  { description: "A long hallway. The fire exit at the north end is locked; a key slot sits under the push bar.\n\nThe lobby is south. A storeroom door stands ajar to the east." },
      unlocked: { description: "A long hallway. The fire exit at the north end stands unlocked.\n\nThe lobby is south. The storeroom is east.", media: "hallway_open" },
    },
    exits: {
      south: "lobby",
      east:  "storeroom",
      north: {
        to: "outside",
        condition:  { flag: "exitUnlocked" },
        lockedText: "The fire exit is locked. There is a key slot under the push bar.",
      },
    },
    hazards: [],
    actions: [
      {
        id: "unlock_exit",
        // Room actions run before anything else, for every verb.
        // Verbs match the typed word or its synonym ("insert" = swipe).
        verbs:   ["use", "unlock", "open", "turn", "insert", "put"],
        targets: ["key", "slot", "key slot", "exit", "fire exit", "door"],
        condition: { flagFalse: "exitUnlocked" },
        requires:  { hasItem: "key" },
        requiresText: "The slot needs a key.",
        successText: "The key turns with a heavy clunk. The fire exit unlocks.",
        effects: {
          setFlag: "exitUnlocked",
          setRoomState: { room: "hallway", state: "unlocked" },
          removeItem: "key",
        },
      },
    ],
    objects: {
      slot: { id: "slot", aliases: ["slot", "key slot", "push bar"], examineText: "A small brass key slot. The key would be kept somewhere close." },
    },
    flavourTargets: {},
  },

  storeroom: {
    title: "Storeroom",
    gridPosition: { col: 1, row: 0 },
    media: "storeroom",
    deathMedia: "death_storeroom",
    baseDescription: "Shelves of paper and cleaning supplies. Something drips in the dark at the back. {key}\n\nThe hallway is west.",
    itemText: {
      key: {
        present: "A brass key hangs on a nail by the door.",
        taken:   "An empty nail by the door.",
      },
    },
    exits: {
      west: "hallway",
    },
    hazards: [
      {
        // Every command in this room counts. Warnings tell the player the
        // count is rising; the counter keeps its value if they leave.
        type: "commandPressure",
        counter: "storeroomPressure",
        threshold: 6,
        warningStages: [
          { at: 2, text: "The dripping stops." },
          { at: 4, text: "Something shifts behind the shelves." },
          { at: 5, text: "It is right behind you. Leave. Now." },
        ],
        deathText: "A hand closes around your ankle and pulls you into the dark between the shelves.",
      },
    ],
    actions: [],
    objects: {
      shelves: { id: "shelves", aliases: ["shelves", "shelf", "back", "dark"], examineText: "The back of the room is darker than it should be." },
    },
    flavourTargets: {},
  },

  outside: {
    title: "Outside",
    gridPosition: { col: 0, row: -1 },
    media: "outside",
    baseDescription: "Cold air. Street lights. You are out.",
    win: true,           // entering this room wins the game
    exits: {},
    hazards: [],
    actions: [],
    objects: {},
    flavourTargets: {},
  },

};
