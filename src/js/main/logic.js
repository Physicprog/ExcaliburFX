import { get } from 'svelte/store';
import {
  order,
  TRANSITION_MS,
  activeTab,
  prevTab,
  transitioning,
  direction,
  showDashboard,
  dashboardClosing,
  dashboardTab,
  isCollapsed,
  volumeState,
  showUpdateModal,
  CURRENT_VERSION,
  updateInfo,
  notification,
  FPS,
} from './stores.js';
import { checkForUpdate as checkForUpdateRemote } from '../lib/utils/main.js';

let NotetimeoutIDs = [];
let transitionTimeout = null;
function clearALLNoteTimeouts() {
  NotetimeoutIDs.forEach(id => clearTimeout(id));
  NotetimeoutIDs = [];
}

export function isNewer(local, remote) {
  const l = local.split('.').map(Number);
  const r = remote.split('.').map(Number);
  for (let i = 0; i < Math.max(l.length, r.length); i++) {
    if ((r[i] ?? 0) > (l[i] ?? 0)) return true;
    if ((r[i] ?? 0) < (l[i] ?? 0)) return false;
  }
  return false;
}

export async function checkForUpdate() {
  try {
    const remoteVersion = await checkForUpdateRemote(get(CURRENT_VERSION));
    if (!remoteVersion) return;

    updateInfo.set({ version: remoteVersion, changelog: null });
    showUpdateModal.set(true);
  } catch (e) {
    console.error('[Excalibur] Error checking for update:', e);
  }
}

export function closeUpdateModal() {
  showUpdateModal.set(false);
}

export function closeDashboard(onDone) {
  if (!get(showDashboard) || get(dashboardClosing)) {
    onDone?.();
    return;
  }
  dashboardClosing.set(true);
  setTimeout(() => {
    showDashboard.set(false);
    dashboardClosing.set(false);
    onDone?.();
  }, get(TRANSITION_MS));
}

export function selectTab(tab) {
  if (tab === get(activeTab) && !get(showDashboard)) return;

  const switchTab = () => {
    if (tab === get(activeTab)) return;

    const fromIndex = order.indexOf(get(activeTab));
    const toIndex = order.indexOf(tab);

    direction.set(toIndex > fromIndex ? 1 : -1);

    clearTimeout(transitionTimeout);

    prevTab.set(get(activeTab));
    activeTab.set(tab);
    transitioning.set(true);

    transitionTimeout = setTimeout(() => {
      transitioning.set(false);
      prevTab.set(null);
      transitionTimeout = null;
    }, get(TRANSITION_MS));
  };

  if (get(showDashboard)) {
    closeDashboard(switchTab);
  } else {
    switchTab();
  }
}

export function toggleDashboard() {
  if (get(dashboardClosing)) return;
  if (get(showDashboard)) {
    closeDashboard();
  } else {
    dashboardTab.set('informations');
    showDashboard.set(true);
  }
}

export function toggleCollapse() {
  isCollapsed.update((v) => !v);
}

export function cycleVolume() {
  volumeState.update((v) => (v === 'high' ? 'mute' : v === 'mute' ? 'low' : 'high'));
}



export function sendNotif(text = "Bruh", color_green = true, center_to_Main = true, returnit = true) {
  notification.set({ visible: true, text: text, color: color_green ? 'green' : 'red', autoHide: returnit });
}











export function monitorFPS() {
    let frameCount = 0;
    let minFPS = Infinity;
    let maxFPS = 0;
    let totalFPS = 0;
    let sampleCount = 0;
    const updateInterval = 2000;
    let lastUpdate = performance.now();
    let lastSecond = performance.now();

    function countFrame() {
        const now = performance.now();
        frameCount += 1;

        const elapsedSecond = now - lastSecond;
        const elapsedUpdate = now - lastUpdate;

        if (elapsedSecond >= 1000) {
            const fps = Math.round((frameCount * 1000) / elapsedSecond);
            FPS.set(fps);

            minFPS = Math.min(minFPS, fps);
            maxFPS = Math.max(maxFPS, fps);
            totalFPS += fps;
            sampleCount += 1;

            frameCount = 0;
            lastSecond = now;
        }

        if (elapsedUpdate >= updateInterval) {
            const avgFPS = sampleCount ? Math.round(totalFPS / sampleCount) : 0;
            const droppedFrames = maxFPS === Infinity ? 0 : Math.max(0, maxFPS - minFPS);

            if (typeof document !== 'undefined') {
              const statsElement = document.getElementById('getAfterEffectesFrames');
              const minMaxElement = document.getElementById('getAfterEffectesMinAndMaxFrames');

              if (statsElement) {
                statsElement.textContent =
                  `FPS: ${avgFPS} | Dropped: ${droppedFrames}`;
              }
              if (minMaxElement) {
                minMaxElement.textContent =
                  `Min: ${minFPS === Infinity ? 0 : minFPS} | Max: ${maxFPS}`;
              }
            }

            minFPS = Infinity;
            maxFPS = 0;
            totalFPS = 0;
            sampleCount = 0;
            lastUpdate = now;
        }

        requestAnimationFrame(countFrame);
    }

    requestAnimationFrame(countFrame);
}
/*
function monitorGeneralDelay() {
    let frameTimestamp = performance.now();

    function checkDelay() {
        const taskStart = performance.now();
        let frameDelay = taskStart - frameTimestamp;

        var getAfterEffectesDelay = document.getElementById("getAfterEffectesDelay");
        var checkedTime = Math.abs(Number(999 - frameDelay.toFixed(2)).toFixed(2));
        getAfterEffectesDelay.textContent = `General delay: ${checkedTime} ms`;

        requestAnimationFrame(() => {
            frameTimestamp = performance.now();
            setTimeout(checkDelay, 999);
        });
    }

    checkDelay();
}

function getRightValueFromBitConverson() {
    const min = 0.8;
    const max = 1.2;
    return Math.random() * (max - min) + min;
}

function updateRamUsage() {
    if (performance.memory) {
        const usedHeapSizeGB = ((performance.memory.usedJSHeapSize / 1024 / 1024) * getRightValueFromBitConverson()).toFixed(2);
    } else {
        document.getElementById('getJerryFlowUsage').textContent = 'Memory usage not available';
    }

    CurrentSession();
}

function convertSeconds(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
        hours: hours,
        minutes: minutes,
        seconds: seconds
    };
}
*/


