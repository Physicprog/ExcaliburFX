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

function MathClampValue(value, min, max) {
    if (value < min) {
        return min;
    }
    if (value > max) {
        return max;
    }
    return value;
}


function CreateTheCurve(selectedProperty, selectedKeys, i, easeIn, easeOut, start, end) {
    switch (selectedProperty.propertyValueType) {
        case 6417:
            switch (i) { //switch de la doc adobe
                case start:
                    selectedProperty.setTemporalEaseAtKey(selectedKeys[i], selectedProperty.keyInTemporalEase(selectedKeys[i]), [easeOut]);
                    break;
                case end:
                    selectedProperty.setTemporalEaseAtKey(selectedKeys[i], [easeIn], selectedProperty.keyOutTemporalEase(selectedKeys[i]));
                    break;
                default:
                    selectedProperty.setTemporalEaseAtKey(selectedKeys[i], [easeIn], [easeOut]);
            }
            break;
        case 6413:
            switch (i) {
                case start:
                    selectedProperty.setTemporalEaseAtKey(selectedKeys[i], selectedProperty.keyInTemporalEase(selectedKeys[i]), [easeOut]);
                    break;
                case end:
                    selectedProperty.setTemporalEaseAtKey(selectedKeys[i], [easeIn], selectedProperty.keyOutTemporalEase(selectedKeys[i]));
                    break;
                default:
                    selectedProperty.setTemporalEaseAtKey(selectedKeys[i], [easeIn], [easeOut]);
            }
            break;
        case 6414:
            switch (i) {
                case start:
                    selectedProperty.setTemporalEaseAtKey(selectedKeys[i], selectedProperty.keyInTemporalEase(selectedKeys[i]), [easeOut, easeOut, easeOut]);
                    break;
                case end:
                    selectedProperty.setTemporalEaseAtKey(selectedKeys[i], [easeIn, easeIn, easeIn], selectedProperty.keyOutTemporalEase(selectedKeys[i]));
                    break;
                default:
                    selectedProperty.setTemporalEaseAtKey(selectedKeys[i], [easeIn, easeIn, easeIn], [easeOut, easeOut, easeOut]);
            }
            break;
        case 6416:
            switch (i) {
                case start:
                    selectedProperty.setTemporalEaseAtKey(selectedKeys[i], selectedProperty.keyInTemporalEase(selectedKeys[i]), [easeOut, easeOut]);
                    break;
                case end:
                    selectedProperty.setTemporalEaseAtKey(selectedKeys[i], [easeIn, easeIn], selectedProperty.keyOutTemporalEase(selectedKeys[i]));
                    break;
                default:
                    selectedProperty.setTemporalEaseAtKey(selectedKeys[i], [easeIn, easeIn], [easeOut, easeOut]);
            }
            break;
        default:
            switch (i) {
                case start:
                    selectedProperty.setTemporalEaseAtKey(selectedKeys[i], selectedProperty.keyInTemporalEase(selectedKeys[i]), [easeOut]);
                    break;
                case end:
                    selectedProperty.setTemporalEaseAtKey(selectedKeys[i], [easeIn], selectedProperty.keyOutTemporalEase(selectedKeys[i]));
                    break;
                default:
                    selectedProperty.setTemporalEaseAtKey(selectedKeys[i], [easeIn], [easeOut]);
            }
    }
}

