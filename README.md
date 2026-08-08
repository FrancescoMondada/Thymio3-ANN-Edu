# Thymio 3 ANN Edu

Gamified classroom interface for a small neural network on a Thymio 3.

**See** shows the network overview: proximity bars and a mini robot on the left,
multiplication signs on every connection, a contribution list (add) for the
focused wheel, and motor speeds on the right. The story strip under the figure
is three beats only — Sense → Multiply → Add — so the mechanism stays readable.
Activation/clamp is applied but not drawn as its own step.

**Tweak** keeps that overview and adds a pull/push control for the focused path.

Languages: **English, French, German, Italian**.

The expert diagram with twelve sliders lives in the sibling project
[Thymio3-ANN](../Thymio3-ANN).

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
