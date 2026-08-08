import { activityColour, signColour } from "../ann/palette";
import { crossPoints, crossRadius } from "../ann/shapes";
import {
  BODY_PATH,
  CROSS,
  NEURON,
  SENSOR_SPOTS,
  STAGE,
  STACK_ORIGIN,
  WHEELS,
  sensorSpot,
} from "../ann/robot-layout";
import { OUTPUT_LIMIT, WEIGHT_LIMIT } from "../ann/network";
import { SENSOR_FULL_SCALE } from "../thymio/sensors";

export default function RobotStage({
  evaluation,
  network,
  focusSensor,
  focusWheel,
  onSelectSensor,
  dimOthers = true,
}) {
  const spot = sensorSpot(focusSensor);
  const neuron = NEURON[focusWheel];
  const weight = network.weights[focusWheel][focusSensor];
  const contribution = evaluation.contributions[focusWheel][focusSensor];
  const bias = network.bias[focusWheel];
  const output = evaluation.outputs[focusWheel];
  const magnitude = Math.min(1, Math.abs(weight) / WEIGHT_LIMIT);

  const stackItems = [
    { key: "bias", value: bias, label: "bias" },
    ...SENSOR_SPOTS.map((s) => ({
      key: s.key,
      value: evaluation.contributions[focusWheel][s.key],
      label: s.key,
      focused: s.key === focusSensor,
    })),
  ].filter((item) => item.key === "bias" || Math.abs(item.value) > 0.5 || item.focused);

  const maxAbs = Math.max(
    40,
    ...stackItems.map((item) => Math.abs(item.value)),
    Math.abs(OUTPUT_LIMIT) * 0.2,
  );

  return (
    <svg
      className="robot-stage"
      viewBox={`0 0 ${STAGE.width} ${STAGE.height}`}
      role="img"
      aria-label="Thymio with neural network inside"
    >
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Soft floor shadow */}
      <ellipse cx="210" cy="492" rx="140" ry="14" fill="rgba(0,0,0,0.08)" />

      {/* Robot body */}
      <path className="robot-body" d={BODY_PATH} />
      <rect className="robot-deck" x="145" y="175" width="130" height="70" rx="10" />
      <circle className="robot-button" cx="210" cy="210" r="18" />

      {/* Wheels */}
      {Object.entries(WHEELS).map(([key, wheel]) => (
        <ellipse
          className={`robot-wheel${focusWheel === key ? " is-focus" : ""}`}
          key={key}
          cx={wheel.cx}
          cy={wheel.cy}
          rx={wheel.rx}
          ry={wheel.ry}
        />
      ))}

      {/* Path from focused sensor through × to neuron to wheel */}
      <path
        className="ann-edge"
        d={`M ${spot.x},${spot.y} L ${CROSS.x},${CROSS.y} L ${neuron.x},${neuron.y}`}
        style={{ stroke: signColour(contribution, 2) }}
      />
      <path
        className="ann-edge"
        d={`M ${neuron.x},${neuron.y} L ${WHEELS[focusWheel].cx},${WHEELS[focusWheel].cy}`}
        style={{ stroke: signColour(output, 5) }}
      />

      <polygon
        className="ann-cross"
        points={crossPoints(CROSS.x, CROSS.y, crossRadius(magnitude))}
        style={{ fill: signColour(weight) }}
      />

      {/* Contribution stack */}
      <g transform={`translate(${STACK_ORIGIN.x - 40}, ${STACK_ORIGIN.y})`}>
        {stackItems.slice(0, 6).map((item, index) => {
          const width = Math.max(4, (Math.abs(item.value) / maxAbs) * 80);
          const dim = dimOthers && item.key !== "bias" && item.key !== focusSensor;
          return (
            <rect
              key={item.key}
              className="stack-bar"
              x={item.value < 0 ? 40 - width : 40}
              y={index * 12}
              width={width}
              height={9}
              style={{
                fill: signColour(item.value),
                opacity: dim ? 0.25 : 0.95,
              }}
            />
          );
        })}
      </g>

      <circle
        className="ann-neuron"
        cx={neuron.x}
        cy={neuron.y}
        r={22 + 14 * Math.min(1, Math.abs(output) / OUTPUT_LIMIT)}
        style={{ fill: signColour(output, 5) }}
      />
      <text className="ann-neuron-value" x={neuron.x} y={neuron.y + 5}>
        {output}
      </text>

      {/* Sensor hotspots */}
      {SENSOR_SPOTS.map((sensor) => {
        const raw = evaluation.inputs[sensor.key] * 1000;
        const ratio = Math.min(1, raw / SENSOR_FULL_SCALE);
        const focused = sensor.key === focusSensor;
        return (
          <g
            key={sensor.key}
            className={`sensor-hotspot${focused ? " is-focus" : ""}`}
            style={{ opacity: dimOthers && !focused ? 0.35 : 1 }}
            onClick={() => onSelectSensor(sensor.key)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") onSelectSensor(sensor.key);
            }}
          >
            <circle
              className="sensor-ring"
              cx={sensor.x}
              cy={sensor.y}
              r={sensor.r + 4}
              style={{ stroke: activityColour(ratio) }}
            />
            <circle
              className="sensor-core"
              cx={sensor.x}
              cy={sensor.y}
              r={sensor.r}
              style={{ fill: activityColour(ratio) }}
              filter={focused ? "url(#glow)" : undefined}
            />
            <title>{sensor.key}</title>
          </g>
        );
      })}
    </svg>
  );
}
