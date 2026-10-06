declare const app: any;
declare const File: any;
declare const $: any;
declare const hostAlert: any;
declare const Time: any;
declare const qe: any;

var excaliburLanguage = "en";

export function setExcaliburLanguage(language: string): string {
  var supported = ["en", "fr", "es", "de", "hi"];
  if (supported.indexOf(language) === -1) {
    return JSON.stringify({ status: "ERROR", message: "Unsupported language." });
  }
  excaliburLanguage = language;
  return JSON.stringify({ status: "SUCCESS" });
}

export function getExcaliburLanguage(): string {
  return excaliburLanguage;
}

import { dispatchTS } from "../utils/utils";
function excaliburAlert(message: string): void {
  try { dispatchTS("hostMessage", { text: message, success: false }); } catch (e) {}
}
function localizeExcaliburMessage(message: string): string { return message; }



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


export function getAeVersion(): string {
  if (typeof app === "undefined" || !app.version) return "20XX";
  return String(app.version).split(".")[0];
}

export function getProjectDetails(): string {
  if (typeof app === "undefined" || !app.project) {
    return JSON.stringify({
      projectName: null,
      compName: null,
      width: 0,
      height: 0,
      fps: 0,
      layers: 0,
      selectedLayers: 0,
      duration: 0,
      bpc: 8,
    });
  }

  var projName = "Untitled Project";
  try {
    if (app.project.name) projName = String(app.project.name);
  } catch (e: any) {}

  var sequence = app.project.activeSequence;
  if (!sequence) {
    return JSON.stringify({
      projectName: projName,
      compName: null,
      width: 0,
      height: 0,
      fps: 0,
      layers: 0,
      selectedLayers: 0,
      duration: 0,
      bpc: 8,
    });
  }

  var fps = 0;
  var width = 0;
  var height = 0;
  var duration = 0;
  var selectedCount = 0;

  try {
    width = Number(sequence.frameSizeHorizontal) || 0;
    height = Number(sequence.frameSizeVertical) || 0;
  } catch (e: any) {}

  try {
    var settings = sequence.getSettings();
    var frameSeconds = Number(settings.videoFrameRate.seconds);
    if (frameSeconds > 0) fps = Math.round(1 / frameSeconds);
  } catch (e: any) {}

  try {
    duration = Math.round(Number(sequence.end) / 254016000000);
  } catch (e: any) {}

  try {
    selectedCount = sequence.getSelection().length;
  } catch (e: any) {}

  var tracks = 0;
  try {
    tracks = sequence.videoTracks.numTracks + sequence.audioTracks.numTracks;
  } catch (e: any) {}

  return JSON.stringify({
    projectName: projName,
    compName: sequence.name,
    width: width,
    height: height,
    fps: fps,
    layers: tracks,
    selectedLayers: selectedCount,
    duration: duration,
    bpc: 8,
  });
}

export function isExporting(): boolean {
  return false;
}

function findNearestMarkerTimeInSequence(
  sequence: any,
  refTimeSeconds: number
): number | null {
  var markers = sequence.markers;
  if (!markers || markers.numMarkers === 0) return null;

  var marker = markers.getFirstMarker();
  var closestTime: number | null = null;
  var closestDiff = Number.MAX_VALUE;

  while (marker) {
    var markerTime = marker.start.seconds;
    var diff = Math.abs(markerTime - refTimeSeconds);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestTime = markerTime;
    }
    marker = markers.getNextMarker(marker);
  }

  return closestTime;
}

