import { dispatchTS } from "../utils/utils";

// Déclarations globales pour l'environnement After Effects
declare const app: any;
declare const FolderItem: any;
declare const CompItem: any;
declare const FootageItem: any;
declare const SolidSource: any;
declare const FileSource: any;
declare const PurgeTarget: any;
declare const File: any;

function isNameSpaceAvailable(): void {
  if (typeof app === "undefined") {
    throw new Error("L'objet 'app' n'est pas disponible. Assurez-vous que le script est exécuté dans l'environnement After Effects.");
  }
}

export const helloWorld = (): string => {
  alert("Hello from After Effects!");
  return app.project && app.project.activeItem ? app.project.activeItem.name : "Aucune composition active";
};

export function getActiveCompName(): string | null {
  const activeItem = app.project && app.project.activeItem;
  return activeItem && activeItem.name ? activeItem.name : null;
}

export const testAlert = (msg: string): string => {
  alert(msg);
  return "L'alerte a été envoyée au logiciel !";
};

function contains(arr: any[], item: any): boolean {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === item) {
      return true;
    }
  }
  return false;
}

export function sortProject(): void {
  isNameSpaceAvailable();
  app.beginUndoGroup("Organize Project");

  const proj = app.project;

  if (!proj) {
    alert("No project open!");
    return;
  }

  const config = {
    folders: {
      videos: "Videos",
      images: "Images",
      audio: "Audio",
      compositions: "Compositions",
      solids: "Solids",
      precomps: "Precomps",
      unusedComps: "Comps unused",
      footage: "Footage",
      other: "Other"
    },
    videoExts: [".mp4", ".mov", ".avi", ".mkv", ".mxf", ".r3d", ".m4v", ".mpg", ".mpeg"],
    imageExts: [".jpg", ".jpeg", ".png", ".tif", ".tiff", ".psd", ".ai", ".svg", ".gif", ".bmp", ".exr"],
    audioExts: [".mp3", ".wav", ".aac", ".m4a", ".aiff", ".flac", ".ogg"]
  };

  // --- Fonctions utilitaires internes ---

  function getOrCreateFolder(name: string, parentFolder?: any): any {
    const parent = parentFolder || proj.rootFolder;

    for (let i = 1; i <= parent.numItems; i++) {
      const item = parent.item(i);
      if (item instanceof FolderItem && item.name === name) {
        return item;
      }
    }
    return parent.items.addFolder(name);
  }

  function getFileExtension(filename: string): string {
    if (!filename) return "";
    const lastDot = filename.lastIndexOf(".");
    if (lastDot === -1) return "";
    return filename.substring(lastDot).toLowerCase();
  }

  function isVideoFile(filename: string): boolean {
    return contains(config.videoExts, getFileExtension(filename));
  }

  function isImageFile(filename: string): boolean {
    return contains(config.imageExts, getFileExtension(filename));
  }

  function isAudioFile(filename: string): boolean {
    return contains(config.audioExts, getFileExtension(filename));
  }

  function isCompUsed(comp: any): boolean {
    for (let i = 1; i <= proj.numItems; i++) {
      const item = proj.item(i);
      if (item instanceof CompItem && item !== comp) {
        for (let j = 1; j <= item.numLayers; j++) {
          const layer = item.layer(j);
          if (layer.source === comp) {
            return true;
          }
        }
      }
    }
    return false;
  }

  function getCompUsageInfo(comp: any): string[] {
    const usedIn: string[] = [];
    for (let i = 1; i <= proj.numItems; i++) {
      const item = proj.item(i);
      if (item instanceof CompItem && item !== comp) {
        for (let j = 1; j <= item.numLayers; j++) {
          if (item.layer(j).source === comp) {
            usedIn.push(item.name);
            break; 
          }
        }
      }
    }
    return usedIn;
  }

  function getFootageInComp(comp: any): any[] {
    const footageList: any[] = [];
    for (let i = 1; i <= comp.numLayers; i++) {
      const layer = comp.layer(i);
      if (layer.source && layer.source instanceof FootageItem) {
        if (!contains(footageList, layer.source)) {
          footageList.push(layer.source);
        }
      }
    }
    return footageList;
  }

  // --- Création des dossiers principaux ---

  const mainFolders = {
    videos: getOrCreateFolder(config.folders.videos),
    images: getOrCreateFolder(config.folders.images),
    audio: getOrCreateFolder(config.folders.audio),
    compositions: getOrCreateFolder(config.folders.compositions),
    solids: getOrCreateFolder(config.folders.solids),
    footage: getOrCreateFolder(config.folders.footage),
    other: getOrCreateFolder(config.folders.other)
  };

  const items = {
    videos: [] as any[],
    images: [] as any[],
    audio: [] as any[],
    compositions: [] as any[],
    precomps: [] as any[],
    unusedComps: [] as any[],
    solids: [] as any[],
    other: [] as any[]
  };

  // --- Tri initial des éléments ---

  for (let i = 1; i <= proj.numItems; i++) {
    const item = proj.item(i);

    if (item instanceof FolderItem) {
      continue;
    }

    if (item instanceof CompItem) {
      items.compositions.push(item);
    } else if (item instanceof FootageItem) {
      if (item.mainSource instanceof SolidSource) {
        items.solids.push(item);
      } else if (item.file) {
        const filename = item.file.name;
        if (isVideoFile(filename)) {
          items.videos.push(item);
        } else if (isImageFile(filename)) {
          items.images.push(item);
        } else if (isAudioFile(filename)) {
          items.audio.push(item);
        } else {
          items.other.push(item);
        }
      } else {
        items.other.push(item);
      }
    }
  }

  // --- Tri approfondi des Compositions ---

  for (const comp of items.compositions) {
    if (isCompUsed(comp)) {
      items.precomps.push(comp);
    } else {
      items.unusedComps.push(comp);
    }
  }

  // --- Déplacement des éléments dans les dossiers ---

  for (const video of items.videos) {
    const baseName = video.name.replace(/\.[^.]+$/, "");
    video.parentFolder = getOrCreateFolder(baseName, mainFolders.videos);
  }

  for (const image of items.images) {
    const baseName = image.name.replace(/\.[^.]+$/, "");
    if (image.mainSource instanceof FileSource && image.mainSource.isStill === false) {
      image.parentFolder = getOrCreateFolder("Séquence_" + baseName, mainFolders.images);
    } else {
      image.parentFolder = getOrCreateFolder(baseName, mainFolders.images);
    }
  }

  for (const audio of items.audio) {
    const baseName = audio.name.replace(/\.[^.]+$/, "");
    audio.parentFolder = getOrCreateFolder(baseName, mainFolders.audio);
  }

  for (const solid of items.solids) {
    solid.parentFolder = mainFolders.solids;
  }

  const precompsFolder = getOrCreateFolder(config.folders.precomps, mainFolders.compositions);

  for (const comp of items.precomps) {
    const usageInfo = getCompUsageInfo(comp);
    if (usageInfo.length > 0) {
      const parentCompName = usageInfo[0].replace(/[\/\\:*?"<>|]/g, "_");
      comp.parentFolder = getOrCreateFolder(parentCompName, precompsFolder);
    } else {
      comp.parentFolder = precompsFolder;
    }
  }

  if (items.unusedComps.length > 0) {
    const unusedFolder = getOrCreateFolder(config.folders.unusedComps, mainFolders.compositions);
    for (const comp of items.unusedComps) {
      comp.parentFolder = unusedFolder;
    }
  }

  const mainCompsFolder = getOrCreateFolder("Main Compositions", mainFolders.compositions);

  for (const comp of items.compositions) {
    const isPrecomp = contains(items.precomps, comp);
    const isUnused = contains(items.unusedComps, comp);

    if (!isPrecomp && !isUnused) {
      const footage = getFootageInComp(comp);
      if (footage.length > 0 && footage[0].name) {
        const footageName = footage[0].name.replace(/\.[^.]+$/, "").replace(/[\/\\:*?"<>|]/g, "_");
        comp.parentFolder = getOrCreateFolder(footageName, mainCompsFolder);
      } else {
        comp.parentFolder = mainCompsFolder;
      }
    }
  }

  for (const other of items.other) {
    other.parentFolder = mainFolders.other;
  }

  // --- Rapport final ---

  let report = "ORGANISATION TERMINÉE !\n\n";
  report += `- Videos : ${items.videos.length}\n`;
  report += `- Images : ${items.images.length}\n`;
  report += `- Audio : ${items.audio.length}\n`;
  report += `- Main compositions : ${items.compositions.length - items.precomps.length - items.unusedComps.length}\n`;
  report += `- Precomps : ${items.precomps.length}\n`;
  report += `- Unused compositions : ${items.unusedComps.length}\n`;
  report += `- Solids : ${items.solids.length}\n`;
  report += `- Others : ${items.other.length}\n`;

  alert(report);
  app.endUndoGroup();
}

export const getRandomNumber = (): number => {
  return Math.round(Math.random() * 100);
};

export const purgeEverything = (): string => {
  const results: string[] = [];

  const scriptTargets: [string, any][] = [
    ["ALL_CACHES", PurgeTarget.ALL_CACHES],
    ["UNDO_CACHES", PurgeTarget.UNDO_CACHES],
    ["IMAGE_CACHES", PurgeTarget.IMAGE_CACHES],
    ["SNAPSHOT_CACHES", PurgeTarget.SNAPSHOT_CACHES],
  ];

  for (const [name, target] of scriptTargets) {
    try {
      app.purge(target);
      results.push(name + ":OK");
    } catch (e: any) { // Correction de l'erreur catch
      results.push(name + ":FAIL(" + e.toString() + ")");
    }
  }

  try {
    app.executeCommand(10200);
    results.push("CMD_10200_PurgeAll:OK");
  } catch (e: any) { // Correction de l'erreur catch
    results.push("CMD_10200_PurgeAll:FAIL(" + e.toString() + ")");
  }

  const menuLabels = [
    "Undo",
    "Image Cache Memory",
    "Snapshot",
  ];

  for (const label of menuLabels) {
    try {
      const id = app.findMenuCommandId(label);
      if (id) {
        app.executeCommand(id);
        results.push("MENU_" + label + ":OK");
      } else {
        results.push("MENU_" + label + ":NOT_FOUND");
      }
    } catch (e: any) { // Correction de l'erreur catch
      results.push("MENU_" + label + ":FAIL(" + e.toString() + ")");
    }
  }

  return results.join(";");
};

export const incrementSave = () => {
  const proj = app.project;
  
  if (!proj || !proj.file) {
    return "NO_FILE";
  }
  
  const currentFile = proj.file;
  const folder = currentFile.parent;
  
  const name = currentFile.name.replace(/\.aep$/i, "");
  const match = name.match(/^(.*?)[\s_-]?[vV](\d+)$/);
  
  let baseName, padding;

  if (match) {
    baseName = match[1];
    padding = match[2].length;
  } else {
    baseName = name;
    padding = 3;
  }

  let nextNum = 1;
  
  let nextNumStr = nextNum.toString();
  while (nextNumStr.length < padding) nextNumStr = "0" + nextNumStr;

  let newName = baseName + "_v" + nextNumStr + ".aep";
  let newFile = new File(folder.fsName + "/" + newName);

  let attempts = 0;
  while (newFile.exists && attempts < 1000) {
    nextNum++;
    nextNumStr = nextNum.toString();
    while (nextNumStr.length < padding) nextNumStr = "0" + nextNumStr;
    
    newName = baseName + "_v" + nextNumStr + ".aep";
    newFile = new File(folder.fsName + "/" + newName);
    attempts++;
  }

  proj.save(newFile);
  return "SAVED:" + newName;
};