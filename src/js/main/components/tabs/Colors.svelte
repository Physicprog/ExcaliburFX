<script>
  import { onMount } from "svelte";
  import { csi } from "../../../lib/utils/bolt";
  import { fs } from "../../../lib/cep/node";

  let canvasEl;
  let gl;
  let shaderProgram;
  let texture;
  let positionLocation;
  let texCoordLocation;

  let status = "En attente...";
  let isImageLoaded = false;
  let isApplying = false;

  // --- Input ---
  let inputSpace = 0; // 0 = Rec.709, 1 = S-Log3, 2 = V-Log

  // --- Balance des blancs ---
  let temperature = 0.0; // -100 (bleu) à 100 (orange)
  let tint = 0.0; // -100 (magenta) à 100 (vert)

  // --- Tonalité ---
  let exposure = 0.0; // en stops, -3 à 3
  let highlights = 0.0; // -100 à 100
  let shadows = 0.0; // -100 à 100
  let whites = 0.0; // -100 à 100
  let blacks = 0.0; // -100 à 100

  // --- Roues primaires (CDL) ---
  let lift = 0.0;
  let gamma = 1.0;
  let gain = 1.0;

  // --- Contraste / Courbe ---
  let contrast = 1.0;
  let sCurve = 0.0; // 0 = désactivé, jusqu'à 2 = courbe en S marquée

  // --- Couleur ---
  let saturation = 1.0;
  let vibrance = 0.0; // -100 à 100
  let hueShift = 0.0; // -180 à 180 degrés

  // IMPORTANT : Svelte détermine les dépendances d'un bloc `$:` par analyse
  // STATIQUE du code écrit DIRECTEMENT dans ce bloc. Appeler une fonction
  // externe (ex: allParams()) ne suffit pas : Svelte ne regarde pas à
  // l'intérieur de cette fonction pour savoir quelles variables elle lit.
  // Solution : construire un objet littéral qui référence chaque variable
  // directement ici, ce qui force Svelte à les tracker toutes.
  $: gradeParams = {
    inputSpace,
    temperature,
    tint,
    exposure,
    highlights,
    shadows,
    whites,
    blacks,
    lift,
    gamma,
    gain,
    contrast,
    sCurve,
    saturation,
    vibrance,
    hueShift,
  };

  $: if (isImageLoaded && gl && shaderProgram && gradeParams) {
    renderWebGL();
  }

  // 1. EXTRAIRE L'IMAGE
  function loadFrameFromAE() {
    if (!window.__adobe_cep__) {
      status = "Erreur: Ouvrez cette extension dans After Effects.";
      return;
    }

    status = "Extraction en cours...";
    const jsxScript =
      '(function(){ var comp = app.project.activeItem; if (!comp || !(comp instanceof CompItem)) { return "ERROR: Aucune comp active."; } var time = comp.time; var tempFile = new File(Folder.temp.absoluteURI + "/ae_temp_frame.png"); try { comp.saveFrameToPng(time, tempFile); return tempFile.fsName; } catch(e) { return "ERROR: " + e.toString(); } })();';

    csi.evalScript(jsxScript, (result) => {
      if (result === "EvalScript error." || result.startsWith("ERROR")) {
        status = result;
        return;
      }

      status = "Chargement...";
      const formattedPath = result.replace(/\\/g, "/");

      setTimeout(() => {
        try {
          if (!fs.existsSync(formattedPath)) return;
          const buffer = fs.readFileSync(formattedPath);
          if (buffer.length === 0) {
            status = "Erreur : Image vide.";
            return;
          }

          const base64Image = buffer.toString("base64");
          loadImageIntoWebGL(`data:image/png;base64,${base64Image}`);
        } catch (err) {
          status = "Erreur FS: " + err.message;
        }
      }, 150);
    });
  }

  function loadImageIntoWebGL(dataUrl) {
    const img = new Image();
    img.onload = () => {
      if (!gl) initWebGL();
      if (!gl) return;

      canvasEl.width = img.width;
      canvasEl.height = img.height;
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

      if (texture) gl.deleteTexture(texture);
      texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

      isImageLoaded = true;
      status = "Prêt pour l'étalonnage";
      renderWebGL();
    };
    img.src = dataUrl;
  }

  // 2. MOTEUR WEBGL
  function initWebGL() {
    gl =
      canvasEl.getContext("webgl") || canvasEl.getContext("experimental-webgl");
    if (!gl) return;

    const vsSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = vec2(a_texCoord.x, 1.0 - a_texCoord.y); 
      }
    `;

    const fsSource = `
      precision mediump float;
      varying vec2 v_texCoord;
      uniform sampler2D u_image;

      uniform float u_inputSpace;

      uniform float u_temperature;
      uniform float u_tint;

      uniform float u_exposure;
      uniform float u_highlights;
      uniform float u_shadows;
      uniform float u_whites;
      uniform float u_blacks;

      uniform float u_lift;
      uniform float u_gamma;
      uniform float u_gain;

      uniform float u_contrast;
      uniform float u_sCurve;

      uniform float u_saturation;
      uniform float u_vibrance;
      uniform float u_hueShift;

      vec3 slog3ToLinear(vec3 x) {
        vec3 result;
        for (int i = 0; i < 3; i++) {
          float v = x[i];
          if (v >= 171.2102946929/1023.0) {
            result[i] = (pow(10.0, (v*1023.0 - 420.0) / 261.5) * (0.18 + 0.01)) - 0.01;
          } else {
            result[i] = (v*1023.0 - 95.0) * 0.01125 / (171.2102946929 - 95.0);
          }
        }
        return max(result, vec3(0.0));
      }

      vec3 vlogToLinear(vec3 x) {
        float cutInv = 0.181, b = 0.00873, c = 0.241514, d = 0.598206;
        vec3 result;
        for (int i = 0; i < 3; i++) {
          float v = x[i];
          if (v >= cutInv) {
            result[i] = pow(10.0, (v - d) / c) - b;
          } else {
            result[i] = (v - 0.125) / 5.6;
          }
        }
        return max(result, vec3(0.0));
      }

      vec3 rgb2hsv(vec3 c) {
        vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);
        vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
        vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
        float d = q.x - min(q.w, q.y);
        float e = 1.0e-10;
        return vec3(abs(q.z + (q.w - q.y) / (6.0*d + e)), d / (q.x + e), q.x);
      }

      vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
      }

      vec3 applySCurve(vec3 x, float strength) {
        vec3 s1 = x*x*(3.0 - 2.0*x);
        if (strength <= 1.0) {
          return mix(x, s1, strength);
        }
        vec3 s2 = s1*s1*(3.0 - 2.0*s1);
        return mix(s1, s2, strength - 1.0);
      }

      float maskShadows(float l) { return 1.0 - smoothstep(0.0, 0.5, l); }
      float maskHighlights(float l) { return smoothstep(0.5, 1.0, l); }
      float maskWhites(float l) { return smoothstep(0.75, 1.0, l); }
      float maskBlacks(float l) { return 1.0 - smoothstep(0.0, 0.25, l); }

      void main() {
        vec4 color = texture2D(u_image, v_texCoord);

        // A. Color Space Transform (CST)
        if (u_inputSpace == 1.0) {
          color.rgb = slog3ToLinear(color.rgb);
          color.rgb = pow(color.rgb, vec3(1.0/2.4));
        } else if (u_inputSpace == 2.0) {
          color.rgb = vlogToLinear(color.rgb);
          color.rgb = pow(color.rgb, vec3(1.0/2.4));
        }

        // B. Balance des blancs
        float t = u_temperature * 0.01;
        float ti = u_tint * 0.01;
        color.r *= (1.0 + t * 0.3);
        color.b *= (1.0 - t * 0.3);
        color.g *= (1.0 + ti * 0.3);
        color.rgb = max(color.rgb, vec3(0.0));

        // C. Exposition
        color.rgb *= pow(2.0, u_exposure);

        // D. Highlights / Shadows / Whites / Blacks
        float luma = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        color.rgb += vec3(u_shadows * 0.01) * maskShadows(luma);
        color.rgb += vec3(u_highlights * 0.01) * maskHighlights(luma);
        color.rgb += vec3(u_whites * 0.01) * maskWhites(luma);
        color.rgb += vec3(u_blacks * 0.01) * maskBlacks(luma);
        color.rgb = max(color.rgb, vec3(0.0));

        // E. Primaries (CDL)
        color.rgb = (color.rgb * u_gain) + u_lift;
        color.rgb = max(color.rgb, vec3(0.0));
        color.rgb = pow(color.rgb, vec3(1.0 / max(u_gamma, 0.001)));

        // F. Contraste + Courbe en S
        color.rgb = (color.rgb - 0.5) * max(u_contrast, 0.0) + 0.5;
        color.rgb = clamp(color.rgb, 0.0, 1.0);
        if (u_sCurve > 0.001) {
          color.rgb = applySCurve(color.rgb, u_sCurve);
        }

        // G. Saturation + Vibrance
        float lum2 = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        color.rgb = mix(vec3(lum2), color.rgb, u_saturation);

        float maxc = max(color.r, max(color.g, color.b));
        float minc = min(color.r, min(color.g, color.b));
        float currentSat = maxc - minc;
        float vibAmt = (u_vibrance * 0.01) * (1.0 - currentSat);
        color.rgb = mix(vec3(lum2), color.rgb, 1.0 + vibAmt);

        // H. Décalage de teinte
        if (abs(u_hueShift) > 0.001) {
          vec3 hsv = rgb2hsv(clamp(color.rgb, 0.0, 1.0));
          hsv.x = fract(hsv.x + u_hueShift / 360.0);
          color.rgb = hsv2rgb(hsv);
        }

        gl_FragColor = vec4(clamp(color.rgb, 0.0, 1.0), color.a);
      }
    `;

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    gl.useProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(shaderProgram));
    }

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0,
      ]),
      gl.STATIC_DRAW,
    );

    positionLocation = gl.getAttribLocation(shaderProgram, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0,
      ]),
      gl.STATIC_DRAW,
    );

    texCoordLocation = gl.getAttribLocation(shaderProgram, "a_texCoord");
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
  }

  function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Shader compile error:", gl.getShaderInfoLog(shader));
    }
    return shader;
  }

  function u(name) {
    return gl.getUniformLocation(shaderProgram, name);
  }

  function renderWebGL() {
    if (!gl) return;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniform1f(u("u_inputSpace"), inputSpace);

    gl.uniform1f(u("u_temperature"), temperature);
    gl.uniform1f(u("u_tint"), tint);

    gl.uniform1f(u("u_exposure"), exposure);
    gl.uniform1f(u("u_highlights"), highlights);
    gl.uniform1f(u("u_shadows"), shadows);
    gl.uniform1f(u("u_whites"), whites);
    gl.uniform1f(u("u_blacks"), blacks);

    gl.uniform1f(u("u_lift"), lift);
    gl.uniform1f(u("u_gamma"), gamma);
    gl.uniform1f(u("u_gain"), gain);

    gl.uniform1f(u("u_contrast"), contrast);
    gl.uniform1f(u("u_sCurve"), sCurve);

    gl.uniform1f(u("u_saturation"), saturation);
    gl.uniform1f(u("u_vibrance"), vibrance);
    gl.uniform1f(u("u_hueShift"), hueShift);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  // ---------------------------------------------------------------------
  // APPLICATION AU CALQUE — via Lumetri Color (natif, toujours présent).
  // On abandonne l'approche LUT .cube / "Apply Color LUT" qui s'est avérée
  // peu fiable selon les versions d'AE. Lumetri > Basic Correction expose
  // Temperature/Tint/Exposure/Highlights/Shadows/Whites/Blacks/Saturation/
  // Vibrance — un mapping quasi direct avec nos sliders.
  //
  // Le Color Space Transform (log→linéaire) n'est PAS appliqué ici :
  // utilise "Color Profile Converter" toi-même sur le calque pour ça,
  // c'est plus fiable que notre approximation et tu as déjà cet effet
  // sous la main. inputSpace ne sert qu'à la preview live dans ce panel.
  //
  // La courbe en S n'a pas d'équivalent direct dans Basic Correction ;
  // elle est repliée en un boost de Contraste supplémentaire (approximatif).
  // Le décalage de teinte (Hue) n'est pas appliqué nativement (pas de
  // contrôle stable équivalent dans Basic Correction) : reste preview-only.
  // ---------------------------------------------------------------------

  async function applyToTimeline() {
    if (!window.__adobe_cep__) return;
    if (isApplying) return;

    isApplying = true;
    status = "Application du grade (Lumetri)...";

    // Contraste effectif = contraste manuel + approximation de la courbe en S
    const effectiveContrast = (contrast - 1) * 100 + sCurve * 15;

    const jsxApply = `
      (function(){
        app.beginUndoGroup("Excalibur Color Grade");
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) { app.endUndoGroup(); return "ERROR: Aucune composition active."; }
        if (comp.selectedLayers.length === 0) { app.endUndoGroup(); return "ERROR: Sélectionnez un calque."; }

        var layer = comp.selectedLayers[0];
        var lumetri;
        try {
          lumetri = layer.Effects.property("ADBE Lumetri");
          if (!lumetri) lumetri = layer.Effects.addProperty("ADBE Lumetri");
        } catch(e) {
          app.endUndoGroup();
          return "ERROR: Impossible d'ajouter Lumetri Color (" + e.toString() + ")";
        }

        var applied = [];
        var skipped = [];

        function trySet(propName, value) {
          try {
            lumetri.property("Basic Correction").property(propName).setValue(value);
            applied.push(propName);
          } catch(e) {
            try {
              // Fallback : certaines versions/langues exposent les props
              // directement à la racine de l'effet plutôt que sous un groupe.
              lumetri.property(propName).setValue(value);
              applied.push(propName);
            } catch(e2) {
              skipped.push(propName);
            }
          }
        }

        trySet("Temperature", ${temperature});
        trySet("Tint", ${tint});
        trySet("Exposure", ${exposure});
        trySet("Contrast", ${effectiveContrast});
        trySet("Highlights", ${highlights});
        trySet("Shadows", ${shadows});
        trySet("Whites", ${whites});
        trySet("Blacks", ${blacks});
        trySet("Saturation", ${saturation * 100});
        trySet("Vibrance", ${vibrance});

        app.endUndoGroup();
        return "SUCCESS|" + applied.join(",") + "|" + skipped.join(",");
      })();
    `;

    csi.evalScript(jsxApply, (res) => {
      isApplying = false;
      if (res.startsWith("ERROR")) {
        status = res;
        return;
      }
      const parts = res.split("|");
      const skippedList = parts[2] || "";
      if (skippedList) {
        status =
          "Grade appliqué. Non réglés (noms de propriété différents dans ta version d'AE) : " +
          skippedList;
      } else {
        status = "Grade appliqué avec succès sur Lumetri Color !";
      }
    });
  }

  function resetAll() {
    inputSpace = 0;
    temperature = 0;
    tint = 0;
    exposure = 0;
    highlights = 0;
    shadows = 0;
    whites = 0;
    blacks = 0;
    lift = 0;
    gamma = 1;
    gain = 1;
    contrast = 1;
    sCurve = 0;
    saturation = 1;
    vibrance = 0;
    hueShift = 0;
  }
</script>

<div class="tab-view responsive-layout">
  <header>
    <h1>Color Room</h1>
    <div class="header-btns">
      <button class="btn-secondary" on:click={loadFrameFromAE}
        >Extraire Image</button
      >
      <button
        class="btn-primary"
        on:click={applyToTimeline}
        disabled={!isImageLoaded || isApplying}
        >{isApplying ? "..." : "Appliquer au Calque"}</button
      >
    </div>
  </header>

  <p class="status">{status}</p>

  <div class="workspace">
    <div class="viewer">
      <canvas bind:this={canvasEl}></canvas>
      {#if !isImageLoaded}
        <div class="placeholder">Aucune image chargée</div>
      {/if}
    </div>

    <div class="controls-panel" class:disabled={!isImageLoaded}>
      <div class="control-section">
        <label for="input-space">Input Color Space</label>
        <select id="input-space" bind:value={inputSpace}>
          <option value={0}>Rec.709 (Standard)</option>
          <option value={1}>Sony S-Log3</option>
          <option value={2}>Panasonic V-Log</option>
        </select>
      </div>

      <details open>
        <summary>Balance des Blancs</summary>
        <div class="control-grid">
          <div class="slider-group">
            <label>Température <span>{temperature.toFixed(0)}</span></label>
            <input
              type="range"
              min="-100"
              max="100"
              step="1"
              bind:value={temperature}
            />
          </div>
          <div class="slider-group">
            <label>Teinte <span>{tint.toFixed(0)}</span></label>
            <input
              type="range"
              min="-100"
              max="100"
              step="1"
              bind:value={tint}
            />
          </div>
        </div>
      </details>

      <details open>
        <summary>Tonalité</summary>
        <div class="control-grid">
          <div class="slider-group">
            <label>Exposition <span>{exposure.toFixed(2)}</span></label>
            <input
              type="range"
              min="-3"
              max="3"
              step="0.05"
              bind:value={exposure}
            />
          </div>
          <div class="slider-group">
            <label>Hautes lumières <span>{highlights.toFixed(0)}</span></label>
            <input
              type="range"
              min="-100"
              max="100"
              step="1"
              bind:value={highlights}
            />
          </div>
          <div class="slider-group">
            <label>Ombres <span>{shadows.toFixed(0)}</span></label>
            <input
              type="range"
              min="-100"
              max="100"
              step="1"
              bind:value={shadows}
            />
          </div>
          <div class="slider-group">
            <label>Blancs <span>{whites.toFixed(0)}</span></label>
            <input
              type="range"
              min="-100"
              max="100"
              step="1"
              bind:value={whites}
            />
          </div>
          <div class="slider-group">
            <label>Noirs <span>{blacks.toFixed(0)}</span></label>
            <input
              type="range"
              min="-100"
              max="100"
              step="1"
              bind:value={blacks}
            />
          </div>
        </div>
      </details>

      <details open>
        <summary>Roues Primaires (CDL)</summary>
        <div class="control-grid">
          <div class="slider-group">
            <label>Lift (Shadows) <span>{lift.toFixed(2)}</span></label>
            <input
              type="range"
              min="-0.5"
              max="0.5"
              step="0.01"
              bind:value={lift}
            />
          </div>
          <div class="slider-group">
            <label>Gamma (Mids) <span>{gamma.toFixed(2)}</span></label>
            <input
              type="range"
              min="0.1"
              max="2.0"
              step="0.01"
              bind:value={gamma}
            />
          </div>
          <div class="slider-group">
            <label>Gain (Highlights) <span>{gain.toFixed(2)}</span></label>
            <input
              type="range"
              min="0.0"
              max="2.0"
              step="0.01"
              bind:value={gain}
            />
          </div>
        </div>
      </details>

      <details open>
        <summary>Contraste &amp; Courbe</summary>
        <div class="control-grid">
          <div class="slider-group">
            <label>Contraste <span>{contrast.toFixed(2)}</span></label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.01"
              bind:value={contrast}
            />
          </div>
          <div class="slider-group">
            <label>Courbe en S <span>{sCurve.toFixed(2)}</span></label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.01"
              bind:value={sCurve}
            />
          </div>
        </div>
      </details>

      <details open>
        <summary>Couleur</summary>
        <div class="control-grid">
          <div class="slider-group">
            <label>Saturation <span>{saturation.toFixed(2)}</span></label>
            <input
              type="range"
              min="0"
              max="3"
              step="0.01"
              bind:value={saturation}
            />
          </div>
          <div class="slider-group">
            <label>Vibrance <span>{vibrance.toFixed(0)}</span></label>
            <input
              type="range"
              min="-100"
              max="100"
              step="1"
              bind:value={vibrance}
            />
          </div>
          <div class="slider-group">
            <label>Teinte (Hue) <span>{hueShift.toFixed(0)}°</span></label>
            <input
              type="range"
              min="-180"
              max="180"
              step="1"
              bind:value={hueShift}
            />
          </div>
        </div>
      </details>

      <button class="reset-btn" on:click={resetAll}>
        Réinitialiser le Grade
      </button>
    </div>
  </div>
</div>

<style lang="scss">
  .responsive-layout {
    display: flex;
    flex-direction: column;
    height: 100vh;
    min-width: 260px;
    padding: 10px;
    box-sizing: border-box;
    background-color: #1e1e1e;
    color: #e0e0e0;
    overflow: hidden;
  }

  .workspace {
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: 15px;
    overflow: hidden;
    min-height: 0;

    @media (min-width: 600px) {
      flex-direction: row;
    }
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    flex-shrink: 0;

    h1 {
      margin: 0;
      font-size: 1.2rem;
      color: #fff;
      white-space: nowrap;
    }

    .header-btns {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      flex: 1 1 auto;
      justify-content: flex-end;
    }

    button {
      padding: 6px 10px;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      font-weight: bold;
      font-size: 0.8rem;
      white-space: nowrap;
      transition: filter 0.2s;

      &:hover {
        filter: brightness(1.2);
      }
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .btn-secondary {
      background-color: #333;
      color: white;
      border: 1px solid #555;
    }
    .btn-primary {
      background-color: var(--activeColour, #e33b6b);
      color: white;
    }
  }

  .status {
    font-size: 0.75rem;
    color: #999;
    margin: 5px 0 10px;
    flex-shrink: 0;
    overflow-wrap: break-word;
  }

  .viewer {
    flex: 1 1 auto;
    background: #111;
    position: relative;
    border: 1px solid #333;
    border-radius: 8px;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 150px;
    overflow: hidden;

    canvas {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .placeholder {
      position: absolute;
      color: #555;
      font-style: italic;
      font-size: 0.85rem;
      text-align: center;
      padding: 0 10px;
    }
  }

  .controls-panel {
    flex: 0 0 auto;
    width: 100%;
    max-height: 55%;
    overflow-y: auto;
    background: #252525;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid #333;
    box-sizing: border-box;
    transition: opacity 0.3s;

    &.disabled {
      opacity: 0.3;
      pointer-events: none;
    }

    @media (min-width: 600px) {
      width: 300px;
      max-height: 100%;
      flex-shrink: 0;
    }
  }

  .controls-panel::-webkit-scrollbar {
    width: 6px;
  }
  .controls-panel::-webkit-scrollbar-thumb {
    background-color: #555;
    border-radius: 3px;
  }

  .control-section {
    margin-bottom: 12px;

    label {
      display: block;
      font-size: 0.78rem;
      color: #aaa;
      margin-bottom: 5px;
    }

    select {
      width: 100%;
      background: #111;
      color: #fff;
      border: 1px solid #444;
      padding: 6px;
      border-radius: 4px;
      font-family: inherit;
      font-size: 0.8rem;
    }
  }

  details {
    margin-bottom: 10px;
    border-bottom: 1px solid #333;
    padding-bottom: 8px;

    &:last-of-type {
      border-bottom: none;
    }

    summary {
      font-size: 0.8rem;
      font-weight: bold;
      color: #ddd;
      cursor: pointer;
      padding: 4px 0;
      list-style: none;
      display: flex;
      align-items: center;

      &::-webkit-details-marker {
        display: none;
      }

      &::before {
        content: "▸";
        display: inline-block;
        margin-right: 6px;
        color: var(--activeColour, #e33b6b);
        transition: transform 0.15s;
      }
    }

    &[open] summary::before {
      transform: rotate(90deg);
    }
  }

  .control-grid {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 8px;

    @media (min-width: 420px) and (max-width: 599px) {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 14px;
    }
  }

  .slider-group {
    min-width: 0;

    label {
      display: flex;
      justify-content: space-between;
      font-size: 0.78rem;
      color: #bbb;
      margin-bottom: 5px;
      white-space: nowrap;
      overflow: hidden;

      span {
        color: var(--activeColour, #e33b6b);
        font-family: monospace;
        flex-shrink: 0;
        margin-left: 6px;
      }
    }

    input[type="range"] {
      -webkit-appearance: none;
      width: 100%;
      background: transparent;

      &::-webkit-slider-thumb {
        -webkit-appearance: none;
        height: 14px;
        width: 14px;
        border-radius: 50%;
        background: #fff;
        cursor: pointer;
        margin-top: -5px;
        box-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
      }

      &::-webkit-slider-runnable-track {
        width: 100%;
        height: 4px;
        cursor: pointer;
        background: #444;
        border-radius: 2px;
      }
    }
  }

  .reset-btn {
    width: 100%;
    background: #333;
    color: #ccc;
    border: 1px solid #555;
    padding: 8px;
    border-radius: 4px;
    margin-top: 12px;
    cursor: pointer;
    font-size: 0.8rem;

    &:hover {
      background: #444;
      color: white;
    }
  }
</style>
