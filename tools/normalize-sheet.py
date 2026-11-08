"""Normalize an externally generated spritesheet to the Empire asset standard.

Fixes the usual problems with sheets from ComfyUI and similar tools:
  - frames that are not equally wide, or figures that cross frame borders
  - a faint semi-transparent haze in the background
  - feet that are not on the same spot in every frame

How it works: finds each figure by its legs (the lower part of the sheet, where figures
do not overlap), gives every solid piece of the image to the nearest figure, removes
everything else, and builds equal frames with the feet midpoint centred and the feet on
the same baseline. The result is scaled to the requested frame height and saved as WebP.

    python3 tools/normalize-sheet.py in.png out.webp --frames 8 [--height 640] [--quality 85]

Prints the frame size to put in theme.json (frames, frameAspect).
Requires: Pillow, numpy, scipy.
"""
import argparse, os
import numpy as np
from PIL import Image
from scipy import ndimage

ap = argparse.ArgumentParser()
ap.add_argument("src"); ap.add_argument("out")
ap.add_argument("--frames", type=int, required=True, help="number of figures in the sheet")
ap.add_argument("--height", type=int, default=640, help="output frame height in px")
ap.add_argument("--quality", type=int, default=85)
ap.add_argument("--pad", type=int, default=20, help="transparent margin above/below in source px")
ap.add_argument("--max-width", type=int, default=4096, help="warn when the sheet gets wider than this")
a = ap.parse_args()

arr = np.array(Image.open(a.src).convert("RGBA"))
al = arr[:, :, 3]
H, W = al.shape
if al.min() == 255:
    raise SystemExit("The image has no transparency (no alpha). Export it again with a transparent background.")

solid = al > 60
rows = np.nonzero(solid.any(axis=1))[0]
top, bot = rows.min(), rows.max()
leg_from = int(bot - (bot - top) * 0.22)          # lower 22 % of the figures: the legs
cols = solid[leg_from:bot + 1].any(axis=0)
segs, inside = [], False
for x, v in enumerate(cols):
    if v and not inside: s, inside = x, True
    if not v and inside: segs.append((s, x - 1)); inside = False
if inside: segs.append((s, W - 1))
segs = [g for g in segs if g[1] - g[0] >= 4]
# Legs of one figure may be separate pieces: group them around the expected frame slots.
slot = W / a.frames
groups = [[] for _ in range(a.frames)]
for x0, x1 in segs:
    groups[min(a.frames - 1, int(((x0 + x1) / 2) // slot))].append((x0, x1))
if any(not g for g in groups):
    raise SystemExit(f"Could not find legs in every one of the {a.frames} frame slots. Is --frames right?")
centers = [(min(x0 for x0, _ in g) + max(x1 for _, x1 in g)) / 2 for g in groups]   # feet midpoint

lab, n = ndimage.label(solid)
sizes = ndimage.sum(solid, lab, range(1, n + 1))
cms = ndimage.center_of_mass(solid, lab, range(1, n + 1))
masks = [np.zeros_like(solid) for _ in centers]
for k, ((cy, cx), sz) in enumerate(zip(cms, sizes), 1):
    if sz < 30: continue                       # specks
    masks[int(np.argmin([abs(cx - c) for c in centers]))] |= lab == k
masks = [ndimage.binary_dilation(m, iterations=2) for m in masks]   # keep soft edges

half = 0
for c, m in zip(centers, masks):
    xs = np.nonzero(m.any(axis=0))[0]
    half = max(half, c - xs.min(), xs.max() - c)
FW = int(2 * half + 24); FH = (bot - top + 1) + 2 * a.pad
sheet = Image.new("RGBA", (FW * a.frames, FH), (0, 0, 0, 0))
for i, c in enumerate(centers):
    layer = arr.copy(); layer[~masks[i]] = 0
    x0 = int(round(c - FW / 2))
    big = Image.new("RGBA", (W + 2 * FW, H + 2 * a.pad), (0, 0, 0, 0))
    big.alpha_composite(Image.fromarray(layer), (FW, a.pad))
    sheet.alpha_composite(big.crop((x0 + FW, top, x0 + 2 * FW, top + FH)), (i * FW, 0))

scale = a.height / FH
fw = max(1, round(FW * scale))
out = sheet.resize((fw * a.frames, a.height), Image.LANCZOS)
out.save(a.out, "WEBP", quality=a.quality, alpha_quality=90, method=6)
print(f"{a.frames} frames of {fw} x {a.height} (sheet {fw * a.frames} x {a.height}), {os.path.getsize(a.out) // 1000} kB")
print(f'theme.json:  "frames": {a.frames}, "frameAspect": "{fw} / {a.height}"')
if fw * a.frames > a.max_width:
    print(f"WARNING: sheet is wider than {a.max_width} px. Use a lower --height.")
