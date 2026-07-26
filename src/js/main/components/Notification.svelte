<script>
  import { onDestroy } from "svelte";
  import { notification } from "../stores.js";

  let hideTimer;
  let animationKey = 0;

  let displayText = "";
  let displayColor = "green";

  $: notif = $notification;

  $: if (notif.visible) {
    displayText = notif.text;
    displayColor = notif.color;
    clearTimeout(hideTimer);
    if (notif.autoHide !== false) {
      animationKey++;
      hideTimer = setTimeout(hide, 3000);
    }
  } else {
    clearTimeout(hideTimer);
  }

  function hide() {
    notification.set({ visible: false, text: notif.text, color: notif.color });
  }

  onDestroy(() => clearTimeout(hideTimer));
</script>

<button
  id="notification"
  class="{displayColor} {notif.visible ? 'visible' : ''}"
  type="button"
  on:click={hide}
>
  {#if notif.autoHide !== false && notif.visible}
    {#key animationKey}
      <div id="progress-bar"></div>
    {/key}
  {/if}
  <div>
    <h1 id="theNotification">{displayText}</h1>
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
    transition:
      opacity 400ms cubic-bezier(0.25, 1, 0.5, 1),
      margin-top 400ms cubic-bezier(0.25, 1, 0.5, 1),
      transform 300ms cubic-bezier(0.25, 1, 0.5, 1);
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
    transform-origin: left;
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
