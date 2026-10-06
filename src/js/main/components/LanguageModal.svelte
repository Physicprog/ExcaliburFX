<script>
  import { LANGUAGES, language, setLanguage, t } from "../../i18n.js";

  export let open = false;
  let selected = "en";

  $: if ($language) selected = $language;

  function confirm() {
    setLanguage(selected);
    open = false;
    dispatch("selected");
  }

  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();
</script>

{#if open}
  <div class="language-backdrop" role="presentation">
    <div
      class="language-modal panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="language-title"
    >
      <div class="language-header">
        <div>
          <h1 id="language-title">{$t("chooseLanguage")}</h1>
          <p>{$t("chooseLanguageDescription")}</p>
        </div>
      </div>

      <div class="language-options">
        {#each LANGUAGES as item}
          <label class:selected={selected === item.code}>
            <input type="radio" bind:group={selected} value={item.code} />
            <span>{item.nativeName}</span>
          </label>
        {/each}
      </div>

      <button class="language-confirm mini-btn" on:click={confirm}
        >{$t("continue")}</button
      >
    </div>
  </div>
{/if}

<style>
  .language-backdrop {
    position: fixed;
    z-index: 10000000;
    inset: 0;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, 0.78);
    backdrop-filter: blur(2px);
  }

  .language-modal {
    width: min(86vw, 315px);
    padding: 12px;
    border: 0.5px solid #5c5c5c;
    border-radius: 6px;
    background: #1a1a1a;
    box-shadow: 0 0 12px rgba(0, 0, 0, 0.45);
    box-sizing: border-box;
    color: white;
  }

  .language-header {
    display: flex;
    align-items: center;
    gap: 9px;
    padding-bottom: 8px;
    border-bottom: 1px solid #2b2b2b;
  }

  .language-modal h1 {
    margin: 0;
    color: #fff;
    font-size: 11px;
    letter-spacing: 0.3px;
    text-transform: uppercase;
  }

  .language-modal p {
    margin: 3px 0 0;
    color: #c8c8c8;
    font-size: 8px;
    font-weight: normal;
  }

  .language-options {
    display: grid;
    gap: 5px;
    margin-top: 11px;
  }

  .language-options label {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 28px;
    padding: 5px 8px;
    border: 1px solid rgba(104, 104, 104, 0.609);
    border-radius: 4px;
    box-sizing: border-box;
    color: white;
    background: #313131;
    font-size: 9px;
    cursor: pointer;
    transition:
      border-color 0.2s ease,
      background-color 0.2s ease,
      transform 0.1s ease;
  }

  .language-options label.selected {
    border-color: var(--activeColour, #ff007f);
    background: rgba(255, 0, 127, 0.16);
  }

  .language-options label:hover {
    border-color: var(--activeColour, #ff007f);
    transform: scale(1.01);
  }

  .language-options input {
    accent-color: #ff007f;
  }

  .language-confirm {
    width: 100%;
    margin-top: 11px;
    height: 25px;
    border: 1px solid rgba(104, 104, 104, 0.609);
    border-radius: 4px;
    color: white;
    background: #313131;
    font-size: 9px;
    cursor: pointer;
  }

  .language-confirm:hover {
    border-color: var(--activeColour, #ff007f);
    background: var(--activeColour, #ff007f);
  }
</style>
