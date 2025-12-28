const crypto = require("crypto");
const { execSync } = require("child_process");
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const { count } = require('console');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { callbackify } = require('util');
const { isNumberObject, isBooleanObject } = require('util/types');
const { send } = require("process");
var restartCuzOfFirstStart = false;

// Cool Math Functions

// TODO: mathRandomadasdsad

function E(script) {
    new CSInterface().evalScript(script);
}

function JerryFlowgetRandomInRange(min, max) {
    return Math.random() * (max - min) + min;
}

async function LoopDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function clearAddPresetPannel() {
    var PresetSetPannel = document.getElementById("PresetSetPannel");
    PresetSetPannel.innerHTML = '';
}

let NotetimeoutIDs = [];

function clearALLNoteTimeouts() {
    NotetimeoutIDs.forEach(NotetimeoutIDs => clearTimeout(NotetimeoutIDs));
    NotetimeoutIDs = [];
}

function SendNotification(noti, returnit = true, color_green = true, center_to_Main = true) {
    clearALLNoteTimeouts();
    var notification = document.getElementById("notification");
    var theNotification = document.getElementById("theNotification");

    if (color_green) notification.style.borderTop = "#72db1b 0.5vh solid";
    else notification.style.borderTop = "#bd0000 0.5vh solid";

    notification.style.opacity = "100%";
    notification.style.marginTop = "5vh";
    if (center_to_Main) notification.style.left = "37.5%"; else notification.style.left = "30%";
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
    localStorage.clear();
    sessionStorage.clear();
    location.reload();
}

document.addEventListener('keydown', function (event) {
    if (event.key === "F5" || (event.ctrlKey && event.key.toLowerCase() === 'r')) {
        event.preventDefault();
        Restarter();
    }
});
