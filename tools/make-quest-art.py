"""Placeholder art for Quest Empire (RPG theme).

Sprites:   horizontal strip, 6 frames of 160x160, WebP with alpha, feet at bottom centre.
Backdrops: SVG 800x500. Gear: SVG, base + deluxe stage.

    python3 tools/make-quest-art.py games/quest-empire/assets
"""
import math, os, sys
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from artkit import FW, FH, S, C, shade, Pen, limb, biped, sheet as _sheet, svg

OUT = sys.argv[1] if len(sys.argv) > 1 else "games/quest-empire/assets"
for d in ("sprites", "rooms", "upgrades"):
    os.makedirs(os.path.join(OUT, d), exist_ok=True)


# ───────────────────────────── creatures ─────────────────────────────

def rat(t, body="#7a6a5a", size=1.0, crown=False, cape=None, cx=80, pen=None, phase=0.0):
    own = pen is None
    pen = pen or Pen()
    s = math.sin((t + phase) * 2 * math.pi)
    k = size
    base = 152
    if own: pen.shadow(cx, 30 * k)
    b = C(body)
    tail = [(cx - 26 * k, base - 12 * k), (cx - 42 * k, base - 18 * k + 4 * s), (cx - 54 * k, base - 8 * k - 4 * s), (cx - 62 * k, base - 16 * k)]
    pen.line(tail, C("#d9a3a3"), 3 * k)
    for i, lx in enumerate((-14, -4, 10, 18)):
        sw = 4 * math.sin((t + phase) * 2 * math.pi + i * 1.7) * k
        pen.line([(cx + lx * k, base - 10 * k), (cx + lx * k + sw, base)], shade(b, .7), 4 * k)
    if cape: pen.poly([(cx - 22 * k, base - 30 * k), (cx + 10 * k, base - 34 * k), (cx - 30 * k, base - 6 * k)], C(cape))
    pen.ell(cx, base - 18 * k + s, 28 * k, 16 * k, b)
    hx, hy = cx + 28 * k, base - 22 * k + s * 1.5
    pen.ell(hx, hy, 14 * k, 11 * k, b)
    pen.poly([(hx + 10 * k, hy - 4 * k), (hx + 24 * k, hy + 2 * k), (hx + 10 * k, hy + 6 * k)], b)
    pen.ell(hx + 24 * k, hy + 2 * k, 3 * k, 3 * k, C("#e88"))
    pen.ell(hx - 4 * k, hy - 11 * k, 7 * k, 7 * k, shade(b, 1.15)); pen.ell(hx - 4 * k, hy - 11 * k, 4 * k, 4 * k, C("#d9a3a3"))
    pen.ell(hx + 6 * k, hy - 3 * k, 2.4 * k, 2.4 * k, C("#c0392b") if crown else C("#111"))
    for dy in (-1, 2):
        pen.line([(hx + 18 * k, hy + dy * k), (hx + 30 * k, hy + dy * 3 * k)], C("#ddd", 180), 1)
    if crown:
        cy = hy - 14 * k
        pen.poly([(hx - 10 * k, cy + 6 * k), (hx - 10 * k, cy - 4 * k), (hx - 5 * k, cy + 1 * k), (hx, cy - 7 * k), (hx + 5 * k, cy + 1 * k), (hx + 10 * k, cy - 4 * k), (hx + 10 * k, cy + 6 * k)], C("#f1c40f"))
    return pen.done() if own else pen


def swarm(t):
    pen = Pen(); pen.shadow(80, 50)
    for cx, sz, ph in ((48, .55, 0), (102, .6, .35), (76, .7, .7)):
        rat(t, "#6b5d4f", sz, cx=cx, pen=pen, phase=ph)
    return pen.done()


