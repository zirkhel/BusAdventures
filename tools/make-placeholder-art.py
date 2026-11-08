"""Generate placeholder art for Fighter Empire.

Sprites:   horizontal strip spritesheets, WebP with alpha, 128x192 per frame, feet at bottom centre.
Backdrops: SVG, 800x500 (scene aspect 1.6).
Upgrades:  SVG objects, base + deluxe stage.

This is programmer art to prove the pipeline. Swap any file for real art with the same
frame size/frame count (or change frames/fps/x/y/h in theme.json).

    python3 tools/make-placeholder-art.py games/fighter-empire/assets            # skips sprites that already exist
    python3 tools/make-placeholder-art.py games/fighter-empire/assets --force    # overwrite all sprites
"""
import math, os, sys
from PIL import Image, ImageDraw

ARGS = [a for a in sys.argv[1:] if not a.startswith("--")]
FORCE = "--force" in sys.argv  # overwrite sprites that already exist (e.g. real art)
OUT = ARGS[0] if ARGS else "games/fighter-empire/assets"
FW, FH, S = 128, 192, 3  # frame size, supersample
os.makedirs(os.path.join(OUT, "sprites"), exist_ok=True)
os.makedirs(os.path.join(OUT, "rooms"), exist_ok=True)
os.makedirs(os.path.join(OUT, "upgrades"), exist_ok=True)


def hexc(h, a=255):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (a,)


def limb(p, ang, length):
    a = math.radians(ang)
    return (p[0] + math.sin(a) * length, p[1] + math.cos(a) * length)


def pose(kind, t):
    """Joint angles in degrees. 0 = straight down, +90 = forward (right), 180 = up."""
    s = math.sin(t * 2 * math.pi)
    p = dict(bob=0, lean=0,
             fa_u=20, fa_l=10, ba_u=-15, ba_l=-5,     # front/back arm upper/lower
             fl_u=12, fl_l=4, bl_u=-12, bl_l=-4)      # front/back leg
    if kind == "fighter":
        p.update(bob=3 * s, lean=8, fa_u=45, fa_l=150, ba_u=25, ba_l=160, fl_u=25, fl_l=8, bl_u=-22, bl_l=-12)
        if 0.45 <= t < 0.7:  # jab
            p.update(fa_u=92, fa_l=92, lean=14)
    elif kind == "kicker":
        p.update(bob=3 * s, lean=6, fa_u=40, fa_l=150, ba_u=20, ba_l=150, fl_u=22, fl_l=6, bl_u=-20, bl_l=-10)
        if 0.4 <= t < 0.75:
            p.update(fl_u=95, fl_l=90, lean=-10, ba_u=-40, ba_l=-30)
    elif kind == "spectator":
        up = 0.5 + 0.5 * s
        p.update(bob=-4 * max(0, s), fa_u=60 + 110 * up, fa_l=70 + 110 * up, ba_u=-60 - 110 * up, ba_l=-70 - 110 * up)
    elif kind == "coach":
        p.update(lean=2 * s, fa_u=85 if t < 0.5 else 30, fa_l=95 if t < 0.5 else 120, ba_u=-10, ba_l=40)
    elif kind == "sweeper":
        p.update(lean=10 + 6 * s, fa_u=40 + 25 * s, fa_l=40 + 25 * s, ba_u=30 + 25 * s, ba_l=35 + 25 * s)
    elif kind == "crane":
        p.update(bob=2 * s, fa_u=150 + 10 * s, fa_l=170, ba_u=-150 - 10 * s, ba_l=-170, fl_u=70, fl_l=-20, bl_u=0, bl_l=0)
    elif kind == "announcer":
        p.update(lean=-4, fa_u=120 + 30 * s, fa_l=160, ba_u=60, ba_l=150, bob=1.5 * s)
    else:  # idle
        p.update(lean=3 * s, bob=1 * s)
    return p


