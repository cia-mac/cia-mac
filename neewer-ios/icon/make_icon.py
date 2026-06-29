#!/usr/bin/env python3
"""Generate Glow's 1024x1024 app icon: a soft warm->purple glow orb on near-black.
Run: python3 icon/make_icon.py  (writes into the asset catalog)."""
import os
from PIL import Image, ImageDraw, ImageFilter

S = 1024
BG = (11, 11, 14)
CORE = (255, 178, 102)   # warm orange core
MID = (150, 70, 200)     # purple
EDGE = BG

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def radius_color(t):  # t: 0 center -> 1 edge
    if t < 0.55:
        return lerp(CORE, MID, t / 0.55)
    return lerp(MID, EDGE, (t - 0.55) / 0.45)

img = Image.new("RGB", (S, S), BG)
dr = ImageDraw.Draw(img)
cx = cy = S / 2
maxr = int(S * 0.46)
for r in range(maxr, 0, -1):
    t = r / maxr
    dr.ellipse([cx - r, cy - r, cx + r, cy + r], fill=radius_color(t))

img = img.filter(ImageFilter.GaussianBlur(18))

# tiny bright highlight at the core
hl = Image.new("RGB", (S, S), (0, 0, 0))
hd = ImageDraw.Draw(hl)
hr = int(S * 0.10)
hd.ellipse([cx - hr, cy - hr, cx + hr, cy + hr], fill=(255, 225, 190))
hl = hl.filter(ImageFilter.GaussianBlur(40))
img = Image.blend(img, Image.composite(hl, img, hl.convert("L")), 0.35)

out = os.path.join(os.path.dirname(__file__), "..", "Sources", "Assets.xcassets",
                   "AppIcon.appiconset", "icon_1024.png")
out = os.path.abspath(out)
os.makedirs(os.path.dirname(out), exist_ok=True)
img.save(out, "PNG")
print("wrote", out)
