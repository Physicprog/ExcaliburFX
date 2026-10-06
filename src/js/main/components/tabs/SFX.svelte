<script>
  import { onMount, onDestroy } from "svelte";
  import { fly } from "svelte/transition";
  import {
    SFXTab,
    TRANSITION_MS,
    isPremiere,
    sfxPreviewVolume,
    sfxPreviewEnabled,
    sfxCursorPlacementMode,
    sfxLoopPreview,
    sfxConfirmBeforeDelete,
    sfxCustomFolders,
    sfxNameOverrides,
    sfxFolderNameOverrides,
    sfxFavoriteFiles,
    sfxFadeInVal,
    sfxFadeOutVal,
    sfxFadeInStrength,
    sfxFadeOutStrength,
    sfxLowerAmount,
    sfxLowerSpacing,
  } from "../../stores.js";
  import { evalTS } from "../../../lib/utils/bolt";
  import { fs, os, path } from "../../../lib/cep/node";
  import settingsIcon from "../../../assets/ui/settings.png";
  import RenameIcon from "../../../assets/ui/Rename.png";
  import CloseIcon from "../../../assets/ui/Close.png";
  import fav from "../../../assets/ui/fav.png";
  import nofav from "../../../assets/ui/nofav.png";
  import { fuzzySearch } from "../../logic.js";
  import { csi } from "../../../lib/utils/bolt";
  import SFXTreeNode from "./SFXTreeNode.svelte";

  let wrapperEl;
  let scaleFactor = 1;
  const REF_WIDTH = 395;
  const REF_HEIGHT = 360;
  let wrapperObserver;
  let rafIdScale = null;

  function updateScale(w, h) {
    if (!w || !h) return;
    scaleFactor = Math.min(w / REF_WIDTH, h / REF_HEIGHT);
  }

  function autoFocus(node) {
    setTimeout(() => {
      node.focus();
      node.select();
    }, 10);
  }

  $: filteredFiles = sfxFiles.filter((f) => {
    const matchesSearch = fuzzySearch(searchQuery, f.name);
    const matchesFav = showFavoritesOnly ? $sfxFavoriteFiles[f.path] : true;

    return matchesSearch && matchesFav;
  });

  let searchQuery = "";

  let expandedCat = "Cat0";
  let activeLib = "All sounds";
  let sfxFiles = [];

  let showSettings = false;
  let sfxTree = [];

  let expandedPaths = new Set([""]);

  function collectFolderPaths(nodes) {
    const paths = [];

    for (const node of nodes) {
      paths.push(node.folder);
      if (node.children && node.children.length > 0) {
        paths.push(...collectFolderPaths(node.children));
      }
    }

    return paths;
  }

  $: flatTree = flattenNodes(sfxTree, 0);

  function flattenNodes(nodes, depth) {
    let result = [];

    for (const n of nodes) {
      result.push({ ...n, depth });

      if (expandedPaths.has(n.folder) && n.children && n.children.length > 0) {
        result = result.concat(flattenNodes(n.children, depth + 1));
      }
    }

    return result;
  }

  function toggleFolderExpand(folderPath, event) {
    if (event) event.stopPropagation();

    if (expandedPaths.has(folderPath)) {
      expandedPaths.delete(folderPath);
    } else {
      expandedPaths.add(folderPath);
    }

    expandedPaths = new Set(expandedPaths);
  }

  let showFavoritesOnly = false;

  let renamingKey = null;
  let renameValue = "";

  function toggleSettings() {
    showSettings = !showSettings;
  }

  function closeSettings() {
    showSettings = false;
  }

  function toggleShowFavorites() {
    showFavoritesOnly = !showFavoritesOnly;
  }

  function toggleFavorite(filePath, event) {
    if (event) event.stopPropagation();

    if ($sfxFavoriteFiles[filePath]) {
      const updated = { ...$sfxFavoriteFiles };
      delete updated[filePath];

      $sfxFavoriteFiles = updated;
    } else {
      $sfxFavoriteFiles = {
        ...$sfxFavoriteFiles,
        [filePath]: true,
      };
    }
  }

  let cachedExtensionRoot = null;

  function getExtensionRoot() {
    if (cachedExtensionRoot) return cachedExtensionRoot;

    if (!window.__adobe_cep__) {
      cachedExtensionRoot = "C:/mock/path";
      return cachedExtensionRoot;
    }

    try {
      cachedExtensionRoot = csi.getSystemPath("extension");
    } catch (e) {
      cachedExtensionRoot = "";
    }

    return cachedExtensionRoot;
  }

  function getSfxPath(subfolder = "") {
    if (!fs || typeof fs.existsSync !== "function") return "";

    const root = getExtensionRoot();

    if (!root) return "";

    const candidates = [
      path.join(root, "src", "js", "assets", "SFX", subfolder),

      path.join(root, "js", "assets", "SFX", subfolder),

      path.join(root, "assets", "SFX", subfolder),

      path.join(root, "dist", "js", "assets", "SFX", subfolder),

      path.join(root, "dist", "assets", "SFX", subfolder),

      path.join(root, "public", "assets", "SFX", subfolder),
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }

    return "";
  }

  function buildFolderNode(dirPath, relPath, displayName) {
    const node = {
      name: displayName,
      folder: relPath,
      children: [],
    };

    if (!fs || typeof fs.existsSync !== "function" || !fs.existsSync(dirPath)) {
      return node;
    }

    try {
      const entries = fs.readdirSync(dirPath);

      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry);

        if (fs.statSync(entryPath).isDirectory()) {
          const childRel = relPath ? relPath + "/" + entry : entry;

          node.children.push(buildFolderNode(entryPath, childRel, entry));
        }
      }

      node.children.sort((a, b) => a.name.localeCompare(b.name));
    } catch (e) {}

    return node;
  }

  function loadSfxTree() {
    sfxTree = [];

    const sfxRoot = getSfxPath();

    if (
      !sfxRoot ||
      !fs ||
      typeof fs.existsSync !== "function" ||
      !fs.existsSync(sfxRoot)
    ) {
      return;
    }

    try {
      const entries = fs.readdirSync(sfxRoot);
      const nodes = [];

      for (const entry of entries) {
        const entryPath = path.join(sfxRoot, entry);

        if (fs.statSync(entryPath).isDirectory()) {
          nodes.push(buildFolderNode(entryPath, entry, entry));
        }
      }

      nodes.sort((a, b) => a.name.localeCompare(b.name));

      sfxTree = nodes;
      expandedPaths = new Set([""]);
    } catch (err) {}
  }

  function scanFiles(dirPath, recursive = false) {
    let results = [];

    if (!fs || typeof fs.existsSync !== "function" || !fs.existsSync(dirPath)) {
      return results;
    }

    try {
      const list = fs.readdirSync(dirPath);

      for (let file of list) {
        const fullPath = path.join(dirPath, file);

        const stat = fs.statSync(fullPath);

        if (stat && stat.isDirectory()) {
          if (recursive) {
            results = results.concat(scanFiles(fullPath, recursive));
          }
        } else {
          const ext = path.extname(file).toLowerCase();

          if ([".wav", ".mp3", ".m4a", ".aif", ".aiff", ".ogg"].includes(ext)) {
            const rawName = file.replace(ext, "");

            results.push({
              name: $sfxNameOverrides[fullPath] ?? rawName,

              originalName: rawName,
              path: fullPath,
              type: ext.substring(1).toUpperCase(),
            });
          }
        }
      }
    } catch (e) {}

    return results;
  }

  function selectSubCategory(
    subName,
    folderPath,
    isAll = false,
    isCustom = false,
  ) {
    activeLib = subName;
    sfxFiles = [];

    const targetDir = isCustom ? folderPath : getSfxPath(folderPath);

    if (
      targetDir &&
      fs &&
      typeof fs.existsSync === "function" &&
      fs.existsSync(targetDir)
    ) {
      sfxFiles = scanFiles(targetDir, true);
    }
  }

  function selectTreeNode(name, folderPath) {
    selectSubCategory(name, folderPath, false);

    if (!expandedPaths.has(folderPath)) {
      expandedPaths.add(folderPath);
      expandedPaths = new Set(expandedPaths);
    }
  }

  async function addCustomFolder() {
    try {
      const folderPath = await evalTS("ExcaliburFXselectFolder");

      if (folderPath && typeof folderPath === "string") {
        if (!$sfxCustomFolders.find((f) => f.path === folderPath)) {
          const folderName = folderPath.split(/[\\/]/).pop() || "Custom Folder";

          $sfxCustomFolders = [
            ...$sfxCustomFolders,
            {
              name: folderName,
              path: folderPath,
            },
          ];

          selectSubCategory(
            $sfxFolderNameOverrides[folderPath] ?? folderName,
            folderPath,
            false,
            true,
          );
        }
      }
    } catch (err) {}
  }

  function removeCustomFolder(folderPath, event) {
    if (event) event.stopPropagation();

    if (
      $sfxConfirmBeforeDelete &&
      !confirm(`Remove this folder from the list?`)
    ) {
      return;
    }

    $sfxCustomFolders = $sfxCustomFolders.filter((f) => f.path !== folderPath);

    const updatedOverrides = {
      ...$sfxFolderNameOverrides,
    };

    delete updatedOverrides[folderPath];

    $sfxFolderNameOverrides = updatedOverrides;

    if (sfxFiles.length > 0 && sfxFiles[0].path.startsWith(folderPath)) {
      selectSubCategory("All sounds", "", true);
    }
  }

  function startRename(key, currentDisplayName, event) {
    if (event) event.stopPropagation();

    renamingKey = key;
    renameValue = currentDisplayName;
  }

  function cancelRename() {
    renamingKey = null;
    renameValue = "";
  }

  function confirmRenameFile(file) {
    const trimmed = renameValue.trim();

    if (!trimmed) {
      cancelRename();
      return;
    }

    $sfxNameOverrides = {
      ...$sfxNameOverrides,
      [file.path]: trimmed,
    };

    sfxFiles = sfxFiles.map((f) => {
      if (f.path === file.path) {
        return {
          ...f,
          name: trimmed,
        };
      }

      return f;
    });

    cancelRename();
  }

  function confirmRenameFolder(folder) {
    const trimmed = renameValue.trim();

    if (trimmed) {
      $sfxFolderNameOverrides = {
        ...$sfxFolderNameOverrides,
        [folder.path]: trimmed,
      };
    }

    cancelRename();
  }

  let previewAudioEl;
  let hoverTimer = null;
  let audioUnlocked = false;

  const HOVER_PREVIEW_DELAY = 180;

  function unlockAudioOnce() {
    if (audioUnlocked || !previewAudioEl) {
      return;
    }

    previewAudioEl.muted = true;

    previewAudioEl
      .play()
      .then(() => {
        previewAudioEl.pause();
        previewAudioEl.currentTime = 0;
        previewAudioEl.muted = false;
        audioUnlocked = true;
      })
      .catch((e) => {});
  }

  const MIME_BY_EXT = {
    wav: "audio/wav",
    mp3: "audio/mpeg",
    m4a: "audio/mp4",
    aif: "audio/aiff",
    aiff: "audio/aiff",
    ogg: "audio/ogg",
  };

  const dataUriCache = new Map();

  function fileToDataUri(filePath) {
    if (!fs || typeof fs.readFileSync !== "function") {
      return "";
    }

    if (dataUriCache.has(filePath)) {
      return dataUriCache.get(filePath);
    }

    if (dataUriCache.size > 50) {
      const firstKey = dataUriCache.keys().next().value;

      dataUriCache.delete(firstKey);
    }

    const ext = path.extname(filePath).slice(1).toLowerCase();

    const mime = MIME_BY_EXT[ext] || "audio/wav";

    try {
      const buffer = fs.readFileSync(filePath);

      const base64 = buffer.toString("base64");

      const uri = `data:${mime};base64,${base64}`;

      dataUriCache.set(filePath, uri);

      return uri;
    } catch (e) {
      return "";
    }
  }

  function handleFileHover(file) {
    if (!$sfxPreviewEnabled || !previewAudioEl) {
      return;
    }

    if (!audioUnlocked) {
      unlockAudioOnce();
    }

    clearTimeout(hoverTimer);

    hoverTimer = setTimeout(() => {
      try {
        const uri = fileToDataUri(file.path);

        if (!uri) return;

        previewAudioEl.src = uri;
        previewAudioEl.volume = $sfxPreviewVolume;
        previewAudioEl.loop = $sfxLoopPreview;
        previewAudioEl.currentTime = 0;

        previewAudioEl.play().catch((e) => {});
      } catch (e) {}
    }, HOVER_PREVIEW_DELAY);
  }

  function handleFileHoverEnd() {
    clearTimeout(hoverTimer);

    if (previewAudioEl) {
      previewAudioEl.pause();
      previewAudioEl.removeAttribute("src");
    }
  }

  let openFxPopup = null;

  function toggleFxPopup(key) {
    openFxPopup = openFxPopup === key ? null : key;
  }

  function closeFxPopup() {
    openFxPopup = null;
  }

  $: if (previewAudioEl) {
    previewAudioEl.volume = $sfxPreviewVolume;
  }

  let sharedAudioCtx = null;

  function getAudioCtx() {
    if (!sharedAudioCtx) {
      sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    return sharedAudioCtx;
  }

  async function computePeakOffset(filePath) {
    if ($sfxCursorPlacementMode === "cursor") {
      return 0;
    }

    if (!fs || typeof fs.readFileSync !== "function") {
      return 0;
    }

    try {
      const nodeBuffer = fs.readFileSync(filePath);

      const arrayBuffer = new Uint8Array(nodeBuffer).buffer;

      const ctx = getAudioCtx();

      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

      const channelData = audioBuffer.getChannelData(0);

      const sampleRate = audioBuffer.sampleRate;

      let peakIndex = 0;
      let peakValue = 0;

      for (let i = 0; i < channelData.length; i++) {
        const abs = Math.abs(channelData[i]);

        if (abs > peakValue) {
          peakValue = abs;
          peakIndex = i;
        }
      }

      return peakIndex / sampleRate;
    } catch (e) {
      return 0;
    }
  }

  async function addSfxToTimeline(filePath) {
    try {
      const offsetSeconds = await computePeakOffset(filePath);

      await evalTS("ExcaliburFXLoadSfxFile", {
        path: encodeURIComponent(filePath),
        offset: offsetSeconds,
        mode: $sfxCursorPlacementMode,
      });
    } catch (e) {}
  }

  function applyAEFx(funcName, ...args) {
    evalTS(funcName, ...args).catch(console.error);
  }

  function applyFadeIn() {
    applyAEFx("FadeInLevel", $sfxFadeInVal, $sfxFadeInStrength);
  }

  function applyFadeOut() {
    applyAEFx("FadeOutLevel", $sfxFadeOutVal, $sfxFadeOutStrength);
  }

  function applyLower() {
    applyAEFx("ExcaliburFX_Lower", $sfxLowerAmount, $sfxLowerSpacing);
  }

  function applyPremiereAudioEffect(effectNames) {
    evalTS("ExcaliburFX_AddPproAudioEffect", effectNames).catch(console.error);
  }

  function setTab(tab) {
    $SFXTab = tab;
  }

  function handleWindowKeydown(e) {
    if (e.key === "Escape") {
      if (showSettings) {
        closeSettings();
      }

      if (openFxPopup) {
        closeFxPopup();
      }
    }
  }

  onMount(() => {
    loadSfxTree();

    if (
      !$SFXTab ||
      !["presets", "effects", "sfx", "builder"].includes($SFXTab)
    ) {
      $SFXTab = "presets";
    }

    selectSubCategory("All sounds", "", true);

    window.addEventListener("keydown", handleWindowKeydown);

    window.addEventListener("click", unlockAudioOnce, { once: true });

    if (wrapperEl) {
      const rect = wrapperEl.getBoundingClientRect();
      updateScale(rect.width, rect.height);
    }
    wrapperObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (rafIdScale) cancelAnimationFrame(rafIdScale);
      rafIdScale = requestAnimationFrame(() =>
        updateScale(entry.contentRect.width, entry.contentRect.height),
      );
    });
    if (wrapperEl) wrapperObserver.observe(wrapperEl);
  });

  onDestroy(() => {
    window.removeEventListener("keydown", handleWindowKeydown);

    window.removeEventListener("click", unlockAudioOnce);

    clearTimeout(hoverTimer);

    if (sharedAudioCtx) {
      sharedAudioCtx.close();
    }
    if (wrapperObserver) wrapperObserver.disconnect();
    if (rafIdScale) cancelAnimationFrame(rafIdScale);
  });
