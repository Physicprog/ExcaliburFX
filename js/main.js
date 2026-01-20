var NotePadOpen = false;
var HelloIamRetarted = false;
var isDashboardOpenOnStart = true;
var panelAnimation = 'cubic-bezier(.7,0,.3,1)';
const waitForAnim = 200;
const opacityTimerIN = "opacity 300ms cubic-bezier(.7,0,.3,1)";
const opacityTimerOUT = "opacity 200ms cubic-bezier(.7,0,.3,1)";
const topTimerIN = "top 300ms cubic-bezier(.7,0,.3,1)";
const topTimerOUT = "top 200ms cubic-bezier(.7,0,.3,1)";
var margin_time_min = "margin 300ms cubic-bezier(.7,0,.3,1)";
var opacity_time = "opacity 300ms cubic-bezier(.7,0,.3,1)";
var top_time_min = "top 300ms cubic-bezier(.7,0,.3,1)";

var MenuTimeOut;
var MenuTimeOut2;
var MenuTimeOut3;
let NotetimeoutIDs = [];

const fs = require('fs');
const path = require('path');

// === FONCTIONS DE GESTION DES FICHIERS ET DOSSIERS ===

function getConfigPaths() {
    const cs = new CSInterface();
    const documentsFolder = cs.getSystemPath(SystemPath.MY_DOCUMENTS);
    const baseFolder = path.join(documentsFolder, 'Excalibur');

    return {
        baseFolder,
        assetsFolder: path.join(baseFolder, 'Assets'),
        settingsCurves: path.join(baseFolder, 'settingsCurves.json'),
        userConfig: path.join(baseFolder, 'userConfig.json'),
        notesFile: path.join(baseFolder, 'notes.txt')
    };
}

function readOrCreateUserConfig() {
    const paths = getConfigPaths();

    try {
        if (!fs.existsSync(paths.baseFolder)) {
            fs.mkdirSync(paths.baseFolder, { recursive: true });
        }

        if (!fs.existsSync(paths.userConfig)) {
            const initialConfig = {
                username: "",
                lastLogin: null,
                firstTime: true,
                sliders: {
                    hue: 250,
                    saturation: 80,
                    animationSpeed: 300
                }
            };

            fs.writeFileSync(
                paths.userConfig,
                JSON.stringify(initialConfig, null, 2),
                'utf-8'
            );
            return initialConfig;
        }

        const configData = fs.readFileSync(paths.userConfig, 'utf-8');
        let config = JSON.parse(configData);

        // Ensure sliders object exists with default values
        if (!config.sliders) {
            config.sliders = {
                hue: 250,
                saturation: 80,
                animationSpeed: 300
            };
            fs.writeFileSync(paths.userConfig, JSON.stringify(config, null, 2), 'utf-8');
        }

        return config;

    } catch (e) {
        console.error('readOrCreateUserConfig error:', e);
        return {
            username: "",
            lastLogin: null,
            firstTime: true,
            sliders: {
                hue: 250,
                saturation: 80,
                animationSpeed: 300
            }
        };
    }
}

