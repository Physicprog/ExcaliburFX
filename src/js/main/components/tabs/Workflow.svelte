<script>
  import { onMount, onDestroy } from "svelte";
  import {
    dragAnchorPoint,
    applyRotation,
    resetLayerRotation,
    scaleCompToOneToOne,
    addSolidLayer,
    addNullLayer,
    addTextLayer,
    addCameraLayer,
    addAdjustmentLayer,
    createPrecompAllInOneWithSelection,
    createPrecompAllInOne,
    sequenceLayersFromBottom,
    enableFrameBlending,
    disableFrameBlending,
    sequenceLayers,
    trimCompToSelection,
    applyIn,
    applyOut,
    Flip,
    freezeFrame,
    reverseTime,
    UnPrecompose,
    speedToCursor,
  } from "../../../lib/utils/main.js";

  import {
    layerColors,
    cameraFocalLength,
    createLayerCompOnSelected,
  } from "../../stores.js";

  let wrapperEl;
  let scaleFactor = 1;

  const REF_HEIGHT = 400;
  let REF_WIDTH = 450;

  let wrapperObserver;
  let rafId = null;

  function updateScale(w, h) {
    if (!w || !h) return;
    scaleFactor = Math.min(w / REF_WIDTH, h / REF_HEIGHT);
  }

  function scheduleUpdate(w, h) {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => updateScale(w, h));
  }

  async function runAction(fn) {
    try {
      await fn();
    } catch (e) {
      console.error(e);
    }
  }

  onMount(() => {
    if (wrapperEl) {
      const rect = wrapperEl.getBoundingClientRect();
      updateScale(rect.width, rect.height);
    }

    wrapperObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      scheduleUpdate(entry.contentRect.width, entry.contentRect.height);
    });

    if (wrapperEl) wrapperObserver.observe(wrapperEl);
  });

  onDestroy(() => {
    if (wrapperObserver) wrapperObserver.disconnect();
    if (rafId) cancelAnimationFrame(rafId);
  });
</script>

