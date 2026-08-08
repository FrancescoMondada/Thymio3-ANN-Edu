import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as thymio from "thymio3-ts-api";
import ConnectionCard from "./components/connection-card";
import EduChrome from "./components/edu-chrome";
import NetworkOverview from "./components/network-overview";
import PathControl from "./components/path-control";
import StoryStrip from "./components/story-strip";
import { useI18n } from "./i18n/i18n";
import { WEIGHT_LIMIT, clamp, evaluate, loadNetwork, presetByKey, saveNetwork } from "./ann/network";
import { autoFocusSensor } from "./ann/robot-layout";
import { createMotorWriter } from "./thymio/actuator";
import { simulateSensors } from "./thymio/demo-source";
import { ZERO_SENSORS, readSensors } from "./thymio/sensors";

const STREAM_TIMEOUT_MS = 1000;
const DEMO_INTERVAL_MS = 50;
const DEFAULT_PRESET = "avoid";
const BLUETOOTH_SUPPORTED = typeof navigator !== "undefined" && Boolean(navigator.bluetooth);

export default function App() {
  const { t } = useI18n();

  const [status, setStatus] = useState("disconnected");
  const [deviceName, setDeviceName] = useState("");
  const [needsManualReconnect, setNeedsManualReconnect] = useState(false);
  const [error, setError] = useState("");
  const [streaming, setStreaming] = useState(false);

  const [sensorValues, setSensorValues] = useState(ZERO_SENSORS);
  const [source, setSource] = useState("demo");
  const [driving, setDriving] = useState(false);

  const [mode, setMode] = useState("see");
  const [focusWheel, setFocusWheel] = useState("left");
  const [focusSensor, setFocusSensor] = useState("center");
  const [manualSensor, setManualSensor] = useState(false);

  const [network, setNetwork] = useState(() => loadNetwork() ?? presetByKey(DEFAULT_PRESET).build());

  const lastSensorAt = useRef(0);
  const sourceRef = useRef(source);
  const writerRef = useRef(null);

  sourceRef.current = source;

  if (!writerRef.current) {
    writerRef.current = createMotorWriter({
      onError: (writeError) => setError(writeError?.message ?? "Motor write failed"),
    });
  }

  const isConnected = status === "connected";
  const storyWheel = focusWheel === "both" ? "left" : focusWheel;

  useEffect(() => {
    const onConnected = (event) => {
      if (event.detail) {
        setStatus("connected");
        setDeviceName(thymio.getDeviceName());
        setNeedsManualReconnect(false);
        setError("");
        setSource("robot");
        thymio.startMainSensorStreaming().catch((streamError) => {
          setError(streamError?.message ?? "Could not start sensor streaming");
        });
      } else {
        setStatus((previous) => (previous === "connected" ? "reconnecting" : "disconnected"));
        setDeviceName("");
        setDriving(false);
        setStreaming(false);
        writerRef.current.forget();
      }
    };

    const onManualReconnection = () => {
      setNeedsManualReconnect(true);
      setStatus("disconnected");
    };

    const onSensorValues = (event) => {
      const values = event.detail?.proximitySensors;
      if (!values) return;
      lastSensorAt.current = Date.now();
      if (sourceRef.current === "robot") setSensorValues(readSensors(values));
    };

    document.addEventListener("thymio-connected", onConnected);
    document.addEventListener("thymio-prompt-manual-reconnection", onManualReconnection);
    document.addEventListener("thymio-sensor-values", onSensorValues);

    return () => {
      document.removeEventListener("thymio-connected", onConnected);
      document.removeEventListener("thymio-prompt-manual-reconnection", onManualReconnection);
      document.removeEventListener("thymio-sensor-values", onSensorValues);
    };
  }, []);

  useEffect(() => {
    if (source !== "demo") return undefined;
    const start = performance.now();
    const timer = setInterval(() => {
      setSensorValues(simulateSensors((performance.now() - start) / 1000));
    }, DEMO_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [source]);

  useEffect(() => {
    if (source === "demo") {
      setStreaming(true);
      return undefined;
    }
    const timer = setInterval(() => {
      setStreaming(Date.now() - lastSensorAt.current < STREAM_TIMEOUT_MS);
    }, STREAM_TIMEOUT_MS / 2);
    return () => clearInterval(timer);
  }, [source]);

  useEffect(() => {
    saveNetwork(network);
  }, [network]);

  useEffect(() => {
    if (manualSensor) return;
    setFocusSensor((current) => autoFocusSensor(sensorValues, current));
  }, [sensorValues, manualSensor]);

  useEffect(() => {
    if (!manualSensor) return undefined;
    const timer = setTimeout(() => setManualSensor(false), 8000);
    return () => clearTimeout(timer);
  }, [manualSensor, focusSensor]);

  const evaluation = useMemo(() => evaluate(network, sensorValues), [network, sensorValues]);
  const { left: leftSpeed, right: rightSpeed } = evaluation.outputs;

  useEffect(() => {
    if (!driving || !isConnected) return;
    writerRef.current.write(leftSpeed, rightSpeed);
  }, [driving, isConnected, leftSpeed, rightSpeed]);

  useEffect(() => {
    if (driving && source === "robot" && !streaming) setDriving(false);
  }, [driving, source, streaming]);

  const connect = useCallback(async () => {
    setError("");
    setNeedsManualReconnect(false);
    setStatus("connecting");
    await thymio.requestAndConnect();
    if (!thymio.isConnected()) setStatus("disconnected");
  }, []);

  const disconnect = useCallback(async () => {
    setDriving(false);
    try {
      await writerRef.current.stop();
      await thymio.stopSensorStreaming();
    } catch {
      // link may already be gone
    }
    try {
      await thymio.disconnect();
    } catch (disconnectError) {
      setError(disconnectError?.message ?? "Could not disconnect");
    }
    setStatus("disconnected");
    setSource("demo");
  }, []);

  const stopMotors = useCallback(() => {
    setDriving(false);
    if (thymio.isConnected()) void writerRef.current.stop();
  }, []);

  const changeWeight = useCallback(
    (value) => {
      const next = clamp(Math.round(value), WEIGHT_LIMIT);
      const wheels = focusWheel === "both" ? ["left", "right"] : [focusWheel];
      setNetwork((current) => {
        const weights = { ...current.weights };
        for (const wheel of wheels) {
          weights[wheel] = { ...weights[wheel], [focusSensor]: next };
        }
        return { ...current, weights };
      });
    },
    [focusSensor, focusWheel],
  );

  const selectSensor = useCallback((key) => {
    setFocusSensor(key);
    setManualSensor(true);
  }, []);

  const weight = network.weights[storyWheel][focusSensor];
  const contribution = evaluation.contributions[storyWheel][focusSensor];
  const rawValue = (evaluation.inputs[focusSensor] ?? 0) * 1000;

  return (
    <div className="page">
      <ConnectionCard
        deviceName={deviceName}
        error={error}
        needsManualReconnect={needsManualReconnect}
        onConnect={connect}
        onDisconnect={disconnect}
        status={status}
      />

      {BLUETOOTH_SUPPORTED ? null : (
        <div className="notice warning notice-bluetooth" role="alert">
          <strong className="notice-title">{t("noBluetoothTitle")}</strong>
          <p>{t("noBluetooth")}</p>
        </div>
      )}

      <EduChrome
        driving={driving}
        focusWheel={focusWheel}
        mode={mode}
        onDriving={setDriving}
        onMode={setMode}
        onSource={(next) => {
          setSource(next);
          setSensorValues(ZERO_SENSORS);
        }}
        onStop={stopMotors}
        onWheel={setFocusWheel}
        robotReady={isConnected}
        source={source}
        streaming={streaming}
      />

      <p className="tip">{t("tipObstacle")}</p>

      <main className="stage-panel">
        <NetworkOverview
          evaluation={evaluation}
          focusSensor={focusSensor}
          focusWheel={focusWheel}
          mode={mode}
          network={network}
          onSelectSensor={selectSensor}
          pathControl={
            <PathControl
              onChange={changeWeight}
              sensorKey={focusSensor}
              weight={weight}
              wheelKey={storyWheel}
            />
          }
        />

        <StoryStrip
          contribution={contribution}
          rawValue={rawValue}
          sensorKey={focusSensor}
          weight={weight}
          wheelKey={storyWheel}
        />
      </main>
    </div>
  );
}
