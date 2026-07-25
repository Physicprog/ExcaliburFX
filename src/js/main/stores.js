import { writable, derived, get } from 'svelte/store';
import { getPreference, setPreference } from '../lib/utils/main.js';

export const order = [
  'curves',
  'workflow',
  'effects',
  'ffmpeg',
  'colors',
  'transitions',
  'scripts',
  'settings',
];

export const putGifToPNG = writable(getPreference('putGifToPNG'));
export const AnimationSpeed = writable(getPreference('animationSpeed'));
export const Hue = writable(getPreference('hue'));
export const Saturation = writable(getPreference('saturation'));
export const EnableRGBMode = writable(getPreference('enableRGBMode'));
export const RgbSpeed = writable(getPreference('rgbSpeed'));

export const getTabLabels = (isPng) => ({
  curves: {
    full: 'Curve',
    short: isPng
      ? '../../assets/SideBarIcon/curves.png'
      : '../../assets/SideBarIcon/curves.gif',
    isIcon: true,
  },
  workflow: {
    full: 'Workflow',
    short: isPng
      ? '../../assets/SideBarIcon/WorkFlow.png'
      : '../../assets/SideBarIcon/WorkFlow.gif',
    isIcon: true,
  },
  effects: { full: 'Effects', short: 'EF', isIcon: false },
  ffmpeg: { full: 'FFMPEG', short: 'FF', isIcon: false },
  colors: { full: 'Colors', short: 'CL', isIcon: false },
  transitions: { full: 'Transition', short: 'TR', isIcon: false },
  scripts: { full: 'Scripts', short: 'SC', isIcon: false },
});

export const tabLabels = derived(
  putGifToPNG,
  ($putGifToPNG) => getTabLabels($putGifToPNG)
);

export const LogoStatic = derived(
  putGifToPNG,
  ($putGifToPNG) =>
    $putGifToPNG
      ? '../../assets/Logo/logo.png'
      : '../../assets/Logo/logo.gif'
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

export const notification = writable({ visible: false, text: '', color: 'green' });
export const activeTab = writable('curves');
export const prevTab = writable(null);
export const transitioning = writable(false);
export const direction = writable(1);
export const showDashboard = writable(false);
export const dashboardClosing = writable(false);
export const dashboardTab = writable('informations');
export const isCollapsed = writable(getPreference('isCollapsed'));
export const volumeState = writable(getPreference('volumeState'));
export const showUpdateModal = writable(true);
export const CURRENT_VERSION = writable('1.0.0');
export const updateInfo = writable(null);
export const FPS = writable(0);

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

persist(putGifToPNG, 'putGifToPNG');
persist(AnimationSpeed, 'animationSpeed', 300);
persist(Hue, 'hue', 300);
persist(Saturation, 'saturation', 300);
persist(EnableRGBMode, 'enableRGBMode');
persist(RgbSpeed, 'rgbSpeed', 300);
persist(isCollapsed, 'isCollapsed');
persist(volumeState, 'volumeState');


export function applyHueRotation(hue, saturation = 70) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const themeColour = `hsl(${hue}, ${saturation}%, 55%)`;

  root.style.setProperty('--activeColour', themeColour);
  root.style.setProperty('--thumb-colour', themeColour);
}

let rgbInterval;
let rgbCurrentHue = 0;
let isRgbActive = false;
let currentRgbSpeed = 100;
let currentSaturation = 70;

function updateRgbLoop() {
  if (typeof window === 'undefined') return;
  clearInterval(rgbInterval);

  if (isRgbActive) {
    rgbInterval = setInterval(() => {
      rgbCurrentHue = (rgbCurrentHue + 5) % 360;
      applyHueRotation(rgbCurrentHue, currentSaturation);
    }, currentRgbSpeed);
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