import type { Glyph } from '../data/glyphs.generated';

/** A stroke is a flat list of [x, y, x, y, ...] points in the glyph's 1000x1000 box. */
export type Stroke = number[];

export type TraceResult = {
  /** Share of the letter's shape the learner's ink passed over (0-1). */
  coverage: number;
  /** Share of the learner's ink that stayed on the letter (0-1). */
  accuracy: number;
  stars: 0 | 1 | 2 | 3;
};

/** Stars needed to pass a tracing step and move on to the next one. */
export const PASS_STARS = 2;

const SAMPLE_STEP = 10;
const ON_SHAPE = 46;

/** Spread points evenly along each stroke so fast swipes count as much as slow ones. */
function densify(strokes: Stroke[]): number[] {
  const out: number[] = [];
  for (const s of strokes) {
    if (s.length < 2) continue;
    out.push(s[0], s[1]);
    for (let i = 2; i < s.length; i += 2) {
      const x0 = s[i - 2];
      const y0 = s[i - 1];
      const dx = s[i] - x0;
      const dy = s[i + 1] - y0;
      const n = Math.max(1, Math.ceil(Math.hypot(dx, dy) / SAMPLE_STEP));
      for (let k = 1; k <= n; k++) out.push(x0 + (dx * k) / n, y0 + (dy * k) / n);
    }
  }
  return out;
}

function anyWithin(px: number, py: number, pts: number[], r2: number) {
  for (let i = 0; i < pts.length; i += 2) {
    const dx = pts[i] - px;
    const dy = pts[i + 1] - py;
    if (dx * dx + dy * dy <= r2) return true;
  }
  return false;
}

/**
 * Score a tracing attempt without caring about stroke order: did the ink cover
 * the letter, and did it stay on the letter?
 */
export function scoreTrace(glyph: Glyph, strokes: Stroke[]): TraceResult {
  const ink = densify(strokes);
  if (ink.length === 0) return { coverage: 0, accuracy: 0, stars: 0 };

  // A finger drawn down the middle of a stroke should reach its edges.
  const reach = Math.max(48, glyph.stroke * 0.6);
  const target = glyph.points;
  let covered = 0;
  for (let i = 0; i < target.length; i += 2) {
    if (anyWithin(target[i], target[i + 1], ink, reach * reach)) covered++;
  }
  let onShape = 0;
  for (let i = 0; i < ink.length; i += 2) {
    if (anyWithin(ink[i], ink[i + 1], target, ON_SHAPE * ON_SHAPE)) onShape++;
  }

  const coverage = covered / (target.length / 2);
  const accuracy = onShape / (ink.length / 2);
  const stars =
    coverage >= 0.9 && accuracy >= 0.85 ? 3 : coverage >= 0.8 && accuracy >= 0.75 ? 2 : coverage >= 0.65 && accuracy >= 0.65 ? 1 : 0;
  return { coverage, accuracy, stars };
}
