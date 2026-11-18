#!/usr/bin/env python3
"""Adds the shared synth sound (ui/sound.js) to every arcade game.

Each game gets a small BASound.watch() config that reads the game's own state
and plays music/effects from it — no changes to game logic. Re-running is safe:
the block between the SOUND markers is replaced.
"""
import pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent / 'games'
START, END = '<!-- SOUND:start -->', '<!-- SOUND:end -->'

# state helper for games that keep their state in `let S`
ST = "state: () => (typeof S !== 'undefined' ? S : null)"
PLAY = "playing: s => s && !s.paused && !s.over"

GAMES = {
  'lich-tower': f"""{{ {ST}, mood: 'spooky', {PLAY},
    rate: s => 1 + Math.min(0.35, s.ramp * 0.025),
    on: {{ 'pos~': 'tick', 'score+': ['pickup', {{ pitch: 1.2 }}], 'reddet+': 'coin', 'tapt+': 'thud',
          'ramp+': 'levelup', 'over!': 'gameover' }} }}""",
  'kraken': f"""{{ {ST}, mood: 'deepsea', {PLAY},
    on: {{ 'pos~': 'bubble', 'bar+': 'pickup', 'score+': 'cash', 'liv-': 'lifeLost', 'over!': 'gameover' }},
    every: (s, dt) => {{ if (!s.over && !s.paused && s.n && s.oksygen < s.n.luft * 0.25) {{ s._snd = (s._snd || 0) - dt; if (s._snd <= 0) {{ BASound.play('warn', {{ pitch: 0.8 }}); s._snd = 0.8; }} }} }} }}""",
  'flock': f"""{{ {ST}, mood: 'action', {PLAY},
    on: {{ 'kol~': 'step', 'hugg!': 'swing', 'kills+': 'hit', 'perfects+': 'perfect',
          'shotFlash!': 'shotgun', 'liv-': 'hurt', 'liv+': 'powerup', 'lightning!': 'thunder', 'over!': 'gameover' }} }}""",
  'seven-strikes': f"""{{ {ST}, mood: 'storm', {PLAY},
    on: {{ 'kol~': 'step', 'blitz!': 'thunder', 'truffet+': 'lifeLost', 'fjernBlitz!': ['thunder', {{ vol: 0.4, pitch: 0.7 }}],
          'dyttet!': 'thud', 'over!': 'gameover' }} }}""",
  'space-watch': f"""{{ {ST}, mood: 'arcade', {PLAY},
    rate: s => 1 + Math.min(0.3, (s.wave - 1) * 0.04),
    on: {{ 'bullets#+': ['laser', {{ vol: 0.6 }}], 'score+': 'pop', 'flash!': 'explode', 'perk!': 'powerup',
          'lives-': 'lifeLost', 'wave+': 'levelup', 'over!': 'gameover' }} }}""",
  'CityBomber': f"""{{ {ST}, mood: 'arcade', {PLAY},
    rate: s => 1 + Math.min(0.3, (s.wave - 1) * 0.05),
    on: {{ 'bomb!': 'whoosh', 'score+': 'explode', 'flak#+': ['shoot', {{ pitch: 0.6, vol: 0.5 }}],
          'lives-': 'boom', 'wave+': 'levelup', 'over!': 'gameover' }} }}""",
  'missile-command': f"""{{ {ST}, mood: 'action', {PLAY},
    rate: s => 1 + Math.min(0.3, (s.wave - 1) * 0.04),
    on: {{ 'outgoing#+': 'shoot', 'blasts#+': 'explode', 'wave+': 'levelup', 'over!': 'gameover' }},
    every: s => {{ const c = s.cities.filter(x => x.alive).length; if (s._cities != null && c < s._cities) BASound.play('boom'); s._cities = c; }} }}""",
  'heli-rescue': f"""{{ {ST}, mood: 'action', {PLAY},
    on: {{ 'shots#+': ['shoot', {{ vol: 0.6 }}], 'onboard+': 'pickup', 'saved+': 'coin', 'dead+': 'hurt',
          'lives-': 'boom', 'zone+': 'levelup', 'over!': 'gameover' }} }}""",
  'periscope': f"""{{ {ST}, mood: 'deepsea', {PLAY},
    on: {{ 'tubes-': 'torpedo', 'tubes+': 'reload', 'sunk+': 'boom', 'time+': 'powerup', 'over!': 'gameover' }},
    every: (s, dt) => {{ if (!s.over && !s.paused) {{ s._ping = (s._ping == null ? 2 : s._ping) - dt; if (s._ping <= 0) {{ BASound.play('sonar', {{ vol: 0.6 }}); s._ping = 5; }} }} }} }}""",
  'moon-buggy': f"""{{ {ST}, mood: 'space', {PLAY},
    on: {{ 'air!': 'jump', 'shots#+': ['laser', {{ vol: 0.6 }}], 'bonus+': 'coin', 'lives-': 'boom', 'over!': 'gameover' }},
    every: s => {{ if (s._air && !s.air) BASound.play('land'); s._air = s.air; }} }}""",
  'chemtrails': f"""{{ {ST}, mood: 'cheeky', {PLAY},
    on: {{ 'mist#+': ['spray', {{ vol: 0.35 }}], 'converted+': 'pop', 'escaped+': 'warn', 'wave+': 'levelup', 'over!': 'gameover' }} }}""",
  'dobbeltvakt': f"""{{ {ST}, mood: 'drive', {PLAY},
    rate: s => 1 + Math.min(0.3, (s.level - 1) * 0.04),
    on: {{ 'pax+': 'coin', 'complaints+': 'honk', 'lives-': 'boom', 'level+': 'levelup', 'over!': 'gameover',
          'kryss~': (s, v) => {{ if (v === 'warn') BASound.play('alarm'); }} }} }}""",
  'meatware': f"""{{ {ST}, mood: 'arcade', {PLAY},
    rate: s => 1 + Math.min(0.3, (s.wave - 1) * 0.03),
    on: {{ 'shots#+': ['laser', {{ vol: 0.5 }}], 'score+': 'pop', 'combo+': 'pickup', 'lives-': 'lifeLost',
          'wave+': 'levelup', 'over!': 'gameover' }} }}""",
  'baloon-crazy': f"""{{ {ST}, mood: 'retro', {PLAY},
    on: {{ 'drop!': 'whoosh', 'stack#+': 'pickup', 'score+': 'coin', 'lives-': 'lifeLost', 'lvl+': 'levelup', 'over!': 'gameover' }} }}""",
  # games with their own globals
  'respect-my-authority': """{ state: () => ({ run, over, hits, auth, swing: sw.on, sorry: sorries.length }), mood: 'march',
    playing: s => s.run && !s.over,
    on: { 'swing!': 'swing', 'hits+': 'hit', 'auth-': ['error', { vol: 0.6 }], 'sorry+': ['beep', { pitch: 1.4, vol: 0.5 }], 'over!': 'gameover' } }""",
  'grizzly': """{ state: () => ({ state, score, health, crowd, special, enemyHit, grizzlyHit, enemyDown, fluteBoost }), mood: 'folk',
    playing: s => s.state === 'fight' || s.state === 'special',
    on: { 'enemyHit!': 'hit', 'grizzlyHit!': 'hurt', 'enemyDown!': 'crowd', 'fluteBoost!': () => [880, 1175, 1480].forEach((f, i) => BASound.tone({ f, dur: 0.22, type: 'sine', vol: 0.12, attack: 0.03, delay: i * 0.16 })),
          'state~': (s, v) => { if (v === 'special') BASound.play('perfect'); if (v === 'dead') BASound.play('gameover'); } } }""",
  'forest-pacification': """{ state: () => ({ state, armor, kills, beams: beams.length, heavyFX, wave, flash }), mood: 'march',
    playing: s => s.state === 'playing',
    on: { 'beams+': ['laser', { pitch: 0.7, vol: 0.6 }], 'kills+': 'explode', 'armor-': 'hit', 'heavyFX!': 'boom', 'wave+': 'warn',
          'state~': (s, v) => { if (v === 'over') BASound.play('gameover'); if (v === 'complete') BASound.play('win'); } } }""",
  'grab-the-money': """{ state: () => ({ running, ended, score, thrown, pen: penalties.length }), mood: 'cheeky',
    playing: s => s.running,
    on: { 'thrown+': ['whoosh', { vol: 0.5 }], 'score+': 'cash', 'pen+': 'error', 'ended!': 'gameover' } }""",
}

# where to put the sound button when the game has no #btnMeny
BUTTON = { 'grizzly': 'tr' }
ANCHOR = { 'respect-my-authority': '#menu', 'forest-pacification': '#menu', 'grab-the-money': '#btnMenu' }

def block(name, cfg):
    btn = BUTTON.get(name, 'auto')
    anc = f' data-anchor="{ANCHOR[name]}"' if name in ANCHOR else ''
    return (f'{START}\n<script src="../../ui/sound.js" data-button="{btn}"{anc}></script>\n'
            f'<script>BASound.watch({cfg});</script>\n{END}\n')

for name, cfg in GAMES.items():
    f = ROOT / name / 'index.html'
    s = f.read_text(encoding='utf-8')
    s = re.sub(re.escape(START) + r'.*?' + re.escape(END) + r'\n?', '', s, flags=re.S)
    b = block(name, cfg)
    m = re.search(r'<script src="\.\./\.\./ui/gamepad\.js', s)
    i = m.start() if m else s.rfind('</body>')
    if i < 0: sys.exit(f'{name}: no insertion point')
    s = s[:i] + b + s[i:]
    f.write_text(s, encoding='utf-8')
    print('ok', name)
