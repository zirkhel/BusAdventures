"""Placeholder art for Ninja Empire. Real art is planned in ComfyUI later.

Sprites: 6 frames of 160x160 (WebP, alpha). Backdrops: SVG 800x500, dark, moonlit.
Objects use emoji in theme.json, so there are no object files yet.

    python3 tools/make-ninja-art.py games/ninja-empire/assets
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from artkit import biped, sheet, svg

OUT = next((a for a in sys.argv[1:] if not a.startswith("--")), None) or "games/ninja-empire/assets"
for d in ("sprites", "rooms"):
    os.makedirs(os.path.join(OUT, d), exist_ok=True)

def P(**k):
    return lambda t: biped(t, **k)

SK = ["#f1c9a5", "#e0ac69", "#d9a066", "#c68642"]
NAVY, BLACK, GREY, RED = "#1c2340", "#16161d", "#4a4f5c", "#b03a2e"
SPRITES = {
    # 1 Hidden Training Ground
    "training-taro":   P(skin=SK[0], top="#8d6e63", legs="#5d4037", size=0.9, weapon="dagger"),
    "training-yuki":   P(skin=SK[1], top=NAVY, legs=NAVY, size=0.95, weapon="dagger"),
    "training-kage":   P(skin=SK[2], top=GREY, legs=GREY, robe=True, size=1.0, weapon="staff", kind="cast", glow="#9fb3c8"),
    # 2 Village of Whispers
    "village-mochi":   P(skin=SK[0], top="#c8a165", legs="#6d4c41", size=0.95, hat="#d7b56d"),
    "village-hana":    P(skin=SK[1], top="#7e3f8f", legs=BLACK, size=0.95, ears=True),
    "village-kitsune": P(skin=SK[0], top="#e67e22", legs="#e67e22", robe=True, size=1.0, ears=True, kind="cast", glow="#f5b041", tail="#e67e22"),
    # 3 Rooftops of Edo
    "rooftops-riku":   P(skin=SK[1], top="#5d6d7e", legs=NAVY, size=0.9),
    "rooftops-akira":  P(skin=SK[2], top=BLACK, legs=BLACK, size=1.0, weapon="dagger"),
    "rooftops-sparrow": P(skin=SK[0], top=BLACK, legs=BLACK, size=1.0, weapon="sword", kind="cast", glow=RED),
    # 4 Mountain Shadow Temple
    "temple-sora":     P(skin=SK[1], top="#e59866", legs="#e59866", robe=True, size=0.95),
    "temple-ren":      P(skin=SK[0], top="#aab7b8", legs="#aab7b8", size=1.0, floaty=True),
    "temple-onryu":    P(skin=SK[3], top="#f5f5f5", legs="#f5f5f5", robe=True, size=1.05, weapon="staff", kind="cast", glow="#d6eaf8"),
    # 5 Samurai War Camp
    "camp-jin":        P(skin=SK[2], top="#7d6608", legs="#4d3b0a", size=1.0, hat="#a0802c", weapon="club"),
    "camp-takeshi":    P(skin=SK[1], top="#424949", legs=BLACK, size=1.05, armor=True),
    "camp-lotus":      P(skin=SK[0], top=BLACK, legs=BLACK, size=1.0, weapon="sword", kind="cast", glow="#a569bd"),
    # 6 Underground Shinobi Network
    "network-neko":    P(skin=SK[1], top="#566573", legs=NAVY, size=0.9, ears=True),
    "network-mei":     P(skin=SK[0], top="#1a5276", legs="#1a5276", robe=True, size=0.95, kind="cast", glow="#5dade2"),
    "network-faceless": P(skin="#d5d8dc", top=BLACK, legs=BLACK, robe=True, size=1.1, eyes="#d5d8dc", kind="cast", glow="#7f8c8d"),
    # 7 Shadow Clan Fortress
    "fortress-daichi": P(skin=SK[2], top="#7b241c", legs=BLACK, size=1.1, armor=True, weapon="staff"),
    "fortress-aya":    P(skin=SK[0], top=NAVY, legs=NAVY, size=1.0, weapon="sword"),
    "fortress-shirogane": P(skin=SK[1], top="#d5d8dc", legs=GREY, robe=True, size=1.1, crown="#c0c0c0", weapon="sword", kind="cast", glow="#ecf0f1"),
    # 8 Empire of Shadows
    "empire-envoy":    P(skin=SK[0], top="#283747", legs="#283747", robe=True, size=1.0, hat=BLACK),
    "empire-blades":   P(skin=SK[1], top="#641e16", legs=BLACK, size=1.05, weapon="sword", crown="#c0392b"),
    "empire-eternal":  P(skin="#2c2c34", top=BLACK, legs=BLACK, robe=True, size=1.2, eyes="#e74c3c", crown="#7f8c8d", kind="cast", glow="#e74c3c"),
}
for n, fn in SPRITES.items():
    sheet(OUT, n, fn)

R = os.path.join(OUT, "rooms")
SKY = '<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{a}"/><stop offset="1" stop-color="{b}"/></linearGradient></defs><rect width="800" height="500" fill="url(#sky)"/>'
def sky(a="#0b1026", b="#2a3150"): return SKY.format(a=a, b=b)
def moon(x=640, y=90, r=46): return f'<circle cx="{x}" cy="{y}" r="{r * 2.2}" fill="#f5f0dc" opacity=".08"/><circle cx="{x}" cy="{y}" r="{r}" fill="#f5f0dc"/>'
def fog(y=300): return f'<rect x="0" y="{y}" width="800" height="60" fill="#c8d0e0" opacity=".08"/><rect x="0" y="{y + 20}" width="800" height="40" fill="#c8d0e0" opacity=".06"/>'
def ground(col, y=335): return f'<path d="M0 {y} H800 V500 H0Z" fill="{col}"/>'
def roof(x, y, w, col="#1b1f2e"): return f'<path d="M{x - 20} {y} Q{x + w / 2} {y - 34} {x + w + 20} {y} Z" fill="{col}"/>'

bamboo = "".join(f'<rect x="{x}" y="0" width="{10 + x % 7}" height="335" fill="#1e3d2f" opacity="{.5 + (x % 3) * .15}"/>'
                 + "".join(f'<rect x="{x - 1}" y="{y}" width="{12 + x % 7}" height="3" fill="#0f2419"/>' for y in range(40, 335, 70))
                 for x in range(10, 800, 47))
svg(os.path.join(R, "training.svg"), 800, 500, f'''{sky("#08141a", "#16302a")}{moon(600, 80, 40)}{bamboo}{fog(280)}
<rect x="80" y="230" width="10" height="105" fill="#6d4c41"/><rect x="60" y="250" width="50" height="8" fill="#6d4c41"/>
{ground("#2b2a1f")}<g fill="#3b3a2a">{"".join(f'<ellipse cx="{x}" cy="{360 + (x * 13) % 100}" rx="22" ry="4"/>' for x in range(30, 800, 90))}</g>''')

houses = "".join(f'<g><rect x="{x}" y="200" width="150" height="135" fill="#3e2f25"/>{roof(x, 200, 150)}'
                 f'<rect x="{x + 20}" y="245" width="40" height="50" fill="#f5cba7" opacity=".55"/><rect x="{x + 90}" y="245" width="40" height="50" fill="#f5cba7" opacity=".35"/></g>'
                 for x in (20, 230, 440, 650))
svg(os.path.join(R, "village.svg"), 800, 500, f'''{sky("#0b1026", "#2c2a4a")}{moon(400, 70, 34)}{houses}
<g>{"".join(f'<line x1="{x}" y1="150" x2="{x + 120}" y2="160" stroke="#222" stroke-width="2"/><circle cx="{x + 60}" cy="166" r="9" fill="#e74c3c"/><circle cx="{x + 60}" cy="166" r="20" fill="#e74c3c" opacity=".15"/>' for x in (90, 300, 510))}</g>
{fog(300)}{ground("#3a3226")}''')

svg(os.path.join(R, "rooftops.svg"), 800, 500, f'''{sky("#070b1d", "#1f2a4f")}{moon(660, 100, 60)}
{"".join(f'<rect x="{x}" y="{h}" width="90" height="{335 - h}" fill="#141a2e"/>' + roof(x, h, 90, "#0d1120") for x, h in ((0, 180), (120, 140), (250, 200), (380, 160), (510, 210), (640, 170)))}
{ground("#1d2133", 330)}<path d="M0 330 L800 330" stroke="#3a4060" stroke-width="3"/>
<g fill="#2a2f45">{"".join(f'<path d="M{x} 330 L{x + 40} 315 L{x + 80} 330Z"/>' for x in range(0, 800, 80))}</g>''')

svg(os.path.join(R, "temple.svg"), 800, 500, f'''{sky("#101727", "#3b4459")}{moon(140, 80, 30)}
<path d="M0 300 L180 120 L330 260 L480 90 L650 250 L800 150 V335 H0Z" fill="#232b3d"/>{fog(220)}
<rect x="470" y="150" width="140" height="120" fill="#3a2a22"/>{roof(470, 150, 140, "#1a1410")}{roof(490, 110, 100, "#1a1410")}
<g fill="#5a5f6e">{"".join(f'<rect x="{300 + i * 10}" y="{335 - i * 8}" width="{200 - i * 20}" height="6"/>' for i in range(8))}</g>
{ground("#2e3341")}{fog(320)}''')

tents = "".join(f'<path d="M{x} 335 L{x + 70} 230 L{x + 140} 335Z" fill="#8a7a5a"/><path d="M{x + 70} 230 L{x + 70} 335" stroke="#5a4a32" stroke-width="3"/>' for x in (40, 300, 560))
banners = "".join(f'<rect x="{x}" y="120" width="6" height="215" fill="#3e2f25"/><rect x="{x + 6}" y="125" width="34" height="90" fill="{c}"/>' for x, c in ((230, "#b03a2e"), (500, "#1f3a93"), (760, "#b03a2e")))
svg(os.path.join(R, "camp.svg"), 800, 500, f'''{sky("#1a0d0d", "#4a2a1f")}{moon(400, 70, 28)}
<circle cx="400" cy="300" r="140" fill="#e67e22" opacity=".08"/>{tents}{banners}
{ground("#3b2f22")}<g><path d="M380 360 L400 320 L420 360Z" fill="#f39c12"/><path d="M390 360 L400 335 L410 360Z" fill="#f9e79f"/></g>''')

svg(os.path.join(R, "network.svg"), 800, 500, f'''<rect width="800" height="500" fill="#0c0d12"/>
<path d="M0 0 H800 V60 Q400 110 0 60Z" fill="#1a1c24"/>{"".join(f'<rect x="{x}" y="60" width="30" height="275" fill="#1d2029"/>' for x in (60, 380, 710))}
<rect x="250" y="120" width="300" height="130" fill="#151821" stroke="#3b3f4c" stroke-width="4"/>
{"".join(f'<line x1="270" y1="{140 + i * 20}" x2="530" y2="{150 + i * 16}" stroke="#c0392b" stroke-width="1.5" opacity=".7"/>' for i in range(5))}
{"".join(f'<circle cx="{x}" cy="{y}" r="5" fill="#f5b041"/>' for x, y in ((290, 150), (360, 190), (440, 160), (500, 220), (330, 230)))}
{"".join(f'<circle cx="{x}" cy="90" r="26" fill="#f39c12" opacity=".12"/><circle cx="{x}" cy="90" r="7" fill="#f8c471"/>' for x in (150, 650))}
{ground("#16171c")}''')

svg(os.path.join(R, "fortress.svg"), 800, 500, f'''{sky("#0a0e1f", "#2b2d48")}{moon(120, 80, 36)}
<rect x="300" y="170" width="200" height="165" fill="#d5d8dc" opacity=".85"/>{roof(300, 170, 200, "#1b2631")}
<rect x="330" y="110" width="140" height="60" fill="#d5d8dc" opacity=".85"/>{roof(330, 110, 140, "#1b2631")}
<rect x="360" y="70" width="80" height="40" fill="#d5d8dc" opacity=".85"/>{roof(360, 70, 80, "#1b2631")}
<g fill="#5d5f6a">{"".join(f'<rect x="{x}" y="250" width="70" height="85"/>' for x in range(0, 300, 75))}{"".join(f'<rect x="{x}" y="250" width="70" height="85"/>' for x in range(510, 800, 75))}</g>
<rect x="680" y="120" width="6" height="130" fill="#3e2f25"/><rect x="686" y="125" width="40" height="70" fill="#7b241c"/>
{ground("#2a2c38")}''')

svg(os.path.join(R, "empire.svg"), 800, 500, f'''{sky("#060812", "#1d1630")}
<circle cx="400" cy="150" r="150" fill="#c0392b" opacity=".08"/>
<g fill="#c9a227">{"".join(f'<rect x="{x}" y="60" width="16" height="275"/>' for x in (120, 250, 534, 664))}</g>
<rect x="100" y="40" width="600" height="26" fill="#7b241c"/><path d="M80 40 Q400 -10 720 40Z" fill="#1b1520"/>
<rect x="340" y="200" width="120" height="110" fill="#2c1e2e"/><rect x="330" y="190" width="140" height="18" fill="#c9a227"/>
<circle cx="400" cy="150" r="30" fill="#c0392b" opacity=".35"/>
<path d="M0 335 H800 V500 H0Z" fill="#241a25"/><rect x="350" y="335" width="100" height="165" fill="#7b241c" opacity=".7"/>''')

print("ok", len(SPRITES), "sprites, 8 rooms")
