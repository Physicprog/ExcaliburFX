<script>
  import { sendNotif } from "../../logic.js";

  function handleTest() {
    sendNotif("Mon message ici pour tester le fonctionnement", true, true);
  }
</script>

<div class="tab-view">
  <h1>Workflow</h1>
  <button class="test-btn" on:click={handleTest}>Tester la notification</button>
</div>

<style lang="scss">
  .tab-view {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
    padding: 20px;
  }

  .test-btn {
    background-color: var(--activeColour, #ff007f);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    font-weight: bold;
    transition: opacity 0.2s ease;

    &:hover {
      opacity: 0.85;
    }
  }
</style>
