# Thymio 3 ANN Edu

Gamified classroom interface for a small neural network on a Thymio 3.

**See** shows the network: proximity bars on a left-facing Thymio, multiply (×)
weights, a neuron that **adds**, then motor speeds. The story strip is four beats —
Sense → Multiply → Add (in the neuron) → Send (to motor speed).

**Tweak** adds pull/push weight controls under the sensors and bias under Add.
Presets (default **Avoid**) sit in the control bar; editing weights switches to
**Custom**.

Languages: **English, French, German, Italian**.

The expert diagram with twelve sliders lives in
[Thymio3-ANN](https://github.com/FrancescoMondada/Thymio3-ANN).

## Demo

Live page (simulated sensors work in any browser; connecting a robot needs
Chrome or Edge over HTTPS):

https://francescomondada.github.io/Thymio3-ANN-Edu/

## For teachers

A ready-to-run classroom plan (≈45–60 min) to introduce neural networks with
this interface, including a figure of the full network (5 sensors → 10 weights
+ 2 biases → 2 neurons → 2 wheels):

[docs/class-plan.md](docs/class-plan.md) · [docs/ann-structure.svg](docs/ann-structure.svg)

## Demo loop

1. **See** — watch a sensor light up (simulated obstacle, or a real object in
   front of a connected robot). Follow Sense → Multiply → Add → Send.
2. **Tweak** — adjust the focused path and bias; try a preset.
3. Tap a sensor to lock focus, or use **Follow brightest**.

## Requirements

- Node.js
- Chrome or Edge for Web Bluetooth (robot). Simulated mode works in any browser.

## Setup

```bash
npm install
npm run setup:api
npm run dev
```

Open http://127.0.0.1:5182 .

`setup:api` clones and builds [thymio3-ts-api](https://github.com/Mobsya/thymio3-ts-api)
into `vendor/` (gitignored), applying optional Edu overlays for the motor path.

## Network

Same single-layer model as the expert app:

```
wheel = activation( bias + Σ weight(sensor) × sensor / 1000 )
```

Weights are stored under `thymio3-ann-edu.network.v1` so they do not clash with
the expert app.
