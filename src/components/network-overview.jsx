import { SENSORS, SENSOR_FULL_SCALE } from "../thymio/sensors";
import { activityColour, formatSigned, signColour } from "../ann/palette";
import { crossPoints, crossRadius } from "../ann/shapes";
import { WEIGHT_LIMIT, CONTRIBUTION_FULL_SCALE } from "../ann/network";
import { useI18n } from "../i18n/i18n";
import { sensorLabelKey } from "../ann/robot-layout";

/** Tiny top-down Thymio with one sensor lit — used in the sensors column. */
function MiniRobot({ activeKey }) {
  const spots = [
    { key: "left", x: 18, y: 38 },
    { key: "frontLeft", x: 32, y: 18 },
    { key: "center", x: 50, y: 12 },
    { key: "frontRight", x: 68, y: 18 },
    { key: "right", x: 82, y: 38 },
  ];

  return (
    <svg className="mini-robot" viewBox="0 0 100 90" aria-hidden="true">
      <path
        d="M22,40 C22,18 38,8 50,8 C62,8 78,18 78,40 L78,72 C78,80 66,84 50,84 C34,84 22,80 22,72 Z"
        fill="#f4f7f8"
        stroke="#1c2430"
        strokeWidth="2"
      />
      <ellipse cx="20" cy="58" rx="7" ry="14" fill="#b8c2c8" stroke="#1c2430" strokeWidth="1.5" />
      <ellipse cx="80" cy="58" rx="7" ry="14" fill="#b8c2c8" stroke="#1c2430" strokeWidth="1.5" />
      {spots.map((spot) => {
        const active = spot.key === activeKey;
        return (
          <g key={spot.key}>
            {active ? (
              <line
                x1={spot.x}
                y1={spot.y}
                x2={spot.x + (spot.x - 50) * 0.35}
                y2={spot.y - 14}
                stroke="#c85a1e"
                strokeDasharray="3 2"
                strokeWidth="1.5"
              />
            ) : null}
            <circle
              cx={spot.x}
              cy={spot.y}
              r={active ? 5 : 3.5}
              fill={active ? "#c85a1e" : "#9aa5b1"}
              stroke="#1c2430"
              strokeWidth="1"
            />
          </g>
        );
      })}
    </svg>
  );
}

function SensorBars({ evaluation, focusSensor, onSelectSensor }) {
  const { t } = useI18n();

  return (
    <div className="panel sensors-panel">
      <h2 className="panel-title">
        {t("panelSensors")} <span className="panel-sub">{t("panelProximity")}</span>
      </h2>
      <ul className="sensor-bar-list">
        {SENSORS.map((sensor) => {
          const raw = Math.round((evaluation.inputs[sensor.key] ?? 0) * 1000);
          const ratio = Math.min(1, raw / SENSOR_FULL_SCALE);
          const active = sensor.key === focusSensor;

          return (
            <li key={sensor.key}>
              <button
                className={`sensor-bar-row${active ? " is-active" : ""}`}
                onClick={() => onSelectSensor(sensor.key)}
                type="button"
              >
                <span className="sensor-bar-name">{t(sensorLabelKey(sensor.key))}</span>
                <span className="sensor-bar-track">
                  <span
                    className="sensor-bar-fill"
                    style={{ width: `${ratio * 100}%`, background: activityColour(ratio) }}
                  />
                </span>
                <span className="sensor-bar-value">{raw}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <MiniRobot activeKey={focusSensor} />
      <img alt="" className="sensors-photo" src="/T3-rendering.jpg" />
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

/**
 * SEE overview: sensors → × on the focused path → sum into the focused wheel → motors.
 * Activation/clamp is applied but not shown as its own step.
 */
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
      <SensorBars
        evaluation={evaluation}
        focusSensor={focusSensor}
        onSelectSensor={onSelectSensor}
      />

      <div className="network-mid">
        <svg className="network-edges" viewBox="0 0 220 360" preserveAspectRatio="xMidYMid meet">
          <text x="110" y="18" textAnchor="middle" className="edge-caption">
            {t("opMultiply")}
          </text>
          {SENSORS.map((sensor, index) => {
            const y = 48 + index * 58;
            const focused = sensor.key === focusSensor;
            const w = network.weights[storyWheel][sensor.key];
            const c = evaluation.contributions[storyWheel][sensor.key];
            const m = Math.min(1, Math.abs(w) / WEIGHT_LIMIT);
            const f = Math.min(1, Math.abs(c) / CONTRIBUTION_FULL_SCALE);
            return (
              <g key={sensor.key} opacity={focused ? 1 : 0.28}>
                <path
                  d={`M 8,${y} C 70,${y} 130,${y} 212,${180}`}
                  fill="none"
                  stroke={focused ? signColour(c, 1) : "#9aa5b1"}
                  strokeWidth={focused ? 2.2 + 4.5 * Math.sqrt(f) : 1.4}
                />
                <polygon
                  points={crossPoints(110, y, focused ? crossRadius(m) : 7)}
                  style={{ fill: focused ? signColour(w) : "#c5ccd3" }}
                  stroke="#1c2430"
                  strokeWidth={focused ? 2.2 : 1.2}
                />
              </g>
            );
          })}
        </svg>

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
      </div>

      <div className="network-right">
        <MotorsPanel evaluation={evaluation} focusWheel={focusWheel} />
        {mode === "tweak" ? pathControl : null}
      </div>
    </div>
  );
}
