import { get } from 'svelte/store';
import { enableDiscordRPC, isOnlineStore } from './stores.js'; 
import { log, callJSX } from '../lib/utils/main.js';

log('discord_rpc', 'MODULE discordRPC.js chargé');

const CLIENT_ID = '1479541185361084507';
const LARGE_IMAGE_KEY = 'exfx_logo';
const LARGE_IMAGE_TEXT = 'ExcaliburFX - After Effects Extension'; 
const SMALL_IMAGE_KEY = 'ae_logo';
const RECONNECT_DELAY_MS = 15000;
const HANDSHAKE_TIMEOUT_MS = 8000;
const UPDATE_INTERVAL_MS = 12000;
const OP_HANDSHAKE = 0;
const OP_FRAME = 1;
const OP_CLOSE = 2;
const OP_PING = 3;
const OP_PONG = 4; 

let socket = null; 
let isConnected = false; 
let isInitializing = false; 
let reconnectTimer = null;
let updateInterval = null; 
let recvBuffer = null; 
let BufferCtor = null; 
let startTime = Date.now(); 

function nativeRequire(name) {
  let req = window.cep_node?.require || window.require;
  if (typeof req !== 'function') return null;
  try { return req(name); } catch (e) { return null; }
}

function getBuffer() {
  if (BufferCtor === null) {
    let bufMod = nativeRequire('buffer');
    if (bufMod !== null) BufferCtor = bufMod.Buffer;
  }
  return BufferCtor;
}

function getIpcPaths() {
  let os = nativeRequire('os');
  if (os === null) return [];

  let paths = [];
  if (os.platform() === 'win32') {
    for (let i = 0; i < 10; i++) {
      paths.push('\\\\.\\pipe\\discord-ipc-' + i);
    }
  } else {
    let processNode = nativeRequire('process');
    let env = processNode?.env || {};
    let dir = env.XDG_RUNTIME_DIR || env.TMPDIR || env.TMP || env.TEMP || '/tmp';
    dir = dir.replace(/\/$/, '');
    for (let i = 0; i < 10; i++) {
      paths.push(dir + '/discord-ipc-' + i);
    }
  }
  return paths;
}

function encodeFrame(opcode, obj) {
  let Buf = getBuffer();
  let payload = Buf.from(JSON.stringify(obj), 'utf8');
  let header = Buf.alloc(8);
  header.writeInt32LE(opcode, 0);
  header.writeInt32LE(payload.length, 4);
  return Buf.concat([header, payload]);
}

function tryConnect(paths, index, onSuccess, onFail) {
  let net = nativeRequire('net');
  if (net === null || index >= paths.length) {
    onFail(new Error('Discord introuvable'));
    return;
  }
  
  let sock = net.createConnection(paths[index]);
  let settled = false;

  sock.once('connect', () => {
    settled = true;
    sock.removeAllListeners('error');
    onSuccess(sock);
  });

  sock.once('error', () => {
    if (settled) return;
    sock.destroy();
    tryConnect(paths, index + 1, onSuccess, onFail);
  });
}

function handleFrame(opcode, data) {
  if (opcode === OP_FRAME && data?.cmd === 'DISPATCH' && data?.evt === 'READY') {
    isConnected = true;
    isInitializing = false;
    log('discord_rpc', 'Connecté avec succès');
    updateActivity();

    if (updateInterval === null) {
      updateInterval = setInterval(() => {
        if (!document.hidden) updateActivity();
      }, UPDATE_INTERVAL_MS);
    }
  } else if (opcode === OP_CLOSE) {
    teardownSocket();
    scheduleReconnect();
  } else if (opcode === OP_PING && socket !== null) {
    socket.write(encodeFrame(OP_PONG, data || {}));
  }
}

function onSocketData(chunk) {
  let Buf = getBuffer();
  recvBuffer = recvBuffer !== null ? Buf.concat([recvBuffer, chunk]) : chunk;

  while (recvBuffer.length >= 8) {
    let opcode = recvBuffer.readInt32LE(0);
    let length = recvBuffer.readInt32LE(4);
    
    if (recvBuffer.length < 8 + length) break;

    let payload = recvBuffer.slice(8, 8 + length);
    recvBuffer = recvBuffer.slice(8 + length);

    try {
      handleFrame(opcode, JSON.parse(payload.toString('utf8')));
    } catch (e) {
      log('discord_rpc', { parseError: String(e?.message || e) });
    }
  }
}

