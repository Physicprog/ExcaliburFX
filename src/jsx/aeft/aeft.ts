import {  customErrorAlert } from "./alert";

declare const app: any;
declare const FolderItem: any;
declare const FootageItem: any;
declare const SolidSource: any;
declare const FileSource: any;
declare const PurgeTarget: any;
declare const File: any;
declare const ImportOptions: any;
declare const $: any;
declare const console: any;

var excaliburLanguage = "en";


function notifyPanel(text: string, success: boolean = false): void {
  try { dispatchTS("hostMessage", { text: String(text), success: success }); } catch (e) {}
}


export function setExcaliburLanguage(language: string): string {
  var supported = ["en", "fr", "es", "de", "hi"];
  if (supported.indexOf(language) === -1) {
    return JSON.stringify({ status: "ERROR", message: "Unsupported language." });
  }
  excaliburLanguage = language;
  return JSON.stringify({ status: "SUCCESS" });
}

export function getExcaliburLanguage(): string { return excaliburLanguage; }

function localizeExcaliburMessage(message: string): string { return message; }

declare var CompItem: any;
declare var Property: any;
declare var PropertyGroup: any;
declare var AVLayer: any;
declare var FrameBlendingType: any;
declare var KeyframeInterpolationType: any;
declare var KeyframeEase: { new(speed: number, influence: number): any };

type CompItem = any;
type Property = any;
type PropertyGroup = any;
type AVLayer = any;
type KeyframeEase = any;

($.global as any).alert = function (message: string) { notifyPanel(message, false); };


function isNameSpaceAvailable(): void {
  if (typeof app === "undefined") {
    throw new Error("The 'app' object is not available. Make sure the script is run in the After Effects environment.");
  }
}

function ok(extra?: any): string {
  var result: any = { status: "SUCCESS" };
  if (extra) {
    for (var key in extra) {
      if (Object.prototype.hasOwnProperty.call(extra, key)) {
        result[key] = extra[key];
      }
    }
  }
  return JSON.stringify(result);
}

function fail(message: string): string {
  return JSON.stringify({ status: "ERROR", message: localizeExcaliburMessage(message) });
}

function resolveActiveComp(): any | null {
  if (typeof app === "undefined" || !app.project) return null;

  var comp = app.project.activeItem;
  if (comp && (comp instanceof CompItem || comp.typeName === "Composition")) {
    return comp;
  }

  for (var i = 1; i <= app.project.numItems; i++) {
    var item = app.project.item(i);
    if ((item instanceof CompItem || item.typeName === "Composition") && item.openInViewer) {
      return item;
    }
  }

  if (app.project.selection && app.project.selection.length === 1) {
    var sel = app.project.selection[0];
    if (sel instanceof CompItem || sel.typeName === "Composition") {
      return sel;
    }
  }

  return null;
}

function getPrecompCount(): number {
  if (typeof $.global !== "undefined") {
    if (typeof $.global.excaliburPrecompCount === "undefined") {
      $.global.excaliburPrecompCount = 1;
    }
    var currentCount = $.global.excaliburPrecompCount;
    $.global.excaliburPrecompCount += 1;
    return currentCount;
  }
  return Math.floor(Math.random() * 1000);
}

export function getSelectedLayerInfo(): string {
  var comp = resolveActiveComp();
  if (!comp || !comp.selectedLayers || comp.selectedLayers.length !== 1) {
    return "null";
  }

  var layer = comp.selectedLayers[0];
  if (!layer.source || !layer.source.file) {
    return "null";
  }

  return JSON.stringify({
    sourcePath: layer.source.file.fsName || layer.source.file.fullName,
    layerIndex: layer.index,
    inPoint: layer.inPoint,
    outPoint: layer.outPoint,
    startTime: layer.startTime,
    compName: comp.name
  });
}

export function importAndPlaceFile(importData: any): string {
  if (typeof app === "undefined" || !app.project) {
    return fail("No After Effects project is open.");
  }

  var data = typeof importData === "string" ? JSON.parse(importData) : importData;
  var comp = null;
  for (var i = 1; i <= app.project.numItems; i++) {
    var item = app.project.item(i);
    if (item instanceof CompItem && item.name === data.compName) {
      comp = item;
      break;
    }
  }
  if (!comp) {
    return fail("Composition not found.");
  }

  var originalLayer = comp.layer(data.layerIndex);
  if (!originalLayer) {
    return fail("Original layer not found.");
  }

  var imported = app.project.importFile(new ImportOptions(new File(data.filePath)));
  var layer = comp.layers.add(imported);
  layer.startTime = data.startTime;
  layer.inPoint = data.inPoint;
  layer.outPoint = data.outPoint;
  layer.moveBefore(originalLayer);

  var sourceTransform = originalLayer.property("ADBE Transform Group");
  var targetTransform = layer.property("ADBE Transform Group");
  var transformProperties = [
    "ADBE Anchor Point",
    "ADBE Position",
    "ADBE Scale",
    "ADBE Orientation",
    "ADBE Rotate X",
    "ADBE Rotate Y",
    "ADBE Rotate Z",
    "ADBE Opacity"
  ];
  for (var propertyIndex = 0; propertyIndex < transformProperties.length; propertyIndex++) {
    var propertyName = transformProperties[propertyIndex];
    var sourceProperty = sourceTransform.property(propertyName);
    var targetProperty = targetTransform.property(propertyName);
    if (sourceProperty && targetProperty) {
      try {
        targetProperty.setValue(sourceProperty.value);
      } catch (propertyError) {
      }
    }
  }

  layer.enabled = originalLayer.enabled;
  layer.label = originalLayer.label;
  return ok({ layerIndex: layer.index });
}

export function getAeVersion(): string {
  if (typeof app === "undefined" || !app.version) return "20XX";
  var majorStr = app.version.split(".")[0];
  var majorNum = parseInt(majorStr, 10);
  if (!isNaN(majorNum) && majorNum >= 22) {
    return (2000 + majorNum).toString();
  }
  return app.version.split("x")[0];
}

export function getProjectDetails(): string {
  if (typeof app === "undefined" || !app.project) {
    return JSON.stringify({ projectName: null, compName: null, width: 0, height: 0, fps: 0, layers: 0, selectedLayers: 0, duration: 0, bpc: 8 });
  }

  var projName = "Untitled Project";
  if (app.project.file) {
    try { projName = decodeURI(app.project.file.name); } catch (e: any) { projName = app.project.file.name; }
  }

  var comp = resolveActiveComp();
  if (!comp) {
    return JSON.stringify({ projectName: projName, compName: null, width: 0, height: 0, fps: 0, layers: 0, selectedLayers: 0, duration: 0, bpc: app.project.bitsPerChannel || 8 });
  }

  var selectedCount = comp.selectedLayers ? comp.selectedLayers.length : 0;
  return JSON.stringify({ projectName: projName, compName: comp.name, width: comp.width, height: comp.height, fps: Math.round(comp.frameRate), layers: comp.numLayers, selectedLayers: selectedCount, duration: Math.round(comp.duration), bpc: app.project.bitsPerChannel || 8 });
}

export function isExporting(): boolean {
  isNameSpaceAvailable();
  return app.project && app.project.renderQueue && app.project.renderQueue.numItems > 0;
}

function contains(arr: any[], item: any): boolean {
  for (let i = 0; i < arr.length; i++) { if (arr[i] === item) return true; }
  return false;
}

export function sortProject(): string {
  isNameSpaceAvailable();
  const proj = app.project;
  if (!proj) return fail("No project is open.");
  
  const activeItem = resolveActiveComp();
  if (!activeItem) return fail("Please select your main composition in the project first.");

  app.beginUndoGroup("Organize Project");

  const config = {
    folders: { videos: "Videos", images: "Images", audio: "Audio", models: "3D Models", data: "Data", compositions: "Compositions", solids: "Solids", precomps: "Precomps", unusedComps: "Comps unused", other: "Other" },
    videoExts: [".mp4", ".mov", ".avi", ".mkv", ".mxf", ".r3d", ".m4v", ".mpg", ".mpeg", ".wmv", ".flv", ".f4v", ".webm", ".crm", ".braw", ".h264", ".hevc"],
    imageExts: [".jpg", ".jpeg", ".png", ".tif", ".tiff", ".psd", ".psb", ".ai", ".eps", ".svg", ".gif", ".bmp", ".exr", ".dpx", ".cin", ".hdr", ".tga", ".pict", ".cr2", ".cr3", ".nef", ".arw", ".dng", ".heic"],
    audioExts: [".mp3", ".wav", ".aac", ".m4a", ".aiff", ".aif", ".flac", ".ogg", ".wma"],
    modelExts: [".glb", ".gltf", ".obj", ".c4d"],
    dataExts: [".json", ".mgjson", ".csv", ".tsv", ".txt", ".xml"]
  };

  function getOrCreateFolder(name: string, parentFolder?: any): any {
    const parent = parentFolder || proj.rootFolder;
    for (let i = 1; i <= parent.numItems; i++) {
      const item = parent.item(i);
      if (item instanceof FolderItem && item.name === name) return item;
    }
    return parent.items.addFolder(name);
  }

  function getFileExtension(filename: string): string {
    if (!filename) return "";
    const lastDot = filename.lastIndexOf(".");
    if (lastDot === -1) return "";
    return filename.substring(lastDot).toLowerCase();
  }

  function getExtFolderName(filename: string): string {
    const ext = getFileExtension(filename);
    return ext ? ext.substring(1).toUpperCase() : "MISC";
  }

  function isCompUsed(comp: any): boolean {
    for (let i = 1; i <= proj.numItems; i++) {
      const item = proj.item(i);
      if (item instanceof CompItem && item !== comp) {
        for (let j = 1; j <= item.numLayers; j++) {
          if (item.layer(j).source === comp) return true;
        }
      }
    }
    return false;
  }

  const items: any = { videos: [], images: [], audio: [], models: [], data: [], compositions: [], precomps: [], unusedComps: [], solids: [], other: [] };

  for (let i = 1; i <= proj.numItems; i++) {
    const item = proj.item(i);
    if (item instanceof FolderItem) continue;

    if (item instanceof CompItem) {
      items.compositions.push(item);
    } else if (item instanceof FootageItem) {
      if (item.mainSource instanceof SolidSource) {
        items.solids.push(item);
      } else if (item.file) {
        const filename = item.file.name;
        if (contains(config.videoExts, getFileExtension(filename))) items.videos.push(item);
        else if (contains(config.imageExts, getFileExtension(filename))) items.images.push(item);
        else if (contains(config.audioExts, getFileExtension(filename))) items.audio.push(item);
        else if (contains(config.modelExts, getFileExtension(filename))) items.models.push(item);
        else if (contains(config.dataExts, getFileExtension(filename))) items.data.push(item);
        else items.other.push(item);
      } else {
        items.other.push(item);
      }
    }
  }

  for (const comp of items.compositions) {
    if (comp === activeItem) continue;
    if (isCompUsed(comp)) items.precomps.push(comp);
    else items.unusedComps.push(comp);
  }

  if (items.videos.length > 0) {
    const folder = getOrCreateFolder(config.folders.videos);
    for (const video of items.videos) video.parentFolder = getOrCreateFolder(getExtFolderName(video.name), folder);
  }

  if (items.images.length > 0) {
    const folder = getOrCreateFolder(config.folders.images);
    for (const image of items.images) {
      const extName = getExtFolderName(image.name);
      if (image.mainSource instanceof FileSource && image.mainSource.isStill === false) {
        image.parentFolder = getOrCreateFolder("SEQUENCES " + extName, folder);
      } else {
        image.parentFolder = getOrCreateFolder(extName, folder);
      }
    }
  }

  if (items.audio.length > 0) {
    const folder = getOrCreateFolder(config.folders.audio);
    for (const audio of items.audio) audio.parentFolder = getOrCreateFolder(getExtFolderName(audio.name), folder);
  }
  if (items.models.length > 0) {
    const folder = getOrCreateFolder(config.folders.models);
    for (const model of items.models) model.parentFolder = getOrCreateFolder(getExtFolderName(model.name), folder);
  }
  if (items.data.length > 0) {
    const folder = getOrCreateFolder(config.folders.data);
    for (const data of items.data) data.parentFolder = getOrCreateFolder(getExtFolderName(data.name), folder);
  }
  if (items.solids.length > 0) {
    const folder = getOrCreateFolder(config.folders.solids);
    for (const solid of items.solids) solid.parentFolder = folder;
  }

  if (items.compositions.length > 0) {
    const mainCompsFolder = getOrCreateFolder(config.folders.compositions);
    if (items.precomps.length > 0) {
      const precompsFolder = getOrCreateFolder(config.folders.precomps, mainCompsFolder);
      for (const comp of items.precomps) comp.parentFolder = precompsFolder;
    }
    if (items.unusedComps.length > 0) {
      const unusedFolder = getOrCreateFolder(config.folders.unusedComps, mainCompsFolder);
      for (const comp of items.unusedComps) comp.parentFolder = unusedFolder;
    }
    const mainCompsSubFolder = getOrCreateFolder("Main Compositions", mainCompsFolder);
    for (const comp of items.compositions) {
      if (!contains(items.precomps, comp) && !contains(items.unusedComps, comp)) comp.parentFolder = mainCompsSubFolder;
    }
  }

  if (items.other.length > 0) {
    const folder = getOrCreateFolder(config.folders.other);
    for (const other of items.other) other.parentFolder = getOrCreateFolder(getExtFolderName(other.name), folder);
  }

  let removedAnyFolder = false;
  do {
    removedAnyFolder = false;
    for (let i = proj.numItems; i >= 1; i--) {
      const item = proj.item(i);
      if (item instanceof FolderItem && item.numItems === 0) {
        item.remove();
        removedAnyFolder = true;
      }
    }
  } while (removedAnyFolder);

  app.endUndoGroup();
  return ok();
}

export function deleteUnusedItems(confirmed: boolean = false): string {
  var activeItem = resolveActiveComp();
  if (!activeItem) return fail("Please select your main composition in the project first.");
  if (!confirmed) return ok({ message: "Action cancelled by the user." });

  app.beginUndoGroup("Reduce Project to Active Comp");
  try {
    app.project.reduceProject([activeItem]);
    
    var proj = app.project;
    var removedAnyFolder = false;
    do {
      removedAnyFolder = false;
      for (var i = proj.numItems; i >= 1; i--) {
        var item = proj.item(i);
        if (item instanceof FolderItem && item.numItems === 0) {
          item.remove();
          removedAnyFolder = true;
        }
      }
    } while (removedAnyFolder); 

    app.endUndoGroup();
    return ok({ 
      compName: activeItem.name, 
      message: "Project successfully reduced around " + activeItem.name 
    });
  } catch (e: any) {
    app.endUndoGroup();
    return fail(String(e));
  }
}

export const purgeEverything = (): string => {
  const results: string[] = [];
  const scriptTargets: [string, any][] = [
    ["ALL_CACHES", PurgeTarget.ALL_CACHES],
    ["UNDO_CACHES", PurgeTarget.UNDO_CACHES],
    ["IMAGE_CACHES", PurgeTarget.IMAGE_CACHES],
    ["SNAPSHOT_CACHES", PurgeTarget.SNAPSHOT_CACHES],
  ];

  for (let i = 0; i < scriptTargets.length; i++) {
    const name = scriptTargets[i][0];
    const target = scriptTargets[i][1];
    try { app.purge(target); results.push(name + ":OK"); }
    catch (e: any) { results.push(name + ":FAIL(" + String(e) + ")"); }
  }

  try { app.executeCommand(10200); results.push("CMD_10200_PurgeAll:OK"); }
  catch (e: any) { results.push("CMD_10200_PurgeAll:FAIL(" + String(e) + ")"); }

  return ok({ detail: results.join(";") });
};

export const incrementSave = (): string => {
  const proj = app.project;
  if (!proj || !proj.file) return JSON.stringify({ status: "ERROR", code: "NO_FILE", message: "Please save the project manually first (CTRL+S)." });

  const currentFile = proj.file;
  const folder = currentFile.parent;
  const name = currentFile.name.replace(/\.aep$/i, "");
  const match = name.match(/^(.*?)[\s_-]?[vV](\d+)$/);

  let baseName = match ? match[1] : name;
  let padding = match ? match[2].length : 3;
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
  return ok({ fileName: newName });
};

function returnColorFunc(color_index: number): [number, number, number] {
  switch (color_index) {
    case 1: return [1, 0, 0]; case 2: return [1, 1, 0]; case 3: return [0.7, 1, 1];
    case 4: return [1, 0.7, 1]; case 5: return [0.7, 0.7, 0.7]; case 6: return [1, 0.7, 0.3];
    case 7: return [0.729, 1, 0.702]; case 8: return [0.075, 0.604, 1]; case 9: return [0.388, 0.871, 0.278];
    case 10: return [0.608, 0.341, 0.98]; case 11: return [0.98, 0.69, 0.341]; case 12: return [0.49, 0.333, 0.149];
    case 13: return [1, 0.424, 0.988]; case 14: return [0.424, 1, 0.953]; case 15: return [1, 0.827, 0.675];
    case 16: return [0.11, 0.549, 0.075]; default: return [1, 1, 1]; 
  }
}


function toArray(v: any): any[] {
  return v instanceof Array ? v : [v];
}

function spatialLength(prop: any, a: number, b: number, v0: any[], v1: any[]): number {
  const n = Math.min(v0.length, v1.length);
  let outT: any[] = [];
  let inT: any[] = [];
  try {
    outT = toArray(prop.keyOutSpatialTangent(a));
    inT = toArray(prop.keyInSpatialTangent(b));
  } catch (e) {
    outT = [];
    inT = [];
  }

  const steps = 64;
  let length = 0;
  let prev: number[] = [];
  for (let s = 0; s <= steps; s += 1) {
    const t = s / steps;
    const mt = 1 - t;
    const cur: number[] = [];
    for (let d = 0; d < n; d += 1) {
      const p0 = Number(v0[d]);
      const p3 = Number(v1[d]);
      const p1 = p0 + (outT.length > d ? Number(outT[d]) : 0);
      const p2 = p3 + (inT.length > d ? Number(inT[d]) : 0);
      cur.push(mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3);
    }
    if (s > 0) {
      let sq = 0;
      for (let d = 0; d < n; d += 1) sq += (cur[d] - prev[d]) * (cur[d] - prev[d]);
      length += Math.sqrt(sq);
    }
    prev = cur;
  }
  return length;
}

function getNormalizedCurve(prop: any, a: number, b: number): any | null {
  if (prop.keyOutInterpolationType(a) === KeyframeInterpolationType.HOLD) {
    return null;
  }
  if (
    prop.keyOutInterpolationType(a) !== KeyframeInterpolationType.BEZIER ||
    prop.keyInInterpolationType(b) !== KeyframeInterpolationType.BEZIER
  ) {
    return null;
  }

  const duration = prop.keyTime(b) - prop.keyTime(a);
  if (!(duration > 0)) return null;

  const outEase = prop.keyOutTemporalEase(a);
  const inEase = prop.keyInTemporalEase(b);
  const dims = Math.min(outEase.length, inEase.length);
  const v0 = toArray(prop.keyValue(a));
  const v1 = toArray(prop.keyValue(b));
  const deltas = getSegmentDeltas(prop, a, b, dims);

  let x1Sum = 0;
  let y1Sum = 0;
  let x2Sum = 0;
  let y2Sum = 0;
  let weightSum = 0;

  for (let d = 0; d < dims; d += 1) {
    const delta = deltas[d];
    const weight = Math.abs(delta);
    if (!isFinite(delta) || weight < 0.0000001) continue;

    const outSpeed = Number(outEase[d].speed);
    const inSpeed = Number(inEase[d].speed);
    if (!isFinite(outSpeed) || !isFinite(inSpeed)) continue;

    const outInf = Math.max(0.1, Math.min(100, Number(outEase[d].influence))) / 100;
    const inInf = Math.max(0.1, Math.min(100, Number(inEase[d].influence))) / 100;
    x1Sum += outInf * weight;
    y1Sum += ((outSpeed * duration * outInf) / delta) * weight;
    x2Sum += (1 - inInf) * weight;
    y2Sum += (1 - (inSpeed * duration * inInf) / delta) * weight;
    weightSum += weight;
  }

  if (weightSum === 0) return null;
  return {
    x1: x1Sum / weightSum,
    y1: y1Sum / weightSum,
    x2: x2Sum / weightSum,
    y2: y2Sum / weightSum,
    weight: weightSum,
  };
}

export function GetSelectedKeyframesCurve(): string {
  try {
    const comp = resolveActiveComp();
    if (!comp) return fail("Select a composition.");
    if (!comp.selectedLayers || comp.selectedLayers.length === 0) return fail("Select a layer.");

    const props = comp.selectedProperties;
    let selectedKeyCount = 0;

    let x1Sum = 0, y1Sum = 0, x2Sum = 0, y2Sum = 0, weightSum = 0;
    let segmentCount = 0;

    for (let p = 0; p < props.length; p += 1) {
      const prop: any = props[p];
      if (!prop || prop.propertyType !== PropertyType.PROPERTY) continue;
      if (!prop.numKeys || prop.numKeys < 2) continue;

      const rawKeys = prop.selectedKeys;
      if (!rawKeys || rawKeys.length === 0) continue;
      selectedKeyCount += rawKeys.length;

      const keys: number[] = rawKeys.slice().sort(function (a: number, b: number) { return a - b; });

      for (let k = 0; k < keys.length - 1; k += 1) {
        const a = keys[k];
        const b = keys[k + 1];
        if (b !== a + 1) continue;

        const curve = getNormalizedCurve(prop, a, b);
        if (!curve) continue;
        x1Sum += curve.x1 * curve.weight;
        y1Sum += curve.y1 * curve.weight;
        x2Sum += curve.x2 * curve.weight;
        y2Sum += curve.y2 * curve.weight;
        weightSum += curve.weight;
        segmentCount += 1;
      }
    }

    if (selectedKeyCount < 2) return fail("Select at least 2 keyframes.");
    if (segmentCount === 0 || weightSum === 0) {
      return fail("Select at least 2 consecutive keyframes on the same property.");
    }

    return ok({
      x1: x1Sum / weightSum,
      y1: y1Sum / weightSum,
      x2: x2Sum / weightSum,
      y2: y2Sum / weightSum,
      segments: segmentCount,
    });
  } catch (error: any) {
    return fail(error.toString());
  }
}



















let copiedData: any = null;

function getSelectedSegments(prop: any): { a: number; b: number }[] {
  const segs: { a: number; b: number }[] = [];
  const raw = prop.selectedKeys;
  if (!raw || raw.length < 2) return segs;
  const keys: number[] = raw.slice().sort(function (x: number, y: number) { return x - y; });
  for (let k = 0; k < keys.length - 1; k += 1) {
    if (keys[k + 1] === keys[k] + 1) segs.push({ a: keys[k], b: keys[k + 1] });
  }
  return segs;
}

function isAnimatableProp(prop: any): boolean {
  return !!prop && prop.propertyType === PropertyType.PROPERTY && prop.numKeys >= 2;
}

function getSegmentDeltas(prop: any, a: number, b: number, dims: number): number[] {
  const v0 = toArray(prop.keyValue(a));
  const v1 = toArray(prop.keyValue(b));
  if (prop.isSpatial && dims === 1 && v0.length > 1) {
    return [spatialLength(prop, a, b, v0, v1)];
  }
  const out: number[] = [];
  for (let d = 0; d < dims; d += 1) {
    out.push(d < v0.length && d < v1.length ? Number(v1[d]) - Number(v0[d]) : 0);
  }
  return out;
}

function chordLength(prop: any, a: number, b: number): number {
  const v0 = toArray(prop.keyValue(a));
  const v1 = toArray(prop.keyValue(b));
  let sq = 0;
  for (let d = 0; d < Math.min(v0.length, v1.length); d += 1) {
    sq += (Number(v1[d]) - Number(v0[d])) * (Number(v1[d]) - Number(v0[d]));
  }
  return Math.sqrt(sq);
}

function readKeyFlags(prop: any, idx: number): any {
  const f: any = { tAuto: false, tCont: false, sAuto: false, sCont: false };
  try { f.tAuto = prop.keyTemporalAutoBezier(idx); f.tCont = prop.keyTemporalContinuous(idx); } catch (e) {}
  if (prop.isSpatial) {
    try { f.sAuto = prop.keySpatialAutoBezier(idx); f.sCont = prop.keySpatialContinuous(idx); } catch (e) {}
  }
  return f;
}

function applyTemporalFlags(prop: any, idx: number, f: any): void {
  try {
    prop.setTemporalContinuousAtKey(idx, f.tCont);
    if (f.tAuto) prop.setTemporalAutoBezierAtKey(idx, true);
  } catch (e) {}
}

function applySpatialFlags(prop: any, idx: number, f: any): void {
  try {
    prop.setSpatialContinuousAtKey(idx, f.sCont);
    if (f.sAuto) prop.setSpatialAutoBezierAtKey(idx, true);
  } catch (e) {}
}

export function doCopy(): string {
  try {
    const comp = resolveActiveComp();
    if (!comp) return fail("Select a composition.");
    if (!comp.selectedLayers || comp.selectedLayers.length === 0) return fail("Select a layer.");

    const props = comp.selectedProperties;
    let selectedKeyCount = 0;
    let source: any = null;
    let sourceSegs: { a: number; b: number }[] = [];

    for (let p = 0; p < props.length; p += 1) {
      const prop: any = props[p];
      if (!isAnimatableProp(prop)) continue;
      const raw = prop.selectedKeys;
      if (!raw || raw.length === 0) continue;
      selectedKeyCount += raw.length;
      if (!source) {
        const segs = getSelectedSegments(prop);
        if (segs.length > 0) { source = prop; sourceSegs = segs; }
      }
    }

    if (selectedKeyCount < 2) return fail("Select at least 2 keyframes.");
    if (!source) return fail("Select at least 2 consecutive keyframes on the same property.");

    const segments: any[] = [];
    let validCurves = 0;

    for (let s = 0; s < sourceSegs.length; s += 1) {
      const a = sourceSegs[s].a;
      const b = sourceSegs[s].b;
      const duration = source.keyTime(b) - source.keyTime(a);

      const seg: any = {
        outInterp: source.keyOutInterpolationType(a),
        inInterp: source.keyInInterpolationType(b),
        aFlags: readKeyFlags(source, a),
        bFlags: readKeyFlags(source, b),
        chord: chordLength(source, a, b),
        outTan: null,
        inTan: null,
        curve: null,
      };

      if (source.isSpatial) {
        try {
          seg.outTan = toArray(source.keyOutSpatialTangent(a)).slice();
          seg.inTan = toArray(source.keyInSpatialTangent(b)).slice();
        } catch (e) {}
      }

      if (duration > 0) {
        seg.curve = getNormalizedCurve(source, a, b);
        if (seg.curve) validCurves += 1;
      }
      segments.push(seg);
    }

    if (validCurves === 0) {
      return fail("Select at least 2 keyframes with different values and Bezier interpolation.");
    }

  copiedData = { segments: segments };

  let first: any = null;
  for (let i = 0; i < segments.length; i += 1) {
    if (segments[i].curve) { first = segments[i].curve; break; }
  }
  const bezier =
    first.x1.toFixed(2) + ", " + first.y1.toFixed(2) + ", " +
    first.x2.toFixed(2) + ", " + first.y2.toFixed(2);

  return ok({ message: "Curve copied", bezier: bezier });
  } catch (error: any) {
    return fail(error.toString());
  }
}

export function doPaste(): string {
  let undoOpen = false;
  try {
    if (!copiedData || !copiedData.segments || copiedData.segments.length === 0) {
      return fail("Copy a curve first.");
    }
    const comp = resolveActiveComp();
    if (!comp) return fail("Select a composition.");
    if (!comp.selectedLayers || comp.selectedLayers.length === 0) return fail("Select a layer.");

    const props = comp.selectedProperties;
    let selectedKeyCount = 0;
    const targets: { prop: any; segs: { a: number; b: number }[] }[] = [];

    for (let p = 0; p < props.length; p += 1) {
      const prop: any = props[p];
      if (!isAnimatableProp(prop)) continue;
      const raw = prop.selectedKeys;
      if (!raw || raw.length === 0) continue;
      selectedKeyCount += raw.length;
      const segs = getSelectedSegments(prop);
      if (segs.length > 0) targets.push({ prop: prop, segs: segs });
    }

    if (selectedKeyCount < 2) return fail("Select at least 2 keyframes.");
    if (targets.length === 0) return fail("Select at least 2 consecutive keyframes on the same property.");

    const srcSegs: any[] = copiedData.segments;
    let applied = 0;

    app.beginUndoGroup("Paste Graph");
    undoOpen = true;

    for (let t = 0; t < targets.length; t += 1) {
      const prop = targets[t].prop;
      const segs = targets[t].segs;

      for (let j = 0; j < segs.length; j += 1) {
        const a = segs[j].a;
        const b = segs[j].b;
        const src = srcSegs[j % srcSegs.length];

        try {
          prop.setInterpolationTypeAtKey(a, prop.keyInInterpolationType(a), src.outInterp);
          prop.setInterpolationTypeAtKey(b, src.inInterp, prop.keyOutInterpolationType(b));
        } catch (e) {}

        if (prop.isSpatial && src.outTan && src.inTan) {
          try {
            const ratio = src.chord > 0 ? chordLength(prop, a, b) / src.chord : 1;
            const curInA = toArray(prop.keyInSpatialTangent(a));
            const curOutB = toArray(prop.keyOutSpatialTangent(b));
            if (curInA.length === src.outTan.length && curOutB.length === src.inTan.length) {
              const scaledOut: number[] = [];
              const scaledIn: number[] = [];
              for (let d = 0; d < src.outTan.length; d += 1) scaledOut.push(Number(src.outTan[d]) * ratio);
              for (let d = 0; d < src.inTan.length; d += 1) scaledIn.push(Number(src.inTan[d]) * ratio);
              prop.setSpatialTangentsAtKey(a, curInA, scaledOut);
              prop.setSpatialTangentsAtKey(b, scaledIn, curOutB);
              applySpatialFlags(prop, a, src.aFlags);
              applySpatialFlags(prop, b, src.bFlags);
            }
          } catch (e) {}
        }
      }

      for (let j = 0; j < segs.length; j += 1) {
        const a = segs[j].a;
        const b = segs[j].b;
        const src = srcSegs[j % srcSegs.length];
        if (!src.curve) continue;

        const duration = prop.keyTime(b) - prop.keyTime(a);
        if (!(duration > 0)) continue;

        try {
          const curInA = prop.keyInTemporalEase(a);
          const curOutA = prop.keyOutTemporalEase(a);
          const curInB = prop.keyInTemporalEase(b);
          const curOutB = prop.keyOutTemporalEase(b);
          const dims = Math.min(curOutA.length, curInB.length);
          const deltas = getSegmentDeltas(prop, a, b, dims);

          const outInf = Math.max(0.1, Math.min(100, src.curve.x1 * 100));
          const inInf = Math.max(0.1, Math.min(100, (1 - src.curve.x2) * 100));

          const newOut: any[] = [];
          const newIn: any[] = [];
          for (let d = 0; d < dims; d += 1) {
            const delta = deltas[d];
            const flat = !isFinite(delta) || Math.abs(delta) < 0.0000001;
            const outSpeed = flat ? 0 : (src.curve.y1 * delta) / (duration * (outInf / 100));
            const inSpeed = flat ? 0 : ((1 - src.curve.y2) * delta) / (duration * (inInf / 100));
            newOut.push(new KeyframeEase(outSpeed, outInf));
            newIn.push(new KeyframeEase(inSpeed, inInf));
          }
          for (let d = dims; d < curOutA.length; d += 1) newOut.push(curOutA[d]);
          for (let d = dims; d < curInB.length; d += 1) newIn.push(curInB[d]);

          prop.setTemporalEaseAtKey(a, curInA, newOut);
          prop.setTemporalEaseAtKey(b, newIn, prop.keyOutTemporalEase(b));
          applyTemporalFlags(prop, a, src.aFlags);
          applyTemporalFlags(prop, b, src.bFlags);
          applied += 1;
        } catch (e) {}
      }
    }

    app.endUndoGroup();
    undoOpen = false;

    if (applied === 0) return fail("Nothing pasted: target keyframes must be Bezier with different values.");
    return ok({ message: "Pasted " + applied + " segment(s)" });
  } catch (error: any) {
    if (undoOpen) app.endUndoGroup();
    return fail(error.toString());
  }
}

