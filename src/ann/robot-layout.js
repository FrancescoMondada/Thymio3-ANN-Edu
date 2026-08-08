import { SENSORS } from "../thymio/sensors";

/**
 * Top-down Thymio 3 geometry for the sensors map.
 * Flat front at the top, semicircular rear at the bottom — matching the
 * physical robot (pen hole near the front, buttons on the round back).
 */
export const MAP = { width: 300, height: 400 };

const CX = 150;
const FRONT_Y = 118;
const SIDE_X = 58;
const BODY_RIGHT = 242;

/** Flat-front D-body: straight front edge, parallel sides, semicircular rear. */
export const BODY_PATH = [
  `M ${SIDE_X},${FRONT_Y}`,
  `L ${BODY_RIGHT},${FRONT_Y}`,
  `L ${BODY_RIGHT},205`,
  `C ${BODY_RIGHT},285 ${CX + 78},345 ${CX},345`,
  `C ${CX - 78},345 ${SIDE_X},285 ${SIDE_X},205`,
  "Z",
].join(" ");

/** Dark sensor windows along the flat front face (decorative, under the bars). */
export const FRONT_WINDOWS = [
  { x: 78, y: FRONT_Y - 2, w: 18, h: 8 },
  { x: 118, y: FRONT_Y - 2, w: 18, h: 8 },
  { x: 150 - 9, y: FRONT_Y - 2, w: 18, h: 8 },
  { x: 164, y: FRONT_Y - 2, w: 18, h: 8 },
  { x: 204, y: FRONT_Y - 2, w: 18, h: 8 },
];

export const WHEELS = {
  left: { cx: 52, cy: 228, rx: 14, ry: 34 },
  right: { cx: 248, cy: 228, rx: 14, ry: 34 },
};

/**
 * Sensor mounts on the flat front and front corners.
 * `angle` matches SENSORS (0 = straight ahead = toward top of the SVG).
 * Bars grow outward from the body along that angle.
 */
export const SENSOR_SPOTS = [
  { key: "left", x: 68, y: 148, angle: -48, labelSide: "left" },
  { key: "frontLeft", x: 100, y: 122, angle: -24, labelSide: "left" },
  { key: "center", x: 150, y: 112, angle: 0, labelSide: "above" },
  { key: "frontRight", x: 200, y: 122, angle: 24, labelSide: "right" },
  { key: "right", x: 232, y: 148, angle: 48, labelSide: "right" },
];

/** Length of a full-scale distance bar, in SVG units. */
export const BAR_LENGTH = 78;
export const BAR_THICKNESS = 18;

export function sensorSpot(key) {
  return SENSOR_SPOTS.find((spot) => spot.key === key) ?? SENSOR_SPOTS[2];
}

export function sensorLabelKey(key) {
  const map = {
    left: "sensorLeft",
    frontLeft: "sensorFrontLeft",
    center: "sensorCenter",
    frontRight: "sensorFrontRight",
    right: "sensorRight",
  };
  return map[key] ?? key;
}

/** Prefer the brightest sensor; keep the current focus if tied or quiet. */
export function autoFocusSensor(values, currentKey) {
  let bestKey = currentKey ?? "center";
  let best = -1;

  for (const sensor of SENSORS) {
    const value = values[sensor.key] ?? 0;
    if (value > best) {
      best = value;
      bestKey = sensor.key;
    }
  }

  if (best < 80 && currentKey) return currentKey;
  return bestKey;
}

export function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

/** Unit vector for a sensor look direction (SVG: +x right, +y down). */
export function lookVector(angleDegrees) {
  const rad = toRadians(angleDegrees);
  // 0° = straight ahead = toward the top of the page (−y).
  return { x: Math.sin(rad), y: -Math.cos(rad) };
}
