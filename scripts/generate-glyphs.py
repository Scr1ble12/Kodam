"""Generate traceable letter shapes from Noto Sans Tamil.

For every letter in src/data/letters.json this script shapes the text with
HarfBuzz (so marks like the pulli dot sit in the right place), extracts the
outline as an SVG path normalised to a 1000x1000 box, and samples a grid of
points that fall inside the outline. The app draws the path as the guide and
uses the sample points to score how well a learner traced it.

Usage:  python3 -m pip install fonttools uharfbuzz
        python3 scripts/generate-glyphs.py
"""

import io
import json
import math
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
FONT = ROOT / "scripts" / "fonts" / "NotoSansTamil-Medium.woff"
LETTERS = ROOT / "src" / "data" / "letters.json"
OUT = ROOT / "src" / "data" / "glyphs.generated.ts"

BOX = 1000  # output viewBox size
FIT = 720  # largest side of the letter inside the box
GRID = 24  # spacing of interior sample points


def load_font():
    tt = TTFont(FONT)
    tt.flavor = None
    buf = io.BytesIO()
    tt.save(buf)
    face = hb.Face(buf.getvalue())
    return hb.Font(face), tt.getGlyphSet(), tt.getGlyphOrder()


def shape(font, text):
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(font, buf)
    return list(zip(buf.glyph_infos, buf.glyph_positions))


def record(font, glyph_set, names, text):
    """Return a pen holding the shaped text's outline in font units."""
    rec = DecomposingRecordingPen(glyph_set)
    x = y = 0
    for info, pos in shape(font, text):
        name = names[info.codepoint]
        pen = TransformPen(rec, (1, 0, 0, 1, x + pos.x_offset, y + pos.y_offset))
        glyph_set[name].draw(pen)
        x += pos.x_advance
        y += pos.y_advance
    return rec


def flatten(rec, steps=12):
    """Turn recorded contours into polylines."""
    contours, cur, start = [], [], None
    last = None
    for op, args in rec.value:
        if op == "moveTo":
            cur = [args[0]]
            start = last = args[0]
        elif op == "lineTo":
            cur.append(args[0])
            last = args[0]
        elif op == "qCurveTo":
            pts = list(args)
            if pts[-1] is None:  # closed contour of off-curve points
                pts = pts[:-1]
            p0 = last
            # Split implied on-curve points between consecutive off-curve points.
            for i, ctrl in enumerate(pts[:-1]):
                end = pts[-1] if i == len(pts) - 2 else (
                    ((ctrl[0] + pts[i + 1][0]) / 2, (ctrl[1] + pts[i + 1][1]) / 2)
                )
                for s in range(1, steps + 1):
                    t = s / steps
                    cur.append((
                        (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * ctrl[0] + t * t * end[0],
                        (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * ctrl[1] + t * t * end[1],
                    ))
                p0 = end
            last = p0
        elif op == "curveTo":
            c1, c2, end = args
            p0 = last
            for s in range(1, steps + 1):
                t = s / steps
                mt = 1 - t
                cur.append((
                    mt**3 * p0[0] + 3 * mt * mt * t * c1[0] + 3 * mt * t * t * c2[0] + t**3 * end[0],
                    mt**3 * p0[1] + 3 * mt * mt * t * c1[1] + 3 * mt * t * t * c2[1] + t**3 * end[1],
                ))
            last = end
        elif op in ("closePath", "endPath"):
            if cur:
                contours.append(cur)
            cur, last = [], start
    if cur:
        contours.append(cur)
    return contours


def winding(px, py, contours):
    wn = 0
    for poly in contours:
        n = len(poly)
        for i in range(n):
            x0, y0 = poly[i]
            x1, y1 = poly[(i + 1) % n]
            if y0 <= py:
                if y1 > py and (x1 - x0) * (py - y0) - (px - x0) * (y1 - y0) > 0:
                    wn += 1
            elif y1 <= py and (x1 - x0) * (py - y0) - (px - x0) * (y1 - y0) < 0:
                wn -= 1
    return wn


def seg_dist(px, py, a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]
    l2 = dx * dx + dy * dy
    t = 0 if l2 == 0 else max(0, min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / l2))
    return math.hypot(px - a[0] - t * dx, py - a[1] - t * dy)


def edge_dist(px, py, contours):
    return min(
        seg_dist(px, py, poly[i], poly[(i + 1) % len(poly)])
        for poly in contours
        for i in range(len(poly))
    )


def main():
    font, glyph_set, names = load_font()
    letters = json.loads(LETTERS.read_text())
    out = {}
    for letter in letters:
        rec = record(font, glyph_set, names, letter["tamil"])
        raw = flatten(rec)
        xs = [p[0] for c in raw for p in c]
        ys = [p[1] for c in raw for p in c]
        minx, maxx, miny, maxy = min(xs), max(xs), min(ys), max(ys)
        scale = FIT / max(maxx - minx, maxy - miny)
        ox = (BOX - (maxx - minx) * scale) / 2 - minx * scale
        oy = (BOX + (maxy - miny) * scale) / 2 + miny * scale
        # Font units are y-up; SVG is y-down.
        transform = (scale, 0, 0, -scale, ox, oy)

        svg = SVGPathPen(None, ntos=lambda v: f"{v:.1f}".rstrip("0").rstrip("."))
        rec.replay(TransformPen(svg, transform))

        contours = [[(x * scale + ox, -y * scale + oy) for x, y in c] for c in raw]
        points, depth = [], 0.0
        for gy in range(GRID // 2, BOX, GRID):
            for gx in range(GRID // 2, BOX, GRID):
                if winding(gx, gy, contours) != 0:
                    points.append((gx, gy))
                    depth = max(depth, edge_dist(gx, gy, contours))
        out[letter["id"]] = {
            "d": svg.getCommands(),
            "points": [v for p in points for v in p],
            "stroke": round(depth * 2),
        }
        print(f"{letter['id']:>4} {letter['tamil']}  points={len(points):4d}  stroke~{depth * 2:.0f}")

    body = json.dumps(out, ensure_ascii=False, separators=(",", ":"))
    OUT.write_text(
        "// Generated by scripts/generate-glyphs.py from Noto Sans Tamil (SIL OFL 1.1). Do not edit.\n"
        "// d: outline path in a 1000x1000 box. points: flat [x, y, ...] samples inside the outline.\n"
        "// stroke: approximate stroke thickness in box units.\n"
        "export type Glyph = { d: string; points: number[]; stroke: number };\n\n"
        f"export const GLYPHS: Record<string, Glyph> = {body};\n"
    )


if __name__ == "__main__":
    main()
