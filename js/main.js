(function () {
	'use strict';
	var extPath;
	extPath = location.href;
	if (getOS() == "MAC") {
		extPath = extPath.substring(7, extPath.length - 11);
	}
	if (getOS() == "WIN") {
		extPath = extPath.substring(8, extPath.length - 11);
	}

	console.log("Start");
	console.log(extPath);

}());

function goIntoJSX() {

}

function getOS() {
	var userAgent = window.navigator.userAgent,
		platform = window.navigator.platform,
		macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'],
		windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'],
		os = null;

	if (macosPlatforms.indexOf(platform) != -1) {
		os = "MAC";
	} else if (windowsPlatforms.indexOf(platform) != -1) {
		os = "WIN";
	}
	return os;
}

const fs = require('fs');
const os = require('os');
const path = require('path');

function LoadAtStart() {
	const csInterface = new CSInterface();
	createFile();
}

LoadAtStart();

// simplified evalScript function
async function E(script) {
	new CSInterface().evalScript(script);
}

/* ----------------------------- Utils ----------------------------- */

window.addEventListener('load', () => {
	const loader = document.getElementById('loader');
	if (!loader) return;

	loader.style.transition = 'opacity 0.5s ease';

	setTimeout(() => {
		loader.style.opacity = '0';

		setTimeout(() => {
			loader.style.display = 'none';
		}, 500);
	}, 2000);
});

window.addEventListener('keydown', (e) => {
	if (e.ctrlKey && (e.key === 'r' || e.key === 'R' || e.key === 'F5')) {
		e.preventDefault();
		location.reload();
	}
});

// show notifs
async function sendNotification(message, color = true, duration = 3500) {
	const notification = document.getElementById("notification");
	const theNotification = document.getElementById("theNotification");
	if (!notification || !theNotification) return;

	if (color) {
		notification.style.borderTop = "5px solid #7CFC00";
		notification.style.boxShadow = "0 0 8px rgba(124, 252, 0, 0.2)";
	} else {
		notification.style.borderTop = "5px solid #FF4500";
		notification.style.boxShadow = "0 0 8px rgba(255, 69, 0, 0.2)";
	}

	theNotification.textContent = message;
	notification.classList.add("show");
	setTimeout(() => notification.classList.remove("show"), duration);
}

/* ----------------------------- Create File ----------------------------- */
function createFile() {
	const documentsFolder = path.join(os.homedir(), 'Documents');
	const setFolder = path.join(documentsFolder, 'JerryFlow');
	const setFolderCache = path.join(setFolder, 'Cache');

	if (!fs.existsSync(documentsFolder)) {
		sendNotification("Documents folder not found!", false);
		return;
	}

	if (!fs.existsSync(setFolder)) {
		fs.mkdirSync(setFolder);
	}

	if (!fs.existsSync(setFolderCache)) {
		fs.mkdirSync(setFolderCache);
	}

	const logFilePath = path.join(setFolderCache, 'log.phsc');
	const InfoFilePath = path.join(setFolder, 'infos.phsc');

	if (!fs.existsSync(logFilePath)) {
		fs.writeFileSync(logFilePath, '');
	}
	if (!fs.existsSync(InfoFilePath)) {
		fs.writeFileSync(InfoFilePath, '');
	}
}