function teardownSocket() {
  if (updateInterval !== null) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
  try {
    if (socket !== null) {
      socket.removeAllListeners();
      socket.destroy();
    }
  } catch (e) {}
  socket = null;
  isConnected = false;
  isInitializing = false;
  recvBuffer = null;
}

function scheduleReconnect() {
  if (reconnectTimer !== null) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (get(enableDiscordRPC)) initDiscordRPC();
  }, RECONNECT_DELAY_MS);
}

async function buildActivityPayload() {
  let detailsText = "Projet After Effects";
  let stateText = "ExcaliburFX actif";
  let aeVersion = "20XX";

  try {
    let rawVersion = await callJSX("getAeVersion");
    if (rawVersion !== null && rawVersion !== undefined) {
      aeVersion = rawVersion.toString();
    }

    if (await callJSX("isExporting")) {
      detailsText = "Rendering a comp...";
      stateText = "DON'T DISTURB: Rendering in progress";
    } else {
      let rawDetails = await callJSX("getProjectDetails");
      let details = typeof rawDetails === "string" ? JSON.parse(rawDetails) : rawDetails;

      if (details !== null && details !== undefined) {
        let proj = details.projectName ? details.projectName.replace(/\.aep$/i, "") : "Projet";
        if (details.compName) {
          detailsText = proj + " | " + details.compName;
          stateText = details.width + "x" + details.height + " • " + details.fps + " fps • " + details.layers + " layers in";
        } else {
          detailsText = "Projet: " + proj;
          stateText = "No comp active";
        }
      }
    }
  } catch (err) {
    log('discord_rpc', { jsxError: String(err?.message || err) });
  }

  return {
    details: detailsText,
    state: stateText,
    timestamps: { start: startTime },
    assets: {
      large_image: LARGE_IMAGE_KEY,
      large_text: LARGE_IMAGE_TEXT,
      small_image: SMALL_IMAGE_KEY,
      small_text: "Running on After Effects " + aeVersion
    }
  };
}

export function initDiscordRPC() {
  if (!get(enableDiscordRPC) || !get(isOnlineStore)) {
    log('discord_rpc', 'Désactivé dans les préférences ou hors ligne');
    return;
  }
  
  if (socket !== null || isInitializing) return;
  if (getBuffer() === null) {
    log('discord_rpc', 'Buffer indisponible, abandon');
    return;
  }

  isInitializing = true;
  startTime = Date.now();
  let paths = getIpcPaths();
  
  if (paths.length === 0) {
    isInitializing = false;
    log('discord_rpc', 'Impossible de déterminer les chemins IPC');
    return;
  }

  tryConnect(paths, 0, (sock) => {
    socket = sock;
    socket.on('data', onSocketData);
    
    socket.on('error', () => {
      teardownSocket();
      scheduleReconnect();
    });
    
    socket.on('close', () => {
      if (isConnected) {
        teardownSocket();
        scheduleReconnect();
      } else {
        isInitializing = false;
      }
    });

    socket.write(encodeFrame(OP_HANDSHAKE, { v: 1, client_id: CLIENT_ID }));

    setTimeout(() => {
      if (isInitializing && !isConnected) {
        teardownSocket();
        scheduleReconnect();
      }
    }, HANDSHAKE_TIMEOUT_MS);
    
  }, () => {
    isInitializing = false;
    scheduleReconnect();
  });
}

export async function updateActivity() {
  if (socket === null || !isConnected || !get(enableDiscordRPC)) return;

  try {
    let processNode = nativeRequire('process');
    let frameData = {
      cmd: 'SET_ACTIVITY',
      args: {
        pid: processNode?.pid || 0,
        activity: await buildActivityPayload()
      },
      nonce: String(Date.now())
    };
    socket.write(encodeFrame(OP_FRAME, frameData));
  } catch (err) {
    log('discord_rpc', { activityError: String(err?.message || err) });
  }
}

export async function stopDiscordRPC() {
  if (reconnectTimer !== null) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (socket !== null) {
    try { socket.write(encodeFrame(OP_CLOSE, {})); } catch (e) {}
  }
  teardownSocket();
}

let hasSubscribed = false;

export function watchDiscordRPCPreference() {
  if (hasSubscribed) return;
  hasSubscribed = true;

  const checkAndApply = () => {
    if (get(enableDiscordRPC) && get(isOnlineStore)) {
      initDiscordRPC();
    } else {
      stopDiscordRPC(); 
    }
  };

  enableDiscordRPC.subscribe(checkAndApply);
  isOnlineStore.subscribe(checkAndApply);
}