function sanitizeUsername(username) {
    if (!username || typeof username !== 'string') {
        return '';
    }

    return username
        .trim()
        .replace(/[<>:"/\\|?*]/g, '') //supprimer les caractères interdits
        .replace(/\s+/g, '_') //remplacer les espaces par des underscores
        .substring(0, 20);
}

function updateUserConfig(newConfig) {
    const paths = getConfigPaths();

    try {
        if (!fs.existsSync(paths.baseFolder)) {
            fs.mkdirSync(paths.baseFolder, { recursive: true });
        }

        const currentConfig = readOrCreateUserConfig();

        const cleanedConfig = { ...newConfig };
        if (cleanedConfig.username) {
            cleanedConfig.username = sanitizeUsername(cleanedConfig.username);
        }

        const updatedConfig = {
            ...currentConfig,
            ...cleanedConfig,
            lastLogin: new Date().toISOString()
        };

        fs.writeFileSync(
            paths.userConfig,
            JSON.stringify(updatedConfig, null, 2),
            'utf-8'
        );

        console.log('User config updated successfully:', updatedConfig);
        return true;
    } catch (e) {
        console.error('updateUserConfig error:', e);
        return false;
    }
}

function hasValidUserSession() {
    try {
        // Vérifier d'abord si on peut accéder aux fonctions de fichier
        if (typeof getConfigPaths !== 'function' || typeof readOrCreateUserConfig !== 'function') {
            console.log('File functions not available');
            return false;
        }

        const userConfig = readOrCreateUserConfig();

        if (!userConfig) {
            console.log('No user config found');
            return false;
        }

        if (!userConfig.username || typeof userConfig.username !== 'string') {
            console.log('Invalid or missing username');
            return false;
        }

        const trimmedUsername = userConfig.username.trim();
        if (trimmedUsername === '' || trimmedUsername.length < 2) {
            console.log('Username too short or empty');
            return false;
        }

        if (userConfig.firstTime !== false) {
            console.log('First time user');
            return false;
        }

        return true;

    } catch (e) {
        console.error('hasValidUserSession error:', e);
        return false;
    }
}

function customFileReadOrCreate() {
    const paths = getConfigPaths();

    try {
        if (!fs.existsSync(paths.baseFolder)) {
            fs.mkdirSync(paths.baseFolder, { recursive: true });
        }
        if (!fs.existsSync(paths.assetsFolder)) {
            fs.mkdirSync(paths.assetsFolder, { recursive: true });
        }

        if (!fs.existsSync(paths.settingsCurves)) {
            const initialCurves = Array(20).fill(null).map((_, i) => ({
                id: i + 1,
                active: false,
                name: "",
                x1: 0.2,
                y1: 0.8,
                x2: 0.8,
                y2: 0.2
            }));

            fs.writeFileSync(
                paths.settingsCurves,
                JSON.stringify(initialCurves, null, 2),
                'utf-8'
            );
            return { curves: initialCurves };
        }

        const curvesData = fs.readFileSync(paths.settingsCurves, 'utf-8');
        let curves = JSON.parse(curvesData);

        if (!Array.isArray(curves) || curves.length !== 20) {
            curves = Array(20).fill(null).map((_, i) => ({
                id: i + 1,
                active: false,
                name: "",
                x1: 0.2,
                y1: 0.8,
                x2: 0.8,
                y2: 0.2
            }));
        } else {
            curves = curves.map((curve, i) => ({
                id: i + 1,
                active: curve?.active || false,
                name: curve?.name || "",
                x1: parseFloat(curve?.x1) || 0.2,
                y1: parseFloat(curve?.y1) || 0.8,
                x2: parseFloat(curve?.x2) || 0.8,
                y2: parseFloat(curve?.y2) || 0.2
            }));
        }

        return { curves };

    } catch (e) {
        console.error('customFileReadOrCreate error:', e);
        SendNotification('Error loading curves data', true, false);

        return {
            curves: Array(20).fill(null).map((_, i) => ({
                id: i + 1,
                active: false,
                name: "",
                x1: 0.2,
                y1: 0.8,
                x2: 0.8,
                y2: 0.2
            }))
        };
    }
}

function updateSettingsCurves(newCurves) {
    const paths = getConfigPaths();

    try {
        if (!fs.existsSync(paths.baseFolder)) {
            fs.mkdirSync(paths.baseFolder, { recursive: true });
        }

        const validatedCurves = newCurves.map((curve, i) => ({
            id: i + 1,
            active: Boolean(curve.active),
            name: String(curve.name || ""),
            x1: parseFloat(curve.x1) || 0,
            y1: parseFloat(curve.y1) || 0,
            x2: parseFloat(curve.x2) || 1,
            y2: parseFloat(curve.y2) || 1
        }));

        fs.writeFileSync(
            paths.settingsCurves,
            JSON.stringify(validatedCurves, null, 2),
            'utf-8'
        );

        return true;
    } catch (e) {
        console.error('updateSettingsCurves error:', e);
        SendNotification('Error saving curves', true, false);
        return false;
    }
}

function saveNotesToFile() {
    const paths = getConfigPaths();
    const textarea = document.getElementById('QuickNotes');

    if (!textarea) return false;

    try {
        if (!fs.existsSync(paths.baseFolder)) {
            fs.mkdirSync(paths.baseFolder, { recursive: true });
        }

        const notesContent = textarea.value;
        const timestamp = new Date().toISOString();
        const fileHeader = `// Notes ExcaliburFX - Dernière sauvegarde: ${timestamp}\n\n`;

        fs.writeFileSync(
            paths.notesFile,
            fileHeader + notesContent,
            'utf-8'
        );

        SendNotification('Notes sauvegardées avec succès', true, true);
        return true;
    } catch (e) {
        console.error('saveNotesToFile error:', e);
        SendNotification('Erreur lors de la sauvegarde des notes', true, false);
        return false;
    }
}

function loadNotesFromFile() {
    const paths = getConfigPaths();
    const textarea = document.getElementById('QuickNotes');

    if (!textarea) return false;

    try {
        if (fs.existsSync(paths.notesFile)) {
            const fileContent = fs.readFileSync(paths.notesFile, 'utf-8');
            const contentWithoutHeader = fileContent.replace(/^\/\/ Notes ExcaliburFX.*?\n\n/, '');
            textarea.value = contentWithoutHeader;
            UpdateLineNumbers();
            return true;
        }
    } catch (e) {
        console.error('loadNotesFromFile error:', e);
        SendNotification('Erreur lors du chargement des notes', true, false);
    }
    return false;
}




var setNewX1 = 0.2;
var setNewY1 = 0.8;
var setNewX2 = 0.8;
var setNewY2 = 0.2;
var L_setNewX1 = 0.2;
var L_setNewY1 = 0.8;
var L_setNewX2 = 0.8;
var L_setNewY2 = 0.2;
var hasCopyValue = false;
var copy_x1 = 0;
var copy_y1 = 0;
var copy_x2 = 0;
var copy_y2 = 0;
var GlobalsCurrentTab = 1;
let currentCurveTab = "instant";
var activate_speedramp = false;
var GetARandomCurvePreset = 0;
var lastNoteLineUsed = 0;
let drawCurve_live_Inverval;
let drawCurve_live2_Inverval;
let currentEditingSlot = null;
let isEditMode = false;



function getCSSVar(varName) {
    return getComputedStyle(document.documentElement)
        .getPropertyValue(varName).trim();
}

function E(script) {
    new CSInterface().evalScript(script);
}

function clearALLNoteTimeouts() {
    for (let id of NotetimeoutIDs) {
        clearTimeout(id);
    }
    NotetimeoutIDs = [];
}


function SendNotification(noti, returnit = true, color_green = true, center_to_Main = true) {
    var notification = document.getElementById("notification");
    var theNotification = document.getElementById("theNotification");

    if (!notification || !theNotification) return;

    switch (color_green) {
        case true:
            notification.style.borderTop = "#72db1b 0.5vh solid";
            break;
        case false:
            notification.style.borderTop = "#bd0000 0.5vh solid";
            break;
    }

    notification.style.opacity = "100%";
    notification.style.marginTop = "5vh";

    switch (center_to_Main) {
        case true:
            notification.style.left = "37.5%";
            break;
        case false:
            notification.style.left = "30%";
            break;
    }

    theNotification.textContent = noti;

    notification.addEventListener("click", function () {
        notification.style.opacity = "0%";
        notification.style.marginTop = "-10vh";
    });

    if (returnit) {
        let NoteTimeOut = setTimeout(() => {
            notification.style.opacity = "0%";
            notification.style.marginTop = "-10vh";
        }, 3000);

        NotetimeoutIDs.push(NoteTimeOut);
    }
}

function Restarter() {
    console.log('Restarting application...');

    // Nettoyer tous les timeouts
    clearALLNoteTimeouts();

    // Nettoyer les intervals
    if (typeof drawCurve_live_Inverval !== 'undefined') {
        clearInterval(drawCurve_live_Inverval);
    }
    if (typeof drawCurve_live2_Inverval !== 'undefined') {
        clearInterval(drawCurve_live2_Inverval);
    }

    // Réinitialiser les variables globales
    NotePadOpen = false;
    HelloIamRetarted = false;
    currentCurveTab = "";
    currentEditingSlot = null;
    isEditMode = false;

    // Recharger la page
    location.reload();
}


document.addEventListener('keydown', function (event) {
    if (event.key === "F5" || (event.ctrlKey && event.key.toLowerCase() === 'r')) {
        event.preventDefault();
        Restarter();
    }
});


function CloseDashBoard() {
    var dashboard = document.getElementById("dashboard");
    if (!dashboard) return;
    dashboard.style.transition = "margin-left 500ms cubic-bezier(.7,0,.3,1), opacity 500ms cubic-bezier(.7,0,.3,1)";
    dashboard.style.marginLeft = "100%";
    dashboard.style.opacity = "0%";
}

function OpenDashBoard() {
    var dashboard = document.getElementById("dashboard");
    if (!dashboard) return;
    dashboard.style.transition = "margin-left 500ms cubic-bezier(.7,0,.3,1), opacity 500ms cubic-bezier(.7,0,.3,1)";
    dashboard.style.marginLeft = "15%";
    dashboard.style.opacity = "100%";
}

function OpenDashboardOnStart() {
    const dashboard = document.getElementById("dashboard");
    if (!dashboard) return;

    dashboard.style.transition = "none";
    dashboard.style.marginLeft = "15%";
    dashboard.style.opacity = "100%";

    setTimeout(() => {
        dashboard.style.transition = "margin-left 500ms cubic-bezier(.7,0,.3,1), opacity 500ms cubic-bezier(.7,0,.3,1)";
    }, 100);
}

function newTabAnims(newTab) {
    clearTimeout(MenuTimeOut);

    const tabs = [
        document.getElementById("tab_1"),
        document.getElementById("tab_2"),
        document.getElementById("tab_3"),
        document.getElementById("tab_4"),
        document.getElementById("tab_5"),
        document.getElementById("tab_6"),
        document.getElementById("tab_7")
    ];

    const animHeight = "5vh";

    // Get current animation speed for dynamic delay
    let currentAnimSpeed = 300;
    try {
        const match = opacity_time.match(/\d+/);
        if (match) {
            currentAnimSpeed = parseInt(match[0]);
        }
    } catch (e) {
        currentAnimSpeed = 300;
    }

    const SlideInAnim = `opacity ${currentAnimSpeed}ms cubic-bezier(.7,0,.3,1), top ${currentAnimSpeed}ms cubic-bezier(.7,0,.3,1)`;
    const SlideOutAnim = `opacity ${currentAnimSpeed}ms cubic-bezier(.7,0,.3,1), top ${currentAnimSpeed}ms cubic-bezier(.7,0,.3,1)`;

    // Use proper delay based on animation speed
    const dynamicDelay = Math.max(currentAnimSpeed * 0.6, 50);

    // Hide other tabs
    tabs.forEach((tab, index) => {
        if (tab && index !== newTab - 1) {
            tab.style.transition = SlideOutAnim;
            tab.style.top = animHeight;
            tab.style.opacity = "0%";
            tab.style.zIndex = "0";
        }
    });

    // Show target tab with proper delay
    if (tabs[newTab - 1]) {
        MenuTimeOut = setTimeout(() => {
            tabs[newTab - 1].style.transition = SlideInAnim;
            tabs[newTab - 1].style.top = '0vh';
            tabs[newTab - 1].style.opacity = "100%";
            tabs[newTab - 1].style.zIndex = "1";

            // Remove transition after completion to prevent issues
            setTimeout(() => {
                tabs[newTab - 1].style.transition = "";
            }, currentAnimSpeed + 100);
        }, dynamicDelay);
    }
}

function OpenNotes() {
    clearTimeout(MenuTimeOut3);
    var QuickNoteSection = document.getElementById("QuickNoteSection");
    var SlideOutAnim = opacityTimerOUT + ", " + topTimerOUT;

    QuickNoteSection.style.transition = SlideOutAnim;
    QuickNoteSection.style.opacity = '100%';
    QuickNoteSection.style.top = '0vh';
    QuickNoteSection.style.zIndex = '9999998';
    QuickNoteSection.style.visibility = 'visible';
    QuickNoteSection.style.pointerEvents = 'auto';
    NotePadOpen = true;
}

function CloseNotes() {
    clearTimeout(MenuTimeOut3);
    var QuickNoteSection = document.getElementById("QuickNoteSection");
    var SlideOutAnim = opacityTimerOUT + ", " + topTimerOUT;

    QuickNoteSection.style.transition = SlideOutAnim;
    QuickNoteSection.style.opacity = '0%';
    QuickNoteSection.style.top = '5vh';

    MenuTimeOut3 = setTimeout(() => {
        QuickNoteSection.style.zIndex = '-100';
        QuickNoteSection.style.visibility = 'hidden';
        QuickNoteSection.style.pointerEvents = 'none';
    }, waitForAnim);
    NotePadOpen = false;
}

var lastNoteLineUsed = 0;
var NotePadOpen = false;
function UpdateLineNumbers() {
    const textarea = document.getElementById('QuickNotes');
    const lineNumbers = document.getElementById('lineNumber');

    const lines = textarea.value.substr(0, textarea.selectionStart).split('\n');
    const lines2 = textarea.value.split('\n');
    const currentLine = lines.length;

    if (currentLine == lastNoteLineUsed)
        return;

    var lineCount = lines2.length;

    const lineNumbersArray = [];

    for (let i = 0; i < lineCount; i++) {
        if (i + 1 === currentLine) {
            lineNumbersArray.push(`<span style="color: var(--accent);">${i + 1}</span><br>`);
        } else {
            lineNumbersArray.push(`${i + 1}<br>`);
        }
    }

    lineNumbers.innerHTML = lineNumbersArray.join('');
    lastNoteLineUsed = currentLine;
}

function HighLightCurrentLine() {
    if (!NotePadOpen) return;

    const textarea = document.getElementById('QuickNotes');
    const newLine = document.getElementById('hightlightLine');
    const lineNumbers = document.getElementById('lineNumber');

    if (!textarea || !newLine) return;

    const lines = textarea.value.substr(0, textarea.selectionStart).split('\n');
    const currentLine = lines.length;
    const scrollOffset = textarea.scrollTop;

    // Calculer la hauteur de ligne basée sur le style réel
    const computedStyle = window.getComputedStyle(textarea);
    const fontSize = parseInt(computedStyle.fontSize);
    const lineHeight = fontSize + 2; // 16px + 2px pour l'espacement

    const topPosition = (currentLine - 1) * lineHeight - scrollOffset;

    newLine.style.top = `${topPosition}px`;
    newLine.style.color = getCSSVar('--accent');
}

function syncScroll() {
    const textarea = document.getElementById('QuickNotes');
    const lineNumbers = document.getElementById('lineNumber');
    lineNumbers.scrollTop = textarea.scrollTop;

    document.getElementById('hightlightLine').style.transition = 'none';
    HighLightCurrentLine();
    document.getElementById('hightlightLine').style.transition = 'top 75ms ease';
}


function UpdateNotePad() {
    try {
        HighLightCurrentLine();
        const textarea = document.getElementById('QuickNotes');

        if (!textarea) {
            console.warn('QuickNotes textarea not found');
            return;
        }

        textarea.addEventListener('keydown', function (event) {
            if (event.keyCode === 33 || event.keyCode === 34) {
                event.preventDefault();
            }

            if (event.keyCode === 9) {
                event.preventDefault();
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                textarea.value = textarea.value.substring(0, start) + '\t' + textarea.value.substring(end);
                textarea.selectionStart = textarea.selectionEnd = start + 1;
            }

            // Ctrl+S pour sauvegarder les notes
            if (event.ctrlKey && event.keyCode === 83) {
                event.preventDefault();
                saveNotesToFile();
            }

            // Ctrl+O pour charger les notes
            if (event.ctrlKey && event.keyCode === 79) {
                event.preventDefault();
                loadNotesFromFile();
            }
        });

        textarea.addEventListener('click', UpdateLineNumbers);
        textarea.addEventListener('scroll', syncScroll);
        textarea.addEventListener('input', function () {
            UpdateLineNumbers();
        });

        setInterval(HighLightCurrentLine, 1);

        // Charger automatiquement les notes au démarrage
        setTimeout(() => {
            loadNotesFromFile();
        }, 100);

        console.log('NotePad initialized successfully');
    } catch (error) {
        console.error('Error initializing NotePad:', error);
    }
}






function updateNavActiveClasses(activeTab) {
    const navButtons = [
        { id: "tabButton1", activeClass: "CurveActive", inactiveClass: "Curve" },
        { id: "tabButton2", activeClass: "SoundActive", inactiveClass: "Sound" },
        { id: "tabButton3", activeClass: "EffectActive", inactiveClass: "Effect" },
        { id: "tabButton4", activeClass: "ShakesActive", inactiveClass: "Shakes" },
        { id: "tabButton5", activeClass: "ScriptActive", inactiveClass: "Script" },
        { id: "tabButton6", activeClass: "ShortcutActive", inactiveClass: "Shortcut" },
        { id: "tabButton7", activeClass: "SettingsActive", inactiveClass: "Settings" }
    ];

    navButtons.forEach((btn, index) => {
        const element = document.getElementById(btn.id);
        if (element) {
            element.className = (index + 1 === activeTab) ? btn.activeClass : btn.inactiveClass;
        }
    });
}


function resetCurveViews() {
    const setCurvePos = document.getElementById("set_curve_pos");
    const liveCurves = document.getElementById("liveCurves");
    const speedrampSection = document.getElementById("speedrampSection");

    // Get dynamic timing once
    let dynamicTiming = 300;
    try {
        const match = opacity_time.match(/(\d+)/);
        if (match) {
            dynamicTiming = parseInt(match[0]);
        }
    } catch (e) {
        dynamicTiming = 300;
    }

    const transition = `transform ${dynamicTiming}ms cubic-bezier(.7,0,.3,1), opacity ${dynamicTiming}ms cubic-bezier(.7,0,.3,1)`;

    if (setCurvePos) {
        setCurvePos.style.transition = transition;
        setCurvePos.style.transform = "scale(0)";
        setCurvePos.style.opacity = "0";
        setCurvePos.style.zIndex = "0";
    }
    if (liveCurves) {
        liveCurves.style.transition = transition;
        liveCurves.style.transform = "scale(0)";
        liveCurves.style.opacity = "0";
        liveCurves.style.zIndex = "0";
    }
    if (speedrampSection) {
        speedrampSection.style.transition = transition;
        speedrampSection.style.transform = "scale(0)";
        speedrampSection.style.opacity = "0";
        speedrampSection.style.zIndex = "0";
    }
}



function showCurvePresets() {
    if (currentCurveTab === "presets") return;
    currentCurveTab = "presets";

    resetCurveViews();

    // Get timing once
    let dynamicTiming = 300;
    try {
        const match = opacity_time.match(/(\d+)/);
        if (match) {
            dynamicTiming = parseInt(match[0]);
        }
    } catch (e) {
        dynamicTiming = 300;
    }

    requestAnimationFrame(() => {
        const setCurvePos = document.getElementById("set_curve_pos");
        if (setCurvePos) {
            setCurvePos.style.transition = `transform ${dynamicTiming}ms cubic-bezier(.7,0,.3,1), opacity ${dynamicTiming}ms cubic-bezier(.7,0,.3,1)`;

            requestAnimationFrame(() => {
                setCurvePos.style.transform = "scale(1)";
                setCurvePos.style.opacity = "1";
                setCurvePos.style.zIndex = "1";
            });

            // Redraw after transition is complete
            setTimeout(() => {
                if (typeof forceRedrawAllPresets === 'function') {
                    forceRedrawAllPresets();
                } else {
                    console.warn('forceRedrawAllPresets function not available in showCurvePresets');
                }
            }, dynamicTiming + 50);
        }
    });

    activate_speedramp = false;
}





function showLiveCurves() {
    if (currentCurveTab === "instant") return;
    currentCurveTab = "instant";

    resetCurveViews();

    const liveCurves = document.getElementById("liveCurves");
    if (!liveCurves) return;

    // Get timing once
    let dynamicTiming = 300;
    try {
        const match = opacity_time.match(/(\d+)/);
        if (match) {
            dynamicTiming = parseInt(match[0]);
        }
    } catch (e) {
        dynamicTiming = 300;
    }

    liveCurves.style.transition = `transform ${dynamicTiming}ms cubic-bezier(.7,0,.3,1), opacity ${dynamicTiming}ms cubic-bezier(.7,0,.3,1)`;

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            liveCurves.style.transform = "scale(1)";
            liveCurves.style.opacity = "1";
            liveCurves.style.zIndex = "1";
        });
    });

    activate_speedramp = false;

    // Wait for transition to complete before drawing
    setTimeout(() => {
        try {
            clearInterval(drawCurve_live_Inverval);
            resetDiv("CurvePreview_Live");

            if (typeof LiveDrawCubicBezierVisualizerForLiveCurve === "function") {
                LiveDrawCubicBezierVisualizerForLiveCurve(
                    "CurvePreview_Live",
                    L_setNewX1,
                    L_setNewY1,
                    L_setNewX2,
                    L_setNewY2
                );
            }
        } catch (error) {
            console.warn("Erreur lors de l'initialisation de la courbe live:", error);
        }
    }, dynamicTiming + 50);
}




