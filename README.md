<p align="center">
  <img src="src/js/assets/logos/logo.png" alt="ExcaliburFX Banner" width="50">
</p>

<p align="center">
<b>ExcaliburFX</b> is a CEP Adobe Extension made for After Effect and Premiere Pro. Built with Svelte and the CEP (Common Extensibility Platform) Engine, it acts as a Swiss Army knife (or a sword) for motion designers and video editors, offering everything from keyframe curving, Shakes presets, to built-in FFmpeg rendering and SFX management.
</p>

## Future ideas proposed by the users and Physic : 

- Add a video downloader (Freedom Loader: https://github.com/MasterAcnolo/Freedom-Loader) instead of the Script (Expression) panel.
- More shakes presets and a better preview of the shakes on the hover (a way to make the wanted special effects on each buttons)
- Better theme on the  UI and Mbappe theme

## Table of Contents

* [Features](#-features)

* [Modules Overview](#-modules-overview)

  * [Workflow](#1-workflow)

  * [Curves](#2-curves)

  * [Effects & Scripts](#3-effects--scripts)

  * [SFX Library & Builder](#4-sfx-library--builder)

  * [Shakes](#5-shakes)

  * [FFmpeg Chain Builder](#6-ffmpeg-chain-builder)

  * [Colors](#7-colors)

* [Installation](#-installation)

* [Development & Tech Stack](#-development--tech-stack)

* [Customization & Extras](#-customization--extras)

* [License & Credits](#-license--credits)

## Features

* **Massive Feature Set:** Replaces dozens of single-purpose scripts with one unified panel.

* **Highly Customizable UI:** Fully customizable interface with RGB mode, seasonal themes, and adjustable animation speeds.

* **Cross-App Compatibility:** Full support for After Effects, with tailored features (SFX, FFMPEG, Colors) for Premiere Pro.

* **Discord RPC:** Show off your current AE project and rendering status directly on your Discord profile.

* **Multilingual:** Built-in language (English, French, Spanish, German, Hindi).

* **Easter Eggs:** Take a break while rendering with built-in mini-games (Cookie Clicker, 2048, CatPillar) that can be runned while rendering (only you you find them)

## Modules Overview

### 1. Workflow

 
Accelerate your daily timeline tasks with a single click:

* **Transform Tools:** 9-point anchor point alignment, quick rotation, and 1:1/1:2 scale fitting.

* **Layer Utilities:** Quickly spawn Nulls, Solids, Cameras, and Adjustment layers.

* **Time & Precomp:** Freeze frames, reverse time, sequence layers, and advanced pre-comping options.

* **Shortcuts:** Quick toggles for Frame Blending and Motion Blur.

### 2. Curves

 
Master your keyframe easing:

* **Live Graph Editor:** Visually edit Bézier curves with a fluid, interactive interface.

* **Copy/Paste Easing:** Extract curve data from selected keyframes and paste them anywhere.

* **Presets:** Save your favorite easing curves as 1-click preset tiles.

### 3. Effects & Scripts

 
Automate complex animations and manage heavy projects:

* **1-Click Tools:** Auto Cut (scene detection), Auto Beat Mark, Warp Stabilizer, and 3D Camera Tracker.

* **Heavy FX Toggle:** Temporarily disable 3rd-party plugins to speed up your preview frame rates.

* **FX Control Rig:** Generate a master Null layer to control multiple effects across different layers centrally.

* **Expression Builder:** A massive library of text animators, wiggles, and physics expressions. Create your own custom expressions with dynamic UI sliders using `{{variableID}}` syntax.

### 4. SFX Library & Builder

 
Manage your sound design without leaving Adobe:

* **Smart Library:** Import custom folders, preview audio on hover, and favorite your best sounds.

* **Smart Placement:** Auto-snap SFX to the playhead, the highest audio peak, or the nearest beat marker.

* **Audio FX Builder:** Apply parametric EQ, Reverb, Delay, High/Low pass filters, and automatic audio ducking (Lower). *Fully supports Premiere Pro audio effects!*

### 5. Shakes

 
Procedural, expression-based camera shakes:

* **Presets:** 14 built-in shake styles (Bouncy, Minimax, Flicker, Glitch, etc.).

* **Shake Builder:** Create custom shakes by adjusting X/Y intensity, rotation, zoom punch, bounces, and motion blur.

### 6. FFmpeg Chain Builder

 
A visual node-like builder for FFmpeg, allowing you to render and process video directly inside AE:

* **Build Chains:** Stack operations like Convert Format, Crop, Pad, Speed, Color Correction, Denoise, Bitrate, and Audio manipulation.

* **Auto-Import:** Renders are processed in the background and automatically imported and placed above your selected timeline clip.

### 7. Colors

 
Generate and apply color palettes instantly:

* **Harmonies:** Generate Monochromatic, Analogous, Complementary, Triadic, or Tetradic palettes based on a chosen hue.

* **Direct Apply:** Click a color to instantly copy its HEX code, or toggle "Apply Direct" to automatically add a Fill effect to your selected layer.

## Installation

### Prerequisites

* Adobe After Effects CC (or Premiere Pro for limited features) - 2021 + (some bugs can be found on the 2026 versions).

* *For developers:* Node.js and a CEP-compatible environment (like Bolt CEP).

### End-User Installation (ZXP)

1. Download the latest `.zxp` release from the [Releases page](https://github.com/Physicprog/ExcaliburFX/releases/latest).

2. Install using a ZXP Installer (e.g., [Aescripts ZXP Installer](https://aescripts.com/learn/zxp-installer/) or Anastasiy's Extension Manager).

3. Open After Effects, go to `Window > Extensions > ExcaliburFX`.

## Development & Tech Stack

ExcaliburFX is built using modern web technologies bridged with Adobe's ExtendScript via **Bolt CEP**.

* **Frontend Framework:** [Svelte](https://svelte.dev/)

* **Build Tool:** [Vite](https://vitejs.dev/)

* **Styling:** SCSS

* **Communication:** CEP (Common Extensibility Platform) & Node.js (`fs`, `child_process` for FFmpeg, `net` for Discord RPC).

### Local Setup

```bash
# Clone the repository
git clone https://github.com/Physicprog/ExcaliburFX.git

# Navigate to the directory
cd ExcaliburFX

# Install dependencies
npm install

# Run the development server (Hot Module Replacement enabled)
npm run dev
```

## Customization & Extras

* **Panel Layouts:** ExcaliburFX supports both horizontal and vertical docking. Use the settings menu to switch to "Vertical mode" and choose between Row/Column layouts.

* **Discord RPC:** Let your friends know what you're working on. Toggle this in the settings. (Will show "Rendering..." when AE is rendering).

* **Themes:** Type `/theme-name` in the Notes tab to activate hidden seasonal themes (`/theme-cat`, `/theme-ete`, `/theme-noel`, etc.). Currently it's only some particles but the goal would be to make draw elements on the interface.

## Easter Eggs

Working late? ExcaliburFX comes with fully playable mini-games hidden in the Credits tab.

* Click `Developer: Physic` to play **CatPillar**.

* Click `Scripting: Bolt` to play **2048**.

* Click the horizontal line under `Credit` to play **Cookie Clicker**.

## License & Credits

**Developer:** Physic

**All draws on video behinds games :** [@mallaubrl\_](https://www.instagram.com/mallaubrl_/)

I, (Physic), made all icons and animations using After Effect.

**Framework:** Powered by Svelte and Bolt CEP.

MIT License Copyright (c) Hyper Brew LLC / Physic. All rights reserved. All trademarks are property of their respective owners in the US and other countries.
