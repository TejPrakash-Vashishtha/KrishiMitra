#!/usr/bin/env python3
# ============================================================
# KrishiMitra icon system generator.
#
# Single source of truth: a hand-authored wheat-ear geometry
# (pure vector math below — no AI image generation, no stock art).
# Renders:
#   - all launcher mipmaps (ic_launcher, round, adaptive foreground)
#   - adaptive-icon vector drawables + monochrome
#   - every splash screen at its existing dimensions
#   - scripts/icon-src/icon.svg (brand master)
#
# Re-run after `bun run build`-free anytime: python3 scripts/generate-icons.py
# ============================================================
import math
import os
import struct
import zlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(ROOT, "android", "app", "src", "main", "res")

# ---- Brand palette (mirrors the site preloader / landing) ----
EMERALD_DEEP = (2, 44, 34)      # #022c22
EMERALD_MID = (6, 78, 59)       # #064e3b
EMERALD = (16, 185, 129)        # #10b981
GOLD = (251, 191, 36)           # #fbbf24
CREAM = (250, 245, 220)         # #faf5dc — wheat grain
CREAM_DIM = (232, 224, 190)

# ---------------- Geometry: the wheat ear ----------------
def grain_pts(cx, cy, L, W, tilt_deg):
    """A wheat grain = two symmetric quadratic petals meeting at a tip.
    Returns an SVG path string. tilt rotates around (cx, cy)."""
    t = math.radians(tilt_deg)
    ca, sa = math.cos(t), math.sin(t)

    def rot(x, y):
        return (cx + x * ca - y * sa, cy + x * sa + y * ca)

    # local coords: grain points "up" (negative y), origin at its base
    tip = (0, -L)
    side_l = (-W, -L * 0.35)
    base_l = (-W * 0.55, 0)
    base_r = (W * 0.55, 0)
    side_r = (W, -L * 0.35)

    p_tip = rot(*tip)
    p_sl = rot(*side_l)
    p_bl = rot(*base_l)
    p_br = rot(*base_r)
    p_sr = rot(*side_r)
    p_mid = rot(0, -L * 0.62)

    def f(p):
        return f"{p[0]:.2f},{p[1]:.2f}"

    # left petal: base_l -> ctrl(side_l) -> tip ; right petal mirrored
    return (
        f"M {f(p_bl)} "
        f"Q {f(p_sl)} {f(p_tip)} "
        f"Q {f(p_sr)} {f(p_br)} "
        f"Q {f(p_mid)} {f(p_bl)} Z"
    )


def awn(cx, cy, length, tilt_deg, width=1.1, opacity=0.9):
    """A thin bristle (awn) shooting up from a grain tip."""
    t = math.radians(tilt_deg)
    x2 = cx + math.sin(t) * length
    y2 = cy - math.cos(t) * length
    return (
        f'<path d="M {cx:.2f},{cy:.2f} L {x2:.2f},{y2:.2f}" '
        f'stroke="#FAF5DC" stroke-opacity="{opacity}" '
        f'stroke-width="{width}" stroke-linecap="round" fill="none"/>'
    )


def stem_path(x_bottom, y_bottom, x_top, y_top, bow):
    """Slightly curved stem via a single quadratic."""
    mx = (x_bottom + x_top) / 2 + bow
    my = (y_bottom + y_top) / 2
    return (
        f"M {x_bottom:.2f},{y_bottom:.2f} "
        f"Q {mx:.2f},{my:.2f} {x_top:.2f},{y_top:.2f}"
    )


