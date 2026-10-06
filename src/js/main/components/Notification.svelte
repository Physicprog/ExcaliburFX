<script>
  import { onDestroy } from "svelte";
  import { notification } from "../stores.js";

  let timer;

  function hide() {
    notification.set({ visible: false, text: $notification.text, color: $notification.color });
  }

  $: if ($notification.visible) {
    clearTimeout(timer);
    timer = setTimeout(hide, 3000);
  } else {
    clearTimeout(timer);
  }

  onDestroy(() => clearTimeout(timer));
</script>

<button
  id="notification"
  class="{$notification.color} {$notification.visible ? 'visible' : ''}"
  on:click={hide}
>
  {#if $notification.visible}
    <div id="progress-bar"></div>
  {/if}
  <div>
    <h1 id="theNotification">{$notification.text}</h1>
  </div>
</button>

<style lang="scss">
  #notification {
    position: absolute;
    text-align: center;
    height: auto;
    width: max-content;
    max-width: 60%;
    padding: 0px 3vh;
    padding-bottom: 2vh;
    background-color: #3d3d3db6;
    backdrop-filter: blur(6.5px);
    top: 0px;
    left: 50%;
    transform: translateX(-40%);
    border-radius: 1.2vh;
    border: none;
    outline: none;
    box-shadow: 0px 0px 2vh rgba(0, 0, 0, 0.397);
    z-index: 9999999999999;
    opacity: 0;
    margin-top: -10vh;
    overflow: hidden;
    cursor: pointer;
    pointer-events: none;
    transition: opacity 400ms, margin-top 400ms, transform 300ms;
  }

  #notification:hover {
    transform: translateX(-40%) scale(1.05);
    background-color: #555555b6;
  }

  #notification.visible {
    opacity: 1;
    margin-top: 4.6vh;
    pointer-events: auto;
  }

  #notification #theNotification {
    margin: 0;
    font-size: 11px;
    margin-top: 2vh;
    color: #fff;
    line-height: 1;
    font-weight: 500;
  }

  #notification #progress-bar {
    position: absolute;
    top: 0;
    left: 0;
    height: 0.4vh;
    width: 100%;
    animation: progress 3s linear forwards;
  }

  #notification.green #progress-bar {
    background-color: #72db1b;
  }

  #notification.red #progress-bar {
    background-color: #bd0000;
  }

  @keyframes progress {
    0% {
      width: 0%;
    }
    100% {
      width: 100%;
    }
  }
</style>