</script>

<audio bind:this={previewAudioEl} style="display:none;"></audio>

<div class="settings-wrapper" bind:this={wrapperEl}>
  <div
    class="wrapper"
    style="transform: translate(-50%, -50%) scale({scaleFactor}); width: {REF_WIDTH}px; height: {REF_HEIGHT}px;"
  >
    <!-- Menu de navigation principal SFX -->
    <nav class="dashboard-sub-menu">
      <div class="nav-grid">
        <button
          type="button"
          class:eff_active={$SFXTab === "presets" || $SFXTab === "sfx"}
          class:not_eff_active={$SFXTab !== "presets" && $SFXTab !== "sfx"}
          on:click={() => setTab("presets")}
        >
          <span>SFX Library</span>
        </button>
        <button
          type="button"
          class:eff_active={$SFXTab === "effects" || $SFXTab === "builder"}
          class:not_eff_active={$SFXTab !== "effects" && $SFXTab !== "builder"}
          on:click={() => setTab("effects")}
        >
          <span>SFX Builder</span>
        </button>
      </div>
    </nav>

    <div class="view-slide" style="--transition-ms: {$TRANSITION_MS ?? 300}ms;">
      {#if $SFXTab === "presets" || $SFXTab === "sfx"}
        <div
          class="panel-view sfx-library-layout"
          in:fly={{ x: -80, duration: $TRANSITION_MS ?? 300 }}
          out:fly={{ x: -80, duration: $TRANSITION_MS ?? 200 }}
        >
          <!-- === PANNEAU LATERAL : DOSSIERS === -->
          <aside class="sidebar-panel">
            <div class="sidebar-header">
              <h2>Folders</h2>

              <div class="menu-dropdown-container">
                <div class="col-fav">
                  <button
                    type="button"
                    class="icon-btn fav-toggle-btn"
                    on:click={toggleShowFavorites}
                  >
                    <img
                      src={showFavoritesOnly ? fav : nofav}
                      alt="Favorites"
                      class="fav-header-icon"
                    />
                  </button>
                </div>
                <button
                  type="button"
                  class="icon-btn toggle-dropdown-btn"
                  on:click={toggleSettings}
                >
                  <img src={settingsIcon} alt="Settings" id="settings-icon" />
                </button>

                {#if showSettings}
                  <button
                    type="button"
                    class="dropdown-overlay"
                    aria-label="Close dropdown"
                    on:click={closeSettings}
                  ></button>

                  <div
                    class="menus-popup popup-settings"
                    transition:fly={{ y: -10, duration: 150 }}
                  >
                    <div class="popup-title">Settings</div>

                    <div class="settings-group">
                      <label class="settings-label" for="preview-volume-slider">
                        Preview volume <span
                          >{Math.round($sfxPreviewVolume * 100)}%</span
                        >
                      </label>
                      <input
                        id="preview-volume-slider"
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        bind:value={$sfxPreviewVolume}
                        class="ae-slider"
                        disabled={!$sfxPreviewEnabled}
                      />
                    </div>

                    <label class="check-row">
                      <span class="checkbox" class:checked={$sfxPreviewEnabled}
                        ><input
                          type="checkbox"
                          bind:checked={$sfxPreviewEnabled}
                        /></span
                      >
                      <span class="label-text">Enable hover preview</span>
                    </label>

                    <label class="check-row">
                      <span class="checkbox" class:checked={$sfxLoopPreview}
                        ><input
                          type="checkbox"
                          bind:checked={$sfxLoopPreview}
                        /></span
                      >
                      <span class="label-text">Loop preview</span>
                    </label>

                    <label class="check-row">
                      <span
                        class="checkbox"
                        class:checked={$sfxConfirmBeforeDelete}
                        ><input
                          type="checkbox"
                          bind:checked={$sfxConfirmBeforeDelete}
                        /></span
                      >
                      <span class="label-text">Confirm folder deletion</span>
                    </label>

                    <div class="settings-divider"></div>

                    <div class="settings-group">
                      <span class="settings-label" style="margin-bottom:4px;"
                        >Timeline Insertion Mode</span
                      >
                      <label class="check-row full">
                        <span
                          class="checkbox"
                          class:checked={$sfxCursorPlacementMode === "cursor"}
                          ><input
                            type="radio"
                            name="cursorMode"
                            value="cursor"
                            bind:group={$sfxCursorPlacementMode}
                          /></span
                        >
                        <span class="label-text">At current cursor</span>
                      </label>

                      <label class="check-row full">
                        <span
                          class="checkbox"
                          class:checked={$sfxCursorPlacementMode === "peak"}
                          ><input
                            type="radio"
                            name="cursorMode"
                            value="peak"
                            bind:group={$sfxCursorPlacementMode}
                          /></span
                        >
                        <span class="label-text">At highest audio peak</span>
                      </label>

                      <label class="check-row full">
                        <span
                          class="checkbox"
                          class:checked={$sfxCursorPlacementMode ===
                            "beatmarker"}
                          ><input
                            type="radio"
                            name="cursorMode"
                            value="beatmarker"
                            bind:group={$sfxCursorPlacementMode}
                          /></span
                        >
                        <span class="label-text">Snap to nearest marker</span>
                      </label>
                    </div>
                  </div>
                {/if}
              </div>
            </div>

            <div class="scrollable-content folders-list">
              <button
                class="folder-row"
                class:active={activeLib === "All sounds"}
                on:click={() => selectSubCategory("All sounds", "", true)}
              >
                <span class="folder-name">Everything</span>
              </button>

              {#each sfxTree as node (node.folder)}
                <SFXTreeNode {node} {activeLib} onSelect={selectTreeNode} />
              {/each}

              {#if $sfxCustomFolders.length > 0}
                <div class="custom-divider"></div>
                {#each $sfxCustomFolders as cf (cf.path)}
                  {@const displayName =
                    $sfxFolderNameOverrides[cf.path] ?? cf.name}
                  <div
                    class="folder-row custom-item"
                    class:active={activeLib === displayName}
                    role="button"
                    tabindex="0"
                    on:click={() =>
                      selectSubCategory(displayName, cf.path, false, true)}
                    on:keydown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        selectSubCategory(displayName, cf.path, false, true);
                      }
                    }}
                  >
                    {#if renamingKey === `folder:${cf.path}`}
                      <input
                        class="rename-input"
                        use:autoFocus
                        bind:value={renameValue}
                        on:keydown={(e) => {
                          if (e.key === "Enter") confirmRenameFolder(cf);
                          if (e.key === "Escape") cancelRename();
                        }}
                        on:blur={() => confirmRenameFolder(cf)}
                        on:click|stopPropagation
                      />
                    {:else}
                      <span
                        class="folder-name"
                        role="button"
                        tabindex="0"
                        aria-label={`Rename folder ${displayName}`}
                        on:dblclick={(e) =>
                          startRename(`folder:${cf.path}`, displayName, e)}
                        on:keydown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            startRename(`folder:${cf.path}`, displayName, e);
                          }
                        }}>{displayName}</span
                      >
                      <div class="row-actions">
                        <button
                          type="button"
                          class="action-btn"
                          aria-label={`Rename folder ${displayName}`}
                          on:click|stopPropagation={(e) =>
                            startRename(`folder:${cf.path}`, displayName, e)}
                        >
                          <img src={RenameIcon} alt="Rename" />
                        </button>
                        <button
                          type="button"
                          class="action-btn remove-btn"
                          aria-label={`Remove folder ${displayName}`}
                          on:click|stopPropagation={(e) =>
                            removeCustomFolder(cf.path, e)}
                        >
                          <img src={CloseIcon} alt="Remove" />
                        </button>
                      </div>
                    {/if}
                  </div>
                {/each}
              {/if}
            </div>

            <div class="sidebar-footer">
              <button class="btn-add-minimal" on:click={addCustomFolder}>
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  stroke="currentColor"
                  stroke-width="2"
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  ><rect x="3" y="3" width="18" height="18" rx="2" ry="2"
                  ></rect><line x1="12" y1="8" x2="12" y2="16"></line><line
                    x1="8"
                    y1="12"
                    x2="16"
                    y2="12"
                  ></line></svg
                >
                Add
              </button>
            </div>
          </aside>

          <!-- === PANNEAU PRINCIPAL : FICHIERS === -->
          <main class="main-panel">
            <div class="files-header">
              <div class="col-name">Name</div>
              <div class="col-name col-fav">FAV</div>
            </div>

            <div class="search-bar">
              <input
                type="text"
                bind:value={searchQuery}
                placeholder="Search for a sfx..."
              />
            </div>

            <div class="files-list scrollable-content">
              {#if filteredFiles.length > 0}
                {#each filteredFiles as file (file.path)}
                  <div
                    class="file-row"
                    role="button"
                    tabindex="0"
                    on:click={() => addSfxToTimeline(file.path)}
                    on:keydown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        addSfxToTimeline(file.path);
                      }
                    }}
                    on:mouseenter={() => handleFileHover(file)}
                    on:mouseleave={handleFileHoverEnd}
                    on:contextmenu|preventDefault={(e) =>
                      toggleFavorite(file.path, e)}
                  >
                    {#if renamingKey === `file:${file.path}`}
                      <input
                        class="rename-input"
                        use:autoFocus
                        bind:value={renameValue}
                        on:keydown={(e) => {
                          if (e.key === "Enter") confirmRenameFile(file);
                          if (e.key === "Escape") cancelRename();
                        }}
                        on:blur={() => confirmRenameFile(file)}
                        on:click|stopPropagation
                      />
                    {:else}
                      <span class="file-name" title={file.name}
                        >{file.name}</span
                      >

                      <div class="row-actions">
                        <button
                          type="button"
                          class="action-btn"
                          aria-label={`Rename file ${file.name}`}
                          on:click|stopPropagation={(e) =>
                            startRename(`file:${file.path}`, file.name, e)}
                        >
                          <img src={RenameIcon} alt="Rename" />
                        </button>
                      </div>
                    {/if}

                    <button
                      type="button"
                      class="fav-zone"
                      aria-label={`Toggle favorite ${file.name}`}
                      on:click|stopPropagation={(e) =>
                        toggleFavorite(file.path, e)}
                    >
                      <img
                        src={$sfxFavoriteFiles[file.path] ? fav : nofav}
                        alt="Fav"
                        class="row-fav-icon"
                        class:is-fav={$sfxFavoriteFiles[file.path]}
                      />
                    </button>
                  </div>
                {/each}
              {:else}
                <div class="empty-state">No sounds found.</div>
              {/if}
            </div>
          </main>
        </div>
      {:else if $SFXTab === "effects" || $SFXTab === "builder"}
        <div
          class="panel-view sfx-builder-layout"
          in:fly={{ x: 80, duration: $TRANSITION_MS ?? 300 }}
          out:fly={{ x: 80, duration: $TRANSITION_MS ?? 200 }}
        >
          <div class="builder-list scrollable-content">
            <!-- Fade In -->
            <div class="fx-row">
              <button class="fx-apply-btn" on:click={applyFadeIn}>
                <span class="fx-name">Fade In</span>
              </button>
              <div class="menu-dropdown-container">
                <button
                  type="button"
                  class="fx-gear-btn"
                  class:active={openFxPopup === "fadeIn"}
                  on:click={() => toggleFxPopup("fadeIn")}
                >
                  <img src={settingsIcon} alt="Settings" />
                </button>
                {#if openFxPopup === "fadeIn"}
                  <button
                    type="button"
                    class="dropdown-overlay"
                    aria-label="Close"
                    on:click={closeFxPopup}
                  ></button>
                  <div
                    class="menus-popup popup-fx"
                    transition:fly={{ y: -8, duration: 150 }}
                  >
                    <div class="popup-title">Fade In</div>
                    <div class="settings-group">
                      <label class="settings-label" for="fadein-dur">
                        Duration <span>{$sfxFadeInVal}%</span>
                      </label>
                      <input
                        id="fadein-dur"
                        type="range"
                        min="1"
                        max="100"
                        bind:value={$sfxFadeInVal}
                        class="ae-slider"
                      />
                    </div>
                    <div class="settings-group">
                      <label class="settings-label" for="fadein-level">
                        Level <span>{$sfxFadeInStrength} dB</span>
                      </label>
                      <input
                        id="fadein-level"
                        type="range"
                        min="-48"
                        max="12"
                        step="0.5"
                        bind:value={$sfxFadeInStrength}
                        class="ae-slider"
                      />
                    </div>
                  </div>
                {/if}
              </div>
            </div>

            <!-- Fade Out -->
            <div class="fx-row">
              <button class="fx-apply-btn" on:click={applyFadeOut}>
                <span class="fx-name">Fade Out</span>
              </button>
              <div class="menu-dropdown-container">
                <button
                  type="button"
                  class="fx-gear-btn"
                  class:active={openFxPopup === "fadeOut"}
                  on:click={() => toggleFxPopup("fadeOut")}
                >
                  <img src={settingsIcon} alt="Settings" />
                </button>
                {#if openFxPopup === "fadeOut"}
                  <button
                    type="button"
                    class="dropdown-overlay"
                    aria-label="Close"
                    on:click={closeFxPopup}
                  ></button>
                  <div
                    class="menus-popup popup-fx"
                    transition:fly={{ y: -8, duration: 150 }}
                  >
                    <div class="popup-title">Fade Out</div>
                    <div class="settings-group">
                      <label class="settings-label" for="fadeout-dur">
                        Duration <span>{$sfxFadeOutVal}%</span>
                      </label>
                      <input
                        id="fadeout-dur"
                        type="range"
                        min="1"
                        max="100"
                        bind:value={$sfxFadeOutVal}
                        class="ae-slider"
                      />
                    </div>
                    <div class="settings-group">
                      <label class="settings-label" for="fadeout-level">
                        Level <span>{$sfxFadeOutStrength} dB</span>
                      </label>
                      <input
                        id="fadeout-level"
                        type="range"
                        min="-48"
                        max="12"
                        step="0.5"
                        bind:value={$sfxFadeOutStrength}
                        class="ae-slider"
                      />
                    </div>
                  </div>
                {/if}
              </div>
            </div>

            <!-- Lower -->
            <div class="fx-row">
              <button class="fx-apply-btn" on:click={applyLower}>
                <span class="fx-name">Lower (dip at cursor)</span>
              </button>
              <div class="menu-dropdown-container">
                <button
                  type="button"
                  class="fx-gear-btn"
                  class:active={openFxPopup === "lower"}
                  on:click={() => toggleFxPopup("lower")}
                >
                  <img src={settingsIcon} alt="Settings" />
                </button>
                {#if openFxPopup === "lower"}
                  <button
                    type="button"
                    class="dropdown-overlay"
                    aria-label="Close"
                    on:click={closeFxPopup}
                  ></button>
                  <div
                    class="menus-popup popup-fx"
                    transition:fly={{ y: -8, duration: 150 }}
                  >
                    <div class="popup-title">Lower</div>
                    <div class="settings-group">
                      <label class="settings-label" for="lower-amount">
                        Reduction <span>{$sfxLowerAmount} dB</span>
                      </label>
                      <input
                        id="lower-amount"
                        type="range"
                        min="0"
                        max="30"
                        step="0.5"
                        bind:value={$sfxLowerAmount}
                        class="ae-slider"
                      />
                    </div>
                    <div class="settings-group">
                      <label class="settings-label" for="lower-spacing">
                        Keyframe spacing <span
                          >{$sfxLowerSpacing.toFixed(2)}s</span
                        >
                      </label>
                      <input
                        id="lower-spacing"
                        type="range"
                        min="0.05"
                        max="3"
                        step="0.05"
                        bind:value={$sfxLowerSpacing}
                        class="ae-slider"
                      />
                    </div>
                    <p class="popup-desc">
                      3 markers around the cursor: the ends keep the volume, the
                      center reduces it.
                    </p>
                  </div>
                {/if}
              </div>
            </div>

            {#if !isPremiere}
              <div class="builder-divider">Frequencies</div>

              <div class="fx-simple-grid">
                <button
                  class="fx-simple-btn"
                  on:click={() => applyAEFx("ExcaliburFX_LowPass")}
                  >LowPass Filter</button
                >
                <button
                  class="fx-simple-btn"
                  on:click={() => applyAEFx("ExcaliburFX_HighPass")}
                  >HighPass Filter</button
                >
                <button
                  class="fx-simple-btn"
                  on:click={() => applyAEFx("ExcaliburFX_BassAndTreble")}
                  >Bass & Treble</button
                >
                <button
                  class="fx-simple-btn"
                  on:click={() => applyAEFx("ExcaliburFX_EQ")}
                  >Parametric EQ</button
                >
              </div>

              <div class="builder-divider">Space & Modulators</div>

              <div class="fx-simple-grid fx-simple-grid-3">
                <button
                  class="fx-simple-btn"
                  on:click={() => applyAEFx("ExcaliburFX_Reverb")}
                  >Reverb</button
                >
                <button
                  class="fx-simple-btn"
                  on:click={() => applyAEFx("ExcaliburFX_Delay")}>Delay</button
                >
                <button
                  class="fx-simple-btn"
                  on:click={() => applyAEFx("ExcaliburFX_SteroMixer")}
                  >Stereo Mixer</button
                >
              </div>
            {:else}
              <div class="builder-divider">Premiere Pro Audio Effects</div>

              <div class="fx-simple-grid">
                <button
                  class="fx-simple-btn"
                  on:click={() =>
                    applyPremiereAudioEffect([
                      "Lowpass",
                      "Low Pass",
                      "Passe-bas",
                    ])}>Low-pass Filter</button
                >
                <button
                  class="fx-simple-btn"
                  on:click={() =>
                    applyPremiereAudioEffect([
                      "Highpass",
                      "High Pass",
                      "Passe-haut",
                    ])}>High-pass Filter</button
                >
                <button
                  class="fx-simple-btn"
                  on:click={() =>
                    applyPremiereAudioEffect([
                      "Parametric Equalizer",
                      "Parametric EQ",
                      "Égaliseur paramétrique",
                    ])}>Parametric EQ</button
                >
                <button
                  class="fx-simple-btn"
                  on:click={() =>
                    applyPremiereAudioEffect([
                      "Bass",
                      "Bass and Treble",
                      "Basses et aigus",
                    ])}>Bass &amp; Treble</button
                >
                <button
                  class="fx-simple-btn"
                  on:click={() =>
                    applyPremiereAudioEffect([
                      "Studio Reverb",
                      "Reverb",
                      "Réverbération studio",
                    ])}>Studio Reverb</button
                >
                <button
                  class="fx-simple-btn"
                  on:click={() =>
                    applyPremiereAudioEffect([
                      "Analog Delay",
                      "Delay",
                      "Délai analogique",
                    ])}>Analog Delay</button
                >
              </div>
            {/if}
          </div>
        </div>
      {/if}
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
    background-color: #252525;
    border: 1px solid #414141;
    border-radius: 4px;
    flex-shrink: 0;
    margin-bottom: 8px;
    min-width: 0;

    .nav-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px;
      height: 100%;
      padding: 0 2px;
      min-width: 0;
    }

    button {
      appearance: none;
      border: none;
      background: transparent;
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      border-top: 2px solid transparent;
      transition: background-color 0.15s;
      min-width: 0;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;

      &:hover {
        background-color: #333;
      }
    }

    .eff_active {
      background-color: #191919 !important;
      border-top: 2px solid var(--activeColour, #ff007f) !important;
    }
  }

  .view-slide {
    position: relative;
    width: 100%;
    flex: 1;
    overflow: hidden;
    min-height: 0;
    min-width: 0;
  }

  .panel-view {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: flex;
    background: transparent;
    min-height: 0;
    min-width: 0;
  }

  .scrollable-content {
    overflow-y: auto;
    overflow-x: hidden;
    min-height: 0;
    min-width: 0;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--activeColour, #ff007f);
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb:hover {
      filter: brightness(1.2);
    }
  }

  .sfx-library-layout {
    display: flex;
    flex-direction: row;
    gap: 0;
    background-color: #1a1a1a;
    border: 1px solid #333;
    border-radius: 6px;
    overflow: hidden;
    min-height: 0;
    min-width: 0;
  }

  .sidebar-panel {
    flex: 0 0 clamp(110px, 35%, 220px);
    min-width: 90px;

    background-color: transparent;
    border-right: 2px solid var(--activeColour, #ff9900);

    display: flex;
    flex-direction: column;

    overflow: visible;
    min-height: 0;

    position: relative;
  }

  .sidebar-header {
    padding: 8px 10px;
    flex-shrink: 0;
    min-width: 0;
    border-bottom: 1px solid #333;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 6px;

    position: relative;
    z-index: 101;

    h2 {
      margin: 0;
      font-size: 13px;
      font-weight: 700;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }
  }

  .icon-btn,
  .action-btn,
  .fav-zone,
  .toggle-dropdown-btn,
  .fav-toggle-btn {
    background: transparent;
    border: none;
    appearance: none;
    -webkit-appearance: none;
    cursor: pointer;
    padding: 0;
    margin: 0;
    box-shadow: none;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  #settings-icon {
    width: 16px;
    height: 16px;
    opacity: 0.8;

    &:hover {
      opacity: 1;
    }
  }

  .folders-list {
    padding: 0;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    min-width: 0;
    position: relative;
    z-index: 1;
  }

  .folder-row {
    width: calc(100% - 8px);
    min-width: 0;
    display: flex;
    align-items: center;
    height: 26px;
    padding: 0 8px 0 8px;
    background: transparent;
    border: none;
    cursor: pointer;
    color: #aaa;
    text-align: left;
    transition:
      background 0.1s,
      color 0.1s;
    flex-shrink: 0;
    margin-left: 0;
    transform: none;

    &:hover {
      background: #222;
      color: #fff;
    }

    &.active {
      background: var(--activeColour, #ff007f);
      color: #fff;
      font-weight: bold;
    }

    .folder-name {
      flex: 1;
      font-size: 11.5px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }
  }

  .custom-divider {
    height: 1px;
    background: #333;
    margin: 4px 8px;
    flex-shrink: 0;
  }

  .row-actions {
    display: none;
    align-items: center;
    gap: 5px;
    flex-shrink: 0;
    background: transparent;

    .action-btn {
      opacity: 0.6;
      background: transparent;
      border: none;
      padding: 0;
      margin: 0;
      flex-shrink: 0;

      &:hover {
        opacity: 1;
        transform: scale(1.1);
      }
    }

    img {
      width: 12px;
      height: 12px;
      display: block;
    }

    .remove-btn:hover {
      filter: brightness(0) saturate(100%) invert(30%) sepia(90%)
        saturate(5000%) hue-rotate(350deg);
    }
  }

  .folder-row:hover .row-actions,
  .file-row:hover .row-actions {
    display: flex;
  }

  .sidebar-footer {
    padding: 8px 10px;
    border-top: 1px solid #333;
    flex-shrink: 0;
    min-width: 0;
  }

  .btn-add-minimal {
    background: transparent;
    border: none;
    color: #888;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11.5px;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;

    &:hover {
      color: #fff;
    }

    svg {
      stroke: #888;
      flex-shrink: 0;
    }

    &:hover svg {
      stroke: #fff;
    }
  }

  .rename-input {
    flex: 1 !important;
    width: 100% !important;
    min-width: 0 !important;
    margin-right: 8px !important;
    background-color: #0a0a0a !important;
    border: 1px solid var(--activeColour, #ff007f) !important;
    color: #fff !important;
    font-size: 11.5px !important;
    padding: 2px 4px !important;
    border-radius: 3px !important;
    outline: none !important;
  }

  .menu-dropdown-container {
    position: relative;
    gap: 8px;
    display: flex;
    align-items: center;
    flex-shrink: 0;
    z-index: 200;
  }

  .toggle-dropdown-btn,
  .fav-toggle-btn {
    cursor: pointer;
    position: relative;
    z-index: 202;
  }

  .dropdown-overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
    cursor: default;
    border: 0;
    padding: 0;
    background: rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(1px);
    appearance: none;
  }

  .menu-dropdown-container .menus-popup {
    z-index: 9999;
  }

  .menus-popup {
    position: absolute;

    width: clamp(150px, 55vw, 190px);
    max-width: calc(100vw - 16px);

    background: #151515;

    border: 1px solid #444;

    border-radius: 5px;

    padding: 6px;

    z-index: 9999;

    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);

    display: flex;
    flex-direction: column;

    gap: 5px;

    max-height: min(70vh, calc(100vh - 12px));

    overflow-y: auto;
    overflow-x: hidden;

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--activeColour, #ff007f);
      border-radius: 2px;
    }

    &::-webkit-scrollbar-thumb:hover {
      filter: brightness(1.2);
    }
  }

  .popup-settings {
    position: absolute;
    top: calc(100% + 5px);
    bottom: auto;
    left: 0;
    right: auto;
    transform-origin: top left;
    max-height: min(75vh, calc(100vh - 40px));
  }

  .popup-title {
    font-size: 10px;
    font-weight: 700;
    color: #fff;
    margin: 0;
    padding: 0 0 4px 0;
    border-bottom: 1px solid #2a2a2a;
    line-height: 1.2;
    white-space: normal;
    word-break: break-word;
  }

  .settings-group {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }

  .settings-label {
    font-size: 9px;
    font-weight: 600;
    color: #aaa;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 0;
    line-height: 1.2;
    gap: 6px;
    min-width: 0;

    span {
      flex-shrink: 0;
    }
  }

  .popup-settings .ae-slider {
    width: 100%;
    height: 5px;
  }

  .check-row {
    display: flex;
    align-items: center;
    gap: 5px;
    min-height: 16px;
    min-width: 0;
    cursor: pointer;
    user-select: none;

    &.full {
      width: 100%;
    }

    .label-text {
      font-size: 9px;
      line-height: 1.3;
      color: #ccc;
      font-weight: normal;
      white-space: normal;
      overflow-wrap: break-word;
      min-width: 0;
    }
  }

  .checkbox {
    position: relative;
    width: 10px;
    height: 10px;
    border-radius: 2px;
    border: 1px solid #555;
    background-color: #111;
    flex-shrink: 0;
    transition:
      background-color 0.15s,
      border-color 0.15s;

    input {
      position: absolute;
      inset: 0;
      opacity: 0;
      margin: 0;
      width: 100%;
      height: 100%;
      cursor: pointer;
    }

    &.checked {
      background: var(--activeColour, #ff9900);
      border-color: var(--activeColour, #ff9900);
    }
  }

  .settings-divider {
    height: 1px;
    background: #2a2a2a;
    margin: 1px 0;
    flex-shrink: 0;
  }

  .popup-fx {
    top: calc(100% + 5px);
    bottom: auto;
    right: 0;
    left: auto;
    transform-origin: top right;
  }

  .main-panel {
    flex: 1;
    min-width: 0;
    min-height: 0;
    background-color: transparent;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .files-header {
    display: flex;
    align-items: center;
    padding: 6px 10px;
    border-bottom: 1px solid var(--activeColour, #ff9900);
    font-size: 11px;
    font-weight: 600;
    color: #888;
    flex-shrink: 0;
    min-width: 0;

    .col-name {
      flex: 1;
      text-transform: uppercase;
      text-align: left;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }

    .col-fav {
      flex: 0 0 auto;
      width: 28px;
      text-align: center;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }

  .fav-header-icon {
    width: 14px;
    height: 14px;
    transition: 0.15s;
  }

  .fav-toggle-btn:hover .fav-header-icon {
    transform: scale(1.1);
  }

  .search-bar {
    padding: 0;
    border-bottom: 1px solid #333;
    flex-shrink: 0;
    min-width: 0;

    input {
      width: 100%;
      min-width: 0;
      background: transparent;
      border: none;
      color: #ccc;
      font-size: 11.5px;
      padding: 6px 10px;
      outline: none;

      &::placeholder {
        color: #555;
      }
    }
  }

  .files-list {
    flex: 1;
    min-height: 0;
    min-width: 0;
    padding: 0;
  }

  .file-row {
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    padding: 0 10px;
    height: 26px;
    background: transparent;
    border-bottom: 1px solid #222;
    border-top: none;
    border-left: none;
    border-right: none;
    cursor: pointer;
    transition: background 0.1s;
    color: #ccc;
    flex-shrink: 0;

    &:hover {
      background: #252525;
      color: #fff;
    }

    .file-name {
      flex: 1;
      min-width: 0;
      font-size: 11.5px;
      text-align: left;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-weight: 500;
      margin-right: 8px;
    }

    .fav-zone {
      flex: 0 0 auto;
      width: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      background: transparent;
      border: none;
      padding: 0;
      margin: 0;

      .row-fav-icon {
        width: 14px;
        height: 14px;
        margin-left: 10px;
        opacity: 0;
        transition:
          opacity 0.1s,
          transform 0.1s;
        display: block;
      }

      .row-fav-icon.is-fav {
        opacity: 1;
      }

      &:hover .row-fav-icon {
        opacity: 1;
        transform: scale(1.15);
      }
    }

    &:hover .fav-zone .row-fav-icon {
      opacity: 0.5;
    }

    &:hover .fav-zone .row-fav-icon.is-fav {
      opacity: 1;
    }
  }

  .empty-state {
    padding: 30px 10px;
    text-align: center;
    color: #666;
    font-style: italic;
    font-size: 12px;
  }

  .sfx-builder-layout {
    flex-direction: column;
    padding: 4px;
    background-color: #1a1a1a;
    border: 1px solid #3a3a3a;
    border-radius: 6px;
    overflow: hidden;
    min-height: 0;
    min-width: 0;
  }

  .builder-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    height: 100%;
    padding: 6px;
    min-height: 0;
    min-width: 0;
  }

  .fx-row {
    display: flex;
    align-items: stretch;
    background: #202020;
    border: 1px solid #333;
    border-radius: 5px;
    overflow: visible;
    flex-shrink: 0;
    min-width: 0;
  }

  .fx-apply-btn {
    flex: 1;
    min-width: 0;
    background: transparent;
    border: none;
    text-align: left;
    padding: 9px 10px;
    cursor: pointer;
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
    min-width: 0;
    font-size: 11.5px;
    font-weight: 700;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .fx-gear-btn {
    flex: 0 0 auto;
    background: transparent;
    border: none;
    height: 100%;
    cursor: pointer;
    padding: 0 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: 0.15s ease;

    img {
      width: 14px;
      height: 14px;
      object-fit: contain;
      pointer-events: none;
    }

    &:hover {
      background-color: rgba(255, 255, 255, 0.04);
    }

    &.active {
      background-color: rgba(255, 255, 255, 0.06);
    }
  }

  .popup-desc {
    font-size: 9px;
    color: #888;
    line-height: 1.4;
    margin: 4px 0 0 0;
    white-space: normal;
    overflow-wrap: break-word;
  }

  .builder-divider {
    flex-shrink: 0;
    font-size: 9.5px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    color: #777;
    padding: 2px 2px 4px 2px;
    border-bottom: 1px solid #2b2b2b;
    margin-top: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .fx-simple-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(110px, 100%), 1fr));
    gap: 6px;
    flex-shrink: 0;
    min-width: 0;
  }

  .fx-simple-grid-3 {
    grid-template-columns: repeat(auto-fit, minmax(min(90px, 100%), 1fr));
  }

  .fx-simple-btn {
    background: #202020;
    border: 1px solid #333;
    color: #eee;
    padding: 9px 6px;
    border-radius: 5px;
    font-size: 10.5px;
    font-weight: 700;
    cursor: pointer;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
    transition:
      background 0.1s,
      border-color 0.1s;

    &:hover {
      background: var(--activeColour, #ff007f);
      border-color: var(--activeColour, #ff007f);
      color: #fff;
    }

    &:active {
      transform: scale(0.97);
    }
  }

  .ae-slider {
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

    &::-moz-range-thumb {
      width: 5px;
      height: 8px;
      border-radius: 2px;
      background: #fff;
      border: 1px solid #000;
      cursor: pointer;
    }

    &:disabled {
      opacity: 0.4;
    }
  }

  @media (max-height: 600px) {
    .popup-title {
      font-size: 9px;
      padding-bottom: 3px;
    }

    .settings-label {
      font-size: 8px;
    }

    .check-row {
      min-height: 14px;
      gap: 4px;

      .label-text {
        font-size: 8px;
      }
    }

    .checkbox {
      width: 9px;
      height: 9px;
    }

    .settings-group {
      gap: 2px;
    }

    .settings-divider {
      margin: 0;
    }

    .popup-settings .ae-slider {
      height: 4px;
    }
  }

  @media (max-height: 480px) {
    .popup-title {
      font-size: 8.5px;
      padding-bottom: 2px;
    }

    .settings-label,
    .check-row .label-text {
      font-size: 7.5px;
    }

    .check-row {
      min-height: 12px;
    }

    .checkbox {
      width: 8px;
      height: 8px;
    }

    .popup-settings .ae-slider {
      height: 4px;
    }
  }

  @media (max-width: 500px) {
    .sidebar-panel {
      flex: 0 0 clamp(100px, 40%, 190px);
    }

    .sidebar-header {
      padding-left: 6px;
      padding-right: 6px;
    }

    .sidebar-header h2 {
      font-size: 12px;
    }

    .folder-row {
      padding-left: 6px;
      padding-right: 6px;
    }

    .fx-apply-btn,
    .fx-gear-btn {
      padding-left: 8px;
      padding-right: 8px;
    }
  }

  @media (max-width: 320px) {
    .sidebar-panel {
      flex: 0 0 clamp(90px, 42%, 150px);
    }

    .files-header .col-fav,
    .file-row .fav-zone {
      width: 22px;
    }

    .menus-popup {
      width: calc(100vw - 12px);
      max-width: calc(100vw - 12px);
    }
  }
</style>
