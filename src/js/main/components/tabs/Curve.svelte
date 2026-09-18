<script>
  import { fs, os, path } from "../../../lib/cep/node";
  import {
    zoomLevel,
    CurvesTab,
    TRANSITION_MS,
    Hue,
    Saturation,
    EnableRGBMode,
    activeTab,
  } from "../../stores.js";
  import { evalTS } from "../../../lib/utils/bolt";
  import { onMount, onDestroy } from "svelte";
  import { fly, scale } from "svelte/transition";
  import {
    getPreference,
    setPreference,
    copyTheCurve,
    pasteTheCurve,
  } from "../../../lib/utils/main.js";
  import Close from "../../../assets/ui/Close.png";
  import Add from "../../../assets/ui/Add.png";
  import { sendNotif } from "../../logic.js";

  let presetsData = [];
  let activeView = "list";
  let prevView = null;
  let direction = 1;
  let isTransitioning = false;
  let transitionTimeout = null;

  let isToolbarOpen = getPreference("isCurveToolbarOpen");
  let showCopyPasteButtons = getPreference("showCurveCopyPaste");

  // Variables pour éviter le bug des "||" dans le HTML
  $: durIn = $TRANSITION_MS ? $TRANSITION_MS : 300;
  $: durOut = $TRANSITION_MS ? $TRANSITION_MS : 200;

  $: if (isToolbarOpen !== getPreference("isCurveToolbarOpen")) {
    setPreference("isCurveToolbarOpen", isToolbarOpen);
  }

  $: if (showCopyPasteButtons !== getPreference("showCurveCopyPaste")) {
    setPreference("showCurveCopyPaste", showCopyPasteButtons);
  }

  $: {
    $Hue;
    $Saturation;
    for (let i = 0; i < redrawTriggers.length; i++) {
      redrawTriggers[i]();
    }
  }

  $: if ($activeTab === "curves") {
    setTimeout(function () {
      for (let i = 0; i < redrawTriggers.length; i++) {
        redrawTriggers[i]();
      }
    }, 50);
  }

  $: if ($Hue !== undefined || $Saturation !== undefined || $EnableRGBMode !== undefined) {
    for (let i = 0; i < redrawTriggers.length; i++) {
      redrawTriggers[i]();
    }
  }

  let editingId = null;
  let setNewX1 = 0.5;
  let setNewY1 = 0;
  let setNewX2 = 0.5;
  let setNewY2 = 1;
  let curveValText = "0.50, 0.00, 0.50, 1.00";

  let L_setNewX1 = 0.2;
  let L_setNewY1 = 0.8;
  let L_setNewX2 = 0.8;
  let L_setNewY2 = 0.2;
  let curveValLiveText = "0.20, 0.80, 0.80, 0.20";

  let copiedBezierDisplay = "";

  const ZOOM_MIN = 30;
  const ZOOM_MAX = 90;
  const ZOOM_STEP = 5;

  function zoomIn() {
    let newZoom = $zoomLevel + ZOOM_STEP;
    if (newZoom > ZOOM_MAX) {
      $zoomLevel = ZOOM_MAX;
    } else {
      $zoomLevel = newZoom;
    }
  }

  function zoomOut() {
    let newZoom = $zoomLevel - ZOOM_STEP;
    if (newZoom < ZOOM_MIN) {
      $zoomLevel = ZOOM_MIN;
    } else {
      $zoomLevel = newZoom;
    }
  }

  let wrapperEl;
  let tabViewEl;
  let scaleFactor = 1;

  const REF_WIDTH = 415;
  const REF_HEIGHT = 360;

  let wrapperObserver;
  let contentObserver;
  let rafIdScale = null;
  let naturalHeight = REF_HEIGHT;
  let availW = REF_WIDTH;
  let availH = REF_HEIGHT;
  let lastKnownActiveColor = "";
  let colorPollInterval = null;

  function updateScale() {
    if (!availW || !availH) {
      return;
    }

    let scaleW = availW / REF_WIDTH;
    let scaleH = availH / naturalHeight;

    if (scaleW < scaleH) {
      scaleFactor = scaleW;
    } else {
      scaleFactor = scaleH;
    }
  }

  function scheduleUpdate() {
    if (rafIdScale) {
      cancelAnimationFrame(rafIdScale);
    }
    rafIdScale = requestAnimationFrame(updateScale);
  }

  function pollActiveColorChange() {
    let currentColor = getDynamicActiveColor();
    if (currentColor && currentColor !== lastKnownActiveColor) {
      lastKnownActiveColor = currentColor;
      for (let i = 0; i < redrawTriggers.length; i++) {
        redrawTriggers[i]();
      }
    }
  }

  let redrawTriggers = [];

  function registerRedraw(fn) {
    redrawTriggers.push(fn);
    return function () {
      let newTriggers = [];
      for (let i = 0; i < redrawTriggers.length; i++) {
        if (redrawTriggers[i] !== fn) {
          newTriggers.push(redrawTriggers[i]);
        }
      }
      redrawTriggers = newTriggers;
    };
  }

  onMount(function () {
    if (wrapperEl) {
      let rect = wrapperEl.getBoundingClientRect();
      if (rect.width > 0) availW = rect.width;
      if (rect.height > 0) availH = rect.height;
    }

    if (tabViewEl) {
      let rect = tabViewEl.getBoundingClientRect();
      if (rect.height > 0) naturalHeight = rect.height;
    }

    updateScale();

    wrapperObserver = new ResizeObserver(function (entries) {
      let entry = entries[0];
      if (entry.borderBoxSize && entry.borderBoxSize.length > 0) {
        availW = entry.borderBoxSize[0].inlineSize;
        availH = entry.borderBoxSize[0].blockSize;
      } else {
        availW = entry.contentRect.width;
        availH = entry.contentRect.height;
      }
      scheduleUpdate();
    });

    contentObserver = new ResizeObserver(function (entries) {
      let entry = entries[0];
      if (entry.borderBoxSize && entry.borderBoxSize.length > 0) {
        if (entry.borderBoxSize[0].blockSize) {
          naturalHeight = entry.borderBoxSize[0].blockSize;
        }
      } else {
        if (entry.contentRect.height) {
          naturalHeight = entry.contentRect.height;
        }
      }
      scheduleUpdate();
    });

    if (wrapperEl) {
      wrapperObserver.observe(wrapperEl, { box: "border-box" });
    }
    if (tabViewEl) {
      contentObserver.observe(tabViewEl, { box: "border-box" });
    }

    lastKnownActiveColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--activeColour")
      .trim();
    
    colorPollInterval = setInterval(pollActiveColorChange, 250);
  });

  onDestroy(function () {
    if (wrapperObserver) wrapperObserver.disconnect();
    if (contentObserver) contentObserver.disconnect();
    if (rafIdScale) cancelAnimationFrame(rafIdScale);
    if (colorPollInterval) clearInterval(colorPollInterval);
  });

  function setView(view) {
    if (view === activeView) {
      return;
    }

    if (view === "edit") {
      direction = 1;
    } else {
      direction = -1;
    }

    prevView = activeView;
    activeView = view;
    isTransitioning = true;

    if (transitionTimeout) {
      clearTimeout(transitionTimeout);
    }

    let ms = $TRANSITION_MS;
    if (!ms) ms = 300;

    transitionTimeout = setTimeout(function () {
      isTransitioning = false;
      prevView = null;
    }, ms);
  }

  function getPaths() {
    let homeDir = "";
    if (typeof os !== "undefined" && typeof os.homedir === "function") {
      homeDir = os.homedir();
    }
    
    let documentsFolder = "";
    if (homeDir) documentsFolder = homeDir + "/Documents";
    else documentsFolder = "Documents";
    documentsFolder = documentsFolder.replace(/\\+/g, "/");

    let setFolder = documentsFolder + "/Excalibur";
    setFolder = setFolder.replace(/\\+/g, "/");

    let filePath = setFolder + "/curves.ebfx";
    filePath = filePath.replace(/\\+/g, "/");

    return { setFolder: setFolder, filePath: filePath };
  }

  function deleteAllPresets() {
    let confirmed = window.confirm("Are you sure you want to delete all custom presets? This action is irreversible.");
    if (!confirmed) {
      return;
    }

    try {
      presetsData = [];
      savePresets();
      sendNotif("All presets deleted", true);
    } catch (e) {
      sendNotif("Failed to delete presets", false);
    }
  }

  function loadPresets() {
    if (!fs || typeof fs.existsSync !== "function") {
      presetsData = [];
      return;
    }

    let paths = getPaths();
    let setFolder = paths.setFolder;
    let filePath = paths.filePath;

    try {
      if (!fs.existsSync(setFolder)) {
        fs.mkdirSync(setFolder, { recursive: true });
      }

      if (fs.existsSync(filePath)) {
        let raw = fs.readFileSync(filePath, "utf8");
        let parsed = JSON.parse(raw);
        let newPresets = [];

        if (Array.isArray(parsed)) {
          for (let i = 0; i < parsed.length; i++) {
            let p = parsed[i];
            if (p && p.active !== false) {
              let currentId = p.id;
              if (!currentId) {
                currentId = Date.now() + "_" + i;
              }

              let currentX1 = 0.5;
              if (p.x1 !== undefined) currentX1 = Number(p.x1);
              
              let currentY1 = 0;
              if (p.y1 !== undefined) currentY1 = Number(p.y1);

              let currentX2 = 0.5;
              if (p.x2 !== undefined) currentX2 = Number(p.x2);

              let currentY2 = 1;
              if (p.y2 !== undefined) currentY2 = Number(p.y2);

              newPresets.push({
                id: currentId,
                x1: currentX1,
                y1: currentY1,
                x2: currentX2,
                y2: currentY2
              });
            }
          }
        }
        presetsData = newPresets;
      } else {
        presetsData = [];
        savePresets();
      }
    } catch (e) {
      presetsData = [];
    }
  }

  function savePresets() {
    if (!fs || typeof fs.existsSync !== "function") {
      return;
    }

    let paths = getPaths();
    let setFolder = paths.setFolder;
    let filePath = paths.filePath;

    try {
      if (!fs.existsSync(setFolder)) {
        fs.mkdirSync(setFolder, { recursive: true });
      }
      let jsonString = JSON.stringify(presetsData);
      fs.writeFileSync(filePath, jsonString, "utf-8");
    } catch (e) {
      // empty catch
    }
  }

  function generateId() {
    let timePart = Date.now().toString();
    let randomPart = Math.random().toString(36).slice(2, 8);
    return timePart + "_" + randomPart;
  }

  function formatVal(x1, y1, x2, y2) {
    let fX1 = Number(x1).toFixed(2);
    let fY1 = Number(y1).toFixed(2);
    let fX2 = Number(x2).toFixed(2);
    let fY2 = Number(y2).toFixed(2);
    return fX1 + ", " + fY1 + ", " + fX2 + ", " + fY2;
  }

  function resetDiv(node) {
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function getDynamicActiveColor() {
    let style = getComputedStyle(document.documentElement);
    let color = style.getPropertyValue("--activeColour");
    return color.trim();
  }

  function bezierPointAt(t, x1, y1, x2, y2) {
    let mt = 1 - t;
    let x = 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t;
    let y = 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t;
    return { x: x, y: y };
  }

  function bezierDerivativeAt(t, x1, y1, x2, y2) {
    let mt = 1 - t;
    let dx = 3 * mt * mt * x1 + 6 * mt * t * (x2 - x1) + 3 * t * t * (1 - x2);
    let dy = 3 * mt * mt * y1 + 6 * mt * t * (y2 - y1) + 3 * t * t * (1 - y2);
    return { dx: dx, dy: dy };
  }

  function solveTForX(x, x1, x2) {
    let t = x;
    for (let i = 0; i < 8; i++) {
      let mt = 1 - t;
      let xEst = 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t;
      let d = 3 * mt * mt * x1 + 6 * mt * t * (x2 - x1) + 3 * t * t * (1 - x2);
      
      if (Math.abs(d) < 1e-6) {
        break;
      }
      
      t = t - (xEst - x) / d;
      
      if (t < 0) t = 0;
      if (t > 1) t = 1;
    }
    return t;
  }

  function drawStaticBezier(node, x1, y1, x2, y2) {
    resetDiv(node);

    let canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    node.appendChild(canvas);

    let padding = 0.02;
    let drawSize = 0.8;

    let lastW = 0;
    let lastH = 0;

    function draw() {
      let w = node.clientWidth;
      let h = node.clientHeight;

      if (!w || !h) return;

      let dpr = window.devicePixelRatio;
      if (!dpr) dpr = 1;

      let targetW = w * dpr;
      let targetH = h * dpr;

      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
        lastW = targetW;
        lastH = targetH;
      }

      let ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      let curveW = w * drawSize;
      let curveH = h * drawSize;

      let offsetX = (w - curveW) / 2;
      let offsetY = (h - curveH) / 2;

      let px = curveW * padding;
      let py = curveH * padding;

      let p1x = x1 * (curveW - 2 * px) + offsetX + px;
      let p1y = (1 - y1) * (curveH - 2 * py) + offsetY + py;

      let p2x = x2 * (curveW - 2 * px) + offsetX + px;
      let p2y = (1 - y2) * (curveH - 2 * py) + offsetY + py;

      let startX = offsetX + px;
      let startY = offsetY + curveH - py;

      let endX = offsetX + curveW - px;
      let endY = offsetY + py;

      let activeColor = getDynamicActiveColor();

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.bezierCurveTo(p1x, p1y, p2x, p2y, endX, endY);

      let lineWidthCurve = w / 16;
      if (lineWidthCurve < 2.5) lineWidthCurve = 2.5;

      ctx.strokeStyle = activeColor;
      ctx.lineWidth = lineWidthCurve;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(p1x, p1y);
      ctx.moveTo(endX, endY);
      ctx.lineTo(p2x, p2y);

      let lineWidthLine = w / 24;
      if (lineWidthLine < 1) lineWidthLine = 1;

      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = lineWidthLine;
      ctx.lineCap = "round";
      ctx.stroke();

      let points = [
        [p1x, p1y],
        [p2x, p2y],
      ];

      for (let i = 0; i < points.length; i++) {
        let ptX = points[i][0];
        let ptY = points[i][1];
        
        ctx.beginPath();
        let radius = w / 35;
        if (radius < 2) radius = 2;
        
        ctx.arc(ptX, ptY, radius, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();

        ctx.strokeStyle = activeColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    draw();

    let unregister = registerRedraw(draw);
    let resizeRafId = null;
    
    let ro = new ResizeObserver(function () {
      if (resizeRafId) cancelAnimationFrame(resizeRafId);
      resizeRafId = requestAnimationFrame(draw);
    });
    
    ro.observe(node);

    return {
      destroy: function () {
        if (resizeRafId) cancelAnimationFrame(resizeRafId);
        ro.disconnect();
        unregister();
      },
    };
  }

  function interactiveBezier(node, getters, onChange) {
    resetDiv(node);
    let canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    canvas.style.cursor = "default";
    node.appendChild(canvas);

    let padding = 0.03;
    let dragging = null;

    let DUREE_ALLER = 1400;

    function points() {
      let w = node.clientWidth;
      let h = node.clientHeight;
      let px = w * padding;
      let py = h * padding;
      let currentValues = getters();
      
      let x1 = currentValues.x1;
      let y1 = currentValues.y1;
      let x2 = currentValues.x2;
      let y2 = currentValues.y2;

      return {
        w: w,
        h: h,
        px: px,
        py: py,
        x1: x1,
        y1: y1,
        x2: x2,
        y2: y2,
        p1x: x1 * (w - 2 * px) + px,
        p1y: (1 - y1) * (h - 2 * py) + py,
        p2x: x2 * (w - 2 * px) + px,
        p2y: (1 - y2) * (h - 2 * py) + py,
      };
    }

    function draw(tPoint) {
      let pts = points();
      if (!pts.w || !pts.h) return;
      
      canvas.width = pts.w;
      canvas.height = pts.h;
      let ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, pts.w, pts.h);

      let activeColor = getDynamicActiveColor();

      ctx.beginPath();
      for (let i = 0; i <= 4; i++) {
        let gx = pts.px + (i / 4) * (pts.w - 2 * pts.px);
        ctx.moveTo(gx, pts.py);
        ctx.lineTo(gx, pts.h - pts.py);
      }
      for (let i = 0; i <= 4; i++) {
        let gy = pts.py + (i / 4) * (pts.h - 2 * pts.py);
        ctx.moveTo(pts.px, gy);
        ctx.lineTo(pts.w - pts.px, gy);
      }
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();

      let curveLineWidth = pts.h / 55;
      if (curveLineWidth < 2.5) curveLineWidth = 2.5;
      
      ctx.beginPath();
      ctx.moveTo(pts.px, pts.h - pts.py);
      ctx.bezierCurveTo(pts.p1x, pts.p1y, pts.p2x, pts.p2y, pts.w - pts.px, pts.py);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = curveLineWidth;
      ctx.lineCap = "round";
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(pts.px, pts.h - pts.py);
      ctx.lineTo(pts.p1x, pts.p1y);
      ctx.moveTo(pts.w - pts.px, pts.py);
      ctx.lineTo(pts.p2x, pts.p2y);
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = 3;
      ctx.stroke();

      let handles = [
        [pts.p1x, pts.p1y],
        [pts.p2x, pts.p2y],
      ];

      for (let i = 0; i < handles.length; i++) {
        let ptX = handles[i][0];
        let ptY = handles[i][1];

        ctx.beginPath();
        let radius = pts.h / 32;
        if (radius < 3) radius = 3;
        
        ctx.arc(ptX, ptY, radius, 0, Math.PI * 2);
        ctx.fillStyle = activeColor;
        ctx.fill();
      }

      if (tPoint !== null && tPoint !== undefined) {
        let pos = bezierPointAt(tPoint, pts.x1, pts.y1, pts.x2, pts.y2);
        let posX = pos.x * (pts.w - 2 * pts.px) + pts.px;
        let posY = (1 - pos.y) * (pts.h - 2 * pts.py) + pts.py;

        let deriv = bezierDerivativeAt(tPoint, pts.x1, pts.y1, pts.x2, pts.y2);
        let len = Math.hypot(deriv.dx, deriv.dy);
        if (len === 0) len = 1;
        
        let dirX = deriv.dx / len;
        let dirY = -deriv.dy / len;

        let traitLength = curveLineWidth * 3.4;
        let halfX = (dirX * traitLength) / 2;
        let halfY = (dirY * traitLength) / 2;

        ctx.beginPath();
        ctx.moveTo(posX - halfX, posY - halfY);
        ctx.lineTo(posX + halfX, posY + halfY);
        ctx.strokeStyle = activeColor;
        ctx.lineWidth = curveLineWidth;
        ctx.lineCap = "round";
        ctx.stroke();
      }
    }

    function getMouse(evt) {
      let rect = canvas.getBoundingClientRect();
      let scaleX = node.clientWidth / rect.width;
      let scaleY = node.clientHeight / rect.height;
      return {
        x: (evt.clientX - rect.left) * scaleX,
        y: (evt.clientY - rect.top) * scaleY,
      };
    }

    function onMouseDown(evt) {
      let pts = points();
      let m = getMouse(evt);
      
      let r = pts.h / 10;
      if (r < 16) r = 16;
      
      let dist1 = Math.hypot(m.x - pts.p1x, m.y - pts.p1y);
      let dist2 = Math.hypot(m.x - pts.p2x, m.y - pts.p2y);
      
      if (dist1 <= r) {
        dragging = 1;
      } else if (dist2 <= r) {
        dragging = 2;
      }
    }

    function onMouseMove(evt) {
      let pts = points();
      let m = getMouse(evt);
      
      let r = pts.h / 10;
      if (r < 16) r = 16;

      if (dragging) {
        canvas.style.cursor = "grabbing";
      } else {
        let dist1 = Math.hypot(m.x - pts.p1x, m.y - pts.p1y);
        let dist2 = Math.hypot(m.x - pts.p2x, m.y - pts.p2y);
        
        if (dist1 <= r || dist2 <= r) {
          canvas.style.cursor = "grab";
        } else {
          canvas.style.cursor = "default";
        }
      }

      if (!dragging) return;

      let nx = (m.x - pts.px) / (pts.w - 2 * pts.px);
      if (nx < 0) nx = 0;
      if (nx > 1) nx = 1;

      let ny = 1 - (m.y - pts.py) / (pts.h - 2 * pts.py);
      if (ny < 0) ny = 0;
      if (ny > 1) ny = 1;

      let cur = getters();

      if (dragging === 1) {
        onChange(nx, ny, cur.x2, cur.y2);
      } else {
        onChange(cur.x1, cur.y1, nx, ny);
      }
    }

    function onMouseUp() {
      dragging = null;
    }

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    let animId = null;
    let timeDebut = null;
    let stopped = false;
    let lastT = 0;

    let isVisible = true;
    let visibilityObserver = new IntersectionObserver(
      function (entries) {
        if (entries[0]) {
          isVisible = entries[0].isIntersecting;
        } else {
          isVisible = true;
        }
      },
      { threshold: 0 }
    );
    visibilityObserver.observe(node);

    let PAUSE_FIN_MS = 450;
    let CYCLE_MS = DUREE_ALLER + PAUSE_FIN_MS;

    function animer(now) {
      if (stopped) return;

      if (document.hidden || !isVisible || node.offsetParent === null || $activeTab !== "curves") {
        timeDebut = null;
        animId = requestAnimationFrame(animer);
        return;
      }

      if (timeDebut === null) {
        timeDebut = now;
      }
      
      let elapsed = now - timeDebut;
      let cyclePos = elapsed % CYCLE_MS;

      if (cyclePos >= DUREE_ALLER) {
        lastT = null;
        draw(null);
      } else {
        let progress = cyclePos / DUREE_ALLER;
        let cur = getters();
        lastT = solveTForX(progress, cur.x1, cur.x2);
        draw(lastT);
      }

      animId = requestAnimationFrame(animer);
    }
    
    let unregister = registerRedraw(function () {
      draw(lastT);
    });
    
    let ro = new ResizeObserver(function () {
      draw(lastT);
    });
    
    ro.observe(node);
    draw(0);
    animId = requestAnimationFrame(animer);

    return {
      redraw: function () {
        draw(lastT);
      },
      destroy: function () {
        stopped = true;
        if (animId) cancelAnimationFrame(animId);
        canvas.removeEventListener("mousedown", onMouseDown);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        ro.disconnect();
        visibilityObserver.disconnect();
        unregister();
      },
    };
  }

  let sharedPresetObserver = null;
  let presetVisibilityMap = new WeakMap();

  function getSharedPresetObserver() {
    if (!sharedPresetObserver) {
      sharedPresetObserver = new IntersectionObserver(
        function (entries) {
          for (let i = 0; i < entries.length; i++) {
            let entry = entries[i];
            let cb = presetVisibilityMap.get(entry.target);
            if (cb) {
              cb(entry.isIntersecting);
            }
          }
        },
        { root: null, threshold: 0, rootMargin: "50px" }
      );
    }
    return sharedPresetObserver;
  }

  function miniCurveAction(node, preset) {
    let instance = null;
    let isVisible = false;
    let pendingPreset = preset;

    function ensureDrawn() {
      if (!isVisible) return;
      if (instance) {
        instance.destroy();
      }
      instance = drawStaticBezier(
        node,
        pendingPreset.x1,
        pendingPreset.y1,
        pendingPreset.x2,
        pendingPreset.y2
      );
    }

    let observer = getSharedPresetObserver();
    
    presetVisibilityMap.set(node, function (visible) {
      isVisible = visible;
      if (visible && !instance) {
        ensureDrawn();
      }
    });
    
    observer.observe(node);

    return {
      update: function (newPreset) {
        pendingPreset = newPreset;
        if (isVisible) {
          ensureDrawn();
        }
      },
      destroy: function () {
        observer.unobserve(node);
        presetVisibilityMap.delete(node);
        if (instance) {
          instance.destroy();
        }
      },
    };
  }

  function editCurveAction(node) {
    let instance = interactiveBezier(
      node,
      function () {
        return { x1: setNewX1, y1: setNewY1, x2: setNewX2, y2: setNewY2 };
      },
      function (x1, y1, x2, y2) {
        setNewX1 = x1;
        setNewY1 = y1;
        setNewX2 = x2;
        setNewY2 = y2;
        curveValText = formatVal(x1, y1, x2, y2);
      }
    );
    return { destroy: instance.destroy };
  }

  function liveCurveAction(node) {
    let instance = interactiveBezier(
      node,
      function () {
        return { x1: L_setNewX1, y1: L_setNewY1, x2: L_setNewX2, y2: L_setNewY2 };
      },
      function (x1, y1, x2, y2) {
        L_setNewX1 = x1;
        L_setNewY1 = y1;
        L_setNewX2 = x2;
        L_setNewY2 = y2;
        curveValLiveText = formatVal(x1, y1, x2, y2);
      }
    );
    return { destroy: instance.destroy };
  }

  async function applyCurveValues(x1, y1, x2, y2) {
    try {
      let response = await evalTS("ApplyCurveToKeyFramesExcalibur", Number(x1), Number(y1), Number(x2), Number(y2));
      let result = JSON.parse(response);

      if (result.status === "SUCCESS") {
        sendNotif("Curve preset applied", true);
      } else {
        if (result.message) {
          sendNotif(result.message, false);
        } else {
          sendNotif("Failed to apply curve", false);
        }
      }
    } catch (error) {
      sendNotif("Failed to apply curve preset", false);
    }
  }

  function applyPreset(preset) {
    applyCurveValues(preset.x1, preset.y1, preset.x2, preset.y2);
  }

  async function copyCurve() {
    try {
      let value = await copyTheCurve();
      if (value) {
        copiedBezierDisplay = value;
      } else {
        copiedBezierDisplay = "No curve copied";
      }
    } catch (e) {
      // empty catch
    }
  }

  function pasteCurve() {
    pasteTheCurve();
  }

  function openNewPreset() {
    editingId = null;
    setNewX1 = 0.5;
    setNewY1 = 0;
    setNewX2 = 0.5;
    setNewY2 = 1;
    curveValText = formatVal(setNewX1, setNewY1, setNewX2, setNewY2);
    setView("edit");
  }

  function openEditPreset(preset) {
    editingId = preset.id;
    setNewX1 = preset.x1;
    setNewY1 = preset.y1;
    setNewX2 = preset.x2;
    setNewY2 = preset.y2;
    curveValText = formatVal(setNewX1, setNewY1, setNewX2, setNewY2);
    setView("edit");
  }

  function closeEdit() {
    setView("list");
  }

  function saveLiveAsPreset() {
    try {
      let newPreset = {
        id: generateId(),
        x1: Number(L_setNewX1),
        y1: Number(L_setNewY1),
        x2: Number(L_setNewX2),
        y2: Number(L_setNewY2),
      };
      
      let newArray = [];
      for (let i = 0; i < presetsData.length; i++) {
        newArray.push(presetsData[i]);
      }
      newArray.push(newPreset);
      presetsData = newArray;
      
      savePresets();
      loadPresets();

      $CurvesTab = "presets";
      sendNotif("Live curve saved as preset", true);
    } catch (e) {
      // empty catch
    }
  }

  function savePreset() {
    if (editingId) {
      let updatedPresets = [];
      for (let i = 0; i < presetsData.length; i++) {
        let p = presetsData[i];
        if (p.id === editingId) {
          updatedPresets.push({
            id: p.id,
            x1: Number(setNewX1),
            y1: Number(setNewY1),
            x2: Number(setNewX2),
            y2: Number(setNewY2),
          });
        } else {
          updatedPresets.push(p);
        }
      }
      presetsData = updatedPresets;
    } else {
      let newPreset = {
        id: generateId(),
        x1: Number(setNewX1),
        y1: Number(setNewY1),
        x2: Number(setNewX2),
        y2: Number(setNewY2),
      };
      let newArray = [];
      for (let i = 0; i < presetsData.length; i++) {
        newArray.push(presetsData[i]);
      }
      newArray.push(newPreset);
      presetsData = newArray;
    }
    
    savePresets();
    loadPresets();
    setView("list");
  }

  function removeCurrentPreset() {
    if (!editingId) return;
    
    let filtered = [];
    for (let i = 0; i < presetsData.length; i++) {
      if (presetsData[i].id !== editingId) {
        filtered.push(presetsData[i]);
      }
    }
    presetsData = filtered;
    
    savePresets();
    setView("list");
  }

  loadPresets();
</script>

<div class="settings-wrapper" bind:this={wrapperEl}>
  <div class="tab-view" bind:this={tabViewEl} style="transform: scale({scaleFactor}); width: {REF_WIDTH}px;">
    <div class="slider-wrapper">
      <div class="tab-slide" 
        class:hidden={activeView !== "list" && prevView !== "list"}
        class:exit={isTransitioning && prevView === "list"}
        class:enter={isTransitioning && activeView === "list"}
        class:slide-left-exit={isTransitioning && prevView === "list" && direction === 1}
        class:slide-right-enter={isTransitioning && activeView === "list" && direction === -1}>
        <div class="full-view-content">
          <nav class="dashboard-sub-menu">
            <div class="nav-grid">
              <button type="button" 
                class:eff_active={$CurvesTab === "presets"}
                class:not_eff_active={$CurvesTab !== "presets"}
                on:click={() => ($CurvesTab = "presets")}>
                <span>Presets</span>
              </button>
              <button type="button" 
                class:eff_active={$CurvesTab === "live"}
                class:not_eff_active={$CurvesTab !== "live"}
                on:click={() => ($CurvesTab = "live")}>
                <span>Live Curve</span>
              </button>
            </div>
          </nav>

          <main class="content-area">
            {#if $CurvesTab === "presets"}
              <div class="presets-section" in:fly={{ x: -80, duration: durIn }} out:fly={{ x: -80, duration: durOut }}>
                {#if showCopyPasteButtons}
                  <div class="copy-paste-bar">
                    <button class="cp-btn btn-copy" on:click={copyCurve}>Copy</button>
                    <button class="cp-btn btn-paste" on:click={pasteCurve}>Paste</button>
                  </div>
                {/if}

                <div class="presets-grid-wrapper" style="--preset-size: {$zoomLevel}px;">
                  <div class="presets-grid">
                    <button type="button" class="curve_prefix add-curve-btn" on:click={openNewPreset} title="New Curve" aria-label="Create a new curve preset">
                      <img src={Add} alt="Nouvelle Courbe" decoding="async" />
                    </button>
                    {#each presetsData as preset (preset.id)}
                      <button type="button" class="curve_prefix" use:miniCurveAction={preset} on:click={() => applyPreset(preset)} on:contextmenu|preventDefault={() => openEditPreset(preset)} title="Left click: apply — Right click: edit" aria-label={`Apply preset ${preset.id}`}></button>
                    {/each}
                  </div>
                </div>
                
                {#if isToolbarOpen}
                  <div class="floating-toolbar" in:fly={{ y: 20, duration: durIn }} out:fly={{ y: 20, duration: durOut }}>
                    <button class="toolbar-btn delete-all-btn" on:click={deleteAllPresets} title="Supprimer tous les presets">Delete All</button>
                    <button class="toolbar-btn toggle-cp-btn" class:is-active={showCopyPasteButtons} on:click={() => (showCopyPasteButtons = !showCopyPasteButtons)} title="Afficher/Masquer les boutons Copy/Paste">
                      C/P {showCopyPasteButtons ? "ON" : "OFF"}
                    </button>
                    <div class="zoom-toolbar">
                      <button class="zoom-btn" on:click={zoomOut} title="Réduire">−</button>
                      <span class="zoom-value">{$zoomLevel}</span>
                      <button class="zoom-btn" on:click={zoomIn} title="Agrandir">+</button>
                    </div>
                    <button class="toolbar-btn close-pop-btn" on:click={() => (isToolbarOpen = false)} title="Fermer les options">
                      <img src={Close} alt="Fermer" decoding="async" />
                    </button>
                  </div>
                {:else}
                  <button class="toolbar-toggle-btn" on:click={() => (isToolbarOpen = true)} title="Options" in:scale={{ duration: durIn, start: 0.5 }} out:scale={{ duration: durOut, start: 0.5 }}>
                    <img src={Add} alt="Options" decoding="async" />
                  </button>
                {/if}
              </div>
            {:else}
              <div class="live-section" in:fly={{ x: 80, duration: durIn }} out:fly={{ x: 80, duration: durOut }}>
                <div class="live-card">
                  <div id="CurvePreview_Live" class="live-canvas" use:liveCurveAction></div>
                  <input class="value-input live-value-input" type="text" readonly value={curveValLiveText} />
                  <div class="live-actions">
                    <button class="primary-btn live-btn" on:click={() => applyCurveValues(L_setNewX1, L_setNewY1, L_setNewX2, L_setNewY2)}>
                      Apply
                    </button>
                    <button class="secondary-btn live-btn" on:click={saveLiveAsPreset} title="Sauvegarder en tant que preset">
                      Add as Preset
                    </button>
                  </div>
                </div>
              </div>
            {/if}
          </main>
        </div>
      </div>

      <div class="tab-slide" 
        class:hidden={activeView !== "edit" && prevView !== "edit"}
        class:exit={isTransitioning && prevView === "edit"}
        class:enter={isTransitioning && activeView === "edit"}
        class:slide-right-exit={isTransitioning && prevView === "edit" && direction === -1}
        class:slide-left-enter={isTransitioning && activeView === "edit" && direction === 1}>
        <div class="edit-mode-container">
          <div class="edit-card">
            <div class="edit-canvas" use:editCurveAction></div>
            <input class="value-input readonly" type="text" readonly value={curveValText} />
            <div class="edit-actions" class:with-remove={editingId}>
              {#if editingId}
                <button class="btn-remove" on:click={removeCurrentPreset}>Remove</button>
              {/if}
              <button class="btn-cancel" on:click={closeEdit}>Cancel</button>
              <button class="btn-save" on:click={savePreset}>Save</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style lang="scss">
  .settings-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
  }

  .tab-view {
    transform-origin: center center;
    padding: 4px;
    box-sizing: border-box;
    font-family: "Museo Sans", sans-serif;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    overflow: hidden;
    height: 100%;
  }

  .slider-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .tab-slide {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    will-change: transform;
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

  .full-view-content {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .slide-left-enter {
    animation: slideInFromRight var(--transition-ms, 300ms) cubic-bezier(0.25, 1, 0.5, 1) forwards;
  }
  .slide-left-exit {
    animation: slideOutToLeft var(--transition-ms, 300ms) cubic-bezier(0.25, 1, 0.5, 1) forwards;
  }
  .slide-right-enter {
    animation: slideInFromLeft var(--transition-ms, 300ms) cubic-bezier(0.25, 1, 0.5, 1) forwards;
  }
  .slide-right-exit {
    animation: slideOutToRight var(--transition-ms, 300ms) cubic-bezier(0.25, 1, 0.5, 1) forwards;
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

  .dashboard-sub-menu {
    width: 100%;
    height: 30px;
    background-color: rgb(37, 37, 37);
    border: 1px solid rgb(65, 65, 65);
    border-radius: 4px;
    flex-shrink: 0;
    margin-bottom: 4px;
  }
  .dashboard-sub-menu .nav-grid {
    width: calc(100% - 1vh);
    height: 100%;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5vh;
    margin: 0px 0.5vh;
  }
  .dashboard-sub-menu button {
    font-family: "Museo Sans", sans-serif;
    appearance: none;
    border: none;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    border-radius: 3px;
    font-weight: 600;
    margin: 2px 0;
    color: #fff;
    cursor: pointer;
    transition: all 0.1s ease;
  }
  .dashboard-sub-menu button:hover {
    background-color: #191919 !important;
    transform: translateY(-0.5vh);
    border-top: 0.4vh solid var(--activeColour) !important;
  }

  .dashboard-sub-menu button:active {
    background-color: #191919 !important;
    transform: translateY(0vh) scale(0.98);
    border-top: 0.4vh solid var(--activeColour) !important;
  }
  .eff_active {
    background-color: #191919 !important;
    border-top: 2px solid var(--activeColour) !important;
  }
  .not_eff_active {
    background-color: #191919 !important;
    border-top: 2px solid transparent !important;
  }

  .content-area {
    flex: 1;
    min-height: 0;
    display: grid;
    overflow: hidden;
    position: relative;
  }

  .presets-section {
    grid-area: 1 / 1;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    min-height: 0;
    gap: 4px;
    position: relative;
  }

  .copy-paste-bar {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    width: 100%;
    flex-shrink: 0;

    .cp-btn {
      height: 22px;
      border-radius: 4px;
      border: 1px solid rgb(65, 65, 65);
      color: white;
      font-weight: 700;
      font-size: 11px;
      cursor: pointer;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
      transition: transform 30ms, filter 100ms ease;

      &:hover {
        filter: brightness(1.15);
      }
      &:active {
        transform: scale(0.96);
      }
    }

    .btn-copy {
      background-color: #333333;
      &:hover {
        background-color: var(--activeColourHover);
      }
    }

    .btn-paste {
      background-color: var(--activeColour);
      &:hover {
        background-color: var(--activeColourHover);
      }
    }
  }

  .floating-toolbar {
    position: absolute;
    bottom: 6px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 999;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    background-color: rgba(22, 22, 22, 0.95);
    backdrop-filter: blur(6px);
    border: 1px solid rgb(70, 70, 70);
    border-radius: 8px;
    box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.6);
    justify-content: center;
    transition: all 0.2s ease;
  }

  .toolbar-toggle-btn {
    position: absolute;
    bottom: 6px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 999;
    background-color: rgba(31, 31, 31, 0.85);
    border: 1px solid rgb(80, 80, 80);
    border-radius: 20px;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    backdrop-filter: blur(4px);
    transition: background-color 0.15s ease, transform 0.15s ease;

    img {
      width: 45px;
      height: 45px;
      object-fit: contain;
      transition: transform 0.25s ease;
    }

    &:hover {
      background-color: #4d4d4d;

      img {
        transform: rotate(90deg) scale(1.05);
      }
    }

    &:active {
      transform: translateX(-50%) scale(0.95);
    }
  }

  .close-pop-btn {
    background-color: rgb(160, 20, 20);
    border-color: rgb(190, 30, 30);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    padding: 0;

    img {
      width: 10px;
      height: 10px;
      object-fit: contain;
    }

    &:hover {
      background-color: rgb(200, 30, 30);
    }
  }

  .live-section,
  .edit-mode-container {
    grid-area: 1 / 1;
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    padding: 0 4px;
    box-sizing: border-box;
  }

  .live-card,
  .edit-card {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 4px;
    padding-bottom: 4px;
    background: transparent;
    border: none;
    box-shadow: none;
    box-sizing: border-box;
  }

  .live-canvas,
  .edit-canvas {
    width: 9999px !important;
    height: auto !important;
    max-width: 100% !important;
    max-height: calc(100% - 64px) !important;
    aspect-ratio: 1 / 1;
    margin: 0 auto auto auto;
    display: block;
    background-color: transparent;
    border: none;
    border-radius: 0;
    box-shadow: none;
  }

  .edit-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    width: 100%;
    max-width: 100%;
    margin: 0 auto;

    &.with-remove {
      grid-template-columns: 1fr 1fr 1fr;
    }

    button {
      height: 24px;
      border-radius: 4px;
      border: none;
      color: white;
      font-weight: 600;
      font-size: 10px;
      cursor: pointer;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
      box-shadow: 0px 0px 8px rgba(0, 0, 0, 0.2);
      transition: transform 30ms, background-color 65ms;

      &:hover {
        transform: scale(1.02);
      }
      &:active {
        transform: scale(0.98);
      }
    }
  }

  .value-input {
    width: 100%;
    max-width: 100%;
    height: 24px;
    text-align: center;
    font-size: 11px;
    color: white;
    background-color: rgb(37, 37, 37);
    border: 1px solid rgba(73, 73, 73, 0.68);
    outline: none;
    border-radius: 4px;
    box-sizing: border-box;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
    box-shadow: 0px 0px 8px rgba(0, 0, 0, 0.2);
    margin: 0 auto 4px auto;
    transition: background-color 65ms;

    &:hover {
      background-color: rgb(49, 49, 49);
    }
    &.readonly {
      color: #ccc;
    }
  }

  .btn-remove {
    background-color: rgb(177, 12, 12);
    &:hover {
      background-color: rgb(255, 0, 0);
    }
  }
  .btn-cancel {
    background-color: rgb(59, 59, 59);
    &:hover {
      background-color: rgb(133, 133, 133);
    }
  }
  .btn-save {
    background-color: rgb(158, 194, 27);
    &:hover {
      background-color: rgb(214, 255, 32);
      color: black;
      text-shadow: none;
    }
  }

  .toolbar-btn {
    height: 24px;
    border-radius: 3px;
    border: 1px solid rgb(65, 65, 65);
    background-color: #3b3b3b;
    color: white;
    font-weight: 600;
    font-size: 9px;
    cursor: pointer;
    padding: 0 8px;
    transition: filter 0.12s ease, background-color 0.12s ease;

    &:hover {
      filter: brightness(1.15);
      background-color: #4d4d4d;
    }
    &:active {
      transform: scale(0.97);
    }
  }

  .zoom-toolbar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    .zoom-btn {
      width: 22px;
      height: 22px;
      border-radius: 3px;
      border: 1px solid rgb(65, 65, 65);
      background-color: #3b3b3b;
      color: white;
      font-weight: 700;
      font-size: 13px;
      line-height: 1;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: filter 0.12s ease, background-color 0.12s ease;

      &:hover {
        background-color: #4d4d4d;
        filter: brightness(1.15);
      }
      &:active {
        transform: scale(0.92);
      }
    }
    .zoom-value {
      font-size: 10px;
      color: #999;
      min-width: 18px;
      text-align: center;
    }
  }

  .presets-grid-wrapper {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgb(65, 65, 65);
    border-radius: 4px;
    padding: 4px;
    padding-bottom: 45px;
    box-sizing: border-box;

    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: var(--activeColour);
      border-radius: 2px;
    }
  }

  .presets-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(var(--preset-size, 40px), 1fr));
    gap: 4px;
    align-content: start;
    
    .add-curve-btn {
      order: 9999;
    }
  }

  .curve_prefix {
    width: 100%;
    aspect-ratio: 1 / 1;
    max-width: var(--preset-size, 55px);
    max-height: var(--preset-size, 55px);
    margin: 0 auto;
    background-color: rgb(31, 31, 31);
    border: 1px solid rgb(60, 60, 60);
    border-radius: 3px;
    cursor: pointer;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
    transition: transform 35ms, background-color 0.15s ease, border-color 0.15s ease;

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      transform: scale(2.5);
    }
    &:hover {
      z-index: 3;
      background-color: color-mix(in srgb, var(--activeColour) 50%, white);
      transform: scale(1.05);
      box-shadow: 0 0 6px color-mix(in srgb, var(--activeColour) 50%, white);
    }

    &:active {
      transform: scale(0.95);
    }
  }

  .add-curve-btn {
    background-color: rgb(37, 37, 37);
    border: 1px dashed rgb(80, 80, 80);

    img {
      width: 20px;
      height: 20px;
      opacity: 0.7;
      object-fit: contain;
      transition: opacity 0.15s ease;
    }

    &:hover {
      background-color: var(--activeColour);
      border-color: var(--activeColour);
      img {
        opacity: 1;
      }
    }
  }
  .value-input.live-value-input {
    text-align: center;
    font-size: 11px;
    padding: 3px 6px;
  }

  .live-actions {
    display: grid;
    grid-template-columns: 3fr 1fr;
    gap: 6px;
    width: 100%;
    box-sizing: border-box;
  }

  .live-btn {
    width: 100%;
    min-width: 0;
    padding: 6px 4px;
    font-size: 11px;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: pointer;
  }

  .secondary-btn {
    background-color: rgb(55, 55, 55);
    color: #fff;
    border: 1px solid rgb(75, 75, 75);
    border-radius: 3px;
    padding: 4px 6px;

    &:hover {
      background-color: rgb(70, 70, 70);
    }
  }

  .primary-btn {
    width: 100%;
    max-width: 100%;
    height: 24px;
    border-radius: 4px;
    border: none;
    color: white;
    font-weight: 600;
    font-size: 11px;
    cursor: pointer;
    background-color: var(--activeColour);
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
    box-shadow: 0px 0px 8px rgba(0, 0, 0, 0.2);
    transition: transform 30ms, background-color 65ms;
    margin: 0 auto;

    &:hover {
      transform: scale(1.02);
    }
    &:active {
      transform: scale(0.98);
    }
  }
</style>