def draw_frame(look, kind, t):
    W, H = FW * S, FH * S
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    k = S * look.get("scale", 1.0)
    cx = W / 2
    feet = H - 6 * S
    # shadow
    d.ellipse([cx - 30 * k, feet - 5 * k, cx + 30 * k, feet + 5 * k], fill=(0, 0, 0, 70))
    p = pose(kind, t)
    thigh, shin, upper, fore = 30 * k, 30 * k, 24 * k, 22 * k
    hip = (cx, feet - (thigh + shin) + p["bob"] * k)
    neck = limb(hip, 180 + p["lean"], 50 * k)
    w_limb = int(11 * k)
    skin, shirt, pants = hexc(look["skin"]), hexc(look["shirt"]), hexc(look["pants"])
    glove = hexc(look["glove"]) if look.get("glove") else skin

    def leg(u, l, col):
        knee = limb(hip, u, thigh)
        foot = limb(knee, l, shin)
        d.line([hip, knee, foot], fill=col, width=w_limb, joint="curve")
        for q in (hip, knee):
            d.ellipse([q[0] - w_limb / 2, q[1] - w_limb / 2, q[0] + w_limb / 2, q[1] + w_limb / 2], fill=col)
        d.ellipse([foot[0] - 7 * k, foot[1] - 5 * k, foot[0] + 9 * k, foot[1] + 4 * k], fill=hexc(look.get("shoe", "#222222")))

    def arm(u, l, col):
        elbow = limb(neck, u, upper)
        hand = limb(elbow, l, fore)
        d.line([neck, elbow, hand], fill=col, width=int(9 * k), joint="curve")
        d.ellipse([elbow[0] - 4.5 * k, elbow[1] - 4.5 * k, elbow[0] + 4.5 * k, elbow[1] + 4.5 * k], fill=col)
        r = 8 * k if look.get("glove") else 5 * k
        d.ellipse([hand[0] - r, hand[1] - r, hand[0] + r, hand[1] + r], fill=glove)
        return hand

    dark = tuple(int(c * 0.75) for c in pants[:3]) + (255,)
    leg(p["bl_u"], p["bl_l"], dark)
    arm(p["ba_u"], p["ba_l"], tuple(int(c * 0.8) for c in skin[:3]) + (255,))
    # torso
    tw = 15 * k
    d.polygon([(hip[0] - tw, hip[1]), (hip[0] + tw, hip[1]), (neck[0] + tw * 1.15, neck[1] + 4 * k), (neck[0] - tw * 1.15, neck[1] + 4 * k)], fill=shirt)
    d.rectangle([hip[0] - tw, hip[1] - 4 * k, hip[0] + tw, hip[1] + 6 * k], fill=pants)
    if look.get("belt"):
        d.rectangle([hip[0] - tw, hip[1] - 6 * k, hip[0] + tw, hip[1] - 1 * k], fill=hexc(look["belt"]))
    leg(p["fl_u"], p["fl_l"], pants)
    # head
    hr = 13 * k
    head = limb(neck, 180 + p["lean"] * 0.6, hr + 3 * k)
    d.ellipse([head[0] - hr, head[1] - hr, head[0] + hr, head[1] + hr], fill=skin)
    if look.get("hair"):
        d.chord([head[0] - hr, head[1] - hr - 2 * k, head[0] + hr, head[1] + hr * 0.6], 180, 360, fill=hexc(look["hair"]))
    if look.get("band"):
        d.rectangle([head[0] - hr, head[1] - 5 * k, head[0] + hr, head[1] - 1 * k], fill=hexc(look["band"]))
    d.ellipse([head[0] + 5 * k, head[1] - 3 * k, head[0] + 8 * k, head[1]], fill=(20, 20, 20, 255))
    if look.get("hat"):
        d.rectangle([head[0] - hr - 4 * k, head[1] - hr + 2 * k, head[0] + hr + 6 * k, head[1] - hr + 6 * k], fill=hexc(look["hat"]))
        d.rectangle([head[0] - hr * 0.8, head[1] - hr - 10 * k, head[0] + hr * 0.8, head[1] - hr + 3 * k], fill=hexc(look["hat"]))
    arm(p["fa_u"], p["fa_l"], skin)
    if look.get("clipboard"):
        hand = limb(limb(neck, p["ba_u"], upper), p["ba_l"], fore)
        d.rectangle([hand[0] - 2 * k, hand[1] - 14 * k, hand[0] + 12 * k, hand[1] + 4 * k], fill=(230, 220, 190, 255), outline=(90, 60, 30, 255), width=int(2 * k))
    if look.get("broom"):
        hand = limb(limb(neck, p["fa_u"], upper), p["fa_l"], fore)
        d.line([hand, (hand[0] + 18 * k, feet - 2 * k)], fill=(140, 100, 50, 255), width=int(4 * k))
        d.polygon([(hand[0] + 10 * k, feet), (hand[0] + 28 * k, feet), (hand[0] + 20 * k, feet - 14 * k)], fill=(200, 170, 90, 255))
    if look.get("mic"):
        hand = limb(limb(neck, p["fa_u"], upper), p["fa_l"], fore)
        d.ellipse([hand[0] - 5 * k, hand[1] - 12 * k, hand[0] + 5 * k, hand[1] - 2 * k], fill=(60, 60, 60, 255))
    return im.resize((FW, FH), Image.LANCZOS)


