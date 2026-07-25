<script>
  import { showDashboard, dashboardClosing, dashboardTab } from "../stores.js";
  import DashboardTab from "./tabs/Dashboard.svelte";
  import NotesTab from "./tabs/Notes.svelte";
  import CreditTab from "./tabs/Credit.svelte";
</script>

{#if $showDashboard}
  <div class="dashboard-panel" class:closing={$dashboardClosing}>
    <div class="dashboard-sub-menu">
      <button
        type="button"
        class:active={$dashboardTab === "informations"}
        on:click={() => dashboardTab.set("informations")}
      >
        Informations
      </button>
      <button
        type="button"
        class:active={$dashboardTab === "notes"}
        on:click={() => dashboardTab.set("notes")}
      >
        Notes
      </button>

      <button
        type="button"
        class:active={$dashboardTab === "credit"}
        on:click={() => dashboardTab.set("credit")}
      >
        Credit
      </button>
    </div>
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
    padding: 20px;
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
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid #2b2b2b;

    button {
      background-color: var(--primaryColour);
      color: var(--secondaryColour);
      border: 0.5px solid #5c5c5c;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 500;
      letter-spacing: 0.5px;
      width: 110px;
      padding: 6px 0;
      line-height: 1;
      cursor: pointer;
      outline: none;
      transition:
        transform 0.15s ease,
        opacity 0.15s ease,
        box-shadow 0.15s ease;

      &:hover {
        opacity: 1;
        transform: scale(1.03);
        color: #fff;
      }

      &.active {
        opacity: 1;
        color: #fff;
        font-weight: 600;
        border-color: var(--activeColour);
        box-shadow: 0 0 10px rgba(255, 0, 127, 0.2);
      }
    }
  }

  .dashboard-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 10px;
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

  @media (max-width: 450px) {
    .dashboard-panel {
      padding: 10px;
    }
    .dashboard-sub-menu {
      gap: 10px;
      margin-bottom: 15px;
      padding-bottom: 10px;

      button {
        flex: 1;
        width: auto;
        padding: 6px 10px;
        font-size: 11px;
      }
    }
  }
</style>
