import { PRESETS } from "../ann/network";
import { useI18n } from "../i18n/i18n";

const PRESET_LABEL_KEYS = {
  rest: "presetRest",
  forward: "presetForward",
  avoid: "presetAvoid",
  follow: "presetFollow",
  shy: "presetShy",
};

export default function PresetPicker({ presetKey, onPresetChange }) {
  const { t } = useI18n();
  const isCustom = presetKey === "";

  return (
    <div className="preset-picker">
      <div className="preset-picker-head">
        <span className="preset-picker-label">{t("presetLabel")}</span>
        <span className="preset-picker-hint">{t("presetHint")}</span>
      </div>
      <div className="preset-picker-row" role="group" aria-label={t("presetLabel")}>
        {PRESETS.map((preset) => (
          <button
            aria-pressed={presetKey === preset.key}
            className={`preset-chip${presetKey === preset.key ? " is-active" : ""}`}
            key={preset.key}
            onClick={() => onPresetChange(preset.key)}
            type="button"
          >
            {t(PRESET_LABEL_KEYS[preset.key] ?? preset.key)}
          </button>
        ))}
        <span
          aria-current={isCustom ? "true" : undefined}
          className={`preset-chip is-custom${isCustom ? " is-active" : ""}`}
        >
          {t("presetCustom")}
        </span>
      </div>
    </div>
  );
}