def sheet(name, look, kind, frames=6):
    path = os.path.join(OUT, "sprites", name + ".webp")
    if os.path.exists(path) and not FORCE:
        return  # keep existing sprites, which may be real art
    strip = Image.new("RGBA", (FW * frames, FH), (0, 0, 0, 0))
    for i in range(frames):
        strip.paste(draw_frame(look, kind, i / frames), (i * FW, 0))
    strip.save(path, "WEBP", lossless=True, quality=100, method=6)


SPRITES = {
    # alley
    "alley-mick":    ("spectator", dict(skin="#d8a27a", shirt="#6b6b5a", pants="#3a3f4a", hair="#4a3524", hat="#5a4a3a")),
    "alley-knuckles": ("fighter", dict(skin="#e0b090", shirt="#ffffff", pants="#2b4a8a", hair="#222222", glove="#b71c1c")),
    "alley-ana":     ("kicker", dict(skin="#c68a5e", shirt="#202020", pants="#5a2a6a", hair="#111111", band="#ff3d7f", glove="#ff3d7f")),
    # gym
    "gym-ray":       ("fighter", dict(skin="#f0c8a0", shirt="#3a7bd5", pants="#1d2b4a", hair="#c49a3a", glove="#2a6fdb")),
    "gym-dolores":   ("coach", dict(skin="#b07850", shirt="#c0392b", pants="#2c2c2c", hair="#d8d8d8", clipboard=True)),
    "gym-jackson":   ("fighter", dict(skin="#7a4a2a", shirt="#7a4a2a", pants="#f1c40f", hair="#111111", glove="#f1c40f", belt="#f1c40f", scale=1.08)),
    # thai resort
    "thai-bob":      ("idle", dict(skin="#f4b8a0", shirt="#ff9f43", pants="#1abc9c", hair="#e5c07b", hat="#f5e6c8")),
    "thai-elbow":    ("kicker", dict(skin="#c9935f", shirt="#c9935f", pants="#e74c3c", hair="#111111", band="#f1c40f", glove="#e74c3c")),
    "thai-nong":     ("kicker", dict(skin="#d9a066", shirt="#0e4d92", pants="#0e4d92", hair="#111111", band="#00d2d3", glove="#00d2d3")),
    # dojo
    "dojo-student":  ("sweeper", dict(skin="#e8c19a", shirt="#f5f5f5", pants="#f5f5f5", hair="#222222", broom=True)),
    "dojo-lin":      ("idle", dict(skin="#e3b98f", shirt="#7f8c8d", pants="#2d3436", hair="#ecf0f1", scale=0.95)),
    "dojo-mei":      ("crane", dict(skin="#efc9a4", shirt="#b33939", pants="#111111", hair="#111111", belt="#111111")),
    # arena
    "arena-announcer": ("announcer", dict(skin="#e0ac69", shirt="#111111", pants="#111111", hair="#555555", mic=True)),
    "arena-gus":     ("fighter", dict(skin="#d1a17a", shirt="#d1a17a", pants="#16a085", hair="#3d2b1f", glove="#111111")),
    # stadium
    "stadium-carlos":  ("coach", dict(skin="#c68a5e", shirt="#2c3e50", pants="#2c3e50", hair="#111111", clipboard=True)),
    "stadium-contender": ("kicker", dict(skin="#e0b090", shirt="#e0b090", pants="#2980b9", hair="#7a4a2a", band="#ffffff", glove="#2980b9", scale=1.05)),
    "stadium-legend":  ("fighter", dict(skin="#6d4c2f", shirt="#6d4c2f", pants="#f1c40f", hair="#eeeeee", glove="#ffffff", belt="#f1c40f", scale=1.12)),
    "arena-champ":   ("fighter", dict(skin="#8d5524", shirt="#8d5524", pants="#c0392b", hair="#111111", glove="#f1c40f", belt="#f1c40f", scale=1.1)),
}
for name, (kind, look) in SPRITES.items():
    sheet(name, look, kind)


def svg(path, w, h, body):
    with open(path, "w", encoding="utf-8") as f:
        f.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">{body}</svg>\n')


