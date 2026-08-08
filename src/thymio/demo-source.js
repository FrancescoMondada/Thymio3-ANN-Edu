import { SENSORS, SENSOR_FULL_SCALE } from "./sensors";

/**
 * Fake sensor readings so the network can be wired up and watched without a
 * robot in reach. A single virtual obstacle circles the robot while its
 * distance breathes in and out; each sensor responds to how close the obstacle
 * is to the direction it looks.
 */
const BEAM_WIDTH_DEGREES = 24;
const SWEEP_SECONDS = 11;
const BREATH_SECONDS = 5.3;

// Only the front sensors are shown, so the obstacle stays in front of the robot
// instead of circling it and leaving the figure idle half the time.
const SWEEP_DEGREES = 70;

function angleDifference(a, b) {
  return Math.abs(((a - b + 540) % 360) - 180);
}

export function simulateSensors(elapsedSeconds) {
  const obstacleAngle =
    SWEEP_DEGREES * Math.sin((2 * Math.PI * elapsedSeconds) / SWEEP_SECONDS);
  const closeness = 0.55 + 0.4 * Math.sin((2 * Math.PI * elapsedSeconds) / BREATH_SECONDS);

  return Object.fromEntries(
    SENSORS.map((sensor) => {
      const offset = angleDifference(sensor.angle, obstacleAngle);
      const response = Math.exp(-(offset * offset) / (2 * BEAM_WIDTH_DEGREES ** 2));
      return [sensor.key, Math.round(SENSOR_FULL_SCALE * closeness * response)];
    }),
  );
}
