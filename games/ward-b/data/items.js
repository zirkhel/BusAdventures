// games/ward-b/data/items.js

"use strict";

export const ITEMS = {

  keycard: {
    name:        "Cracked Keycard",
    icon:        "keycard",
    aliases:     ["keycard", "card", "cracked card", "key card", "id card"],
    description: "A cracked plastic keycard. WARD B — STAFF ACCESS is printed on one side.",
    tags:        ["key", "plastic", "evidence"],
    canCarry:    true,
    canHold:     true,
    canWear:     false,
    pickupText:  "You pocket the keycard.",
    dropText:    "You set the keycard down.",
    defaultActions: {
      look:   "A cracked plastic keycard. Ward B is printed in faded letters on one side.",
      hold:   "You hold the keycard ready.",
      use:    "You tap the keycard against your palm. It needs a reader.",
      read:   "WARD B — STAFF ACCESS — LEVEL 2.",
    },
  },

  mask: {
    name:        "Filter Mask",
    icon:        "mask",
    aliases:     ["mask", "filter mask", "respirator", "gas mask"],
    description: "A rubber filter mask with brittle straps.",
    tags:        ["wearable", "protection", "respirator"],
    canCarry:    true,
    canHold:     true,
    canWear:     true,
    pickupText:  "You take the filter mask.",
    dropText:    "You set the mask down.",
    wornText:    "You pull the filter mask over your face. Breathing becomes muffled but safer.",
    defaultActions: {
      look:   "A rubber filter mask. The straps have gone brittle but it will hold.",
      hold:   "You hold the mask ready.",
      wear:   "You pull the mask over your face.",
      use:    "You press the mask to your face. You should wear it properly.",
      smell:  "Rubber, dust, faint antiseptic.",
    },
  },

  sedative: {
    name:        "Sedative Ampoule",
    icon:        "sedative",
    aliases:     ["sedative", "ampoule", "drug", "medicine", "vial", "injection"],
    description: "A cloudy sedative ampoule. The label reads FOR AGITATION.",
    tags:        ["medical", "consumable", "liquid"],
    canCarry:    true,
    canHold:     true,
    canWear:     false,
    pickupText:  "You take the ampoule carefully.",
    dropText:    "You set the ampoule down.",
    defaultActions: {
      look:   "A sealed ampoule of sedative. FOR AGITATION is printed in red.",
      hold:   "You hold the ampoule ready.",
      use:    "You hold it up to the light. Using it here would be wasteful.",
      read:   "FOR AGITATION — 10ml — DO NOT ADMINISTER WITHOUT SUPERVISION.",
      inject: "There is nothing here that needs sedating.",
      smell:  "The ampoule is sealed. You smell nothing.",
    },
  },

  crowbar: {
    name:        "Crowbar",
    icon:        "crowbar",
    aliases:     ["crowbar", "crow bar", "pry bar", "iron bar", "bar"],
    description: "A heavy rusted crowbar from the flooded basement. Cold to the touch.",
    tags:        ["pry_tool", "weapon_like", "metal", "heavy"],
    canCarry:    true,
    canHold:     true,
    canWear:     false,
    pickupText:  "You wrench the crowbar free from the bracket.",
    dropText:    "You set the crowbar down with a heavy clank.",
    heldText:    "You grip the crowbar tightly. It feels solid.",
    defaultActions: {
      look:   "A heavy rusted crowbar. Cold to the touch and stained from years underground.",
      hold:   "You grip the crowbar. It has good weight.",
      use:    "You test the weight in your hands. There is nothing here to pry.",
      swing:  "You swish the crowbar through the air. The sound feels too loud.",
      attack: "You strike at nothing in particular. The building does not flinch.",
      force:  "There is nothing here to force.",
      pry:    "There is nothing here to pry open.",
    },
  },

};
