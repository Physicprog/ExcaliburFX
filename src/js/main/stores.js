import { writable, derived, get } from 'svelte/store';
import { getPreference, setPreference, readGameStats, saveGameStats } from '../lib/utils/main.js';

import logoGif from '../assets/logos/logo.gif';
import logoPng from '../assets/logos/logo.png';

import curvesGif from '../assets/sidebar/curves.gif';
import curvesPng from '../assets/sidebar/curves.png';
import workflowGif from '../assets/sidebar/WorkFlow.gif';
import workflowPng from '../assets/sidebar/WorkFlow.png';
import effectsGif from '../assets/sidebar/Effects.gif';
import effectsPng from '../assets/sidebar/Effects.png';
import colorsGif from '../assets/sidebar/Colors.gif';
import colorsPng from '../assets/sidebar/Colors.png';
import transitionsGif from '../assets/sidebar/Transitions.gif';
import transitionsPng from '../assets/sidebar/Transitions.png';
import scriptGif from '../assets/sidebar/Script.gif';
import scriptPng from '../assets/sidebar/Script.png';
import ffmpegGif from '../assets/sidebar/FFMPEG.gif';
import ffmpegPng from '../assets/sidebar/FFMPEG.png';
import settingsGif from '../assets/sidebar/Settings.gif';
import settingsPng from '../assets/sidebar/Settings.png';

export const order = [
  'curves',
  'workflow',
  'effects',
  'colors',
  'transitions',
  'scripts',
  'ffmpeg',
  'settings',
];

export const putGifToPNG = writable(getPreference('putGifToPNG'));
export const AnimationSpeed = writable(getPreference('animationSpeed'));
export const Hue = writable(getPreference('hue'));
export const Saturation = writable(getPreference('saturation'));
export const EnableRGBMode = writable(getPreference('enableRGBMode'));
export const RgbSpeed = writable(getPreference('rgbSpeed'));
export const enableDiscordRPC = writable(getPreference('enableDiscordRPC') ?? true);
export const isOnlineStore = writable(true);
export const zoomLevel = writable(getPreference('zoomLevel') ?? 50);
export const applyOnAdjustmentLayer = writable(getPreference('applyOnAdjustmentLayer') ?? false);
export const colorHarmonyMode = writable(getPreference('colorHarmonyMode') ?? "Complementary");
export const colorPresetMode = writable(getPreference('colorPresetMode') ?? "Blue");
export const colorHue = writable(getPreference('colorHue') ?? 210);
export const colorSat = writable(getPreference('colorSat') ?? 80);
export const colorLight = writable(getPreference('colorLight') ?? 50);
export const colorActiveSource = writable(getPreference('colorActiveSource') ?? "harmony");
export const colorApplyDirect = writable(getPreference('colorApplyDirect') ?? false);

export const c4aSkipDefaults = writable(getPreference('c4aSkipDefaults') ?? true);
export const c4aSkipDisabledFx = writable(getPreference('c4aSkipDisabledFx') ?? true);
export const c4aIncTransform = writable(getPreference('c4aIncTransform') ?? true);
export const c4aIncEffects = writable(getPreference('c4aIncEffects') ?? true);
export const c4aIncFxSettings = writable(getPreference('c4aIncFxSettings') ?? true);
export const c4aIncMasks = writable(getPreference('c4aIncMasks') ?? true);
export const c4aIncText = writable(getPreference('c4aIncText') ?? true);
export const c4aIncStyles = writable(getPreference('c4aIncStyles') ?? false);
export const c4aIncPrecomps = writable(getPreference('c4aIncPrecomps') ?? true);
export const c4aMaxDepth = writable(getPreference('c4aMaxDepth') ?? 5);
export const rigOneNullPerEffect = writable(getPreference('rigOneNullPerEffect') ?? false);
export const rigOnlyImportantProps = writable(getPreference('rigOnlyImportantProps') ?? false);
export const toggleFxMode = writable(getPreference('toggleFxMode') ?? "external");