export function importSoundFileToTimeline(
  filePath: string,
  offsetSeconds: number = 0,
  mode: string = "cursor"
): void {
  var project = app.project;
  if (!project) {
    excaliburAlert("ExcaliburFX ERROR: No project found.");
    return;
  }

  var rootItem = project.rootItem;
  var soundFolder: any = null;
  for (var i = 0; i < rootItem.children.numItems; i += 1) {
    if (rootItem.children[i].name === "ExcaliburFX") {
      soundFolder = rootItem.children[i];
      break;
    }
  }
  if (!soundFolder) {
    soundFolder = rootItem.createBin("ExcaliburFX");
  }

  var importedItem: any = null;
  var fileName = decodeURI(new File(filePath).name);

  for (var a = 0; a < soundFolder.children.numItems; a += 1) {
    if (soundFolder.children[a].name === fileName) {
      importedItem = soundFolder.children[a];
      break;
    }
  }

  if (!importedItem) {
    project.importFiles([filePath], true, soundFolder, false);
    for (var b = 0; b < soundFolder.children.numItems; b += 1) {
      if (soundFolder.children[b].name === fileName) {
        importedItem = soundFolder.children[b];
        break;
      }
    }
  }

  if (!importedItem) {
    excaliburAlert("ExcaliburFX ERROR: Failed to import the sound file.");
    return;
  }

  var activeSequence = project.activeSequence;
  if (!activeSequence) {
    excaliburAlert("ExcaliburFX ERROR: No active sequence found.");
    return;
  }

  var audioTracks = activeSequence.audioTracks;
  var time = activeSequence.getPlayerPosition();
  var safeOffset = isNaN(offsetSeconds) ? 0 : Math.max(0, offsetSeconds);

  if (mode === "peak") {
    time.seconds = Math.max(0, time.seconds - safeOffset);
  } else if (mode === "beatmarker") {
    var nearestMarkerTime = findNearestMarkerTimeInSequence(
      activeSequence,
      time.seconds
    );
    if (nearestMarkerTime !== null) {
      time.seconds = Math.max(0, nearestMarkerTime - safeOffset);
    } else {
      excaliburAlert(
        "ExcaliburFX: No marker found in the sequence. Inserting at the highest peak on the cursor."
      );
      time.seconds = Math.max(0, time.seconds - safeOffset);
    }
  }

  var soundDuration =
    importedItem.getOutPoint().seconds - importedItem.getInPoint().seconds;

  var trackToInsert: any = null;
  for (var t = 0; t < audioTracks.numTracks; t += 1) {
    var track = audioTracks[t];
    var isTrackAvailable = true;
    for (var c = 0; c < track.clips.numItems; c += 1) {
      var clip = track.clips[c];
      if (
        clip.start.seconds < time.seconds + soundDuration &&
        clip.end.seconds > time.seconds
      ) {
        isTrackAvailable = false;
        break;
      }
    }
    if (isTrackAvailable) {
      trackToInsert = track;
      break;
    }
  }

  if (trackToInsert) {
    trackToInsert.insertClip(importedItem, time);
  } else {
    excaliburAlert("ExcaliburFX ERROR: Please add more audio lines.");
  }
}

export function ExcaliburFXLoadSfxFile(payload: {
  path: string;
  offset?: number;
  mode?: string;
}): void {
  var filePath = decodeURIComponent(payload.path);
  var offsetSeconds =
    typeof payload.offset === "number" && !isNaN(payload.offset)
      ? payload.offset
      : 0;
  var mode = payload.mode ? payload.mode : "cursor";
  importSoundFileToTimeline(filePath, offsetSeconds, mode);
}

function getSelectedTimelineTrack(sequence: any, clip: any): any {
  var nodeId = String(clip.nodeId || "");
  var trackGroups = [
    { type: "video", tracks: sequence.videoTracks },
    { type: "audio", tracks: sequence.audioTracks },
  ];

  for (var groupIndex = 0; groupIndex < trackGroups.length; groupIndex += 1) {
    var group = trackGroups[groupIndex];
    for (var trackIndex = 0; trackIndex < group.tracks.numTracks; trackIndex += 1) {
      var track = group.tracks[trackIndex];
      for (var itemIndex = 0; itemIndex < track.clips.numItems; itemIndex += 1) {
        var item = track.clips[itemIndex];
        if (item === clip || (nodeId && String(item.nodeId || "") === nodeId)) {
          return {
            trackType: group.type,
            trackIndex: trackIndex,
          };
        }
      }
    }
  }

  return null;
}