def build_wheat_mark(cx, cy, scale=1.0, with_awns=True, stroke_w=3.2):
    """Returns (paths_svg, awns_svg). The mark spans roughly [-1,1] * 46*scale."""
    s = scale
    grains = []
    awn_lines = []
    # 4 graded pairs + 1 top grain, angles fan outward with height
    rows = [
        # (y_off, angle_deg, L, W)
        (30, 26, 13.5, 6.2),
        (17, 17, 15.0, 6.6),
        (4, 8, 16.0, 6.9),
        (-9, -8, 16.0, 6.9),
        (-22, -17, 15.0, 6.6),
    ]
    for y_off, ang, L, W in rows:
        gy = cy + y_off * s
        # left grain leans left, right grain leans right
        grains.append((grain_pts(cx - 3.5 * s, gy, L * s, W * s, -ang), 1.0))
        grains.append((grain_pts(cx + 3.5 * s, gy, L * s, W * s, ang), 1.0))
        if with_awns:
            for side in (-1, 1):
                tip_y = gy - math.cos(math.radians(ang)) * L * s
                tip_x = cx + side * (3.5 * s + math.sin(math.radians(ang)) * L * s)
                awn_lines.append(
                    awn(tip_x, tip_y, 9.5 * s, ang * 0.55 + side * 6, 1.05, 0.85)
                )
    # top center grain (the "leader")
    grains.append((grain_pts(cx, cy - 34 * s, 15.5 * s, 6.8 * s, 0), 1.0))
    if with_awns:
        awn_lines.append(awn(cx, cy - 34 * s - 15.5 * s, 11 * s, 0, 1.1, 0.9))
        awn_lines.append(awn(cx, cy - 34 * s - 15.5 * s, 9 * s, 14, 0.9, 0.7))
        awn_lines.append(awn(cx, cy - 34 * s - 15.5 * s, 9 * s, -14, 0.9, 0.7))

    stem = (
        f'<path d="{stem_path(cx, cy + 40 * s, cx, cy + 8 * s, 0)}" '
        f'stroke="#FAF5DC" stroke-width="{stroke_w * s:.2f}" '
        f'stroke-linecap="round" fill="none"/>'
    )
    leaves = (
        # two simple leaf strokes flanking the stem base
        f'<path d="{stem_path(cx, cy + 36 * s, cx - 14 * s, cy + 24 * s, -4 * s)}" '
        f'stroke="#FAF5DC" stroke-opacity="0.85" stroke-width="{2.4 * s:.2f}" '
        f'stroke-linecap="round" fill="none"/>'
        f'<path d="{stem_path(cx, cy + 36 * s, cx + 14 * s, cy + 24 * s, 4 * s)}" '
        f'stroke="#FAF5DC" stroke-opacity="0.85" stroke-width="{2.4 * s:.2f}" '
        f'stroke-linecap="round" fill="none"/>'
    )
    grain_svg = "".join(
        f'<path d="{d}" fill="#FAF5DC" fill-opacity="{o}"/>' for d, o in grains
    )
    return stem + leaves + grain_svg, "".join(awn_lines)


def radial_gradient_defs(inner, outer, inner_stop=0.0, mid=None):
    mid_svg = ""
    stops = [
        (0.0, inner),
        (0.55, mid or EMERALD_MID),
        (1.0, outer),
    ]
    stop_svg = "".join(
        f'<stop offset="{off}" stop-color="#{r:02x}{g:02x}{b:02x}"/>'
        for off, (r, g, b) in stops
    )
    return (
        '<defs><radialGradient id="bgGrad" cx="50%" cy="38%" r="75%">'
        + stop_svg + "</radialGradient></defs>"
    )


def svg_icon(size, scale=None, awns=True):
    # Mark spans ~100 units tall at scale 1; fill ~75% of the canvas so the
    # ear reads clearly at 48dp launcher size.
    if scale is None:
        scale = size / 133.0
    cx, cy = size / 2, size / 2 + 8 * scale
    mark, awn_svg = build_wheat_mark(cx, cy, scale, awns)
    defs = radial_gradient_defs(EMERALD_MID, EMERALD_DEEP)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" '
        f'viewBox="0 0 {size} {size}">'
        + defs
        + f'<rect width="{size}" height="{size}" fill="url(#bgGrad)"/>'
        + mark
        + awn_svg
        + "</svg>"
    )


def svg_foreground(viewport=108, awns=True):
    """Adaptive-icon foreground: mark centered in the middle 66% safe zone."""
    cx = cy = viewport / 2
    mark, awn_svg = build_wheat_mark(cx, cy - 2, 0.62, awns, stroke_w=3.6)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{viewport}" height="{viewport}" '
        f'viewBox="0 0 {viewport} {viewport}">'
        + mark
        + awn_svg
        + "</svg>"
    )


