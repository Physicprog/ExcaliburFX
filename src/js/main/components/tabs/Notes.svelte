<script>
  import { onMount } from "svelte";
  import { readNotes, saveNotes } from "../../../lib/utils/main.js";
  import { censorField } from "../utils/profanity.ts";

  let text = "";
  let textareaEl;
  let scrollTop = 0;
  let activeLine = 1;
  let saveTimer;

  let showMenu = false;
  let menuItems = [];
  let menuIndex = 0;
  let menuX = 14;
  let menuY = 18;

  let commands = [
    "clear",
    "todo",
    "line",
    "date",
    "Enable christmas mode",
    "Enable christmas mode",
    "Enable christmas mode",
    "Enable christmas mode",
  ];

  onMount(() => {
    text = readNotes();
  });

  function runCommand(cmd) {
    if (cmd === "clear") {
      text = "";
      saveNotes("");
    } else if (cmd === "todo") {
      insertText("- [ ] ");
    } else if (cmd === "line") {
      insertText("\n---\n");
    } else if (cmd === "date") {
      let now = new Date();
      insertText(now.toLocaleDateString());
    } else if (cmd === "Enable christmas mode") {
      insertText("NOEL");
    }
    showMenu = false;
    menuItems = [];
  }

  function insertText(value) {
    if (!textareaEl) return;

    let cursor = textareaEl.selectionStart;
    let before = text.slice(0, cursor);
    let after = text.slice(cursor);
    let slashPos = before.lastIndexOf("/");

    if (slashPos >= 0) {
      before = before.slice(0, slashPos);
    }

    text = before + value + after;
    let newCursor = before.length + value.length;

    setTimeout(() => {
      textareaEl.focus();
      textareaEl.selectionStart = newCursor;
      textareaEl.selectionEnd = newCursor;
    }, 0);

    handleInput();
  }

  function updateMenuPosition() {
    if (!textareaEl) return;

    let cursor = textareaEl.selectionStart;
    let before = text.slice(0, cursor);
    let lines = before.split("\n");
    let lineIndex = lines.length - 1;
    let colIndex = lines[lines.length - 1].length;

    let container = textareaEl.closest("#NoteContainer");
    let containerRect = container ? container.getBoundingClientRect() : null;
    let textareaRect = textareaEl.getBoundingClientRect();

    let x = (textareaRect.left - (containerRect ? containerRect.left : 0)) + 14 + (colIndex * 7.2);
    let y = (textareaRect.top - (containerRect ? containerRect.top : 0)) + 10 + (lineIndex * 22);

    menuX = x < 14 ? 14 : x;
    menuY = y < 14 ? 14 : y;
  }

  function updateMenu() {
    if (!textareaEl) {
      showMenu = false;
      return;
    }

    let cursor = textareaEl.selectionStart;
    let before = text.slice(0, cursor);
    let slashPos = before.lastIndexOf("/");

    if (slashPos < 0) {
      showMenu = false;
      menuItems = [];
      return;
    }

    let query = before.slice(slashPos + 1);
    if (!/^[a-zA-Z0-9_-]*$/.test(query)) {
      showMenu = false;
      menuItems = [];
      return;
    }

    menuItems = commands.filter((cmd) => cmd.toLowerCase().includes(query.toLowerCase()));

    if (menuItems.length === 0) {
      showMenu = false;
      return;
    }

    menuIndex = 0;
    updateMenuPosition();
    showMenu = true;
  }

  function handleInput() {
    updateActiveLine();
    updateMenu();

    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveNotes(text);
    }, 300);
  }

  function clearNotes() {
    text = "";
    saveNotes("");
    showMenu = false;
    menuItems = [];
    updateActiveLine();
  }

  function handleKeydown(event) {
    if (!showMenu) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      menuIndex = (menuIndex + 1) % menuItems.length;
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      menuIndex = (menuIndex - 1 + menuItems.length) % menuItems.length;
    } else if (event.key === "Enter") {
      event.preventDefault();
      runCommand(menuItems[menuIndex]);
    } else if (event.key === "Escape") {
      showMenu = false;
      menuItems = [];
    }
  }

  function updateActiveLine() {
    if (!textareaEl) return;
    let cursor = textareaEl.selectionStart;
    let before = text.substring(0, cursor);
    activeLine = before.split("\n").length;
  }

  function handleScroll(event) {
    scrollTop = event.target.scrollTop;
  }

  $: totalLines = text.split("\n").length;
  $: lineNumbers = Array.from({ length: totalLines }, (_, i) => i + 1);
