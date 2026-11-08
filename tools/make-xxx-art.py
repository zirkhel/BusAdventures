"""Placeholder art for XXX Empire (18+ satire). Deliberately non-explicit: clothed adult
figures and venue backdrops. Real art is planned in ComfyUI later.

Sprites: 6 frames of 160x160 (WebP, alpha). Backdrops: SVG 800x500.
Objects use emoji in theme.json, so there are no object files yet.

    python3 tools/make-xxx-art.py games/xxx-empire/assets
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from artkit import biped, sheet, svg

OUT = next((a for a in sys.argv[1:] if not a.startswith("--")), None) or "games/xxx-empire/assets"
for d in ("sprites", "rooms"):
    os.makedirs(os.path.join(OUT, d), exist_ok=True)

# Adult figures, all clothed. robe=True draws a long dress or coat.
def P(**k):
    return lambda t: biped(t, **k)

SKIN = ["#f1c9a5", "#e0ac69", "#c68642", "#8d5524", "#ffdbac", "#a1665e"]
SPRITES = {
    # Back Alley
    "alley-lola":      P(skin=SKIN[0], top="#c0392b", legs="#2c2c2c", robe=True, size=1.0),
    "alley-rick":      P(skin=SKIN[2], top="#6c3483", legs="#2c2c2c", size=1.0, hat="#2c2c2c"),
    "alley-velvet":    P(skin=SKIN[3], top="#7b241c", legs="#7b241c", robe=True, size=1.05, crown="#d4ac0d", kind="cast", glow="#e74c3c"),
    # Cheap Motel
    "motel-doris":     P(skin=SKIN[4], top="#5d6d7e", legs="#34495e", size=0.95),
    "motel-dwayne":    P(skin=SKIN[3], top="#ecf0f1", legs="#2c3e50", size=1.0),
    "motel-candy":     P(skin=SKIN[0], top="#ff6fb5", legs="#ff6fb5", robe=True, size=1.0, kind="cast", glow="#ff6fb5"),
    # Amateur Studio
    "studio-rita":     P(skin=SKIN[1], top="#f39c12", legs="#2e86c1", size=0.95, kind="cast", weapon="staff", glow="#ffffff"),
    "studio-dave":     P(skin=SKIN[4], top="#566573", legs="#273746", size=1.0, kind="shoot"),
    "studio-algo":     P(skin=SKIN[5], top="#1b1b1b", legs="#1b1b1b", robe=True, size=1.05, kind="cast", weapon="staff", glow="#3dd6ff"),
    # Creator Mansion
    "mansion-brandon": P(skin=SKIN[1], top=SKIN[1], legs="#1abc9c", size=1.05),
    "mansion-sasha":   P(skin=SKIN[0], top="#f7f9f9", legs="#2c3e50", size=0.95),
    "mansion-valentina": P(skin=SKIN[2], top="#f5b041", legs="#f5b041", robe=True, size=1.05, crown="#f1c40f", kind="cast", glow="#f9e79f"),
    # Escort Agency
    "agency-chad":     P(skin=SKIN[4], top="#1c2833", legs="#1c2833", size=1.05),
    "agency-ledger":   P(skin=SKIN[3], top="#5b2c6f", legs="#2c3e50", size=0.95),
    "agency-contessa": P(skin=SKIN[0], top="#17202a", legs="#17202a", robe=True, size=1.05, crown="#d5d8dc", kind="cast", glow="#d5d8dc"),
    # Gentlemen's Club
    "club-bubbles":    P(skin=SKIN[1], top="#e91e63", legs="#e91e63", size=0.95, kind="cast", glow="#ff80ab"),
    "club-tony":       P(skin=SKIN[2], top="#111111", legs="#111111", size=1.25),
    "club-desiree":    P(skin=SKIN[3], top="#d4ac0d", legs="#d4ac0d", robe=True, size=1.05, kind="cast", glow="#f9e79f", crown="#f1c40f"),
    # Adult Film Studio
    "film-rod":        P(skin=SKIN[1], top="#922b21", legs="#1b2631", size=1.1),
    "film-penny":      P(skin=SKIN[4], top="#1f618d", legs="#1b2631", size=0.95),
    "film-luc":        P(skin=SKIN[0], top="#111111", legs="#424949", size=1.0, hat="#111111", kind="shoot"),
    # XXX Media Empire
    "media-kevin":     P(skin=SKIN[4], top="#3498db", legs="#5d6d7e", size=0.9, weapon="staff", glow="#ffffff"),
    "media-sheila":    P(skin=SKIN[5], top="#2c3e50", legs="#2c3e50", robe=True, size=1.0),
    "media-baroness":  P(skin=SKIN[2], top="#4a235a", legs="#4a235a", robe=True, size=1.1, crown="#f1c40f", kind="cast", glow="#f1c40f"),
}
for n, fn in SPRITES.items():
    sheet(OUT, n, fn)

R = os.path.join(OUT, "rooms")
def neon(x, y, text, col, size=40):
    return (f'<text x="{x}" y="{y}" text-anchor="middle" font-family="Impact,Arial Black,sans-serif" font-size="{size}" fill="{col}" opacity=".35" '
            f'stroke="{col}" stroke-width="8">{text}</text><text x="{x}" y="{y}" text-anchor="middle" font-family="Impact,Arial Black,sans-serif" font-size="{size}" fill="#fff" stroke="{col}" stroke-width="2">{text}</text>')

bricks = "".join(f'<rect x="{x + (40 if r % 2 else 0)}" y="{r * 26}" width="76" height="22" rx="2" fill="#4a1f2a" opacity="{0.55 + 0.1 * ((x // 80 + r) % 3)}"/>' for r in range(13) for x in range(-80, 800, 80))
svg(os.path.join(R, "alley.svg"), 800, 500, f'''<rect width="800" height="500" fill="#1a0f14"/>{bricks}
<defs><radialGradient id="red" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff2d55" stop-opacity=".45"/><stop offset="1" stop-color="#ff2d55" stop-opacity="0"/></radialGradient></defs>
<circle cx="640" cy="90" r="160" fill="url(#red)"/><rect x="636" y="0" width="8" height="70" fill="#222"/><circle cx="640" cy="80" r="14" fill="#ff5c7a"/>
{neon(250, 120, "OPEN LATE", "#ff2d55", 42)}
<path d="M0 335 H800 V500 H0Z" fill="#17131a"/><path d="M0 335 H800" stroke="#2a2230" stroke-width="4"/>''')

svg(os.path.join(R, "motel.svg"), 800, 500, f'''<rect width="800" height="500" fill="#0d1b2a"/>
<rect x="0" y="120" width="800" height="215" fill="#d4a373"/><rect x="0" y="110" width="800" height="16" fill="#8d5524"/>
{"".join(f'<g><rect x="{x}" y="170" width="70" height="165" fill="#5d4037"/><circle cx="{x + 58}" cy="255" r="4" fill="#f1c40f"/><text x="{x + 35}" y="160" text-anchor="middle" font-family="Arial Black,sans-serif" font-size="18" fill="#3e2723">{n}</text></g>' for x, n in ((60, 11), (250, 12), (440, 14), (630, 15)))}
<rect x="300" y="10" width="200" height="80" rx="8" fill="#111"/>{neon(400, 62, "MOTEL", "#00e5ff", 46)}
<text x="400" y="104" text-anchor="middle" font-family="Arial Black,sans-serif" font-size="16" fill="#ff5252">NO VACANCY</text>
<path d="M0 335 H800 V500 H0Z" fill="#4a4a4a"/><g fill="#f1c40f">{"".join(f'<rect x="{x}" y="430" width="50" height="6"/>' for x in range(20, 800, 120))}</g>''')

svg(os.path.join(R, "studio.svg"), 800, 500, f'''<rect width="800" height="500" fill="#2b2233"/>
<rect x="120" y="40" width="560" height="295" fill="#e8daef"/><rect x="120" y="40" width="560" height="295" fill="url(#c)"/>
<defs><linearGradient id="c" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c39bd3"/><stop offset=".5" stop-color="#f5eef8"/><stop offset="1" stop-color="#c39bd3"/></linearGradient></defs>
<g stroke="#a569bd" stroke-width="3" opacity=".5">{"".join(f'<line x1="{x}" y1="40" x2="{x}" y2="335"/>' for x in range(150, 680, 40))}</g>
<circle cx="680" cy="150" r="60" fill="none" stroke="#fff" stroke-width="14"/><circle cx="680" cy="150" r="90" fill="#fff" opacity=".12"/><rect x="676" y="210" width="8" height="125" fill="#555"/>
<rect x="30" y="60" width="70" height="40" rx="6" fill="#c0392b"/><text x="65" y="87" text-anchor="middle" font-family="Arial Black,sans-serif" font-size="16" fill="#fff">● REC</text>
<path d="M0 335 H800 V500 H0Z" fill="#5b4a6b"/>''')

svg(os.path.join(R, "mansion.svg"), 800, 500, '''<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9a8b"/><stop offset="1" stop-color="#ffd6a5"/></linearGradient></defs>
<rect width="800" height="500" fill="url(#sky)"/>
<rect x="250" y="60" width="520" height="230" fill="#fdfefe"/><rect x="250" y="50" width="520" height="16" fill="#d5d8dc"/>
''' + "".join(f'<rect x="{x}" y="100" width="70" height="150" fill="#85c1e9" opacity=".8"/>' for x in range(280, 760, 100)) + '''
<path d="M90 335 Q80 210 120 120" stroke="#6b4423" stroke-width="12" fill="none"/>
<g fill="#2d6a4f"><path d="M120 120 q-70 -10 -100 30 q50 -20 100 -30"/><path d="M120 120 q70 -20 110 20 q-60 -20 -110 -20"/><path d="M120 120 q-20 -60 -70 -70 q40 30 70 70"/></g>
<path d="M0 290 H800 V335 H0Z" fill="#f5f5f5"/><path d="M0 335 H800 V500 H0Z" fill="#48c9b0"/><path d="M0 335 H800 V500 H0Z" fill="#fff" opacity=".15"/>
<g stroke="#fff" stroke-width="3" opacity=".5"><path d="M40 380 q30 -10 60 0 t60 0"/><path d="M420 430 q30 -10 60 0 t60 0"/><path d="M620 380 q30 -10 60 0"/></g>''')

svg(os.path.join(R, "agency.svg"), 800, 500, '''<rect width="800" height="500" fill="#0b0c10"/>
<rect x="40" y="30" width="720" height="260" fill="#1f2833"/>''' + "".join(f'<rect x="{x}" y="{300 - h}" width="40" height="{h}" fill="#2c3e50"/>' for x, h in ((60, 150), (110, 220), (170, 120), (230, 240), (300, 180), (360, 200), (430, 140), (490, 230), (560, 170), (620, 210), (690, 130))) + "".join(f'<rect x="{x}" y="{y}" width="6" height="6" fill="#f9e79f" opacity=".8"/>' for x, y in ((75, 180), (125, 110), (240, 90), (250, 150), (375, 140), (500, 100), (505, 160), (635, 120), (700, 200))) + '''
<g stroke="#c9a227" stroke-width="6"><line x1="40" y1="30" x2="40" y2="290"/><line x1="400" y1="30" x2="400" y2="290"/><line x1="760" y1="30" x2="760" y2="290"/></g>
<text x="400" y="22" text-anchor="middle" font-family="Georgia,serif" font-size="18" fill="#c9a227" letter-spacing="6">VELVET ROPE AGENCY</text>
<path d="M0 290 H800 V500 H0Z" fill="#2e1a1a"/><path d="M0 300 H800" stroke="#c9a227" stroke-width="3"/>''')

svg(os.path.join(R, "club.svg"), 800, 500, f'''<rect width="800" height="500" fill="#12001f"/>
<defs><radialGradient id="spot" cx=".5" cy="0" r="1"><stop offset="0" stop-color="#e056fd" stop-opacity=".45"/><stop offset="1" stop-color="#e056fd" stop-opacity="0"/></radialGradient></defs>
<polygon points="250,0 330,0 470,340 380,340" fill="#ff80ab" opacity=".12"/><polygon points="470,0 550,0 420,340 330,340" fill="#3dd6ff" opacity=".1"/>
<rect width="800" height="340" fill="url(#spot)"/>
<path d="M120 320 Q400 270 680 320 V340 H120Z" fill="#4a235a"/><rect x="398" y="20" width="6" height="300" fill="#d5d8dc"/>
<circle cx="400" cy="40" r="20" fill="#bdc3c7"/>{"".join(f'<rect x="{392 + (i % 3) * 6}" y="{28 + (i // 3) * 6}" width="5" height="5" fill="#fff" opacity=".8"/>' for i in range(9))}
{neon(650, 90, "VIP", "#f1c40f", 46)}{neon(150, 90, "LIVE", "#ff2d55", 46)}
<path d="M0 340 H800 V500 H0Z" fill="#1c0b2b"/><g fill="#ff80ab" opacity=".25">{"".join(f'<circle cx="{x}" cy="{360 + (x * 7) % 120}" r="3"/>' for x in range(10, 800, 37))}</g>''')

svg(os.path.join(R, "film.svg"), 800, 500, f'''<rect width="800" height="500" fill="#1b1b1b"/>
<rect x="160" y="40" width="480" height="295" fill="#2e4053"/><rect x="160" y="40" width="480" height="295" fill="#5dade2" opacity=".15"/>
<g fill="#7f8c8d"><rect x="40" y="60" width="12" height="275"/><rect x="748" y="60" width="12" height="275"/></g>
<g fill="#f9e79f"><rect x="22" y="40" width="48" height="34" rx="6"/><rect x="730" y="40" width="48" height="34" rx="6"/></g>
<polygon points="70,57 300,335 160,335" fill="#f9e79f" opacity=".08"/><polygon points="730,57 500,335 640,335" fill="#f9e79f" opacity=".08"/>
<rect x="300" y="8" width="200" height="34" rx="6" fill="#c0392b"/><text x="400" y="32" text-anchor="middle" font-family="Arial Black,sans-serif" font-size="18" fill="#fff">QUIET ON SET</text>
<path d="M0 335 H800 V500 H0Z" fill="#3b3b3b"/><g stroke="#2b2b2b" stroke-width="3">{"".join(f'<line x1="{x}" y1="335" x2="{x - 40}" y2="500"/>' for x in range(0, 900, 80))}</g>''')

svg(os.path.join(R, "media.svg"), 800, 500, '''<defs><linearGradient id="n" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1026"/><stop offset="1" stop-color="#2b1b4a"/></linearGradient></defs>
<rect width="800" height="500" fill="url(#n)"/>''' + "".join(f'<rect x="{x}" y="{330 - h}" width="{w}" height="{h}" fill="#141a33"/>' for x, w, h in ((0, 80, 200), (90, 60, 260), (160, 90, 180), (520, 70, 240), (600, 90, 300), (700, 100, 220))) + '''
<rect x="270" y="20" width="240" height="310" fill="#1f2a50"/>''' + "".join(f'<rect x="{x}" y="{y}" width="26" height="14" fill="#f9e79f" opacity="{.25 + (x * y) % 5 * .12}"/>' for x in range(290, 500, 40) for y in range(110, 320, 30)) + '''
<rect x="300" y="35" width="180" height="60" rx="8" fill="#111"/><text x="390" y="80" text-anchor="middle" font-family="Impact,Arial Black,sans-serif" font-size="46" fill="#ff2d55" stroke="#fff" stroke-width="1.5">XXX</text>
<path d="M0 330 H800 V500 H0Z" fill="#2c2c3e"/><path d="M0 330 H800" stroke="#c9a227" stroke-width="4"/>''')

print("ok", len(SPRITES), "sprites, 8 rooms")
