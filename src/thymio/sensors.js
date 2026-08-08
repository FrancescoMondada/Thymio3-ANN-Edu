/**
 * The five front proximity sensors, left to right. `key` matches the
 * `proximitySensors` field of the robot's main sensor stream. The two rear
 * sensors the robot also reports are left out: they say little about where the
 * robot is heading and only crowded the figure.
 *
 * `angle` is where the sensor looks, in degrees, with 0 straight ahead and
 * positive to the right. The figure is laid out from these angles, so the fan
 * of bars matches how the sensors sit on the robot.
 */
export const SENSORS = [
  { key: "left", label: "left", angle: -40 },
  { key: "frontLeft", label: "left-c", angle: -20 },
  { key: "center", label: "center", angle: 0 },
  { key: "frontRight", label: "right-c", angle: 20 },
  { key: "right", label: "right", angle: 40 },
];

export const SENSOR_KEYS = SENSORS.map((sensor) => sensor.key);

/**
 * Raw readings are unsigned counts that grow as an obstacle gets closer. This
 * is the reading that fills a bar completely and that counts as an input of
 * 1.0 before scaling; lower it if realistic obstacles barely move the bars.
 */
export const SENSOR_FULL_SCALE = 4500;

export const ZERO_SENSORS = Object.fromEntries(SENSOR_KEYS.map((key) => [key, 0]));

export function readSensors(source) {
  if (!source) return ZERO_SENSORS;
  return Object.fromEntries(
    SENSOR_KEYS.map((key) => [key, Number.isFinite(source[key]) ? source[key] : 0]),
  );
}
