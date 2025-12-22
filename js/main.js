var users = [];
var currentUser = null;
var currentTabIndex = 1;
var dashboardOpen = false;

console.log("Start");

function getOS() {
	var userAgent = window.navigator.userAgent;
	var platform = window.navigator.platform;
	var macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
	var windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
	var os = null;

	if (macosPlatforms.indexOf(platform) !== -1) {
		os = "MAC";
	} else if (windowsPlatforms.indexOf(platform) !== -1) {
		os = "WIN";
	}
	return os;
}

function checkOrAddUser(username) {
	try {
		if (users.includes(username)) {
			return true;
		} else {
			users.push(username);
			return false;
		}
	} catch (error) {
		console.error("Error checking user:", error);
		sendNotification("Error checking user!", false);
		return false;
	}
}

function loadUserFromFile() {
	try {
		var fs = require('fs');
		var path = require('path');
		var os = require('os');

		var documentsFolder = path.join(os.homedir(), 'Documents');
		var setFolder = path.join(documentsFolder, 'ExcaliburFx');
		var InfoFilePath = path.join(setFolder, 'infos.phsc');

		if (!fs.existsSync(setFolder)) {
			fs.mkdirSync(setFolder, { recursive: true });
		}

		if (fs.existsSync(InfoFilePath)) {
			var content = fs.readFileSync(InfoFilePath, 'utf8');
			if (content) {
				try {
					var usersData = JSON.parse(content);
					if (usersData.length > 0) {
						usersData.sort(function (a, b) {
							return new Date(b.lastLogin) - new Date(a.lastLogin);
						});
						return usersData[0].username;
					}
				} catch (e) {
					console.error('Error parsing user file:', e);
				}
			}
		}
	} catch (error) {
		console.error('Error loading user from file:', error);
	}
	return null;
}

function saveUserToFile(username) {
	try {
		var fs = require('fs');
		var path = require('path');
		var os = require('os');

		var documentsFolder = path.join(os.homedir(), 'Documents');
		var setFolder = path.join(documentsFolder, 'ExcaliburFx');
		var InfoFilePath = path.join(setFolder, 'infos.phsc');

		if (!fs.existsSync(setFolder)) {
			fs.mkdirSync(setFolder, { recursive: true });
		}

		var usersData = [];
		if (fs.existsSync(InfoFilePath)) {
			var content = fs.readFileSync(InfoFilePath, 'utf8');
			if (content) {
				try {
					usersData = JSON.parse(content);
				} catch (e) {
					usersData = [];
				}
			}
		}

		var existingUser = usersData.find(function (u) {
			return u.username === username;
		});

		if (!existingUser) {
			usersData.push({
				username: username,
			});
		} else {
			existingUser.lastLogin = new Date().toISOString();
		}

		fs.writeFileSync(InfoFilePath, JSON.stringify(usersData, null, 2), 'utf8');
		console.log('User saved to file:', username);

	} catch (error) {
		console.error('Error saving user to file:', error);
	}
}

function sendNotification(message, color, duration) {
	color = color !== undefined ? color : true;
	duration = duration || 3500;

	var notification = document.getElementById("notification");
	var theNotification = document.getElementById("theNotification");
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
	setTimeout(function () {
		notification.classList.remove("show");
	}, duration);
}

function LoadLoader() {
	window.addEventListener('load', function () {
		var loader = document.getElementById('loader');
		if (loader && !document.getElementById('loginPage').classList.contains('hidden')) {
			loader.style.display = 'none';
		}
	});
}

window.addEventListener('keydown', function (e) {
	if (e.ctrlKey && (e.key === 'r' || e.key === 'R' || e.key === 'F5')) {
		e.preventDefault();
		location.reload();
	}
});

function resizeSquareMenu() {
	var panel = document.querySelector('.StuckLeftPanel');
	if (!panel || !panel.classList.contains('show')) return;

	var menuItems = panel.querySelectorAll('nav a');
	var panelHeight = window.innerHeight;
	var reservedSpace = 160;
	var availableHeight = panelHeight - reservedSpace;
	var itemCount = menuItems.length;
	var gap = 8;
	var totalGap = gap * (itemCount - 1);
	var size = Math.floor((availableHeight - totalGap) / itemCount);
	size = Math.max(42, Math.min(size, 72));

	menuItems.forEach(function (item) {
		item.style.height = size + 'px';
	});
}

function initTabNavigation() {
	var navLinks = document.querySelectorAll('.StuckLeftPanel a[data-tab]');

	navLinks.forEach(function (link) {
		link.addEventListener('click', function (e) {
			e.preventDefault();
			var tabId = link.getAttribute('data-tab');

			if (dashboardOpen && tabId !== 'tab_1') {
				toggleDashboard();
				setTimeout(function () {
					showTab(tabId);
				}, 450);
				return;
			}

			if (tabId === 'tab_1') {
				toggleDashboard();
				return;
			}

			showTab(tabId);
		});
	});
}

