<script>
  import { isOnlineStore } from "../../stores.js";
</script>

<div class="tab-view">
  <div id="dashboard">
    <div class="header">
      <h1>Dashboard & News</h1>
      <div class="normal_underline"></div>
      <h2>
        Status:
        {#if $isOnlineStore}
          <span id="CurrentState" class="stateONLINE">Online</span>
        {:else}
          <span id="CurrentState" class="stateOFFLINE">Offline</span>
        {/if}
      </h2>
    </div>

    <div id="udLogs">
      <p class="logClassChild">
        <span>XX/XX/2027</span><br /><br />
        Global release 🍾<br />
      </p>
    </div>
  </div>
</div>

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
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  #dashboard h1 {
    margin: 0;
    font-size: 5.5vh;
    font-weight: bolder;
  }

  .normal_underline {
    height: 0.75vh;
    width: 100%;
    background-color: var(--activeColour);
    border-radius: 0.5vh;
    margin: 1vh 0 2vh 0;
    box-shadow: 0 0 15px var(--activeColour);
  }

  #dashboard h2 {
    margin: 0;
    font-size: 4vh;
    font-weight: bolder;
  }

  .stateOFFLINE {
    color: red;
  }

  .stateONLINE {
    color: rgb(0, 255, 0);
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

  #udLogs::-webkit-scrollbar-thumb:hover {
    background: var(--activeColour);
  }

  :global(.logClassChild),
  :global(#UpdateLog),
  :global(.specialLog) {
    background-color: rgba(27, 27, 27, 0.492);
    border-radius: 1vh;
    border: 0.15vh solid rgb(65, 65, 65);
    width: 100%;
    box-sizing: border-box;
    padding: 3vh;
    margin-bottom: 2vh;
    font-size: 2.8vh;
    line-height: 1.4;
  }

  .logClassChild span {
    color: var(--activeColour);
    text-decoration: underline;
  }
</style>