export function getSelectedClipInfo(): string {
  var sequence = app.project && app.project.activeSequence;
  if (!sequence) return fail("Open a sequence first.");

  var selectedClips = sequence.getSelection();
  if (!selectedClips || selectedClips.length !== 1) {
    return fail("Select exactly one timeline clip.");
  }

  var clip = selectedClips[0];
  var projectItem = clip.projectItem;
  var track = getSelectedTimelineTrack(sequence, clip);
  if (!projectItem || !track || typeof projectItem.getMediaPath !== "function") {
    return fail("The selected item is not a supported video or audio clip.");
  }

  var sourcePath = projectItem.getMediaPath();
  var inPoint = Number(clip.inPoint.seconds);
  var outPoint = Number(clip.outPoint.seconds);
  var startTime = Number(clip.start.seconds);
  var endTime = Number(clip.end.seconds);
  if (!sourcePath || !isFinite(inPoint) || !isFinite(outPoint) || outPoint <= inPoint) {
    return fail("Could not read the selected clip's source range.");
  }

  return JSON.stringify({
    sourcePath: sourcePath,
    inPoint: inPoint,
    duration: outPoint - inPoint,
    timelineDuration: isFinite(endTime) && endTime > startTime ? endTime - startTime : outPoint - inPoint,
    startTime: startTime,
    trackType: track.trackType,
    trackIndex: track.trackIndex,
  });
}

function normalizeMediaPath(value: string): string {
  return String(value || "").replace(/\\/g, "/").toLowerCase();
}

function findProjectItemByPath(bin: any, filePath: string): any {
  if (!bin || !bin.children) return null;
  var targetPath = normalizeMediaPath(filePath);
  for (var i = 0; i < bin.children.numItems; i += 1) {
    var item = bin.children[i];
    try {
      if (
        typeof item.getMediaPath === "function" &&
        normalizeMediaPath(item.getMediaPath()) === targetPath
      ) {
        return item;
      }
    } catch (e: any) {}
    var nested = findProjectItemByPath(item, filePath);
    if (nested) return nested;
  }
  return null;
}

function isTrackFree(track: any, start: number, end: number): boolean {
  for (var c = 0; c < track.clips.numItems; c += 1) {
    var clip = track.clips[c];
    if (clip.start.seconds < end - 0.001 && clip.end.seconds > start + 0.001) {
      return false;
    }
  }
  return true;
}

function findFreeTrackAbove(
  tracks: any,
  fromIndex: number,
  start: number,
  end: number
): number {
  for (var i = fromIndex + 1; i < tracks.numTracks; i += 1) {
    if (isTrackFree(tracks[i], start, end)) return i;
  }
  return -1;
}

function addTrackWithQE(sequence: any, trackType: string): boolean {
  try {
    app.enableQE();
    var qeSeq = qe.project.getActiveSequence();
    var tracks = trackType === "audio" ? sequence.audioTracks : sequence.videoTracks;
    var before = tracks.numTracks;

    var attempts = [before - 1, before];
    for (var a = 0; a < attempts.length; a += 1) {
      try {
        if (trackType === "audio") {
          qeSeq.addTracks(0, 0, 1, attempts[a], 1);
        } else {
          qeSeq.addTracks(1, attempts[a], 0, 0);
        }
      } catch (e: any) {}
      tracks = trackType === "audio" ? sequence.audioTracks : sequence.videoTracks;
      if (tracks.numTracks > before) return true;
    }
  } catch (e: any) {}
  return false;
}