function OutSourcedCurves(selectedProperty, selectedKeys, x1, y1, x2, y2, original_x2, original_y2) {
    if (selectedKeys.length > 0) {
        for (var i = 0; i < selectedKeys.length; i += 1) {
            if ((((x1 <= 0.01) && (y1 <= 0.01)) && (original_x2 >= 0.99)) && (original_y2 >= 0.99)) {
                selectedProperty.setInterpolationTypeAtKey(selectedKeys[i], KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
            } else {
                var end = selectedKeys.length - 1;
                var start = 0;
                var easeIn2 = new KeyframeEase(0, 0.1);
                var easeOut2 = new KeyframeEase(0, 0.1);
                CreateTheCurve(selectedProperty, selectedKeys, i, easeIn2, easeOut2, start, end);
                switch (i) {
                    case start:
                        selectedProperty.setInterpolationTypeAtKey(selectedKeys[i], KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.LINEAR);
                        break;
                    case end:
                        selectedProperty.setInterpolationTypeAtKey(selectedKeys[i], KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.BEZIER);
                        break;
                    default:
                        selectedProperty.setInterpolationTypeAtKey(selectedKeys[i], KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
                }
                var arvSpeedIn = selectedProperty.keyInTemporalEase(selectedKeys[i])[0].speed;
                var arvSpeedOut = selectedProperty.keyOutTemporalEase(selectedKeys[i])[0].speed;
                var influenceIn = MathClampValue(x2 * 100, 0.1, 100);
                var influenceOut = MathClampValue(x1 * 100, 0.1, 100);
                var bruhIn = x2 <= 0 ? 1000 : 1 / x2;
                var bruhOut = x1 <= 0 ? 1000 : 1 / x1;
                var constSpeedIn = y2 * arvSpeedIn * bruhIn;
                var constSpeedOut = y1 * arvSpeedOut * bruhOut;
                var easeIn = new KeyframeEase(parseFloat(Number(constSpeedIn).toFixed(2)), influenceIn);
                var easeOut = new KeyframeEase(parseFloat(Number(constSpeedOut).toFixed(2)), influenceOut);
                CreateTheCurve(selectedProperty, selectedKeys, i, easeIn, easeOut, start, end);
            }
            continue;
        }
    }
}

function ApplyCurveToKeyFramesExcalibur(x1, y1, x2, y2) {
    app.beginUndoGroup("Excalibur Curves");
    var original_x2 = x2;
    var original_y2 = y2;
    x2 = 1 - x2;
    y2 = 1 - y2;
    var myComp = app.project.activeItem;
    if (myComp instanceof CompItem) {
        for (var l = 0; l < myComp.selectedLayers.length; l += 1) {
            var selectedLayer = myComp.selectedLayers[l];
            if (selectedLayer) {
                if (selectedLayer.Masks) {
                    for (var e = 1; e <= selectedLayer.Masks.numProperties; e += 1) {
                        var thisMask = selectedLayer.Masks.property(e);
                        for (var r = 1; r <= 4; r += 1) {
                            var selectedProperty_mask = thisMask.property(r);
                            if (((selectedProperty_mask) && (selectedProperty_mask.selectedKeys)) && (selectedProperty_mask.selectedKeys.length > 0)) {
                                var selectedKeys_Mask = selectedProperty_mask.selectedKeys;
                                OutSourcedCurves(selectedProperty_mask, selectedKeys_Mask, x1, y1, x2, y2, original_x2, original_y2);
                                OutSourcedCurves(selectedProperty_mask, selectedKeys_Mask, x1, y1, x2, y2, original_x2, original_y2);
                            } else {
                                continue;
                            }
                        }
                    }
                }
                if (selectedLayer.Effects) {
                    for (var e = 1; e <= selectedLayer.Effects.numProperties; e += 1) {
                        var thisEffect = selectedLayer.effect(e);
                        for (var r = 1; r <= thisEffect.numProperties; r += 1) {
                            var selectedProperty_effect = thisEffect.property(r);
                            if (((selectedProperty_effect) && (selectedProperty_effect.selectedKeys)) && (selectedProperty_effect.selectedKeys.length > 0)) {
                                var selectedKeys_Effects = selectedProperty_effect.selectedKeys;
                                OutSourcedCurves(selectedProperty_effect, selectedKeys_Effects, x1, y1, x2, y2, original_x2, original_y2);
                                OutSourcedCurves(selectedProperty_effect, selectedKeys_Effects, x1, y1, x2, y2, original_x2, original_y2);
                            }
                        }
                    }
                }
                if (selectedLayer.selectedProperties) {
                    for (var f = 0; f < selectedLayer.selectedProperties.length; f += 1) {
                        var selectedProperty = selectedLayer.selectedProperties[f];
                        if (((selectedProperty) && (selectedProperty.selectedKeys)) && (selectedProperty.selectedKeys.length > 0)) {
                            var selectedKeys = selectedProperty.selectedKeys;
                            OutSourcedCurves(selectedProperty, selectedKeys, x1, y1, x2, y2, original_x2, original_y2);
                            OutSourcedCurves(selectedProperty, selectedKeys, x1, y1, x2, y2, original_x2, original_y2);
                        }
                    }
                }
            }
        }
    } else {
        NotInACompERROR();
    }
    app.endUndoGroup();
}







