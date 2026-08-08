import { useI18n } from "../i18n/i18n";
import { formatSigned, formatSensorReading, formatWeightFactor, signColour } from "../ann/palette";
import { sensorLabelKey } from "../ann/robot-layout";

/**
 * Sense → multiply → add (in the neuron) → send to motor speed.
 */
export default function StoryStrip({
  sensorKey,
  wheelKey,
  rawValue,
  weight,
  contribution,
  sum,
  output,
}) {
  const { t, tf } = useI18n();
  const wheel = wheelKey === "left" ? t("wheelLeft") : t("wheelRight");
  const effect =
    weight > 0 ? t("effectPush") : weight < 0 ? t("effectPull") : t("effectNone");
  const clamped = Number.isFinite(sum) && Number.isFinite(output) && Math.round(sum) !== output;

  return (
    <div className="story-strip" aria-live="polite">
      <div className="story-card">
        <span className="story-num">1</span>
        <div>
          <p className="story-label">{t("storyStepSense")}</p>
          <p className="story-main">
            {tf("storySenseShort", { sensor: t(sensorLabelKey(sensorKey)) })}{" "}
            <strong style={{ color: "#c85a1e" }}>{formatSensorReading(rawValue)}</strong>
          </p>
        </div>
      </div>

      <span className="story-arrow" aria-hidden="true">
        →
      </span>

      <div className="story-card">
        <span className="story-num">2</span>
        <div>
          <p className="story-label">{t("storyStepMultiply")}</p>
          <p className="story-main">
            × {t("weightWord")}{" "}
            <strong style={{ color: signColour(weight) }}>{formatWeightFactor(weight)}</strong>
            <span className="story-effect"> ({effect})</span>
          </p>
        </div>
      </div>

      <span className="story-arrow" aria-hidden="true">
        →
      </span>

      <div className="story-card">
        <span className="story-num">3</span>
        <div>
          <p className="story-label">{t("storyStepAdd")}</p>
          <p className="story-main">
            {t("storyAddShort")}{" "}
            <strong style={{ color: signColour(contribution, 1) }}>
              {formatSigned(Math.round(contribution))}
            </strong>
          </p>
        </div>
      </div>

      <span className="story-arrow" aria-hidden="true">
        →
      </span>

      <div className={`story-card${clamped ? " is-clamp" : ""}`}>
        <span className="story-num">4</span>
        <div>
          <p className="story-label">{t("storyStepSend")}</p>
          <p className="story-main">
            {clamped
              ? tf("storySendClamped", {
                  sum: formatSigned(Math.round(sum)),
                  wheel,
                  speed: formatSigned(output),
                })
              : tf("storySendShort", {
                  wheel,
                  speed: formatSigned(output),
                })}
          </p>
        </div>
      </div>
    </div>
  );
}
