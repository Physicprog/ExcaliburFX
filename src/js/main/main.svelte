<script>
  import { onMount } from "svelte";
  import Sidebar from "./components/Sidebar.svelte";
  import ContentPane from "./components/ContentPane.svelte";
  import Dashboard from "./components/Dashboard.svelte";
  import UpdateModal from "./components/UpdateModal.svelte";
  import { checkForUpdate, monitorFPS } from "./logic.js";
  import ExcaliburUtils from "../lib/utils/main.js";
  import Notification from "./components/Notification.svelte";

  const VERSION_URL =
    "https://api.github.com/repos/TON_USER/TON_REPO/releases/latest";
  const MIN_LOADER_MS = 250;

  let isLoaded = false;

  async function loadApp() {
    const start = performance.now();

    await ExcaliburUtils.init();
    await document.fonts.ready;

    checkForUpdate(VERSION_URL);

    const elapsed = performance.now() - start;
    if (elapsed < MIN_LOADER_MS) {
      await new Promise((r) => setTimeout(r, MIN_LOADER_MS - elapsed));
    }

    isLoaded = true;
  }

  onMount(() => {
    loadApp();
    monitorFPS();
  });
</script>

{#if !isLoaded}
  <div class="svelte-loader">
    <div class="loader-content">
      <span>Loading you in...</span>
      <div class="Loading-bar"></div>
    </div>
  </div>
{/if}

<main class="app" class:hidden={!isLoaded}>
  <Sidebar />
  <ContentPane>
    <Dashboard />
  </ContentPane>
  <UpdateModal />
  <Notification />
</main>

<style lang="scss">
  * {
    padding: 0px;
    margin: 0px;
    font-family: "Museo Sans", sans-serif;
    font-optical-sizing: auto;
    font-style: normal;
    color: white;
    transform-style: flat;
    image-rendering: crisp-edges;
    shape-rendering: crispEdges;
    text-shadow: 0.25vh 0.25vh 0.5vh rgba(0, 0, 0, 0.5);
  }

  :root {
    --primaryColour: #1a1a1a;
    --secondaryColour: #999;
    --activeColour: #ff007f;
  }

  @font-face {
    font-family: "Tilt Warp";
    src: url("../assets/TiltWarp.ttf") format("truetype");
  }

  @font-face {
    font-family: "Museo Sans";
    src: url("../assets/museosans.ttf") format("truetype");
  }

  @font-face {
    font-family: "CreamyChicken";
    src: url("../assets/CreamyChicken.otf") format("truetype");
  }

  :global(img) {
    cursor: pointer;
  }

  :global(html),
  :global(body) {
    overflow: hidden;
    background-color: #1c1c1c;
    margin: 0;
    padding: 0;
  }

  :global(body) {
    padding-bottom: 33px;
    color: var(--secondaryColour);
    font-family:
      "Tilt Warp",
      -apple-system,
      sans-serif;
    font-size: 13px;
    font-weight: bold;
    user-select: none;
    height: calc(100vh - 10px) !important;
  }

  :global(button),
  :global(input),
  :global(textarea),
  :global(select) {
    font-family: inherit;
    font-weight: bold;
  }

  .svelte-loader {
    position: fixed;
    inset: 0;
    background-color: #1c1c1c;
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeOutOverlay 0.3s ease-in-out forwards;
  }

  .loader-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    font-family: "Tilt Warp", sans-serif;
    font-size: 16px;
    color: var(--secondaryColour);
  }

  .Loading-bar {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background-color: var(--activeColour);
    animation: loadingBarAnimation 1s ease-in-out forwards;
  }

  @keyframes loadingBarAnimation {
    0% {
      width: 0%;
    }
    100% {
      width: 100%;
    }
  }

  @keyframes fadeOutOverlay {
    0% {
      opacity: 1;
      visibility: visible;
    }
    100% {
      opacity: 0;
      visibility: hidden;
    }
  }

  .app {
    display: flex;
    height: 100vh;
    width: 100vw;
    padding: 5px;
    gap: 10px;
    box-sizing: border-box;
    opacity: 0;
    transition: opacity 0.3s ease;

    &.hidden {
      opacity: 0;
      pointer-events: none;
    }

    &:not(.hidden) {
      opacity: 1;
    }
  }
</style>
