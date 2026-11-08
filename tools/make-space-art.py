"""Placeholder art for Space Empire.

Sprites: 6 frames of 160x160 (WebP, alpha). Backdrops: SVG 800x500. Modules: SVG, base + deluxe.

    python3 tools/make-space-art.py games/space-empire/assets
"""
import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from artkit import C, shade, Pen, limb, biped, sheet, svg

OUT = next((a for a in sys.argv[1:] if not a.startswith("--")), None) or "games/space-empire/assets"
for d in ("sprites", "rooms", "upgrades"):
    os.makedirs(os.path.join(OUT, d), exist_ok=True)


def astronaut(t, suit="#ecf0f1", trim="#3498db", visor="#5dade2", size=1.0, tool=None, kind="idle"):
    im = biped(t, skin=suit, top=suit, legs=shade(C(suit), .85) and suit, size=size, weapon=tool, kind=kind, glow="#3dd6ff" if tool == "staff" else None)
    # helmet visor + backpack drawn on top of the biped's head/torso area
    pen = Pen(); pen.im = im.resize((160 * 3, 160 * 3)); from PIL import ImageDraw; pen.d = ImageDraw.Draw(pen.im)
    s = math.sin(t * 2 * math.pi)
    hip = (80, 154 - 52 * size + 1.5 * s)
    neck = limb(hip, 180 + 4 * s, 40 * size)
    head = limb(neck, 182 + 2 * s, 14 * size)
    pen.ell(head[0], head[1], 15 * size, 15 * size, C(suit))
    pen.ell(head[0] + 4 * size, head[1], 10 * size, 8 * size, C(visor))
    pen.ell(head[0] + 1 * size, head[1] - 3 * size, 3 * size, 2 * size, (255, 255, 255, 200))
    pen.rect(neck[0] - 19 * size, neck[1] + 2 * size, neck[0] - 11 * size, neck[1] + 28 * size, C(trim), 2 * size)
    pen.line([(hip[0] - 13 * size, hip[1] - 4 * size), (hip[0] + 13 * size, hip[1] - 4 * size)], C(trim), 3 * size)
    return pen.done()


def robot(t, body="#95a5a6", eye="#3dd6ff", size=1.0, dish=False, drill=False):
    pen = Pen(); s = math.sin(t * 2 * math.pi); k = size
    pen.shadow(80, 30 * k)
    base = 152
    # treads
    pen.rect(80 - 30 * k, base - 16 * k, 80 + 30 * k, base, C("#2d3436"), 8 * k)
    for i in range(5):
        x = 80 - 24 * k + i * 12 * k + (t * 12 * k) % (12 * k)
        pen.ell(x, base - 8 * k, 4 * k, 4 * k, C("#636e72"))
    b = C(body)
    pen.rect(80 - 22 * k, base - 52 * k + s, 80 + 22 * k, base - 16 * k, b, 6 * k)
    pen.rect(80 - 16 * k, base - 46 * k + s, 80 + 16 * k, base - 30 * k + s, shade(b, .8), 3 * k)
    hy = base - 64 * k + 2 * s
    pen.rect(80 - 14 * k, hy - 10 * k, 80 + 14 * k, hy + 10 * k, shade(b, 1.1), 5 * k)
    pen.rect(80 - 9 * k, hy - 4 * k, 80 + 11 * k, hy + 3 * k, C("#111"), 2 * k)
    blink = 1 if t < .85 else .3
    pen.ell(80 + 4 * k, hy - .5 * k, 3 * k * blink + 1, 2.4 * k, C(eye))
    pen.line([(80, hy - 10 * k), (80, hy - 20 * k)], shade(b, .7), 2 * k)
    pen.ell(80, hy - 21 * k, 3 * k, 3 * k, C("#e74c3c") if t < .5 else C("#f1c40f"))
    arm_a = 60 + 30 * s
    sh = (80 + 20 * k, base - 44 * k + s)
    el = limb(sh, arm_a, 16 * k); hd = limb(el, arm_a + 30, 14 * k)
    pen.line([sh, el, hd], shade(b, .7), 5 * k)
    if drill:
        tip = limb(hd, arm_a + 30, 16 * k)
        pen.poly([limb(hd, arm_a + 120, 5 * k), limb(hd, arm_a - 60, 5 * k), tip], C("#f39c12"))
    else:
        pen.ell(hd[0], hd[1], 4 * k, 4 * k, shade(b, .6))
    if dish:
        dx, dy = 80 - 20 * k, base - 56 * k
        pen.line([(dx, dy + 6 * k), (dx, dy - 6 * k)], shade(b, .7), 2 * k)
        pen.d.chord([(dx - 14 * k) * 3, (dy - 22 * k) * 3, (dx + 14 * k) * 3, (dy - 2 * k) * 3], 180 + 20 * s, 360 + 20 * s, fill=C("#dfe6e9"))
    return pen.done()


