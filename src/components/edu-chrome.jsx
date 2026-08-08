import { useI18n } from "../i18n/i18n";
import PresetPicker from "./preset-picker";

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
  canDrive,
  onRobotActive,
  presetKey,
  onPresetChange,
}) {
  const { t } = useI18n();
  const driveEnabled = canDrive ?? (robotReady && streaming);

  return (
    <section className="edu-chrome">
      <div className="chrome-row">
        <div className="chrome-group">
          <span className="chrome-label" id="chrome-mode-label">
            {t("modeLabel")}
          </span>
          <div className="segmented" role="group" aria-labelledby="chrome-mode-label">
            <button
              aria-pressed={mode === "see"}
              className={mode === "see" ? "is-active" : ""}
              onClick={() => onMode("see")}
              type="button"
            >
              {t("modeSee")}
            </button>
            <button
              aria-pressed={mode === "tweak"}
              className={mode === "tweak" ? "is-active" : ""}
              onClick={() => onMode("tweak")}
              type="button"
            >
              {t("modeTweak")}
            </button>
          </div>
        </div>

        <div className="chrome-group">
          <span className="chrome-label" id="chrome-wheel-label">
            {t("wheelLabel")}
          </span>
          <div className="segmented" role="group" aria-labelledby="chrome-wheel-label">
            <button
              aria-pressed={focusWheel === "left"}
              className={focusWheel === "left" ? "is-active" : ""}
              onClick={() => onWheel("left")}
              type="button"
            >
              {t("wheelLeft")}
            </button>
            <button
              aria-pressed={focusWheel === "right"}
              className={focusWheel === "right" ? "is-active" : ""}
              onClick={() => onWheel("right")}
              type="button"
            >
              {t("wheelRight")}
            </button>
            <button
              aria-pressed={focusWheel === "both"}
              className={focusWheel === "both" ? "is-active" : ""}
              onClick={() => onWheel("both")}
              type="button"
            >
              {t("wheelBoth")}
            </button>
          </div>
        </div>

        <div className="chrome-group">
          <span className="chrome-label" id="chrome-source-label">
            {t("sourceLabel")}
          </span>
          <div className="segmented" role="group" aria-labelledby="chrome-source-label">
            <button
              aria-pressed={source === "robot"}
              className={source === "robot" ? "is-active" : ""}
              disabled={!robotReady}
              onClick={() => onSource("robot")}
              type="button"
            >
              {t("sourceRobot")}
            </button>
            <button
              aria-pressed={source === "demo"}
              className={source === "demo" ? "is-active" : ""}
              onClick={() => onSource("demo")}
              type="button"
            >
              {t("sourceSim")}
            </button>
          </div>
        </div>

        <div className="chrome-group drive-group">
          <span className="chrome-label" id="chrome-drive-label">
            {t("driveLabel")}
          </span>
          <span className={`stream-pill${streaming ? " is-live" : ""}`}>
            {streaming ? t("sensorsLive") : t("sensorsQuiet")}
          </span>
          {onRobotActive ? <span className="stream-pill is-live">{t("driveOnRobotPill")}</span> : null}
          <label className="switch">
            <input
              aria-labelledby="chrome-drive-label"
              checked={driving}
              disabled={!driveEnabled}
              onChange={(event) => onDriving(event.target.checked)}
              type="checkbox"
            />
            <span>{source === "robot" ? t("driveOnRobot") : t("driveSend")}</span>
          </label>
          <button className="button danger stop-button" onClick={onStop} type="button">
            {t("stop")}
          </button>
        </div>
      </div>

      <div className="chrome-row chrome-presets">
        <PresetPicker onPresetChange={onPresetChange} presetKey={presetKey} />
      </div>
    </section>
  );
}
