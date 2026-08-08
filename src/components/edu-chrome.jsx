import { useI18n } from "../i18n/i18n";

export default function EduChrome({
  mode,
  onMode,
  focusWheel,
  onWheel,
  source,
  onSource,
  driving,
  onDriving,
  onStop,
  streaming,
  robotReady,
}) {
  const { t, locale, locales, setLocale } = useI18n();

  return (
    <section className="edu-chrome">
      <div className="chrome-group">
        <span className="chrome-label">{t("modeLabel")}</span>
        <div className="segmented">
          <button
            className={mode === "see" ? "is-active" : ""}
            onClick={() => onMode("see")}
            type="button"
          >
            {t("modeSee")}
          </button>
          <button
            className={mode === "tweak" ? "is-active" : ""}
            onClick={() => onMode("tweak")}
            type="button"
          >
            {t("modeTweak")}
          </button>
        </div>
      </div>

      <div className="chrome-group">
        <span className="chrome-label">{t("wheelLabel")}</span>
        <div className="segmented">
          <button
            className={focusWheel === "left" ? "is-active" : ""}
            onClick={() => onWheel("left")}
            type="button"
          >
            {t("wheelLeft")}
          </button>
          <button
            className={focusWheel === "right" ? "is-active" : ""}
            onClick={() => onWheel("right")}
            type="button"
          >
            {t("wheelRight")}
          </button>
        </div>
      </div>

      <div className="chrome-group">
        <span className="chrome-label">{t("sourceLabel")}</span>
        <div className="segmented">
          <button
            className={source === "robot" ? "is-active" : ""}
            disabled={!robotReady}
            onClick={() => onSource("robot")}
            type="button"
          >
            {t("sourceRobot")}
          </button>
          <button
            className={source === "demo" ? "is-active" : ""}
            onClick={() => onSource("demo")}
            type="button"
          >
            {t("sourceSim")}
          </button>
        </div>
      </div>

      <div className="chrome-group drive-group">
        <span className="chrome-label">{t("driveLabel")}</span>
        <span className={`stream-pill${streaming ? " is-live" : ""}`}>
          {streaming ? t("sensorsLive") : t("sensorsQuiet")}
        </span>
        <label className="switch">
          <input
            checked={driving}
            disabled={!robotReady}
            onChange={(event) => onDriving(event.target.checked)}
            type="checkbox"
          />
          <span>{t("driveSend")}</span>
        </label>
        <button className="button danger" onClick={onStop} type="button">
          {t("stop")}
        </button>
      </div>

      <div className="chrome-group locale-group">
        <div className="segmented compact">
          {locales.map((item) => (
            <button
              className={locale === item.key ? "is-active" : ""}
              key={item.key}
              onClick={() => setLocale(item.key)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