export function addRenderedClipAboveSelected(payload: {
  filePath: string;
  trackType: string;
  trackIndex: number;
  startTime: number;
  duration: number;
}): string {
  var project = app.project;
  var sequence = project && project.activeSequence;
  if (!sequence) return fail("No active sequence found.");
  if (
    !payload ||
    !payload.filePath ||
    !isFinite(payload.startTime) ||
    !isFinite(payload.duration)
  ) {
    return fail("Invalid rendered file information.");
  }
  if (payload.trackType !== "audio" && payload.trackType !== "video") {
    return fail("The selected clip track type is invalid.");
  }

  try {
    var file = new File(payload.filePath);
    if (!file.exists) return fail("The rendered file could not be found.");

    var projectItem = findProjectItemByPath(project.rootItem, payload.filePath);
    if (!projectItem) {
      project.importFiles([payload.filePath], true, project.rootItem, false);
      projectItem = findProjectItemByPath(project.rootItem, payload.filePath);
    }
    if (!projectItem) return fail("Premiere could not import the rendered file.");

    var start = payload.startTime;
    var end = payload.startTime + payload.duration;
    var tracks = payload.trackType === "audio" ? sequence.audioTracks : sequence.videoTracks;
    if (payload.trackIndex < 0 || payload.trackIndex >= tracks.numTracks) {
      return fail("The original timeline track is no longer available.");
    }

    var target = findFreeTrackAbove(tracks, payload.trackIndex, start, end);
    if (target === -1) {
      if (!addTrackWithQE(sequence, payload.trackType)) {
        return fail("Premiere could not create a track above the selected clip.");
      }
      tracks = payload.trackType === "audio" ? sequence.audioTracks : sequence.videoTracks;
      target = findFreeTrackAbove(tracks, payload.trackIndex, start, end);
      if (target === -1) return fail("No free track available above the selected clip.");
    }

    var time = new Time();
    time.seconds = start;
    tracks[target].overwriteClip(projectItem, time);
    return ok({ trackIndex: target, trackType: payload.trackType });
  } catch (error: any) {
    return fail("Could not place the rendered clip above the selected clip: " + String(error));
  }
}

function getTimeInSeconds(value: any): number {
  if (value && typeof value.seconds === "number") return value.seconds;
  if (value && value.ticks !== undefined) {
    return Number(value.ticks) / 254016000000;
  }
  if (typeof value === "number") return value;
  return NaN;
}

function findMatchingQeClip(qeSequence: any, clip: any, trackType: string = "audio"): any {
  var clipStart = getTimeInSeconds(clip.start);
  var clipEnd = getTimeInSeconds(clip.end);
  var clipNodeId = String(clip.nodeId || "");
  var trackCount = trackType === "video" ? qeSequence.numVideoTracks : qeSequence.numAudioTracks;

  for (var trackIndex = 0; trackIndex < trackCount; trackIndex += 1) {
    var track = trackType === "video"
      ? qeSequence.getVideoTrackAt(trackIndex)
      : qeSequence.getAudioTrackAt(trackIndex);
    for (var itemIndex = 0; itemIndex < track.numItems; itemIndex += 1) {
      var item = track.getItemAt(itemIndex);
      if (clipNodeId && String(item.nodeId || "") === clipNodeId) return item;

      var itemStart = getTimeInSeconds(item.start);
      var itemEnd = getTimeInSeconds(item.end);
      if (
        !isNaN(clipStart) &&
        !isNaN(clipEnd) &&
        Math.abs(itemStart - clipStart) < 0.02 &&
        Math.abs(itemEnd - clipEnd) < 0.02 &&
        String(item.name || "") === String(clip.name || "")
      ) {
        return item;
      }
    }
  }

  return null;
}

