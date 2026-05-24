// engine/parser.js
// Input string → { verb, target, on? }
// Verb synonyms live here. Games can add aliases via configureParser(gameVerbs).

"use strict";

// Games call configureParser({ scan: ["scan","swipe"], ... }) from game.js or shell
let _extraVerbs = {};
export function configureParser(gameVerbs = {}) {
  _extraVerbs = gameVerbs;
}

const VERBS = {
  look:      ["look at", "examine", "inspect", "study", "check", "look"],
  take:      ["pick up", "take", "get", "grab", "collect"],
  drop:      ["put down", "drop", "leave"],
  wear:      ["put on", "equip", "wear"],
  remove:    ["take off", "unequip", "remove"],
  hold:      ["wield", "ready", "hold"],
  use:       ["activate", "use", "try"],
  read:      ["decipher", "translate", "read"],
  open:      ["unlock", "open"],
  close:     ["shut", "close"],
  push:      ["press", "push"],
  pull:      ["yank", "pull"],
  swing:     ["swing", "wave", "brandish"],
  attack:    ["strike", "stab", "slash", "hit", "attack", "smash", "bash", "break"],
  cut:       ["slice", "hack", "chop", "saw", "cut"],
  force:     ["pry", "lever", "wedge", "force"],
  light:     ["ignite", "light", "burn"],
  inject:    ["inject", "administer", "stab with"],
  throw:     ["throw", "toss", "hurl", "fling"],
  listen:    ["listen", "hear"],
  smell:     ["smell", "sniff"],
  touch:     ["touch", "feel", "rub"],
  talk:      ["speak to", "speak with", "talk to", "ask", "talk"],
  go:        ["walk to", "move to", "go to", "walk", "move", "go", "enter", "climb"],
  inventory: ["inventory", "inv", "i", "items", "bag"],
  help:      ["help", "?", "commands", "h"],
};

const DIRECTIONS = {
  n: "north", s: "south", e: "east", w: "west",
  u: "up",    d: "down",
  ne: "northeast", nw: "northwest", se: "southeast", sw: "southwest",
  north: "north", south: "south", east: "east", west: "west",
  up: "up", down: "down",
  northeast: "northeast", northwest: "northwest",
  southeast: "southeast", southwest: "southwest",
};

const STRIP_ARTICLES = /^(at|the|a|an|to|on|with|into|inside|under|through|using)\s+/;

// Prepositions that separate "use X on Y"
const ON_PREPS = [" on ", " on the ", " with ", " with the ", " at ", " at the ", " against "];

function parse(rawInput) {
  const raw = (rawInput || "").trim().toLowerCase().replace(/\s+/g, " ");
  if (!raw) return { verb: "empty", target: "" };

  // Direction shorthand
  if (DIRECTIONS[raw]) return { verb: "go", target: DIRECTIONS[raw] };

  // Bare "look" = re-render room
  if (raw === "look") return { verb: "look", target: "" };

  // Inventory / help shortcuts
  if (["i", "inv", "inventory", "items", "bag"].includes(raw))
    return { verb: "inventory", target: "" };
  if (["help", "?", "h", "commands"].includes(raw))
    return { verb: "help", target: "" };

  // Merge game-specific aliases into verb table
  const allVerbs = { ...VERBS };
  for (const [verb, aliases] of Object.entries(_extraVerbs)) {
    if (allVerbs[verb]) {
      allVerbs[verb] = [...allVerbs[verb], ...aliases];
    } else {
      allVerbs[verb] = aliases;
    }
  }

  // Sort aliases longest-first so "pick up" beats "pick"
  const sorted = Object.entries(allVerbs)
    .flatMap(([verb, arr]) => arr.map(alias => [verb, alias]))
    .sort((a, b) => b[1].length - a[1].length);

  for (const [verb, alias] of sorted) {
    if (raw === alias) return { verb, target: "" };
    if (raw.startsWith(alias + " ")) {
      let rest = raw.slice(alias.length).trim().replace(STRIP_ARTICLES, "");

      // Check for "use X on Y" pattern
      for (const prep of ON_PREPS) {
        const idx = rest.indexOf(prep);
        if (idx !== -1) {
          const target = rest.slice(0, idx).trim();
          const on     = rest.slice(idx + prep.length).trim().replace(STRIP_ARTICLES, "");
          return { verb, target, on };
        }
      }

      return { verb, target: rest };
    }
  }

  return { verb: "unknown", target: raw };
}

export { parse, configureParser, VERBS, DIRECTIONS };