</script>

<div class="tab-view">
  <div id="NoteContainer">
    <button class="clear-notes-button" on:click={clearNotes}>
      Clear Notes
    </button>

    <div id="hightlightLine" style="transform: translateY({(activeLine - 1) * 22 - scrollTop}px);"></div>

    <div id="lineNumber">
      <div class="numbers-wrapper" style="transform: translateY(-{scrollTop}px);">
        {#each lineNumbers as line}
          <div class="num" class:active={line === activeLine}>{line}</div>
        {/each}
      </div>
    </div>

    <textarea
      id="QuickNotes"
      bind:this={textareaEl}
      bind:value={text}
      use:censorField
      on:input={handleInput}
      on:keydown={handleKeydown}
      on:keyup={updateActiveLine}
      on:click={updateActiveLine}
      on:scroll={handleScroll}
      spellcheck="false"
      placeholder="Type all you want to remember..."
    ></textarea>

    {#if showMenu && menuItems.length > 0}
      <div class="slash-menu" style="left: {menuX}px; top: {menuY}px;">
        <div class="slash-menu-list">
          {#each menuItems as cmd, index}
            <button type="button" class:active={index === menuIndex} on:click={() => runCommand(cmd)}>
              {cmd}
            </button>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .tab-view {
    width: 100%;
    height: 100%;
    flex: 1;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }

  #NoteContainer {
    position: relative;
    width: 100%;
    height: 100%;
    flex: 1;
    background-color: #1c1c1c;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    display: grid;
    grid-template-columns: 32px 1fr;
  }

  #hightlightLine {
    position: absolute;
    top: 10px;
    left: 32px;
    width: calc(100% - 32px);
    height: 22px;
    background: rgba(255, 255, 255, 0.03);
    border-left: 2px solid var(--activeColour, #7857ff);
    z-index: 1;
    pointer-events: none;
  }

  #lineNumber {
    position: relative;
    height: 100%;
    border-right: 1px solid rgba(255, 255, 255, 0.04);
    background: rgba(255, 255, 255, 0.015);
    z-index: 2;
    overflow: hidden;
    user-select: none;
  }

  .numbers-wrapper {
    padding: 10px 0;
  }

  .num {
    height: 22px;
    line-height: 22px;
    font-size: 10px;
    text-align: center;
    color: #444;
    font-family: monospace;
  }

  .num.active {
    color: var(--activeColour, #7857ff);
    font-weight: bold;
  }

  .clear-notes-button {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 3;
    background-color: var(--activeColour, #7857ff);
    color: #fff;
    border: none;
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 12px;
    cursor: pointer;
  }

  .slash-menu {
    position: absolute;
    z-index: 10;
    width: 170px;
    background: #111;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45);
  }

  .slash-menu-list {
    display: flex;
    flex-direction: column;
    padding: 6px;
    gap: 2px;
  }

  .slash-menu-list button {
    background: transparent;
    border: none;
    color: #e8e8e8;
    text-align: left;
    padding: 6px 8px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    font-family: monospace;
  }

  .slash-menu-list button.active,
  .slash-menu-list button:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
  }

  #QuickNotes {
    width: 100%;
    height: 100%;
    background: transparent;
    color: #d4d4d4;
    font-size: 12px;
    font-family: monospace;
    line-height: 22px;
    padding: 10px 12px;
    border: none;
    outline: none;
    resize: none;
    z-index: 2;
    white-space: pre;
    overflow: auto;
  }
</style>