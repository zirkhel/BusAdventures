// data/game.js — game settings
"use strict";

export const GAME = {
  id:        "my-adventure",       // unique slug — also the save key, so never reuse one
  title:     "My Adventure",
  startRoom: "lobby",              // must be a room id in rooms.js

  intro: {
    title:      "My Adventure",
    subtitle:   "A short night shift.",
    text:       "The power failed an hour ago.\n\nThe front door locked itself when it did.",
    startLabel: "Begin",
    firstText:  "Somewhere in the building, a generator coughs and dies.",  // shown under the first room
  },

  win: {
    title:          "Out",
    text:           "Cold air. Street lights. Nobody followed you.",
    playAgainLabel: "Play again",
  },
};
