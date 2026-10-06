export function customErrorAlert(title : string = "ExcaliburFX Error", message: string) {
    var dialog = new Window("dialog", title);
    dialog.orientation = "column";
    dialog.alignChildren = ["center", "top"];
    dialog.spacing = 15;
    dialog.margins = 20;
    var textGroup = dialog.add("group");
    textGroup.orientation = "column";
    textGroup.alignChildren = ["left", "center"];
    var msgText = textGroup.add("statictext", undefined, message, {multiline: true});
    msgText.preferredSize.width = 300; 
    var okButton = dialog.add("button", undefined, "OK");
    okButton.preferredSize.width = 100;
    okButton.onClick = function() {
        dialog.close();
    };
    dialog.show();
}
