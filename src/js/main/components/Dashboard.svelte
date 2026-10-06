<script>
  import {
    showDashboard,
    dashboardClosing,
    dashboardTab,
    TRANSITION_MS,
  } from "../stores.js";
  import DashboardTab from "./tabs/Dashboard.svelte";
  import NotesTab from "./tabs/Notes.svelte";
  import CreditTab from "./tabs/Credit.svelte";

  const dashboardOrder = ["informations", "notes", "credit"];

  let activeTab = $dashboardTab;
  let prevTab = null;
  let direction = 1;
  let isTransitioning = false;
  let transitionTimeout = null;

  $: if ($dashboardTab !== activeTab) {
    const fromIndex = dashboardOrder.indexOf(activeTab);
    const toIndex = dashboardOrder.indexOf($dashboardTab);

    direction = toIndex > fromIndex ? 1 : -1;

    prevTab = activeTab;
    activeTab = $dashboardTab;
    isTransitioning = true;

    clearTimeout(transitionTimeout);
    transitionTimeout = setTimeout(() => {
      isTransitioning = false;
      prevTab = null;
    }, $TRANSITION_MS);
  }
</script>

{#if $showDashboard}
  <div class="dashboard-panel" class:closing={$dashboardClosing}>
    <nav class="dashboard-sub-menu">
      <div class="nav-grid">
        <button
          type="button"
          class:eff_active={$dashboardTab === "informations"}
          class:not_eff_active={$dashboardTab !== "informations"}
          on:click={() => dashboardTab.set("informations")}
        >
          <span>Informations</span>
        </button>
        <button
          type="button"
          class:eff_active={$dashboardTab === "notes"}
          class:not_eff_active={$dashboardTab !== "notes"}
          on:click={() => dashboardTab.set("notes")}
        >
          <span>Notes</span>
        </button>
        <button
          type="button"
          class:eff_active={$dashboardTab === "credit"}
          class:not_eff_active={$dashboardTab !== "credit"}
          on:click={() => dashboardTab.set("credit")}
        >
          <span>Credits</span>
        </button>
      </div>
    </nav>

    <div class="dashboard-content">
      <div class="dashboard-inner">
        {#if isTransitioning && prevTab}
          <div
            class="tab-slide exit"
            class:slide-left-exit={direction === 1}
            class:slide-right-exit={direction === -1}
          >
            {#if prevTab === "informations"}
              <DashboardTab />
            {:else if prevTab === "notes"}
              <NotesTab />
            {:else if prevTab === "credit"}
              <CreditTab />
            {/if}
          </div>
        {/if}

        <div
          class="tab-slide enter"
          class:animating={isTransitioning}
          class:slide-left-enter={isTransitioning && direction === 1}
          class:slide-right-enter={isTransitioning && direction === -1}
        >
          {#if activeTab === "informations"}
            <DashboardTab />
          {:else if activeTab === "notes"}
            <NotesTab />
          {:else if activeTab === "credit"}
            <CreditTab />
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<style lang="scss">
  .dashboard-panel {
    position: absolute;
    inset: 0;
    box-sizing: border-box;
    background-color: #17171763;
    backdrop-filter: blur(8px);
    z-index: 150;
    display: flex;
    flex-direction: column;
    padding: 1vh;
    border-radius: 1.5vh;
    will-change: transform;
    backface-visibility: hidden;

    transform: translateX(0);
    animation: slideInRight var(--transition-ms, 300ms)
      cubic-bezier(0.25, 1, 0.5, 1) forwards;

    &.closing {
      animation: slideOutRight var(--transition-ms, 300ms) ease-in forwards;
    }
  }

  .dashboard-content {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    width: 100%;
    box-sizing: border-box;
  }

  .dashboard-inner {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .tab-slide {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;

    &.exit,
    &.enter {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
    }
    &.exit {
      z-index: 1;
      pointer-events: none;
    }
    &.enter {
      z-index: 2;
    }
  }

  .tab-slide > :global(*) {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .slide-left-enter {
    animation: slideInFromRight var(--transition-ms, 300ms)
      cubic-bezier(0.25, 1, 0.5, 1) forwards;
  }
  .slide-left-exit {
    animation: slideOutToLeft var(--transition-ms, 300ms)
      cubic-bezier(0.25, 1, 0.5, 1) forwards;
  }
  .slide-right-enter {
    animation: slideInFromLeft var(--transition-ms, 300ms)
      cubic-bezier(0.25, 1, 0.5, 1) forwards;
  }
  .slide-right-exit {
    animation: slideOutToRight var(--transition-ms, 300ms)
      cubic-bezier(0.25, 1, 0.5, 1) forwards;
  }

  @keyframes slideInFromRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  @keyframes slideOutToLeft {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(-100%);
      opacity: 0;
    }
  }
  @keyframes slideInFromLeft {
    from {
      transform: translateX(-100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  @keyframes slideOutToRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(100%);
    }
  }

  .dashboard-sub-menu {
    width: 100%;
    height: 30px;
    background-color: rgb(37, 37, 37);
    border: 1px solid rgb(65, 65, 65);
    border-radius: 4px;
    flex-shrink: 0;
    margin-bottom: 8px;
  }
  .dashboard-sub-menu .nav-grid {
    width: calc(100% - 1vh);
    height: 100%;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5vh;
    margin: 0px 0.5vh;
  }
  .dashboard-sub-menu button {
    font-family: "Museo Sans", sans-serif;
    appearance: none;
    border: none;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    border-radius: 3px;
    font-weight: 600;
    margin: 2px 0;
    color: #fff;
    cursor: pointer;
    transition: all 0.1s ease;
  }

  .dashboard-sub-menu button:hover {
    background-color: #191919 !important;
    transform: translateY(-0.5vh);
    border-top: 0.4vh solid var(--activeColour) !important;
  }

  .dashboard-sub-menu button:active {
    background-color: #191919 !important;
    transform: translateY(0vh) scale(0.98);
    border-top: 0.4vh solid var(--activeColour) !important;
  }
  .eff_active {
    background-color: #191919 !important;
    border-top: 0.4vh solid var(--activeColour) !important;
  }
  .not_eff_active {
    background-color: #191919 !important;
    border-top: 0.4vh solid transparent !important;
  }
</style>