export function applyFillColor(hex: string): string {
  var clean = String(hex || "").replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return fail("Choose a valid hex color.");

  var sequence = app.project && app.project.activeSequence;
  if (!sequence) return fail("Open a sequence first.");
  var selectedClips = sequence.getSelection();
  if (!selectedClips || selectedClips.length === 0) {
    return fail("Select one or more video clips in the timeline.");
  }

  try {
    app.enableQE();
    var qeSequence = qe.project.getActiveSequence();
    var tintEffect = qe.project.getVideoEffectByName("Tint") ||
      qe.project.getVideoEffectByName("Teinte");
    if (!tintEffect) return fail("The Tint video effect is unavailable.");

    var color = [
      parseInt(clean.substring(0, 2), 16) / 255,
      parseInt(clean.substring(2, 4), 16) / 255,
      parseInt(clean.substring(4, 6), 16) / 255,
    ];
    var applied = 0;

    for (var i = 0; i < selectedClips.length; i += 1) {
      var clip = selectedClips[i];
      var qeClip = findMatchingQeClip(qeSequence, clip, "video");
      if (!qeClip || typeof qeClip.addVideoEffect !== "function") continue;
      qeClip.addVideoEffect(tintEffect);

      for (var componentIndex = 0; componentIndex < clip.components.numItems; componentIndex += 1) {
        var component = clip.components[componentIndex];
        if (component.displayName !== "Tint" && component.displayName !== "Teinte") continue;
        for (var propertyIndex = 0; propertyIndex < component.properties.numItems; propertyIndex += 1) {
          var property = component.properties[propertyIndex];
          var name = String(property.displayName || "").toLowerCase();
          if (name.indexOf("map black") !== -1 || name.indexOf("map white") !== -1 ||
              name.indexOf("noir") !== -1 || name.indexOf("blanc") !== -1) {
            property.setValue(color, 1);
          } else if (name.indexOf("amount") !== -1 || name.indexOf("intensité") !== -1 ||
                     name.indexOf("intensite") !== -1) {
            property.setValue(100, 1);
          }
        }
        applied += 1;
        break;
      }
    }

    return applied > 0 ? ok({ applied: applied }) : fail("Select video clips and try again.");
  } catch (error: any) {
    return fail("Could not apply the tint: " + String(error));
  }
}

export function ExcaliburFX_AddPproAudioEffect(effectNames: string[]): void {
  var sequence = app.project && app.project.activeSequence;
  if (!sequence) {
    excaliburAlert("No active sequence found.");
    return;
  }

  var selectedClips = sequence.getSelection();
  if (!selectedClips || selectedClips.length === 0) {
    excaliburAlert("Select one or more audio clips in the timeline first.");
    return;
  }

  try {
    app.enableQE();
    var qeSequence = qe.project.getActiveSequence();
    var qeEffect: any = null;
    for (var effectIndex = 0; effectIndex < effectNames.length; effectIndex += 1) {
      qeEffect = qe.project.getAudioEffectByName(effectNames[effectIndex]);
      if (qeEffect) break;
    }

    if (!qeEffect) {
      excaliburAlert("This audio effect is not available in this Premiere Pro version or language.");
      return;
    }

    var appliedCount = 0;
    for (var clipIndex = 0; clipIndex < selectedClips.length; clipIndex += 1) {
      var qeClip = findMatchingQeClip(qeSequence, selectedClips[clipIndex]);
      if (qeClip && typeof qeClip.addAudioEffect === "function") {
        qeClip.addAudioEffect(qeEffect);
        appliedCount += 1;
      }
    }

    if (appliedCount === 0) {
      excaliburAlert("Could not find the selected audio clips. Select clips on an audio track and try again.");
    }
  } catch (error: any) {
    excaliburAlert("Could not add the audio effect: " + String(error));
  }
}


