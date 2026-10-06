<script>
  import { createEventDispatcher } from "svelte";
  import GraphEditor from "./GraphEditor.svelte";
  import { clamp, effectGroup, EASE_PRESETS } from "./shakeModel.js";

  export let fx;
  export let ei;
  export let prop;
  export let pi;
  export let duration = 14;
  export let allowAnimation = true;

  const dispatch = createEventDispatcher();
  let showGraph = false;

  $: animated = allowAnimation && prop.keys && prop.keys.length > 1;
  $: displayedValue =
    !allowAnimation && prop.keys && prop.keys.length > 0
      ? prop.keys[0].v
      : prop.value;
  $: group = animated ? effectGroup(fx, ei, prop, pi) : null;

  function changed() {
    prop = prop;
    dispatch("change");
  }

  function copyArray(list) {
    var result = [];
    for (var i = 0; i < list.length; i++) {
      result.push(list[i]);
    }
    return result;
  }

  function hasRange() {
    return (
      Number.isFinite(prop.min) &&
      Number.isFinite(prop.max) &&
      prop.max - prop.min > 0 &&
      prop.max - prop.min <= 100000
    );
  }

  function stepFor() {
    var span = prop.max - prop.min;
    if (span <= 2) return 0.01;
    if (span <= 100) return 0.1;
    return 1;
  }

  function toHex(v) {
    var text = "#";
    for (var i = 0; i < 3; i++) {
      var part = Math.round(clamp(v[i], 0, 1) * 255).toString(16);
      if (part.length < 2) part = "0" + part;
      text = text + part;
    }
    return text;
  }

  function fromHex(hex, old) {
    var n = parseInt(hex.slice(1), 16);
    var alpha = 1;
    if (old && old.length > 3) alpha = old[3];
    return [
      ((n >> 16) & 255) / 255,
      ((n >> 8) & 255) / 255,
      (n & 255) / 255,
      alpha,
    ];
  }

  function setStatic(d, text) {
    var n = Number(text);
    if (isNaN(n)) return;
    if (!allowAnimation && prop.keys && prop.keys.length > 0) {
      prop.keys[0].v[d] = n;
      prop.value = copyArray(prop.keys[0].v);
    } else {
      prop.value[d] = n;
    }
    changed();
  }

  function setStaticColor(hex) {
    var value = fromHex(hex, displayedValue);
    if (!allowAnimation && prop.keys && prop.keys.length > 0) {
      prop.keys[0].v = value;
    }
    prop.value = value;
    changed();
  }

  function makeEndValue(start) {
    var end = [];
    for (var d = 0; d < start.length; d++) {
      var v = start[d];
      var n;
      if (prop.vt === "color") {
        if (d === 3) n = v;
        else n = clamp(v > 0.5 ? v - 0.4 : v + 0.4, 0, 1);
      } else {
        var delta = Math.abs(v) * 0.5;
        if (delta === 0) delta = 10;
        if (hasRange()) delta = (prop.max - prop.min) * 0.1;
        n = v + delta;
        if (hasRange()) {
          if (n > prop.max) n = v - delta;
          n = clamp(n, prop.min, prop.max);
        }
        n = Math.round(n * 10000) / 10000;
      }
      end.push(n);
    }
    return end;
  }

  function emptyEase(count) {
    var list = [];
    for (var i = 0; i < count; i++) list.push(null);
    return list;
  }

  function toggleAnimation() {
    if (animated) {
      prop.value = copyArray(prop.keys[0].v);
      delete prop.keys;
    } else {
      var start = Array.isArray(prop.value)
        ? copyArray(prop.value)
        : [prop.value];
      var end = makeEndValue(start);
      var endFrame = Math.max(1, Number(duration) || 14);
      prop.keys = [
        { f: 0, v: start, ease: emptyEase(start.length) },
        { f: endFrame, v: end, ease: emptyEase(end.length) },
      ];
    }
    changed();
  }

  function addKey() {
    var last = prop.keys[prop.keys.length - 1];
    prop.keys.push({
      f: last.f + 5,
      v: copyArray(last.v),
      ease: emptyEase(last.v.length),
    });
    changed();
  }

  function removeKey(index) {
    if (prop.keys.length <= 2) return;
    prop.keys.splice(index, 1);
    prop.value = copyArray(prop.keys[0].v);
    changed();
  }

  function setFrame(index, text) {
    var n = Number(text);
    if (isNaN(n)) return;
    if (n < 0) n = 0;
    prop.keys[index].f = n;
    prop.keys.sort(function (a, b) {
      return a.f - b.f;
    });
    prop.value = copyArray(prop.keys[0].v);
    changed();
  }

  function setKeyValue(index, d, text) {
    var n = Number(text);
    if (isNaN(n)) return;
    prop.keys[index].v[d] = n;
    if (index === 0) prop.value = copyArray(prop.keys[0].v);
    changed();
  }

  function setKeyColor(index, hex) {
    prop.keys[index].v = fromHex(hex, prop.keys[index].v);
    if (index === 0) prop.value = copyArray(prop.keys[0].v);
    changed();
  }

  function easeIndex(key) {
    var current = key.ease[0];
    if (current === undefined) current = null;
    var currentText = JSON.stringify(current);
    for (var i = 0; i < EASE_PRESETS.length; i++) {
      if (JSON.stringify(EASE_PRESETS[i].value) === currentText) return i;
    }
    return -1;
  }

  function setEase(index, text) {
    var preset = EASE_PRESETS[Number(text)];
    if (!preset) return;
    var key = prop.keys[index];
    for (var d = 0; d < key.v.length; d++) {
      key.ease[d] = Array.isArray(preset.value)
        ? copyArray(preset.value)
        : preset.value;
    }
    changed();
  }

  function onGraph(event) {
    prop.keys = event.detail.keys;
    prop.value = copyArray(prop.keys[0].v);
    changed();
  }
