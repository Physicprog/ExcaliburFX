<script>
  import { applyFillColor } from "../../../lib/utils/main.js";
  import Switch from "../../../assets/ui/switch.svg";
  import { TRANSITION_MS } from "../../stores.js";

  import {
    colorHarmonyMode,
    colorPresetMode,
    colorHue,
    colorSat,
    colorLight,
    colorActiveSource,
    colorApplyDirect,
    colorInverted,
  } from "../../stores.js";
 
  const PRESETS = {
    Blue: ["#00215E", "#023087", "#0D47A1", "#1565C0", "#1976D2", "#1E88E5", "#2196F3", "#42A5F5", "#64B5F6", "#90CAF9", "#BBDEFB", "#E3F2FD", "#3498DB", "#2980B9", "#1B4F72"],
    Green: ["#003300", "#084A12", "#1B5E20", "#2E7D32", "#388E3C", "#43A047", "#4CAF50", "#66BB6A", "#81C784", "#A5D6A7", "#C8E6C9", "#E8F5E9", "#27AE60", "#2ECC71", "#145A32"],
    Red: ["#4A0000", "#7D0000", "#B71C1C", "#C62828", "#D32F2F", "#E53935", "#F44336", "#EF5350", "#E74C3C", "#C0392B", "#FF1744", "#D50000", "#FF8A80", "#FFCDD2", "#FFEBEE"],
    "Orange/Yellow": ["#E65100", "#EF6C00", "#F57C00", "#FB8C00", "#FF9800", "#FFA726", "#FFB74D", "#FFCC80", "#FFE0B2", "#FFF3E0", "#F1C40F", "#F39C12", "#E67E22", "#FFC107", "#FFF8E1"],
    Purple: ["#4A148C", "#6A1B9A", "#7B1FA2", "#8E24AA", "#9C27B0", "#AB47BC", "#BA68C8", "#CE93D8", "#E1BEE7", "#F3E5F5", "#9B59B6", "#8E44AD", "#673AB7", "#5E35B1", "#311B92"],
    Pink: ["#880E4F", "#AD1457", "#C2185B", "#D81B60", "#E91E63", "#EC407A", "#F06292", "#F48FB1", "#F8BBD0", "#FCE4EC", "#FD79A8", "#FF4081", "#F50057", "#C51162", "#4A0024"],
    Brown: ["#3E2723", "#4E342E", "#5D4037", "#6D4C41", "#795548", "#8D6E63", "#A1887F", "#BCAAA4", "#D7CCC8", "#EFEBE9", "#8C6B5D", "#705346", "#543C33", "#382620", "#1E120D"],
    Neutrals: ["#000000", "#1A1A1A", "#333333", "#4D4D4D", "#666666", "#808080", "#999999", "#B3B3B3", "#CCCCCC", "#E6E6E6", "#F2F2F2", "#FFFFFF", "#2B2B2B", "#595959", "#A6A6A6"]
  };

  const HARMONIES = ["Monochromatic", "Analogous", "Complementary", "Triadic", "Tetradic"];

  let hexDisplay = "SELECT";
  let ringEl;
  let wheelEl;
  let wrapperWidth = 400;
  let draggingWheel = false;
  let draggingRing = false;
  let isLeftSemicircle = false;

  $: isPreset =$colorActiveSource === "preset";
  $: isSmall = wrapperWidth <= 350;

  function hslToHex(h, s, l) {
    h = ((h % 360) + 360) % 360;
    s = Math.min(100, Math.max(0, s)) / 100;
    l = Math.min(100, Math.max(0, l)) / 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;

    if (h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }

    const toHex = (v) => Math.round((v + m) * 255).toString(16).padStart(2, "0").toUpperCase();
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  function buildHueSet(f, h) {
    if (f === "Monochromatic") return [h];
    if (f === "Analogous") return [h - 40, h - 20, h, h + 20, h + 40];
    if (f === "Complementary") return [h, h + 180];
    if (f === "Triadic") return [h, h + 120, h + 240];
    if (f === "Tetradic") return [h, h + 90, h + 180, h + 270];
    return [h];
  }

  function generateHarmony(f, h, s, l) {
    const hues = buildHueSet(f, h);
    const perHue = Math.ceil(20 / hues.length);
    const spread = 45;
    const steps = Array.from({ length: perHue }, (_, i) => {
      if (perHue === 1) return l;
      const t = i / (perHue - 1);
      return Math.min(95, Math.max(5, l - spread / 2 + t * spread));
    });
    
    const colors = [];
    hues.forEach((hh) => steps.forEach((ll) => colors.push(hslToHex(hh, s, ll))));
    return colors.slice(0, 20);
  }

  $: palette = isPreset ? PRESETS[$colorPresetMode] : generateHarmony($colorHarmonyMode,$colorHue, $colorSat,$colorLight);
  $: baseHex = hslToHex($colorHue, $colorSat,$colorLight);

  function selectHarmony(e) {
    $colorHarmonyMode = e.target.value;
    $colorActiveSource = "harmony";
  }

  function selectPreset(e) {
    $colorPresetMode = e.target.value;
    $colorActiveSource = "preset";
  }

  function updateWheelFromPointer(clientX, clientY) {
    $colorActiveSource = "harmony";
    const rect = wheelEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const radius = rect.width / 2;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    $colorHue = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
    $colorSat = Math.min(1, dist / radius) * 100;
  }

  function updateRingFromPointer(clientX, clientY) {
    $colorActiveSource = "harmony";
    const rect = ringEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const angle = Math.atan2(dy, dx);
    
    isLeftSemicircle = Math.cos(angle) < 0;
    $colorLight = Math.max(0, Math.min(100, (1 - Math.sin(angle)) * 50));
  }

  function onWheelPointerDown(e) {
    e.stopPropagation();
    draggingWheel = true;
    updateWheelFromPointer(e.clientX, e.clientY);
  }

  function onRingPointerDown(e) {
    e.stopPropagation();
    draggingRing = true;
    updateRingFromPointer(e.clientX, e.clientY);
  }

  function onPointerMove(e) {
    if (draggingWheel) updateWheelFromPointer(e.clientX, e.clientY);
    if (draggingRing) updateRingFromPointer(e.clientX, e.clientY);
  }

  function onPointerUp() {
    draggingWheel = false;
    draggingRing = false;
  }

  $: Y_norm = 1 -$colorLight / 50;
  $: X_norm = Math.sqrt(Math.max(0, 1 - Y_norm * Y_norm)) * (isLeftSemicircle ? -1 : 1);
  $: ringPointerX = 50 + X_norm * 46.5;
  $: ringPointerY = 50 + Y_norm * 46.5;

  $: pointerX = 50 + ($colorSat / 100) * 50 * Math.cos(($colorHue * Math.PI) / 180);$: pointerY = 50 + ($colorSat / 100) * 50 * Math.sin(($colorHue * Math.PI) / 180);

  function copyToClipboardFallback(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
  }

  async function copyHex(hex) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(hex);
        return;
      } catch (e) {}
    }
    copyToClipboardFallback(hex);
  }

  async function applyFillToSelectedLayer(hex) {
    try { await applyFillColor(hex); } catch (e) {}
  }

  function onSwatchClick(hex) {
    hexDisplay = hex;
    if ($colorApplyDirect) {
      applyFillToSelectedLayer(hex);
    } else {
      copyHex(hex);
    }
  }
