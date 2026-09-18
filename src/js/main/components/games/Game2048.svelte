<script>
  import { onMount, onDestroy } from "svelte";
  import { game2048Stats, forceSaveAllStats } from "../../stores.js";
  import GameBackground from "../../../assets/games/CookieClicker/CookieClicker/background.gif";

  const SIZE = 4;
  const MOVE_MS = 120;
  const POP_MS = 130;

  let wrapperWidth = 260;
  let wrapperHeight = 260;

  $: boardSize = Math.max(120, Math.min(wrapperWidth - 60, wrapperHeight));

  $: PAD = boardSize * 0.035;
  $: GAP = boardSize * 0.035;
  $: CELL = (boardSize - PAD * 2 - GAP * (SIZE - 1)) / SIZE;

  let tiles = [];
  let idCounter = 1;
  let moving = false;

  const TILE_SEQUENCE = [
    2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768,
    65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216,
    33554432, 67108864, 134217728, 268435456, 536870912, 1073741824, 2147483648,
    4294967296, 8589934592, 17179869184, 34359738368, 68719476736, 137438953472,
    274877906944, 549755813888, 1099511627776, 219902, 3255552, 4398046511104,
    8796093022208, 17592186044416, 35184372088832, 70368744177664, 140737488,
  ];

  $: unlockedList = (() => {
    let maxVal = $game2048Stats.highestTile || 2;
    let idx = TILE_SEQUENCE.indexOf(maxVal);
    if (idx === -1) idx = 0;

    let start = Math.max(0, idx - 2);
    return TILE_SEQUENCE.slice(start, idx + 1);
  })();

  function cellAt(row, col, list = tiles) {
    return list.find((t) => t.row === row && t.col === col && !t.removing);
  }

  function emptyCells(list = tiles) {
    const cells = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (!cellAt(r, c, list)) {
          cells.push({ row: r, col: c });
        }
      }
    }
    return cells;
  }

  function addRandomTile() {
    const cells = emptyCells();
    if (!cells.length) return;
    
    const randomCell = cells[Math.floor(Math.random() * cells.length)];
    const id = idCounter++;
    const val = Math.random() < 0.9 ? 2 : 4;

    if (!$game2048Stats.highestTile || val > $game2048Stats.highestTile) {
      $game2048Stats.highestTile = val;
    }

    tiles = [
      ...tiles,
      {
        id: id,
        row: randomCell.row,
        col: randomCell.col,
        value: val,
        isNew: true,
        merging: false,
        removing: false,
      },
    ];

    setTimeout(() => {
      tiles = tiles.map((t) => (t.id === id ? { ...t, isNew: false } : t));
    }, POP_MS);
  }

  function boardValues() {
    const board = Array(SIZE * SIZE).fill(0);
    tiles.forEach((t) => {
      if (!t.removing) {
        board[t.row * SIZE + t.col] = t.value;
      }
    });
    return board;
  }

  function syncStore() {
    $game2048Stats.board = boardValues();
  }

  function vectorFor(direction) {
    if (direction === "up") return { row: -1, col: 0 };
    if (direction === "down") return { row: 1, col: 0 };
    if (direction === "left") return { row: 0, col: -1 };
    if (direction === "right") return { row: 0, col: 1 };
  }

  function withinBounds(r, c) {
    return r >= 0 && r < SIZE && c >= 0 && c < SIZE;
  }

  function buildOrder(vector) {
    let rows = [0, 1, 2, 3];
    let cols = [0, 1, 2, 3];
    if (vector.row === 1) rows = [3, 2, 1, 0];
    if (vector.col === 1) cols = [3, 2, 1, 0];
    return { rows, cols };
  }

  function move(direction) {
    if (moving) return;
    const vector = vectorFor(direction);
    const { rows, cols } = buildOrder(vector);

    let working = tiles.map((t) => ({ ...t, isNew: false, merging: false }));
    let moved = false;
    let gained = 0;
    const removedIds = [];

    rows.forEach((row) => {
      cols.forEach((col) => {
        const tile = cellAt(row, col, working);
        if (!tile) return;

        let farR = row;
        let farC = col;
        
        while (true) {
          const nr = farR + vector.row;
          const nc = farC + vector.col;
          if (!withinBounds(nr, nc)) break;
          if (cellAt(nr, nc, working)) break;
          farR = nr;
          farC = nc;
        }
        
        const nr = farR + vector.row;
        const nc = farC + vector.col;
        const nextTile = withinBounds(nr, nc) ? cellAt(nr, nc, working) : null;

        if (nextTile && nextTile.id !== tile.id && nextTile.value === tile.value && !nextTile.merging) {
          nextTile.value = nextTile.value * 2;
          nextTile.merging = true;
          gained += nextTile.value;

          if (nextTile.value > ($game2048Stats.highestTile || 0)) {
            $game2048Stats.highestTile = nextTile.value;
          }

          tile.row = nr;
          tile.col = nc;
          tile.removing = true;
          removedIds.push(tile.id);
          moved = true;
        } else if (farR !== row || farC !== col) {
          tile.row = farR;
          tile.col = farC;
          moved = true;
        }
      });
    });

    if (!moved) return;

    moving = true;
    tiles = working;
    syncStore();

    setTimeout(() => {
      tiles = tiles.filter((t) => !removedIds.includes(t.id));
      $game2048Stats.score += gained;
      if ($game2048Stats.score > $game2048Stats.bestScore) {
        $game2048Stats.bestScore = $game2048Stats.score;
      }
      addRandomTile();
      syncStore();
      
      setTimeout(() => {
        tiles = tiles.map((t) => ({ ...t, merging: false }));
        moving = false;
      }, POP_MS);
    }, MOVE_MS);
  }

  function handleKeydown(e) {
    const map = {
      ArrowUp: "up", w: "up", z: "up",
      ArrowDown: "down", s: "down",
      ArrowLeft: "left", a: "left", q: "left",
      ArrowRight: "right", d: "right",
    };
    const dir = map[e.key];
    if (dir) {
      e.preventDefault();
      move(dir);
    }
  }

  function restart() {
    tiles = [];
    $game2048Stats.score = 0;
    idCounter = 1;
    addRandomTile();
    addRandomTile();
    syncStore();
  }

  function hardReset() {
    if (confirm("Are you sure you want to reset your 2048 stats? This action cannot be undone.")) {
      $game2048Stats.bestScore = 0;
      $game2048Stats.highestTile = 0;
      restart();
      forceSaveAllStats();
    }
  }

  onMount(() => {
    if (!$game2048Stats.highestTile) {
      let currentMax = 0;
      if ($game2048Stats.board) {
        $game2048Stats.board.forEach((v) => {
          if (v > currentMax) currentMax = v;
        });
      }
      $game2048Stats.highestTile = Math.max(2, currentMax);
    }

    if (!$game2048Stats.board || $game2048Stats.board.every((v) => v === 0)) {
      restart();
    } else {
      let id = 1;
      const loaded = [];
      $game2048Stats.board.forEach((val, i) => {
        if (val) {
          loaded.push({
            id: id++,
            row: Math.floor(i / SIZE),
            col: i % SIZE,
            value: val,
            isNew: false,
            merging: false,
            removing: false,
          });
        }
      });
      idCounter = id;
      tiles = loaded;
    }
    window.addEventListener("keydown", handleKeydown);
  });

  onDestroy(() => {
    if (typeof window !== "undefined") {
      window.removeEventListener("keydown", handleKeydown);
    }
  });

  function getColor(val) {
    const colors = {
      2: "#eee4da", 4: "#ede0c8", 8: "#f2b179", 16: "#f59563",
      32: "#f67c5f", 64: "#f65e3b", 128: "#edcf72", 256: "#edcc61",
      512: "#edc850", 1024: "#edc53f", 2048: "#edc22e"
    };
    return colors[val] || "#3c3a32";
  }

  function getTextColor(val) {
    return val > 4 ? "#ebebeb" : "#776e65";
  }

  function getFontSize(val, cell) {
    if (val >= 1000) return cell * 0.48;
    if (val >= 100) return cell * 0.5;
    return cell * 0.6;
  }

  $: emptySlots = Array.from({ length: SIZE * SIZE });