def ghost(t, col="#dfe9f3", size=1.0):
    pen = Pen(); s = math.sin(t * 2 * math.pi); k = size
    pen.ell(80, 154, 22 * k, 3 * k, (0, 0, 0, 40))
    cy = 92 - 6 * s
    c = C(col, 200)
    pen.ell(80, cy - 18 * k, 26 * k, 28 * k, c)
    pts = [(54 * k + 80 - 54 * k, cy - 14 * k)]
    pts = [(80 - 26 * k, cy - 18 * k), (80 + 26 * k, cy - 18 * k)]
    wav = []
    for i in range(7):
        x = 80 + 26 * k - i * (52 * k / 6)
        y = cy + 30 * k + (6 if i % 2 else -2) * k + 3 * math.sin(t * 2 * math.pi + i)
        wav.append((x, y))
    pen.poly(pts + wav, c)
    pen.ell(70, cy - 22 * k, 5 * k, 7 * k, C("#1b1b2f")); pen.ell(88, cy - 22 * k, 5 * k, 7 * k, C("#1b1b2f"))
    pen.ell(79, cy - 6 * k, 5 * k, 6 * k + 2 * abs(s), C("#1b1b2f"))
    for sd in (-1, 1):
        pen.line([(80 + sd * 22 * k, cy - 8 * k), (80 + sd * 36 * k, cy - 18 * k + 6 * s * sd)], c, 7 * k)
    return pen.done()


def quadruped(t, body="#7f8c8d", size=1.0, neck=0.0, wings=None, horns=False, spikes=None, breath=False, mane=None, belly=None, eye="#f1c40f", cx=80):
    pen = Pen(); s = math.sin(t * 2 * math.pi); k = size
    pen.shadow(78, 40 * k)
    b = C(body); base = 152
    by = base - 30 * k + s
    # tail
    pen.line([(cx - 30 * k, by - 2 * k), (cx - 50 * k, by - 10 * k + 5 * s), (cx - 62 * k, by + 4 * k)], b, 6 * k if neck else 7 * k)
    if wings:
        flap = 18 * s
        pen.poly([(cx - 8 * k, by - 12 * k), (cx - 40 * k, by - 58 * k + flap), (cx + 6 * k, by - 50 * k + flap), (cx + 14 * k, by - 12 * k)], C(wings, 230))
    for i, lx in enumerate((-22, -12, 14, 24)):
        sw = 5 * math.sin(t * 2 * math.pi + i * 1.6) * k
        pen.line([(cx + lx * k, by + 6 * k), (cx + lx * k + sw, base)], shade(b, .75 if i % 2 else .9), 7 * k)
    pen.ell(cx, by, 34 * k, 18 * k, b)
    if belly: pen.ell(84, by + 8 * k, 22 * k, 8 * k, C(belly))
    if spikes:
        for i in range(5): x = cx - 20 * k + i * 10 * k; pen.poly([(x - 4 * k, by - 15 * k), (x, by - 25 * k), (x + 4 * k, by - 15 * k)], C(spikes))
    if mane: pen.ell(cx + 26 * k, by - 10 * k, 14 * k, 14 * k, C(mane))
    nx, ny = cx + 30 * k, by - 8 * k
    hx, hy = nx + (16 + 14 * neck) * k, ny - (8 + 30 * neck) * k + 2 * s
    if neck: pen.line([(nx, ny), ((nx + hx) / 2 + 4 * k, (ny + hy) / 2), (hx, hy)], b, 13 * k)
    pen.ell(hx, hy, 13 * k, 10 * k, b)
    pen.poly([(hx + 6 * k, hy - 6 * k), (hx + 26 * k, hy), (hx + 6 * k, hy + 7 * k)], b)
    pen.ell(hx + 3 * k, hy - 4 * k, 2.5 * k, 2.5 * k, C(eye))
    if horns:
        for d in (-1, 1): pen.poly([(hx - 6 * k, hy - 6 * k), (hx - 16 * k, hy - 20 * k + d * 2 * k), (hx - 1 * k, hy - 8 * k)], C("#e8e0c8"))
    else:
        pen.poly([(hx - 6 * k, hy - 6 * k), (hx - 2 * k, hy - 18 * k), (hx + 3 * k, hy - 7 * k)], shade(b, .8))
    if breath and 0.4 <= t < 0.85:
        for i in range(4):
            r = (4 + i * 2.5) * k
            pen.ell(hx + (28 + i * 6.5) * k, hy + 2 * k + (i % 2) * 2 * k, r, r * .8, C(["#fff3b0", "#ffd166", "#ff9f1c", "#ff5400", "#c0392b"][i], 220))
    return pen.done()