# ---------------- Minimal SVG rasterizer ----------------
class Svg:
    """Parses just what we emit above: gradients rect, Q/M/L paths with
    fill or stroke, on a transparent or gradient background."""

    def __init__(self, svg_text):
        import re

        self.width = int(re.search(r'width="(\d+)"', svg_text).group(1))
        hm = re.search(r'height="(\d+)"', svg_text)
        self.height = int(hm.group(1)) if hm else self.width
        vb = re.search(r'viewBox="0 0 (\d+) (\d+)"', svg_text)
        self.vw, self.vh = int(vb.group(1)), int(vb.group(2))
        self.scale = self.width / self.vw
        self.grad = None
        m = re.search(r"radialGradient id=\"bgGrad\" cx=\"([\d.]+)%\" cy=\"([\d.]+)%\" r=\"([\d.]+)%\">(.*?)</radialGradient>", svg_text, re.S)
        if m:
            stops = [(float(o), c) for o, c in re.findall(r'<stop offset="([\d.]+)" stop-color="#([0-9a-f]{6})"/>', m.group(4))]
            self.grad = (float(m.group(1)) / 100, float(m.group(2)) / 100, float(m.group(3)) / 100, stops)
        self.items = []
        for pm in re.finditer(r'<path ([^>]+?)/>', svg_text, re.S):
            attrs = pm.group(1)
            d = re.search(r'd="([^"]+)"', attrs).group(1)
            fill = re.search(r'fill="(#[0-9a-fA-F]{6})"', attrs)
            fill_op = float((re.search(r'fill-opacity="([\d.]+)"', attrs) or [None, "1"])[1])
            stroke = re.search(r'stroke="(#[0-9a-fA-F]{6})"', attrs)
            stroke_op = float((re.search(r'stroke-opacity="([\d.]+)"', attrs) or [None, "1"])[1])
            sw = float((re.search(r'stroke-width="([\d.]+)"', attrs) or [None, "1"])[1])
            self.items.append(dict(d=d, fill=fill.group(1) if fill else None,
                                   fill_op=fill_op if fill else 1,
                                   stroke=stroke.group(1) if stroke else None,
                                   stroke_op=stroke_op if stroke else 1, sw=sw))

    def render(self):
        import re

        W = self.width
        H = self.height
        sc = self.scale
        px = bytearray(W * H * 4)

        # background gradient
        if self.grad:
            gx, gy, gr, stops = self.grad
            cx, cy = gx * W, gy * H
            rr = gr * W
            scol = [(o, (int(c[1:3], 16), int(c[3:5], 16), int(c[5:7], 16))) for o, c in stops]
            for y in range(H):
                for x in range(W):
                    d = math.hypot(x - cx, y - cy) / rr
                    d = min(d, 1.0)
                    for i in range(len(scol) - 1):
                        o0, c0 = scol[i]
                        o1, c1 = scol[i + 1]
                        if o0 <= d <= o1:
                            t = (d - o0) / (o1 - o0) if o1 > o0 else 0
                            col = tuple(int(c0[k] + (c1[k] - c0[k]) * t) for k in range(3))
                            break
                    idx = (y * W + x) * 4
                    px[idx:idx + 3] = bytes(col)
                    px[idx + 3] = 255

        # resolve path items into (segments, style) then draw
        for it in self.items:
            segs = []
            cur = None
            start = None
            for tok in re.finditer(r'([MLQ])\s*((?:-?[\d.]+[,\s]*)+)', it["d"]):
                cmd = tok.group(1)
                nums = [float(n) for n in re.split(r"[,\s]+", tok.group(2).strip()) if n]
                pts = [(nums[i] * sc, nums[i + 1] * sc) for i in range(0, len(nums), 2)]
                if cmd == "M":
                    cur = pts[0]
                    start = cur
                    for p in pts[1:]:
                        segs.append(("L", cur, p))
                        cur = p
                elif cmd == "L":
                    segs.append(("L", cur, pts[0]))
                    cur = pts[0]
                elif cmd == "Q":
                    segs.append(("Q", cur, pts[0], pts[1]))
                    cur = pts[1]
            if it["fill"]:
                col = (int(it["fill"][1:3], 16), int(it["fill"][3:5], 16), int(it["fill"][5:7], 16))
                self._fill_paths(px, W, H, segs, col, it["fill_op"])
            if it["stroke"]:
                col = (int(it["stroke"][1:3], 16), int(it["stroke"][3:5], 16), int(it["stroke"][5:7], 16))
                for seg in segs:
                    if seg[0] == "L":
                        self._line(px, W, H, seg[1], seg[2], col, it["sw"] * sc, it["stroke_op"])
                    else:
                        self._quad(px, W, H, seg[1], seg[2], seg[3], col, it["sw"] * sc, it["stroke_op"])
        return bytes(px)

    # --- scanline polygon fill with quadratic edges flattened ---
    def _fill_paths(self, px, W, H, segs, col, op):
        poly = []
        for seg in segs:
            if seg[0] == "L":
                poly.append(seg[1])
                poly.append(seg[2])
            else:
                p0, c, p1 = seg[1], seg[2], seg[3]
                steps = max(2, int(math.hypot(p1[0] - p0[0], p1[1] - p0[1]) / 2))
                prev = p0
                for i in range(1, steps + 1):
                    t = i / steps
                    x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * c[0] + t ** 2 * p1[0]
                    y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * c[1] + t ** 2 * p1[1]
                    poly.append(prev)
                    poly.append((x, y))
                    prev = (x, y)
        if len(poly) < 6:
            return
        ys = [p[1] for p in poly]
        y0, y1 = max(0, int(min(ys))), min(H - 1, int(max(ys)) + 1)
        n = len(poly)
        for y in range(y0, y1 + 1):
            yc = y + 0.5
            xs = []
            for i in range(0, n, 2):
                a, b = poly[i], poly[i + 1]
                if (a[1] <= yc < b[1]) or (b[1] <= yc < a[1]):
                    xs.append(a[0] + (yc - a[1]) / (b[1] - a[1]) * (b[0] - a[0]))
            xs.sort()
            for i in range(0, len(xs) - 1, 2):
                x_start, x_end = int(math.ceil(xs[i] - 0.5)), int(math.floor(xs[i + 1] - 0.5))
                for x in range(max(0, x_start), min(W - 1, x_end) + 1):
                    self._blend(px, y * W + x, col, op)

    # --- thick line / quad stroke via distance-field stamps ---
    def _line(self, px, W, H, p0, p1, col, width, op):
        length = math.hypot(p1[0] - p0[0], p1[1] - p0[1])
        steps = max(2, int(length * 2))
        r = width / 2
        for i in range(steps + 1):
            t = i / steps
            x = p0[0] + (p1[0] - p0[0]) * t
            y = p0[1] + (p1[1] - p0[1]) * t
            self._disc(px, W, H, x, y, r, col, op)

    def _quad(self, px, W, H, p0, c, p1, col, width, op):
        steps = max(4, int(math.hypot(p1[0] - p0[0], p1[1] - p0[1]) * 2))
        prev = p0
        for i in range(1, steps + 1):
            t = i / steps
            x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * c[0] + t ** 2 * p1[0]
            y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * c[1] + t ** 2 * p1[1]
            self._line(px, W, H, prev, (x, y), col, width, op)
            prev = (x, y)

    def _disc(self, px, W, H, cx, cy, r, col, op):
        x0, x1 = max(0, int(cx - r - 1)), min(W - 1, int(cx + r + 1))
        y0, y1 = max(0, int(cy - r - 1)), min(H - 1, int(cy + r + 1))
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                d = math.hypot(x + 0.5 - cx, y + 0.5 - cy)
                cov = max(0.0, min(1.0, r - d + 0.5))
                if cov > 0:
                    self._blend(px, y * W + x, col, op * cov)

    @staticmethod
    def _blend(px, idx, col, op):
        a = op
        if a >= 1:
            px[idx * 4:idx * 4 + 3] = bytes(col)
            px[idx * 4 + 3] = 255
        else:
            for k in range(3):
                px[idx * 4 + k] = int(px[idx * 4 + k] * (1 - a) + col[k] * a)
            px[idx * 4 + 3] = 255