def drone(t, body="#bdc3c7", light="#2ecc71", size=1.0, claw=False):
    pen = Pen(); s = math.sin(t * 2 * math.pi); k = size
    pen.ell(80, 154, 20 * k, 3 * k, (0, 0, 0, 50))
    cy = 92 - 8 * s
    for sd in (-1, 1):
        x = 80 + sd * 30 * k
        pen.line([(80, cy), (x, cy - 6 * k)], shade(C(body), .7), 3 * k)
        w = 16 * k * (0.4 + 0.6 * abs(math.sin(t * 12 * math.pi + sd)))
        pen.ell(x, cy - 9 * k, w, 3 * k, C("#dfe6e9", 160))
        pen.ell(x, cy - 6 * k, 4 * k, 3 * k, shade(C(body), .6))
    pen.ell(80, cy, 18 * k, 11 * k, C(body))
    pen.ell(80, cy + 2 * k, 10 * k, 6 * k, C("#2d3436"))
    pen.ell(84 * 1, cy + 2 * k, 3 * k, 3 * k, C(light) if t < .5 else C("#e74c3c"))
    for i in range(3):
        pen.ell(80, cy + (16 + i * 7) * k, (4 - i) * k, (3 - i * .7) * k, C("#3dd6ff", 200 - i * 60))
    if claw:
        pen.line([(74, cy + 10 * k), (70, cy + 22 * k)], C("#7f8c8d"), 2 * k); pen.line([(86, cy + 10 * k), (90, cy + 22 * k)], C("#7f8c8d"), 2 * k)
        pen.ell(80, cy + 26 * k, 7 * k, 6 * k, C("#8d6e63"))
    return pen.done()


def mech(t, col="#f39c12", glass="#5dade2", size=1.25):
    im = biped(t, skin=col, top=col, legs=shade(C(col), .7) and col, armor=True, size=size, weapon="sword" if col == "#c0392b" else None, glow=glass)
    return im


def squid(t, col="#9b59b6", size=1.0):
    pen = Pen(); s = math.sin(t * 2 * math.pi); k = size
    pen.ell(80, 154, 26 * k, 3 * k, (0, 0, 0, 50))
    cy = 82 - 5 * s
    c = C(col)
    for i in range(6):
        x0 = 80 - 20 * k + i * 8 * k
        ph = t * 2 * math.pi + i
        pts = [(x0, cy + 14 * k), (x0 + 6 * math.sin(ph) * k, cy + 34 * k), (x0 - 6 * math.sin(ph + 1) * k, cy + 52 * k), (x0 + 4 * math.sin(ph + 2) * k, cy + 66 * k)]
        pen.line(pts, shade(c, .85), 5 * k)
    pen.ell(80, cy, 30 * k, 26 * k, c)
    pen.ell(68, cy - 2 * k, 8 * k, 9 * k, C("#fff")); pen.ell(92, cy - 2 * k, 8 * k, 9 * k, C("#fff"))
    pen.ell(70, cy, 4 * k, 5 * k, C("#111")); pen.ell(94, cy, 4 * k, 5 * k, C("#111"))
    pen.d.arc([(72) * 3, (cy + 6 * k) * 3, (88) * 3, (cy + 16 * k) * 3], 0, 180, fill=C("#4a235a"), width=6)
    for i, (dx, dy) in enumerate(((-14, -18), (6, -22), (18, -14))):
        pen.ell(80 + dx * k, cy + dy * k, 3 * k, 3 * k, shade(c, 1.25))
    return pen.done()