</script>

<svelte:window on:pointermove={onPointerMove} on:pointerup={onPointerUp} />

<div class="wrapper" bind:clientWidth={wrapperWidth} class:is-small={isSmall}>
  <div class="header">
    <div class="select-group">
      <div class="select-col">
        <span class="select-label">Harmonies</span>
        <select value={$colorHarmonyMode} on:change={selectHarmony} class="mode-select" class:active={!isPreset}>
          {#each HARMONIES as f}<option value={f}>{f}</option>{/each}
        </select>
      </div>

      <div class="select-col">
        <span class="select-label">Presets</span>
        <select value={$colorPresetMode} on:change={selectPreset} class="mode-select" class:active={isPreset}>
          {#each Object.keys(PRESETS) as p}<option value={p}>{p}</option>{/each}
        </select>
      </div>
    </div>

    <div class="header-actions">
      {#if !isSmall}
        <div class="hex-display" style="color:{isPreset ? palette[0] : baseHex}">
          {hexDisplay}
        </div>
      {/if}
      <button class="icon-btn switch-btn" title="Invert wheel / colors" on:click={() => ($colorInverted = !$colorInverted)}>
        <img src={Switch} alt="Switch" width="16" height="16" />
      </button>
    </div>
  </div>

  <div class="body" style="--anim-dur:{$TRANSITION_MS}ms;">
    <div class="wheel-col" class:disabled={isPreset} style="order: {isSmall ? ($colorInverted ? 2 : 1) : 0}; transform: {isSmall ? 'none' : `translateX(${$colorInverted ? 'calc(100% + 15px)' : '0%'})`};">
      <div class="wheel-container">
        <div class="ring-track" bind:this={ringEl} on:pointerdown={onRingPointerDown} role="slider" aria-valuenow={$colorLight} aria-label="Luminosity"></div>
        <div class="ring-pointer" style="left:{ringPointerX}%; top:{ringPointerY}%; background: hsl(0, 0%, {$colorLight}%);"></div>
        <div class="wheel-core" bind:this={wheelEl} on:pointerdown={onWheelPointerDown} role="slider" aria-label="Chromatic wheel" aria-valuenow={$colorHue}>
          <div class="wheel-pointer" style="left:{pointerX}%; top:{pointerY}%; background:{baseHex}"></div>
        </div>
      </div>
    </div>

    <div class="palette-col" style="order: {isSmall ? ($colorInverted ? 1 : 2) : 0}; transform: {isSmall ? 'none' : `translateX(${$colorInverted ? 'calc(-100% - 15px)' : '0%'})`};">
      <div class="palette-grid">
        {#each palette as hex}
          <button class="swatch" style="background:{hex}" title={hex} on:click={() => onSwatchClick(hex)}></button>
        {/each}
      </div>
    </div>
  </div>

  <div class="footer">
    <label class="toggle-wrapper" title="Apply Fill effect directly on selected layer">
      <div class="switch" style="--anim-dur: {$TRANSITION_MS}ms">
        <input type="checkbox" class="toggle" bind:checked={$colorApplyDirect} />
        <span class="slider">
          <span class="slider-text off">off</span>
          <span class="slider-text on">on</span>
          <span class="slider-thumb"></span>
        </span>
      </div>
      <span class="label-text">{$colorApplyDirect ? "Copy the selected color enabled" : "Color the selected layer enabled"}</span>
    </label>
  </div>
</div>

<style lang="scss">
  * {
    box-sizing: border-box;
    min-width: 0;
  }

  .wrapper {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    padding: 10px;
    gap: 12px;
    font-family: "Museo Sans", sans-serif;
    color: #fff;
    background-color: transparent;
    overflow: hidden;
  }

  .header {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 8px;
    flex-shrink: 0;
    width: 100%;
  }

  .select-group {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    flex: 1 1 120px;
  }

  .select-col {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1 1 80px;
  }

  .select-label {
    font-size: 10px;
    color: #999;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-left: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .mode-select {
    width: 100%;
    height: 28px;
    padding: 0 6px;
    background-color: #131313;
    border: 1px solid rgb(65, 65, 65);
    border-radius: 4px;
    color: #aaa;
    font-size: 11px;
    font-weight: 600;
    outline: none;
    cursor: pointer;
    transition: border-color 150ms, box-shadow 150ms;

    &.active {
      color: #fff;
      border-color: var(--activeColour, #444);
    }
    &:hover {
      border-color: #888;
    }
    &:focus {
      border-color: var(--activeColour, #444);
      box-shadow: 0 0 5px rgba(0, 0, 0, 0.4);
    }
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    margin-left: auto;
  }

  .hex-display {
    font-weight: 800;
    font-size: 13px;
    text-align: right;
    max-width: 80px;
    height: 28px;
    line-height: 28px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  }

  .icon-btn {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    border-radius: 4px;
    border: 1px solid rgb(65, 65, 65);
    background: #191919;
    color: #fff;
    cursor: pointer;
    padding: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: transform 0.15s;

    &:hover {
      background: #252525;
      transform: scale(1.05);
      border-color: var(--activeColour, #888);
    }
    &:active {
      transform: scale(0.95);
    }
  }

  .body {
    position: relative;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 15px;
    flex: 1;
    width: 100%;
    min-height: 0;
    overflow: hidden;
    padding: 2px 0;
    isolation: isolate;

    &::-webkit-scrollbar {
      width: 5px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: rgb(65, 65, 65);
      border-radius: 3px;
    }
  }

  .wheel-col,
  .palette-col {
    flex: 1 1 0;
    min-width: 150px;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: transform var(--anim-dur, 300ms) cubic-bezier(0.65, 0, 0.35, 1);
    will-change: transform;
  }

  .wheel-col.disabled {
    opacity: 0.25;
    pointer-events: none;
    filter: grayscale(80%);
    transition: transform var(--anim-dur, 300ms) cubic-bezier(0.65, 0, 0.35, 1), opacity 0.2s;
  }

  .wrapper.is-small .body {
    flex-wrap: wrap;
  }
  .wrapper.is-small .palette-col,
  .wrapper.is-small .wheel-col {
    flex-basis: 100%;
    min-width: 100%;
  }

  .wheel-container {
    position: relative;
    width: 100%;
    max-width: 200px;
    aspect-ratio: 1 / 1;
    margin: 0 auto;
    flex-shrink: 0;
  }

  .ring-track {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: linear-gradient(to bottom, #ffffff, #000000);
    -webkit-mask: radial-gradient(closest-side, transparent 85%, black 86%);
    mask: radial-gradient(closest-side, transparent 85%, black 86%);
    cursor: pointer;
    touch-action: none;
    z-index: 1;
  }

  .ring-pointer {
    position: absolute;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid #fff;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: 2;
  }

  .wheel-core {
    position: absolute;
    inset: 14%;
    border-radius: 50%;
    background: radial-gradient(circle closest-side, #ffffff 0%, rgba(255, 255, 255, 0) 35%), conic-gradient(from 0deg, red, yellow, lime, cyan, blue, magenta, red);
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1), 0 2px 8px rgba(0, 0, 0, 0.6);
    cursor: crosshair;
    touch-action: none;
    z-index: 3;
  }

  .wheel-pointer {
    position: absolute;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: 4;
  }

  .palette-grid {
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 6px;
  }

  .swatch {
    aspect-ratio: 1 / 1;
    width: 100%;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.1);
    padding: 0;
    transition: transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.15s, outline 0.1s;

    &:hover {
      transform: scale(1.08);
      z-index: 2;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
      outline: 2px solid #fff;
      outline-offset: -1px;
    }
    &:active {
      transform: scale(0.95);
    }
  }

  .footer {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    flex-shrink: 0;
    width: 100%;
    margin-top: auto;
    padding-top: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
  }

  .toggle-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    user-select: none;

    &:hover .slider {
      border-color: #666;
    }

    .label-text {
      font-size: 11px;
      color: #ccc;
      font-weight: 700;
      white-space: nowrap;
    }
  }

  .switch {
    --input-focus: var(--activeColour, #2d8cf0);
    --bg-color: #191919;
    --main-color: #444;
    --input-out-of-focus: #151515;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 50px;
    height: 24px;
  }

  .toggle {
    opacity: 0;
    width: 0;
    height: 0;
    position: absolute;
  }

  .slider {
    box-sizing: border-box;
    border-radius: 100px;
    border: 2px solid var(--main-color);
    box-shadow: 2px 2px var(--main-color);
    position: absolute;
    inset: 0;
    cursor: pointer;
    background-color: var(--input-out-of-focus);
  }

  .slider-text {
    position: absolute;
    top: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    font-size: 8px;
    font-weight: 700;
    pointer-events: none;
    transition: opacity var(--anim-dur, 0.3s) ease-in-out;

    &.off {
      right: 5px;
      color: #888;
      opacity: 1;
    }
    &.on {
      left: 6px;
      color: #fff;
      opacity: 0;
    }
  }

  .slider-thumb {
    position: absolute;
    height: 18px;
    width: 18px;
    left: 1px;
    bottom: 1px;
    border: 2px solid white;
    border-radius: 100px;
    background-color: var(--bg-color);
    transition: transform var(--anim-dur, 0.3s) ease-in-out;
  }

  .toggle:checked + .slider {
    background-color: var(--input-focus);
    .slider-thumb {
      transform: translateX(26px);
    }
    .slider-text.off {
      opacity: 0;
    }
    .slider-text.on {
      opacity: 1;
    }
  }
</style>