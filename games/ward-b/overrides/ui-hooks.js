// games/[your-game]/overrides/ui-hooks.js
// Optional per-game UI overrides.
// Return true from any hook to prevent default renderer behaviour.
// Leave hooks empty (or delete them) if you don't need them.

export const hooks = {

  // Called when the active screen changes
  // name: "introScreen" | "gameScreen" | "deathScreen" | "winScreen"
  // onScreenChange(name) {},

  // Called after room is rendered — use for game-specific DOM tweaks
  // onRoomRender(roomId, roomDef) {},

  // Return true to fully handle death yourself (skip default death screen)
  // onDeath(text) { return false; },

  // Return true to fully handle win yourself (skip default win screen)
  // onWin() { return false; },

};
