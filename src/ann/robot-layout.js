import { SENSORS } from "../thymio/sensors";

/**
 * Top-down Thymio 3 for the sensors column, facing LEFT so each sensor can
 * sit on a horizontal line with its × in the network column.
 *
 * Round nose on the left, flat back on the right. Buttons on the round half;
 * pen hole on the wheel axis. Facing left, the robot's right side is toward
 * the top of the page, so sensors top→bottom are right … left.
 */
export const MAP = { width: 640, height: 440 };

const CX = 210;
const CY = 220;
const FRONT_R = 92;
/** Top-view wheel: length along travel, thickness across. */
export const WHEEL_LEN = 56;
export const WHEEL_THICK = 24;
/** Shared X for the wheel centers and the pen hole (wheel axis). */
const AXLE_X = CX + 78;
/** Body extends past the rear of the wheels so they sit in the robot length. */
const BODY_DEPTH = AXLE_X - CX + WHEEL_LEN / 2 + 18;

/** X of the multiplication-sign column — same SVG as the robot for alignment. */
export const CROSS_X = 455;
/** X of the graphical add (+) node where weighted paths converge. */
export const ADD_X = 575;
export const ADD_Y = CY;
export const ADD_RADIUS = 28;

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Look direction with the robot facing left (ahead = −x).
 * Positive angle is the robot's right = toward the top of the page.
 */
export function lookVector(angleDegrees) {
  const rad = toRadians(angleDegrees);
  return { x: -Math.cos(rad), y: -Math.sin(rad) };
}

/** SVG rotation (from +x) so a bar along +x points along lookVector. */
export function barRotation(angleDegrees) {
  return angleDegrees + 180;
}

/**
 * Round nose on the left, flat back on the right — long enough to enclose the wheels.
 */
export const BODY_PATH = [
  `M ${CX},${CY - FRONT_R}`,
  `A ${FRONT_R} ${FRONT_R} 0 0 0 ${CX} ${CY + FRONT_R}`,
  `L ${CX + BODY_DEPTH},${CY + FRONT_R}`,
  `L ${CX + BODY_DEPTH},${CY - FRONT_R}`,
  "Z",
].join(" ");

export const BACK_X = CX + BODY_DEPTH;
export const BODY_TOP = CY - FRONT_R;
export const BODY_BOTTOM = CY + FRONT_R;

/**
 * Rectangular top-view wheels on the outer edges, fully within the body length.
 * Robot right = top of the page.
 */
export const WHEELS = {
  right: {
    x: AXLE_X - WHEEL_LEN / 2,
    y: CY - FRONT_R - WHEEL_THICK / 2,
    w: WHEEL_LEN,
    h: WHEEL_THICK,
  },
  left: {
    x: AXLE_X - WHEEL_LEN / 2,
    y: CY + FRONT_R - WHEEL_THICK / 2,
    w: WHEEL_LEN,
    h: WHEEL_THICK,
  },
};

export const FEATURES = {
  buttons: { cx: CX - 28, cy: CY, r: 34, inner: 9 },
  pen: { cx: AXLE_X, cy: CY, r: 12 },
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
    y: CY - FRONT_R * Math.sin(rad),
  };
});

export const BAR_LENGTH = 70;
export const BAR_THICKNESS = 15;

/**
 * Labels sit beside the slide tip, cleared sideways. Name and value share the
 * same X and a fixed vertical gap so long labels never run into the reading.
 */
export function sensorLabelAnchor(spot) {
  const dir = lookVector(spot.angle);
  const outward = spot.angle === 0 ? 1 : Math.sign(spot.angle);
  const perp = { x: -dir.y * outward, y: dir.x * outward };
  const along = BAR_LENGTH + 24;
  const side = 36;
  const baseX = spot.x + dir.x * along + perp.x * side;
  const baseY = spot.y + dir.y * along + perp.y * side;
  const gap = 15;
  let anchor = "middle";
  if (Math.abs(perp.x) >= Math.abs(perp.y)) {
    anchor = perp.x >= 0 ? "start" : "end";
  }
  return {
    nameX: baseX,
    nameY: baseY - gap / 2,
    valueX: baseX,
    valueY: baseY + gap / 2,
    anchor,
  };
}

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
