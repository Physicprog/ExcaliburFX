<script>
  import { onMount, onDestroy } from "svelte";
  import { fly } from "svelte/transition";
  import {
    EffectsTab,
    TRANSITION_MS,
    layerColors,
    applyOnAdjustmentLayer,
    createLayerCompOnSelected,
    warpStabilizerSettings,
    cameraTrackerSettings,
    autoCutSensitivity,
    autoBeatSensitivity,
    autoBeatThreshold,
    c4aSkipDefaults,
    c4aSkipDisabledFx,
    c4aIncTransform,
    c4aIncEffects,
    c4aIncFxSettings,
    c4aIncMasks,
    c4aIncText,
    c4aIncStyles,
    c4aIncPrecomps,
    c4aMaxDepth,
    rigOneNullPerEffect,
    rigOnlyImportantProps,
    toggleFxMode,
  } from "../../stores.js";

  import { sendNotif } from "../../logic.js";
  import { fs, os, path } from "../../../lib/cep/node";
  import {
    CreateCameraTracker,
    CreateWarpStable,
    AutoCut,
    AutoBeatMarker,
    dumpCompData,
    createFXControlRig,
    toggleHeavyFXProject,
    log,
    callJSX,
  } from "../../../lib/utils/main.js";
  import Information from "../../../assets/ui/Info.svg";
  import Delete from "../../../assets/ui/Delete.png";
  import IsPreset from "../../../assets/ui/Bolt.png";
  import IsPlugin from "../../../assets/ui/Electic.png";
  import Settings from "../../../assets/ui/settings.png";
  import warpStabilizerPreview from "../../../assets/ui/stabed.png";
  import cameraTrackerPreview from "../../../assets/ui/tracked.png";

  let isDeleteMode = false;
  let isLoading = true;
  let expandedEffectId = null;
  let hoveredEffectId = null;
  let isHeavyFxToggled = false;

  let localOneNull = $rigOneNullPerEffect;
  let localOnlyImportant = $rigOnlyImportantProps;

  $: rigOneNullPerEffect.set(localOneNull);
  $: rigOnlyImportantProps.set(localOnlyImportant);

  function toggleExpand(id) {
    expandedEffectId = expandedEffectId === id ? null : id;
  }

  const HOVER_DELAY = 10;
  let hoverTimer = null;

  function setHovered(id) {
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => {
      hoveredEffectId = id;
    }, HOVER_DELAY);
  }

  function clearHovered() {
    clearTimeout(hoverTimer);
    hoveredEffectId = null;
  }

  let activeSubView = "library";
  let prevSubView = null;
  let directionSub = 1;
  let isTransitioningSub = false;
  let transitionTimeoutSub = null;

  function setSubView(view) {
    if (view === activeSubView) return;
    directionSub = view === "add" ? 1 : -1;
    prevSubView = activeSubView;
    activeSubView = view;
    isTransitioningSub = true;

    clearTimeout(transitionTimeoutSub);
    transitionTimeoutSub = setTimeout(() => {
      isTransitioningSub = false;
      prevSubView = null;
    }, $TRANSITION_MS ?? 300);
  }

  let presetFolderPath = "";
  let customLibrary = [];
  let allAEPresets = [];
  let allAEEffects = [];
  let searchQueryMain = "";
  let searchQueryAdd = "";

  $: filteredLibrary = customLibrary.filter((item) =>
    item.name.toLowerCase().includes(searchQueryMain.toLowerCase()),
  );
  $: libraryPresets = filteredLibrary.filter((item) => item.type === "PRESET");
  $: libraryPlugins = filteredLibrary.filter((item) => item.type === "PLUGIN");

  $: filteredAEPresets = allAEPresets.filter((p) =>
    p.toLowerCase().includes(searchQueryAdd.toLowerCase()),
  );
  $: filteredAEEffects = allAEEffects.filter((e) =>
    e.toLowerCase().includes(searchQueryAdd.toLowerCase()),
  );

  function getCustomPresetFilePath() {
    const documentsFolder = path.join(os.homedir(), "Documents");
    const setFolder = path.join(documentsFolder, "Excalibur");
    if (!fs.existsSync(setFolder)) fs.mkdirSync(setFolder, { recursive: true });
    return path.join(setFolder, "custompresets.ebfx");
  }

  function loadCustomLibrary() {
    const filePath = getCustomPresetFilePath();
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, "utf-8");
        customLibrary = data ? JSON.parse(data) : [];
      } else {
        customLibrary = [];
        saveCustomLibrary();
      }
    } catch (e) {
      customLibrary = [];
    }
  }

  function saveCustomLibrary() {
    const filePath = getCustomPresetFilePath();
    try {
      fs.writeFileSync(
        filePath,
        JSON.stringify(customLibrary, null, 2),
        "utf-8",
      );
    } catch (e) {}
  }

  function parseAESource(res) {
    if (Array.isArray(res)) return res;
    if (typeof res === "string") {
      try {
        return JSON.parse(res);
      } catch (e) {
        try {
          return eval(res);
        } catch (err) {
          return [];
        }
      }
    }
    return [];
  }

  async function loadDataFromAE() {
    isLoading = true;
    try {
      const resEffects = await callJSX("getStandardEffectsAndPlugins");
      const resPresets = await callJSX("getAllUserPresets");
      allAEEffects = parseAESource(resEffects);
      allAEPresets = parseAESource(resPresets);
      loadCustomLibrary();
    } catch (e) {
      log("[Effects] Data loading failed:", e);
      sendNotif("Failed to sync with After Effects", false);
    } finally {
      isLoading = false;
    }
  }

  async function fetchPresetPath() {
    if (!presetFolderPath) {
      try {
        presetFolderPath = await callJSX("GetPresetFolderPathDisplay");
      } catch (e) {
        presetFolderPath = "Folder path unavailable";
      }
    }
  }

  function handleDocClick() {
    methodOpen = false;
    borderOpen = false;
  }

  onMount(() => {
    loadDataFromAE();
    window.addEventListener("click", handleDocClick);
  });

  onDestroy(() => {
    window.removeEventListener("click", handleDocClick);
    clearTimeout(hoverTimer);
    clearTimeout(transitionTimeoutSub);
  });

  async function handleItemClick(item) {
    if (isDeleteMode) {
      customLibrary = customLibrary.filter((i) => i.name !== item.name);
      saveCustomLibrary();
      sendNotif(`${item.name} has been deleted`, false);
    } else {
      try {
        const applyAdj = !!$applyOnAdjustmentLayer;
        const adjColor = $layerColors ? $layerColors.adjustment : 5;
        if (item.type === "PRESET") {
          await callJSX(
            "JustAddThePreset",
            item.name,
            applyAdj,
            adjColor,
            $createLayerCompOnSelected,
          );
        } else {
          await callJSX(
            "JustAddTheEffect",
            item.name,
            applyAdj,
            adjColor,
            $createLayerCompOnSelected,
          );
        }
      } catch (e) {
        sendNotif(`Failed to apply ${item.name}`, false, false);
      }
    }
  }

  function toggleCustomItem(name, type) {
    const existingIndex = customLibrary.findIndex((item) => item.name === name);
    if (existingIndex !== -1) {
      customLibrary = [
        ...customLibrary.slice(0, existingIndex),
        ...customLibrary.slice(existingIndex + 1),
      ];
      sendNotif(`${name} has been removed`, true);
    } else {
      customLibrary = [...customLibrary, { name, type }];
      sendNotif(`${name} has been added`, true);
    }
    saveCustomLibrary();
    closeAddMode();
  }

  function toggleDeleteMode() {
    isDeleteMode = !isDeleteMode;
  }

  function openAddMode() {
    isDeleteMode = false;
    searchQueryAdd = "";
    setSubView("add");
  }

  function closeAddMode() {
    searchQueryMain = "";
    searchQueryAdd = "";
    setSubView("library");
  }

  function setTab(tab) {
    $EffectsTab = tab;
    setSubView("library");
    isDeleteMode = false;
  }

  const WARP_METHODS = [
    "Position",
    "Position, Scale, Rotation",
    "Perspective",
    "Subspace Warp",
  ];

  const BORDER_DISPLAY = [
    "Stabilize Only",
    "Stabilize, Crop",
    "Stabilize, Crop, Auto-scale",
    "Stabilize, Synthesize Edges",
  ];

  let methodOpen = false;
  let borderOpen = false;

  function selectMethod(m) {
    warpStabilizerSettings.update((s) => ({ ...s, method: m }));
    methodOpen = false;
  }

  function selectBorder(b) {
    warpStabilizerSettings.update((s) => ({ ...s, border: b }));
    borderOpen = false;
  }

  function toggleMethodDropdown(e) {
    e.preventDefault();
    e.stopPropagation();
    borderOpen = false;
    methodOpen = !methodOpen;
  }

  function toggleBorderDropdown(e) {
    e.preventDefault();
    e.stopPropagation();
    methodOpen = false;
    borderOpen = !borderOpen;
  }

  function runAction(action) {
    try {
      action();
    } catch (e) {
      log("[Action] Execution failed:", e);
    }
  }

  function applyWarpStabilizer(color) {
    const s = $warpStabilizerSettings;
    const methodIndex = WARP_METHODS.indexOf(s.method);
    const borderIndex = BORDER_DISPLAY.indexOf(s.border);
    const layerColor = color !== undefined ? color : ($layerColors ? $layerColors.adjustment : 5);
    CreateWarpStable(
      layerColor,
      s.detailed ? 1 : 0,
      s.smoothness,
      methodIndex,
      s.fast ? 1 : 0,
      borderIndex,
    );
  }

  function applyCameraTracker(color) {
    const s = $cameraTrackerSettings;
    const layerColor = color !== undefined ? color : ($layerColors ? $layerColors.adjustment : 5);
    CreateCameraTracker(layerColor, s.detailed ? 1 : 0, s.trackSize);
  }
