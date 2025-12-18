(function () {
	'use strict';
	window.cs = new CSInterface();
	var extPath = cs.getSystemPath(SystemPath.EXTENSION);

	cs.evalScript('$.evalFile("' + extPath + '/jsx/aftereffects.jsx")', function (result) {
		const loadingOverlay = document.getElementById("loadingOverlay");
		const content = document.querySelector(".content");

		// Fade out the loading overlay
		loadingOverlay.style.opacity = "0";
		loadingOverlay.style.transition = "opacity 0.5s ease";

		// Show the content after the overlay fades out
		setTimeout(() => {
			loadingOverlay.style.display = "none";
			content.style.display = "block";
		}, 500); // Match the transition duration
	});

	console.log("Start");
	console.log(extPath);
}());

// Fonction raccourcie pour appeler JSX
function E(script) {
	cs.evalScript(script);
}

// recharge l'extension After Effects
function reloadPanel() {
	cs.reloadExtension();
}



document.addEventListener("keydown", function (e) {
	if (e.ctrlKey && e.key.toLowerCase() === "r") {
		e.preventDefault();
		location.reload();
	}
});