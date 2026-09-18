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
  isCollapsed,
  volumeState,
  showUpdateModal,
  notification,
  FPS,
} from './stores.js';
import notifSoundUrl from '../assets/volume/notif.mp3';

let transitionTimeout = null;
let notifAudio = null;

export function closeUpdateModal() {
  showUpdateModal.set(false);
}

export function closeDashboard(onDone) {
  if (!get(showDashboard) || get(dashboardClosing)) {
    if (onDone) onDone();
    return;
  }
  
  dashboardClosing.set(true);
  
  setTimeout(() => {
    showDashboard.set(false);
    dashboardClosing.set(false);
    if (onDone) onDone();
  }, get(TRANSITION_MS));
}

export function selectTab(tab) {
  if (tab === get(activeTab) && !get(showDashboard)) return;

  const switchTab = () => {
    if (tab === get(activeTab)) return;

    let fromIndex = order.indexOf(get(activeTab));
    let toIndex = order.indexOf(tab);

    if (toIndex > fromIndex) {
      direction.set(1);
    } else {
      direction.set(-1);
    }

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
    showDashboard.set(true);
  }
}

export function toggleCollapse() {
  let currentState = get(isCollapsed);
  isCollapsed.set(!currentState);
}

export function cycleVolume() {
  let v = get(volumeState);
  if (v === 'high') {
    volumeState.set('mute');
  } else if (v === 'mute') {
    volumeState.set('low');
  } else {
    volumeState.set('high');
  }
}

function playNotifSound() {
  let currentVolume = get(volumeState);

  if (currentVolume === 'mute') return;
  if (typeof window === 'undefined') return;

  if (!notifAudio) {
    notifAudio = new Audio(notifSoundUrl);
  }

  if (currentVolume === 'low') {
    notifAudio.volume = 0.3;
  } else {
    notifAudio.volume = 1;
  }

  notifAudio.currentTime = 0;
  notifAudio.play().catch(() => {});
}

export function sendNotif(text = 'Bruh', color_green = true, returnit = true) {
  playNotifSound();
  
  let colorValue = 'red';
  if (color_green) {
    colorValue = 'green';
  }

  notification.set({
    visible: true,
    text: text,
    color: colorValue,
    autoHide: returnit
  });
}

export function monitorFPS() {
  let frameCount = 0;
  let lastTime = performance.now();
  let minFPS = 9999;
  let maxFPS = 0;

  function countFrame() {
    let now = performance.now();
    frameCount++;

    let elapsed = now - lastTime;

    if (elapsed >= 1000) {
      let fps = Math.round((frameCount * 1000) / elapsed);
      FPS.set(fps);

      if (fps < minFPS) {
        minFPS = fps;
      }
      if (fps > maxFPS) {
        maxFPS = fps;
      }

      let statsElement = document.getElementById('getAfterEffectesFrames');
      let minMaxElement = document.getElementById('getAfterEffectesMinAndMaxFrames');

      if (statsElement) {
        let dropped = maxFPS - minFPS;
        if (dropped < 0) dropped = 0;
        statsElement.textContent = 'FPS: ' + fps + ' | Dropped: ' + dropped;
      }

      if (minMaxElement) {
        minMaxElement.textContent = 'Min: ' + minFPS + ' | Max: ' + maxFPS;
      }

      frameCount = 0;
      lastTime = now;
    }

    requestAnimationFrame(countFrame);
  }

  requestAnimationFrame(countFrame);
}