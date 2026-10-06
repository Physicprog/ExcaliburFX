import { get } from 'svelte/store';
import { translateMessage } from '../i18n.js';

import {
  order,
  HOST,
  HOST_TABS,
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

    const tabOrder = HOST_TABS[HOST] || order;
    let fromIndex = tabOrder.indexOf(get(activeTab));
    let toIndex = tabOrder.indexOf(tab);

    const movesForward = toIndex > fromIndex;
    
    direction.set(movesForward ? 1 : -1);

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

function playNotifSound() {
  let currentVolume = get(volumeState);

  if (currentVolume <= 0) return;
  if (typeof window === 'undefined') return;

  if (!notifAudio) {
    notifAudio = new Audio(notifSoundUrl);
  }

  notifAudio.volume = currentVolume / 100;

  notifAudio.currentTime = 0;
  notifAudio.play().catch(() => {});
}

export function sendNotif(text = 'Bruh', color_green = true, returnit = true) {
  playNotifSound();

  notification.set({
    visible: true,
    text: translateMessage(text),
    color: color_green ? 'green' : 'red',
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

export function fuzzySearch(query, text) {
  if (!query) return true;
  query = query.toLowerCase();
  text = text.toLowerCase();

  if (text.includes(query)) return true;
  
  if (query.length >= 4) {
    for (let i = 0; i <= text.length - query.length; i++) {
      let fautes = 0;

      for (let j = 0; j < query.length; j++) {
        if (text[i + j] !== query[j]) {
          fautes++;
        }
      }

      if (fautes <= 2) return true;
    }
  }

  return false;
}