def core(t, col="#3dd6ff", size=1.0):
    pen = Pen(); s = math.sin(t * 2 * math.pi); k = size
    pen.ell(80, 154, 18 * k, 3 * k, (0, 0, 0, 50))
    cy = 84 - 6 * s
    pen.ell(80, cy, 34 * k, 34 * k, C(col, 50))
    pen.ell(80, cy, 22 * k, 22 * k, C(col, 220))
    pen.ell(80, cy, 12 * k, 12 * k, C("#ffffff", 230))
    a = t * 2 * math.pi
    for i, (rx, ry, rot) in enumerate(((44, 12, 0), (40, 10, 1.1))):
        pts = []
        for j in range(40):
            u = j / 39 * 2 * math.pi
            x, y = rx * math.cos(u) * k, ry * math.sin(u) * k
            cr, sr = math.cos(rot + a * (1 if i else -1) * .3), math.sin(rot + a * (1 if i else -1) * .3)
            pts.append((80 + x * cr - y * sr, cy + x * sr + y * cr))
        pen.line(pts, C("#f1c40f" if i else "#ecf0f1", 200), 2 * k)
    bx = 80 + 44 * k * math.cos(a); by = cy + 12 * k * math.sin(a)
    pen.ell(bx, by, 4 * k, 4 * k, C("#f1c40f"))
    return pen.done()


def alien(t):
    return biped(t, skin="#58d68d", top="#7d3c98", legs="#7d3c98", robe=True, size=1.1, weapon="staff", glow="#f1c40f", kind="cast", eyes="#111", horns=False, ears=False, crown="#f1c40f")


SPRITES = {
    "moon-bot":        lambda t: robot(t, "#b2bec3", size=.9),
    "moon-astronaut":  lambda t: astronaut(t, "#ecf0f1", "#3498db", "#5dade2", .95),
    "moon-commander":  lambda t: astronaut(t, "#ecf0f1", "#c0392b", "#f1c40f", 1.05, tool="staff", kind="cast"),
    "mars-rover":      lambda t: robot(t, "#e1b12c", size=.95, dish=True),
    "mars-botanist":   lambda t: astronaut(t, "#dfe6e9", "#27ae60", "#58d68d", .95),
    "mars-terraformer":lambda t: mech(t, "#c0392b", "#f39c12", 1.25),
    "belt-drone":      lambda t: drone(t, "#bdc3c7", "#2ecc71", 1.0, claw=True),
    "belt-miner":      lambda t: astronaut(t, "#e67e22", "#2d3436", "#f5b041", .95, tool="club"),
    "belt-hauler":     lambda t: mech(t, "#f1c40f", "#3dd6ff", 1.3),
    "ice-driller":     lambda t: robot(t, "#74b9ff", size=.9, drill=True),
    "ice-biologist":   lambda t: astronaut(t, "#dff9fb", "#16a085", "#48c9b0", .95),
    "ice-squid":       lambda t: squid(t, "#9b59b6", 1.05),
    "gas-skimmer":     lambda t: drone(t, "#f5cba7", "#3dd6ff", 1.1),
    "gas-chief":       lambda t: astronaut(t, "#f0f3f4", "#e74c3c", "#f5b041", 1.0, tool="sword"),
    "gas-core":        lambda t: core(t, "#3dd6ff", 1.0),
    "ring-bot":        lambda t: robot(t, "#f1c40f", eye="#e74c3c", size=.9),
    "ring-engineer":   lambda t: astronaut(t, "#ffffff", "#8e44ad", "#a569bd", 1.0, tool="staff", kind="cast"),
    "ring-ambassador": alien,
}
for n, fn in SPRITES.items():
    sheet(OUT, n, fn)

