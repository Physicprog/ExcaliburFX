<script>
  import { LABEL_COLORS } from "../../stores.js";

  export let value = 1;
  export let label = "Layer Color";

  let open = false;

  function toCss(rgb) {
    return "rgb(" + Math.round(rgb[0] * 255) + ", " + Math.round(rgb[1] * 255) + ", " + Math.round(rgb[2] * 255) + ")";
  }

  $: current = LABEL_COLORS.find(c => c.index === value) || LABEL_COLORS[0];

  function toggle() {
    open = !open;
  }

  function select(c) {
    value = c.index;
    open = false;
  }

  function closeDropdown() {
    open = false;
  }
</script>

<div class="color-picker">
  {#if label}
    <span class="cp-label">{label}</span>
  {/if}

  <button type="button" class="cp-trigger" on:click={toggle}>
    <span class="cp-swatch" style="background-color: {toCss(current.rgb)}"></span>
    <span class="cp-name">{current.name}</span>
    <span class="cp-arrow">{open ? "▲" : "▼"}</span>
  </button>

  {#if open}
    <button type="button" class="cp-overlay" on:click={closeDropdown}></button>

    <div class="cp-dropdown">
      {#each LABEL_COLORS as c}
        <button type="button" class="cp-option" on:click={() => select(c)}>
          <span class="cp-swatch" style="background-color: {toCss(c.rgb)}"></span>
          <span class="cp-option-name">{c.name}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .color-picker {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: 100%;
  }

  .cp-label {
    font-size: 8px;
    font-weight: bold;
    color: #ccc;
  }

  .cp-trigger {
    display: flex;
    align-items: center;
    gap: 5px;
    width: 100%;
    background: #252525;
    border: 1px solid #414141;
    border-radius: 3px;
    padding: 3px 5px;
    cursor: pointer;
    color: #fff;
    font-size: 8px;
  }

  .cp-trigger:hover {
    background: #313131;
  }

  .cp-swatch {
    width: 9px;
    height: 9px;
    border-radius: 2px;
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  .cp-name {
    flex: 1;
    text-align: left;
  }

  .cp-arrow {
    font-size: 7px;
    color: #999;
  }

  .cp-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: transparent;
    border: none;
    z-index: 500;
  }

  .cp-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    max-height: 100px;
    overflow-y: auto;
    background: #161616;
    border: 1px solid #444;
    border-radius: 4px;
    padding: 3px;
    z-index: 501;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .cp-option {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 3px 4px;
    background: transparent;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    color: #ccc;
    font-size: 8px;
    width: 100%;
  }

  .cp-option:hover {
    background: #262626;
    color: #fff;
  }

  .cp-option-name {
    flex: 1;
    text-align: left;
  }
</style>