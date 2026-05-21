// games/template/game.js
// Copy this folder to start a new adventure.

"use strict";

export const ADVENTURE = {
  id: "my-adventure",          // unique id, used for save key
  title: "My Adventure",

  startRoom: "start",

  intro: {
    title: "My Adventure",
    subtitle: "A Bus Adventure",
    text: "Your intro text here.",
    startLabel: "Begin",
    media: "__intro__",
  },

  win: {
    title: "You Won",
    text: "Your win text here.",
    playAgainLabel: "Play again",
  },

  // ── ITEMS ──────────────────────────────────────────────────────────────────
  //
  // Action resolution — engine checks in this order, stops at first match:
  //
  //   TIER 1 — Room actions (no item needed)
  //     Defined on each room: rooms.kitchen.actions
  //     Examples: "push button", "pull lever", "climb fence"
  //
  //   TIER 2 — Item contextActions (item + specific room)
  //     Defined on item: items.knife.contextActions
  //     The knife cuts rope in the cellar. Same knife does nothing in surgery.
  //
  //   TIER 3 — Item defaults (item alone, any room)
  //     Defined on item: items.knife.defaults
  //     "Swoosh. You slash empty air." — fires everywhere tier 1+2 didn't match.
  //
  items: {

    // Uncomment and rename to add an item:
    //
    // knife: {
    //   name: "Hunting Knife",
    //   icon: "knife",                  // key in assets.js ITEM_ICONS
    //   aliases: ["knife", "blade", "hunting knife"],
    //   description: "A short hunting knife. The edge is sharp.",
    //   canCarry: true,
    //   canHold: true,
    //   canWear: false,
    //   wearText: "You strap the knife to your belt.",  // only if canWear
    //
    //   // TIER 2 — what this item does in specific rooms
    //   contextActions: [
    //     {
    //       room: "cellar",            // string | ["room1","room2"] | omit = any room
    //       verbs: ["use", "cut"],
    //       condition: { flag: "rope_visible" },   // optional
    //       requires: { hasItem: "gloves" },       // optional — checked after condition
    //       requiresText: "You'd cut your hands without gloves.",
    //       effects: {
    //         setFlag: "rope_cut",
    //         removeItem: "knife",     // consumed on use
    //       },
    //       text: "You slice through the rope. It falls to the floor.",
    //     },
    //     {
    //       room: "guardroom",
    //       verbs: ["use", "attack"],
    //       text: "The guard sidesteps lazily. That went poorly.",
    //     },
    //   ],
    //
    //   // TIER 3 — fallback in any room where tier 1+2 didn't fire
    //   defaults: {
    //     use:    "Swoosh. You slash empty air.",
    //     attack: "You swing at nothing in particular.",
    //     cut:    "There is nothing here worth cutting.",
    //     read:   "It is a knife. There is nothing written on it.",
    //   },
    // },

  },

  // ── ROOMS ──────────────────────────────────────────────────────────────────
  rooms: {
    start: {
      title: "Starting Room",
      media: "start",             // key in assets.js ROOM_MEDIA
      fx: null,                   // "mist" | "flicker" | null

      baseDescription: "Describe the room here. {item_id} will be replaced by itemText.",

      // Item text substitutions — {item_id} in baseDescription is replaced by:
      itemText: {
        // item_id: {
        //   present: "The item is here.",   // shown when item is in this room
        //   taken:   "The item is gone.",   // shown after pickup
        // },
      },

      // Exits — see types below
      exits: {
        // Open exit (button shown):
        // north: "other_room_id",

        // Locked exit (button shown, blocked until condition met):
        // east: {
        //   to: "locked_room",
        //   condition: { hasItem: "keycard" },
        //   lockedText: "The door won't budge without a card.",
        // },

        // Hidden exit (no button — appears after condition is true):
        // west: {
        //   to: "secret_room",
        //   hidden: true,
        //   condition: { flag: "panel_open" },
        // },

        // Special exit (no button — must always be typed):
        // "crawl north": {
        //   to: "vent",
        //   special: true,
        // },
      },

      // Examinable room objects (not pickable items)
      objects: {
        // wall:   { examineText: "Old stone, damp to the touch." },
        // window: { examineText: "Cracked. Cold air seeps through." },
      },

      // TIER 1 room actions — no item required
      actions: [
        // {
        //   verbs: ["push", "press"],
        //   target: ["button", "switch"],    // omit target to match any
        //   condition: { flag: "power_on" }, // optional
        //   requires: { hasItem: "key" },    // optional — checked after condition
        //   requiresText: "You need a key first.",
        //   effects: { setFlag: "door_open", openExit: { dir: "north", to: "hallway" } },
        //   text: "The button clicks. A door slides open to the north.",
        // },
      ],

      // Kill player on entry unless condition is met
      // danger: {
      //   safeIf: { wearsItem: "mask" },
      //   text: "The fumes overwhelm you before you reach the door.",
      // },

      // Kill player after visiting too many times
      // thresholdDeath: {
      //   afterVisits: 2,
      //   text: "On your third visit, something is waiting for you.",
      // },

      // Entering this room = win
      // win: true,
    },

    // Add more rooms here...
  },
};
