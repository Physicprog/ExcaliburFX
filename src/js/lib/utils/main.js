import { CSInterface } from "../cep/csinterface.js";
import { ns } from "../../../shared/shared.js";

function getNodeRequire() {
  if (typeof window !== "undefined") {
    if (window.cep_node) {
      if (typeof window.cep_node.require === "function") {
        return window.cep_node.require;
      }
    }
  }
  if (typeof require === "function") {
    if (typeof require.resolve === "function") {
      return require;
    }
  }
  return null;
}

let nodeRequire = getNodeRequire();

let fs = null;
let path = null;
let os = null;
let child_process = null;

if (nodeRequire !== null) {
  try {
    fs = nodeRequire("fs");
    path = nodeRequire("path");
    os = nodeRequire("os");
    child_process = nodeRequire("child_process");
  } catch (e) {
    fs = null;
  }
}

if (fs === null) {
  path = {
    join: function (...parts) {
      let result = [];
      for (let i = 0; i < parts.length; i++) {
        if (parts[i]) {
          result.push(parts[i]);
        }
      }
      return result.join("/");
    },
    sep: "/",
  };
  os = {
    homedir: function () {
      return "";
    },
    platform: function () {
      return "unknown";
    },
  };
  child_process = {
    exec: function (cmd, callback) {
      callback(new Error("child_process indisponible hors environnement CEP"));
    },
  };
}

let hasNodeFS = false;
if (fs !== null && path !== null && os !== null && typeof fs.writeFileSync === "function") {
  hasNodeFS = true;
}

let hasChildProcess = false;
if (child_process !== null && typeof child_process.exec === "function" && os.platform() !== "unknown") {
  hasChildProcess = true;
}

let cs = new CSInterface();
let ROOT_DIR = null;
let LOGS_FILE = null;
let PREFS_FILE = null;

if (hasNodeFS === true) {
  ROOT_DIR = path.join(os.homedir(), "Documents", "Excalibur");
  LOGS_FILE = path.join(ROOT_DIR, "logs.txt");
  PREFS_FILE = path.join(ROOT_DIR, "preferences.json");
}

export let VERSION_URL = "https://api.github.com/repos/Physicprog/ExcaliburFX/releases";

function isNewerVersion(local, remote) {
  let l = local.split(".");
  let r = remote.split(".");
  
  let maxLen = l.length;
  if (r.length > l.length) {
    maxLen = r.length;
  }

  for (let i = 0; i < maxLen; i++) {
    let numL = 0;
    if (l[i] !== undefined) {
      numL = Number(l[i]);
    }
    
    let numR = 0;
    if (r[i] !== undefined) {
      numR = Number(r[i]);
    }

    if (numR > numL) {
      return true;
    }
    if (numR < numL) {
      return false;
    }
  }
  return false;
}