function showSpeedramps() {
    if (currentCurveTab === "speedramp") return;
    currentCurveTab = "speedramp";

    resetCurveViews();

    const speedrampSection = document.getElementById("speedrampSection");
    if (!speedrampSection) return;

    // Get timing once
    let dynamicTiming = 300;
    try {
        const match = opacity_time.match(/(\d+)/);
        if (match) {
            dynamicTiming = parseInt(match[0]);
        }
    } catch (e) {
        dynamicTiming = 300;
    }

    speedrampSection.style.transition = `transform ${dynamicTiming}ms cubic-bezier(.7,0,.3,1), opacity ${dynamicTiming}ms cubic-bezier(.7,0,.3,1)`;

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            speedrampSection.style.transform = "scale(1)";
            speedrampSection.style.opacity = "1";
            speedrampSection.style.zIndex = "1";
        });
    });

    activate_speedramp = true;
}


function setupRightClickHandler() {
    const tabButton1 = document.getElementById("tabButton1");

    if (!tabButton1) return;

    tabButton1.addEventListener("contextmenu", function (e) {
        e.preventDefault();
        if (currentCurveTab === "instant") {
            CloseDashBoard();
            CloseNotes();
            showCurvePresets();
        } else {
            CloseNotes();
            CloseDashBoard();
            showLiveCurves();
        }
    });
}


function setupTabRightClickHandlers() {
    const tabs = [
        document.getElementById("tab_2"),
        document.getElementById("tab_3"),
        document.getElementById("tab_4"),
        document.getElementById("tab_5"),
        document.getElementById("tab_6"),
        document.getElementById("tab_7")
    ];

    tabs.forEach(tabButton => {
        if (!tabButton) return;

        tabButton.addEventListener("contextmenu", function (e) {
            e.preventDefault();

            CloseDashBoard();
            CloseNotes();

            if (currentCurveTab === "instant") {
                showCurvePresets();
                closeDashBoard();
                closeNotes();
            } else if (currentCurveTab === "presets") {
                showLiveCurves();
                closeDashBoard();
                closeNotes();
            }

            newTabAnims(1);
            GlobalsCurrentTab = 1;
            updateNavActiveClasses(1);
        });
    });
}

function NavBar() {
    if (HelloIamRetarted) return;

    var current_tab = 1;

    const ExcaliburTxT = document.getElementById("alineContent");
    if (ExcaliburTxT) {
        ExcaliburTxT.addEventListener("click", function () {
            var dashboard = document.getElementById("dashboard");
            if (!dashboard) return;

            if (dashboard.style.marginLeft === "15%") {
                CloseDashBoard();
            } else {
                OpenDashBoard();
                CloseNotes();
            }
        });
    }

    const NoteButton = document.getElementById("NoteButton");
    if (NoteButton) {
        NoteButton.addEventListener("click", function () {
            var QuickNoteSection = document.getElementById("QuickNoteSection");
            if (!QuickNoteSection) return;

            if (!NotePadOpen) {
                CloseDashBoard();
                OpenNotes();
            } else {
                CloseNotes();
                CloseDashBoard();
            }
        });
    }

    const speedrampSwitcher = document.getElementById('SpeedrampSwitcher');
    if (speedrampSwitcher) {
        speedrampSwitcher.addEventListener("click", showSpeedramps);
    }

    const curvePresetBackSwitcher = document.getElementById('CurvePresetBackSwitcher');
    if (curvePresetBackSwitcher) {
        curvePresetBackSwitcher.addEventListener("click", showCurvePresets);
    }

    const curvePresetSwitcher = document.getElementById('CurvePresetSwitcher');
    if (curvePresetSwitcher) {
        curvePresetSwitcher.addEventListener("click", showCurvePresets);
    }

    setupTabRightClickHandlers();

    function switchToTab(tabNumber) {
        if (current_tab === tabNumber) {
            CloseNotes();
            CloseDashBoard();
            return;
        }

        CloseNotes();
        CloseDashBoard();

        newTabAnims(tabNumber);
        current_tab = tabNumber;
        GlobalsCurrentTab = current_tab;
        updateNavActiveClasses(current_tab);
    }

    const tabButton1 = document.getElementById("tabButton1");
    if (tabButton1) {
        tabButton1.addEventListener("click", function () {
            showCurvePresets();
            CloseDashBoard();
            switchToTab(1);
        });

        tabButton1.addEventListener("contextmenu", function (e) {
            e.preventDefault();
            console.log("Right click detected on Curves button");

            if (GlobalsCurrentTab !== 1) {
                CloseDashBoard();
                CloseNotes();
                newTabAnims(1);
                current_tab = 1;
                GlobalsCurrentTab = 1;
                updateNavActiveClasses(1);
            }

            if (currentCurveTab === "instant") {
                console.log("Switching to presets");
                showCurvePresets();
            } else {
                console.log("Switching to instant");
                showLiveCurves();
            }
        });
    }

    const tabButton2 = document.getElementById("tabButton2");
    if (tabButton2) {
        tabButton2.addEventListener("click", function () {
            switchToTab(2);
        });
    }

    const tabButton3 = document.getElementById("tabButton3");
    if (tabButton3) {
        tabButton3.addEventListener("click", function () {
            switchToTab(3);
        });
    }

    const tabButton4 = document.getElementById("tabButton4");
    if (tabButton4) {
        tabButton4.addEventListener("click", function () {
            switchToTab(4);
        });
    }

    const tabButton5 = document.getElementById("tabButton5");
    if (tabButton5) {
        tabButton5.addEventListener("click", function () {
            switchToTab(5);
        });
    }

    const tabButton6 = document.getElementById("tabButton6");
    if (tabButton6) {
        tabButton6.addEventListener("click", function () {
            switchToTab(6);
        });
    }

    const tabButton7 = document.getElementById("tabButton7");
    if (tabButton7) {
        tabButton7.addEventListener("click", function () {
            switchToTab(7);
        });
    }
}



function redrawAllVisibleCurves() {
    try {
        const setCurvePos = document.getElementById("set_curve_pos");
        if ((setCurvePos && setCurvePos.style.opacity === "100%") || currentCurveTab === "presets") {
            if (typeof forceRedrawAllPresets === 'function') {
                forceRedrawAllPresets();
            } else {
                console.warn('forceRedrawAllPresets function not available');
            }
        }

        const createCurve = document.getElementById("create_curve");
        if (createCurve && createCurve.style.opacity === "100%") {
            if (typeof resetDiv === 'function' && typeof LiveDrawCubicBezierVisualizer === 'function') {
                resetDiv("CurvePreview");
                LiveDrawCubicBezierVisualizer("CurvePreview", setNewX1, setNewY1, setNewX2, setNewY2);
            }
        }

        const liveCurves = document.getElementById("liveCurves");
        if (liveCurves && (liveCurves.style.opacity === "1" || currentCurveTab === "instant")) {
            if (typeof resetDiv === 'function' && typeof LiveDrawCubicBezierVisualizerForLiveCurve === 'function') {
                resetDiv("CurvePreview_Live");
                LiveDrawCubicBezierVisualizerForLiveCurve(
                    "CurvePreview_Live",
                    L_setNewX1,
                    L_setNewY1,
                    L_setNewX2,
                    L_setNewY2
                );
            }
        }
    } catch (error) {
        console.error('Error in redrawAllVisibleCurves:', error);
    }
}


function colorUpdate() {
    const hueSlider = document.getElementById("hueSlider");
    const satSlider = document.getElementById("satSlider");
    const huePicker = document.getElementById("ColorPicker");
    const satPicker = document.getElementById("ColorPickerForSat");
    const hueBackground = document.getElementById("CoolExcaliburHue");
    const satBackground = document.getElementById("CoolExcaliburSat");

    // Compteurs de valeurs
    const hueCounter = document.getElementById("hue-counter");
    const satCounter = document.getElementById("sat-counter");

    if (!hueSlider || !satSlider || !huePicker || !satPicker) return;

    const root = document.documentElement;

    // Charger les valeurs sauvegardées
    const userConfig = readOrCreateUserConfig();
    if (userConfig.sliders) {
        if (userConfig.sliders.hue !== undefined) {
            hueSlider.value = userConfig.sliders.hue;
        }
        if (userConfig.sliders.saturation !== undefined) {
            satSlider.value = userConfig.sliders.saturation;
        }
    }

    let currentHue = hueSlider.value;
    let currentSat = satSlider.value;

    function updatePickerPosition(slider, picker) {
        const min = parseFloat(slider.min) || 0;
        const max = parseFloat(slider.max) || 100;
        const percentage = ((slider.value - min) / (max - min)) * 100;
        picker.style.left = percentage + '%';
    }

    function updateHueThumb() {
        huePicker.style.backgroundColor = '#fff';
    }

    function updateSatThumb() {
        satPicker.style.backgroundColor = '#fff';
    }

    function updateHueBackground(hue, sat) {
        if (hueBackground) {
            let gradient = [];
            for (let deg = 0; deg <= 360; deg += 60) {
                gradient.push(`hsl(${deg}, ${sat}%, 50%)`);
            }
            hueBackground.style.background = `linear-gradient(to right, ${gradient.join(', ')})`;
        }
    }

    function updateSatBackground(hue) {
        if (satBackground) {
            satBackground.style.background = `linear-gradient(to right, hsl(${hue}, 0%, 50%), hsl(${hue}, 100%, 50%))`;
        }
    }

    function updateRootColor() {
        root.style.setProperty('--accent', `hsl(${currentHue}, ${currentSat}%, 50%)`);
        root.style.setProperty('--accent-light', `hsl(${currentHue}, ${currentSat}%, 70%)`);
        root.style.setProperty('--accent-shadow', `hsla(${currentHue}, ${currentSat}%, 60%, 0.4)`);
    }

    // Appliquer les valeurs chargées immédiatement
    updatePickerPosition(hueSlider, huePicker);
    updatePickerPosition(satSlider, satPicker);
    updateHueThumb();
    updateSatThumb();
    updateHueBackground(currentHue, currentSat);
    updateSatBackground(currentHue);
    updateRootColor();

    function updateHueThumb() {
        huePicker.style.backgroundColor = '#fff';
    }

    function updateSatThumb() {
        satPicker.style.backgroundColor = '#fff';
    }

    function updateHueBackground(hue, sat) {
        if (hueBackground) {
            let gradient = [];
            for (let deg = 0; deg <= 360; deg += 60) {
                gradient.push(`hsl(${deg}, ${sat}%, 50%)`);
            }
            hueBackground.style.background = `linear-gradient(to right, ${gradient.join(', ')})`;
        }
    }

    function updateSatBackground(hue) {
        if (satBackground) {
            satBackground.style.background = `linear-gradient(to right, hsl(${hue}, 0%, 50%), hsl(${hue}, 100%, 50%))`;
        }
    }

    function updateRootColor() {
        root.style.setProperty('--accent', `hsl(${currentHue}, ${currentSat}%, 50%)`);
        root.style.setProperty('--accent-light', `hsl(${currentHue}, ${currentSat}%, 70%)`);
        root.style.setProperty('--accent-shadow', `hsla(${currentHue}, ${currentSat}%, 60%, 0.4)`);
    }

    updatePickerPosition(hueSlider, huePicker);
    updatePickerPosition(satSlider, satPicker);
    updateHueThumb();
    updateSatThumb();
    updateHueBackground(currentHue, currentSat);
    updateSatBackground(currentHue);
    updateRootColor();

    hueSlider.addEventListener('input', () => {
        currentHue = hueSlider.value;
        if (hueCounter) hueCounter.textContent = currentHue + '°';
        updatePickerPosition(hueSlider, huePicker);
        updateHueThumb();
        updateHueBackground(currentHue, currentSat);
        updateSatBackground(currentHue);
        updateRootColor();
        if (typeof redrawAllVisibleCurves === 'function') {
            redrawAllVisibleCurves();
        }

        // Sauvegarder la valeur
        const userConfig = readOrCreateUserConfig();
        userConfig.sliders.hue = parseInt(currentHue);
        updateUserConfig(userConfig);
    });

    satSlider.addEventListener('input', () => {
        currentSat = satSlider.value;
        if (satCounter) satCounter.textContent = currentSat + '%';
        updatePickerPosition(satSlider, satPicker);
        updateSatThumb();
        updateHueBackground(currentHue, currentSat);
        updateSatBackground(currentHue);
        updateRootColor();
        if (typeof redrawAllVisibleCurves === 'function') {
            redrawAllVisibleCurves();
        }

        // Sauvegarder la valeur
        const userConfig = readOrCreateUserConfig();
        userConfig.sliders.saturation = parseInt(currentSat);
        updateUserConfig(userConfig);
    });
}


