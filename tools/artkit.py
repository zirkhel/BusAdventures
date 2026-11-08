"""Shared drawing kit for Empire placeholder art (used by make-quest-art.py and make-space-art.py).

Sprites are drawn 3x supersampled on a 160x160 frame and scaled down; feet at the bottom centre.
"""
import math, os
from PIL import Image, ImageDraw

FW = FH = 160
S = 3


def C(h, a=255):
    h = h.lstrip("#")
    if len(h) == 3: h = "".join(c * 2 for c in h)
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (a,)


def shade(c, f):
    return tuple(max(0, min(255, int(v * f))) for v in c[:3]) + (c[3],)


class Pen:
    def __init__(self):
        self.im = Image.new("RGBA", (FW * S, FH * S), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.im)

    def P(self, x, y): return (x * S, y * S)
    def ell(self, cx, cy, rx, ry, fill): self.d.ellipse([(cx - rx) * S, (cy - ry) * S, (cx + rx) * S, (cy + ry) * S], fill=fill)
    def line(self, pts, fill, w): self.d.line([self.P(*p) for p in pts], fill=fill, width=int(w * S), joint="curve")
    def poly(self, pts, fill): self.d.polygon([self.P(*p) for p in pts], fill=fill)
    def rect(self, x0, y0, x1, y1, fill, r=0):
        if r: self.d.rounded_rectangle([x0 * S, y0 * S, x1 * S, y1 * S], r * S, fill=fill)
        else: self.d.rectangle([x0 * S, y0 * S, x1 * S, y1 * S], fill=fill)
    def shadow(self, cx=80, w=34): self.ell(cx, 154, w, 4, (0, 0, 0, 70))
    def done(self): return self.im.resize((FW, FH), Image.LANCZOS)


def limb(p, ang, ln):
    a = math.radians(ang)
    return (p[0] + math.sin(a) * ln, p[1] + math.cos(a) * ln)