function MathClampValue(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

function CreateTheCurve(
  selectedProperty: Property,
  selectedKeys: number[] | number,
  i: number | KeyframeEase,
  easeIn: KeyframeEase,
  easeOut?: KeyframeEase,
  start?: number,
  end?: number,
): void {
  if (typeof selectedKeys === "number") {
    selectedProperty.setTemporalEaseAtKey(
      selectedKeys,
      [i as KeyframeEase],
      [easeIn],
    );
    return;
  }

  if (easeOut === undefined || start === undefined || end === undefined) return;
  switch (selectedProperty.propertyValueType) {
    case 6417:
    case 6413:
      if (i === start) selectedProperty.setTemporalEaseAtKey(selectedKeys[i], selectedProperty.keyInTemporalEase(selectedKeys[i]) as [KeyframeEase], [easeOut]);
      else if (i === end) selectedProperty.setTemporalEaseAtKey(selectedKeys[i], [easeIn], selectedProperty.keyOutTemporalEase(selectedKeys[i]) as [KeyframeEase]);
      else selectedProperty.setTemporalEaseAtKey(selectedKeys[i], [easeIn], [easeOut]);
      break;
    case 6414:
      if (i === start) selectedProperty.setTemporalEaseAtKey(selectedKeys[i], selectedProperty.keyInTemporalEase(selectedKeys[i]) as [KeyframeEase, KeyframeEase, KeyframeEase], [easeOut, easeOut, easeOut]);
      else if (i === end) selectedProperty.setTemporalEaseAtKey(selectedKeys[i], [easeIn, easeIn, easeIn], selectedProperty.keyOutTemporalEase(selectedKeys[i]) as [KeyframeEase, KeyframeEase, KeyframeEase]);
      else selectedProperty.setTemporalEaseAtKey(selectedKeys[i], [easeIn, easeIn, easeIn], [easeOut, easeOut, easeOut]);
      break;
    case 6416:
      if (i === start) selectedProperty.setTemporalEaseAtKey(selectedKeys[i], selectedProperty.keyInTemporalEase(selectedKeys[i]) as [KeyframeEase, KeyframeEase], [easeOut, easeOut]);
      else if (i === end) selectedProperty.setTemporalEaseAtKey(selectedKeys[i], [easeIn, easeIn], selectedProperty.keyOutTemporalEase(selectedKeys[i]) as [KeyframeEase, KeyframeEase]);
      else selectedProperty.setTemporalEaseAtKey(selectedKeys[i], [easeIn, easeIn], [easeOut, easeOut]);
      break;
    default:
      if (i === start) selectedProperty.setTemporalEaseAtKey(selectedKeys[i], selectedProperty.keyInTemporalEase(selectedKeys[i]) as [KeyframeEase], [easeOut]);
      else if (i === end) selectedProperty.setTemporalEaseAtKey(selectedKeys[i], [easeIn], selectedProperty.keyOutTemporalEase(selectedKeys[i]) as [KeyframeEase]);
      else selectedProperty.setTemporalEaseAtKey(selectedKeys[i], [easeIn], [easeOut]);
  }
}

function OutSourcedCurves(selectedProperty: Property, selectedKeys: number[], x1: number, y1: number, x2: number, y2: number, original_x2: number, original_y2: number): void {
  if (selectedKeys.length > 0) {
    for (let i = 0; i < selectedKeys.length; i += 1) {
      if (x1 <= 0.01 && y1 <= 0.01 && original_x2 >= 0.99 && original_y2 >= 0.99) {
        selectedProperty.setInterpolationTypeAtKey(selectedKeys[i], KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
      } else {
        const end = selectedKeys.length - 1;
        const start = 0;
        const easeIn2 = new KeyframeEase(0, 0.1);
        const easeOut2 = new KeyframeEase(0, 0.1);

        CreateTheCurve(selectedProperty, selectedKeys, i, easeIn2, easeOut2, start, end);

        if (i === start) selectedProperty.setInterpolationTypeAtKey(selectedKeys[i], KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.LINEAR);
        else if (i === end) selectedProperty.setInterpolationTypeAtKey(selectedKeys[i], KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.BEZIER);
        else selectedProperty.setInterpolationTypeAtKey(selectedKeys[i], KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);

        const arvSpeedIn: number = selectedProperty.keyInTemporalEase(selectedKeys[i])[0].speed;
        const arvSpeedOut: number = selectedProperty.keyOutTemporalEase(selectedKeys[i])[0].speed;
        const influenceIn: number = MathClampValue(x2 * 100, 0.1, 100);
        const influenceOut: number = MathClampValue(x1 * 100, 0.1, 100);

        const bruhIn: number = x2 <= 0 ? 1000 : 1 / x2;
        const bruhOut: number = x1 <= 0 ? 1000 : 1 / x1;

        const constSpeedIn: number = y2 * arvSpeedIn * bruhIn;
        const constSpeedOut: number = y1 * arvSpeedOut * bruhOut;

        const easeIn = new KeyframeEase(parseFloat(Number(constSpeedIn).toFixed(2)), influenceIn);
        const easeOut = new KeyframeEase(parseFloat(Number(constSpeedOut).toFixed(2)), influenceOut);

        CreateTheCurve(selectedProperty, selectedKeys, i, easeIn, easeOut, start, end);
      }
    }
  }
}

export function ApplyCurveToKeyFramesExcalibur(x1: number, y1: number, x2: number, y2: number): string {
  try {
    const comp = resolveActiveComp();
    if (!comp) return fail("Select a composition.");
    if (!comp.selectedLayers || comp.selectedLayers.length === 0) return fail("Select at least one layer.");

    app.beginUndoGroup("Excalibur Curves");
    const original_x2: number = x2;
    const original_y2: number = y2;
    x2 = 1 - x2; y2 = 1 - y2;

    for (let l = 0; l < comp.selectedLayers.length; l += 1) {
      const selectedLayer: any = comp.selectedLayers[l];
      if (selectedLayer && selectedLayer.selectedProperties) {
        for (let f = 0; f < selectedLayer.selectedProperties.length; f += 1) {
          const selectedProperty: Property = selectedLayer.selectedProperties[f] as Property;
          if (selectedProperty && selectedProperty.selectedKeys && selectedProperty.selectedKeys.length > 0) {
            OutSourcedCurves(selectedProperty, selectedProperty.selectedKeys, x1, y1, x2, y2, original_x2, original_y2);
          }
        }
      }
    }

    app.endUndoGroup();
    return ok();

  } catch (error: any) {
    if (app.project) app.endUndoGroup();

    return JSON.stringify({ status: "ERROR", message: error.toString() }); 
  }
}

export function applyIn(): string {     
    app.beginUndoGroup("Excalibur Set Layers time to in");
    var comp = app.project.activeItem;
    if (comp instanceof CompItem) {
        var myLayers = comp.selectedLayers;
        if (myLayers.length > 0) {
            for (var i = 0; i < myLayers.length; i += 1) {
                var inPoint = Math.min(myLayers[i].inPoint, myLayers[i].outPoint);
                var outPoint = Math.max(myLayers[i].inPoint, myLayers[i].outPoint);
                myLayers[i].startTime = comp.time + (myLayers[i].startTime - inPoint);
            }
        }
    } else {
        alert("Please select a composition.");
    }
    app.endUndoGroup();
    return ok();
}



export function applyOut(): string {
    app.beginUndoGroup("Excalibur Set Layers time to out");
    var comp = app.project.activeItem;
    if (comp instanceof CompItem) {
        var myLayers = comp.selectedLayers;
        if (myLayers.length > 0) {
            for (var i = 0; i < myLayers.length; i += 1) {
                var inPoint = Math.min(myLayers[i].inPoint, myLayers[i].outPoint);
                var outPoint = Math.max(myLayers[i].inPoint, myLayers[i].outPoint);
                myLayers[i].startTime = comp.time + (myLayers[i].startTime - outPoint);
            }
        }
    } else {
        alert("Please select a composition.");
    }
    app.endUndoGroup();
      return ok();
    }

export function moveAnchor(position: string): string {
  app.beginUndoGroup("Anchor Tool");
  var comp = resolveActiveComp();
  if (!comp) { app.endUndoGroup(); return fail("Select a composition."); }
  if (comp.selectedLayers.length === 0) { app.endUndoGroup(); return fail("Select at least one layer."); }

  var horizontal, vertical;
  switch (position) {
    case "tl": horizontal = "left"; vertical = "top"; break;
    case "tc": horizontal = "center"; vertical = "top"; break;
    case "tr": horizontal = "right"; vertical = "top"; break;
    case "cl": horizontal = "left"; vertical = "center"; break;
    case "cc": horizontal = "center"; vertical = "center"; break;
    case "cr": horizontal = "right"; vertical = "center"; break;
    case "bl": horizontal = "left"; vertical = "bottom"; break;
    case "bc": horizontal = "center"; vertical = "bottom"; break;
    case "br": horizontal = "right"; vertical = "bottom"; break;
    default: horizontal = "center"; vertical = "center";
  }

  for (var i = 0; i < comp.selectedLayers.length; i++) {
    var layer = comp.selectedLayers[i];

    try {
      var rect;
      try {
        rect = layer.sourceRectAtTime(comp.time, true);
      }
      catch (err) {
        rect = { left: 0, top: 0, width: layer.width, height: layer.height };
      }

      var x, y;

      if (horizontal === "left") x = rect.left;
      else if (horizontal === "center") x = rect.left + rect.width / 2;
      else x = rect.left + rect.width;

      if (vertical === "top") y = rect.top;
      else if (vertical === "center") y = rect.top + rect.height / 2;
      else y = rect.top + rect.height;

      var oldAnchor = layer.anchorPoint.value;
      var oldPos = layer.position.value;

      var newAnchor = [x, y];

      var deltaX = newAnchor[0] - oldAnchor[0];
      var deltaY = newAnchor[1] - oldAnchor[1];

      layer.anchorPoint.setValue(newAnchor);

      if (oldPos.length === 2) {
        layer.position.setValue([oldPos[0] + deltaX, oldPos[1] + deltaY]);
      }
      else {
        layer.position.setValue([oldPos[0] + deltaX, oldPos[1] + deltaY, oldPos[2]]);
      }
    }
    catch (e) { }
  }

  app.endUndoGroup();
  return ok();
}





export function applyRotation(degrees: number): string {
  app.beginUndoGroup("Apply Rotation");
  var comp = resolveActiveComp();
  if (!comp) { app.endUndoGroup(); return fail("Select a composition."); }
  if (comp.selectedLayers.length === 0) { app.endUndoGroup(); return fail("Select at least one layer."); }

  for (var i = 0; i < comp.selectedLayers.length; i++) {
    try { comp.selectedLayers[i].rotation.setValue(comp.selectedLayers[i].rotation.value + degrees); } catch (e) {}
  }
  app.endUndoGroup();
  return ok();
}

export function resetRotation(): string {
  app.beginUndoGroup("Reset Rotation");
  var comp = resolveActiveComp();
  if (!comp) { app.endUndoGroup(); return fail("Select a composition."); }
  for (var i = 0; i < comp.selectedLayers.length; i++) {
    try { comp.selectedLayers[i].rotation.setValue(0); } catch (e) {}
  }
  app.endUndoGroup();
  return ok();
}

export function scaleCompToOneToOne(scaleMultiplier: number): string {
    app.beginUndoGroup("Excalibur Scale to comp (1/1 with multiplier)");
    try {
    var comp = resolveActiveComp();
    if (!comp) throw new Error("Open a composition first.");
    if (!comp.selectedLayers || comp.selectedLayers.length === 0) throw new Error("Select at least one layer.");

    var multiplier = (typeof scaleMultiplier === "number" && !isNaN(scaleMultiplier)) ? scaleMultiplier : 1;
    var applied = 0;
    var firstFailure = "";

    for (var i = 0; i < comp.selectedLayers.length; i += 1) {
      var targetLayer = comp.selectedLayers[i];
      if (!targetLayer || targetLayer.locked) continue;

      try {
        var transform = targetLayer.property("ADBE Transform Group");
        var scaleProp = transform ? transform.property("ADBE Scale") : null;
        var posProp = transform ? transform.property("ADBE Position") : null;
        var layerWidth = Number(targetLayer.width);
        var layerHeight = Number(targetLayer.height);
        if ((!layerWidth || !layerHeight) && targetLayer.source) {
          layerWidth = Number(targetLayer.source.width);
          layerHeight = Number(targetLayer.source.height);
        }
        if (!scaleProp || !posProp || !layerWidth || !layerHeight) {
          if (!firstFailure) firstFailure = "The selected layer has no usable Scale, Position, or source dimensions.";
          continue;
        }

        var scaleX = ((comp.width / layerWidth) * 100) * multiplier;
        var scaleY = ((comp.height / layerHeight) * 100) * multiplier;
        var scaleValue = scaleProp.value;
        var positionValue = posProp.value;
        var nextScale = [scaleX, scaleY];
        var nextPosition = [comp.width / 2, comp.height / 2];

        if (scaleValue.length > 2) nextScale.push(scaleValue[2]);
        if (positionValue.length > 2) nextPosition.push(positionValue[2]);

        scaleProp.setValue(nextScale);
        if (posProp.dimensionsSeparated) {
          posProp.getSeparationFollower(0).setValue(comp.width / 2);
          posProp.getSeparationFollower(1).setValue(comp.height / 2);
        } else {
          posProp.setValue(nextPosition);
        }
        applied += 1;
      } catch (layerError: any) {
        if (!firstFailure) firstFailure = layerError.toString();
      }
    }

    if (applied === 0) {
      throw new Error(firstFailure || "No selected unlocked layer could be scaled to the composition.");
    }
    return ok({ applied: applied });
    } catch (e: any) {
        alert("Error: " + e.toString());
    } finally {
        app.endUndoGroup();
    }
  return fail("Unable to scale the selected layers to the composition.");
}

function ensureSelectionOrError(comp: any): any[] {
  if (!comp.selectedLayers || comp.selectedLayers.length === 0) throw new Error("Select at least one layer.");
  return comp.selectedLayers;
}

function GetColorPicker(startValue : number[], comp: any): number[] {
    if ((!startValue) || (startValue.length != 3)) {
        startValue = [1, 1, 1];
    }
    app.beginUndoGroup("Seleced color");
    var selectedLayers = [];
    for (var i = 1; i <= comp.numLayers; i += 1) {
        if (comp.layer(i).selected) {
            selectedLayers.push(i);
        }
    }
    var newNull = comp.layers.addNull();
    var newColorControl = newNull.property("ADBE Effect Parade").addProperty("ADBE Color Control");
    var theColorProp = newColorControl.property("ADBE Color Control-0001");
    var origShyCondition = comp.hideShyLayers;
    newNull.enabled = false;
    theColorProp.setValue(startValue);
    app.endUndoGroup();
    theColorProp.selected = true;
    app.executeCommand(2240);
    app.beginUndoGroup("Seleced color");
    var result = theColorProp.value;
    if (newNull) {
        newNull.remove();
    }
    comp.hideShyLayers = origShyCondition;
    for (var i = 0; i < selectedLayers.length; i += 1) {
        comp.layer(selectedLayers[i]).selected = true;
    }
    app.endUndoGroup();
    return result;
}


export function addSolidLayer(color_layer: number = 0): string {
    var myComp = app.project.activeItem;
    if (myComp instanceof CompItem) {
        var color = GetColorPicker([1, 1, 1], myComp);
        app.beginUndoGroup("Solid");
        var myLayers = myComp.selectedLayers;
        if (myLayers.length > 0) {
            var newInPoint = myLayers[0].inPoint;
            var newOutPoint = myLayers[0].outPoint;
            var layerIndices = [];
            var lowest_index = 999999;
            var lowest = 999999;
            for (var i = 0; i < myLayers.length; i += 1) {
                if (myLayers[i].index < lowest_index) {
                    lowest = i;
                    lowest_index = myLayers[i].index;
                }
                layerIndices.push(myLayers[i].index);
                var inPoint = Math.min(myLayers[i].inPoint, myLayers[i].outPoint);
                var outPoint = Math.max(myLayers[i].inPoint, myLayers[i].outPoint);
                if (inPoint < newInPoint) {
                    newInPoint = inPoint;
                }
                if (outPoint > newOutPoint) {
                    newOutPoint = outPoint;
                }
                continue;
            }
            var solid = myComp.layers.addSolid([color[0], color[1], color[2]], "Solid", myComp.width, myComp.height, 1, newOutPoint - newInPoint);
            solid.moveBefore(myLayers[lowest]);
            solid.startTime = newInPoint;
            solid.label = Number(color_layer);
        } else {
            var solid = myComp.layers.addSolid([color[0], color[1], color[2]], "Solid", myComp.width, myComp.height, 1);
            solid.label = Number(color_layer);
        }
        app.endUndoGroup();
    } else {
        alert("Please select a composition.");
    }
  return ok();
}

function createPrecutNullSelected_0(myComp: any, myLayers: any[], color: number): any {
  if (myLayers.length > 0) {
    var newInPoint = myLayers[0].inPoint;
    var newOutPoint = myLayers[0].outPoint;
    var topLayer = myLayers[0]; 
    for (var i = 0; i < myLayers.length; i += 1) {
      if (myLayers[i].index < topLayer.index) topLayer = myLayers[i]; 
      var inPoint = Math.min(myLayers[i].inPoint, myLayers[i].outPoint);
      var outPoint = Math.max(myLayers[i].inPoint, myLayers[i].outPoint);
      if (inPoint < newInPoint) newInPoint = inPoint;
      if (outPoint > newOutPoint) newOutPoint = outPoint;
    }
    var nullLayer = myComp.layers.addNull();
    nullLayer.anchorPoint.setValue([50, 50]);
    nullLayer.startTime = newInPoint;
    nullLayer.outPoint = newOutPoint;
    nullLayer.moveBefore(topLayer); 
    nullLayer.label = Number(color);
    return nullLayer;
  } else {
    var nullLayer = myComp.layers.addNull();
    nullLayer.anchorPoint.setValue([50, 50]);
    nullLayer.label = Number(color);
    return nullLayer;
  }
}

export function addNullLayer(color: number = 0): string {
  var myComp = resolveActiveComp();
  if (!myComp) return fail("Select a composition.");
  app.beginUndoGroup("Excalibur Create Null");
  createPrecutNullSelected_0(myComp, myComp.selectedLayers, color);
  app.endUndoGroup();
  return ok();
}

function createCenteredTextLayer_0(myComp: any, myLayers: any[], text: string, color: number): void {
  if (myLayers.length > 0) {
    var newInPoint = myLayers[0].inPoint;
    var newOutPoint = myLayers[0].outPoint;
    var topLayer = myLayers[0]; 
    for (var i = 0; i < myLayers.length; i += 1) {
      if (myLayers[i].index < topLayer.index) topLayer = myLayers[i]; 
      var inPoint = Math.min(myLayers[i].inPoint, myLayers[i].outPoint);
      var outPoint = Math.max(myLayers[i].inPoint, myLayers[i].outPoint);
      if (inPoint < newInPoint) newInPoint = inPoint;
      if (outPoint > newOutPoint) newOutPoint = outPoint;
    }
    var textLayer = myComp.layers.addText(text);
    textLayer.startTime = newInPoint;
    textLayer.outPoint = newOutPoint;
    var sourceRect = textLayer.sourceRectAtTime(0, false);
    textLayer.anchorPoint.setValue([(sourceRect.width / 2) + sourceRect.left, (sourceRect.height / 2) + sourceRect.top]);
    textLayer.position.setValue([myComp.width / 2, myComp.height / 2]);
    textLayer.label = Number(color);
    textLayer.moveBefore(topLayer); 
  } else {
    var textLayer = myComp.layers.addText(text);
    var sourceRect = textLayer.sourceRectAtTime(0, false);
    textLayer.anchorPoint.setValue([(sourceRect.width / 2) + sourceRect.left, (sourceRect.height / 2) + sourceRect.top]);
    textLayer.position.setValue([myComp.width / 2, myComp.height / 2]);
    textLayer.label = Number(color);
  }
}

export function addTextLayer(color: number = 0): string {
  var myComp = resolveActiveComp();
  if (!myComp) return fail("Select a composition.");
  app.beginUndoGroup("Excalibur Create Text Layer");
  createCenteredTextLayer_0(myComp, myComp.selectedLayers, "Text", color);
  app.endUndoGroup();
  return ok();
}

function createPrecutCameraAboveSelected_0(myComp: any, myLayers: any[], cameraName: string, focalLengthInMm: number, color: number): any {
  var filmSize = 36;
  var zoomValue = (myComp.width * focalLengthInMm) / filmSize;
  var cameraLayer = myComp.layers.addCamera(cameraName, [myComp.width / 2, myComp.height / 2]);
  cameraLayer.cameraOption.zoom.setValue(zoomValue);
  cameraLayer.position.setValue([myComp.width / 2, myComp.height / 2, -zoomValue]);
  cameraLayer.property("Point of Interest").setValue([myComp.width / 2, myComp.height / 2, 0]);
  if (myLayers.length > 0) {
    var newInPoint = myLayers[0].inPoint;
    var newOutPoint = myLayers[0].outPoint;
    var topLayer = myLayers[0]; 
    for (var i = 0; i < myLayers.length; i += 1) {
      if (myLayers[i].index < topLayer.index) topLayer = myLayers[i]; 
      var inPoint = Math.min(myLayers[i].inPoint, myLayers[i].outPoint);
      var outPoint = Math.max(myLayers[i].inPoint, myLayers[i].outPoint);
      if (inPoint < newInPoint) newInPoint = inPoint;
      if (outPoint > newOutPoint) newOutPoint = outPoint;
    }
    cameraLayer.startTime = newInPoint;
    cameraLayer.outPoint = newOutPoint;
    cameraLayer.moveBefore(topLayer); 
  }
  cameraLayer.label = Number(color);
  return cameraLayer;
}

export function addCameraLayer(color: number = 0, focalLength: number = 35): string {
  var myComp = resolveActiveComp();
  if (!myComp) return fail("Select a composition.");
  app.beginUndoGroup("Excalibur Create Camera");
  createPrecutCameraAboveSelected_0(myComp, myComp.selectedLayers, "Camera", focalLength, color);
  app.endUndoGroup();
  return ok();
}

export function addAdjustmentLayer(color: number = 0, createLayerCompOnSelected: boolean = false): string {
  var myComp = resolveActiveComp();
  if (!myComp) return fail("Select a composition.");
  app.beginUndoGroup("Excalibur Adjustment Layer");

  var myLayers = myComp.selectedLayers;

  if (createLayerCompOnSelected === true) {
    if (myLayers.length <= 0) {
      var solid = myComp.layers.addSolid(returnColorFunc(Number(color)), "Adjustment Layer", myComp.width, myComp.height, 1);
      solid.adjustmentLayer = true;
      solid.label = Number(color);
    } else {
      for (var i = 0; i < myLayers.length; i += 1) {
        var inPoint = Math.min(myLayers[i].inPoint, myLayers[i].outPoint);
        var outPoint = Math.max(myLayers[i].inPoint, myLayers[i].outPoint);
        var solid = myComp.layers.addSolid(returnColorFunc(Number(color)), "Adjustment Layer", myComp.width, myComp.height, 1, outPoint - inPoint);
        solid.adjustmentLayer = true;
        solid.moveBefore(myLayers[i]); 
        solid.startTime = inPoint;
        solid.label = Number(color);
      }
    }
  } else {
    if (myLayers.length > 0) {
      var newInPoint = myLayers[0].inPoint;
      var newOutPoint = myLayers[0].outPoint;
      var topLayer = myLayers[0]; 
      for (var i = 0; i < myLayers.length; i += 1) {
        if (myLayers[i].index < topLayer.index) topLayer = myLayers[i]; 
        var inPoint = Math.min(myLayers[i].inPoint, myLayers[i].outPoint);
        var outPoint = Math.max(myLayers[i].inPoint, myLayers[i].outPoint);
        if (inPoint < newInPoint) newInPoint = inPoint;
        if (outPoint > newOutPoint) newOutPoint = outPoint;
      }
      var solid = myComp.layers.addSolid(returnColorFunc(Number(color)), "Adjustment Layer", myComp.width, myComp.height, 1, newOutPoint - newInPoint);
      solid.adjustmentLayer = true;
      solid.moveBefore(topLayer); 
      solid.startTime = newInPoint;
      solid.label = Number(color);
    } else {
      var solid = myComp.layers.addSolid(returnColorFunc(Number(color)), "Adjustment Layer", myComp.width, myComp.height, 1);
      solid.adjustmentLayer = true;
      solid.label = Number(color);
    }
  }

  app.endUndoGroup();
  return ok();
}

function findPrecompLayer(comp: any, precomp: any): any {
  for (var i = 1; i <= comp.numLayers; i += 1) {
    var layer = comp.layer(i);
    if (layer && layer.source === precomp) {
      return layer;
    }
  }
  return null;
}
function applyColorToPrecompLayer(comp: any, precomp: any, color: number): void {
  var layer = findPrecompLayer(comp, precomp);
  if (layer) {
    layer.label = Number(color);
  }
}

export function createPrecompAllInOne(color: number): string {
  var myComp = resolveActiveComp();
  if (!myComp) return fail("Select a composition.");
  var myLayers = myComp.selectedLayers;
  if (myLayers.length === 0) return fail("Select at least one layer.");

  app.beginUndoGroup("Excalibur Pre-compose Each");
  for (var i = 0; i < myLayers.length; i += 1) {
    var layer = myLayers[i];
    var inPoint = layer.inPoint;
    var outPoint = layer.outPoint;
    myLayers[i].startTime -= inPoint;
    var layerIndex = [layer.index];
    var baseName = layer.name + " PreComp";
    var newCompName = baseName + " (" + getPrecompCount() + ")";
    var newComp = myComp.layers.precompose(layerIndex, newCompName, true);
    newComp.duration = outPoint - inPoint;
    var preCompLayer = findPrecompLayer(myComp, newComp);
    if (preCompLayer) {
      preCompLayer.startTime = inPoint;
    }
    applyColorToPrecompLayer(myComp, newComp, color);
  }
  app.endUndoGroup();
  return ok();
}

export function createPrecompAllInOneWithSelection(color: number): string {
  var myComp = resolveActiveComp();
  if (!myComp) return fail("Select a composition.");
  var myLayers = myComp.selectedLayers;
  if (!myLayers || myLayers.length === 0) return fail("Select at least one layer.");

  app.beginUndoGroup("Excalibur Pre-compose Together");
  var newInPoint = myLayers[0].inPoint;
  var newOutPoint = myLayers[0].outPoint;
  var layerIndices = [];
  
  for (var i = 0; i < myLayers.length; i += 1) {
    var layer = myLayers[i];
    layerIndices.push(layer.index);
    var inPoint = Math.min(layer.inPoint, layer.outPoint);
    var outPoint = Math.max(layer.inPoint, layer.outPoint);
    if (inPoint < newInPoint) newInPoint = inPoint;
    if (outPoint > newOutPoint) newOutPoint = outPoint;
  }
  
  var offset = newInPoint;
  for (var i = 0; i < myLayers.length; i += 1) {
    myLayers[i].startTime -= offset;
  }
  
  myLayers.sort(function(a: any, b: any) { return b.index - a.index; });
  
  var lowestLayerName = myLayers[0].name;
  var baseName = lowestLayerName.replace(/ PreComp(\s\(\d+\))?$/, "");
  var newCompName = baseName + " PreComp (" + getPrecompCount() + ")";

  var precomposeIndices = layerIndices.length === 1 ? [layerIndices[0]] : layerIndices;
  var newComp = myComp.layers.precompose(precomposeIndices, newCompName, true);
  newComp.duration = newOutPoint - offset;
  
  var preCompLayer = findPrecompLayer(myComp, newComp);
  if (preCompLayer) {
    preCompLayer.startTime = offset;
  }
  applyColorToPrecompLayer(myComp, newComp, color);
  
  app.endUndoGroup();
  return ok();
}



function getNextBlendingMode(project: Project): FrameBlendingType {
  for (var i = 1; i <= project.rootFolder.items.length; i += 1) {
    var item = project.rootFolder.items[i];
    var mode = findCurrentBlendingMode(item);
    if (mode !== null) {
      return mode === FrameBlendingType.FRAME_MIX
        ? FrameBlendingType.PIXEL_MOTION
        : FrameBlendingType.FRAME_MIX;
    }
  }
  return FrameBlendingType.FRAME_MIX;
}

function findCurrentBlendingMode(item: any): FrameBlendingType | null {
  if (item instanceof CompItem) {
    for (var j = 1; j <= item.numLayers; j += 1) {
      var layer = item.layer(j);
      if (layer instanceof AVLayer && layer.frameBlendingType !== FrameBlendingType.NO_FRAME_BLEND) {
        return layer.frameBlendingType;
      }
    }
  } else if (item instanceof FolderItem) {
    for (var k = 1; k <= item.items.length; k += 1) {
      var found = findCurrentBlendingMode(item.items[k]);
      if (found !== null) return found;
    }
  }
  return null;
}

function setFrameBlendingOnLayer(layer: any, blendType: FrameBlendingType) {
  if (layer instanceof AVLayer) {
    layer.frameBlendingType = blendType;
  }
}

function applyFrameBlendingInComp(comp: any, blendType: FrameBlendingType) {
  for (var i = 1; i <= comp.numLayers; i += 1) {
    var layer = comp.layer(i);
    setFrameBlendingOnLayer(layer, blendType);
    if (layer instanceof AVLayer && layer.source instanceof CompItem) {
      applyFrameBlendingInComp(layer.source, blendType);
    }
  }
}

function applyFrameBlendingInFolder(folder: any, blendType: FrameBlendingType) {
  for (var i = 1; i <= folder.items.length; i += 1) {
    var item = folder.items[i];
    if (item instanceof CompItem) {
      applyFrameBlendingInComp(item, blendType);
    } else if (item instanceof FolderItem) {
      applyFrameBlendingInFolder(item, blendType);
    }
  }
}

export function enableFrameBlendingFunc(): string {
  app.beginUndoGroup("Toggle Frame Blending Mode Project-Wide");
  try {
    if (!app.project) throw new Error("No project open.");

    var myProject = app.project;
    var targetMode = getNextBlendingMode(myProject);

    for (var i = 1; i <= myProject.rootFolder.items.length; i += 1) {
      var item = myProject.rootFolder.items[i];
      if (item instanceof CompItem) {
        applyFrameBlendingInComp(item, targetMode);
      } else if (item instanceof FolderItem) {
        applyFrameBlendingInFolder(item, targetMode);
      }
    }

    app.endUndoGroup();
    return ok();
  } catch (e: any) {
    app.endUndoGroup();
    return fail(e.message);
  }
}

function disableFrameBlendingOnLayer(layer: any) {
  if (layer instanceof AVLayer) {
    layer.frameBlendingType = FrameBlendingType.NO_FRAME_BLEND;
  }
}

function disableFrameBlendingInComp(comp: any) {
  for (var i = 1; i <= comp.numLayers; i += 1) {
    var layer = comp.layer(i);
    disableFrameBlendingOnLayer(layer);
    if (layer instanceof AVLayer && layer.source instanceof CompItem) {
      disableFrameBlendingInComp(layer.source);
    }
  }
}

function disableFrameBlendingInFolder(folder: any) {
  for (var i = 1; i <= folder.items.length; i += 1) {
    var item = folder.items[i];
    if (item instanceof CompItem) {
      disableFrameBlendingInComp(item);
    } else if (item instanceof FolderItem) {
      disableFrameBlendingInFolder(item);
    }
  }
}

export function disableFrameBlendingFunc(): string {
  app.beginUndoGroup("Disable Frame Blending Project-Wide");
  try {
    if (!app.project) throw new Error("No project open.");

    var myProject = app.project;
    for (var i = 1; i <= myProject.rootFolder.items.length; i += 1) {
      var item = myProject.rootFolder.items[i];
      if (item instanceof CompItem) {
        disableFrameBlendingInComp(item);
      } else if (item instanceof FolderItem) {
        disableFrameBlendingInFolder(item);
      }
    }

    app.endUndoGroup();
    return ok();
  } catch (e: any) {
    app.endUndoGroup();
    return fail(e.message);
  }
}

export function SpeedChangeTo(speedMultiplier: number): string {
  app.beginUndoGroup("Set Layer Speed to " + speedMultiplier + "x");
  try {
    var comp = resolveActiveComp();
    if (!comp) throw new Error("Select a composition.");
    if (typeof speedMultiplier !== "number" || !isFinite(speedMultiplier) || speedMultiplier <= 0) {
      throw new Error("Speed must be greater than zero.");
    }

    var layers = ensureSelectionOrError(comp);
    if (!$.global.excaliburSpeedBaselineStates) {
      $.global.excaliburSpeedBaselineStates = {};
    }
    var baselineStates = $.global.excaliburSpeedBaselineStates;
    var changed = 0;
    for (var i = 0; i < layers.length; i += 1) {
      var layer = layers[i];
      if (layer.locked || !layer.stretch || layer.outPoint <= layer.inPoint) continue;

      var layerId = "";
      try { layerId = String(layer.id); } catch (idError: any) {}
      var stateKey = layerId && layerId !== "undefined"
        ? String(comp.id) + ":" + layerId
        : String(comp.id) + ":" + String(layer.index);
      var state = baselineStates[stateKey];
      var currentIn = layer.inPoint;
      var currentOut = layer.outPoint;
      var currentStart = layer.startTime;
      var currentStretch = layer.stretch;
      var stateMatches = state &&
        Math.abs(currentIn - state.lastIn) < 0.0001 &&
        Math.abs(currentOut - state.lastOut) < 0.0001 &&
        Math.abs(currentStart - state.lastStart) < 0.0001 &&
        Math.abs(currentStretch - state.lastStretch) < 0.0001;

      if (!stateMatches) {
        state = {
          inPoint: currentIn,
          outPoint: currentOut,
          startTime: currentStart,
          stretch: currentStretch
        };
        baselineStates[stateKey] = state;
      }

      var newStretch = state.stretch / speedMultiplier;
      var newStart = state.startTime;
      if (speedMultiplier !== 1) {
        var sourceTimeAtIn = (state.inPoint - state.startTime) / (state.stretch / 100);
        newStart = state.inPoint - sourceTimeAtIn * (newStretch / 100);
      }

      layer.stretch = newStretch;
      layer.startTime = newStart;
      layer.inPoint = state.inPoint;
      layer.outPoint = state.outPoint;
      state.lastIn = layer.inPoint;
      state.lastOut = layer.outPoint;
      state.lastStart = layer.startTime;
      state.lastStretch = layer.stretch;
      changed += 1;
    }

    if (changed === 0) throw new Error("No selected unlocked layers could be retimed.");
    app.endUndoGroup();
    return ok({ changed: changed, speed: speedMultiplier });
  } catch (error: any) {
    app.endUndoGroup();
    return fail(error.message || String(error));
  }
}






function setMotionBlurRecursive(comp: CompItem, enabled: boolean, visited: { [id: number]: boolean }): void {
  if (visited[comp.id]) return;
  visited[comp.id] = true;
  comp.motionBlur = enabled;

  for (var i = 1; i <= comp.numLayers; i += 1) {
    var layer = comp.layer(i);

    if (layer instanceof AVLayer) {
      layer.motionBlur = enabled;

      var source = layer.source;
      if (source instanceof CompItem) {
        setMotionBlurRecursive(source, enabled, visited);
      }
    }
  }
}

export function sequenceLayersAction(): string {
  app.beginUndoGroup("Sequence Layers");
  try {
    var comp = resolveActiveComp();
    if (!comp) throw new Error("Select a composition.");

    setMotionBlurRecursive(comp, true, {});

    app.endUndoGroup();
    return ok();
  } catch (e: any) {
    app.endUndoGroup();
    return fail(e.message);
  }
}

export function sequenceLayersFromBottomAction(): string {
  app.beginUndoGroup("Sequence Layers From Bottom");
  try {
    var comp = resolveActiveComp();
    if (!comp) throw new Error("Select a composition.");

    setMotionBlurRecursive(comp, false, {});

    app.endUndoGroup();
    return ok();
  } catch (e: any) {
    app.endUndoGroup();
    return fail(e.message);
  }
}








export function trimCompToSelection(): string {
  app.beginUndoGroup("Trim Comp to Selection");
  try {
    var comp = resolveActiveComp();
    if (!comp) throw new Error("Select a composition.");
    var layers = ensureSelectionOrError(comp);
    var start = Number.MAX_VALUE;
    var end = Number.MIN_VALUE;
    for (var i = 0; i < layers.length; i += 1) {
      start = Math.min(start, layers[i].inPoint);
      end = Math.max(end, layers[i].outPoint);
    }
    comp.workAreaStart = start;
    comp.workAreaDuration = end - start;
    app.endUndoGroup();
    return ok();
  } catch (e: any) {
    app.endUndoGroup(); return fail(e.message);
  }
}

function applyLoopExpression(direction: "in" | "out"): string {
  app.beginUndoGroup(direction === "in" ? "Loop In" : "Loop Out");
  try {
    var comp = resolveActiveComp();
    if (!comp) throw new Error("Select a composition.");
    var layers = ensureSelectionOrError(comp);
    var expr = direction === "in" ? "loopIn(type = \"cycle\")" : "loopOut(type = \"cycle\")";
    var applied = 0;

    for (var i = 0; i < layers.length; i += 1) {
      var layer = layers[i];
      var props = layer.selectedProperties;
      var targets: any[] = [];
      
      if (props && props.length > 0) {
        for (var p = 0; p < props.length; p += 1) {
          if (props[p] instanceof Property && props[p].numKeys > 0) targets.push(props[p]);
        }
      }
      if (targets.length === 0) {
        var transformNames = ["Position", "Scale", "Rotation", "Opacity", "Anchor Point"];
        for (var t = 0; t < transformNames.length; t += 1) {
          try {
            var prop = layer.property("ADBE Transform Group").property(transformNames[t]);
            if (prop && prop.numKeys > 0) targets.push(prop);
          } catch (e: any) {}
        }
      }
      for (var k = 0; k < targets.length; k += 1) {
        try { targets[k].expression = expr; applied++; } catch (e: any) {}
      }
    }
    app.endUndoGroup();
    if (applied === 0) return fail("No animated properties found (select keyframes or an animated layer).");
    return ok({ applied: applied });
  } catch (e: any) {
    app.endUndoGroup(); return fail(e.message);
  }
}

export function loopInSelectedLayerAction(): string { return applyLoopExpression("in"); }
export function loopOutSelectedLayerAction(): string { return applyLoopExpression("out"); }

export function freezeFrameAction(): string {
  app.executeCommand(3695);
  return ok();
}




export function reverseTimeAction(): string {
    app.executeCommand(2135);
  return ok();
  }

  export function reverseKeyframesAction(): string {
    app.executeCommand(3693);
    return ok();
  }

  function isCompUsedAnywhere(comp: CompItem): boolean {
      const proj = app.project;
      for (let i = 1; i <= proj.numItems; i++) {
          const item = proj.item(i);
          if (item instanceof CompItem && item !== comp) {
              for (let j = 1; j <= item.numLayers; j++) {
                  const layer = item.layer(j);
                if (layer instanceof AVLayer && layer.source === comp) {
                    return true;
                }
            }
        }
    }
    return false;
}

export function UnPrecompose(): string {
    var comp = app.project.activeItem;
    if (!(comp && comp instanceof CompItem)) {
        return fail("Un-Precompose: open a comp and select layer(s).");
    }
    var sel = comp.selectedLayers.slice(0);
    if (sel.length === 0) {
        return fail("Un-Precompose: select at least one layer.");
    }

    var warnings: string[] = [];
    var newlyAdded: any[] = [];
    var processedCount = 0;
    var deletedComps: string[] = [];
    var srcCompsToCheck: any[] = [];

    function copyLayerIn(srcLayer: any, targetComp: any): any {
        var savedParent = srcLayer.parent;
        if (savedParent) srcLayer.parent = null;
        var before: { [id: number]: boolean } = {};
        for (var k = 1; k <= targetComp.numLayers; k++) before[targetComp.layer(k).id] = true;
        srcLayer.copyToComp(targetComp);
        if (savedParent) srcLayer.parent = savedParent;
        for (var k = 1; k <= targetComp.numLayers; k++) {
            if (!before[targetComp.layer(k).id]) return targetComp.layer(k);
        }
        return null;
    }

    app.beginUndoGroup("Un-Precompose");
    try {
        for (var s = 0; s < sel.length; s++) {
            var preLayer = sel[s];
            var src = preLayer.source;

            if (!(src && src instanceof CompItem)) {
                newlyAdded.push(preLayer);
                processedCount++;
                continue;
            }

            if (preLayer.canSetTimeRemapEnabled && preLayer.timeRemapEnabled) {
                warnings.push("'" + preLayer.name + "': time-remapped - left as precomp (non-linear mapping).");
                newlyAdded.push(preLayer);
                processedCount++;
                continue;
            }

            if (preLayer.property("ADBE Effect Parade").numProperties > 0 ||
                preLayer.property("ADBE Mask Parade").numProperties > 0) {
                warnings.push("'" + preLayer.name + "': effects/masks on the precomp layer are lost after extraction.");
            }

            if (preLayer.locked) preLayer.locked = false;

            var stretchFactor = preLayer.stretch / 100;
            if (stretchFactor === 0) stretchFactor = 1;

            var offset = preLayer.startTime;
            var preIn = preLayer.inPoint;
            var preOut = preLayer.outPoint;

            for (var k = 1; k <= comp.numLayers; k++) comp.layer(k).selected = false;

            var n = src.numLayers;
            var info: any[] = [];
            for (var i = 1; i <= n; i++) {
                var il = src.layer(i);
                var rec: any = {
                    start: il.startTime, inP: il.inPoint, outP: il.outPoint,
                    locked: il.locked,
                    parentIdx: (il.parent ? il.parent.index : 0),
                    matteIdx: 0, matteType: null
                };
                try {
                    if (il.trackMatteType !== TrackMatteType.NO_TRACK_MATTE) {
                        rec.matteType = il.trackMatteType;
                        rec.matteIdx = il.trackMatteLayer ? il.trackMatteLayer.index : (i - 1);
                    }
                } catch (e) {}
                info.push(rec);
            }

            var copies: any[] = [];
            for (var i = 1; i <= n; i++) {
                var il = src.layer(i);
                var rec = info[i - 1];
                if (rec.locked) il.locked = false;
                var nl = copyLayerIn(il, comp);
                if (rec.locked) il.locked = true;
                if (!nl) { throw new Error("Copy of '" + il.name + "' not found in target comp."); }
                nl.locked = false;
                nl.selected = false;
                nl.moveBefore(preLayer);

                nl.startTime = offset + (rec.start / stretchFactor);
                var tIn = offset + (rec.inP / stretchFactor);
                var tOut = offset + (rec.outP / stretchFactor);

                if (tIn < preOut && tOut > preIn) {
                    if (tIn < preIn) tIn = preIn;
                    if (tOut > preOut) tOut = preOut;
                }
                nl.inPoint = tIn;
                nl.outPoint = tOut;
                copies.push(nl);
            }

            for (var i = 0; i < n; i++) {
                if (info[i].parentIdx > 0) copies[i].parent = copies[info[i].parentIdx - 1];
            }
            for (var i = 0; i < n; i++) {
                if (info[i].matteType !== null && info[i].matteIdx > 0) {
                    try { copies[i].setTrackMatte(copies[info[i].matteIdx - 1], info[i].matteType); }
                    catch (e) { try { copies[i].trackMatteType = info[i].matteType; } catch (e2) {} }
                }
            }
            for (var i = 0; i < n; i++) {
                if (info[i].locked) copies[i].locked = true;
                newlyAdded.push(copies[i]);
            }

            preLayer.remove();
            srcCompsToCheck.push(src); 
            processedCount++;
        }

        var alreadyChecked: { [id: number]: boolean } = {};
        for (var c = 0; c < srcCompsToCheck.length; c++) {
            var srcComp = srcCompsToCheck[c];
            if (alreadyChecked[srcComp.id]) continue;
            alreadyChecked[srcComp.id] = true;

            try {
                if (srcComp.usedIn.length === 0) {
                    var compName = srcComp.name;
                    srcComp.remove();
                    deletedComps.push(compName);
                } else {
                    warnings.push("'" + srcComp.name + "': still used elsewhere - not deleted.");
                }
            } catch (e: any) {
                warnings.push("'" + srcComp.name + "': could not delete (" + e.toString() + ").");
            }
        }

        for (var i = 1; i <= comp.numLayers; i++) comp.layer(i).selected = false;
        for (var i = 0; i < newlyAdded.length; i++) newlyAdded[i].selected = true;

    } catch (err: any) {
        warnings.push("Error: " + err.toString() + (err.line ? " (line " + err.line + ")" : ""));
    } finally {
        app.endUndoGroup();
    }

    if (warnings.length) {
        alert("Un-Precompose:\n" + warnings.join("\n"));
    }

    return ok({ processed: processedCount, deletedComps: deletedComps, warnings: warnings });
}

export function Flip(direction: number): string {
  var PlaceHolderText = "Excalibur Flip on the ";
    switch (direction) {
        case 1:
            PlaceHolderText = "Excalibur Flip on the X axis";
            break;
        case 2:
            PlaceHolderText = "Excalibur Flip on the Y axis";
            break;
    }
    app.beginUndoGroup(PlaceHolderText);
    var comp = app.project.activeItem;
    try {
        if (comp instanceof CompItem) {
            if (comp.selectedLayers.length > 0) {
                for (var i = 0; i < comp.selectedLayers.length; i += 1) {
                    var targetLayer = comp.selectedLayers[i];
                    if (targetLayer) {
                        var currentScale = targetLayer.scale.value;
                        var flippedScale = [0, 0];
                        switch (direction) {
                            case 1:
                                flippedScale = [-currentScale[0], currentScale[1]];
                                break;
                            case 2:
                                flippedScale = [currentScale[0], -currentScale[1]];
                                break;
                        }
                        targetLayer.scale.setValue(flippedScale);
                        comp.openInViewer();
                    }
                }
                app.endUndoGroup();
                return ok({ flipped: comp.selectedLayers.length, axis: direction });
            }
            app.endUndoGroup();
            return fail("Please select one or more layer.");
        }
        app.endUndoGroup();
        return fail("Not in a composition.");
    } catch (e) {
        app.endUndoGroup();
        return fail((e as Error).toString());
    }
}


export function speedToCursorAction(): string {
  app.beginUndoGroup("Speed To Cursor");
  try {
    var comp = resolveActiveComp();
    if (!comp) throw new Error("Select a composition.");
    var layers = ensureSelectionOrError(comp);
    var count = 0;

    for (var i = 0; i < layers.length; i += 1) {
      var layer = layers[i];
      try {
        if (comp.time <= layer.inPoint) continue;

        var oldIn = layer.inPoint;
        var oldOut = layer.outPoint;
        var oldStart = layer.startTime;
        var oldStretch = layer.stretch;
        var oldDuration = oldOut - oldIn;
        var targetDuration = comp.time - oldIn;
        if (oldDuration <= 0 || targetDuration <= 0) continue;
        var sourceTimeAtIn = (oldIn - oldStart) / (oldStretch / 100);
        var newStretch = oldStretch * (targetDuration / oldDuration);
        var newStartTime = oldIn - (sourceTimeAtIn * (newStretch / 100));
        layer.stretch = newStretch;
        layer.startTime = newStartTime;
        layer.inPoint = oldIn;
        layer.outPoint = comp.time;

        count++;
      } catch (e: any) {}
    }
    app.endUndoGroup();
    if (count === 0) return fail("Place the cursor after the start of the selected layer.");
    return ok({ applied: count });
  } catch (e: any) {
    app.endUndoGroup(); return fail(e.message);
  }
}

function getAllEffects() {
    var names = [];
    var effects = app.effects;
    for (var i = 0; i < effects.length; i += 1) {
        names.push(effects[i].displayName);
    }
    return names;
}

export function getEffectCatalog() {
    var catalog = [];
    var effects = app.effects;
    for (var i = 0; i < effects.length; i += 1) {
        var effect = effects[i];
        catalog.push({
            displayName: effect.displayName,
            matchName: effect.matchName || effect.displayName
        });
    }
    return JSON.stringify(catalog);
}

export function getStandardEffectsAndPlugins() {
    var effectArray = getAllEffects();
    return effectArray.toSource();
}

function AE_VersionButDumCuzAdobeIsFuckingStupid() {
    var version = 0;
    version = Number(app.version.substring(0, 2));
    if (version < 20) {
        version += 3;
    }
    return version;
}

function PresetFolderPath() {
    var aeVersion = AE_VersionButDumCuzAdobeIsFuckingStupid();
    var userPresetsFolder;
    if ($.os.indexOf("Mac") !== -1) {
        userPresetsFolder = new Folder(Folder.myDocuments.fsName + "/Adobe/After Effects 20" + aeVersion + "/User Presets/");
    } else {
        userPresetsFolder = new Folder(Folder.myDocuments.fsName + "/Adobe/After Effects 20" + aeVersion + "/User Presets/");
    }
    return userPresetsFolder;
}

export function GetPresetFolderPathDisplay() {
    var folder = PresetFolderPath();
    if (!folder.exists) {
        return "Nah";
    }
    return decodeURIComponent(folder.fsName);
}

export function getAllUserPresets() {
    var userPresetsArray: string[] = [];
    var userPresetsFolder = PresetFolderPath();
    if (!userPresetsFolder.exists) {
        return userPresetsArray.toSource();
    }
    var presetFiles = userPresetsFolder.getFiles("*.ffx");
    for (var i = 0; i < presetFiles.length; i += 1) {
        userPresetsArray.push(decodeURIComponent(presetFiles[i].name));
    }
    return userPresetsArray.toSource();
}

function createSilentAdjLayer(color : number, createLayerCompOnSelected : boolean = false) {
    createLayerCompOnSelected = (createLayerCompOnSelected === true || String(createLayerCompOnSelected) === "true");

    var myComp = app.project.activeItem;
    if (!(myComp instanceof CompItem)) return;

    var myLayers = myComp.selectedLayers;
    var newLayers = [];

    if (createLayerCompOnSelected === true) {
        if (myLayers.length <= 0) {
            var solid = myComp.layers.addSolid(returnColorFunc(Number(color)), "Adjustment Layer", myComp.width, myComp.height, 1);
            solid.adjustmentLayer = true;
            solid.label = Number(color);
            newLayers.push(solid);
        } else {
            for (var i = 0; i < myLayers.length; i += 1) {
                var inPoint = Math.min(myLayers[i].inPoint, myLayers[i].outPoint);
                var outPoint = Math.max(myLayers[i].inPoint, myLayers[i].outPoint);
                var solid = myComp.layers.addSolid(returnColorFunc(Number(color)), "Adjustment Layer", myComp.width, myComp.height, 1, outPoint - inPoint);
                solid.adjustmentLayer = true;
                solid.moveBefore(myLayers[i]); 
                solid.startTime = inPoint;
                solid.label = Number(color);
                newLayers.push(solid);
            }
        }
    } else {
        if (myLayers.length > 0) {
            var newInPoint = myLayers[0].inPoint;
            var newOutPoint = myLayers[0].outPoint;
            var topLayer = myLayers[0]; 
            for (var i = 0; i < myLayers.length; i += 1) {
                if (myLayers[i].index < topLayer.index) topLayer = myLayers[i]; 
                var inPoint = Math.min(myLayers[i].inPoint, myLayers[i].outPoint);
                var outPoint = Math.max(myLayers[i].inPoint, myLayers[i].outPoint);
                if (inPoint < newInPoint) newInPoint = inPoint;
                if (outPoint > newOutPoint) newOutPoint = outPoint;
            }
            var solid = myComp.layers.addSolid(returnColorFunc(Number(color)), "Adjustment Layer", myComp.width, myComp.height, 1, newOutPoint - newInPoint);
            solid.adjustmentLayer = true;
            solid.moveBefore(topLayer); 
            solid.startTime = newInPoint;
            solid.label = Number(color);
            newLayers.push(solid);
        } else {
            var solid = myComp.layers.addSolid(returnColorFunc(Number(color)), "Adjustment Layer", myComp.width, myComp.height, 1);
            solid.adjustmentLayer = true;
            solid.label = Number(color);
            newLayers.push(solid);
        }
    }

    for (var l = 1; l <= myComp.numLayers; l++) {
        myComp.layer(l).selected = false;
    }
    for (var n = 0; n < newLayers.length; n++) {
        newLayers[n].selected = true;
    }
}

export function JustAddTheEffect(theEffect: string, applyAdj: boolean, adjColor: number, createLayerCompOnSelected: boolean = false) {
    app.beginUndoGroup("Excalibur Added Effect");

    applyAdj = (applyAdj === true || String(applyAdj) === "true");
    createLayerCompOnSelected = (createLayerCompOnSelected === true || String(createLayerCompOnSelected) === "true");

    if (applyAdj) {
        createSilentAdjLayer(adjColor, createLayerCompOnSelected);
    }

    var myComp = app.project.activeItem;
    if (myComp instanceof CompItem) {
        var myLayers = myComp.selectedLayers;
        if (myLayers.length <= 0) {
            alert("Please select at least one layer.");
        } else {
            for (var i = 0; i < myLayers.length; i += 1) {
                myLayers[i].Effects.addProperty(theEffect);
            }
            myComp.openInViewer();
        }
    } else {
        alert("Please select a composition.");
    }
    app.endUndoGroup();
}

export function JustAddThePreset(thePreset: string, applyAdj: boolean, adjColor: number, createLayerCompOnSelected: boolean = false) {
    app.beginUndoGroup("Excalibur Added Preset");

    applyAdj = (applyAdj === true || String(applyAdj) === "true");
    createLayerCompOnSelected = (createLayerCompOnSelected === true || String(createLayerCompOnSelected) === "true");

    if (applyAdj) {
        createSilentAdjLayer(adjColor, createLayerCompOnSelected);
    }
    
    var userPresetsFolder = PresetFolderPath();
    var presetFile = new File(userPresetsFolder.fsName + "/" + thePreset);

    var myComp = app.project.activeItem;
    if (myComp instanceof CompItem) {
        var myLayers = myComp.selectedLayers;
        if (myLayers.length <= 0) {
            alert("Please select at least one layer.");
        } else {
            if (!presetFile.exists) {
                alert("Preset not found at " + presetFile.fsName);
            } else {
                for (var i = 0; i < myLayers.length; i += 1) {
                    myLayers[i].applyPreset(presetFile);
                }
            }
            myComp.openInViewer();
        }
    } else {
        alert("Please select a composition.");
    }
    app.endUndoGroup();
}

export function autoCutSelectedLayer(threshold: number): string {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
        alert("Please select a composition.");
    }

    var selectedLayers = comp.selectedLayers;
    if (selectedLayers.length === 0) {
        return JSON.stringify({ status: "ERROR", message: "Please select a layer to cut." });
    }

    var originalLayer = selectedLayers[0];
    var frameDuration = comp.frameDuration;

    var startFrame = Math.round(originalLayer.inPoint / frameDuration);
    var endFrame = Math.round(originalLayer.outPoint / frameDuration); 

    var currentThreshold = (threshold !== undefined ? threshold : 1.5) / 10.0;

    var MIN_GAP_FRAMES = 3;   
    var MIN_SEGMENT_FRAMES = 2;

    var undoStarted = false;

    try {
        app.beginUndoGroup("Auto Scene Detect Perfect");
        undoStarted = true;

        var tempText = comp.layers.addText();
        tempText.name = "TEMP_ANALYSIS_DO_NOT_TOUCH";

        var expr =
            "var l = thisComp.layer(" + originalLayer.index + ");\n" +
            "var w = thisComp.width, h = thisComp.height;\n" +
            "var s = l.sampleImage([w*0.5, h*0.5], [w*0.25, h*0.25], true, time);\n" +
            "s[0]+','+s[1]+','+s[2];";

        tempText.property("Source Text").expression = expr;

        var cutFrames: number[] = [];
        var prevColor: { r: number; g: number; b: number } | null = null;
        var lastCutFrame = -MIN_GAP_FRAMES;

        for (var f = startFrame; f < endFrame; f++) {
            var exactTime = f * frameDuration;
            var colorStr = tempText.property("Source Text").valueAtTime(exactTime, false).toString();
            var colorArr = colorStr.split(',');
            var r = parseFloat(colorArr[0]);
            var g = parseFloat(colorArr[1]);
            var b = parseFloat(colorArr[2]);

            if (prevColor !== null) {
                var diff = Math.sqrt(
                    Math.pow(r - prevColor.r, 2) +
                    Math.pow(g - prevColor.g, 2) +
                    Math.pow(b - prevColor.b, 2)
                );
                if (diff > currentThreshold && (f - lastCutFrame) >= MIN_GAP_FRAMES) {
                    cutFrames.push(f);
                    lastCutFrame = f;
                }
            }
            prevColor = { r: r, g: g, b: b };
        }

        tempText.remove();

        var validCutFrames: number[] = [];
        for (var c = 0; c < cutFrames.length; c++) {
            var cf = cutFrames[c];
            if ((cf - startFrame) >= MIN_SEGMENT_FRAMES && (endFrame - cf) >= MIN_SEGMENT_FRAMES) {
                validCutFrames.push(cf);
            }
            }
    if (validCutFrames.length > 0) {
        var boundaries: number[] = [startFrame].concat(validCutFrames).concat([endFrame]);

        var segments: { inFrame: number; outFrame: number }[] = [];
        for (var s = 0; s < boundaries.length - 1; s++) {
            segments.push({ inFrame: boundaries[s], outFrame: boundaries[s + 1] });
        }

        var currentLayer = originalLayer;
        for (var i = 0; i < segments.length; i++) {
            var seg = segments[i];
            var segInTime = seg.inFrame * frameDuration;
            var segOutTime = seg.outFrame * frameDuration;

            if (i === 0) {
                originalLayer.inPoint = segInTime;
                originalLayer.outPoint = segOutTime;
                currentLayer = originalLayer;
            } else {
                var newLayer = currentLayer.duplicate();
                newLayer.inPoint = segInTime;
                newLayer.outPoint = segOutTime;
                currentLayer = newLayer;
            }
        }

        return JSON.stringify({ status: "SUCCESS" });
    } else {
        return JSON.stringify({ status: "SUCCESS" });
    }

    } catch (e:any) {
        alert("Error while cuting your clips : " + e.toString());
        return JSON.stringify({ status: "ERROR", message: e.toString() });
    } finally {
        if (undoStarted) {
            app.endUndoGroup();
        }
    }
}

function DoAPreCompBeforeTracking(layer: any) {
  try {
    if (layer.source && layer.source instanceof CompItem) {
      return false;
    }
  } catch (e) {
  }

  if (
    (layer.position && layer.position.numKeys > 0) ||
    (layer.anchorPoint && layer.anchorPoint.numKeys > 0) ||
    (layer.scale && layer.scale.numKeys > 0) ||
    (layer.rotation && layer.rotation.numKeys > 0)
  ) {
    return true;
  }

  try {
    if (layer.scale && (layer.scale.value[0] != 100 || layer.scale.value[1] != 100)) {
      return true;
    }
  } catch (e) {
  }

  return false;
}

  function setEffectSetting(effect: any, settingNames: string[], value: any): boolean {
    var expectedNames: string[] = [];
    for (var n = 0; n < settingNames.length; n += 1) {
      expectedNames.push(settingNames[n].toLowerCase().replace(/[^a-z0-9]/g, ""));
    }

    function findSetting(group: any): any {
      for (var i = 1; i <= group.numProperties; i += 1) {
        var property = group.property(i);
        var propertyName = String(property.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        var nameMatches = false;
        for (var expectedIndex = 0; expectedIndex < expectedNames.length; expectedIndex += 1) {
          if (expectedNames[expectedIndex] === propertyName) {
            nameMatches = true;
            break;
          }
        }
        if (nameMatches && typeof property.setValue === "function") {
          return property;
        }
        if (property.numProperties > 0) {
          var nested = findSetting(property);
          if (nested) return nested;
        }
      }
      return null;
    }

    var property = findSetting(effect);
    if (!property) return false;
    try {
      property.setValue(value);
      return true;
    } catch (e: any) {
      return false;
    }
  }

export function CreateWarpStable(color: number, detailan: number, smooth: number, method: number, fast: number, border: number) {
    app.beginUndoGroup("Excalibur Warp Stabilizer");
    try {
      var comp = resolveActiveComp();
      if (!comp) return fail("Open a composition and select one layer.");
      var myLayers = comp.selectedLayers;
      if (myLayers.length !== 1) return fail("Select only one layer.");

      var targetLayer = myLayers[0];
      if (DoAPreCompBeforeTracking(targetLayer)) {
        var newInPoint = targetLayer.inPoint;
        var newOutPoint = targetLayer.outPoint;
        var offset = newInPoint;
        targetLayer.startTime -= offset;
        var newComp = comp.layers.precompose([targetLayer.index], targetLayer.name + " Precomposed", true);
        newComp.duration = newOutPoint - offset;
        targetLayer = comp.selectedLayers[0];
        targetLayer.startTime = offset;
      }

        targetLayer.label = Number(color);
      var effect = targetLayer.property("ADBE Effect Parade").addProperty("ADBE SubspaceStabilizer");
      var settingsApplied = 0;
        if (setEffectSetting(effect, ["Method", "Méthode"], Number(method) + 1)) settingsApplied++;
        if (setEffectSetting(effect, ["Framing", "Cadrage"], Number(border) + 1)) settingsApplied++;
        if (setEffectSetting(effect, ["Smoothness", "Lissage"], Number(smooth))) settingsApplied++;
        if (setEffectSetting(effect, ["Detailed Analysis", "Analyse détaillée"], Number(detailan))) settingsApplied++;
        if (setEffectSetting(effect, ["Fast Analysis", "Analyse rapide"], Number(fast))) settingsApplied++;
      if (settingsApplied === 0) return fail("Warp Stabilizer was added, but its settings could not be found in this After Effects version.");
      return ok({ settingsApplied: settingsApplied });
    } catch (e : any) {
      return fail("Error while creating Warp Stabilizer: " + e.toString());
    } finally {
        app.endUndoGroup();
    }
}

export function CreateCameraTracker(
    color: number,
    detailed: number,
    trackSize: number
) {
    app.beginUndoGroup("Excalibur 3D Camera Tracker");
    try {
        var comp = app.project.activeItem;

        if (!(comp instanceof CompItem)) return fail("Open a composition and select one layer.");

        var myLayers = comp.selectedLayers;
        if (myLayers.length != 1) return fail("Select only one layer.");

        var targetLayer;

        if (DoAPreCompBeforeTracking(myLayers[0])) {
            var newInPoint = myLayers[0].inPoint;
            var newOutPoint = myLayers[0].outPoint;
            var layerIndices = [];

            for (var i = 0; i < myLayers.length; i++) {
                layerIndices.push(myLayers[i].index);
                var inPoint = Math.min(myLayers[i].inPoint, myLayers[i].outPoint);
                var outPoint = Math.max(myLayers[i].inPoint, myLayers[i].outPoint);
                if (inPoint < newInPoint) newInPoint = inPoint;
                if (outPoint > newOutPoint) newOutPoint = outPoint;
            }

            var offset = newInPoint;
            for (var i = 0; i < myLayers.length; i++) {
                myLayers[i].startTime -= offset;
            }

            var layerName = myLayers[0].name + " Precomposed";
            var newComp = comp.layers.precompose(layerIndices, layerName, true);
            newComp.duration = newOutPoint - offset;

            targetLayer = comp.selectedLayers[0];
            targetLayer.startTime = offset;
            targetLayer.selected = true;
        } else {
            targetLayer = myLayers[0];
        }

        targetLayer.label = Number(color);
        var effect = targetLayer.property("ADBE Effect Parade").addProperty("ADBE 3D Tracker");
        var settingsApplied = 0;
        if (setEffectSetting(effect, ["Track Point Size", "Taille des points de suivi"], Number(trackSize))) settingsApplied++;
        if (setEffectSetting(effect, ["Detailed Analysis", "Analyse détaillée"], Number(detailed))) settingsApplied++;
        if (settingsApplied === 0) return fail("3D Camera Tracker was added, but its settings could not be found in this After Effects version.");
        return ok({ settingsApplied: settingsApplied });
    } catch (e : any) {
        return fail("Error while creating 3D Camera Tracker: " + e.toString());
    } finally {
        app.endUndoGroup();
    }
}





function clearAllMarkers(comp : CompItem) {
    const markerProp = comp.markerProperty;
    if (!markerProp) return;
    
    const numMarkers = markerProp.numKeys;
    for (let i = numMarkers; i >= 1; i--) {
        markerProp.removeKey(i);
    }
}

function clampAudioMarkerValue(value : any, defaultValue = 75) {
    const parsed = Number(value);
    if (!isFinite(parsed)) return defaultValue;
    return Math.min(100, Math.max(60, parsed));
}

function getAudioBandMode(value : number, band : string) {
    const normalized = clampAudioMarkerValue(value, 75);

    if (normalized <= 60) return band === "bass" ? 25 : -100;
    if (normalized >= 100) return band === "bass" ? -100 : 5;

    const ratio = (normalized - 60) / 40;
    return band === "bass" 
        ? Math.round(25 - (125 * ratio)) 
        : Math.round(-100 + (105 * ratio));
}

function processAudioToMarkers(
    comp : CompItem, 
    audioLayer : AVLayer, 
    thresholdInPercent : number, 
    bassMode : number, 
    trebleMode : number
) {
    const gVer = typeof AE_VersionButDumCuzAdobeIsFuckingStupid === "function" ? AE_VersionButDumCuzAdobeIsFuckingStupid() : 23; 
    const isAutoDetect = (thresholdInPercent === 60);
    const normalizedThreshold = clampAudioMarkerValue(thresholdInPercent, 50) / 100;
    
    for (let i = 1; i <= comp.numLayers; i++) {
        comp.layer(i).selected = false;
    }
    audioLayer.selected = true;
    
    const audioFx = audioLayer.property("ADBE Effect Parade").addProperty("ADBE Aud BT");
    audioFx.property(1).setValue(bassMode);
    audioFx.property(2).setValue(trebleMode);
    
    const cmdId = gVer === 21 ? 5047 : (gVer === 22 ? 5046 : (gVer >= 23 && gVer <= 26 ? 4218 : 0));
    if (cmdId !== 0) app.executeCommand(cmdId);
    
    const tempLayer = comp.layer(1);
    if (!tempLayer || tempLayer.name !== "Audio Amplitude") {
        audioFx.remove();
        return;
    }
    
    const keyframes = tempLayer.property("ADBE Effect Parade").property(3).property(1);
    const numKeys = keyframes.numKeys;
    
    if (numKeys === 0) {
        tempLayer.remove();
        audioFx.remove();
        return;
    }
    
    const amplitudes = new Array(numKeys);
    const times = new Array(numKeys);
    let highestAmplitude = 0;
    let sumAmplitude = 0;
    
    for (let i = 1; i <= numKeys; i++) {
        const amp = keyframes.keyValue(i);
        amplitudes[i - 1] = amp;
        times[i - 1] = keyframes.keyTime(i);
        
        if (amp > highestAmplitude) highestAmplitude = amp;
        sumAmplitude += amp;
    }
    let thresholdDB = 0;
    if (isAutoDetect) {
        const avgAmplitude = sumAmplitude / numKeys;
        thresholdDB = avgAmplitude + ((highestAmplitude - avgAmplitude) * 0.75);
    } else {
        thresholdDB = highestAmplitude * normalizedThreshold;
    }
    
    const frameDuration = comp.frameDuration;
    const skipDivisor = bassMode === -100 ? 4 : 10;
    const debounceFrames = Math.max(2, Math.floor(highestAmplitude / skipDivisor)); 
    
    for (let i = 1; i < numKeys - 1; i++) {
        if (amplitudes[i] >= thresholdDB) {
            if (amplitudes[i] > amplitudes[i - 1] && amplitudes[i] >= amplitudes[i + 1]) {
                const newMarker = new MarkerValue("");
                comp.markerProperty.setValueAtTime(times[i], newMarker);
                
                i += debounceFrames; 
            }
        }
    }
    const tempSource = tempLayer.source;
        tempLayer.remove(); 
        audioFx.remove();   
        if (tempSource && tempSource.usedIn.length === 0) {
            tempSource.remove();
        }
}

export function DoAudioMarkers(valueSlider : any, valueSlider2 : any) {
    app.beginUndoGroup("Excalibur Generate Audio Markers");
    const myComp = app.project.activeItem;
    
    if (!myComp || !(myComp instanceof CompItem)) {
        alert("Excalibur: Please select a composition.");
        app.endUndoGroup();
        return;
    }

    const myLayers = myComp.selectedLayers;
    if (myLayers.length !== 1) {
        alert("Excalibur: Please select exactly ONE audio layer.");
        app.endUndoGroup();
        return;
    }

    const bassSensitivity = clampAudioMarkerValue(valueSlider, 75);
    const trebleSensitivity = clampAudioMarkerValue(valueSlider2, 75);

    clearAllMarkers(myComp);

    const targetLayer = myLayers[0];
    if (bassSensitivity < 100) {
        processAudioToMarkers(
            myComp, 
            targetLayer, 
            bassSensitivity, 
            getAudioBandMode(bassSensitivity, "bass"), 
            -100
        );
    }

    if (trebleSensitivity < 100) {
        processAudioToMarkers(
            myComp, 
            targetLayer, 
            trebleSensitivity, 
            -100, 
            getAudioBandMode(trebleSensitivity, "treble")
        );
    }
    
    app.endUndoGroup();
}
export function toggleHeavyFXProject(mode : "external" | "native" | "all"): string {
    app.beginUndoGroup("Toggle Effects");

    var toggledCount = 0;

    for (var i = 1; i <= app.project.numItems; i++) {
        var item = app.project.item(i);
        
        if (item instanceof CompItem) {
            
            for (var l = 1; l <= item.numLayers; l++) {
                var layer = item.layer(l);
                var fxGroup = layer.property("ADBE Effect Parade");
                
                if (fxGroup !== null) {
                    
                    for (var e = 1; e <= fxGroup.numProperties; e++) {
                        var fx = fxGroup.property(e);
                        
                        var isThirdParty = (fx.matchName.indexOf("ADBE") !== 0);
                        if (mode === "external") {
                            if (isThirdParty === true) {
                                fx.enabled = !fx.enabled;
                                toggledCount++;
                            }
                        } 
                        else if (mode === "native") {
                            if (isThirdParty === false) {
                                fx.enabled = !fx.enabled;
                                toggledCount++;
                            }
                        } 
                        else if (mode === "all") {
                            fx.enabled = !fx.enabled;
                            toggledCount++;
                        }
                    }
                }
            }
        }
    }

    app.endUndoGroup();
    return toggledCount + " effects toggled.";
}
export function createFXControlRig(settings = { oneNullPerEffect: false, onlyImportantProps: false }) {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) return "No active composition.";

    var selLayers = comp.selectedLayers.slice(0);
    if (selLayers.length === 0) return "Select at least one layer.";

    app.beginUndoGroup("Create FX Smart Control Rig");

    var importantKeywords = ["amount", "height", "width",  "radius", "intensity", "size",  "strength", "force", "opacity", "multiplier", "scale", "offset", "blend", "level"];

    var masterNull = null;
    var masterEffects = null;

    if (!settings.oneNullPerEffect) {
        var topLayer = selLayers[0];
        for (var l = 0; l < selLayers.length; l++) {
            if (selLayers[l].index < topLayer.index) topLayer = selLayers[l];
        }
        var inPoint = Math.min(topLayer.inPoint, topLayer.outPoint);
        var outPoint = Math.max(topLayer.inPoint, topLayer.outPoint);

        masterNull = comp.layers.addNull(outPoint - inPoint);
        masterNull.name = "Excalibur - Controls";
        masterNull.moveBefore(topLayer);
        masterNull.startTime = inPoint;
        masterEffects = masterNull.property("ADBE Effect Parade");
    }

    for (var i = 0; i < selLayers.length; i++) {
        var layer = selLayers[i];
        if (masterNull && layer === masterNull) continue;

        var fxGroup = layer.property("ADBE Effect Parade");
        if (fxGroup) {
            for (var e = fxGroup.numProperties; e >= 1; e--) {
                var fx = fxGroup.property(e);
                
                var hasValidProps = false;
                for (var p = 1; p <= fx.numProperties; p++) {
                    var testProp = fx.property(p);
                    if (testProp.propertyType === PropertyType.PROPERTY && testProp.canSetExpression) {
                        var valType = testProp.propertyValueType;
                        if (valType !== PropertyValueType.NO_VALUE && valType !== PropertyValueType.CUSTOM_VALUE) {
                            hasValidProps = true;
                            break;
                        }
                    }
                }

                if (!hasValidProps) {
                    var inPoint = Math.min(layer.inPoint, layer.outPoint);
                    var outPoint = Math.max(layer.inPoint, layer.outPoint);
                    
                    var adjLayer = comp.layers.addSolid([1, 1, 1], fx.name, comp.width, comp.height, 1, outPoint - inPoint);
                    adjLayer.adjustmentLayer = true;
                    adjLayer.moveBefore(layer);
                    adjLayer.startTime = inPoint;
                    adjLayer.label = 5;

                    var newFx = adjLayer.property("ADBE Effect Parade").addProperty(fx.matchName);
                    if (newFx) {
                        try {
                            for (var cp = 1; cp <= fx.numProperties; cp++) {
                                if (newFx.property(cp) && fx.property(cp).value !== undefined) {
                                    newFx.property(cp).setValue(fx.property(cp).value);
                                }
                            }
                        } catch (err) {}
                    }
                    
                    fx.remove();
                    continue;
                }

                var targetEffectsGroup = masterEffects;
                var targetNull = masterNull;

                if (settings.oneNullPerEffect) {
                    var inPoint = Math.min(layer.inPoint, layer.outPoint);
                    var outPoint = Math.max(layer.inPoint, layer.outPoint);

                    targetNull = comp.layers.addNull(outPoint - inPoint);
                    targetNull.name = fx.name + " - Controls";
                    targetNull.moveBefore(layer);
                    targetNull.startTime = inPoint;
                    targetNull.label = 8;
                    targetEffectsGroup = targetNull.property("ADBE Effect Parade");
                }

                for (var p = 1; p <= fx.numProperties; p++) {
                    var prop = fx.property(p);
                    
                    if (prop.propertyType === PropertyType.PROPERTY && prop.canSetExpression) {
                        var pName = prop.name.toLowerCase();

                        if (settings.onlyImportantProps) {
                            var isImportant = false;
                            for (var k = 0; k < importantKeywords.length; k++) {
                                if (pName.indexOf(importantKeywords[k]) !== -1) {
                                    isImportant = true;
                                    break;
                                }
                            }
                            if (!isImportant) continue;
                        }

                        var controlType = "";
                        var val;
                        
                        try {
                            val = prop.value;
                        } catch(err) {
                            continue;
                        }

                        if (val != null && typeof val === "object" && val.length !== undefined) {
                            if (val.length === 4) controlType = "ADBE Color Control";
                            else if (val.length === 3) controlType = "ADBE Point3D Control";
                            else if (val.length === 2) controlType = "ADBE Point Control";
                        } else if (typeof val === "number") {
                            if (prop.propertyValueType === PropertyValueType.LAYER_INDEX) {
                                controlType = "ADBE Layer Control";
                            } else {
                                if (pName.indexOf("angle") !== -1 || pName.indexOf("rotation") !== -1 || pName.indexOf("direction") !== -1) {
                                    controlType = "ADBE Angle Control";
                                } else if (pName.indexOf("enable") !== -1 || pName.indexOf("activer") !== -1 || pName.indexOf("invert") !== -1) {
                                    controlType = "ADBE Checkbox Control";
                                } else {
                                    controlType = "ADBE Slider Control"; 
                                }
                            }
                        }

                        if (controlType !== "" && targetEffectsGroup && targetNull) {
                            var controlName = settings.oneNullPerEffect 
                                ? prop.name 
                                : layer.name + " - " + fx.name + " - " + prop.name;

                            var newControl = targetEffectsGroup.addProperty(controlType);
                            newControl.name = controlName;
                            
                            var currentVal = prop.value;

                            try {
                                newControl.property(1).setValue(currentVal);
                            } catch (err) {}

                            try {
                                prop.expression = 'thisComp.layer("' + targetNull.name + '").effect("' + controlName + '")(1);';
                            } catch (err) {}

                            try {
                                newControl.property(1).setValue(currentVal);
                            } catch (err) {}
                        }
                    }
                }
            }
        }
    }

    app.endUndoGroup();
    return "Rig généré avec succès !";
}


export function dumpCompData(
    skipDefaults: boolean,
    skipDisabledFx: boolean,
    incTransform: boolean,
    incEffects: boolean,
    incFxSettings: boolean,
    incMasks: boolean,
    incText: boolean,
    incStyles: boolean,
    incPrecomps: boolean,
    maxDepth: number
): string {
    var comp = app.project.activeItem;
    if (comp == null) {
        alert("Error: Select an active composition.");
        return "Error: Select an active composition.";
    }
    if (!(comp instanceof CompItem)) {
        alert("Error: Select an active composition.");
        return "Error: Select an active composition.";
    }

    if (skipDefaults == undefined) skipDefaults = true;
    if (skipDisabledFx == undefined) skipDisabledFx = true;
    if (incTransform == undefined) incTransform = true;
    if (incEffects == undefined) incEffects = true;
    if (incFxSettings == undefined) incFxSettings = true;
    if (incMasks == undefined) incMasks = true;
    if (incText == undefined) incText = true;
    if (incStyles == undefined) incStyles = false;
    if (incPrecomps == undefined) incPrecomps = true;
    if (maxDepth == undefined) maxDepth = 5;

    var out: string[] = [];
    var totalLayers = 0;
    var totalComps = 0;
    var totalEffects = 0;
    var totalMasks = 0;
    var totalKeys = 0;
    var visited: any = {}; 

    out.push("================================================================");
    out.push("COMPOSITION : " + comp.name);
    out.push("================================================================");
    out.push("");

    function round(n: number): number {
        return Math.round(n * 1000) / 1000;
    }

    function fmtVal(v: any): string {
        if (v instanceof Array) {
            var result = "";
            for (var i = 0; i < v.length; i = i + 1) {
                if (typeof v[i] == "number") {
                    result = result + round(v[i]);
                } else {
                    result = result + String(v[i]);
                }
                
                if (i < v.length - 1) {
                    result = result + ", ";
                }
            }
            return result;
        }
        
        if (typeof v == "number") {
            return String(round(v));
        }
        return String(v);
    }
    function isDefaultValue(prop: any): boolean {
        if (prop.numKeys > 0) return false; 
        if (prop.expressionEnabled == true) return false; 
        
        var v = prop.value;
        var name = prop.matchName;

        if (name == "ADBE Opacity" && v == 100) return true;
        if (name == "ADBE Scale" && fmtVal(v) == "100, 100, 100") return true;
        if (name == "ADBE Rotate Z" && v == 0) return true;
        if (name == "ADBE Rotate X" && v == 0) return true;
        if (name == "ADBE Rotate Y" && v == 0) return true;
        if (name == "ADBE Orientation" && fmtVal(v) == "0, 0, 0") return true;
        if (name == "ADBE Envir Appear in Reflect") return true;
        
        return false;
    }


    function getLayerType(layer: any): string {
        if (layer instanceof TextLayer) return "Text";
        if (layer instanceof ShapeLayer) return "Shape";
        if (layer instanceof CameraLayer) return "Camera";
        if (layer instanceof LightLayer) return "Light";
        if (layer.adjustmentLayer == true) return "Adjustment";
        if (layer.source instanceof CompItem) return "Pre-Comp";
        return "Media";
    }

    function parseProperty(prop: any, spacing: string) {
        if (prop == null) return;

        try {
            if (prop.propertyType == PropertyType.PROPERTY) {
                
                if (skipDefaults == true && isDefaultValue(prop) == true) {
                    return;
                }

                var lineText = spacing + "|-- " + prop.name;

                if (prop.hasCustomValue == true) {
                    out.push(lineText + " = [Custom value]");
                } else if (prop.numKeys > 0) {
                    totalKeys = totalKeys + 1;
                    out.push(lineText + " (" + prop.numKeys + " keyframes)");
                    
                    for (var k = 1; k <= prop.numKeys; k = k + 1) {
                        var time = round(prop.keyTime(k));
                        var value = fmtVal(prop.keyValue(k));
                        out.push(spacing + "|   #" + k + " t=" + time + "s val=" + value);
                    }
                } else {
                    if (prop.value != undefined) {
                        out.push(lineText + " = " + fmtVal(prop.value));
                    } else {
                        out.push(lineText + " = [N/A]");
                    }
                }

                if (prop.expressionEnabled == true && prop.expression != "") {
                    var expr = prop.expression.split("\n").join(" | ");
                    out.push(spacing + "|   -> Expression: " + expr);
                }

            } else if (prop instanceof PropertyGroup) {
                var oldSize = out.length;
                out.push(spacing + "+-- " + prop.name);
                
                for (var i = 1; i <= prop.numProperties; i = i + 1) {
                    var child = prop.property(i);
                    if (child != null) {
                        parseProperty(child, spacing + "    ");
                    }
                }
                
                if (out.length == oldSize + 1) {
                    out.pop(); 
                }
            }
        } catch (error) {
            out.push(spacing + "|-- [Property error]");
        }
    }

    function dumpLayer(layer: any, spacing: string, depth: number) {
        totalLayers = totalLayers + 1;
        var layerType = getLayerType(layer);
        
        var layerTitle = spacing + "+-- [L" + layer.index + "] " + layer.name + " [" + layerType + "]";
        if (layer.enabled == false) {
            layerTitle = layerTitle + " (Disabled)";
        }
        
        out.push(layerTitle);
        var childSpacing = spacing + "    ";

        var blend = "N/A";
        if (layer instanceof AVLayer) {
            blend = layer.blendingMode;
        }
        
        var timeIn = round(layer.inPoint);
        var timeOut = round(layer.outPoint);
        out.push(childSpacing + "|-- In/Out: " + timeIn + "s -> " + timeOut + "s | Blend Mode: " + blend);

        if (incTransform == true) {
            try {
                var transform: any = layer.property("ADBE Transform Group");
                if (transform != null) {
                    var tStart = out.length;
                    out.push(childSpacing + "+-- TRANSFORM");
                    for (var t = 1; t <= transform.numProperties; t = t + 1) {
                        parseProperty(transform.property(t), childSpacing + "    ");
                    }
                    if (out.length == tStart + 1) out.pop();
                }
            } catch (e) {}
        }

        if (incText == true) {
            try {
                if (layer instanceof TextLayer) {
                    var textProp: any = layer.property("ADBE Text Properties");
                    if (textProp != null) {
                        var txStart = out.length;
                        out.push(childSpacing + "+-- TEXT");
                        for (var tp = 1; tp <= textProp.numProperties; tp = tp + 1) {
                            parseProperty(textProp.property(tp), childSpacing + "    ");
                        }
                        if (out.length == txStart + 1) out.pop();
                    }
                }
            } catch (e) {}
        }

        if (incMasks == true) {
            try {
                if (layer instanceof AVLayer) {
                    var masks: any = layer.property("ADBE Mask Parade");
                    if (masks != null && masks.numProperties > 0) {
                        out.push(childSpacing + "+-- MASKS (" + masks.numProperties + ")");
                        for (var m = 1; m <= masks.numProperties; m = m + 1) {
                            var maskProp: any = masks.property(m);
                            if (maskProp != null) {
                                totalMasks = totalMasks + 1;
                                out.push(childSpacing + "    +-- Mask #" + m + " (" + maskProp.name + ")");
                                for (var mp = 1; mp <= maskProp.numProperties; mp = mp + 1) {
                                    parseProperty(maskProp.property(mp), childSpacing + "        ");
                                }
                            }
                        }
                    }
                }
            } catch (e) {}
        }

        if (incStyles == true) {
            try {
                var styles: any = layer.property("ADBE Layer Styles");
                if (styles != null && styles.enabled == true && styles.numProperties > 0) {
                    var lsStart = out.length;
                    out.push(childSpacing + "+-- LAYER STYLES");
                    for (var ls = 1; ls <= styles.numProperties; ls = ls + 1) {
                        var style = styles.property(ls);
                        if (style != null && style.enabled == true) {
                            parseProperty(style, childSpacing + "    ");
                        }
                    }
                    if (out.length == lsStart + 1) out.pop();
                }
            } catch (e) {}
        }

        if (incEffects == true) {
            try {
                if (layer instanceof AVLayer) {
                    var fxGroup: any = layer.property("ADBE Effect Parade");
                    if (fxGroup != null && fxGroup.numProperties > 0) {
                        var fxStart = out.length;
                        out.push(childSpacing + "+-- EFFECTS");
                        
                        var wroteAnEffect = false;
                        
                        for (var e = 1; e <= fxGroup.numProperties; e = e + 1) {
                            var fx: any = fxGroup.property(e);
                            if (fx != null) {
                                if (skipDisabledFx == true && fx.enabled == false) {
                                    continue;
                                }
                                
                                totalEffects = totalEffects + 1;
                                wroteAnEffect = true;
                                
                                var fxName = childSpacing + "    +-- FX: " + fx.name;
                                if (fx.enabled == false) {
                                    fxName = fxName + " (Disabled)";
                                }
                                out.push(fxName);
                                
                                if (incFxSettings == true) {
                                    for (var ep = 1; ep <= fx.numProperties; ep = ep + 1) {
                                        var fxp = fx.property(ep);
                                        if (fxp != null) {
                                            parseProperty(fxp, childSpacing + "        ");
                                        }
                                    }
                                }
                            }
                        }
                        
                        if (wroteAnEffect == false) {
                            out.pop();
                        }
                    }
                }
            } catch (e) {}
        }

        if (incPrecomps == true) {
            try {
                if (layer instanceof AVLayer && layer.source instanceof CompItem) {
                    if (depth >= maxDepth) {
                        out.push(childSpacing + "+-- [Max depth reached]");
                    } else {
                        var subComp = layer.source;
                        var textId = String(subComp.id);

                        if (visited[textId] == true) {
                            out.push(childSpacing + "+-- [PRE-COMP ALREADY VISITED: " + subComp.name + "]");
                        } else {
                            visited[textId] = true;
                            totalComps = totalComps + 1;
                            out.push(childSpacing + "+-- PRE-COMP: " + subComp.name);
                            
                            for (var sl = 1; sl <= subComp.numLayers; sl = sl + 1) {
                                dumpLayer(subComp.layer(sl), childSpacing + "    ", depth + 1);
                            }
                            
                            visited[textId] = false; 
                        }
                    }
                }
            } catch (e) {}
        }
    }

    try {
        for (var i = 1; i <= comp.numLayers; i = i + 1) {
            dumpLayer(comp.layer(i), "", 1);
        }
    } catch (e) {
        out.push("## ERROR: " + String(e));
    }

    out.push("");
    out.push("================================================================");
    out.push("SUMMARY: " + totalLayers + " layers | " + totalComps + " pre-comps | " + totalEffects + " fx | " + totalMasks + " masks | " + totalKeys + " animated props");
    out.push("================================================================");

    var finalText = out.join("\n");

    try {
        copyStringToClipboard(finalText);
    } catch (e) {}

    return finalText;
}












function copyStringToClipboard(text : string) {
    var tempFile = new File(Folder.temp.fsName + "/ae_dump.txt");
    tempFile.encoding = "UTF-8";
    tempFile.open("w");
    tempFile.write(text);
    tempFile.close();

    if ($.os.indexOf("Windows") !== -1) {
        var escapedPath = tempFile.fsName.replace(/\\/g, "\\\\");
        var psCmd = "Add-Type -AssemblyName System.Windows.Forms; "
            + "$t = [System.IO.File]::ReadAllText('" + escapedPath + "', [System.Text.Encoding]::UTF8); "
            + "[System.Windows.Forms.Clipboard]::SetText($t)";
        system.callSystem('powershell -NoProfile -ExecutionPolicy Bypass -Command "' + psCmd + '"');
    } else {
        system.callSystem('cat "' + tempFile.fsName + '" | pbcopy');
    }
    tempFile.remove();
} 

export function applyFillColor(hex: string): string {
  try {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.substring(0, 2), 16) / 255;
    const g = parseInt(clean.substring(2, 4), 16) / 255;
    const b = parseInt(clean.substring(4, 6), 16) / 255;

    app.beginUndoGroup("Apply Fill Color");

    const comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
      app.endUndoGroup();
      return "NO_COMP";
    }

    const layers = comp.selectedLayers;
    if (!layers || layers.length === 0) {
      app.endUndoGroup();
      return "NO_LAYER";
    }

    const colorOverlayCmdId = app.findMenuCommandId("Color Overlay") || 9006;

    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];

      if (layer instanceof TextLayer) {
        const textProp = layer.property("ADBE Text Properties").property("ADBE Text Document") as Property;
        const textDoc = textProp.value as TextDocument;
        
        textDoc.applyFill = true;
        textDoc.fillColor = [r, g, b];
        textProp.setValue(textDoc);
      }
      else if (layer instanceof AVLayer && layer.source != null) {
        let layerStyles = layer.property("ADBE Layer Styles") as PropertyGroup | null;
        let colorOverlay = layerStyles
          ? (layerStyles.property("ADBE Color Overlay") as PropertyGroup | null)
          : null;

        if (!colorOverlay) {
          for (let j = 0; j < layers.length; j++) {
            layers[j].selected = false;
          }
          layer.selected = true;

          if (colorOverlayCmdId) {
            app.executeCommand(colorOverlayCmdId);
          }

          layerStyles = layer.property("ADBE Layer Styles") as PropertyGroup | null;
          if (layerStyles) {
            colorOverlay = (layerStyles.property("ADBE Color Overlay") ||
              layerStyles.property("Color Overlay") ||
              layerStyles.property("Incrustation de couleur")) as PropertyGroup | null;
          }
        }

        if (colorOverlay) {
          const colorProp = (colorOverlay.property("ADBE Color Overlay-0003") ||
            colorOverlay.property("solidFill/color") ||
            colorOverlay.property("Color") ||
            colorOverlay.property("Couleur")) as Property | null;

          if (colorProp) {
            colorProp.setValue([r, g, b, 1]);
          }
        }
      }
      else {
        const effects = layer.property("ADBE Effect Parade") as PropertyGroup;
        if (effects) {
          let fill = (effects.property("Fill") || effects.property("ADBE Fill")) as PropertyGroup | null;
          if (!fill) {
            fill = effects.addProperty("ADBE Fill") as PropertyGroup;
          }

          const colorProp = (fill.property("Color") ||
            fill.property("ADBE Fill-0002") ||
            fill.property("Couleur")) as Property | null;

          if (colorProp) {
            colorProp.setValue([r, g, b, 1]);
          }
        }
      }
    }

    for (let i = 0; i < layers.length; i++) {
      layers[i].selected = true;
    }

    app.endUndoGroup();
    return "OK";
  } catch (e) {
    app.endUndoGroup();
    return "ERROR";
  }
}

