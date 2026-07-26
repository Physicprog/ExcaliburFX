<script>
  import { onMount, onDestroy } from "svelte";
  import {
    putGifToPNG,
    AnimationSpeed,
    Hue,
    Saturation,
    EnableRGBMode,
    RgbSpeed,
  } from "../../stores.js";
  import { resetPreferences } from "../../../lib/utils/main.js";
  import { csi } from "../../../lib/utils/bolt.ts";
  import { sendNotif } from "../../logic.js";
  import { callJSX } from "../../../lib/utils/main.js";
  let enableQuickActions = true;
  import {
    clearCacheWithVerification,
    saveIncremental,
  } from "../../../lib/utils/main.js";

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

  function SortProjectLayers() {
    if (typeof window !== "undefined" && window.__adobe_cep__) {
      callJSX("sortProject")
        .then(() => sendNotif("Projet trié avec succès !", true))
        .catch((err) =>
          sendNotif("Échec du tri du projet : " + err.message, false),
        );
    } else {
      sendNotif("Échec du tri du projet.", false);
    }
  }

  function handleReduceProject() {
    if (typeof window !== "undefined" && window.__adobe_cep__) {
      csi.evalScript(
        `function reduceToActiveComp() {
          var activeItem = app.project.activeItem;
          if (!activeItem || !(activeItem instanceof CompItem)) {
            return "NO_COMP_SELECTED";
          }
          app.beginUndoGroup("Reduce Project (ExFX)");
          try {
            var success = app.project.reduceProject([activeItem]);
            app.endUndoGroup();
            return success ? "REDUCED:" + activeItem.name : "NO_CHANGE";
          } catch (e) {
            app.endUndoGroup();
            return "ERROR:" + e.toString();
          }
        }
        reduceToActiveComp();`,
        (result) => {
          if (result === "NO_COMP_SELECTED") {
            sendNotif(
              "Sélectionnez d'abord la comp à conserver dans le panneau Projet.",
              false,
            );
          } else if (
            typeof result === "string" &&
            result.indexOf("REDUCED:") === 0
          ) {
            sendNotif(
              "Projet réduit à : " + result.slice(8) + " (Ctrl+Z pour annuler)",
              true,
            );
          } else if (result === "NO_CHANGE") {
            sendNotif("Aucun élément superflu à retirer.", true);
          } else {
            sendNotif("Échec de la réduction du projet.", false);
          }
        },
      );
    } else {
      sendNotif("Échec de la réduction du projet.", false);
    }
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
  const REF_HEIGHT = 340;

  let wrapperObserver;
  let contentObserver;
  let rafId = null;

  let naturalHeight = REF_HEIGHT;
  let availW = REF_WIDTH;
  let availH = REF_HEIGHT;

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
          <span class="checkbox" class:checked={enableQuickActions}>
            <input type="checkbox" bind:checked={enableQuickActions} />
          </span>
          <span>future add maybe</span>
        </label>
      </section>

      <section class="panel">
        <h2 class="panel-title">Shortcuts</h2>

        <div class="action-buttons-col">
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
                Restart ExFX</button
              >
            </div>
          </div>
        </div>
      </section>
    </div>

    <section class="panel panel-wide">
      <h2 class="panel-title">Panneau 3</h2>
      <p class="placeholder">À venir</p>
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
    overflow: hidden;
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
    margin: 0 auto; /* Remplace margin: 0px 3% pour un centrage plus propre */
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
    overflow-y: auto;
    padding: 6px 8px;
    box-sizing: border-box;
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

  .placeholder {
    font-size: 7px;
    color: var(--secondaryColour, #999);
    text-align: center;
    margin: 3px 0;
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

  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(3px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    animation: fadeIn 0.15s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes popIn {
    from {
      opacity: 0;
      transform: scale(0.96) translateY(4px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .PopUp {
    position: relative;
    width: 280px;
    max-width: 90vw;
    background-color: #1c1c1e;
    border: 1px solid #333;
    border-radius: 10px;
    box-shadow:
      0 12px 32px rgba(0, 0, 0, 0.5),
      0 0 0 1px rgba(255, 255, 255, 0.03) inset;
    padding: 20px 18px 16px;
    box-sizing: border-box;
    animation: popIn 0.15s ease-out;
    font-family: "Museo Sans", sans-serif;
  }

  .popup-icon {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    background: rgba(239, 68, 68, 0.12);
    color: #ef4444;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
  }

  .PopUp h3 {
    margin: 0 0 6px;
    font-size: 14px;
    font-weight: 600;
    color: #fff;
    letter-spacing: -0.1px;
  }

  .PopUp p {
    color: #9a9a9e;
    font-size: 11.5px;
    line-height: 1.5;
    margin: 0 0 18px;
  }

  .confirm-actions {
    display: flex;
    gap: 8px;
  }

  .confirm-actions .mini-btn {
    flex: 1;
    width: auto;
    height: 32px;
    margin: 0;
    font-size: 11.5px;
    font-weight: 500;
    border-radius: 6px;
    transition:
      filter 0.12s ease,
      transform 0.08s ease;
  }

  .confirm-actions .mini-btn:hover {
    transform: none;
    filter: brightness(1.12);
  }

  .confirm-actions .mini-btn:active {
    transform: scale(0.98);
  }

  .btn-cancel {
    background: #2c2c2e;
    color: #ddd;
    border: 1px solid #3a3a3c;
  }

  .btn-confirm {
    background: #ef4444;
    color: #fff;
    border: 1px solid #ef4444;
    font-weight: 600;
  }
</style>
