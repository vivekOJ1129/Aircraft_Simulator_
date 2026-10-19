# Avionics Longitudinal Stability and Stick Force Studio

An interactive 2D flight dynamics simulation and avionics studio built to visualize aircraft longitudinal static stability, control surface deflection, and pilot stick effort across different flight regimes.

---

## Overview

This project was built out of a lifelong curiosity for aerospace and flight mechanics. It transforms classic longitudinal stability equations into an intuitive, real-time visual sandbox. Whether you want to understand how the static margin governs aircraft behavior or test your pilot reflexes in unstable flight modes, this studio provides a complete glass-cockpit telemetry experience.

---

## Features

* **Real-Time Flight Physics:** 60-FPS longitudinal pitch simulation governed by the relative positions of the Aerodynamic Center (AC), Center of Gravity (CG), and Neutral Point (NP).
* **Movable Centers:** Freely drag and adjust the Aerodynamic Center, Center of Gravity, and Neutral Point along the fuselage station bar.
* **Manual Elevator Control & Stick Force:** Drive the elevator control surface using on-screen sliders or keyboard arrow keys while watching the live pilot stick effort gauge calculate required force in Newtons.
* **Telemetry Oscilloscope:** Live graphical tracking of aircraft pitch attitude versus pilot elevator inputs over time.
* **Stability Regimes:** Instantly switch between Overstable, Positively Stable, Neutrally Stable, and Negatively Stable preset scenarios.

---

## Stability Regimes

1. **Overstable (Excessive Static Margin):** The Center of Gravity is far forward. The plane fights your inputs, snapping back to level so aggressively that you need massive stick force just to pitch up or down.
2. **Positively Stable (Ideal Handling Zone):** The Center of Gravity sits comfortably between the Aerodynamic Center and Neutral Point, creating an ideal sweet spot with smooth, comfortable, and responsive hands-off stability.
3. **Neutrally Stable (Critical Balance):** The Center of Gravity is placed directly on the Neutral Point, resulting in zero restoring moment where you can pitch the nose to any inclination, center the stick, and it stays locked at that exact angle.
4. **Negatively Stable (Unstable / Aft CG):** The Center of Gravity moves aft of the Neutral Point. Any small deflection triggers a growing oscillation, offering a great challenge to test manual counter-steering reflexes and appreciate fly-by-wire computer augmentation.

---

## Getting Started

To run the application locally, you can choose between a zero-setup standalone HTML file or a modern React Vite setup.

### Option 1: Standalone HTML (Zero Setup)

1. Download or copy the `aircraft_studio.html` file.
2. Double-click the file to open it directly in any modern web browser like Chrome or Edge.

### Option 2: React Vite Setup

1. Create a new React project and install dependencies:
```bash
npm create vite@latest avionics-app -- --template react
cd avionics-app

```


2. Replace the contents of `src/App.jsx` with the studio source code.
3. Start the development server:
```bash
npm run dev

```



---

## Controls

* **Up / Down Arrow Keys:** Deflect the elevator stick up or down.
* **Spacebar:** Instantly center the elevator stick to zero degrees.
* **Number Keys 1 to 4:** Quick-load the four stability scenario presets.
* **Mouse Sliders:** Freely reposition the aerodynamic centers, center of gravity, and elevator angle.

---

## License

Open-source project built for aerospace education and simulation enthusiasts.
