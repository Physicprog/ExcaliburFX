<script>
  import { onMount, onDestroy } from "svelte";
  import { get } from "svelte/store";
  import {
    stickHeroStats,
    resetStickHeroBestScore,
    resetStickHeroSettings,
    volumeState,
  } from "../../stores.js";
  import SettingsButton from "../../../assets/ui/settings.png";

  import dropSoundUrl from "../../../assets/volume/WinNoBonus.mp3";
  import walkSoundUrl from "../../../assets/volume/Walking.mp3";
  import perfectSoundUrl from "../../../assets/volume/WinWBonus.mp3";
  import loseSoundUrl from "../../../assets/volume/Failed.mp3";

  let stretchAudio;
  let dropAudio;
  let walkAudio;
  let perfectAudio;
  let loseAudio;

  function playSound(audioInstance, url, loop) {
    let currentVolume = get(volumeState);

    if (currentVolume === "mute") {
      return audioInstance;
    }
    if (typeof window === "undefined") {
      return audioInstance;
    }

    if (!audioInstance) {
      audioInstance = new Audio(url);
    }

    if (loop === true) {
      audioInstance.loop = true;
    } else {
      audioInstance.loop = false;
    }

    if (currentVolume === "low") {
      audioInstance.volume = 0.3;
    } else {
      audioInstance.volume = 1;
    }

    audioInstance.currentTime = 0;

    let playPromise = audioInstance.play();
    if (playPromise) {
      playPromise.catch(function (err) {
        console.warn(err);
      });
    }

    return audioInstance;
  }

  function stopAudio(audioInstance) {
    if (audioInstance) {
      audioInstance.pause();
      audioInstance.currentTime = 0;
    }
  }

  function playWalkSound() {
    walkAudio = playSound(walkAudio, walkSoundUrl, true);
  }

  function stopWalkSound() {
    stopAudio(walkAudio);
  }

  function playDropSound() {
    dropAudio = playSound(dropAudio, dropSoundUrl, false);
  }

  function playPerfectSound() {
    perfectAudio = playSound(perfectAudio, perfectSoundUrl, false);
  }

  function playLoseSound() {
    loseAudio = playSound(loseAudio, loseSoundUrl, false);
  }

  function stopAllSounds() {
    stopAudio(stretchAudio);
    stopAudio(walkAudio);
    stopAudio(dropAudio);
    stopAudio(perfectAudio);
    stopAudio(loseAudio);
  }

  let canvas;
  let ctx;
  let container;

  let score = 0;
  let introOpacity = 1;
  let perfectOpacity = 0;
  let showRestart = false;
  let isNewRecord = false;
  let openSettingsPanel = false;

  $: isGameInProgress = score > 0 || phase !== "waiting";

  let perfectChain = 0;
  let accumulatedGambleBonus = 0;
  let showGambleLoss = false;
  let lastLostBonus = 0;
  let lossTimeoutId;

  $: bestScore = $stickHeroStats?.bestScore || 0;
  $: settings = $stickHeroStats?.settings || {
    stretchingSpeed: 1,
    turningSpeed: 1,
    walkingSpeed: 1,
    fallingSpeed: 1,
    gambleMode: false,
  };

  let width = 375;
  let height = 375;
  let phase = "waiting";
  let lastTimestamp;
  let animationFrameId;
  let perfectTimeoutId;
  let resizeObserver;

  let heroX = 0;
  let heroY = 0;
  let sceneOffset = 0;

  let platforms = [];
  let sticks = [];
  let trees = [];

  const canvasWidth = 375;
  const canvasHeight = 375;
  const platformHeight = 100;
  const heroDistanceFromEdge = 10;
  const paddingX = 100;
  const perfectAreaSize = 10;
  const backgroundSpeedMultiplier = 0.2;

  const hill1BaseHeight = 100;
  const hill1Amplitude = 10;
  const hill1Stretch = 1;
  const hill2BaseHeight = 70;
  const hill2Amplitude = 20;
  const hill2Stretch = 0.5;

