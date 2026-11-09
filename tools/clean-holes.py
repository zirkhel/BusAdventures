"""Remove leftover background patches inside a sprite sheet (e.g. between an arm and the body).

Background removal often leaves the old, light background in closed gaps. Those patches are flat,
light grey and unsaturated. This tool finds such areas frame by frame and makes them transparent.
Real white details (masks, shoes, highlights) are kept: they are usually brighter, smaller or
textured with lines.

    python3 tools/clean-holes.py sheet.webp [out.webp] --columns 6 --rows 4 [--dry] [--min 70]
              [--lo 150] [--hi 245] [--core 15] [--quality 80]

Without out.webp the sheet is overwritten. --dry only reports.
"""
import argparse, os
import numpy as np
from PIL import Image
from scipy import ndimage

ap = argparse.ArgumentParser()
ap.add_argument("src"); ap.add_argument("out", nargs="?")
ap.add_argument("--columns", type=int, default=6); ap.add_argument("--rows", type=int, default=4)
ap.add_argument("--min", type=int, default=70, help="min patch size in px at 512 px frame height")
ap.add_argument("--lo", type=int, default=150); ap.add_argument("--hi", type=int, default=245)
ap.add_argument("--sat", type=int, default=30); ap.add_argument("--std", type=float, default=9.0)
ap.add_argument("--cool", type=float, default=1, help="skip patches whose blue minus red is at least this (metal)")
ap.add_argument("--core", type=int, default=15, help="min flat core (px) after shrinking the patch by 2 px")
ap.add_argument("--dry", action="store_true"); ap.add_argument("--quality", type=int, default=80)
ap.add_argument("--debug", help="write a red overlay of what would be removed")
a = ap.parse_args()

im = Image.open(a.src).convert("RGBA")
arr = np.array(im)
H, W = arr.shape[:2]
fw, fh = W // a.columns, H // a.rows
minpx = int(a.min * (fh / 512) ** 2)
rgb = arr[..., :3].astype(int); al = arr[..., 3]
lum = rgb.mean(-1); sat = rgb.max(-1) - rgb.min(-1)
cand = (al > 100) & (lum >= a.lo) & (lum <= a.hi) & (sat <= a.sat)
kill = np.zeros_like(cand)
per = []
for r in range(a.rows):
    for c in range(a.columns):
        ys, xs = slice(r * fh, (r + 1) * fh), slice(c * fw, (c + 1) * fw)
        lab, n = ndimage.label(cand[ys, xs])
        removed = 0
        for i in range(1, n + 1):
            m = lab == i
            s = int(m.sum())
            if s < minpx: continue
            # A real background patch is wide and flat: it still has a flat core after shrinking it.
            # Thin light details (blades, outlines, highlights) vanish when shrunk and are kept.
            core = ndimage.binary_erosion(m, iterations=2)
            if core.sum() < a.core or lum[ys, xs][core].std() > a.std: continue
            # Metal (blades) is slightly blue; the old background is neutral or warm grey.
            px = rgb[ys, xs][m]
            if px[:, 2].mean() - px[:, 0].mean() >= a.cool: continue
            kill[ys, xs] |= m; removed += s
        per.append(removed)

# take the anti-aliased rim with it, but only light pixels
rim = ndimage.binary_dilation(kill, iterations=2) & ~kill & (lum > 150) & (sat <= a.sat + 10)
total = int(kill.sum())
print(f"{os.path.basename(a.src)}: {total} px in {sum(1 for p in per if p)} of {len(per)} frames (max {max(per)} px in one frame)")
if a.debug:
    dbg = arr.copy(); dbg[kill | rim] = [255, 0, 0, 255]
    Image.fromarray(dbg).save(a.debug)
if a.dry or total == 0:
    raise SystemExit
out = arr.copy()
out[kill, 3] = 0
out[rim, 3] = (out[rim, 3] * 0.35).astype(np.uint8)
Image.fromarray(out).save(a.out or a.src, "WEBP", quality=a.quality, alpha_quality=90, method=6)
print("  saved", a.out or a.src, os.path.getsize(a.out or a.src) // 1000, "kB")
