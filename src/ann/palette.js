/**
 * The colours of the mock-up: sensor activity runs green → yellow → red, and
 * network parameters are orange when they excite and blue when they inhibit.
 */
const ACTIVITY_STOPS = [
  // Nothing detected should look empty rather than vividly green, so the scale
  // starts pale and reaches the mock-up's green as soon as a sensor responds.
  { at: 0, rgb: [206, 230, 199] },
  { at: 0.08, rgb: [53, 179, 74] },
  { at: 0.22, rgb: [156, 203, 42] },
  { at: 0.35, rgb: [216, 213, 32] },
  { at: 0.5, rgb: [219, 165, 31] },
  { at: 0.72, rgb: [232, 96, 28] },
  { at: 1, rgb: [222, 34, 34] },
];

export const POSITIVE = "#c85a1e";
export const NEGATIVE = "#3a5ea8";
export const NEUTRAL = "#8b8f99";

function mix(from, to, t) {
  return from.map((channel, index) => Math.round(channel + (to[index] - channel) * t));
}

/** `ratio` is 0…1; anything outside is clamped. */
export function activityColour(ratio) {
  const t = Math.min(1, Math.max(0, Number.isFinite(ratio) ? ratio : 0));

  for (let index = 1; index < ACTIVITY_STOPS.length; index += 1) {
    const previous = ACTIVITY_STOPS[index - 1];
    const next = ACTIVITY_STOPS[index];
    if (t <= next.at) {
      const span = next.at - previous.at;
      const [r, g, b] = mix(previous.rgb, next.rgb, span === 0 ? 0 : (t - previous.at) / span);
      return `rgb(${r} ${g} ${b})`;
    }
  }

  const [r, g, b] = ACTIVITY_STOPS.at(-1).rgb;
  return `rgb(${r} ${g} ${b})`;
}

export function signColour(value, deadZone = 0) {
  if (value > deadZone) return POSITIVE;
  if (value < -deadZone) return NEGATIVE;
  return NEUTRAL;
}

export function formatSigned(value) {
  const rounded = Math.round(value);
  return rounded > 0 ? `+${rounded}` : `${rounded}`;
}

/**
 * Classroom display scales so kids can multiply by hand:
 *   (sensor / 100) × (weight / 10) = sensor × weight / 1000
 * which matches the real network (inputs are raw / 1000).
 */
export function formatSensorReading(raw) {
  return (Number(raw) / 100).toFixed(1);
}

export function formatWeightFactor(weight) {
  const v = Number(weight) / 10;
  const text = Math.abs(v).toFixed(1);
  if (v > 0) return `+${text}`;
  if (v < 0) return `-${text}`;
  return text;
}