</script>

<div class="game-widget">
  <img class="game-background" src={GameBackground} alt="" aria-hidden="true" decoding="async" />

  <div class="wrap">
    <div class="head">
      <div class="title-section"></div>
      <div class="scores-container">
        <div class="score-box">
          <span class="label">SCORE</span>
          <span class="value">{$game2048Stats.score}</span>
        </div>
        <div class="score-box best">
          <span class="label">BEST</span>
          <span class="value">{$game2048Stats.bestScore}</span>
        </div>
      </div>
    </div>

    <div class="board-wrapper" bind:clientWidth={wrapperWidth} bind:clientHeight={wrapperHeight}>
      
      <div class="board" style="width:{boardSize}px; height:{boardSize}px; padding:{PAD}px;">
        <div class="grid-bg" style="gap:{GAP}px; grid-template-columns: repeat(4, {CELL}px); grid-template-rows: repeat(4, {CELL}px);">
          {#each emptySlots as _}
            <div class="cell-bg"></div>
          {/each}
        </div>

        <div class="tiles-layer">
          {#each tiles as tile (tile.id)}
            <div
              class="tile"
              class:new={tile.isNew}
              class:merging={tile.merging}
              style="
                width:{CELL}px; height:{CELL}px;
                top:{PAD + tile.row * (CELL + GAP)}px;
                left:{PAD + tile.col * (CELL + GAP)}px;
                background:{getColor(tile.value)};
                color:{getTextColor(tile.value)};
                font-size:{getFontSize(tile.value, CELL)}px;
              "
            >
              {tile.value}
            </div>
          {/each}
        </div>
      </div>

      <div class="unlocks-column">
        <div class="unlocks-title">Max. Tile Record</div>
        {#each unlockedList as val (val)}
          <div
            class="unlock-item"
            style="
              background:{getColor(val)};
              color:{getTextColor(val)};
              font-size:{val >= 1000 ? '1.2rem' : '1.6rem'};
            "
          >
            {val}
          </div>
        {/each}
      </div>
    </div>

    <div class="btn-group">
      <button class="reset" on:click={restart}>New Game</button>
      <button class="reset danger-btn" on:click={hardReset}>Clear Stats</button>
    </div>
  </div>
</div>

<style>
  .game-widget {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
    padding: 5px;
    overflow: hidden;
    border-radius: 8px;
    font-family: "CreamyChicken", sans-serif;
  }

  .game-background {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.22;
    pointer-events: none;
    z-index: 0;
  }

  .wrap {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    max-width: 450px;
  }
  .head {
    flex-shrink: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
    width: 100%;
    margin-bottom: 10px;
    transform: translateX(-40px);
  }

  .scores-container {
    display: flex;
    gap: 5px;
  }

  .score-box {
    background: #333;
    padding: 5px 10px;
    border-radius: 5px;
    font-weight: bold;
    text-align: center;
    color: #bbb;
    min-width: 50px;
  }

  .score-box .label {
    display: block;
    font-size: 0.75rem;
  }

  .score-box .value {
    font-size: clamp(0.9rem, 4vw, 1.1rem);
    color: white;
    display: block;
  }

  .score-box.best {
    background: #4a3b7d;
  }

  .board-wrapper {
    flex: 1 1 auto;
    width: 100%;
    min-height: 0;
    min-width: 0;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 10px;
    overflow: hidden;
  }

  .board {
    position: relative;
    background: #222;
    border-radius: 6px;
    box-sizing: border-box;
    flex-shrink: 0;
  }

  .grid-bg {
    display: grid;
    width: 100%;
    height: 100%;
  }

  .cell-bg {
    background: rgba(238, 228, 218, 0.1);
    border-radius: 4px;
  }

  .tiles-layer {
    font-family: "PhysicNumberFont", sans-serif;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  @font-face {
    font-family: "PhysicNumberFont";
    src: url("../../../assets/fonts/PhysicNumberFont.ttf");
    font-weight: normal;
    font-style: normal;
  }

  .tile {
    font-family: "PhysicNumberFont", sans-serif;
    letter-spacing: -6px;
    font-size: 3rem;
    -webkit-text-stroke: 2px currentColor;
    line-height: 0.8;
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: top 120ms ease, left 120ms ease;
    will-change: top, left;
  }

  .unlocks-column {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 10px;
    width: 50px;
    flex-shrink: 0;
  }

  .unlocks-title {
    font-size: 0.7rem;
    color: #bbb;
    text-align: center;
    font-weight: bold;
    line-height: 1.1;
    margin-bottom: -2px;
  }

  .unlock-item {
    font-family: "PhysicNumberFont", sans-serif;
    letter-spacing: -6px;
    -webkit-text-stroke: 2px currentColor;
    width: 50px;
    height: 50px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.4);
    animation: pop-in 250ms ease-out;
  }

  .tile.new {
    animation: pop-in 130ms ease-out;
  }

  .tile.merging {
    animation: pop-merge 130ms ease-out;
  }

  @keyframes pop-in {
    0% { transform: scale(0); }
    80% { transform: scale(1.15); }
    100% { transform: scale(1); }
  }

  @keyframes pop-merge {
    0% { transform: scale(1); }
    50% { transform: scale(1.18); }
    100% { transform: scale(1); }
  }

  .btn-group {
    flex-shrink: 0;
    display: flex;
    gap: 8px;
    margin-top: 10px;
    flex-wrap: wrap;
  }

  .reset {
    flex: 1 1 130px;
    padding: 10px;
    font-size: 1.3rem;
    background: #6f4aff;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
    transition: 0.2s;
    text-align: center;
  }

  .reset:hover {
    background: #8a6cff;
    transform: scale(1.03);
  }

  .danger-btn {
    background: #9b2c2c;
    border: 1px solid #fc8181;
  }

  .danger-btn:hover {
    background: #c53030 !important;
    box-shadow: 0 0 12px #fc8181 !important;
  }
</style>