import { useI18n } from "../i18n/i18n";
import { formatSigned } from "../ann/palette";
import { sensorLabelKey } from "../ann/robot-layout";

export default function StoryStrip({
  sensorKey,
  wheelKey,
  rawValue,
  weight,
  contribution,
  speed,
}) {
  const { t, tf } = useI18n();

  const effect =
    weight > 0 ? t("effectPush") : weight < 0 ? t("effectPull") : t("effectNone");

  const wheel = wheelKey === "left" ? t("wheelLeft") : t("wheelRight");

  return (
    <div className="story-strip" aria-live="polite">
      <span className="story-beat">
        <span className="story-num">1</span>
        {tf("storySense", {
          sensor: t(sensorLabelKey(sensorKey)),
          value: Math.round(rawValue),
        })}
      </span>
      <span className="story-arrow" aria-hidden="true">
        →
      </span>
      <span className="story-beat">
        <span className="story-num">2</span>
        {tf("storyMultiply", { weight: formatSigned(weight), effect })}
      </span>
      <span className="story-arrow" aria-hidden="true">
        →
      </span>
      <span className="story-beat">
        <span className="story-num">3</span>
        {tf("storyAdd", {
          contribution: formatSigned(contribution),
          wheel,
        })}
      </span>
      <span className="story-arrow" aria-hidden="true">
        →
      </span>
      <span className="story-beat">
        <span className="story-num">4</span>
        {tf("storyDecide", { speed: formatSigned(speed) })}
      </span>
    </div>
  );
}
