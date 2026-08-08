import { SENSORS, SENSOR_FULL_SCALE } from "../thymio/sensors";
import { activityColour, formatSigned, signColour } from "../ann/palette";
import { crossPoints, crossRadius } from "../ann/shapes";
import { WEIGHT_LIMIT, CONTRIBUTION_FULL_SCALE } from "../ann/network";
import { useI18n } from "../i18n/i18n";
import {
  BACK_X,
  BAR_LENGTH,
  BAR_THICKNESS,
  BODY_PATH,
  CROSS_X,
  FEATURES,
  MAP,
  SENSOR_SPOTS,
  WHEELS,
  barRotation,
  lookVector,
  sensorLabelKey,
} from "../ann/robot-layout";

/**
 * One SVG: left-facing Thymio + distance bars + × column on shared Y.
 */
function RobotAndWeights({
  network,
  evaluation,
  focusSensor,
  storyWheel,
  onSelectSensor,
}) {
  const { t } = useI18n();
  const { buttons, pen, studs } = FEATURES;

  return (
    <div className="panel sensors-panel">
      <h2 className="panel-title">
        {t("panelSensors")} <span className="panel-sub">{t("panelProximity")}</span>
        <span className="panel-title-right">{t("opMultiply")}</span>
      </h2>

      <svg
        className="sensor-map"
        viewBox={`0 0 ${MAP.width} ${MAP.height}`}
        role="img"
        aria-label={t("panelSensors")}
      >
        <ellipse cx="210" cy="348" rx="100" ry="10" fill="rgba(0,0,0,0.07)" />

        <path className="map-body" d={BODY_PATH} />
        <line className="map-back-edge" x1={BACK_X} y1="86" x2={BACK_X} y2="270" />

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

        {studs.map((pad, index) => (
          <g key={index}>
            <rect className="map-studs" x={pad.x} y={pad.y} width={pad.w} height={pad.h} rx="3" />
            {Array.from({ length: 12 }, (_, i) => {
              const col = i % 4;
              const row = Math.floor(i / 4);
              return (
                <circle
                  className="map-stud"
                  key={i}
                  cx={pad.x + 7 + col * 9}
                  cy={pad.y + 8 + row * 10}
                  r="2.2"
                />
              );
            })}
          </g>
        ))}

        {Object.entries(WHEELS).map(([key, wheel]) => (
          <ellipse
            className="map-wheel"
            key={key}
            cx={wheel.cx}
            cy={wheel.cy}
            rx={wheel.rx}
            ry={wheel.ry}
          />
        ))}

        {/* Edges + crosses first (under nodes), then bars and labels */}
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
            </g>
          );
        })}

        {SENSOR_SPOTS.map((spot) => {
          const raw = Math.round((evaluation.inputs[spot.key] ?? 0) * 1000);
          const ratio = Math.min(1, raw / SENSOR_FULL_SCALE);
          const active = spot.key === focusSensor;
          const dir = lookVector(spot.angle);
          const fillLen = BAR_LENGTH * ratio;
          const rot = barRotation(spot.angle);
          const labelSide = spot.angle <= 0 ? -1 : 1;
          const midX = spot.x + dir.x * (BAR_LENGTH * 0.55);
          const midY = spot.y + dir.y * (BAR_LENGTH * 0.55);
          const nameX = midX;
          const nameY = midY + labelSide * 20;
          const valueY = nameY + labelSide * 12;

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

              <text className="map-sensor-name" x={nameX} y={nameY}>
                {t(sensorLabelKey(spot.key))}
              </text>
              <text className="map-sensor-value" x={nameX} y={valueY}>
                {raw}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function ContributionCard({ network, evaluation, focusSensor, wheelKey }) {
  const { t } = useI18n();
  const bias = network.bias[wheelKey];
  const rows = [
    { key: "bias", label: t("bias"), value: bias },
    ...SENSORS.map((sensor) => ({
      key: sensor.key,
      label: t(sensorLabelKey(sensor.key)),
      value: evaluation.contributions[wheelKey][sensor.key],
      focused: sensor.key === focusSensor,
    })),
  ];

  return (
    <div className="contribution-card">
      <h2 className="panel-title">
        {wheelKey === "left" ? t("wheelLeft") : t("wheelRight")}{" "}
        <span className="panel-sub">{t("panelContributions")}</span>
      </h2>
      <ul className="contribution-list">
        {rows.map((row) => {
          const focused = row.key === "bias" ? false : row.focused;
          const quiet = row.key !== "bias" && !focused && Math.abs(row.value) < 1;
          return (
            <li
              className={`contribution-row${focused ? " is-focus" : ""}${quiet ? " is-quiet" : ""}`}
              key={row.key}
              style={{ color: signColour(row.value, 0.5) }}
            >
              <span>{row.label}</span>
              <span className="contribution-value">{formatSigned(Math.round(row.value))}</span>
            </li>
          );
        })}
      </ul>
      <div className="contribution-total">
        <span>{t("sumTotal")}</span>
        <strong style={{ color: signColour(evaluation.outputs[wheelKey], 5) }}>
          {formatSigned(evaluation.outputs[wheelKey])}
        </strong>
      </div>
      <p className="contribution-caption">{t("sumCaption")}</p>
    </div>
  );
}

function MotorsPanel({ evaluation, focusWheel }) {
  const { t } = useI18n();

  return (
    <div className="panel motors-panel">
      <h2 className="panel-title">
        {t("panelMotors")} <span className="panel-sub">{t("panelSpeed")}</span>
      </h2>
      {["left", "right"].map((key) => {
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
}) {
  const { t } = useI18n();
  const storyWheel = focusWheel === "both" ? "left" : focusWheel;

  return (
    <div className={`network-overview mode-${mode}`}>
      <RobotAndWeights
        evaluation={evaluation}
        focusSensor={focusSensor}
        network={network}
        onSelectSensor={onSelectSensor}
        storyWheel={storyWheel}
      />

      <div className="network-side">
        <div className="neuron-column">
          {(focusWheel === "both" ? ["left", "right"] : [storyWheel]).map((wheel) => (
            <ContributionCard
              evaluation={evaluation}
              focusSensor={focusSensor}
              key={wheel}
              network={network}
              wheelKey={wheel}
            />
          ))}
          <p className="op-caption">{t("opAdd")}</p>
        </div>

        <div className="network-right">
          <MotorsPanel evaluation={evaluation} focusWheel={focusWheel} />
          {mode === "tweak" ? pathControl : null}
        </div>
      </div>
    </div>
  );
}
