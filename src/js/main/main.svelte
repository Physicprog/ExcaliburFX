<script>
  import { onMount, onDestroy } from "svelte";
  import { get } from "svelte/store";
  import Sidebar from "./components/Sidebar.svelte";
  import ContentPane from "./components/ContentPane.svelte";
  import Dashboard from "./components/Dashboard.svelte";
  import UpdateModal from "./components/UpdateModal.svelte";
  import { monitorFPS, sendNotif } from "./logic.js";
  import * as ExcaliburUtils from "../lib/utils/main.js";
  import { listenTS } from "../lib/utils/bolt";

  import {
    CURRENT_VERSION,
    updateInfo,
    latestVersion,
    showUpdateModal,
    isOnlineStore,
    isHowToUseOpen,
    AnimationSpeed,
    isVerticalMode,
  } from "./stores.js";
  import Notification from "./components/Notification.svelte";
  import HowToUse from "./components/utils/HowToUse.svelte";
  import LanguageModal from "./components/LanguageModal.svelte";
  import {
    language,
    isLanguageSelected,
    installDomTranslation,
    t,
  } from "../i18n.js";
  import { initDiscordRPC, watchDiscordRPCPreference } from "./discordRPC.js";

  const MIN_LOADER_MS = 250;
  let isFirstLaunch = get(isHowToUseOpen);
  let isLoaded = false;
  let started = false;
  let howToReady = false;
  let onlineInterval;
  let previousOnlineState = null;

  listenTS("hostMessage", (data) => {
    try {
      const d = typeof data === "string" ? JSON.parse(data) : data;
      sendNotif(d.text, !!d.success);
    } catch (e) {}
  });

  async function checkUpdate() {
    try {
      const remote = await ExcaliburUtils.initApp(get(CURRENT_VERSION));
      if (remote) {
        latestVersion.set(remote);
        updateInfo.set({ version: remote, changelog: null });
        showUpdateModal.set(true);
      }
    } catch (e) {
      ExcaliburUtils.log("update_check", "Erreur: " + e.message);
    }
  }

  function closeHowToUse() {
    isHowToUseOpen.set(false);
    ExcaliburUtils.setPreference("hasSeenHowToUse", true);
  }

  async function loadApp() {
    const start = performance.now();
    checkUpdate();
    await document.fonts.ready;
    const elapsed = performance.now() - start;
    if (elapsed < MIN_LOADER_MS) {
      await new Promise((r) => setTimeout(r, MIN_LOADER_MS - elapsed));
    }
    isLoaded = true;
  }

  async function isGoogleOnline() {
    if (!navigator.onLine) return false;
    try {
      await fetch("https://www.google.com", {
        method: "HEAD",
        mode: "no-cors",
        cache: "no-store",
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async function checkOnlineStatus() {
    const isCurrentlyOnline = await isGoogleOnline();
    isOnlineStore.set(isCurrentlyOnline);

    if (previousOnlineState !== isCurrentlyOnline) {
      if (previousOnlineState === null && isFirstLaunch) {
        sendNotif(
          "Thanks for downloading ExcaliburFX, have fun using it!",
          true,
        );
        isFirstLaunch = false;
      } else if (previousOnlineState === null) {
        sendNotif(
          isCurrentlyOnline ? "You are online" : "You are offline",
          isCurrentlyOnline,
        );
      } else if (isCurrentlyOnline) {
        sendNotif("Welcome back!", true);
      } else {
        sendNotif("You are offline", false);
      }
      previousOnlineState = isCurrentlyOnline;
    }
  }

  async function startApp() {
    await loadApp();
    checkOnlineStatus();
    onlineInterval = setInterval(() => {
      if (!document.hidden) checkOnlineStatus();
    }, 30000);
    watchDiscordRPCPreference();
    initDiscordRPC();
    setTimeout(() => (howToReady = true), 350);
  }

  $: if ($isLanguageSelected && !started) {
    started = true;
    startApp();
  }

  onMount(() => {
    const stopDomTranslation = installDomTranslation();
    const languageSubscription = language.subscribe((code) => {
      if (code) {
        ExcaliburUtils.callJSX("setExcaliburLanguage", code).catch((error) => {
          ExcaliburUtils.log(
            "language_sync",
            "Unable to sync language with host: " + error.message,
          );
        });
      }
    });
    monitorFPS();

    function unlockAudio() {
      const silent = new Audio();
      silent.play().catch(() => {});
      window.removeEventListener("pointerdown", unlockAudio);
    }
    window.addEventListener("pointerdown", unlockAudio, { once: true });

    return () => {
      languageSubscription();
      stopDomTranslation();
    };
  });

  onDestroy(() => {
    if (onlineInterval) clearInterval(onlineInterval);
  });
</script>

{#if !$isLanguageSelected}
  <LanguageModal open={true} />
{:else if !isLoaded}
  <div class="svelte-loader">
    <div class="loader-content">
      <span>{$t("loading")}</span>
      <div class="Loading-bar"></div>
    </div>
  </div>
{:else}
  <main class="app" class:vertical-mode={$isVerticalMode}>
    <Sidebar vertical={$isVerticalMode} />
    <ContentPane>
      <Dashboard />
    </ContentPane>
    <HowToUse
      open={$isHowToUseOpen && howToReady}
      duration={Number($AnimationSpeed)}
      on:close={closeHowToUse}
    />
    <UpdateModal />
    <Notification />
  </main>
{/if}

<style lang="scss">
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :root {
    --primaryColour: #1a1a1a;
    --secondaryColour: #999;
    --activeColour: #ff007f;
  }

  @font-face {
    font-family: "Tilt Warp";
    src: url("../assets/fonts/TiltWarp.ttf") format("truetype");
  }

  @font-face {
    font-family: "Museo Sans";
    src: url("../assets/fonts/museosans.ttf") format("truetype");
  }

  @font-face {
    font-family: "Noto Sans Devanagari";
    src: url("../assets/fonts/NotoSansDevanagari-Regular.ttf")
      format("truetype");
    font-display: swap;
  }

  @font-face {
    font-family: "CreamyChicken";
    src: url("../assets/fonts/CreamyChicken.otf") format("truetype");
  }

  @font-face {
    font-family: "Super Bouncer";
    src: url("../assets/fonts/SuperBouncer.ttf") format("truetype");
  }

  @font-face {
    font-family: "Angel Wish";
    src: url("../assets/fonts/AngelWish.ttf") format("truetype");
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
    color: white;
    font-family: "Museo Sans", sans-serif;
    font-optical-sizing: auto;
    font-style: normal;
    font-size: 13px;
    font-weight: bold;
    height: calc(100vh - 10px) !important;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-shadow: 0px 2px 4px rgba(0, 0, 0, 0.5);
    image-rendering: crisp-edges;
    shape-rendering: crispEdges;
    user-select: none;
    transform-style: flat;
  }

  :global(html[lang="hi"] body),
  :global(html[lang="hi"] button),
  :global(html[lang="hi"] input),
  :global(html[lang="hi"] select),
  :global(html[lang="hi"] textarea) {
    font-family: "Noto Sans Devanagari", "Museo Sans", sans-serif;
  }

  :global(button),
  :global(input),
  :global(textarea),
  :global(select) {
    font-family: inherit;
    font-weight: bold;
  }

  :global(img) {
    cursor: pointer;
    content-visibility: auto;
    contain-intrinsic-size: 1px 1px;
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
    opacity: 1;
    transition: opacity 0.3s ease;

    &.vertical-mode {
      flex-direction: column;
      gap: 6px;

      :global(.content) {
        order: 1;
      }

      :global(.sidebar) {
        order: 2;
      }

      :global(.sidebar.vertical:not(.column)) {
        margin-bottom: -3px;
      }
    }
  }
</style>
