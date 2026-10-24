// data/items.js — items for the example in rooms.js. Replace with your own.
"use strict";

export const ITEMS = {

  torch: {
    name:        "Torch",
    icon:        "torch",                       // assets/items/torch.png (SVG fallback if missing)
    aliases:     ["torch", "flashlight", "light", "lamp"],
    description: "A heavy security torch. The battery is low.",
    tags:        ["light_source"],
    canCarry:    true,
    canHold:     true,
    canWear:     false,
    pickupText:  "You take the torch. It flickers, then holds.",
    dropText:    "You put the torch down.",
    defaultActions: {
      look: "A heavy security torch. The battery indicator is in the red.",
      use:  "You sweep the beam around. Nothing looks back. Probably.",
    },
    contextActions: [],                         // item + room specific: { room, verbs, effects, successText }
  },

  key: {
    name:        "Brass Key",
    icon:        "key",
    aliases:     ["key", "brass key", "fire exit key"],
    description: "A small brass key on a red tag: FIRE EXIT.",
    tags:        ["key"],
    canCarry:    true,
    canHold:     true,
    canWear:     false,
    pickupText:  "You lift the key off the nail.",
    dropText:    "You drop the key.",
    defaultActions: {
      look: "A small brass key. The red tag reads FIRE EXIT.",
      read: "FIRE EXIT.",
      use:  "It needs a lock.",
    },
    contextActions: [],
  },

};
