(function () {
	'use strict';
	var extPath = location.href;

	if (getOS() === "MAC") {
		extPath = extPath.substring(7, extPath.length - 11);
	}
	if (getOS() === "WIN") {
		extPath = extPath.substring(8, extPath.length - 11);
	}

	window.cs = new CSInterface();
	cs.evalScript('$.evalFile("' + extPath + './../jsx/aftereffects.jsx")');

	console.log("Start");
	console.log(extPath);
}());

// Fonction raccourcie pour appeler JSX
function E(script) {
	cs.evalScript(script);
}

function getOS() {
	var platform = window.navigator.platform;
	var macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
	var windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
	if (macosPlatforms.indexOf(platform) !== -1) return "MAC";
	if (windowsPlatforms.indexOf(platform) !== -1) return "WIN";
	return null;
}

// recharge l'extension After Effects (marche pas ??)
function reloadPanel() {
	cs.reloadExtension();
}

document.addEventListener("keydown", function (e) {
	if (e.ctrlKey && e.key.toLowerCase() === "r") {
		e.preventDefault();
		location.reload();
	}
});