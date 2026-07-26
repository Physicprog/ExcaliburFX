import { CSInterface } from "../cep/csinterface.js";
import { ns } from "../../../shared/shared.js";

// En haut de main.js, remplace le bloc try/catch existant par :
let fs, path, os, child_process;
try {
  fs = require("fs");
  path = require("path");
  os = require("os");
  child_process = require("child_process");
} catch (e) {
  fs = null;
  path = {
    join: (...parts) => parts.filter(Boolean).join("/"),
    sep: "/",
  };
  os = {
    homedir: () => "",
    platform: () => "unknown", // <-- ajouté, évite le crash
  };
  child_process = {
    exec: (_cmd, callback) => {
      // Pas de Node dispo (mode preview navigateur) : on renvoie une erreur propre
      callback(new Error("child_process indisponible hors environnement CEP"));
    },
  };
}

const hasNodeFS = !!(fs && path && os && typeof fs.writeFileSync === "function");
const hasChildProcess = !!(child_process && typeof child_process.exec === "function" && os.platform() !== "unknown");
const cs = new CSInterface();
const ROOT_DIR = hasNodeFS ? path.join(os.homedir(), "Documents", "Excalibur") : null;
const LOGS_FILE = hasNodeFS ? path.join(ROOT_DIR, "logs.txt") : null;
const PREFS_FILE = hasNodeFS ? path.join(ROOT_DIR, "preferences.json") : null;
const MAX_LOG_SIZE = 40 * 1024;

export const VERSION_URL = "https://api.github.com/repos/Physicprog/ExcaliburFX/releases";

function isNewerVersion(local, remote) {
  const l = local.split('.').map(Number);
  const r = remote.split('.').map(Number);
  for (let i = 0; i < Math.max(l.length, r.length); i++) {
    if ((r[i] ?? 0) > (l[i] ?? 0)) return true;
    if ((r[i] ?? 0) < (l[i] ?? 0)) return false;
  }
  return false;
}

export async function getRepoLasterVersion(url = VERSION_URL) {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      console.error("[Excalibur] getRepoLasterVersion: fetch failed", response.status);
      return null;
    }

    const releases = await response.json();
    if (!Array.isArray(releases) || releases.length === 0) {
      return null;
    }

    const stableReleases = releases.filter((release) => !release.draft && !release.prerelease);
    if (!stableReleases.length) {
      return null;
    }

    const latestRelease = stableReleases[0];
    return typeof latestRelease.tag_name === "string"
      ? latestRelease.tag_name.replace(/^v/, "")
      : null;
  } catch (error) {
    console.error("[Excalibur] getRepoLasterVersion error:", error);
    return null;
  }
}

export async function checkForUpdate(currentVersion, url = VERSION_URL) {
  const remoteVersion = await getRepoLasterVersion(url);
  if (!remoteVersion) return null;
  return isNewerVersion(currentVersion, remoteVersion) ? remoteVersion : null;
}

export const DEFAULTS = {
  preferences: {
    volume: 0.75,
    muted: false,
    volumeState: "high",
    theme: "dark",
    language: "fr",
    lastActiveTab: "Dashboard",
    hue: 0,
    saturation: 70,
    enableRGBMode: false,
    rgbSpeed: 100,
    animationSpeed: 300,
    putGifToPNG: false,
    isCollapsed: false,
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
    settings: {},
    workflow: { steps: [] },
  },
};



export function init() {
  if (!hasNodeFS) return;
  if (!fs.existsSync(ROOT_DIR)) fs.mkdirSync(ROOT_DIR, { recursive: true });
  if (!fs.existsSync(LOGS_FILE)) fs.writeFileSync(LOGS_FILE, "", "utf-8");
  if (!fs.existsSync(PREFS_FILE)) fs.writeFileSync(PREFS_FILE, JSON.stringify(DEFAULTS.preferences, null, 2), "utf-8");
  log("system", "Ouverture de l'application");
}

export async function initApp(currentVersion, url = VERSION_URL) {
  await init();
  return await checkForUpdate(currentVersion, url);
}

export function log(action, details = "") {
  const d = typeof details === "object" ? JSON.stringify(details) : details;
  const line = `[${new Date().toISOString()}] ${action}${d ? " - " + d : ""}\n`;
  if (!hasNodeFS) return;
  fs.appendFileSync(LOGS_FILE, line, "utf-8");
}

export function getPreference(key) {
  const prefs = readPreferences();
  return prefs[key] !== undefined ? prefs[key] : DEFAULTS.preferences[key];
}

export function setPreference(key, value) {
  const prefs = readPreferences();
  prefs[key] = value;
  writePreferences(prefs);
  log("preference_change", { key, value });
}

function readPreferences() {
  if (!hasNodeFS) return { ...DEFAULTS.preferences };
  if (!fs.existsSync(PREFS_FILE)) return { ...DEFAULTS.preferences };
  try {
    return JSON.parse(fs.readFileSync(PREFS_FILE, "utf-8"));
  } catch (e) {
    return { ...DEFAULTS.preferences };
  }
}

function writePreferences(prefs) {
  if (!hasNodeFS) return;
  try {
    fs.writeFileSync(PREFS_FILE, JSON.stringify(prefs, null, 2), "utf-8");
  } catch (e) {}
}

