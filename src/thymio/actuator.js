import * as thymio from "thymio3-ts-api";

/** What the robot itself accepts. The network clamps to a lower value. */
export const MOTOR_HARDWARE_LIMIT = 1000;

// setActuatorState rewrites every actuator at once, so changing the motors means
// sending a complete state. Everything else is held at rest.
const NEUTRAL_STATE = {
  circleLEDs: Array(8).fill(0),
  frontLegoLEDs: Array(8).fill(0),
  rearLegoLEDs: Array(8).fill(0),
  flRGB: { r: 0, g: 0, b: 0 },
  frRGB: { r: 0, g: 0, b: 0 },
  blRGB: { r: 0, g: 0, b: 0 },
  brRGB: { r: 0, g: 0, b: 0 },
  motorLeft: 0,
  motorRight: 0,
  sound: 0,
  smallBottomRGB: { r: 0, g: 0, b: 0 },
  smallBackRGB: { r: 0, g: 0, b: 0 },
  buttonLEDs: Array(4).fill(0),
  receiverLED: 0,
  microphoneLED: false,
};

export function clampSpeed(value) {
  const speed = Number.isFinite(value) ? Math.trunc(value) : 0;
  return Math.min(MOTOR_HARDWARE_LIMIT, Math.max(-MOTOR_HARDWARE_LIMIT, speed));
}

/**
 * Serialises motor writes onto the Bluetooth link. The network produces a new
 * pair of speeds on every sensor frame, which is faster than the link can
 * carry, so intermediate targets are dropped and only the most recent one is
 * sent once the previous write resolves.
 */
export function createMotorWriter({ onError } = {}) {
  let target = { left: 0, right: 0 };
  let written = null;
  let draining = null;

  async function sendUntilSettled() {
    while (!written || written.left !== target.left || written.right !== target.right) {
      const next = target;
      await thymio.setActuatorState({
        ...NEUTRAL_STATE,
        motorLeft: next.left,
        motorRight: next.right,
      });
      written = next;
    }
  }

  function drain() {
    if (!draining) {
      draining = sendUntilSettled()
        .catch((error) => {
          // Forget what was written so the next attempt resends the current
          // target rather than assuming the robot is in sync.
          written = null;
          onError?.(error);
        })
        .finally(() => {
          draining = null;
        });
    }
    return draining;
  }

  return {
    write(left, right) {
      target = { left: clampSpeed(left), right: clampSpeed(right) };
      void drain();
    },

    /** Sends zero speed and resolves once the robot has acknowledged it. */
    async stop() {
      target = { left: 0, right: 0 };
      await drain();
    },

    /** Drops all state after a disconnect, when writing is no longer possible. */
    forget() {
      target = { left: 0, right: 0 };
      written = null;
    },
  };
}