export function applyTransitionPreset(transitionId: string): string {
    var allowedTransitions: { [key: string]: boolean } = {
      crossfade: true,
      blur_fade: true,
      zoom_in: true,
    };
    if (!allowedTransitions[transitionId]) {
      return "Transition inconnue.";
    }

    var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            return "Veuillez sélectionner une composition.";
        }

        var selectedLayers = comp.selectedLayers;
        if (selectedLayers.length < 2) {
            return "Veuillez sélectionner au moins 2 calques.";
        }

        app.beginUndoGroup("Transition : " + transitionId);

        try {
            selectedLayers.sort(function(a: Layer, b: Layer) {
                return a.inPoint - b.inPoint;
            });

            var layerB = selectedLayers[1];
            
            var cutPoint = layerB.inPoint;
            var duration = 1.0;
            var tStart = cutPoint - (duration / 2);
            var tEnd = cutPoint + (duration / 2);

            var transitionType = transitionId;

            if (transitionType === "crossfade") {
                var opacityProp = layerB.property("ADBE Transform Group").property("ADBE Opacity");
                opacityProp.setValueAtTime(tStart, 0);
                opacityProp.setValueAtTime(cutPoint, 100);
            } 
            else {
                var adjLayer = comp.layers.addSolid([1, 1, 1], "Transition - " + transitionType, comp.width, comp.height, comp.pixelAspect, duration);
                adjLayer.adjustmentLayer = true;
                adjLayer.startTime = tStart; 
                adjLayer.inPoint = tStart;   
                adjLayer.outPoint = tEnd;    
                adjLayer.moveBefore(layerB); 

                if (transitionType === "blur_fade") {
                    var blurEffect = adjLayer.property("ADBE Effect Parade").addProperty("ADBE Gaussian Blur 2");
                    var blurProp = blurEffect.property(1); 
                    
                    blurProp.setValueAtTime(tStart, 0);
                    blurProp.setValueAtTime(cutPoint, 50);
                    blurProp.setValueAtTime(tEnd, 0);
                }
                else if (transitionType === "zoom_in") {
                    var transformEffect = adjLayer.property("ADBE Effect Parade").addProperty("ADBE Geometry2");
                    var scaleProp = transformEffect.property(4);
                    
                    scaleProp.setValueAtTime(tStart, 100);
                    scaleProp.setValueAtTime(cutPoint, 200);
                    scaleProp.setValueAtTime(tEnd, 100);
                    
                    scaleProp.setInterpolationTypeAtKey(1, KeyframeInterpolationType.BEZIER);
                    scaleProp.setInterpolationTypeAtKey(2, KeyframeInterpolationType.BEZIER);
                    scaleProp.setInterpolationTypeAtKey(3, KeyframeInterpolationType.BEZIER);
                }
            }

        } catch (err :any) {
            alert("Erreur détaillée : " + err.toString() + "\\nLigne : " + err.line);
        } finally {
            app.endUndoGroup();
        }

        return "Success";
}



















































































































