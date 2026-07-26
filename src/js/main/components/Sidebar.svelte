<script>
  import {
    order,
    tabLabels,
    volumeState,
    activeTab,
    showDashboard,
    isCollapsed,
    LogoStatic,
    FPS,
    CURRENT_VERSION,
  } from "../stores.js";

  import {
    selectTab,
    toggleDashboard,
    toggleCollapse,
    cycleVolume,
  } from "../logic.js";

  const Volume = {
    mute: { img: "../../assets/Volume/volume-mute.png", alt: "Volume Mute" },
    low: { img: "../../assets/Volume/volume-low.png", alt: "Volume Low" },
    high: { img: "../../assets/Volume/volume-high.png", alt: "Volume High" },
  };
  function maskStyle(path) {
    return `-webkit-mask-image:url(${path});mask-image:url(${path});`;
  }

  $: logoMaskStyle = maskStyle($LogoStatic);
</script>

<nav class="sidebar" class:collapsed={$isCollapsed}>
  <div class="sidebar-header">
    <button
      type="button"
      class="btn-dashboard-trigger"
      class:active={$showDashboard}
      on:click={toggleDashboard}
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

  <div class="nav-buttons">
    {#each order as tab}
      {#if tab !== "settings"}
        <button
          type="button"
          class:active={$activeTab === tab && !$showDashboard}
          on:click={() => selectTab(tab)}
        >
          {#if $isCollapsed}
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
        on:click={() => selectTab("settings")}
        title={$tabLabels.settings.full}
      >
        <span
          class="icon-mask nav-icon"
          style={maskStyle($tabLabels.settings.short)}
          aria-label={$tabLabels.settings.full}
        ></span>
      </button>
      <div class="volume-control">
        <button
          type="button"
          class="btn-volume"
          on:click={cycleVolume}
          aria-label="Volume"
        >
          <img
            src={Volume[$volumeState].img}
            alt={Volume[$volumeState].alt}
            class="volume-img"
          />
        </button>
      </div>
    </div>
  </div>

  <div class="sidebar-footer">
    <div class="footer-row">
      <button
        type="button"
        class="btn-collapse-trigger"
        on:click={toggleCollapse}
      >
        {$isCollapsed ? "Expand" : "Collapse"}
      </button>

      <span class="fps-counter">
        {$FPS}{#if !$isCollapsed}&nbsp;FPS{/if}
      </span>
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
    transition: all 0.15s ease;
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
      transform 0.15s ease,
      background-color 0.15s ease;
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
    transition: all 0.15s ease;

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
  }

  .settings-img {
    width: 16px;
    height: 16px;
    object-fit: contain;
  }

  .volume-control {
    display: flex;
    align-items: center;
    justify-content: center;

    .btn-volume {
      background: none;
      border: 1px solid transparent;
      width: 32px;
      height: 26px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border-radius: 6px;
      opacity: 0.6;
      transition:
        opacity 0.15s ease,
        background-color 0.15s ease;

      &:hover {
        opacity: 1;
        background-color: rgba(255, 255, 255, 0.05);
      }
    }

    .volume-img {
      width: 13px;
      height: 13px;
      opacity: 0.85;
    }
  }

  .nav-buttons .btn-settings {
    width: 55px;
    height: 30px;
  }

  .nav-buttons .btn-settings .icon-mask {
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
        box-shadow: 0 0 4px rgba(0, 0, 0, 0.25);
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
  }
</style>
