import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as thymio from "thymio3-ts-api";
import ConnectionCard from "./components/connection-card";
import EduChrome from "./components/edu-chrome";
import NetworkOverview from "./components/network-overview";
import BiasControl from "./components/bias-control";
import PathControl from "./components/path-control";
import StoryStrip from "./components/story-strip";
import { useI18n } from "./i18n/i18n";
import {
  BIAS_LIMIT,
  WEIGHT_LIMIT,
  clamp,
  evaluate,
  loadNetwork,
  matchPresetKey,
  presetByKey,
  saveNetwork,
} from "./ann/network";
import { autoFocusSensor, sensorLabelKey } from "./ann/robot-layout";
import { createMotorWriter } from "./thymio/actuator";
import { simulateSensors } from "./thymio/demo-source";
import {
  deployOnRobotAnn,
  parseRobotHz,
  stopOnRobotAnn,
} from "./thymio/on-robot-ann";
import { createRateMeter } from "./thymio/rate-meter";
import { ZERO_SENSORS, readSensors } from "./thymio/sensors";

const STREAM_TIMEOUT_MS = 1000;
/** Cap how often robot (and demo) readings update the UI. */
const SENSOR_MAX_HZ = 10;
const SENSOR_INTERVAL_MS = Math.round(1000 / SENSOR_MAX_HZ);
const DEMO_INTERVAL_MS = SENSOR_INTERVAL_MS;
const ON_ROBOT_REDEPLOY_MS = 450;
const DEFAULT_PRESET = "avoid";
const BLUETOOTH_SUPPORTED = typeof navigator !== "undefined" && Boolean(navigator.bluetooth);

/**
 * Accept at most one sample per interval, always flushing the latest pending
 * reading so the robot still sees fresh data at the capped rate.
 */
function createSensorGate(intervalMs, apply) {
  let lastApplied = 0;
  let pending = null;
  let timer = null;

  return {
    push(values) {
      const now = Date.now();
      const wait = intervalMs - (now - lastApplied);
      if (wait <= 0) {
        lastApplied = now;
        pending = null;
        apply(values);
        return;
      }
      pending = values;
      if (timer != null) return;
      timer = window.setTimeout(() => {
        timer = null;
        if (!pending) return;
        lastApplied = Date.now();
        const next = pending;
        pending = null;
        apply(next);
      }, wait);
    },
    clear() {
      if (timer != null) window.clearTimeout(timer);
      timer = null;
      pending = null;
    },
  };
}