export function applyExpressionToSelected(expressionCode: string): string {
    app.beginUndoGroup("Expression Kit: Apply");
    try {
        var comp = app.project.activeItem as CompItem;
        if (!comp || !(comp instanceof CompItem)) {
            return JSON.stringify({ success: false, error: "No active composition." });
        }

        var selectedProps = comp.selectedProperties;
        if (selectedProps.length === 0) {
            return JSON.stringify({ success: false, error: "Select at least one property." });
        }

        var appliedCount = 0;
        for (var i = 0; i < selectedProps.length; i++) {
            var prop = selectedProps[i] as Property;
            if (prop.canSetExpression) {
                prop.expression = expressionCode;
                appliedCount++;
            }
        }

        app.endUndoGroup();
        return JSON.stringify({ success: true, count: appliedCount });
    } catch (e: any) {
        app.endUndoGroup();
        return JSON.stringify({ success: false, error: e.toString() });
    }
}





















function ExcaliburFXfindItemByName(folder: any, name: string): any {
    for (let i = 1; i <= folder.numItems; i += 1) {
        const item = folder.item(i);
        if ((item instanceof FootageItem) || (item instanceof CompItem)) {
            let itemName: string = item.name;
            if ((item.mainSource) && (item.mainSource.file)) {
                itemName = item.mainSource.file.name;
            }
            if (itemName === name) {
                return item;
            }
        }
    }
    return null;
}

