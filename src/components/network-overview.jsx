import { SENSORS, SENSOR_FULL_SCALE } from "../thymio/sensors";
import { activityColour, formatSigned, signColour } from "../ann/palette";
import { crossPoints, crossRadius } from "../ann/shapes";
import { WEIGHT_LIMIT, CONTRIBUTION_FULL_SCALE } from "../ann/network";
import { useI18n } from "../i18n/i18n";
import {
  BAR_LENGTH,
  BAR_THICKNESS,
  BODY_PATH,
  FRONT_WINDOWS,
  MAP,
  SENSOR_SPOTS,
  WHEELS,
  lookVector,
  sensorLabelKey,
} from "../ann/robot-layout";

/**
 * Top-down Thymio with distance bars pointing the way each sensor looks.
 * Flat front at the top, round back at the bottom — like the real robot.
 */
function SensorMap({ evaluation, focusSensor, onSelectSensor }) {
  const { t } = useI18n();

  return (
    <div className="panel sensors-panel">
      <h2 className="panel-title">
        {t("panelSensors")} <span className="panel-sub">{t("panelProximity")}</span>
      </h2>

      <svg
        className="sensor-map"
        viewBox={`0 0 ${MAP.width} ${MAP.height}`}
        role="img"
        aria-label={t("panelSensors")}
      >
        {/* Soft shadow of the D-body */}
        <ellipse cx="150" cy="372" rx="88" ry="12" fill="rgba(0,0,0,0.08)" />

        <path className="map-body" d={BODY_PATH} />
        {/* Emphasise the flat front edge of the D-shape. */}
        <line className="map-front-edge" x1="58" y1="118" x2="242" y2="118" />

        {FRONT_WINDOWS.map((win, index) => (
          <rect
            className="map-window"
            key={index}
            x={win.x}
            y={win.y}
            width={win.w}
            height={win.h}
            rx="2"
          />
        ))}

        {/* LEGO stud hint + pen hole + button ring — iconic flat-front Thymio */}
        <rect className="map-studs" x="78" y="190" width="52" height="48" rx="4" />
        <rect className="map-studs" x="170" y="190" width="52" height="48" rx="4" />
        <circle className="map-pen" cx="150" cy="168" r="10" />
        <circle className="map-buttons" cx="150" cy="278" r="28" />
        <circle className="map-buttons-inner" cx="150" cy="278" r="8" />

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

        {SENSOR_SPOTS.map((spot) => {
          const raw = Math.round((evaluation.inputs[spot.key] ?? 0) * 1000);
          const ratio = Math.min(1, raw / SENSOR_FULL_SCALE);
          const active = spot.key === focusSensor;
          const dir = lookVector(spot.angle);
          const fillLen = BAR_LENGTH * ratio;
          // Local bar coords: along +x in a rotated frame, then rotate by angle.
          // In look-space, +length is outward; SVG rotate uses degrees clockwise from +x,
          // while our angle is from forward (−y). Convert: svgRot = angle - 90.
          const svgRot = spot.angle - 90;
          const labelOffset = 14 + BAR_THICKNESS / 2;
          const labelX = spot.x + dir.x * (BAR_LENGTH * 0.55) - dir.y * labelOffset * (spot.labelSide === "right" ? -1 : 1);
          const labelY = spot.y + dir.y * (BAR_LENGTH * 0.55) + dir.x * labelOffset * (spot.labelSide === "right" ? -1 : 1);
          const nameY = spot.labelSide === "above" ? spot.y - BAR_LENGTH - 8 : labelY - 6;
          const valueY = spot.labelSide === "above" ? spot.y - BAR_LENGTH + 8 : labelY + 10;
          const nameX = spot.labelSide === "above" ? spot.x : labelX;
          const valueX = nameX;

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
              <g transform={`translate(${spot.x} ${spot.y}) rotate(${svgRot})`}>
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
              <text className="map-sensor-value" x={valueX} y={valueY}>
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

/**
 * SEE overview: sensors map → × on the focused path → sum into the focused wheel → motors.
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
      <SensorMap
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
                  d={`M 8,${y} C 70,${y} 130,${y} 212,180`}
                  fill="none"
                  stroke={focused ? signColour(c, 1) : "#9aa5b1"}
                  strokeWidth={focused ? 2.2 + 4.5 * Math.sqrt(f) : 1.4}
                />
                <polygon
                  points={crossPoints(110, y, focused ? Math.max(12, crossRadius(m) * 1.35) : 9)}
                  style={{ fill: focused ? signColour(w) : "#d0d5db" }}
                  stroke="#1c2430"
                  strokeWidth={focused ? 2.5 : 1.5}
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