R = os.path.join(OUT, "rooms")
bricks = "".join(f'<rect x="{x + (40 if r % 2 else 0)}" y="{r * 26}" width="76" height="22" rx="2" fill="#5b2e2a" opacity="{0.55 + 0.1 * ((x // 80 + r) % 3)}"/>' for r in range(13) for x in range(-80, 800, 80))
svg(os.path.join(R, "alley.svg"), 800, 500, f'''
<rect width="800" height="500" fill="#2a1a1c"/>{bricks}
<rect x="300" y="0" width="200" height="340" fill="#120c10"/><rect x="300" y="0" width="200" height="340" fill="url(#fog)"/>
<defs><linearGradient id="fog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4a6a" stop-opacity=".6"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
<radialGradient id="lamp" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd27a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient></defs>
<line x1="80" y1="60" x2="80" y2="0" stroke="#222" stroke-width="6"/><circle cx="80" cy="70" r="140" fill="url(#lamp)"/><circle cx="80" cy="66" r="10" fill="#ffe7a8"/>
<rect x="640" y="250" width="140" height="110" rx="6" fill="#2e5d3a"/><rect x="630" y="240" width="160" height="18" rx="4" fill="#244a2e"/>
<path d="M0 340 H800 V500 H0Z" fill="#1d1d22"/><path d="M0 340 H800" stroke="#333" stroke-width="4"/>
<ellipse cx="420" cy="430" rx="90" ry="10" fill="#2c3a4a" opacity=".7"/>
<text x="560" y="140" font-family="Impact,Arial Black,sans-serif" font-size="34" fill="#c0392b" opacity=".7" transform="rotate(-8 560 140)">FIGHT CLUB?</text>''')

svg(os.path.join(R, "gym.svg"), 800, 500, '''
<rect width="800" height="500" fill="#3b3326"/>
<rect y="0" width="800" height="330" fill="#6e5b45"/>
<g fill="#8a7357">''' + "".join(f'<rect x="{x}" y="0" width="6" height="330"/>' for x in range(0, 800, 60)) + '''</g>
<rect x="60" y="60" width="150" height="100" fill="#f3e9d2"/><text x="135" y="105" text-anchor="middle" font-family="Impact,Arial Black,sans-serif" font-size="22" fill="#b71c1c">NO PAIN</text><text x="135" y="135" text-anchor="middle" font-family="Impact,Arial Black,sans-serif" font-size="22" fill="#222">NO GAIN</text>
<rect x="560" y="70" width="180" height="70" fill="#1f1f1f"/><text x="650" y="113" text-anchor="middle" font-family="Courier New,monospace" font-size="20" fill="#2ecc71">ROUND 1 03:00</text>
<path d="M0 330 H800 V500 H0Z" fill="#8b6b48"/><g stroke="#7a5c3c" stroke-width="2">''' + "".join(f'<line x1="0" y1="{y}" x2="800" y2="{y}"/>' for y in range(350, 500, 22)) + '''</g>''')

svg(os.path.join(R, "thai.svg"), 800, 500, '''
<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff7e5f"/><stop offset=".6" stop-color="#feb47b"/><stop offset="1" stop-color="#ffd7a0"/></linearGradient></defs>
<rect width="800" height="500" fill="url(#sky)"/><circle cx="560" cy="250" r="70" fill="#fff1c1" opacity=".85"/>
<rect y="260" width="800" height="90" fill="#2e86ab"/><g stroke="#ffffff" stroke-opacity=".35" stroke-width="3">''' + "".join(f'<line x1="{x}" y1="{y}" x2="{x + 40}" y2="{y}"/>' for x, y in [(80, 290), (300, 310), (520, 300), (660, 330), (180, 335)]) + '''</g>
<path d="M0 340 Q400 320 800 345 V500 H0Z" fill="#f4d79a"/>
<path d="M90 360 Q80 250 120 160" stroke="#6b4423" stroke-width="12" fill="none"/>
<g fill="#2d6a4f"><path d="M120 160 q-70 -10 -100 30 q50 -20 100 -30"/><path d="M120 160 q70 -20 110 20 q-60 -20 -110 -20"/><path d="M120 160 q-20 -60 -70 -70 q40 30 70 70"/><path d="M120 160 q30 -60 80 -60 q-50 20 -80 60"/></g>''')