function ExcaliburFXfindOrCreateFolder(folderName: string, parentFolder: any): any {
    for (let i = 1; i <= parentFolder.numItems; i += 1) {
        if ((parentFolder.item(i).name === folderName) && (parentFolder.item(i) instanceof FolderItem)) {
            return parentFolder.item(i);
        }
    }
    return parentFolder.items.addFolder(folderName);
}

function findNearestMarkerTimeInSequence(sequence: any, refTimeSeconds: number): number | null {
    const markers = sequence.markers;
    if (!markers || markers.numMarkers === 0) return null;

    let marker = markers.getFirstMarker();
    let closestTime: number | null = null;
    let closestDiff = Number.MAX_VALUE;

    while (marker) {
        const markerTime = marker.start.seconds;
        const diff = Math.abs(markerTime - refTimeSeconds);
        if (diff < closestDiff) {
            closestDiff = diff;
            closestTime = markerTime;
        }
        marker = markers.getNextMarker(marker);
    }

    return closestTime;
}

function findNearestMarkerTimeAE(comp: any, refTime: number): number | null {
    const markerProp = comp.markerProperty;
    if (!markerProp || markerProp.numKeys === 0) return null;

    let closestTime: number | null = null;
    let closestDiff = Number.MAX_VALUE;

    for (let i = 1; i <= markerProp.numKeys; i += 1) {
        const markerTime = markerProp.keyTime(i);
        const diff = Math.abs(markerTime - refTime);
        if (diff < closestDiff) {
            closestDiff = diff;
            closestTime = markerTime;
        }
    }

    return closestTime;
}

export function importSoundFileToTimeline(filePath: string, offsetSeconds: number = 0, mode: string = "cursor"): void {
    app.enableQE();
    const project = app.project;
    if (project) {
        const rootItem = project.rootItem;
        let soundFolder = null;
        for (let i = 0; i < rootItem.children.numItems; i += 1) {
            if (rootItem.children[i].name === "ExcaliburFX") {
                soundFolder = rootItem.children[i];
                break;
            }
        }
        if (!soundFolder) {
            soundFolder = rootItem.createBin("ExcaliburFX");
        }
        
        let importedItem = null;
        const fileName = decodeURI(new File(filePath).name);
        
        for (let i = 0; i < soundFolder.children.numItems; i += 1) {
            const item = soundFolder.children[i];
            if (item.name === fileName) {
                importedItem = item;
                break;
            }
        }
        
        if (!importedItem) {
            project.importFiles([filePath], true, soundFolder, false);
            for (let i = 0; i < soundFolder.children.numItems; i += 1) {
                const item = soundFolder.children[i];
                if (item.name === fileName) {
                    importedItem = item;
                    break;
                }
            }
        }
        
        if (importedItem) {
            const activeSequence = project.activeSequence;
            if (activeSequence) {
                const audioTracks = activeSequence.audioTracks;

                const time = activeSequence.getPlayerPosition();
                const safeOffset = isNaN(offsetSeconds) ? 0 : Math.max(0, offsetSeconds);

                if (mode === "peak") {
                    time.seconds = Math.max(0, time.seconds - safeOffset);
                } else if (mode === "beatmarker") {
                    const nearestMarkerTime = findNearestMarkerTimeInSequence(activeSequence, time.seconds);
                    if (nearestMarkerTime !== null) {
                        time.seconds = Math.max(0, nearestMarkerTime - safeOffset);
                    } else {
                        alert("ExcaliburFX: No marker found in the sequence. Inserting at the strongest point at the cursor.");
                        time.seconds = Math.max(0, time.seconds - safeOffset);
                    }
                }

                const soundDuration = importedItem.getOutPoint().seconds - importedItem.getInPoint().seconds;
                
                function findLowestAvailableTrack(): any {
                    for (let i = 0; i < audioTracks.numTracks; i += 1) {
                        const track = audioTracks[i];
                        let isTrackAvailable = true;
                        for (let j = 0; j < track.clips.numItems; j += 1) {
                            const clip = track.clips[j];
                            if (((clip.start.seconds < (time.seconds + soundDuration)) && (clip.end.seconds > time.seconds)) || ((time.seconds < clip.end.seconds) && ((time.seconds + soundDuration) > clip.start.seconds))) {
                                isTrackAvailable = false;
                                break;
                            }
                        }
                        if (isTrackAvailable) {
                            return track;
                        }
                    }
                    return null;
                }
                
                const trackToInsert = findLowestAvailableTrack();
                if (trackToInsert) {
                    trackToInsert.insertClip(importedItem, time);
                } else {
                    alert("ExcaliburFX ERROR: Please add more audio lines.");
                }
            } else {
                alert("ExcaliburFX ERROR: No active sequence found.");
            }
        } else {
            alert("ExcaliburFX ERROR: Failed to import the sound file.");
        }
    } else {
        alert("ExcaliburFX ERROR: No project found.");
    }
}

function WhatProgrammIsGettingUsed() {
    if ((typeof app.project !== "undefined") && (typeof app.project.renderQueue !== "undefined")) {
        return 2;
    } else {
        if ((typeof app.project !== "undefined") && (typeof app.project.activeSequence !== "undefined")) {
            return 1;
        }
    }
    return 0;
}

export function ExcaliburFXLoadSfxFile(payload: { path: string; offset?: number; mode?: string }): void {
    const filePath = decodeURIComponent(payload.path);
    const offsetSeconds = (typeof payload.offset === "number" && !isNaN(payload.offset)) ? payload.offset : 0;
    const mode = payload.mode ?? "cursor";

    switch (WhatProgrammIsGettingUsed()) {
        case 1:
            importSoundFileToTimeline(filePath, offsetSeconds, mode);
            break;
        case 2:
            const comp = app.project.activeItem;
            if (comp instanceof CompItem) {
                const file = new File(filePath);
                if (!file.exists) {
                    alert("ExcaliburFX ERROR: File does not exist.");
                    return;
                }
                
                const fileName = file.name;
                const project = app.project;
                if (!project) {
                    alert("ExcaliburFX ERROR: No project found.");
                    return;
                }
                
                const activeComp = project.activeItem;
                if ((!activeComp) || (!(activeComp instanceof CompItem))) {
                    return;
                }
                
                app.beginUndoGroup("ExcaliburFX added");
                const testFolder = ExcaliburFXfindOrCreateFolder("ExcaliburFX Assets", project.rootFolder);
                const existingItem = ExcaliburFXfindItemByName(testFolder, fileName);
                let itemToUse: any;

                if (existingItem) {
                    itemToUse = existingItem;
                } else {
                    const importOptions = new ImportOptions(file);
                    const importedItem = project.importFile(importOptions);
                    importedItem.parentFolder = testFolder;
                    itemToUse = importedItem;
                }
                
                if ((itemToUse instanceof FootageItem) || (itemToUse instanceof AVLayer)) {
                    const myLayers = activeComp.selectedLayers;
                    let startTime = activeComp.time;

                    if (mode === "peak") {
                        startTime = Math.max(0, activeComp.time - offsetSeconds);
                    } else if (mode === "beatmarker") {
                        const nearestMarkerTime = findNearestMarkerTimeAE(activeComp, activeComp.time);
                        if (nearestMarkerTime !== null) {
                            startTime = Math.max(0, nearestMarkerTime - offsetSeconds);
                        } else {
                            alert("ExcaliburFX: No marker found in the composition. Inserting at the strongest point at the cursor.");
                            startTime = Math.max(0, activeComp.time - offsetSeconds);
                        }
                    }

                    if (myLayers.length > 0) {
                        let lowest_index = 999999;
                        let lowest = 999999;
                        for (let i = 0; i < myLayers.length; i += 1) {
                            if (myLayers[i].index < lowest_index) {
                                lowest = i;
                                lowest_index = myLayers[i].index;
                            }
                        }
                        const layer = activeComp.layers.add(itemToUse);
                        layer.startTime = startTime;
                        layer.moveBefore(myLayers[lowest]);
                    } else {
                        const layer = activeComp.layers.add(itemToUse);
                        layer.startTime = startTime;
                    }
                } else {
                    alert("ExcaliburFX ERROR: Unsupported file type.");
                }
                app.endUndoGroup();
            } else {
                alert("ExcaliburFX ERROR: Please select a composition.");
            }
            break;
        default:
            alert("ExcaliburFX ERROR: Not supported program");
            break;
    }
}

export function ExcaliburFXselectFolder(): string | null {
    const folder = Folder.selectDialog("Select a folder that you wanna add.");
    if (folder != null) {
        return folder.fsName;
    } else {
        return null;
    }
}

function setAudioVolumeKeyframes(
    fadeOutVal: number,
    brub: boolean,
    fullLevel: number = 0.1775,
    silenceLevel: number = 0.0014
): void {
    const sequence = app.project.activeSequence;
    if (!sequence) {
        alert("No active sequence found.");
        return;
    }
    const selectedClips = sequence.getSelection();
    if (selectedClips.length === 0) {
        alert("No clips selected.");
        return;
    }
    
    for (let i = 0; i < selectedClips.length; i += 1) {
        const clip = selectedClips[i];
        const audioComponents = clip.components;
        let volumeComponent = null;
        
        for (let j = 0; j < audioComponents.numItems; j += 1) {
            if (audioComponents[j].displayName === "Volume") {
                volumeComponent = audioComponents[j];
                break;
            }
        }
        
        if (!volumeComponent) {
            continue;
        }
        
        const volumeProperty = volumeComponent.properties[1];
        const inPoint = clip.inPoint.seconds;
        const outPoint = clip.outPoint.seconds;
        
        volumeProperty.addKey(inPoint);
        volumeProperty.setValueAtKey(inPoint, fullLevel, 0);
        
        if (volumeProperty.isTimeVarying()) {
            const keyframeCount = volumeProperty.getKeys().length;
            for (let k = keyframeCount - 1; k >= 0; k--) {
                volumeProperty.removeKey(volumeProperty.getKeys()[k]);
            }
        }
        
        volumeProperty.setTimeVarying(true);
        const diff = (outPoint - inPoint) * fadeOutVal;

        if (brub) {
            volumeProperty.addKey(outPoint - diff);
            volumeProperty.setValueAtKey(outPoint - diff, fullLevel, 1);
            volumeProperty.addKey(outPoint);
            volumeProperty.setValueAtKey(outPoint, silenceLevel, 1);
        } else {
            volumeProperty.addKey(inPoint);
            volumeProperty.setValueAtKey(inPoint, silenceLevel, 1);
            volumeProperty.addKey(inPoint + diff);
            volumeProperty.setValueAtKey(inPoint + diff, fullLevel, 1);
        }
    }
}

export function FadeInLevel(fadeInVal: string | number, strengthVal: string | number): void {
    const numFadeInVal = Number(fadeInVal) / 100;
    const numStrengthVal = Number(strengthVal);
    
    switch (WhatProgrammIsGettingUsed()) {
        case 1:
            const premiereFullLevel = 0.1775 * Math.pow(10, numStrengthVal / 20);
            setAudioVolumeKeyframes(numFadeInVal, false, premiereFullLevel);
            break;
        case 2:
            app.beginUndoGroup("ExcaliburFX Fade in");
            const comp = app.project.activeItem;
            if (comp instanceof CompItem) {
                const myLayers = comp.selectedLayers;
                if (myLayers.length <= 0) {
                    alert("ExcaliburFX ERROR: Please select at least one layer.");
                    return;
                }
                
                for (let i = 0; i < myLayers.length; i += 1) {
                    const inPoint = Math.min(myLayers[i].inPoint, myLayers[i].outPoint);
                    const outPoint = Math.max(myLayers[i].inPoint, myLayers[i].outPoint);
                    const layer = myLayers[i];
                    const audioLevels = layer.property("Audio").property("Audio Levels");
                    
                    if (audioLevels == null) {
                        alert("ExcaliburFX ERROR: The selected layer does not have an audio property.");
                        continue;
                    }
                    
                    const numKeyframes = audioLevels.numKeys;
                    for (let k = numKeyframes; k > 0; k--) {
                        audioLevels.removeKey(k);
                    }
                    
                    const diff = (outPoint - inPoint) * numFadeInVal;
                    audioLevels.setValueAtTime(inPoint, [numStrengthVal, numStrengthVal]);
                    audioLevels.setValueAtTime(inPoint + diff, [0, 0]);
                }
                comp.openInViewer();
            } else {
                alert("ExcaliburFX ERROR: Please select a composition.");
            }
            app.endUndoGroup();
            break;
        default:
            alert("ExcaliburFX ERROR: Not supported program");
            break;
    }
}

export function FadeOutLevel(fadeOutVal: string | number, strengthVal: string | number): void {
    const numFadeOutVal = Number(fadeOutVal) / 100;
    const numStrengthVal = Number(strengthVal);

    switch (WhatProgrammIsGettingUsed()) {
        case 1:
            const premiereFullLevel = 0.1775 * Math.pow(10, numStrengthVal / 20);
            setAudioVolumeKeyframes(numFadeOutVal, true, premiereFullLevel);
            break;
        case 2:
            app.beginUndoGroup("ExcaliburFX Fade out");
            const comp = app.project.activeItem;
            if (comp instanceof CompItem) {
                const myLayers = comp.selectedLayers;
                if (myLayers.length <= 0) {
                    alert("ExcaliburFX ERROR: Please select at least one layer.");
                    return;
                }
                
                for (let i = 0; i < myLayers.length; i += 1) {
                    const inPoint = Math.min(myLayers[i].inPoint, myLayers[i].outPoint);
                    const outPoint = Math.max(myLayers[i].inPoint, myLayers[i].outPoint);
                    const layer = myLayers[i];
                    const audioLevels = layer.property("Audio").property("Audio Levels");
                    
                    if (audioLevels == null) {
                        alert("ExcaliburFX ERROR: The selected layer does not have an audio property.");
                        continue;
                    }
                    
                    const numKeyframes = audioLevels.numKeys;
                    for (let k = numKeyframes; k > 0; k--) {
                        audioLevels.removeKey(k);
                    }
                    
                    const diff = (outPoint - inPoint) * numFadeOutVal;
                    audioLevels.setValueAtTime(outPoint - diff, [0, 0]);
                    audioLevels.setValueAtTime(outPoint, [numStrengthVal, numStrengthVal]);
                }
                comp.openInViewer();
            } else {
                alert("ExcaliburFX ERROR: Please select a composition.");
            }
            app.endUndoGroup();
            break;
        default:
            alert("ExcaliburFX ERROR: Not supported program");
            break;
    }
}

export function ExcaliburFX_Lower(lowerAmount: string | number, spacingSeconds: string | number): void {
    const numLowerAmount = Number(lowerAmount);
    const numSpacing = Math.max(0.01, Number(spacingSeconds));

    switch (WhatProgrammIsGettingUsed()) {
        case 1:
            setPremiereLowerKeyframe(numLowerAmount, numSpacing);
            break;
        case 2:
            app.beginUndoGroup("ExcaliburFX Lower");
            const comp = app.project.activeItem;
            if (comp instanceof CompItem) {
                const myLayers = comp.selectedLayers;
                if (myLayers.length <= 0) {
                    alert("ExcaliburFX ERROR: Please select at least one layer.");
                    return;
                }

                const cursorTime = comp.time;

                for (let i = 0; i < myLayers.length; i += 1) {
                    const layer = myLayers[i];
                    const audioLevels = layer.property("Audio").property("Audio Levels");

                    if (audioLevels == null) {
                        alert("ExcaliburFX ERROR: The selected layer does not have an audio property.");
                        continue;
                    }

                    const leftTime = Math.max(layer.inPoint, cursorTime - numSpacing);
                    const rightTime = Math.min(layer.outPoint, cursorTime + numSpacing);

                    const currentAtLeft = audioLevels.valueAtTime(leftTime, false);
                    const currentAtCenter = audioLevels.valueAtTime(cursorTime, false);
                    const currentAtRight = audioLevels.valueAtTime(rightTime, false);

                    audioLevels.setValueAtTime(leftTime, [currentAtLeft[0], currentAtLeft[1]]);
                    audioLevels.setValueAtTime(cursorTime, [
                        currentAtCenter[0] - numLowerAmount,
                        currentAtCenter[1] - numLowerAmount
                    ]);
                    audioLevels.setValueAtTime(rightTime, [currentAtRight[0], currentAtRight[1]]);
                }
                comp.openInViewer();
            } else {
                alert("ExcaliburFX ERROR: Please select a composition.");
            }
            app.endUndoGroup();
            break;
        default:
            alert("ExcaliburFX ERROR: Not supported program");
            break;
    }
}

function setPremiereLowerKeyframe(lowerAmountDb: number, spacingSeconds: number): void {
    const sequence = app.project.activeSequence;
    if (!sequence) {
        alert("No active sequence found.");
        return;
    }
    const selectedClips = sequence.getSelection();
    if (selectedClips.length === 0) {
        alert("No clips selected.");
        return;
    }

    const cursorSeconds = sequence.getPlayerPosition().seconds;

    for (let i = 0; i < selectedClips.length; i += 1) {
        const clip = selectedClips[i];
        const audioComponents = clip.components;
        let volumeComponent = null;

        for (let j = 0; j < audioComponents.numItems; j += 1) {
            if (audioComponents[j].displayName === "Volume") {
                volumeComponent = audioComponents[j];
                break;
            }
        }

        if (!volumeComponent) {
            continue;
        }

        const volumeProperty = volumeComponent.properties[1];
        const inPoint = clip.inPoint.seconds;
        const outPoint = clip.outPoint.seconds;

        const centerTime = Math.min(Math.max(cursorSeconds, inPoint), outPoint);
        const leftTime = Math.max(inPoint, centerTime - spacingSeconds);
        const rightTime = Math.min(outPoint, centerTime + spacingSeconds);

        volumeProperty.setTimeVarying(true);

        const currentAtLeft = volumeProperty.getValueAtTime(leftTime);
        const currentAtCenter = volumeProperty.getValueAtTime(centerTime);
        const currentAtRight = volumeProperty.getValueAtTime(rightTime);
        const reducedCenterValue = currentAtCenter * Math.pow(10, -lowerAmountDb / 20);

        volumeProperty.addKey(leftTime);
        volumeProperty.setValueAtKey(leftTime, currentAtLeft, 1);

        volumeProperty.addKey(centerTime);
        volumeProperty.setValueAtKey(centerTime, reducedCenterValue, 1);

        volumeProperty.addKey(rightTime);
        volumeProperty.setValueAtKey(rightTime, currentAtRight, 1);
    }
}

export function ExcaliburFX_BassAndTreble(): void {
    app.beginUndoGroup("ExcaliburFX Bass & Treble");
    const comp = app.project.activeItem;
    if (comp instanceof CompItem) {
        const myLayers = comp.selectedLayers;
        if (myLayers.length <= 0) {
            alert("ExcaliburFX ERROR: Please select at least one layer.");
            return;
        }
        for (let i = 0; i < myLayers.length; i += 1) {
            myLayers[i].Effects.addProperty("ADBE Aud BT");
        }
    } else {
        alert("ExcaliburFX ERROR: Please select a composition.");
    }
    app.endUndoGroup();
}

export function ExcaliburFX_LowPass(): void {
    app.beginUndoGroup("ExcaliburFX LowPass");
    const comp = app.project.activeItem;
    if (comp instanceof CompItem) {
        const myLayers = comp.selectedLayers;
        if (myLayers.length <= 0) {
            alert("ExcaliburFX ERROR: Please select at least one layer.");
            return;
        }
        for (let i = 0; i < myLayers.length; i += 1) {
            const heightLowPass = myLayers[i].Effects.addProperty("ADBE Aud HiLo");
            heightLowPass.property(1).setValue(2);
            heightLowPass.property(2).setValue(1495);
        }
    } else {
        alert("ExcaliburFX ERROR: Please select a composition.");
    }
    app.endUndoGroup();
}

export function ExcaliburFX_HighPass(): void {
    app.beginUndoGroup("ExcaliburFX HighPass");
    const comp = app.project.activeItem;
    if (comp instanceof CompItem) {
        const myLayers = comp.selectedLayers;
        if (myLayers.length <= 0) {
            alert("ExcaliburFX ERROR: Please select at least one layer.");
            return;
        }
        for (let i = 0; i < myLayers.length; i += 1) {
            const heightLowPass = myLayers[i].Effects.addProperty("ADBE Aud HiLo");
            heightLowPass.property(1).setValue(1);
            heightLowPass.property(2).setValue(1373.5);
        }
    } else {
        alert("ExcaliburFX ERROR: Please select a composition.");
    }
    app.endUndoGroup();
}

export function ExcaliburFX_Reverb(): void {
    app.beginUndoGroup("ExcaliburFX Reverb");
    const comp = app.project.activeItem;
    if (comp instanceof CompItem) {
        const myLayers = comp.selectedLayers;
        if (myLayers.length <= 0) {
            alert("ExcaliburFX ERROR: Please select at least one layer.");
            return;
        }
        for (let i = 0; i < myLayers.length; i += 1) {
            myLayers[i].Effects.addProperty("ADBE Aud Reverb");
        }
    } else {
        alert("ExcaliburFX ERROR: Please select a composition.");
    }
    app.endUndoGroup();
}

export function ExcaliburFX_EQ(): void {
    app.beginUndoGroup("ExcaliburFX Equalizer");
    const comp = app.project.activeItem;
    if (comp instanceof CompItem) {
        const myLayers = comp.selectedLayers;
        if (myLayers.length <= 0) {
            alert("ExcaliburFX ERROR: Please select at least one layer.");
            return;
        }
        for (let i = 0; i < myLayers.length; i += 1) {
            myLayers[i].Effects.addProperty("ADBE Param EQ");
        }
    } else {
        alert("ExcaliburFX ERROR: Please select a composition.");
    }
    app.endUndoGroup();
}

export function ExcaliburFX_Delay(): void {
    app.beginUndoGroup("ExcaliburFX Equalizer");
    const comp = app.project.activeItem;
    if (comp instanceof CompItem) {
        const myLayers = comp.selectedLayers;
        if (myLayers.length <= 0) {
            alert("ExcaliburFX ERROR: Please select at least one layer.");
            return;
        }
        for (let i = 0; i < myLayers.length; i += 1) {
            myLayers[i].Effects.addProperty("ADBE Aud Delay");
        }
    } else {
        alert("ExcaliburFX ERROR: Please select a composition.");
    }
    app.endUndoGroup();
}

export function ExcaliburFX_SteroMixer(): void {
    app.beginUndoGroup("ExcaliburFX Equalizer");
    const comp = app.project.activeItem;
    if (comp instanceof CompItem) {
        const myLayers = comp.selectedLayers;
        if (myLayers.length <= 0) {
            alert("ExcaliburFX ERROR: Please select at least one layer.");
            return;
        }
        for (let i = 0; i < myLayers.length; i += 1) {
            myLayers[i].Effects.addProperty("ADBE Aud Stereo Mixer");
        }
    } else {
        alert("ExcaliburFX ERROR: Please select a composition.");
    }
    app.endUndoGroup();
}


export function addMotionTile(borderSize: number = 200): void {
    app.beginUndoGroup("ExcaliburFX Motion Tile");
    try {
        const comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) {
            alert("ExcaliburFX ERROR: Please select an active composition.");
            return;
        }

        const myLayers = comp.selectedLayers;
        if (myLayers.length <= 0) {
            alert("ExcaliburFX ERROR: Please select at least one layer.");
            return;
        }

        const safeBorderSize = Math.min(1000, Math.max(100, Number(borderSize) || 200));

        for (let i = 0; i < myLayers.length; i++) {
            const layer = myLayers[i];
            const effectsGroup = layer.property("ADBE Effect Parade") as PropertyGroup | null;
            if (!effectsGroup) continue;

            const motionTile = effectsGroup.addProperty("ADBE Tile") as PropertyGroup;

            motionTile.property(1).expression =
              "[thisComp.width / 2, thisComp.height / 2]";
            motionTile.property(6).setValue(true);
            motionTile.property(4).setValue(safeBorderSize);
            motionTile.property(5).setValue(safeBorderSize);
        }
    } finally {
        app.endUndoGroup();
    }
}



































































const defaultMotionBlurexcalibur = 55;
const minimumMotionBlurexcalibur = 0.1;
const SHAKE_FRAME_excalibur = 0.0333333333;
const FAST_IN_EB = [0.05, 0.9, 0.2, 1];

function collectOneDProps(group: any, out: any[]): void {
  for (var i = 1; i <= group.numProperties; i += 1) {
    var p = group.property(i);
    if (!p) continue;
    if (p.propertyType === PropertyType.PROPERTY) {
      if (p.propertyValueType === PropertyValueType.OneD) out.push(p);
    } else {
      collectOneDProps(p, out);
    }
  }
}

