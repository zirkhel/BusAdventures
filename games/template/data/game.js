// data/game.js — Edit this file to configure your game
"use strict";

export const GAME = {
  id:        "my-adventure",       // unique slug, no spaces
  title:     "My Adventure",       // shown on intro screen
  startRoom: "start",              // must match a room ID in rooms.js

  intro: {
    title:      "My Adventure",
    subtitle:   "A Subtitle",
    text:       "Your atmosphere here.",
    startLabel: "Begin",
  },

  win: {
    title:          "You Escaped",
    text:           "Your win message here.",
    playAgainLabel: "Play again",
  },
};
