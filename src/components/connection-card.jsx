import { useI18n } from "../i18n/i18n";

export default function ConnectionCard({
  status,
  deviceName,
  needsManualReconnect,
  error,
  onConnect,
  onDisconnect,
}) {
  const { t } = useI18n();
  const isConnected = status === "connected";
  const isBusy = status === "connecting" || status === "reconnecting";

  const statusText = {
    disconnected: t("statusDisconnected"),
    connecting: t("statusConnecting"),
    connected: t("statusConnected"),
    reconnecting: t("statusReconnecting"),
  }[status];

  return (
    <header className="connection-card">
      <div className="connection-identity">
        <h1>{t("title")}</h1>
        <div className={`status-pill status-${status}`}>
          <span className="status-dot" />
          {statusText}
          {isConnected && deviceName ? <span className="device-name">{deviceName}</span> : null}
        </div>
      </div>

      <div className="connection-actions">
        {isConnected ? (
          <button className="button secondary" onClick={onDisconnect} type="button">
            {t("disconnect")}
          </button>
        ) : (
          <button className="button primary" disabled={isBusy} onClick={onConnect} type="button">
            {isBusy ? t("connecting") : t("connect")}
          </button>
        )}
      </div>

      {needsManualReconnect ? <p className="notice warning">{t("reconnectHint")}</p> : null}
      {error ? <p className="notice error">{error}</p> : null}
    </header>
  );
}