function findExposureProp(effect: any): any {
  var props: any[] = [];
  collectOneDProps(effect, props);
  var best: any = null;
  var bestScore = -1;
  for (var i = 0; i < props.length; i += 1) {
    var p = props[i];
    if (p.hasMin && p.minValue > 0) continue;
    var score = p.hasMin && p.hasMax ? p.maxValue - p.minValue : 100000;
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return best;
}

function addExposure(effects: any, name: string): any {
  var effect = effects.addProperty("ADBE Exposure2");
  if (name) effect.name = name;
  var prop = findExposureProp(effect);
  if (!prop) throw new Error("Exposure property is unavailable.");
  return prop;
}

function clampInfJF(v: number): number {
  return Math.max(0.1, Math.min(100, v));
}

function easeInFromCurveJF(speed: number, c: any): any {
  if (c === "hold") return new KeyframeEase(0, 16.67);
  if (!c) return new KeyframeEase(speed, 33.333);
  var slope = c[2] < 1 ? (1 - c[3]) / (1 - c[2]) : 0;
  return new KeyframeEase(speed * slope, clampInfJF((1 - c[2]) * 100));
}

function easeOutFromCurveJF(speed: number, c: any): any {
  if (c === "hold") return new KeyframeEase(0, 16.67);
  if (!c) return new KeyframeEase(speed, 33.333);
  var slope = c[0] > 0 ? c[1] / c[0] : 0;
  return new KeyframeEase(speed * slope, clampInfJF(c[0] * 100));
}

function applyCurvesJF(prop: any, curves: any[]): void {
  var n = prop.numKeys;
  if (n < 2) return;
  var dims = curves.length;
  var anyCurve = false;
  for (var d0 = 0; d0 < dims; d0 += 1) {
    for (var s0 = 0; s0 < n - 1; s0 += 1) {
      if (curves[d0][s0]) anyCurve = true;
    }
  }
  if (!anyCurve) return;

  var vt = prop.propertyValueType;
  var spatial =
    vt === PropertyValueType.TwoD_SPATIAL ||
    vt === PropertyValueType.ThreeD_SPATIAL;

  function segInfo(k: number, d: number): any {
    var dt = prop.keyTime(k + 1) - prop.keyTime(k);
    var a: any = prop.keyValue(k);
    var b: any = prop.keyValue(k + 1);
    if (spatial) {
      var best = 0;
      var bestMove = -1;
      var sum = 0;
      for (var i = 0; i < a.length; i += 1) {
        var m = Math.abs(b[i] - a[i]);
        sum += m * m;
        if (m > bestMove && i < dims) {
          bestMove = m;
          best = i;
        }
      }
      return {
        speed: dt > 0 ? Math.sqrt(sum) / dt : 0,
        curve: curves[best][k - 1],
      };
    }
    var delta = typeof a === "number" ? b - a : b[d] - a[d];
    return { speed: dt > 0 ? delta / dt : 0, curve: curves[d][k - 1] };
  }

  var k: number;
  for (k = 1; k <= n; k += 1) {
    prop.setInterpolationTypeAtKey(
      k,
      KeyframeInterpolationType.BEZIER,
      KeyframeInterpolationType.BEZIER,
    );
  }
  var holdKeys: number[] = [];
  var easeDims = spatial ? 1 : dims;
  for (k = 1; k <= n; k += 1) {
    var inE: any[] = [];
    var outE: any[] = [];
    for (var d = 0; d < easeDims; d += 1) {
      var ie: any = new KeyframeEase(0, 16.67);
      var oe: any = new KeyframeEase(0, 16.67);
      if (k > 1) {
        var si = segInfo(k - 1, d);
        ie = easeInFromCurveJF(si.speed, si.curve);
      }
      if (k < n) {
        var so = segInfo(k, d);
        oe = easeOutFromCurveJF(so.speed, so.curve);
        if (d === 0 && so.curve === "hold") holdKeys.push(k);
      }
      inE.push(ie);
      outE.push(oe);
    }
    prop.setTemporalEaseAtKey(k, inE, outE);
  }
  for (var h = 0; h < holdKeys.length; h += 1) {
    try {
      prop.setInterpolationTypeAtKey(
        holdKeys[h],
        KeyframeInterpolationType.BEZIER,
        KeyframeInterpolationType.HOLD,
      );
    } catch (e) {}
  }
}

function curvesFromKeysJF(keys: any[], dims: number): any[] {
  var curves: any[] = [];
  for (var d = 0; d < dims; d += 1) {
    var row: any[] = [];
    for (var s = 0; s < keys.length - 1; s += 1) {
      var e = keys[s].ease ? keys[s].ease[d] : null;
      row.push(e ? e : null);
    }
    curves.push(row);
  }
  return curves;
}

function setKeysCurveEBFX(prop: any, keys: any[]): void {
  var curves: any[] = [];
  for (var i = 0; i < keys.length; i += 1) {
    prop.setValueAtTime(keys[i].t, keys[i].v);
    if (i < keys.length - 1) curves.push(keys[i].c ? keys[i].c : null);
  }
  applyCurvesJF(prop, [curves]);
}


function clampJF(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function numJF(v: any, def: number): number {
  var n = Number(v);
  if (v === null || v === undefined || v === "" || isNaN(n)) return def;
  return n;
}

function makeRngexcalibur(seedText: string) {
  var h = 0;
  for (var i = 0; i < seedText.length; i += 1) {
    h = (h * 31 + seedText.charCodeAt(i)) % 4294967296;
  }
  var state = h;
  return function () {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function nullEaseJF(n: number): any[] {
  var out: any[] = [];
  for (var i = 0; i < n; i += 1) out.push(null);
  return out;
}

function mkKeyJF(f: number, v: number[], ease?: any[]): any {
  return { f: f, v: v, ease: ease ? ease : nullEaseJF(v.length) };
}

function buildGroupsJF(p: any, aspect: number): any {
  var D = Math.round(clampJF(numJF(p.duration, 14), 4, 30));
  var N = Math.round(clampJF(numJF(p.bounces, 6), 1, 12));
  var decay = clampJF(numJF(p.decay, 70), 10, 95) / 100;
  var ax = clampJF(numJF(p.posX, 12), 0, 60) / 100;
  var ay = clampJF(numJF(p.posY, 12), 0, 60) / 100;
  var ar = clampJF(numJF(p.rotation, 3), 0, 30);
  var az = clampJF(numJF(p.zoom, 6), 0, 40) / 100;
  var blurAmount = clampJF(numJF(p.blur, 60), 0, 100) / 100;
  var falloff = clampJF(numJF(p.blurFalloff, 50), 10, 100);

  var rnd = makeRngexcalibur(String(p.seed || p.name || "shake"));
  rnd();
  rnd();
  rnd();
  var dirX = rnd() < 0.5 ? 1 : -1;
  var dirY = rnd() < 0.5 ? 1 : -1;
  var dirR = rnd() < 0.5 ? 1 : -1;

  var pos: any[] = [];
  var rot: any[] = [];
  var scale: any[] = [];
  for (var i = 0; i < N; i += 1) {
    var alt = i % 2 === 0 ? 1 : -1;
    var g = Math.pow(decay, i);
    var jx = 0.75 + 0.25 * rnd();
    var jy = 0.75 + 0.25 * rnd();
    var jr = 0.75 + 0.25 * rnd();
    var f = (D * i) / N;
    pos.push(mkKeyJF(f, [dirX * alt * ax * g * jx, dirY * alt * ay * g * jy]));
    rot.push(mkKeyJF(f, [dirR * alt * ar * g * jr]));
    scale.push(mkKeyJF(f, [1 + (i % 2 === 0 ? az * g : 0)]));
  }
  pos.push(mkKeyJF(D, [0, 0]));
  rot.push(mkKeyJF(D, [0]));
  scale.push(mkKeyJF(D, [1]));

  var blurLen = Math.max(
    minimumMotionBlurexcalibur,
    defaultMotionBlurexcalibur * blurAmount,
  );
  var blurEnd = Math.max(0.5, (D * falloff) / 100);
  var blur = [
    mkKeyJF(0, [blurLen]),
    mkKeyJF(blurEnd, [minimumMotionBlurexcalibur]),
  ];

  var angle: number;
  if (p.blurAuto === false) {
    angle = clampJF(numJF(p.blurAngle, 0), 0, 180);
  } else {
    var mx = dirX * ax * aspect;
    var my = dirY * ay;
    angle = mx === 0 && my === 0 ? 0 : (Math.atan2(-mx, my) * 180) / Math.PI;
    angle = ((angle % 180) + 180) % 180;
  }

  return {
    frames: D,
    angle: angle,
    pos: pos,
    rot: rot,
    scale: scale,
    blur: blur,
  };
}

function applyOverridesJF(keys: any[], ov: any): void {
  if (!ov) return;
  for (var i = 0; i < keys.length; i += 1) {
    var o = ov[i];
    if (!o) continue;
    var k = keys[i];
    if (typeof o.f === "number") k.f = o.f;
    if (o.v && o.v.length === k.v.length) {
      for (var d = 0; d < k.v.length; d += 1) k.v[d] = o.v[d];
    }
    if (o.ease && o.ease.length === k.v.length) {
      for (var e = 0; e < k.v.length; e += 1) k.ease[e] = o.ease[e];
    }
  }
}

function lastFrameJF(keys: any[]): number {
  var m = 0;
  for (var i = 0; i < keys.length; i += 1) m = Math.max(m, keys[i].f);
  return m;
}

function effectsMaxFrameJF(effects: any): number {
  var m = 0;
  if (!effects) return m;
  for (var i = 0; i < effects.length; i += 1) {
    var props = effects[i].props || [];
    for (var j = 0; j < props.length; j += 1) {
      if (props[j].keys && props[j].keys.length > 1) {
        m = Math.max(m, lastFrameJF(props[j].keys));
      }
    }
  }
  return m;
}

function valueForPropJF(arr: number[], vt: string): any {
  if (vt === "1d") return arr[0];
  var out: number[] = [];
  for (var i = 0; i < arr.length; i += 1) out.push(arr[i]);
  return out;
}

function writeKeysJF(
  prop: any,
  keys: any[],
  vt: string,
  inP: number,
  outP: number,
  frameSec: number,
  mapValue?: (v: number[]) => any,
): void {
  for (var k = 0; k < keys.length; k += 1) {
    var t = Math.min(inP + keys[k].f * frameSec, outP);
    prop.setValueAtTime(
      t,
      mapValue ? mapValue(keys[k].v) : valueForPropJF(keys[k].v, vt),
    );
  }
  applyCurvesJF(prop, curvesFromKeysJF(keys, keys[0].v.length));
}

function vtNameJF(p: any): string {
  switch (p.propertyValueType) {
    case PropertyValueType.OneD:
      return "1d";
    case PropertyValueType.TwoD:
    case PropertyValueType.TwoD_SPATIAL:
      return "2d";
    case PropertyValueType.ThreeD:
    case PropertyValueType.ThreeD_SPATIAL:
      return "3d";
    case PropertyValueType.COLOR:
      return "color";
    default:
      return "";
  }
}

function asArrayJF(v: any): number[] {
  if (typeof v === "number") return [v];
  var out: number[] = [];
  for (var i = 0; i < v.length; i += 1) out.push(v[i]);
  return out;
}

function round4JF(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function captureEaseJF(prop: any, k: number, dims: number): any[] {
  var out: any[] = [];
  var outT = prop.keyOutInterpolationType(k);
  var inT = prop.keyInInterpolationType(k + 1);
  var vt = prop.propertyValueType;
  var spatial =
    vt === PropertyValueType.TwoD_SPATIAL ||
    vt === PropertyValueType.ThreeD_SPATIAL;
  var dt = prop.keyTime(k + 1) - prop.keyTime(k);
  var a: any = prop.keyValue(k);
  var b: any = prop.keyValue(k + 1);
  for (var d = 0; d < dims; d += 1) {
    if (outT === KeyframeInterpolationType.HOLD) {
      out.push("hold");
      continue;
    }
    if (
      outT === KeyframeInterpolationType.LINEAR &&
      inT === KeyframeInterpolationType.LINEAR
    ) {
      out.push(null);
      continue;
    }
    try {
      var oe: any = prop.keyOutTemporalEase(k);
      var ie: any = prop.keyInTemporalEase(k + 1);
      var eo = oe[Math.min(d, oe.length - 1)];
      var ei = ie[Math.min(d, ie.length - 1)];
      var avg = 0;
      if (dt > 0) {
        if (typeof a === "number") avg = (b - a) / dt;
        else if (spatial) {
          var sum = 0;
          for (var i = 0; i < a.length; i += 1) {
            sum += (b[i] - a[i]) * (b[i] - a[i]);
          }
          avg = Math.sqrt(sum) / dt;
        } else avg = (b[d] - a[d]) / dt;
      }
      if (Math.abs(avg) < 1e-9) {
        out.push(null);
        continue;
      }
      var x1 = outT === KeyframeInterpolationType.LINEAR ? 1 / 3 : eo.influence / 100;
      var y1 = outT === KeyframeInterpolationType.LINEAR ? 1 / 3 : (x1 * eo.speed) / avg;
      var x2 = inT === KeyframeInterpolationType.LINEAR ? 2 / 3 : 1 - ei.influence / 100;
      var y2 = inT === KeyframeInterpolationType.LINEAR ? 2 / 3 : 1 - ((1 - x2) * ei.speed) / avg;
      out.push([
        round4JF(clampJF(x1, 0, 1)),
        round4JF(clampJF(y1, -3, 4)),
        round4JF(clampJF(x2, 0, 1)),
        round4JF(clampJF(y2, -3, 4)),
      ]);
    } catch (e) {
      out.push(null);
    }
  }
  return out;
}

function walkEffectPropsJF(
  group: any,
  path: number[],
  out: any[],
  groupLabel: string,
): void {
  for (var i = 1; i <= group.numProperties; i += 1) {
    var p = group.property(i);
    if (!p) continue;
    if (p.propertyType === PropertyType.PROPERTY) {
      var vt = vtNameJF(p);
      if (!vt) continue;
      try {
        var dims = vt === "1d" ? 1 : vt === "2d" ? 2 : vt === "3d" ? 3 : 4;
        var name = p.name ? p.name : p.matchName;
        var entry: any = {
          path: path.concat([i]),
          label: groupLabel ? groupLabel + " › " + name : name,
          matchName: p.matchName,
          vt: vt,
        };
        if (vt === "1d") {
          if (p.hasMin) entry.min = p.minValue;
          if (p.hasMax) entry.max = p.maxValue;
        }
        if (p.numKeys > 1) {
          var keys: any[] = [];
          for (var k = 1; k <= p.numKeys; k += 1) {
            keys.push({
              t: p.keyTime(k),
              v: asArrayJF(p.keyValue(k)),
              ease:
                k < p.numKeys ? captureEaseJF(p, k, dims) : nullEaseJF(dims),
            });
          }
          entry.keys = keys;
          entry.value = keys[0].v;
        } else if (p.numKeys === 1) {
          entry.value = asArrayJF(p.keyValue(1));
        } else {
          entry.value = asArrayJF(p.value);
        }
        if (p.expressionEnabled && p.expression) entry.expression = p.expression;
        out.push(entry);
      } catch (e) {
      }
    } else {
      walkEffectPropsJF(
        p,
        path.concat([i]),
        out,
        groupLabel ? groupLabel + " › " + p.name : p.name,
      );
    }
  }
}

function captureEffectJF(effect: any): any {
  var props: any[] = [];
  walkEffectPropsJF(effect, [], props, "");
  return {
    matchName: effect.matchName,
    name: effect.name,
    enabled: effect.enabled !== false,
    props: props,
  };
}

function rebaseCapturedJF(list: any[]): void {
  var anchor = -1;
  var i: number;
  var j: number;
  var k: number;
  for (i = 0; i < list.length; i += 1) {
    for (j = 0; j < list[i].props.length; j += 1) {
      var ks = list[i].props[j].keys;
      if (!ks) continue;
      for (k = 0; k < ks.length; k += 1) {
        if (anchor < 0 || ks[k].t < anchor) anchor = ks[k].t;
      }
    }
  }
  if (anchor < 0) anchor = 0;
  for (i = 0; i < list.length; i += 1) {
    for (j = 0; j < list[i].props.length; j += 1) {
      var keys = list[i].props[j].keys;
      if (!keys) continue;
      for (k = 0; k < keys.length; k += 1) {
        keys[k].f =
          Math.round(((keys[k].t - anchor) / SHAKE_FRAME_excalibur) * 1000) /
          1000;
        delete keys[k].t;
      }
    }
  }
}

export function captureLayerEffects(): string {
  var comp = resolveActiveComp();
  if (!comp) return fail("Please select a composition.");
  var sel = comp.selectedLayers;
  if (!sel || sel.length === 0) {
    return fail("Select the layer that has the effects to capture.");
  }
  var parade = sel[0].property("ADBE Effect Parade");
  if (!parade || parade.numProperties === 0) {
    return fail("This layer has no effects.");
  }
  try {
    var onlySelected = false;
    var i: number;
    for (i = 1; i <= parade.numProperties; i += 1) {
      if (parade.property(i).selected) onlySelected = true;
    }
    var list: any[] = [];
    for (i = 1; i <= parade.numProperties; i += 1) {
      var fx = parade.property(i);
      if (onlySelected && !fx.selected) continue;
      list.push(captureEffectJF(fx));
    }
    rebaseCapturedJF(list);
    return ok({ effects: list });
  } catch (error: any) {
    return fail(error && error.message ? error.message : String(error));
  }
}

export function describeEffectByName(matchName: string): string {
  var comp = resolveActiveComp();
  if (!comp) return fail("Please select a composition.");
  if (!matchName) return fail("Enter an effect match name (e.g. ADBE Glo2).");
  var probe: any = null;
  app.beginUndoGroup("Read effect");
  try {
    var effects = app.effects;
    for (var effectIndex = 0; effectIndex < effects.length; effectIndex += 1) {
      var availableEffect = effects[effectIndex];
      if (
        availableEffect.displayName === matchName &&
        availableEffect.matchName
      ) {
        matchName = availableEffect.matchName;
        break;
      }
    }
    probe = comp.layers.addSolid([0, 0, 0], "__fx_probe__", 100, 100, 1, 1);
    var fx = probe.property("ADBE Effect Parade").addProperty(matchName);
    if (!fx) throw new Error("Unknown effect: " + matchName);
    var list = [captureEffectJF(fx)];
    rebaseCapturedJF(list);
    return ok({ effects: list });
  } catch (error: any) {
    return fail(
      error && error.message ? error.message : "Unknown effect: " + matchName,
    );
  } finally {
    if (probe) {
      try {
        probe.remove();
      } catch (e) {}
    }
    app.endUndoGroup();
  }
}

function resolvePropJF(effect: any, saved: any): any {
  var cur: any = effect;
  var parent: any = effect;
  try {
    for (var i = 0; i < saved.path.length; i += 1) {
      parent = cur;
      cur = cur.property(saved.path[i]);
      if (!cur) break;
    }
  } catch (e) {
    cur = null;
  }
  if (cur && cur.matchName === saved.matchName) return cur;
  try {
    var alt = parent.property(saved.matchName);
    if (alt) return alt;
  } catch (e2) {}
  return null;
}

function applyCapturedEffectEXBX(
  effects: any,
  fx: any,
  inP: number,
  outP: number,
  frameSec: number,
  errors: string[],
): void {
  var effect = effects.addProperty(fx.matchName);
  if (!effect) throw new Error("Effect unavailable: " + fx.matchName);
  if (fx.name) effect.name = fx.name;
  for (var i = 0; i < fx.props.length; i += 1) {
    var saved = fx.props[i];
    var prop = resolvePropJF(effect, saved);
    if (!prop) {
      errors.push(fx.name + " › " + saved.label + ": not found");
      continue;
    }
    try {
      if (saved.expression) {
        prop.expression = saved.expression;
      } else if (saved.keys && saved.keys.length > 1) {
        writeKeysJF(prop, saved.keys, saved.vt, inP, outP, frameSec);
      } else if (saved.value) {
        prop.setValue(valueForPropJF(saved.value, saved.vt));
      }
    } catch (e: any) {
    }
  }
  if (fx.enabled === false) effect.enabled = false;
}






export function ExcaliburBasicShake(
  C_CompTime: number | string,
  C_Shk_Speed: number | string,
  C_Shk_Strength: number | string,
  C_Color: number | string,
  F_duration: number | string,
  F_strenght: number | string,
  F_color: number | string,
  F_withblendmode: number | string,
  F_enable: number | string,
): string {
  var myComp = resolveActiveComp();
  if (!myComp) return fail("Please select a composition.");

  var myLayers = myComp.selectedLayers;
  if (!myLayers || myLayers.length === 0) {
    return fail("Please select at least one layer.");
  }
  if (Number(C_CompTime) && myLayers.length > 1) {
    return fail("The comp time option only works with one selected layer.");
  }

  app.beginUndoGroup("excalibur Basic Shake");
  try {
    const shkStrength = Number(C_Shk_Strength) / 100;

    const shkLength = Math.max(10, 200 - Number(C_Shk_Speed));
    const speedFactor = shkLength / 100;

    var frameDuration =
      myComp.frameDuration * (0.0333333333 / myComp.frameDuration);

    var step = frameDuration * speedFactor;

    for (var i = 0; i < myLayers.length; i += 1) {
      var targetStart = Math.min(myLayers[i].inPoint, myLayers[i].outPoint);
      var shakeStart = Number(C_CompTime) ? myComp.time : targetStart;

      var solidLength = step * 10;

      var solid = myComp.layers.addSolid(
        returnColorFunc(Number(C_Color)),
        "Basic (excalibur)",
        myComp.width,
        myComp.height,
        1,
        solidLength,
      );
      solid.moveBefore(myLayers[i]);
      solid.adjustmentLayer = true;

      solid.startTime = shakeStart;
      solid.inPoint = shakeStart;
      solid.outPoint = shakeStart + solidLength;

      solid.label = Number(C_Color);
      solid.motionBlur = true;

      var newOutPoint = solid.outPoint;
      var effects = solid.property("ADBE Effect Parade");
      var repeTile = effects.addProperty("CC RepeTile");
      repeTile.property(1).setValue(500);
      repeTile.property(2).setValue(500);
      repeTile.property(3).setValue(500);
      repeTile.property(4).setValue(500);
      repeTile.property(5).setValue(4);

      var centerX = myComp.width / 2;
      var centerY = myComp.height / 2;
      var transform = effects.addProperty("ADBE Geometry2");
      var position = transform && transform.property(2);
      if (!position) throw new Error("Shake transform position is unavailable.");

      position.setValueAtTime(
        shakeStart,
        [centerX, centerY * (1 + 0.045 * shkStrength)],
      );
      position.setValueAtTime(
        shakeStart + step * 2,
        [centerX, centerY * (1 - 0.02 * shkStrength)],
      );
      position.setValueAtTime(
        shakeStart + step * 5,
        [centerX, centerY * (1 + 0.01 * shkStrength)],
      );
      position.setValueAtTime(newOutPoint, [centerX, centerY]);

      var directionalBlur = effects.addProperty("ADBE Motion Blur");
      directionalBlur.property(1).setValue(0);
      directionalBlur.property(2).setValueAtTime(
        shakeStart,
        defaultMotionBlurexcalibur * shkStrength,
      );
      directionalBlur.property(2).setValueAtTime(
        shakeStart + step * 5,
        minimumMotionBlurexcalibur,
      );

      if (Number(F_enable)) {
        var flashExposure = addExposure(effects, "Flash Exposure");
        var flashFr = Math.max(1, Math.min(10, Number(F_duration) || 5));
        var flashEndTime = Math.min(
          shakeStart + step * flashFr,
          newOutPoint,
        );
        var flashAmt =
          (Math.max(1, Math.min(100, Number(F_strenght) || 100)) / 100) * 2;

        setKeysCurveEBFX(flashExposure, [
          { t: shakeStart, v: flashAmt, c: [0.05, 0.9, 0.2, 1] },
          { t: flashEndTime, v: 0 },
        ]);
      }
    }

    myComp.openInViewer();
    return ok({ added: myLayers.length });
  } catch (error: any) {
    return fail(error && error.message ? error.message : String(error));
  } finally {
    app.endUndoGroup();
  }
}
export function ExcaliburMinimaxShake(
  C_CompTime: number | string,
  C_Shk_Speed: number | string,
  C_Shk_Strength: number | string,
  C_Color: number | string,
  F_duration: number | string,
  F_strenght: number | string,
  F_color: number | string,
  F_withblendmode: number | string,
  F_enable: number | string,
): string {
  var myComp = resolveActiveComp();
  if (!myComp) return fail("Please select a composition.");

  var myLayers = myComp.selectedLayers;
  if (!myLayers || myLayers.length === 0) {
    return fail("Please select at least one layer.");
  }
  if (Number(C_CompTime) && myLayers.length > 1) {
    return fail("The comp time option only works with one selected layer.");
  }

  app.beginUndoGroup("excalibur Minimax Shake");
  try {
    const shkStrength = Number(C_Shk_Strength) / 100;

    const shkLength = Math.max(10, 200 - Number(C_Shk_Speed));
    const speedFactor = shkLength / 100;

    var frameDuration =
      myComp.frameDuration * (0.0333333333 / myComp.frameDuration);

    var step = frameDuration * speedFactor;

    for (var i = 0; i < myLayers.length; i += 1) {
      var targetStart = Math.min(myLayers[i].inPoint, myLayers[i].outPoint);
      if (Number(C_CompTime)) targetStart = myComp.time;

      var solidLength = step * 14;

      var solid = myComp.layers.addSolid(
        returnColorFunc(Number(C_Color)),
        "Minimax Shakes",
        myComp.width,
        myComp.height,
        1,
        solidLength,
      );
      solid.moveBefore(myLayers[i]);
      solid.adjustmentLayer = true;
      solid.label = Number(C_Color);
      solid.motionBlur = true;

      var shakeStart = targetStart;

      var animStart = shakeStart - (step * 2);

      solid.startTime = animStart;
      solid.inPoint = animStart;
      solid.outPoint = shakeStart + (step * 10);
      var newOutPoint = solid.outPoint;

      var effects = solid.property("ADBE Effect Parade");
      var repeTile = effects.addProperty("CC RepeTile");
      repeTile.property(1).setValue(500);
      repeTile.property(2).setValue(500);
      repeTile.property(3).setValue(500);
      repeTile.property(4).setValue(500);
      repeTile.property(5).setValue(4);

      var centerX = myComp.width / 2;
      var centerY = myComp.height / 2;
      var transform = effects.addProperty("ADBE Geometry2");
      var position = transform && transform.property(2);
      if (!position) throw new Error("Shake transform position is unavailable.");

      position.setValueAtTime(animStart, [centerX, centerY]);
      position.setValueAtTime(
        shakeStart,
        [centerX, centerY * (1 + 0.045 * shkStrength)],
      );
      position.setValueAtTime(
        shakeStart + step * 2,
        [centerX, centerY * (1 - 0.02 * shkStrength)],
      );
      position.setValueAtTime(
        shakeStart + step * 5,
        [centerX, centerY * (1 + 0.01 * shkStrength)],
      );
      position.setValueAtTime(newOutPoint, [centerX, centerY]);

      var directionalBlur = effects.addProperty("ADBE Motion Blur");
      directionalBlur.property(1).setValue(0);
      directionalBlur.property(2).setValueAtTime(
        animStart,
        minimumMotionBlurexcalibur,
      );
      directionalBlur.property(2).setValueAtTime(
        shakeStart,
        defaultMotionBlurexcalibur * shkStrength,
      );
      directionalBlur.property(2).setValueAtTime(
        shakeStart + step * 5,
        minimumMotionBlurexcalibur,
      );

      var minimax = effects.addProperty("ADBE Minimax");
      minimax.property(4).setValue(3);

      setKeysCurveEBFX(minimax.property(2), [
        { t: animStart, v: 0, c: [0.59, 0.00, 1.00, 0.00] },
        { t: shakeStart, v: 60, c: [0.00, 0.00, 0.15, 1.00] },
        { t: shakeStart + step * 5, v: 0 },
      ]);

      var gaussianBlur = effects.addProperty("ADBE Gaussian Blur 2");
      setKeysCurveEBFX(gaussianBlur.property(1), [
        { t: animStart, v: 0, c: [0.8, 0, 0.95, 1] },
        { t: shakeStart, v: 7, c: [0.42, 0, 0.58, 1] },
        { t: shakeStart + step * 3, v: 0 },
      ]);

      if (Number(F_enable)) {
        var flashExposure = addExposure(effects, "Flash Exposure");
        var flashFr = Math.max(1, Math.min(10, Number(F_duration) || 5));
        var flashEndTime = Math.min(
          shakeStart + step * flashFr,
          newOutPoint,
        );
        var flashAmt = (Math.max(1, Math.min(100, Number(F_strenght) || 100)) / 100) * 2;

        setKeysCurveEBFX(flashExposure, [
          { t: animStart, v: 0, c: [0.8, 0, 0.95, 1] },
          { t: shakeStart, v: flashAmt, c: [0, .01, .19, 1] },
          { t: flashEndTime, v: 0 },
        ]);
      }
    }

    myComp.openInViewer();
    return ok({ added: myLayers.length });
  } catch (error: any) {
    return fail(error && error.message ? error.message : String(error));
  } finally {
    app.endUndoGroup();
  }
}
export function ExcaliburOrbitShake(
  C_CompTime: number | string,
  C_Shk_Speed: number | string,
  C_Shk_Strength: number | string,
  C_Color: number | string,
  F_duration: number | string,
  F_strenght: number | string,
  F_color: number | string,
  F_withblendmode: number | string,
  F_enable: number | string,
): string {
  var myComp = resolveActiveComp();
  if (!myComp) return fail("Please select a composition.");

  var myLayers = myComp.selectedLayers;
  if (!myLayers || myLayers.length === 0) {
    return fail("Please select at least one layer.");
  }
  if (Number(C_CompTime) && myLayers.length > 1) {
    return fail("The comp time option only works with one selected layer.");
  }

  app.beginUndoGroup("excalibur Orbit Shake");
  try {
    const shkStrength = Number(C_Shk_Strength) / 100;

    const shkLength = Math.max(10, 200 - Number(C_Shk_Speed));
    const speedFactor = shkLength / 100;

    var frameDuration =
      myComp.frameDuration * (0.0333333333 / myComp.frameDuration);

    var step = frameDuration * speedFactor;

    for (var i = 0; i < myLayers.length; i += 1) {
      var targetStart = Math.min(myLayers[i].inPoint, myLayers[i].outPoint);
      var shakeStart = Number(C_CompTime) ? myComp.time : targetStart;

      var solidLength = step * 10;

      var solid = myComp.layers.addSolid(
        returnColorFunc(Number(C_Color)),
        "Basic (excalibur)",
        myComp.width,
        myComp.height,
        1,
        solidLength,
      );
      solid.moveBefore(myLayers[i]);
      solid.adjustmentLayer = true;

      solid.startTime = shakeStart;
      solid.inPoint = shakeStart;
      solid.outPoint = shakeStart + solidLength;

      solid.label = Number(C_Color);
      solid.motionBlur = true;

      var newInPoint = solid.inPoint;
      var newOutPoint = solid.outPoint;
      var effects = solid.property("ADBE Effect Parade");

      var motionTile = effects.addProperty("ADBE Tile");
      motionTile.property(6).setValue(true);
      motionTile.property(5).setValue(120);
      motionTile.property(4).setValue(120);

      motionTile.property(2).setValueAtTime(newInPoint, 100 - (15 * shkStrength));
      motionTile.property(2).setValueAtTime(newInPoint + (step * 2), 100 - (10 * shkStrength));
      motionTile.property(2).setValueAtTime(newInPoint + (step * 4), 100);
      motionTile.property(3).setValueAtTime(newInPoint, 100 - (15 * shkStrength));
      motionTile.property(3).setValueAtTime(newInPoint + (step * 3), 100);
      motionTile.property(3).setValueAtTime(newInPoint + (step * 5), 100 - (10 * shkStrength));
      motionTile.property(3).setValueAtTime(newInPoint + (step * 9), 100);

      var centerX = myComp.width / 2;
      var centerY = myComp.height / 2;
      var transform = effects.addProperty("ADBE Geometry2");
      var position = transform && transform.property(2);
      if (!position) throw new Error("Shake transform position is unavailable.");

      position.setValueAtTime(
        shakeStart,
        [centerX, centerY * (1 + 0.045 * shkStrength)],
      );
      position.setValueAtTime(
        shakeStart + step * 2,
        [centerX, centerY * (1 - 0.02 * shkStrength)],
      );
      position.setValueAtTime(
        shakeStart + step * 5,
        [centerX, centerY * (1 + 0.01 * shkStrength)],
      );
      position.setValueAtTime(newOutPoint, [centerX, centerY]);

      var directionalBlur = effects.addProperty("ADBE Motion Blur");
      directionalBlur.property(1).setValue(0);
      directionalBlur.property(2).setValueAtTime(
        shakeStart,
        defaultMotionBlurexcalibur * shkStrength,
      );
      directionalBlur.property(2).setValueAtTime(
        shakeStart + step * 5,
        minimumMotionBlurexcalibur,
      );

      if (Number(F_enable)) {
        var flashExposure = addExposure(effects, "Flash Exposure");
        var flashFr = Math.max(1, Math.min(10, Number(F_duration) || 5));
        var flashEndTime = Math.min(
          shakeStart + step * flashFr,
          newOutPoint,
        );
        var flashAmt =
          (Math.max(1, Math.min(100, Number(F_strenght) || 100)) / 100) * 2;

        setKeysCurveEBFX(flashExposure, [
          { t: shakeStart, v: flashAmt, c: [0.05, 0.9, 0.2, 1] },
          { t: flashEndTime, v: 0 },
        ]);
      }
    }

    myComp.openInViewer();
    return ok({ added: myLayers.length });
  } catch (error: any) {
    return fail(error && error.message ? error.message : String(error));
  } finally {
    app.endUndoGroup();
  }
}
export function ExcaliburFastShake(
  C_CompTime: number | string,
  C_Shk_Speed: number | string,
  C_Shk_Strength: number | string,
  C_Color: number | string,
  F_duration: number | string,
  F_strenght: number | string,
  F_color: number | string,
  F_withblendmode: number | string,
  F_enable: number | string,
): string {
  var myComp = resolveActiveComp();
  if (!myComp) return fail("Please select a composition.");

  var myLayers = myComp.selectedLayers;
  if (!myLayers || myLayers.length === 0) return fail("Please select at least one layer.");
  if (Number(C_CompTime) && myLayers.length > 1) return fail("The comp time option only works with one selected layer.");

  app.beginUndoGroup("excalibur Fast Shake");
  try {
    const shkStrength = Number(C_Shk_Strength) / 100;
    const shkLength = Math.max(10, 200 - Number(C_Shk_Speed));
    const speedFactor = shkLength / 100;
    var frameDuration = myComp.frameDuration * (0.0333333333 / myComp.frameDuration);
    var step = frameDuration * speedFactor;

    for (var i = 0; i < myLayers.length; i += 1) {
      var targetStart = Math.min(myLayers[i].inPoint, myLayers[i].outPoint);
      var shakeStart = Number(C_CompTime) ? myComp.time : targetStart;

      var solidLength = step * 6;

      var solid = myComp.layers.addSolid(
        returnColorFunc(Number(C_Color)), "Fast Shake", myComp.width, myComp.height, 1, solidLength
      );
      solid.moveBefore(myLayers[i]);
      solid.adjustmentLayer = true;

      solid.startTime = shakeStart;
      solid.inPoint = shakeStart;
      solid.outPoint = shakeStart + solidLength;
      solid.label = Number(C_Color);
      solid.motionBlur = true;

      var newOutPoint = solid.outPoint;
      var effects = solid.property("ADBE Effect Parade");
      var repeTile = effects.addProperty("CC RepeTile");
      repeTile.property(1).setValue(500); repeTile.property(2).setValue(500);
      repeTile.property(3).setValue(500); repeTile.property(4).setValue(500);
      repeTile.property(5).setValue(4);

      var centerX = myComp.width / 2;
      var centerY = myComp.height / 2;
      var transform = effects.addProperty("ADBE Geometry2");
      var position = transform && transform.property(2);
      if (!position) throw new Error("Shake transform position is unavailable.");

      position.setValueAtTime(shakeStart, [centerX, centerY * (1 + 0.12 * shkStrength)]);
      position.setValueAtTime(shakeStart + step * 1.5, [centerX, centerY * (1 - 0.04 * shkStrength)]);
      position.setValueAtTime(shakeStart + step * 3, [centerX, centerY * (1 + 0.005 * shkStrength)]);
      position.setValueAtTime(newOutPoint, [centerX, centerY]);

      var directionalBlur = effects.addProperty("ADBE Motion Blur");
      directionalBlur.property(1).setValue(0);

      directionalBlur.property(2).setValueAtTime(shakeStart, 140 * shkStrength);
      directionalBlur.property(2).setValueAtTime(shakeStart + step * 3, minimumMotionBlurexcalibur);

      if (Number(F_enable)) {
        var flashExposure = addExposure(effects, "Flash Exposure");
        var flashFr = Math.max(1, Math.min(10, Number(F_duration) || 3));
        var flashAmt = (Math.max(1, Math.min(100, Number(F_strenght) || 100)) / 100) * 2.5;
        setKeysCurveEBFX(flashExposure, [
          { t: shakeStart, v: flashAmt, c: [0.05, 0.9, 0.2, 1] },
          { t: Math.min(shakeStart + step * flashFr, newOutPoint), v: 0 },
        ]);
      }
    }
    myComp.openInViewer();
    return ok({ added: myLayers.length });
  } catch (error: any) {
    return fail(error && error.message ? error.message : String(error));
  } finally { app.endUndoGroup(); }
}
export function ExcaliburLongShake(
  C_CompTime: number | string,
  C_Shk_Speed: number | string,
  C_Shk_Strength: number | string,
  C_Color: number | string,
  F_duration: number | string,
  F_strenght: number | string,
  F_color: number | string,
  F_withblendmode: number | string,
  F_enable: number | string,
): string {
  var myComp = resolveActiveComp();
  if (!myComp) return fail("Please select a composition.");

  var myLayers = myComp.selectedLayers;
  if (!myLayers || myLayers.length === 0) return fail("Please select at least one layer.");
  if (Number(C_CompTime) && myLayers.length > 1) return fail("The comp time option only works with one selected layer.");

  app.beginUndoGroup("excalibur Long Shake");
  try {
    const shkStrength = Number(C_Shk_Strength) / 100;
    const shkLength = Math.max(10, 200 - Number(C_Shk_Speed));
    const speedFactor = shkLength / 100;
    var frameDuration = myComp.frameDuration * (0.0333333333 / myComp.frameDuration);
    var step = frameDuration * speedFactor;

    for (var i = 0; i < myLayers.length; i += 1) {
      var targetStart = Math.min(myLayers[i].inPoint, myLayers[i].outPoint);
      var shakeStart = Number(C_CompTime) ? myComp.time : targetStart;
      var solidLength = step * 18;
      var solid = myComp.layers.addSolid(
        returnColorFunc(Number(C_Color)), "Long Shake", myComp.width, myComp.height, 1, solidLength
      );
      solid.moveBefore(myLayers[i]);
      solid.adjustmentLayer = true;

      solid.startTime = shakeStart;
      solid.inPoint = shakeStart;
      solid.outPoint = shakeStart + solidLength;
      solid.label = Number(C_Color);
      solid.motionBlur = true;

      var newOutPoint = solid.outPoint;
      var effects = solid.property("ADBE Effect Parade");
      var repeTile = effects.addProperty("CC RepeTile");
      repeTile.property(1).setValue(500); repeTile.property(2).setValue(500);
      repeTile.property(3).setValue(500); repeTile.property(4).setValue(500);
      repeTile.property(5).setValue(4);

      var centerX = myComp.width / 2;
      var centerY = myComp.height / 2;
      var transform = effects.addProperty("ADBE Geometry2");
      var position = transform && transform.property(2);
      if (!position) throw new Error("Shake transform position is unavailable.");

      position.setValueAtTime(shakeStart, [centerX, centerY * (1 + 0.035 * shkStrength)]);
      position.setValueAtTime(shakeStart + step * 4, [centerX, centerY * (1 - 0.02 * shkStrength)]);
      position.setValueAtTime(shakeStart + step * 9, [centerX, centerY * (1 + 0.01 * shkStrength)]);
      position.setValueAtTime(shakeStart + step * 14, [centerX, centerY * (1 - 0.005 * shkStrength)]);
      position.setValueAtTime(newOutPoint, [centerX, centerY]);

      var directionalBlur = effects.addProperty("ADBE Motion Blur");
      directionalBlur.property(1).setValue(0);
      directionalBlur.property(2).setValueAtTime(shakeStart, defaultMotionBlurexcalibur * shkStrength * 0.7);
      directionalBlur.property(2).setValueAtTime(shakeStart + step * 8, minimumMotionBlurexcalibur);

      if (Number(F_enable)) {
        var flashExposure = addExposure(effects, "Flash Exposure");
        var flashFr = Math.max(1, Math.min(15, Number(F_duration) || 8));
        var flashAmt = (Math.max(1, Math.min(100, Number(F_strenght) || 100)) / 100) * 1.5;
        setKeysCurveEBFX(flashExposure, [
          { t: shakeStart, v: flashAmt, c: [0.33, 0, 0.67, 1] },
          { t: Math.min(shakeStart + step * flashFr, newOutPoint), v: 0 },
        ]);
      }
    }
    myComp.openInViewer();
    return ok({ added: myLayers.length });
  } catch (error: any) {
    return fail(error && error.message ? error.message : String(error));
  } finally { app.endUndoGroup(); }
}
export function ExcaliburHorizontalShake(
  C_CompTime: number | string, C_Shk_Speed: number | string, C_Shk_Strength: number | string,
  C_Color: number | string, F_duration: number | string, F_strenght: number | string,
  F_color: number | string, F_withblendmode: number | string, F_enable: number | string,
): string {
  var myComp = resolveActiveComp();
  if (!myComp) return fail("Please select a composition.");
  var myLayers = myComp.selectedLayers;
  if (!myLayers || myLayers.length === 0) return fail("Please select at least one layer.");
  if (Number(C_CompTime) && myLayers.length > 1) return fail("The comp time option only works with one selected layer.");

  app.beginUndoGroup("excalibur Horizontal Shake");
  try {
    const shkStrength = Number(C_Shk_Strength) / 100;
    const shkLength = Math.max(10, 200 - Number(C_Shk_Speed));
    const speedFactor = shkLength / 100;
    var frameDuration = myComp.frameDuration * (0.0333333333 / myComp.frameDuration);
    var step = frameDuration * speedFactor;

    for (var i = 0; i < myLayers.length; i += 1) {
      var targetStart = Math.min(myLayers[i].inPoint, myLayers[i].outPoint);
      var shakeStart = Number(C_CompTime) ? myComp.time : targetStart;
      var solidLength = step * 10;
      var solid = myComp.layers.addSolid(returnColorFunc(Number(C_Color)), "Horizontal Shake", myComp.width, myComp.height, 1, solidLength);
      solid.moveBefore(myLayers[i]); solid.adjustmentLayer = true;
      solid.startTime = shakeStart; solid.inPoint = shakeStart; solid.outPoint = shakeStart + solidLength;
      solid.label = Number(C_Color); solid.motionBlur = true;

      var newOutPoint = solid.outPoint;
      var effects = solid.property("ADBE Effect Parade");
      var repeTile = effects.addProperty("CC RepeTile");
      repeTile.property(1).setValue(500); repeTile.property(2).setValue(500); repeTile.property(3).setValue(500); repeTile.property(4).setValue(500); repeTile.property(5).setValue(4);

      var centerX = myComp.width / 2; var centerY = myComp.height / 2;
      var transform = effects.addProperty("ADBE Geometry2");
      var position = transform && transform.property(2);
      if (!position) throw new Error("Shake transform position is unavailable.");

      position.setValueAtTime(shakeStart, [centerX * (1 + 0.08 * shkStrength), centerY]);
      position.setValueAtTime(shakeStart + step * 2, [centerX * (1 - 0.04 * shkStrength), centerY]);
      position.setValueAtTime(shakeStart + step * 5, [centerX * (1 + 0.02 * shkStrength), centerY]);
      position.setValueAtTime(newOutPoint, [centerX, centerY]);

      var directionalBlur = effects.addProperty("ADBE Motion Blur");
      directionalBlur.property(1).setValue(90);
      directionalBlur.property(2).setValueAtTime(shakeStart, defaultMotionBlurexcalibur * shkStrength);
      directionalBlur.property(2).setValueAtTime(shakeStart + step * 5, minimumMotionBlurexcalibur);

      if (Number(F_enable)) {
        var flashExposure = addExposure(effects, "Flash Exposure");
        var flashFr = Math.max(1, Math.min(10, Number(F_duration) || 5));
        var flashAmt = (Math.max(1, Math.min(100, Number(F_strenght) || 100)) / 100) * 2;
        setKeysCurveEBFX(flashExposure, [{ t: shakeStart, v: flashAmt, c: [0.05, 0.9, 0.2, 1] }, { t: Math.min(shakeStart + step * flashFr, newOutPoint), v: 0 }]);
      }
    }
    myComp.openInViewer(); return ok({ added: myLayers.length });
  } catch (error: any) { return fail(error && error.message ? error.message : String(error)); } finally { app.endUndoGroup(); }
}
export function ExcaliburFlickerShake(
  C_CompTime: number | string,
  C_Shk_Speed: number | string,
  C_Shk_Strength: number | string,
  C_Color: number | string,
  F_duration: number | string,
  F_strenght: number | string,
  F_color: number | string,
  F_withblendmode: number | string,
  F_enable: number | string,
): string {
  var myComp = resolveActiveComp();
  if (!myComp) return fail("Please select a composition.");

  var myLayers = myComp.selectedLayers;
  if (!myLayers || myLayers.length === 0) {
    return fail("Please select at least one layer.");
  }
  if (Number(C_CompTime) && myLayers.length > 1) {
    return fail("The comp time option only works with one selected layer.");
  }

  app.beginUndoGroup("excalibur Flicker Shake");
  try {
    const shkStrength = Number(C_Shk_Strength) / 100;

    const shkLength = Math.max(10, 200 - Number(C_Shk_Speed));
    const speedFactor = shkLength / 100;
    const step = (1 / 30) * speedFactor;

    const compFrame = myComp.frameDuration;
    const shakeDuration = step * 10;

    const FLICKER_STEPS = 10;
    const FLICKER_MIN = 40;
    const FLICKER_RANGE = 55;
    const flickerDuration = step * FLICKER_STEPS;
    const solidLength = Math.max(shakeDuration, flickerDuration + compFrame);

    for (var i = 0; i < myLayers.length; i += 1) {
      var targetStart = Math.min(myLayers[i].inPoint, myLayers[i].outPoint);
      var shakeStart = Number(C_CompTime) ? myComp.time : targetStart;
      var shakeEnd = shakeStart + shakeDuration;

      var solid = myComp.layers.addSolid(
        returnColorFunc(Number(C_Color)),
        "Basic (excalibur)",
        myComp.width,
        myComp.height,
        1,
        solidLength,
      );
      solid.moveBefore(myLayers[i]);
      solid.adjustmentLayer = true;

      solid.startTime = shakeStart;
      solid.inPoint = shakeStart;
      solid.outPoint = shakeStart + solidLength;

      solid.label = Number(C_Color);
      solid.motionBlur = true;

      var effects = solid.property("ADBE Effect Parade");
      var repeTile = effects.addProperty("CC RepeTile");
      repeTile.property(1).setValue(500);
      repeTile.property(2).setValue(500);
      repeTile.property(3).setValue(500);
      repeTile.property(4).setValue(500);
      repeTile.property(5).setValue(4);

      var centerX = myComp.width / 2;
      var centerY = myComp.height / 2;
      var transform = effects.addProperty("ADBE Geometry2");
      var position = transform && transform.property(2);
      if (!position) throw new Error("Shake transform position is unavailable.");

      position.setValueAtTime(
        shakeStart,
        [centerX, centerY * (1 + 0.045 * shkStrength)],
      );
      position.setValueAtTime(
        shakeStart + step * 2,
        [centerX, centerY * (1 - 0.02 * shkStrength)],
      );
      position.setValueAtTime(
        shakeStart + step * 5,
        [centerX, centerY * (1 + 0.01 * shkStrength)],
      );
      position.setValueAtTime(shakeEnd, [centerX, centerY]);
      var transformOpacity = transform.property(9);
      if (!transformOpacity) {
        throw new Error("Shake transform opacity is unavailable.");
      }

      var flickerFrames = Math.ceil(flickerDuration / compFrame - 0.0001);
      for (var k = 0; k <= flickerFrames; k++) {
        var t = k * compFrame;
        var opacityVal;

        if (k === flickerFrames) {
          opacityVal = 100;
        } else {
          var stepIndex = Math.floor(t / step + 0.000001);
          if (stepIndex % 2 === 0) {
            opacityVal =
              FLICKER_MIN + FLICKER_RANGE * (stepIndex / FLICKER_STEPS);
          } else {
            opacityVal = 100;
          }
        }

        transformOpacity.setValueAtTime(shakeStart + t, opacityVal);
      }

      var directionalBlur = effects.addProperty("ADBE Motion Blur");
      directionalBlur.property(1).setValue(0);
      directionalBlur.property(2).setValueAtTime(
        shakeStart,
        defaultMotionBlurexcalibur * shkStrength,
      );
      directionalBlur.property(2).setValueAtTime(
        shakeStart + step * 5,
        minimumMotionBlurexcalibur,
      );

      if (Number(F_enable)) {
        var flashExposure = addExposure(effects, "Flash Exposure");
        var flashFr = Math.max(1, Math.min(10, Number(F_duration) || 5));
        var flashEndTime = Math.min(shakeStart + step * flashFr, shakeEnd);
        var flashAmt =
          (Math.max(1, Math.min(100, Number(F_strenght) || 100)) / 100) * 2;

        setKeysCurveEBFX(flashExposure, [
          { t: shakeStart, v: flashAmt, c: [0.05, 0.9, 0.2, 1] },
          { t: flashEndTime, v: 0 },
        ]);
      }
    }

    myComp.openInViewer();
    return ok({ added: myLayers.length });
  } catch (error: any) {
    return fail(error && error.message ? error.message : String(error));
  } finally {
    app.endUndoGroup();
  }
}
export function ExcaliburLensShake(
  C_CompTime: number | string,
  C_Shk_Speed: number | string,
  C_Shk_Strength: number | string,
  C_Color: number | string,
  F_duration: number | string,
  F_strenght: number | string,
  F_color: number | string,
  F_withblendmode: number | string,
  F_enable: number | string,
): string {
  var myComp = resolveActiveComp();
  if (!myComp) return fail("Please select a composition.");

  var myLayers = myComp.selectedLayers;
  if (!myLayers || myLayers.length === 0) {
    return fail("Please select at least one layer.");
  }
  if (Number(C_CompTime) && myLayers.length > 1) {
    return fail("The comp time option only works with one selected layer.");
  }

  app.beginUndoGroup("excalibur Lens Shake");
  try {
    const shkStrength = Number(C_Shk_Strength) / 100;

    const shkLength = Math.max(10, 200 - Number(C_Shk_Speed));
    const speedFactor = shkLength / 100;

    var frameDuration =
      myComp.frameDuration * (0.0333333333 / myComp.frameDuration);

    var step = frameDuration * speedFactor;

    for (var i = 0; i < myLayers.length; i += 1) {
      var targetStart = Math.min(myLayers[i].inPoint, myLayers[i].outPoint);
      var shakeStart = Number(C_CompTime) ? myComp.time : targetStart;

      var solidLength = step * 10;

      var solid = myComp.layers.addSolid(
        returnColorFunc(Number(C_Color)),
        "Lens (excalibur)",
        myComp.width,
        myComp.height,
        1,
        solidLength,
      );
      solid.moveBefore(myLayers[i]);
      solid.adjustmentLayer = true;

      solid.startTime = shakeStart;
      solid.inPoint = shakeStart;
      solid.outPoint = shakeStart + solidLength;

      solid.label = Number(C_Color);
      solid.motionBlur = true;

      var newOutPoint = solid.outPoint;
      var effects = solid.property("ADBE Effect Parade");
      var repeTile = effects.addProperty("CC RepeTile");
      repeTile.property(1).setValue(500);
      repeTile.property(2).setValue(500);
      repeTile.property(3).setValue(500);
      repeTile.property(4).setValue(500);
      repeTile.property(5).setValue(4);

      var centerX = myComp.width / 2;
      var centerY = myComp.height / 2;
      var transform = effects.addProperty("ADBE Geometry2");
      var position = transform && transform.property(2);
      if (!position) throw new Error("Shake transform position is unavailable.");

      position.setValueAtTime(
        shakeStart,
        [centerX, centerY * (1 + 0.045 * shkStrength)],
      );
      position.setValueAtTime(
        shakeStart + step * 2,
        [centerX, centerY * (1 - 0.02 * shkStrength)],
      );
      position.setValueAtTime(
        shakeStart + step * 5,
        [centerX, centerY * (1 + 0.01 * shkStrength)],
      );
      position.setValueAtTime(newOutPoint, [centerX, centerY]);

      var lensEffect = effects.addProperty("ADBE Optics Compensation");
      lensEffect.property(1).setValueAtTime(
        shakeStart,
        75,
      );
      lensEffect.property(1).setValueAtTime(
        shakeStart + step * 7,
        0,
      );

      lensEffect.property(2).setValue(1);

      var directionalBlur = effects.addProperty("ADBE Motion Blur");
      directionalBlur.property(1).setValue(0);
      directionalBlur.property(2).setValueAtTime(
        shakeStart,
        defaultMotionBlurexcalibur * shkStrength,
      );
      directionalBlur.property(2).setValueAtTime(
        shakeStart + step * 5,
        minimumMotionBlurexcalibur,
      );

      if (Number(F_enable)) {
        var flashExposure = addExposure(effects, "Flash Exposure");
        var flashFr = Math.max(1, Math.min(10, Number(F_duration) || 5));
        var flashEndTime = Math.min(
          shakeStart + step * flashFr,
          newOutPoint,
        );
        var flashAmt =
          (Math.max(1, Math.min(100, Number(F_strenght) || 100)) / 100) * 2;

        setKeysCurveEBFX(flashExposure, [
          { t: shakeStart, v: flashAmt, c: [0.05, 0.9, 0.2, 1] },
          { t: flashEndTime, v: 0 },
        ]);
      }

    }

    myComp.openInViewer();
    return ok({ added: myLayers.length });
  } catch (error: any) {
    return fail(error && error.message ? error.message : String(error));
  } finally {
    app.endUndoGroup();
  }
}
export function ExcaliburWaveShakes(
  C_CompTime: number | string,
  C_Shk_Speed: number | string,
  C_Shk_Strength: number | string,
  C_Color: number | string,
  F_duration: number | string,
  F_strenght: number | string,
  F_color: number | string,
  F_withblendmode: number | string,
  F_enable: number | string,
): string {
  var myComp = resolveActiveComp();
  if (!myComp) return fail("Please select a composition.");

  var myLayers = myComp.selectedLayers;
  if (!myLayers || myLayers.length === 0) {
    return fail("Please select at least one layer.");
  }
  if (Number(C_CompTime) && myLayers.length > 1) {
    return fail("The comp time option only works with one selected layer.");
  }

  app.beginUndoGroup("excalibur Wave Shake");
  try {
    const shkStrength = Number(C_Shk_Strength) / 100;

    const shkLength = Math.max(10, 200 - Number(C_Shk_Speed));
    const speedFactor = shkLength / 100;

    var frameDuration =
      myComp.frameDuration * (0.0333333333 / myComp.frameDuration);

    var step = frameDuration * speedFactor;

    for (var i = 0; i < myLayers.length; i += 1) {
      var targetStart = Math.min(myLayers[i].inPoint, myLayers[i].outPoint);
      var shakeStart = Number(C_CompTime) ? myComp.time : targetStart;

      var solidLength = step * 10;

      var solid = myComp.layers.addSolid(
        returnColorFunc(Number(C_Color)),
        "Basic (excalibur)",
        myComp.width,
        myComp.height,
        1,
        solidLength,
      );
      solid.moveBefore(myLayers[i]);
      solid.adjustmentLayer = true;

      solid.startTime = shakeStart;
      solid.inPoint = shakeStart;
      solid.outPoint = shakeStart + solidLength;

      solid.label = Number(C_Color);
      solid.motionBlur = true;
      var newInPoint = solid.inPoint;
      var newOutPoint = solid.outPoint;
      var effects = solid.property("ADBE Effect Parade");
      var repeTile = effects.addProperty("CC RepeTile");
      repeTile.property(1).setValue(500);
      repeTile.property(2).setValue(500);
      repeTile.property(3).setValue(500);
      repeTile.property(4).setValue(500);
      repeTile.property(5).setValue(4);

      var centerX = myComp.width / 2;
      var centerY = myComp.height / 2;
      var transform = effects.addProperty("ADBE Geometry2");
      var position = transform && transform.property(2);
      if (!position) throw new Error("Shake transform position is unavailable.");
      position.setValueAtTime(
        shakeStart,
        [centerX, centerY * (1 + 0.045 * shkStrength)],
      );
      position.setValueAtTime(
        shakeStart + step * 2,
        [centerX, centerY * (1 - 0.02 * shkStrength)],
      );
      position.setValueAtTime(
        shakeStart + step * 5,
        [centerX, centerY * (1 + 0.01 * shkStrength)],
      );
      position.setValueAtTime(newOutPoint, [centerX, centerY]);

      var turbdisplacement = effects.addProperty("ADBE Turbulent Displace");
      var easeIn = new KeyframeEase(0, 25);
      var easeOut = new KeyframeEase(0, 1);
      var ammou_keyframe0 = turbdisplacement.property(2).addKey(newInPoint);
      var ammou_keyframe1 = turbdisplacement.property(2).addKey(newOutPoint);
      turbdisplacement.property(2).setValueAtKey(ammou_keyframe0, 25 * shkStrength * 0.8);
      turbdisplacement.property(2).setValueAtKey(ammou_keyframe1, 0);
      CreateTheCurve(turbdisplacement.property(2), [ammou_keyframe0, ammou_keyframe1], 0, easeIn, easeOut, 0, 1);
      CreateTheCurve(turbdisplacement.property(2), [ammou_keyframe0, ammou_keyframe1], 1, easeIn, easeOut, 0, 1);
      var scale_correction = 1080 / myComp.width;
      var scale_keyframe0 = turbdisplacement.property(3).addKey(newInPoint);
      var scale_keyframe1 = turbdisplacement.property(3).addKey(newOutPoint);
      turbdisplacement.property(3).setValueAtKey(scale_keyframe0, 130 * shkStrength * 0.8);
      turbdisplacement.property(3).setValueAtKey(scale_keyframe1, 477 * shkStrength * 0.8);
      CreateTheCurve(turbdisplacement.property(3), [scale_keyframe0, scale_keyframe1], 0, easeIn, easeOut, 0, 1);
      CreateTheCurve(turbdisplacement.property(3), [scale_keyframe0, scale_keyframe1], 1, easeIn, easeOut, 0, 1);
      turbdisplacement.property(6).setValueAtTime(newInPoint, 26);
      turbdisplacement.property(6).setValueAtTime(newOutPoint, 368);

      var directionalBlur = effects.addProperty("ADBE Motion Blur");
      directionalBlur.property(1).setValue(0);
      directionalBlur.property(2).setValueAtTime(
        shakeStart,
        defaultMotionBlurexcalibur * shkStrength,
      );
      directionalBlur.property(2).setValueAtTime(
        shakeStart + step * 5,
        minimumMotionBlurexcalibur,
      );

      if (Number(F_enable)) {
        var flashExposure = addExposure(effects, "Flash Exposure");
        var flashFr = Math.max(1, Math.min(10, Number(F_duration) || 5));
        var flashEndTime = Math.min(
          shakeStart + step * flashFr,
          newOutPoint,
        );
        var flashAmt =
          (Math.max(1, Math.min(100, Number(F_strenght) || 100)) / 100) * 2;

        setKeysCurveEBFX(flashExposure, [
          { t: shakeStart, v: flashAmt, c: [0.05, 0.9, 0.2, 1] },
          { t: flashEndTime, v: 0 },
        ]);
      }
    }

    myComp.openInViewer();
    return ok({ added: myLayers.length });
  } catch (error: any) {
    return fail(error && error.message ? error.message : String(error));
  } finally {
    app.endUndoGroup();
  }
}
export function ExcaliburSkewShakes(
  C_CompTime: number | string,
  C_Shk_Speed: number | string,
  C_Shk_Strength: number | string,
  C_Color: number | string,
  F_duration: number | string,
  F_strenght: number | string,
  F_color: number | string,
  F_withblendmode: number | string,
  F_enable: number | string,
): string {
  var myComp = resolveActiveComp();
  if (!myComp) return fail("Please select a composition.");

  var myLayers = myComp.selectedLayers;
  if (!myLayers || myLayers.length === 0) {
    return fail("Please select at least one layer.");
  }
  if (Number(C_CompTime) && myLayers.length > 1) {
    return fail("The comp time option only works with one selected layer.");
  }

  app.beginUndoGroup("excalibur Skew Shakes");
  try {
    const shkStrength = Number(C_Shk_Strength) / 100;

    const shkLength = Math.max(10, 200 - Number(C_Shk_Speed));
    const speedFactor = shkLength / 100;

    var frameDuration =
      myComp.frameDuration * (0.0333333333 / myComp.frameDuration);

    var step = frameDuration * speedFactor;

    for (var i = 0; i < myLayers.length; i += 1) {
      var targetStart = Math.min(myLayers[i].inPoint, myLayers[i].outPoint);
      var shakeStart = Number(C_CompTime) ? myComp.time : targetStart;

      var solidLength = step * 10;

      var solid = myComp.layers.addSolid(
        returnColorFunc(Number(C_Color)),
        "Basic (excalibur)",
        myComp.width,
        myComp.height,
        1,
        solidLength,
      );
      solid.moveBefore(myLayers[i]);
      solid.adjustmentLayer = true;

      solid.startTime = shakeStart;
      solid.inPoint = shakeStart;
      solid.outPoint = shakeStart + solidLength;

      solid.label = Number(C_Color);
      solid.motionBlur = true;

      var newOutPoint = solid.outPoint;
      var effects = solid.property("ADBE Effect Parade");
      var repeTile = effects.addProperty("CC RepeTile");
      repeTile.property(1).setValue(500);
      repeTile.property(2).setValue(500);
      repeTile.property(3).setValue(500);
      repeTile.property(4).setValue(500);
      repeTile.property(5).setValue(4);

      var centerX = myComp.width / 2;
      var centerY = myComp.height / 2;
      var transform = effects.addProperty("ADBE Geometry2");
      var position = transform && transform.property(2);
      if (!position) throw new Error("Shake transform position is unavailable.");

      position.setValueAtTime(
        shakeStart,
        [centerX, centerY * (1 + 0.045 * shkStrength)],
      );
      position.setValueAtTime(
        shakeStart + step * 2,
        [centerX, centerY * (1 - 0.02 * shkStrength)],
      );
      position.setValueAtTime(
        shakeStart + step * 5,
        [centerX, centerY * (1 + 0.01 * shkStrength)],
      );
      position.setValueAtTime(newOutPoint, [centerX, centerY]);

      setKeysCurveEBFX(transform.property(6), [
        { t: shakeStart, v: 20, c: [0.00, 1.00, 0.40, 1.00] },
        { t: shakeStart + step * 10, v: 0, c: [0.00, 0.00, 0.15, 1.00] },
      ]);

      setKeysCurveEBFX(transform.property(7), [
        { t: shakeStart, v: -240, c: [0.00, 1.00, 0.40, 1.00] },
        { t: shakeStart + step * 10, v: -100, c: [0.00, 0.00, 0.15, 1.00] },
      ]);

      var directionalBlur = effects.addProperty("ADBE Motion Blur");
      directionalBlur.property(1).setValue(0);
      directionalBlur.property(2).setValueAtTime(
        shakeStart,
        defaultMotionBlurexcalibur * shkStrength,
      );
      directionalBlur.property(2).setValueAtTime(
        shakeStart + step * 5,
        minimumMotionBlurexcalibur,
      );

      if (Number(F_enable)) {
        var flashExposure = addExposure(effects, "Flash Exposure");
        var flashFr = Math.max(1, Math.min(10, Number(F_duration) || 5));
        var flashEndTime = Math.min(
          shakeStart + step * flashFr,
          newOutPoint,
        );
        var flashAmt =
          (Math.max(1, Math.min(100, Number(F_strenght) || 100)) / 100) * 2;

        setKeysCurveEBFX(flashExposure, [
          { t: shakeStart, v: flashAmt, c: [0.05, 0.9, 0.2, 1] },
          { t: flashEndTime, v: 0 },
        ]);
      }

    }

    myComp.openInViewer();
    return ok({ added: myLayers.length });
  } catch (error: any) {
    return fail(error && error.message ? error.message : String(error));
  } finally {
    app.endUndoGroup();
  }
}
export function ExcaliburInvertShake(
  C_CompTime: number | string,
  C_Shk_Speed: number | string,
  C_Shk_Strength: number | string,
  C_Color: number | string,
  F_duration: number | string,
  F_strenght: number | string,
  F_color: number | string,
  F_withblendmode: number | string,
  F_enable: number | string,
): string {
  var myComp = resolveActiveComp();
  if (!myComp) return fail("Please select a composition.");

  var myLayers = myComp.selectedLayers;
  if (!myLayers || myLayers.length === 0) {
    return fail("Please select at least one layer.");
  }
  if (Number(C_CompTime) && myLayers.length > 1) {
    return fail("The comp time option only works with one selected layer.");
  }

  app.beginUndoGroup("excalibur Invert Shake");
  try {
    const shkStrength = Number(C_Shk_Strength) / 100;

    const shkLength = Math.max(10, 200 - Number(C_Shk_Speed));
    const speedFactor = shkLength / 100;

    var frameDuration =
      myComp.frameDuration * (0.0333333333 / myComp.frameDuration);

    var step = frameDuration * speedFactor;

    for (var i = 0; i < myLayers.length; i += 1) {
      var targetStart = Math.min(myLayers[i].inPoint, myLayers[i].outPoint);
      var shakeStart = Number(C_CompTime) ? myComp.time : targetStart;

      var solidLength = step * 10;

      var solid = myComp.layers.addSolid(
        returnColorFunc(Number(C_Color)),
        "Basic (excalibur)",
        myComp.width,
        myComp.height,
        1,
        solidLength,
      );
      solid.moveBefore(myLayers[i]);
      solid.adjustmentLayer = true;

      solid.startTime = shakeStart;
      solid.inPoint = shakeStart;
      solid.outPoint = shakeStart + solidLength;

      solid.label = Number(C_Color);
      solid.motionBlur = true;

      var newInPoint = solid.inPoint;
      var newOutPoint = solid.outPoint;
      var effects = solid.property("ADBE Effect Parade");
      var repeTile = effects.addProperty("CC RepeTile");
      repeTile.property(1).setValue(500);
      repeTile.property(2).setValue(500);
      repeTile.property(3).setValue(500);
      repeTile.property(4).setValue(500);
      repeTile.property(5).setValue(4);

      var centerX = myComp.width / 2;
      var centerY = myComp.height / 2;
      var transform = effects.addProperty("ADBE Geometry2");
      var position = transform && transform.property(2);
      if (!position) throw new Error("Shake transform position is unavailable.");

      position.setValueAtTime(
        shakeStart,
        [centerX, centerY * (1 + 0.045 * shkStrength)],
      );
      position.setValueAtTime(
        shakeStart + step * 2,
        [centerX, centerY * (1 - 0.02 * shkStrength)],
      );
      position.setValueAtTime(
        shakeStart + step * 5,
        [centerX, centerY * (1 + 0.01 * shkStrength)],
      );
      position.setValueAtTime(newOutPoint, [centerX, centerY]);

      var invert = effects.addProperty("ADBE Invert");
      invert.property(1).setValueAtTime(newInPoint, 9 * shkStrength);
      invert.property(1).setValueAtTime(newInPoint + (step * 1), 1);
      invert.property(1).setValueAtTime(newInPoint + (step * 2), 8);
      invert.property(2).setValueAtTime(newInPoint + (step * 2), 0);
      invert.property(2).setValueAtTime(newInPoint + (step * 3), 100);

      var directionalBlur = effects.addProperty("ADBE Motion Blur");
      directionalBlur.property(1).setValue(0);
      directionalBlur.property(2).setValueAtTime(
        shakeStart,
        defaultMotionBlurexcalibur * shkStrength,
      );
      directionalBlur.property(2).setValueAtTime(
        shakeStart + step * 5,
        minimumMotionBlurexcalibur,
      );

      if (Number(F_enable)) {
        var flashExposure = addExposure(effects, "Flash Exposure");
        var flashFr = Math.max(1, Math.min(10, Number(F_duration) || 5));
        var flashEndTime = Math.min(
          shakeStart + step * flashFr,
          newOutPoint,
        );
        var flashAmt =
          (Math.max(1, Math.min(100, Number(F_strenght) || 100)) / 100) * 2;

        setKeysCurveEBFX(flashExposure, [
          { t: shakeStart, v: flashAmt, c: [0.05, 0.9, 0.2, 1] },
          { t: flashEndTime, v: 0 },
        ]);
      }
    }

    myComp.openInViewer();
    return ok({ added: myLayers.length });
  } catch (error: any) {
    return fail(error && error.message ? error.message : String(error));
  } finally {
    app.endUndoGroup();
  }
}
export function ExcaliburSpikeShake(
  C_CompTime: number | string,
  C_Shk_Speed: number | string,
  C_Shk_Strength: number | string,
  C_Color: number | string,
  F_duration: number | string,
  F_strenght: number | string,
  F_color: number | string,
  F_withblendmode: number | string,
  F_enable: number | string,
): string {
  var myComp = resolveActiveComp();
  if (!myComp) return fail("Please select a composition.");

  var myLayers = myComp.selectedLayers;
  if (!myLayers || myLayers.length === 0) {
    return fail("Please select at least one layer.");
  }
  if (Number(C_CompTime) && myLayers.length > 1) {
    return fail("The comp time option only works with one selected layer.");
  }

  app.beginUndoGroup("excalibur Spike Shake");
  try {
    const shkStrength = Number(C_Shk_Strength) / 100;

    const shkLength = Math.max(10, 200 - Number(C_Shk_Speed));
    const speedFactor = shkLength / 100;
    var frameDuration =
      myComp.frameDuration * (0.0333333333 / myComp.frameDuration);

    var step = frameDuration * speedFactor;

    for (var i = 0; i < myLayers.length; i += 1) {
      var targetStart = Math.min(myLayers[i].inPoint, myLayers[i].outPoint);
      var shakeStart = Number(C_CompTime) ? myComp.time : targetStart;

      var solidLength = step * 10;

      var solid = myComp.layers.addSolid(
        returnColorFunc(Number(C_Color)),
        "Basic (excalibur)",
        myComp.width,
        myComp.height,
        1,
        solidLength,
      );
      solid.moveBefore(myLayers[i]);
      solid.adjustmentLayer = true;

      solid.startTime = shakeStart;
      solid.inPoint = shakeStart;
      solid.outPoint = shakeStart + solidLength;

      solid.label = Number(C_Color);
      solid.motionBlur = true;

      var newOutPoint = solid.outPoint;
      var effects = solid.property("ADBE Effect Parade");
      var repeTile = effects.addProperty("CC RepeTile");
      repeTile.property(1).setValue(500);
      repeTile.property(2).setValue(500);
      repeTile.property(3).setValue(500);
      repeTile.property(4).setValue(500);
      repeTile.property(5).setValue(4);

      var centerX = myComp.width / 2;
      var centerY = myComp.height / 2;
      var transform = effects.addProperty("ADBE Geometry2");
      var position = transform && transform.property(2);
      if (!position) throw new Error("Shake transform position is unavailable.");

      position.setValueAtTime(
        shakeStart,
        [centerX, centerY * (1 + 0.045 * shkStrength)],
      );
      position.setValueAtTime(
        shakeStart + step * 2,
        [centerX, centerY * (1 - 0.02 * shkStrength)],
      );
      position.setValueAtTime(
        shakeStart + step * 5,
        [centerX, centerY * (1 + 0.01 * shkStrength)],
      );
      position.setValueAtTime(newOutPoint, [centerX, centerY]);

      var waveWarp = effects.addProperty("ADBE Wave Warp");
      waveWarp.property(1).setValue(9);

      setKeysCurveEBFX(waveWarp.property(2), [
        { t: shakeStart, v: 250, c: [0.02, 0.72, 0.00, 1.00] },
        { t: shakeStart + step * 10, v: 0 },
      ]);
      waveWarp.property(3).setValue(60);
      waveWarp.property(4).setValue(0);

      var directionalBlur = effects.addProperty("ADBE Motion Blur");
      directionalBlur.property(1).setValue(0);
      directionalBlur.property(2).setValueAtTime(
        shakeStart,
        defaultMotionBlurexcalibur * shkStrength,
      );
      directionalBlur.property(2).setValueAtTime(
        shakeStart + step * 5,
        minimumMotionBlurexcalibur,
      );

      if (Number(F_enable)) {
        var flashExposure = addExposure(effects, "Flash Exposure");
        var flashFr = Math.max(1, Math.min(10, Number(F_duration) || 5));
        var flashEndTime = Math.min(
          shakeStart + step * flashFr,
          newOutPoint,
        );
        var flashAmt =
          (Math.max(1, Math.min(100, Number(F_strenght) || 100)) / 100) * 2;

        setKeysCurveEBFX(flashExposure, [
          { t: shakeStart, v: flashAmt, c: [0.05, 0.9, 0.2, 1] },
          { t: flashEndTime, v: 0 },
        ]);
      }

    }

    myComp.openInViewer();
    return ok({ added: myLayers.length });
  } catch (error: any) {
    return fail(error && error.message ? error.message : String(error));
  } finally {
    app.endUndoGroup();
  }
}
export function ExcaliburGlitchShake(
  C_CompTime: number | string,
  C_Shk_Speed: number | string,
  C_Shk_Strength: number | string,
  C_Color: number | string,
  F_duration: number | string,
  F_strenght: number | string,
  F_color: number | string,
  F_withblendmode: number | string,
  F_enable: number | string,
): string {
  var myComp = resolveActiveComp();
  if (!myComp) return fail("Please select a composition.");

  var myLayers = myComp.selectedLayers;
  if (!myLayers || myLayers.length === 0) {
    return fail("Please select at least one layer.");
  }
  if (Number(C_CompTime) && myLayers.length > 1) {
    return fail("The comp time option only works with one selected layer.");
  }

  app.beginUndoGroup("excalibur Glitch Ultimate");
  try {
    const shkStrength = Number(C_Shk_Strength) / 100;

    const shkLength = Math.max(10, 200 - Number(C_Shk_Speed));
    const speedFactor = shkLength / 100;

    var frameDuration =
      myComp.frameDuration * (0.0333333333 / myComp.frameDuration);

    var step = frameDuration * speedFactor;

    for (var i = 0; i < myLayers.length; i += 1) {
      var targetStart = Math.min(myLayers[i].inPoint, myLayers[i].outPoint);

      var cutTime = Number(C_CompTime) ? myComp.time : targetStart;

      var glitchStart = cutTime - frameDuration;

      var shakeAnimStart = cutTime - (step * 2);

      var layerStart = Math.min(shakeAnimStart, glitchStart);
      var solidLength = step * 12;

      var solid = myComp.layers.addSolid(
        returnColorFunc(Number(C_Color)),
        "Glitch Shake (excalibur)",
        myComp.width,
        myComp.height,
        1,
        solidLength,
      );
      solid.moveBefore(myLayers[i]);
      solid.adjustmentLayer = true;

      solid.startTime = layerStart;
      solid.inPoint = layerStart;
      solid.outPoint = cutTime + solidLength;

      solid.label = Number(C_Color);
      solid.motionBlur = true;
      var preGlitchTime = glitchStart - frameDuration;
      var newOutPoint = solid.outPoint;
      var effects = solid.property("ADBE Effect Parade");

      var repeTile = effects.addProperty("CC RepeTile");
      repeTile.property(1).setValue(500);
      repeTile.property(2).setValue(500);
      repeTile.property(3).setValue(500);
      repeTile.property(4).setValue(500);
      repeTile.property(5).setValue(4);

      var channelBlur = effects.addProperty("ADBE Channel Blur");
      try {
        channelBlur.property(6).setValue(1);

        channelBlur.property(1).setValueAtTime(preGlitchTime, 0);
        channelBlur.property(3).setValueAtTime(preGlitchTime, 0);

        channelBlur.property(1).setValueAtTime(glitchStart, 60 * shkStrength);
        channelBlur.property(1).setValueAtTime(glitchStart + frameDuration * 1, 0);
        channelBlur.property(1).setValueAtTime(glitchStart + frameDuration * 3, 493 * shkStrength);
        channelBlur.property(1).setValueAtTime(glitchStart + frameDuration * 4, 0);

        channelBlur.property(3).setValueAtTime(glitchStart, 60 * shkStrength);
        channelBlur.property(3).setValueAtTime(glitchStart + frameDuration * 1, 0);
        channelBlur.property(3).setValueAtTime(glitchStart + frameDuration * 3, 369 * shkStrength);
        channelBlur.property(3).setValueAtTime(glitchStart + frameDuration * 4, 0);
      } catch (err) {}

      var invert = effects.addProperty("ADBE Invert");
      try {
        var invBlend = invert.property(2);
        if (invBlend) {
          invBlend.setValueAtTime(preGlitchTime, 100);
          invBlend.setValueAtTime(glitchStart, 0);
          invBlend.setValueAtTime(glitchStart + frameDuration * 1, 0);
          invBlend.setValueAtTime(glitchStart + frameDuration * 2, 20);
          invBlend.setValueAtTime(glitchStart + frameDuration * 3, 100);
        }
      } catch (err) {}

      var noise = effects.addProperty("ADBE Noise");
      try {
        noise.property(1).setValueAtTime(preGlitchTime, 0);
        noise.property(1).setValueAtTime(glitchStart, 30 * shkStrength);
        noise.property(1).setValueAtTime(glitchStart + frameDuration * 4, 0);
      } catch (err) {}

      var waveWarp = effects.addProperty("ADBE Wave Warp");
      try {
        waveWarp.property(2).setValueAtTime(preGlitchTime, 0);
        waveWarp.property(1).setValue(2);
        waveWarp.property(2).setValueAtTime(glitchStart, 80 * shkStrength);
        waveWarp.property(2).setValueAtTime(glitchStart + frameDuration * 3, 30 * shkStrength);
        waveWarp.property(2).setValueAtTime(glitchStart + frameDuration * 4, 0);
        waveWarp.property(3).setValue(400);
        waveWarp.property(4).setValue(0);
      } catch (err) {}

      try {
        var vignette = effects.addProperty("CC Vignette");
        if (vignette) {
          vignette.property(1).setValueAtTime(preGlitchTime, 0);
          vignette.property(1).setValueAtTime(glitchStart, 150);
          vignette.property(1).setValueAtTime(glitchStart + frameDuration * 4, 0);
        }
      } catch (err) {}

      var centerX = myComp.width / 2;
      var centerY = myComp.height / 2;
      var transform = effects.addProperty("ADBE Geometry2");

      var anchorPoint = transform.property(1);
      var position = transform.property(2);

      if (!position) throw new Error("Shake transform position is unavailable.");

      anchorPoint.setValue([centerX, centerY]);

      position.setValueAtTime(shakeAnimStart, [centerX, centerY]);
      position.setValueAtTime(
        cutTime,
        [centerX, centerY * (1 + 0.045 * shkStrength)],
      );
      position.setValueAtTime(
        cutTime + step * 2,
        [centerX, centerY * (1 - 0.02 * shkStrength)],
      );
      position.setValueAtTime(
        cutTime + step * 5,
        [centerX, centerY * (1 + 0.01 * shkStrength)],
      );
      position.setValueAtTime(newOutPoint, [centerX, centerY]);

      var directionalBlur = effects.addProperty("ADBE Motion Blur");
      directionalBlur.property(1).setValue(0);
      directionalBlur.property(2).setValueAtTime(shakeAnimStart, minimumMotionBlurexcalibur);
      directionalBlur.property(2).setValueAtTime(cutTime, defaultMotionBlurexcalibur * shkStrength); 
      directionalBlur.property(2).setValueAtTime(cutTime + step * 5, minimumMotionBlurexcalibur);

      if (Number(F_enable)) {
        var flashExposure = addExposure(effects, "Flash Exposure");
        var flashFr = Math.max(1, Math.min(10, Number(F_duration) || 5));
        var flashEndTime = Math.min(cutTime + step * flashFr, newOutPoint);
        var flashAmt = (Math.max(1, Math.min(100, Number(F_strenght) || 100)) / 100) * 2;

        setKeysCurveEBFX(flashExposure, [
          { t: shakeAnimStart, v: 0, c: [0.8, 0, 0.95, 1] },
          { t: cutTime, v: flashAmt, c: [0, .01, .19, 1] }, 
          { t: flashEndTime, v: 0 },
        ]);
      }
    }

    myComp.openInViewer();
    return ok({ added: myLayers.length });
  } catch (error: any) {
    return fail(error && error.message ? error.message : String(error));
  } finally {
    app.endUndoGroup();
  }
}
export function ExcaliburSketchShake(
  C_CompTime: number | string,
  C_Shk_Speed: number | string,
  C_Shk_Strength: number | string,
  C_Color: number | string,
  F_duration: number | string,
  F_strenght: number | string,
  F_color: number | string,
  F_withblendmode: number | string,
  F_enable: number | string,
): string {
  var myComp = resolveActiveComp();
  if (!myComp) return fail("Please select a composition.");

  var myLayers = myComp.selectedLayers;
  if (!myLayers || myLayers.length === 0) return fail("Please select at least one layer.");
  if (Number(C_CompTime) && myLayers.length > 1) return fail("The comp time option only works with one selected layer.");

  app.beginUndoGroup("excalibur Sketch Shake");
  try {
    const shkStrength = Number(C_Shk_Strength) / 100;
    const shkLength = Math.max(10, 200 - Number(C_Shk_Speed));
    const speedFactor = shkLength / 100;
    var frameDuration = myComp.frameDuration * (0.0333333333 / myComp.frameDuration);
    var step = frameDuration * speedFactor;

    for (var i = 0; i < myLayers.length; i += 1) {
      var targetStart = Math.min(myLayers[i].inPoint, myLayers[i].outPoint);
      var shakeStart = Number(C_CompTime) ? myComp.time : targetStart;

      var solidLength = step * 6;

      var solid = myComp.layers.addSolid(
        returnColorFunc(Number(C_Color)), "Sketch Shake", myComp.width, myComp.height, 1, solidLength
      );
      solid.moveBefore(myLayers[i]);
      solid.adjustmentLayer = true;

      solid.startTime = shakeStart;
      solid.inPoint = shakeStart;
      solid.outPoint = shakeStart + solidLength;
      solid.label = Number(C_Color);
      solid.motionBlur = true;

      var newInPoint = solid.inPoint;
      var newOutPoint = solid.outPoint;
      var effects = solid.property("ADBE Effect Parade");
      var repeTile = effects.addProperty("CC RepeTile");
      repeTile.property(1).setValue(500); repeTile.property(2).setValue(500);
      repeTile.property(3).setValue(500); repeTile.property(4).setValue(500);
      repeTile.property(5).setValue(4);

      var centerX = myComp.width / 2;
      var centerY = myComp.height / 2;
      var transform = effects.addProperty("ADBE Geometry2");
      var position = transform && transform.property(2);
      if (!position) throw new Error("Shake transform position is unavailable.");

      position.setValueAtTime(shakeStart, [centerX, centerY * (1 + 0.12 * shkStrength)]);
      position.setValueAtTime(shakeStart + step * 1.5, [centerX, centerY * (1 - 0.04 * shkStrength)]);
      position.setValueAtTime(shakeStart + step * 3, [centerX, centerY * (1 + 0.005 * shkStrength)]);
      position.setValueAtTime(newOutPoint, [centerX, centerY]);

      var squeeze1 = effects.addProperty("CC Scale Wipe");
      squeeze1.property(3).setValue(90);
      setKeysCurveEBFX(squeeze1.property(1), [
        { t: newInPoint, v: 2 * shkStrength, c: [0.00, 0.88, 1.00, 1.00] },
        { t: newOutPoint, v: 0 },
      ]);

      var squeeze2 = effects.addProperty("CC Scale Wipe");
      squeeze2.property(3).setValue(90);
      setKeysCurveEBFX(squeeze2.property(1), [
        { t: newInPoint, v: -2 * shkStrength, c: [0.00, 0.88, 1.00, 1.00] },
        { t: newOutPoint, v: 0 },
      ]);

      var directionalBlur = effects.addProperty("ADBE Motion Blur");
      directionalBlur.property(1).setValue(0);

      directionalBlur.property(2).setValueAtTime(shakeStart, 140 * shkStrength);
      directionalBlur.property(2).setValueAtTime(shakeStart + step * 3, minimumMotionBlurexcalibur);

      if (Number(F_enable)) {
        var flashExposure = addExposure(effects, "Flash Exposure");
        var flashFr = Math.max(1, Math.min(10, Number(F_duration) || 3));
        var flashAmt = (Math.max(1, Math.min(100, Number(F_strenght) || 100)) / 100) * 2.5;
        setKeysCurveEBFX(flashExposure, [
          { t: shakeStart, v: flashAmt, c: [0.05, 0.9, 0.2, 1] },
          { t: Math.min(shakeStart + step * flashFr, newOutPoint), v: 0 },
        ]);
      }
    }
    myComp.openInViewer();
    return ok({ added: myLayers.length });
  } catch (error: any) {
    return fail(error && error.message ? error.message : String(error));
  } finally { app.endUndoGroup(); }
}





















export function applyShakePreset(
  presetName: string,
  intensity: number = 100,
  speed: number = 100,
  startAtCompTime: boolean = false,
  addFlash: boolean = false,
  flashBlend: boolean = false,
  flashDuration: number = 5,
  flashStrength: number = 100,
  customShake: any = null,
  layerColor: number = 11,
): string {
  var comp = resolveActiveComp();
  if (!comp) return fail("Please select a composition.");
  if (!customShake || typeof customShake !== "object") {
    return fail("Custom shake data is required.");
  }

  var selected = comp.selectedLayers;
  if (!selected || selected.length === 0) {
    return fail("Please select at least one layer.");
  }
  if (startAtCompTime && selected.length > 1) {
    return fail("Create at comp time only works with one selected layer.");
  }

  var strength = clampJF(numJF(intensity, 100), 5, 200) / 100;
  var stretch = Math.max(10, 200 - clampJF(numJF(speed, 100), 20, 200));
  var base = buildGroupsJF(customShake, comp.width / comp.height);
  var ov = customShake.overrides || {};
  var effectsData: any[] = customShake.effects || [];

  applyOverridesJF(base.pos, ov.pos);
  applyOverridesJF(base.rot, ov.rot);
  applyOverridesJF(base.scale, ov.scale);
  applyOverridesJF(base.blur, ov.blur);

  var flashKeys: any[] = [];
  if (addFlash) {
    var fd = clampJF(Math.round(numJF(flashDuration, 5)), 1, 15);
    var flashAmount = (clampJF(numJF(flashStrength, 100), 1, 100) / 100) * 2;
    flashKeys = [
      mkKeyJF(0, [flashAmount], [FAST_IN_EB]),
      mkKeyJF(fd, [0]),
    ];
    applyOverridesJF(flashKeys, ov.flash);
  }

  var frames = base.frames;
  frames = Math.max(
    frames,
    lastFrameJF(base.pos),
    lastFrameJF(base.rot),
    lastFrameJF(base.scale),
    lastFrameJF(base.blur),
    flashKeys.length ? lastFrameJF(flashKeys) : 0,
    effectsMaxFrameJF(effectsData),
  );

  var frameSec = SHAKE_FRAME_excalibur;
  var layerLength = frames * frameSec;
  var stretchedLength = (layerLength * stretch) / 100;
  var placement = Number(customShake.placement) || 1;
  var shakeName = String(customShake.name || presetName || "Custom") + " Shake";

  var appliedLayers = 0;
  var layerErrors: string[] = [];
  app.beginUndoGroup("Apply Shake Preset");
  try {
    for (var i = 0; i < selected.length; i += 1) {
      var target = selected[i];
      var shakeLayer: any = null;
      try {
        var targetStart = Number(target.inPoint);
        if (placement === 2) targetStart = Number(comp.time);
        else if (placement === 3)
          targetStart = Number(target.outPoint) - stretchedLength;
        else if (startAtCompTime) targetStart = Number(comp.time);

        shakeLayer = comp.layers.addSolid(
          returnColorFunc(Number(layerColor)),
          shakeName,
          comp.width,
          comp.height,
          comp.pixelAspect,
          layerLength,
        );
        shakeLayer.moveBefore(target);
        shakeLayer.adjustmentLayer = true;
        shakeLayer.startTime = targetStart;
        shakeLayer.label = Number(layerColor);
        shakeLayer.motionBlur = true;

        var effects = shakeLayer.property("ADBE Effect Parade");
        var tile = effects.addProperty("CC RepeTile");
        tile.property(1).setValue(500);
        tile.property(2).setValue(500);
        tile.property(3).setValue(500);
        tile.property(4).setValue(500);
        tile.property(5).setValue(4);

        var transform = effects.addProperty("ADBE Geometry2");
        var position = transform && transform.property(2);
        if (!position) throw new Error("Shake transform position is unavailable.");
        var geo = findScaleRotationexcalibur(transform);
        var scaleProp = geo.scale;
        var rotProp = geo.rot;

        var centerX = Number(comp.width) / 2;
        var centerY = Number(comp.height) / 2;
        var inP = shakeLayer.inPoint;
        var outP = shakeLayer.outPoint;

        writeKeysJF(position, base.pos, "2d", inP, outP, frameSec, function (
          v: number[],
        ) {
          return [
            centerX + centerX * v[0] * strength,
            centerY + centerY * v[1] * strength,
          ];
        });
        if (rotProp) {
          writeKeysJF(rotProp, base.rot, "1d", inP, outP, frameSec, function (
            v: number[],
          ) {
            return v[0] * strength;
          });
        }
        if (scaleProp) {
          writeKeysJF(scaleProp, base.scale, "1d", inP, outP, frameSec, function (
            v: number[],
          ) {
            return (1 + (v[0] - 1) * strength) * 100;
          });
        }

        var directionalBlur = effects.addProperty("ADBE Motion Blur");
        directionalBlur.property(1).setValue(base.angle);
        writeKeysJF(
          directionalBlur.property(2),
          base.blur,
          "1d",
          inP,
          outP,
          frameSec,
          function (v: number[]) {
            return v[0] > minimumMotionBlurexcalibur
              ? Math.max(minimumMotionBlurexcalibur, v[0] * strength)
              : v[0];
          },
        );

        if (addFlash) {
          var flashExposureValue = addExposure(effects, "Flash Exposure");
          writeKeysJF(flashExposureValue, flashKeys, "1d", inP, outP, frameSec);
        }

        for (var e = 0; e < effectsData.length; e += 1) {
          applyCapturedEffectEXBX(
            effects,
            effectsData[e],
            inP,
            outP,
            frameSec,
            layerErrors,
          );
        }

        shakeLayer.stretch = stretch;
        appliedLayers += 1;
      } catch (layerError: any) {
        if (shakeLayer) {
          try {
            shakeLayer.remove();
          } catch (removeShakeError) {}
        }
        layerErrors.push(
          target.name +
            ": " +
            (layerError && layerError.message
              ? layerError.message
              : String(layerError)),
        );
      }
    }

    if (appliedLayers === 0) {
      throw new Error(
        layerErrors.join("\n") || "No selected layers could be shaken.",
      );
    }
    comp.openInViewer();
    return ok({ appliedLayers: appliedLayers, layerErrors: layerErrors });
  } catch (error: any) {
    return fail(error && error.message ? error.message : String(error));
  } finally {
    app.endUndoGroup();
  }
}

function isOpacityLikeexcalibur(p: any): boolean {
  return !!(p.hasMin && p.hasMax && p.minValue === 0 && p.maxValue === 100);
}

function findScaleRotationexcalibur(effect: any): any {
  var props: any[] = [];
  collectOneDProps(effect, props);
  var scaleIdx = -1;
  for (var i = 0; i < props.length; i += 1) {
    if (isOpacityLikeexcalibur(props[i])) continue;
    var v = 0;
    try {
      v = Number(props[i].value);
    } catch (e) {
      continue;
    }
    if (v === 100) {
      scaleIdx = i;
      break;
    }
  }
  var result: any = { scale: null, rot: null };
  if (scaleIdx < 0) return result;
  result.scale = props[scaleIdx];

  var opIdx = -1;
  for (var j = scaleIdx + 1; j < props.length; j += 1) {
    if (isOpacityLikeexcalibur(props[j])) {
      opIdx = j;
      break;
    }
  }
  var rotIdx = opIdx > 0 ? opIdx - 1 : scaleIdx + 4;
  var rot = props[rotIdx];
  if (
    rot &&
    rotIdx > scaleIdx + 1 &&
    !isOpacityLikeexcalibur(rot) &&
    Number(rot.value) === 0
  ) {
    result.rot = rot;
  }
  return result;
}