def golem(t, col="#8d8d8d", size=1.0):
    return biped(t, skin=col, top=col, legs=col, size=size, armor=False, belly="#6d6d6d", eyes="#3dd6ff", weapon=None)


SPRITES = {
    "cellar-rat":     lambda t: rat(t, "#7a6a5a", 1.0),
    "cellar-swarm":   swarm,
    "cellar-king":    lambda t: rat(t, "#5d4e60", 1.35, crown=True, cape="#8e1b1b"),
    "woods-scout":    lambda t: biped(t, skin="#6aa84f", top="#5b3a29", legs="#3d2b1f", size=.82, ears=True, weapon="dagger"),
    "woods-archer":   lambda t: biped(t, skin="#5e9c43", top="#2e5e2e", legs="#3d2b1f", size=.86, ears=True, weapon="bow", kind="shoot"),
    "woods-chief":    lambda t: biped(t, skin="#4f8a36", top="#7a1c1c", legs="#3d2b1f", size=1.05, ears=True, crown="#c9a227", weapon="club", horns=True),
    "crypt-skeleton": lambda t: biped(t, bones=True, top="#e8e4d8", legs="#e8e4d8", skin="#e8e4d8", size=.95, weapon="sword"),
    "crypt-ghost":    lambda t: ghost(t, "#dfe9f3", 1.0),
    "crypt-lich":     lambda t: biped(t, bones=True, skin="#e8e4d8", top="#3c1f5e", legs="#3c1f5e", robe=True, crown="#c9a227", weapon="staff", glow="#2ecc71", kind="cast", size=1.05),
    "bridge-wolf":    lambda t: quadruped(t, "#8a8f98", .95, mane="#6f747c", eye="#f1c40f"),
    "bridge-troll":   lambda t: biped(t, skin="#7d8f69", top="#6d5d4b", legs="#4d4033", size=1.25, ears=False, weapon="club", belly="#9aab84"),
    "bridge-golem":   lambda t: golem(t, "#8d8d8d", 1.3),
    "tower-imp":      lambda t: biped(t, skin="#c0392b", top="#c0392b", legs="#922b21", size=.7, horns=True, tail="#922b21", wings="#7b241c", floaty=True, eyes="#f1c40f"),
    "tower-armor":    lambda t: biped(t, top="#95a5a6", legs="#7f8c8d", skin="#95a5a6", armor=True, weapon="sword", glow="#3dd6ff", size=1.05),
    "tower-wizard":   lambda t: biped(t, skin="#f0c8a0", top="#2c3e9e", legs="#2c3e9e", robe=True, hat="#2c3e9e", weapon="staff", glow="#e056fd", kind="cast"),
    "lair-kobold":    lambda t: biped(t, skin="#d35400", top="#8e5a2b", legs="#6e4520", size=.72, horns=True, tail="#d35400", weapon="dagger", eyes="#f1c40f"),
    "lair-wyvern":    lambda t: quadruped(t, "#27ae60", .9, neck=.6, cx=70, wings="#1e8449", horns=True, belly="#a9dfbf", eye="#f1c40f"),
    "lair-dragon":    lambda t: quadruped(t, "#a93226", .8, neck=.75, cx=56, wings="#78281f", horns=True, spikes="#f5b041", breath=True, belly="#f5cba7", eye="#f1c40f"),
}
for n, fn in SPRITES.items():
    _sheet(OUT, n, fn)


# ───────────────────────────── backgrounds ─────────────────────────────

