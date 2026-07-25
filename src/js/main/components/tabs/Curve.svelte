<script>
  import {
    handleTestAlert,
    handleGetAppInfo,
    handleTestReturnJSX,
  } from "../../../lib/utils/main.js";

  let resultMsg = "";
</script>

<section class="tab-pane">
  <h3>Courbes</h3>

  <div class="controls">
    <div class="buttons">
      <button
        type="button"
        on:click={async () => (resultMsg = await handleTestAlert())}
      >
        Tester alerte JSX
      </button>

      <button type="button" on:click={() => (resultMsg = handleGetAppInfo())}>
        Récupérer infos app
      </button>

      <button
        type="button"
        on:click={async () => (resultMsg = await handleTestReturnJSX())}
      >
        Demander nombre au JSX
      </button>
    </div>

    {#if resultMsg}
      <div class="result">{resultMsg}</div>
    {/if}
  </div>
</section>

<style lang="scss">
  .tab-pane {
    padding: 12px;
    color: #ddd;
    text-align: left;
  }

  .buttons {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }

  button {
    background: var(--primaryColour, #007aff);
    color: var(--secondaryColour, #fff);
    border: none;
    padding: 6px 10px;
    border-radius: 6px;
    cursor: pointer;
  }

  .result {
    margin-top: 12px;
    color: #fff;
  }
</style>
