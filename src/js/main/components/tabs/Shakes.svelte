<script>
  import { onMount, onDestroy } from "svelte";
  import { sendNotif } from "../../logic.js";
  import { layerColors } from "../../stores.js";
  import { callJSX } from "../../../lib/utils/main.js";
  import { fs, os, path } from "../../../lib/cep/node";
  import { t } from "../../../i18n.js";
  import AddIcon from "../../../assets/ui/Add.png";
  import DeleteIcon from "../../../assets/ui/Delete.png";
  import EffectProp from "./EffectProp.svelte";
  import {
    angleToVector,
    buildRenderModel,
    clamp,
    generateGroups,
    num,
    sampleGroup,
  } from "./shakeModel.js";

  const mainSliders = [
    { key: "intensity", label: "Strength", min: 5, max: 150, step: 5 },
    { key: "speed", label: "Speed", min: 20, max: 200, step: 5 },
  ];

  const builderSliders = [
    { key: "posX", label: "Move X", min: 0, max: 60, step: 1, unit: "%" },
    { key: "posY", label: "Move Y", min: 0, max: 60, step: 1, unit: "%" },
    {
      key: "rotation",
      label: "Rotation",
      min: 0,
      max: 30,
      step: 0.5,
      unit: "°",
    },
    { key: "zoom", label: "Zoom punch", min: 0, max: 40, step: 1, unit: "%" },
    { key: "bounces", label: "Bounces", min: 1, max: 12, step: 1, unit: "" },
    { key: "decay", label: "Decay", min: 10, max: 95, step: 5, unit: "%" },
    {
      key: "duration",
      label: "Duration",
      min: 4,
      max: 30,
      step: 1,
      unit: " fr",
    },
  ];
  const moveSliders = builderSliders.slice(0, 2);
  const bounceSliders = builderSliders.slice(4, 6);
  const otherBuilderSliders = builderSliders.slice(2, 4);
  const remainingBuilderSliders = builderSliders.slice(6);

  const blurSliders = [
    { key: "blur", label: "Blur amount", min: 0, max: 100, step: 5, unit: "%" },
    {
      key: "blurFalloff",
      label: "Blur falloff",
      min: 10,
      max: 100,
      step: 5,
      unit: "%",
    },
  ];

  const builderTabs = [
    { id: "shake", label: "Shake" },
    { id: "blur", label: "Blur" },
    { id: "effects", label: "Effects" },
  ];

  const DEFAULT_SETTINGS = {
    intensity: 100,
    speed: 100,
    createAtCompTime: false,
    addFlash: false,
    flashBlend: false,
    flashDuration: 5,
    flashStrength: 100,
  };

  const SHAKE_PRESETS = [
    { name: "Basic", functionName: "ExcaliburBasicShake" },
    { name: "Bouncy", functionName: "ExcaliburOrbitShake" },
    { name: "Minimax", functionName: "ExcaliburMinimaxShake" },
    { name: "Fast", functionName: "ExcaliburFastShake" },
    { name: "Long", functionName: "ExcaliburLongShake" },
    { name: "Horizontal", functionName: "ExcaliburHorizontalShake" },
    { name: "Flickers", functionName: "ExcaliburFlickerShake" },
    { name: "Lens", functionName: "ExcaliburLensShake" },
    { name: "Waves", functionName: "ExcaliburWaveShakes" },
    { name: "Glitch", functionName: "ExcaliburGlitchShake" },
    { name: "Invert", functionName: "ExcaliburInvertShake" },
    { name: "Spike", functionName: "ExcaliburSpikeShake" },
    { name: "Skew", functionName: "ExcaliburSkewShakes" },
    { name: "Sketch", functionName: "ExcaliburSketchShake" },
  ];

  const previewSources = Object.entries(
    import.meta.glob("../../../assets/video/shakes/*.mp4", {
      eager: true,
      import: "default",
      query: "?url",
    }),
  )
    .sort(function (a, b) {
      return a[0].localeCompare(b[0], undefined, { numeric: true });
    })
    .map(function (entry) {
      return entry[1];
    });

  let activeMenu = "presets";
  let view = "list";
  let builderTab = "shake";
  let settings = { ...DEFAULT_SETTINGS };
  let customShakes = [];
  let loaded = false;
  let flashOpen = false;
  let editingName = null;
  let builder = newBuilder();

  let effectCatalog = [];
  let effectSearch = "";
  let capturing = false;

  let videos = [];
  let canvasEl;
  let stageEl;
  let ctx = null;
  let playing = false;
  let currentVideo = 0;
  let switchingVideo = false;
  let shakeVideoTime = 0;
  let shakeStart = -1;
  let shakeEndAt = 0;
  let model = null;
  let hoverShake = null;
  let animId = 0;

  let saveTimer = null;
  let wrapperEl;
  let scaleFactor = 1;
  const REF_WIDTH = 470;
  const REF_HEIGHT = 420;
  let wrapperObserver;
  let rafIdScale = null;

  function newBuilder() {
    return {
      name: "",
      seed: "",
      posX: 12,
      posY: 12,
      rotation: 3,
      zoom: 6,
      bounces: 6,
      decay: 70,
      duration: 14,
      blur: 60,
      blurFalloff: 50,
      blurAuto: true,
      blurAngle: 0,
      placement: 1,
      overrides: {},
      effects: [],
    };
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getSettingsFile() {
    var folder = path.join(os.homedir(), "Documents", "Excalibur");
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
    return path.join(folder, "shakes.ebfx");
  }

  function cleanSettings(source) {
    var s = source || {};
    return {
      intensity: clamp(num(s.intensity, 100), 5, 150),
      speed: clamp(num(s.speed, 100), 20, 200),
      createAtCompTime: Boolean(s.createAtCompTime),
      addFlash: Boolean(s.addFlash),
      flashBlend: Boolean(s.flashBlend),
      flashDuration: clamp(num(s.flashDuration, 5), 1, 15),
      flashStrength: clamp(num(s.flashStrength, 100), 1, 100),
    };
  }

  function cleanShakes(list) {
    var result = [];
    if (!Array.isArray(list)) return result;
    for (var i = 0; i < list.length; i++) {
      var shake = list[i];
      if (
        shake &&
        typeof shake.name === "string" &&
        shake.name.trim().length >= 3
      ) {
        result.push(shake);
      }
    }
    return result;
  }

  function loadSettings() {
    try {
      var file = getSettingsFile();
      if (fs.existsSync(file)) {
        var data = JSON.parse(fs.readFileSync(file, "utf-8"));
        settings = cleanSettings(data.settings);
        if (data.activeMenu === "custom") activeMenu = "custom";
        customShakes = cleanShakes(data.customShakes);
      } else {
        var oldFile = path.join(
          os.homedir(),
          "Documents",
          "Excalibur",
          "customshakes.ebfx",
        );
        if (fs.existsSync(oldFile)) {
          customShakes = cleanShakes(
            JSON.parse(fs.readFileSync(oldFile, "utf-8")),
          );
        }
      }
    } catch (error) {
      sendNotif("Could not load shake settings.", false);
    }
    loaded = true;
  }

  function saveNow() {
    try {
      var data = {
        version: 1,
        activeMenu: activeMenu,
        settings: cleanSettings(settings),
        customShakes: customShakes,
      };
      fs.writeFileSync(
        getSettingsFile(),
        JSON.stringify(data, null, 2),
        "utf-8",
      );
    } catch (error) {
      sendNotif("Could not save shake settings.", false);
    }
  }

  function queueSave() {
    if (!loaded) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      saveTimer = null;
      saveNow();
    }, 300);
  }

  $: if (loaded) {
    settings;
    customShakes;
    activeMenu;
    queueSave();
  }

  function currentParams() {
    if (view === "builder") return builder;
    return hoverShake;
  }

  function startShake() {
    model = buildRenderModel(currentParams(), settings);
    shakeStart = performance.now();
    var video = videos[currentVideo];
    shakeVideoTime =
      video && isFinite(video.currentTime) ? video.currentTime : 0;
  }

  function playVideo(video) {
    if (!video) return;
    var result = video.play();
    if (result && result.catch) {
      result.catch(function () {});
    }
  }

  function playVideoWhenReady(video) {
    if (!video) return;
    if (video.readyState >= 3) {
      playVideo(video);
      return;
    }
    var onCanPlay = function () {
      video.removeEventListener("canplay", onCanPlay);
      if (playing && videos[currentVideo] === video) playVideo(video);
    };
    video.addEventListener("canplay", onCanPlay);
  }

  function startPreview(shake) {
    if (view === "list") hoverShake = shake;
    playing = true;
    currentVideo = 0;
    switchingVideo = false;
    for (var i = 0; i < videos.length; i++) {
      if (videos[i]) {
        videos[i].pause();
        videos[i].currentTime = 0;
      }
    }
    playVideoWhenReady(videos[0]);
    startShake();
    if (animId === 0) animId = requestAnimationFrame(drawLoop);
  }

  function stopPreview() {
    if (view === "builder") return;
    playing = false;
    shakeStart = -1;
    for (var i = 0; i < videos.length; i++) {
      if (videos[i]) videos[i].pause();
    }
  }

  function nextVideo(event) {
    if (
      !playing ||
      videos.length === 0 ||
      switchingVideo ||
      (event && event.currentTarget !== videos[currentVideo])
    )
      return;
    switchingVideo = true;
    var finishedVideo = event && event.currentTarget;
    if (finishedVideo) {
      finishedVideo.pause();
      finishedVideo.currentTime = 0;
    }
    currentVideo = (currentVideo + 1) % videos.length;
    var video = videos[currentVideo];
    if (video) {
      video.pause();
      video.currentTime = 0;
      playVideoWhenReady(video);
    }
    startShake();
    switchingVideo = false;
  }

  function anticipateNextVideo() {
    if (!playing || switchingVideo || videos.length === 0) return;
    var video = videos[currentVideo];
    if (
      !video ||
      !isFinite(video.duration) ||
      video.duration <= 0 ||
      video.currentTime < video.duration - 0.12
    )
      return;
    nextVideo({ currentTarget: video });
  }

  function drawLoop(now) {
    if (!playing) {
      animId = 0;
      return;
    }
    anticipateNextVideo();
    if (view === "builder" && shakeStart < 0 && now - shakeEndAt > 500) {
      startShake();
    }
    drawFrame(now);
    animId = requestAnimationFrame(drawLoop);
  }

  function drawScene(video, w, h, x, y, rot, scale) {
    var ratio = Math.max(w / video.videoWidth, h / video.videoHeight);
    var dw = video.videoWidth * ratio;
    var dh = video.videoHeight * ratio;
    ctx.save();
    ctx.translate(w / 2 + x, h / 2 + y);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.scale(scale, scale);
    for (var ky = -1; ky <= 1; ky++) {
      for (var kx = -1; kx <= 1; kx++) {
        ctx.save();
        ctx.translate(kx * dw, ky * dh);
        ctx.scale(kx === 0 ? 1 : -1, ky === 0 ? 1 : -1);
        ctx.drawImage(video, -dw / 2, -dh / 2, dw, dh);
        ctx.restore();
      }
    }
    ctx.restore();
  }

  function drawFrame(now) {
    if (!canvasEl || !stageEl) return;
    var w = stageEl.clientWidth;
    var h = stageEl.clientHeight;
    if (w < 1 || h < 1) return;
    if (canvasEl.width !== w) canvasEl.width = w;
    if (canvasEl.height !== h) canvasEl.height = h;
    if (!ctx) ctx = canvasEl.getContext("2d");

    var video = videos[currentVideo];
    if (!video || video.readyState < 2 || !video.videoWidth) return;

    var x = 0;
    var y = 0;
    var rot = 0;
    var scale = 1;
    var exposure = 0;
    var blur = 0;

    if (shakeStart >= 0 && model) {
      var stretch = Math.max(10, 200 - Number(settings.speed));
      var frameSeconds = (0.0333333333 * stretch) / 100;
      var elapsed = (now - shakeStart) / 1000;
      if (isFinite(video.currentTime) && video.currentTime >= shakeVideoTime) {
        elapsed = video.currentTime - shakeVideoTime;
      }
      var frame = elapsed / frameSeconds;
      if (frame >= model.frames) {
        shakeStart = -1;
        shakeEndAt = now;
      } else {
        var g = model.groups;
        if (g.pos) {
          var pos = sampleGroup(g.pos, frame);
          x = pos[0] * (w / 2);
          y = pos[1] * (h / 2);
        }
        if (g.rot) rot = sampleGroup(g.rot, frame)[0];
        if (g.scale) scale = sampleGroup(g.scale, frame)[0];
        if (g.flash) exposure = sampleGroup(g.flash, frame)[0];
        if (g.blur) blur = sampleGroup(g.blur, frame)[0] * (w / 1080);
      }
    }

    var taps = 1;
    if (blur > 1.5) taps = Math.min(8, Math.ceil(blur / 2) + 1);
    var vec = angleToVector(model ? model.angle : 0);

    ctx.globalAlpha = 1;
    ctx.fillStyle = "#101010";
    ctx.fillRect(0, 0, w, h);
    for (var i = 0; i < taps; i++) {
      var shift = 0;
      if (taps > 1) shift = (i / (taps - 1) - 0.5) * blur;
      ctx.globalAlpha = 1 / (i + 1);
      drawScene(
        video,
        w,
        h,
        x + vec[0] * shift,
        y + vec[1] * shift,
        rot,
        scale,
      );
    }
    ctx.globalAlpha = 1;

    if (exposure !== 0) {
      canvasEl.style.filter =
        "brightness(" + Math.pow(2, exposure).toFixed(3) + ")";
    } else {
      canvasEl.style.filter = "none";
    }
  }

  $: previewKey =
    view === "builder"
      ? JSON.stringify([
          builder.seed,
          builder.posX,
          builder.posY,
          builder.rotation,
          builder.zoom,
          builder.bounces,
          builder.decay,
          builder.duration,
          builder.blur,
          builder.blurFalloff,
          builder.blurAuto,
          builder.blurAngle,
          builder.overrides,
          settings,
        ])
      : "";
  $: if (previewKey !== "" && playing) startShake();

  $: blurAngleShown =
    view === "builder" ? Math.round(generateGroups(builder).angle) : 0;
  $: blurVec = angleToVector(blurAngleShown);

  async function reportResult(name, request) {
    try {
      var raw = await request;
      var result = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (!result || result.status !== "SUCCESS") {
        sendNotif(
          (result && result.message) || "Could not apply " + name + ".",
          false,
        );
        return;
      }
      var layers = result.appliedLayers || result.added || 0;
      var hasErrors = result.layerErrors && result.layerErrors.length > 0;
      var text = name + " applied to " + layers + " layer(s).";
      if (hasErrors) text = text + " " + result.layerErrors[0];
      sendNotif(text, !hasErrors);
    } catch (error) {
      sendNotif("Could not apply " + name + ".", false);
    }
  }

  function applyPreset({ name, functionName }) {
    hoverShake = null;
    startShake();
    reportResult(
      name,
      callJSX(
        functionName,
        settings.createAtCompTime ? 1 : 0,
        Number(settings.speed),
        Number(settings.intensity),
        Number($layerColors.adjustment),
        Number(settings.flashDuration),
        Number(settings.flashStrength),
        5,
        settings.flashBlend ? 1 : 0,
        settings.addFlash ? 1 : 0,
      ),
    );
  }

  function applyCustomShake(shake) {
    hoverShake = shake;
    startShake();
    reportResult(
      shake.name,
      callJSX(
        "applyShakePreset",
        shake.name,
        Number(settings.intensity),
        Number(settings.speed),
        settings.createAtCompTime,
        settings.addFlash,
        settings.flashBlend,
        Number(settings.flashDuration),
        Number(settings.flashStrength),
        shake,
        Number($layerColors.adjustment),
      ),
    );
  }

  function onBlurAutoChange(checked) {
    if (!checked) {
      builder.blurAngle = Math.round(
        generateGroups({ ...builder, blurAuto: true }).angle,
      );
    }
    builder.blurAuto = checked;
    builder = builder;
  }

  function makeUid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  async function runCapture(functionName, argument) {
    capturing = true;
    try {
      var raw = await callJSX(functionName, argument);
      var result = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (!result || result.status !== "SUCCESS") {
        sendNotif(
          (result && result.message) || "Could not capture effects.",
          false,
        );
      } else {
        var added = [];
        for (var i = 0; i < result.effects.length; i++) {
          var fx = result.effects[i];
          fx.uid = makeUid();
          added.push(fx);
        }
        builder.effects = builder.effects.concat(added);
        sendNotif(added.length + " effect(s) added.", true);
      }
    } catch (error) {
      sendNotif("Could not capture effects.", false);
    }
    capturing = false;
  }

  function captureEffects() {
    runCapture("captureLayerEffects");
  }

  function addEffect(matchName) {
    effectSearch = "";
    runCapture("describeEffectByName", matchName);
  }

  function removeEffect(index) {
    builder.effects = builder.effects.filter(function (fx, i) {
      return i !== index;
    });
  }

  function setEffectEnabled(fx, checked) {
    fx.enabled = checked;
    builder = builder;
  }

  function parseAESource(value) {
    if (Array.isArray(value)) return value;
    if (typeof value !== "string") return [];
    try {
      var text = value
        .trim()
        .replace(/^\(+|\)+$/g, "")
        .replace(/([{,]\s*)([A-Za-z_$][\w$]*)(\s*:)/g, '$1"$2"$3')
        .replace(/'/g, '"');
      return JSON.parse(text);
    } catch (error) {
      return [];
    }
  }

  async function loadEffectCatalog() {
    try {
      var list = parseAESource(await callJSX("getEffectCatalog"));
      effectCatalog = list.filter(function (effect) {
        return (
          effect &&
          typeof effect.displayName === "string" &&
          typeof effect.matchName === "string"
        );
      });
    } catch (error) {
      sendNotif("Could not load the effects list.", false);
    }
  }

  $: filteredEffects = effectCatalog
    .filter(function (effect) {
      var query = effectSearch.trim().toLowerCase();
      if (query === "") return false;
      return (
        effect.displayName.toLowerCase().includes(query) ||
        effect.matchName.toLowerCase().includes(query)
      );
    })
    .slice(0, 40);

  function openBuilder(shake) {
    if (shake) {
      editingName = shake.name;
      builder = { ...newBuilder(), ...clone(shake) };
    } else {
      editingName = null;
      builder = newBuilder();
    }
    builderTab = "shake";
    view = "builder";
    startPreview(null);
  }

  function closeBuilder() {
    view = "list";
    stopPreview();
  }

  function saveBuilder() {
    var name = typeof builder.name === "string" ? builder.name.trim() : "";
    if (!name) {
      sendNotif("The shake need a name!", false);
      return;
    }
    for (var i = 0; i < customShakes.length; i++) {
      if (
        customShakes[i].name === name &&
        customShakes[i].name !== editingName
      ) {
        sendNotif(
          name + " is already in the list! Choose a different name.",
          false,
        );
        return;
      }
    }

    var entry = {
      ...clone(builder),
      name: name,
      seed: String(builder.seed || "").trim(),
      posX: clamp(num(builder.posX, 12), 0, 60),
      posY: clamp(num(builder.posY, 12), 0, 60),
      rotation: clamp(num(builder.rotation, 3), 0, 30),
      zoom: clamp(num(builder.zoom, 6), 0, 40),
      bounces: Math.round(clamp(num(builder.bounces, 6), 1, 12)),
      decay: clamp(num(builder.decay, 70), 10, 95),
      duration: Math.round(clamp(num(builder.duration, 14), 4, 30)),
      blur: clamp(num(builder.blur, 60), 0, 100),
      blurFalloff: clamp(num(builder.blurFalloff, 50), 10, 100),
      blurAuto: builder.blurAuto !== false,
      blurAngle: clamp(num(builder.blurAngle, 0), 0, 180),
      placement: Number(builder.placement) || 1,
      overrides: builder.overrides || {},
      effects: builder.effects || [],
    };

    if (editingName) {
      customShakes = customShakes.map(function (shake) {
        return shake.name === editingName ? entry : shake;
      });
      sendNotif("Changes to " + name + " have been saved!", true);
    } else {
      customShakes = customShakes.concat([entry]);
      sendNotif(name + " has been added!", true);
    }
    closeBuilder();
  }

  function deleteCurrent() {
    if (!editingName) return;
    var name = editingName;
    customShakes = customShakes.filter(function (shake) {
      return shake.name !== name;
    });
    sendNotif(name + " has been deleted!", false);
    closeBuilder();
  }

  onMount(function () {
    loadSettings();
    loadEffectCatalog();
    for (var i = 0; i < videos.length; i++) {
      if (videos[i]) videos[i].load();
    }

    if (wrapperEl) {
      var rect = wrapperEl.getBoundingClientRect();
      updateScale(rect.width, rect.height);
    }

    wrapperObserver = new ResizeObserver(function (entries) {
      var entry = entries[0];
      if (rafIdScale) cancelAnimationFrame(rafIdScale);
      rafIdScale = requestAnimationFrame(function () {
        updateScale(entry.contentRect.width, entry.contentRect.height);
      });
    });

    if (wrapperEl) wrapperObserver.observe(wrapperEl);
  });

  onDestroy(function () {
    playing = false;
    if (animId !== 0) cancelAnimationFrame(animId);
    if (wrapperObserver) wrapperObserver.disconnect();
    if (rafIdScale) cancelAnimationFrame(rafIdScale);
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveNow();
    }
  });

  function updateScale(w, h) {
    if (!w || !h) return;
    scaleFactor = Math.min(w / REF_WIDTH, h / REF_HEIGHT);
  }
</script>

<div class="settings-wrapper" bind:this={wrapperEl}>
  <div
    class="wrapper"
    style="transform: translate(-50%, -50%) scale({scaleFactor}); width: {REF_WIDTH}px; height: {REF_HEIGHT}px;"
  >
    <!-- Menu du haut (même style que les autres tabs) -->
    {#if view === "list"}
      <nav class="dashboard-sub-menu">
        <div
          class="nav-grid"
          style="grid-template-columns: repeat(2, minmax(0, 1fr));"
        >
          <button
            type="button"
            class:eff_active={activeMenu === "presets"}
            class:not_eff_active={activeMenu !== "presets"}
            on:click={() => (activeMenu = "presets")}
            ><span>Presets</span></button
          >
          <button
            type="button"
            class:eff_active={activeMenu === "custom"}
            class:not_eff_active={activeMenu !== "custom"}
            on:click={() => (activeMenu = "custom")}><span>Custom</span></button
          >
        </div>
      </nav>
    {:else}
      <nav class="dashboard-sub-menu">
        <div
          class="nav-grid"
          style="grid-template-columns: repeat(3, minmax(0, 1fr));"
        >
          {#each builderTabs as tab}
            <button
              type="button"
              class:eff_active={builderTab === tab.id}
              class:not_eff_active={builderTab !== tab.id}
              on:click={() => (builderTab = tab.id)}
              ><span>{$t(tab.label)}</span></button
            >
          {/each}
        </div>
      </nav>
    {/if}

    <div class="scroll-area">
      <div class="layout">
        <!-- ================= COLONNE GAUCHE ================= -->
        <section class="left">
          {#if view === "list"}
            <div class="panel-header">
              <div class="header-title">
                <h1>
                  {activeMenu === "presets" ? "Shakes Preset" : "Custom shakes"}
                </h1>
                {#if activeMenu === "custom"}
                  <button
                    type="button"
                    class="icon-btn"
                    aria-label="Add custom shake"
                    on:click={() => openBuilder(null)}
                  >
                    <img src={AddIcon} alt="Add" />
                  </button>
                {/if}
              </div>
              <div class="normal_underline"></div>
            </div>

            <div class="items-grid">
              {#if activeMenu === "presets"}
                {#each SHAKE_PRESETS as preset (preset.functionName)}
                  <button
                    type="button"
                    class="item-btn"
                    on:mouseenter={() => startPreview(null)}
                    on:mouseleave={stopPreview}
                    on:focus={() => startPreview(null)}
                    on:blur={stopPreview}
                    on:click={() => applyPreset(preset)}
                  >
                    <span class="btn-text">{$t(preset.name)}</span>
                  </button>
                {/each}
              {:else}
                {#each customShakes as shake (shake.name)}
                  <button
                    type="button"
                    class="item-btn"
                    title="Click: apply - Right click: edit"
                    on:mouseenter={() => startPreview(shake)}
                    on:mouseleave={stopPreview}
                    on:focus={() => startPreview(shake)}
                    on:blur={stopPreview}
                    on:click={() => applyCustomShake(shake)}
                    on:contextmenu|preventDefault={() => openBuilder(shake)}
                  >
                    <span class="btn-text">{shake.name}</span>
                  </button>
                {/each}
                {#if customShakes.length === 0}
                  <p class="empty-state">
                    No custom shakes yet. Add one with +.
                  </p>
                {/if}
              {/if}
            </div>
          {:else}
            <div class="panel-header">
              <div class="header-title">
                <h1>{editingName ? "Edit shake" : "Shake builder"}</h1>
                {#if editingName}
                  <button
                    type="button"
                    class="icon-btn"
                    aria-label="Delete shake"
                    on:click={deleteCurrent}
                  >
                    <img src={DeleteIcon} alt="Delete" id="delete-icon" />
                  </button>
                {/if}
              </div>
              <div class="normal_underline"></div>
            </div>

            <!-- ----- Onglet Shake ----- -->
            {#if builderTab === "shake"}
              <div class="move-row">
                {#each moveSliders as s}
                  <label class="field">
                    <span class="field-top"
                      >{$t(s.label)}<b>{builder[s.key]}{s.unit}</b></span
                    >
                    <input
                      class="fx-slider"
                      type="range"
                      min={s.min}
                      max={s.max}
                      step={s.step}
                      bind:value={builder[s.key]}
                    />
                  </label>
                {/each}
              </div>
              {#each otherBuilderSliders as s}
                <label class="field">
                  <span class="field-top"
                    >{$t(s.label)}<b>{builder[s.key]}{s.unit}</b></span
                  >
                  <input
                    class="fx-slider"
                    type="range"
                    min={s.min}
                    max={s.max}
                    step={s.step}
                    bind:value={builder[s.key]}
                  />
                </label>
              {/each}
              <div class="move-row">
                {#each bounceSliders as s}
                  <label class="field">
                    <span class="field-top"
                      >{$t(s.label)}<b>{builder[s.key]}{s.unit}</b></span
                    >
                    <input
                      class="fx-slider"
                      type="range"
                      min={s.min}
                      max={s.max}
                      step={s.step}
                      bind:value={builder[s.key]}
                    />
                  </label>
                {/each}
              </div>
              {#each remainingBuilderSliders as s}
                <label class="field">
                  <span class="field-top"
                    >{$t(s.label)}<b>{builder[s.key]}{s.unit}</b></span
                  >
                  <input
                    class="fx-slider"
                    type="range"
                    min={s.min}
                    max={s.max}
                    step={s.step}
                    bind:value={builder[s.key]}
                  />
                </label>
              {/each}
              <label class="field">
                <span class="field-top">Placement</span>
                <select class="native-select" bind:value={builder.placement}>
                  <option value={1}>Layer start</option>
                  <option value={2}>Comp time</option>
                  <option value={3}>Layer end</option>
                </select>
              </label>

              <!-- ----- Onglet Blur ----- -->
            {:else if builderTab === "blur"}
              {#each blurSliders as s}
                <label class="field">
                  <span class="field-top"
                    >{$t(s.label)}<b>{builder[s.key]}{s.unit}</b></span
                  >
                  <input
                    class="fx-slider"
                    type="range"
                    min={s.min}
                    max={s.max}
                    step={s.step}
                    bind:value={builder[s.key]}
                  />
                </label>
              {/each}

              <label class="check-row">
                <span
                  class="checkbox"
                  class:checked={builder.blurAuto !== false}
                >
                  <input
                    type="checkbox"
                    checked={builder.blurAuto !== false}
                    on:change={(e) => onBlurAutoChange(e.currentTarget.checked)}
                  />
                </span>
                <span class="label-text">Auto angle (follows the movement)</span
                >
              </label>

              <div class="angle-row">
                <label class="field">
                  <span class="field-top">Angle<b>{blurAngleShown}°</b></span>
                  <input
                    class="fx-slider"
                    type="range"
                    min="0"
                    max="180"
                    step="1"
                    disabled={builder.blurAuto !== false}
                    bind:value={builder.blurAngle}
                  />
                </label>
                <svg class="dial" viewBox="-20 -20 40 40" aria-hidden="true">
                  <circle r="18" class="dial-ring" />
                  <line
                    class="dial-line"
                    x1={-blurVec[0] * 15}
                    y1={-blurVec[1] * 15}
                    x2={blurVec[0] * 15}
                    y2={blurVec[1] * 15}
                  />
                </svg>
              </div>
              <p class="hint">
                {$t(
                  "0° = vertical, 90° = horizontal. Falloff = how long the blur takes to fade out.",
                )}
              </p>

              <!-- ----- Onglet Effects ----- -->
            {:else if builderTab === "effects"}
              <button
                type="button"
                class="add-new-btn"
                disabled={capturing}
                on:click={captureEffects}
              >
                Capture effects from selected layer
              </button>
              <input
                class="search-input"
                placeholder="Search an effect to add..."
                bind:value={effectSearch}
              />

              {#if filteredEffects.length > 0}
                <div class="results">
                  {#each filteredEffects as effect (effect.matchName)}
                    <button
                      type="button"
                      class="result-btn"
                      disabled={capturing}
                      on:click={() => addEffect(effect.matchName)}
                    >
                      <span>{effect.displayName}</span>
                      <small>{effect.matchName}</small>
                    </button>
                  {/each}
                </div>
              {/if}

              {#if builder.effects.length === 0}
                <p class="hint">
                  {$t(
                    "No effect yet. Capture the effects of a layer, or search one above. Then open it to edit or animate its properties.",
                  )}
                </p>
              {/if}

              {#each builder.effects as fx, ei (fx.uid || ei)}
                <details class="fx-card">
                  <summary>
                    <span class="fx-name">{fx.name}</span>
                    <span class="mini-check">
                      <input
                        type="checkbox"
                        checked={fx.enabled}
                        on:click|stopPropagation
                        on:change={(e) =>
                          setEffectEnabled(fx, e.currentTarget.checked)}
                      />
                      <span>on</span>
                    </span>
                    <button
                      type="button"
                      class="small-btn"
                      aria-label="Remove effect"
                      on:click|preventDefault|stopPropagation={() =>
                        removeEffect(ei)}>×</button
                    >
                  </summary>
                  <div class="fx-body">
                    {#each fx.props as prop, pi (pi)}
                      <EffectProp
                        {fx}
                        {ei}
                        {prop}
                        {pi}
                        duration={builder.duration}
                        allowAnimation={false}
                        on:change={() => (builder = builder)}
                      />
                    {/each}
                  </div>
                </details>
              {/each}
            {/if}

            <!-- Nom + boutons -->
            <div class="row-select">
              <input
                class="search-input"
                type="text"
                placeholder="Seed"
                bind:value={builder.seed}
              />
              <input
                class="search-input"
                type="text"
                maxlength="35"
                placeholder="Shake name"
                bind:value={builder.name}
              />
            </div>
            <div class="row-select">
              <button type="button" class="back-btn" on:click={closeBuilder}
                >Back</button
              >
              <button type="button" class="render-btn" on:click={saveBuilder}>
                {editingName ? "Save changes" : "Add shake"}
              </button>
            </div>
          {/if}
        </section>

        <aside class="right">
          <div class="preview-card">
            <div class="preview-stage" bind:this={stageEl}>
              {#each previewSources as source, index}
                <video
                  bind:this={videos[index]}
                  class="source-video"
                  src={source}
                  muted
                  playsinline
                  preload="auto"
                  on:ended={nextVideo}
                ></video>
              {/each}
              <canvas
                bind:this={canvasEl}
                class="preview-canvas"
                style="display: {playing ? 'block' : 'none'};"
              ></canvas>
              {#if !playing}
                <div class="preview-text">
                  <p>Put your mouse over the shakes to preview them.</p>
                  <p>
                    The settings are applied to the preview. You will only see
                    the shakes, not the effects.
                  </p>
                </div>
              {/if}
            </div>
          </div>

          <div class="settings-card">
            <div class="sliders">
              {#each mainSliders as s}
                <label class="field">
                  <span class="field-top"
                    >{s.label}<b>{settings[s.key]}%</b></span
                  >
                  <input
                    class="fx-slider"
                    type="range"
                    min={s.min}
                    max={s.max}
                    step={s.step}
                    bind:value={settings[s.key]}
                  />
                </label>
              {/each}
            </div>

            <label class="check-row">
              <span class="checkbox" class:checked={settings.createAtCompTime}>
                <input
                  type="checkbox"
                  bind:checked={settings.createAtCompTime}
                />
              </span>
              <span class="label-text">Create at comp time</span>
            </label>

            <!-- Flash / Exposure -->
            <div
              class="flash"
              class:open={flashOpen}
              class:on={settings.addFlash}
            >
              <div class="flash-head">
                <button
                  type="button"
                  class="switch"
                  class:on={settings.addFlash}
                  role="switch"
                  aria-checked={settings.addFlash}
                  aria-label="Enable flash"
                  on:click={() => (settings.addFlash = !settings.addFlash)}
                >
                  <span class="knob"></span>
                </button>
                <button
                  type="button"
                  class="flash-title"
                  aria-expanded={flashOpen}
                  on:click={() => (flashOpen = !flashOpen)}
                >
                  <span class="flash-label">Flash</span>
                  <span class="flash-state"
                    >{settings.addFlash ? "On" : "Off"}</span
                  >
                  <span class="chev" class:open={flashOpen}>▾</span>
                </button>
              </div>

              {#if flashOpen}
                <div class="sliders flash-body" class:dim={!settings.addFlash}>
                  <label class="field">
                    <span class="field-top"
                      >Duration<b>{settings.flashDuration} fr</b></span
                    >
                    <input
                      class="fx-slider"
                      type="range"
                      min="1"
                      max="15"
                      step="1"
                      bind:value={settings.flashDuration}
                    />
                  </label>
                  <label class="field">
                    <span class="field-top"
                      >Strength<b>{settings.flashStrength}%</b></span
                    >
                    <input
                      class="fx-slider"
                      type="range"
                      min="1"
                      max="100"
                      step="1"
                      bind:value={settings.flashStrength}
                    />
                  </label>
                </div>
              {/if}
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>
</div>

<style lang="scss">
  * {
    box-sizing: border-box;
  }

  .settings-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .wrapper {
    position: absolute;
    top: 50%;
    left: 50%;
    transform-origin: center center;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    font-family: "Museo Sans", sans-serif;
    color: #fff;
    overflow: hidden;
    min-width: 0;
  }

  .dashboard-sub-menu {
    width: 100%;
    height: 30px;
    background-color: rgb(37, 37, 37);
    border: 1px solid rgb(65, 65, 65);
    border-radius: 4px;
    flex-shrink: 0;
    margin-bottom: 8px;

    .nav-grid {
      width: calc(100% - 4px);
      height: 100%;
      display: grid;
      gap: 4px;
      margin: 0 2px;
    }
    button {
      appearance: none;
      border: none;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      border-radius: 3px;
      font-weight: 700;
      margin: 1px 0;
      color: #fff;
      cursor: pointer;
      min-width: 0;
      span {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }
  .eff_active {
    background-color: #191919 !important;
    border-top: 2px solid var(--activeColour) !important;
  }
  .not_eff_active {
    background-color: #191919 !important;
    border-top: 2px solid transparent !important;
  }

  .scroll-area {
    flex: 1;
    min-height: 0;
    width: 100%;
    overflow: hidden;
    padding: 0 4px 10px 4px;

    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-track {
      background: rgb(37, 37, 37);
      border-radius: 3px;
    }
    &::-webkit-scrollbar-thumb {
      background: var(--activeColour);
      border-radius: 3px;
    }
  }

  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
    gap: 8px;
    height: 100%;
    min-height: 0;
    min-width: 0;
  }
  .left {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 4px;
    scrollbar-width: thin;
    scrollbar-color: var(--activeColour) transparent;
    &::-webkit-scrollbar {
      width: 5px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: var(--activeColour);
      border-radius: 3px;
    }
    > * {
      flex-shrink: 0;
    }
  }

  .right {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
    min-height: 0;
    height: 100%;
    overflow: hidden;
    position: relative;
  }

  .panel-header {
    flex-shrink: 0;
    .header-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      min-height: 34px;
      gap: 6px;
      min-width: 0;
    }
    h1 {
      margin: 0;
      font-size: clamp(14px, 3.6vh, 22px);
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }
    .normal_underline {
      height: clamp(3px, 0.6vh, 5px);
      width: 100%;
      background-color: var(--activeColour);
      border-radius: 0.5vh;
      margin: 4px 0;
      box-shadow: 0 0 10px var(--activeColour);
    }
  }
  .icon-btn {
    background: transparent;
    border: none;
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
    transition: transform 0.2s ease;
    img {
      width: 150%;
      height: 150%;
      object-fit: contain;
      pointer-events: none;
    }
    &:hover {
      transform: scale(1.1);
    }
  }

  .items-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    gap: 6px;
  }

  .item-btn {
    width: 100%;
    min-height: 44px;
    padding: 4px 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #191919;
    border: 2px solid #383838;
    border-radius: 5px;
    color: #fff;
    cursor: pointer;
    min-width: 0;
    transition:
      border-color 0.15s ease,
      background-color 0.15s ease;
    .btn-text {
      width: 100%;
      font-size: 12px;
      font-weight: 700;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    &:hover {
      background: #1d1d1d;
      background-color: var(--activeColour);
    }
    &:active {
      transform: scale(0.97);
    }
  }
  .empty-state {
    grid-column: 1 / -1;
    margin: 6px 0;
    text-align: center;
    color: #777;
    font-size: 11px;
    font-style: italic;
  }
  .hint {
    margin: 0;
    color: #999;
    font-size: 10px;
    line-height: 1.5;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 5px;
    min-width: 0;
  }
  .move-row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    margin-top: 10px;
  }
  .field-top {
    display: flex;
    justify-content: space-between;
    gap: 6px;
    font-size: 10px;
    font-weight: 700;
    color: #ccc;
    min-width: 0;
    b {
      color: var(--activeColour);
      font-weight: 800;
      white-space: nowrap;
    }
  }
  .fx-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 7px;
    border-radius: 2.5px;
    outline: none;
    cursor: pointer;
    border: 1px solid #000;
    display: block;
    background: var(--activeColour);

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 6px;
      height: 9px;
      border-radius: 2px;
      background: #fff;
      border: 1px solid #000;
      box-shadow: 0 0 2px rgba(0, 0, 0, 0.6);
      cursor: pointer;
      margin-top: -2px;
    }
    &:disabled {
      opacity: 0.4;
    }
  }
  .search-input {
    flex: 1;
    min-width: 0;
    width: 100%;
    height: 28px;
    padding: 0 10px;
    font-size: 11px;
    color: white;
    background-color: #131313;
    border: 1px solid rgb(65, 65, 65);
    border-radius: 4px;
    outline: none;
    &:focus {
      border-color: var(--activeColour);
    }
  }
  .native-select {
    width: 100%;
    height: 28px;
    padding: 0 8px;
    background-color: #131313;
    border: 1px solid rgb(58, 58, 58);
    border-radius: 4px;
    color: #ecf0f1;
    font-size: 12px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    outline: none;
    &:focus {
      border-color: var(--activeColour);
    }
    option {
      background-color: #191919;
    }
  }
  .row-select {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  .check-row {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    min-width: 0;
  }
  .label-text {
    font-size: 11px;
    font-weight: 600;
    color: #ddd;
    min-width: 0;
  }
  .checkbox {
    position: relative;
    width: 12px;
    height: 12px;
    border-radius: 2px;
    border: 1px solid #5c5c5c;
    background-color: #0d0d0d;
    flex-shrink: 0;
    input {
      position: absolute;
      inset: 0;
      opacity: 0;
      margin: 0;
      cursor: pointer;
    }
    &.checked {
      background-color: var(--activeColour);
      border-color: var(--activeColour);
    }
  }
  .mini-check {
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 10px;
    color: #ccc;
    cursor: pointer;
    input {
      margin: 0;
      accent-color: var(--activeColour);
    }
  }

  .add-new-btn,
  .render-btn,
  .back-btn {
    width: 100%;
    min-width: 0;
    height: 26px;
    padding: 0 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: bold;
    color: white;
    border-radius: 4px;
    cursor: pointer;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
    transition: all 0.15s ease;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    &:disabled {
      opacity: 0.5;
      cursor: default;
    }
  }
  .add-new-btn {
    background-color: #191919;
    border: 0.5px solid rgba(255, 255, 255, 0.3);
    &:hover:not(:disabled) {
      background-color: var(--activeColour);
      border-color: var(--activeColour);
    }
  }
  .render-btn {
    background-color: var(--activeColour);
    border: 0.5px solid rgba(255, 255, 255, 0.3);
    &:hover:not(:disabled) {
      background-color: #191919;
    }
  }
  .back-btn {
    background: #333;
    border: 1px solid #555;
    &:hover {
      background: #444;
    }
  }
  .small-btn {
    width: 22px;
    height: 22px;
    flex-shrink: 0;
    padding: 0;
    border: none;
    border-radius: 4px;
    background: #292929;
    color: #fff;
    font-size: 14px;
    line-height: 1;
    cursor: pointer;
    &:hover {
      background: #a01414;
    }
  }

  .fx-card {
    background: #191919;
    border: 2px solid #383838;
    border-radius: 5px;
    min-width: 0;
    &[open] {
      border-color: var(--activeColour);
      background-color: #1d1d1d;
    }
    summary {
      display: flex;
      align-items: center;
      gap: 6px;
      min-height: 36px;
      padding: 4px 8px;
      cursor: pointer;
      list-style-position: inside;
    }
  }
  .fx-name {
    flex: 1;
    min-width: 0;
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .fx-body {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px;
    border-top: 2px solid #383838;
    min-width: 0;
    overflow-x: hidden;
  }

  .results {
    max-height: 170px;
    overflow-y: auto;
    border: 1px solid #444;
    border-radius: 4px;
    background: #111;
  }
  .result-btn {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
    padding: 6px 8px;
    background: transparent;
    border: none;
    color: #fff;
    font-size: 11px;
    text-align: left;
    cursor: pointer;
    span {
      flex: 1;
      min-width: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    small {
      color: #aaa;
      font-size: 9px;
    }
    &:hover {
      background: var(--activeColour);
    }
  }

  .angle-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 44px;
    gap: 8px;
    align-items: center;
  }
  .dial {
    width: 44px;
    height: 44px;
  }
  .dial-ring {
    fill: #101010;
    stroke: #3a3a3a;
  }
  .dial-line {
    stroke: var(--activeColour);
    stroke-width: 3;
    stroke-linecap: round;
  }

  .preview-card,
  .settings-card {
    background-color: rgb(31, 31, 31);
    border: 1px solid rgb(50, 50, 50);
    border-radius: 4px;
    padding: 6px;
    min-width: 0;
  }

  .preview-card {
    flex: 1 1 0;
    min-height: 70px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    container-type: size;
  }

  .preview-stage {
    position: relative;
    flex: 1 1 auto;
    min-width: 0;
    min-height: 0;
    background: #101010;
    border-radius: 4px;
    overflow: hidden;
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
  }

  .source-video {
    position: absolute;
    top: 0;
    left: 0;
    width: 2px;
    height: 2px;
    opacity: 0;
    pointer-events: none;
  }
  .preview-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border-radius: 4px;
  }
  .preview-text {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 6px;
    padding: 6px;
    text-align: center;
    color: #aaa;
    font-size: clamp(8px, 1.8vh, 12px);
    line-height: 1.35;
    overflow: hidden;
    p {
      margin: 0;
    }
  }

  .settings-card {
    flex: 0 1 auto;
    min-height: 96px;
    max-height: 62%;
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: thin;
    scrollbar-color: var(--activeColour) transparent;
    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: var(--activeColour);
      border-radius: 3px;
    }
    > * {
      flex-shrink: 0;
    }
  }

  #delete-icon {
    width: 80%;
    height: 80%;
    object-fit: contain;
  }

  .sliders {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(110px, 100%), 1fr));
    gap: 8px 10px;
    min-width: 0;
  }

  .flash {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 5px 6px;
    min-width: 0;
    background: #151515;
    border: 1px solid #3a3a3a;
    border-radius: 5px;
    transition: border-color 0.15s ease;
    &.on {
      border-color: var(--activeColour);
    }
  }
  .flash-head {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .flash-title {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    height: 22px;
    padding: 0;
    background: transparent;
    border: none;
    color: #fff;
    font: inherit;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    .flash-label {
      flex: 1;
      min-width: 0;
      text-align: left;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .flash-state {
      font-size: 10px;
      color: #888;
    }
    .chev {
      font-size: 11px;
      color: #aaa;
      transition: transform 0.15s ease;
      &.open {
        transform: rotate(180deg);
      }
    }
  }
  .flash.on .flash-state {
    color: var(--activeColour);
  }
  .flash-body {
    transition: opacity 0.15s ease;
    &.dim {
      opacity: 0.45;
    }
  }

  .switch {
    position: relative;
    width: 26px;
    height: 14px;
    flex-shrink: 0;
    padding: 0;
    border: 1px solid #555;
    border-radius: 999px;
    background: #0d0d0d;
    cursor: pointer;
    transition:
      background-color 0.15s ease,
      border-color 0.15s ease;
    .knob {
      position: absolute;
      top: 1px;
      left: 1px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #ccc;
      transition: transform 0.15s ease;
    }
    &.on {
      background: var(--activeColour);
      border-color: var(--activeColour);
      .knob {
        transform: translateX(12px);
        background: #fff;
      }
    }
  }

  @media (max-width: 520px) {
    .layout {
      gap: 5px;
    }
    .right {
      gap: 5px;
    }
    .preview-card,
    .settings-card {
      padding: 4px;
    }
  }
</style>