R = os.path.join(OUT, "rooms")
stones = lambda col, op: "".join(f'<rect x="{x + (35 if r % 2 else 0)}" y="{r * 34}" width="66" height="30" rx="5" fill="{col}" opacity="{op + .08 * ((x // 70 + r) % 3)}"/>' for r in range(10) for x in range(-70, 800, 70))
svg(os.path.join(R, "cellar.svg"), 800, 500, f'''
<rect width="800" height="500" fill="#2b1f1a"/>{stones("#4a3a30", .55)}
<defs><radialGradient id="l" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffcf7a" stop-opacity=".5"/><stop offset="1" stop-color="#ffcf7a" stop-opacity="0"/></radialGradient></defs>
<g fill="#4a2f1b">{"".join(f'<rect x="{x}" y="0" width="26" height="340"/>' for x in (60, 380, 700))}<rect x="0" y="40" width="800" height="22"/></g>
<circle cx="400" cy="140" r="170" fill="url(#l)"/><rect x="392" y="62" width="16" height="30" fill="#222"/><circle cx="400" cy="104" r="12" fill="#ffd27a"/>
<g>{"".join(f'<g transform="translate({x},{y})"><ellipse cx="40" cy="0" rx="40" ry="12" fill="#5d3a1f"/><rect x="0" y="0" width="80" height="90" fill="#7a4a24"/><ellipse cx="40" cy="90" rx="40" ry="12" fill="#5d3a1f"/><rect x="0" y="18" width="80" height="6" fill="#3a3a3a"/><rect x="0" y="66" width="80" height="6" fill="#3a3a3a"/></g>' for x, y in ((610, 230), (690, 250), (650, 160)))}</g>
<path d="M0 340 H800 V500 H0Z" fill="#3b2a20"/><g stroke="#2a1d16" stroke-width="3">{"".join(f'<line x1="0" y1="{y}" x2="800" y2="{y}"/>' for y in range(360, 500, 26))}</g>
<g fill="#000" opacity=".5"><ellipse cx="120" cy="335" rx="20" ry="12"/><ellipse cx="520" cy="333" rx="14" ry="9"/></g>''')

svg(os.path.join(R, "woods.svg"), 800, 500, f'''
<rect width="800" height="500" fill="#0f1d2b"/><circle cx="640" cy="90" r="46" fill="#f4f1d0" opacity=".9"/>
<g fill="#16301f">{"".join(f'<polygon points="{x},{330} {x + 60},{90 + (x * 37) % 80} {x + 120},330"/>' for x in range(-40, 820, 70))}</g>
<g fill="#1f4a2c">{"".join(f'<polygon points="{x},{340} {x + 45},{160 + (x * 53) % 70} {x + 90},340"/>' for x in range(-20, 820, 95))}</g>
<g><polygon points="140,330 200,230 260,330" fill="#8b5a2b"/><polygon points="200,230 220,330 180,330" fill="#5d3a1f"/>
<polygon points="520,330 590,215 660,330" fill="#7a4a24"/><polygon points="590,215 612,330 568,330" fill="#4a2f1b"/></g>
<path d="M0 330 H800 V500 H0Z" fill="#2e3b1f"/><g fill="#3f5228">{"".join(f'<ellipse cx="{x}" cy="{360 + (x * 7) % 120}" rx="18" ry="4"/>' for x in range(20, 800, 60))}</g>''')

svg(os.path.join(R, "crypt.svg"), 800, 500, f'''
<rect width="800" height="500" fill="#14121f"/>{stones("#2a2740", .6)}
<g fill="#0b0a14">{"".join(f'<path d="M{x} 340 V150 Q{x + 70} 70 {x + 140} 150 V340Z"/>' for x in (40, 330, 620))}</g>
<defs><linearGradient id="fog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2ecc71" stop-opacity="0"/><stop offset="1" stop-color="#2ecc71" stop-opacity=".25"/></linearGradient></defs>
<path d="M0 340 H800 V500 H0Z" fill="#23202f"/>
<g fill="#4b4760">{"".join(f'<path d="M{x} 340 v-40 q20 -24 40 0 v40z"/>' for x in (160, 260, 470, 560, 730))}</g>
<rect y="260" width="800" height="240" fill="url(#fog)"/>''')

