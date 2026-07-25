<script>
  import { checkForUpdate } from "../../logic.js";
  import { updateInfo, CURRENT_VERSION } from "../../stores.js";
</script>

<a href="javascript:void(0)" on:click={() => checkForUpdate()}>
  <div class="update-exca">
    <span>Check for update</span>
  </div>
</a>

{#if $updateInfo && $updateInfo.version}
  <div class="tab-view">
    <div class="update-available">
      <h1>Update Available</h1>
      <p><strong>Current Version:</strong> {$CURRENT_VERSION}</p>
      <p><strong>New Version:</strong> {$updateInfo.version}</p>
      {#if $updateInfo.changelog}
        <div class="changelog">
          <h3>Changelog:</h3>
          <p>{$updateInfo.changelog}</p>
        </div>
      {/if}
    </div>
  </div>
{:else}
  <div class="tab-view">
    <h1>No Update Available</h1>
    <p>You are using the latest version ({$CURRENT_VERSION})</p>
  </div>
{/if}

<style lang="scss">
  .tab-view {
    position: absolute;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: "Tilt Warp", sans-serif;
    font-size: 16px;
    color: var(--secondaryColour);
    background-color: #17171763;
    backdrop-filter: blur(8px);
    z-index: 150;
    padding: 20px;
  }

  .update-available {
    background: rgba(255, 255, 255, 0.05);
    padding: 30px;
    border-radius: 10px;
    text-align: center;
    max-width: 500px;
    border: 1px solid rgba(255, 255, 255, 0.1);

    h1 {
      margin: 0 0 20px 0;
      color: #4ade80;
    }

    p {
      margin: 10px 0;
      font-size: 14px;
    }

    .changelog {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      text-align: left;
      max-height: 300px;
      overflow-y: auto;

      h3 {
        margin: 0 0 10px 0;
      }

      p {
        font-size: 13px;
        line-height: 1.5;
      }
    }
  }
</style>