<div class="settings-wrapper" bind:this={wrapperEl}>
  <div
    class="ae-panel"
    style="
      transform: translate(-50%, -50%) scale({scaleFactor});
      width: {REF_WIDTH}px;
      height: {REF_HEIGHT}px;
    "
  >
    <div class="row row-transform">
      <div class="section-block">
        <div class="section-label">Transform</div>
        <div class="transform-container">
          <div class="grid-anchor">
            <button class="anchor-btn" on:click={() => runAction(() => dragAnchorPoint("tl"))}><span class="dot"></span></button>
            <button class="anchor-btn" on:click={() => runAction(() => dragAnchorPoint("tc"))}><span class="dot"></span></button>
            <button class="anchor-btn" on:click={() => runAction(() => dragAnchorPoint("tr"))}><span class="dot"></span></button>
            <button class="anchor-btn" on:click={() => runAction(() => dragAnchorPoint("cl"))}><span class="dot"></span></button>
            <button class="anchor-btn center-btn" on:click={() => runAction(() => dragAnchorPoint("cc"))}><span class="dot dot-center"></span></button>
            <button class="anchor-btn" on:click={() => runAction(() => dragAnchorPoint("cr"))}><span class="dot"></span></button>
            <button class="anchor-btn" on:click={() => runAction(() => dragAnchorPoint("bl"))}><span class="dot"></span></button>
            <button class="anchor-btn" on:click={() => runAction(() => dragAnchorPoint("bc"))}><span class="dot"></span></button>
            <button class="anchor-btn" on:click={() => runAction(() => dragAnchorPoint("br"))}><span class="dot"></span></button>
          </div>

          <div class="col-actions">
            <button class="secondary-btn" on:click={() => runAction(() => applyRotation(15))}>Rotation +</button>
            <button class="secondary-btn" on:click={() => runAction(() => applyRotation(-15))}>Rotation -</button>
            <button class="secondary-btn" on:click={() => runAction(() => resetLayerRotation())}>Reset Rotation</button>
          </div>

          <div class="col-actions">
            <button class="secondary-btn" on:click={() => runAction(() => scaleCompToOneToOne(100))}>Scale to 1:1</button>
            <button class="secondary-btn" on:click={() => runAction(() => scaleCompToOneToOne(200))}>Scale to 2:1</button>
            <button class="secondary-btn" on:click={() => runAction(() => scaleCompToOneToOne("reset"))}>Reset Scale</button>
          </div>

          <div class="col-actions">
            <button class="secondary-btn" on:click={() => runAction(() => disableFrameBlending())}>Disable BF</button>
            <button class="secondary-btn" on:click={() => runAction(() => enableFrameBlending())}>Enable BF</button>
            <div class="row-gap">
              <button class="secondary-btn" on:click={() => runAction(() => sequenceLayersFromBottom())}>↓</button>
              <button class="secondary-btn" on:click={() => runAction(() => sequenceLayers())}>↑</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row row-mid">
      <div class="section-block block-layers">
        <div class="section-label">Layers</div>
        <div class="grid-2x3">
          <button class="secondary-btn" on:click={() => runAction(() => addSolidLayer($layerColors.solid))}>Solid</button>
          <button class="secondary-btn" on:click={() => runAction(() => addNullLayer($layerColors.null))}>Null</button>
          <button class="secondary-btn" on:click={() => runAction(() => addTextLayer($layerColors.text))}>Text</button>
          <button class="secondary-btn" on:click={() => runAction(() => addCameraLayer($layerColors.camera, $cameraFocalLength))}>Camera</button>
          <button class="secondary-btn span-2" on:click={() => runAction(() => addAdjustmentLayer($layerColors.adjustment, $createLayerCompOnSelected))}>Adjustment Layer</button>
        </div>
      </div>

      <div class="section-block block-utils">
        <div class="section-label">Utilities</div>
        <div class="grid-utils">
          <button class="secondary-btn span-2" on:click={() => runAction(() => trimCompToSelection())}>Trim Comp</button>
          <button class="secondary-btn" on:click={() => runAction(() => Flip(1))}>Flip X</button>
          <button class="secondary-btn" on:click={() => runAction(() => Flip(2))}>Flip Y</button>
          <button class="secondary-btn" on:click={() => runAction(() => applyIn())}>In</button>
          <button class="secondary-btn" on:click={() => runAction(() => applyOut())}>Out</button>
        </div>
      </div>
    </div>

    <div class="row row-time">
      <div class="section-block">
        <div class="section-label">Time &amp; Precomp</div>
        <div class="grid-3x2">
          <button class="secondary-btn" on:click={() => runAction(() => freezeFrame())}>Freeze</button>
          <button class="secondary-btn" on:click={() => runAction(() => reverseTime())}>Reverse</button>
          <button class="secondary-btn" on:click={() => runAction(() => speedToCursor())}>Speed to Cursor</button>
          <button class="secondary-btn" on:click={() => runAction(() => UnPrecompose())}>UnPre-compose</button>
          <button class="secondary-btn" on:click={() => runAction(() => createPrecompAllInOneWithSelection($layerColors.precompose))}>Pre-compose All</button>
          <button class="secondary-btn" on:click={() => runAction(() => createPrecompAllInOne($layerColors.precompose))}>Pre-compose Each</button>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .settings-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    font-family: "Museo sans";
  }
  .ae-panel {
    position: absolute;
    top: 50%;
    left: 50%;
    transform-origin: center center;
    border-radius: 6px;
    padding: 8px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow: hidden;
  }
  .row {
    display: flex;
    gap: 8px;
    width: 100%;
  }
  .row-transform { flex: 1.15; }
  .row-mid { flex: 0.95; }
  .row-time { flex: 0.9; }

  .section-block {
    background-color: rgb(31, 31, 31);
    border: 1px solid rgb(50, 50, 50);
    border-radius: 4px;
    padding: 6px;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    flex: 1;
  }
  .block-layers { flex: 0.45; }
  .block-utils { flex: 0.55; }
  .section-label {
    font-size: 10px;
    font-weight: bold;
    text-transform: uppercase;
    text-align: center;
    color: #fff;
    margin: 0 0 5px;
    padding-bottom: 3px;
    border-bottom: 1px solid #2b2b2b;
  }
  .transform-container {
    display: flex;
    gap: 6px;
    flex: 1;
    width: 100%;
  }
  .grid-anchor {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
    gap: 3px;
    aspect-ratio: 1;
    height: 100%;
    max-width: 38%;
  }
  .col-actions {
    display: grid;
    grid-template-rows: repeat(3, 1fr);
    gap: 4px;
    flex: 1.4;
  }
  .row-gap {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 5px;
    height: 100%;
    width: 100%;
  }
  .grid-2x3, .grid-utils {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(3, 1fr);
    gap: 4px;
    flex: 1;
  }
  .span-2 {
    grid-column: 1 / -1;
  }
  .grid-3x2 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 5px;
    flex: 1;
  }
  button {
    margin: 0;
    padding: 0 2px;
    box-sizing: border-box;
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 3px;
    cursor: pointer;
    font-weight: 600;
    font-size: 10px;
    border: none;
    outline: none;
  }
  .secondary-btn {
    background-color: rgb(55, 55, 55);
    color: #fff;
    border: 1px solid rgb(75, 75, 75);
  }
  .secondary-btn:hover {
    background-color: #007acc;
  }
  .anchor-btn {
    background-color: rgb(37, 37, 37);
    border: 1px solid rgb(60, 60, 60);
  }
  .anchor-btn:hover {
    background-color: #007acc;
  }
  .anchor-btn:hover .dot {
    background-color: #fff;
  }
  .dot {
    display: block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: rgb(130, 130, 130);
  }
  .dot-center {
    width: 10px;
    height: 10px;
    background-color: #fff;
  }
</style>