function getDefaultStickHeroSettings() {
  return {
    stretchingSpeed: 1,
    turningSpeed: 1,
    walkingSpeed: 1,
    fallingSpeed: 1, 
    gambleMode: false,
  };
}

const defaultStats = {
  balance: 0,
  totalEarned: 0,
  lastPlayed: Date.now(),
  clicker: {
    clickPower: 1,
    autoIncome: 0,
    cursorCost: 50,
    factoryCost: 500
  },
  game2048: {
    bestScore: 0,
    board: Array(16).fill(0),
    score: 0,
    highestTile: 2
  },
  stickHero: {
    bestScore: 0,
    settings: getDefaultStickHeroSettings()
  },
};

const rawStats = readGameStats();

const initialStats = { ...defaultStats, ...rawStats };
initialStats.clicker = { ...defaultStats.clicker, ...(rawStats.clicker || {}) };
initialStats.game2048 = { ...defaultStats.game2048, ...(rawStats.game2048 || {}) };

const rawStickHero = rawStats.stickHero || {};
initialStats.stickHero = {
  bestScore: rawStickHero.bestScore || 0,
  settings: { ...getDefaultStickHeroSettings(), ...(rawStickHero.settings || {}) }, 
};

const now = Date.now();
const lastPlayedTime = initialStats.lastPlayed || now;
const offlineSeconds = Math.floor((now - lastPlayedTime) / 1000);

if (offlineSeconds > 0 && initialStats.clicker.autoIncome > 0) {
  const offlineGains = (offlineSeconds * initialStats.clicker.autoIncome) / 10;
  initialStats.balance += offlineGains;
  initialStats.totalEarned += offlineGains;
}

initialStats.lastPlayed = now;

export const balance = writable(initialStats.balance);
export const totalEarned = writable(initialStats.totalEarned || initialStats.balance);
export const clickerStats = writable(initialStats.clicker);
export const game2048Stats = writable(initialStats.game2048);
export const lastPlayed = writable(initialStats.lastPlayed);
export const stickHeroStats = writable(initialStats.stickHero);

setInterval(() => {
  const currentClicker = get(clickerStats);
  const rate = typeof document !== 'undefined' && document.hidden ? 0.1 : 1;
  const gain = currentClicker.autoIncome * rate;

  if (gain > 0) {
    balance.update(value => value + gain);
    totalEarned.update(value => value + gain);
  }

  lastPlayed.set(Date.now());
}, 1000);

let pendingSaveTimer = null;
const SAVE_DEBOUNCE_MS = 400;
let statsLoaded = false;

function saveAllStats() {
  saveGameStats({
    balance: get(balance),
    totalEarned: get(totalEarned),
    lastPlayed: get(lastPlayed),
    clicker: get(clickerStats),
    game2048: get(game2048Stats),
    stickHero: get(stickHeroStats),
  });
}

export function forceSaveAllStats() {
  saveGameStats({
    balance: get(balance),
    totalEarned: get(totalEarned),
    lastPlayed: get(lastPlayed),
    clicker: get(clickerStats),
    game2048: get(game2048Stats),
    stickHero: get(stickHeroStats),
  }, true);
}

export function resetStickHeroBestScore() {
  const confirmReset = confirm("Reset your Stick Hero best score and settings? This action cannot be undone.");
  if (!confirmReset) return;
  stickHeroStats.set({
    bestScore: 0,
    settings: getDefaultStickHeroSettings(),
  });
  forceSaveAllStats();
}

export function resetStickHeroSettings() {
  stickHeroStats.update((stats) => ({
    ...stats,
    settings: getDefaultStickHeroSettings(),
  }));
  forceSaveAllStats();
}

