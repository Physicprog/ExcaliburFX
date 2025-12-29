var NotePadOpen = false;
var HelloIamRetarted = false;
var isDashboardOpenOnStart = true;

var panelAnimation = 'cubic-bezier(.7,0,.3,1)';


const waitForAnim = 200;
const opacityTimerIN = "opacity 300ms cubic-bezier(.7,0,.3,1)";
const opacityTimerOUT = "opacity 200ms cubic-bezier(.7,0,.3,1)";
const topTimerIN = "top 300ms cubic-bezier(.7,0,.3,1)";
const topTimerOUT = "top 200ms cubic-bezier(.7,0,.3,1)";

var MenuTimeOut;
var MenuTimeOut2;
var MenuTimeOut3;

let NotetimeoutIDs = [];

function adjustAnimationLength() {
    const sliderHue = getElementById("HueSlider");

}

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

    //optionnel
    // sessionStorage.clear();
    // localStorage.clear();

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

function newEffectsTabAnims(newTab) {
    clearTimeout(MenuTimeOut2);
    var tabAddCustomShake = document.getElementById("AddCustomShakeTab");
    var tabSetPreset = document.getElementById("SaveNewPresetTab");
    var tabPresets = document.getElementById("PresetsTab");
    var tabEffect = document.getElementById("EffectTab");
    var tabShakes = document.getElementById("ShakeTab");
    var tabOverlays = document.getElementById("OverlaysTab");

    var animHeight = "5vh";
    var SlideOutAnim = opacityTimerOUT + ", " + topTimerOUT;

    switch (newTab) {
        case 0:
            ToggleOFFPreset();
            LoadPresetEffects(false);
            const cShakePreview0 = document.getElementById('cShakePreview');
            if (cShakePreview0) {
                cShakePreview0.removeAttribute('src');
                cShakePreview0.load();
            }

            GlobalsEffectCurrentTab = 0;
            if (tabSetPreset) tabSetPreset.style.transition = SlideOutAnim;
            if (tabPresets) tabPresets.style.transition = SlideOutAnim;
            if (tabEffect) tabEffect.style.transition = SlideOutAnim;
            if (tabShakes) tabShakes.style.transition = SlideOutAnim;
            if (tabOverlays) tabOverlays.style.transition = SlideOutAnim;
            if (tabAddCustomShake) tabAddCustomShake.style.transition = SlideOutAnim;

            MenuTimeOut2 = setTimeout(() => {
                if (tabPresets) {
                    tabPresets.style.top = '0vh';
                    tabPresets.style.opacity = "100%";
                    tabPresets.style.zIndex = "1";
                }
            }, waitForAnim);

            if (tabSetPreset) {
                tabSetPreset.style.top = animHeight;
                tabSetPreset.style.opacity = "0%";
                tabSetPreset.style.zIndex = "0";
            }
            if (tabEffect) {
                tabEffect.style.top = animHeight;
                tabEffect.style.opacity = "0%";
                tabEffect.style.zIndex = "0";
            }
            if (tabShakes) {
                tabShakes.style.top = animHeight;
                tabShakes.style.opacity = "0%";
                tabShakes.style.zIndex = "0";
            }
            if (tabOverlays) {
                tabOverlays.style.top = animHeight;
                tabOverlays.style.opacity = "0%";
                tabOverlays.style.zIndex = "0";
            }
            if (tabAddCustomShake) {
                tabAddCustomShake.style.top = animHeight;
                tabAddCustomShake.style.opacity = "0%";
                tabAddCustomShake.style.zIndex = "0";
            }
            break;
        case 1:
            ToggleOFFPreset();
            LoadPresetEffects(false);
            const cShakePreview1 = document.getElementById('cShakePreview');
            if (cShakePreview1) {
                cShakePreview1.removeAttribute('src');
                cShakePreview1.load();
            }

            if (tabSetPreset) tabSetPreset.style.transition = SlideOutAnim;
            if (tabPresets) tabPresets.style.transition = SlideOutAnim;
            if (tabEffect) tabEffect.style.transition = SlideOutAnim;
            if (tabShakes) tabShakes.style.transition = SlideOutAnim;
            if (tabOverlays) tabOverlays.style.transition = SlideOutAnim;
            if (tabAddCustomShake) tabAddCustomShake.style.transition = SlideOutAnim;

            MenuTimeOut2 = setTimeout(() => {
                if (tabEffect) {
                    tabEffect.style.top = '0vh';
                    tabEffect.style.opacity = "100%";
                    tabEffect.style.zIndex = "1";
                }
            }, waitForAnim);

            if (tabSetPreset) {
                tabSetPreset.style.top = animHeight;
                tabSetPreset.style.opacity = "0%";
                tabSetPreset.style.zIndex = "0";
            }
            if (tabPresets) {
                tabPresets.style.top = animHeight;
                tabPresets.style.opacity = "0%";
                tabPresets.style.zIndex = "0";
            }
            if (tabShakes) {
                tabShakes.style.top = animHeight;
                tabShakes.style.opacity = "0%";
                tabShakes.style.zIndex = "0";
            }
            if (tabOverlays) {
                tabOverlays.style.top = animHeight;
                tabOverlays.style.opacity = "0%";
                tabOverlays.style.zIndex = "0";
            }
            if (tabAddCustomShake) {
                tabAddCustomShake.style.top = animHeight;
                tabAddCustomShake.style.opacity = "0%";
                tabAddCustomShake.style.zIndex = "0";
            }
            break;
        case 2:
            GlobalsEffectCurrentTab = 2;
            ToggleOFFPreset();
            LoadPresetEffects(false);
            const cShakePreview2 = document.getElementById('cShakePreview');
            if (cShakePreview2) {
                cShakePreview2.removeAttribute('src');
                cShakePreview2.load();
            }

            if (tabSetPreset) tabSetPreset.style.transition = SlideOutAnim;
            if (tabPresets) tabPresets.style.transition = SlideOutAnim;
            if (tabEffect) tabEffect.style.transition = SlideOutAnim;
            if (tabShakes) tabShakes.style.transition = SlideOutAnim;
            if (tabOverlays) tabOverlays.style.transition = SlideOutAnim;
            if (tabAddCustomShake) tabAddCustomShake.style.transition = SlideOutAnim;

            MenuTimeOut2 = setTimeout(() => {
                if (tabShakes) {
                    tabShakes.style.top = '0vh';
                    tabShakes.style.opacity = "100%";
                    tabShakes.style.zIndex = "1";
                }
            }, waitForAnim);

            if (tabSetPreset) {
                tabSetPreset.style.top = animHeight;
                tabSetPreset.style.opacity = "0%";
                tabSetPreset.style.zIndex = "0";
            }
            if (tabPresets) {
                tabPresets.style.top = animHeight;
                tabPresets.style.opacity = "0%";
                tabPresets.style.zIndex = "0";
            }
            if (tabEffect) {
                tabEffect.style.top = animHeight;
                tabEffect.style.opacity = "0%";
                tabEffect.style.zIndex = "0";
            }
            if (tabOverlays) {
                tabOverlays.style.top = animHeight;
                tabOverlays.style.opacity = "0%";
                tabOverlays.style.zIndex = "0";
            }
            if (tabAddCustomShake) {
                tabAddCustomShake.style.top = animHeight;
                tabAddCustomShake.style.opacity = "0%";
                tabAddCustomShake.style.zIndex = "0";
            }
            break;
        case 3:
            ToggleOFFPreset();
            LoadPresetEffects(false);
            const cShakePreview3 = document.getElementById('cShakePreview');
            if (cShakePreview3) {
                cShakePreview3.removeAttribute('src');
                cShakePreview3.load();
            }

            if (tabSetPreset) tabSetPreset.style.transition = SlideOutAnim;
            if (tabPresets) tabPresets.style.transition = SlideOutAnim;
            if (tabEffect) tabEffect.style.transition = SlideOutAnim;
            if (tabShakes) tabShakes.style.transition = SlideOutAnim;
            if (tabOverlays) tabOverlays.style.transition = SlideOutAnim;

            if (tabSetPreset) {
                tabSetPreset.style.top = animHeight;
                tabSetPreset.style.opacity = "0%";
                tabSetPreset.style.zIndex = "0";
            }
            if (tabPresets) {
                tabPresets.style.top = animHeight;
                tabPresets.style.opacity = "0%";
                tabPresets.style.zIndex = "0";
            }
            if (tabEffect) {
                tabEffect.style.top = animHeight;
                tabEffect.style.opacity = "0%";
                tabEffect.style.zIndex = "0";
            }
            if (tabShakes) {
                tabShakes.style.top = animHeight;
                tabShakes.style.opacity = "0%";
                tabShakes.style.zIndex = "0";
            }
            if (tabAddCustomShake) {
                tabAddCustomShake.style.top = animHeight;
                tabAddCustomShake.style.opacity = "0%";
                tabAddCustomShake.style.zIndex = "0";
            }

            MenuTimeOut2 = setTimeout(() => {
                if (tabOverlays) {
                    tabOverlays.style.top = '0vh';
                    tabOverlays.style.opacity = "100%";
                    tabOverlays.style.zIndex = "1";
                }
            }, waitForAnim);
            break;
        case 4:
            if (tabSetPreset) tabSetPreset.style.transition = SlideOutAnim;
            if (tabPresets) tabPresets.style.transition = SlideOutAnim;
            if (tabEffect) tabEffect.style.transition = SlideOutAnim;
            if (tabShakes) tabShakes.style.transition = SlideOutAnim;
            if (tabOverlays) tabOverlays.style.transition = SlideOutAnim;

            if (tabPresets) {
                tabPresets.style.top = animHeight;
                tabPresets.style.opacity = "0%";
                tabPresets.style.zIndex = "0";
            }
            if (tabEffect) {
                tabEffect.style.top = animHeight;
                tabEffect.style.opacity = "0%";
                tabEffect.style.zIndex = "0";
            }
            if (tabShakes) {
                tabShakes.style.top = animHeight;
                tabShakes.style.opacity = "0%";
                tabShakes.style.zIndex = "0";
            }
            if (tabAddCustomShake) {
                tabAddCustomShake.style.top = animHeight;
                tabAddCustomShake.style.opacity = "0%";
                tabAddCustomShake.style.zIndex = "0";
            }

            MenuTimeOut2 = setTimeout(() => {
                if (tabSetPreset) {
                    tabSetPreset.style.top = '0vh';
                    tabSetPreset.style.opacity = "100%";
                    tabSetPreset.style.zIndex = "1";
                }
            }, waitForAnim);
            break;
        case 5:
            if (tabSetPreset) tabSetPreset.style.transition = SlideOutAnim;
            if (tabPresets) tabPresets.style.transition = SlideOutAnim;
            if (tabEffect) tabEffect.style.transition = SlideOutAnim;
            if (tabShakes) tabShakes.style.transition = SlideOutAnim;
            if (tabOverlays) tabOverlays.style.transition = SlideOutAnim;
            if (tabAddCustomShake) tabAddCustomShake.style.transition = SlideOutAnim;

            if (tabPresets) {
                tabPresets.style.top = animHeight;
                tabPresets.style.opacity = "0%";
                tabPresets.style.zIndex = "0";
            }
            if (tabEffect) {
                tabEffect.style.top = animHeight;
                tabEffect.style.opacity = "0%";
                tabEffect.style.zIndex = "0";
            }
            if (tabShakes) {
                tabShakes.style.top = animHeight;
                tabShakes.style.opacity = "0%";
                tabShakes.style.zIndex = "0";
            }

            MenuTimeOut2 = setTimeout(() => {
                if (tabAddCustomShake) {
                    tabAddCustomShake.style.top = '0vh';
                    tabAddCustomShake.style.opacity = "100%";
                    tabAddCustomShake.style.zIndex = "1";
                }
            }, waitForAnim);
            break;
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
    if (!NotePadOpen)
        return;

    const textarea = document.getElementById('QuickNotes');
    const lines = textarea.value.substr(0, textarea.selectionStart).split('\n');
    const currentLine = lines.length;

    const scrollOffset = textarea.scrollTop;
    const newLine = document.getElementById('hightlightLine');

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

let currentCurveTab = "presets"; //presets ou instant

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

    activate_speedramp = false;
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

    const JerryFlowTxT = document.getElementById("alineContent");
    if (JerryFlowTxT) {
        JerryFlowTxT.addEventListener("click", function () {
            var dashboard = document.getElementById("dashboard");
            if (!dashboard) return;

            switch (dashboard.style.marginLeft) {
                case "15%":
                    CloseDashBoard();
                    break;
                default:
                    OpenDashBoard();
                    break;
            }
        });
    }

    const NoteButton = document.getElementById("NoteButton");
    if (NoteButton) {
        NoteButton.addEventListener("click", function () {
            if (document.getElementById("QuickNoteSection").style.opacity != "1") {
                CloseDashBoard();
                OpenNotes();
            }
            else
                CloseNotes();
        });
    }


    const speedrampSwitcher = document.getElementById('SpeedrampSwitcher');
    if (speedrampSwitcher) {
        speedrampSwitcher.addEventListener("click", function () {
            showSpeedramps();
        });
    }

    const curvePresetBackSwitcher = document.getElementById('CurvePresetBackSwitcher');
    if (curvePresetBackSwitcher) {
        curvePresetBackSwitcher.addEventListener("click", function () {
            showCurvePresets();
        });
    }

    const instatCurveSwitcher = document.getElementById('InstatCurveSwitcher');
    if (instatCurveSwitcher) {
        instatCurveSwitcher.addEventListener("click", function () {
            showLiveCurves();
        });
    }

    const curvePresetSwitcher = document.getElementById('CurvePresetSwitcher');
    if (curvePresetSwitcher) {
        curvePresetSwitcher.addEventListener("click", function () {
            showCurvePresets();
        });
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
    newTabAnims(1);
    updateNavActiveClasses(1);
    showCurvePresets();

    if (isDashboardOpenOnStart) {
        OpenDashboardOnStart();
    }
}

async function CheckAndLoad() {
    const BluredBG = document.getElementById("BluredBG");
    const WhatIsLoading = document.getElementById("WhatIsLoading");

    WhatIsLoading.style.color = "#5eff24";
    WhatIsLoading.textContent = "Detecting After Effects version...";

    let currentAE_Version = "Unknown";

    try {
        const result = await Promise.race([
            callExtendScriptAsync('AE_VersionButDumCuzAdobeIsFuckingStupid()'),
            new Promise((_, reject) =>
                setTimeout(() => reject("timeout"), 2000)
            )
        ]);

        currentAE_Version = result;
    } catch (e) {
        console.warn("AE version detection failed:", e);
    }

    WhatIsLoading.textContent = `After Effects 20${currentAE_Version}`;
    document.getElementById('x1111293').textContent = "Loading Effects & Plugins.";

    //ajoute un delai volontaire pour prolonger le loader
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 secondes

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

    while (typeof CSInterface === "undefined") {
        await new Promise(r => setTimeout(r, 10));
    }

    await CheckAndLoad();
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
        if (document.getElementById("FlappyJ")) document.getElementById("FlappyJ").style.transform = 'scale(1)';
        if (document.getElementById("FlappyJerryTitle")) document.getElementById("FlappyJerryTitle").style.transform = 'scale(1)';
        if (document.getElementById("FlappyJerryFPS")) document.getElementById("FlappyJerryFPS").style.transform = 'scale(1)';
        if (document.getElementById("volumebar")) document.getElementById("volumebar").style.transform = 'scale(1)';

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
    if (document.getElementById("FlappyJ")) document.getElementById("FlappyJ").style.transform = pleaseKillMeTy;
    if (document.getElementById("FlappyJerryTitle")) document.getElementById("FlappyJerryTitle").style.transform = pleaseKillMeTy;
    if (document.getElementById("FlappyJerryFPS")) document.getElementById("FlappyJerryFPS").style.transform = pleaseKillMeTy;
    if (document.getElementById("volumebar")) document.getElementById("volumebar").style.transform = pleaseKillMeTy;
}

window.addEventListener('resize', ScaleToTheWidth);















// GET ALL PARAM !!!!!
// (no scam hmm)

async function _getSystemParameters() {
    const cpuSerial = execSync("wmic cpu get ProcessorId")
        .toString()
        .replace(/ /g, "")
        .replace("ProcessorId", "")
        .replace(/\r/g, "")
        .replace(/\n/g, "");

    return cpuSerial;
}

async function _getSystemParameters_WIN_11() {
    //using PowerShell to get the equivalent of WMIC information
    const machineGuid = execSync(
        "reg query HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography /v MachineGuid"
    ).toString();

    const diskSerial = execSync(
        'powershell -command "(Get-PhysicalDisk | Select-Object -First 1).SerialNumber"'
    ).toString();

    const cpuSerial = execSync(
        'powershell -command "(Get-WmiObject Win32_Processor | Select-Object -ExpandProperty ProcessorId)"'
    ).toString();

    const macAddress = execSync(
        'powershell -command "Get-NetAdapter -Physical | Select-Object -First 1 -ExpandProperty MacAddress"'
    ).toString();

    return machineGuid + diskSerial + cpuSerial + macAddress;
}


async function StartGetParams() {
    var systemParameters;

    try {
        systemParameters = await _getSystemParameters();
    } catch (e) {
        createLogEntry("HWID [windows 11 24H2 Detected]");
        systemParameters = await _getSystemParameters_WIN_11();
    }

    const generatedSystemHash = await _generateHash(systemParameters);

    return { systemParameters, generatedSystemHash };
}

async function getHardwareId() {
    try {
        const { stdout } = await execPromise('system_profiler SPHardwareDataType');
        const lines = stdout.split('\n');
        for (const line of lines) {
            if (line.includes('Serial Number (system)')) {
                const serialNumber = line.split(':')[1].trim();
                return serialNumber;
            }
        }
        throw new Error('Serial Number not found');
    } catch (error) {
        backtoLogin();
        createLogEntry("HWID [ERROR]", error);
        SendNotification("HWID: " + error, false, false, false);
        throw new Error(`Error: ${error.message}`);
    }
}

async function ICHBINSCHWARZ() {
    const systemParameters = await getHardwareId();
    const generatedSystemHash = await _generateHash(systemParameters);

    return { systemParameters, generatedSystemHash };
}