svg(os.path.join(R, "bridge.svg"), 800, 500, f'''
<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6c8fb8"/><stop offset="1" stop-color="#d9e4ec"/></linearGradient></defs>
<rect width="800" height="500" fill="url(#sky)"/>
<polygon points="0,300 120,120 230,260 350,90 470,250 580,140 700,240 800,160 800,320 0,320" fill="#7d8a99"/>
<polygon points="350,90 380,140 320,140" fill="#fff"/><polygon points="120,120 145,160 95,160" fill="#fff"/><polygon points="580,140 600,170 560,170" fill="#fff"/>
<rect y="300" width="800" height="60" fill="#3d4a57"/>
<path d="M0 340 H800 V500 H0Z" fill="#8a7d6b"/><g stroke="#6e6252" stroke-width="3">{"".join(f'<line x1="{x}" y1="340" x2="{x}" y2="500"/>' for x in range(0, 800, 60))}<line x1="0" y1="420" x2="800" y2="420"/></g>
<g fill="#5e5446"><rect x="0" y="322" width="800" height="18"/>{"".join(f'<rect x="{x}" y="300" width="22" height="40"/>' for x in range(10, 800, 110))}</g>''')

svg(os.path.join(R, "tower.svg"), 800, 500, f'''
<rect width="800" height="500" fill="#1d1533"/>
<g fill="#2c2148">{"".join(f'<rect x="{x}" y="0" width="6" height="340"/>' for x in range(0, 800, 80))}</g>
<path d="M340 40 Q400 -10 460 40 V230 H340Z" fill="#0b0820"/><g fill="#fff">{"".join(f'<circle cx="{350 + (i * 37) % 100}" cy="{50 + (i * 53) % 170}" r="1.6"/>' for i in range(20))}</g>
<path d="M340 40 Q400 -10 460 40 V230 H340Z" fill="none" stroke="#c9a227" stroke-width="8"/><line x1="400" y1="15" x2="400" y2="230" stroke="#c9a227" stroke-width="5"/><line x1="340" y1="130" x2="460" y2="130" stroke="#c9a227" stroke-width="5"/>
<path d="M0 340 H800 V500 H0Z" fill="#3a2a55"/><g fill="#4b376e">{"".join(f'<rect x="{x}" y="{y}" width="58" height="22" rx="3"/>' for y in range(350, 500, 30) for x in range(-20 + (y // 30 % 2) * 30, 800, 64))}</g>''')

svg(os.path.join(R, "lair.svg"), 800, 500, f'''
<defs><radialGradient id="lava" cx=".5" cy="1" r=".8"><stop offset="0" stop-color="#ff5400" stop-opacity=".55"/><stop offset="1" stop-color="#ff5400" stop-opacity="0"/></radialGradient></defs>
<rect width="800" height="500" fill="#1a0f0f"/>
<path d="M0 0 H800 V120 Q700 60 640 150 Q560 50 470 130 Q400 40 330 140 Q240 60 170 150 Q90 70 0 140Z" fill="#0d0707"/>
<g fill="#2b1a17">{"".join(f'<polygon points="{x},0 {x + 20},{60 + (x * 31) % 50} {x + 40},0"/>' for x in range(0, 800, 55))}</g>
<rect width="800" height="500" fill="url(#lava)"/>
<path d="M0 340 H800 V500 H0Z" fill="#3a2420"/><path d="M0 470 Q200 440 400 470 T800 460 V500 H0Z" fill="#ff7b00" opacity=".75"/>
<g fill="#f1c40f">{"".join(f'<circle cx="{620 + (i * 13) % 160}" cy="{330 + (i * 7) % 20}" r="5"/>' for i in range(30))}</g>''')