# ───────────────────────────── backdrops ─────────────────────────────
stars = lambda n, h=330, seed=7: "".join(f'<circle cx="{(i * 97 + seed * 13) % 800}" cy="{(i * 61 + seed) % h}" r="{1 + (i % 3) * .5}" fill="#fff" opacity="{.4 + (i % 4) * .15}"/>' for i in range(n))
R = os.path.join(OUT, "rooms")
svg(os.path.join(R, "moon.svg"), 800, 500, f'''<rect width="800" height="500" fill="#05060f"/>{stars(70)}
<circle cx="640" cy="110" r="60" fill="#2e86de"/><path d="M600 80 q30 -10 40 20 q-20 30 -40 10z M650 130 q30 -10 30 20 q-20 10 -30 -20z" fill="#27ae60"/><circle cx="640" cy="110" r="60" fill="none" stroke="#a9cce3" stroke-width="4" opacity=".5"/>
<path d="M0 320 Q200 290 400 315 T800 310 V500 H0Z" fill="#7f8c8d"/><path d="M0 340 H800 V500 H0Z" fill="#95a5a6"/>
<g fill="#7b8a8b">{"".join(f'<ellipse cx="{x}" cy="{y}" rx="{r}" ry="{r * .35}"/>' for x, y, r in ((120, 380, 40), (420, 440, 60), (690, 400, 34), (300, 360, 20)))}</g>''')
svg(os.path.join(R, "mars.svg"), 800, 500, f'''<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d35400"/><stop offset="1" stop-color="#f5cba7"/></linearGradient></defs>
<rect width="800" height="500" fill="url(#sky)"/><circle cx="150" cy="90" r="18" fill="#fdebd0" opacity=".9"/><circle cx="560" cy="60" r="8" fill="#fdebd0" opacity=".7"/>
<polygon points="0,320 140,210 260,300 420,170 560,290 700,220 800,300 800,330 0,330" fill="#a04000"/>
<path d="M0 330 Q200 310 400 330 T800 325 V500 H0Z" fill="#c0612b"/><path d="M0 400 Q300 370 800 410 V500 H0Z" fill="#b9541f" opacity=".7"/>''')
svg(os.path.join(R, "belt.svg"), 800, 500, f'''<rect width="800" height="500" fill="#070712"/>{stars(90)}
<circle cx="120" cy="80" r="30" fill="#f9e79f" opacity=".9"/>
<g fill="#5d6d7e">{"".join(f'<ellipse cx="{(i * 131) % 800}" cy="{60 + (i * 47) % 220}" rx="{10 + i % 5 * 6}" ry="{7 + i % 4 * 4}" transform="rotate({i * 23} {(i * 131) % 800} {60 + (i * 47) % 220})"/>' for i in range(18))}</g>
<path d="M0 330 Q100 300 220 320 Q380 290 520 325 Q660 300 800 320 V500 H0Z" fill="#566573"/><path d="M0 360 H800 V500 H0Z" fill="#4d5656"/>
<g fill="#3d4646">{"".join(f'<circle cx="{x}" cy="{y}" r="{r}"/>' for x, y, r in ((90, 420, 22), (350, 470, 30), (610, 430, 18), (740, 470, 26)))}</g>''')
svg(os.path.join(R, "ice.svg"), 800, 500, f'''<rect width="800" height="500" fill="#06101f"/>{stars(60)}
<circle cx="620" cy="140" r="120" fill="#d68910"/><g fill="#a04000" opacity=".6"><rect x="500" y="100" width="240" height="14"/><rect x="505" y="140" width="230" height="22"/><rect x="515" y="185" width="210" height="10"/></g><ellipse cx="660" cy="170" rx="22" ry="12" fill="#922b21"/>
<path d="M0 320 Q200 300 400 318 T800 312 V500 H0Z" fill="#d6eaf8"/><path d="M0 345 H800 V500 H0Z" fill="#aed6f1"/>
<g stroke="#85c1e9" stroke-width="3" fill="none"><path d="M60 380 l60 30 l40 -20 l70 40"/><path d="M420 360 l50 40 l80 -10"/><path d="M600 440 l70 -30 l60 20"/></g>''')
svg(os.path.join(R, "gas.svg"), 800, 500, '''<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a235a"/><stop offset=".5" stop-color="#d35400"/><stop offset="1" stop-color="#f5b041"/></linearGradient></defs>
<rect width="800" height="500" fill="url(#g)"/>''' + "".join(f'<path d="M0 {y} Q200 {y - 20} 400 {y} T800 {y} V{y + 18} H0Z" fill="#fff" opacity=".12"/>' for y in (90, 150, 210, 270)) + '''
<rect x="0" y="335" width="800" height="18" fill="#566573"/><rect x="0" y="353" width="800" height="147" fill="#2c3e50"/>
<g fill="#7f8c8d">''' + "".join(f'<rect x="{x}" y="353" width="10" height="147"/>' for x in range(30, 800, 120)) + '''</g><g stroke="#f1c40f" stroke-width="4" stroke-dasharray="20 14"><line x1="0" y1="344" x2="800" y2="344"/></g>''')
svg(os.path.join(R, "ring.svg"), 800, 500, f'''<rect width="800" height="500" fill="#030308"/>{stars(80)}
<circle cx="400" cy="140" r="70" fill="#fffde7"/><circle cx="400" cy="140" r="110" fill="#f9e79f" opacity=".25"/><circle cx="400" cy="140" r="160" fill="#f9e79f" opacity=".1"/>
<ellipse cx="400" cy="160" rx="380" ry="70" fill="none" stroke="#7f8c8d" stroke-width="14"/><ellipse cx="400" cy="160" rx="380" ry="70" fill="none" stroke="#f1c40f" stroke-width="3" stroke-dasharray="10 30"/>
<path d="M0 330 H800 V500 H0Z" fill="#34495e"/><g fill="#2c3e50">{"".join(f'<rect x="{x}" y="340" width="70" height="40" rx="4"/>' for x in range(10, 800, 85))}</g>
<g fill="#1a5276">{"".join(f'<rect x="{x + 6}" y="346" width="58" height="28"/>' for x in range(10, 800, 85))}</g><path d="M0 390 H800 V500 H0Z" fill="#2c3e50"/>''')

