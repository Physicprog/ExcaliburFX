<script>
  import { showUpdateModal, latestVersion } from "../stores.js";
  import { closeUpdateModal, sendNotif } from "../logic.js";

  const RELEASE_URL =
    "https://github.com/Physicprog/ExcaliburFX/releases/latest";

  const WEBSITE_URL = "https://excaliburfx-website.vercel.app/#download";

  function copyToClipboard(text) {
    let ta = null;
    let success = false;

    try {
      ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      ta.style.top = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      success = document.execCommand("copy");
    } catch (err) {
      success = false;
    } finally {
      if (ta && ta.parentNode) {
        ta.parentNode.removeChild(ta);
      }
    }

    if (success) {
      sendNotif("Link copied to clipboard!", true);
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(function () {
          sendNotif("Link copied to clipboard!", true);
        })
        .catch(function () {
          sendNotif("Copy failed", false);
        });
    } else {
      sendNotif("Copy failed", false);
    }
  }
</script>

{#if $showUpdateModal}
  <div class="modal-overlay">
    <div class="modal-box">
      <button class="btn-close" on:click={closeUpdateModal}>×</button>
      <h2>Update Available</h2>
      <p>Excalibur FX v{$latestVersion} is available.</p>

      <div class="button-container">
        <button
          class="btn-update"
          on:click={() => copyToClipboard(RELEASE_URL)}
        >
          Download from Github
        </button>
        <button
          class="btn-update"
          on:click={() => copyToClipboard(WEBSITE_URL)}
        >
          Download from ExcaliburFX Website
        </button>
      </div>
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

  .button-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .modal-box {
    background: #1a1a1a;
    border: 1px solid var(--activeColour);
    border-radius: 8px;
    padding: 28px;
    max-width: 360px;
    width: 90%;
    text-align: center;
    position: relative;
  }

  .modal-box h2 {
    font-family: "Angel Wish", sans-serif;

    color: #fff;
    margin-top: 0;
    margin-bottom: 12px;
    font-size: 35px;
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
    background: var(--activeColour);
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 10px 20px;
    font-size: 14px;
    cursor: pointer;
    width: 100%;
  }
</style>
