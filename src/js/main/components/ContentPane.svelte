<script>
  import { activeTab, prevTab, transitioning, direction } from "../stores.js";
  import Dashboard from "./tabs/Dashboard.svelte";

  const loaders = {
    colors: () => import("./tabs/Colors.svelte"),
    curves: () => import("./tabs/Curve.svelte"),
    dashboard: () => Promise.resolve({ default: Dashboard }),
    effects: () => import("./tabs/Effects.svelte"),
    ffmpeg: () => import("./tabs/Ffmpeg.svelte"),
    notes: () => import("./tabs/Notes.svelte"),
    scripts: () => import("./tabs/Scripts.svelte"),
    settings: () => import("./tabs/Settings.svelte"),
    transitions: () => import("./tabs/Transitions.svelte"),
    workflow: () => import("./tabs/Workflow.svelte"),
  };

  let comps = {};
  let list = [];

  async function load(name) {
    if (!name || !loaders[name]) name = "dashboard";
    if (!comps[name]) {
      const mod = await loaders[name]();
      comps[name] = mod.default;
    }
    if (!list.includes(name)) {
      list = [...list, name];
    }
  }

  $: load($activeTab);
  $: if ($transitioning && $prevTab) load($prevTab);
</script>

<section class="content">
  <div class="viewport">
    {#each list as tab (tab)}
      {#if comps[tab]}
        <div
          class="pane"
          class:active={tab === $activeTab && !$transitioning}
          class:outgoing={$transitioning && tab === $prevTab}
          class:incoming={$transitioning && tab === $activeTab}
          class:dir-down={$direction === 1}
          class:dir-up={$direction === -1}
        >
          <div class="tab-content">
            <svelte:component this={comps[tab]} />
          </div>
        </div>
      {/if}
    {/each}
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
    box-sizing: border-box;
    will-change: transform;
    transform: translateZ(0);
    display: none;
  }

  .pane.active {
    display: block;
  }

  .pane.outgoing {
    display: block;
    z-index: 1;
    pointer-events: none;
  }

  .pane.incoming {
    display: block;
    z-index: 2;
  }

  .pane.outgoing.dir-down {
    animation: outUp var(--transition-ms, 0.3s) cubic-bezier(0.25, 1, 0.5, 1) forwards;
  }
  .pane.outgoing.dir-up {
    animation: outDown var(--transition-ms, 0.3s) cubic-bezier(0.25, 1, 0.5, 1) forwards;
  }
  .pane.incoming.dir-down {
    animation: inFromBottom var(--transition-ms, 0.3s) cubic-bezier(0.25, 1, 0.5, 1) forwards;
  }
  .pane.incoming.dir-up {
    animation: inFromTop var(--transition-ms, 0.3s) cubic-bezier(0.25, 1, 0.5, 1) forwards;
  }

  .tab-content {
    height: 100%;
  }

  @keyframes outUp {
    to { transform: translateY(-100%); }
  }
  @keyframes outDown {
    to { transform: translateY(100%); }
  }
  @keyframes inFromBottom {
    from { transform: translateY(100%); }
  }
  @keyframes inFromTop {
    from { transform: translateY(-100%); }
  }
</style>