def biped(t, skin="#6aa84f", top="#5b3a29", legs="#3d2b1f", size=1.0, kind="idle", ears=False, crown=None, hat=None,
          horns=False, weapon=None, robe=False, bones=False, armor=False, floaty=False, tail=None, wings=None, eyes="#111", glow=None, belly=None):
    pen = Pen()
    s = math.sin(t * 2 * math.pi)
    k = size
    pen.shadow(80, 26 * k)
    hip = (80, 154 - 52 * k - (6 + 4 * s if floaty else 0) + (1.5 * s if not floaty else 0))
    lean = 4 * s if kind in ("idle", "cast") else 6
    attack = 0.45 <= t < 0.7
    neck = limb(hip, 180 + lean, 40 * k)
    sk, tp, lg = C(skin), C(top), C(legs)
    W = (8 if not bones else 4) * k
    if wings:
        for side in (-1, 1):
            flap = 20 * s
            pen.poly([neck, (neck[0] - 46 * k * side * -1 if False else neck[0] + side * 44 * k, neck[1] - 30 * k + flap), (neck[0] + side * 30 * k, neck[1] + 10 * k)], C(wings, 220))
    if tail:
        pen.line([(hip[0] - 6 * k, hip[1]), (hip[0] - 26 * k, hip[1] + 10 * k + 4 * s), (hip[0] - 34 * k, hip[1] - 4 * k)], C(tail), 3 * k)
        pen.poly([(hip[0] - 34 * k, hip[1] - 10 * k), (hip[0] - 40 * k, hip[1] - 2 * k), (hip[0] - 30 * k, hip[1] - 2 * k)], C(tail))
    # legs
    if robe:
        pen.poly([(hip[0] - 16 * k, hip[1] - 6 * k), (hip[0] + 16 * k, hip[1] - 6 * k), (hip[0] + 24 * k, 154), (hip[0] - 24 * k, 154)], shade(tp, .85))
    elif floaty:
        pen.poly([(hip[0] - 14 * k, hip[1]), (hip[0] + 14 * k, hip[1]), (hip[0] + 4 * k + 4 * s, hip[1] + 26 * k), (hip[0] - 6 * k, hip[1] + 18 * k)], shade(tp, .8))
    else:
        for u, l, col in ((-12 + 6 * s, -4, shade(lg, .75)), (14 - 6 * s, 4, lg)):
            knee = limb(hip, u, 26 * k); foot = limb(knee, l, 26 * k)
            pen.line([hip, knee, foot], col, W)
            pen.ell(foot[0] + 3 * k, foot[1], 7 * k, 4 * k, C("#2b2b2b") if not bones else C("#e8e4d8"))
    # back arm
    eb = limb(neck, -20 + 10 * s, 20 * k); hb = limb(eb, 10, 18 * k)
    pen.line([neck, eb, hb], shade(sk if not armor else tp, .75), W * .9)
    # torso
    tw = (13 if not bones else 7) * k
    if bones:
        pen.line([hip, neck], C("#e8e4d8"), 5 * k)
        for i in range(4):
            y = neck[1] + (6 + i * 7) * k
            pen.line([(neck[0] - 10 * k + i, y), (neck[0] + 10 * k - i, y)], C("#e8e4d8"), 3 * k)
    else:
        pen.poly([(hip[0] - tw, hip[1]), (hip[0] + tw, hip[1]), (neck[0] + tw * 1.2, neck[1] + 4 * k), (neck[0] - tw * 1.2, neck[1] + 4 * k)], tp)
        if belly: pen.ell(hip[0] + 2 * k, hip[1] - 12 * k, 10 * k, 9 * k, C(belly))
        if armor:
            pen.line([(neck[0], neck[1] + 6 * k), (hip[0], hip[1] - 2 * k)], shade(tp, 1.3), 2 * k)
            pen.ell(neck[0] - tw, neck[1] + 6 * k, 8 * k, 6 * k, shade(tp, 1.2)); pen.ell(neck[0] + tw, neck[1] + 6 * k, 8 * k, 6 * k, shade(tp, 1.2))
    # head
    hr = 12 * k
    head = limb(neck, 180 + lean * .5, hr + 2 * k)
    hx, hy = head
    if horns:
        for sd in (-1, 1): pen.poly([(hx + sd * 7 * k, hy - 8 * k), (hx + sd * 16 * k, hy - 22 * k), (hx + sd * 3 * k, hy - 11 * k)], C("#e8e0c8"))
    if ears:
        for sd in (-1, 1): pen.poly([(hx + sd * 8 * k, hy - 2 * k), (hx + sd * 24 * k, hy - 10 * k), (hx + sd * 9 * k, hy + 4 * k)], sk)
    if armor:
        pen.rect(hx - hr, hy - hr, hx + hr, hy + hr, shade(tp, 1.15), 4 * k)
        pen.rect(hx - hr * .7, hy - 2 * k, hx + hr * .9, hy + 1 * k, C("#111"))
        if glow: pen.ell(hx + 5 * k, hy - 0.5 * k, 2.5 * k, 2 * k, C(glow))
    else:
        pen.ell(hx, hy, hr, hr, sk if not bones else C("#e8e4d8"))
        if bones:
            pen.ell(hx - 4 * k, hy - 2 * k, 3.5 * k, 4 * k, C("#222")); pen.ell(hx + 5 * k, hy - 2 * k, 3.5 * k, 4 * k, C("#222"))
            pen.rect(hx - 5 * k, hy + 5 * k, hx + 6 * k, hy + 8 * k, C("#bbb"))
            if glow: pen.ell(hx + 5 * k, hy - 2 * k, 1.8 * k, 1.8 * k, C(glow))
        else:
            pen.ell(hx + 5 * k, hy - 2 * k, 2.6 * k, 2.6 * k, C(eyes))
            if ears or horns: pen.ell(hx - 3 * k, hy - 2 * k, 2.2 * k, 2.2 * k, C(eyes))
    if hat:
        pen.poly([(hx - 20 * k, hy - 6 * k), (hx + 20 * k, hy - 6 * k), (hx + 4 * k, hy - 40 * k + 3 * s)], C(hat))
        pen.ell(hx + 4 * k, hy - 40 * k + 3 * s, 3 * k, 3 * k, C("#f1c40f"))
    if crown:
        cy = hy - hr - 2 * k
        pen.poly([(hx - 11 * k, cy + 6 * k), (hx - 11 * k, cy - 6 * k), (hx - 5 * k, cy), (hx, cy - 9 * k), (hx + 5 * k, cy), (hx + 11 * k, cy - 6 * k), (hx + 11 * k, cy + 6 * k)], C(crown))
    # front arm + weapon
    if kind == "cast":
        ua, la = 120 + 20 * s, 150
    elif kind == "shoot":
        ua, la = 88, 92
    elif attack:
        ua, la = 100, 95
    else:
        ua, la = 40 + 8 * s, 120
    ef = limb(neck, ua, 20 * k); hf = limb(ef, la, 18 * k)
    pen.line([neck, ef, hf], sk if not armor else shade(tp, 1.1), W * .9)
    if bones: pen.line([neck, ef, hf], C("#e8e4d8"), 3 * k)
    if weapon == "dagger": pen.line([hf, limb(hf, la, 14 * k)], C("#cfd8dc"), 3 * k)
    elif weapon == "sword": pen.line([hf, limb(hf, la - 10, 30 * k)], C("#cfd8dc"), 4 * k); pen.line([limb(hf, la + 90, 5 * k), limb(hf, la - 90, 5 * k)], C("#8d6e63"), 3 * k)
    elif weapon == "club":
        end = limb(hf, la - 20, 30 * k); pen.line([hf, end], C("#6d4c41"), 7 * k); pen.ell(end[0], end[1], 7 * k, 7 * k, C("#5d4037"))
    elif weapon == "staff":
        top = (hf[0] + 2 * k, hf[1] - 34 * k); pen.line([(hf[0] - 2 * k, hf[1] + 26 * k), top], C("#6d4c41"), 3 * k)
        pen.ell(top[0], top[1], 6 * k + (2 * s if glow else 0), 6 * k + (2 * s if glow else 0), C(glow or "#9b59b6"))
    elif weapon == "bow":
        pen.d.arc([(hf[0] - 6 * k) * S, (hf[1] - 22 * k) * S, (hf[0] + 10 * k) * S, (hf[1] + 22 * k) * S], 270, 90, fill=C("#8d6e63"), width=int(3 * k * S))
        pen.line([(hf[0] + 2 * k, hf[1] - 21 * k), (hf[0] - 8 * k + (6 if attack else 0), hf[1]), (hf[0] + 2 * k, hf[1] + 21 * k)], C("#eee"), 1)
    if kind == "cast" and glow:
        r = 6 + 4 * abs(s)
        pen.ell(hf[0], hf[1], r * k, r * k, C(glow, 170))
    return pen.done()



def sheet(out, name, fn):
    strip = Image.new("RGBA", (FW * 6, FH), (0, 0, 0, 0))
    for i in range(6):
        strip.paste(fn(i / 6), (i * FW, 0))
    strip.save(os.path.join(out, "sprites", name + ".webp"), "WEBP", lossless=True, quality=100, method=6)



def svg(path, w, h, body):
    with open(path, "w", encoding="utf-8") as f:
        f.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">{body}</svg>\n')