# ---------------- PNG writer (no dependencies) ----------------
def write_png(path, w, h, rgba):
    def chunk(tag, data):
        c = struct.pack(">I", len(data)) + tag + data
        return c + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    raw = b"".join(b"\x00" + rgba[y * w * 4:(y + 1) * w * 4] for y in range(h))
    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(png)


MIPMAPS = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

ADAPTIVE_FG = {
    "mipmap-mdpi": 108,
    "mipmap-hdpi": 162,
    "mipmap-xhdpi": 216,
    "mipmap-xxhdpi": 324,
    "mipmap-xxxhdpi": 432,
}

SPLASHES = {
    "drawable": (480, 320),
    "drawable-land-hdpi": (800, 480),
    "drawable-land-mdpi": (480, 320),
    "drawable-land-xhdpi": (960, 540),
    "drawable-land-xxhdpi": (1600, 960),
    "drawable-land-xxxhdpi": (1920, 1080),
    "drawable-port-hdpi": (480, 800),
    "drawable-port-mdpi": (480, 320),
    "drawable-port-xhdpi": (720, 1280),
    "drawable-port-xxhdpi": (960, 1600),
    "drawable-port-xxxhdpi": (1280, 1920),
}


def render_splash(w, h, mark_scale=1.0):
    """Centered wheat mark with the brand radial gradient + Hindi tagline bar."""
    s = min(w, h) / 320.0
    # gradient background matching index.html preloader
    px = bytearray(w * h * 4)
    cx, cy = w * 0.5, h * 0.38
    rr = max(w, h) * 0.75
    stops = [(0.0, EMERALD_MID), (0.6, EMERALD_DEEP), (1.0, (3, 20, 14))]
    for y in range(h):
        for x in range(w):
            d = min(1.0, math.hypot(x - cx, y - cy) / rr)
            for i in range(len(stops) - 1):
                o0, c0 = stops[i]
                o1, c1 = stops[i + 1]
                if o0 <= d <= o1:
                    t = (d - o0) / (o1 - o0)
                    col = tuple(int(c0[k] + (c1[k] - c0[k]) * t) for k in range(3))
                    break
            idx = (y * w + x) * 4
            px[idx:idx + 3] = bytes(col)
            px[idx + 3] = 255
    # mark centered, sized relative to the shorter edge
    mark_scale = (min(w, h) / 210.0)
    cx_m, cy_m = w / 2, h / 2 - h * 0.06
    stem, awn_svg = build_wheat_mark(cx_m, cy_m, mark_scale, True, 3.4)
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" '
        f'viewBox="0 0 {w} {h}">'
        + stem
        + awn_svg
        + "</svg>"
    )
    sv = Svg(svg)
    # render mark-only svg (no grad) and alpha-composite
    mark_rgba = sv.render()
    for i in range(0, len(px), 4):
        sa = mark_rgba[i + 3] / 255
        if sa > 0:
            for k in range(3):
                px[i + k] = int(px[i + k] * (1 - sa) + mark_rgba[i + k] * sa)
            px[i + 3] = 255
    return bytes(px)