</script>

<div class="fx-prop">
  <span class="fx-label" title={prop.matchName}>
    {prop.label}
    {#if animated}<i>· {prop.keys.length} keyframes</i>{/if}
  </span>

  {#if animated}
    <!-- ===== Tableau des keyframes ===== -->
    <div class="key-table">
      {#each prop.keys as key, i}
        <div class="key-row">
          <label class="key-cell frame-cell">
            <span>Frame</span>
            <input
              class="text-input"
              type="number"
              min="0"
              step="0.5"
              value={key.f}
              on:change={(e) => setFrame(i, e.currentTarget.value)}
            />
          </label>

          <div class="key-cell value-cell">
            <span>Value</span>
            <div class="values">
              {#if prop.vt === "color"}
                <input
                  type="color"
                  value={toHex(key.v)}
                  on:input={(e) => setKeyColor(i, e.currentTarget.value)}
                />
              {:else}
                {#each key.v as value, d}
                  <input
                    class="text-input"
                    type="number"
                    step="any"
                    {value}
                    on:change={(e) => setKeyValue(i, d, e.currentTarget.value)}
                  />
                {/each}
              {/if}
            </div>
          </div>

          <div class="key-cell ease-cell">
            <span>Curve to next</span>
            {#if i < prop.keys.length - 1}
              <select
                class="text-input"
                on:change={(e) => setEase(i, e.currentTarget.value)}
              >
                {#each EASE_PRESETS as preset, p}
                  <option value={p} selected={easeIndex(key) === p}
                    >{preset.label}</option
                  >
                {/each}
                {#if easeIndex(key) === -1}
                  <option value={-1} selected>Custom</option>
                {/if}
              </select>
            {:else}
              <em>last key</em>
            {/if}
          </div>

          <button
            type="button"
            class="del-btn"
            aria-label="Delete keyframe"
            disabled={prop.keys.length <= 2}
            on:click={() => removeKey(i)}>×</button
          >
        </div>
      {/each}
    </div>

    <div class="key-actions">
      <button type="button" class="action-btn main" on:click={addKey}
        >+ Add keyframe</button
      >
      <button
        type="button"
        class="action-btn"
        on:click={() => (showGraph = !showGraph)}
      >
        {showGraph ? "Hide graph" : "Show graph"}
      </button>
      <button type="button" class="action-btn" on:click={toggleAnimation}
        >Remove animation</button
      >
    </div>

    {#if showGraph}
      <GraphEditor {group} showFields={false} on:change={onGraph} />
    {/if}
  {:else}
    <!-- ===== Valeur fixe ===== -->
    {#if prop.vt === "color"}
      <input
        type="color"
        value={toHex(displayedValue)}
        on:input={(e) => setStaticColor(e.currentTarget.value)}
      />
    {:else if prop.vt === "1d"}
      <div class="values">
        {#if hasRange()}
          <input
            class="range"
            type="range"
            min={prop.min}
            max={prop.max}
            step={stepFor()}
            value={displayedValue[0]}
            on:input={(e) => setStatic(0, e.currentTarget.value)}
          />
        {/if}
        <input
          class="text-input"
          type="number"
          step="any"
          value={displayedValue[0]}
          on:change={(e) => setStatic(0, e.currentTarget.value)}
        />
      </div>
    {:else}
      <div class="values">
        {#each displayedValue as value, d}
          <input
            class="text-input"
            type="number"
            step="any"
            {value}
            on:change={(e) => setStatic(d, e.currentTarget.value)}
          />
        {/each}
      </div>
    {/if}

    {#if allowAnimation}
      <button type="button" class="action-btn main" on:click={toggleAnimation}
        >Animate property</button
      >
    {/if}
  {/if}
</div>

<style>
  .fx-prop {
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 5px 0;
    border-top: 1px solid #2c2c2c;
    min-width: 0;
  }
  .fx-label {
    color: #ccc;
    font-size: 10px;
    font-weight: 700;
  }
  .fx-label i {
    color: var(--activeColour, #7657ef);
    font-style: normal;
  }

  .values {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    align-items: center;
    min-width: 0;
  }
  .range {
    flex: 1 1 80px;
    min-width: 0;
    accent-color: var(--activeColour, #7657ef);
  }

  .text-input {
    min-width: 0;
    width: 64px;
    height: 24px;
    padding: 0 5px;
    border: 1px solid #444;
    border-radius: 4px;
    background: #111;
    color: #fff;
    font-size: 11px;
    outline: none;
  }
  .text-input:focus {
    border-color: var(--activeColour, #7657ef);
  }

  .key-table {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .key-row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 6px;
    padding: 6px;
    background: #151515;
    border: 1px solid #333;
    border-radius: 4px;
  }
  .key-cell {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .key-cell > span {
    font-size: 9px;
    color: #888;
  }
  .key-cell em {
    height: 24px;
    line-height: 24px;
    font-size: 10px;
    color: #666;
  }
  .value-cell {
    flex: 1 1 100px;
  }
  .ease-cell select {
    width: 86px;
  }
  .del-btn {
    width: 24px;
    height: 24px;
    padding: 0;
    border: none;
    border-radius: 4px;
    background: #292929;
    color: #fff;
    font-size: 14px;
    cursor: pointer;
  }
  .del-btn:hover:not(:disabled) {
    background: #a01414;
  }
  .del-btn:disabled {
    opacity: 0.3;
    cursor: default;
  }

  .key-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .action-btn {
    height: 24px;
    padding: 0 8px;
    border: 1px solid #444;
    border-radius: 4px;
    background: #292929;
    color: #ddd;
    font-size: 10px;
    font-weight: 700;
    cursor: pointer;
    align-self: flex-start;
  }
  .action-btn.main {
    background: var(--activeColour, #7657ef);
    border-color: var(--activeColour, #7657ef);
    color: #fff;
  }
  .action-btn:hover {
    filter: brightness(1.2);
  }
</style>
