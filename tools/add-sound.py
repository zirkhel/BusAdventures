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

# Effect helpers used by several games (burst(x, y, n, kind) is the shared particle helper in most arcade games)
BURST = """(x, y, n, kind) => {
      if (kind === 'smoke' || kind === 'mist' || kind === 'jet' || kind === 'spray') return;
      if (kind === 'dust') return BASound.play('impact');
      if (kind === 'save') return BASound.play('powerup');
      if (kind === 'bae') return BASound.play('baa');
      if (kind === 'up') return BASound.play('pickup');
      if (n >= 16) return BASound.play('boom');
      if (kind === 'boom' || kind === 'crash' || n >= 10) return BASound.play('explode', { pitch: 1.25 - Math.min(n, 16) * 0.02 });
      return BASound.play('hit', { pitch: 1.2, vol: 0.6 });
    }"""

GAMES = {
  'lich-tower': f"""{{ {ST}, mood: 'spooky', {PLAY},
    rate: s => 1 + Math.min(0.35, s.ramp * 0.025),
    on: {{ 'pos~': 'tick', 'pending@': ['warn', {{ pitch: 0.7, vol: 0.4 }}], 'fallers@': ['fall', {{ vol: 0.7 }}],
          'score+': ['pickup', {{ pitch: 1.2 }}], 'reddet+': 'coin', 'tapt+': 'impact',
          'ramp+': 'levelup', 'over!': 'gameover' }} }}""",
  'kraken': f"""{{ {ST}, mood: 'deepsea', {PLAY},
    on: {{ 'pos~': 'bubble', 'bar+': 'pickup', 'score+': 'cash', 'grip+': ['tick', {{ pitch: 0.6 }}], 'kastet!': 'splash',
          'druknet!': s => {{ for (let i = 0; i < 5; i++) setTimeout(() => BASound.play('bubble', {{ pitch: 0.7 + i * 0.15 }}), i * 90); }},
          'liv-': 'lifeLost', 'over!': 'gameover' }},
    every: (s, dt) => {{ if (!s.over && !s.paused && s.n && s.oksygen < s.n.luft * 0.25) {{ s._snd = (s._snd || 0) - dt; if (s._snd <= 0) {{ BASound.play('warn', {{ pitch: 0.8 }}); s._snd = 0.8; }} }} }} }}""",
  'flock': f"""{{ {ST}, mood: 'action', {PLAY},
    on: {{ 'kol~': 'step', 'hugg!': 'swing', 'kills+': 'hit', 'perfects+': 'perfect', 'z@': ['growl', {{ vol: 0.6 }}],
          'shotFlash!': 'shotgun', 'casings@': ['ricochet', {{ vol: 0.5 }}], 'drop@': ['bell', {{ vol: 0.6 }}], 'rifleAmmo-': 'shoot',
          'liv-': 'hurt', 'liv+': 'powerup', 'lightning!': 'thunder', 'over!': 'gameover' }} }}""",
  'seven-strikes': f"""{{ {ST}, mood: 'storm', {PLAY},
    on: {{ 'kol~': 'step', 'varsler@': ['zap', {{ pitch: 0.5, vol: 0.4 }}], 'nedslag@': 'impact', 'blitz!': 'thunder',
          'truffet+': 'lifeLost', 'fjernBlitz!': ['rumble', {{ vol: 0.7 }}], 'flair@': 'pickup',
          'dyttet!': 'thud', 'over!': 'gameover' }} }}""",
  'space-watch': f"""{{ {ST}, mood: 'arcade', {PLAY},
    rate: s => 1 + Math.min(0.3, (s.wave - 1) * 0.04),
    on: {{ 'bullets#+': ['laser', {{ vol: 0.6 }}], 'bombs@': ['fall', {{ vol: 0.5 }}], 'crates@': ['bell', {{ vol: 0.6 }}], 'ufo!': 'ufo',
          'fx@': (s, f) => ({{ blast: 'explode', pop: ['pop', {{ vol: 0.7 }}], shatter: 'zap', spark: ['hit', {{ pitch: 1.3, vol: 0.5 }}], zap: 'zap', flare: 'whoosh' }})[f.kind],
          'perk!': 'powerup', 'lives-': 'lifeLost', 'wave+': 'levelup', 'over!': 'gameover' }} }}""",
  'CityBomber': f"""{{ {ST}, mood: 'arcade', {PLAY},
    rate: s => 1 + Math.min(0.3, (s.wave - 1) * 0.05),
    on: {{ 'bomb!': 'fall', 'flak@': ['shoot', {{ pitch: 0.5, vol: 0.5 }}], 'shots@': 'shoot', 'score+': 'debris',
          'lives-': 'lifeLost', 'wave+': 'levelup', 'over!': 'gameover' }},
    wrap: {{ burst: {BURST} }} }}""",
  'missile-command': f"""{{ {ST}, mood: 'action', {PLAY},
    rate: s => 1 + Math.min(0.3, (s.wave - 1) * 0.04),
    on: {{ 'outgoing@': 'shoot', 'incoming@': ['fall', {{ vol: 0.35, pitch: 0.8 }}], 'wave+': 'levelup', 'over!': 'gameover' }},
    wrap: {{ blast: (x, y, r) => BASound.play('explode', {{ pitch: r > 30 ? 0.8 : 1.1 }}), burst: (x, y, n, kind) => {{ if (kind === 'spark') BASound.play('impact'); }} }},
    every: s => {{ const c = s.cities.filter(x => x.alive).length; if (s._cities != null && c < s._cities) BASound.play('boom'); s._cities = c; }} }}""",
  'heli-rescue': f"""{{ {ST}, mood: 'action', {PLAY},
    on: {{ 'shots#+': ['shoot', {{ vol: 0.6 }}], 'nades@': 'whoosh', 'missiles@': ['laser', {{ pitch: 0.5 }}], 'jets@': ['whoosh', {{ pitch: 0.5, vol: 1.4 }}],
          'onboard+': 'pickup', 'saved+': 'coin', 'dead+': 'hurt',
          'lives-': 'lifeLost', 'zone+': 'levelup', 'over!': 'gameover' }},
    wrap: {{ burst: (x, y, n) => BASound.play(n >= 16 ? 'boom' : n >= 10 ? 'impact' : n >= 6 ? 'explode' : 'hit') }} }}""",
  'periscope': f"""{{ {ST}, mood: 'deepsea', {PLAY},
    on: {{ 'tubes-': 'torpedo', 'tubes+': 'reload', 'ships@': ['honk', {{ pitch: 0.45, vol: 0.6 }}], 'sunk+': 'splash',
          'time+': 'powerup', 'over!': 'gameover' }},
    wrap: {{ burst: (x, y, n, kind) => {{ if (kind === 'boom') BASound.play(n >= 12 ? 'boom' : 'explode'); }} }},
    every: (s, dt) => {{ if (!s.over && !s.paused) {{ s._ping = (s._ping == null ? 2 : s._ping) - dt; if (s._ping <= 0) {{ BASound.play('sonar', {{ vol: 0.6 }}); s._ping = 5; }} }} }} }}""",
  'moon-buggy': f"""{{ {ST}, mood: 'space', {PLAY},
    on: {{ 'air!': 'jump', 'shots@': ['laser', {{ vol: 0.6 }}], 'bombs@': ['fall', {{ vol: 0.5 }}], 'ufos@': 'ufo',
          'bonus+': 'coin', 'lives-': 'lifeLost', 'over!': 'gameover' }},
    wrap: {{ burst: (x, y, n, kind) => {{ if (kind === 'boom') BASound.play(n >= 16 ? 'boom' : 'impact'); else BASound.play(n >= 8 ? 'explode' : 'hit', {{ pitch: 1.3, vol: 0.7 }}); }} }},
    every: s => {{ if (s._air && !s.air) BASound.play('land'); s._air = s.air; }} }}""",
  'chemtrails': f"""{{ {ST}, mood: 'cheeky', {PLAY},
    on: {{ 'mist#+': ['spray', {{ vol: 0.35 }}], 'converted+': 'pop', 'escaped+': 'warn', 'signs@': (s, x) => /DRY|REFILL/.test(x.txt) ? null : (x.txt === 'WAKE' || x.txt === 'LOOK UP') ? ['warn', {{ pitch: 1.3, vol: 0.5 }}] : ['blab', {{ vol: 0.7 }}],
          'wave+': 'levelup', 'over!': 'gameover' }},
    wrap: {{ burst: {BURST} }} }}""",
  'dobbeltvakt': f"""{{ {ST}, mood: 'drive', {PLAY},
    rate: s => 1 + Math.min(0.3, (s.level - 1) * 0.04),
    on: {{ 'pax+': 'coin', 'complaints+': 'honk', 'lives-': 'lifeLost', 'level+': 'levelup', 'over!': 'gameover',
          'kryss~': (s, v) => {{ if (v === 'warn') BASound.play('alarm'); if (v === 'on') BASound.play('whoosh'); }} }},
    wrap: {{ burst: (x, y, n) => BASound.play(n >= 18 ? 'boom' : 'hit') }} }}""",
  'meatware': f"""{{ {ST}, mood: 'arcade', {PLAY},
    rate: s => 1 + Math.min(0.3, (s.wave - 1) * 0.03),
    on: {{ 'shots#+': ['laser', {{ vol: 0.5 }}], 'hulks@': ['rumble', {{ vol: 0.6 }}], 'elecs@': ['zap', {{ vol: 0.4 }}],
          'combo+': 'pickup', 'lives-': 'lifeLost', 'wave+': 'levelup', 'over!': 'gameover' }},
    wrap: {{ burst: {BURST} }} }}""",
  'baloon-crazy': f"""{{ {ST}, mood: 'retro', {PLAY},
    on: {{ 'drop!': 'fall', 'stack#+': 'pickup', 'score+': 'coin', 'msg~': ['beep', {{ vol: 0.5 }}], 'lives-': 'lifeLost', 'lvl+': 'levelup', 'over!': 'gameover' }} }}""",
  # games with their own globals
  'respect-my-authority': """{ state: () => ({ run, over, hits, auth, swing: sw.on, sorry: sorries.length, E, impacts, bubbles, rants }), mood: 'march',
    playing: s => s.run && !s.over,
    on: { 'swing!': 'swing', 'hits+': 'hit', 'impacts@': 'thud', 'E@': ['step', { vol: 0.5 }], 'bubbles@': 'blab', 'rants@': ['blab', { pitch: 0.7 }],
          'auth-': ['error', { vol: 0.6 }], 'sorry+': ['beep', { pitch: 1.4, vol: 0.5 }], 'over!': 'gameover' } }""",
  'grizzly': """{ state: () => ({ state, score, health, crowd, special, enemyHit, grizzlyHit, enemyDown, fluteBoost, opponent, chants }), mood: 'folk',
    playing: s => s.state === 'fight' || s.state === 'special',
    on: { 'enemyHit!': 'hit', 'grizzlyHit!': 'hurt', 'enemyDown!': 'crowd', 'opponent+': 'start', 'chants@': ['crowd', { vol: 0.4, pitch: 1.2 }],
          'fluteBoost!': () => [880, 1175, 1480].forEach((f, i) => BASound.tone({ f, dur: 0.22, type: 'sine', vol: 0.12, attack: 0.03, delay: i * 0.16 })),
          'state~': (s, v) => { if (v === 'special') BASound.play('perfect'); if (v === 'dead') BASound.play('gameover'); } } }""",
  'forest-pacification': """{ state: () => ({ state, armor, kills, beams: beams.length, heavyFX, wave, enemies, rocks, traps }), mood: 'march',
    playing: s => s.state === 'playing',
    on: { 'beams+': ['laser', { pitch: 0.7, vol: 0.6 }], 'kills+': 'explode', 'armor-': 'hit', 'heavyFX!': 'boom', 'wave+': 'warn',
          'enemies@': ['step', { vol: 0.4 }], 'rocks@': ['fall', { vol: 0.5 }], 'traps@': ['warn', { pitch: 0.6, vol: 0.5 }],
          'state~': (s, v) => { if (v === 'over') BASound.play('gameover'); if (v === 'complete') BASound.play('win'); } } }""",
  'grab-the-money': """{ state: () => ({ running, ended, score, thrown, pen: penalties.length, bills }), mood: 'cheeky',
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