function queueSaveAllStats() {
  if (!statsLoaded) return;
  clearTimeout(pendingSaveTimer);
  pendingSaveTimer = setTimeout(() => {
    pendingSaveTimer = null;
    saveAllStats();
  }, SAVE_DEBOUNCE_MS);
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    clearTimeout(pendingSaveTimer);
    saveAllStats();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearTimeout(pendingSaveTimer);
      saveAllStats();
    }
  });
}

stickHeroStats.subscribe(queueSaveAllStats);
balance.subscribe(queueSaveAllStats);
totalEarned.subscribe(queueSaveAllStats);
clickerStats.subscribe(queueSaveAllStats);
game2048Stats.subscribe(queueSaveAllStats);
lastPlayed.subscribe(queueSaveAllStats);

statsLoaded = true;

export const getTabLabels = (isPng) => ({
  curves: {
    full: 'Curve',
    short: isPng ? curvesPng : curvesGif,
    isIcon: true,
  },
  workflow: {
    full: 'Workflow',
    short: isPng ? workflowPng : workflowGif,
    isIcon: true,
  },
  effects: {
    full: 'Effects',
    short: isPng ? effectsPng : effectsGif,
    isIcon: true,
  },
  colors: {
    full: 'Colors',
    short: isPng ? colorsPng : colorsGif,
    isIcon: true,
  },
  transitions: {
    full: 'Transitions',
    short: isPng ? transitionsPng : transitionsGif,
    isIcon: true,
  },
  scripts: {
    full: 'Scripts',
    short: isPng ? scriptPng : scriptGif,
    isIcon: true,
  },
  ffmpeg: {
    full: 'FFMPEG',
    short: isPng ? ffmpegPng : ffmpegGif,
    isIcon: true,
  },
  settings: {
    full: 'Settings',
    short: isPng ? settingsPng : settingsGif,
    isIcon: true,
  }});

export const tabLabels = derived(
  putGifToPNG,
  ($putGifToPNG) => getTabLabels($putGifToPNG)
);

export const LogoStatic = derived(
  putGifToPNG,
  ($putGifToPNG) => ($putGifToPNG ? logoPng : logoGif)
);

export const TRANSITION_MS = derived(
  AnimationSpeed,
  ($AnimationSpeed) => {
    const ms = Number($AnimationSpeed);
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--transition-ms', `${ms}ms`);
    }
    return ms;
  }
);

const savedVisibility = getPreference('tabVisibility') ?? {
  curves: true, workflow: true, effects: true, colors: true,
  transitions: true, scripts: true, ffmpeg: true, media: true
};
const firstVisibleTab = order.find(tab => tab !== 'settings' && savedVisibility[tab] !== false) || 'settings';

export const LABEL_COLORS = [
  { index: 0, name: 'None', rgb: [1, 1, 1] },
  { index: 1, name: 'Red', rgb: [1, 0, 0] },
  { index: 2, name: 'Yellow', rgb: [1, 1, 0] },
  { index: 3, name: 'Light Cyan', rgb: [0.7, 1, 1] },
  { index: 4, name: 'Pink', rgb: [1, 0.7, 1] },
  { index: 5, name: 'Gray', rgb: [0.7, 0.7, 0.7] },
  { index: 6, name: 'Orange', rgb: [1, 0.7, 0.3] },
  { index: 7, name: 'Light Green', rgb: [0.729, 1, 0.702] },
  { index: 8, name: 'Blue', rgb: [0.075, 0.604, 1] },
  { index: 9, name: 'Green', rgb: [0.388, 0.871, 0.278] },
  { index: 10, name: 'Violet', rgb: [0.608, 0.341, 0.98] },
  { index: 11, name: 'Peach', rgb: [0.98, 0.69, 0.341] },
  { index: 12, name: 'Brown', rgb: [0.49, 0.333, 0.149] },
  { index: 13, name: 'Fuchsia', rgb: [1, 0.424, 0.988] },
  { index: 14, name: 'Turquoise', rgb: [0.424, 1, 0.953] },
  { index: 15, name: 'Sand', rgb: [1, 0.827, 0.675] },
  { index: 16, name: 'Dark Green', rgb: [0.11, 0.549, 0.075] },
];

