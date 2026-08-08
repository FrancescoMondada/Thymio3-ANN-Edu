import { useI18n } from "../i18n/i18n";
import { BIAS_LIMIT, clamp } from "../ann/network";
import { formatSigned, signColour } from "../ann/palette";

/**
 * Bias slider for one wheel.
 */
export default function BiasControl({ wheelKey, bias, onChange }) {
  const { t } = useI18n();
  const value = clamp(Math.round(bias), BIAS_LIMIT);
  const colour = signColour(value);
  const wheelLabel = wheelKey === "left" ? t("wheelLeft") : t("wheelRight");

  return (
    <div className="path-control bias-control">
      <div className="path-control-head">
        <span className="bias-badge" aria-hidden="true">
          b
        </span>
        <div>
          <p className="path-control-title">
            {t("bias")} → {wheelLabel}
          </p>
          <p className="path-control-value" style={{ color: colour }}>
            {formatSigned(value)}
          </p>
        </div>
      </div>

      <div className="path-slider-row">
        <span className="path-end backward">{t("backward")}</span>
        <input
          aria-label={`${t("bias")} ${wheelKey}`}
          className="path-range"
          max={BIAS_LIMIT}
          min={-BIAS_LIMIT}
          onChange={(event) => onChange(Number(event.target.value))}
          step={1}
          type="range"
          value={value}
        />
        <span className="path-end forward">{t("forward")}</span>
      </div>

      <p className="path-hint">{t("biasHint")}</p>
    </div>
  );
}
