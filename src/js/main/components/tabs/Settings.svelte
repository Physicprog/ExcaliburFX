<script>
  import { onMount, onDestroy } from "svelte";
  import {
    putGifToPNG,
    AnimationSpeed,
    Hue,
    Saturation,
    EnableRGBMode,
    RgbSpeed,
    enableDiscordRPC,
    isOnlineStore,
    tabVisibility,
    order,
    tabLabels,
    layerColors,
    LAYER_TYPE_LABELS,
    cameraFocalLength,
    createLayerCompOnSelected,
  } from "../../stores.js";
  import { resetPreferences } from "../../../lib/utils/main.js";
  import { sendNotif } from "../../logic.js";
  import { callJSX } from "../../../lib/utils/main.js";
  import {
    clearCacheWithVerification,
    saveIncremental,
    SortProjectLayers,
    deleteUnusedItems,
  } from "../../../lib/utils/main.js";
  import ColorPicker from "../utils/ColorPicker.svelte";

  let showMenuDropdown = false;
  let showColorsDropdown = false;

  function toggleMenuDropdown() {
    showMenuDropdown = !showMenuDropdown;
    if (showMenuDropdown) showColorsDropdown = false;
  }

  function toggleColorsDropdown() {
    showColorsDropdown = !showColorsDropdown;
    if (showColorsDropdown) showMenuDropdown = false;
  }

  function closeAllDropdowns() {
    showMenuDropdown = false;
    showColorsDropdown = false;
  }

  function handleResetPreferences() {
    resetPreferences();

    setTimeout(() => {
      if (
        typeof window !== "undefined" &&
        typeof window.location !== "undefined"
      ) {
        window.location.reload();
      }
    }, 400);
  }

  function handleReloadExtension() {
    if (
      typeof window !== "undefined" &&
      typeof window.location !== "undefined"
    ) {
      window.location.reload();
    }
  }

  function handleClearCache() {
    clearCacheWithVerification(sendNotif, callJSX);
  }

  function handleSaveIncremental() {
    saveIncremental(sendNotif, callJSX);
  }

  function handleReduceProject() {
    deleteUnusedItems();
  }

  $: speedLabel = getSpeedLabel($AnimationSpeed);

  function getSpeedLabel(value) {
    const numValue = Number(value);
    if (numValue === 0) return "No animation";
    if (numValue === 300) return "Default animation";
    if (numValue === 500) return "Max animation";
    return numValue + "ms";
  }

  let wrapperEl;
  let tabViewEl;
  let scaleFactor = 1;

  const REF_WIDTH = 340;
  const REF_HEIGHT = 520;

  let wrapperObserver;
  let contentObserver;
  let rafId = null;

  function updateScale() {
    const usableW = availW;
    const usableH = availH;

    if (!usableW || !usableH) return;

    const scaleW = usableW / REF_WIDTH;
    const scaleH = usableH / naturalHeight;

    scaleFactor = Math.min(scaleW, scaleH);
  }

  function scheduleUpdate() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(updateScale);
  }

  let naturalHeight = REF_HEIGHT;
  let availW = REF_WIDTH;
  let availH = REF_HEIGHT;

  onMount(() => {
    if (wrapperEl) {
      const rect = wrapperEl.getBoundingClientRect();
      if (rect.width > 0) availW = rect.width;
      if (rect.height > 0) availH = rect.height;
    }
    if (tabViewEl) {
      const rect = tabViewEl.getBoundingClientRect();
      if (rect.height > 0) naturalHeight = rect.height;
    }
    updateScale();

    wrapperObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry.borderBoxSize && entry.borderBoxSize.length) {
        availW = entry.borderBoxSize[0].inlineSize;
        availH = entry.borderBoxSize[0].blockSize;
      } else {
        availW = entry.contentRect.width;
        availH = entry.contentRect.height;
      }
      scheduleUpdate();
    });

    contentObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry.borderBoxSize && entry.borderBoxSize.length) {
        naturalHeight = entry.borderBoxSize[0].blockSize || naturalHeight;
      } else {
        naturalHeight = entry.contentRect.height || naturalHeight;
      }
      scheduleUpdate();
    });

    if (wrapperEl) wrapperObserver.observe(wrapperEl, { box: "border-box" });
    if (tabViewEl) contentObserver.observe(tabViewEl, { box: "border-box" });
  });

  onDestroy(() => {
    if (wrapperObserver) wrapperObserver.disconnect();
    if (contentObserver) contentObserver.disconnect();
    if (rafId) cancelAnimationFrame(rafId);
  });

  function decreaseFocal() {
    if ($cameraFocalLength > 1) cameraFocalLength.update((value) => value - 1);
  }

  function increaseFocal() {
    if ($cameraFocalLength < 300)
      cameraFocalLength.update((value) => value + 1);
  }
