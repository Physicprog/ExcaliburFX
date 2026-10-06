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
    reverseKeyframesAction,
    UnPrecompose,
    speedToCursor,
    addMotionTile,
    SpeedChangeTo,
    getPreference,
    setPreference,
  } from "../../../lib/utils/main.js";

  import {
    layerColors,
    cameraFocalLength,
    createLayerCompOnSelected,
  } from "../../stores.js";

  let wrapperEl;
  let scaleFactor = 1;

  function normalizeMotionTileSize(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 200;
    return Math.min(1000, Math.max(100, Math.round(parsed)));
  }

  let motionTileBorderSize = normalizeMotionTileSize(
    getPreference("motionTileBorderSize") ?? 200,
  );
  let motionTileDraft = motionTileBorderSize;
  let isMotionTilePopupOpen = false;

  const REF_WIDTH = 395;
  const REF_HEIGHT = 360;

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

  function openMotionTileSettings(event) {
    event.preventDefault();
    event.stopPropagation();
    motionTileDraft = motionTileBorderSize;
    isMotionTilePopupOpen = true;
  }

  function closeMotionTileSettings() {
    isMotionTilePopupOpen = false;
  }

  function handleWorkflowClick(event) {
    if (
      isMotionTilePopupOpen &&
      !event.target.closest?.(".motion-tile-control")
    ) {
      closeMotionTileSettings();
    }
  }

  function handleWorkflowKeydown(event) {
    if (event.key === "Escape" && isMotionTilePopupOpen) {
      closeMotionTileSettings();
    }
  }

  function saveMotionTileSettings() {
    const borderSize = normalizeMotionTileSize(motionTileDraft);
    motionTileDraft = borderSize;
    motionTileBorderSize = borderSize;
    setPreference("motionTileBorderSize", borderSize);
    closeMotionTileSettings();
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

<svelte:window
  on:click={handleWorkflowClick}
  on:keydown={handleWorkflowKeydown}
/>

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
            <button
              class="anchor-btn"
              aria-label="Top left anchor"
              on:click={() => runAction(() => dragAnchorPoint("tl"))}
              ><span class="dot"></span></button
            >
            <button
              class="anchor-btn"
              aria-label="Top center anchor"
              on:click={() => runAction(() => dragAnchorPoint("tc"))}
              ><span class="dot"></span></button
            >
            <button
              class="anchor-btn"
              aria-label="Top right anchor"
              on:click={() => runAction(() => dragAnchorPoint("tr"))}
              ><span class="dot"></span></button
            >
            <button
              class="anchor-btn"
              aria-label="Center left anchor"
              on:click={() => runAction(() => dragAnchorPoint("cl"))}
              ><span class="dot"></span></button
            >
            <button
              class="anchor-btn center-btn"
              aria-label="Center anchor"
              on:click={() => runAction(() => dragAnchorPoint("cc"))}
              ><span class="dot dot-center"></span></button
            >
            <button
              class="anchor-btn"
              aria-label="Center right anchor"
              on:click={() => runAction(() => dragAnchorPoint("cr"))}
              ><span class="dot"></span></button
            >
            <button
              class="anchor-btn"
              aria-label="Bottom left anchor"
              on:click={() => runAction(() => dragAnchorPoint("bl"))}
              ><span class="dot"></span></button
            >
            <button
              class="anchor-btn"
              aria-label="Bottom center anchor"
              on:click={() => runAction(() => dragAnchorPoint("bc"))}
              ><span class="dot"></span></button
            >
            <button
              class="anchor-btn"
              aria-label="Bottom right anchor"
              on:click={() => runAction(() => dragAnchorPoint("br"))}
              ><span class="dot"></span></button
            >
          </div>

          <div class="col-actions">
            <button
              class="secondary-btn"
              on:click={() => runAction(() => applyRotation(15))}
              >Rotation +</button
            >
            <button
              class="secondary-btn"
              on:click={() => runAction(() => applyRotation(-15))}
              >Rotation -</button
            >
            <button
              class="secondary-btn"
              on:click={() => runAction(() => resetLayerRotation())}
              >Reset Rotation</button
            >
          </div>

          <div class="col-actions">
            <button
              class="secondary-btn"
              on:click={() => runAction(() => scaleCompToOneToOne(0.5))}
              >Scale to 1:2</button
            >
            <button
              class="secondary-btn"
              on:click={() => runAction(() => scaleCompToOneToOne(2))}
              >Scale to 2:1</button
            >
            <button
              class="secondary-btn"
              on:click={() => runAction(() => scaleCompToOneToOne(1))}
              >Fit To Comp</button
            >
          </div>

          <div class="col-actions">
            <button
              class="secondary-btn"
              on:click={() => runAction(() => Flip(1))}>Flip X</button
            >
            <button
              class="secondary-btn"
              on:click={() => runAction(() => Flip(2))}>Flip Y</button
            >
            <div class="row-gap">
              <button
                class="secondary-btn"
                on:click={() => runAction(() => applyIn())}
              >
                In
              </button>
              <button
                class="secondary-btn"
                on:click={() => runAction(() => applyOut())}
              >
                Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="workflow-lower">
      <div class="section-block block-layers">
        <div class="section-label">Layers</div>
        <div class="grid-2x3">
          <button
            class="secondary-btn"
            on:click={() => runAction(() => addSolidLayer($layerColors.solid))}
            >Solid</button
          >
          <button
            class="secondary-btn"
            on:click={() => runAction(() => addNullLayer($layerColors.null))}
            >Null</button
          >
          <button
            class="secondary-btn"
            on:click={() => runAction(() => addTextLayer($layerColors.text))}
            >Text</button
          >
          <button
            class="secondary-btn"
            on:click={() =>
              runAction(() =>
                addCameraLayer($layerColors.camera, $cameraFocalLength),
              )}>Camera</button
          >
          <button
            class="secondary-btn span-2"
            on:click={() =>
              runAction(() =>
                addAdjustmentLayer(
                  $layerColors.adjustment,
                  $createLayerCompOnSelected,
                ),
              )}>Adjustment Layer</button
          >
        </div>
      </div>

      <div class="section-block block-utils">
        <div class="section-label">Utilities</div>
        <div class="grid-utils">
          <button
            class="secondary-btn"
            on:click={() => runAction(() => trimCompToSelection())}
            >Trim Comp</button
          >
          <div class="motion-tile-control">
            <button
              class="secondary-btn"
              title="Click: apply | Right-click: settings"
              on:click={() =>
                runAction(() => addMotionTile(motionTileBorderSize))}
              on:contextmenu={openMotionTileSettings}>Motion Tile</button
            >
            {#if isMotionTilePopupOpen}
              <div class="motion-tile-popup" role="group">
                <label class="settings-label" for="motion-tile-size">
                  Motion Tile length size<span> </span></label
                >
                <input
                  id="motion-tile-size"
                  class="motion-tile-slider"
                  type="range"
                  min="100"
                  max="1000"
                  step="1"
                  bind:value={motionTileDraft}
                />
                <p class="motion-tile-number">{motionTileDraft}</p>
                <div class="motion-tile-actions">
                  <button
                    type="button"
                    class="motion-tile-cancel"
                    on:click={closeMotionTileSettings}>Cancel</button
                  >
                  <button
                    type="button"
                    class="motion-tile-save"
                    on:click={saveMotionTileSettings}>Save</button
                  >
                </div>
              </div>
            {/if}
          </div>
          <button
            class="secondary-btn"
            on:click={() => runAction(() => enableFrameBlending())}
            >Enable BF</button
          >
          <button
            class="secondary-btn"
            on:click={() => runAction(() => disableFrameBlending())}
            >Disable BF</button
          >
          <button
            class="secondary-btn"
            on:click={() => runAction(() => sequenceLayers())}>EMB</button
          >
          <button
            class="secondary-btn"
            on:click={() => runAction(() => sequenceLayersFromBottom())}
            >DMB</button
          >
        </div>
      </div>

      <div class="section-block block-speed">
        <div class="section-label">Speed</div>
        <div class="grid-speed">
          <button class="secondary-btn" on:click={() => speedToCursor()}
            >Speed to Cursor</button
          >
          <button class="secondary-btn" on:click={() => SpeedChangeTo(1)}
            >1x</button
          >
          <button class="secondary-btn" on:click={() => SpeedChangeTo(0.5)}
            >0.5x</button
          >
          <button class="secondary-btn" on:click={() => SpeedChangeTo(2)}
            >2x</button
          >
          <button class="secondary-btn" on:click={() => SpeedChangeTo(5)}
            >5x</button
          >
        </div>
      </div>

      <div class="section-block block-time">
        <div class="section-label">Time &amp; Precomp</div>
        <div class="grid-placeholders">
          <button class="secondary-btn" on:click={() => reverseTime()}
            >Reverse Layers</button
          >
          <button
            class="secondary-btn"
            on:click={() => reverseKeyframesAction()}
          >
            Reverse keyframes</button
          >
          <button class="secondary-btn" on:click={() => freezeFrame()}>
            Freeze Frame</button
          >
        </div>
        <div class="grid-compositions">
          <button
            class="secondary-btn"
            on:click={() => runAction(() => UnPrecompose())}
            >UnPre-compose</button
          >
          <button
            class="secondary-btn"
            on:click={() =>
              runAction(() =>
                createPrecompAllInOneWithSelection($layerColors.precompose),
              )}>Pre-compose All</button
          >
          <button
            class="secondary-btn"
            on:click={() =>
              runAction(() => createPrecompAllInOne($layerColors.precompose))}
            >Pre-compose Each</button
          >
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
  .row-transform {
    flex: 1.15;
  }
  .section-block {
    background-color: rgb(31, 31, 31);
    border: 1px solid rgb(50, 50, 50);
    border-radius: 4px;
    padding: 6px;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    flex: 1;
    min-width: 0;
    min-height: 0;
  }
  .block-layers {
    grid-column: 1;
    grid-row: 1;
  }
  .block-utils {
    grid-column: 2;
    grid-row: 1;
  }
  .block-speed {
    grid-column: 3;
    grid-row: 1 / 3;
  }
  .block-time {
    grid-column: 1 / 3;
    grid-row: 2;
  }
  .workflow-lower {
    display: grid;
    grid-template-columns: minmax(0, 0.8fr) minmax(0, 0.95fr) minmax(0, 0.55fr);
    grid-template-rows: minmax(0, 1fr) minmax(0, 0.9fr);
    gap: 8px;
    flex: 2.3;
    min-height: 0;
  }
  .section-label {
    font-size: 10px;
    font-weight: bold;
    text-transform: uppercase;
    text-align: center;
    color: #fff;
    margin: 0 0 5px;
    padding-bottom: 3px;
    border-bottom: 2px solid var(--activeColour, #007acc);
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
  .grid-2x3,
  .grid-utils {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(3, 1fr);
    gap: 4px;
    flex: 1;
  }
  .grid-speed {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: repeat(5, minmax(0, 1fr));
    gap: 4px;
    flex: 1;
  }
  .span-2 {
    grid-column: 1 / -1;
  }
  .grid-compositions {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: 1fr;
    gap: 5px;
    flex: 1;
  }
  .grid-placeholders {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: 1fr;
    gap: 5px;
    flex: 1;
    margin-bottom: 5px;
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
    background-color: var(--activeColour, #007acc);
  }
  .anchor-btn {
    background-color: rgb(37, 37, 37);
    border: 1px solid rgb(60, 60, 60);
  }
  .anchor-btn:hover {
    background-color: var(--activeColour, #007acc);
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
  .motion-tile-control {
    position: relative;
    min-width: 0;
    min-height: 0;
  }
  .motion-tile-control > .secondary-btn {
    height: 100%;
  }
  .motion-tile-popup {
    position: absolute;
    top: calc(100% + 5px);
    right: 0;
    z-index: 30;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 52px;
    align-items: center;
    gap: 5px 7px;
    width: min(200px, calc(100vw - 16px));
    box-sizing: border-box;
    padding: 6px;
    border: 1px solid #444;
    border-radius: 5px;
    background: #151515;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
  }
  .motion-tile-popup .settings-label {
    grid-column: 1 / -1;
    margin: 0;
    color: #aaa;
    font-size: 9px;
    font-weight: 600;
    line-height: 1.2;
  }
  .motion-tile-popup .settings-label span {
    flex-shrink: 0;
  }
  .motion-tile-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 95%;
    height: 5px;
    border-radius: 2.5px;
    outline: none;
    cursor: pointer;
    border: 1px solid #000;
    display: block;
  }
  .motion-tile-slider::-webkit-slider-runnable-track {
    height: 5px;
    border-radius: 2.5px;
    background: var(--activeColour, #007acc);
  }
  .motion-tile-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 6px;
    height: 9px;
    border-radius: 2px;
    background: #fff;
    border: 1px solid #000;
    box-shadow: 0 0 2px rgba(0, 0, 0, 0.6);
    cursor: pointer;
    margin-top: -2px;
  }
  .motion-tile-slider::-moz-range-track {
    height: 5px;
    border-radius: 2.5px;
    background: var(--activeColour, #007acc);
  }
  .motion-tile-slider::-moz-range-thumb {
    width: 5px;
    height: 8px;
    border-radius: 2px;
    background: #fff;
    border: 1px solid #000;
    cursor: pointer;
  }
  .motion-tile-number {
    min-width: 0;
    width: 52px;
    height: 22px;
    box-sizing: border-box;
    border-radius: 3px;
    color: #fff;
    margin-top: 15px;
    font-family: inherit;
    font-size: 12px;
    text-align: center;
  }
  .motion-tile-actions {
    grid-column: 1 / -1;
    display: flex;
    justify-content: flex-end;
    gap: 6px;
  }
  .motion-tile-actions button {
    width: auto;
    box-sizing: border-box;
    height: 22px;
    min-width: 48px;
    padding: 0 8px;
    border-radius: 3px;
    font-size: 12px;
  }
  .motion-tile-cancel {
    border: 1px solid #444;
    background: #252525;
    color: #bbb;
  }
  .motion-tile-cancel:hover {
    background: #333;
    color: #fff;
  }
  .motion-tile-save {
    background: var(--activeColour, #007acc);
    color: #fff;
  }
</style>
