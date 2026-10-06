<script>
  import { createEventDispatcher } from "svelte";
  import { slide } from "svelte/transition";
  import { t, ht } from "../../../i18n.js";

  export let open = false;
  export let duration = 300;
  const dispatch = createEventDispatcher();
  const close = () => dispatch("close");

  const sections = [
    {
      id: "navigation",
      title: "Navigation & Sidebar",
      rows: [
        {
          title: "Main Navigation",
          lines: [
            "Click the <span>Excalibur FX logo</span> at the top of the sidebar to open or close the Dashboard overlay. The Dashboard contains the <span>Informations</span>, <span>Notes</span>, and <span>Credits</span> pages.",
            "Select a sidebar tab to open that tool. Selecting a tool while the Dashboard is open closes the overlay and switches to the selected tab. <span>Settings</span> has a dedicated button and cannot be hidden.",
            "In Settings, <span>Manage Menus</span> toggles the visibility of Curve, Workflow, Effects, Colors, SFX, Scripts, and FFMPEG. Hidden tabs can be shown again from the same menu.",
            "<span>Collapse / Expand</span> switches the sidebar between full labels and compact icons. Hover over the volume control to open its slider; this adjusts interface and notification sounds, not SFX preview volume.",
            "Sidebar buttons play a click sound when interface volume is above 0%. The optional <span>FPS</span> readout is enabled in Settings.",
          ],
        },
      ],
    },
    {
      id: "dashboard",
      title: "Dashboard",
      rows: [
        {
          title: "Informations & News",
          lines: [
            "The <span>Status</span> indicator reports whether the extension can reach the internet. The status is checked periodically; update and release notices appear in the scrollable news feed.",
            "Use the Dashboard sub-menu to switch between <span>Informations</span>, <span>Notes</span>, and <span>Credits</span>.",
          ],
        },
        {
          title: "Notes",
          lines: [
            "Type plain-text notes in the editor. Notes are saved automatically as you type; the gutter shows line numbers and highlights the line containing the cursor.",
            "Click <span>Clear Notes</span> to erase and save an empty note. A text filter replaces blocked words with a polite reminder.",
            "Type <span>/</span> followed by a command to open the theme command menu. Filter the suggestions by typing; use <span>Up</span>/<span>Down</span> to choose, <span>Enter</span> to run, and <span>Escape</span> to dismiss.",
            "<span>/theme-off</span> turns seasonal themes off. <span>/theme-auto</span> enables automatic seasonal themes. <span>/theme-reset</span> turns the current theme off and restores automatic mode as the default.",
            "Choose a fixed theme with <span>/theme-noel</span> (Christmas), <span>/theme-printemps</span> (Spring), <span>/theme-ete</span> (Summer), <span>/theme-automne</span> (Autumn), <span>/theme-fetes</span> (Festive), or <span>/theme-chat</span> (Cat). Running a command removes its slash command text from the note.",
          ],
        },
        {
          title: "Credits & Easter Eggs",
          lines: [
            "The Credits page lists the developer, acknowledgements, license, and technologies, and includes a copyable Instagram profile link for <span>@mallaubrl_</span>. It also contains several hidden Easter eggs.",
            "The Easter eggs are three mini-games: <span>Cookie Clicker</span>, <span>2048</span>, and <span>CatPillar</span>.",
            "<span>Cookie Clicker</span>: click the cookie to earn currency; buy buildings to increase passive income and upgrades to improve production. The header shows balance, total earned, income per second, and click power. Click the bonus cat when it appears; <span>Reset</span> restarts the game.",
            "<span>2048</span>: use the arrow keys or WASD/ZQSD to slide tiles; equal values merge and add to the score. <span>New Game</span> starts a fresh board while retaining the best score; <span>Clear Stats</span> clears saved records.",
            "<span>CatPillar</span>: press and hold to stretch the stick, then release to drop it and try to reach the next platform. Open <span>Settings</span> to adjust stretching, turning, walking, and falling speed (0.1x-5x), or enable Gamble Mode for larger bonuses with added risk. <span>Reset</span> clears the best score; <span>Reset speeds</span> restores movement defaults.",
          ],
        },
      ],
    },
    {
      id: "curves",
      title: "Curves",
      rows: [
        {
          title: "Curve Presets",
          lines: [
            "Click a preset to apply its easing curve to the selected keyframes. Right-click a preset to edit it.",
            "Click <span>New Curve</span> to draw and save a preset. In the editor, use <span>Save</span>, <span>Cancel</span>, or <span>Remove</span> to finish editing.",
            "Open <span>Options</span> to zoom the preset tiles in or out, toggle the <span>Copy/Paste</span> buttons, delete all presets, or close the toolbar.",
            "<span>Copy</span> stores the selected keyframes' curve; <span>Paste</span> applies the copied curve to another keyframe selection.",
          ],
        },
        {
          title: "Live Curve",
          lines: [
            "Drag the curve handles in the preview to shape easing for the selected keyframes. The value field displays the current curve coordinates.",
            "Click <span>Apply</span> to apply the live curve, or <span>Add as Preset</span> to save it in the preset grid.",
          ],
        },
      ],
    },
    {
      id: "workflow",
      title: "Workflow",
      rows: [
        {
          title: "Workflow",
          lines: [
            "<span>Transform</span>: choose one of nine anchor points; rotate selected layers by 15 degrees in either direction or reset rotation; scale to half size, double size, or fit the composition.",
            "<span>Frame blending</span>: enable or disable frame blending on selected layers. The two motion-blur buttons enable or disable motion blur throughout the composition and its nested compositions.",
            "<span>Layers</span>: create a Solid, Null, Text, Camera, or Adjustment Layer. New layers use the configured label color; cameras use the configured focal length.",
            "<span>Utilities</span>: trim the composition to the selected layers, enable or disable frame blending, and align selected layers' In or Out edge with the current-time indicator.",
            "<span>Time &amp; Precomp</span>: freeze the selected layer at the current frame, reverse its time, or change its stretch so its Out point reaches the current-time indicator while keeping its In point fixed.",
            "<span>Pre-compose All</span> combines the selected layers into one precomposition; <span>Pre-compose Each</span> creates a separate precomposition for each selected layer. <span>UnPre-compose</span> removes a precomposition.",
          ],
        },
      ],
    },
    {
      id: "effects",
      title: "Effects",
      rows: [
        {
          title: "Effects Builder",
          lines: [
            "<span>Effects Builder</span> provides one-click tools: Warp Stabilizer, 3D Camera Tracker, Auto Cut, and Auto Beat Mark. Click a tool's gear to set its options.",
            "<span>Warp Stabilizer</span>: choose a stabilization method and border treatment, adjust smoothness, and enable detailed or fast analysis.",
            "<span>3D Camera Tracker</span>: adjust track point size and enable detailed analysis. <span>Auto Cut</span> uses cut sensitivity; lower values detect more subtle changes.",
            "<span>Auto Beat Mark</span> detects bass and treble beats separately. Adjust each sensitivity; 60% uses automatic detection and 100% disables that band.",
            "<span>Utilities</span>: toggle external plugins, native effects, or all effects on the project; choose which group the toggle affects in its settings.",
            "<span>Create FX Control Rig</span> adds controls for effects on selected layers. Choose one null per effect or one shared null, and show all properties or only main sliders.",
            "<span>Copy 4 Ai</span> copies composition data for AI use. Choose whether to skip default values or disabled effects, and include transforms, effects and their settings, masks, text, styles, and nested compositions with a maximum scan depth.",
          ],
        },
        {
          title: "Effects Preset Library",
          lines: [
            "<span>Your Library</span> shows your saved After Effects presets and effects/plugins. Search the library to filter its items.",
            "Click <span>Add new</span> to search installed After Effects effects and presets. Click an item to add it to or remove it from your library; use <span>Cancel</span> to return.",
            "Click a library item to apply it. Enable <span>Apply on ADJ Layer</span> to apply effects to an adjustment layer instead of directly to the selected layer.",
            "<span>The info button</span> shows the preset folder and counts for loaded effects, presets, and saved library items. The trash button enables delete mode for removing library items.",
          ],
        },
      ],
    },
    {
      id: "colors",
      title: "Colors",
      rows: [
        {
          title: "Color Picker",
          lines: [
            "<span>Choose a harmony</span> (<span>Monochromatic</span>, <span>Analogous</span>, <span>Complementary</span>, <span>Triadic</span>, or <span>Tetradic</span>) or a color preset (<span>Blue</span>, <span>Green</span>, <span>Red</span>, <span>Orange/Yellow</span>, <span>Purple</span>, <span>Pink</span>, <span>Brown</span>, or <span>Neutrals</span>). In harmony mode, drag inside the chromatic wheel to set hue and saturation; drag the surrounding ring to adjust luminosity.",
            "<span>The palette</span> displays the generated colors. Click a swatch to copy its HEX value; turn on the bottom switch to apply the selected color as a Fill effect to the selected layer.",
            "<span>The HEX display</span> shows the selected color. Use the invert button to swap the positions of the wheel and palette.",
          ],
        },
        {
          title: "Panel Options",
          lines: [
            "<span>Manage Menus</span> shows or hides navigation tabs. <span>Layer Colors</span> opens color pickers for each layer type.",
            "<span>Cam Lenght Val</span> sets the default camera focal length (1-300). <span>SFX volume</span> sets the preview volume.",
            "<span>Apply on adjustment layer</span> applies library effects to an adjustment layer. <span>Create layer on each selected</span> creates a corresponding layer for every selected item.",
            "<span>Enable SFX preview</span> controls sound previews; <span>Compact sidebar</span> reduces sidebar width; <span>Show FPS</span> displays the frame-rate counter.",
            "<span>The help icon</span> opens this guide. The folder icon opens the Excalibur data folder; the website icon copies the website address. <span>Support me</span> opens the support page.",
          ],
        },
      ],
    },
    {
      id: "sfx",
      title: "SFX",
      rows: [
        {
          title: "SFX Builder",
          lines: [
            "Click <span>Fade In</span> or <span>Fade Out</span> to add the corresponding audio keyframes. Open its gear to adjust fade duration and level in dB.",
            "<span>Lower</span> creates a volume dip around the playhead. Set the reduction in dB and keyframe spacing; the outer keyframes keep the original level while the center keyframe lowers it.",
            "Add frequency effects with <span>LowPass Filter</span>, <span>HighPass Filter</span>, <span>Bass &amp; Treble</span>, or <span>Parametric EQ</span>.",
            "Add spatial or modulation effects with <span>Reverb</span>, <span>Delay</span>, or <span>Stereo Mixer</span>.",
          ],
        },
        {
          title: "SFX Library",
          lines: [
            "<span>• Browse the folder tree or choose <span>Everything</span></span>; use the star button to show favorites only. Search by sound name in the main panel.",
            "<span>• Click a sound to add it to the timeline</span>. Right-click a sound or click its star to toggle its favorite; use the rename button to rename it.",
            "<span>• Click <span>Add</span> to add a custom sound folder</span>. Custom folders can be renamed or removed; use the gear menu to configure playback and deletion.",
            "<span>• <span>Enable hover preview</span> previews sounds under the pointer</span>; adjust <span>Preview volume</span> and optionally enable <span>Loop preview</span>.",
            "<span>• <span>Confirm folder deletion</span> controls deletion confirmation</span>. <span>Timeline Insertion Mode</span> places sounds at the current cursor, at the highest audio peak, or at the nearest marker.",
          ],
        },
      ],
    },
    {
      id: "script",
      title: "Scripts",
      rows: [
        {
          title: "Scripts Library",
          lines: [
            "<span>• Select a category and search by name or description to filter scripts</span>. Use the star button to switch between all scripts and favorites.",
            "<span>• Click a script to apply it</span>. Open its settings to adjust parameter sliders, preview the generated expression, apply it, or delete a custom script.",
            "<span>• Click <span>New Script</span> to create an expression</span>: enter a name, category, and description; add variables with an ID, UI label, minimum, maximum, and default value.",
            "<span>• Enter the expression in <span>Script Code</span></span> and use <span>{{variableID}}</span> wherever a variable should control the expression. Click <span>Save Custom Script</span> to save, or <span>Cancel</span> to leave the editor.",
          ],
        },
      ],
    },
    {
      id: "shakes",
      title: "Shakes",
      rows: [
        {
          title: "Shake Presets",
          lines: [
            "Dans <span>Presets</span>, sélectionnez un preset pour l'appliquer au calque sélectionné. Survolez un preset pour prévisualiser son mouvement ; les réglages généraux contrôlent la force et la vitesse.",
            "Les presets couvrent les mouvements Basic, Bouncy, Minimax, Fast, Long, Horizontal, Flickers, Lens, Waves, Glitch, Invert, Spike, Skew et Sketch. Le preset choisi est appliqué avec les options de création et de flash configurées.",
          ],
        },
        {
          title: "Shake Builder",
          lines: [
            "Ouvrez <span>Custom</span>, puis cliquez sur <span>+</span> pour créer un shake. Dans l'onglet <span>Shake</span>, réglez le déplacement X/Y, la rotation, le zoom punch, le nombre de rebonds, l'atténuation et la durée.",
            "<span>Placement</span> définit le point de départ : début du calque, temps de la composition ou fin du calque. <span>Create at comp time</span> crée le shake au temps courant de la composition.",
            "Dans l'onglet <span>Blur</span>, réglez la quantité et l'atténuation du flou. <span>Auto angle</span> suit automatiquement la direction du mouvement ; désactivez-le pour choisir manuellement l'angle.",
            "Dans l'onglet <span>Effects</span>, capturez les effets du calque sélectionné ou recherchez un effet par nom. Ouvrez chaque effet pour modifier ses propriétés ; activez ou désactivez un effet avec sa case à cocher.",
            "Utilisez <span>Flash</span> pour ajouter un flash avec une durée et une force réglables. Enregistrez le shake avec son nom ; utilisez <span>Back</span> pour revenir à la liste et l'icône corbeille pour supprimer un shake personnalisé.",
          ],
        },
      ],
    },
    {
      id: "ffmpeg",
      title: "FFMPEG",
      rows: [
        {
          title: "Chain Builder",
          lines: [
            "<span>• Click <span>Add block</span></span>, search the block list, then select a block to add it to the processing chain. Expand a block to edit its parameters; use its remove button to delete it.",
            "• <span>Format</span>: convert to MP4, MOV, AVI, WEBM, MKV, or GIF. <span>Geometry</span>: resize by percentage or custom width and height, crop by size and X/Y offset, rotate by 90/180/270 degrees, flip horizontally or vertically, add colored letterbox padding, mirror either axis, or draw a box using position, size, color, and thickness.",
            "• <span>Timing</span>: set trim start and duration, output frame rate, playback speed, reverse, loop count, and video fade-in/fade-out duration. <span>Image</span>: adjust contrast, brightness, saturation, gamma, hue, sharpness, denoising, blur, vignette, grayscale, sepia, exposure, deinterlacing, chroma key color/tolerance/blend, text/size/color/position, stabilization, or pixel block size.",
            "• <span>Encoding</span>: set video bitrate or CRF quality, encoding speed, keyframe interval, video codec (H.264, H.265/HEVC, ProRes, VP9, AV1, or MPEG-4), audio codec (AAC, MP3, Opus, PCM 16-bit, or copy source), and pixel format (YUV 4:2:0, YUV 4:2:2, YUV 4:4:4, or RGB 24-bit).",
            "• <span>Audio</span>: keep, remove, or extract audio; adjust volume, fade-in/fade-out, loudness normalization, sample rate (22050-96000 Hz), mono/stereo channels, high/low-pass frequency and order, compressor threshold/ratio/attack/release/makeup, audio bitrate, pitch, echo delay/decay, and tremolo frequency/depth.",
            "• Click <span>Render</span> with a video-source layer selected to process the chain; the output is written beside the source video. <span>Save as preset</span> stores the chain for reuse; <span>Clear all blocks</span> empties it. Changes to the chain are saved automatically.",
          ],
        },
        {
          title: "Presets",
          lines: [
            "• Search saved presets by name. Each preset shows the number of blocks it contains.",
            "• Click a preset to load its blocks into the chain, then edit the chain or render it. Save a chain from the Chain Builder using <span>Save as preset</span> and enter a name.",
            "• Use the trash button to enable delete mode, then click a preset to remove it. Click <span>Cancel</span> in the save field to abandon saving a preset.",
          ],
        },
      ],
    },
    {
      id: "setting",
      title: "Settings",
      rows: [
        {
          title: "Preferences & Project Shortcuts",
          lines: [
            "<span>UI color</span> changes the interface hue. Enable <span>RGB mode</span> to cycle colors and adjust its speed; set <span>UI saturation</span> independently.",
            "<span>Disable all icon animations</span> turns off animated icons. <span>Animation Speed</span> adjusts interface transitions from 0 to 500 ms.",
            "<span>Enable Discord RPC</span> controls Discord Rich Presence and is unavailable while offline.",
            "<span>Reset</span> restores preferences and reloads the extension. <span>Restart EbFX</span> reloads it without resetting preferences. <span>Clear Ae Disk Cache</span> clears After Effects' disk cache.",
            "<span>Open in a new instance</span> creates an incremental project save. <span>Delete unused items</span> removes unused project items; <span>Sort Project</span> sorts the project.",
            "<span>Manage Menus</span> shows or hides every tab: Curve, Workflow, Effects, Colors, SFX, Scripts, Shakes, and FFMPEG. Settings always remains available.",
            "<span>Layer Colors</span> opens color pickers for each layer type. Selected colors are used when new layers are created.",
            "<span>Cam Length Val</span> sets the default camera focal length (1-300). <span>SFX volume</span> controls sound preview volume.",
            "<span>Apply on adjustment layer</span> applies library effects to an adjustment layer. <span>Create layer on each selected</span> creates one layer for every selected item.",
            "<span>Vertical mode</span> places the sidebar at the bottom of the extension. <span>Row</span> and <span>Column</span> change the sidebar layout. <span>Show FPS</span> displays the frame-rate counter.",
            "The help icon opens this guide, the folder icon opens the Excalibur data folder, and the website icon opens the official website. The language button appears in the initial setup dialog.",
            "To change the language after installation, open <span>Documents/Excalibur/preferences.json</span>, change <span>\"language\"</span> to <span>en</span>, <span>fr</span>, <span>es</span>, <span>de</span>, or <span>hi</span>, then restart the extension. The file may be incorrectly called “preference.ebfx”; ExcaliburFX actually uses <span>preferences.json</span>.",
          ],
        },
      ],
    },
  ];

  let openSections = { settings: true };

  function toggleSection(id) {
    openSections = { ...openSections, [id]: !openSections[id] };
  }
