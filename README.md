# Thymio 3 ANN Edu

Gamified classroom interface for a small neural network on a Thymio 3. The robot
body is the stage: five proximity sensors are hotspots, one path at a time is
explained in kid language, and the ANN is drawn inside the robot.

Languages: **English, French, German, Italian**.

The expert diagram with twelve sliders lives in the sibling project
[Thymio3-ANN](../Thymio3-ANN). This app is the education-focused product.

## Demo loop

1. **See** — watch a sensor light up (simulated obstacle, or a real object in
   front of a connected robot). The story strip walks Sense → Multiply → Add →
   Decide for the focused path.
2. **Tweak** — adjust that path with a coarse pull / push control.
3. Tap a sensor hotspot to lock focus; otherwise focus follows the brightest
   reading.

## Requirements

- Node.js
- Chrome or Edge for Web Bluetooth (robot). Simulated mode works in any browser.

## Setup

```bash
npm install
npm run setup:api
npm run dev
```

Open http://localhost:5182 .

`setup:api` clones and builds [thymio3-ts-api](https://github.com/Mobsya/thymio3-ts-api)
into `vendor/` (gitignored).

## Network

Same single-layer model as the expert app:

```
wheel = activation( bias + Σ weight(sensor) × sensor / 1000 )
```

Weights are stored under `thymio3-ann-edu.network.v1` so they do not clash with
the expert app.