export const DEFAULT_LAYER_COLORS = {
  solid: 1,
  null: 8,
  text: 9,
  camera: 13,
  adjustment: 5,
  precompose: 13,
};

export const LAYER_TYPE_LABELS = {
  solid: 'Solid',
  null: 'Null',
  text: 'Text',
  camera: 'Camera',
  adjustment: 'Adjustment Layer',
  precompose: 'Precompose',
};

export const layerColors = writable({
  ...DEFAULT_LAYER_COLORS,
  ...(getPreference('layerColors') ?? {}),
});

export const notification = writable({ visible: false, text: '', color: 'green' });
export const activeTab = writable(firstVisibleTab);
export const prevTab = writable(null);
export const transitioning = writable(false);
export const direction = writable(1);
export const showDashboard = writable(true);
export const dashboardClosing = writable(false);
export const dashboardTab = writable('informations');
export const CurvesTab = writable(getPreference('curvesTab') ?? 'presets');
export const EffectsTab = writable(getPreference('effectsTab') ?? 'presets');
export const isCollapsed = writable(getPreference('isCollapsed'));
export const volumeState = writable(getPreference('volumeState'));
export const showUpdateModal = writable(false);
export const CURRENT_VERSION = writable('1.0.0');
export const updateInfo = writable(null);
export const cameraFocalLength = writable(getPreference('cameraFocalLength') ?? 35);
export const createLayerCompOnSelected = writable(getPreference('createLayerCompOnSelected') ?? false);
export const autoBeatSensitivity = writable(getPreference('autoBeatSensitivity') ?? 50);
export const autoBeatThreshold = writable(getPreference('autoBeatThreshold') ?? 50);
export const colorInverted = writable(getPreference('colorInverted') ?? false);
export const FPS = writable(0);
export const tabVisibility = writable(getPreference('tabVisibility') ?? {
  curves: true, workflow: true, effects: true, colors: true,
  transitions: true, scripts: true, ffmpeg: true, media: true
});

export const warpStabilizerSettings = writable(getPreference('warpStabilizerSettings') ?? {
  method: 'Subspace Warp',
  border: 'Stabilize, Crop, Auto-scale',
  smoothness: 50,
  detailed: true,
  fast: true
});

export const cameraTrackerSettings = writable(getPreference('cameraTrackerSettings') ?? {
  detailed: true,
  trackSize: 100
});

export const autoCutSensitivity = writable(getPreference('autoCutSensitivity') ?? 75);

function persist(store, key, debounceMs = 0) {
  let t;
  store.subscribe((value) => {
    if (debounceMs > 0) {
      clearTimeout(t);
      t = setTimeout(() => setPreference(key, value), debounceMs);
    } else {
      setPreference(key, value);
    }
  });
}

persist(putGifToPNG, 'putGifToPNG', 200);
persist(AnimationSpeed, 'animationSpeed', 300);
persist(Hue, 'hue', 300);
persist(Saturation, 'saturation', 300);
persist(EnableRGBMode, 'enableRGBMode', 200);
persist(RgbSpeed, 'rgbSpeed', 300);
persist(isCollapsed, 'isCollapsed', 200);
persist(volumeState, 'volumeState', 200);
persist(enableDiscordRPC, 'enableDiscordRPC', 200);
persist(zoomLevel, 'zoomLevel', 300);
persist(CurvesTab, 'curvesTab', 200);
persist(EffectsTab, 'effectsTab', 200);
persist(tabVisibility, 'tabVisibility', 200);
persist(layerColors, 'layerColors', 200);
persist(applyOnAdjustmentLayer, 'applyOnAdjustmentLayer', 200);
persist(cameraFocalLength, 'cameraFocalLength', 300);
persist(createLayerCompOnSelected, 'createLayerCompOnSelected', 200);

