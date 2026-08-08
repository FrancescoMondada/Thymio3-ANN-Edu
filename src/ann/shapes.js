/**
 * A multiplication sign: a plus turned through 45°, drawn as one polygon so it
 * can be filled and outlined like the other nodes in the figure.
 */
export function crossPoints(cx, cy, r) {
  const t = r * 0.38;
  const arms = [
    [t, t],
    [t, r],
    [-t, r],
    [-t, t],
    [-r, t],
    [-r, -t],
    [-t, -t],
    [-t, -r],
    [t, -r],
    [t, -t],
    [r, -t],
    [r, t],
  ];

  const k = Math.SQRT1_2;

  return arms
    .map(([x, y]) => `${(cx + (x - y) * k).toFixed(2)},${(cy + (x + y) * k).toFixed(2)}`)
    .join(" ");
}

/** A weight of zero still needs to be visible, hence the floor. */
export function crossRadius(ratio) {
  const clamped = Math.min(1, Math.max(0, ratio));
  return 6 + 7.5 * Math.sqrt(clamped);
}
