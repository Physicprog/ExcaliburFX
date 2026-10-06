<script>
  import {
    isOnlineStore,
    CURRENT_VERSION,
    isPremiere,
    AeAndPrVersion,
  } from "../../stores.js";

  import { t } from "../../../i18n.js";
  const CHANGELOG = [
    {
      date: "07/10/2026",
      version: "1.1.1",
      open: true,
      items: [
        "Reworked Workflow tab: added speed controls, motion tile (right click to change the settings), Reverse keyframes (not only layers) and fixed freeze to be real freeze on speed.",
        "ExcaliburFX is now available on Premiere Pro (for the sfx, colors and FFMPEG tabs only).",
        "Added a language system. You can now change the extension's language in preferences.json in your Documents folder.",
        "Reworked the curves tab: the beziers curves are now editable, added a button to copy the curves selected keyframes, you can also paste the copied curves everywhere to draw the graphs. Twice click on the extreme round of the graph to reset it to 0.",
        "Reworked the volume control to be a slider instead of a button, and added a mute option.",
        "Added a new Shakes tab, with a new Shake which allows to create shakes from expressions, presets (made by me) or custom (your own).",
        "Removed the Compact sidebar button from the settings and added a Vertical mode, the sidebar can now be on the bottom of the extension.",
      ],
    },
    {
      date: "29/09/2026",
      version: "1.0.1",
      open: false,
      items: [
        "Fixed a bug where the button for scale was not working properly.",
        "Fixed a bug where the 3D camera and Warp Stabilizer were not working properly.",
        "Global release 🍾",
      ],
    },
  ];
</script>

<div class="tab-view">
  <div id="dashboard">
    <div class="header">
      <h1>Dashboard & News</h1>
      <div class="normal_underline"></div>
      <div class="row">
        <h2>
          Internet:
          {#if $isOnlineStore}
            <span id="CurrentState" class="stateONLINE">Connected</span>
          {:else}
            <span id="CurrentState" class="stateOFFLINE">Offline</span>
          {/if}
        </h2>
        <h2>
          ExcaliburFX v{$CURRENT_VERSION}
        </h2>
      </div>

      <h2>
        Detected Software:
        {#if isPremiere}
          <span id="CurrentState"
            >Pr v<span class="stateONLINE">{AeAndPrVersion}</span>
          </span>
        {:else}
          <span id="CurrentState"
            >Ae v<span class="stateONLINE">{AeAndPrVersion}</span>
          </span>
        {/if}
      </h2>
    </div>

    <div id="udLogs" data-i18n-skip>
      {#each CHANGELOG as entry}
        <details class="logClassChild" open={entry.open}>
          <summary><span>{entry.date}</span> - V{entry.version}</summary>
          <div class="log-content">
            {#each entry.items as item}<p>{$t(item)}</p>{/each}
          </div>
        </details>
      {/each}
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
  .row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    gap: 2vh;
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
    font-size: 10px;
    font-weight: bolder;
    white-space: pre-line;
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
    font-size: 10px;
    line-height: 1.4;
  }

  .logClassChild summary {
    cursor: pointer;
  }

  .log-content {
    margin-top: 2vh;
  }

  .logClassChild span {
    color: var(--activeColour);
    text-decoration: underline;
  }
</style>
