import * as thymio from "thymio3-ts-api";

/** What the robot itself accepts. The network clamps to a lower value. */
export const MOTOR_HARDWARE_LIMIT = 1000;

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

async function sendMotors(left, right) {
  if (typeof thymio.setMotorSpeeds === "function") {
    return thymio.setMotorSpeeds(left, right);
  }
  await thymio.setActuatorState({
    ...NEUTRAL_STATE,
    motorLeft: left,
    motorRight: right,
  });
  return "with-response";
}

/**
 * Coalescing motor writer. Intermediate targets are dropped; only the latest
 * speeds are sent once the previous BLE write finishes.
 */
export function createMotorWriter({ onError, onSent, onMode } = {}) {
  let target = { left: 0, right: 0 };
  let written = null;
  let draining = null;

  async function sendUntilSettled() {
    while (!written || written.left !== target.left || written.right !== target.right) {
      const next = target;
      // Snapshot target at send start; if it changes while in flight, loop again.
      const mode = await sendMotors(next.left, next.right);
      onMode?.(mode);
      written = next;
      onSent?.();
    }
  }

  function drain() {
    if (!draining) {
      draining = sendUntilSettled()
        .catch((error) => {
          written = null;
          onError?.(error);
        })
        .finally(() => {
          draining = null;
          // If a write arrived while we were finishing, drain again.
          if (!written || written.left !== target.left || written.right !== target.right) {
            void drain();
          }
        });
    }
    return draining;
  }

  return {
    write(left, right) {
      target = { left: clampSpeed(left), right: clampSpeed(right) };
      void drain();
    },

    async stop() {
      target = { left: 0, right: 0 };
      try {
        // Wait for any in-flight motor write, then authoritative full stop.
        if (draining) await draining.catch(() => {});
        await thymio.setActuatorState({ ...NEUTRAL_STATE });
        written = target;
        onSent?.();
        onMode?.("with-response");
      } catch (error) {
        written = null;
        onError?.(error);
        throw error;
      }
    },

    forget() {
      target = { left: 0, right: 0 };
      written = null;
    },
  };
}
