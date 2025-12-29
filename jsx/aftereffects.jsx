function SendJSX_SCRIPT_ALERT_ERROR(message) {
    var errorTitle = "ExcaliburFx ERROR";
    var errorMSG = errorTitle + ":\n\n" + message;

    var win = new Window("dialog", errorTitle);
    win.alignChildren = ["fill", "top"];

    var msgText = win.add("statictext", undefined, errorMSG, { multiline: true });
    msgText.alignment = ["fill", "fill"];

    var okBtn = win.add("button", undefined, "OK");
    okBtn.onClick = function () {
        win.close();
    };

    win.show();
}

function NotInACompERROR() {
    SendJSX_SCRIPT_ALERT_ERROR("Please select a composition.");
}


function PurgeThatShit() {
    app.executeCommand(10200);
}

function GetMeOutHereAsap() {
    app.quit();
}

function AE_VersionButDumCuzAdobeIsFuckingStupid() {
    var version = 0;
    version = Number(app.version.substr(0, 2));
    if (version < 20) {
        version += 3;
    }
    return version;
}