# ───────────────────────────── gear ─────────────────────────────
U = os.path.join(OUT, "upgrades")
GEAR = {
    "cellar-torch": (80, 200, '<rect x="34" y="70" width="12" height="125" fill="#6d4c41"/><path d="M40 75 q-24 -30 0 -70 q24 40 0 70z" fill="#ff9f1c"/><path d="M40 70 q-10 -20 0 -42 q10 22 0 42z" fill="#fff3b0"/>',
                     '<circle cx="40" cy="45" r="34" fill="#ffcf7a" opacity=".3"/>'),
    "cellar-trap":  (200, 110, '<rect x="10" y="70" width="180" height="26" rx="4" fill="#8d6e63"/><path d="M30 70 Q100 0 170 70" fill="none" stroke="#9e9e9e" stroke-width="6"/><polygon points="80,70 120,70 100,46" fill="#f4d03f"/><g fill="#d4ac0d"><circle cx="95" cy="62" r="3"/><circle cx="106" cy="58" r="2.5"/></g>',
                     '<polygon points="130,70 170,70 150,40" fill="#f4d03f"/><polygon points="40,70 70,70 55,50" fill="#f4d03f"/>'),
    "cellar-cat":   (160, 150, '<ellipse cx="80" cy="120" rx="50" ry="24" fill="#e67e22"/><circle cx="118" cy="82" r="26" fill="#e67e22"/><polygon points="100,64 104,40 116,58" fill="#e67e22"/><polygon points="122,58 134,40 138,66" fill="#e67e22"/><circle cx="112" cy="80" r="4" fill="#111"/><circle cx="128" cy="80" r="4" fill="#111"/><path d="M30 120 q-30 -10 -24 -40" stroke="#e67e22" stroke-width="10" fill="none" stroke-linecap="round"/>',
                     '<polygon points="104,58 116,46 128,58 122,54 116,50 110,54" fill="#f1c40f"/><rect x="96" y="100" width="44" height="6" fill="#c0392b"/>'),
    "woods-fire":   (180, 130, '<g fill="#6d4c41"><rect x="30" y="100" width="120" height="14" rx="6" transform="rotate(12 90 107)"/><rect x="30" y="100" width="120" height="14" rx="6" transform="rotate(-12 90 107)"/></g><path d="M90 100 q-40 -40 0 -90 q40 50 0 90z" fill="#ff7b00"/><path d="M90 98 q-18 -24 0 -54 q18 30 0 54z" fill="#ffd166"/>',
                     '<g fill="#7f8c8d"><ellipse cx="40" cy="118" rx="14" ry="8"/><ellipse cx="140" cy="118" rx="14" ry="8"/><ellipse cx="90" cy="124" rx="14" ry="8"/></g><path d="M86 30 v-26" stroke="#555" stroke-width="3"/>'),
    "woods-loot":   (200, 140, '<g fill="#c9a227"><circle cx="70" cy="118" r="14"/><circle cx="96" cy="112" r="16"/><circle cx="124" cy="120" r="13"/></g><rect x="120" y="60" width="60" height="60" fill="#7a4a24"/><rect x="120" y="60" width="60" height="14" fill="#5d3a1f"/><path d="M20 120 l20 -60 l20 60z" fill="#95a5a6"/><rect x="36" y="110" width="8" height="24" fill="#6d4c41"/>',
                     '<g fill="#3dd6ff"><polygon points="90,80 100,64 110,80 100,92"/></g><g fill="#e74c3c"><circle cx="150" cy="54" r="8"/></g>'),
    "woods-totem":  (110, 260, '<rect x="35" y="40" width="40" height="220" fill="#8b5a2b"/><g fill="#c0392b"><rect x="25" y="60" width="60" height="12"/><rect x="25" y="150" width="60" height="12"/></g><g fill="#f4d03f"><circle cx="46" cy="100" r="7"/><circle cx="66" cy="100" r="7"/><circle cx="46" cy="190" r="7"/><circle cx="66" cy="190" r="7"/></g><polygon points="20,40 55,0 90,40" fill="#2e5e2e"/>',
                     '<g fill="#2ecc71" opacity=".8"><circle cx="46" cy="100" r="10"/><circle cx="66" cy="100" r="10"/></g><g fill="#ecf0f1"><polygon points="10,60 35,70 10,80"/><polygon points="100,60 75,70 100,80"/></g>'),
    "crypt-candles":(240, 120, "".join(f'<rect x="{x}" y="{60 + (x % 3) * 10}" width="16" height="{60 - (x % 3) * 10}" fill="#ecf0f1"/><path d="M{x + 8} {60 + (x % 3) * 10} q-8 -14 0 -28 q8 14 0 28z" fill="#ffd166"/>' for x in (20, 60, 100, 140, 180)),
                     "".join(f'<circle cx="{x + 8}" cy="{48 + (x % 3) * 10}" r="16" fill="#ffd166" opacity=".25"/>' for x in (20, 60, 100, 140, 180))),
    "crypt-coffin": (140, 240, '<polygon points="30,10 110,10 130,70 100,235 40,235 10,70" fill="#4a2f1b"/><polygon points="40,22 100,22 116,72 92,222 48,222 24,72" fill="#5d3a1f"/><rect x="64" y="60" width="12" height="80" fill="#c9a227"/><rect x="44" y="84" width="52" height="12" fill="#c9a227"/>',
                     '<polygon points="30,10 110,10 130,70 100,235 40,235 10,70" fill="none" stroke="#2ecc71" stroke-width="6" opacity=".6"/>'),
    "crypt-altar":  (220, 170, '<rect x="20" y="80" width="180" height="80" fill="#4b4760"/><rect x="10" y="70" width="200" height="16" fill="#5f5a78"/><circle cx="110" cy="40" r="26" fill="#2ecc71" opacity=".8"/><circle cx="110" cy="40" r="12" fill="#a9dfbf"/><g fill="#1b1830"><polygon points="60,110 70,140 50,140"/><polygon points="160,110 170,140 150,140"/></g>',
                     '<circle cx="110" cy="40" r="40" fill="#2ecc71" opacity=".25"/><g stroke="#2ecc71" stroke-width="3"><line x1="110" y1="0" x2="110" y2="14"/><line x1="70" y1="40" x2="82" y2="40"/><line x1="138" y1="40" x2="150" y2="40"/></g>'),
    "bridge-sign":  (180, 220, '<rect x="84" y="80" width="12" height="140" fill="#6d4c41"/><rect x="10" y="20" width="160" height="80" rx="6" fill="#a47148"/><text x="90" y="56" text-anchor="middle" font-family="Georgia,serif" font-weight="bold" font-size="26" fill="#3d2b1f">TOLL</text><text x="90" y="88" text-anchor="middle" font-family="Georgia,serif" font-size="20" fill="#3d2b1f">3 gold</text>',
                     '<rect x="10" y="20" width="160" height="80" rx="6" fill="none" stroke="#c9a227" stroke-width="6"/><circle cx="160" cy="24" r="10" fill="#f1c40f"/>'),
    "bridge-chest": (200, 150, '<rect x="20" y="60" width="160" height="80" fill="#7a4a24"/><path d="M20 60 Q100 0 180 60z" fill="#8b5a2b"/><g fill="#c9a227"><rect x="20" y="58" width="160" height="10"/><rect x="90" y="70" width="20" height="26"/><rect x="40" y="20" width="10" height="120"/><rect x="150" y="20" width="10" height="120"/></g>',
                     '<g fill="#f1c40f"><circle cx="70" cy="40" r="10"/><circle cx="100" cy="30" r="12"/><circle cx="130" cy="40" r="10"/></g><polygon points="96,10 104,10 110,22 90,22" fill="#3dd6ff"/>'),
    "bridge-rune":  (140, 240, '<path d="M20 240 L30 30 Q70 0 110 30 L120 240z" fill="#7f8c8d"/><g stroke="#3dd6ff" stroke-width="6" fill="none"><path d="M70 60 v60 l-20 -20 m20 20 l20 -20"/><path d="M50 160 h40 l-20 40z"/></g>',
                     '<path d="M20 240 L30 30 Q70 0 110 30 L120 240z" fill="#3dd6ff" opacity=".18"/><g fill="#3dd6ff"><circle cx="30" cy="20" r="4"/><circle cx="118" cy="30" r="3"/></g>'),
    "tower-books":  (220, 260, '<rect x="10" y="10" width="200" height="245" fill="#4a2f1b"/>' + "".join(f'<rect x="{20 + i * 22}" y="{20 + r * 80}" width="18" height="{62 - (i * 7 + r * 5) % 18}" transform="translate(0 {(i * 7 + r * 5) % 18})" fill="{["#c0392b", "#2980b9", "#27ae60", "#8e44ad", "#d35400", "#16a085", "#c9a227", "#7f8c8d", "#2c3e50"][(i + r) % 9]}"/>' for r in range(3) for i in range(9)) + "".join(f'<rect x="10" y="{80 + r * 80}" width="200" height="8" fill="#3a2010"/>' for r in range(3)),
                     '<g fill="#e056fd"><circle cx="40" cy="14" r="5"/><circle cx="180" cy="100" r="4"/><circle cx="110" cy="180" r="5"/></g>'),
    "tower-orb":    (160, 200, '<polygon points="40,190 120,190 100,140 60,140" fill="#c9a227"/><circle cx="80" cy="90" r="56" fill="#8e44ad" opacity=".85"/><circle cx="62" cy="70" r="14" fill="#fff" opacity=".6"/>',
                     '<circle cx="80" cy="90" r="74" fill="#e056fd" opacity=".25"/><g stroke="#fff" stroke-width="2" opacity=".7"><path d="M60 100 q20 -30 40 0 t20 0"/></g>'),
    "tower-circle": (800, 120, '<ellipse cx="400" cy="70" rx="300" ry="44" fill="none" stroke="#e056fd" stroke-width="6" opacity=".8"/><ellipse cx="400" cy="70" rx="250" ry="34" fill="none" stroke="#e056fd" stroke-width="3" opacity=".6"/>' + "".join(f'<text x="{400 + 275 * math.cos(a / 8 * 2 * math.pi):.0f}" y="{76 + 40 * math.sin(a / 8 * 2 * math.pi):.0f}" font-size="18" fill="#e056fd" text-anchor="middle">ᚱ</text>' for a in range(8)),
                     '<ellipse cx="400" cy="70" rx="300" ry="44" fill="#e056fd" opacity=".18"/><g fill="#fff"><circle cx="400" cy="20" r="4"/><circle cx="200" cy="50" r="3"/><circle cx="600" cy="50" r="3"/></g>'),
    "lair-gold":    (260, 120, '<path d="M10 115 Q130 -10 250 115z" fill="#c9a227"/>' + "".join(f'<circle cx="{30 + (i * 37) % 200}" cy="{60 + (i * 23) % 50}" r="7" fill="#f1c40f"/>' for i in range(22)),
                     '<g fill="#3dd6ff"><polygon points="100,40 110,26 120,40 110,52"/></g><g fill="#e74c3c"><polygon points="160,50 170,36 180,50 170,62"/></g><rect x="60" y="30" width="34" height="22" fill="#d4ac0d"/>'),
    "lair-egg":     (140, 180, '<ellipse cx="70" cy="100" rx="48" ry="68" fill="#16a085"/><g fill="#1abc9c"><circle cx="50" cy="80" r="8"/><circle cx="86" cy="110" r="10"/><circle cx="60" cy="140" r="7"/></g>',
                     '<path d="M40 60 l20 20 l-10 14 l24 16" stroke="#f1c40f" stroke-width="4" fill="none"/><ellipse cx="70" cy="100" rx="62" ry="80" fill="#f1c40f" opacity=".18"/>'),
    "lair-sword":   (140, 260, '<path d="M10 260 Q70 160 130 260z" fill="#5d5d5d"/><rect x="62" y="20" width="16" height="190" fill="#dfe6e9"/><polygon points="62,20 78,20 70,0" fill="#dfe6e9"/><rect x="34" y="150" width="72" height="12" fill="#c9a227"/><rect x="64" y="162" width="12" height="40" fill="#6d4c41"/>',
                     '<g stroke="#f1c40f" stroke-width="3"><line x1="70" y1="0" x2="70" y2="-10"/><line x1="40" y1="40" x2="30" y2="30"/><line x1="100" y1="40" x2="110" y2="30"/></g><rect x="62" y="20" width="16" height="190" fill="#fff" opacity=".35"/>'),
}
for name, (w, h, base, deluxe) in GEAR.items():
    svg(os.path.join(U, name + ".svg"), w, h, base)
    svg(os.path.join(U, name + "-deluxe.svg"), w, h, base + deluxe)
print("ok", len(SPRITES), "sprites,", len(GEAR) * 2, "gear images, 6 rooms")
