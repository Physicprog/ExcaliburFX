<script>
  export let node;
  export let activeLib;
  export let onSelect;
  export let depth = 0;

  const CLICK_TOLERANCE = 8;

  let expanded = false;

  function makePressHandler(callback) {
    let startX = 0;
    let startY = 0;

    return {
      down(event) {
        startX = event.clientX;
        startY = event.clientY;
      },
      up(event) {
        const dx = Math.abs(event.clientX - startX);
        const dy = Math.abs(event.clientY - startY);
        if (dx <= CLICK_TOLERANCE && dy <= CLICK_TOLERANCE) {
          callback(event);
        }
      },
    };
  }

  const arrowHandler = makePressHandler(() => (expanded = !expanded));
  const labelHandler = makePressHandler(() => onSelect(node.name, node.folder));
</script>

<div class="tree-node">
  <div
    class="tree-row"
    class:active={activeLib === node.name}
    style="padding-left: {8 + depth * 12}px;"
  >
    {#if node.children && node.children.length > 0}
      <button
        type="button"
        class="tree-arrow"
        on:pointerdown={arrowHandler.down}
        on:pointerup={arrowHandler.up}
        aria-label="Toggle"
      >
        {expanded ? "▼" : "▶"}
      </button>
    {:else}
      <span class="tree-arrow-spacer"></span>
    {/if}

    <button
      type="button"
      class="tree-label"
      on:pointerdown={labelHandler.down}
      on:pointerup={labelHandler.up}
      title={node.name}
    >
      {node.name}
    </button>
  </div>

  {#if expanded && node.children && node.children.length > 0}
    <div class="tree-children">
      {#each node.children as child (child.folder)}
        <svelte:self node={child} {activeLib} {onSelect} depth={depth + 1} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .tree-node {
    width: 100%;
  }
  .tree-row {
    display: flex;
    align-items: center;
    gap: 4px;
    padding-top: 5px;
    padding-bottom: 5px;
    padding-right: 6px;
    cursor: pointer;
    transition: background 0.1s;
  }
  .tree-row:hover {
    background: #222;
  }
  .tree-row.active {
    background: var(--activeColour, #ff007f);
  }
  .tree-row.active .tree-label {
    color: #fff;
    font-weight: bold;
  }
  .tree-arrow {
    background: transparent;
    border: none;
    color: #888;
    font-size: 8px;
    width: 12px;
    flex-shrink: 0;
    cursor: pointer;
    padding: 0;
  }
  .tree-arrow-spacer {
    width: 12px;
    flex-shrink: 0;
    display: inline-block;
  }
  .tree-label {
    flex: 1;
    min-width: 0;
    background: transparent;
    border: none;
    color: #aaa;
    font-size: 11px;
    text-align: left;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 0;
  }
  .tree-row:hover .tree-label {
    color: #fff;
  }
  .tree-row.active .tree-arrow {
    color: #fff;
  }

  .tree-children {
    display: flex;
    flex-direction: column;
    width: 100%;
  }
</style>