export default function App() {
  const { t, tf } = useI18n();

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
  const [presetKey, setPresetKey] = useState(() => {
    const stored = loadNetwork();
    if (!stored) return DEFAULT_PRESET;
    return matchPresetKey(stored) || "";
  });
  const [sensorHz, setSensorHz] = useState(0);
  const [motorHz, setMotorHz] = useState(0);
  const [motorWriteMode, setMotorWriteMode] = useState("unknown");
  const [onRobotActive, setOnRobotActive] = useState(false);
  const [robotUpdating, setRobotUpdating] = useState(false);
  const [robotLoopHz, setRobotLoopHz] = useState(0);

  const lastSensorAt = useRef(0);
  const sourceRef = useRef(source);
  const drivingRef = useRef(driving);
  const networkRef = useRef(network);
  const onRobotRef = useRef(false);
  const writerRef = useRef(null);
  const sensorGateRef = useRef(null);
  const sensorMeterRef = useRef(null);
  const motorMeterRef = useRef(null);

  sourceRef.current = source;
  drivingRef.current = driving;
  networkRef.current = network;

  if (!sensorMeterRef.current) sensorMeterRef.current = createRateMeter();
  if (!motorMeterRef.current) motorMeterRef.current = createRateMeter();

  if (!writerRef.current) {
    writerRef.current = createMotorWriter({
      onError: (writeError) => setError(writeError?.message ?? "Motor write failed"),
      onSent: () => motorMeterRef.current.tick(),
      onMode: (mode) => {
        if (!onRobotRef.current) setMotorWriteMode(mode);
      },
    });
  }

  if (!sensorGateRef.current) {
    sensorGateRef.current = createSensorGate(SENSOR_INTERVAL_MS, (values) => {
      if (sourceRef.current !== "robot") return;
      sensorMeterRef.current.tick();
      setSensorValues(values);
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
        if (typeof thymio.getMotorWriteMode === "function") {
          setMotorWriteMode(thymio.getMotorWriteMode());
        }
        thymio.startMainSensorStreaming().catch((streamError) => {
          setError(streamError?.message ?? "Could not start sensor streaming");
        });
      } else {
        setStatus((previous) => (previous === "connected" ? "reconnecting" : "disconnected"));
        setDeviceName("");
        setDriving(false);
        setStreaming(false);
        writerRef.current.forget();
        sensorGateRef.current?.clear();
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
      if (sourceRef.current !== "robot") return;
      sensorGateRef.current.push(readSensors(values));
    };

    const onStdout = (event) => {
      const hz = parseRobotHz(event.detail);
      if (hz != null) setRobotLoopHz(hz);
    };

    document.addEventListener("thymio-connected", onConnected);
    document.addEventListener("thymio-prompt-manual-reconnection", onManualReconnection);
    document.addEventListener("thymio-sensor-values", onSensorValues);
    document.addEventListener("thymio-std-out-values", onStdout);

    return () => {
      document.removeEventListener("thymio-connected", onConnected);
      document.removeEventListener("thymio-prompt-manual-reconnection", onManualReconnection);
      document.removeEventListener("thymio-sensor-values", onSensorValues);
      document.removeEventListener("thymio-std-out-values", onStdout);
      sensorGateRef.current?.clear();
    };
  }, []);

  useEffect(() => {
    if (source !== "demo") return undefined;
    const start = performance.now();
    const timer = setInterval(() => {
      sensorMeterRef.current.tick();
      setSensorValues(simulateSensors((performance.now() - start) / 1000));
    }, DEMO_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [source]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSensorHz(sensorMeterRef.current.hz());
      setMotorHz(motorMeterRef.current.hz());
    }, 250);
    return () => clearInterval(timer);
  }, []);

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

  const evaluation = useMemo(() => evaluate(network, sensorValues), [network, sensorValues]);
  const { left: leftSpeed, right: rightSpeed } = evaluation.outputs;
  const canDrive = isConnected && streaming;

  // Robot + drive → MicroPython owns the motors (fluid local loop).
  useEffect(() => {
    const shouldRun = driving && source === "robot" && isConnected;
    if (!shouldRun) {
      if (onRobotRef.current) {
        onRobotRef.current = false;
        setOnRobotActive(false);
        setRobotUpdating(false);
        setRobotLoopHz(0);
        void stopOnRobotAnn({
          zeroMotors: () => writerRef.current.stop(),
        });
      }
      return undefined;
    }

    let cancelled = false;
    setRobotUpdating(true);
    (async () => {
      try {
        await deployOnRobotAnn(networkRef.current);
        if (cancelled) return;
        onRobotRef.current = true;
        setOnRobotActive(true);
        setMotorWriteMode("on-robot");
      } catch (deployError) {
        if (cancelled) return;
        setError(deployError?.message ?? "Could not start on-robot control");
        setDriving(false);
      } finally {
        if (!cancelled) setRobotUpdating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [driving, source, isConnected]);

  // Weight edits while driving: re-bake and restart the on-robot loop.
  useEffect(() => {
    if (!driving || source !== "robot" || !isConnected || !onRobotActive) return undefined;
    const timer = setTimeout(() => {
      setRobotUpdating(true);
      deployOnRobotAnn(network)
        .catch((deployError) => {
          setError(deployError?.message ?? "Could not update on-robot weights");
        })
        .finally(() => setRobotUpdating(false));
    }, ON_ROBOT_REDEPLOY_MS);
    return () => clearTimeout(timer);
  }, [network, driving, source, isConnected, onRobotActive]);

  // Simulated sensors still use BLE motor writes (browser-side evaluate).
  useEffect(() => {
    if (!driving || !isConnected || source === "robot") return;
    writerRef.current.write(leftSpeed, rightSpeed);
  }, [driving, isConnected, source, leftSpeed, rightSpeed]);

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
    onRobotRef.current = false;
    setOnRobotActive(false);
    try {
      await stopOnRobotAnn({ zeroMotors: () => writerRef.current.stop() });
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
    onRobotRef.current = false;
    setOnRobotActive(false);
    if (thymio.isConnected()) {
      void stopOnRobotAnn({ zeroMotors: () => writerRef.current.stop() });
    }
  }, []);

  const changeWeight = useCallback((wheel, value) => {
    const next = clamp(Math.round(value), WEIGHT_LIMIT);
    setPresetKey("");
    setNetwork((current) => ({
      ...current,
      weights: {
        ...current.weights,
        [wheel]: { ...current.weights[wheel], [focusSensor]: next },
      },
    }));
  }, [focusSensor]);

  const changeBias = useCallback((wheel, value) => {
    const next = clamp(Math.round(value), BIAS_LIMIT);
    setPresetKey("");
    setNetwork((current) => ({
      ...current,
      bias: { ...current.bias, [wheel]: next },
    }));
  }, []);

  const applyPreset = useCallback((key) => {
    setPresetKey(key);
    // Full network: biases + all sensor→wheel weights (not only the focused path).
    // Do not change Look-at / motor visualisation — only the weights.
    setNetwork(presetByKey(key).build());
  }, []);

  const selectSensor = useCallback((key) => {
    setFocusSensor(key);
    setManualSensor(true);
  }, []);

  const followBrightest = useCallback(() => {
    setManualSensor(false);
  }, []);

  const weight = network.weights[storyWheel][focusSensor];
  const contribution = evaluation.contributions[storyWheel][focusSensor];
  const rawValue = (evaluation.inputs[focusSensor] ?? 0) * 1000;
  const sum = evaluation.sums[storyWheel];
  const output = evaluation.outputs[storyWheel];
  const tweakWheels = focusWheel === "both" ? ["right", "left"] : [storyWheel];

  const pathControl = (
    <div className={`tweak-paths${focusWheel === "both" ? " is-both" : ""}`}>
      {tweakWheels.map((wheel) => (
        <PathControl
          key={wheel}
          onChange={(value) => changeWeight(wheel, value)}
          sensorKey={focusSensor}
          weight={network.weights[wheel][focusSensor]}
          wheelKey={wheel}
        />
      ))}
    </div>
  );

  const biasControl = (
    <div className={`tweak-paths${focusWheel === "both" ? " is-both" : ""}`}>
      {tweakWheels.map((wheel) => (
        <BiasControl
          key={wheel}
          bias={network.bias[wheel]}
          onChange={(value) => changeBias(wheel, value)}
          wheelKey={wheel}
        />
      ))}
    </div>
  );
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
        canDrive={canDrive}
        driving={driving}
        focusWheel={focusWheel}
        mode={mode}
        onDriving={setDriving}
        onMode={setMode}
        onPresetChange={applyPreset}
        onSource={(next) => {
          if (next === "demo" && onRobotRef.current) {
            onRobotRef.current = false;
            setOnRobotActive(false);
            setRobotUpdating(false);
            void stopOnRobotAnn({ zeroMotors: () => writerRef.current.stop() });
          }
          setSource(next);
          setSensorValues(ZERO_SENSORS);
          sensorMeterRef.current.clear();
          motorMeterRef.current.clear();
          setSensorHz(0);
          setMotorHz(0);
          setRobotLoopHz(0);
        }}
        onStop={stopMotors}
        onWheel={setFocusWheel}
        presetKey={presetKey}
        robotReady={isConnected}
        source={source}
        streaming={streaming}
        onRobotActive={onRobotActive}
      />

      {robotUpdating ? (
        <p className="notice updating-robot" role="status">
          {t("updatingRobot")}
        </p>
      ) : null}

      <p className="tip">{onRobotActive ? t("tipOnRobot") : t("tipObstacle")}</p>

      {manualSensor ? (
        <div className="sensor-lock-bar">
          <span className="sensor-lock-chip">
            {tf("sensorLocked", { sensor: t(sensorLabelKey(focusSensor)) })}
          </span>
          <button className="button secondary" onClick={followBrightest} type="button">
            {t("followBrightest")}
          </button>
        </div>
      ) : null}

      <main className="stage-panel">
        <NetworkOverview
          biasControl={biasControl}
          evaluation={evaluation}
          focusSensor={focusSensor}
          focusWheel={focusWheel}
          mode={mode}
          network={network}
          onSelectSensor={selectSensor}
          pathControl={pathControl}
        />

        <StoryStrip
          contribution={contribution}
          output={output}
          rawValue={rawValue}
          sensorKey={focusSensor}
          sum={sum}
          weight={weight}
          wheelKey={storyWheel}
        />

        <details className="diagnostics">
          <summary>{t("diagnostics")}</summary>
          <div className="rate-footer" aria-live="polite">
            <span>
              {t("rateSensors")}: <strong>{tf("rateHz", { hz: sensorHz })}</strong>
            </span>
            <span className="rate-sep" aria-hidden="true">
              ·
            </span>
            <span>
              {t("rateMotors")}:{" "}
              <strong>
                {onRobotActive
                  ? tf("rateHz", { hz: robotLoopHz || motorHz })
                  : tf("rateHz", { hz: motorHz })}
              </strong>
              {onRobotActive ? (
                <span className="rate-mode"> ({t("rateOnRobot")})</span>
              ) : motorWriteMode === "without-response" ? (
                <span className="rate-mode"> ({t("rateWriteFast")})</span>
              ) : motorWriteMode === "with-response" ? (
                <span className="rate-mode"> ({t("rateWriteAck")})</span>
              ) : null}
            </span>
          </div>
        </details>
      </main>
    </div>
  );
}