function initAnimationSpeed() {
    const animSpeedSlider = document.getElementById('AnimSpeed_val');
    const animSpeedDisplay = document.getElementById('AnimSpeed_display');
    const speedPicker = document.getElementById('AnimSpeedPicker');
    const speedCounter = document.getElementById('speed-counter');

    if (animSpeedSlider) {
        // Charger la valeur sauvegardée
        const userConfig = readOrCreateUserConfig();
        if (userConfig.sliders && userConfig.sliders.animationSpeed) {
            animSpeedSlider.value = userConfig.sliders.animationSpeed;
        }

        function updateSpeedPicker() {
            const min = parseFloat(animSpeedSlider.min) || 0;
            const max = parseFloat(animSpeedSlider.max) || 400;
            const percentage = ((animSpeedSlider.value - min) / (max - min)) * 100;

            if (speedPicker) {
                speedPicker.style.left = percentage + '%';
            }

            if (speedCounter) {
                speedCounter.textContent = animSpeedSlider.value + 'ms';
            }

            if (animSpeedDisplay) {
                animSpeedDisplay.textContent = animSpeedSlider.value;
            }
        }

        updateSpeedPicker();

        animSpeedSlider.addEventListener('input', () => {
            const newSpeed = parseInt(animSpeedSlider.value);

            updateSpeedPicker();

            opacity_time = `opacity ${newSpeed}ms cubic-bezier(.7,0,.3,1)`;
            top_time_min = `top ${newSpeed}ms cubic-bezier(.7,0,.3,1)`;
            margin_time_min = `margin ${newSpeed}ms cubic-bezier(.7,0,.3,1)`;

            updateCurrentTransitions(newSpeed);

            // Sauvegarder la valeur
            const userConfig = readOrCreateUserConfig();
            userConfig.sliders.animationSpeed = newSpeed;
            updateUserConfig(userConfig);
        });

        const initialSpeed = parseInt(animSpeedSlider.value);
        opacity_time = `opacity ${initialSpeed}ms cubic-bezier(.7,0,.3,1)`;
        top_time_min = `top ${initialSpeed}ms cubic-bezier(.7,0,.3,1)`;
        margin_time_min = `margin ${initialSpeed}ms cubic-bezier(.7,0,.3,1)`;
    }
}


function updateCurrentTransitions(newSpeed) {
    const tabs = [
        document.getElementById("tab_1"),
        document.getElementById("tab_2"),
        document.getElementById("tab_3"),
        document.getElementById("tab_4"),
        document.getElementById("tab_5"),
        document.getElementById("tab_6"),
        document.getElementById("tab_7")
    ];

    tabs.forEach(tab => {
        if (tab && tab.style.opacity !== "0%" && tab.style.opacity !== "0") {
            const newTransition = `opacity ${newSpeed}ms cubic-bezier(.7,0,.3,1), top ${newSpeed}ms cubic-bezier(.7,0,.3,1)`;
            tab.style.transition = newTransition;
        }
    });

    const setCurvePos = document.getElementById("set_curve_pos");
    const liveCurves = document.getElementById("liveCurves");
    const speedrampSection = document.getElementById("speedrampSection");

    const transitionString = `transform ${newSpeed}ms cubic-bezier(.7,0,.3,1), opacity ${newSpeed}ms cubic-bezier(.7,0,.3,1)`;

    if (setCurvePos && setCurvePos.style.opacity !== "0%" && setCurvePos.style.opacity !== "0") {
        setCurvePos.style.transition = transitionString;
    }
    if (liveCurves && liveCurves.style.opacity !== "0%" && liveCurves.style.opacity !== "0") {
        liveCurves.style.transition = transitionString;
    }
    if (speedrampSection && speedrampSection.style.opacity !== "0%" && speedrampSection.style.opacity !== "0") {
        speedrampSection.style.transition = transitionString;
    }
}



function initUI() {
    console.log('Initializing UI...');

    try {
        NavBar();
        UpdateNotePad();
        newTabAnims(1);
        updateNavActiveClasses(1);
        showLiveCurves();
        colorUpdate();
        initAnimationSpeed();

        setTimeout(() => {
            const setCurvePos = document.getElementById("set_curve_pos");
            if (setCurvePos) {
                setCurvePos.style.opacity = "100%";
                setCurvePos.style.transform = "scale(1)";
                setCurvePos.style.zIndex = "1";

                if (typeof forceRedrawAllPresets === 'function') {
                    forceRedrawAllPresets();
                } else {
                    console.warn('forceRedrawAllPresets function not found');
                }
            }
        }, 200);

        if (isDashboardOpenOnStart) {
            OpenDashboardOnStart();
        }

        console.log('UI initialization complete');
    } catch (error) {
        console.error('Error during UI initialization:', error);
    }
}




// f(p) = 1−(1−p)3
function animateProgressBar(targetPercent, duration) {
    const bar = document.getElementById("StartLoadingbarProgress");
    const start = parseFloat(bar.style.width) || 0;
    const startTime = performance.now();

    function animate(time) {
        let p = (time - startTime) / duration;
        if (p > 1) p = 1;

        const ease = 1 - (1 - p) * (1 - p) * (1 - p);
        bar.style.width = (start + (targetPercent - start) * ease) + "%";

        if (p < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
}


async function CheckAndLoad() {
    const WhatIsLoading = document.getElementById("WhatIsLoading");
    WhatIsLoading.style.color = "#5eff24";

    animateProgressBar(0, 500);

    if (typeof CSInterface === "undefined") {
        WhatIsLoading.textContent = "After Effects unavailable";
        animateProgressBar(30, 800);
        await new Promise(r => setTimeout(r, 1000));
        return;
    }

    WhatIsLoading.textContent = "ExcaliburFx can only be loaded in Adobe After Effect."; //pas DE GOOGLE
    animateProgressBar(10, 800);

    const cs = new CSInterface();

    const currentAE_Version = await new Promise(resolve => {
        cs.evalScript("AE_VersionButDumCuzAdobeIsFuckingStupid()", resolve);
    });

    WhatIsLoading.textContent = `After Effects 20${currentAE_Version} detected.`;
    document.getElementById("x1111293").textContent = "Reading your pc specs.";

    animateProgressBar(33, 1000);
    await new Promise(r => setTimeout(r, 1500));
}


async function showSystemInfoInLoader() {
    const WhatIsLoading = document.getElementById("WhatIsLoading");
    WhatIsLoading.style.color = "#5eff24";
    WhatIsLoading.style.whiteSpace = "pre-line";
    WhatIsLoading.textContent = "Fetching system info...";

    animateProgressBar(66, 800);

    let systemInfo = "Unknown";

    try {
        const params = await _getSystemParameters_WIN_11();
        systemInfo = `CPU: ${params.cpuSerial}\nDisk: ${params.diskSerial}\nMAC: ${params.macAddress}\nGUID: ${params.machineGuid}`; //fetch quelques infos
        WhatIsLoading.textContent = systemInfo;

        //progresse à 90%
        animateProgressBar(66, 800);
    } catch (e) {
        console.warn("System info fetch failed:", e);
        WhatIsLoading.textContent = "System info unavailable";
        animateProgressBar(100, 500);
    }

    await new Promise(resolve => setTimeout(resolve, 1500));


    readSetGo();
}


setTimeout(() => {
    try {
        const Loading = document.getElementById("Loading");
        const BluredBG = document.getElementById("BluredBG");
        const LoginScreen = document.getElementById("LoginScreen");

        const isLoadingVisible = Loading && (
            Loading.style.display !== "none" &&
            Loading.style.opacity !== "0" &&
            Loading.offsetParent !== null
        );

        if (isLoadingVisible) {
            console.warn("Forced loader release - timeout reached");

            if (Loading) Loading.style.display = "none";
            if (BluredBG) BluredBG.style.display = "none";

            let hasSession = false;
            try {
                hasSession = hasValidUserSession();
            } catch (error) {
                console.warn('Error checking user session:', error);
                hasSession = false;
            }

            if (!hasSession && LoginScreen) {
                try {
                    showLoginScreen();
                } catch (error) {
                    console.error('Failed to show login screen:', error);
                    setTimeout(() => initUI(), 100);
                }
            } else {
                try {
                    setTimeout(() => initUI(), 100);
                } catch (error) {
                    console.error('Failed to initialize UI in timeout:', error);
                }
            }
        }
    } catch (error) {
        console.error('Error in safety timeout:', error);
    }
}, 10000);


function readSetGo() {
    const Loading = document.getElementById("Loading");
    const BluredBG = document.getElementById("BluredBG");
    const WhatIsLoading = document.getElementById("WhatIsLoading");

    console.log('Finalizing application startup...');

    if (WhatIsLoading) {
        WhatIsLoading.textContent = "LOADED";
        WhatIsLoading.style.color = "#5eff24";
    }

    if (Loading) {
        Loading.style.transition = "opacity 500ms";
        Loading.style.opacity = "0";
    }

    if (BluredBG) {
        BluredBG.style.transition = "opacity 500ms";
        BluredBG.style.opacity = "0";
    }

    setTimeout(() => {
        if (Loading) Loading.style.display = "none";
        if (BluredBG) BluredBG.style.display = "none";

        setTimeout(() => {
            try {
                resetCurveViews();
                currentCurveTab = "";

                setTimeout(() => {
                    showLiveCurves();
                    console.log('Application startup complete');
                }, 50);
            } catch (error) {
                console.error('Error during final initialization:', error);
            }
        }, 100);
    }, 500);
}

function showLoginScreen() {
    const loginScreen = document.getElementById("LoginScreen");
    const loading = document.getElementById("Loading");

    loading.style.display = "none";
    loading.style.opacity = "0";
    loading.style.zIndex = "99999999999";

    loginScreen.style.display = "flex";
    loginScreen.style.zIndex = "999999999999";

    setTimeout(() => {
        loginScreen.classList.add("visible");
    }, 50);

    setupLoginEvents();
}

function hideLoginScreen() {
    const loginScreen = document.getElementById("LoginScreen");
    const loading = document.getElementById("Loading");

    loginScreen.classList.remove("visible");

    setTimeout(() => {
        loginScreen.style.display = "none";

        loading.style.display = "block";
        loading.style.opacity = "1";
        loading.style.zIndex = "99999999999";
        loading.style.position = "absolute";
        loading.style.height = "100vh";
        loading.style.width = "100%";
        loading.style.top = "0";
        loading.style.left = "0";

        document.getElementById("StartLoadingbarProgress").style.width = "0%";
    }, 500);
}

function setupLoginEvents() {
    const usernameInput = document.getElementById("UsernameInput");
    const loginButton = document.getElementById("LoginButton");
    const loginError = document.getElementById("LoginError");

    function validateUsername(username) {
        if (!username || username.trim().length === 0) {
            return "Username cannot be empty";
        }
        if (username.trim().length < 2) {
            return "Username must be at least 2 characters";
        }
        if (username.trim().length > 20) {
            return "Username cannot exceed 20 characters";
        }
        const forbiddenChars = /[<>:"/\\|?*]/;
        if (forbiddenChars.test(username)) {
            return "Username contains invalid characters";
        }
        const validChars = /^[a-zA-Z0-9._-]+$/;
        if (!validChars.test(username.trim())) {
            return "Username can only contain letters, numbers, dots, dashes and underscores";
        }
        return null;
    }

    function handleLogin() {
        const username = usernameInput.value.trim();
        const error = validateUsername(username);

        loginError.classList.remove("show");

        if (error) {
            showLoginError(error);
            return;
        }

        loginButton.disabled = true;
        loginButton.textContent = "Loading...";
        usernameInput.disabled = true;

        try {
            const success = updateUserConfig({
                username: username,
                firstTime: false
            });

            if (success) {
                SendNotification(`Welcome, ${username}!`, true, true);

                const loading = document.getElementById("Loading");
                const welcomeText = loading.querySelector("h1");
                welcomeText.textContent = `Welcome, ${username}!`;

                setTimeout(() => {
                    hideLoginScreen();

                    setTimeout(() => {
                        startMainApp();
                    }, 100);
                }, 300);
            } else {
                throw new Error("Failed to save user configuration");
            }
        } catch (e) {
            console.error('Login error:', e);
            showLoginError("Unable to save your information. Please try again.");
            resetLoginButton();
        }
    }

    loginButton.addEventListener("click", handleLogin);

    usernameInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            handleLogin();
        }
    });

    usernameInput.addEventListener("input", function () {
        clearLoginError();

        const currentValue = usernameInput.value.trim();
        if (currentValue.length > 20) {
            usernameInput.value = currentValue.substring(0, 20);
        }
    });

    usernameInput.addEventListener("paste", function (event) {
        setTimeout(() => {
            const pastedValue = usernameInput.value.trim();
            if (pastedValue.length > 20) {
                usernameInput.value = pastedValue.substring(0, 20);
            }
        }, 10);
    });

    function showLoginError(message) {
        loginError.textContent = message;
        loginError.classList.add("show");

        usernameInput.classList.add("error");
        usernameInput.focus();

        setTimeout(() => {
            usernameInput.classList.remove("error");
        }, 500);

        setTimeout(() => {
            if (loginError.classList.contains("show")) {
                loginError.classList.remove("show");
            }
        }, 5000);
    }

    function resetLoginButton() {
        loginButton.disabled = false;
        loginButton.textContent = "Enter";
        usernameInput.disabled = false;
        usernameInput.focus();
    }

    function clearLoginError() {
        loginError.classList.remove("show");
        usernameInput.classList.remove("error");
    }

    setTimeout(() => {
        usernameInput.focus();
        if (usernameInput.value.trim() !== '') {
            usernameInput.select();
        }
    }, 100);
}