# ───────────────────────────── modules ─────────────────────────────
U = os.path.join(OUT, "upgrades")
MOD = {
    "moon-solar": (220, 160, '<rect x="104" y="80" width="12" height="80" fill="#7f8c8d"/><g transform="rotate(-12 110 60)"><rect x="10" y="30" width="200" height="60" fill="#1a5276" stroke="#aab7b8" stroke-width="4"/>' + "".join(f'<line x1="{x}" y1="30" x2="{x}" y2="90" stroke="#5dade2" stroke-width="2"/>' for x in range(50, 210, 40)) + '</g>', '<g transform="rotate(-12 110 60)"><rect x="10" y="30" width="200" height="60" fill="#f9e79f" opacity=".25"/></g>'),
    "moon-dish": (180, 200, '<rect x="84" y="110" width="12" height="90" fill="#7f8c8d"/><path d="M20 40 Q90 150 160 40z" fill="#ecf0f1"/><line x1="90" y1="95" x2="110" y2="20" stroke="#7f8c8d" stroke-width="4"/><circle cx="110" cy="18" r="6" fill="#e74c3c"/>', '<g fill="none" stroke="#3dd6ff" stroke-width="3" opacity=".7"><path d="M125 8 q12 10 0 22"/><path d="M135 0 q20 18 0 38"/></g>'),
    "moon-rocket": (140, 300, '<polygon points="70,10 100,80 100,240 40,240 40,80" fill="#ecf0f1"/><polygon points="40,180 10,250 40,240" fill="#c0392b"/><polygon points="100,180 130,250 100,240" fill="#c0392b"/><circle cx="70" cy="110" r="14" fill="#5dade2" stroke="#7f8c8d" stroke-width="4"/><rect x="20" y="250" width="100" height="20" fill="#566573"/>', '<path d="M55 270 q15 40 30 0" fill="#f39c12"/><text x="70" y="160" text-anchor="middle" font-family="Arial Black,sans-serif" font-size="14" fill="#c0392b">BA-1</text>'),
    "mars-dome": (260, 150, '<path d="M10 140 Q130 -20 250 140z" fill="#a9dfbf" opacity=".55" stroke="#ecf0f1" stroke-width="4"/><g fill="#27ae60"><circle cx="80" cy="110" r="18"/><circle cx="130" cy="100" r="24"/><circle cx="185" cy="112" r="16"/></g><rect x="10" y="132" width="240" height="10" fill="#7f8c8d"/>', '<g fill="#e74c3c"><circle cx="122" cy="92" r="4"/><circle cx="140" cy="104" r="4"/><circle cx="78" cy="104" r="3"/></g>'),
    "mars-pump": (160, 220, '<rect x="40" y="60" width="80" height="150" fill="#95a5a6"/><rect x="50" y="20" width="60" height="40" fill="#7f8c8d"/><rect x="62" y="80" width="36" height="60" fill="#3498db"/><rect x="20" y="190" width="120" height="20" fill="#566573"/>', '<g fill="#3498db"><circle cx="30" cy="180" r="8"/><circle cx="130" cy="178" r="6"/></g><rect x="62" y="80" width="36" height="20" fill="#85c1e9"/>'),
    "mars-tower": (120, 300, '<polygon points="40,300 80,300 70,40 50,40" fill="#7f8c8d"/><rect x="30" y="20" width="60" height="30" fill="#566573"/><g stroke="#95a5a6" stroke-width="3"><line x1="45" y1="100" x2="75" y2="160"/><line x1="75" y1="100" x2="45" y2="160"/><line x1="43" y1="180" x2="77" y2="240"/><line x1="77" y1="180" x2="43" y2="240"/></g>', '<ellipse cx="60" cy="10" rx="50" ry="16" fill="#a9dfbf" opacity=".6"/><ellipse cx="60" cy="0" rx="34" ry="10" fill="#a9dfbf" opacity=".4"/>'),
    "belt-crusher": (220, 170, '<rect x="20" y="60" width="180" height="100" fill="#7f8c8d"/><polygon points="40,60 180,60 150,10 70,10" fill="#566573"/><g fill="#2d3436">' + "".join(f'<rect x="{x}" y="80" width="18" height="60"/>' for x in range(40, 190, 30)) + '</g>', '<g fill="#f1c40f">' + "".join(f'<circle cx="{x}" cy="16" r="6"/>' for x in (80, 110, 140)) + '</g>'),
    "belt-depot": (260, 140, '<rect x="10" y="40" width="240" height="90" fill="#2c3e50"/><g fill="#e67e22">' + "".join(f'<rect x="{x}" y="60" width="44" height="60"/>' for x in (24, 84, 144, 204)) + '</g><rect x="10" y="30" width="240" height="14" fill="#566573"/>', '<g fill="#f1c40f">' + "".join(f'<polygon points="{x + 22},50 {x + 30},62 {x + 14},62"/>' for x in (24, 84, 144, 204)) + '</g>'),
    "belt-tractor": (200, 260, '<rect x="90" y="120" width="20" height="140" fill="#7f8c8d"/><circle cx="100" cy="90" r="50" fill="#5d6d7e"/><circle cx="100" cy="90" r="30" fill="#3dd6ff" opacity=".7"/>', '<polygon points="80,20 120,20 180,-60 20,-60" fill="#3dd6ff" opacity=".3" transform="translate(0 60)"/>'),
    "ice-drill": (140, 260, '<rect x="62" y="40" width="16" height="200" fill="#7f8c8d"/><polygon points="50,240 90,240 70,260" fill="#f39c12"/><rect x="30" y="10" width="80" height="50" fill="#2e86c1"/><rect x="20" y="190" width="100" height="16" fill="#566573"/>', '<g fill="#d6eaf8">' + "".join(f'<circle cx="{x}" cy="{240 + (x % 3) * 6}" r="5"/>' for x in (40, 55, 85, 100)) + '</g>'),
    "ice-sub": (240, 140, '<ellipse cx="120" cy="80" rx="100" ry="40" fill="#f1c40f"/><rect x="100" y="20" width="40" height="34" fill="#f1c40f"/><g fill="#5dade2">' + "".join(f'<circle cx="{x}" cy="80" r="10"/>' for x in (70, 110, 150)) + '</g><polygon points="20,80 0,60 0,100" fill="#d4ac0d"/>', '<g fill="#d6eaf8" opacity=".7"><circle cx="230" cy="50" r="6"/><circle cx="220" cy="30" r="4"/></g>'),
    "ice-lab": (260, 160, '<rect x="10" y="60" width="240" height="90" fill="#ecf0f1"/><path d="M10 60 Q130 -10 250 60z" fill="#d6eaf8"/><rect x="40" y="90" width="50" height="40" fill="#48c9b0"/><rect x="110" y="90" width="50" height="40" fill="#48c9b0"/><rect x="180" y="90" width="50" height="60" fill="#566573"/>', '<text x="130" y="50" text-anchor="middle" font-family="Arial Black,sans-serif" font-size="18" fill="#16a085">LAB</text>'),
    "gas-scoop": (300, 140, '<path d="M10 70 Q150 -10 290 70 Q150 150 10 70z" fill="#7f8c8d"/><ellipse cx="80" cy="70" rx="30" ry="20" fill="#2c3e50"/><polygon points="290,70 260,50 260,90" fill="#566573"/>', '<path d="M10 70 l-30 -10 l0 20z" fill="#f39c12"/><path d="M-20 70 l-20 -6 l0 12z" fill="#f9e79f"/>'),
    "gas-tank": (200, 220, '<rect x="30" y="20" width="140" height="190" rx="60" fill="#d5dbdb"/><rect x="30" y="100" width="140" height="16" fill="#e74c3c"/><rect x="20" y="200" width="160" height="16" fill="#566573"/>', '<text x="100" y="160" text-anchor="middle" font-family="Arial Black,sans-serif" font-size="22" fill="#c0392b">H₂</text>'),
    "gas-reactor": (220, 220, '<rect x="30" y="80" width="160" height="130" fill="#2c3e50"/><circle cx="110" cy="80" r="70" fill="#566573"/><circle cx="110" cy="80" r="40" fill="#3dd6ff" opacity=".8"/>', '<circle cx="110" cy="80" r="90" fill="#3dd6ff" opacity=".2"/><circle cx="110" cy="80" r="18" fill="#fff"/>'),
    "ring-panels": (800, 100, '<g>' + "".join(f'<rect x="{x}" y="20" width="90" height="60" fill="#1a5276" stroke="#aab7b8" stroke-width="3"/>' for x in range(20, 800, 110)) + '</g>', '<g>' + "".join(f'<rect x="{x}" y="20" width="90" height="60" fill="#f9e79f" opacity=".3"/>' for x in range(20, 800, 110)) + '</g>'),
    "ring-gate": (260, 260, '<circle cx="130" cy="130" r="110" fill="none" stroke="#7f8c8d" stroke-width="24"/><circle cx="130" cy="130" r="86" fill="#8e44ad" opacity=".5"/>' + "".join(f'<rect x="{130 + 110 * math.cos(a / 6 * 2 * math.pi) - 8:.0f}" y="{130 + 110 * math.sin(a / 6 * 2 * math.pi) - 8:.0f}" width="16" height="16" fill="#f1c40f"/>' for a in range(6)), '<circle cx="130" cy="130" r="86" fill="#a569bd" opacity=".6"/><circle cx="130" cy="130" r="40" fill="#fff" opacity=".5"/>'),
    "ring-statue": (160, 280, '<rect x="30" y="230" width="100" height="40" fill="#566573"/><ellipse cx="80" cy="60" rx="34" ry="44" fill="#58d68d"/><rect x="55" y="100" width="50" height="130" fill="#7d3c98"/><g fill="#111"><ellipse cx="66" cy="60" rx="9" ry="13"/><ellipse cx="94" cy="60" rx="9" ry="13"/></g>', '<circle cx="80" cy="60" r="70" fill="#f1c40f" opacity=".2"/><polygon points="62,14 70,0 80,12 90,0 98,14" fill="#f1c40f"/>'),
}
for name, (w, h, base, deluxe) in MOD.items():
    svg(os.path.join(U, name + ".svg"), w, h, base)
    svg(os.path.join(U, name + "-deluxe.svg"), w, h, base + deluxe)
print("ok", len(SPRITES), "sprites,", len(MOD) * 2, "module images, 6 planets")
