import { SENSORS, SENSOR_FULL_SCALE } from "../thymio/sensors";
import { activityColour, formatSigned, formatSensorReading, formatWeightFactor, signColour } from "../ann/palette";
import { crossPoints, crossRadius } from "../ann/shapes";
import { WEIGHT_LIMIT, CONTRIBUTION_FULL_SCALE, OUTPUT_LIMIT } from "../ann/network";
import { useI18n } from "../i18n/i18n";
import {
  ADD_RADIUS,
  ADD_X,
  ADD_Y,
  BACK_X,
  BAR_LENGTH,
  BAR_THICKNESS,
  BODY_BOTTOM,
  BODY_PATH,
  BODY_TOP,
  CROSS_X,
  FEATURES,
  MAP,
  SENSOR_SPOTS,
  WHEELS,
  barRotation,
  sensorLabelAnchor,
  sensorLabelKey,
} from "../ann/robot-layout";

/**
 * One SVG: left-facing Thymio + distance bars + × column + converging add (+).
 */
function RobotAndWeights({
  network,
  evaluation,
  focusSensor,
  storyWheel,
  onSelectSensor,
}) {
  const { t } = useI18n();
  const { buttons, pen } = FEATURES;

  return (
    <div className="panel sensors-panel">
      <div className="sense-header">
        <h2 className="panel-title">
          {t("panelSensors")} <span className="panel-sub">{t("panelProximity")}</span>
        </h2>
        <div className="sense-ops" aria-hidden="true">
          <span
            className="sense-op sense-op-multiply"
            style={{ left: `${(CROSS_X / MAP.width) * 100}%` }}
            title={t("opMultiply")}
          >
            {t("opMultiplyCol")}
          </span>
          <span
            className="sense-op sense-op-add"
            style={{ left: `${(ADD_X / MAP.width) * 100}%` }}
            title={t("opAdd")}
          >
            {t("opAddCol")}
          </span>
        </div>
      </div>

      <svg
        className="sensor-map"
        viewBox={`0 0 ${MAP.width} ${MAP.height}`}
        role="img"
        aria-label={`${t("panelSensors")}, ${t("opMultiply")}, ${t("opAdd")}`}
      >
        <path className="map-body" d={BODY_PATH} />
        <line
          className="map-back-edge"
          x1={BACK_X}
          y1={BODY_TOP}
          x2={BACK_X}
          y2={BODY_BOTTOM}
        />

        <circle className="map-buttons" cx={buttons.cx} cy={buttons.cy} r={buttons.r} />
        <circle className="map-buttons-inner" cx={buttons.cx} cy={buttons.cy} r={buttons.inner} />
        {[
          [0, -1],
          [1, 0],
          [0, 1],
          [-1, 0],
        ].map(([dx, dy], index) => (
          <circle
            className="map-button-dot"
            key={index}
            cx={buttons.cx + dx * 18}
            cy={buttons.cy + dy * 18}
            r="4"
          />
        ))}

        <circle className="map-pen" cx={pen.cx} cy={pen.cy} r={pen.r} />
        <circle className="map-pen-hole" cx={pen.cx} cy={pen.cy} r={pen.r - 5} />

        {Object.entries(WHEELS).map(([key, wheel]) => (
          <rect
            className="map-wheel"
            key={key}
            x={wheel.x}
            y={wheel.y}
            width={wheel.w}
            height={wheel.h}
            rx={2}
          />
        ))}

        {SENSOR_SPOTS.map((spot) => {
          const focused = spot.key === focusSensor;
          const c = evaluation.contributions[storyWheel][spot.key];
          const f = Math.min(1, Math.abs(c) / CONTRIBUTION_FULL_SCALE);
          return (
            <path
              key={`to-add-${spot.key}`}
              d={`M ${CROSS_X},${spot.y} L ${ADD_X - ADD_RADIUS + 2},${ADD_Y}`}
              fill="none"
              opacity={focused ? 1 : 0.22}
              stroke={focused ? signColour(c, 1) : "#9aa5b1"}
              strokeWidth={focused ? 2.4 + 4 * Math.sqrt(f) : 1.2}
            />
          );
        })}

        {SENSOR_SPOTS.map((spot) => {
          const focused = spot.key === focusSensor;
          const w = network.weights[storyWheel][spot.key];
          const c = evaluation.contributions[storyWheel][spot.key];
          const m = Math.min(1, Math.abs(w) / WEIGHT_LIMIT);
          const f = Math.min(1, Math.abs(c) / CONTRIBUTION_FULL_SCALE);
          return (
            <g key={`edge-${spot.key}`} opacity={focused ? 1 : 0.25}>
              <path
                d={`M ${spot.x},${spot.y} L ${CROSS_X},${spot.y}`}
                fill="none"
                stroke={focused ? signColour(c, 1) : "#9aa5b1"}
                strokeWidth={focused ? 2.4 + 4 * Math.sqrt(f) : 1.3}
              />
              <polygon
                points={crossPoints(CROSS_X, spot.y, focused ? Math.max(12, crossRadius(m) * 1.35) : 9)}
                style={{ fill: focused ? signColour(w) : "#d0d5db" }}
                stroke="#1c2430"
                strokeWidth={focused ? 2.5 : 1.5}
              />
              {focused ? (
                <text
                  className="map-weight-value"
                  x={CROSS_X + 18}
                  y={spot.y - 14}
                  style={{ fill: signColour(w) }}
                >
                  {`× ${formatWeightFactor(w)}`}
                </text>
              ) : null}
            </g>
          );
        })}

        <g className="map-add-node" aria-hidden="true">
          <circle
            cx={ADD_X}
            cy={ADD_Y}
            r={ADD_RADIUS}
            className="map-add-disk"
          />
          <text className="map-add-plus" x={ADD_X} y={ADD_Y + 1} textAnchor="middle" dominantBaseline="central">
            +
          </text>
        </g>

        {SENSOR_SPOTS.map((spot) => {
          const raw = Math.round((evaluation.inputs[spot.key] ?? 0) * 1000);
          const ratio = Math.min(1, raw / SENSOR_FULL_SCALE);
          const active = spot.key === focusSensor;
          const fillLen = BAR_LENGTH * ratio;
          const rot = barRotation(spot.angle);
          const label = sensorLabelAnchor(spot);

          return (
            <g
              key={spot.key}
              className={`map-sensor${active ? " is-active" : ""}`}
              onClick={() => onSelectSensor(spot.key)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") onSelectSensor(spot.key);
              }}
            >
              <g transform={`translate(${spot.x} ${spot.y}) rotate(${rot})`}>
                <rect
                  className="map-bar-plate"
                  x={0}
                  y={-BAR_THICKNESS / 2}
                  width={BAR_LENGTH}
                  height={BAR_THICKNESS}
                  rx={3}
                />
                <rect
                  className="map-bar-fill"
                  x={0}
                  y={-BAR_THICKNESS / 2}
                  width={fillLen}
                  height={BAR_THICKNESS}
                  rx={3}
                  style={{ fill: activityColour(ratio) }}
                />
                <rect
                  className="map-bar-outline"
                  x={0}
                  y={-BAR_THICKNESS / 2}
                  width={BAR_LENGTH}
                  height={BAR_THICKNESS}
                  rx={3}
                />
              </g>

              <circle
                className="map-sensor-node"
                cx={spot.x}
                cy={spot.y}
                r={active ? 9 : 7}
                style={{ fill: activityColour(ratio) }}
              />

              <text
                className="map-sensor-name"
                x={label.nameX}
                y={label.nameY}
                textAnchor={label.anchor}
              >
                {t(sensorLabelKey(spot.key))}
              </text>
              <text
                className="map-sensor-value"
                x={label.valueX}
                y={label.valueY}
                textAnchor={label.anchor}
              >
                {formatSensorReading(raw)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** Wheel order matching the robot drawing (right = top when facing left). */
function wheelStack(focusWheel, storyWheel) {
  if (focusWheel === "both") return ["right", "left"];
  return [storyWheel];
}

/**
 * Term list for one wheel neuron (detail under / beside the graphical +).
 */
function AddCard({ network, evaluation, focusSensor, wheelKey }) {
  const { t } = useI18n();
  const bias = network.bias[wheelKey];
  const total = evaluation.outputs[wheelKey];
  // Same top→bottom order as the × column (robot right at the top when facing left).
  const sensorTerms = [...SENSORS].reverse().map((sensor) => ({
    key: sensor.key,
    label: t(sensorLabelKey(sensor.key)),
    value: evaluation.contributions[wheelKey][sensor.key],
    focused: sensor.key === focusSensor,
  }));
  const terms = [{ key: "bias", label: t("bias"), value: bias, focused: false }, ...sensorTerms];

  return (
    <div className="add-card">
      <div className="add-card-head">
        <span className="add-plus" aria-hidden="true">
          +
        </span>
        <h2 className="panel-title">
          {wheelKey === "left" ? t("wheelLeft") : t("wheelRight")}
        </h2>
      </div>

      <ul className="add-stack">
        {terms.map((term) => {
          const quiet = term.key !== "bias" && !term.focused && Math.abs(term.value) < 1;
          const ratio = Math.min(1, Math.abs(term.value) / OUTPUT_LIMIT);
          const positive = term.value >= 0;
          return (
            <li
              className={`add-term${term.focused ? " is-focus" : ""}${quiet ? " is-quiet" : ""}`}
              key={term.key}
            >
              <span className="add-term-label">{term.label}</span>
              <div className="add-term-track" aria-hidden="true">
                <div
                  className={`add-term-bar${positive ? " is-pos" : " is-neg"}`}
                  style={{
                    width: `${8 + ratio * 92}%`,
                    background: signColour(term.value, 0.5),
                  }}
                />
              </div>
              <span className="add-term-value" style={{ color: signColour(term.value, 0.5) }}>
                {formatSigned(Math.round(term.value))}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="add-sum">
        <span className="add-sum-label">{t("sumTotal")}</span>
        <strong className="add-sum-value" style={{ color: signColour(total, 5) }}>
          {formatSigned(total)}
        </strong>
      </div>
      <p className="add-to-motor">{t("sumToMotor")}</p>
      <p className="add-caption">{t("sumCaption")}</p>
    </div>
  );
}

function MotorsPanel({ evaluation, focusWheel }) {
  const { t } = useI18n();
  const keys = focusWheel === "both" ? ["right", "left"] : focusWheel === "right" ? ["right"] : ["left"];

  return (
    <div className="panel motors-panel">
      <h2 className="panel-title">
        {t("panelMotors")} <span className="panel-sub">{t("panelSpeed")}</span>
      </h2>
      <p className="motors-caption">{t("motorsCaption")}</p>
      {keys.map((key) => {
        const active = focusWheel === "both" || focusWheel === key;
        const value = evaluation.outputs[key];
        return (
          <div className={`motor-readout${active ? " is-active" : ""}`} key={key}>
            <span>{key === "left" ? t("wheelLeft") : t("wheelRight")}</span>
            <strong style={{ color: signColour(value, 5) }}>{formatSigned(value)}</strong>
          </div>
        );
      })}
    </div>
  );
}

export default function NetworkOverview({
  network,
  evaluation,
  focusSensor,
  focusWheel,
  onSelectSensor,
  mode,
  pathControl,
  biasControl,
}) {
  const { t } = useI18n();
  const storyWheel = focusWheel === "both" ? "left" : focusWheel;
  const wheels = wheelStack(focusWheel, storyWheel);

  return (
    <div className={`network-overview mode-${mode}`}>
      <div className="network-sense">
        <RobotAndWeights
          evaluation={evaluation}
          focusSensor={focusSensor}
          network={network}
          onSelectSensor={onSelectSensor}
          storyWheel={storyWheel}
        />
        {mode === "tweak" ? <div className="tweak-under-sense">{pathControl}</div> : null}
      </div>

      <div className="network-add">
        <p className="network-add-label" title={t("opAdd")}>
          {t("opAddCol")}
        </p>
        {wheels.map((wheel) => (
          <AddCard
            evaluation={evaluation}
            focusSensor={focusSensor}
            key={wheel}
            network={network}
            wheelKey={wheel}
          />
        ))}
        {mode === "tweak" ? <div className="tweak-under-add">{biasControl}</div> : null}
      </div>

      <div className="network-motors">
        <MotorsPanel evaluation={evaluation} focusWheel={focusWheel} />
      </div>
    </div>
  );
}