svg(os.path.join(R, "dojo.svg"), 800, 500, '''
<rect width="800" height="500" fill="#4a2c1a"/>
<rect x="40" y="30" width="720" height="290" fill="#f3e3c3"/>
<g stroke="#5a341c" stroke-width="10">''' + "".join(f'<line x1="{x}" y1="30" x2="{x}" y2="320"/>' for x in range(40, 800, 120)) + '''<line x1="40" y1="130" x2="760" y2="130"/><line x1="40" y1="225" x2="760" y2="225"/></g>
<rect x="320" y="60" width="160" height="200" fill="#efe1c0" stroke="#3a2010" stroke-width="6"/>
<text x="400" y="180" text-anchor="middle" font-family="serif" font-size="110" fill="#1a1a1a">武</text>
<rect x="0" y="0" width="800" height="30" fill="#2b170c"/>
<path d="M0 320 H800 V500 H0Z" fill="#a0703c"/><g stroke="#8a5d30" stroke-width="3">''' + "".join(f'<line x1="{x}" y1="320" x2="{x - 60}" y2="500"/>' for x in range(0, 900, 70)) + '''</g>''')

svg(os.path.join(R, "arena.svg"), 800, 500, '''
<defs><radialGradient id="spot" cx=".5" cy=".3" r=".6"><stop offset="0" stop-color="#ffffff" stop-opacity=".35"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient></defs>
<rect width="800" height="500" fill="#0b0d17"/>
<g fill="#1c2033">''' + "".join(f'<circle cx="{(i * 37) % 800}" cy="{120 + (i * 53) % 170}" r="{9 + i % 4}"/>' for i in range(90)) + '''</g>
<g fill="#ffffff">''' + "".join(f'<circle cx="{(i * 71) % 800}" cy="{140 + (i * 29) % 150}" r="1.6" opacity=".7"/>' for i in range(40)) + '''</g>
<polygon points="200,0 260,0 420,340 340,340" fill="#ffffff" opacity=".06"/><polygon points="560,0 620,0 470,340 390,340" fill="#ffffff" opacity=".06"/>
<rect width="800" height="500" fill="url(#spot)"/>
<path d="M60 340 H740 L790 500 H10Z" fill="#2c3e50"/><path d="M110 350 H690 L720 470 H80Z" fill="#ecf0f1" opacity=".9"/>
<g stroke="#7f8c8d" stroke-width="3" opacity=".8">''' + "".join(f'<line x1="{x}" y1="350" x2="{x + (x - 400) * 0.1}" y2="470"/>' for x in range(130, 700, 40)) + '''</g>''')

svg(os.path.join(R, "stadium.svg"), 800, 500, '''
<defs><linearGradient id="night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050816"/><stop offset="1" stop-color="#1b2550"/></linearGradient>
<radialGradient id="flood" cx=".5" cy="0" r=".9"><stop offset="0" stop-color="#ffffff" stop-opacity=".5"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient></defs>
<rect width="800" height="500" fill="url(#night)"/>
<g fill="#ffffff">''' + "".join(f'<circle cx="{(i * 97) % 800}" cy="{(i * 41) % 90}" r="1.2" opacity=".6"/>' for i in range(30)) + '''</g>
''' + "".join(f'<g><rect x="{x - 3}" y="20" width="6" height="110" fill="#2b3350"/><rect x="{x - 26}" y="10" width="52" height="22" rx="3" fill="#dfe6f5"/><ellipse cx="{x}" cy="40" rx="150" ry="120" fill="url(#flood)" opacity=".5"/></g>' for x in (90, 710)) + '''
<path d="M0 150 Q400 100 800 150 V330 H0Z" fill="#141a33"/>
<g>''' + "".join(f'<circle cx="{(i * 23) % 800}" cy="{160 + (i * 37) % 160}" r="{6 + i % 3}" fill="{["#2a3463", "#3a2a63", "#24305a", "#c0392b", "#f1c40f", "#3498db"][i % 6]}" opacity=".75"/>' for i in range(220)) + '''</g>
<path d="M0 330 H800 V500 H0Z" fill="#2e7d32"/><path d="M0 330 H800" stroke="#ffffff" stroke-width="3" opacity=".6"/>
<path d="M120 345 H680 L740 480 H60Z" fill="#ecf0f1"/><path d="M150 360 H650 L690 465 H110Z" fill="#c0392b" opacity=".25"/>
<text x="400" y="430" text-anchor="middle" font-family="Impact,Arial Black,sans-serif" font-size="46" fill="#c0392b" opacity=".35">WORLD TITLE</text>''')

