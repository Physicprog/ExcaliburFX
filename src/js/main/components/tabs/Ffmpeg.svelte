<script>
  import { onMount, onDestroy } from "svelte";
  import { fly } from "svelte/transition";
  import FFMPEGWindows from "../../bin/win/ffmpeg.exe?url";
  import FFMPEGMac from "../../bin/mac/ffmpeg.bin?url";
  import FFMPEGFont from "../../../assets/fonts/museosans.ttf?url";
  import { evalES, evalTS, selectFolder } from "../../../lib/utils/bolt";
  import { getPreference, setPreference } from "../../../lib/utils/main.js";
  import { child_process, fs, os, path } from "../../../lib/cep/node";
  import { TRANSITION_MS, isPremiere } from "../../stores.js";
  import Delete from "../../../assets/ui/Delete.png";
  import Clear from "../../../assets/ui/Clear.png";
  import OpenFolder from "../../../assets/ui/OpenFolder.png";
  const { execFile } = child_process;
  const isMac = os.platform() === "darwin";
  const ffmpegPath = isMac ? FFMPEGMac : FFMPEGWindows;

  let wrapperEl;
  let scaleFactor = 1;
  const REF_WIDTH = 440;
  const REF_HEIGHT = 390;
  let wrapperObserver;
  let rafIdScale = null;

  function updateScale(w, h) {
    if (!w || !h) return;
    scaleFactor = Math.min(w / REF_WIDTH, h / REF_HEIGHT);
  }

  const FORMAT_OPTIONS = [
    { value: "mp4", label: "MP4 (H.264)" },
    { value: "mov", label: "MOV (H.264)" },
    { value: "avi", label: "AVI" },
    { value: "webm", label: "WEBM (VP9)" },
    { value: "mkv", label: "MKV" },
    { value: "gif", label: "GIF" },
  ];

  const RESOLUTION_MODE_OPTIONS = [
    { value: "percent", label: "Percentage of source" },
    { value: "custom", label: "Custom size" },
  ];

  const ROTATE_OPTIONS = [
    { value: "0", label: "No rotation" },
    { value: "90", label: "90 deg clockwise" },
    { value: "180", label: "180 deg" },
    { value: "270", label: "270 deg clockwise" },
  ];

  const AUDIO_MODE_OPTIONS = [
    { value: "keep", label: "Keep audio" },
    { value: "remove", label: "Remove audio" },
    { value: "extract", label: "Extract audio only" },
  ];

  const TEXT_POSITION_OPTIONS = [
    { value: "top", label: "Top" },
    { value: "center", label: "Center" },
    { value: "bottom", label: "Bottom" },
  ];

  const SAMPLE_RATE_OPTIONS = [
    { value: "22050", label: "22050 Hz" },
    { value: "32000", label: "32000 Hz" },
    { value: "44100", label: "44100 Hz" },
    { value: "48000", label: "48000 Hz" },
    { value: "96000", label: "96000 Hz" },
  ];

  const CHANNEL_OPTIONS = [
    { value: "mono", label: "Mono" },
    { value: "stereo", label: "Stereo" },
  ];

  const SPEED_PRESET_OPTIONS = [
    { value: "ultrafast", label: "Ultrafast" },
    { value: "superfast", label: "Superfast" },
    { value: "veryfast", label: "Very fast" },
    { value: "faster", label: "Faster" },
    { value: "fast", label: "Fast" },
    { value: "medium", label: "Medium" },
    { value: "slow", label: "Slow" },
    { value: "slower", label: "Slower" },
    { value: "veryslow", label: "Very slow" },
  ];

  const VIDEO_CODEC_OPTIONS = [
    { value: "libx264", label: "H.264" },
    { value: "libx265", label: "H.265 / HEVC" },
    { value: "prores_ks", label: "Apple ProRes" },
    { value: "libvpx-vp9", label: "VP9" },
    { value: "libaom-av1", label: "AV1" },
    { value: "mpeg4", label: "MPEG-4" },
  ];

  const AUDIO_CODEC_OPTIONS = [
    { value: "aac", label: "AAC" },
    { value: "libmp3lame", label: "MP3" },
    { value: "libopus", label: "Opus" },
    { value: "pcm_s16le", label: "PCM 16-bit" },
    { value: "copy", label: "Copy source" },
  ];

  const PIXEL_FORMAT_OPTIONS = [
    { value: "yuv420p", label: "YUV 4:2:0 (compatible)" },
    { value: "yuv422p", label: "YUV 4:2:2" },
    { value: "yuv444p", label: "YUV 4:4:4" },
    { value: "rgb24", label: "RGB 24-bit" },
  ];

  const DESHAKE_EDGE_OPTIONS = [
    { value: "mirror", label: "Mirror" },
    { value: "wrap", label: "Wrap" },
    { value: "blank", label: "Blank" },
    { value: "fixed", label: "Fixed" },
  ];

  const BLOCK_DEFS = [
    {
      id: "convert",
      label: "Convert Format",
      badge: "CV",
      category: "FORMAT",
      description: "Change the output container and codec.",
      defaultParams: () => ({ format: "mp4" }),
    },

    {
      id: "resolution",
      label: "Resolution",
      badge: "RZ",
      category: "GEOMETRY",
      description: "Resize to a percentage of the source or a fixed size.",
      defaultParams: () => ({
        mode: "percent",
        percent: 100,
        width: 1920,
        height: 1080,
        preserveAspect: false,
        forceDivisibleBy: 2,
      }),
    },
    {
      id: "crop",
      label: "Crop",
      badge: "CR",
      category: "GEOMETRY",
      description: "Cut out a rectangular region of the frame.",
      defaultParams: () => ({ width: 1080, height: 1080, x: 0, y: 0 }),
    },
    {
      id: "rotate",
      label: "Rotate / Flip",
      badge: "RT",
      category: "GEOMETRY",
      description: "Rotate by 90 degree steps or flip the frame.",
      defaultParams: () => ({ angle: "0", flipH: false, flipV: false }),
    },
    {
      id: "pad",
      label: "Pad / Letterbox",
      badge: "PD",
      category: "GEOMETRY",
      description: "Add bars around the frame to fit a target size.",
      defaultParams: () => ({ width: 1920, height: 1080, color: "#000000" }),
    },
    {
      id: "mirror",
      label: "Mirror",
      badge: "MR",
      category: "GEOMETRY",
      description: "Mirror the image horizontally or vertically.",
      defaultParams: () => ({ horizontal: true, vertical: false }),
    },
    {
      id: "drawbox",
      label: "Draw Box",
      badge: "BX",
      category: "GEOMETRY",
      description: "Draw a colored box on the video.",
      defaultParams: () => ({
        x: 10,
        y: 10,
        width: 100,
        height: 100,
        color: "#ff0000",
        thickness: 5,
      }),
    },

    {
      id: "trim",
      label: "Trim Video",
      badge: "TR",
      category: "TIMING",
      description: "Cut a specific part of the video.",
      defaultParams: () => ({ start: 0, duration: 5 }),
    },
    {
      id: "fps",
      label: "Frame Rate",
      badge: "FR",
      category: "TIMING",
      description: "Force a specific output frame rate.",
      defaultParams: () => ({ fps: 30 }),
    },
    {
      id: "speed",
      label: "Speed",
      badge: "SP",
      category: "TIMING",
      description: "Speed up or slow down video and audio together.",
      defaultParams: () => ({ speed: 1 }),
    },
    {
      id: "reverse",
      label: "Reverse",
      badge: "RV",
      category: "TIMING",
      description: "Play the clip backwards (video and audio).",
      defaultParams: () => ({}),
    },
    {
      id: "loop",
      label: "Loop",
      badge: "LP",
      category: "TIMING",
      description: "Repeat the input clip a number of times.",
      defaultParams: () => ({ times: 2 }),
    },
    {
      id: "fade",
      label: "Fade In/Out",
      badge: "FD",
      category: "TIMING",
      description: "Fade the video in at the start and/or out at the end.",
      defaultParams: () => ({ fadeIn: 0.5, fadeOut: 0.5 }),
    },

    {
      id: "color",
      label: "Color Correction",
      badge: "CL",
      category: "LOOK",
      description: "Adjust contrast, brightness and saturation.",
      defaultParams: () => ({
        contrast: 1,
        brightness: 0,
        saturation: 1,
        gamma: 1,
      }),
    },
    {
      id: "hue",
      label: "Hue Adjustment",
      badge: "HU",
      category: "LOOK",
      description: "Change the hue of the video.",
      defaultParams: () => ({ angle: 90 }),
    },
    {
      id: "sharpen",
      label: "Sharpen",
      badge: "SH",
      category: "LOOK",
      description: "Sharpen or soften the image.",
      defaultParams: () => ({ amount: 0.5 }),
    },
    {
      id: "denoise",
      label: "Denoise",
      badge: "DN",
      category: "LOOK",
      description: "Reduce grain and noise in the image.",
      defaultParams: () => ({ strength: 4 }),
    },
    {
      id: "blur",
      label: "Blur",
      badge: "BL",
      category: "LOOK",
      description: "Apply a box blur to the whole frame.",
      defaultParams: () => ({ amount: 5 }),
    },
    {
      id: "vignette",
      label: "Vignette",
      badge: "VG",
      category: "LOOK",
      description: "Darken the corners of the frame.",
      defaultParams: () => ({ intensity: 5, mode: "forward" }),
    },
    {
      id: "grayscale",
      label: "Grayscale",
      badge: "GS",
      category: "LOOK",
      description: "Remove all color from the image.",
      defaultParams: () => ({}),
    },
    {
      id: "sepia",
      label: "Sepia",
      badge: "SE",
      category: "LOOK",
      description: "Apply a warm sepia color treatment.",
      defaultParams: () => ({ intensity: 1 }),
    },
    {
      id: "exposure",
      label: "Exposure / Gamma",
      badge: "EX",
      category: "LOOK",
      description: "Adjust exposure and gamma independently.",
      defaultParams: () => ({ exposure: 0, gamma: 1 }),
    },
    {
      id: "deinterlace",
      label: "Deinterlace",
      badge: "DI",
      category: "LOOK",
      description: "Convert interlaced footage to progressive.",
      defaultParams: () => ({}),
    },
    {
      id: "chromakey",
      label: "Chroma Key",
      badge: "CK",
      category: "LOOK",
      description: "Remove a green/blue screen background.",
      defaultParams: () => ({ color: "#00ff00", similarity: 0.3, blend: 0.1 }),
    },
    {
      id: "textoverlay",
      label: "Text Overlay",
      badge: "TX",
      category: "LOOK",
      description: "Burn a line of text onto the video.",
      defaultParams: () => ({
        text: "Sample text",
        fontSize: 42,
        color: "#ffffff",
        position: "bottom",
      }),
    },
    {
      id: "deshake",
      label: "Stabilize (Deshake)",
      badge: "DS",
      category: "LOOK",
      description: "Reduce camera shake with FFmpeg's deshake filter.",
      defaultParams: () => ({ rx: 16, ry: 16, edge: "mirror", blocksize: 8 }),
    },
    {
      id: "pixelize",
      label: "Pixel Art Effect",
      badge: "PX",
      category: "LOOK",
      description: "Make the video look like retro pixel art.",
      defaultParams: () => ({ block_width: 10, block_height: 10 }),
    },

    {
      id: "bitrate",
      label: "Bitrate",
      badge: "BR",
      category: "ENCODE",
      description: "Set a target video bitrate for the encode.",
      defaultParams: () => ({ bitrate: 8000 }),
    },
    {
      id: "quality",
      label: "Quality (CRF)",
      badge: "QL",
      category: "ENCODE",
      description: "Quality-based encode. Lower is better quality.",
      defaultParams: () => ({ crf: 23 }),
    },
    {
      id: "speedpreset",
      label: "Encoding Speed",
      badge: "PR",
      category: "ENCODE",
      description: "Trade encoding speed for compression efficiency.",
      defaultParams: () => ({ preset: "medium" }),
    },
    {
      id: "codec",
      label: "Codecs",
      badge: "CO",
      category: "ENCODE",
      description: "Choose video and audio codecs and output pixel format.",
      defaultParams: () => ({
        videoCodec: "libx264",
        audioCodec: "aac",
        pixelFormat: "yuv420p",
      }),
    },
    {
      id: "keyframes",
      label: "Keyframe Interval",
      badge: "KF",
      category: "ENCODE",
      description: "Set the maximum distance between video keyframes.",
      defaultParams: () => ({ interval: 60 }),
    },

    {
      id: "audio",
      label: "Audio",
      badge: "AU",
      category: "AUDIO",
      description: "Keep, remove or extract only the audio track.",
      defaultParams: () => ({ mode: "keep" }),
    },
    {
      id: "volume",
      label: "Volume",
      badge: "VL",
      category: "AUDIO",
      description: "Turn the audio track up or down.",
      defaultParams: () => ({ volumeDb: 0 }),
    },
    {
      id: "audiofade",
      label: "Audio Fade In/Out",
      badge: "AF",
      category: "AUDIO",
      description: "Fade the audio in at the start and/or out at the end.",
      defaultParams: () => ({ fadeIn: 0.5, fadeOut: 0.5 }),
    },
    {
      id: "normalizeaudio",
      label: "Normalize Audio",
      badge: "NA",
      category: "AUDIO",
      description: "Even out loudness across the track.",
      defaultParams: () => ({
        integrated: -16,
        truePeak: -1.5,
        loudnessRange: 11,
      }),
    },
    {
      id: "samplerate",
      label: "Sample Rate",
      badge: "SR",
      category: "AUDIO",
      description: "Change the audio sample rate.",
      defaultParams: () => ({ rate: "48000" }),
    },
    {
      id: "channels",
      label: "Channels",
      badge: "CH",
      category: "AUDIO",
      description: "Force mono or stereo output.",
      defaultParams: () => ({ channels: "stereo" }),
    },
    {
      id: "audiofilter",
      label: "Audio High / Low-pass",
      badge: "HP",
      category: "AUDIO",
      description: "Remove low or high frequencies from the audio.",
      defaultParams: () => ({ mode: "highpass", frequency: 80, order: 2 }),
    },
    {
      id: "compressor",
      label: "Audio Compressor",
      badge: "AC",
      category: "AUDIO",
      description: "Control audio dynamics.",
      defaultParams: () => ({
        threshold: 0.125,
        ratio: 2,
        attack: 20,
        release: 250,
        makeup: 1,
      }),
    },
    {
      id: "audiobitrate",
      label: "Audio Bitrate",
      badge: "AB",
      category: "AUDIO",
      description: "Set the encoded audio bitrate.",
      defaultParams: () => ({ bitrate: 192 }),
    },
    {
      id: "audiopitch",
      label: "Pitch Change",
      badge: "PT",
      category: "AUDIO",
      description: "Make the voice sound like a chipmunk or a giant.",
      defaultParams: () => ({ pitch: 1.5 }),
    },
    {
      id: "echo",
      label: "Audio Echo",
      badge: "EC",
      category: "AUDIO",
      description: "Add a repeating echo effect.",
      defaultParams: () => ({ delay: 500, decay: 0.5 }),
    },
    {
      id: "tremolo",
      label: "Tremolo",
      badge: "TM",
      category: "AUDIO",
      description: "Add a trembling effect to the audio.",
      defaultParams: () => ({ frequency: 5, depth: 0.5 }),
    },
  ];

  function getBlockDef(type) {
    return BLOCK_DEFS.find((b) => b.id === type);
  }

  function makeUid(type) {
    return `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  }

  function createBlock(type) {
    const def = getBlockDef(type);
    return { uid: makeUid(type), type, params: def.defaultParams() };
  }

  let mainTab = "builder";

  let subView = "chain";
  let prevSubView = null;
  let directionSub = 1;
  let isTransitioningSub = false;
  let transTimeout = null;

  function setSubView(view) {
    if (view === subView) return;
    directionSub = view === "add" ? 1 : -1;
    prevSubView = subView;
    subView = view;
    isTransitioningSub = true;
    clearTimeout(transTimeout);
    transTimeout = setTimeout(() => {
      isTransitioningSub = false;
      prevSubView = null;
    }, $TRANSITION_MS ?? 300);
  }

  function setMainTab(tab) {
    mainTab = tab;
  }

  let chainBlocks = [];
  let expandedUid = null;
  let searchAdd = "";
  let chainSaveTimeout = null;

  function persistChain() {
    setPreference(
      "ffmpegChain",
      chainBlocks.map(({ type, params }) => ({ type, params })),
    );
  }

  function scheduleChainSave() {
    clearTimeout(chainSaveTimeout);
    chainSaveTimeout = setTimeout(persistChain, 300);
  }

  function loadChain() {
    const savedChain = getPreference("ffmpegChain");
    if (!Array.isArray(savedChain)) return;
    chainBlocks = savedChain
      .filter((block) => block && getBlockDef(block.type))
      .map((block) => ({
        uid: makeUid(block.type),
        type: block.type,
        params: { ...getBlockDef(block.type).defaultParams(), ...block.params },
      }));
  }

  $: filteredBlockDefs = BLOCK_DEFS.filter((b) =>
    b.label.toLowerCase().includes(searchAdd.toLowerCase()),
  );
  $: groupedBlockDefs = filteredBlockDefs.reduce((acc, def) => {
    (acc[def.category] = acc[def.category] || []).push(def);
    return acc;
  }, {});

  function toggleExpand(uid) {
    expandedUid = expandedUid === uid ? null : uid;
  }

  function addBlockToChain(type) {
    chainBlocks = [...chainBlocks, createBlock(type)];
    scheduleChainSave();
    setSubView("chain");
  }

  function removeBlock(uid) {
    chainBlocks = chainBlocks.filter((b) => b.uid !== uid);
    scheduleChainSave();
    if (expandedUid === uid) expandedUid = null;
  }

  function updateParam(uid, key, value) {
    chainBlocks = chainBlocks.map((b) =>
      b.uid === uid ? { ...b, params: { ...b.params, [key]: value } } : b,
    );
    scheduleChainSave();
  }

  function clearChain() {
    if (window.confirm("Are you sure you want to clear the entire chain?")) {
      chainBlocks = [];
      expandedUid = null;
      scheduleChainSave();
    }
  }

  function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }

  function hexToFFColor(hex) {
    if (!hex) return "black";
    return `0x${hex.replace("#", "")}`;
  }

  function escapeDrawtext(text) {
    return String(text || "")
      .replace(/\\/g, "\\\\")
      .replace(/:/g, "\\:")
      .replace(/'/g, "\\'");
  }

  function escapeFFmpegPath(filePath) {
    return String(filePath)
      .replace(/\\/g, "/")
      .replace(/:/g, "\\:")
      .replace(/'/g, "\\'")
      .replace(/,/g, "\\,");
  }

  function atempoChain(speed) {
    let remaining = speed;
    const parts = [];
    if (remaining <= 0) return ["atempo=1.0"];
    while (remaining > 2.0) {
      parts.push("atempo=2.0");
      remaining /= 2.0;
    }
    while (remaining < 0.5) {
      parts.push("atempo=0.5");
      remaining /= 0.5;
    }
    parts.push(`atempo=${remaining.toFixed(3)}`);
    return parts;
  }

  function buildPipeline(blocks, context = {}) {
    const vf = [];
    const af = [];
    const extra = [];
    const preInput = [];
    let ext = null;
    const duration = context.duration;

    for (const block of blocks) {
      const p = block.params;
      switch (block.type) {
        case "convert":
          ext = p.format;
          if (p.format === "webm") {
            extra.push("-c:v", "libvpx-vp9", "-c:a", "libopus");
          } else if (p.format !== "gif") {
            extra.push("-c:v", "libx264", "-pix_fmt", "yuv420p");
          }
          break;
        case "resolution":
          if (p.mode === "percent") {
            const f = (p.percent / 100).toFixed(3);
            vf.push(`scale=iw*${f}:ih*${f}`);
          } else {
            const preserve = p.preserveAspect
              ? `:force_original_aspect_ratio=decrease:force_divisible_by=${Math.max(1, Math.round(p.forceDivisibleBy))}`
              : "";
            vf.push(
              `scale=${Math.round(p.width)}:${Math.round(p.height)}${preserve}`,
            );
          }
          break;
        case "crop":
          vf.push(
            `crop=${Math.round(p.width)}:${Math.round(p.height)}:${Math.round(p.x)}:${Math.round(p.y)}`,
          );
          break;
        case "rotate":
          if (p.angle === "90") vf.push("transpose=1");
          else if (p.angle === "180") vf.push("transpose=2,transpose=2");
          else if (p.angle === "270") vf.push("transpose=2");
          if (p.flipH) vf.push("hflip");
          if (p.flipV) vf.push("vflip");
          break;
        case "pad":
          vf.push(
            `pad=${Math.round(p.width)}:${Math.round(p.height)}:(ow-iw)/2:(oh-ih)/2:${hexToFFColor(p.color)}`,
          );
          break;
        case "drawbox":
          vf.push(
            `drawbox=x=${p.x}:y=${p.y}:w=${p.width}:h=${p.height}:color=${hexToFFColor(p.color)}:t=${p.thickness}`,
          );
          break;
        case "trim":
          extra.push("-ss", `${p.start}`, "-t", `${p.duration}`);
          break;
        case "fps":
          extra.push("-r", `${p.fps}`);
          break;
        case "speed":
          const s = clamp(p.speed, 0.1, 8);
          vf.push(`setpts=${(1 / s).toFixed(4)}*PTS`);
          af.push(...atempoChain(s));
          break;
        case "reverse":
          vf.push("reverse");
          af.push("areverse");
          break;
        case "loop":
          const n = Math.max(1, Math.round(p.times));
          if (n > 1) preInput.push("-stream_loop", `${n - 1}`);
          break;
        case "fade":
          if (p.fadeIn > 0) vf.push(`fade=t=in:st=0:d=${p.fadeIn}`);
          if (p.fadeOut > 0 && duration) {
            vf.push(
              `fade=t=out:st=${Math.max(duration - p.fadeOut, 0)}:d=${p.fadeOut}`,
            );
          }
          break;
        case "color":
          vf.push(
            `eq=contrast=${p.contrast}:brightness=${p.brightness}:saturation=${p.saturation}:gamma=${p.gamma}`,
          );
          break;
        case "hue":
          vf.push(`hue=h=${p.angle}`);
          break;
        case "sharpen":
          vf.push(`unsharp=5:5:${clamp(p.amount, -2, 2).toFixed(2)}:5:5:0`);
          break;
        case "denoise":
          const dS = clamp(p.strength, 0, 20);
          vf.push(
            `hqdn3d=${dS}:${dS}:${(dS * 0.6).toFixed(1)}:${(dS * 0.6).toFixed(1)}`,
          );
          break;
        case "blur":
          vf.push(`boxblur=${clamp(p.amount, 0, 40)}:1`);
          break;
        case "pixelize":
          vf.push(
            `scale=iw/${p.block_width}:ih/${p.block_height},scale=iw*${p.block_width}:ih*${p.block_height}:flags=neighbor`,
          );
          break;
        case "vignette":
          const i = clamp(p.intensity, 1, 10);
          const divisor = Math.max(1.2, 12 - i);
          vf.push(`vignette=angle=PI/${divisor.toFixed(2)}:mode=${p.mode}`);
          break;
        case "grayscale":
          vf.push("hue=s=0");
          break;
        case "deinterlace":
          vf.push("yadif");
          break;
        case "chromakey":
          vf.push(
            `chromakey=${hexToFFColor(p.color)}:${p.similarity}:${p.blend}`,
          );
          break;
        case "textoverlay":
          const safeText = escapeDrawtext(p.text);
          const safeFontPath = escapeFFmpegPath(context.fontPath);
          const yExpr =
            p.position === "top"
              ? "h*0.08"
              : p.position === "center"
                ? "(h-text_h)/2"
                : "h-text_h-h*0.08";
          vf.push(
            `drawtext=fontfile='${safeFontPath}':text='${safeText}':fontsize=${Math.round(p.fontSize)}:fontcolor=${hexToFFColor(p.color)}:x=(w-text_w)/2:y=${yExpr}`,
          );
          break;
        case "bitrate":
          extra.push("-b:v", `${Math.round(p.bitrate)}k`);
          break;
        case "quality":
          extra.push("-crf", `${Math.round(p.crf)}`);
          break;
        case "speedpreset":
          extra.push("-preset", p.preset);
          break;
        case "audio":
          if (p.mode === "remove") extra.push("-an");
          else if (p.mode === "extract") extra.push("-vn");
          break;
        case "volume":
          af.push(`volume=${p.volumeDb}dB`);
          break;
        case "audiopitch":
          af.push(`rubberband=pitch=${p.pitch}`);
          break;
        case "echo":
          af.push(`aecho=0.8:0.88:${p.delay}:${p.decay}`);
          break;
        case "tremolo":
          af.push(`tremolo=f=${p.frequency}:d=${p.depth}`);
          break;
        case "audiofade":
          if (p.fadeIn > 0) af.push(`afade=t=in:st=0:d=${p.fadeIn}`);
          if (p.fadeOut > 0 && duration) {
            af.push(
              `afade=t=out:st=${Math.max(duration - p.fadeOut, 0)}:d=${p.fadeOut}`,
            );
          }
          break;
        case "normalizeaudio":
          af.push(
            `loudnorm=I=${p.integrated}:TP=${p.truePeak}:LRA=${p.loudnessRange}`,
          );
          break;
        case "samplerate":
          extra.push("-ar", `${p.rate}`);
          break;
        case "channels":
          extra.push("-ac", p.channels === "mono" ? "1" : "2");
          break;
        case "codec":
          extra.push(
            "-c:v",
            p.videoCodec,
            "-c:a",
            p.audioCodec,
            "-pix_fmt",
            p.pixelFormat,
          );
          break;
        case "deshake":
          vf.push(
            `deshake=rx=${Math.round(p.rx)}:ry=${Math.round(p.ry)}:edge=${p.edge}:blocksize=${Math.round(p.blocksize)}`,
          );
          break;
        case "mirror":
          if (p.horizontal) vf.push("hflip");
          if (p.vertical) vf.push("vflip");
          break;
        case "sepia":
          const amount = clamp(p.intensity, 0, 1);
          vf.push(
            `colorchannelmixer=rr=${1 - amount * 0.393}:rg=${amount * 0.769}:rb=${amount * 0.189}:gr=${amount * 0.349}:gg=${1 - amount * 0.314}:gb=${amount * 0.168}:br=${amount * 0.272}:bg=${amount * 0.534}:bb=${1 - amount * 0.869}`,
          );
          break;
        case "exposure":
          vf.push(
            `exposure=exposure=${clamp(p.exposure, -3, 3)}:black=0`,
            `eq=gamma=${clamp(p.gamma, 0.1, 3)}`,
          );
          break;
        case "audiofilter":
          af.push(
            `${p.mode}=f=${Math.round(p.frequency)}:p=${Math.round(p.order)}`,
          );
          break;
        case "compressor":
          af.push(
            `acompressor=threshold=${p.threshold}:ratio=${p.ratio}:attack=${p.attack}:release=${p.release}:makeup=${p.makeup}`,
          );
          break;
        case "audiobitrate":
          extra.push("-b:a", `${Math.round(p.bitrate)}k`);
          break;
        case "keyframes":
          extra.push("-g", `${Math.max(1, Math.round(p.interval))}`);
          break;
      }
    }
    return { vf, af, extra, preInput, ext };
  }

  function describeBlock(block) {
    const p = block.params;
    switch (block.type) {
      case "convert":
        return `Output as ${p.format.toUpperCase()}`;
      case "resolution":
        return p.mode === "percent"
          ? `Scale to ${p.percent}%`
          : `Resize to ${p.width} x ${p.height}`;
      case "crop":
        return `Crop ${p.width} x ${p.height} at (${p.x}, ${p.y})`;
      case "rotate":
        const bits = [];
        if (p.angle !== "0") bits.push(`rotate ${p.angle} deg`);
        if (p.flipH) bits.push("flip H");
        if (p.flipV) bits.push("flip V");
        return bits.length ? bits.join(", ") : "No change";
      case "fps":
        return `Force ${p.fps} fps`;
      case "speed":
        return `Speed x${p.speed}`;
      case "color":
        return `Contrast ${p.contrast} / Brightness ${p.brightness}`;
      case "sharpen":
        return `Sharpen amount ${p.amount}`;
      case "bitrate":
        return `Video bitrate ${p.bitrate}k`;
      case "audio":
        return p.mode === "keep"
          ? "Keep audio"
          : p.mode === "remove"
            ? "Remove audio"
            : "Extract audio only";
      case "trim":
        return `Start at ${p.start}s, Duration ${p.duration}s`;
      case "drawbox":
        return `Box ${p.width}x${p.height} at (${p.x},${p.y})`;
      case "hue":
        return `Hue shifted by ${p.angle}°`;
      case "audiopitch":
        return `Pitch x${p.pitch}`;
      case "echo":
        return `Echo delay ${p.delay}ms`;
      case "tremolo":
        return `Tremolo depth ${p.depth}`;
      case "pixelize":
        return `Pixel size ${p.block_width}x${p.block_height}`;
      default:
        return "";
    }
  }

  const VISIBLE_SETTINGS = {
    convert: ["format"],
    resolution: ["mode", "percent", "width", "height"],
    crop: ["width", "height", "x", "y"],
    rotate: ["angle", "flipH", "flipV"],
    fps: ["fps"],
    speed: ["speed"],
    color: ["contrast", "brightness", "saturation"],
    sharpen: ["amount"],
    bitrate: ["bitrate"],
    audio: ["mode"],
    trim: ["start", "duration"],
    drawbox: ["x", "y", "width", "height", "color", "thickness"],
    hue: ["angle"],
    pixelize: ["block_width", "block_height"],
    audiopitch: ["pitch"],
    echo: ["delay", "decay"],
    tremolo: ["frequency", "depth"],
  };

  const EXTRA_SETTING_FIELDS = {
    resolution: [
      {
        key: "preserveAspect",
        label: "Preserve aspect ratio",
        type: "checkbox",
      },
      {
        key: "forceDivisibleBy",
        label: "Even-size divisor",
        type: "number",
        min: 1,
        max: 16,
        step: 1,
      },
    ],
    pad: [
      {
        key: "width",
        label: "Canvas width",
        type: "number",
        min: 16,
        max: 16384,
        step: 2,
      },
      {
        key: "height",
        label: "Canvas height",
        type: "number",
        min: 16,
        max: 16384,
        step: 2,
      },
      { key: "color", label: "Bar color", type: "color" },
    ],
    drawbox: [
      { key: "x", label: "Pos X", type: "number", min: 0, max: 4000, step: 1 },
      { key: "y", label: "Pos Y", type: "number", min: 0, max: 4000, step: 1 },
      {
        key: "width",
        label: "Width",
        type: "number",
        min: 1,
        max: 4000,
        step: 1,
      },
      {
        key: "height",
        label: "Height",
        type: "number",
        min: 1,
        max: 4000,
        step: 1,
      },
      { key: "color", label: "Box Color", type: "color" },
      {
        key: "thickness",
        label: "Thickness",
        type: "number",
        min: 1,
        max: 100,
        step: 1,
      },
    ],
    trim: [
      {
        key: "start",
        label: "Start (seconds)",
        type: "number",
        min: 0,
        max: 3600,
        step: 1,
      },
      {
        key: "duration",
        label: "Duration (seconds)",
        type: "number",
        min: 1,
        max: 3600,
        step: 1,
      },
    ],
    loop: [
      {
        key: "times",
        label: "Total plays",
        type: "number",
        min: 1,
        max: 100,
        step: 1,
      },
    ],
    fade: [
      {
        key: "fadeIn",
        label: "Fade in (seconds)",
        type: "number",
        min: 0,
        max: 60,
        step: 0.1,
      },
      {
        key: "fadeOut",
        label: "Fade out (seconds)",
        type: "number",
        min: 0,
        max: 60,
        step: 0.1,
      },
    ],
    color: [
      {
        key: "gamma",
        label: "Gamma",
        type: "number",
        min: 0.1,
        max: 3,
        step: 0.05,
      },
    ],
    hue: [
      {
        key: "angle",
        label: "Hue Angle (°)",
        type: "number",
        min: 0,
        max: 360,
        step: 1,
      },
    ],
    pixelize: [
      {
        key: "block_width",
        label: "Pixel Width",
        type: "number",
        min: 2,
        max: 100,
        step: 1,
      },
      {
        key: "block_height",
        label: "Pixel Height",
        type: "number",
        min: 2,
        max: 100,
        step: 1,
      },
    ],
    denoise: [
      {
        key: "strength",
        label: "Strength",
        type: "number",
        min: 0,
        max: 20,
        step: 0.5,
      },
    ],
    blur: [
      {
        key: "amount",
        label: "Blur amount",
        type: "number",
        min: 0,
        max: 40,
        step: 1,
      },
    ],
    vignette: [
      {
        key: "mode",
        label: "Mode",
        type: "select",
        options: [
          { value: "forward", label: "Forward" },
          { value: "backward", label: "Backward" },
        ],
      },
    ],
    chromakey: [
      { key: "color", label: "Key color", type: "color" },
      {
        key: "similarity",
        label: "Similarity",
        type: "number",
        min: 0.01,
        max: 1,
        step: 0.01,
      },
      {
        key: "blend",
        label: "Blend",
        type: "number",
        min: 0,
        max: 1,
        step: 0.01,
      },
    ],
    textoverlay: [
      { key: "text", label: "Text", type: "text" },
      {
        key: "fontSize",
        label: "Font size",
        type: "number",
        min: 8,
        max: 300,
        step: 1,
      },
      { key: "color", label: "Text color", type: "color" },
      {
        key: "position",
        label: "Position",
        type: "select",
        options: TEXT_POSITION_OPTIONS,
      },
    ],
    quality: [
      {
        key: "crf",
        label: "CRF quality",
        type: "number",
        min: 0,
        max: 51,
        step: 1,
      },
    ],
    speedpreset: [
      {
        key: "preset",
        label: "Encoder preset",
        type: "select",
        options: SPEED_PRESET_OPTIONS,
      },
    ],
    volume: [
      {
        key: "volumeDb",
        label: "Gain (dB)",
        type: "number",
        min: -60,
        max: 24,
        step: 0.5,
      },
    ],
    audiopitch: [
      {
        key: "pitch",
        label: "Pitch Scale",
        type: "number",
        min: 0.5,
        max: 2.0,
        step: 0.1,
      },
    ],
    echo: [
      {
        key: "delay",
        label: "Delay (ms)",
        type: "number",
        min: 1,
        max: 2000,
        step: 10,
      },
      {
        key: "decay",
        label: "Decay factor",
        type: "number",
        min: 0.1,
        max: 1.0,
        step: 0.1,
      },
    ],
    tremolo: [
      {
        key: "frequency",
        label: "Frequency",
        type: "number",
        min: 0.1,
        max: 20,
        step: 0.5,
      },
      {
        key: "depth",
        label: "Depth",
        type: "number",
        min: 0.1,
        max: 1,
        step: 0.1,
      },
    ],
    audiofade: [
      {
        key: "fadeIn",
        label: "Fade in (seconds)",
        type: "number",
        min: 0,
        max: 60,
        step: 0.1,
      },
      {
        key: "fadeOut",
        label: "Fade out (seconds)",
        type: "number",
        min: 0,
        max: 60,
        step: 0.1,
      },
    ],
    normalizeaudio: [
      {
        key: "integrated",
        label: "Integrated loudness (LUFS)",
        type: "number",
        min: -36,
        max: -5,
        step: 0.5,
      },
      {
        key: "truePeak",
        label: "True peak (dBTP)",
        type: "number",
        min: -9,
        max: 0,
        step: 0.1,
      },
      {
        key: "loudnessRange",
        label: "Loudness range",
        type: "number",
        min: 1,
        max: 20,
        step: 0.5,
      },
    ],
    samplerate: [
      {
        key: "rate",
        label: "Sample rate",
        type: "select",
        options: SAMPLE_RATE_OPTIONS,
      },
    ],
    channels: [
      {
        key: "channels",
        label: "Channels",
        type: "select",
        options: CHANNEL_OPTIONS,
      },
    ],
    codec: [
      {
        key: "videoCodec",
        label: "Video codec",
        type: "select",
        options: VIDEO_CODEC_OPTIONS,
      },
      {
        key: "audioCodec",
        label: "Audio codec",
        type: "select",
        options: AUDIO_CODEC_OPTIONS,
      },
      {
        key: "pixelFormat",
        label: "Pixel format",
        type: "select",
        options: PIXEL_FORMAT_OPTIONS,
      },
    ],
    deshake: [
      {
        key: "rx",
        label: "Horizontal search",
        type: "number",
        min: 1,
        max: 64,
        step: 1,
      },
      {
        key: "ry",
        label: "Vertical search",
        type: "number",
        min: 1,
        max: 64,
        step: 1,
      },
      {
        key: "edge",
        label: "Frame edges",
        type: "select",
        options: DESHAKE_EDGE_OPTIONS,
      },
      {
        key: "blocksize",
        label: "Block size",
        type: "number",
        min: 4,
        max: 32,
        step: 2,
      },
    ],
    mirror: [
      { key: "horizontal", label: "Horizontal", type: "checkbox" },
      { key: "vertical", label: "Vertical", type: "checkbox" },
    ],
    sepia: [
      {
        key: "intensity",
        label: "Intensity",
        type: "number",
        min: 0,
        max: 1,
        step: 0.05,
      },
    ],
    exposure: [
      {
        key: "exposure",
        label: "Exposure",
        type: "number",
        min: -3,
        max: 3,
        step: 0.1,
      },
      {
        key: "gamma",
        label: "Gamma",
        type: "number",
        min: 0.1,
        max: 3,
        step: 0.05,
      },
    ],
    audiofilter: [
      {
        key: "mode",
        label: "Filter",
        type: "select",
        options: [
          { value: "highpass", label: "High-pass" },
          { value: "lowpass", label: "Low-pass" },
        ],
      },
      {
        key: "frequency",
        label: "Cutoff frequency (Hz)",
        type: "number",
        min: 20,
        max: 20000,
        step: 10,
      },
      {
        key: "order",
        label: "Filter order",
        type: "number",
        min: 1,
        max: 2,
        step: 1,
      },
    ],
    compressor: [
      {
        key: "threshold",
        label: "Threshold",
        type: "number",
        min: 0.001,
        max: 1,
        step: 0.005,
      },
      {
        key: "ratio",
        label: "Ratio",
        type: "number",
        min: 1,
        max: 20,
        step: 0.5,
      },
      {
        key: "attack",
        label: "Attack (ms)",
        type: "number",
        min: 0.01,
        max: 2000,
        step: 1,
      },
      {
        key: "release",
        label: "Release (ms)",
        type: "number",
        min: 0.01,
        max: 9000,
        step: 1,
      },
      {
        key: "makeup",
        label: "Makeup gain",
        type: "number",
        min: 1,
        max: 64,
        step: 0.5,
      },
    ],
    audiobitrate: [
      {
        key: "bitrate",
        label: "Audio bitrate (kb/s)",
        type: "number",
        min: 32,
        max: 512,
        step: 16,
      },
    ],
    keyframes: [
      {
        key: "interval",
        label: "Frames per keyframe",
        type: "number",
        min: 1,
        max: 600,
        step: 1,
      },
    ],
  };

  function getAdditionalSettings(block) {
    const visible = VISIBLE_SETTINGS[block.type] || [];
    return (EXTRA_SETTING_FIELDS[block.type] || []).filter(
      (setting) => !visible.includes(setting.key),
    );
  }

  let presets = [];
  let searchPresets = "";
  let isDeleteMode = false;
  let showSaveField = false;
  let newPresetName = "";

  $: filteredPresets = presets.filter((p) =>
    p.name.toLowerCase().includes(searchPresets.toLowerCase()),
  );

  function loadPresets() {
    const storedPresets = getPreference("ffmpegPresets");
    presets = Array.isArray(storedPresets)
      ? storedPresets.filter(
          (preset) =>
            preset &&
            typeof preset.name === "string" &&
            Array.isArray(preset.blocks),
        )
      : [];
  }

  function savePresets() {
    setPreference("ffmpegPresets", presets);
  }

  function togglePresetSave() {
    if (chainBlocks.length === 0) {
      return;
    }
    showSaveField = !showSaveField;
    newPresetName = "";
  }

  function confirmSavePreset() {
    const name = newPresetName.trim();
    if (!name) return;
    const existingIndex = presets.findIndex((p) => p.name === name);
    const entry = {
      name,
      blocks: chainBlocks.map(({ type, params }) => ({ type, params })),
    };
    if (existingIndex !== -1) {
      presets = [
        ...presets.slice(0, existingIndex),
        entry,
        ...presets.slice(existingIndex + 1),
      ];
    } else {
      presets = [...presets, entry];
    }
    savePresets();
    showSaveField = false;
    newPresetName = "";
  }

  function loadPreset(preset) {
    if (isDeleteMode) {
      deletePreset(preset.name);
      return;
    }
    chainBlocks = preset.blocks
      .filter((block) => block && getBlockDef(block.type))
      .map((block) => ({
        uid: makeUid(block.type),
        type: block.type,
        params: { ...getBlockDef(block.type).defaultParams(), ...block.params },
      }));
    scheduleChainSave();
    expandedUid = null;
    mainTab = "builder";
    setSubView("chain");
  }

  function deletePreset(name) {
    presets = presets.filter((p) => p.name !== name);
    savePresets();
  }

  function toggleDeleteMode() {
    isDeleteMode = !isDeleteMode;
  }

  function getLocalFfmpegPath(assetUrl) {
    const extensionUrl = window.__adobe_cep__?.getSystemPath("extension");
    if (!extensionUrl) return assetUrl;
    const extensionPath = decodeURI(extensionUrl)
      .replace(/^file:\/\//, "")
      .replace(/^\//, "");
    const assetName = path.basename(assetUrl.split("?")[0]);
    return path.join(extensionPath, "assets", assetName);
  }

  function getAvailableOutputPath(dir, baseName, extension) {
    let index = 0;
    let candidate;
    do {
      const suffix = index === 0 ? "" : `_${index}`;
      candidate = path.join(dir, `${baseName}_ffmpeg${suffix}.${extension}`);
      index += 1;
    } while (fs.existsSync(candidate));
    return candidate.replace(/\\/g, "/");
  }

  let outputDirectory = getPreference("ffmpegOutputDirectory") ?? "";
  let showOutputSettings = false;

  function toggleOutputSettings() {
    showOutputSettings = !showOutputSettings;
  }

  function closeOutputSettings() {
    showOutputSettings = false;
  }

  function chooseOutputDirectory() {
    try {
      selectFolder(
        outputDirectory,
        "Choose an export folder",
        (selectedDirectory) => {
          outputDirectory = selectedDirectory;
          setPreference("ffmpegOutputDirectory", outputDirectory);
        },
      );
    } catch (err) {
      window.alert(`Folder selection failed: ${err?.message || String(err)}`);
    }
  }

  let isProcessing = false;

  async function renderChain() {
    isProcessing = true;

    try {
      const layerDataStr = isPremiere
        ? await evalTS("getSelectedClipInfo")
        : await evalES("getSelectedLayerInfo()");
      if (!layerDataStr || layerDataStr === "null") {
        throw new Error(
          isPremiere
            ? "Select exactly one timeline clip first."
            : "Select a layer containing a video source first.",
        );
      }

      const layerInfo = JSON.parse(layerDataStr);
      if (layerInfo.status === "ERROR") {
        throw new Error(
          layerInfo.message || "Could not read the selected clip.",
        );
      }
      const inputPath = layerInfo.sourcePath;
      const duration = isPremiere
        ? layerInfo.duration
        : layerInfo.outPoint - layerInfo.inPoint;

      const sourceDirectory = path.dirname(inputPath);
      const preferredDirectory = outputDirectory;
      const dir =
        preferredDirectory &&
        fs.existsSync(preferredDirectory) &&
        fs.statSync(preferredDirectory).isDirectory()
          ? preferredDirectory
          : sourceDirectory;
      const baseName = path.basename(inputPath, path.extname(inputPath));

      persistChain();

      const { vf, af, extra, preInput, ext } = buildPipeline(chainBlocks, {
        duration,
        fontPath: getLocalFfmpegPath(FFMPEGFont),
      });
      const outExt = ext || path.extname(inputPath).replace(".", "") || "mp4";
      const outputPath = getAvailableOutputPath(dir, baseName, outExt);
      const executablePath = getLocalFfmpegPath(ffmpegPath);
      if (isMac) {
        try {
          fs.chmodSync(executablePath, 0o755);
        } catch (e) {}
      }
      const cropOffset = chainBlocks.reduce(
        (offset, block) => {
          if (block.type === "crop") {
            offset.x += Number(block.params.x) || 0;
            offset.y += Number(block.params.y) || 0;
          }
          return offset;
        },
        { x: 0, y: 0 },
      );

      let args = ["-hide_banner", "-loglevel", "error", "-y"];

      args.push(...preInput);
      if (isPremiere) {
        args.push("-ss", `${layerInfo.inPoint}`, "-t", `${duration}`);
      }
      args.push("-i", inputPath);

      if (vf.length > 0) args.push("-vf", vf.join(","));
      if (af.length > 0) args.push("-af", af.join(","));

      args.push(...extra);
      args.push(outputPath);

      await new Promise((resolve, reject) => {
        execFile(executablePath, args, (error, stdout, stderr) => {
          if (error) {
            reject(new Error(stderr || error.message || String(error)));
          } else {
            resolve();
          }
        });
      });

      let result;
      if (isPremiere) {
        result = await evalTS("addRenderedClipAboveSelected", {
          filePath: outputPath,
          trackType: layerInfo.trackType,
          trackIndex: layerInfo.trackIndex,
          startTime: layerInfo.startTime,
          duration: layerInfo.timelineDuration ?? layerInfo.duration,
        });
      } else {
        const importData = {
          filePath: outputPath,
          layerIndex: layerInfo.layerIndex,
          inPoint: layerInfo.inPoint,
          outPoint: layerInfo.outPoint,
          startTime: layerInfo.inPoint,
          compName: layerInfo.compName,
          positionOffset: cropOffset,
        };

        result = await evalES(
          `importAndPlaceFile(${JSON.stringify(JSON.stringify(importData))})`,
        );
      }

      if (!result || result === "undefined") {
        throw new Error(
          "The host application didn't return a result after importing.",
        );
      }
      const parsedResult = JSON.parse(result);
      if (parsedResult.status === "ERROR") {
        throw new Error(parsedResult.message);
      }
    } catch (err) {
      window.alert(`Render failed: ${err?.message || String(err)}`);
    } finally {
      isProcessing = false;
    }
  }

  onMount(() => {
    loadPresets();
    loadChain();
    if (wrapperEl) {
      const rect = wrapperEl.getBoundingClientRect();
      updateScale(rect.width, rect.height);
    }
    wrapperObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (rafIdScale) cancelAnimationFrame(rafIdScale);
      rafIdScale = requestAnimationFrame(() =>
        updateScale(entry.contentRect.width, entry.contentRect.height),
      );
    });
    if (wrapperEl) wrapperObserver.observe(wrapperEl);
  });

  onDestroy(() => {
    clearTimeout(transTimeout);
    clearTimeout(chainSaveTimeout);
    persistChain();
    if (wrapperObserver) wrapperObserver.disconnect();
    if (rafIdScale) cancelAnimationFrame(rafIdScale);
  });
</script>

<div class="settings-wrapper" bind:this={wrapperEl}>
  <div
    class="wrapper"
    style="transform: translate(-50%, -50%) scale({scaleFactor}); width: {REF_WIDTH}px; height: {REF_HEIGHT}px;"
  >
    <nav class="dashboard-sub-menu">
      <div class="nav-grid">
        <button
          type="button"
          class:eff_active={mainTab === "builder"}
          class:not_eff_active={mainTab !== "builder"}
          on:click={() => setMainTab("builder")}
        >
          <span>Chain Builder</span>
        </button>
        <button
          type="button"
          class:eff_active={mainTab === "presets"}
          class:not_eff_active={mainTab !== "presets"}
          on:click={() => setMainTab("presets")}
        >
          <span>Presets</span>
        </button>
      </div>
    </nav>

    <div class="view-slide" style="--transition-ms: {$TRANSITION_MS ?? 300}ms;">
      {#if mainTab === "builder"}
        <div
          class="slider-wrapper"
          in:fly={{ x: -60, duration: $TRANSITION_MS ?? 300 }}
          out:fly={{ x: -60, duration: $TRANSITION_MS ?? 300 }}
        >
          <div
            class="tab-slide"
            class:hidden={subView !== "chain" && prevSubView !== "chain"}
            class:exit={isTransitioningSub && prevSubView === "chain"}
            class:enter={isTransitioningSub && subView === "chain"}
            class:slide-left-exit={isTransitioningSub &&
              prevSubView === "chain" &&
              directionSub === 1}
            class:slide-right-enter={isTransitioningSub &&
              subView === "chain" &&
              directionSub === -1}
          >
            <div class="panel-view">
              <div class="panel-header">
                <div class="header-title">
                  <h1>Command Chain</h1>
                  <div class="header-actions">
                    {#if showSaveField}
                      <div class="preset-save-row">
                        <input
                          class="search-input"
                          placeholder="Preset name..."
                          bind:value={newPresetName}
                          on:keydown={(e) =>
                            e.key === "Enter" && confirmSavePreset()}
                        />
                        <button
                          class="text-btn"
                          on:click={confirmSavePreset}
                          disabled={!newPresetName.trim()}>Save</button
                        >
                        <button
                          class="text-btn"
                          on:click={() => (showSaveField = false)}
                          >Cancel</button
                        >
                      </div>
                    {:else}
                      <button
                        class="secondary-btn"
                        on:click={togglePresetSave}
                        disabled={chainBlocks.length === 0}
                      >
                        Save as preset
                      </button>
                    {/if}
                    <div class="folder-menu-control">
                      <button
                        type="button"
                        class="icon-btn"
                        aria-expanded={showOutputSettings}
                        on:click={toggleOutputSettings}
                        aria-label="Change export folder"
                        title="Change export folder"
                      >
                        <img src={OpenFolder} alt="" />
                      </button>
                      {#if showOutputSettings}
                        <button
                          type="button"
                          class="folder-menu-overlay"
                          aria-label="Close export folder settings"
                          on:click={closeOutputSettings}
                        ></button>
                        <div
                          class="folder-menu-popup"
                          role="dialog"
                          aria-label="Export folder settings"
                        >
                          <div class="folder-menu-title">Export folder</div>
                          <div class="folder-menu-label">Path</div>
                          <div class="folder-menu-path">
                            {outputDirectory || "Next to the original clip"}
                          </div>
                          <div class="folder-menu-actions">
                            <button
                              type="button"
                              class="text-btn folder-change-btn cancel-btn"
                              on:click={closeOutputSettings}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              class="text-btn folder-change-btn"
                              on:click={chooseOutputDirectory}
                            >
                              Change folder
                            </button>
                          </div>
                        </div>
                      {/if}
                    </div>
                    <button
                      class="icon-btn trash-btn"
                      on:click={clearChain}
                      disabled={chainBlocks.length === 0}
                      title="Clear all blocks"
                    >
                      <img src={Clear} alt="Clear" />
                    </button>
                  </div>
                </div>
                <div class="normal_underline"></div>
                <div class="row-select">
                  <button
                    class="render-btn"
                    on:click={renderChain}
                    disabled={isProcessing || chainBlocks.length === 0}
                  >
                    {isProcessing ? "Rendering..." : "Render"}
                  </button>
                  <button
                    class="add-new-btn"
                    on:click={() => {
                      searchAdd = "";
                      setSubView("add");
                    }}
                  >
                    Add block
                  </button>
                </div>
              </div>

              <div class="chain-area">
                <div class="fx-list">
                  {#if chainBlocks.length === 0}
                    <div class="empty-state">Your chain is empty.</div>
                  {:else}
                    {#each chainBlocks as block (block.uid)}
                      {@const def = getBlockDef(block.type)}
                      <div
                        class="fx-card"
                        class:expanded={expandedUid === block.uid}
                      >
                        <div class="fx-card-head">
                          <button
                            type="button"
                            class="fx-apply-btn"
                            aria-expanded={expandedUid === block.uid}
                            on:click={() => toggleExpand(block.uid)}
                          >
                            <span
                              class="fx-chevron"
                              class:expanded={expandedUid === block.uid}
                              aria-hidden="true"
                            ></span>
                            <span class="fx-copy">
                              <span class="fx-name">{def.label}</span>
                              <span class="fx-sub">{describeBlock(block)}</span>
                            </span>
                          </button>

                          <button
                            type="button"
                            class="remove-btn"
                            on:click={() => removeBlock(block.uid)}
                            title="Remove block"
                            aria-label={`Remove ${def.label}`}
                          >
                            <img src={Delete} alt="Remove" />
                          </button>
                        </div>

                        {#if expandedUid === block.uid}
                          <div class="fx-settings block-params">
                            {#if block.type === "convert"}
                              <div class="fx-field">
                                <label for={`format-${block.uid}`}>Format</label
                                >
                                <select
                                  id={`format-${block.uid}`}
                                  class="native-select"
                                  value={block.params.format}
                                  on:change={(e) =>
                                    updateParam(
                                      block.uid,
                                      "format",
                                      e.target.value,
                                    )}
                                >
                                  {#each FORMAT_OPTIONS as opt}
                                    <option value={opt.value}
                                      >{opt.label}</option
                                    >
                                  {/each}
                                </select>
                              </div>
                            {:else if block.type === "resolution"}
                              <div class="fx-field">
                                <label for={`resmode-${block.uid}`}>Mode</label>
                                <select
                                  id={`resmode-${block.uid}`}
                                  class="native-select"
                                  value={block.params.mode}
                                  on:change={(e) =>
                                    updateParam(
                                      block.uid,
                                      "mode",
                                      e.target.value,
                                    )}
                                >
                                  {#each RESOLUTION_MODE_OPTIONS as opt}
                                    <option value={opt.value}
                                      >{opt.label}</option
                                    >
                                  {/each}
                                </select>
                              </div>
                              {#if block.params.mode === "percent"}
                                <div class="fx-field">
                                  <label for={`percent-${block.uid}`}
                                    >Scale <span class="fx-value"
                                      >{block.params.percent}%</span
                                    ></label
                                  >
                                  <input
                                    class="fx-slider"
                                    id={`percent-${block.uid}`}
                                    type="range"
                                    min="10"
                                    max="200"
                                    step="5"
                                    value={block.params.percent}
                                    on:input={(e) =>
                                      updateParam(
                                        block.uid,
                                        "percent",
                                        Number(e.target.value),
                                      )}
                                  />
                                </div>
                              {:else}
                                <div class="param-grid">
                                  <label class="num-field">
                                    <span>Width</span>
                                    <input
                                      class="num-input"
                                      type="number"
                                      min="16"
                                      value={block.params.width}
                                      on:input={(e) =>
                                        updateParam(
                                          block.uid,
                                          "width",
                                          Number(e.target.value),
                                        )}
                                    />
                                  </label>
                                  <label class="num-field">
                                    <span>Height</span>
                                    <input
                                      class="num-input"
                                      type="number"
                                      min="16"
                                      value={block.params.height}
                                      on:input={(e) =>
                                        updateParam(
                                          block.uid,
                                          "height",
                                          Number(e.target.value),
                                        )}
                                    />
                                  </label>
                                </div>
                              {/if}
                            {:else if block.type === "crop"}
                              <div class="param-grid">
                                <label class="num-field">
                                  <span>Width</span>
                                  <input
                                    class="num-input"
                                    type="number"
                                    min="1"
                                    value={block.params.width}
                                    on:input={(e) =>
                                      updateParam(
                                        block.uid,
                                        "width",
                                        Number(e.target.value),
                                      )}
                                  />
                                </label>
                                <label class="num-field">
                                  <span>Height</span>
                                  <input
                                    class="num-input"
                                    type="number"
                                    min="1"
                                    value={block.params.height}
                                    on:input={(e) =>
                                      updateParam(
                                        block.uid,
                                        "height",
                                        Number(e.target.value),
                                      )}
                                  />
                                </label>
                                <label class="num-field">
                                  <span>X offset</span>
                                  <input
                                    class="num-input"
                                    type="number"
                                    min="0"
                                    value={block.params.x}
                                    on:input={(e) =>
                                      updateParam(
                                        block.uid,
                                        "x",
                                        Number(e.target.value),
                                      )}
                                  />
                                </label>
                                <label class="num-field">
                                  <span>Y offset</span>
                                  <input
                                    class="num-input"
                                    type="number"
                                    min="0"
                                    value={block.params.y}
                                    on:input={(e) =>
                                      updateParam(
                                        block.uid,
                                        "y",
                                        Number(e.target.value),
                                      )}
                                  />
                                </label>
                              </div>
                            {:else if block.type === "rotate"}
                              <div class="fx-field">
                                <label for={`angle-${block.uid}`}>Angle</label>
                                <select
                                  id={`angle-${block.uid}`}
                                  class="native-select"
                                  value={block.params.angle}
                                  on:change={(e) =>
                                    updateParam(
                                      block.uid,
                                      "angle",
                                      e.target.value,
                                    )}
                                >
                                  {#each ROTATE_OPTIONS as opt}
                                    <option value={opt.value}
                                      >{opt.label}</option
                                    >
                                  {/each}
                                </select>
                              </div>
                              <label class="fx-check-row">
                                <span
                                  class="checkbox"
                                  class:checked={block.params.flipH}
                                >
                                  <input
                                    type="checkbox"
                                    checked={block.params.flipH}
                                    on:change={(e) =>
                                      updateParam(
                                        block.uid,
                                        "flipH",
                                        e.target.checked,
                                      )}
                                  />
                                </span>
                                <span class="label-text">Flip horizontal</span>
                              </label>
                              <label class="fx-check-row">
                                <span
                                  class="checkbox"
                                  class:checked={block.params.flipV}
                                >
                                  <input
                                    type="checkbox"
                                    checked={block.params.flipV}
                                    on:change={(e) =>
                                      updateParam(
                                        block.uid,
                                        "flipV",
                                        e.target.checked,
                                      )}
                                  />
                                </span>
                                <span class="label-text">Flip vertical</span>
                              </label>
                            {:else if block.type === "fps"}
                              <div class="fx-field">
                                <label for={`fps-${block.uid}`}
                                  >Frame rate <span class="fx-value"
                                    >{block.params.fps} fps</span
                                  ></label
                                >
                                <input
                                  class="fx-slider"
                                  id={`fps-${block.uid}`}
                                  type="range"
                                  min="1"
                                  max="120"
                                  step="1"
                                  value={block.params.fps}
                                  on:input={(e) =>
                                    updateParam(
                                      block.uid,
                                      "fps",
                                      Number(e.target.value),
                                    )}
                                />
                              </div>
                            {:else if block.type === "speed"}
                              <div class="fx-field">
                                <label for={`speed-${block.uid}`}
                                  >Speed <span class="fx-value"
                                    >x{block.params.speed}</span
                                  ></label
                                >
                                <input
                                  class="fx-slider"
                                  id={`speed-${block.uid}`}
                                  type="range"
                                  min="0.1"
                                  max="8"
                                  step="0.05"
                                  value={block.params.speed}
                                  on:input={(e) =>
                                    updateParam(
                                      block.uid,
                                      "speed",
                                      Number(e.target.value),
                                    )}
                                />
                              </div>
                            {:else if block.type === "color"}
                              <div class="fx-field">
                                <label for={`contrast-${block.uid}`}
                                  >Contrast <span class="fx-value"
                                    >{block.params.contrast}</span
                                  ></label
                                >
                                <input
                                  class="fx-slider"
                                  id={`contrast-${block.uid}`}
                                  type="range"
                                  min="0"
                                  max="3"
                                  step="0.05"
                                  value={block.params.contrast}
                                  on:input={(e) =>
                                    updateParam(
                                      block.uid,
                                      "contrast",
                                      Number(e.target.value),
                                    )}
                                />
                              </div>
                              <div class="fx-field">
                                <label for={`brightness-${block.uid}`}
                                  >Brightness <span class="fx-value"
                                    >{block.params.brightness}</span
                                  ></label
                                >
                                <input
                                  class="fx-slider"
                                  id={`brightness-${block.uid}`}
                                  type="range"
                                  min="-1"
                                  max="1"
                                  step="0.02"
                                  value={block.params.brightness}
                                  on:input={(e) =>
                                    updateParam(
                                      block.uid,
                                      "brightness",
                                      Number(e.target.value),
                                    )}
                                />
                              </div>
                              <div class="fx-field">
                                <label for={`saturation-${block.uid}`}
                                  >Saturation <span class="fx-value"
                                    >{block.params.saturation}</span
                                  ></label
                                >
                                <input
                                  class="fx-slider"
                                  id={`saturation-${block.uid}`}
                                  type="range"
                                  min="0"
                                  max="3"
                                  step="0.05"
                                  value={block.params.saturation}
                                  on:input={(e) =>
                                    updateParam(
                                      block.uid,
                                      "saturation",
                                      Number(e.target.value),
                                    )}
                                />
                              </div>
                            {:else if block.type === "sharpen"}
                              <div class="fx-field">
                                <label for={`sharpen-${block.uid}`}
                                  >Amount <span class="fx-value"
                                    >{block.params.amount}</span
                                  ></label
                                >
                                <input
                                  class="fx-slider"
                                  id={`sharpen-${block.uid}`}
                                  type="range"
                                  min="-2"
                                  max="2"
                                  step="0.05"
                                  value={block.params.amount}
                                  on:input={(e) =>
                                    updateParam(
                                      block.uid,
                                      "amount",
                                      Number(e.target.value),
                                    )}
                                />
                              </div>
                            {:else if block.type === "bitrate"}
                              <div class="fx-field">
                                <label for={`bitrate-${block.uid}`}
                                  >Bitrate <span class="fx-value"
                                    >{block.params.bitrate}k</span
                                  ></label
                                >
                                <input
                                  class="fx-slider"
                                  id={`bitrate-${block.uid}`}
                                  type="range"
                                  min="500"
                                  max="50000"
                                  step="500"
                                  value={block.params.bitrate}
                                  on:input={(e) =>
                                    updateParam(
                                      block.uid,
                                      "bitrate",
                                      Number(e.target.value),
                                    )}
                                />
                              </div>
                            {:else if block.type === "audio"}
                              <div class="fx-field">
                                <label for={`audiomode-${block.uid}`}
                                  >Mode</label
                                >
                                <select
                                  id={`audiomode-${block.uid}`}
                                  class="native-select"
                                  value={block.params.mode}
                                  on:change={(e) =>
                                    updateParam(
                                      block.uid,
                                      "mode",
                                      e.target.value,
                                    )}
                                >
                                  {#each AUDIO_MODE_OPTIONS as opt}
                                    <option value={opt.value}
                                      >{opt.label}</option
                                    >
                                  {/each}
                                </select>
                              </div>
                            {/if}
                            {#each getAdditionalSettings(block) as setting}
                              {#if setting.type === "select"}
                                <div class="fx-field">
                                  <label for={`${setting.key}-${block.uid}`}
                                    >{setting.label}</label
                                  >
                                  <select
                                    id={`${setting.key}-${block.uid}`}
                                    class="native-select"
                                    value={block.params[setting.key]}
                                    on:change={(e) =>
                                      updateParam(
                                        block.uid,
                                        setting.key,
                                        e.target.value,
                                      )}
                                  >
                                    {#each setting.options as option}
                                      <option value={option.value}
                                        >{option.label}</option
                                      >
                                    {/each}
                                  </select>
                                </div>
                              {:else if setting.type === "checkbox"}
                                <label class="fx-check-row">
                                  <span
                                    class="checkbox"
                                    class:checked={block.params[setting.key]}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={block.params[setting.key]}
                                      on:change={(e) =>
                                        updateParam(
                                          block.uid,
                                          setting.key,
                                          e.target.checked,
                                        )}
                                    />
                                  </span>
                                  <span class="label-text">{setting.label}</span
                                  >
                                </label>
                              {:else}
                                <label class="num-field">
                                  <span>{setting.label}</span>
                                  <input
                                    class="num-input"
                                    type={setting.type}
                                    min={setting.min}
                                    max={setting.max}
                                    step={setting.step}
                                    value={block.params[setting.key]}
                                    on:input={(e) =>
                                      updateParam(
                                        block.uid,
                                        setting.key,
                                        setting.type === "number"
                                          ? Number(e.target.value)
                                          : e.target.value,
                                      )}
                                  />
                                </label>
                              {/if}
                            {/each}
                          </div>
                        {/if}
                      </div>
                    {/each}
                  {/if}
                </div>
              </div>
            </div>
          </div>

          <div
            class="tab-slide"
            class:hidden={subView !== "add" && prevSubView !== "add"}
            class:exit={isTransitioningSub && prevSubView === "add"}
            class:enter={isTransitioningSub && subView === "add"}
            class:slide-right-exit={isTransitioningSub &&
              prevSubView === "add" &&
              directionSub === -1}
            class:slide-left-enter={isTransitioningSub &&
              subView === "add" &&
              directionSub === 1}
          >
            <div class="panel-view">
              <div class="panel-header">
                <div class="header-title">
                  <h1>Add Block</h1>
                  <button class="back-btn" on:click={() => setSubView("chain")}
                    >Cancel</button
                  >
                </div>
                <div class="normal_underline"></div>
                <input
                  class="search-input massive-search"
                  bind:value={searchAdd}
                  placeholder="Search for a block..."
                />
              </div>

              <div class="scroll-area">
                {#each Object.entries(groupedBlockDefs) as [category, defs]}
                  <div class="cat-header">
                    <h4>{category}</h4>
                    <div class="cat-underline"></div>
                  </div>
                  <div class="items-grid">
                    {#each defs as def}
                      <button
                        class="item-btn"
                        on:click={() => addBlockToChain(def.id)}
                        title={def.description}
                      >
                        <span class="btn-text">{def.label}</span>
                      </button>
                    {/each}
                  </div>
                {/each}
                {#if filteredBlockDefs.length === 0}
                  <div class="empty-state">No blocks found.</div>
                {/if}
              </div>
            </div>
          </div>
        </div>
      {:else}
        <div
          class="panel-view"
          in:fly={{ x: 60, duration: $TRANSITION_MS ?? 300 }}
          out:fly={{ x: 60, duration: $TRANSITION_MS ?? 300 }}
        >
          <div class="panel-header">
            <div class="header-title">
              <h1>Your Presets</h1>
              <button
                class="icon-btn trash-btn"
                class:active={isDeleteMode}
                on:click={toggleDeleteMode}
                title="Toggle Delete Mode"
              >
                <img src={Delete} alt="Delete" decoding="async" />
              </button>
            </div>
            <div class="normal_underline"></div>
            <div class="row-select">
              <input
                class="search-input"
                bind:value={searchPresets}
                placeholder="Search your presets..."
              />
            </div>
          </div>

          {#if isDeleteMode}
            <div class="delete-warning">Delete mode is active</div>
          {/if}

          <div class="scroll-area">
            {#if filteredPresets.length === 0}
              <div class="empty-state">
                {presets.length === 0
                  ? "No presets saved yet. Build a chain and save it as a preset."
                  : "No matches found."}
              </div>
            {:else}
              <div class="items-grid presets-grid">
                {#each filteredPresets as preset}
                  <button
                    class="item-btn preset-btn"
                    class:delete-mode={isDeleteMode}
                    on:click={() => loadPreset(preset)}
                  >
                    <span class="btn-text-col">
                      <span class="btn-text">{preset.name}</span>
                      <span class="btn-subtext"
                        >{preset.blocks.length} block{preset.blocks.length > 1
                          ? "s"
                          : ""}</span
                      >
                    </span>
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style lang="scss">
  * {
    box-sizing: border-box;
  }

  .settings-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .wrapper {
    position: absolute;
    top: 50%;
    left: 50%;
    transform-origin: center center;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    font-family: "Museo Sans", sans-serif;
    overflow: hidden;
  }

  .dashboard-sub-menu {
    width: 100%;
    height: 30px;
    background-color: rgb(37, 37, 37);
    border: 1px solid rgb(65, 65, 65);
    border-radius: 4px;
    flex-shrink: 0;
    margin-bottom: 8px;
    .nav-grid {
      width: calc(100% - 4px);
      height: 100%;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 4px;
      margin: 0 2px;
    }
    button {
      appearance: none;
      border: none;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      border-radius: 3px;
      font-weight: 700;
      margin: 1px 0;
      color: #fff;
      cursor: pointer;
      transition: all 0.1s ease;
      min-width: 0;
      span {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }

  .eff_active {
    background-color: #191919 !important;
    border-top: 2px solid var(--activeColour) !important;
  }
  .not_eff_active {
    background-color: #191919 !important;
    border-top: 2px solid transparent !important;
  }

  .icon-btn {
    background: transparent;
    border: none;
    outline: none;
    appearance: none;
    width: 22px;
    height: 22px;
    flex-shrink: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: transform 0.2s ease;
    padding: 0;
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
      pointer-events: none;
      background: transparent;
      filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.4));
    }
    &:hover {
      transform: scale(1.1);
    }
  }

  .trash-btn.active img {
    filter: brightness(0) saturate(100%) invert(27%) sepia(93%) saturate(1900%)
      hue-rotate(340deg) brightness(95%) contrast(101%);
  }
  .trash-btn.active {
    animation: shake-horizontal-alternate 2s infinite;
  }

  @keyframes shake-horizontal-alternate {
    0%,
    60%,
    100% {
      transform: translateX(0);
    }
    63%,
    69%,
    75%,
    81%,
    87%,
    93% {
      transform: translateX(-2px);
    }
    66%,
    72%,
    78%,
    84%,
    90%,
    96% {
      transform: translateX(2px);
    }
  }
  .view-slide {
    position: relative;
    width: 100%;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
  .slider-wrapper {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    will-change: transform, opacity;
    backface-visibility: hidden;
    transform: translateZ(0);
  }

  .tab-slide {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
    will-change: transform, opacity;
    backface-visibility: hidden;
    &.hidden {
      display: none;
    }
    &.exit {
      z-index: 1;
      pointer-events: none;
    }
    &.enter {
      z-index: 2;
    }
  }

  .slide-left-enter {
    animation: slideInFromRight var(--transition-ms, 250ms)
      cubic-bezier(0.25, 1, 0.5, 1) forwards;
  }
  .slide-left-exit {
    animation: slideOutToLeft var(--transition-ms, 250ms)
      cubic-bezier(0.25, 1, 0.5, 1) forwards;
  }
  .slide-right-enter {
    animation: slideInFromLeft var(--transition-ms, 250ms)
      cubic-bezier(0.25, 1, 0.5, 1) forwards;
  }
  .slide-right-exit {
    animation: slideOutToRight var(--transition-ms, 250ms)
      cubic-bezier(0.25, 1, 0.5, 1) forwards;
  }

  @keyframes slideInFromRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  @keyframes slideOutToLeft {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(-100%);
      opacity: 0;
    }
  }
  @keyframes slideInFromLeft {
    from {
      transform: translateX(-100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  @keyframes slideOutToRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }

  .panel-view {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 0 4px;
    box-sizing: border-box;
    position: absolute;
    inset: 0;
    min-height: 0;
    overflow: hidden;
    will-change: transform, opacity;
    backface-visibility: hidden;
    transform: translateZ(0);
  }

  h1 {
    font-size: 3.5vh;
    margin: 0;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }

  .panel-header {
    flex-shrink: 0;
    margin-bottom: 6px;
    .header-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-left: 5%;
      margin-right: 5%;
      min-height: 40px;
      min-width: 0;
      gap: 1vh;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }
    .folder-menu-control {
      position: relative;
      z-index: 202;
    }
    .header-actions .secondary-btn {
      width: auto;
      height: 28px;
      padding: 0 8px;
      font-size: 11px;
      white-space: nowrap;
    }
    .header-actions .preset-save-row {
      width: auto;
      min-width: 0;
      gap: 4px;
    }
    .header-actions .search-input {
      width: 120px;
      flex: 1 1 90px;
    }
    .header-actions .text-btn {
      padding: 4px 7px;
      font-size: 11px;
    }
    h1 {
      font-size: 4vh;
      margin: 0;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }
    .normal_underline {
      height: 0.6vh;
      width: 90%;
      background-color: var(--activeColour);
      border-radius: 0.5vh;
      margin: 0 auto 1.35vh auto;
      box-shadow: 0 0 10px var(--activeColour);
    }
  }

  .folder-menu-overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
    padding: 0;
    border: 0;
    background: rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(1px);
    cursor: default;
  }

  .folder-menu-popup {
    position: absolute;
    top: calc(100% + 5px);
    right: 0;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: clamp(170px, 55vw, 240px);
    max-width: calc(100vw - 16px);
    padding: 8px;
    box-sizing: border-box;
    color: #fff;
    background: #151515;
    border: 1px solid #444;
    border-radius: 5px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
  }

  .folder-menu-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
  }

  .cancel-btn {
    background: #333;
    border: 1px solid #555;
    color: red;
    padding: 4px 10px;
    border-radius: 4px;
    font-size: clamp(0.8rem, 1.5vh, 1.3rem);
    font-weight: 700;
    cursor: pointer;
    transition: 0.2s;
    flex-shrink: 0;
    &:hover {
      background: var(--activeColour);
      border-color: var(--activeColour);
    }
  }

  .folder-menu-title {
    padding-bottom: 4px;
    border-bottom: 1px solid #2a2a2a;
    font-size: 10px;
    font-weight: 700;
  }

  .folder-menu-label {
    color: #aaa;
    font-size: 9px;
    font-weight: 600;
  }

  .folder-menu-path {
    max-height: 72px;
    overflow: auto;
    color: #ddd;
    font-size: 10px;
    overflow-wrap: anywhere;
  }

  .folder-change-btn {
    align-self: flex-end;
    padding: 4px 7px;
    font-size: 11px;
  }

  .row-select {
    display: flex;
    align-items: center;
    grid-template-columns: 1fr auto;
    gap: 0;
    gap: 6px;
    width: 90%;
    margin: 1vh auto 0 auto;
    box-sizing: border-box;
    min-width: 0;
  }
  .search-input {
    flex: 1;
    min-width: 0;
    height: 28px;
    padding: 0 10px;
    font-size: 11px;
    color: white;
    background-color: #131313;
    border: 1px solid rgb(65, 65, 65);
    outline: none;
    border-radius: 4px;
    box-sizing: border-box;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
    transition:
      background-color 65ms,
      border-color 0.2s;
    &:focus {
      border-color: var(--activeColour);
      box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.3);
    }
    &.massive-search {
      display: block;
      width: 90%;
      margin: 2vh auto;
    }
  }

  .add-new-btn {
    width: 100%;
    flex: 1;
    min-width: 0;
    height: 25px;
    padding: 0 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
    font-size: 11px;
    font-weight: bold;
    color: white;
    background-color: #191919;
    border: 0.5px solid rgba(255, 255, 255, 0.3);
    border-radius: 4px;
    box-sizing: border-box;
    cursor: pointer;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
    transition: all 0.15s ease;
    &:hover {
      background-color: var(--activeColour);
      border-style: solid;
      border-color: var(--activeColour);
    }
  }

  .back-btn {
    background: #333;
    border: 1px solid #555;
    color: white;
    padding: 4px 10px;
    border-radius: 4px;
    margin-bottom: 5px;
    font-size: clamp(0.8rem, 1.5vh, 1.3rem);
    font-weight: 700;
    cursor: pointer;
    transition: 0.2s;
    flex-shrink: 0;
    &:hover {
      background: var(--activeColour);
      border-color: var(--activeColour);
    }
  }

  .text-btn {
    background: transparent;
    border: 1px solid #444;
    color: #ccc;
    padding: 4px 10px;
    font-size: 2.3vh;
    font-weight: 700;
    border-radius: 4px;
    cursor: pointer;
    flex-shrink: 0;
    transition: 0.15s ease;
    &:hover:not(:disabled) {
      border-color: var(--activeColour);
      color: #fff;
    }
    &:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }
  }

  .secondary-btn {
    width: 100%;
    height: 32px;
    background: transparent;
    border: 1px solid #555;
    color: #ccc;
    border-radius: 4px;
    font-size: 2.3vh;
    font-weight: 700;
    cursor: pointer;
    transition: 0.15s ease;
    flex-shrink: 0;
    &:hover:not(:disabled) {
      border-color: var(--activeColour);
      color: #fff;
      border-style: solid;
    }
    &:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }
  }

  .preset-save-row {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
  }

  .render-btn {
    width: 100%;
    flex: 1;
    min-width: 0;
    height: 25px;
    padding: 0 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
    font-size: 11px;
    font-weight: bold;
    color: white;
    background-color: var(--activeColour);
    border: 0.5px solid rgba(255, 255, 255, 0.3);
    border-radius: 4px;
    box-sizing: border-box;
    cursor: pointer;
    text-shadow: 3px 2px 5px rgba(0, 0, 0, 1);
    transition: all 0.15s ease;
    &:hover:not(:disabled) {
      background-color: #191919;
      border-style: solid;
    }
    &:disabled {
      background: #555;
      cursor: not-allowed;
      box-shadow: none;
    }
  }

  .scroll-area {
    flex: 1;
    min-height: 0;
    width: 90%;
    margin-left: 5%;
    overflow-x: hidden;
    overflow-y: auto;
    padding-bottom: 16px;
    padding-right: 5px;
    box-sizing: border-box;
    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-track {
      background: rgb(37, 37, 37);
      border-radius: 3px;
    }
    &::-webkit-scrollbar-thumb {
      background: var(--activeColour);
      border-radius: 3px;
    }
  }

  .cat-header {
    margin-top: 0.5vh;
    margin-bottom: 1.5vh;
    min-width: 0;
    h4 {
      margin: 0;
      font-size: 3vh;
      color: #c1c1c1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .cat-underline {
      height: 2px;
      width: 100%;
      background-color: #504f4f;
      margin-top: 5px;
    }
  }

  .items-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 1.5vh 8px;
    margin-bottom: 15px;
  }

  .item-btn {
    width: 100%;
    min-height: 6.5vh;
    margin: 0;
    padding: 0;
    color: white;
    background-color: #191919;
    border-radius: 1.6vh;
    border: 0.1vh solid rgba(94, 94, 94, 0.315);
    outline: none;
    cursor: pointer;
    overflow: hidden;
    transition:
      transform 125ms,
      background-color 150ms,
      border-color 150ms;
    box-sizing: border-box;
    border: 1px solid #444;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 1.3vh 1.7vh;
    gap: 1.2vh;
    min-width: 0;
    .btn-text {
      flex: 1;
      min-width: 0;
      font-size: 3.2vh;
      font-weight: 700;
      text-align: left;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .btn-text-col {
      display: flex;
      flex-direction: column;
      min-width: 0;
      flex: 1;
      gap: 0.2vh;
    }
    .btn-subtext {
      font-size: 1.6vh;
      color: #888;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    &:hover {
      background-color: #222;
      transform: translateY(-1.02px);
      border-color: var(--activeColour);
    }
    &:active {
      transform: translateY(1px);
    }
    &.delete-mode:hover {
      background-color: #fe0000;
      color: #fff;
    }
  }

  .preset-btn {
    min-height: 42px;
    padding: 4px 10px;
    gap: 8px;
    justify-content: center;
    text-align: center;
    background: #191919;
    border: 2px solid #383838;
    border-radius: 5px;
    transition:
      border-color 0.15s ease,
      background-color 0.15s ease;
    .btn-text-col {
      align-items: center;
      gap: 2px;
    }
    .btn-text {
      width: 100%;
      font-size: 14px;
      color: #fff;
      text-align: center;
    }
    .btn-subtext {
      width: 100%;
      font-size: 11px;
      color: #b0b0b0;
      text-align: center;
    }
    &:hover {
      background-color: #1d1d1d;
      border-color: var(--activeColour);
      transform: none;
    }
    &:active {
      transform: none;
    }
    &.delete-mode:hover {
      background-color: rgba(254, 0, 0, 0.2);
      border-color: #fe0000;
    }
  }

  .presets-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  @media (max-width: 360px) {
    .presets-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 6px;
    }

    .preset-btn {
      min-height: 40px;
      padding: 4px 6px;
      .btn-text {
        font-size: 12px;
      }
      .btn-subtext {
        font-size: 10px;
      }
    }
  }

  @media (max-width: 240px) {
    .presets-grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .empty-state {
    text-align: center;
    color: #777;
    margin-top: 5vh;
    font-size: 3vh;
    font-style: italic;
  }

  .chain-area {
    display: flex;
    flex-direction: column;
    width: 90%;
    margin: 0.5vh auto 1vh auto;
    flex: 1;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
  }

  .fx-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 0.6vh;
    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-track {
      background: rgb(37, 37, 37);
      border-radius: 3px;
    }
    &::-webkit-scrollbar-thumb {
      background: var(--activeColour);
      border-radius: 3px;
    }
  }

  .fx-card {
    background: #191919;
    border: 2px solid #383838;
    border-radius: 5px;
    overflow: hidden;
    min-width: 0;
    flex-shrink: 0;
    transition:
      border-color 0.15s ease,
      background-color 0.15s ease;
    &:hover {
      border-color: #666;
    }
    &.expanded {
      border-color: var(--activeColour);
      background-color: #1d1d1d;
    }
  }

  .fx-card-head {
    display: flex;
    align-items: center;
    min-width: 0;
    min-height: 42px;
    padding: 2px 5px 2px 8px;
    gap: 8px;
  }

  .fx-apply-btn {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 4px 0;
    background: transparent;
    border: none;
    text-align: left;
    cursor: pointer;
    overflow: hidden;
    &:focus-visible {
      outline: 1px solid var(--activeColour);
      outline-offset: 2px;
    }
  }

  .fx-copy {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  .fx-chevron {
    width: 8px;
    height: 8px;
    flex-shrink: 0;
    margin: 0 3px 4px 0;
    border-right: 2px solid #b0b0b0;
    border-bottom: 2px solid #b0b0b0;
    transform: rotate(45deg);
    transition: transform 0.15s ease;
    &.expanded {
      margin-bottom: 0;
      transform: rotate(225deg);
    }
  }

  .fx-name {
    display: block;
    width: 100%;
    font-size: 11px;
    font-weight: 700;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .fx-sub {
    display: block;
    width: 100%;
    font-size: 9px;
    color: #b0b0b0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .remove-btn {
    width: 30px;
    height: 30px;
    flex-shrink: 0;
    display: grid;
    place-items: center;
    padding: 6px;
    background: transparent;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s ease;
    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    &:hover {
      transform: scale(1.1);
    }
    &:active {
      transform: scale(0.95);
    }
    &:focus-visible {
      outline: 1px solid #fe4d4d;
      outline-offset: 2px;
    }
  }

  .block-params {
    padding: 12px;
    border-top: 2px solid #383838;
  }

  .fx-settings {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
    gap: 12px;
    min-width: 0;
  }

  .fx-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    position: relative;
    min-width: 0;
    label:not(.fx-check-row) {
      font-size: 10px;
      font-weight: 700;
      color: #ccc;
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 1vh;
      min-width: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .fx-value {
      font-size: 12px;
      color: var(--activeColour);
      font-weight: 800;
      flex-shrink: 0;
    }
  }

  .param-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
    grid-column: 1 / -1;
    gap: 10px;
  }

  .num-field {
    display: flex;
    flex-direction: column;
    gap: 0.5vh;
    min-width: 0;
    span {
      font-size: 11px;
      color: #999;
      font-weight: 700;
    }
  }

  .num-input {
    width: 100%;
    height: 30px;
    min-height: 30px;
    padding: 0 8px;
    background-color: #131313;
    border: 1px solid rgb(65, 65, 65);
    color: #fff;
    border-radius: 4px;
    font-size: 12px;
    box-sizing: border-box;
    outline: none;
    &:focus {
      border-color: var(--activeColour);
    }
    &::-webkit-inner-spin-button {
      width: 18px;
      height: 26px;
      margin: 1px -6px 1px 4px;
      opacity: 1;
      background-color: #242424;
      border-left: 1px solid #414141;
      border-radius: 0 3px 3px 0;
      cursor: pointer;
      filter: invert(0.72);
      &:hover {
        background-color: #383838;
      }
      &:active {
        background-color: var(--activeColour);
      }
    }
  }

  .fx-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 7px;
    border-radius: 2.5px;
    outline: none;
    cursor: pointer;
    border: 1px solid #000;
    display: block;
    background: var(--activeColour);
    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 6px;
      height: 9px;
      border-radius: 2px;
      background: #fff;
      border: 1px solid #000;
      box-shadow: 0 0 2px rgba(0, 0, 0, 0.6);
      cursor: pointer;
      margin-top: -2px;
    }
    &::-moz-range-thumb {
      width: 5px;
      height: 8px;
      border-radius: 2px;
      background: #fff;
      border: 1px solid #000;
      cursor: pointer;
    }
  }

  .fx-check-row {
    display: flex !important;
    align-items: center;
    justify-content: flex-start !important;
    gap: 0.8vh;
    cursor: pointer;
    width: 100%;
    min-width: 0;
    grid-column: span 1;
    .label-text {
      font-size: 12px;
      font-weight: 600;
      min-width: 0;
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .checkbox {
    position: relative;
    width: 12px;
    height: 12px;
    border-radius: 2px;
    border: 1px solid #5c5c5c;
    background-color: #0d0d0d;
    flex-shrink: 0;
    transition:
      background-color 0.1s ease,
      border-color 0.1s ease;
    input {
      position: absolute;
      inset: 0;
      opacity: 0;
      margin: 0;
      cursor: pointer;
    }
    &.checked {
      background-color: var(--activeColour, #ff007f);
      border-color: var(--activeColour, #ff007f);
    }
  }

  .native-select {
    width: 100%;
    height: 28px;
    min-height: 28px;
    padding: 0 8px;
    background-color: #131313;
    border: 1px solid rgb(58, 58, 58);
    border-radius: 4px;
    color: #ecf0f1;
    font-size: 12px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    box-sizing: border-box;
    outline: none;
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    background-image:
      linear-gradient(45deg, transparent 50%, #999 50%),
      linear-gradient(135deg, #999 50%, transparent 50%);
    background-position:
      calc(100% - 12px) 55%,
      calc(100% - 7px) 55%;
    background-size:
      5px 5px,
      5px 5px;
    background-repeat: no-repeat;
    transition: border-color 150ms ease;
    min-width: 0;
    &:hover {
      border-color: #777;
    }
    &:focus {
      border-color: var(--activeColour);
    }

    option {
      background-color: #191919;
      color: #ecf0f1;
      font-size: 12px;
    }
  }

  .delete-warning {
    color: #ff2a75;
    font-size: 3vh;
    font-weight: 800;
    margin-bottom: 2vh;
    text-align: center;
    animation: flicker 2s ease infinite;
  }

  @keyframes flicker {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
    100% {
      opacity: 1;
    }
  }
</style>
