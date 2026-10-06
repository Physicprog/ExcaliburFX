<script>
  import { createEventDispatcher } from "svelte";
  import {
    bezierEase,
    cloneKeys,
    clamp,
    EASE_PRESETS,
    LINEAR_HANDLES,
  } from "./shakeModel.js";

  export let group;
  export let canReset = false;
  export let showFields = true;
  const dispatch = createEventDispatcher();
  const W = 300;
  const H = 140;
  const PAD = 10;
  const SAMPLES = 24;

  let svgEl;
  let keys = [];
  let dim = 0;
  let sel = 0;
  let drag = null;
  let allDims = true;
  let view = { fMax: 1, vMin: 0, vMax: 1 };

  $: syncFromGroup(group);
  $: segSel = keys.length < 2 ? -1 : sel < keys.length - 1 ? sel : sel - 1;
  $: paths = keys.slice(0, -1).map((_, i) => segPath(i, dim, keys, view));
  $: pts = keys.map((k) => ({ x: px(k.f, view), y: py(k.v[dim], view) }));
  $: handles = computeHandles(keys, segSel, dim, view);

  function syncFromGroup(g) {
    if (drag || !g) return;
    keys = cloneKeys(g.keys);
    if (dim >= g.dims.length) dim = 0;
    if (sel >= keys.length) sel = 0;
    recomputeView();
  }

  function recomputeView() {
    if (!keys.length) return;
    let vMin = Infinity;
    let vMax = -Infinity;
    for (const k of keys) {
      vMin = Math.min(vMin, k.v[dim]);
      vMax = Math.max(vMax, k.v[dim]);
    }
    const pad = (vMax - vMin) * 0.2 || 1;
    view = {
      fMax: Math.max(keys[keys.length - 1].f, 1),
      vMin: vMin - pad,
      vMax: vMax + pad,
    };
  }

  const px = (f, v) => PAD + (f / v.fMax) * (W - PAD * 2);
  const py = (val, v) =>
    H - PAD - ((val - v.vMin) / (v.vMax - v.vMin)) * (H - PAD * 2);
  const fx = (x) => ((x - PAD) / (W - PAD * 2)) * view.fMax;
  const vy = (y) =>
    view.vMin + ((H - PAD - y) / (H - PAD * 2)) * (view.vMax - view.vMin);

  function segPath(i, d, ks, v) {
    const a = ks[i];
    const b = ks[i + 1];
    const e = a.ease[d];
    if (e === "hold") {
      return `M ${px(a.f, v)} ${py(a.v[d], v)} H ${px(b.f, v)} V ${py(b.v[d], v)}`;
    }
    let out = "";
    for (let s = 0; s <= SAMPLES; s += 1) {
      const t = s / SAMPLES;
      const te = Array.isArray(e) ? bezierEase(t, e) : t;
      const f = a.f + (b.f - a.f) * t;
      const val = a.v[d] + (b.v[d] - a.v[d]) * te;
      out += `${s ? " L " : "M "}${px(f, v)} ${py(val, v)}`;
    }
    return out;
  }

  function computeHandles(ks, seg, d, v) {
    if (seg < 0 || !ks[seg]) return null;
    const a = ks[seg];
    const b = ks[seg + 1];
    if (a.ease[d] === "hold") return null;
    const e = Array.isArray(a.ease[d]) ? a.ease[d] : LINEAR_HANDLES;
    const dv = b.v[d] - a.v[d];
    const flat = Math.abs(dv) < 1e-9;
    return {
      ax: px(a.f, v),
      ay: py(a.v[d], v),
      bx: px(b.f, v),
      by: py(b.v[d], v),
      h1x: px(a.f + e[0] * (b.f - a.f), v),
      h1y: py(flat ? a.v[d] : a.v[d] + e[1] * dv, v),
      h2x: px(a.f + e[2] * (b.f - a.f), v),
      h2y: py(flat ? b.v[d] : a.v[d] + e[3] * dv, v),
    };
  }

  function toLocal(ev) {
    const r = svgEl.getBoundingClientRect();
    return {
      x: ((ev.clientX - r.left) * W) / r.width,
      y: ((ev.clientY - r.top) * H) / r.height,
    };
  }

  function startDrag(ev, type, i) {
    ev.preventDefault();
    ev.stopPropagation();
    if (type === "key") sel = i;
    drag = { type, i };
    ev.currentTarget.setPointerCapture?.(ev.pointerId);
  }

  function onMove(ev) {
    if (!drag) return;
    const { x, y } = toLocal(ev);
    if (drag.type === "key") {
      const k = keys[drag.i];
      const lo = drag.i > 0 ? keys[drag.i - 1].f + 0.1 : 0;
      const hi = drag.i < keys.length - 1 ? keys[drag.i + 1].f - 0.1 : Infinity;
      let f = fx(x);
      if (!ev.altKey) f = Math.round(f * 2) / 2;
      k.f = clamp(f, lo, hi);
      k.v[dim] = Math.round(vy(y) * 1e5) / 1e5;
      keys = keys;
      return;
    }
    const seg = segSel;
    const a = keys[seg];
    const b = keys[seg + 1];
    const span = b.f - a.f;
    const dv = b.v[dim] - a.v[dim];
    const cur = Array.isArray(a.ease[dim]) ? a.ease[dim] : LINEAR_HANDLES;
    const arr = [...cur];
    const xf = clamp((fx(x) - a.f) / span, 0, 1);
    const yf =
      Math.abs(dv) < 1e-9 ? null : clamp((vy(y) - a.v[dim]) / dv, -3, 4);
    const r = (n) => Math.round(n * 1000) / 1000;
    if (drag.type === "h1") {
      arr[0] = r(xf);
      if (yf !== null) arr[1] = r(yf);
    } else {
      arr[2] = r(xf);
      if (yf !== null) arr[3] = r(yf);
    }
    a.ease[dim] = arr;
    keys = keys;
  }

  function emit() {
    dispatch("change", { id: group.id, keys: cloneKeys(keys) });
  }

  function finishDrag() {
    if (!drag) return;
    const was = drag;
    drag = null;
    if (was) emit();
    recomputeView();
  }

  function selectKey(i) {
    sel = i;
    recomputeView();
  }

  function selectDim(d) {
    dim = d;
    recomputeView();
  }

  function applyPreset(value, everySegment) {
    if (keys.length < 2) return;
    const segs = everySegment ? keys.slice(0, -1).map((_, i) => i) : [segSel];
    for (const s of segs) {
      const dimsToSet = allDims ? keys[s].ease.map((_, d) => d) : [dim];
      for (const d of dimsToSet) {
        keys[s].ease[d] = Array.isArray(value) ? [...value] : value;
      }
    }
    keys = keys;
    emit();
  }

  function setKeyFrame(raw) {
    const n = parseFloat(raw);
    if (!Number.isFinite(n)) return;
    const lo = sel > 0 ? keys[sel - 1].f + 0.1 : 0;
    const hi = sel < keys.length - 1 ? keys[sel + 1].f - 0.1 : Infinity;
    keys[sel].f = clamp(n, lo, hi);
    keys = keys;
    emit();
    recomputeView();
  }

  function setKeyValue(d, raw) {
    const n = parseFloat(raw);
    if (!Number.isFinite(n)) return;
    keys[sel].v[d] = n / group.mul;
    keys = keys;
    emit();
    recomputeView();
  }

  function addKey() {
    if (keys.length < 1) return;
    const next = sel < keys.length - 1 ? sel + 1 : sel;
    const a = keys[sel];
    const b = keys[next];
    const f = next === sel ? a.f + 1 : (a.f + b.f) / 2;
    const v =
      next === sel ? [...a.v] : a.v.map((value, d) => (value + b.v[d]) / 2);
    const key = {
      f,
      v,
      ease: v.map(() => null),
    };
    keys = [...keys.slice(0, next), key, ...keys.slice(next)];
    sel = next;
    emit();
    recomputeView();
  }

  function removeKey() {
    if (keys.length <= 2) return;
    keys = keys.filter((_, i) => i !== sel);
    sel = Math.min(sel, keys.length - 1);
    emit();
    recomputeView();
  }

  const show = (n) => Math.round(n * 1000) / 1000;