</script>

<div class="wrapper">
  <nav class="dashboard-sub-menu">
    <div class="nav-grid">
      <button
        type="button"
        class:eff_active={$EffectsTab === "presets"}
        class:not_eff_active={$EffectsTab !== "presets"}
        on:click={() => setTab("presets")}
      >
        <span>Presets & Library</span>
      </button>

      <button
        type="button"
        class:eff_active={$EffectsTab === "effects"}
        class:not_eff_active={$EffectsTab !== "effects"}
        on:click={() => setTab("effects")}
      >
        <span>Effects Builder</span>
      </button>
    </div>
  </nav>

  <div class="view-slide" style="--transition-ms: {$TRANSITION_MS ?? 300}ms;">
    {#if $EffectsTab === "presets"}
      <div
        class="slider-wrapper"
        in:fly={{ x: -80, duration: $TRANSITION_MS ?? 300 }}
        out:fly={{ x: -80, duration: $TRANSITION_MS ?? 200 }}
      >
        <div
          class="tab-slide"
          class:hidden={activeSubView !== "library" &&
            prevSubView !== "library"}
          class:exit={isTransitioningSub && prevSubView === "library"}
          class:enter={isTransitioningSub && activeSubView === "library"}
          class:slide-left-exit={isTransitioningSub &&
            prevSubView === "library" &&
            directionSub === 1}
          class:slide-right-enter={isTransitioningSub &&
            activeSubView === "library" &&
            directionSub === -1}
        >
          <div class="panel-view">
            <div class="panel-header">
              <div class="header-title">
                <h1>Your Library</h1>

                <div class="header-actions">
                  <label class="check-row" title="Apply on Adjustment Layer">
                    <span
                      class="checkbox"
                      class:checked={$applyOnAdjustmentLayer}
                    >
                      <input
                        type="checkbox"
                        bind:checked={$applyOnAdjustmentLayer}
                      />
                    </span>
                    <span class="label-text">Apply on ADJ Layer</span>
                  </label>
                  <div class="info-container">
                    <button
                      class="icon-btn"
                      title="Stats & Info"
                      aria-label="Stats and info"
                      on:mouseenter={fetchPresetPath}
                      on:focus={fetchPresetPath}
                    >
                      <img src={Information} alt="Info" decoding="async" />
                    </button>
                    <div class="info-tooltip">
                      <p>
                        <strong>Effects loaded:</strong>
                        {allAEEffects.length}
                      </p>
                      <p>
                        <strong>Presets loaded:</strong>
                        {allAEPresets.length}
                      </p>
                      <p>
                        <strong>Elements in library:</strong>
                        {customLibrary.length}
                      </p>
                      {#if presetFolderPath}
                        <p class="folder-path">
                          <strong>Preset Folder:</strong><br
                          />{presetFolderPath}
                        </p>
                      {/if}
                    </div>
                  </div>

                  <button
                    class="icon-btn trash-btn"
                    class:active={isDeleteMode}
                    on:click={toggleDeleteMode}
                    title="Toggle Delete Mode"
                  >
                    <img src={Delete} alt="Delete" decoding="async" />
                  </button>
                </div>
              </div>
              <div class="normal_underline"></div>

              <div class="row-select">
                <input
                  class="search-input"
                  bind:value={searchQueryMain}
                  placeholder="Search in your library..."
                />
                <button class="add-new-btn" on:click={openAddMode}
                  >Add new</button
                >
              </div>
            </div>

            {#if isDeleteMode}
              <div class="delete-warning">Delete mode is active</div>
            {/if}

            <div class="scroll-area">
              {#if libraryPresets.length > 0}
                <div class="cat-header">
                  <h4>All user Presets [{libraryPresets.length}]</h4>
                  <div class="cat-underline"></div>
                </div>
                <div class="items-grid">
                  {#each libraryPresets as item}
                    <button
                      class="item-btn preset"
                      class:delete-mode={isDeleteMode}
                      on:click={() => handleItemClick(item)}
                    >
                      <img
                        src={IsPreset}
                        alt="Preset Icon"
                        class="icon"
                        decoding="async"
                      />
                      <span class="btn-text">{item.name}</span>
                    </button>
                  {/each}
                </div>
              {/if}

              {#if libraryPlugins.length > 0}
                <div class="cat-header">
                  <h4>All Plugins & Effects [{libraryPlugins.length}]</h4>
                  <div class="cat-underline"></div>
                </div>
                <div class="items-grid">
                  {#each libraryPlugins as item}
                    <button
                      class="item-btn plugin"
                      class:delete-mode={isDeleteMode}
                      on:click={() => handleItemClick(item)}
                    >
                      <img
                        src={IsPlugin}
                        alt="Plugin Icon"
                        class="icon"
                        decoding="async"
                      />
                      <span class="btn-text">{item.name}</span>
                    </button>
                  {/each}
                </div>
              {/if}

              {#if libraryPresets.length === 0 && libraryPlugins.length === 0 && customLibrary.length > 0}
                <div class="empty-state">No matches found for your search.</div>
              {/if}
            </div>
          </div>
        </div>

        <div
          class="tab-slide"
          class:hidden={activeSubView !== "add" && prevSubView !== "add"}
          class:exit={isTransitioningSub && prevSubView === "add"}
          class:enter={isTransitioningSub && activeSubView === "add"}
          class:slide-right-exit={isTransitioningSub &&
            prevSubView === "add" &&
            directionSub === -1}
          class:slide-left-enter={isTransitioningSub &&
            activeSubView === "add" &&
            directionSub === 1}
        >
          <div class="panel-view">
            <div class="panel-header">
              <div class="header-title">
                <h1>Add Preset/Plugin</h1>
                <button class="back-btn" on:click={closeAddMode}>Cancel</button>
              </div>
              <div class="normal_underline"></div>
              <input
                class="search-input massive-search"
                bind:value={searchQueryAdd}
                placeholder="Search for any plugin or preset..."
              />
            </div>

            <div class="scroll-area split-scroll">
              {#if isLoading}
                <div class="empty-state">Syncing with After Effects...</div>
              {:else}
                <div class="split-columns">
                  <div class="col">
                    <div class="cat-header">
                      <h4>Effects [{filteredAEEffects.length}]</h4>
                      <div class="cat-underline"></div>
                    </div>
                    <div class="items-col">
                      {#each filteredAEEffects as plugin}
                        <button
                          class="item-btn plugin {customLibrary.some(
                            (i) => i.name === plugin,
                          )
                            ? 'added'
                            : ''}"
                          on:click={() => toggleCustomItem(plugin, "PLUGIN")}
                          title={plugin}
                        >
                          <img
                            src={IsPlugin}
                            alt="Plugin Icon"
                            class="icon"
                            decoding="async"
                          />
                          <span class="btn-text">{plugin}</span>
                        </button>
                      {/each}
                      {#if filteredAEEffects.length === 0}
                        <div class="empty-state-small">No effects found.</div>
                      {/if}
                    </div>
                  </div>
                  <div class="col">
                    <div class="cat-header">
                      <h4>Presets [{filteredAEPresets.length}]</h4>
                      <div class="cat-underline"></div>
                    </div>
                    <div class="items-col">
                      {#each filteredAEPresets as preset}
                        <button
                          class="item-btn preset {customLibrary.some(
                            (i) => i.name === preset,
                          )
                            ? 'added'
                            : ''}"
                          on:click={() => toggleCustomItem(preset, "PRESET")}
                          title={preset}
                        >
                          <img
                            src={IsPreset}
                            alt="Preset Icon"
                            class="icon"
                            decoding="async"
                          />
                          <span class="btn-text">{preset}</span>
                        </button>
                      {/each}
                      {#if filteredAEPresets.length === 0}
                        <div class="empty-state-small">No presets found.</div>
                      {/if}
                    </div>
                  </div>
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>
    {:else if $EffectsTab === "effects"}
      <div
        class="panel-view builder-view"
        in:fly={{ x: 80, duration: $TRANSITION_MS ?? 300 }}
        out:fly={{ x: 80, duration: $TRANSITION_MS ?? 200 }}
      >
        <div class="panel-header">
          <div class="header-title">
            <h1>Effects</h1>
          </div>
          <div class="normal_underline"></div>
        </div>

        <div class="builder-layout">
          <div class="fx-list">
            <div
              class="fx-card {expandedEffectId === 'warpStabilizer'
                ? 'expanded'
                : ''}"
              on:mouseenter={() => setHovered("warpStabilizer")}
              on:mouseleave={clearHovered}
            >
              <div class="fx-card-head">
                <button class="fx-apply-btn" on:click={() => runAction(() => applyWarpStabilizer($layerColors.precompose))}>
                  <span class="fx-name">Warp Stabilizer</span>
                </button>
                <button
                  type="button"
                  class="fx-gear-btn {expandedEffectId === 'warpStabilizer'
                    ? 'active'
                    : ''}"
                  on:click={() => toggleExpand("warpStabilizer")}
                >
                  <img src={Settings} alt="Settings" decoding="async" />
                </button>
              </div>
            </div>

            <div
              class="fx-card {expandedEffectId === 'cameraTracker'
                ? 'expanded'
                : ''}"
              on:mouseenter={() => setHovered("cameraTracker")}
              on:mouseleave={clearHovered}
            >
              <div class="fx-card-head">
                <button class="fx-apply-btn" on:click={() => runAction(() => applyCameraTracker($layerColors.precompose))}>
                  <span class="fx-name">3D Camera Tracker</span>
                </button>
                <button
                  type="button"
                  class="fx-gear-btn {expandedEffectId === 'cameraTracker'
                    ? 'active'
                    : ''}"
                  on:click={() => toggleExpand("cameraTracker")}
                >
                  <img src={Settings} alt="Settings" decoding="async" />
                </button>
              </div>
            </div>

            <div
              class="fx-card {expandedEffectId === 'autoCut' ? 'expanded' : ''}"
              on:mouseenter={() => setHovered("autoCut")}
              on:mouseleave={clearHovered}
            >
              <div class="fx-card-head">
                <button
                  type="button"
                  class="fx-apply-btn"
                  on:click={() => AutoCut($autoCutSensitivity)}
                >
                  <span class="fx-name">Auto Cut</span>
                </button>
                <button
                  type="button"
                  class="fx-gear-btn {expandedEffectId === 'autoCut'
                    ? 'active'
                    : ''}"
                  on:click={() => toggleExpand("autoCut")}
                >
                  <img src={Settings} alt="Settings" decoding="async" />
                </button>
              </div>
            </div>

            <div
              class="fx-card {expandedEffectId === 'audioBeat'
                ? 'expanded'
                : ''}"
              on:mouseenter={() => setHovered("audioBeat")}
              on:mouseleave={clearHovered}
            >
              <div class="fx-card-head">
                <button
                  type="button"
                  class="fx-apply-btn"
                  on:click={() =>
                    AutoBeatMarker($autoBeatSensitivity, $autoBeatThreshold)}
                >
                  <span class="fx-name">Auto Beat Mark</span>
                </button>
                <button
                  type="button"
                  class="fx-gear-btn {expandedEffectId === 'audioBeat'
                    ? 'active'
                    : ''}"
                  on:click={() => toggleExpand("audioBeat")}
                >
                  <img src={Settings} alt="Settings" decoding="async" />
                </button>
              </div>
            </div>

            <div class="fx-card-header">
              <h1>Utilities</h1>
              <div class="classic-underline"></div>
            </div>

            <div
              class="fx-card {expandedEffectId === 'HeavyFX' ? 'expanded' : ''}"
              on:mouseenter={() => setHovered("HeavyFX")}
              on:mouseleave={clearHovered}
            >
              <div class="fx-card-head">
                <button
                  type="button"
                  class="fx-apply-btn"
                  class:toggled={isHeavyFxToggled}
                  on:click={() => {
                    isHeavyFxToggled = !isHeavyFxToggled;
                    toggleHeavyFXProject($toggleFxMode);
                  }}
                >
                  <span class="fx-name">
                    {#if $toggleFxMode === "external"}
                      Toggle external plugins
                    {:else if $toggleFxMode === "native"}
                      Toggle native effects
                    {:else}
                      Toggle all effects
                    {/if}
                  </span>
                </button>
                <button
                  type="button"
                  class="fx-gear-btn {expandedEffectId === 'HeavyFX'
                    ? 'active'
                    : ''}"
                  on:click={() => toggleExpand("HeavyFX")}
                >
                  <img src={Settings} alt="Settings" decoding="async" />
                </button>
              </div>
            </div>

            <div
              class="fx-card {expandedEffectId === 'createFXControlRig'
                ? 'expanded'
                : ''}"
              on:mouseenter={() => setHovered("createFXControlRig")}
              on:mouseleave={clearHovered}
            >
              <div class="fx-card-head">
                <button
                  type="button"
                  class="fx-apply-btn"
                  on:click={() =>
                    createFXControlRig({
                      oneNullPerEffect: localOneNull,
                      onlyImportantProps: localOnlyImportant,
                    })}
                >
                  <span class="fx-name">Create FX Control Rig</span>
                </button>
                <button
                  type="button"
                  class="fx-gear-btn {expandedEffectId === 'createFXControlRig'
                    ? 'active'
                    : ''}"
                  on:click={() => toggleExpand("createFXControlRig")}
                >
                  <img src={Settings} alt="Settings" decoding="async" />
                </button>
              </div>
            </div>

            <div
              class="fx-card {expandedEffectId === 'dumpCompData'
                ? 'expanded'
                : ''}"
              on:mouseenter={() => setHovered("dumpCompData")}
              on:mouseleave={clearHovered}
            >
              <div class="fx-card-head">
                <button
                  type="button"
                  class="fx-apply-btn"
                  on:click={() =>
                    dumpCompData({
                      skipDefaults: $c4aSkipDefaults,
                      skipDisabledFx: $c4aSkipDisabledFx,
                      incTransform: $c4aIncTransform,
                      incEffects: $c4aIncEffects,
                      incFxSettings: $c4aIncFxSettings,
                      incMasks: $c4aIncMasks,
                      incText: $c4aIncText,
                      incStyles: $c4aIncStyles,
                      incPrecomps: $c4aIncPrecomps,
                      maxDepth: $c4aMaxDepth,
                    })}
                >
                  <span class="fx-name">Copy 4 Ai</span>
                </button>
                <button
                  type="button"
                  class="fx-gear-btn {expandedEffectId === 'dumpCompData'
                    ? 'active'
                    : ''}"
                  on:click={() => toggleExpand("dumpCompData")}
                >
                  <img src={Settings} alt="Settings" decoding="async" />
                </button>
              </div>
            </div>
          </div>
          <div
            class="fx-settings-panel"
            class:no-padding={hoveredEffectId && !expandedEffectId}
          >
            <div class="fx-settings-wrapper">
              {#if expandedEffectId === "warpStabilizer"}
                <div
                  class="fx-settings"
                  in:fly={{ x: -30, duration: $TRANSITION_MS ?? 200 }}
                  out:fly={{ x: 30, duration: $TRANSITION_MS ?? 200 }}
                >
                  <div class="fx-field">
                    <label for="warp-method-select">Stabilization method</label>
                    <div class="custom-select" class:open={methodOpen}>
                      <button
                        id="warp-method-select"
                        type="button"
                        class="select-trigger"
                        on:click={toggleMethodDropdown}
                      >
                        <span>{$warpStabilizerSettings.method}</span>
                      </button>
                      {#if methodOpen}
                        <ul
                          class="select-options"
                          transition:fly={{ y: -6, duration: 130 }}
                        >
                          {#each WARP_METHODS as m}
                            <li>
                              <button
                                type="button"
                                class="option-btn"
                                class:selected={m ===
                                  $warpStabilizerSettings.method}
                                on:click|stopPropagation={() => selectMethod(m)}
                              >
                                {m}
                              </button>
                            </li>
                          {/each}
                        </ul>
                      {/if}
                    </div>

                    <label for="warp-border-select">Border framing</label>
                    <div class="custom-select" class:open={borderOpen}>
                      <button
                        id="warp-border-select"
                        type="button"
                        class="select-trigger"
                        on:click={toggleBorderDropdown}
                      >
                        <span>{$warpStabilizerSettings.border}</span>
                      </button>
                      {#if borderOpen}
                        <ul
                          class="select-options"
                          transition:fly={{ y: -6, duration: 130 }}
                        >
                          {#each BORDER_DISPLAY as b}
                            <li>
                              <button
                                type="button"
                                class="option-btn"
                                class:selected={b ===
                                  $warpStabilizerSettings.border}
                                on:click|stopPropagation={() => selectBorder(b)}
                              >
                                {b}
                              </button>
                            </li>
                          {/each}
                        </ul>
                      {/if}
                    </div>
                  </div>
                  <div class="fx-field">
                    <label for="warp-smoothness-slider"
                      >Smoothness <span class="fx-value"
                        >{$warpStabilizerSettings.smoothness}%</span
                      ></label
                    >
                    <input
                      id="warp-smoothness-slider"
                      class="fx-slider"
                      type="range"
                      min="1"
                      max="100"
                      step="1"
                      bind:value={$warpStabilizerSettings.smoothness}
                    />
                  </div>
                  <div class="fx-field">
                    <label class="fx-check-row">
                      <span
                        class="checkbox"
                        class:checked={$warpStabilizerSettings.detailed}
                      >
                        <input
                          type="checkbox"
                          bind:checked={$warpStabilizerSettings.detailed}
                        />
                      </span>
                      <span class="label-text">Detailed analysis</span>
                    </label>
                  </div>
                  <div class="fx-field">
                    <label class="fx-check-row">
                      <span
                        class="checkbox"
                        class:checked={$warpStabilizerSettings.fast}
                      >
                        <input
                          type="checkbox"
                          bind:checked={$warpStabilizerSettings.fast}
                        />
                      </span>
                      <span class="label-text">Fast analysis</span>
                    </label>
                  </div>
                </div>
              {:else if expandedEffectId === "cameraTracker"}
                <div
                  class="fx-settings"
                  in:fly={{ x: -30, duration: $TRANSITION_MS ?? 200 }}
                  out:fly={{ x: 30, duration: $TRANSITION_MS ?? 200 }}
                >
                  <div class="fx-field">
                    <label for="cam-track-size-slider"
                      >Track point size <span class="fx-value"
                        >{$cameraTrackerSettings.trackSize}%</span
                      ></label
                    >
                    <input
                      id="cam-track-size-slider"
                      class="fx-slider"
                      type="range"
                      min="5"
                      max="1000"
                      step="15"
                      bind:value={$cameraTrackerSettings.trackSize}
                    />
                  </div>
                  <div class="fx-field">
                    <label class="fx-check-row">
                      <span
                        class="checkbox"
                        class:checked={$cameraTrackerSettings.detailed}
                      >
                        <input
                          type="checkbox"
                          bind:checked={$cameraTrackerSettings.detailed}
                        />
                      </span>
                      <span class="label-text">Detailed analysis</span>
                    </label>
                  </div>
                </div>
              {:else if expandedEffectId === "autoCut"}
                <div
                  class="fx-settings"
                  in:fly={{ x: -30, duration: $TRANSITION_MS ?? 200 }}
                  out:fly={{ x: 30, duration: $TRANSITION_MS ?? 200 }}
                >
                  <div class="fx-field">
                    <label for="auto-cut-slider"
                      >Cut sensitivity <span class="fx-value"
                        >{$autoCutSensitivity}</span
                      ></label
                    >
                    <input
                      id="auto-cut-slider"
                      class="fx-slider"
                      type="range"
                      min="0.1"
                      max="15.0"
                      step="0.1"
                      bind:value={$autoCutSensitivity}
                    />
                    <p class="fx-description">
                      More the value is low, more the script cuts easily at the
                      slightest difference.<br />(1.8 is a good compromise by
                      default)
                    </p>
                  </div>
                </div>
              {:else if expandedEffectId === "audioBeat"}
                <div
                  class="fx-settings"
                  in:fly={{ x: -30, duration: $TRANSITION_MS ?? 200 }}
                  out:fly={{ x: 30, duration: $TRANSITION_MS ?? 200 }}
                >
                  <div class="fx-field">
                    <label for="auto-beat-slider">
                      {#if $autoBeatSensitivity <= 60}
                        Bass auto detect
                      {:else if $autoBeatSensitivity >= 100}
                        Bass off
                      {:else}
                        Bass sensitivity <span class="fx-value"
                          >{$autoBeatSensitivity}%</span
                        >
                      {/if}
                    </label>
                    <input
                      id="auto-beat-slider"
                      class="fx-slider"
                      type="range"
                      min="60"
                      max="100"
                      step="1"
                      bind:value={$autoBeatSensitivity}
                    />

                    <label for="auto-beat-threshold-slider">
                      {#if $autoBeatThreshold <= 60}
                        Treble auto detect
                      {:else if $autoBeatThreshold >= 100}
                        Treble off
                      {:else}
                        Treble sensitivity <span class="fx-value"
                          >{$autoBeatThreshold}%</span
                        >
                      {/if}
                    </label>
                    <input
                      id="auto-beat-threshold-slider"
                      class="fx-slider"
                      type="range"
                      min="60"
                      max="100"
                      step="1"
                      bind:value={$autoBeatThreshold}
                    />

                    <p class="fx-description">
                      60% = auto detect, 100% = off. La zone intermédiaire
                      ajuste la sensibilité des marqueurs audio.
                    </p>
                  </div>
                </div>
              {:else if expandedEffectId === "HeavyFX"}
                <div
                  class="fx-settings"
                  in:fly={{ x: -30, duration: $TRANSITION_MS ?? 200 }}
                  out:fly={{ x: 30, duration: $TRANSITION_MS ?? 200 }}
                >
                  <div
                    class="fx-field"
                    style="gap: 1.5vh;"
                    class:locked={isHeavyFxToggled}
                  >
                    <button
                      type="button"
                      class="fx-check-row"
                      on:click={() => ($toggleFxMode = "external")}
                    >
                      <span
                        class="checkbox"
                        class:checked={$toggleFxMode === "external"}
                      ></span>
                      <span class="label-text">Plugins externes (Tiers)</span>
                    </button>

                    <button
                      type="button"
                      class="fx-check-row"
                      on:click={() => ($toggleFxMode = "native")}
                    >
                      <span
                        class="checkbox"
                        class:checked={$toggleFxMode === "native"}
                      ></span>
                      <span class="label-text">Effets natifs (Adobe)</span>
                    </button>
                    <button
                      type="button"
                      class="fx-check-row"
                      on:click={() => ($toggleFxMode = "all")}
                    >
                      <span
                        class="checkbox"
                        class:checked={$toggleFxMode === "all"}
                      ></span>
                      <span class="label-text">TOUS les effets</span>
                    </button>
                  </div>
                </div>
              {:else if expandedEffectId === "createFXControlRig"}
                <div
                  class="fx-settings"
                  in:fly={{ x: -30, duration: $TRANSITION_MS ?? 200 }}
                  out:fly={{ x: 30, duration: $TRANSITION_MS ?? 200 }}
                >
                  <div class="fx-field" style="gap: 1.5vh;">
                    <p class="fx-description">
                      Génère un système de contrôle centralisé (Null objects)
                      pour piloter les paramètres des effets du calque.
                    </p>

                    <label class="fx-check-row">
                      <span class="checkbox" class:checked={localOneNull}>
                        <input type="checkbox" bind:checked={localOneNull} />
                      </span>
                      <span class="label-text" style="color: #ff9d00;"
                        >1 Null par effet (vs. Global)</span
                      >
                    </label>

                    <label class="fx-check-row">
                      <span class="checkbox" class:checked={localOnlyImportant}>
                        <input
                          type="checkbox"
                          bind:checked={localOnlyImportant}
                        />
                      </span>
                      <span class="label-text"
                        >Sliders principaux uniquement</span
                      >
                    </label>
                  </div>
                </div>
              {:else if expandedEffectId === "dumpCompData"}
                <div
                  class="fx-settings"
                  in:fly={{ x: -30, duration: $TRANSITION_MS ?? 200 }}
                  out:fly={{ x: 30, duration: $TRANSITION_MS ?? 200 }}
                >
                  <div
                    style="display: grid; grid-template-columns: 1fr 1fr; gap: 1vh; width: 100%;"
                  >
                    <label class="fx-check-row">
                      <span class="checkbox" class:checked={$c4aSkipDefaults}>
                        <input
                          type="checkbox"
                          bind:checked={$c4aSkipDefaults}
                        />
                      </span>
                      <span class="label-text" style="color: #ff9d00;"
                        >Ignorer val. par défaut</span
                      >
                    </label>
                    <label class="fx-check-row">
                      <span class="checkbox" class:checked={$c4aSkipDisabledFx}>
                        <input
                          type="checkbox"
                          bind:checked={$c4aSkipDisabledFx}
                        />
                      </span>
                      <span class="label-text" style="color: #ff9d00;"
                        >Ignorer FX désactivés</span
                      >
                    </label>
                  </div>

                  <div
                    class="normal_underline"
                    style="margin: 0.5vh 0; opacity: 0.3; height: 1px; width: 100%;"
                  ></div>

                  <div
                    style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5vh; width: 100%;"
                  >
                    <label class="fx-check-row">
                      <span class="checkbox" class:checked={$c4aIncTransform}>
                        <input
                          type="checkbox"
                          bind:checked={$c4aIncTransform}
                        />
                      </span>
                      <span class="label-text">Transformations</span>
                    </label>
                    <label class="fx-check-row">
                      <span class="checkbox" class:checked={$c4aIncMasks}>
                        <input type="checkbox" bind:checked={$c4aIncMasks} />
                      </span>
                      <span class="label-text">Masques</span>
                    </label>
                    <label class="fx-check-row">
                      <span class="checkbox" class:checked={$c4aIncText}>
                        <input type="checkbox" bind:checked={$c4aIncText} />
                      </span>
                      <span class="label-text">Données Texte</span>
                    </label>
                    <label class="fx-check-row">
                      <span class="checkbox" class:checked={$c4aIncStyles}>
                        <input type="checkbox" bind:checked={$c4aIncStyles} />
                      </span>
                      <span class="label-text">Styles de Calque</span>
                    </label>
                  </div>

                  <div
                    class="normal_underline"
                    style="margin: 0.5vh 0; opacity: 0.3; height: 1px; width: 100%;"
                  ></div>

                  <div
                    style="display: flex; flex-direction: column; gap: 1vh; width: 100%;"
                  >
                    <label class="fx-check-row">
                      <span class="checkbox" class:checked={$c4aIncEffects}>
                        <input type="checkbox" bind:checked={$c4aIncEffects} />
                      </span>
                      <span class="label-text">Inclure les Effets</span>
                    </label>
                    {#if $c4aIncEffects}
                      <label
                        class="fx-check-row"
                        style="margin-left: 4%; opacity: 0.8; width: 96%;"
                      >
                        <span
                          class="checkbox"
                          class:checked={$c4aIncFxSettings}
                        >
                          <input
                            type="checkbox"
                            bind:checked={$c4aIncFxSettings}
                          />
                        </span>
                        <span class="label-text"
                          >Détailler les paramètres des effets</span
                        >
                      </label>
                    {/if}
                  </div>

                  <div
                    class="normal_underline"
                    style="margin: 0.5vh 0; opacity: 0.3; height: 1px; width: 100%;"
                  ></div>

                  <div
                    style="display: flex; flex-direction: column; gap: 1.5vh; width: 100%;"
                  >
                    <label class="fx-check-row">
                      <span class="checkbox" class:checked={$c4aIncPrecomps}>
                        <input type="checkbox" bind:checked={$c4aIncPrecomps} />
                      </span>
                      <span class="label-text"
                        >Scanner les sous-compositions</span
                      >
                    </label>
                    {#if $c4aIncPrecomps}
                      <div
                        class="fx-field"
                        style="width: 92%; margin-left: 4%;"
                      >
                        <label for="c4a-depth-slider"
                          >Profondeur Max <span class="fx-value"
                            >{$c4aMaxDepth}</span
                          ></label
                        >
                        <input
                          id="c4a-depth-slider"
                          class="fx-slider"
                          type="range"
                          min="1"
                          max="15"
                          step="1"
                          bind:value={$c4aMaxDepth}
                        />
                      </div>
                    {/if}
                  </div>
                </div>
              {:else if hoveredEffectId === "warpStabilizer"}
                <div
                  class="preview-panel"
                  in:fly={{ x: 30, duration: $TRANSITION_MS ?? 200 }}
                >
                  <img
                    src={warpStabilizerPreview}
                    alt="Warp Stabilizer Preview"
                    class="preview-image"
                    decoding="async"
                  />
                </div>
              {:else if hoveredEffectId === "cameraTracker"}
                <div
                  class="preview-panel"
                  in:fly={{ x: 30, duration: $TRANSITION_MS ?? 200 }}
                >
                  <img
                    src={cameraTrackerPreview}
                    alt="3D Camera Tracker Preview"
                    class="preview-image"
                    decoding="async"
                  />
                </div>
              {:else if hoveredEffectId === "autoCut"}
                <div
                  class="preview-panel"
                  in:fly={{ x: 30, duration: $TRANSITION_MS ?? 200 }}
                >
                  <div class="preview-icon">✂️</div>
                  <h3>Auto Cut</h3>
                  <p>
                    Scanne le calque sélectionné et coupe automatiquement à
                    chaque changement de scène détecté.
                  </p>
                </div>
              {:else if hoveredEffectId === "audioBeat"}
                <div
                  class="preview-panel"
                  in:fly={{ x: 30, duration: $TRANSITION_MS ?? 200 }}
                >
                  <div class="preview-icon">🥁</div>
                  <h3>Auto Beat Marker</h3>
                  <p>
                    Analyse la piste audio sélectionnée et pose automatiquement
                    des marqueurs sur chaque battement détecté.
                  </p>
                </div>
              {:else if hoveredEffectId === "HeavyFX"}
                <div
                  class="preview-panel"
                  in:fly={{ x: 30, duration: $TRANSITION_MS ?? 200 }}
                >
                  <div class="preview-icon">⚙️</div>
                  <h3>Toggle Heavy FX</h3>
                  <p>
                    Bascule la visibilité des effets lourds du projet pour
                    accélérer l'aperçu pendant le montage.
                  </p>
                </div>
              {:else if hoveredEffectId === "dumpCompData"}
                <div
                  class="preview-panel"
                  in:fly={{ x: 30, duration: $TRANSITION_MS ?? 200 }}
                >
                  <div class="preview-icon">📋</div>
                  <h3>Copy4Ai</h3>
                  <p>
                    Exporte les données de la comp active (calques, propriétés,
                    keyframes) pour debug ou usage externe.
                  </p>
                </div>
              {:else if hoveredEffectId === "createFXControlRig"}
                <div
                  class="preview-panel"
                  in:fly={{ x: 30, duration: $TRANSITION_MS ?? 200 }}
                >
                  <div class="preview-icon">🎛️</div>
                  <h3>Create FX Control Rig</h3>
                  <p>
                    Génère un calque de contrôle pour piloter centralement les
                    effets appliqués.
                  </p>
                </div>
              {:else}
                <div class="empty-settings">
                  Hover over an effect to preview how it works or adjust its
                  settings.
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  * {
    box-sizing: border-box;
  }

  .wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    font-family: "Museo Sans", sans-serif;
    overflow: hidden;
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
      grid-template-columns: repeat(2, minmax(0, 1fr));
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
      transition: all 0.1s ease;
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

  .view-slide {
    position: relative;
    width: 100%;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
  .slider-wrapper {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    will-change: transform, opacity;
    backface-visibility: hidden;
    transform: translateZ(0);
  }

  .tab-slide {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
    will-change: transform, opacity;
    backface-visibility: hidden;
    &.hidden {
      display: none;
    }
    &.exit {
      z-index: 1;
      pointer-events: none;
    }
    &.enter {
      z-index: 2;
    }
  }

  .slide-left-enter {
    animation: slideInFromRight var(--transition-ms, 300ms)
      cubic-bezier(0.25, 1, 0.5, 1) forwards;
  }
  .slide-left-exit {
    animation: slideOutToLeft var(--transition-ms, 300ms)
      cubic-bezier(0.25, 1, 0.5, 1) forwards;
  }
  .slide-right-enter {
    animation: slideInFromLeft var(--transition-ms, 300ms)
      cubic-bezier(0.25, 1, 0.5, 1) forwards;
  }
  .slide-right-exit {
    animation: slideOutToRight var(--transition-ms, 300ms)
      cubic-bezier(0.25, 1, 0.5, 1) forwards;
  }

  @keyframes slideInFromRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  @keyframes slideOutToLeft {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(-100%);
      opacity: 0;
    }
  }
  @keyframes slideInFromLeft {
    from {
      transform: translateX(-100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  @keyframes slideOutToRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }

  .panel-view {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 0 4px;
    box-sizing: border-box;
    position: absolute;
    inset: 0;
    min-height: 0;
    overflow: hidden;
    will-change: transform, opacity;
    backface-visibility: hidden;
    transform: translateZ(0);
  }
  .header-actions {
    display: flex;
    align-items: center;
    gap: 2vh;
    flex-shrink: 0;
  }
  h1 {
    font-size: 3.5vh;
    margin: 0;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }

  .classic-underline {
    height: 0.6vh;
    width: 98%;
    background-color: var(--activeColour);
    border-radius: 0.5vh;
    margin: 1vh auto 1.35vh auto;
    box-shadow: 0 0 10px var(--activeColour);
  }

  .panel-header {
    flex-shrink: 0;
    margin-bottom: 6px;
    .header-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-left: 5%;
      margin-right: 5%;
      min-height: 40px;
      min-width: 0;
      gap: 1vh;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 2vh;
      flex-shrink: 0;
    }
    h1 {
      font-size: 4vh;
      margin: 0;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }

    .normal_underline {
      height: 0.6vh;
      width: 90%;
      background-color: var(--activeColour);
      border-radius: 0.5vh;
      margin: 1vh auto 1.35vh auto;
      box-shadow: 0 0 10px var(--activeColour);
    }
  }

  .icon-btn {
    background: transparent;
    border: none;
    outline: none;
    appearance: none;
    width: 22px;
    height: 22px;
    flex-shrink: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: transform 0.2s ease;
    padding: 0;
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
      pointer-events: none;
      background: transparent;
      filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.4));
    }
    &:hover {
      transform: scale(1.1);
    }
  }

  .trash-btn.active img {
    filter: brightness(0) saturate(100%) invert(27%) sepia(93%) saturate(1900%)
      hue-rotate(340deg) brightness(95%) contrast(101%);
  }
  .trash-btn.active {
    animation: shake-horizontal-alternate 2s infinite;
  }

  @keyframes shake-horizontal-alternate {
    0%,
    60%,
    100% {
      transform: translateX(0);
    }
    63%,
    69%,
    75%,
    81%,
    87%,
    93% {
      transform: translateX(-2px);
    }
    66%,
    72%,
    78%,
    84%,
    90%,
    96% {
      transform: translateX(2px);
    }
  }

  .info-container {
    position: relative;
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }
  .info-tooltip {
    position: absolute;
    top: 130%;
    right: 0;
    background: #151515;
    border: 1px solid #444;
    padding: 10px;
    width: max-content;
    border-radius: 6px;
    max-width: 22vh;
    z-index: 100;
    opacity: 0;
    visibility: hidden;
    transition: 0.2s;
    pointer-events: none;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.6);
    text-align: left;
    overflow: hidden;
    p {
      margin: 4px 0;
      font-size: 2.2vh;
      color: #ccc;
      font-weight: 500;
      word-break: break-word;
    }
    strong {
      color: #fff;
      font-weight: 800;
    }
    .folder-path {
      margin-top: 8px;
      font-size: 1.8vh;
      color: #888;
      word-break: break-all;
    }
  }
  .info-container:hover .info-tooltip,
  .info-container:focus-within .info-tooltip {
    opacity: 1;
    visibility: visible;
  }

  .check-row {
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    gap: 0.6vh;
    width: fit-content;
    max-width: 100%;
    height: 1vh;
    min-height: 25px;
    padding: 0 5px;
    cursor: pointer;
    background: #222;
    border: 1px solid #444;
    border-radius: 6px;
    user-select: none;
    &:hover {
      transform: scale(1.02);
    }
    .label-text {
      font-size: 3vh;
      color: #e0e0e0;
      font-weight: 700;
      white-space: nowrap;
      line-height: 1;
      margin-top: 1px;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: none;
    }
  }

  .checkbox {
    position: relative;
    width: 8px;
    height: 8px;
    border-radius: 2px;
    border: 1px solid #5c5c5c;
    background-color: #0d0d0d;
    flex-shrink: 0;
    transition:
      background-color 0.1s ease,
      border-color 0.1s ease;

    input {
      position: absolute;
      inset: 0;
      opacity: 0;
      margin: 0;
      cursor: pointer;
    }

    &.checked {
      background-color: var(--activeColour, #ff007f);
      border-color: var(--activeColour, #ff007f);
    }
  }

  .search-input {
    flex: 1;
    min-width: 0;
    height: 28px;
    padding: 0 10px;
    font-size: 11px;
    color: white;
    background-color: #131313;
    border: 1px solid rgb(65, 65, 65);
    outline: none;
    border-radius: 4px;
    box-sizing: border-box;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
    transition:
      background-color 65ms,
      border-color 0.2s;
    &:focus {
      border-color: var(--activeColour);
      box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.3);
    }
    &.massive-search {
      display: block;
      width: 90%;
      margin: 2vh auto;
    }
  }

  .back-btn {
    background: #333;
    border: 1px solid #555;
    color: white;
    padding: 4px 10px;
    border-radius: 4px;
    margin-bottom: 5px;
    font-size: clamp(0.8rem, 1.5vh, 1.3rem);
    font-weight: 700;
    cursor: pointer;
    transition: 0.2s;
    flex-shrink: 0;
    &:hover {
      background: var(--activeColour);
      border-color: var(--activeColour);
    }
  }

  .scroll-area {
    flex: 1;
    min-height: 0;
    width: 90%;
    margin-left: 5%;
    overflow-x: hidden;
    overflow-y: auto;
    padding-bottom: 16px;
    padding-right: 5px;
    box-sizing: border-box;
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

  .row-select {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 90%;
    margin: 1.5vh auto 0 auto;
    box-sizing: border-box;
    min-width: 0;
  }

  .add-new-btn {
    flex-shrink: 0;
    height: 28px;
    padding: 0 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
    font-size: 11px;
    font-weight: bold;
    color: white;
    background-color: #191919;
    border: 0.5px dashed rgba(255, 255, 255, 0.3);
    border-left: 2px solid rgba(255, 255, 255, 0.4);
    border-radius: 4px;
    box-sizing: border-box;
    cursor: pointer;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
    transition: all 0.15s ease;
    &:hover {
      background-color: var(--activeColour);
      border-style: solid;
      border-color: var(--activeColour);
    }
  }

  .cat-header {
    margin-top: 1vh;
    margin-bottom: 1.5vh;
    min-width: 0;
    h4 {
      margin: 0;
      font-size: 2.3vh;
      color: #aaa;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .cat-underline {
      height: 2px;
      width: 100%;
      background-color: #444;
      margin-top: 5px;
    }
  }

  .split-columns {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 10px;
    width: 100%;
  }
  .col {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .items-col {
    display: flex;
    flex-direction: column;
    gap: 1.5vh;
    min-width: 0;
  }
  .items-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.5vh 8px;
    margin-bottom: 15px;
  }

  .item-btn {
    width: 100%;
    height: 7.5vh;
    margin: 0;
    padding: 0;
    color: white;
    background-color: #191919;
    border-radius: 2vh;
    border: 0.1vh solid rgba(94, 94, 94, 0.315);
    outline: none;
    cursor: pointer;
    overflow: hidden;
    transition:
      transform 125ms,
      background-color 150ms,
      border-left-color 150ms;
    box-sizing: border-box;
    border-left: 0.8vh solid #444;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding-left: 1.5vh;
    padding-right: 1vh;
    gap: 1.5vh;
    min-width: 0;
    .btn-text {
      flex: 1;
      min-width: 0;
      font-size: 3vh;
      font-weight: 700;
      text-align: left;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    img {
      width: 3.5vh;
      height: 3.5vh;
      flex-shrink: 0;
      filter: drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.6));
    }
    &:hover {
      background-color: #222;
      transform: translateY(-1.02px);
      border-left-color: var(--activeColour);
    }
    &:active {
      transform: translateY(1px);
    }
    &.delete-mode:hover {
      background-color: #fe0000;
      color: #fff;
    }
    &.added {
      display: none;
    }
  }

  .empty-state {
    text-align: center;
    color: #777;
    margin-top: 5vh;
    font-size: 1.8vh;
    font-style: italic;
  }
  .empty-state-small {
    color: #555;
    font-size: 1.4vh;
    font-style: italic;
    margin-top: 1vh;
    text-align: center;
  }

  .builder-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 1.5vh;
    width: 90%;
    margin: 0.5vh auto 1vh auto;
    flex: 1;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
    transition: grid-template-columns 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);

    &.preview-mode {
      grid-template-columns: minmax(0, 0.35fr) minmax(0, 1.65fr);
    }
  }

  .fx-list {
    display: flex;
    flex-direction: column;
    gap: 1.4vh;
    min-width: 0;
    height: 100%;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 0.6vh;
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

  .fx-settings-panel {
    background-color: #191919;
    border: 1px solid rgb(60, 60, 60);
    border-radius: 1vh;
    padding: 2vh;
    height: 100%;
    min-height: 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    &.no-padding {
      padding: 0;
    }
  }

  .fx-settings-wrapper {
    display: grid;
    grid-template-areas: "overlap";
    flex: 1;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }

  .fx-settings-wrapper > * {
    grid-area: overlap;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    box-sizing: border-box;
  }

  .fx-settings {
    display: flex;
    flex-direction: column;
    gap: 2.5vh;
    min-width: 0;
    height: 100%;
    overflow: hidden;
  }

  .preview-panel {
    width: 100%;
    color: #ccc;
    flex: 1;
    min-width: 0;
    min-height: 0;
    padding: 0;
    overflow: hidden;
    box-sizing: border-box;

    .preview-image {
      width: 100%;
      height: 100%;
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      border-radius: 1vh;
      background: #000;
      display: block;
    }

    .preview-icon {
      font-size: 6.5vh;
      margin-bottom: 2vh;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
    }
    h3 {
      font-size: 2.6vh;
      color: #fff;
      margin: 1vh 0 1vh 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
      flex-shrink: 0;
    }
    p {
      font-size: 1.8vh;
      color: #999;
      margin: 0;
      line-height: 1.5;
      word-break: break-word;
      flex-shrink: 0;
    }
  }
  .empty-settings {
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: #cccccc;
    font-size: 2.8vh;
    font-style: italic;
    line-height: 1.5;
    padding: 1vh;
  }

  .fx-card {
    background-color: #191919;
    border: 1px solid rgb(60, 60, 60);
    border-radius: 1vh;
    overflow: hidden;
    min-width: 0;
    flex-shrink: 0;
    transition: border-color 0.15s ease;
    &:hover {
      border-color: #777;
    }
  }

  .fx-card-header {
    flex-shrink: 0;
    margin-top: 1vh;
    h1 {
      text-align: left;
      margin-left: 5px;
      font-size: 3.7vh;
    }
  }

  .fx-card-head {
    display: flex;
    align-items: stretch;
    min-width: 0;
  }

  .fx-apply-btn {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 0.3vh;
    padding: 1.8vh 1.6vh;
    background: transparent;
    border: none;
    text-align: left;
    cursor: pointer;
    overflow: hidden;
    transition: background-color 0.15s ease;
    &:hover {
      background-color: rgba(255, 255, 255, 0.04);
    }
    &:active {
      background-color: rgba(255, 255, 255, 0.07);
    }
  }

  .fx-name {
    display: block;
    width: 100%;
    font-size: 2.6vh;
    font-weight: 700;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .fx-gear-btn {
    flex-shrink: 0;
    background: transparent;
    border: none;
    border-left: 1px solid rgb(60, 60, 60);
    color: #888;
    font-size: 2.2vh;
    cursor: pointer;
    padding: 0 1.8vh;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: 0.15s ease;
    img {
      width: 3vh;
      height: 3vh;
      object-fit: contain;
      display: block;
      pointer-events: none;
    }
    &:hover {
      background-color: rgba(255, 255, 255, 0.04);
      color: #fff;
    }
    &.active {
      background-color: rgba(255, 255, 255, 0.04);
    }
  }

  .fx-field {
    display: flex;
    flex-direction: column;
    gap: 1.3vh;
    position: relative;
    min-width: 0;
    label:not(.fx-check-row) {
      font-size: 2.3vh;
      font-weight: 700;
      color: #ccc;
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 1vh;
      min-width: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .fx-value {
      font-size: 2.3vh;
      color: var(--activeColour);
      font-weight: 800;
      flex-shrink: 0;
    }
  }

  .fx-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 95%;
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
    &::-moz-range-thumb {
      width: 5px;
      height: 8px;
      border-radius: 2px;
      background: #fff;
      border: 1px solid #000;
      cursor: pointer;
    }
  }

  .fx-check-row {
    display: flex !important;
    align-items: center;
    justify-content: flex-start !important;
    gap: 0.8vh;
    cursor: pointer;
    width: 100%;
    min-width: 0;
    .label-text {
      font-size: 2.6vh;
      font-weight: 600;
      min-width: 0;
      flex: none;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
  .delete-warning {
    color: #ff2a75;
    font-size: 3vh;
    font-weight: 800;
    text-align: center;
    animation: flicker 2s ease infinite;
  }

  @keyframes flicker {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
    100% {
      opacity: 1;
    }
  }
  .custom-select {
    position: relative;
    width: 100%;
    margin: 0 auto;
    font-size: 2vh;
    user-select: none;
    z-index: 4;
    min-width: 0;
    &.open {
      z-index: 40;
    }
  }

  .select-trigger {
    width: 100%;
    height: 4vh;
    min-height: 20px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 0 1.2vh;
    background-color: #191919;
    border: 0.2vh solid rgb(58, 58, 58);
    border-radius: 0.5vh;
    color: #ecf0f1;
    font-size: 2vh;
    font-weight: 600;
    cursor: pointer;
    box-sizing: border-box;
    transition:
      border-color 150ms ease,
      background-color 150ms ease;
    min-width: 0;

    span:first-child {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
      line-height: 1;
    }

    &:hover {
      border-color: #777;
    }
  }

  .custom-select.open .select-trigger {
    border-color: var(--activeColour);
  }

  .select-options {
    position: absolute;
    top: calc(100% + 0.6vh);
    left: 0;
    width: 100%;
    max-height: 22vh;
    overflow-y: auto;
    overflow-x: hidden;
    list-style: none;
    margin: 0;
    padding: 0.4vh;
    background-color: #191919;
    border: 0.2vh solid rgb(58, 58, 58);
    border-radius: 0.6vh;
    box-shadow: 0 1vh 5vh var(--activeColour);
    box-sizing: border-box;

    &::-webkit-scrollbar {
      width: 5px;
    }
    &::-webkit-scrollbar-track {
      background: rgb(37, 37, 37);
      border-radius: 3px;
    }
    &::-webkit-scrollbar-thumb {
      background: var(--activeColour);
      border-radius: 3px;
    }

    li {
      list-style: none;
    }
  }
  .option-btn {
    display: block;
    width: 100%;
    text-align: left;
    padding: 1.1vh 1.2vh;
    margin: 0.1vh 0;
    background: transparent;
    border: none;
    border-radius: 0.4vh;
    color: #ecf0f1;
    font-size: 2vh;
    font-weight: 600;
    cursor: pointer;
    box-sizing: border-box;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition:
      background-color 120ms,
      color 120ms;

    &:hover {
      background-color: var(--activeColour);
      box-shadow: 0 0 2vh var(--activeColour);
    }

    &.selected {
      color: var(--activeColour);
      background-color: rgba(255, 255, 255, 0.04);
    }
  }

  .fx-apply-btn.toggled {
    background-color: var(--activeColour);
  }
  .fx-apply-btn.toggled .fx-name {
    color: #fff;
    text-shadow: -2px 2px 4px black;
  }
  .locked {
    opacity: 0.4;
    pointer-events: none;
    filter: grayscale(100%);
  }
  .fx-description {
    font-size: 2vh;
    color: #cdcdcd;
    line-height: 1.4;
    margin-top: 0.5vh;
  }
</style>