<script>
  import {
    balance,
    clickerStats,
    lastPlayed,
    totalEarned,
    forceSaveAllStats,
  } from "../../stores.js";
  import Cookie from "../../../assets/games/CookieClicker/CookieClicker/ClickCat.png";
  import GameBackground from "../../../assets/games/CookieClicker/CookieClicker/background.gif";
  import cookieCatRound from "../../../assets/games/CookieClicker/CookieClicker/cookieCatRound.png";
const SHOP_ITEMS = [
    { id: "cursor", name: "Cursor", type: "click", baseCost: 15, effect: 1, mult: 1.15 },
    { id: "grandma", name: "Grandma", type: "auto", baseCost: 100, effect: 1, mult: 1.15 },
    { id: "farm", name: "Farm", type: "auto", baseCost: 1100, effect: 8, mult: 1.15 },
    { id: "mine", name: "Mine", type: "auto", baseCost: 12000, effect: 47, mult: 1.15 },
    { id: "factory", name: "Factory", type: "auto", baseCost: 130000, effect: 260, mult: 1.15 },
    { id: "bank", name: "Bank", type: "auto", baseCost: 1400000, effect: 1400, mult: 1.15 },
    { id: "temple", name: "Temple", type: "auto", baseCost: 20000000, effect: 7800, mult: 1.15 },
    { id: "wizard-tower", name: "Wizard tower", type: "auto", baseCost: 330000000, effect: 44000, mult: 1.15 },
    { id: "shipment", name: "Shipment", type: "auto", baseCost: 5100000000, effect: 260000, mult: 1.15 },
    { id: "alchemy-lab", name: "Alchemy lab", type: "auto", baseCost: 75000000000, effect: 1600000, mult: 1.15 },
    { id: "portal", name: "Portal", type: "auto", baseCost: 1000000000000, effect: 10000000, mult: 1.15 },
    { id: "time-machine", name: "Time machine", type: "auto", baseCost: 14000000000000, effect: 65000000, mult: 1.15 },
    { id: "antimatter-condenser", name: "Antimatter condenser", type: "auto", baseCost: 170000000000000, effect: 430000000, mult: 1.15 },
    { id: "prism", name: "Prism", type: "auto", baseCost: 2100000000000000, effect: 2900000000, mult: 1.15 },
    { id: "chancemaker", name: "Chancemaker", type: "auto", baseCost: 26000000000000000, effect: 21000000000, mult: 1.15 },
    { id: "fractal-engine", name: "Fractal engine", type: "auto", baseCost: 310000000000000000, effect: 150000000000, mult: 1.15 },
    { id: "javascript-console", name: "Javascript console", type: "auto", baseCost: 71000000000000000000, effect: 1100000000000, mult: 1.15 },
    { id: "idleverse", name: "Idleverse", type: "auto", baseCost: 1.2e22, effect: 8300000000000, mult: 1.15 },
    { id: "cortex-baker", name: "Cortex baker", type: "auto", baseCost: 1.9e24, effect: 64000000000000, mult: 1.15 },
    { id: "you", name: "You", type: "auto", baseCost: 5.4e26, effect: 510000000000000, mult: 1.15 },
  ];

  const UPGRADES = [
    { id: "up-cursor", name: "Sharpened Cursors", targetItemId: "cursor", cost: 15 * 25, multiplier: 2, desc: "Cursor x2" },
    { id: "up-grandma", name: "Grandma's Glasses", targetItemId: "grandma", cost: 100 * 25, multiplier: 2, desc: "Grandma x2" },
    { id: "up-farm", name: "Magic Fertilizer", targetItemId: "farm", cost: 1100 * 25, multiplier: 2, desc: "Farm x2" },
    { id: "up-mine", name: "Reinforced Pickaxes", targetItemId: "mine", cost: 12000 * 25, multiplier: 2, desc: "Mine x2" },
    { id: "up-factory", name: "Automated Assembly Line", targetItemId: "factory", cost: 130000 * 25, multiplier: 2, desc: "Factory x2" },
    { id: "up-bank", name: "Boosted Interest Rate", targetItemId: "bank", cost: 1400000 * 25, multiplier: 2, desc: "Bank x2" },
    { id: "up-temple", name: "Sacred Ritual", targetItemId: "temple", cost: 20000000 * 25, multiplier: 2, desc: "Temple x2" },
    { id: "up-wizard", name: "Advanced Grimoire", targetItemId: "wizard-tower", cost: 330000000 * 25, multiplier: 2, desc: "Wizard tower x2" },
  ];

  const MAX_ICONS_SHOWN = 24;
  const SUFFIXES = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];

  function formatNumber(num) {
    if (num === undefined || num === null || isNaN(num)) {
      return "0";
    }
    if (num < 1000) {
      return Math.floor(num).toString();
    }
    let value = num;
    let suffixIndex = 0;
    while (value >= 1000 && suffixIndex < SUFFIXES.length - 1) {
      value = value / 1000;
      suffixIndex = suffixIndex + 1;
    }
    return value.toFixed(2) + SUFFIXES[suffixIndex];
  }

  function getInitials(name) {
    let words = name.split(" ");
    if (words.length > 1) {
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  let isCtrlDown = false;
  let isShiftDown = false;
  let buyAmount = 1;

  function handleKeydown(e) {
    if (e.key === "Control") isCtrlDown = true;
    if (e.key === "Shift") isShiftDown = true;
  }

  function handleKeyup(e) {
    if (e.key === "Control") isCtrlDown = false;
    if (e.key === "Shift") isShiftDown = false;
  }

  $: {
    if (isShiftDown) {
      buyAmount = 100;
    } else if (isCtrlDown) {
      buyAmount = 10;
    } else {
      buyAmount = 1;
    }
  }

  function calculateTotalCost(itemConfig, currentCount, amount) {
    let total = 0;
    let currentCost = itemConfig.baseCost * Math.pow(itemConfig.mult, currentCount);
    for (let i = 0; i < amount; i = i + 1) {
      total = total + currentCost;
      currentCost = currentCost * itemConfig.mult;
    }
    return Math.ceil(total);
  }

  let clickEffects = [];
  let cookieIsBouncing = false;

  let catVisible = false;
  let catX = 0;
  let catY = 0;
  let catId = 0;
  let catIsLeaving = false;

  let buffIsActive = false;
  let buffMultiplier = 1;
  let buffSecondsLeft = 0;
  let buffTimer = null;
  let buffEndTime = 0;

  function makeStartingItems(oldItems) {
    let items = {};
    for (let i = 0; i < SHOP_ITEMS.length; i = i + 1) {
      let item = SHOP_ITEMS[i];
      if (oldItems && oldItems[item.id]) {
        items[item.id] = oldItems[item.id];
      } else {
        items[item.id] = { count: 0, cost: item.baseCost };
      }
    }
    return items;
  }

  if (!$clickerStats.items || !$clickerStats.upgrades) {
    $clickerStats.clickPower = $clickerStats.clickPower || 1;
    $clickerStats.autoIncome = $clickerStats.autoIncome || 0;
    $clickerStats.items = makeStartingItems($clickerStats.items);
    $clickerStats.upgrades = $clickerStats.upgrades || {};
  } else if (Object.keys($clickerStats.items).length < SHOP_ITEMS.length) {
    $clickerStats.items = makeStartingItems($clickerStats.items);
  }

  function recalculateStats() {
    let click = 0;
    let auto = 0;

    for (let i = 0; i < SHOP_ITEMS.length; i = i + 1) {
      let itemInfo = SHOP_ITEMS[i];
      let itemState = $clickerStats.items[itemInfo.id];
      if (!itemState || itemState.count <= 0) continue;

      let upgradeMultiplier = 1;
      for (let j = 0; j < UPGRADES.length; j = j + 1) {
        let upgrade = UPGRADES[j];
        if (upgrade.targetItemId === itemInfo.id && $clickerStats.upgrades[upgrade.id]) {
          upgradeMultiplier = upgrade.multiplier;
        }
      }

      let scaleBonus = Math.pow(itemState.count, 1.15);
      let power = itemInfo.effect * scaleBonus * upgradeMultiplier;

      if (itemInfo.type === "click") {
        click = click + power;
      } else {
        auto = auto + power;
      }
    }

    if (click < 1) {
      click = 1;
    }

    $clickerStats.clickPower = click;
    $clickerStats.autoIncome = auto;
  }
  recalculateStats();

  $: effectiveClickPower = $clickerStats.clickPower * buffMultiplier;
  $: effectiveAutoIncome = $clickerStats.autoIncome * buffMultiplier;

  function getShopList(total) {
    let list = [];
    for (let i = 0; i < SHOP_ITEMS.length; i = i + 1) {
      let item = SHOP_ITEMS[i];
      let state = $clickerStats.items[item.id];
      if (!state) continue;

      if (state.count > 0 || total >= state.cost / 2) {
        list.push({ item: item, state: state, locked: false });
      }
    }
    return list;
  }
  $: shopList = $clickerStats.items ? getShopList($totalEarned) : [];

  function getUpgradeList() {
    let list = [];
    for (let i = 0; i < UPGRADES.length; i = i + 1) {
      let upgrade = UPGRADES[i];
      let ownsBuilding = $clickerStats.items[upgrade.targetItemId] && $clickerStats.items[upgrade.targetItemId].count > 0;
      let alreadyBought = $clickerStats.upgrades[upgrade.id];
      
      if (ownsBuilding && !alreadyBought) {
        list.push(upgrade);
      }
    }
    return list;
  }
  $: upgradeList = $clickerStats.items && $clickerStats.upgrades ? getUpgradeList() : [];

  function getOwnedList() {
    let list = [];
    for (let i = 0; i < SHOP_ITEMS.length; i = i + 1) {
      let item = SHOP_ITEMS[i];
      let state = $clickerStats.items[item.id];
      
      if (state && state.count > 0) {
        let visible = state.count;
        if (visible > MAX_ICONS_SHOWN) {
          visible = MAX_ICONS_SHOWN;
        }
        let hidden = state.count - MAX_ICONS_SHOWN;
        if (hidden < 0) {
          hidden = 0;
        }
        list.push({
          item: item,
          count: state.count,
          visibleIcons: visible,
          hiddenCount: hidden,
        });
      }
    }
    return list;
  }
  $: ownedList = $clickerStats.items ? getOwnedList() : [];

  function clickCookie(event) {
    let gain = Math.floor(effectiveClickPower);
    if (gain < 1) {
      gain = 1;
    }
    $balance = $balance + gain;
    $totalEarned = $totalEarned + gain;

    let rect = event.currentTarget.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    let effectId = Date.now() + Math.random();

    clickEffects.push({ id: effectId, x: x, y: y, val: gain });
    clickEffects = clickEffects;

    setTimeout(function () {
      clickEffects = clickEffects.filter(function (e) {
        return e.id !== effectId;
      });
    }, 800);

    cookieIsBouncing = false;
    setTimeout(function () {
      cookieIsBouncing = true;
    }, 10);
  }

  function buyItem(itemConfig, amount = 1) {
    let itemState = $clickerStats.items[itemConfig.id];
    if (!itemState) return;

    let totalCost = calculateTotalCost(itemConfig, itemState.count, amount);
    if ($balance < totalCost) return;

    $balance = $balance - totalCost;
    itemState.count = itemState.count + amount;
    itemState.cost = Math.ceil(itemConfig.baseCost * Math.pow(itemConfig.mult, itemState.count));

    $clickerStats.items = $clickerStats.items;
    recalculateStats();
  }

  function buyUpgrade(upgrade) {
    if ($clickerStats.upgrades[upgrade.id]) return;
    if ($balance < upgrade.cost) return;

    $balance = $balance - upgrade.cost;
    $clickerStats.upgrades[upgrade.id] = true;
    $clickerStats.upgrades = $clickerStats.upgrades;
    recalculateStats();
  }

  function spawnCat() {
    if (typeof window === "undefined") return;
    let size = 40;
    let maxX = window.innerWidth - size;
    let maxY = window.innerHeight - size;
    if (maxX < 0) maxX = 0;
    if (maxY < 0) maxY = 0;

    catId = Date.now();
    catX = Math.floor(Math.random() * maxX);
    catY = Math.floor(Math.random() * maxY);
    catVisible = true;
    catIsLeaving = false;

    let thisCatId = catId;
    setTimeout(function () {
      if (catVisible && catId === thisCatId) {
        catVisible = false;
      }
    }, 8000);
  }

  function showCatToast(text) {
    if (typeof document === "undefined") return;
    let toast = document.createElement("div");
    toast.textContent = text;
    toast.style.position = "fixed";
    toast.style.top = "12px";
    toast.style.left = "50%";
    toast.style.transform = "translateX(-50%)";
    toast.style.background = "linear-gradient(135deg, var(--activeColour), color-mix(in srgb, var(--activeColour) 60%, white))";
    toast.style.color = "white";
    toast.style.padding = "8px 16px";
    toast.style.borderRadius = "10px";
    toast.style.fontWeight = "bold";
    toast.style.fontSize = "0.85rem";
    toast.style.zIndex = "10000";
    toast.style.boxShadow = "0 4px 20px rgba(0,0,0,0.6)";
    toast.style.transition = "opacity 0.4s";
    toast.style.whiteSpace = "nowrap";
    toast.style.fontFamily = "'Museo Sans', sans-serif";
    
    document.body.appendChild(toast);
    
    setTimeout(function () {
      toast.style.opacity = "0";
    }, 2200);
    
    setTimeout(function () {
      toast.remove();
    }, 2700);
  }

  function startBuff(multiplier, durationSeconds) {
    clearInterval(buffTimer);
    buffIsActive = true;
    buffMultiplier = multiplier;
    buffSecondsLeft = durationSeconds;
    buffEndTime = Date.now() + (durationSeconds * 1000);

    buffTimer = setInterval(function () {
      let secondsLeft = Math.round((buffEndTime - Date.now()) / 1000);
      if (secondsLeft < 0) secondsLeft = 0;
      buffSecondsLeft = secondsLeft;

      if (buffSecondsLeft <= 0) {
        clearInterval(buffTimer);
        buffIsActive = false;
        buffMultiplier = 1;
      }
    }, 250);
  }

  function clickCat() {
    if (!catVisible || catIsLeaving) return;

    let giveCoins = Math.random() < 0.5;
    if (giveCoins) {
      let base = (effectiveAutoIncome * 60) + (effectiveClickPower * 20);
      if (base < 50) base = 50;
      let gain = Math.floor(base * (1 + (Math.random() * 2)));
      
      $balance = $balance + gain;
      $totalEarned = $totalEarned + gain;
      showCatToast("+" + formatNumber(gain) + "$ !");
    } else {
      let choices = [3, 5, 7];
      let multiplier = choices[Math.floor(Math.random() * choices.length)];
      let duration = 20 + Math.floor(Math.random() * 40);
      
      startBuff(multiplier, duration);
      showCatToast("Production x" + multiplier + " pendant " + duration + "s !");
    }

    catIsLeaving = true;
    setTimeout(function () {
      catVisible = false;
      catIsLeaving = false;
    }, 180);
  }

  let catSpawnChance = 0.05;

  function scheduleNextCatCheck() {
    let minDelay = 1000;
    let maxDelay = 3000;
    let delay = minDelay + Math.floor(Math.random() * (maxDelay - minDelay));

    setTimeout(function () {
      if (Math.random() < catSpawnChance && !catVisible) {
        spawnCat();
      }
      scheduleNextCatCheck();
    }, delay);
  }
  
  scheduleNextCatCheck();

  function resetClicker() {
    let sure = confirm("Did you want to reset the game? This will erase all your progress.");
    if (!sure) return;

    clearInterval(buffTimer);
    buffIsActive = false;
    buffMultiplier = 1;

    $clickerStats.clickPower = 1;
    $clickerStats.autoIncome = 0;
    $clickerStats.items = makeStartingItems(null);
    $clickerStats.upgrades = {};
    $balance = 0;
    $totalEarned = 0;
    $lastPlayed = Date.now();

    forceSaveAllStats();
  }
</script>

<svelte:window on:keydown={handleKeydown} on:keyup={handleKeyup} />

<div class="clicker-wrap">
  <img class="game-background" src={GameBackground} alt="" aria-hidden="true" decoding="async" />

  <header class="topbar">
    <div class="count-block">
      <span class="count-value">{formatNumber($balance)}</span>
      <span class="count-suffix">$</span>
    </div>
    <div class="sub-stats">
      <span>Total won : {formatNumber($totalEarned)}$</span>
      <span class="dot">|</span>
      <span>{formatNumber(effectiveAutoIncome)}$ p sec</span>
      <span class="dot">|</span>
      <span>{formatNumber(effectiveClickPower)}$ p clic</span>
    </div>
    {#if buffIsActive}
      <div class="buff-banner">x{buffMultiplier}$ for {buffSecondsLeft}s</div>
    {/if}
  </header>

  <div class="game-body">
    <section class="cookie-panel">
      <div class="cookie-container">
        <div class="cookie-rotator">
          <button type="button" class="cookie-btn {cookieIsBouncing ? 'bounce' : ''}" on:click={clickCookie} on:animationend={() => (cookieIsBouncing = false)} aria-label="Cookie">
            <img src={Cookie} alt="Cookie" id="cookie-img" decoding="async" />
          </button>
        </div>
        {#each clickEffects as effect (effect.id)}
          <div class="floating-text" style="left: {effect.x}px; top: {effect.y}px">
            +{formatNumber(effect.val)}$
          </div>
        {/each}
      </div>
    </section>

    <section class="info-panel">
      <h2 class="panel-title">Your Collection</h2>
      {#if ownedList.length > 0}
        <div class="collection-list">
          {#each ownedList as row (row.item.id)}
            <div class="collection-row">
              <div class="collection-icons">
                {#each Array(row.visibleIcons) as _}
                  <span class="collection-icon">{getInitials(row.item.name)}</span>
                {/each}
                {#if row.hiddenCount > 0}
                  <span class="collection-icon-more">+{formatNumber(row.hiddenCount)}</span>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <p class="empty-hint">Click the cat to start your collection!</p>
      {/if}
    </section>

    <aside class="shop-panel">
      <div class="shop-scroll">
        <h2 class="panel-title">Upgrades</h2>
        <div class="shop-list">
          {#if upgradeList.length > 0}
            {#each upgradeList as upgrade (upgrade.id)}
              <button class="shop-row" on:click={() => buyUpgrade(upgrade)} disabled={$balance < upgrade.cost}>
                <div class="shop-row-main">
                  <span class="shop-row-name">{upgrade.name}</span>
                  <span class="shop-row-desc">{upgrade.desc}</span>
                </div>
                <div class="shop-row-side">
                  <span class="shop-row-cost">{formatNumber(upgrade.cost)}$</span>
                </div>
              </button>
            {/each}
          {:else}
            <p class="empty-hint small">Own a building to unlock its upgrades.</p>
          {/if}
        </div>

        <h2 class="panel-title">
          Buildings {#if buyAmount > 1}<span class="multiplier-tag">x{buyAmount}</span>{/if}
        </h2>
        <div class="shop-list">
          {#each shopList as row (row.item.id)}
            {@const cost = calculateTotalCost(row.item, row.state.count, buyAmount)}
            <button class="shop-row {row.locked ? 'locked' : ''}" on:click={() => (row.locked ? null : buyItem(row.item, buyAmount))} disabled={row.locked || $balance < cost}>
              <div class="shop-row-main">
                <span class="shop-row-name">{row.locked ? "[locked] " : ""}{row.item.name}</span>
                <span class="shop-row-desc">
                  {row.item.type === "click"
                    ? "+" + formatNumber(row.state.count > 0 ? row.item.effect * Math.pow(row.state.count, 1.15) : row.item.effect) + "/clic"
                    : "+" + formatNumber(row.state.count > 0 ? row.item.effect * Math.pow(row.state.count, 1.15) : row.item.effect) + "$/s"}
                </span>
              </div>
              <div class="shop-row-side">
                <span class="shop-row-cost">{formatNumber(cost)}$</span>
                <span class="shop-row-count">{row.state.count}</span>
              </div>
            </button>
          {/each}
        </div>
      </div>
    </aside>
  </div>
  
  <button class="mini-btn reset-btn" on:click={resetClicker}>Reset</button>

  {#if catVisible}
    <button class="cat-bonus {catIsLeaving ? 'leaving' : ''}" style="left:{catX}px; top:{catY}px; pointer-events:{catIsLeaving ? 'none' : 'auto'};" on:click={clickCat} aria-label="Bonus">
      <img src={cookieCatRound} alt="Bonus" class="cat-image" decoding="async" />
    </button>
  {/if}
</div>

<style lang="scss">
  * {
    box-sizing: border-box;
  }

  .clicker-wrap {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    min-width: 0;
    color: #f0f0f0;
    font-weight: 100;
    font-family: "CreamyChicken", sans-serif;
    background: transparent;
    overflow: hidden;
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

  .topbar,
  .game-body {
    position: relative;
    z-index: 1;
  }

  .topbar {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: clamp(4px, 2.5vw, 8px);
    background-color: rgba(26, 26, 26, 0.1);
    gap: 2px;
  }
  .count-block {
    display: flex;
    align-items: baseline;
    gap: 4px;
    line-height: 1;
  }
  .count-value {
    font-weight: 800;
    font-family: "Super Bouncer", sans-serif;
    font-size: clamp(1.4rem, 5vw, 2.4rem);
    color: var(--activeColour);
    word-break: break-all;
  }
  .count-suffix {
    font-size: clamp(0.9rem, 3vw, 1.3rem);
    color: var(--activeColour);
    opacity: 0.85;
  }
  .sub-stats {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
    font-size: clamp(0.65rem, 2.2vw, 0.85rem);
    color: #ccc;
  }
  .sub-stats .dot {
    opacity: 0.4;
  }
  .buff-banner {
    margin-top: 4px;
    color: #fff;
    font-weight: bold;
    padding: 2px 10px;
    border-radius: 999px;
    font-size: clamp(0.65rem, 2.2vw, 0.8rem);
  }

  .game-body {
    flex: 1 1 auto;
    display: flex;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
  }

  .panel-title {
    margin: 4px 0 5px;
    font-size: clamp(0.65rem, 2.1vw, 0.85rem);
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    text-align: center;
    color: #fff;
    padding-bottom: 4px;
    border-bottom: 1px solid rgb(43, 43, 43);
    flex: 0 0 auto;
    width: 100%;
  }

  .multiplier-tag {
    color: var(--activeColour);
    font-size: 0.9em;
    margin-left: 4px;
  }
  
  .cookie-panel {
    position: relative;
    flex: 0 0 32%;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: clamp(4px, 2vh, 20px) clamp(4px, 2vw, 16px);
    overflow: hidden;
  }

  .cookie-container {
    position: relative;
    user-select: none;
    width: min(85%, 240px);
    aspect-ratio: 1 / 1;
    max-height: 55vh;
  }

  .cookie-btn {
    width: 100%;
    height: 100%;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    filter: drop-shadow(0 0 18px rgba(255, 200, 0, 0.4));
  }
  .cookie-rotator {
    width: 100%;
    height: 100%;
    animation: cookieRotate 8s linear infinite;
  }
  .cookie-btn.bounce {
    animation: cookieSmoothBounce 0.35s ease-out;
  }
  
  @keyframes cookieSmoothBounce {
    0% { transform: scale(1); }
    40% { transform: scale(0.92); }
    70% { transform: scale(1.03); }
    100% { transform: scale(1); }
  }
  @keyframes cookieRotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  #cookie-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
  }

  .floating-text {
    position: absolute;
    font-size: clamp(0.9rem, 4vw, 1.6rem);
    font-weight: bold;
    color: var(--activeColour);
    pointer-events: none;
    animation: floatUp 0.8s ease-out forwards;
    text-shadow: 0 0 6px #000;
    white-space: nowrap;
  }
  
  @keyframes floatUp {
    to {
      transform: translateY(-40px);
      opacity: 0;
    }
  }

  .info-panel {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(4px, 1vh, 8px);
    padding: clamp(4px, 2vh, 8px) clamp(4px, 2vw, 8px);
    background-color: rgba(26, 26, 26, 0.1);
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 5px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: var(--activeColour);
      border-radius: 4px;
    }
  }

  .collection-list {
    display: flex;
    flex-direction: column;
    gap: clamp(4px, 1vh, 8px);
    width: 100%;
  }

  .collection-row {
    background-color: rgba(31, 31, 31, 0.8);
    border-radius: 4px;
    padding: clamp(4px, 1vh, 8px) clamp(6px, 1.5vw, 10px);
  }

  .collection-icons {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
  }
  .collection-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.4em;
    height: 1.4em;
    padding: 0 3px;
    font-size: clamp(0.55rem, 1.7vw, 0.68rem);
    font-weight: bold;
    line-height: 1;
    color: #fff;
    background-color: var(--activeColour);
    border-radius: 4px;
  }
  .collection-icon-more {
    font-size: clamp(0.55rem, 1.7vw, 0.68rem);
    font-weight: bold;
    color: #999;
    align-self: center;
    padding-left: 2px;
  }
  .empty-hint {
    font-size: clamp(0.7rem, 2.2vw, 0.85rem);
    color: #ccc;
    text-align: center;
    opacity: 0.8;
    margin: 0;
  }
  .empty-hint.small {
    font-size: clamp(0.55rem, 1.8vw, 0.68rem);
    padding: 6px 4px;
    margin: 0;
  }

  .cat-bonus {
    position: fixed;
    background: transparent;
    border: none;
    outline: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
    animation: catPulse 0.6s ease-in-out infinite alternate;
    z-index: 9999;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    filter: drop-shadow(0 0 18px rgba(255, 200, 0, 0.4));

    &:focus,
    &:focus-visible {
      outline: none;
    }
  }
  .cat-image {
    width: 5em;
    height: 5em;
    object-fit: contain;
    pointer-events: none;
  }

  @keyframes catPulse {
    from { transform: scale(1); }
    to { transform: scale(1.08); }
  }
  
  .cat-bonus.leaving {
    animation: none;
    transition: transform 0.18s ease-in, opacity 0.18s ease-in;
    transform: scale(0.3);
    opacity: 0;
  }

  .shop-panel {
    flex: 0 0 clamp(150px, 34%, 240px);
    min-width: 0;
    display: flex;
    flex-direction: column;
    background-color: rgba(26, 26, 26, 0.1);
    padding: clamp(4px, 1.5vh, 8px) clamp(4px, 1.5vw, 8px);
    min-height: 0;
  }

  .shop-scroll {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding-right: 2px;

    &::-webkit-scrollbar {
      width: 5px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: var(--activeColour);
      border-radius: 4px;
    }
  }

  .shop-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 6px;
  }

  .shop-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 4px;
    padding: 5px 7px;
    background-color: rgba(31, 31, 31, 0.6);
    color: #fff;
    border: 1px solid rgb(60, 60, 60);
    border-radius: 4px;
    cursor: pointer;
    text-align: left;
    min-width: 0;
    transition: transform 0.12s ease, border-top-color 0.15s ease, background-color 0.15s ease;

    &:hover:not(:disabled) {
      background-color: var(--activeColour);
      color: #fff;
      transform: translateY(-1px);
    }
    &:active:not(:disabled) {
      transform: scale(0.98);
    }
    &:disabled {
      background-color: rgba(35, 35, 35, 0.1);
      color: #666;
      border-left-color: #333;
      cursor: not-allowed;
    }
    &.locked {
      background: #232323;
      border-left-color: #333;
      color: #777;
      opacity: 0.8;
    }
  }

  .shop-row-main {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1 1 auto;
  }
  .shop-row-name {
    font-size: clamp(0.62rem, 2.1vw, 0.78rem);
    font-weight: bold;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .shop-row-desc {
    font-size: clamp(0.5rem, 1.7vw, 0.65rem);
    color: #aaa;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .locked .shop-row-desc {
    color: #666;
  }

  .shop-row-side {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    flex: 0 0 auto;
  }
  .shop-row-cost {
    font-size: clamp(0.55rem, 1.8vw, 0.7rem);
    color: #00dc60;
    font-weight: bold;
    white-space: nowrap;
  }
  .shop-row:disabled .shop-row-cost {
    color: #666;
  }
  .shop-row-count {
    font-size: clamp(0.9rem, 2.8vw, 1.2rem);
    font-weight: bold;
    opacity: 0.75;
  }
  
  .mini-btn {
    position: absolute;
    top: 7px;
    right: 46px;
    z-index: 999;
    width: auto;
    height: auto;
    margin: 0;
    color: white;
    background-color: rgba(49, 49, 49, 0.3);
    border-radius: 4px;
    outline: none;
    font-size: clamp(0.55rem, 1.8vw, 0.7rem);
    font-weight: 600;
    padding: 9px 8px;
    border: 1px solid rgba(104, 104, 104, 0.61);
    cursor: pointer;
    transition: transform 0.2s ease-in-out;
  }

  .reset-btn {
    background-color: rgba(160, 20, 20, 0.3);
    border-color: rgb(190, 30, 30);

    &:hover {
      background-color: rgb(200, 30, 30);
      transform: scale(1.02);
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.9);
    }

    &:active {
      transform: scale(0.97);
    }
  }
</style>