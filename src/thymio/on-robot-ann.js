import * as thymio from "thymio3-ts-api";
import { INPUT_DIVISOR, OUTPUT_LIMIT } from "../ann/network";
import { SENSOR_FULL_SCALE, SENSOR_KEYS } from "./sensors";

/** Firmware rejects scripts larger than this (BLE notify code 4). */
export const PYTHON_SCRIPT_LIMIT = 2000;

/**
 * Bake the current network into a compact MicroPython control loop that runs
 * entirely on the robot (~50 Hz). Weights are literals — change them by
 * re-uploading the script (no stdin on Thymio 3 BLE).
 */
export function buildAnnScript(network) {
  const wl = SENSOR_KEYS.map((key) => Math.round(network.weights.left[key] || 0));
  const wr = SENSOR_KEYS.map((key) => Math.round(network.weights.right[key] || 0));
  const bl = Math.round(network.bias.left || 0);
  const br = Math.round(network.bias.right || 0);
  const act = network.activation === "tanh" ? 1 : 0;

  // Keep this under PYTHON_SCRIPT_LIMIT. Prints "H <hz>" every ~1s for the UI.
  const script = `import thymio,time,math
m=thymio.MOTORS()
P=[thymio.PROXIMITY(i)for i in range(5)]
BL,BR=${bl},${br}
WL=${JSON.stringify(wl)}
WR=${JSON.stringify(wr)}
D,F,L=${INPUT_DIVISOR},${SENSOR_FULL_SCALE},${OUTPUT_LIMIT}
A=${act}
n=0;t0=time.ticks_ms()
while 1:
 x=[min(F,max(0,P[i].value()))/D for i in range(5)]
 sl=BL;sr=BR
 for i in range(5):
  sl+=WL[i]*x[i];sr+=WR[i]*x[i]
 if A:
  lo=int(L*math.tanh(sl/L));ro=int(L*math.tanh(sr/L))
 else:
  lo=int(max(-L,min(L,sl)));ro=int(max(-L,min(L,sr)))
 m.set_speed(lo,ro)
 n+=1
 if n>=40:
  dt=time.ticks_diff(time.ticks_ms(),t0)or 1
  print("H",n*1000//dt)
  n=0;t0=time.ticks_ms()
 time.sleep_ms(20)
`;

  if (new TextEncoder().encode(script).length > PYTHON_SCRIPT_LIMIT) {
    throw new Error(`On-robot script exceeds ${PYTHON_SCRIPT_LIMIT} bytes`);
  }
  return script;
}

async function stopQuietly() {
  try {
    await thymio.stopScriptExecution();
  } catch {
    // nothing running
  }
}

/**
 * Stop any previous script, upload the ANN loop, and start it.
 */
export async function deployOnRobotAnn(network) {
  const script = buildAnnScript(network);
  await stopQuietly();
  // Brief pause so the interpreter releases motors before the new loop.
  await new Promise((resolve) => setTimeout(resolve, 80));
  await thymio.sendPythonScript(script);
  await thymio.executeLoadedScript();
}

/**
 * Stop the on-robot loop and zero the motors over BLE once.
 */
export async function stopOnRobotAnn({ zeroMotors } = {}) {
  await stopQuietly();
  if (zeroMotors) {
    try {
      await zeroMotors();
    } catch {
      // link may be gone
    }
  }
}

/** Parse stdout lines like "H 48" into a loop rate. */
export function parseRobotHz(chunk) {
  const text = String(chunk ?? "");
  const match = text.match(/H\s+(\d+)/);
  return match ? Number(match[1]) : null;
}