async function startMainApp() {
    console.log('Starting main application...');

    try {
        await CheckAndLoad();
        await showSystemInfoInLoader();

        customFileReadOrCreate();

        setTimeout(() => {
            if (typeof drawCubicBezierVisualizer === 'function') {
                drawCubicBezierVisualizer("CUR_In_Preset", 0, 0, 0, 1);
                drawCubicBezierVisualizer("CUR_Out_Preset", 1, 0, 1, 1);
                drawCubicBezierVisualizer("CUR_SpeedRamp_Preset", 0.20, 0.80, 0.80, 0.20);
                drawCubicBezierVisualizer("CUR_S_Preset", 0.6, 0, 0.3, 1);
                drawCubicBezierVisualizer("CUR_Reset", 0, 0, 1, 1);
            } else {
                console.warn('drawCubicBezierVisualizer function not available yet');
            }

            if (typeof LoadCustomCurves === 'function') {
                LoadCustomCurves();
            } else {
                console.warn('LoadCustomCurves function not found');
            }
        }, 100);

        if (typeof LiveCurveStuff === 'function') {
            LiveCurveStuff();
        } else {
            console.warn('LiveCurveStuff function not found');
        }

        if (typeof CheckForButtonPress === 'function') {
            CheckForButtonPress();
        } else {
            console.warn('CheckForButtonPress function not found');
        }

        if (typeof PresetsButtons === 'function') {
            PresetsButtons();
        } else {
            console.warn('PresetsButtons function not found');
        }

        const userConfig = readOrCreateUserConfig();
        const isNewUser = userConfig && userConfig.lastLogin &&
            (new Date() - new Date(userConfig.lastLogin)) < 60000;

        if (isNewUser) {
            SendNotification(`Welcome to ExcaliburFx, ${userConfig.username}!`, true, true);
        } else {
            SendNotification('Welcome Back', true, true);
        }

        setTimeout(() => {
            readSetGo();

            setTimeout(() => {
                if (typeof forceRedrawAllPresets === 'function') {
                    forceRedrawAllPresets();
                } else {
                    console.warn('forceRedrawAllPresets function not available for final redraw');
                }
            }, 600);
        }, 500);

        console.log('Main application startup complete');
    } catch (error) {
        console.error('Error in startMainApp:', error);
        readSetGo();
    }
}

(async function startApp() {
    try {
        console.log('Starting ExcaliburFX application...');

        initUI();

        const progressBar = document.getElementById("StartLoadingbarProgress");
        if (progressBar) {
            progressBar.style.width = "0%";
        }

        let retryCount = 0;
        while (typeof CSInterface === "undefined" && retryCount < 500) {
            await new Promise(r => setTimeout(r, 10));
            retryCount++;
        }

        if (typeof CSInterface === "undefined") {
            console.error('CSInterface not available after timeout');
        }

        if (!hasValidUserSession()) {
            console.log('No valid session found, showing login screen');
            showLoginScreen();
        } else {
            console.log('Valid session found, starting main app');
            hideLoginScreen();

            const userConfig = readOrCreateUserConfig();
            const loadingElement = document.getElementById("Loading");
            if (loadingElement) {
                const welcomeText = loadingElement.querySelector("h1");
                if (welcomeText && userConfig && userConfig.username) {
                    welcomeText.textContent = `Welcome back, ${userConfig.username}!`;
                }
            }

            await startMainApp();
        }
    } catch (error) {
        console.error('Error in startApp:', error);

        try {
            showLoginScreen();
        } catch (loginError) {
            console.error('Failed to show login screen:', loginError);

            const loading = document.getElementById("Loading");
            const bluredBG = document.getElementById("BluredBG");
            if (loading) loading.style.display = "none";
            if (bluredBG) bluredBG.style.display = "none";
        }
    }
})();

function downloadJSAtOnload() {
    //Cette fonction est appelée par l'HTML mais le démarrage se fait déjà automatiquement
    //via l'IIFE startApp() ci-dessus
}


// TODO: RESIZE FUNCTION

function ScaleToTheWidth() {
    var create_curve = document.getElementById("create_curve");
    var tab_1 = document.getElementById("tab_1");
    var tab_2 = document.getElementById("tab_2");
    var tab_3 = document.getElementById("tab_3");
    var tab_4 = document.getElementById("tab_4");
    var tab_5 = document.getElementById("tab_5");
    var tab_6 = document.getElementById("tab_6");
    var tab_7 = document.getElementById("tab_7");


    var midsec = document.getElementById("midsec");

    if (window.innerWidth - (window.innerWidth * 0.15) > window.innerHeight) {
        create_curve.style.transform = 'scale(1) translate(-50%, 0)';
        tab_1.style.transform = 'none';
        tab_2.style.transform = 'none';
        tab_3.style.transform = 'none';
        tab_4.style.transform = 'none';
        tab_5.style.transform = 'none';
        tab_6.style.transform = 'none';
        tab_7.style.transform = 'none';
        if (midsec) midsec.style.transform = 'scale(1) translate(-50%, 0)';
        if (document.getElementById("volumebar")) document.getElementById("volumebar").style.transform = 'scale(1)'; //example sur volume bar

        return;
    }

    var scaleFactor = (window.innerWidth / tab_2.offsetWidth) - ((window.innerWidth / tab_2.offsetWidth) * 0.15);

    create_curve.style.transform = 'scale(' + scaleFactor + ') translate(-50%, 0)';

    var pleaseKillMeTy = 'scaleX(' + scaleFactor + ') scaleY(' + scaleFactor + ') scaleZ(1) translateZ(0px)';
    tab_1.style.transform = pleaseKillMeTy;
    tab_2.style.transform = pleaseKillMeTy;
    tab_3.style.transform = pleaseKillMeTy;
    tab_4.style.transform = pleaseKillMeTy;
    tab_5.style.transform = pleaseKillMeTy;
    tab_6.style.transform = pleaseKillMeTy;
    tab_7.style.transform = pleaseKillMeTy;
    if (midsec) midsec.style.transform = pleaseKillMeTy + ' translate(-50%, 0)';
    if (document.getElementById("volumebar")) document.getElementById("volumebar").style.transform = pleaseKillMeTy;
}

window.addEventListener('resize', ScaleToTheWidth);
























// GET ALL PARAM !!!!! Code by @sheepex mainly, adjusted
// (no scam hmm)
async function _getSystemParameters() {
    const execSync = require('child_process').execSync;

    try {
        const output = execSync("wmic cpu get ProcessorId", { encoding: 'utf8' });
        return output.split(/\r?\n/).find(line => line.trim() && line.indexOf('ProcessorId') === -1)?.trim() || 'Unknown';
    } catch (e) {
        console.warn("Failed to get CPU serial:", e);
        return 'Unknown';
    }
}

async function _getSystemParameters_WIN_11() {
    const execSync = require('child_process').execSync;

    try {
        const machineGuid = execSync(
            "reg query HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography /v MachineGuid"
        ).toString().trim().split("    ").pop(); // récupère la valeur après les espaces

        const diskSerial = execSync(
            'powershell -command "(Get-PhysicalDisk | Select-Object -First 1).SerialNumber"'
        ).toString().trim();

        const cpuSerial = execSync(
            'powershell -command "(Get-WmiObject Win32_Processor | Select-Object -ExpandProperty ProcessorId)"'
        ).toString().trim();

        const macAddress = execSync(
            'powershell -command "Get-NetAdapter -Physical | Select-Object -First 1 -ExpandProperty MacAddress"'
        ).toString().trim();

        return {
            machineGuid,
            diskSerial,
            cpuSerial,
            macAddress
        };
    } catch (e) {
        console.warn("Failed to get Windows 11 system parameters:", e);
        return {
            machineGuid: 'Unknown',
            diskSerial: 'Unknown',
            cpuSerial: 'Unknown',
            macAddress: 'Unknown'
        };
    }
}



async function StartGetParams() {
    let systemParameters;

    try {
        systemParameters = await _getSystemParameters();
    } catch (e) {
        createLogEntry("HWID [Windows 11 24H2 detected]");
        systemParameters = await _getSystemParameters_WIN_11();
    }

    const generatedSystemHash = await _generateHash(systemParameters);
    return { systemParameters, generatedSystemHash };
}








function resetDiv(divId) {
    var div = document.getElementById(divId);
    if (!div) return;

    while (div.firstChild) {
        div.removeChild(div.firstChild);
    }
    div.style.backgroundSize = "contain";
    div.style.position = "relative";
}

