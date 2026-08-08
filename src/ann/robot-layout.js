import { SENSORS } from "../thymio/sensors";

/**
 * Top-down D-shaped Thymio body. Coordinates are SVG user units for viewBox
 * 0 0 420 520. Front of the robot is toward the top of the stage.
 */
export const STAGE = { width: 420, height: 520 };

/** Outer body path: rounded front, flatter rear, room for wheels. */
export const BODY_PATH = [
  "M 70,160",
  "C 70,70 140,28 210,28",
  "C 280,28 350,70 350,160",
  "L 350,400",
  "C 350,440 310,470 210,470",
  "C 110,470 70,440 70,400",
  "Z",
].join(" ");

/** Sensor hotspots on the front arc / sides, matching physical placement. */
export const SENSOR_SPOTS = [
  { key: "left", x: 88, y: 150, r: 22 },
  { key: "frontLeft", x: 138, y: 78, r: 22 },
  { key: "center", x: 210, y: 52, r: 24 },
  { key: "frontRight", x: 282, y: 78, r: 22 },
  { key: "right", x: 332, y: 150, r: 22 },
];

export const WHEELS = {
  left: { cx: 78, cy: 330, rx: 28, ry: 58 },
  right: { cx: 342, cy: 330, rx: 28, ry: 58 },
};

export const NEURON = {
  left: { x: 150, y: 300 },
  right: { x: 270, y: 300 },
};

/** Where the multiplication sign sits inside the body for the focused path. */
export const CROSS = { x: 210, y: 200 };

export const STACK_ORIGIN = { x: 210, y: 250 };

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
