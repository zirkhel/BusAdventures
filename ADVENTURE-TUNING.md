# Bus Adventures — Adventure Tuning Prompt
_For use in a dedicated chat per adventure_

---

## Setup

Paste this at the start of a new chat, followed by the adventure's rooms.js and items.js:

```
You are helping me tune a text adventure for Bus Adventures engine.
The game is called [TITLE]. Theme: [THEME].

Rules:
- Engine uses a simple verb/target parser
- Player types commands like "take keycard", "inject sedative", "go north"
- Room descriptions should be 2–4 sentences max
- Flavour targets give atmosphere without advancing plot
- Hints must be visible BEFORE the player needs them
- Death must be avoidable but feel earned

Here are the current files:
[paste rooms.js]
[paste items.js]
```

---

## Tuning tasks

### Atmosphere
- [ ] Does every room description create a strong image in 2–4 sentences?
- [ ] Is the tone consistent throughout?
- [ ] Do flavour targets add atmosphere without cluttering?
- [ ] Does the horror/tension escalate as player progresses?

### Hints
- [ ] Can the player figure out what to do in each room without a walkthrough?
- [ ] Is the IV/injector/mechanism hinted at before the player needs it?
- [ ] Does the locked door/exit tell the player WHY it's locked?
- [ ] Does the hazard room warn the player before killing them?

### Pacing
- [ ] Can the game be completed in 5–15 minutes?
- [ ] Is there one clear main path with optional exploration?
- [ ] Does the pressure hazard give enough time to find the item?
- [ ] Is the final escape satisfying?

### Parser friendliness
- [ ] Are item aliases broad enough? (test: "take the [thing]", "grab [thing]", "pick up [thing]")
- [ ] Are action verbs broad enough for the final puzzle?
- [ ] Does "look" in each room give useful information?
- [ ] Do default item actions feel natural?

### Specific prompts to use

**Rewrite room description:**
> "Rewrite [room] description. Max 3 sentences. Tone: [horror/tense/relief]. Must mention: [key objects]. End with exits."

**Strengthen a hint:**
> "The player needs to figure out to inject the sedative into the IV. Rewrite the IV examine text and the surgery room description to make this clearer without being obvious."

**Expand aliases:**
> "The player needs to use the crowbar on the chain at escape_gate. List 10 natural ways a player might phrase this command."

**Balance pressure hazard:**
> "The basement has a commandPressure hazard with threshold 6. The crowbar is here. Is 6 commands enough to find and take it? Suggest warning stage timing."

**Write death text:**
> "Write a death text for [hazard]. 2 sentences. Vivid, not melodramatic. No second chances implied."

**Write win text:**
> "Write the win screen text for [adventure]. Player has just escaped. 3 sentences. Release of tension, not triumph."
