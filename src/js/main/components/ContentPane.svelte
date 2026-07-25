<script>
  import { activeTab, prevTab, transitioning, direction } from "../stores.js";

  import Colors from "./tabs/Colors.svelte";
  import Curve from "./tabs/Curve.svelte";
  import Dashboard from "./tabs/Dashboard.svelte";
  import Effects from "./tabs/Effects.svelte";
  import Ffmpeg from "./tabs/Ffmpeg.svelte";
  import Notes from "./tabs/Notes.svelte";
  import Scripts from "./tabs/Scripts.svelte";
  import Settings from "./tabs/Settings.svelte";
  import Transitions from "./tabs/Transitions.svelte";
  import Workflow from "./tabs/Workflow.svelte";

  const tabComponents = {
    colors: Colors,
    curves: Curve,
    dashboard: Dashboard,
    effects: Effects,
    ffmpeg: Ffmpeg,
    notes: Notes,
    scripts: Scripts,
    settings: Settings,
    transitions: Transitions,
    workflow: Workflow,
  };
</script>

<section class="content">
  <div class="viewport">
    {#if $transitioning && $prevTab && tabComponents[$prevTab] && tabComponents[$activeTab]}
      <div
        class="pane outgoing"
        class:dir-down={$direction === 1}
        class:dir-up={$direction === -1}
      >
        <div class="tab-content">
          <svelte:component this={tabComponents[$prevTab]} />
        </div>
      </div>
      <div
        class="pane incoming"
        class:dir-down={$direction === 1}
        class:dir-up={$direction === -1}
      >
        <div class="tab-content">
          <svelte:component this={tabComponents[$activeTab]} />
        </div>
      </div>
    {:else}
      <div class="pane static">
        <div class="tab-content">
          <svelte:component this={tabComponents[$activeTab] || Dashboard} />
        </div>
      </div>
    {/if}
  </div>

  <slot />
</section>

<style lang="scss">
  .content {
    flex: 1;
    position: relative;
    overflow-y: auto;
    overflow-x: hidden;
    background-color: #232323;
    border-radius: 10px;
    text-align: center;
    padding: 0 2px;

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

  .viewport {
    position: absolute;
    inset: 0;
    overflow: hidden;
    z-index: 100;
    border-radius: 10px;
  }

  .pane {
    position: absolute;
    inset: 0;
    padding: 4px;
    will-change: transform;
    transform: translateZ(0);
    box-sizing: border-box;

    &.static {
      position: relative;
      height: 100%;
    }
  }

  .pane.outgoing.dir-down {
    animation: outUp var(--transition-ms, 0.3s) cubic-bezier(0.25, 1, 0.5, 1)
      forwards;
  }
  .pane.outgoing.dir-up {
    animation: outDown var(--transition-ms, 0.3s) cubic-bezier(0.25, 1, 0.5, 1)
      forwards;
  }
  .pane.incoming.dir-down {
    animation: inFromBottom var(--transition-ms, 0.3s)
      cubic-bezier(0.25, 1, 0.5, 1) forwards;
  }
  .pane.incoming.dir-up {
    animation: inFromTop var(--transition-ms, 0.3s)
      cubic-bezier(0.25, 1, 0.5, 1) forwards;
  }

  .tab-content {
    height: 100%;
  }

  @keyframes outUp {
    to {
      transform: translateY(-100%);
    }
  }
  @keyframes outDown {
    to {
      transform: translateY(100%);
    }
  }
  @keyframes inFromBottom {
    from {
      transform: translateY(100%);
    }
  }
  @keyframes inFromTop {
    from {
      transform: translateY(-100%);
    }
  }
</style>
