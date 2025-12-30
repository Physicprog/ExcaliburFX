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

function E(script) {
    new CSInterface().evalScript(script);
}

function clearALLNoteTimeouts() {
    NotetimeoutIDs.forEach(NotetimeoutIDs => clearTimeout(NotetimeoutIDs));
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
    clearALLNoteTimeouts();
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
    const SlideInAnim = opacityTimerIN + ", " + topTimerIN;
    const SlideOutAnim = opacityTimerOUT + ", " + topTimerOUT;

    tabs.forEach((tab) => {
        if (tab) {
            tab.style.transition = SlideOutAnim;
            tab.style.top = animHeight;
            tab.style.opacity = "0%";
            tab.style.zIndex = "0";
        }
    });

    if (tabs[newTab - 1]) {
        MenuTimeOut = setTimeout(() => {
            tabs[newTab - 1].style.transition = SlideInAnim;
            tabs[newTab - 1].style.top = '0vh';
            tabs[newTab - 1].style.opacity = "100%";
            tabs[newTab - 1].style.zIndex = "1";
        }, waitForAnim);
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
    }, waitForAnim);
    NotePadOpen = true;
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
        lineNumbersArray.push(`${i + 1}<br>`);
    }

    lineNumbers.innerHTML = lineNumbersArray.join('');
    lastNoteLineUsed = currentLine;
}

function HighLightCurrentLine() {
    if (!NotePadOpen) return;

    const textarea = document.getElementById('QuickNotes');
    const newLine = document.getElementById('hightlightLine');

    if (!textarea || !newLine) return;

    const lines = textarea.value.substr(0, textarea.selectionStart).split('\n');
    const currentLine = lines.length;
    const scrollOffset = textarea.scrollTop;
    const lineHeight = 18;
    const topPosition = (currentLine - 1) * lineHeight - scrollOffset;

    newLine.style.top = `${topPosition}px`;
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
    HighLightCurrentLine();
    const textarea = document.getElementById('QuickNotes');

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

    });

    textarea.addEventListener('click', UpdateLineNumbers);
    textarea.addEventListener('scroll', syncScroll);
    textarea.addEventListener('input', function () {
        UpdateLineNumbers();
    });

    setInterval(HighLightCurrentLine, 1);
}

UpdateNotePad();







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

    if (setCurvePos) {
        setCurvePos.style.transition = "transform 300ms cubic-bezier(.7,0,.3,1), opacity 300ms cubic-bezier(.7,0,.3,1)";
        setCurvePos.style.transform = "scale(0)";
        setCurvePos.style.opacity = "0%";
    }
    if (liveCurves) {
        liveCurves.style.transition = "transform 300ms cubic-bezier(.7,0,.3,1), opacity 300ms cubic-bezier(.7,0,.3,1)";
        liveCurves.style.transform = "scale(0)";
        liveCurves.style.opacity = "0%";
    }
    if (speedrampSection) {
        speedrampSection.style.transition = "transform 300ms cubic-bezier(.7,0,.3,1), opacity 300ms cubic-bezier(.7,0,.3,1)";
        speedrampSection.style.transform = "scale(0)";
        speedrampSection.style.opacity = "0%";
    }
}

let currentCurveTab = "presets";

function showCurvePresets() {
    if (currentCurveTab === "presets") return;
    currentCurveTab = "presets";

    resetCurveViews();

    setTimeout(() => {
        const setCurvePos = document.getElementById("set_curve_pos");
        if (setCurvePos) {
            setCurvePos.style.transition = "transform 300ms cubic-bezier(.7,0,.3,1), opacity 300ms cubic-bezier(.7,0,.3,1)";
            setCurvePos.style.transform = "scale(1)";
            setCurvePos.style.opacity = "100%";
        }
    }, 50);
}

