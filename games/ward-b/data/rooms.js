// games/ward-b/data/rooms.js

"use strict";

export const ROOMS = {

  reception: {
    title: "Dead Reception",
    gridPosition: { col: 1, row: 2 },
    media: "reception",
    fx: "mist",
    baseDescription: "The reception desk sits beneath a dead security monitor. Old appointment cards are curled like dead leaves. {keycard}\n\nA corridor leads north. The front doors behind you are chained shut.",
    itemText: {
      keycard: {
        present: "A cracked keycard lies inside the open drawer.",
        taken:   "The open drawer holds nothing now but dust and old paper clips.",
      },
    },
    mediaStates: [
      { condition: { itemNotHere: "keycard" }, media: "reception_empty" },
    ],
    exits: {
      north: "corridor",
    },
    objects: {
      desk:    { id: "desk",    aliases: ["desk", "reception desk", "counter"],     examineText: "The drawers are swollen from damp. One hangs open." },
      drawer:  { id: "drawer",  aliases: ["drawer", "open drawer"],                 examineText: "The warped drawer hangs open." },
      monitor: { id: "monitor", aliases: ["monitor", "screen", "security monitor"], examineText: "The screen is black. Your reflection appears a fraction of a second late.", useText: "The monitor does not respond." },
      doors:   { id: "doors",   aliases: ["doors", "front doors", "chain"],         examineText: "The chain is on your side. Someone wanted you to stay.", useText: "The chain does not give." },
    },
    flavourTargets: {
      cards: { id: "cards", aliases: ["cards", "appointment cards"], examineText: "The cards are too damp to read. Names dissolved by time." },
    },
  },

  corridor: {
    title: "Long Corridor",
    gridPosition: { col: 1, row: 1 },
    media: "corridor",
    fx: "flicker",
    baseDescription: "A long corridor stretches under weak yellow light. Doors line both sides. Something has scratched numbers into the floor tiles.\n\n{mask}\n\nRecords is north. Pharmacy is west. Surgery Ward is east. A stairwell descends below.",
    itemText: {
      mask: {
        present: "A filter mask hangs from a hook on the wall.",
        taken:   "An empty hook remains where the mask was.",
      },
    },
    exits: {
      south: "reception",
      north: "records",
      west:  "pharmacy",
      east:  "surgery",
      down:  "stairwell",
    },
    objects: {
      numbers: { id: "numbers", aliases: ["numbers", "scratches", "floor"], examineText: "The numbers repeat: 3, 3, 3. Someone was counting something." },
      hook:    { id: "hook",    aliases: ["hook"],                          examineText: "A simple hook bolted to the wall beside a faded safety notice." },
    },
    flavourTargets: {
      doors:  { id: "doors",  aliases: ["doors", "side doors"],     examineText: "Most have been nailed shut from outside." },
      light:  { id: "light",  aliases: ["light", "lights"],         examineText: "The fluorescent tubes flicker in an uneven pattern." },
      notice: { id: "notice", aliases: ["notice", "safety notice"], examineText: "AIRBORNE RISK. RESPIRATORY PROTECTION REQUIRED IN SURGICAL WING.", readText: "AIRBORNE RISK. RESPIRATORY PROTECTION REQUIRED IN SURGICAL WING." },
    },
  },

  records: {
    title: "Records Room",
    gridPosition: { col: 1, row: 0 },
    media: "records",
    fx: "mist",
    baseDescription: "Dusty shelves of patient records line the walls. A single desk lamp still works, casting a yellow circle on the floor.\n\nThe corridor is south.",
    exits: {
      south: "corridor",
    },
    objects: {},
    flavourTargets: {
      shelves: { id: "shelves", aliases: ["shelves", "cabinets", "folders", "records"], examineText: "The folders are too wet to separate. Names bleed into each other." },
      lamp:    { id: "lamp",    aliases: ["lamp", "desk lamp"],                         examineText: "The lamp is warm. It has been on a long time." },
    },
  },

  pharmacy: {
    title: "Pharmacy",
    gridPosition: { col: 0, row: 1 },
    media: "pharmacy",
    baseDescription: "Glass shelves glitter in the dim pharmacy. Most bottles have burst from age. {sedative}\n\nThe corridor is east.",
    itemText: {
      sedative: {
        present: "A single sedative ampoule remains sealed in a yellow tray.",
        taken:   "The yellow tray is empty.",
      },
    },
    exits: {
      east: "corridor",
    },
    objects: {
      tray: { id: "tray", aliases: ["tray", "yellow tray"], examineText: "A pharmaceutical tray. One item remains." },
    },
    flavourTargets: {
      shelves: { id: "shelves", aliases: ["shelves", "bottles", "glass"], examineText: "Broken glass covers every surface. Labels faded to one word: CALM." },
    },
  },

  surgery: {
    title: "Surgery Ward",
    gridPosition: { col: 2, row: 1 },
    media: "surgery",
    states: {
      default: {
        description: "The operating theatre waits beneath a dead surgical lamp. The air is thick with chemical fumes. A figure moves beneath a sheet on the restraint table.\n\nThe corridor is west. A locked door leads east.",
        fx: "flicker",
      },
      sedated: {
        description: "The operating theatre has gone still. The shape beneath the sheet no longer moves. A green light blinks on the door reader.\n\nThe corridor is west. The observation corridor is east.",
        fx: null,
      },
    },
    hazards: [
      {
        type:      "onEnter",
        safeIf:    { wearingTag: "respirator" },
        deathText: "You step into the chemical air without protection. Your lungs close before you reach the table.",
      },
    ],
    exits: {
      west: "corridor",
      east: {
        to:         "observation",
        condition:  { flag: "patientCalmed" },
        lockedText: "The door is sealed. The patient alarm is still active.",
      },
    },
    actions: [
      {
        id:      "use_sedative",
        verbs:   ["use", "inject"],
        targets: ["iv", "iv line", "patient", "table", "sedative"],
        requires:   { carriedTag: "medical" },
        failText:   "You have nothing suitable to administer here.",
        successText: "You push the sedative into the cracked IV line. Somewhere behind the wall, breathing slows and then stops moving the sheet.",
        effects: {
          setGlobalFlag: "patientCalmed",
          setRoomState:  { room: "surgery", state: "sedated" },
          removeItem:    "sedative",
        },
      },
    ],
    objects: {
      table:  { id: "table",  aliases: ["table", "restraint table", "operating table"], examineText: "The restraints have been torn from the inside." },
      iv:     { id: "iv",     aliases: ["iv", "iv line", "iv stand", "drip"],           examineText: "An old IV stand. A cracked bag feeds a line running into the wall.", useText: "The IV line leads somewhere behind the wall." },
      reader: { id: "reader", aliases: ["reader", "keycard reader", "door reader"],     examineText: "A door reader with a red warning light." },
    },
    flavourTargets: {
      sheet: { id: "sheet", aliases: ["sheet", "figure", "patient"], examineText: "Something moves beneath the sheet in an irregular rhythm.", touchText: "You do not touch the sheet." },
      lamp:  { id: "lamp",  aliases: ["lamp", "surgical lamp"],      examineText: "The surgical lamp is dead but the filament is still faintly warm." },
    },
  },

  observation: {
    title: "Observation Corridor",
    gridPosition: { col: 3, row: 1 },
    media: "observation",
    baseDescription: "A long observation corridor runs alongside the surgical wing. Glass panels look into darkened rooms. Something has left handprints on the inside of the glass.\n\nSurgery Ward is west. The courtyard is south.",
    exits: {
      west:  "surgery",
      south: "courtyard",
    },
    enterRules: [
      {
        onFirstEnter: true,
        condition: null,
        effects: null,
        text: "The corridor is quieter than the ward. Your footsteps sound wrong here.",
      },
    ],
    objects: {},
    flavourTargets: {
      glass:       { id: "glass",       aliases: ["glass", "panels", "windows"],     examineText: "The glass is thick. The handprints are on the inside." },
      handprints:  { id: "handprints",  aliases: ["handprints", "prints", "hands"],  examineText: "Five fingers. Pressed hard. From the inside." },
      rooms:       { id: "rooms",       aliases: ["rooms", "dark rooms", "cells"],   examineText: "The rooms beyond the glass are empty. As far as you can tell." },
    },
  },

  courtyard: {
    title: "Sealed Courtyard",
    gridPosition: { col: 3, row: 2 },
    media: "courtyard",
    fx: "mist",
    baseDescription: "A square of dead grass under a sky too dark for the hour. The air is cold and outside, but the walls are still very close.\n\nThe observation corridor is north. The escape gate is south.",
    exits: {
      north: "observation",
      south: "escape_gate",
    },
    flavourTargets: {
      grass: { id: "grass", aliases: ["grass", "ground"],      examineText: "The grass has grown in rectangular patches, like outlines of beds." },
      sky:   { id: "sky",   aliases: ["sky", "dark sky"],      examineText: "The sky is wrong for the hour. Something about the light here has always been wrong." },
      walls: { id: "walls", aliases: ["walls", "courtyard walls"], examineText: "High walls on all sides. The escape gate is the only way forward." },
    },
  },

  escape_gate: {
    title: "Escape Gate",
    gridPosition: { col: 3, row: 3 },
    media: "escape_gate",
    mediaStates: [
      { condition: { flag: "gateForcedOpen" }, media: "escape_gate_open" },
    ],
    states: {
      default: {
        description: "A heavy iron gate blocks the exit. A thick chain and padlock holds it shut. Through the bars you can see the road beyond.\n\nThe courtyard is north.",
        fx: null,
      },
      forced_open: {
        description: "The chain lies broken on the ground. The gate stands open. The road is right there.\n\nThe courtyard is north. You can squeeze through the gap.",
        fx: null,
      },
    },
    exits: {
      north: "courtyard",
      "squeeze through": {
        to:        "outside",
        special:   true,
        condition: { flag: "gateForcedOpen" },
      },
      "go through gap": {
        to:        "outside",
        special:   true,
        condition: { flag: "gateForcedOpen" },
      },
    },
    actions: [
      {
        id:      "force_chain",
        verbs:   ["use", "force", "pry", "break", "attack"],
        targets: ["chain", "gate", "padlock", "lock", "bars"],
        requires:   { heldTag: "pry_tool" },
        failText:   "The chain is too strong. You need something to force it.",
        successText: "You wedge the crowbar into the chain and throw your weight against it. The rusted links snap apart. The gate swings open.",
        effects: {
          setGlobalFlag: "gateForcedOpen",
          setRoomState:  { room: "escape_gate", state: "forced_open" },
        },
      },
    ],
    objects: {
      chain:   { id: "chain",   aliases: ["chain", "padlock", "lock"], examineText: "A heavy chain and padlock. Rusted but still solid." },
      gate:    { id: "gate",    aliases: ["gate", "iron gate", "bars"], examineText: "Heavy iron bars. The gap is just wide enough to squeeze through if the chain were gone.", useText: "The gate does not move with the chain in place." },
    },
    flavourTargets: {
      road:  { id: "road",  aliases: ["road", "outside"],  examineText: "Through the bars — a road. Empty. Cold. Free." },
    },
  },

  outside: {
    title: "Outside",
    gridPosition: { col: 3, row: 3 },
    media: "outside",
    baseDescription: "Cold air hits your face. The road stretches away into the dark. Behind you, Ward B settles back into silence.\n\nYou are out.",
    win: true,
    exits: {},
  },

  stairwell: {
    title: "Red Stairwell",
    gridPosition: { col: 2, row: 2 },
    media: "stairwell",
    fx: "mist",
    baseDescription: "The stairwell descends in tight red turns. Wet footprints climb beside yours — though nobody passed you.\n\nThe corridor is up. The basement is below.",
    hazards: [
      {
        type:      "visitCount",
        safeUnder: 2,
        deathText: "On your third visit, the footprints stop directly beside you. Something grabs your ankle from the step below.",
        warningStages: [
          { at: 2, text: "The footprints on the steps are very fresh." },
        ],
      },
    ],
    exits: {
      up:   "corridor",
      down: "basement",
    },
    objects: {
      footprints: { id: "footprints", aliases: ["footprints", "prints", "tracks"], examineText: "The footprints climb beside yours all the way up. They did not descend." },
    },
    flavourTargets: {
      numbers: { id: "numbers", aliases: ["numbers", "scratches"], examineText: "The number 3 has been scratched into every landing." },
      steps:   { id: "steps",   aliases: ["steps", "stairs"],      examineText: "The lower steps are stained darker than the rest." },
    },
  },

  basement: {
    title: "Flooded Basement",
    gridPosition: { col: 2, row: 3 },
    media: "basement",
    fx: "mist",
    baseDescription: "Black water covers the floor to ankle depth. Emergency lighting casts everything red. Maintenance equipment is bolted to the walls. {crowbar}\n\nThe stairwell is up.",
    itemText: {
      crowbar: {
        present: "A heavy crowbar hangs on a rusted maintenance bracket.",
        taken:   "The maintenance bracket is empty.",
      },
    },
    hazards: [
      {
        type:     "commandPressure",
        counter:  "basementPressure",
        increaseOn: "anyCommand",
        threshold: 6,
        warningStages: [
          { at: 2, text: "You hear water moving deeper below." },
          { at: 4, text: "The red emergency light flickers violently." },
          { at: 5, text: "Something splashes in the darkness nearby." },
        ],
        deathText: "Something in the flooded dark finally reaches you.",
        deathMedia: "death-basement",
      },
    ],
    exits: {
      up: "stairwell",
    },
    objects: {
      bracket: { id: "bracket", aliases: ["bracket", "maintenance bracket", "wall bracket"], examineText: "A rusted steel bracket bolted to the wall. Something heavy was stored here." },
      water:   { id: "water",   aliases: ["water", "flood", "floor"],                        examineText: "Black and cold. You cannot see the bottom.", touchText: "Ice cold. Something moves in it far below." },
    },
    flavourTargets: {
      pipes:   { id: "pipes",   aliases: ["pipes", "plumbing"],         examineText: "The pipes run along the ceiling, sweating condensation into the water below." },
      light:   { id: "light",   aliases: ["light", "emergency light"],  examineText: "A single red emergency light pulses unevenly." },
      shadows: { id: "shadows", aliases: ["shadows", "darkness"],       examineText: "The red light does not reach the far end of the basement." },
    },
  },

};
