// engine/parser.js
// Input string → { verb, target, on? }
// Verb synonyms live here, not in game data.

"use strict";

const VERBS = {
  look:      ["look at", "examine", "inspect", "study", "check", "look"],
  take:      ["pick up", "take", "get", "grab", "collect"],
  takeall:   ["take all", "get all", "grab all", "pick up all", "collect all"],
  drop:      ["put down", "drop", "leave"],
  dropall:   ["drop all", "put down all", "leave all"],
  wear:      ["put on", "equip", "wear"],
  remove:    ["take off", "unequip", "remove"],
  hold:      ["wield", "ready", "hold"],
  use:       ["activate", "use", "try"],
  swipe:     ["swipe", "scan", "insert", "tap", "slide"],
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
  through: "through", out: "out", in: "in",
  northeast: "northeast", northwest: "northwest",
  southeast: "southeast", southwest: "southwest",
};

const STRIP_ARTICLES = /^(at|the|a|an|to|into|inside|under|using)\s+/;

// Prepositions that split "use X on Y" / "use X with Y"
const ON_PREPS = [" on the ", " on ", " with the ", " with ", " at the ", " at ", " into the ", " into ", " against "];

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

  // Sort aliases longest-first so "pick up" beats "pick"
  const sorted = Object.entries(VERBS)
    .flatMap(([verb, arr]) => arr.map(alias => [verb, alias]))
    .sort((a, b) => b[1].length - a[1].length);

  for (const [verb, alias] of sorted) {
    if (raw === alias) return { verb, target: "" };
    if (raw.startsWith(alias + " ")) {
      let rest = raw.slice(alias.length).trim();

      // Split "use X on Y" → { verb, target: X, on: Y }
      for (const prep of ON_PREPS) {
        const idx = rest.indexOf(prep);
        if (idx !== -1) {
          const target = rest.slice(0, idx).trim().replace(STRIP_ARTICLES, "");
          const on     = rest.slice(idx + prep.length).trim().replace(STRIP_ARTICLES, "");
          return { verb, target, on };
        }
      }

      const target = rest.replace(STRIP_ARTICLES, "");
      return { verb, target };
    }
  }

  return { verb: "unknown", target: raw };
}

export { parse, VERBS, DIRECTIONS };
