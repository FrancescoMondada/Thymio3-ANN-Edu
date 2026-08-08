import { SENSORS } from "../thymio/sensors";

/**
 * Top-down Thymio 3 for the sensors column, facing LEFT so each sensor can
 * sit on a horizontal line with its × in the network column.
 *
 * Round nose on the left, flat back on the right. Buttons on the round half,
 * pen hole in the middle, LEGO studs toward the back — as on the real robot.
 * Facing left, the robot's left side is toward the top of the page, so sensors
 * top→bottom are left … right.
 */
export const MAP = { width: 500, height: 360 };

const CX = 200;
const CY = 178;
const FRONT_R = 92;

/** X of the multiplication-sign column — same SVG as the robot for alignment. */
export const CROSS_X = 430;

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Look direction with the robot facing left (ahead = −x).
 * Positive angle is the robot's right = toward the bottom of the page.
 */
export function lookVector(angleDegrees) {
  const rad = toRadians(angleDegrees);
  return { x: -Math.cos(rad), y: Math.sin(rad) };
}

/** SVG rotation (from +x) so a bar along +x points along lookVector. */
export function barRotation(angleDegrees) {
  return angleDegrees + 180;
}

/**
 * Round nose on the left, flat back on the right.
 */
export const BODY_PATH = [
  `M ${CX},${CY - FRONT_R}`,
  `A ${FRONT_R} ${FRONT_R} 0 0 0 ${CX} ${CY + FRONT_R}`,
  `L ${CX + 82},${CY + FRONT_R}`,
  `L ${CX + 82},${CY - FRONT_R}`,
  "Z",
].join(" ");

export const BACK_X = CX + 82;

export const WHEELS = {
  left: { cx: CX + 74, cy: CY - 54, rx: 34, ry: 13 },
  right: { cx: CX + 74, cy: CY + 54, rx: 34, ry: 13 },
};

export const FEATURES = {
  buttons: { cx: CX - 30, cy: CY, r: 34, inner: 9 },
  pen: { cx: CX + 10, cy: CY, r: 12 },
  studs: [
    { x: CX + 32, y: CY - 50, w: 42, h: 38 },
    { x: CX + 32, y: CY + 12, w: 42, h: 38 },
  ],
};

/**
 * Sensor mounts on the round front arc. Y comes from the real angle so the
 * fan matches the robot; those Y values are reused by the × column.
 */
export const SENSOR_SPOTS = SENSORS.map((sensor, index) => {
  const rad = toRadians(sensor.angle);
  return {
    key: sensor.key,
    index,
    angle: sensor.angle,
    x: CX - FRONT_R * Math.cos(rad),
    y: CY + FRONT_R * Math.sin(rad),
  };
});

export const BAR_LENGTH = 70;
export const BAR_THICKNESS = 15;

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