export async function getRepoLasterVersion(url) {
  if (url === undefined) {
    url = VERSION_URL;
  }
  try {
    let response = await fetch(url, { cache: "no-store" });
    if (response.ok === false) {
      return null;
    }

    let releases = await response.json();
    if (Array.isArray(releases) === false || releases.length === 0) {
      return null;
    }

    let stableReleases = [];
    for (let i = 0; i < releases.length; i++) {
      if (releases[i].draft === false && releases[i].prerelease === false) {
        stableReleases.push(releases[i]);
      }
    }

    if (stableReleases.length === 0) {
      return null;
    }

    let latestRelease = stableReleases[0];
    if (typeof latestRelease.tag_name === "string") {
      return latestRelease.tag_name.replace(/^v/, "");
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
}

export async function checkForUpdate(currentVersion, url) {
  if (url === undefined) {
    url = VERSION_URL;
  }
  let remoteVersion = await getRepoLasterVersion(url);
  if (remoteVersion === null) {
    return null;
  }
  
  if (isNewerVersion(currentVersion, remoteVersion) === true) {
    return remoteVersion;
  } else {
    return null;
  }
}

export let DEFAULTS = {
  preferences: {
    muted: false,
    volumeState: "high",
    theme: "dark",
    lastActiveTab: "Dashboard",
    hue: 0,
    saturation: 70,
    enableRGBMode: false,
    rgbSpeed: 100,
    animationSpeed: 300,
    putGifToPNG: false,
    isCollapsed: false,
    enableDiscordRPC: false,
    isCurveToolbarOpen: true,
    showCurveCopyPaste: true,
    zoomLevel: 50,
    cameraFocalLength: 35,
    createLayerCompOnSelected: false,
    applyOnAdjustmentLayer: false,
    curvesTab: "presets",
    effectsTab: "presets",
    colorHarmonyMode: "Complementary",
    colorPresetMode: "Blue",
    colorHue: 210,
    colorSat: 80,
    colorLight: 50,
    colorActiveSource: "harmony",
    colorApplyDirect: false,
    colorInverted: false,
    c4aSkipDefaults: true,
    c4aSkipDisabledFx: true,
    c4aIncTransform: true,
    c4aIncEffects: true,
    c4aIncFxSettings: true,
    c4aIncMasks: true,
    c4aIncText: true,
    c4aIncStyles: false,
    c4aIncPrecomps: true,
    c4aMaxDepth: 5,
    toggleFxMode: "external",
    warpStabilizerSettings: {
      method: "Subspace Warp",
      border: "Stabilize, Crop, Auto-scale",
      smoothness: 50,
      detailed: true,
      fast: true,
    },
    cameraTrackerSettings: {
      detailed: true,
      trackSize: 100,
    },
    autoCutSensitivity: 1.8,
    autoBeatSensitivity: 1.8,
    autoBeatThreshold: 0.3,
    layerColors: {
      solid: 1,
      null: 8,
      text: 9,
      camera: 6,
      adjustment: 5,
      precompose: 13,
    },
    tabVisibility: {
      curves: true,
      workflow: true,
      effects: true,
      colors: true,
      transitions: true,
      scripts: true,
      ffmpeg: true,
      media: true
    }
  },
  tabs: {
    dashboard: {},
    colors: { savedPalettes: [] },
    curves: { savedPresets: [] },
    effects: { favorites: [] },
    transitions: { favorites: [] },
    ffmpeg: { lastPreset: null, outputFormat: "mp4", crf: 18 },
    notes: { entries: [] },
    scripts: { recentlyUsed: [] },
    media: {},
    settings: {},
    workflow: { steps: [] },
  },
};

export let NOTES_FILE = null;
if (hasNodeFS === true) {
  NOTES_FILE = path.join(ROOT_DIR, "notes.ebfx");
}

export function init() {
  if (hasNodeFS === false) {
    return;
  }
  try {
    if (fs.existsSync(ROOT_DIR) === false) {
      fs.mkdirSync(ROOT_DIR, { recursive: true });
    }
    if (fs.existsSync(LOGS_FILE) === false) {
      fs.writeFileSync(LOGS_FILE, "", "utf-8");
    }

    clearLogs(150);

    if (fs.existsSync(PREFS_FILE) === false) {
      let defaultText = JSON.stringify(DEFAULTS.preferences, null, 2);
      fs.writeFileSync(PREFS_FILE, defaultText, "utf-8");
    }
    if (fs.existsSync(NOTES_FILE) === false) {
      fs.writeFileSync(NOTES_FILE, "", "utf-8");
    }
    log("system", "Ouverture de l'application");
  } catch (e) {
  }
}

export async function initApp(currentVersion, url) {
  if (url === undefined) {
    url = VERSION_URL;
  }
  await init();
  let update = await checkForUpdate(currentVersion, url);
  return update;
}

export function log(action, details) {
  if (details === undefined) {
    details = "";
  }
  let d = details;
  if (typeof details === "object") {
    d = JSON.stringify(details);
  }
  
  let dateObj = new Date();
  let timeStr = dateObj.toISOString();
  let line = "[" + timeStr + "] " + action;
  
  if (d !== "") {
    line = line + " - " + d;
  }
  line = line + "\n";
  
  if (hasNodeFS === false) {
    return;
  }
  
  fs.appendFile(LOGS_FILE, line, "utf-8", function (err) {
  });
}

function clearLogs(maxSizeKB) {
  if (maxSizeKB === undefined) {
    maxSizeKB = 150;
  }
  if (hasNodeFS === false || LOGS_FILE === null) {
    return;
  }
  
  try {
    if (fs.existsSync(LOGS_FILE) === true) {
      let stats = fs.statSync(LOGS_FILE);
      let maxBytes = maxSizeKB * 1024;
      
      if (stats.size > maxBytes) {
        fs.writeFileSync(LOGS_FILE, "", "utf-8");
        log("system", "Log file cleared");
      }
    }
  } catch (e) {
  }
}

export function getPreference(key) {
  let prefs = readPreferences();
  if (prefs[key] !== undefined) {
    return prefs[key];
  } else {
    return DEFAULTS.preferences[key];
  }
}

export function setPreference(key, value) {
  let prefs = readPreferences();
  prefs[key] = value;
  writePreferences(prefs);
  
  let details = { key: key, value: value };
  log("preference_change", details);
}

function readPreferences() {
  if (hasNodeFS === false) {
    let fallback = {};
    Object.assign(fallback, DEFAULTS.preferences);
    return fallback;
  }

  if (fs.existsSync(PREFS_FILE) === false) {
    let fallback = {};
    Object.assign(fallback, DEFAULTS.preferences);
    return fallback;
  }

  try {
    let raw = fs.readFileSync(PREFS_FILE, "utf-8");
    if (raw === null || raw.trim() === "") {
      throw new Error("Empty preferences file");
    }
    return JSON.parse(raw);
  } catch (e) {
    let fallback = {};
    Object.assign(fallback, DEFAULTS.preferences);
    try {
      let tmpFile = PREFS_FILE + ".tmp";
      let text = JSON.stringify(fallback, null, 2);
      fs.writeFileSync(tmpFile, text, "utf-8");
      fs.renameSync(tmpFile, PREFS_FILE);
    } catch (writeErr) {
    }
    return fallback;
  }
}

export function readNotes() {
  if (hasNodeFS === false || NOTES_FILE === null) {
    return "";
  }
  if (fs.existsSync(NOTES_FILE) === false) {
    return "";
  }
  try {
    return fs.readFileSync(NOTES_FILE, "utf-8");
  } catch (e) {
    return "";
  }
}

export function saveNotes(content) {
  if (hasNodeFS === false || NOTES_FILE === null) {
    return;
  }
  try {
    fs.writeFileSync(NOTES_FILE, content, "utf-8");
  } catch (e) {
  }
}

function writePreferences(prefs) {
  if (hasNodeFS === false) {
    return;
  }
  try {
    let tmpFile = PREFS_FILE + ".tmp";
    let text = JSON.stringify(prefs, null, 2);
    fs.writeFileSync(tmpFile, text, "utf-8");
    fs.renameSync(tmpFile, PREFS_FILE);
  } catch (err) {
  }
}

export function resetPreferences() {
  let fallback = {};
  Object.assign(fallback, DEFAULTS.preferences);
  writePreferences(fallback);
  log("system", "Reset preferences");
}

export function callJSX(functionName, ...args) {
  return new Promise(function (resolve, reject) {
    if (typeof window === "undefined" || typeof window.__adobe_cep__ === "undefined" || cs === null || typeof cs.evalScript !== "function") {
      let err = new Error("Pont CEP indisponible.");
      reject(err);
      return;
    }

    let stringsArr = [];
    for (let i = 0; i < args.length; i++) {
      stringsArr.push(JSON.stringify(args[i]));
    }
    let serializedArgs = stringsArr.join(",");

    let script = "(function(){ var __r; try { var host = typeof $ !== 'undefined' ? $ : window; __r = host['" + ns + "']." + functionName + "(" + serializedArgs + "); } catch(e) { __r = JSON.stringify({status:'ERROR', message: 'EvalScript error: ' + e.toString()}); } return __r; })();";

    try {
      cs.evalScript(script, function (result) {
        if (typeof result === "string" && result.indexOf("EvalScript error") === 0) {
          reject(new Error("Error calling JSX: " + functionName + ": " + result));
          return;
        }

        try {
          let parsed = JSON.parse(result);
          resolve(parsed);
        } catch (errParse) {
          resolve(result);
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

async function executeJSX(functionName, ...args) {
  try {
    let result = await callJSX(functionName, ...args);
    if (typeof result === "string") {
      try {
        return JSON.parse(result);
      } catch (e) {
        return result;
      }
    }
    return result;
  } catch (err) {
    return { status: "ERROR", message: err.message };
  }
}

async function executeJSXAction(functionName, ...args) {
  try {
    let res = await executeJSX(functionName, ...args);
    if (res === undefined || res === null) {
      return { status: "SUCCESS" };
    }
    return res;
  } catch (err) {
    return { status: "ERROR", message: err.message };
  }
}

export async function sortProjectLayers() {
  return await executeJSXAction("sortProject");
}

export async function deleteUnusedItems() {
  return await executeJSXAction("deleteUnusedItems");
}

function getAfterEffectsMemoryMB() {
  return new Promise(function (resolve) {
    if (hasChildProcess === false) {
      resolve(null);
      return;
    }

    let platform = os.platform();
    let cmd = "";

    if (platform === "win32") {
      cmd = 'tasklist /FI "IMAGENAME eq AfterFX.exe" /FO CSV /NH';
    } else {
      cmd = 'ps -A -o rss,comm | grep -i "after"';
    }

    child_process.exec(cmd, function (err, stdout) {
      if (err !== null || stdout === null || stdout === "") {
        resolve(null);
        return;
      }

      if (platform === "win32") {
        let fields = stdout.match(/"([^"]*)"/g);
        if (fields !== null && fields.length >= 5) {
          let memField = fields[4].replace(/"/g, "");
          let digitsOnly = memField.replace(/[^\d]/g, "");
          let kb = parseInt(digitsOnly, 10);
          if (isNaN(kb) === false) {
            resolve(Math.round(kb / 1024));
            return;
          }
        }
      } else {
        let lines = stdout.trim().split("\n");
        let firstLine = lines[0];
        let parts = firstLine.trim().split(/\s+/);
        let kb = parseInt(parts[0], 10);
        if (isNaN(kb) === false) {
          resolve(Math.round(kb / 1024));
          return;
        }
      }

      resolve(null);
    });
  });
}

export async function clearCacheWithVerification(sendNotif) {
  let before = await getAfterEffectsMemoryMB();
  
  let purgeResult = await executeJSX("purgeEverything");
  
  await new Promise(function(resolve) {
    setTimeout(resolve, 1500);
  });
  
  let after = await getAfterEffectsMemoryMB();

  if (before !== null && after !== null) {
    let freed = before - after;
    if (freed > 0) {
      sendNotif("Purge done : " + freed + " MB cleared (" + before + " MB to " + after + " MB)", true);
    } else {
      sendNotif("Purge executed, but no decrease measured.", false);
    }
  } else {
    if (purgeResult !== null && purgeResult.status === "SUCCESS") {
      sendNotif("Purge executed (RAM measurement unavailable).", true);
    } else {
      sendNotif("Purge failed.", false);
    }
  }
}

export async function saveIncremental(sendNotif) {
  let result = await executeJSX("incrementSave");

  if (result !== null && result.code === "NO_FILE") {
    sendNotif("Please save the project manually first (CTRL+S).", false);
  } else if (result !== null && result.status === "SUCCESS") {
    sendNotif("Incremental save done : " + result.fileName, true);
  } else {
    sendNotif("Incremental save failed.", false);
  }
}

export async function SortProjectLayers(sendNotif) {
  let result = await executeJSX("sortProject");
  if (result !== null && result.status === "SUCCESS") {
    sendNotif("Project sorted successfully!", true);
  } else {
    let msg = "Failed to sort project.";
    if (result !== null && result.message !== undefined) {
      msg = "Failed to sort project: " + result.message;
    }
    sendNotif(msg, false);
  }
}

export let GAMES_STAT_FILE = null;
if (hasNodeFS === true) {
  GAMES_STAT_FILE = path.join(ROOT_DIR, "gamesStat.ebfx");
}

export function saveGameStats(stats, force) {
  if (force === undefined) {
    force = false;
  }
  
  if (force === false && hasNodeFS === true && GAMES_STAT_FILE !== null) {
    try {
      if (fs.existsSync(GAMES_STAT_FILE) === true) {
        try {
          let text = fs.readFileSync(GAMES_STAT_FILE, "utf-8");
          let onDisk = JSON.parse(text);
          
          let onDiskEarned = 0;
          if (onDisk.totalEarned !== undefined) {
            onDiskEarned = Number(onDisk.totalEarned);
          } else if (onDisk.balance !== undefined) {
            onDiskEarned = Number(onDisk.balance);
          }
          
          let newEarned = 0;
          if (stats.totalEarned !== undefined) {
            newEarned = Number(stats.totalEarned);
          } else if (stats.balance !== undefined) {
            newEarned = Number(stats.balance);
          }
          
          if (onDiskEarned > 0 && newEarned < onDiskEarned) {
            return;
          }
        } catch (parseErr) {
        }
      }
    } catch (e) {
    }
  }

  if (hasNodeFS === false || GAMES_STAT_FILE === null) {
    return;
  }

  try {
    if (fs.existsSync(ROOT_DIR) === false) {
      fs.mkdirSync(ROOT_DIR, { recursive: true });
    }
    let statsText = JSON.stringify(stats, null, 2);
    fs.writeFileSync(GAMES_STAT_FILE, statsText, "utf-8");
  } catch (e) {
  }
}

export function forceResetGameStats(stats) {
  saveGameStats(stats, true);
}

export function readGameStats() {
  if (hasNodeFS === false || GAMES_STAT_FILE === null) {
    return { balance: 0 };
  }
  if (fs.existsSync(GAMES_STAT_FILE) === false) {
    return { balance: 0 };
  }

  try {
    let raw = fs.readFileSync(GAMES_STAT_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    return { balance: 0 };
  }
}

export async function copyTheCurve() {
  let res = await executeJSX("doCopy");
  if (res !== null && res.status === "SUCCESS") {
    return res.message;
  }
  return null;
}

export async function pasteTheCurve() {
  return await executeJSXAction("doPaste");
}

export async function dragAnchorPoint(pos) {
  return await executeJSXAction("moveAnchor", pos);
}

export async function applyRotation(degrees) {
  return await executeJSXAction("applyRotation", degrees);
}

export async function resetLayerRotation() {
  return await executeJSXAction("resetRotation");
}

export async function scaleCompToOneToOne(scaleAmount) {
  return await executeJSXAction("scaleCompToOneToOne", scaleAmount);
}

export async function addSolidLayer(color) {
  if (color === undefined) color = 0;
  return await executeJSXAction("addSolidLayer", color);
}

export async function addNullLayer(color) {
  if (color === undefined) color = 0;
  return await executeJSXAction("addNullLayer", color);
}

export async function addTextLayer(color) {
  if (color === undefined) color = 0;
  return await executeJSXAction("addTextLayer", color);
}

export async function addCameraLayer(color, focalLength) {
  if (color === undefined) color = 0;
  if (focalLength === undefined) focalLength = 35;
  return await executeJSXAction("addCameraLayer", color, focalLength);
}

export async function addAdjustmentLayer(color, createComp) {
  if (color === undefined) color = 0;
  if (createComp === undefined) createComp = false;
  return await executeJSXAction("addAdjustmentLayer", color, createComp);
}

export async function createPrecompAllInOne(color) {
  if (color === undefined) color = 0;
  return await executeJSXAction("createPrecompAllInOne", color);
}

export async function createPrecompAllInOneWithSelection(color) {
  if (color === undefined) color = 0;
  return await executeJSXAction("createPrecompAllInOneWithSelection", color);
}

export async function enableFrameBlending() {
  return await executeJSXAction("enableFrameBlendingFunc");
}

export async function disableFrameBlending() {
  return await executeJSXAction("disableFrameBlendingFunc");
}

export async function sequenceLayers() {
  return await executeJSXAction("sequenceLayersAction");
}

export async function sequenceLayersFromBottom() {
  return await executeJSXAction("sequenceLayersFromBottomAction");
}

export async function trimCompToSelection() {
  return await executeJSXAction("trimCompToSelection");
}

export async function applyIn() {
  return await executeJSXAction("applyIn");
}

export async function applyOut() {
  return await executeJSXAction("applyOut");
}

export async function loopInSelectedLayer() {
  return await executeJSXAction("loopInSelectedLayerAction");
}

export async function loopOutSelectedLayer() {
  return await executeJSXAction("loopOutSelectedLayerAction");
}

export async function freezeFrame() {
  return await executeJSXAction("freezeFrameAction");
}

export async function reverseTime() {
  return await executeJSXAction("reverseTimeAction");
}

export async function UnPrecompose() {
  return await executeJSXAction("UnPrecompose");
}

export async function speedToCursor() {
  return await executeJSXAction("speedToCursorAction");
}

export async function Flip(direction) {
  if (direction === undefined) direction = 1;
  return await executeJSXAction("Flip", direction);
}

export async function AutoCut(threshold) {
  return await executeJSXAction("autoCutSelectedLayer", threshold);
}

export async function CreateWarpStable(color, c, d, s, m, f, b) {
  if (color === undefined) color = 0;
  if (c === undefined) c = 0;
  if (d === undefined) d = 0;
  if (s === undefined) s = 50;
  if (m === undefined) m = 0;
  if (f === undefined) f = 0;
  if (b === undefined) b = 2;
  return await executeJSXAction("CreateWarpStable", color, c, d, s, m, f, b);
}

export async function CreateCameraTracker(color, c, d, p) {
  if (color === undefined) color = 0;
  if (c === undefined) c = 0;
  if (d === undefined) d = 50;
  if (p === undefined) p = 100;
  return await executeJSXAction("CreateCameraTracker", color, c, d, p);
}

export async function AutoBeatMarker(sens, thresh) {
  return await executeJSXAction("DoAudioMarkers", sens, thresh);
}

export async function toggleHeavyFXProject(mode) {
  return await executeJSXAction("toggleHeavyFXProject", mode);
}

export async function createFXControlRig(settings) {
  return await executeJSXAction("createFXControlRig", settings);
}

export async function applyFillColor(hex) {
  return await executeJSXAction("applyFillColor", hex);
}

export async function applyCodeTransition(presetFile) {
  return await executeJSXAction("applyTransitionPreset", presetFile);
}

function copyToClipboard(text) {
  try {
    let ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "0";
    
    document.body.appendChild(ta);
    ta.focus();
    ta.select();

    let success = document.execCommand("copy");
    if (success === false) {
      throw new Error("Failed");
    }
    
    document.body.removeChild(ta);
  } catch (err) {
    if (navigator.clipboard !== undefined && navigator.clipboard.writeText !== undefined) {
      navigator.clipboard.writeText(text);
    }
  }
}

export async function dumpCompData(opt) {
  let skipDefaults = opt.skipDefaults;
  let skipDisabledFx = opt.skipDisabledFx;
  let incTransform = opt.incTransform;
  let incEffects = opt.incEffects;
  let incFxSettings = opt.incFxSettings;
  let incMasks = opt.incMasks;
  let incText = opt.incText;
  let incStyles = opt.incStyles;
  let incPrecomps = opt.incPrecomps;
  let maxDepth = opt.maxDepth;

  let res = await executeJSXAction("dumpCompData", skipDefaults, skipDisabledFx, incTransform, incEffects, incFxSettings, incMasks, incText, incStyles, incPrecomps, maxDepth);
  
  let text = "";
  if (typeof res === "string") {
    text = res;
  } else {
    if (res !== undefined && res !== null && res.message !== undefined) {
      text = res.message;
    } else {
      if (res === undefined || res === null) {
        text = JSON.stringify("", null, 2);
      } else {
        text = JSON.stringify(res, null, 2);
      }
    }
  }
  
  copyToClipboard(text);
  return text;
}