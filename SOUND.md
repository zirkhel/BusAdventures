# Sound

All sound in Bus Adventures is made in code with the Web Audio API — there are no audio files.
The shared module is `ui/sound.js` (global `BASound`).

## One on/off for everything

The setting lives in `localStorage["busadv_audio"]` (`"true"` / `"false"`). Every game reads the same
key, so turning sound off in one game turns it off everywhere (including the text adventures' *Sound: On/Off*).
`M` on the keyboard toggles it in every game.

## Arcade games

Each arcade game ends with a block between `<!-- SOUND:start -->` and `<!-- SOUND:end -->`, written by
`tools/add-sound.py`. It loads `ui/sound.js` and calls `BASound.watch()`, which reads the game's own
state every frame and plays sound from changes — the game logic itself is untouched.

```js
BASound.watch({
  state: () => S,                              // a new object = a new game
  mood: 'spooky',                              // music while playing(s) is true
  playing: s => s && !s.paused && !s.over,
  rate: s => 1 + s.wave * 0.03,                // optional tempo multiplier
  on: { 'score+': 'coin', 'liv-': 'lifeLost', 'over!': 'gameover', 'shots#+': 'shoot', 'kol~': 'step' },
});
```

Rules: `+` value went up, `-` down, `!` became truthy, `~` changed, `#` array length, `@` each new object
in an array (e.g. `'bombs@': 'fall'`). `wrap: { burst: (x, y, n, kind) => ... }` hooks a global game function
(most arcade games make explosions with `burst()`, so bombs hitting the ground, crashes and hits get sound there).
A value is an effect name, `[name, { pitch, vol }]`, or a function. Change a game's sound in
`tools/add-sound.py` and re-run it (safe to repeat).

The on/off button is placed next to `#btnMeny` automatically (or `data-anchor` / `data-button` on the script tag).

## Moods (music)

spooky · asylum · arcade · action · deepsea · cheeky · drive · retro · storm · march · folk · space ·
idle · ninja · tavern · fighter · lounge — see `MOODS` in `ui/sound.js`. Add one with `BASound.mood(name, track)`.

The loop is never played the same way twice in a row: every mood runs through an 8-phrase song form —
plain, small melody variations, melody an octave up with busier hi-hats, breakdown with a drum fill,
key change up a fourth (twice), low melody, and a fill back to the top.

## Effects

`BASound.play(name)` — click, select, confirm, back, error, start, coin, pickup, powerup, cash, jump, land, step,
shoot, laser, shotgun, fall (bomb whistle), impact (bomb hits the ground), debris, ricochet, rumble, ufo, growl, blab, baa, swing, whoosh, hit, thud, hurt, explode, boom, splash, bubble, sonar, torpedo, thunder,
zap, alarm, warn, tick, beep, perfect, combo, miss, lifeLost, levelup, win, gameover, crowd, boo, drum, bell,
flute, honk, engine, reload, spray, pop.

## Text adventures

`data/game.js` can set `music: "asylum"` and `ambient: "thunder"`. `ui/audio.js` loads the synth and plays the
mood once the game screen is open; the renderer adds footsteps, item sounds, a heartbeat on hazard warnings,
and stings on death and escape. Real `.mp3` files in `assets/audio/` still take priority where named.

## Empire games

`theme.json → presentation.music` picks the mood (default `idle`). The engine plays effects for packs
(rare/epic cards get their own), level-ups, new rooms, events, prestige and failed purchases, and adds a 🔊 button to the header.

## Satelloon

Has its own hand-tuned audio (theremin soundtrack, synthesized crowd) but uses the same on/off key.