function toggleDashboard() {
	var dashboard = document.getElementById('tab_1');
	var backdrop = document.getElementById('dashboardBackdrop');
	if (!dashboard || !backdrop) return;

	var duration = 450;

	if (!dashboardOpen) {
		dashboardOpen = true;

		dashboard.style.display = 'flex';
		dashboard.style.position = 'fixed';
		dashboard.style.top = '0';
		dashboard.style.left = '160px';
		dashboard.style.width = 'calc(100vw - 160px)';
		dashboard.style.height = '100vh';
		dashboard.style.zIndex = '1000';
		dashboard.style.transform = 'translateX(-100%)';

		backdrop.style.display = 'block';
		backdrop.style.zIndex = '999';
		backdrop.classList.add('show');

		dashboard.offsetHeight;

		dashboard.style.transition = 'transform 0.45s cubic-bezier(0.4, 0.0, 0.2, 1)';
		dashboard.style.transform = 'translateX(0)';
	} else {
		dashboardOpen = false;

		dashboard.style.transition = 'transform 0.45s cubic-bezier(0.4, 0.0, 0.2, 1)';
		dashboard.style.transform = 'translateX(-100%)';

		backdrop.classList.remove('show');

		setTimeout(function () {
			dashboard.style.display = 'none';
			dashboard.style.position = '';
			dashboard.style.transition = '';
			dashboard.style.transform = '';
			dashboard.style.zIndex = '';
			backdrop.style.display = 'none';
			backdrop.style.zIndex = '';
		}, duration);
	}
}

function showTab(tabId) {
	if (tabId === 'tab_1') return;

	var newTabIndex = parseInt(tabId.split('_')[1]);
	if (newTabIndex === currentTabIndex) return;

	var currentTab = document.querySelector('.tabContent.active');
	var targetTab = document.getElementById(tabId);
	if (!targetTab) {
		console.error('Tab not found:', tabId);
		return;
	}

	console.log('Switching tabs:', currentTabIndex, '->', newTabIndex);

	var horizontalTabs = [12, 13];
	var isHorizontal = horizontalTabs.includes(newTabIndex) || horizontalTabs.includes(currentTabIndex);

	var enterTransform, exitTransform;

	if (isHorizontal) {
		enterTransform = 'translateX(100%)';
		exitTransform = 'translateX(-100%)';
	} else {
		var direction = newTabIndex > currentTabIndex ? 'down' : 'up';
		enterTransform = direction === 'down' ? 'translateY(100%)' : 'translateY(-100%)';
		exitTransform = direction === 'down' ? 'translateY(-100%)' : 'translateY(100%)';
	}

	targetTab.style.display = 'flex';
	targetTab.style.position = 'absolute';
	targetTab.style.top = '0';
	targetTab.style.left = '0';
	targetTab.style.width = '100%';
	targetTab.style.height = '100%';
	targetTab.style.opacity = '1';
	targetTab.style.transform = enterTransform;

	void targetTab.offsetHeight; //recalcule tout, sinon dashboard marche mal

	if (currentTab) {
		currentTab.style.transition = 'transform 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)';
		currentTab.style.transform = exitTransform;
	}

	targetTab.style.transition = 'transform 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)';
	targetTab.style.transform = 'translate(0, 0)';


	setTimeout(function () {
		if (currentTab) {
			currentTab.classList.remove('active');
			currentTab.style.display = 'none';
			currentTab.style.position = '';
			currentTab.style.transform = '';
			currentTab.style.transition = '';
			currentTab.style.opacity = '';
		}

		targetTab.classList.add('active');
		targetTab.style.position = '';
		targetTab.style.transform = '';
		targetTab.style.transition = '';

		currentTabIndex = newTabIndex;
		console.log('Tab switch complete. Current index:', currentTabIndex);
	}, 500);
}

function autoLogin() {
	var savedUsername = loadUserFromFile();

	if (savedUsername) {
		console.log('Auto-login for user:', savedUsername);
		currentUser = savedUsername;
		checkOrAddUser(savedUsername);

		document.getElementById('loginPage').classList.add('hidden');
		document.querySelector('.main-content').style.display = 'none';

		var leftPanel = document.querySelector('.StuckLeftPanel');
		var contentArea = document.getElementById('contentArea');
		var undertTitle = document.getElementById('undertTitle');

		if (leftPanel) {
			leftPanel.classList.add('show');
		}

		if (contentArea) {
			contentArea.classList.add('show');
		}

		if (undertTitle) {
			undertTitle.textContent = savedUsername;
		}

		initTabNavigation();
		resizeSquareMenu();

		var loader = document.getElementById('loader');
		if (loader) {
			loader.style.display = 'flex';
			loader.style.opacity = '1';
		}

		setTimeout(function () {
			if (loader) {
				loader.style.opacity = '0';
				setTimeout(function () {
					loader.style.display = 'none';
				}, 500);
			}

			sendNotification('Welcome back, ' + savedUsername + '!', true);
		}, 1000);

		return true;
	}
	return false;
}

