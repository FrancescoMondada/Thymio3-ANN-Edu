import { useI18n } from "../i18n/i18n";
import { WEIGHT_LIMIT, clamp } from "../ann/network";
import { formatWeightFactor, signColour } from "../ann/palette";
import { crossPoints, crossRadius } from "../ann/shapes";
import { sensorLabelKey } from "../ann/robot-layout";

/**
 * Kid pull/push (backward/forward) control for one sensor→wheel weight.
 */
export default function PathControl({ sensorKey, wheelKey, weight, onChange }) {
  const { t } = useI18n();
  const value = clamp(Math.round(weight), WEIGHT_LIMIT);
  const colour = signColour(value);
  const wheelLabel = wheelKey === "left" ? "L" : "R";

  return (
    <div className="path-control">
      <div className="path-control-head">
        <svg aria-hidden="true" height="36" width="36">
          <polygon
            points={crossPoints(18, 18, crossRadius(Math.min(1, Math.abs(value) / WEIGHT_LIMIT)))}
            style={{ fill: colour }}
          />
        </svg>
        <div>
          <p className="path-control-title">
            {t(sensorLabelKey(sensorKey))} → {wheelLabel}
          </p>
          <p className="path-control-value" style={{ color: colour }}>
            {formatWeightFactor(value)}
          </p>
        </div>
      </div>

      <div className="path-slider-row">
        <span className="path-end backward">{t("backward")}</span>
        <input
          aria-label={`${t(sensorLabelKey(sensorKey))} to ${wheelKey}`}
          className="path-range"
          max={WEIGHT_LIMIT}
          min={-WEIGHT_LIMIT}
          onChange={(event) => onChange(Number(event.target.value))}
          step={1}
          type="range"
          value={value}
        />
        <span className="path-end forward">{t("forward")}</span>
      </div>

      <p className="path-hint">{t("tweakHint")}</p>
    </div>
  );
}