</script>

<div class="graph">
  {#if group.dims.length > 1}
    <div class="dim-tabs">
      {#each group.dims as label, d}
        <button
          type="button"
          class:active={dim === d}
          on:click={() => selectDim(d)}>{label || d + 1}</button
        >
      {/each}
    </div>
  {/if}

  <div class="graph-row">
    <svg
      bind:this={svgEl}
      viewBox="0 0 {W} {H}"
      on:pointermove={onMove}
      on:pointerup={finishDrag}
      on:pointercancel={finishDrag}
    >
      <rect class="bg" x="0" y="0" width={W} height={H} />
      {#if view.vMin < 0 && view.vMax > 0}
        <line class="zero" x1="0" x2={W} y1={py(0, view)} y2={py(0, view)} />
      {/if}
      {#each paths as d, i}
        <path {d} class="curve" class:selected={i === segSel} />
        <path {d} class="hit" on:pointerdown={() => selectKey(i)} />
      {/each}
      {#if handles}
        <line
          class="stem"
          x1={handles.ax}
          y1={handles.ay}
          x2={handles.h1x}
          y2={handles.h1y}
        />
        <line
          class="stem"
          x1={handles.bx}
          y1={handles.by}
          x2={handles.h2x}
          y2={handles.h2y}
        />
        <circle
          class="handle"
          cx={handles.h1x}
          cy={handles.h1y}
          r="4"
          on:pointerdown={(e) => startDrag(e, "h1", 0)}
        />
        <circle
          class="handle"
          cx={handles.h2x}
          cy={handles.h2y}
          r="4"
          on:pointerdown={(e) => startDrag(e, "h2", 0)}
        />
      {/if}
      {#each pts as p, i}
        <circle
          class="key"
          class:selected={i === sel}
          cx={p.x}
          cy={p.y}
          r="4.5"
          on:pointerdown={(e) => startDrag(e, "key", i)}
        />
      {/each}
    </svg>

    <div class="editor-controls">
      <div class="curve-toolbar">
        {#each EASE_PRESETS as preset}
          <button
            type="button"
            title={preset.label}
            aria-label={preset.label}
            on:click={() => applyPreset(preset.value, false)}
            >{preset.label}</button
          >
        {/each}
        <label class="check">
          <input type="checkbox" bind:checked={allDims} />
          <span>All</span>
        </label>
        <button
          type="button"
          title="Copy this easing to every segment"
          on:click={() =>
            applyPreset(
              Array.isArray(keys[segSel]?.ease[dim])
                ? keys[segSel].ease[dim]
                : (keys[segSel]?.ease[dim] ?? null),
              true,
            )}>Copy all</button
        >
        {#if canReset}
          <button
            type="button"
            title="Reset curve"
            on:click={() => dispatch("reset", { id: group.id })}
            >Reset</button
          >
        {/if}
      </div>

      {#if showFields && keys[sel]}
        <div class="key-fields">
          <div class="key-actions">
            <button type="button" on:click={addKey}>Add key</button>
            <button type="button" on:click={removeKey} disabled={keys.length <= 2}>
              Remove
            </button>
          </div>
          <label>
            <span>Frame</span>
            <input
              type="number"
              step="0.5"
              value={show(keys[sel].f)}
              on:change={(e) => setKeyFrame(e.currentTarget.value)}
            />
          </label>
          {#each group.dims as label, d}
            <label>
              <span>{label || "Value"}{group.unit}</span>
              <input
                type="number"
                step="any"
                value={show(keys[sel].v[d] * group.mul)}
                on:change={(e) => setKeyValue(d, e.currentTarget.value)}
              />
            </label>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .graph {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    display: grid;
    gap: 5px;
    overflow-x: hidden;
    overflow-y: auto;
    container-type: inline-size;
    scrollbar-width: thin;
    scrollbar-color: var(--activeColour, #7657ef) transparent;
  }
  .graph-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(150px, 0.48fr);
    gap: 8px;
    align-items: start;
    min-width: 0;
  }
  .graph::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }
  .graph::-webkit-scrollbar-track {
    background: transparent;
  }
  .graph::-webkit-scrollbar-thumb {
    border-radius: 2px;
    background: var(--activeColour, #7657ef);
  }
  svg {
    width: 100%;
    height: auto;
    min-height: 130px;
    display: block;
    touch-action: none;
    user-select: none;
    overflow: visible;
    border: 1px solid rgb(60, 60, 60);
    border-radius: 3px;
    background: rgb(31, 31, 31);
  }
  .editor-controls {
    display: grid;
    gap: 5px;
    min-width: 0;
  }
  .bg {
    fill: #101010;
    min-width: 0;
    padding: 4px;
    border: 1px solid #333;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.02);
  }
  .zero {
    stroke: #333;
    stroke-width: 1;
  }
  .curve {
    fill: none;
    stroke: #8a8a8a;
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .curve.selected {
    stroke: var(--activeColour, #7657ef);
    stroke-width: 4;
  }
  .hit {
    fill: none;
    stroke: transparent;
    stroke-width: 12;
    cursor: pointer;
  }
  .stem {
    stroke: #666;
    stroke-width: 2;
    stroke-dasharray: 3 2;
  }
  .handle {
    fill: #fff;
    stroke: var(--activeColour, #7657ef);
    stroke-width: 3;
    cursor: grab;
  }
  .key {
    fill: #ddd;
    stroke: #000;
    stroke-width: 2;
    cursor: grab;
  }
  .key.selected {
    fill: var(--activeColour, #7657ef);
    stroke: #fff;
    r: 6px;
  }
  .dim-tabs,
  .curve-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
    align-items: center;
  }
  button {
    min-height: 22px;
    padding: 2px 7px;
    border: 0;
    border-radius: 4px;
    background: #292929;
    color: #fff;
    font: inherit;
    font-size: 10px;
    cursor: pointer;
  }
  .dim-tabs button.active {
    background: var(--activeColour, #7657ef);
  }
  .curve-toolbar button:hover,
  .curve-toolbar button:focus-visible,
  .dim-tabs button:hover,
  .dim-tabs button:focus-visible {
    background: var(--activeColour, #7657ef);
    outline: none;
  }
  .check {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #ccc;
    font-size: 10px;
  }
  .key-fields {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
    gap: 6px;
    padding: 5px;
    border: 1px solid #333;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.02);
  }
  .key-actions {
    grid-column: 1 / -1;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  button:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .key-fields label {
    display: grid;
    gap: 3px;
    color: #aaa;
    font-size: 10px;
  }
  .key-fields input {
    min-width: 0;
    padding: 4px;
    border: 1px solid #444;
    border-radius: 4px;
    background: #111;
    color: #fff;
  }
  @media (max-width: 320px) {
    .graph-row {
      grid-template-columns: 1fr;
    }
    svg {
      min-height: 110px;
    }
    .curve-toolbar button {
      flex: 1 1 auto;
      min-width: 0;
      padding-inline: 4px;
      font-size: 9px;
    }
    .key-fields {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (min-width: 321px) and (max-width: 520px) {
    .graph-row {
      grid-template-columns: minmax(0, 1fr) minmax(128px, 0.55fr);
      gap: 5px;
    }
    .curve-toolbar button {
      flex: 1 1 auto;
      min-width: 0;
      padding-inline: 4px;
      font-size: 9px;
    }
  }
  @container (max-width: 420px) {
    .graph-row {
      grid-template-columns: minmax(120px, 1fr) minmax(108px, 0.7fr);
      gap: 4px;
    }
    .editor-controls {
      gap: 3px;
    }
    .curve-toolbar button {
      flex: 1 1 auto;
      min-width: 0;
      padding-inline: 4px;
      font-size: 9px;
    }
    .key-fields {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 3px;
      padding: 3px;
    }
    .key-actions {
      gap: 2px;
    }
    .key-actions button {
      padding-inline: 3px;
      font-size: 9px;
    }
  }
</style>
