<script>
  import { showDashboard, dashboardClosing, dashboardTab } from "../stores.js";
  import DashboardTab from "./tabs/Dashboard.svelte";
  import NotesTab from "./tabs/Notes.svelte";
  import CreditTab from "./tabs/Credit.svelte";
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
          <span>Credit</span>
        </button>
      </div>
    </nav>
    <div class="dashboard-content">
      <div class="dashboard-inner">
        {#if $dashboardTab === "informations"}
          <DashboardTab />
        {:else if $dashboardTab === "notes"}
          <NotesTab />
        {:else if $dashboardTab === "credit"}
          <CreditTab />
        {/if}
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
    padding: 6px 15px 15px 15px;
    border-radius: 10px;
    will-change: transform;
    backface-visibility: hidden;
    animation: slideInRight var(--transition-ms, 0.3s)
      cubic-bezier(0.25, 1, 0.5, 1) forwards;
    &.closing {
      animation: slideOutRight var(--transition-ms, 0.3s) ease-in forwards;
    }
  }

  .dashboard-sub-menu {
    width: 100%;
    height: 32px;
    background-color: rgb(37, 37, 37);
    border: 1px solid rgb(65, 65, 65);
    border-radius: 6px;
    margin-bottom: 12px;
    flex-shrink: 0;
  }
  .dashboard-sub-menu .nav-grid {
    width: calc(100% - 8px);
    height: 100%;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    margin: 0px 4px;
    padding: 0;
  }
  .dashboard-sub-menu button {
    /* Reset des styles par défaut du bouton */
    appearance: none;
    border: none;
    outline: none;
    padding: 0;
    font-family: inherit;

    /* Ton style d'origine */
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    border-radius: 4px;
    font-weight: bold;
    margin: 3px 0px;
    transition: all 0.15s ease-in-out;
    color: #fff;
  }
  .dashboard-sub-menu button:hover {
    cursor: pointer;
    text-shadow: 2px 2px 5px black;
    font-weight: bold;
  }

  .dashboard-sub-menu button span {
    margin-top: 1px;
  }

  .dashboard-sub-menu ul {
    width: calc(100% - 8px);
    height: 100%;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    margin: 0px 4px;
    padding: 0;
  }
  .dashboard-sub-menu ul li {
    text-decoration: none;
    list-style: none;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    border-radius: 4px;
    font-weight: bold;
    margin: 3px 0px;
    transition: all 0.15s ease-in-out;
    color: #fff;
  }

  .dashboard-sub-menu ul li:hover {
    cursor: pointer;
    text-shadow: 2px 2px 5px black;
    font-weight: bold;
  }
  .dashboard-sub-menu ul li span {
    margin-top: 1px;
  }

  .eff_active {
    background-color: #191919;
    border-top: 2.5px solid var(--activeColour) !important;
  }

  .eff_active:hover {
    background-color: var(--activeColour);
    border-top: 2.5px solid var(--activeColour) !important;
    filter: brightness(1.2);
  }

  .not_eff_active {
    background-color: #191919;
    border-top: 2.5px solid transparent !important;
  }

  .not_eff_active:hover {
    background-color: var(--activeColour);
    border-top: 2.5px solid var(--activeColour) !important;
    filter: brightness(1.2);
  }

  .dashboard-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 5px;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    box-sizing: border-box;

    &::-webkit-scrollbar {
      width: 12px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background-color: var(--thumb-colour, blueviolet);
      border-radius: 6px;
      border: 3px solid #232323;
      background-clip: padding-box;
    }
    &::-webkit-scrollbar-thumb:hover {
      background-color: var(--thumb-colour, #b854ff);
      filter: brightness(1.15);
    }
  }
  @media (max-width: 450px) {
    .dashboard-sub-menu {
      height: 28px;
    }
    .dashboard-sub-menu .nav-grid {
      gap: 2px;
    }
    .dashboard-sub-menu button {
      font-size: 9.5px;
      margin: 2px 0px;
    }
  }

  .dashboard-inner {
    width: 100%;
    max-width: 800px;
    display: flex;
    flex-direction: column;
    gap: 15px;
    text-align: left;
  }

  @keyframes slideInRight {
    from {
      transform: translateX(100%);
    }
  }
  @keyframes slideOutRight {
    to {
      transform: translateX(100%);
    }
  }
</style>
