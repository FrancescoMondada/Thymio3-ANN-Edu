import { SENSOR_FULL_SCALE, SENSOR_KEYS } from "../thymio/sensors";

/**
 * A single-layer network: the five front proximity sensors feed two output
 * neurons, one per wheel, and every neuron has a bias.
 *
 *   sum_m    = bias_m + Σ_s weight[m][s] · input_s
 *   output_m = activation(sum_m)
 *
 * Inputs are raw sensor counts divided by INPUT_DIVISOR, so a sensor reading
 * SENSOR_FULL_SCALE arrives at the neuron as 4.5 rather than 4500. That keeps
 * weights in a range people can dial in by hand: a weight of 100 on a sensor
 * that is fully lit contributes about 450 to the wheel speed.
 */
export const OUTPUTS = [
  { key: "left", label: "left wheel" },
  { key: "right", label: "right wheel" },
];

export const INPUT_DIVISOR = 1000;

export const WEIGHT_LIMIT = 200;
export const WEIGHT_STEP = 1;
export const BIAS_LIMIT = 500;
export const BIAS_STEP = 5;

/** Wheel speeds are clamped here. The robot itself accepts ±1000. */
export const OUTPUT_LIMIT = 500;

export const ACTIVATIONS = [
  { key: "clamped", label: "Clamped linear" },
  { key: "tanh", label: "tanh (soft saturation)" },
];

export function zeroNetwork() {
  return {
    activation: "clamped",
    bias: { left: 0, right: 0 },
    weights: {
      left: Object.fromEntries(SENSOR_KEYS.map((key) => [key, 0])),
      right: Object.fromEntries(SENSOR_KEYS.map((key) => [key, 0])),
    },
  };
}

function makeNetwork(bias, rows, activation = "clamped") {
  return {
    activation,
    bias: { ...bias },
    weights: {
      left: Object.fromEntries(SENSOR_KEYS.map((key, index) => [key, rows.left[index]])),
      right: Object.fromEntries(SENSOR_KEYS.map((key, index) => [key, rows.right[index]])),
    },
  };
}

/** Weight rows below are in sensor order: left, left-c, center, right-c, right. */
export const PRESETS = [
  {
    key: "rest",
    label: "At rest (all zero)",
    build: zeroNetwork,
  },
  {
    key: "forward",
    label: "Straight ahead (bias only)",
    build: () =>
      makeNetwork({ left: 200, right: 200 }, {
        left: [0, 0, 0, 0, 0],
        right: [0, 0, 0, 0, 0],
      }),
  },
  {
    key: "avoid",
    label: "Obstacle avoidance",
    build: () =>
      // An obstacle on one side speeds up the wheel on that side and slows the
      // other, so the robot turns away from it. The centre sensor pushes both
      // wheels back.
      makeNetwork({ left: 200, right: 200 }, {
        left: [60, 45, -70, -50, -60],
        right: [-60, -50, -70, 45, 60],
      }),
  },
  {
    key: "follow",
    label: "Follow an object",
    build: () =>
      // Cross-wired the other way round: the robot steers towards whatever it
      // sees and stands still when it sees nothing.
      makeNetwork({ left: 0, right: 0 }, {
        left: [25, 45, 70, 60, 80],
        right: [80, 60, 70, 45, 25],
      }),
  },
  {
    key: "shy",
    label: "Back away",
    build: () =>
      makeNetwork({ left: 0, right: 0 }, {
        left: [-60, -70, -80, -70, -60],
        right: [-60, -70, -80, -70, -60],
      }),
  },
];

export function presetByKey(key) {
  return PRESETS.find((preset) => preset.key === key) ?? PRESETS[0];
}

export function clamp(value, limit) {
  return Math.min(limit, Math.max(-limit, value));
}

function activate(sum, activation) {
  if (activation === "tanh") return OUTPUT_LIMIT * Math.tanh(sum / OUTPUT_LIMIT);
  return clamp(sum, OUTPUT_LIMIT);
}

/**
 * Runs the network over one set of sensor readings and returns every
 * intermediate value the diagram needs to show.
 */
export function evaluate(network, sensorValues) {
  const inputs = {};
  for (const key of SENSOR_KEYS) {
    const raw = Number.isFinite(sensorValues?.[key]) ? sensorValues[key] : 0;
    inputs[key] = Math.min(SENSOR_FULL_SCALE, Math.max(0, raw)) / INPUT_DIVISOR;
  }

  const contributions = {};
  const sums = {};
  const outputs = {};

  for (const output of OUTPUTS) {
    const row = network.weights[output.key];
    const perSensor = {};
    let sum = network.bias[output.key];

    for (const key of SENSOR_KEYS) {
      const contribution = row[key] * inputs[key];
      perSensor[key] = contribution;
      sum += contribution;
    }

    contributions[output.key] = perSensor;
    sums[output.key] = sum;
    outputs[output.key] = Math.round(activate(sum, network.activation));
  }

  return { inputs, contributions, sums, outputs };
}

/** Largest contribution a single connection can make, used to scale the edges. */
export const CONTRIBUTION_FULL_SCALE = (WEIGHT_LIMIT * SENSOR_FULL_SCALE) / INPUT_DIVISOR;

const STORAGE_KEY = "thymio3-ann-edu.network.v1";

export function loadNetwork() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (!stored?.weights?.left || !stored?.weights?.right || !stored?.bias) return null;

    // Merge onto a zero network so a stored file from an older sensor list
    // cannot leave holes.
    const network = zeroNetwork();
    network.activation = ACTIVATIONS.some((item) => item.key === stored.activation)
      ? stored.activation
      : "clamped";

    for (const output of OUTPUTS) {
      network.bias[output.key] = clamp(Number(stored.bias[output.key]) || 0, BIAS_LIMIT);
      for (const key of SENSOR_KEYS) {
        network.weights[output.key][key] = clamp(
          Number(stored.weights[output.key]?.[key]) || 0,
          WEIGHT_LIMIT,
        );
      }
    }

    return network;
  } catch {
    return null;
  }
}

export function saveNetwork(network) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(network));
  } catch {
    // Private browsing or a full quota: the network just will not be restored.
  }
}