export function setAudioVolumeKeyframes(
  fadeOutVal: number,
  brub: boolean,
  fullLevel: number = 0.1775,
  silenceLevel: number = 0.0014
): void {
  var sequence = app.project.activeSequence;
  if (!sequence) {
    excaliburAlert("No active sequence found.");
    return;
  }
  var selectedClips = sequence.getSelection();
  if (selectedClips.length === 0) {
    excaliburAlert("No clips selected.");
    return;
  }

  for (var i = 0; i < selectedClips.length; i += 1) {
    var clip = selectedClips[i];
    var audioComponents = clip.components;
    var volumeComponent: any = null;

    for (var j = 0; j < audioComponents.numItems; j += 1) {
      if (audioComponents[j].displayName === "Volume") {
        volumeComponent = audioComponents[j];
        break;
      }
    }

    if (!volumeComponent) {
      continue;
    }

    var volumeProperty = volumeComponent.properties[1];
    var inPoint = clip.inPoint.seconds;
    var outPoint = clip.outPoint.seconds;

    if (volumeProperty.isTimeVarying()) {
      var existingKeys = volumeProperty.getKeys();
      for (var k = existingKeys.length - 1; k >= 0; k -= 1) {
        volumeProperty.removeKey(existingKeys[k]);
      }
    }

    volumeProperty.setTimeVarying(true);
    var diff = (outPoint - inPoint) * fadeOutVal;

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

export function FadeInLevel(
  fadeInVal: string | number,
  strengthVal: string | number
): void {
  var numFadeInVal = Number(fadeInVal) / 100;
  var numStrengthVal = Number(strengthVal);
  var fullLevel = 0.1775 * Math.pow(10, numStrengthVal / 20);
  setAudioVolumeKeyframes(numFadeInVal, false, fullLevel);
}

export function FadeOutLevel(
  fadeOutVal: string | number,
  strengthVal: string | number
): void {
  var numFadeOutVal = Number(fadeOutVal) / 100;
  var numStrengthVal = Number(strengthVal);
  var fullLevel = 0.1775 * Math.pow(10, numStrengthVal / 20);
  setAudioVolumeKeyframes(numFadeOutVal, true, fullLevel);
}

function setPremiereLowerKeyframe(
  lowerAmountDb: number,
  spacingSeconds: number
): void {
  var sequence = app.project.activeSequence;
  if (!sequence) {
    excaliburAlert("No active sequence found.");
    return;
  }
  var selectedClips = sequence.getSelection();
  if (selectedClips.length === 0) {
    excaliburAlert("No clips selected.");
    return;
  }

  var cursorSeconds = sequence.getPlayerPosition().seconds;

  for (var i = 0; i < selectedClips.length; i += 1) {
    var clip = selectedClips[i];
    var audioComponents = clip.components;
    var volumeComponent: any = null;

    for (var j = 0; j < audioComponents.numItems; j += 1) {
      if (audioComponents[j].displayName === "Volume") {
        volumeComponent = audioComponents[j];
        break;
      }
    }

    if (!volumeComponent) {
      continue;
    }

    var volumeProperty = volumeComponent.properties[1];
    var inPoint = clip.inPoint.seconds;
    var outPoint = clip.outPoint.seconds;

    var centerTime = Math.min(Math.max(cursorSeconds, inPoint), outPoint);
    var leftTime = Math.max(inPoint, centerTime - spacingSeconds);
    var rightTime = Math.min(outPoint, centerTime + spacingSeconds);

    volumeProperty.setTimeVarying(true);

    var currentAtLeft = volumeProperty.getValueAtTime(leftTime);
    var currentAtCenter = volumeProperty.getValueAtTime(centerTime);
    var currentAtRight = volumeProperty.getValueAtTime(rightTime);
    var reducedCenterValue =
      currentAtCenter * Math.pow(10, -lowerAmountDb / 20);

    volumeProperty.addKey(leftTime);
    volumeProperty.setValueAtKey(leftTime, currentAtLeft, 1);

    volumeProperty.addKey(centerTime);
    volumeProperty.setValueAtKey(centerTime, reducedCenterValue, 1);

    volumeProperty.addKey(rightTime);
    volumeProperty.setValueAtKey(rightTime, currentAtRight, 1);
  }
}

export function ExcaliburFX_Lower(
  lowerAmount: string | number,
  spacingSeconds: string | number
): void {
  var numLowerAmount = Number(lowerAmount);
  var numSpacing = Math.max(0.01, Number(spacingSeconds));
  setPremiereLowerKeyframe(numLowerAmount, numSpacing);
}


export function ExcaliburFXselectFolder(): string | null {
  var folder = (Folder as any).selectDialog(
    "Select a folder that you wanna add."
  );
  if (folder != null) {
    return folder.fsName;
  }
  return null;
}

declare const Folder: any;