persist(warpStabilizerSettings, 'warpStabilizerSettings', 300);
persist(cameraTrackerSettings, 'cameraTrackerSettings', 300);
persist(autoCutSensitivity, 'autoCutSensitivity', 300);
persist(autoBeatSensitivity, 'autoBeatSensitivity', 300);
persist(autoBeatThreshold, 'autoBeatThreshold', 300);
persist(colorHarmonyMode, 'colorHarmonyMode', 200);
persist(colorPresetMode, 'colorPresetMode', 200);
persist(colorHue, 'colorHue', 200);
persist(colorSat, 'colorSat', 200);
persist(colorLight, 'colorLight', 200);
persist(colorActiveSource, 'colorActiveSource', 200);
persist(colorApplyDirect, 'colorApplyDirect', 200);
persist(colorInverted, 'colorInverted', 200);

persist(c4aSkipDefaults, 'c4aSkipDefaults', 200);
persist(c4aSkipDisabledFx, 'c4aSkipDisabledFx', 200);
persist(c4aIncTransform, 'c4aIncTransform', 200);
persist(c4aIncEffects, 'c4aIncEffects', 200);
persist(c4aIncFxSettings, 'c4aIncFxSettings', 200);
persist(c4aIncMasks, 'c4aIncMasks', 200);
persist(c4aIncText, 'c4aIncText', 200);
persist(c4aIncStyles, 'c4aIncStyles', 200);
persist(c4aIncPrecomps, 'c4aIncPrecomps', 200);
persist(c4aMaxDepth, 'c4aMaxDepth', 300);

persist(rigOneNullPerEffect, 'rigOneNullPerEffect', 300);
persist(rigOnlyImportantProps, 'rigOnlyImportantProps', 300);
persist(toggleFxMode, 'toggleFxMode', 300);

export function applyHueRotation(hue, saturation = 70) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const themeColour = `hsl(${hue}, ${saturation}%, 55%)`;

  root.style.setProperty('--activeColour', themeColour);
  root.style.setProperty('--thumb-colour', themeColour);
}

let rgbRafId;
let lastTime = 0;
let lastFrameTimestamp = 0;
let rgbCurrentHue = 0;
let isRgbActive = false;
let currentRgbSpeed = 100;
let currentSaturation = 70;

const RGB_FRAME_INTERVAL_MS = 1000 / 30;

function updateRgbLoop() {
  if (typeof window === 'undefined') return;
  if (rgbRafId) cancelAnimationFrame(rgbRafId);
  if (isRgbActive) {
    lastTime = performance.now();
    lastFrameTimestamp = 0;
    const loop = (currentTime) => {
      if (document.hidden) {
        rgbRafId = requestAnimationFrame(loop);
        lastTime = currentTime;
        return;
      }

      if (currentTime - lastFrameTimestamp < RGB_FRAME_INTERVAL_MS) {
        rgbRafId = requestAnimationFrame(loop);
        return;
      }
      lastFrameTimestamp = currentTime;

      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      const hueStep = (5 / currentRgbSpeed) * deltaTime;
      rgbCurrentHue = (rgbCurrentHue + hueStep) % 360;
      applyHueRotation(rgbCurrentHue, currentSaturation);
      rgbRafId = requestAnimationFrame(loop);
    };
    rgbRafId = requestAnimationFrame(loop);
  } else {
    const manualHue = get(Hue);
    applyHueRotation(manualHue, currentSaturation);
  }
}

EnableRGBMode.subscribe((val) => {
  isRgbActive = val;
  updateRgbLoop();
});

RgbSpeed.subscribe((val) => {
  currentRgbSpeed = val;
  if (isRgbActive) updateRgbLoop();
});

Saturation.subscribe((val) => {
  currentSaturation = val;
  if (!isRgbActive) {
    applyHueRotation(get(Hue), val);
  }
});

Hue.subscribe((val) => {
  if (!isRgbActive) {
    applyHueRotation(val, currentSaturation);
  }
});