import { useI18n } from "../i18n/i18n";
import { formatSigned, signColour } from "../ann/palette";
import { sensorLabelKey } from "../ann/robot-layout";

/**
 * Three clear beats matching the mockups: sense → multiply → add into the wheel.
 * Activation/clamp is not shown as a separate step.
 */
export default function StoryStrip({ sensorKey, wheelKey, rawValue, weight, contribution }) {
  const { t, tf } = useI18n();
  const wheel = wheelKey === "left" ? t("wheelLeft") : t("wheelRight");
  const effect =
    weight > 0 ? t("effectPush") : weight < 0 ? t("effectPull") : t("effectNone");

  return (
    <div className="story-strip" aria-live="polite">
      <div className="story-card">
        <span className="story-num">1</span>
        <div>
          <p className="story-label">{t("storyStepSense")}</p>
          <p className="story-main">
            {tf("storySenseShort", { sensor: t(sensorLabelKey(sensorKey)) })}{" "}
            <strong style={{ color: "#c85a1e" }}>{Math.round(rawValue)}</strong>
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
            <strong style={{ color: signColour(weight) }}>{formatSigned(weight)}</strong>
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
            {tf("storyPullShort", { wheel })}{" "}
            <strong style={{ color: signColour(contribution, 1) }}>
              {formatSigned(Math.round(contribution))}
            </strong>
          </p>
        </div>
      </div>
    </div>
  );
}