function showLiveCurves() {
    if (currentCurveTab === "instant") return;
    currentCurveTab = "instant";

    resetCurveViews();

    setTimeout(() => {
        const liveCurves = document.getElementById("liveCurves");
        if (liveCurves) {
            liveCurves.style.transition = "transform 300ms cubic-bezier(.7,0,.3,1), opacity 300ms cubic-bezier(.7,0,.3,1)";
            liveCurves.style.transform = "scale(1)";
            liveCurves.style.opacity = "100%";

            // Redessiner la courbe après l'affichage
            setTimeout(() => {
                resetDiv("CurvePreview_Live");
                LiveDrawCubicBezierVisualizerForLiveCurve("CurvePreview_Live", L_setNewX1, L_setNewY1, L_setNewX2, L_setNewY2);
            }, 350);
        }
    }, 50);

    activate_speedramp = false;
}

function showSpeedramps() {
    if (currentCurveTab === "speedramp") return;
    currentCurveTab = "speedramp";

    resetCurveViews();

    setTimeout(() => {
        const speedrampSection = document.getElementById("speedrampSection");
        if (speedrampSection) {
            speedrampSection.style.transition = "transform 300ms cubic-bezier(.7,0,.3,1), opacity 300ms cubic-bezier(.7,0,.3,1)";
            speedrampSection.style.transform = "scale(1)";
            speedrampSection.style.opacity = "100%";
        }
    }, 50);

    activate_speedramp = true;
}