function initLogin() {
	var loginForm = document.getElementById('loginForm');
	if (!loginForm) return;

	loginForm.addEventListener('submit', function (e) {
		e.preventDefault();
		var username = document.getElementById('username').value.trim();

		if (username) {
			var isExisting = checkOrAddUser(username);
			currentUser = username;

			saveUserToFile(username);

			document.getElementById('loginPage').classList.add('hidden');
			document.querySelector('.main-content').style.display = 'none';

			var loader = document.getElementById('loader');
			if (loader) {
				loader.style.display = 'flex';
				loader.style.opacity = '1';
			}

			setTimeout(function () {
				if (loader) {
					loader.style.opacity = '0';
					setTimeout(function () {
						loader.style.display = 'none';
					}, 500);
				}

				setTimeout(function () {
					var leftPanel = document.querySelector('.StuckLeftPanel');
					var contentArea = document.getElementById('contentArea');
					var undertTitle = document.getElementById('undertTitle');

					if (leftPanel) {
						leftPanel.classList.add('show');
					}

					if (contentArea) {
						contentArea.classList.add('show');
					}

					if (undertTitle) {
						undertTitle.textContent = username;
					}

					sendNotification(isExisting ? "Welcome back!" : "User registered!", true);

					initTabNavigation();
					resizeSquareMenu();
				}, 500);
			}, 2000);
		} else {
			sendNotification("Invalid username.", false);
		}
	});
}

window.addEventListener('DOMContentLoaded', function () {
	LoadLoader();

	var autoLoggedIn = autoLogin();
	if (!autoLoggedIn) {
		initLogin();
	}

	var backdrop = document.getElementById('dashboardBackdrop');
	if (backdrop) {
		backdrop.addEventListener('click', function () {
			if (dashboardOpen) toggleDashboard();
		});
	}

	if (typeof startFPSCounter === 'function') startFPSCounter();
	if (typeof displaySystemInfo === 'function') displaySystemInfo();
	if (typeof monitorSystemResources === 'function') monitorSystemResources();
});

window.addEventListener('resize', resizeSquareMenu);

window.E = function (script) {
	if (typeof CSInterface !== 'undefined') {
		new CSInterface().evalScript(script);
	}
};

function getSystemInfo() {
	try {
		var os = require('os');

		var systemInfo = {
			platform: os.platform(),
			arch: os.arch(),
			cpuModel: os.cpus()[0].model,
			cpuCores: os.cpus().length,
			totalMemory: (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
			freeMemory: (os.freemem() / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
			usedMemory: ((os.totalmem() - os.freemem()) / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
			memoryUsagePercent: (((os.totalmem() - os.freemem()) / os.totalmem()) * 100).toFixed(1) + '%',
			hostname: os.hostname(),
			uptime: (os.uptime() / 3600).toFixed(2) + ' hours'
		};

		return systemInfo;
	} catch (error) {
		console.error('Error getting system info:', error);
		return null;
	}
}

function getCPUUsage() {
	try {
		var os = require('os');
		var cpus = os.cpus();

		var totalIdle = 0;
		var totalTick = 0;

		cpus.forEach(function (cpu) {
			for (var type in cpu.times) {
				totalTick += cpu.times[type];
			}
			totalIdle += cpu.times.idle;
		});

		var idle = totalIdle / cpus.length;
		var total = totalTick / cpus.length;
		var usage = 100 - (100 * idle / total);

		return usage.toFixed(1) + '%';
	} catch (error) {
		console.error('Error getting CPU usage:', error);
		return '0%';
	}
}

function getAfterEffectsMemoryUsage() {
	if (typeof CSInterface !== 'undefined') {
		var csInterface = new CSInterface();

		csInterface.evalScript('app.memoryInUse', function (result) {
			var memoryMB = (parseInt(result) / (1024 * 1024)).toFixed(2);
			console.log('After Effects Memory Usage: ' + memoryMB + ' MB');
			return memoryMB + ' MB';
		});
	}
}

var fps = 0;
var frames = 0;
var lastTime = performance.now();

function updateFPS() {
	frames++;

	var currentTime = performance.now();

	if (currentTime - lastTime >= 1000) {
		fps = frames;
		frames = 0;
		lastTime = currentTime;

		var fpsCounter = document.getElementById('FpsCounter');
		if (fpsCounter) {
			fpsCounter.textContent = fps + ' fps';
		}
	}

	requestAnimationFrame(updateFPS);
}

function startFPSCounter() {
	requestAnimationFrame(updateFPS);
}

function createSquareInSection(sectionId, content) {
	var section = document.getElementById(sectionId);
	if (!section) return;

	var square = document.createElement('div');
	square.className = 'section-square';

	var squareContent = document.createElement('div');
	squareContent.className = 'square-content';
	squareContent.innerHTML = content;

	square.appendChild(squareContent);
	section.appendChild(square);

	updateSquareSizes();
}

function updateSquareSizes() {
	var squares = document.querySelectorAll('.section-square');
	var viewportMin = Math.min(window.innerWidth - 200, window.innerHeight);
	var size = Math.max(200, viewportMin * 0.4);

	squares.forEach(function (square) {
		square.style.width = size + 'px';
		square.style.height = size + 'px';
	});
}