</script>

<div
  id="HowToUseExcalibur"
  data-i18n-skip
  class:open
  aria-hidden={!open}
  style="--htu-ms: {duration}ms"
>
  <button
    type="button"
    class="closingbutton"
    aria-label={$t("Close")}
    on:click={close}>✕</button
  >

  <div class="htu-scroll">
    <h1>{$t("How to use")}</h1>

    {#each sections as section (section.id)}
      <div class="howtobg">
        <!-- Header cliquable de la section -->
        <div
          class="section-header"
          role="button"
          tabindex="0"
          on:click={() => toggleSection(section.id)}
          on:keydown={(e) =>
            (e.key === "Enter" || e.key === " ") && toggleSection(section.id)}
        >
          <h2>{$t(section.title)}</h2>

          <span
            class="chevron"
            class:open={openSections[section.id]}
            aria-hidden="true"
          ></span>
        </div>

        {#if openSections[section.id]}
          <div transition:slide={{ duration }}>
            <div class="normal_underlineHowToSec"></div>

            {#each section.rows as row, ri}
              <div class="doubleHowToSec">
                <div class="howtotextlayer">
                  {#if row.title}
                    <p class="ExtraBold">{$t(row.title)}</p>
                    <div class="normal_underline"></div>
                  {/if}
                  {#each row.lines as line, li}
                    <p>{@html $ht(`${section.id}.${ri}.${li}`, line)}</p>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  #HowToUseExcalibur {
    position: fixed;
    inset: 0;
    z-index: 9999999;
    background-color: #171717ac;
    backdrop-filter: blur(8px);
    font-family: "Museo Sans", sans-serif;
    color: #fff;

    transform: translateX(100%);
    opacity: 0;
    pointer-events: none;
    transition:
      transform var(--htu-ms, 300ms) cubic-bezier(0.7, 0, 0.3, 1),
      opacity var(--htu-ms, 300ms) cubic-bezier(0.7, 0, 0.3, 1);
  }
  #HowToUseExcalibur.open {
    transform: translateX(0);
    opacity: 1;
    pointer-events: auto;
  }

  .htu-scroll {
    height: 100%;
    overflow-y: scroll;
    overflow-x: hidden;
    scroll-behavior: smooth;
  }
  .htu-scroll::-webkit-scrollbar {
    width: 6px;
  }
  .htu-scroll::-webkit-scrollbar-track {
    background: rgb(37, 37, 37);
    border-radius: 3px;
  }
  .htu-scroll::-webkit-scrollbar-thumb {
    background: var(--activeColour);
    border-radius: 3px;
  }

  .closingbutton {
    position: absolute;
    top: 1.5vh;
    right: 3vw;
    z-index: 2;
    width: clamp(18px, 4vw, 28px);
    height: clamp(18px, 4vw, 28px);
    padding: 0;
    color: #fff;
    font-size: clamp(9px, 2vw, 14px);
    background: #313131;
    border: 0.1vh solid rgb(65, 65, 65);
    border-radius: 0.75vh;
    cursor: pointer;
    transition:
      background-color 0.15s ease,
      transform 0.15s ease;
  }
  .closingbutton:hover {
    background: var(--activeColour, #ff007f);
    transform: scale(1.08);
  }
  .closingbutton:active {
    transform: scale(0.92);
  }

  h1 {
    margin: 3vh auto;
    text-align: center;
    width: 100%;
    font-size: clamp(16px, 5vw, 40px);
    font-weight: bold;
    text-shadow: 0px 0px 7vw rgba(255, 255, 255, 0.526);
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    cursor: pointer;
    user-select: none;
    padding-bottom: 0.5vw;
  }
  .section-header:hover h2 {
    color: var(--activeColour, #ff007f);
  }

  h2 {
    margin: 0;
    text-align: center;
    font-size: clamp(12px, 3vw, 26px);
    font-weight: bolder;
    transition: color 0.2s ease;
  }

  .chevron {
    position: absolute;
    right: 1.5vw;
    width: clamp(10px, 2.5vw, 16px);
    aspect-ratio: 1;
    transition: transform 0.3s ease;
  }

  .chevron::before {
    content: "";
    display: block;
    width: 50%;
    height: 50%;
    margin: 10% auto 0;
    border-right: 2px solid var(--activeColour, #ff007f);
    border-bottom: 2px solid var(--activeColour, #ff007f);
    transform: rotate(45deg);
  }

  .chevron.open {
    transform: rotate(180deg);
  }

  .normal_underlineHowToSec {
    height: 1px;
    width: 100%;
    margin: 0.5vw auto 1vw;
    background: var(--activeColour, #ff007f);
  }
  .normal_underline {
    height: 0.6vh;
    width: 70%;
    background-color: var(--activeColour, #5bb8d4);
    border-radius: 0.5vh;
    margin: 0 auto 1.35vh auto;
    box-shadow: 0 0 10px var(--activeColour, #5bb8d4);
  }

  p {
    font-size: clamp(8px, 2vw, 16px);
    padding: 0.9vw 0;
    margin: 0 0 0 5%;
    font-weight: bold;
  }
  p :global(span) {
    font-size: inherit;
    font-weight: bolder;
    color: var(--activeColour, #ff007f);
    text-decoration: underline;
  }
  .ExtraBold {
    font-weight: 900;
    font-size: clamp(10px, 2.5vw, 20px);
    text-align: center;
    margin: 0 auto;
  }

  .howtobg {
    background-color: rgba(17, 17, 17, 0.703);
    border-radius: 0.75vh;
    border: 0.1vh solid rgb(65, 65, 65);
    width: 80%;
    padding: 2%;
    margin: 2vh auto;
    overflow: hidden;
  }

  .doubleHowToSec {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-items: center;
    margin: 2vw auto;
    width: 90%;
  }
</style>