def main():
    os.makedirs(os.path.join(ROOT, "scripts", "icon-src"), exist_ok=True)
    # master SVG (brand source of truth)
    with open(os.path.join(ROOT, "scripts", "icon-src", "icon.svg"), "w") as f:
        f.write(svg_icon(512))
    print("✓ icon.svg master written")

    # legacy-style full-bleed launcher icons
    for dpi, size in MIPMAPS.items():
        svg = svg_icon(size)
        rgba = Svg(svg).render()
        write_png(os.path.join(RES, dpi, "ic_launcher.png"), size, size, rgba)
        print(f"✓ {dpi}/ic_launcher.png ({size})")

    # adaptive foreground bitmaps (mark on transparent, system masks bg)
    for dpi, size in ADAPTIVE_FG.items():
        vp = 108
        px_per_v = size / vp
        svg = (
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" '
            f'viewBox="0 0 {vp} {vp}">'
            + build_wheat_mark(vp / 2, vp / 2 - 1, 0.60, True, 3.4)[0]
            + build_wheat_mark(vp / 2, vp / 2 - 1, 0.60, True, 3.4)[1]
            + "</svg>"
        )
        rgba = Svg(svg).render()
        write_png(os.path.join(RES, dpi, "ic_launcher_foreground.png"), size, size, rgba)
        print(f"✓ {dpi}/ic_launcher_foreground.png ({size})")

    # splash screens: render at half resolution — Android scales the splash
    # to fill the screen anyway, and this keeps the APK lean.
    for folder, (w, h) in SPLASHES.items():
        rw, rh = max(240, w // 2), max(160, h // 2)
        rgba = render_splash(rw, rh)
        write_png(os.path.join(RES, folder, "splash.png"), rw, rh, rgba)
        print(f"✓ {folder}/splash.png ({rw}x{rh}, displays at {w}x{h})")

    print("\nAll icons + splashes regenerated from scripts/icon-src/icon.svg geometry.")


if __name__ == "__main__":
    main()