U = os.path.join(OUT, "upgrades")
GOLD = '<rect x="2" y="2" width="{w}" height="{h}" fill="none" stroke="#f1c40f" stroke-width="4" rx="6"/>'
UPG = {
    "alley-bookie": (200, 200, '''<rect x="20" y="70" width="160" height="120" fill="#7a5230"/><rect x="10" y="60" width="180" height="16" fill="#5a3a20"/>
<rect x="30" y="10" width="140" height="50" fill="#f3e9d2" stroke="#222" stroke-width="3"/><text x="100" y="45" text-anchor="middle" font-family="Impact,Arial Black,sans-serif" font-size="26" fill="#b71c1c">ODDS</text>
<text x="100" y="130" text-anchor="middle" font-family="Courier New,monospace" font-size="18" fill="#f3e9d2">3:1  7:2</text>''', '''<circle cx="40" cy="20" r="8" fill="#f1c40f"/><circle cx="160" cy="20" r="8" fill="#f1c40f"/><text x="100" y="170" text-anchor="middle" font-size="26" fill="#2ecc71">$$$</text>'''),
    "alley-boombox": (200, 120, '''<rect x="10" y="20" width="180" height="90" rx="10" fill="#333"/><rect x="40" y="5" width="120" height="20" rx="6" fill="none" stroke="#555" stroke-width="6"/>
<circle cx="55" cy="65" r="30" fill="#111" stroke="#777" stroke-width="4"/><circle cx="145" cy="65" r="30" fill="#111" stroke="#777" stroke-width="4"/><rect x="88" y="45" width="24" height="16" fill="#2ecc71"/>''', '''<g fill="none" stroke="#ff3d7f" stroke-width="4"><path d="M195 40 q12 25 0 50"/><path d="M5 40 q-12 25 0 50"/></g>'''),
    "gym-bag": (120, 260, '''<line x1="60" y1="0" x2="60" y2="40" stroke="#555" stroke-width="5"/><rect x="25" y="40" width="70" height="200" rx="30" fill="#8e1b1b"/><rect x="25" y="80" width="70" height="12" fill="#5e1010"/><rect x="25" y="190" width="70" height="12" fill="#5e1010"/>''', '''<text x="60" y="150" text-anchor="middle" font-family="Impact,Arial Black,sans-serif" font-size="22" fill="#f1c40f">PRO</text>'''),
    "gym-ring": (800, 260, '''<rect x="40" y="200" width="720" height="40" fill="#1f3a68"/><g fill="#ddd"><rect x="40" y="40" width="16" height="200"/><rect x="744" y="40" width="16" height="200"/></g>
<g stroke="#c0392b" stroke-width="6"><line x1="48" y1="70" x2="752" y2="70"/><line x1="48" y1="115" x2="752" y2="115"/><line x1="48" y1="160" x2="752" y2="160"/></g>''', '''<g stroke="#f1c40f" stroke-width="6"><line x1="48" y1="70" x2="752" y2="70"/></g><text x="400" y="232" text-anchor="middle" font-family="Impact,Arial Black,sans-serif" font-size="30" fill="#f1c40f">CHAMPIONSHIP</text>'''),
    "thai-bar": (220, 220, '''<path d="M0 70 L110 10 L220 70Z" fill="#c8a165"/><g stroke="#8a6a3a" stroke-width="3">''' + "".join(f'<line x1="{x}" y1="70" x2="{x + 4}" y2="85"/>' for x in range(5, 220, 12)) + '''</g>
<rect x="20" y="70" width="10" height="140" fill="#6b4423"/><rect x="190" y="70" width="10" height="140" fill="#6b4423"/><rect x="10" y="140" width="200" height="70" fill="#8b5a2b"/>''', '''<g fill="#ff6b6b"><circle cx="60" cy="130" r="8"/><circle cx="110" cy="128" r="8" fill="#feca57"/><circle cx="160" cy="130" r="8" fill="#48dbfb"/></g>'''),
    "thai-pier": (300, 120, '''<rect x="0" y="40" width="300" height="24" fill="#a47148"/><g fill="#7a5230">''' + "".join(f'<rect x="{x}" y="64" width="12" height="56"/>' for x in range(10, 300, 60)) + '''</g>''', '''<g fill="#f1c40f">''' + "".join(f'<circle cx="{x}" cy="34" r="6"/>' for x in range(20, 300, 45)) + '''</g>'''),
    "dojo-dummy": (140, 260, '''<rect x="55" y="20" width="30" height="230" rx="12" fill="#8b5a2b"/><g fill="#6b4423"><rect x="10" y="70" width="50" height="12" rx="6"/><rect x="80" y="100" width="50" height="12" rx="6"/><rect x="15" y="140" width="45" height="12" rx="6"/></g>''', '''<rect x="55" y="20" width="30" height="20" fill="#f1c40f"/>'''),
    "dojo-lanterns": (800, 120, '''<path d="M0 30 Q400 70 800 30" stroke="#222" stroke-width="3" fill="none"/>''' + "".join(f'<ellipse cx="{x}" cy="{48 + 12 * math.sin(x / 130)}" rx="22" ry="28" fill="#d63031"/>' for x in range(80, 800, 130)), "".join(f'<ellipse cx="{x}" cy="{48 + 12 * math.sin(x / 130)}" rx="34" ry="40" fill="#ffeaa7" opacity=".35"/>' for x in range(80, 800, 130))),
    "arena-pyro": (800, 220, "".join(f'<path d="M{x} 220 q-24 -80 0 -170 q24 90 0 170Z" fill="#e67e22"/><path d="M{x} 220 q-12 -50 0 -110 q12 60 0 110Z" fill="#f9e79f"/>' for x in (60, 740)), "".join(f'<path d="M{x} 220 q-24 -80 0 -170 q24 90 0 170Z" fill="#e67e22"/>' for x in (180, 620))),
    "arena-screen": (300, 180, '''<rect x="10" y="10" width="280" height="150" rx="8" fill="#111" stroke="#555" stroke-width="6"/><text x="150" y="95" text-anchor="middle" font-family="Impact,Arial Black,sans-serif" font-size="40" fill="#3498db">FIGHT!</text>''', '''<text x="150" y="140" text-anchor="middle" font-family="Courier New,monospace" font-size="20" fill="#f1c40f">PAY-PER-VIEW</text>'''),

    "alley-neon": (260, 110, '''<rect x="4" y="4" width="252" height="102" rx="12" fill="#14080c" stroke="#ff3d7f" stroke-width="5"/>
<text x="130" y="50" text-anchor="middle" font-family="Impact,Arial Black,sans-serif" font-size="34" fill="#ff3d7f">FIGHTS</text>
<text x="130" y="90" text-anchor="middle" font-family="Impact,Arial Black,sans-serif" font-size="30" fill="#3dd6ff">TONIGHT</text>''', '''<rect x="4" y="4" width="252" height="102" rx="12" fill="none" stroke="#ff3d7f" stroke-width="14" opacity=".35"/><text x="230" y="30" font-size="22" fill="#f1c40f">★</text>'''),
    "gym-trophies": (260, 150, '''<rect x="10" y="118" width="240" height="14" fill="#6b4a2b"/><rect x="10" y="132" width="240" height="6" fill="#4a3220"/>
<g fill="#c9a227"><path d="M40 118 h30 v-8 h-6 v-14 q16 -4 16 -26 h-40 q0 22 16 26 v14 h-6z"/><path d="M190 118 h30 v-8 h-6 v-14 q16 -4 16 -26 h-40 q0 22 16 26 v14 h-6z"/></g>
<rect x="100" y="78" width="60" height="40" rx="6" fill="#222"/><rect x="88" y="90" width="84" height="16" rx="8" fill="#c9a227"/>''', '''<g fill="#f1c40f"><path d="M115 60 h30 v-8 h-6 v-14 q16 -4 16 -26 h-40 q0 22 16 26 v14 h-6z"/></g><g fill="#fff"><circle cx="55" cy="72" r="3"/><circle cx="205" cy="72" r="3"/></g>'''),
    "thai-boat": (300, 110, '''<path d="M10 60 L290 50 Q270 95 200 98 L60 98 Q20 90 10 60Z" fill="#8b4a2b"/><path d="M10 60 L290 50" stroke="#e74c3c" stroke-width="6"/>
<path d="M290 50 q8 -30 -10 -40" stroke="#8b4a2b" stroke-width="8" fill="none"/><rect x="120" y="30" width="70" height="26" fill="#f4d79a"/>''', '''<g fill="#ff6b6b"><path d="M282 12 l10 -10 l2 14z"/></g><g fill="#feca57"><circle cx="140" cy="24" r="6"/><circle cx="170" cy="24" r="6" fill="#48dbfb"/></g>'''),
    "dojo-gong": (180, 240, '''<g fill="#3a2010"><rect x="10" y="10" width="14" height="225"/><rect x="156" y="10" width="14" height="225"/><rect x="0" y="6" width="180" height="16" rx="4"/></g>
<line x1="70" y1="22" x2="80" y2="50" stroke="#222" stroke-width="3"/><line x1="110" y1="22" x2="100" y2="50" stroke="#222" stroke-width="3"/>
<circle cx="90" cy="115" r="62" fill="#b8860b"/><circle cx="90" cy="115" r="46" fill="#d4a52a"/><circle cx="90" cy="115" r="14" fill="#b8860b"/>''', '''<circle cx="90" cy="115" r="74" fill="none" stroke="#f1c40f" stroke-width="4" opacity=".6"/><circle cx="90" cy="115" r="86" fill="none" stroke="#f1c40f" stroke-width="2" opacity=".35"/>'''),
    "arena-cage": (800, 230, '''<g stroke="#9aa4b2" stroke-width="2" opacity=".75">''' + "".join(f'<line x1="{x}" y1="20" x2="{x + 40}" y2="230"/><line x1="{x + 40}" y1="20" x2="{x}" y2="230"/>' for x in range(30, 760, 40)) + '''</g>
<g fill="#4a5568"><rect x="20" y="10" width="14" height="220"/><rect x="393" y="10" width="14" height="220"/><rect x="766" y="10" width="14" height="220"/><rect x="20" y="10" width="760" height="10"/></g>''', '''<g fill="#e74c3c"><rect x="20" y="10" width="760" height="10"/></g><g fill="#f1c40f"><circle cx="27" cy="10" r="9"/><circle cx="400" cy="10" r="9"/><circle cx="773" cy="10" r="9"/></g>'''),
    "stadium-banners": (800, 120, "".join(f'<g><rect x="{x}" y="10" width="110" height="70" fill="{c}"/><text x="{x + 55}" y="56" text-anchor="middle" font-family="Impact,Arial Black,sans-serif" font-size="26" fill="#fff">{t}</text></g>' for x, c, t in [(20, "#c0392b", "GO!"), (200, "#2980b9", "#1"), (380, "#f39c12", "WOW"), (560, "#8e44ad", "KO!")]), "".join(f'<rect x="{x}" y="86" width="110" height="20" fill="#f1c40f"/>' for x in (20, 200, 380, 560))),
    "stadium-fireworks": (800, 260, "".join(f'<g stroke="{c}" stroke-width="4" stroke-linecap="round">' + "".join(f'<line x1="{cx}" y1="{cy}" x2="{cx + 60 * math.cos(a / 8 * 2 * math.pi):.0f}" y2="{cy + 60 * math.sin(a / 8 * 2 * math.pi):.0f}"/>' for a in range(8)) + '</g>' for cx, cy, c in [(140, 90, "#f1c40f"), (660, 110, "#e74c3c")]), "".join(f'<g stroke="{c}" stroke-width="3" stroke-linecap="round">' + "".join(f'<line x1="{cx}" y1="{cy}" x2="{cx + 45 * math.cos(a / 10 * 2 * math.pi):.0f}" y2="{cy + 45 * math.sin(a / 10 * 2 * math.pi):.0f}"/>' for a in range(10)) + '</g>' for cx, cy, c in [(400, 70, "#3dd6ff"), (260, 180, "#ff3d7f"), (540, 190, "#2ecc71")])),
    "stadium-belt": (220, 200, '''<rect x="40" y="130" width="140" height="60" fill="#2c2c2c"/><rect x="30" y="122" width="160" height="12" fill="#444"/>
<rect x="10" y="70" width="200" height="34" rx="12" fill="#7a1c1c"/><ellipse cx="110" cy="87" rx="48" ry="36" fill="#d4a52a"/><ellipse cx="110" cy="87" rx="34" ry="24" fill="#f1c40f"/>
<text x="110" y="95" text-anchor="middle" font-family="Impact,Arial Black,sans-serif" font-size="20" fill="#7a1c1c">WORLD</text>''', '''<g fill="#fff"><path d="M60 40 l6 -16 l6 16 l16 6 l-16 6 l-6 16 l-6 -16 l-16 -6z"/><path d="M160 30 l4 -10 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4z"/></g>'''),
}
for name, (w, h, base, deluxe) in UPG.items():
    svg(os.path.join(U, name + ".svg"), w, h, base)
    svg(os.path.join(U, name + "-deluxe.svg"), w, h, base + deluxe)

print("ok", len(SPRITES), "sprites,", len(UPG) * 2, "upgrade images, 5 rooms")
