<script>
  import Game2048 from "../games/Game2048.svelte";
  import CatPillar from "../games/CatPillar.svelte";
  import CookieClicker from "../games/CookieClicker.svelte";
  import { sendNotif } from "../../logic.js";
  import { TRANSITION_MS } from "../../stores.js";
  import { fade, scale } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import Close from "../../../assets/ui/Close.png";

  const creatorName = "Physic";
  let activeGame = null;

  function open2048() {
    activeGame = "2048";
  }

  function openCatPillar() {
    activeGame = "catpillars";
  }

  function openClicker() {
    activeGame = "clicker";
  }

  function closeGame() {
    activeGame = null;
  }

  function portal(node) {
    document.body.appendChild(node);
    return {
      destroy() {
        if (node.parentNode) {
          node.parentNode.removeChild(node);
        }
      },
    };
  }

  function CopyLink() {
    const link = "https://www.instagram.com/mallaubrl_/";
    
    const textArea = document.createElement("textarea");
    textArea.value = link;
    textArea.style.position = "absolute";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    
    textArea.select();
    const success = document.execCommand("copy");
    
    document.body.removeChild(textArea);

    if (success) {
      sendNotif("Link copied to clipboard! You can paste it on your browser.", "success");
    } else {
      sendNotif("Failed to copy link.", "error");
    }
  }
</script>

<div class="tab-view">
  <div id="dashboard">
    <div class="header">
      <h1>Credit</h1>
      <button
        type="button"
        class="normal_underline secret-trigger-line"
        on:click={openClicker}
        aria-label="Open the hidden clicker game"
      ></button>
    </div>

    <div id="udLogs">
      <p class="logClassChild">
        <span>Developer</span><br /><br />
        Developer:
        <button
          type="button"
          id="creatorName"
          class="secret-trigger-text"
          on:click={openCatPillar}
          aria-label="Open the cat piller game"
        >
          {creatorName}
        </button>
        <br /><br />
        All code, functionality and resources are created by {creatorName}. Some
        UI elements are inspired by other software, but the code is original and
        unique. Huge thanks to Mallaurie
        <button
          type="button"
          class="copy-link-btn secret-trigger-text"
          on:click={CopyLink}
          aria-label="Open Mallaurie's Instagram profile"
        >
          <strong>@mallaubrl_</strong>
        </button>
        for the help with the UI icons.
        <br /><br />
        <span>License</span><br /><br />
        MIT License Copyright (c) Hyper Brew LLC. All rights reserved. All trademarks
        are property of their respective owners in the US and other countries.
      </p>

      <p class="logClassChild">
        <span>Used Technologies</span><br /><br />
        - Framework UI : Svelte<br />
        - local backend : Node.js<br />
        - Adobe motor : CEP Engine<br />
        - Scripting :
        <button type="button" class="secret-trigger-text" on:click={open2048}>
          Bolt
        </button>
      </p>
    </div>
  </div>
</div>

{#if activeGame}
  <div
    use:portal
    class="game-overlay-fullscreen"
    transition:fade={{ duration: $TRANSITION_MS }}
  >
    <button class="close-btn" on:click={closeGame}>
      <img src={Close} alt="Close" class="close-icon" decoding="async" />
    </button>

    <div
      class="game-container"
      transition:scale={{
        duration: $TRANSITION_MS,
        start: 0.9,
        easing: cubicOut,
      }}
    >
      {#if activeGame === "clicker"}
        <CookieClicker />
      {:else if activeGame === "2048"}
        <Game2048 />
      {:else if activeGame === "catpillars"}
        <CatPillar />
      {/if}
    </div>
  </div>
{/if}

<style>
  .tab-view {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }

  #dashboard {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
    width: 100%;
    height: 100%;
    border-radius: 1vh;
    padding: 2.5vh 4%;
    box-sizing: border-box;
  }

  .header {
    flex-shrink: 0;
    width: 100%;
  }

  #dashboard h1 {
    margin: 0;
    font-size: 5.5vh;
    font-weight: bolder;
    color: white;
  }

  .normal_underline {
    height: 0.75vh;
    width: 100%;
    background-color: var(--activeColour);
    border-radius: 0.5vh;
    margin: 1vh 0 2vh 0;
  }

  .secret-trigger-line {
    cursor: pointer;
    transition: all 0.2s ease;
    display: block;
    border: none;
    padding: 0;
  }

  .secret-trigger-text {
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-block;
    background: none;
    border: none;
    padding: 0;
    color: inherit;
    font: inherit;
    text-align: left;
  }

  #udLogs {
    flex: 1;
    margin-top: 2vh;
    width: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 1.5vh;
    box-sizing: border-box;
  }

  #udLogs::-webkit-scrollbar {
    width: 1.2vh;
  }
  
  #udLogs::-webkit-scrollbar-track {
    background: transparent;
  }
  
  #udLogs::-webkit-scrollbar-thumb {
    background: var(--activeColour);
    border-radius: 1vh;
  }

  .logClassChild {
    background-color: rgba(27, 27, 27, 0.492);
    border-radius: 1vh;
    border: 0.15vh solid rgb(65, 65, 65);
    width: 100%;
    padding: 3vh;
    margin-bottom: 2vh;
    font-size: 2.8vh;
    line-height: 1.4;
    box-sizing: border-box;
    color: #e0e0e0;
  }

  .logClassChild span {
    color: var(--activeColour);
  }

  #creatorName {
    font-weight: bold;
    font-size: 3.5vh;
    color: var(--activeColour);
  }

  :global(.game-overlay-fullscreen) {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(15, 15, 15, 0.98);
    backdrop-filter: blur(10px);
    z-index: 9999999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  :global(.close-btn) {
    position: absolute;
    top: 2vh;
    right: 2vh;
    background: rgba(255, 0, 0, 1);
    border: 0.2vh solid red;
    color: white;
    padding: 1.5vh 2vh;
    border-radius: 1vh;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
    z-index: 20;
  }

  :global(.close-btn .close-icon) {
    width: 3vh;
    height: 3vh;
  }

  :global(.close-btn:hover) {
    background: red;
    box-shadow: 0 0 15px red;
    transform: scale(1.05);
  }

  :global(.game-container) {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  :global(strong) {
    color: var(--activeColour);
    font-weight: 600;
  }
</style>