export function resetPreferences() {
  writePreferences({ ...DEFAULTS.preferences });
  log("system", "Reset preferences");
}

export function callJSX(functionName, ...args) {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || typeof window.__adobe_cep__ === "undefined" || !cs || typeof cs.evalScript !== "function") {
      const err = new Error("Pont CEP indisponible.");
      reject(err);
      return;
    }

    const serializedArgs = args.map((a) => JSON.stringify(a)).join(",");
    const script = `try { var host = typeof $ !== 'undefined' ? $ : window; host["${ns}"].${functionName}(${serializedArgs}); } catch(e) { "EvalScript error: " + e.toString(); }`;

    try {
      cs.evalScript(script, (result) => {
        if (result === "EvalScript error." || (typeof result === "string" && result.startsWith("EvalScript error"))) {
          reject(new Error(`Erreur JSX lors de l'appel de ${functionName}: ${result}`));
          return;
        }

        try {
          resolve(JSON.parse(result));
        } catch {
          resolve(result);
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

export async function handleTestAlert() {
  try {
    const result = await callJSX("testAlert", "Le lien entre Svelte et JSX fonctionne parfaitement !");
    return result;
  } catch (error) {
    return "Erreur : " + error.message;
  }
}

export function handleGetAppInfo() {
  const env = cs.getHostEnvironment();
  const appId = cs.getApplicationID();
  return `Vous êtes sur : ${env.appName} (${appId}) version ${env.appVersion}`;
}

export async function handleTestReturnJSX() {
  try {
    const res = await callJSX("getRandomNumber");
    return "Le logiciel (JSX) a calculé ce nombre : " + res;
  } catch (error) {
    return "Erreur : " + error.message;
  }
}

export async function sortProjectLayers() {
  return await callJSX("sortProject");
}





function getAfterEffectsMemoryMB() {
  return new Promise((resolve) => {
    if (!hasChildProcess) {
      log("ram_debug", "child_process indisponible (Node non activé ou hors CEP)");
      resolve(null);
      return;
    }

    const platform = os.platform();
    let cmd;

    if (platform === "win32") {
      cmd = `tasklist /FI "IMAGENAME eq AfterFX.exe" /FO CSV /NH`;
    } else {
      cmd = `ps -A -o rss,comm | grep -i "after"`;
    }

    log("ram_debug", { platform, cmd });

    child_process.exec(cmd, (err, stdout, stderr) => {
      log("ram_debug", {
        err: err ? err.message : null,
        stdout: stdout || "(vide)",
        stderr: stderr || "(vide)",
      });

      if (err || !stdout) {
        log("ram_debug", "resolve(null) car err ou stdout vide");
        return resolve(null);
      }

if (platform === "win32") {
  // Extrait tous les champs entre guillemets du CSV (tasklist /FO CSV)
  const fields = stdout.match(/"([^"]*)"/g);
  log("ram_debug", { fields });

  if (fields && fields.length >= 5) {
    // Le dernier champ est toujours la mémoire, ex: "622 532 Ko" (quel que soit le caractère d'espace)
    const memField = fields[4].replace(/"/g, "");
    log("ram_debug", { memField });

    // On garde uniquement les chiffres, peu importe le séparateur utilisé
    const digitsOnly = memField.replace(/[^\d]/g, "");
    log("ram_debug", { digitsOnly });

    const kb = parseInt(digitsOnly, 10);
    if (!isNaN(kb)) {
      const mb = Math.round(kb / 1024);
      log("ram_debug", { kbParsed: kb, mbResult: mb });
      return resolve(mb);
    }
  }


      } else {
        const line = stdout.trim().split("\n")[0];
        log("ram_debug", { lineMac: line });
        const kb = parseInt(line.trim().split(/\s+/)[0], 10);
        if (!isNaN(kb)) {
          const mb = Math.round(kb / 1024);
          log("ram_debug", { kbParsed: kb, mbResult: mb });
          return resolve(mb);
        }
      }

      log("ram_debug", "resolve(null) car parsing a échoué");
      resolve(null);
    });
  });
}



export async function clearCacheWithVerification(sendNotif, callJSX) {
  const before = await getAfterEffectsMemoryMB();
  log("ram_debug", { before });

  const purgeResult = await callJSX("purgeEverything");
  log("ram_debug", { purgeResult });

  await new Promise((r) => setTimeout(r, 1500));

  const after = await getAfterEffectsMemoryMB();
  log("ram_debug", { after });

  if (before !== null && after !== null) {
    const freed = before - after;
    if (freed > 0) {
      sendNotif(`Purge done : ${freed} Mo cleared (${before} Mo to ${after} Mo)`, true);
    } else {
      sendNotif(`Purge executed, but no decrease measured (${before} Mo to ${after} Mo).`, false);
    }
  } else {
    sendNotif("Purge executed (RAM measurement unavailable).", true);
  }
}


export async function saveIncremental(sendNotif, callJSX) {
  const result = await callJSX("incrementSave");

  if (result === "NO_FILE") {
    sendNotif("Please save the project manually first (CTRL+S).", false);
  } 
  else if (typeof result === "string" && result.startsWith("SAVED:")) {
    const newName = result.replace("SAVED:", "");
    sendNotif(`Incremental save done : ${newName}`, true);
  } 
  else {
    sendNotif("Incremental save failed.", false);
  }
}