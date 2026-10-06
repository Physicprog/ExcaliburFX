<script>
  export let vertical = false;

  import { onMount } from "svelte";
  import {
    HOST,
    HOST_TABS,
    tabLabels,
    volumeState,
    activeTab,
    showDashboard,
    isCollapsed,
    isVerticalMode,
    sidebarLayout,
    LogoStatic,
    FPS,
    CURRENT_VERSION,
    tabVisibility,
    showFPS,
  } from "../stores.js";

  import { selectTab, toggleDashboard, toggleCollapse } from "../logic.js";

  import volumeMuteImg from "../../assets/volume/volume-mute.png";
  import volumeLowImg from "../../assets/volume/volume-low.png";
  import volumeHighImg from "../../assets/volume/volume-high.png";
  const Volume = {
    mute: { img: volumeMuteImg, alt: "Volume Mute" },
    low: { img: volumeLowImg, alt: "Volume Low" },
    high: { img: volumeHighImg, alt: "Volume High" },
  };

  const hostTabs = HOST_TABS[HOST];

  import SidebarSoundUrl from "../../assets/volume/click.mp3";
  let sidebarClickAudio = null;
  let volumePanelPinned = false;

  function ensureSidebarAudio() {
    if (typeof window === "undefined") return null;

    if (!sidebarClickAudio) {
      sidebarClickAudio = new Audio(SidebarSoundUrl);
      sidebarClickAudio.preload = "auto";
      sidebarClickAudio.load();
    }

    return sidebarClickAudio;
  }

  onMount(() => {
    ensureSidebarAudio();

    function closeVolumePanelOnOutsideClick(event) {
      if (!event.target.closest?.(".volume-control")) {
        volumePanelPinned = false;
      }
    }

    document.addEventListener("click", closeVolumePanelOnOutsideClick);
    return () => {
      document.removeEventListener("click", closeVolumePanelOnOutsideClick);
    };
  });

  function toggleVolumePanel() {
    volumePanelPinned = !volumePanelPinned;
  }

  function playSidebarSound() {
    if ($volumeState <= 0) return;

    const audio = ensureSidebarAudio();
    if (!audio) return;

    audio.volume = $volumeState / 100;
    audio.currentTime = 0;
    audio.play().catch((error) => {
      console.warn("[Excalibur] Sidebar click sound failed:", error);
    });
  }

  function handleSidebarAction(action) {
    playSidebarSound();
    action();
  }

  function maskStyle(path) {
    return `-webkit-mask-image:url(${path});mask-image:url(${path});`;
  }

  function positionVolumePanel(node, isVertical) {
    const PANEL_W = 42;
    const PANEL_H = 132;
    const MARGIN = 4;

    function updatePosition() {
      const rect = node.getBoundingClientRect();

      if (isVertical) {
        const centerX = Math.max(
          PANEL_W / 2 + MARGIN,
          Math.min(
            window.innerWidth - PANEL_W / 2 - MARGIN,
            rect.left + rect.width / 2,
          ),
        );

        const fitsAbove = rect.top >= PANEL_H + MARGIN;
        const fitsBelow = rect.bottom + PANEL_H + MARGIN <= window.innerHeight;
        const placeAbove = fitsAbove || !fitsBelow;

        const top = placeAbove
          ? Math.max(PANEL_H + MARGIN, rect.top)
          : Math.min(window.innerHeight - PANEL_H - MARGIN, rect.bottom);

        node.style.setProperty("--volume-panel-left", `${centerX}px`);
        node.style.setProperty("--volume-panel-top", `${top}px`);
        node.style.setProperty(
          "--volume-panel-shift",
          placeAbove ? "-100%" : "0%",
        );
      } else {
        node.style.setProperty("--volume-panel-left", `${rect.right + 5}px`);
        node.style.setProperty(
          "--volume-panel-top",
          `${rect.top + rect.height / 2}px`,
        );
      }
    }

    node.addEventListener("mouseenter", updatePosition);
    node.addEventListener("focusin", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    updatePosition();

    return {
      update(value) {
        isVertical = value;
        updatePosition();
      },
      destroy() {
        node.removeEventListener("mouseenter", updatePosition);
        node.removeEventListener("focusin", updatePosition);
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      },
    };
  }

  function wheelToHorizontal(node) {
    function onWheel(e) {
      const overflowsX = node.scrollWidth > node.clientWidth + 1;
      const overflowsY = node.scrollHeight > node.clientHeight + 1;
      if (overflowsX && !overflowsY && e.deltaY && !e.deltaX) {
        node.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    }
    node.addEventListener("wheel", onWheel, { passive: false });
    return {
      destroy() {
        node.removeEventListener("wheel", onWheel);
      },
    };
  }
  $: isVert = vertical || $isVerticalMode;
  $: logoMaskStyle = maskStyle($LogoStatic);
</script>

<nav
  class="sidebar"
  class:collapsed={$isCollapsed && !isVert}
  class:vertical={isVert}
  class:column={isVert && $sidebarLayout === "column"}
>
  {#if !isVert}
    <div class="sidebar-header">
      <button
        type="button"
        class="btn-dashboard-trigger"
        class:active={$showDashboard}
        on:click={() => handleSidebarAction(toggleDashboard)}
      >
        {#if $isCollapsed}
          <span
            class="icon-mask logo-icon"
            style={logoMaskStyle}
            aria-label="Excalibur"
          ></span>
        {:else}
          <div class="brand-container">
            <span class="brand-title">
              EXCALIBUR <span class="brand-fx">FX</span>
            </span>
            <span class="brand-version">Version {$CURRENT_VERSION}</span>
          </div>
        {/if}
      </button>
    </div>
  {/if}
  <div class="nav-buttons" use:wheelToHorizontal>
    {#each hostTabs as tab}
      {#if tab !== "settings" && $tabVisibility[tab] !== false}
        <button
          type="button"
          class:active={$activeTab === tab && !$showDashboard}
          title={$tabLabels[tab].full}
          on:click={() => handleSidebarAction(() => selectTab(tab))}
        >
          {#if $isCollapsed || isVert}
            {#if $tabLabels[tab].isIcon}
              <span
                class="icon-mask nav-icon"
                style={maskStyle($tabLabels[tab].short)}
                aria-label={$tabLabels[tab].full}
              ></span>
            {:else}
              {$tabLabels[tab].short}
            {/if}
          {:else}
            {$tabLabels[tab].full}
          {/if}
        </button>
      {/if}
    {/each}
    <div class="settings-row">
      <button
        type="button"
        class="btn-settings"
        class:active={$activeTab === "settings" && !$showDashboard}
        on:click={() => handleSidebarAction(() => selectTab("settings"))}
        title={$tabLabels.settings.full}
      >
        <span
          class="icon-mask nav-icon"
          style={maskStyle($tabLabels.settings.short)}
          aria-label={$tabLabels.settings.full}
        ></span>
      </button>
      <div
        class="volume-control"
        class:is-pinned={volumePanelPinned}
        use:positionVolumePanel={isVert}
      >
        <button
          type="button"
          class="btn-volume"
          class:is-active={volumePanelPinned}
          aria-label="Volume"
          aria-expanded={volumePanelPinned}
          on:click={toggleVolumePanel}
        >
          <img
            src={Volume[
              $volumeState === 0 ? "mute" : $volumeState <= 30 ? "low" : "high"
            ].img}
            alt=""
            class="volume-img"
            decoding="async"
          />
        </button>
        <div class="volume-slider-panel">
          <div class="volume-slider-wrap">
            <input
              type="range"
              class="volume-slider"
              min="0"
              max="100"
              step="1"
              bind:value={$volumeState}
              aria-label="Interface volume"
              aria-valuetext={`${$volumeState}%`}
            />
          </div>
          <span class="volume-value">{$volumeState}%</span>
        </div>
      </div>
    </div>

    <!-- Mode vertical : logo / Dashboard à la suite des settings, dans la liste scrollable -->
    {#if isVert}
      <button
        type="button"
        class="btn-logo"
        class:active={$showDashboard}
        title="Dashboard"
        on:click={() => handleSidebarAction(toggleDashboard)}
      >
        <span
          class="icon-mask nav-icon"
          style={logoMaskStyle}
          aria-label="Excalibur"
        ></span>
      </button>
    {/if}
  </div>

  <div class="sidebar-footer">
    <div class="footer-row">
      <button
        type="button"
        class="btn-collapse-trigger"
        on:click={() => handleSidebarAction(toggleCollapse)}
      >
        {$isCollapsed ? "Expand" : "Collapse"}
      </button>

      {#if $showFPS && !isVert}
        <span class="fps-counter">
          {$FPS}{#if !$isCollapsed}&nbsp;FPS{/if}
        </span>
      {/if}
    </div>
  </div>
</nav>

<style lang="scss">
  .sidebar {
    font-family: "Museo Sans", sans-serif;
    font-size: 13px;
    font-weight: bold;
    letter-spacing: 2px;
    width: 100px;
    min-width: 100px;
    max-width: 100px;
    background-color: #222;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    position: relative;
    z-index: 200;
    padding-top: 15px;

    &.collapsed {
      width: 55px;
      min-width: 55px;
      max-width: 55px;
    }
  }

  .sidebar-header {
    flex-shrink: 0;
  }

  .icon-mask {
    display: inline-block;
    width: 28px;
    height: 28px;
    background-color: var(--activeColour);
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
    -webkit-mask-position: center;
    mask-position: center;
    -webkit-mask-size: contain;
    mask-size: contain;
    opacity: 0.9;
    pointer-events: none;
    transition:
      opacity 0.15s ease,
      transform 0.15s ease;
  }

  .logo-icon {
    margin-top: -10px;
  }

  .btn-dashboard-trigger:hover .icon-mask,
  .btn-dashboard-trigger.active .icon-mask {
    opacity: 1;
    transform: scale(1.05);
  }

  .btn-dashboard-trigger {
    background: none;
    border: none;
    margin: 0 auto;
    padding: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    transition: transform 0.15s ease;

    &:hover {
      transform: scale(1.02);
    }
  }

  .fps-counter {
    font-family: "CreamyChicken";
    font-size: 9px;
    font-weight: 100;
    color: var(--activeColour);
    margin-top: 1px;
    letter-spacing: 1px;
  }

  .brand-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    width: 100%;
  }

  .brand-title {
    font-size: 12px;
    font-weight: 900;
    color: var(--secondaryColour);
    paint-order: stroke fill;
    transition: filter 0.15s ease;

    &:hover {
      filter: brightness(1.2);
    }
  }

  .brand-fx {
    color: var(--activeColour);
    paint-order: stroke fill;
  }

  .brand-version {
    font-size: 11px;
    color: var(--activeColour);
    margin-top: 2px;
    transition: font-size 0.15s ease;
  }

  .nav-buttons {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    margin-top: 5px;
    border-top: 1px solid #666666;
    padding: 5px 0 5px;

    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background-color: var(--thumb-colour, var(--activeColour));
      border-radius: 4px;
    }
  }

  .nav-buttons button,
  .btn-settings {
    width: 90px;
    height: 32px;
    flex-shrink: 0;
    margin: 3px auto;
    background-color: var(--primaryColour);
    color: var(--secondaryColour);
    border: 0.5px solid #5c5c5c;
    border-radius: 10px;
    font-size: 14px;
    text-transform: capitalize;
    cursor: pointer;
    outline: none;
    display: flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
    overflow: hidden;
    opacity: 0.9;
    transition:
      transform 0.1s ease,
      opacity 0.1s ease,
      box-shadow 0.1s ease;

    &:hover {
      opacity: 1;
      transform: scale(1.03);
      color: #fff;
    }

    &:active {
      transform: scale(0.95);
    }

    &.active {
      opacity: 1;
      color: #fff;
      background-color: var(--activeColour);
      border-color: var(--activeColour);
      box-shadow: 0 0 4px rgba(0, 0, 0, 0.25);
    }

    &.active .icon-mask {
      background-color: #fff;
      opacity: 1;
    }
  }

  .sidebar-footer {
    width: 100%;
    margin-top: auto;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 3px 0 4px;
    border-top: 1px solid #666666;
    gap: 3px;
    text-align: center;
    z-index: 5000;

    .footer-row {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      width: 100%;
    }

    .btn-collapse-trigger {
      background: none;
      border: 1px solid transparent;
      color: #777;
      width: auto;
      height: 20px;
      font-size: 10px;
      margin: 0;
      cursor: pointer;
      transition: color 0.15s ease;

      &:hover {
        color: #fff;
      }
    }
  }

  .sidebar.collapsed .sidebar-footer .footer-row {
    flex-direction: column;
    gap: 4px;
  }

  .settings-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 0px;
    flex-shrink: 0;
    position: relative;
    z-index: 6000;
  }

  .volume-control {
    position: relative;
    z-index: 6000;
    display: flex;
    align-items: center;
    justify-content: center;
    align-self: center;
    width: 32px;
    height: 30px;
    flex: 0 0 30px;

    .btn-volume {
      width: 32px;
      height: 30px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid transparent;
      border-radius: 4px;
      background: transparent;
      cursor: pointer;
      opacity: 0.85;

      &:hover,
      &.is-active {
        opacity: 1;
        background: rgba(255, 255, 255, 0.08);
      }
    }

    .volume-img {
      width: 13px;
      height: 13px;
      flex: 0 0 13px;
      opacity: 0.85;
      pointer-events: none;
    }

    .volume-slider-panel {
      position: fixed;
      top: var(--volume-panel-top, 50%);
      left: var(--volume-panel-left, 100%);
      transform: translateY(-50%);
      display: grid;
      grid-template-columns: minmax(0, 1fr) 30px;
      align-items: center;
      gap: 2px;
      width: 0;
      height: 28px;
      padding: 0;
      overflow: hidden;
      border: 1px solid transparent;
      border-radius: 4px;
      background: #222;
      opacity: 0;
      pointer-events: none;
      transition:
        width 0.18s ease,
        padding 0.18s ease,
        opacity 0.15s ease;

      &::before {
        position: absolute;
        inset: 0 auto 0 0;
        width: calc(100% - 12px);
        box-sizing: border-box;
        border: 1px solid #5c5c5c;
        border-radius: 4px;
        background: #222;
        content: "";
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.15s ease;
      }
    }

    &:hover .volume-slider-panel,
    &:focus-within .volume-slider-panel,
    &.is-pinned .volume-slider-panel {
      width: 152px;
      padding: 0 8px;
      opacity: 1;
      pointer-events: auto;

      &::before {
        opacity: 1;
      }
    }

    .volume-slider-wrap {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      min-width: 0;
    }

    .volume-slider {
      position: relative;
      z-index: 1;
      -webkit-appearance: none;
      appearance: none;
      width: 95%;
      height: 5px;
      margin: 0;
      border: 1px solid #000;
      border-radius: 2.5px;
      outline: none;
      background: var(--activeColour);
      display: block;
      cursor: pointer;

      &::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 6px;
        height: 9px;
        margin-top: -2px;
        border: 1px solid #000;
        border-radius: 2px;
        background: #fff;
        box-shadow: 0 0 2px rgba(0, 0, 0, 0.6);
        cursor: pointer;
      }

      &::-moz-range-thumb {
        width: 5px;
        height: 8px;
        border: 1px solid #000;
        border-radius: 2px;
        background: #fff;
        cursor: pointer;
      }

      &::-moz-range-track {
        height: 5px;
        border: 0;
        border-radius: 2.5px;
        background: var(--activeColour);
      }
    }

    .volume-value {
      position: relative;
      z-index: 1;
      width: 30px;
      flex: 0 0 30px;
      color: #fff;
      font-size: 10px;
      font-family: "Museo Sans", sans-serif;
      letter-spacing: 0;
      font-weight: 600;
      text-align: right;
      transform: translateX(-10px);
    }

    &:hover .volume-img,
    &:focus-within .volume-img,
    &.is-pinned .volume-img {
      opacity: 1;
    }
  }

  .settings-row .btn-settings {
    width: 55px;
    height: 30px;
  }

  .settings-row .btn-settings .icon-mask {
    width: 18px;
    height: 18px;
    filter: drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.6));
  }

  .sidebar.collapsed {
    .nav-buttons button,
    .btn-settings {
      width: 40px;
      height: 40px;
      font-size: 11px;
      margin: 5px auto;

      &:active {
        transform: scale(0.95);
      }

      &.active {
        background-color: var(--primaryColour);
        border-color: var(--activeColour);
        box-shadow: 0 0 4px rgba(0, 0, 0, 0.25);
      }

      &.active .icon-mask {
        background-color: var(--activeColour);
      }
    }

    .nav-icon {
      width: 35px;
      height: 35px;
      margin-top: 0;
    }

    .settings-row {
      flex-direction: column;
      gap: 4px;
    }

    .sidebar-footer .footer-row {
      flex-direction: column;
      gap: 4px;
    }
  }

  .sidebar.vertical {
    width: auto;
    min-width: 0;
    max-width: none;
    height: 54px;
    min-height: 54px;
    max-height: 54px;
    padding: 3px 6px;
    flex-direction: row;
    align-items: center;
    gap: 0;
    overflow: hidden;

    .nav-buttons {
      flex: 0 1 max-content;
      width: max-content;
      max-width: 100%;
      min-width: 0;
      height: 100%;
      margin: 0;
      flex-direction: row;
      justify-content: flex-start;
      overflow-x: auto;
      overflow-y: hidden;
      border-top: 0;
      border-left: 0;
      box-sizing: border-box;
      padding: 0 6px;
      scrollbar-width: thin;
      scrollbar-color: var(--activeColour) rgba(255, 255, 255, 0.12);

      &::-webkit-scrollbar {
        width: 5px;
        height: 5px;
      }

      &::-webkit-scrollbar-track {
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.12);
      }

      &::-webkit-scrollbar-thumb {
        border-radius: 4px;
        background-color: var(--activeColour);
      }
    }

    .nav-buttons button,
    .btn-settings,
    &.collapsed .nav-buttons button,
    &.collapsed .btn-settings {
      width: 42px;
      min-width: 42px;
      height: 42px;
      margin: 0 2px;
      border-radius: 8px;
    }

    .nav-icon {
      width: 25px;
      height: 25px;
      margin: 0;
    }

    .settings-row,
    &.collapsed .settings-row {
      height: 100%;
      padding-left: 0;
      flex-direction: row;
      gap: 2px;
      border-left: 0;
    }

    .settings-row .btn-settings {
      width: 42px;
      height: 42px;
    }

    .settings-row .btn-settings .icon-mask {
      width: 22px;
      height: 22px;
    }

    .volume-control {
      width: 34px;
      flex-basis: 34px;
    }

    .volume-value {
      width: auto;
      flex: 0 0 auto;
      text-align: center;
      transform: none;
    }

    .sidebar-footer {
      display: none;
    }

    .btn-collapse-trigger {
      display: none;
    }
  }

  .sidebar.vertical .volume-control .btn-volume {
    width: 34px;
    min-width: 0;
    height: 42px;
    margin: 0;
    border-color: transparent;
    border-radius: 4px;
    background: transparent;
  }

  .sidebar.vertical .volume-control .volume-slider-panel {
    width: 42px;
    height: 132px;
    padding: 8px 4px;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr) auto;
    gap: 6px;
    top: var(--volume-panel-top, 0);
    left: var(--volume-panel-left, 50%);
    transform: translate(-50%, var(--volume-panel-shift, -100%));

    &::before {
      width: 100%;
    }
  }

  .sidebar.vertical .volume-control .volume-slider-wrap {
    width: 100%;
    height: 88px;
  }

  .sidebar.vertical .volume-control .volume-slider {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 88px;
    height: 5px;
    margin: 0;
    transform: translate(-50%, -50%) rotate(-90deg);
  }

  .sidebar.vertical.column {
    --rows: 3;
    --row-h: 42px;
    --gap: 4px;

    width: 100%;
    min-width: calc(var(--row-h) + 24px);
    max-width: 100%;
    height: auto;
    min-height: 0;
    max-height: none;
    flex-shrink: 0;
    align-self: flex-start;
    box-sizing: border-box;
    padding: 3px;
    flex-direction: column;
    align-items: stretch;
    overflow: visible;

    .nav-buttons {
      display: grid;
      flex: 0 0 auto;
      width: 100%;
      height: auto;
      min-height: 0;
      max-height: min(
        calc(var(--rows) * var(--row-h) + (var(--rows) - 1) * var(--gap)),
        calc(100dvh - 16px)
      );
      grid-template-columns: repeat(auto-fit, minmax(var(--row-h), 1fr));
      grid-auto-flow: row;
      grid-auto-rows: var(--row-h);
      justify-items: center;
      align-items: center;
      align-content: start;
      gap: var(--gap);
      box-sizing: border-box;
      padding: 0 4px 0 2px;
      overflow-x: hidden;
      overflow-y: auto;
      overscroll-behavior-y: contain;
      -webkit-overflow-scrolling: touch;

      scrollbar-width: auto;
      scrollbar-color: auto;

      &::-webkit-scrollbar {
        width: 8px;
      }
      &::-webkit-scrollbar-track {
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.15);
      }
      &::-webkit-scrollbar-thumb {
        border-radius: 4px;
        border: 1px solid #000;
        background-color: var(--activeColour);
      }

      @supports not selector(::-webkit-scrollbar) {
        scrollbar-width: thin;
        scrollbar-color: var(--activeColour) rgba(255, 255, 255, 0.15);
      }
    }

    .nav-buttons button,
    .btn-settings,
    .volume-control {
      margin: 0;
    }

    .settings-row {
      display: contents;
    }
  }

  @container (max-width: 120px) {
    .sidebar.vertical.column .nav-buttons {
      grid-template-columns: minmax(0, 42px);
      justify-content: center;
      justify-items: center;
      padding: 4px 2px;
    }

    .sidebar.vertical.column .nav-buttons button,
    .sidebar.vertical.column .volume-control {
      margin: 0;
      justify-self: center;
    }
  }

  .sidebar.vertical:not(.column) {
    max-width: calc(100vw - 16px);
    min-width: 0;
    margin-inline: auto;
    box-sizing: border-box;
    height: auto;
    min-height: 54px;
    max-height: none;
    overflow: visible;
    padding: 2px 6px 1px;

    .nav-buttons {
      height: auto;
      flex-wrap: nowrap;
      justify-content: flex-start;
      align-items: center;
      overflow-x: auto;
      overflow-y: hidden;
      overscroll-behavior-x: contain;
      -webkit-overflow-scrolling: touch;
      padding: 0 6px 2px;

      scrollbar-width: auto;
      scrollbar-color: auto;

      &::-webkit-scrollbar {
        height: 6px;
      }
      &::-webkit-scrollbar-track {
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.15);
      }
      &::-webkit-scrollbar-thumb {
        border-radius: 4px;
        border: 1px solid #000;
        background-color: var(--activeColour);
      }

      @supports not selector(::-webkit-scrollbar) {
        scrollbar-width: thin;
        scrollbar-color: var(--activeColour) rgba(255, 255, 255, 0.15);
      }
    }

    .nav-buttons button,
    .btn-settings,
    .volume-control,
    .volume-control .btn-volume {
      height: 38px;
      min-height: 38px;
    }

    .settings-row {
      height: 38px;
    }

    .nav-icon,
    .settings-row .btn-settings .icon-mask {
      width: 22px;
      height: 22px;
    }
  }

  @media (max-width: 450px) {
    .sidebar {
      min-width: 95px;
      width: 95px;

      &.collapsed {
        min-width: 50px;
        width: 50px;
      }
    }

    .brand-title {
      font-size: 13px;
    }

    .brand-version {
      font-size: 9px;
    }

    .nav-buttons button {
      width: 80px;
      height: 28px;
      font-size: 11px;
    }

    .sidebar.collapsed .nav-buttons button {
      width: 36px;
      height: 36px;
    }

    .sidebar.vertical:not(.column) {
      min-width: 0;

      .nav-buttons button,
      .btn-settings {
        width: 38px;
        min-width: 38px;
        height: 38px;
      }
    }
  }

  .sidebar.vertical .nav-buttons button,
  .sidebar.vertical .btn-settings,
  .sidebar.vertical .btn-volume {
    transition:
      background-color 0.1s ease,
      border-color 0.1s ease,
      box-shadow 0.1s ease,
      color 0.1s ease,
      opacity 0.1s ease;
  }

  .sidebar.vertical .nav-buttons button:hover,
  .sidebar.vertical .nav-buttons button:active,
  .sidebar.vertical .btn-settings:hover,
  .sidebar.vertical .btn-settings:active,
  .sidebar.vertical .btn-volume:hover,
  .sidebar.vertical .btn-volume:active {
    transform: none;
  }
</style>
