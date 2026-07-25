import { CSInterface } from "../cep/csinterface.js";

let fs, path, os;
try {
  fs = require("fs");
  path = require("path");
  os = require("os");
} catch (e) {
  fs = null;
  path = {
    join: (...parts) => parts.filter(Boolean).join("/"),
    sep: "/",
  };
  os = {
    homedir: () => "",
  };
}

const hasNodeFS = !!(fs && path && os && typeof fs.writeFileSync === "function");

const cs = new CSInterface();

const ROOT_DIR = hasNodeFS ? path.join(os.homedir(), "Documents", "Excalibur") : null;
const LOGS_FILE = hasNodeFS ? path.join(ROOT_DIR, "logs.txt") : null;
const PREFS_FILE = hasNodeFS ? path.join(ROOT_DIR, "preferences.json") : null;
const DEFAULTS_FILE = hasNodeFS ? path.join(ROOT_DIR, "defaults.json") : null;

export const VERSION_URL = "https://api.github.com/repos/Physicprog/ExcaliburFX/releases";

export const DEFAULTS = {
  version: "1.0.0",
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
  if (!hasNodeFS) {
    console.warn("[Excalibur] init: filesystem unavailable in this environment — skipping disk init.");
    return;
  }

  if (!fs.existsSync(ROOT_DIR)) {
    fs.mkdirSync(ROOT_DIR, { recursive: true });
  }

  if (!fs.existsSync(LOGS_FILE)) {
    fs.writeFileSync(LOGS_FILE, "", "utf-8");
  }

  if (!fs.existsSync(PREFS_FILE)) {
    fs.writeFileSync(PREFS_FILE, JSON.stringify(DEFAULTS.preferences, null, 2), "utf-8");
  }

  fs.writeFileSync(DEFAULTS_FILE, JSON.stringify(DEFAULTS, null, 2), "utf-8");

  log("system", "Ouverture de l'application");
}


export function editValue(fileName, pathString, newValue) {
  if (!hasNodeFS) {
    console.warn("[Excalibur] editValue: filesystem unavailable.");
    return;
  }

  if (!fs.existsSync(fileName)) {
    console.error(`[Excalibur] editValue: Le fichier ${fileName} n'existe pas.`);
    return;
  }

  try {
    const rawData = fs.readFileSync(fileName, "utf-8");
    const data = JSON.parse(rawData);

    const keys = pathString.split(".");
    let current = data;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key] || typeof current[key] !== "object") {
        current[key] = {}; 
      }
      current = current[key];
    }

    const lastKey = keys[keys.length - 1];
    const oldValue = current[lastKey];
    current[lastKey] = newValue;

    fs.writeFileSync(fileName, JSON.stringify(data, null, 2), "utf-8");

    log("json_edit", { file: fileName, path: pathString, oldValue, newValue });
  } catch (e) {
    console.error(`[Excalibur] Erreur lors de la modification de ${pathString} dans ${fileName}:`, e);
    log("json_error", { file: fileName, path: pathString, error: e.message });
  }
}

export function log(action, details = "") {
  const d = typeof details === "object" ? JSON.stringify(details) : details;
  const line = `[${new Date().toISOString()}] ${action}${d ? " - " + d : ""}\n`;
  if (!hasNodeFS) {
    return;
  }

  fs.appendFileSync(LOGS_FILE, line, "utf-8");
}

export function getLogsAsText() {
  if (!hasNodeFS) return "";
  return fs.existsSync(LOGS_FILE) ? fs.readFileSync(LOGS_FILE, "utf-8") : "";
}

export function clearLogs() {
  if (!hasNodeFS) return;
  fs.writeFileSync(LOGS_FILE, "", "utf-8");
}

function readPreferences() {
  if (!hasNodeFS) return { ...DEFAULTS.preferences };
  if (!fs.existsSync(PREFS_FILE)) return { ...DEFAULTS.preferences };
  try {
    return JSON.parse(fs.readFileSync(PREFS_FILE, "utf-8"));
  } catch (e) {
    console.error("[Excalibur] preferences.json corrompu, retour aux defaults:", e);
    return { ...DEFAULTS.preferences };
  }
}

function writePreferences(prefs) {
  if (!hasNodeFS) return;
  try {
    if (!fs.existsSync(ROOT_DIR)) {
      fs.mkdirSync(ROOT_DIR, { recursive: true });
    }
    fs.writeFileSync(PREFS_FILE, JSON.stringify(prefs, null, 2), "utf-8");
  } catch (e) {
    console.error("[Excalibur] writePreferences error:", e);
  }
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

export function resetPreferences() {
  writePreferences({ ...DEFAULTS.preferences });
  log("system", "Reset preferences");
}


export function callJSX(functionName, ...args) {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || typeof window.__adobe_cep__ === "undefined" || !cs || typeof cs.evalScript !== "function") {
      const err = new Error(
        "Pont CEP indisponible : exécutez l'extension dans l'application Adobe (window.__adobe_cep__ manquant)."
      );
      log("jsx_error", { functionName, args, reason: "cep_missing" });
      reject(err);
      return;
    }

    const serializedArgs = args.map((a) => JSON.stringify(a)).join(",");
    const script = `${functionName}(${serializedArgs})`;

    try {
      cs.evalScript(script, (result) => {
        if (result === "EvalScript error." || result === "EvalScript error") {
          log("jsx_error", { functionName, args, result });
          reject(new Error(`Erreur JSX lors de l'appel de ${functionName}: ${result}`));
          return;
        }

        log("jsx_call", { functionName, args, result });

        try {
          resolve(JSON.parse(result));
        } catch {
          resolve(result);
        }
      });
    } catch (e) {
      log("jsx_error", { functionName, args, error: e.message });
      reject(e);
    }
  });
}

export default {
  DEFAULTS,
  ROOT_DIR,
  VERSION_URL,
  init,
  log,
  getLogsAsText,
  clearLogs,
  getPreference,
  setPreference,
  resetPreferences,
  callJSX,
};

const EXT_NAMESPACE = "EXCALIBUR";

export async function handleTestAlert() {
  try {
    const result = await callJSX(`${EXT_NAMESPACE}.testAlert`, "Le lien entre Svelte et JSX fonctionne parfaitement !");
    log("test_jsx", "Bouton alerte cliqué");
    return result;
  } catch (error) {
    console.error(error);
    return "Erreur : " + error.message;
  }
}

export function handleGetAppInfo() {
  const env = cs.getHostEnvironment();
  const appId = cs.getApplicationID();
  
  log("app_info", { id: appId, version: env.appVersion });
  return `Vous êtes sur : ${env.appName} (${appId}) version ${env.appVersion}`;
}

export async function handleTestReturnJSX() {
  try {
    const res = await callJSX(`${EXT_NAMESPACE}.getRandomNumber`);
    return "Le logiciel (JSX) a calculé ce nombre : " + res;
  } catch (error) {
    return "Erreur : " + error.message;
  }
}