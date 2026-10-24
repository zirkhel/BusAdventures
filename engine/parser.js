// engine/parser.js
// Input string → { verb, target, on? }
// Verb synonyms live here, not in game data.

"use strict";

let _extraVerbs = {};
export function configureParser(gameVerbs = {}) {
  _extraVerbs = gameVerbs;
}


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

// Canonical verb for a word or phrase ("press" → "push"), or the word itself
// if it is not a known alias. Used to match room-defined verbs against input.
function canonVerb(word) {
  const w = (word || "").toLowerCase().trim();
  for (const [verb, aliases] of Object.entries(Object.assign({}, VERBS, _extraVerbs))) {
    if (verb === w || (aliases || []).includes(w)) return verb;
  }
  return w;
}

function stripLead(s) {
  let prev;
  do { prev = s; s = s.replace(STRIP_ARTICLES, ""); } while (s !== prev);
  return s;
}

// Every result carries `word` — the verb as typed — so room actions can match
// on either the canonical verb ("push") or the player's word ("press").
function parse(rawInput) {
  const raw = (rawInput || "").trim().toLowerCase().replace(/\s+/g, " ");
  if (!raw) return { verb: "empty", target: "" };

  // Direction shorthand
  if (DIRECTIONS[raw]) return { verb: "go", target: DIRECTIONS[raw], word: raw };

  // Bare "look" = re-render room
  if (raw === "look") return { verb: "look", target: "", word: "look" };

  // Inventory / help shortcuts
  if (["i", "inv", "inventory", "items", "bag"].includes(raw))
    return { verb: "inventory", target: "" };
  if (["help", "?", "h", "commands"].includes(raw))
    return { verb: "help", target: "" };

  // Merge game-specific aliases
  const allVerbs = Object.assign({}, VERBS);
  for (const [verb, aliases] of Object.entries(_extraVerbs)) {
    allVerbs[verb] = [...(allVerbs[verb] || []), ...aliases];
  }

  // Sort aliases longest-first so "pick up" beats "pick"
  const sorted = Object.entries(allVerbs)
    .flatMap(([verb, arr]) => (arr || []).map(alias => [verb, alias]))
    .sort((a, b) => b[1].length - a[1].length);

  for (const [verb, alias] of sorted) {
    if (raw === alias) return { verb, target: "", word: alias };
    if (raw.startsWith(alias + " ")) {
      let rest = raw.slice(alias.length).trim();

      // Split "use X on Y" → { verb, target: X, on: Y }
      for (const prep of ON_PREPS) {
        const idx = rest.indexOf(prep);
        if (idx !== -1) {
          const target = stripLead(rest.slice(0, idx).trim());
          const on     = stripLead(rest.slice(idx + prep.length).trim());
          return { verb, target, on, word: alias };
        }
      }

      const target = stripLead(rest);
      return { verb, target, word: alias };
    }
  }

  // Unknown verb: keep the first word as the verb so rooms can define their
  // own ("crawl through breach", "leap to tree").
  const sp = raw.indexOf(" ");
  const word = sp === -1 ? raw : raw.slice(0, sp);
  const target = sp === -1 ? "" : stripLead(raw.slice(sp + 1).trim());
  return { verb: "unknown", target, word, raw };
}

export { parse, canonVerb, VERBS, DIRECTIONS };
