<script>
  import { showUpdateModal } from "../stores.js";
  import { closeUpdateModal } from "../logic.js";
</script>

{#if $showUpdateModal}
  <div class="modal-overlay">
    <div class="modal-box">
      <button class="btn-close" on:click={closeUpdateModal}>×</button>
      <h2>Mise à jour disponible</h2>
      <p>Une nouvelle version d'Excalibur FX est disponible.</p>
      <button class="btn-update" on:click={() => window.open("https://github.com/TON_USER/TON_REPO/releases/latest", "_blank")}>Voir sur GitHub</button>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
  }

  .modal-box {
    background: #1a1a1a;
    border: 1px solid #52b495;
    border-radius: 12px;
    padding: 28px;
    max-width: 360px;
    width: 90%;
    text-align: center;
    position: relative;
  }

  .modal-box h2 {
    color: #fff;
    margin-top: 0;
    margin-bottom: 12px;
    font-size: 18px;
  }

  .modal-box p {
    color: #999;
    font-size: 13px;
    margin-top: 0;
    margin-bottom: 16px;
  }

  .btn-close {
    position: absolute;
    top: 10px;
    right: 10px;
    background: transparent;
    border: none;
    color: #999;
    font-size: 20px;
    cursor: pointer;
  }

  .btn-close:hover {
    color: #fff;
  }

  .btn-update {
    background: #52b495;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 10px 20px;
    font-size: 14px;
    cursor: pointer;
    width: 100%;
  }
</style>