function drawCubicBezierVisualizer(divId, x1, y1, x2, y2) {
    var div = document.getElementById(divId);
    if (!div) return;

    // Nettoyer le div
    while (div.firstChild) {
        div.removeChild(div.firstChild);
    }

    var container = document.createElement("div");
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.position = "absolute";
    container.style.top = "0";
    container.style.left = "0";
    container.style.pointerEvents = "none";
    div.appendChild(container);
    div.style.backgroundSize = "0px";
    div.style.position = "relative";

    var paddingPercentage = 0.175;

    function calculateControlPoints() {
        var width = div.offsetHeight;
        var containerWidth = container.offsetWidth;
        var paddingX = containerWidth * paddingPercentage;
        var paddingY = width * paddingPercentage;
        var ctrlX1 = Math.max(0, Math.min(x1 * (containerWidth - 2 * paddingX) + paddingX, containerWidth - paddingX));
        var ctrlY1 = Math.max(0, Math.min((1 - y1) * (width - 2 * paddingY) + paddingY, width - paddingY));
        var ctrlX2 = Math.max(0, Math.min(x2 * (containerWidth - 2 * paddingX) + paddingX, containerWidth - paddingX));
        var ctrlY2 = Math.max(0, Math.min((1 - y2) * (width - 2 * paddingY) + paddingY, width - paddingY));
        return [ctrlX1, ctrlY1, ctrlX2, ctrlY2];
    }

    var canvas = document.createElement("canvas");
    canvas.style.pointerEvents = "none";
    container.appendChild(canvas);

    function drawCurve() {
        var width = div.offsetHeight;
        var containerWidth = container.offsetWidth;
        var ctx = canvas.getContext("2d");
        var points = calculateControlPoints();

        canvas.width = containerWidth;
        canvas.height = width;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.beginPath();
        ctx.moveTo(paddingPercentage * containerWidth, (1 - paddingPercentage) * width);
        ctx.bezierCurveTo(points[0], points[1], points[2], points[3], (1 - paddingPercentage) * containerWidth, paddingPercentage * width);
        ctx.strokeStyle = getCSSVar('--accent-light');
        ctx.lineWidth = width / 25;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(paddingPercentage * containerWidth, (1 - paddingPercentage) * width);
        ctx.lineTo(points[0], points[1]);
        ctx.strokeStyle = "white";
        ctx.lineWidth = width / 29;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo((1 - paddingPercentage) * containerWidth, paddingPercentage * width);
        ctx.lineTo(points[2], points[3]);
        ctx.strokeStyle = "white";
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(points[0], points[1], width / 20, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(points[2], points[3], width / 20, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.fill();
    }

    drawCurve();

    var resizeHandler = function () { drawCurve(); };
    window.removeEventListener('resize', resizeHandler);
    window.addEventListener('resize', resizeHandler);
}

function LiveDrawCubicBezierVisualizerForLiveCurve(divId, x1, y1, x2, y2) {
    var div = document.getElementById(divId);
    if (!div) return;

    while (div.firstChild) {
        div.removeChild(div.firstChild);
    }

    var container = document.createElement("div");
    container.style.position = "absolute";
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.top = "0";
    container.style.left = "0";
    div.appendChild(container);
    div.style.backgroundSize = "0px";

    var paddingPercentage = 0.05;
    var draggingControlPoint = null;

    function calculateControlPoints() {
        var width = div.offsetHeight;
        var containerWidth = container.offsetWidth;
        var paddingX = containerWidth * paddingPercentage;
        var paddingY = width * paddingPercentage;
        var ctrlX1 = Math.max(0, Math.min(x1 * (containerWidth - 2 * paddingX) + paddingX, containerWidth - paddingX));
        var ctrlY1 = Math.max(0, Math.min((1 - y1) * (width - 2 * paddingY) + paddingY, width - paddingY));
        var ctrlX2 = Math.max(0, Math.min(x2 * (containerWidth - 2 * paddingX) + paddingX, containerWidth - paddingX));
        var ctrlY2 = Math.max(0, Math.min((1 - y2) * (width - 2 * paddingY) + paddingY, width - paddingY));
        return [ctrlX1, ctrlY1, ctrlX2, ctrlY2];
    }

    var canvas = document.createElement("canvas");
    canvas.style.cursor = "Crosshair";
    container.appendChild(canvas);

    function drawCurve() {
        var width = div.offsetHeight;
        var containerWidth = container.offsetWidth;
        var ctx = canvas.getContext("2d");
        var points = calculateControlPoints();

        var paddedContainerWidth = containerWidth * (1 - 2 * paddingPercentage);
        var paddedHeight = width * (1 - 2 * paddingPercentage);
        canvas.width = containerWidth;
        canvas.height = width;

        if (canvas.offsetWidth > 0 && canvas.offsetHeight > 0) {
            ctx.beginPath();
            for (var x = containerWidth * paddingPercentage; x <= containerWidth * Math.round(1 - paddingPercentage); x += paddedContainerWidth / 4) {
                ctx.moveTo(x, width * paddingPercentage);
                ctx.lineTo(x, width * (1 - paddingPercentage));
            }
            for (var y = width * paddingPercentage; y <= width * Math.round(1 - paddingPercentage); y += paddedHeight / 4) {
                ctx.moveTo(containerWidth * paddingPercentage, y);
                ctx.lineTo(containerWidth * (1 - paddingPercentage), y);
            }
            ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
            ctx.lineWidth = div.offsetHeight * 0.005;
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.moveTo(paddingPercentage * containerWidth, (1 - paddingPercentage) * width);
        ctx.bezierCurveTo(points[0], points[1], points[2], points[3], (1 - paddingPercentage) * containerWidth, paddingPercentage * width);
        ctx.strokeStyle = "white";
        ctx.lineWidth = width / 80;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(paddingPercentage * containerWidth, (1 - paddingPercentage) * width);
        ctx.lineTo(points[0], points[1]);
        ctx.strokeStyle = getCSSVar('--accent-light');
        ctx.lineWidth = width / 55;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo((1 - paddingPercentage) * containerWidth, paddingPercentage * width);
        ctx.lineTo(points[2], points[3]);
        ctx.strokeStyle = getCSSVar('--accent-light');
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(points[0], points[1], width / 40, 0, Math.PI * 2);
        ctx.fillStyle = getCSSVar('--accent-light');
        ctx.fill();

        ctx.beginPath();
        ctx.arc(points[2], points[3], width / 40, 0, Math.PI * 2);
        ctx.fillStyle = getCSSVar('--accent-light');
        ctx.fill();
    }

    function getScaleFactor(element) {
        const style = window.getComputedStyle(element);
        const transform = style.transform || style.webkitTransform || style.mozTransform;
        const matrix = transform.match(/^matrix\((.+)\)$/);
        return matrix ? parseFloat(matrix[1].split(', ')[0]) : 1;
    }

    function getMousePos(canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        var liveCurves = document.getElementById("liveCurves");
        var scaleFactor = getScaleFactor(liveCurves);
        return {
            x: (evt.clientX - rect.left) / scaleFactor,
            y: (evt.clientY - rect.top) / scaleFactor
        };
    }

    canvas.addEventListener("mousedown", function (evt) {
        var mousePos = getMousePos(canvas, evt);
        var width = div.offsetHeight;
        var points = calculateControlPoints();

        if (Math.sqrt(Math.pow(mousePos.x - points[0], 2) + Math.pow(mousePos.y - points[1], 2)) <= width / 20) {
            draggingControlPoint = 1;
        } else if (Math.sqrt(Math.pow(mousePos.x - points[2], 2) + Math.pow(mousePos.y - points[3], 2)) <= width / 20) {
            draggingControlPoint = 2;
        }
        drawCurve();
    });

    canvas.addEventListener("mousemove", function (evt) {
        if (draggingControlPoint !== null) {
            document.body.style.userSelect = "none";
            canvas.style.cursor = "Crosshair";

            var mousePos = getMousePos(canvas, evt);
            var width = div.offsetHeight;
            var containerWidth = container.offsetWidth;
            var paddingX = containerWidth * paddingPercentage;
            var paddingY = width * paddingPercentage;

            if (draggingControlPoint === 1) {
                L_setNewX1 = x1 = Math.max(0, Math.min((mousePos.x - paddingX) / (containerWidth - 2 * paddingX), 1));
                L_setNewY1 = y1 = Math.max(0, Math.min(1 - (mousePos.y - paddingY) / (width - 2 * paddingY), 1));
                document.getElementById("Curve_Val_live").value =
                    Number(L_setNewX1).toFixed(2) + " | " + Number(L_setNewY1).toFixed(2) + " | " +
                    Number(L_setNewX2).toFixed(2) + " | " + Number(L_setNewY2).toFixed(2);
            } else if (draggingControlPoint === 2) {
                L_setNewX2 = x2 = Math.max(0, Math.min((mousePos.x - paddingX) / (containerWidth - 2 * paddingX), 1));
                L_setNewY2 = y2 = Math.max(0, Math.min(1 - (mousePos.y - paddingY) / (width - 2 * paddingY), 1));
                document.getElementById("Curve_Val_live").value =
                    Number(L_setNewX1).toFixed(2) + " | " + Number(L_setNewY1).toFixed(2) + " | " +
                    Number(L_setNewX2).toFixed(2) + " | " + Number(L_setNewY2).toFixed(2);
            }

            drawCurve();
        }
    });

    canvas.addEventListener("mouseup", function () {
        document.body.style.userSelect = "";
        draggingControlPoint = null;
        canvas.style.cursor = "Crosshair";
    });

    canvas.addEventListener("mouseleave", function () {
        document.body.style.userSelect = "";
        draggingControlPoint = null;
        canvas.style.cursor = "Crosshair";
    });

    drawCurve();

    var resizeHandler = function () { drawCurve(); };
    window.removeEventListener('resize', resizeHandler);
    window.addEventListener('resize', resizeHandler);

    var CopyButton = document.getElementById("CopyCurve_live");
    var PasteButton = document.getElementById("PasteCurve_live");

    if (CopyButton) {
        var newCopyButton = CopyButton.cloneNode(true);
        CopyButton.parentNode.replaceChild(newCopyButton, CopyButton);

        newCopyButton.addEventListener("click", function () {
            if (GlobalsCurrentTab != 1) return;
            copy_x1 = x1;
            copy_y1 = y1;
            copy_x2 = x2;
            copy_y2 = y2;
            hasCopyValue = true;
            SendNotification("Curve Copied!");
        });
    }

    if (PasteButton) {
        var newPasteButton = PasteButton.cloneNode(true);
        PasteButton.parentNode.replaceChild(newPasteButton, PasteButton);

        newPasteButton.addEventListener("click", function () {
            if (GlobalsCurrentTab != 1) return;
            if (!hasCopyValue) {
                SendNotification("No Curve Copied!", true, false);
                return;
            }
            L_setNewX1 = x1 = copy_x1;
            L_setNewY1 = y1 = copy_y1;
            L_setNewX2 = x2 = copy_x2;
            L_setNewY2 = y2 = copy_y2;
            document.getElementById("Curve_Val_live").value =
                Number(L_setNewX1).toFixed(2) + " | " + Number(L_setNewY1).toFixed(2) + " | " +
                Number(L_setNewX2).toFixed(2) + " | " + Number(L_setNewY2).toFixed(2);
            drawCurve();
            SendNotification("Curve Pasted!");
        });
    }

    document.getElementById("Curve_Val_live").value =
        Number(L_setNewX1).toFixed(2) + " | " + Number(L_setNewY1).toFixed(2) + " | " +
        Number(L_setNewX2).toFixed(2) + " | " + Number(L_setNewY2).toFixed(2);
}



var hasCopyValue = false;
var copy_x1 = 0, copy_y1 = 0, copy_x2 = 0, copy_y2 = 0;


var GetARandomCurvePresetV2 = 0;

function LiveDrawCubicBezierVisualizer(divId, x1, y1, x2, y2) {
    var div = document.getElementById(divId);
    var container = document.createElement("div");
    container.style.position = "relative";
    div.appendChild(container);
    div.style.backgroundSize = "0px";

    var paddingPercentage = 0.05;

    function calculateControlPoints() {
        var width = div.offsetHeight;
        var containerWidth = container.offsetWidth;
        var paddingX = containerWidth * paddingPercentage;
        var paddingY = width * paddingPercentage;
        var ctrlX1 = Math.max(0, Math.min(x1 * (containerWidth - 2 * paddingX) + paddingX, containerWidth - paddingX));
        var ctrlY1 = Math.max(0, Math.min((1 - y1) * (width - 2 * paddingY) + paddingY, width - paddingY));
        var ctrlX2 = Math.max(0, Math.min(x2 * (containerWidth - 2 * paddingX) + paddingX, containerWidth - paddingX));
        var ctrlY2 = Math.max(0, Math.min((1 - y2) * (width - 2 * paddingY) + paddingY, width - paddingY));
        return [ctrlX1, ctrlY1, ctrlX2, ctrlY2];
    }

    var canvas = document.createElement("canvas");
    container.appendChild(canvas);

    function drawCurve() {
        var width = div.offsetHeight;
        var containerWidth = container.offsetWidth;
        var ctx = canvas.getContext("2d");
        var points = calculateControlPoints();

        var paddedContainerWidth = containerWidth * (1 - 2 * paddingPercentage);
        var paddedHeight = width * (1 - 2 * paddingPercentage);
        canvas.width = containerWidth;
        canvas.height = width;

        if (canvas.offsetWidth > 0 && canvas.offsetHeight > 0) {
            ctx.beginPath();
            for (var x = containerWidth * paddingPercentage; x <= containerWidth * Math.round(1 - paddingPercentage); x += paddedContainerWidth / 4) {
                ctx.moveTo(x, width * paddingPercentage);
                ctx.lineTo(x, width * (1 - paddingPercentage));
            }
            for (var y = width * paddingPercentage; y <= width * Math.round(1 - paddingPercentage); y += paddedHeight / 4) {
                ctx.moveTo(containerWidth * paddingPercentage, y);
                ctx.lineTo(containerWidth * (1 - paddingPercentage), y);
            }
            ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
            ctx.lineWidth = div.offsetHeight * 0.005;
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.moveTo(paddingPercentage * containerWidth, (1 - paddingPercentage) * width);
        ctx.bezierCurveTo(points[0], points[1], points[2], points[3], (1 - paddingPercentage) * containerWidth, paddingPercentage * width);
        ctx.strokeStyle = "white";
        ctx.lineWidth = width / 60;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(paddingPercentage * containerWidth, (1 - paddingPercentage) * width);
        ctx.lineTo(points[0], points[1]);
        ctx.strokeStyle = getCSSVar('--accent-light');
        ctx.lineWidth = width / 50;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo((1 - paddingPercentage) * containerWidth, paddingPercentage * width);
        ctx.lineTo(points[2], points[3]);
        ctx.strokeStyle = getCSSVar('--accent-light');
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(points[0], points[1], width / 30, 0, Math.PI * 2);
        ctx.fillStyle = getCSSVar('--accent-light');
        ctx.fill();

        ctx.beginPath();
        ctx.arc(points[2], points[3], width / 30, 0, Math.PI * 2);
        ctx.fillStyle = getCSSVar('--accent-light');
        ctx.fill();
    }
    drawCurve();

    window.addEventListener('resize', function () {
        drawCurve();
    });

    drawCurve_live2_Inverval = setInterval(drawCurve, 1);

    var draggingControlPoint = null;

    function getScaleFactor(element) {
        const style = window.getComputedStyle(element);
        const transform = style.transform || style.webkitTransform || style.mozTransform;
        const matrix = transform.match(/^matrix\((.+)\)$/);
        return matrix ? parseFloat(matrix[1].split(', ')[0]) : 1;
    }

    function getMousePos(canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        var create_curve = document.getElementById("create_curve");
        var scaleFactor = getScaleFactor(create_curve);
        return {
            x: (evt.clientX - rect.left) / scaleFactor,
            y: (evt.clientY - rect.top) / scaleFactor
        };
    }

    canvas.addEventListener("mousedown", function (evt) {
        var mousePos = getMousePos(canvas, evt);
        var width = div.offsetHeight;
        var points = calculateControlPoints();
        div.style.cursor = "Crosshair";

        if (Math.sqrt(Math.pow(mousePos.x - points[0], 2) + Math.pow(mousePos.y - points[1], 2)) <= width / 20) {
            draggingControlPoint = 1;
        } else if (Math.sqrt(Math.pow(mousePos.x - points[2], 2) + Math.pow(mousePos.y - points[3], 2)) <= width / 20) {
            draggingControlPoint = 2;
        }
        drawCurve();
    });

    var old_val = document.getElementById("Curve_Val").value;

    window.addEventListener("mousemove", function (evt) {
        if (GlobalsCurrentTab != 1) return;
        if (draggingControlPoint !== null) {
            document.body.style.userSelect = "none";
            var mousePos = getMousePos(canvas, evt);
            var width = div.offsetHeight;
            var containerWidth = container.offsetWidth;
            var paddingX = containerWidth * paddingPercentage;
            var paddingY = width * paddingPercentage;

            switch (draggingControlPoint) {
                case 1:
                    {
                        setNewX1 = x1 = Math.max(0, Math.min((mousePos.x - paddingX) / (containerWidth - 2 * paddingX), 1));
                        setNewY1 = y1 = Math.max(0, Math.min(1 - (mousePos.y - paddingY) / (width - 2 * paddingY), 1));
                        if (old_val != Number(setNewX1).toFixed(2) + ", " + Number(setNewY1).toFixed(2) + ", " + Number(setNewX2).toFixed(2) + ", " + Number(setNewY2).toFixed(2))
                            document.getElementById("Curve_Val").value = Number(setNewX1).toFixed(2) + ", " + Number(setNewY1).toFixed(2) + ", " + Number(setNewX2).toFixed(2) + ", " + Number(setNewY2).toFixed(2);
                    }
                    break;
                case 2:
                    {
                        setNewX2 = x2 = Math.max(0, Math.min((mousePos.x - paddingX) / (containerWidth - 2 * paddingX), 1));
                        setNewY2 = y2 = Math.max(0, Math.min(1 - (mousePos.y - paddingY) / (width - 2 * paddingY), 1));
                        if (old_val != Number(setNewX1).toFixed(2) + ", " + Number(setNewY1).toFixed(2) + ", " + Number(setNewX2).toFixed(2) + ", " + Number(setNewY2).toFixed(2))
                            document.getElementById("Curve_Val").value = Number(setNewX1).toFixed(2) + ", " + Number(setNewY1).toFixed(2) + ", " + Number(setNewX2).toFixed(2) + ", " + Number(setNewY2).toFixed(2);
                    }
                    break;
            }

            drawCurve();
        }
    });

    window.addEventListener("mouseup", function () {
        if (GlobalsCurrentTab != 1) return;
        document.body.style.userSelect = "";
        draggingControlPoint = null;
        div.style.cursor = "Crosshair";
    });

    var CopyButton = document.getElementById("CopyCurve");
    var PasteButton = document.getElementById("PasteCurve");

    CopyButton.addEventListener("click", function () {
        if (GlobalsCurrentTab != 1) return;
        copy_x1 = x1;
        copy_y1 = y1;
        copy_x2 = x2;
        copy_y2 = y2;
        if (!hasCopyValue) hasCopyValue = true;
        SendNotification("Curve Copied!");
    });

    PasteButton.addEventListener("click", function () {
        if (GlobalsCurrentTab != 1) return;
        if (!hasCopyValue) {
            SendNotification("No Curve Copied!", true, false);
            return;
        }
        setNewX1 = x1 = copy_x1;
        setNewY1 = y1 = copy_y1;
        setNewX2 = x2 = copy_x2;
        setNewY2 = y2 = copy_y2;
        document.getElementById("Curve_Val").value = Number(setNewX1).toFixed(2) + ", " + Number(setNewY1).toFixed(2) + ", " + Number(setNewX2).toFixed(2) + ", " + Number(setNewY2).toFixed(2);
        SendNotification("Curve Pasted!");
    });



    if (old_val != Number(setNewX1).toFixed(2) + ", " + Number(setNewY1).toFixed(2) + ", " + Number(setNewX2).toFixed(2) + ", " + Number(setNewY2).toFixed(2))
        document.getElementById("Curve_Val").value = Number(setNewX1).toFixed(2) + ", " + Number(setNewY1).toFixed(2) + ", " + Number(setNewX2).toFixed(2) + ", " + Number(setNewY2).toFixed(2);
}



function returnToOrigPos() {
    var tab1 = document.getElementById("tab_1");
    var set_custom_curveTab = document.getElementById("create_curve");

    tab1.style.transition = margin_time_min + ", " + opacity_time + ", " + top_time_min;
    tab1.style.zIndex = "1";
    tab1.style.marginTop = "-10vh";

    curveWrapper.style.transform = "scale(0.6)";
    curveWrapper.style.transition = "transform " + Math.round(settingsData[0].ui_animation_speed) + "ms cubic-bezier(.61,-0.01,1,.45)";

    set_custom_curveTab.style.transition = margin_time_min + ", " + opacity_time;
    set_custom_curveTab.style.opacity = "0%";
    set_custom_curveTab.style.zIndex = "0";
}

function formatCurveName(name) {
    if (!name) return "";

    let result = "";
    const maxLength = 12;

    for (let i = 0; i < name.length && i < maxLength; i++) {
        const char = name[i];
        const isLongChar = ['W', 'M', 'O', 'G', 'H'].includes(char.toUpperCase());
        const effectiveMax = isLongChar ? 8 : 10;

        if (i < effectiveMax) {
            result += i === 0 ? char.toUpperCase() : char.toLowerCase();
        } else if (i <= maxLength) {
            result += ".";
        }
    }

    return result;
}

function LoadCustomCurves() {
    const { curves } = customFileReadOrCreate();

    for (let i = 0; i < 20; i++) {
        const curve = curves[i];
        const buttonId = `custom_${i + 1}`;
        const buttonElement = document.getElementById(buttonId);

        if (!buttonElement) continue;

        if (curve.active && curve.name) {
            const displayName = formatCurveName(curve.name);
            buttonElement.innerHTML = `<span class="curve_label">${displayName}</span>`;

            setTimeout(() => {
                resetDiv(buttonId);
                drawCubicBezierVisualizer(
                    buttonId,
                    parseFloat(curve.x1),
                    parseFloat(curve.y1),
                    parseFloat(curve.x2),
                    parseFloat(curve.y2)
                );
            }, 50);
        } else {
            buttonElement.innerHTML = `<span class="curve_label">Add Custom</span>`;
            resetDiv(buttonId);
        }
    }
}

function forceRedrawAllPresets() {
    setTimeout(() => {
        if (document.getElementById("CUR_In_Preset")) {
            resetDiv("CUR_In_Preset");
            drawCubicBezierVisualizer("CUR_In_Preset", 0, 0, 0, 1);
        }
        if (document.getElementById("CUR_Out_Preset")) {
            resetDiv("CUR_Out_Preset");
            drawCubicBezierVisualizer("CUR_Out_Preset", 1, 0, 1, 1);
        }
        if (document.getElementById("CUR_SpeedRamp_Preset")) {
            resetDiv("CUR_SpeedRamp_Preset");
            drawCubicBezierVisualizer("CUR_SpeedRamp_Preset", 0.20, 0.80, 0.80, 0.20);
        }
        if (document.getElementById("CUR_S_Preset")) {
            resetDiv("CUR_S_Preset");
            drawCubicBezierVisualizer("CUR_S_Preset", 0.6, 0, 0.3, 1);
        }
        if (document.getElementById("CUR_Reset")) {
            resetDiv("CUR_Reset");
            drawCubicBezierVisualizer("CUR_Reset", 0, 0, 1, 1);
        }

        LoadCustomCurves();
    }, 100);

    setTimeout(() => {
        if (document.getElementById("CUR_In_Preset")) {
            drawCubicBezierVisualizer("CUR_In_Preset", 0, 0, 0, 1);
            drawCubicBezierVisualizer("CUR_Out_Preset", 1, 0, 1, 1);
            drawCubicBezierVisualizer("CUR_SpeedRamp_Preset", 0.20, 0.80, 0.80, 0.20);
            drawCubicBezierVisualizer("CUR_S_Preset", 0.6, 0, 0.3, 1);
            drawCubicBezierVisualizer("CUR_Reset", 0, 0, 1, 1);
        }
    }, 300);
}

function PresetsButtons() {
    var interfaceEntrypoint = new CSInterface();

    var Preset1 = document.getElementById("CUR_In_Preset");
    var Preset2 = document.getElementById("CUR_Out_Preset");
    var Preset3 = document.getElementById("CUR_SpeedRamp_Preset");
    var Preset4 = document.getElementById("CUR_S_Preset");
    var None = document.getElementById("CUR_Reset");

    Preset1.addEventListener("click", function () { if (GlobalsCurrentTab != 1) return; if (document.getElementById("create_curve").style.opacity === '1') return; interfaceEntrypoint.evalScript(`ApplyCurveToKeyFramesExcalibur(0, 0.0, 0, 1)`); });
    Preset2.addEventListener("click", function () { if (GlobalsCurrentTab != 1) return; if (document.getElementById("create_curve").style.opacity === '1') return; interfaceEntrypoint.evalScript(`ApplyCurveToKeyFramesExcalibur(1, 0, 1, 1)`); });
    Preset3.addEventListener("click", function () { if (GlobalsCurrentTab != 1) return; if (document.getElementById("create_curve").style.opacity === '1') return; interfaceEntrypoint.evalScript(`ApplyCurveToKeyFramesExcalibur(0.22, 0.85, 0.79, 0.19)`); });
    Preset4.addEventListener("click", function () { if (GlobalsCurrentTab != 1) return; if (document.getElementById("create_curve").style.opacity === '1') return; interfaceEntrypoint.evalScript(`ApplyCurveToKeyFramesExcalibur(0.6, 0, 0.3, 1)`); });
    None.addEventListener("click", function () { if (GlobalsCurrentTab != 1) return; if (document.getElementById("create_curve").style.opacity === '1') return; interfaceEntrypoint.evalScript(`ApplyCurveToKeyFramesExcalibur(0, 0, 1, 1)`); });
}
function openCurveEditor(slotIndex, existingCurve) {
    const tab1 = document.getElementById("tab_1");
    const set_custom_curveTab = document.getElementById("create_curve");
    const curveWrapper = document.getElementById("curveWrapper");

    currentEditingSlot = slotIndex;
    isEditMode = existingCurve !== null;

    CloseDashBoard();

    set_custom_curveTab.style.transition = margin_time_min + ", " + opacity_time;
    set_custom_curveTab.style.marginTop = "10vh";
    set_custom_curveTab.style.opacity = "100%";
    set_custom_curveTab.style.zIndex = "11111111";

    curveWrapper.style.transform = "scale(1)";
    curveWrapper.style.transition = "transform 300ms cubic-bezier(.61,-0.01,1,.45)";


    tab1.style.transition = margin_time_min + ", " + opacity_time + ", " + top_time_min;
    tab1.style.opacity = "0%";
    tab1.style.zIndex = "0";
    tab1.style.marginTop = "0vh";

    if (existingCurve) {
        setNewX1 = parseFloat(existingCurve.x1);
        setNewY1 = parseFloat(existingCurve.y1);
        setNewX2 = parseFloat(existingCurve.x2);
        setNewY2 = parseFloat(existingCurve.y2);
        document.getElementById("Curve_Name").value = existingCurve.name;
    } else {
        // Générer une courbe aléatoire par défaut
        const presets = [
            { x1: 0.5, y1: 0, x2: 0.5, y2: 1 },
            { x1: 0, y1: 0, x2: 0, y2: 1 },
            { x1: 1, y1: 0, x2: 1, y2: 1 },
            { x1: 0.2, y1: 0.8, x2: 0.8, y2: 0.2 },
            { x1: 0, y1: 0, x2: 1, y2: 1 }
        ];

        const preset = presets[Math.floor(Math.random() * presets.length)];
        setNewX1 = preset.x1;
        setNewY1 = preset.y1;
        setNewX2 = preset.x2;
        setNewY2 = preset.y2;
        document.getElementById("Curve_Name").value = "";
    }

    document.getElementById("Curve_Val").value =
        `${setNewX1.toFixed(2)}, ${setNewY1.toFixed(2)}, ${setNewX2.toFixed(2)}, ${setNewY2.toFixed(2)}`;

    resetDiv("CurvePreview");
    LiveDrawCubicBezierVisualizer("CurvePreview", setNewX1, setNewY1, setNewX2, setNewY2);
}

function closeCurveEditor() {
    const tab1 = document.getElementById("tab_1");
    const set_custom_curveTab = document.getElementById("create_curve");
    const curveWrapper = document.getElementById("curveWrapper");

    set_custom_curveTab.style.transition = margin_time_min + ", " + opacity_time;
    set_custom_curveTab.style.opacity = "0%";
    set_custom_curveTab.style.zIndex = "0";

    curveWrapper.style.transform = "scale(0.6)";
    curveWrapper.style.transition = "transform 200ms cubic-bezier(.61,-0.01,1,.45)";

    tab1.style.transition = margin_time_min + ", " + opacity_time + ", " + top_time_min;
    tab1.style.opacity = "100%";
    tab1.style.zIndex = "1";
    tab1.style.marginTop = "-10vh";

    currentEditingSlot = null;
    isEditMode = false;
}


function CheckForButtonPress() {
    var interfaceEntrypoint = new CSInterface();
    const { curves: dataArray } = customFileReadOrCreate();

    if (!dataArray) {
        interfaceEntrypoint.evalScript(`SendJSX_SCRIPT_ALERT_ERROR("Failed to load curves data")`);
        return;
    }

    var tab1 = document.getElementById("tab_1");
    var ButtonRemove = document.getElementById("Curve_Remove");
    var ButtonGoBack = document.getElementById("Curve_GoBack");
    var ButtonApply = document.getElementById("Curve_Apply");
    var set_custom_curveTab = document.getElementById("create_curve");
    var curveWrapper = document.getElementById("curveWrapper");

    var loadedButtonIndex = 0;
    var getbuttonname = "";

    function openCurveEditorForSlot(index, dataArray, buttonName) {
        CloseDashBoard();

        set_custom_curveTab.style.transition = margin_time_min + ", " + opacity_time;
        set_custom_curveTab.style.marginTop = "10vh";
        set_custom_curveTab.style.opacity = "100%";
        set_custom_curveTab.style.zIndex = "11111111";

        curveWrapper.style.transform = "scale(1)";
        curveWrapper.style.transition = "transform 300ms cubic-bezier(0,.68,.39,1)";

        tab1.style.transition = margin_time_min + ", " + opacity_time + ", " + top_time_min;
        tab1.style.opacity = "0%";
        tab1.style.zIndex = "0";
        tab1.style.marginTop = "0vh";

        loadedButtonIndex = index;
        getbuttonname = buttonName;

        if (dataArray[index].active) {
            setNewX1 = parseFloat(dataArray[index].x1);
            setNewY1 = parseFloat(dataArray[index].y1);
            setNewX2 = parseFloat(dataArray[index].x2);
            setNewY2 = parseFloat(dataArray[index].y2);
            document.getElementById("Curve_Name").value = dataArray[index].name || "";
        } else {
            const presets = [
                { x1: 0.5, y1: 0, x2: 0.5, y2: 1 },
                { x1: 0, y1: 0, x2: 0, y2: 1 },
                { x1: 1, y1: 0, x2: 1, y2: 1 },
                { x1: 0.2, y1: 0.8, x2: 0.8, y2: 0.2 },
                { x1: 0, y1: 0, x2: 1, y2: 1 }
            ];
            const preset = presets[GetARandomCurvePreset % presets.length];
            setNewX1 = preset.x1;
            setNewY1 = preset.y1;
            setNewX2 = preset.x2;
            setNewY2 = preset.y2;
            GetARandomCurvePreset++;
            document.getElementById("Curve_Name").value = "";
        }

        document.getElementById("Curve_Val").value =
            `${Number(setNewX1).toFixed(2)}, ${Number(setNewY1).toFixed(2)}, ${Number(setNewX2).toFixed(2)}, ${Number(setNewY2).toFixed(2)}`;

        resetDiv("CurvePreview");
        LiveDrawCubicBezierVisualizer("CurvePreview", setNewX1, setNewY1, setNewX2, setNewY2);
    }

    function closeEditor() {
        set_custom_curveTab.style.transition = margin_time_min + ", " + opacity_time;
        set_custom_curveTab.style.opacity = "0%";
        set_custom_curveTab.style.zIndex = "0";

        curveWrapper.style.transform = "scale(0.6)";
        curveWrapper.style.transition = "transform 200ms cubic-bezier(.61,-0.01,1,.45)";

        tab1.style.transition = margin_time_min + ", " + opacity_time + ", " + top_time_min;
        tab1.style.opacity = "100%";
        tab1.style.zIndex = "1";
        tab1.style.marginTop = "-10vh";
    }

    for (var i = 0; i < 20; i++) {
        (function (index) {
            var button_text = "custom_" + (index + 1);
            var getcurbutton = document.getElementById(button_text);

            if (!getcurbutton) return;

            getcurbutton.addEventListener("click", function () {
                if (GlobalsCurrentTab != 1) return;
                if (document.getElementById("create_curve").style.opacity === '1') return;

                if (!dataArray[index].active) {
                    openCurveEditorForSlot(index, dataArray, button_text);
                } else {
                    loadedButtonIndex = index;
                    interfaceEntrypoint.evalScript(`ApplyCurveToKeyFramesExcalibur(
                        ${dataArray[index].x1}, ${dataArray[index].y1},
                        ${dataArray[index].x2}, ${dataArray[index].y2})`);
                }
            });

            getcurbutton.addEventListener("contextmenu", function (e) {
                e.preventDefault();
                if (GlobalsCurrentTab != 1) return;
                if (document.getElementById("create_curve").style.opacity === '1') return;

                if (dataArray[index].active) {
                    openCurveEditorForSlot(index, dataArray, button_text);
                }
            });
        })(i);
    }

    if (ButtonRemove) {
        ButtonRemove.addEventListener("click", function () {
            if (GlobalsCurrentTab != 1) return;

            dataArray[loadedButtonIndex].active = false;
            dataArray[loadedButtonIndex].x1 = 0;
            dataArray[loadedButtonIndex].y1 = 0;
            dataArray[loadedButtonIndex].x2 = 1;
            dataArray[loadedButtonIndex].y2 = 1;
            dataArray[loadedButtonIndex].name = "";

            resetDiv(getbuttonname);
            document.getElementById(getbuttonname).textContent = "Add Custom";
            updateSettingsCurves(dataArray);
            SendNotification("Curve Removed!", true, false);
            closeEditor();
        });
    }

    if (ButtonApply) {
        ButtonApply.addEventListener("click", function () {
            if (GlobalsCurrentTab != 1) return;

            dataArray[loadedButtonIndex].active = true;
            dataArray[loadedButtonIndex].x1 = Number(setNewX1).toFixed(2);
            dataArray[loadedButtonIndex].y1 = Number(setNewY1).toFixed(2);
            dataArray[loadedButtonIndex].x2 = Number(setNewX2).toFixed(2);
            dataArray[loadedButtonIndex].y2 = Number(setNewY2).toFixed(2);
            dataArray[loadedButtonIndex].name = document.getElementById("Curve_Name").value;

            resetDiv(getbuttonname);

            const displayName = formatCurveName(document.getElementById("Curve_Name").value);
            document.getElementById(getbuttonname).textContent = displayName;

            drawCubicBezierVisualizer(
                getbuttonname,
                dataArray[loadedButtonIndex].x1,
                dataArray[loadedButtonIndex].y1,
                dataArray[loadedButtonIndex].x2,
                dataArray[loadedButtonIndex].y2
            );

            updateSettingsCurves(dataArray);
            SendNotification("Curve Saved!");
            closeEditor();
        });
    }

    if (ButtonGoBack) {
        ButtonGoBack.addEventListener("click", function () {
            if (GlobalsCurrentTab != 1) return;
            closeEditor();
        });
    }
}

var ButtomRandom = document.getElementById("Curve_Randomize");
if (ButtomRandom) {
    ButtomRandom.addEventListener("click", function () {
        if (GlobalsCurrentTab != 1) return;

        setNewX1 = Math.random();
        setNewY1 = Math.random();
        setNewX2 = Math.random();
        setNewY2 = Math.random();

        document.getElementById("Curve_Val").value =
            `${Number(setNewX1).toFixed(2)}, ${Number(setNewY1).toFixed(2)}, ${Number(setNewX2).toFixed(2)}, ${Number(setNewY2).toFixed(2)}`;
    });
}

// === FONCTIONS DE FALLBACK POUR ÉVITER LES ERREURS ===

// Fonction de fallback pour forceRedrawAllPresets
if (typeof forceRedrawAllPresets === 'undefined') {
    function forceRedrawAllPresets() {
        console.log('forceRedrawAllPresets: Fallback function called');
        try {
            const presetCurves = ['CUR_In_Preset', 'CUR_Out_Preset', 'CUR_SpeedRamp_Preset', 'CUR_S_Preset', 'CUR_Reset'];
            presetCurves.forEach(curveId => {
                const element = document.getElementById(curveId);
                if (element && typeof drawCubicBezierVisualizer === 'function') {
                    switch (curveId) {
                        case 'CUR_In_Preset':
                            drawCubicBezierVisualizer(curveId, 0, 0, 0, 1);
                            break;
                        case 'CUR_Out_Preset':
                            drawCubicBezierVisualizer(curveId, 1, 0, 1, 1);
                            break;
                        case 'CUR_SpeedRamp_Preset':
                            drawCubicBezierVisualizer(curveId, 0.20, 0.80, 0.80, 0.20);
                            break;
                        case 'CUR_S_Preset':
                            drawCubicBezierVisualizer(curveId, 0.6, 0, 0.3, 1);
                            break;
                        case 'CUR_Reset':
                            drawCubicBezierVisualizer(curveId, 0, 0, 1, 1);
                            break;
                    }
                }
            });
        } catch (error) {
            console.warn('Error in forceRedrawAllPresets fallback:', error);
        }
    }
}

// Fonction de fallback pour LiveCurveStuff
if (typeof LiveCurveStuff === 'undefined') {
    function LiveCurveStuff() {
        console.log('LiveCurveStuff: Fallback function called');
        try {
            if (typeof LiveDrawCubicBezierVisualizerForLiveCurve === 'function') {
                setTimeout(() => {
                    const liveCurveDiv = document.getElementById('CurvePreview_Live');
                    if (liveCurveDiv) {
                        resetDiv('CurvePreview_Live');
                        LiveDrawCubicBezierVisualizerForLiveCurve(
                            'CurvePreview_Live',
                            L_setNewX1, L_setNewY1, L_setNewX2, L_setNewY2
                        );
                    }
                }, 100);
            }
        } catch (error) {
            console.warn('Error in LiveCurveStuff fallback:', error);
        }
    }
}

// Fonction de fallback pour CheckForButtonPress
if (typeof CheckForButtonPress === 'undefined') {
    function CheckForButtonPress() {
        console.log('CheckForButtonPress: Fallback function called');
    }
}

// Fonction de fallback pour PresetsButtons
if (typeof PresetsButtons === 'undefined') {
    function PresetsButtons() {
        console.log('PresetsButtons: Fallback function called');
    }
}

// Fonction de fallback pour LoadCustomCurves
if (typeof LoadCustomCurves === 'undefined') {
    function LoadCustomCurves() {
        console.log('LoadCustomCurves: Fallback function called');
        try {
            const data = customFileReadOrCreate();
            if (data && data.curves) {
                console.log('Loaded', data.curves.length, 'custom curves');
            }
        } catch (error) {
            console.warn('Error in LoadCustomCurves fallback:', error);
        }
    }
}

console.log('ExcaliburFX main.js loaded successfully with fallbacks');




function LiveCurveStuff() {
    var interfaceEntrypoint = new CSInterface();
    var x1 = 0.20, y1 = 0.80, x2 = 0.80, y2 = 0.20;
    LiveDrawCubicBezierVisualizerForLiveCurve("CurvePreview_Live", x1, y1, x2, y2);

    document.getElementById("Apply_LiveCurve").addEventListener("click", function () {
        if (GlobalsCurrentTab != 1) return;
        interfaceEntrypoint.evalScript(`ApplyCurveToKeyFramesExcalibur("${L_setNewX1}", "${L_setNewY1}","${L_setNewX2}", "${L_setNewY2}")`);
    });
}


function PresetsButtons() {
    var interfaceEntrypoint = new CSInterface();

    var Preset1 = document.getElementById("CUR_In_Preset");
    var Preset2 = document.getElementById("CUR_Out_Preset");
    var Preset3 = document.getElementById("CUR_SpeedRamp_Preset");
    var Preset4 = document.getElementById("CUR_S_Preset");
    var None = document.getElementById("CUR_Reset");

    Preset1.addEventListener("click", function () { if (GlobalsCurrentTab != 1) return; if (document.getElementById("create_curve").style.opacity === '1') return; interfaceEntrypoint.evalScript(`ApplyCurveToKeyFramesExcalibur(0, 0.0, 0, 1)`); });
    Preset2.addEventListener("click", function () { if (GlobalsCurrentTab != 1) return; if (document.getElementById("create_curve").style.opacity === '1') return; interfaceEntrypoint.evalScript(`ApplyCurveToKeyFramesExcalibur(1, 0, 1, 1)`); });
    Preset3.addEventListener("click", function () { if (GlobalsCurrentTab != 1) return; if (document.getElementById("create_curve").style.opacity === '1') return; interfaceEntrypoint.evalScript(`ApplyCurveToKeyFramesExcalibur(0.22, 0.85, 0.79, 0.19)`); });
    Preset4.addEventListener("click", function () { if (GlobalsCurrentTab != 1) return; if (document.getElementById("create_curve").style.opacity === '1') return; interfaceEntrypoint.evalScript(`ApplyCurveToKeyFramesExcalibur(0.6, 0, 0.3, 1)`); });
    None.addEventListener("click", function () { if (GlobalsCurrentTab != 1) return; if (document.getElementById("create_curve").style.opacity === '1') return; interfaceEntrypoint.evalScript(`ApplyCurveToKeyFramesExcalibur(0, 0, 1, 1)`); });
}