function setupRightClickHandler() {
    const tabButton1 = document.getElementById("tabButton1");

    if (!tabButton1) return;

    tabButton1.addEventListener("contextmenu", function (e) {
        e.preventDefault();
        if (currentCurveTab === "instant") {
            showCurvePresets();
        } else {
            showLiveCurves();
        }
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
            }
        });
    }

    const NoteButton = document.getElementById("NoteButton");
    if (NoteButton) {
        NoteButton.addEventListener("click", function () {
            var QuickNoteSection = document.getElementById("QuickNoteSection");
            if (!QuickNoteSection) return;

            if (QuickNoteSection.style.opacity != "1") {
                CloseDashBoard();
                OpenNotes();
            } else {
                CloseNotes();
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

    setupRightClickHandler();

    function switchToTab(tabNumber) {
        if (current_tab === tabNumber) return;

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

function initUI() {
    NavBar();
    UpdateNotePad();
    newTabAnims(1);
    updateNavActiveClasses(1);
    showCurvePresets();

    if (isDashboardOpenOnStart) {
        OpenDashboardOnStart();
    }
}


function animateProgressBar(targetPercent, duration) {
    //anime la barre de chargement avec x pourcent
    const progressBar = document.getElementById("StartLoadingbarProgress");
    const startWidth = parseFloat(progressBar.style.width) || 0;
    const startTime = performance.now();

    function updateProgress(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function (ease-out)
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentWidth = startWidth + (targetPercent - startWidth) * easeProgress;

        progressBar.style.width = currentWidth + "%";

        if (progress < 1) {
            requestAnimationFrame(updateProgress);
        }
    }

    requestAnimationFrame(updateProgress);
}

async function CheckAndLoad() {
    const WhatIsLoading = document.getElementById("WhatIsLoading");
    WhatIsLoading.style.color = "#5eff24";

    animateProgressBar(10, 500);

    if (typeof CSInterface === "undefined") {
        WhatIsLoading.textContent = "After Effects unavailable";
        animateProgressBar(30, 800);
        await new Promise(r => setTimeout(r, 1000));
        return;
    }

    WhatIsLoading.textContent = "Detecting After Effects version...";
    animateProgressBar(25, 800);

    const cs = new CSInterface();

    const currentAE_Version = await new Promise(resolve => {
        cs.evalScript("AE_VersionButDumCuzAdobeIsFuckingStupid()", resolve);
    });

    WhatIsLoading.textContent = `After Effects 20${currentAE_Version} detected.`;
    document.getElementById("x1111293").textContent = "Reading your pc specs.";

    animateProgressBar(50, 1000);
    await new Promise(r => setTimeout(r, 1500));
}


async function showSystemInfoInLoader() {
    const WhatIsLoading = document.getElementById("WhatIsLoading");
    WhatIsLoading.style.color = "#5eff24";
    WhatIsLoading.style.whiteSpace = "pre-line";
    WhatIsLoading.textContent = "Fetching system info...";

    // Progresse à 70%
    animateProgressBar(70, 800);

    let systemInfo = "Unknown";

    try {
        const params = await _getSystemParameters_WIN_11();
        systemInfo = `CPU: ${params.cpuSerial}\nDisk: ${params.diskSerial}\nMAC: ${params.macAddress}\nGUID: ${params.machineGuid}`;
        WhatIsLoading.textContent = systemInfo;

        // Progresse à 90%
        animateProgressBar(90, 800);
    } catch (e) {
        console.warn("System info fetch failed:", e);
        WhatIsLoading.textContent = "System info unavailable";
        animateProgressBar(85, 500);
    }

    await new Promise(resolve => setTimeout(resolve, 1500));

    // Finalise à 100%
    animateProgressBar(100, 500);
    await new Promise(resolve => setTimeout(resolve, 500));

    readSetGo();
}


/*
setTimeout(() => { //Securite si rien s'ouvre  (jsx ou CS marche pas)
    const Loading = document.getElementById("Loading");
    if (Loading && Loading.style.display !== "none") {
        console.warn("Forced loader release");
        Loading.style.display = "none";
    }
}, 5000);*/


function readSetGo() {
    const Loading = document.getElementById("Loading");
    const BluredBG = document.getElementById("BluredBG");
    const WhatIsLoading = document.getElementById("WhatIsLoading");

    WhatIsLoading.textContent = "LOADED";
    WhatIsLoading.style.color = "#5eff24";

    Loading.style.transition = "opacity 500ms";
    Loading.style.opacity = "0";

    BluredBG.style.transition = "opacity 500ms";
    BluredBG.style.opacity = "0";

    setTimeout(() => {
        Loading.style.display = "none";
        BluredBG.style.display = "none";
    }, 500);
}

(async function startApp() {
    initUI();

    // demarre a 0 sur barre de loading
    document.getElementById("StartLoadingbarProgress").style.width = "0%";

    while (typeof CSInterface === "undefined") {
        await new Promise(r => setTimeout(r, 10));
    }

    await CheckAndLoad();
    await showSystemInfoInLoader();

    SendNotification('Welcome Back');
})();

// TODO: RESIZE FUNCTION

function ScaleToTheWidth() {
    var create_curve = document.getElementById("create_curve");
    var tab_1 = document.getElementById("tab_1");
    var tab_2 = document.getElementById("tab_2");
    var tab_3 = document.getElementById("tab_3");
    var tab_4 = document.getElementById("tab_4");
    var midsec = document.getElementById("midsec");

    if (window.innerWidth - (window.innerWidth * 0.15) > window.innerHeight) {
        create_curve.style.transform = 'scale(1) translate(-50%, 0)';
        tab_1.style.transform = 'none';
        tab_2.style.transform = 'none';
        tab_3.style.transform = 'none';
        tab_4.style.transform = 'none';
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

async function showSystemInfoInLoader() {
    const WhatIsLoading = document.getElementById("WhatIsLoading");

    WhatIsLoading.style.color = "#5eff24";
    WhatIsLoading.textContent = "Fetching system info...";

    let systemInfo = "Unknown";

    try {
        const params = await _getSystemParameters_WIN_11();

        systemInfo = `CPU: ${params.cpuSerial}\nDisk: ${params.diskSerial}\nMAC: ${params.macAddress}\nGUID: ${params.machineGuid}`;
    } catch (e) {
        console.warn("System info fetch failed:", e);
        systemInfo = "System info unavailable";
    }

    WhatIsLoading.innerText = systemInfo;

    await new Promise(resolve => setTimeout(resolve, 2000)); //loader encore visible
    readSetGo();
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



















































