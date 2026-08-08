import { useI18n } from "../i18n/i18n";
import { WEIGHT_LIMIT, clamp } from "../ann/network";
import { formatSigned, signColour } from "../ann/palette";
import { crossPoints, crossRadius } from "../ann/shapes";
import { sensorLabelKey } from "../ann/robot-layout";

/** Coarse steps for kids, mapped onto the real weight range. */
const STEPS = [-2, -1, 0, 1, 2];
const STEP_WEIGHT = 50;

export function weightToStep(weight) {
  const step = Math.round(weight / STEP_WEIGHT);
  return Math.min(2, Math.max(-2, step));
}

export function stepToWeight(step) {
  return clamp(step * STEP_WEIGHT, WEIGHT_LIMIT);
}

export default function PathControl({ sensorKey, wheelKey, weight, onChange }) {
  const { t } = useI18n();
  const step = weightToStep(weight);
  const colour = signColour(weight);
  const wheel = wheelKey === "left" ? "L" : "R";

  return (
    <div className="path-control">
      <div className="path-control-head">
        <svg aria-hidden="true" height="36" width="36">
          <polygon
            points={crossPoints(18, 18, crossRadius(Math.min(1, Math.abs(weight) / WEIGHT_LIMIT)))}
            style={{ fill: colour }}
          />
        </svg>
        <div>
          <p className="path-control-title">
            {t(sensorLabelKey(sensorKey))} → {wheel}
          </p>
          <p className="path-control-value" style={{ color: colour }}>
            {formatSigned(weight)}
          </p>
        </div>
      </div>

      <div className="path-slider-row">
        <span className="path-end pull">{t("pull")}</span>
        <input
          aria-label={`${t(sensorLabelKey(sensorKey))} to ${wheelKey}`}
          className="path-range"
          max={2}
          min={-2}
          onChange={(event) => onChange(stepToWeight(Number(event.target.value)))}
          step={1}
          type="range"
          value={step}
        />
        <span className="path-end push">{t("push")}</span>
      </div>

      <div className="path-steps" aria-hidden="true">
        {STEPS.map((value) => (
          <button
            className={`path-step${step === value ? " is-active" : ""}`}
            key={value}
            onClick={() => onChange(stepToWeight(value))}
            type="button"
          >
            {value > 0 ? `+${value}` : value}
          </button>
        ))}
      </div>

      <p className="path-hint">{t("tweakHint")}</p>
    </div>
  );
}