// Calibrage naturel pour Stick Hero (vitesse de référence x1)
const baseStretchingSpeed = 4.5;    // ~220 px/s (le bâton monte vite sans être incontrôlable)
const baseTurningSpeed = 3.5;       // ~0.3 seconde pour basculer à 90°
const baseWalkingSpeed = 3.2;       // ~310 px/s (marche rythmée et fluide)
const baseTransitioningSpeed = 2.2; // Défilement rapide de la caméra vers la plateforme suivante
const baseFallingSpeed = 1.8;       // Chute sèche et punitive quand on rate

  const heroWidth = 17;
  const heroHeight = 30;

  function last(arr) {
    if (arr && arr.length > 0) {
      return arr[arr.length - 1];
    } else {
      return null;
    }
  }

  function sinus(degree) {
    return Math.sin((degree / 180) * Math.PI);
  }

  function resetGame() {
    stopAllSounds();
    phase = "waiting";
    lastTimestamp = undefined;
    sceneOffset = 0;
    score = 0;

    perfectChain = 0;
    accumulatedGambleBonus = 0;
    showGambleLoss = false;

    introOpacity = 1;
    perfectOpacity = 0;
    showRestart = false;
    isNewRecord = false;

    platforms = [];
    platforms.push({ x: 50, w: 50 });

    generatePlatform();
    generatePlatform();
    generatePlatform();
    generatePlatform();

    sticks = [];
    sticks.push({ x: platforms[0].x + platforms[0].w, length: 0, rotation: 0 });

    trees = [];
    for (let i = 0; i < 10; i++) {
      generateTree();
    }

    heroX = platforms[0].x + platforms[0].w - heroDistanceFromEdge;
    heroY = 0;

    if (animationFrameId) {
      window.cancelAnimationFrame(animationFrameId);
    }
    animationFrameId = window.requestAnimationFrame(animate);
  }

  function generateTree() {
    let minimumGap = 30;
    let maximumGap = 150;
    let lastTree = last(trees);
    let furthestX = 0;

    if (lastTree) {
      furthestX = lastTree.x;
    }

    let x = furthestX + minimumGap + Math.floor(Math.random() * (maximumGap - minimumGap));
    let treeColors = ["#6D8821", "#8FAC34", "#98B333"];
    let color = treeColors[Math.floor(Math.random() * treeColors.length)];

    trees.push({ x: x, color: color });
  }

  function generatePlatform() {
    let minimumGap = 40;
    let maximumGap = 200;
    let minimumWidth = 20;
    let maximumWidth = 100;

    let lastPlatform = last(platforms);
    let furthestX = 0;

    if (lastPlatform) {
      furthestX = lastPlatform.x + lastPlatform.w;
    }

    let x = furthestX + minimumGap + Math.floor(Math.random() * (maximumGap - minimumGap));
    let w = minimumWidth + Math.floor(Math.random() * (maximumWidth - minimumWidth));

    platforms.push({ x: x, w: w });
  }

  function handlePressStart() {
    if (showRestart || openSettingsPanel) {
      return;
    }
    if (phase === "waiting") {
      lastTimestamp = undefined;
      introOpacity = 0;
      phase = "stretching";
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
      animationFrameId = window.requestAnimationFrame(animate);
    }
  }

  function handlePressEnd() {
    if (phase === "stretching") {
      phase = "turning";
    }
  }

  function handleKeyDown(event) {
    if (event.key === " " && !openSettingsPanel) {
      event.preventDefault();
      if (showRestart) {
        resetGame();
      } else {
        handlePressStart();
      }
    }
  }

  function handleKeyUp(event) {
    if (event.key === " " && !openSettingsPanel) {
      event.preventDefault();
      handlePressEnd();
    }
  }

  function handleGameOver() {
    if (score > bestScore) {
      isNewRecord = true;
      stickHeroStats.update(function (s) {
        return { ...s, bestScore: score };
      });
    }
    showRestart = true;
  }

  function animate(timestamp) {
    if (!lastTimestamp) {
      lastTimestamp = timestamp;
      animationFrameId = window.requestAnimationFrame(animate);
      return;
    }

    let timeDelta = timestamp - lastTimestamp;
    let currentStick = last(sticks);

    if (!currentStick) {
      return;
    }

    let stretchMult = settings.stretchingSpeed || 1;
    let turnMult = settings.turningSpeed || 1;
    let walkMult = settings.walkingSpeed || 1;
    let fallMult = settings.fallingSpeed || 1;

    if (phase === "waiting") {
    } else if (phase === "stretching") {
      currentStick.length = currentStick.length + (timeDelta / baseStretchingSpeed) * stretchMult;
    } else if (phase === "turning") {
      currentStick.rotation = currentStick.rotation + (timeDelta / baseTurningSpeed) * turnMult;

      if (currentStick.rotation > 90) {
        currentStick.rotation = 90;

        let hitResult = thePlatformTheStickHits();
        let nextPlatform = hitResult[0];
        let perfectHit = hitResult[1];

        if (perfectHit) {
          playPerfectSound();
        } else {
          playDropSound();
        }

        if (nextPlatform) {
          let isGamble = settings.gambleMode;

          if (perfectHit) {
            if (isGamble) {
              perfectChain = perfectChain + 1;
              let bonus = Math.pow(2, perfectChain);
              score = score + bonus;
              accumulatedGambleBonus = accumulatedGambleBonus + bonus;
            } else {
              score = score + 2;
            }
            perfectOpacity = 1;
            clearTimeout(perfectTimeoutId);
            perfectTimeoutId = setTimeout(function () {
              perfectOpacity = 0;
            }, 1000);
          } else {
            if (isGamble && perfectChain > 0) {
              score = score - accumulatedGambleBonus;
              lastLostBonus = accumulatedGambleBonus;
              accumulatedGambleBonus = 0;
              perfectChain = 0;

              showGambleLoss = true;
              clearTimeout(lossTimeoutId);
              lossTimeoutId = setTimeout(function () {
                showGambleLoss = false;
              }, 1500);
            }
            score = score + 1;
          }

          generatePlatform();
          generateTree();
          generateTree();
        } else {
          if (settings.gambleMode && perfectChain > 0) {
            score = score - accumulatedGambleBonus;
            accumulatedGambleBonus = 0;
            perfectChain = 0;
          }
        }

        playWalkSound();
        phase = "walking";
      }
    } else if (phase === "walking") {
      heroX = heroX + (timeDelta / baseWalkingSpeed) * walkMult;

      let hitResult = thePlatformTheStickHits();
      let nextPlatform = hitResult[0];

      if (nextPlatform) {
        let maxHeroX = nextPlatform.x + nextPlatform.w - heroDistanceFromEdge;
        if (heroX > maxHeroX) {
          heroX = maxHeroX;
          stopWalkSound();
          phase = "transitioning";
        }
      } else {
        let maxHeroX = currentStick.x + currentStick.length + heroWidth;
        if (heroX > maxHeroX) {
          heroX = maxHeroX;
          stopWalkSound();
          playLoseSound();
          phase = "falling";
        }
      }
    } else if (phase === "transitioning") {
sceneOffset = sceneOffset + (timeDelta / baseTransitioningSpeed);

      let hitResult = thePlatformTheStickHits();
      let nextPlatform = hitResult[0];

      if (nextPlatform && sceneOffset > nextPlatform.x + nextPlatform.w - paddingX) {
        sticks.push({
          x: nextPlatform.x + nextPlatform.w,
          length: 0,
          rotation: 0,
        });
        phase = "waiting";
      }
    } else if (phase === "falling") {
      if (currentStick.rotation < 180) {
        currentStick.rotation = currentStick.rotation + (timeDelta / baseTurningSpeed) * turnMult;
      }

      heroY = heroY + (timeDelta / baseFallingSpeed) * fallMult;
      let maxHeroY = platformHeight + 100 + (height - canvasHeight) / 2;

      if (heroY > maxHeroY) {
        handleGameOver();
        phase = "gameover";
      }
    }

    draw();
    lastTimestamp = timestamp;
    animationFrameId = window.requestAnimationFrame(animate);
  }

  function thePlatformTheStickHits() {
    let currentStick = last(sticks);

    if (!currentStick || currentStick.rotation !== 90) {
      return [null, false];
    }

    let stickFarX = currentStick.x + currentStick.length;

    let hitPlatform = null;
    for (let i = 0; i < platforms.length; i++) {
      let p = platforms[i];
      if (p.x < stickFarX && stickFarX < p.x + p.w) {
        hitPlatform = p;
        break;
      }
    }

    if (hitPlatform) {
      let perfectStart = hitPlatform.x + hitPlatform.w / 2 - perfectAreaSize / 2;
      let perfectEnd = hitPlatform.x + hitPlatform.w / 2 + perfectAreaSize / 2;

      if (perfectStart < stickFarX && stickFarX < perfectEnd) {
        return [hitPlatform, true];
      }
    }

    return [hitPlatform, false];
  }

  function draw() {
    if (!ctx || width <= 0 || height <= 0) {
      return;
    }

    ctx.save();
    ctx.clearRect(0, 0, width, height);
    drawBackground();

    let translateX = (width - canvasWidth) / 2 - sceneOffset;
    let translateY = (height - canvasHeight) / 2;
    ctx.translate(translateX, translateY);

    drawPlatforms();
    drawHero();
    drawSticks();

    ctx.restore();
  }

  function drawPlatforms() {
    let currentStick = last(sticks);

    for (let i = 0; i < platforms.length; i++) {
      let p = platforms[i];
      let x = p.x;
      let w = p.w;

      ctx.fillStyle = "#111111";
      ctx.fillRect(
        x,
        canvasHeight - platformHeight,
        w,
        platformHeight + (height - canvasHeight) / 2,
      );

      if (currentStick && currentStick.x < x) {
        ctx.fillStyle = "#ff3333";
        ctx.fillRect(
          x + w / 2 - perfectAreaSize / 2,
          canvasHeight - platformHeight,
          perfectAreaSize,
          perfectAreaSize,
        );
      }
    }
  }

  function drawHero() {
    ctx.save();
    let isWalking = false;
    if (phase === "walking") {
      isWalking = true;
    }

    let swing = 0;
    let tailWag = 0;
    if (isWalking) {
      swing = Math.sin(heroX * 0.5) * 5;
      tailWag = Math.cos(heroX * 0.5) * 4;
    }

    ctx.translate(
      heroX - heroWidth / 2,
      heroY + canvasHeight - platformHeight - heroHeight / 2,
    );

    let mainColor = "#FF8C00";
    let bellyColor = "#FFE4B5";
    let darkColor = "#333333";
    let pinkColor = "#FFB6C1";

    let hw = heroWidth / 2;
    let hh = heroHeight / 2;

    ctx.fillStyle = mainColor;
    drawRoundedRect(-hw, -hh, heroWidth, heroHeight - 4, 8);
    ctx.fillStyle = bellyColor;
    drawRoundedRect(-hw + 3, -hh + 10, heroWidth - 6, heroHeight - 16, 6);
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-hw + 2, 8);
    ctx.quadraticCurveTo(-hw - 15, 8 + tailWag, -hw - 10, -5 + tailWag);
    ctx.stroke();

    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.moveTo(-8, -hh + 2);
    ctx.lineTo(-10, -hh - 8);
    ctx.lineTo(-2, -hh + 2);
    ctx.moveTo(2, -hh + 2);
    ctx.lineTo(10, -hh - 8);
    ctx.lineTo(8, -hh + 2);
    ctx.fill();

    ctx.fillStyle = pinkColor;
    ctx.beginPath();
    ctx.moveTo(-7, -hh + 2);
    ctx.lineTo(-9, -hh - 5);
    ctx.lineTo(-3, -hh + 2);
    ctx.moveTo(3, -hh + 2);
    ctx.lineTo(9, -hh - 5);
    ctx.lineTo(7, -hh + 2);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(1, -4, 3, 0, Math.PI * 2);
    ctx.arc(9, -4, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = darkColor;
    ctx.beginPath();
    ctx.arc(2, -4, 1.5, 0, Math.PI * 2);
    ctx.arc(10, -4, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = pinkColor;
    ctx.beginPath();
    ctx.arc(5, 1, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(2, 1);
    ctx.lineTo(-4, -1);
    ctx.moveTo(2, 2);
    ctx.lineTo(-4, 4);
    ctx.moveTo(8, 1);
    ctx.lineTo(14, -1);
    ctx.moveTo(8, 2);
    ctx.lineTo(14, 4);
    ctx.stroke();

    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.arc(-2 - swing, 11.5, 3.5, 0, Math.PI * 2);
    ctx.arc(5 + swing, 11.5, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawRoundedRect(x, y, w, h, radius) {
    ctx.beginPath();
    ctx.moveTo(x, y + radius);
    ctx.lineTo(x, y + h - radius);
    ctx.arcTo(x, y + h, x + radius, y + h, radius);
    ctx.lineTo(x + w - radius, y + h);
    ctx.arcTo(x + w, y + h, x + w, y + h - radius, radius);
    ctx.lineTo(x + w, y + radius);
    ctx.arcTo(x + w, y, x + w - radius, y, radius);
    ctx.lineTo(x + radius, y);
    ctx.arcTo(x, y, x, y + radius, radius);
    ctx.fill();
  }

  function drawSticks() {
    for (let i = 0; i < sticks.length; i++) {
      let stick = sticks[i];
      ctx.save();
      ctx.translate(stick.x, canvasHeight - platformHeight);
      ctx.rotate((Math.PI / 180) * stick.rotation);
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#111111";
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -stick.length);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawBackground() {
    let safeHeight = height;
    if (safeHeight < 1) safeHeight = 1;

    let safeWidth = width;
    if (safeWidth < 1) safeWidth = 1;

    let rootStyles = getComputedStyle(document.documentElement);
    let activeColor = rootStyles.getPropertyValue("--activeColour").trim();
    if (!activeColor) {
      activeColor = "#BBD691";
    }

    let gradient = ctx.createLinearGradient(0, 0, 0, safeHeight);
    gradient.addColorStop(0, activeColor);
    gradient.addColorStop(1, "#FEF1E1");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, safeWidth, safeHeight);

    drawHill(hill1BaseHeight, hill1Amplitude, hill1Stretch, "#95C629");
    drawHill(hill2BaseHeight, hill2Amplitude, hill2Stretch, "#659F1C");

    for (let i = 0; i < trees.length; i++) {
      drawTree(trees[i].x, trees[i].color);
    }
  }

  function drawHill(baseHeight, amplitude, stretch, color) {
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(0, getHillY(0, baseHeight, amplitude, stretch));

    for (let i = 0; i < width; i = i + 4) {
      ctx.lineTo(i, getHillY(i, baseHeight, amplitude, stretch));
    }

    ctx.lineTo(width, height);
    ctx.fillStyle = color;
    ctx.fill();
  }

  function drawTree(x, color) {
    ctx.save();

    let treeX = (-sceneOffset * backgroundSpeedMultiplier + x) * hill1Stretch;
    let treeY = getTreeY(x, hill1BaseHeight, hill1Amplitude);

    ctx.translate(treeX, treeY);

    let treeTrunkHeight = 5;
    let treeTrunkWidth = 2;
    let treeCrownHeight = 25;
    let treeCrownWidth = 10;

    ctx.fillStyle = "#7D833C";
    ctx.fillRect(
      -treeTrunkWidth / 2,
      -treeTrunkHeight,
      treeTrunkWidth,
      treeTrunkHeight,
    );

    ctx.beginPath();
    ctx.moveTo(-treeCrownWidth / 2, -treeTrunkHeight);
    ctx.lineTo(0, -(treeTrunkHeight + treeCrownHeight));
    ctx.lineTo(treeCrownWidth / 2, -treeTrunkHeight);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.restore();
  }

  function getHillY(windowX, baseHeight, amplitude, stretch) {
    let sineBaseY = height - baseHeight;
    let wave = sinus((sceneOffset * backgroundSpeedMultiplier + windowX) * stretch);
    return wave * amplitude + sineBaseY;
  }

  function getTreeY(x, baseHeight, amplitude) {
    let sineBaseY = height - baseHeight;
    return sinus(x) * amplitude + sineBaseY;
  }

  function updateDimensions() {
    if (!container || !canvas) {
      return;
    }
    let rect = container.getBoundingClientRect();
    let newW = Math.floor(rect.width);
    let newH = Math.floor(rect.height);

    if (newW > 0 && newH > 0) {
      width = newW;
      height = newH;
      canvas.width = width;
      canvas.height = height;
      draw();
    }
  }

  function updateSetting(key, value) {
    let newValue = value;
    if (typeof value !== "boolean") {
      newValue = parseFloat(value);
    }

    stickHeroStats.update(function (stats) {
      let newSettings = { ...stats.settings };
      newSettings[key] = newValue;
      return { ...stats, settings: newSettings };
    });
  }

  onMount(function () {
    ctx = canvas.getContext("2d");
    resizeObserver = new ResizeObserver(function () {
      updateDimensions();
    });
    resizeObserver.observe(container);
    updateDimensions();
    resetGame();
  });

  onDestroy(function () {
    stopAllSounds();
    if (animationFrameId) {
      window.cancelAnimationFrame(animationFrameId);
    }
    if (perfectTimeoutId) {
      clearTimeout(perfectTimeoutId);
    }
    if (lossTimeoutId) {
      clearTimeout(lossTimeoutId);
    }
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
  });
</script>

<svelte:window
  on:keydown={handleKeyDown}
  on:keyup={handleKeyUp}
  on:mouseup={handlePressEnd}
  on:touchend={handlePressEnd}
/>
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  bind:this={container}
  class="game-wrapper"
  on:mousedown={handlePressStart}
  on:touchstart|preventDefault={handlePressStart}
>
  <div class="score-container">
    <div class="score-current">{score}</div>
    <div class="score-best-row">
      <span class="score-best">BEST: {bestScore}</span>
    </div>
  </div>

  <canvas bind:this={canvas}></canvas>

  <div id="introduction" style="opacity: {introOpacity};">
    Keep pressing to stretch the stick, release to drop it. Try to reach the
    next platform!
  </div>

  <div
    id="perfect"
    class={perfectOpacity === 1 ? "flicker" : ""}
    style="opacity: {perfectOpacity};"
  >
    {#if settings.gambleMode && perfectChain > 0}
      CHAIN x{perfectChain} (+{Math.pow(2, perfectChain)})
    {:else}
      SCORE DOUBLE
    {/if}
  </div>

  <div
    id="gamble-loss"
    class={showGambleLoss ? "flicker-loss" : ""}
    style="opacity: {showGambleLoss ? 1 : 0};"
  >
    CHAINE BRISÉE ! -{lastLostBonus}
  </div>

  {#if showRestart}
    <div class="game-over-container">
      {#if isNewRecord}
        <div class="new-record-banner">NEW RECORD!</div>
      {/if}
      <h1>Score: {score}</h1>
      <button id="restart" on:click|stopPropagation={function () { resetGame(); }}>
        REPLAY
      </button>
    </div>
  {/if}
</div>

<button
  class="mini-btn settings-panel-btn"
  on:click|stopPropagation={function () { openSettingsPanel = !openSettingsPanel; }}
>
  <img src={SettingsButton} alt="Settings" />
</button>

<button
  class="mini-btn reset-btn"
  on:click|stopPropagation={resetStickHeroBestScore}
>
  RESET
</button>

{#if openSettingsPanel}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="settings-overlay"
    on:mousedown|stopPropagation
    on:touchstart|stopPropagation
    on:click|stopPropagation
  >
    <div class="settings-wrapper">
      <div class="tab-view">
        <section class="panel panel-wide">
          <h2 class="panel-title">Game Settings</h2>

          <label
            class="check-row"
            style={isGameInProgress ? "opacity: 0.5; cursor: not-allowed;" : ""}
          >
            <span class="checkbox" class:checked={settings.gambleMode}>
              <input
                type="checkbox"
                checked={settings.gambleMode || false}
                disabled={isGameInProgress}
                on:change={function (e) { updateSetting("gambleMode", e.target.checked); }}
              />
            </span>
            <span>
              {#if settings.gambleMode}Disable{:else}Enable{/if} Gamble Mode
              <span style="color: #e74c3c; margin-left: 4px;">
                More bonus, more risk.
              </span>
            </span>
          </label>

          <hr class="panel-divider" />

          <div class="ctrl">
            <label for="stretch-speed"
              >Stretching Speed ({settings.stretchingSpeed || 1}x)</label
            >
            <input
              id="stretch-speed"
              class="slider slider-default"
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={settings.stretchingSpeed || 1}
              on:input={function (e) { updateSetting("stretchingSpeed", e.target.value); }}
            />
          </div>

          <div class="ctrl">
            <label for="turn-speed"
              >Turning Speed ({settings.turningSpeed || 1}x)</label
            >
            <input
              id="turn-speed"
              class="slider slider-default"
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={settings.turningSpeed || 1}
              on:input={function (e) { updateSetting("turningSpeed", e.target.value); }}
            />
          </div>

          <div class="ctrl">
            <label for="walk-speed"
              >Walking Speed ({settings.walkingSpeed || 1}x)</label
            >
            <input
              id="walk-speed"
              class="slider slider-default"
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={settings.walkingSpeed || 1}
              on:input={function (e) { updateSetting("walkingSpeed", e.target.value); }}
            />
          </div>


          <div class="ctrl">
            <label for="fall-speed"
              >Falling Speed ({settings.fallingSpeed || 1}x)</label
            >
            <input
              id="fall-speed"
              class="slider slider-default"
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={settings.fallingSpeed || 1}
              on:input={function (e) { updateSetting("fallingSpeed", e.target.value); }}
            />
          </div>

          <div class="action-buttons-col" style="margin-top: 12px;">
            <button class="settings-btn" on:click={resetStickHeroSettings}>
              Reset speeds
            </button>
            <button
              class="settings-btn"
              on:click={function () { openSettingsPanel = false; }}
            >
              Close
            </button>
          </div>
        </section>
      </div>
    </div>
  </div>
{/if} 

<style>
  :global(body),
  :global(html) {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background-color: #282828;
  }

  .game-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    user-select: none;
    -webkit-user-select: none;
    cursor: pointer;
    font-family: "CreamyChicken", sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  canvas {
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .score-container {
    position: absolute;
    top: 20px;
    left: 20px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    z-index: 2;
    pointer-events: none;
  }

  .score-current {
    font-size: 3em;
    font-weight: 900;
    color: #222;
    line-height: 1;
    text-shadow: 1px 1px 0 rgba(255, 255, 255, 0.5);
  }

  .score-best-row {
    display: flex;
    flex-direction: column;
    gap: 8px;
    border-radius: 20px;
    pointer-events: auto;
  }

  .score-best {
    font-size: 0.85em;
    font-weight: 800;
    color: #444;
    line-height: 1;
  }

  #introduction {
    position: absolute;
    width: 200px;
    font-weight: 600;
    font-size: 0.85em;
    text-align: center;
    color: #222;
    transition: opacity 0.5s;
    pointer-events: none;
    z-index: 2;
  }

  #perfect {
    position: absolute;
    top: 150px;
    font-weight: 800;
    font-size: 1.2em;
    color: #ff3333;
    transition: opacity 0.3s;
    pointer-events: none;
    z-index: 2;
  }

  #gamble-loss {
    position: absolute;
    top: 190px;
    font-weight: 800;
    font-size: 1.2em;
    color: #a80000;
    text-shadow: 1px 1px 0 rgba(255, 255, 255, 0.7);
    transition: opacity 0.3s;
    pointer-events: none;
    z-index: 2;
  }

  .flicker {
    animation: FlickerOpacityIn 0.4s ease-in-out forwards;
  }

  .flicker-loss {
    animation: ShakeAndFade 1.5s ease-in-out forwards;
  }

  @keyframes ShakeAndFade {
    0% {
      transform: translateX(0);
      opacity: 0;
    }
    10% {
      transform: translateX(-5px);
      opacity: 1;
    }
    20% {
      transform: translateX(5px);
    }
    30% {
      transform: translateX(-5px);
    }
    40% {
      transform: translateX(5px);
    }
    50% {
      transform: translateX(0);
      opacity: 1;
    }
    100% {
      transform: translateX(0);
      opacity: 0;
    }
  }

  @keyframes FlickerOpacityIn {
    0% {
      opacity: 0;
    }
    15% {
      opacity: 1;
    }
    25% {
      opacity: 0;
    }
    40% {
      opacity: 1;
    }
    50% {
      opacity: 0.2;
    }
    65% {
      opacity: 1;
    }
    80% {
      opacity: 0.5;
    }
    100% {
      opacity: 1;
    }
  }

  .game-over-container {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    z-index: 10;
  }

  .game-over-container h1 {
    font-size: 1.5em;
    font-weight: 900;
    color: #222;
    text-shadow: 1px 1px 0 rgba(255, 255, 255, 0.5);
  }

  .new-record-banner {
    font-size: 1em;
    font-weight: 900;
    color: #27ae60;
    background: rgba(255, 255, 255, 0.9);
    padding: 6px 14px;
    border-radius: 20px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
    animation: bounce 0.6s ease infinite alternate;
  }

  @keyframes bounce {
    from {
      transform: translateY(0);
    }
    to {
      transform: translateY(-4px);
    }
  }

  #restart {
    width: 90px;
    height: 90px;
    border-radius: 50%;
    color: white;
    background-color: var(--activeColour);
    border: none;
    font-weight: 700;
    font-size: 1em;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    transition:
      transform 0.15s ease,
      background-color 0.15s ease;
  }

  #restart:hover {
    background-color: var(--activeColour);
    transform: scale(1.04);
  }

  .mini-btn {
    position: absolute;
    top: 7px;
    z-index: 999;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 20%;
    border: none;
    cursor: pointer;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.05);
    transition:
      transform 0.15s ease,
      box-shadow 0.15s ease;
  }

  .mini-btn:hover {
    transform: scale(1.08);
  }

  .mini-btn:active {
    transform: scale(0.94);
  }

  .reset-btn {
    right: 80px;
    width: 60px;
    background-color: var(--activeColour);
    color: white;
    font-size: 0.6rem;
    letter-spacing: 0.02em;
  }

  .settings-panel-btn {
    right: 44px;
    background-color: var(--activeColour);
  }

  .settings-panel-btn img {
    width: 16px;
    height: 16px;
    filter: brightness(0) invert(1);
  }

  .settings-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1000;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .settings-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
  }

  .tab-view {
    transform-origin: center center;
    padding: 4px;
    box-sizing: border-box;
    font-family: "Museo Sans", sans-serif;
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex-shrink: 0;
    overflow: visible;
  }

  .panel {
    background-color: #1a1a1a;
    border: 0.5px solid #5c5c5c;
    border-radius: 6px;
    padding: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    box-sizing: border-box;
    width: min(90vw, 260px);
  }

  .panel-title {
    font-size: 10px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    text-align: center;
    color: #fff;
    margin: 0 0 10px;
    padding-bottom: 5px;
    border-bottom: 1px solid #2b2b2b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .panel-divider {
    border: none;
    border-top: 1px solid #2b2b2b;
    margin: 8px 0;
  }

  .check-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
    cursor: pointer;
  }

  .check-row span:last-child {
    font-size: 8px;
    font-weight: bold;
    color: #ddd;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .checkbox {
    position: relative;
    width: 10px;
    height: 10px;
    border-radius: 2px;
    border: 1px solid #5c5c5c;
    background-color: #0d0d0d;
    flex-shrink: 0;
    transition:
      background-color 0.1s ease,
      border-color 0.1s ease;
  }

  .checkbox input {
    position: absolute;
    inset: 0;
    opacity: 0;
    margin: 0;
    cursor: pointer;
  }

  .checkbox.checked {
    background-color: var(--activeColour);
    border-color: var(--activeColour);
  }

  .ctrl {
    margin-bottom: 8px;
    transition: opacity 0.15s ease;
  }

  .ctrl:last-of-type {
    margin-bottom: 2px;
  }

  .ctrl label {
    display: block;
    font-size: 7.5px;
    font-weight: bold;
    color: #ccc;
    margin-bottom: 4px;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 6px;
    border-radius: 3px;
    outline: none;
    cursor: pointer;
    border: 1px solid #000;
    display: block;
  }

  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 8px;
    height: 12px;
    border-radius: 2px;
    background: #fff;
    border: 1px solid #000;
    box-shadow: 0 0 2px rgba(0, 0, 0, 0.6);
    cursor: pointer;
  }

  .slider::-moz-range-thumb {
    width: 8px;
    height: 12px;
    border-radius: 2px;
    background: #fff;
    border: 1px solid #000;
    cursor: pointer;
  }

  .slider-default {
    background: var(--activeColour);
  }

  .action-buttons-col {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .settings-btn {
    width: 100%;
    height: 24px;
    margin: 0 auto;
    color: white;
    background-color: #313131;
    border-radius: 4px;
    outline: none;
    font-size: 9px;
    font-weight: bold;
    text-transform: uppercase;
    border: 1px solid rgba(104, 104, 104, 0.609);
    cursor: pointer;
    transition:
      transform 0.2s ease-in-out,
      background-color 0.2s,
      border-color 0.2s;
  }

  .settings-btn:hover {
    border-color: var(--activeColour);
    background-color: var(--activeColour);
    transform: scale(1.02);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.9);
  }

  .settings-btn:active {
    transform: scale(0.98);
  }
</style>