</script>

<div class="settings-wrapper" bind:this={wrapperEl}>
  <div
    class="tab-view"
    bind:this={tabViewEl}
    style="
      transform: scale({scaleFactor});
      width: {REF_WIDTH}px;
    "
  >
    <div class="panels-top">
      <section class="panel">
        <h2 class="panel-title">Ui Settings</h2>

        <div class="ctrl" class:disabled={$EnableRGBMode}>
          <label for="hue-slider">UI color: {$Hue}</label>
          <input
            id="hue-slider"
            class="slider slider-hue"
            type="range"
            min="0"
            max="360"
            step="1"
            bind:value={$Hue}
            disabled={$EnableRGBMode}
          />
        </div>

        <label class="check-row">
          <span class="checkbox" class:checked={$EnableRGBMode}>
            <input type="checkbox" bind:checked={$EnableRGBMode} />
          </span>
          <span>Enable RGB mode</span>
        </label>

        <div class="ctrl" class:disabled={!$EnableRGBMode}>
          <label for="rgb-slider">RGB speed: {$RgbSpeed}ms</label>
          <input
            id="rgb-slider"
            class="slider slider-default"
            type="range"
            min="10"
            max="1000"
            step="10"
            bind:value={$RgbSpeed}
            disabled={!$EnableRGBMode}
          />
        </div>

        <div class="ctrl">
          <label for="saturation-slider">UI saturation: {$Saturation}%</label>
          <input
            id="saturation-slider"
            class="slider slider-saturation"
            type="range"
            min="0"
            max="100"
            step="1"
            bind:value={$Saturation}
          />
        </div>

        <label class="check-row">
          <span class="checkbox" class:checked={$putGifToPNG}>
            <input type="checkbox" bind:checked={$putGifToPNG} />
          </span>
          <span>Disable all icon animations</span>
        </label>

        <div class="ctrl">
          <label for="anim-slider">Animation Speed: {speedLabel}</label>
          <input
            id="anim-slider"
            class="slider slider-default"
            type="range"
            min="0"
            max="500"
            step="25"
            bind:value={$AnimationSpeed}
          />
        </div>

        <label class="check-row check-row-last-child">
          <span
            class="checkbox"
            class:checked={$enableDiscordRPC && $isOnlineStore}
          >
            <input
              type="checkbox"
              bind:checked={$enableDiscordRPC}
              disabled={!$isOnlineStore}
            />
          </span>
          <span
            >Enable Discord RPC {!$isOnlineStore
              ? "(You are offline)"
              : ""}</span
          >
        </label>
      </section>

      <section class="panel">
        <h2 class="panel-title">Shortcuts</h2>

        <div class="action-buttons-col">
          <div class="action-buttons-row">
            <button
              class="mini-btn reset-btn"
              on:click={handleResetPreferences}
            >
              Reset
            </button>
            <button
              class="mini-btn reload-btn"
              on:click={handleReloadExtension}
            >
              Restart EbFX</button
            >
          </div>
          <button class="mini-btn cache-btn" on:click={handleClearCache}>
            Clear Ae Disk Cache
          </button>

          <div class="action-buttons-col">
            <button class="mini-btn" on:click={handleSaveIncremental}
              >Open in a new instance</button
            >
            <button class="mini-btn" on:click={handleReduceProject}
              >Delete unused items</button
            >
            <button class="mini-btn" on:click={SortProjectLayers}
              >Sort Project</button
            >
          </div>
        </div>
      </section>
    </div>

    <section
      class="panel panel-wide"
      style="position: relative; overflow: visible; z-index: 9999;"
    >
      <h2 class="panel-title">Panel Options</h2>

      <div class="dropdown-buttons-row">
        <div class="menu-dropdown-container">
          <button
            class="mini-btn toggle-dropdown-btn"
            on:click={toggleMenuDropdown}
          >
            Manage Menus
          </button>

          {#if showMenuDropdown}
            <button
              type="button"
              class="dropdown-overlay"
              aria-label="Close dropdown"
              on:click={closeAllDropdowns}
            ></button>

            <div class="menus-popup popup-left">
              <div class="menus-pills">
                {#each order as tab}
                  {#if tab !== "settings"}
                    <button
                      type="button"
                      class="menu-pill"
                      class:active={$tabVisibility[tab] !== false}
                      on:click={() => {
                        $tabVisibility = {
                          ...$tabVisibility,
                          [tab]: $tabVisibility[tab] === false ? true : false,
                        };
                      }}
                    >
                      {$tabLabels[tab].full}
                    </button>
                  {/if}
                {/each}
              </div>
            </div>
          {/if}
        </div>

        <div class="menu-dropdown-container">
          <button
            class="mini-btn toggle-dropdown-btn"
            on:click={toggleColorsDropdown}
          >
            Layer Colors
          </button>

          {#if showColorsDropdown}
            <button
              type="button"
              class="dropdown-overlay"
              aria-label="Close dropdown"
              on:click={closeAllDropdowns}
            ></button>

            <div class="menus-popup popup-right">
              {#if $layerColors && LAYER_TYPE_LABELS}
                <div class="layer-colors-grid">
                  {#each Object.keys(LAYER_TYPE_LABELS) as key}
                    {#if $layerColors[key] !== undefined}
                      <ColorPicker
                        bind:value={$layerColors[key]}
                        label={LAYER_TYPE_LABELS[key]
                          .replace(/all in one/i, "")
                          .trim()}
                      />
                    {/if}
                  {/each}
                </div>
              {:else}
                <div class="loading-text">Loading Colors...</div>
              {/if}
            </div>
          {/if}
        </div>
      </div>

      <div class="ctrl focal-picker-ctrl">
        <label for="focal-input">Focal camera length</label>
        <div class="custom-number-picker">
          <button
            type="button"
            class="picker-btn minus-btn"
            aria-label="Decrease"
            on:click={decreaseFocal}>-</button
          >
          <input
            id="focal-input"
            type="number"
            class="picker-input"
            bind:value={$cameraFocalLength}
            min="1"
            max="300"
            step="1"
          />
          <button
            type="button"
            class="picker-btn plus-btn"
            aria-label="Increase"
            on:click={increaseFocal}>+</button
          >
        </div>
      </div>
      <div class="check-layer-comp">
        <label class="check-row">
          <span class="checkbox" class:checked={$createLayerCompOnSelected}>
            <input type="checkbox" bind:checked={$createLayerCompOnSelected} />
          </span>
          <span>Create Layer on each selected</span>
        </label>
      </div>
    </section>
  </div>
</div>

<style lang="scss">
  .settings-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
  }

  .tab-view {
    transform-origin: center center;
    padding: 4px;
    box-sizing: border-box;
    font-family: "Museo Sans", sans-serif;
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex-shrink: 0;
    overflow: visible;
  }

  .panels-top {
    display: flex;
    flex-wrap: nowrap;
    gap: 6px;
    width: 100%;
    flex-shrink: 0;

    .panel {
      flex: 1 1 0;
      width: 50%;
      height: 155px;
    }
  }

  .panel {
    background-color: #1a1a1a;
    border: 0.5px solid #5c5c5c;
    border-radius: 6px;
    padding: 6px;
    box-shadow: 0 0 4px rgba(0, 0, 0, 0.25);
    box-sizing: border-box;
  }

  .action-buttons-col {
    display: flex;
    flex-direction: column;
    gap: 7px;
    margin-top: 0px;
  }

  .action-buttons-row {
    display: grid;
    grid-template-columns: 1fr 1.8fr;
    gap: 3px;
    width: 94%;
    margin: 0 auto;
  }

  .mini-btn {
    width: 90%;
    height: 19px;
    margin: 0 auto;
    color: white;
    background-color: #313131;
    border-radius: 4px;
    outline: none;
    font-size: 8px;
    border: 1px solid rgba(104, 104, 104, 0.609);
    transition: transform 0.2s ease-in-out;
  }

  .mini-btn:hover {
    border-color: var(--activeColour);
    background-color: var(--activeColour);
    transform: scale(1.03);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.9);
  }

  .mini-btn:active {
    border-color: var(--activeColour);
    background-color: var(--activeColour);
    transform: scale(0.97);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.9);
  }

  section.panel.panel-wide {
    width: 100%;
    height: 130px;
    padding: 6px 8px;
    box-sizing: border-box;
  }

  .dropdown-buttons-row {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-top: 8px;
    width: 100%;
  }

  .focal-picker-ctrl {
    display: flex;
    justify-content: start;
    align-items: center;

    gap: 6px;
    margin-top: 10px;

    label {
      margin-bottom: 0;
    }
  }

  .custom-number-picker {
    display: inline-flex;
    align-items: center;
    border: 1px solid rgba(104, 104, 104, 0.609);
    border-radius: 4px;
    overflow: hidden;
    height: 15px;
    background-color: #0d0d0d;
  }

  .picker-btn {
    background-color: #313131;
    border: none;
    color: white;
    font-size: 9px;
    width: 16px;
    height: 15px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      background-color 0.2s ease,
      transform 0.1s ease;
  }

  .picker-btn:hover {
    background-color: var(--activeColour, #ff007f);
  }
  .picker-btn:active {
    background-color: var(--activeColour, #ff007f);
    transform: scale(0.9);
  }
  .picker-input {
    width: 35px;
    height: 100%;
    border: none;
    background-color: #0d0d0d;
    color: #fff;
    text-align: center;
    font-size: 8px;
    font-weight: bold;
    outline: none;
  }

  .picker-input::-webkit-outer-spin-button,
  .picker-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .menu-dropdown-container {
    position: relative;
    display: flex;
    flex: 1;
  }

  .toggle-dropdown-btn {
    width: 100%;
    cursor: pointer;
    position: relative;
    z-index: 102;
  }

  .dropdown-overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
    cursor: default;
    border: 0;
    padding: 0;
    background: transparent;
    appearance: none;
  }

  .menus-popup {
    position: absolute;
    bottom: calc(100% + 6px);
    width: 220px;
    background: #151515;
    border: 1px solid #444;
    border-radius: 6px;
    padding: 8px;
    z-index: 9999;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.6);
  }
  .popup-left {
    left: 0;
    transform-origin: bottom left;
    animation: popUpLeft var(--transition-ms, 150ms)
      cubic-bezier(0.2, 0.9, 0.3, 1) forwards;
  }

  .popup-right {
    right: 0;
    transform-origin: bottom right;
    animation: popUpRight var(--transition-ms, 150ms)
      cubic-bezier(0.2, 0.9, 0.3, 1) forwards;
  }

  @keyframes popUpLeft {
    from {
      opacity: 0;
      transform: translateY(10px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes popUpRight {
    from {
      opacity: 0;
      transform: translateY(10px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .check-layer-comp {
    margin-top: 6px;
  }

  .menus-pills {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 4px;
  }

  .menu-pill {
    background-color: #222;
    color: #666;
    border: 1px solid #444;
    border-radius: 4px;
    font-size: 7px;
    font-weight: bold;
    padding: 4px 6px;
    cursor: pointer;
    text-transform: uppercase;
    transition: all var(--transition-ms, 100ms) ease;

    &:hover {
      background-color: #333;
      color: #ccc;
    }

    &.active {
      background-color: var(--activeColour);
      border-color: var(--activeColour);
      color: #fff;
      box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
    }

    &:active {
      transform: scale(0.92);
    }
  }

  .layer-colors-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 4px;
    overflow: visible;
  }

  .loading-text {
    color: var(--activeColour, #ff007f);
    font-size: 9px;
    text-align: center;
    margin-top: 2px;
  }

  .panel-title {
    font-size: 8px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    text-align: center;
    color: #fff;
    margin: 0 0 5px;
    padding-bottom: 3px;
    border-bottom: 1px solid #2b2b2b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ctrl {
    margin-bottom: 4px;
    transition: opacity 0.15s ease;

    &:last-of-type {
      margin-bottom: 2px;
    }

    &.disabled {
      opacity: 0.4;
      pointer-events: none;
    }

    label {
      display: block;
      font-size: 6.5px;
      font-weight: bold;
      color: #ccc;
      margin-bottom: 2px;
      text-align: left;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .check-row-last-child {
    margin-top: 6px;
  }

  .check-row {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 4px;
    cursor: pointer;

    span:last-child {
      font-size: 6.5px;
      font-weight: bold;
      color: #ddd;
      text-align: left;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .checkbox {
    position: relative;
    width: 8px;
    height: 8px;
    border-radius: 2px;
    border: 1px solid #5c5c5c;
    background-color: #0d0d0d;
    flex-shrink: 0;
    transition:
      background-color 0.1s ease,
      border-color 0.1s ease;

    input {
      position: absolute;
      inset: 0;
      opacity: 0;
      margin: 0;
      cursor: pointer;
    }

    &.checked {
      background-color: var(--activeColour, #ff007f);
      border-color: var(--activeColour, #ff007f);
    }
  }

  .slider {
    -webkit-appearance: none;
    appearance: none;
    width: 95%;
    height: 5px;
    border-radius: 2.5px;
    outline: none;
    cursor: pointer;
    border: 1px solid #000;
    display: block;

    &::-webkit-slider-thumb {
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
    &::-moz-range-thumb {
      width: 5px;
      height: 8px;
      border-radius: 2px;
      background: #fff;
      border: 1px solid #000;
      cursor: pointer;
    }
  }

  .slider-default {
    background: var(--activeColour);
  }

  .slider-hue {
    background: linear-gradient(
      to right,
      hsl(0, 100%, 50%),
      hsl(60, 100%, 50%),
      hsl(120, 100%, 50%),
      hsl(180, 100%, 50%),
      hsl(240, 100%, 50%),
      hsl(300, 100%, 50%),
      hsl(360, 100%, 50%)
    );
  }

  .slider-saturation {
    background: linear-gradient(to right, #fff, var(--activeColour));
  }
</style>
