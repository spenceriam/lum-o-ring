// Lum-o-ring Main Process
// Two-window approach: Ring overlay + Settings dialog

const { app, BrowserWindow, ipcMain, globalShortcut } = require("electron");
const path = require("path");

// Safe logging wrapper to handle EPIPE errors
const safeWrite = (stream, message) => {
  try {
    stream.write(message);
  } catch (error) {
    if (error.code !== "EPIPE") {
      throw error;
    }
  }
};

console.log = (...args) => {
  safeWrite(process.stdout, args.join(" ") + "\n");
};
console.error = (...args) => {
  safeWrite(process.stderr, args.join(" ") + "\n");
};
console.warn = (...args) => {
  safeWrite(process.stderr, "WARNING: " + args.join(" ") + "\n");
};

console.log("\n" + "=".repeat(70));
console.log(" LUM-O-RING STARTING");
console.log("=".repeat(70));
console.log(" Environment Info:");
console.log("   WAYLAND_DISPLAY:", process.env.WAYLAND_DISPLAY || "not set");
console.log("   GDK_BACKEND:", process.env.GDK_BACKEND || "not set");
console.log("   DISPLAY:", process.env.DISPLAY || "not set");
console.log("   XDG_SESSION_TYPE:", process.env.XDG_SESSION_TYPE || "not set");
console.log("=".repeat(70) + "\n");

// Prevent error popups
process.on("uncaughtException", (error) => {
  console.error("UNCAUGHT EXCEPTION:", error);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("UNHANDLED REJECTION at:", promise, "reason:", reason);
});

// Force X11 backend for transparency support on Wayland
if (process.env.WAYLAND_DISPLAY && !process.env.GDK_BACKEND) {
  console.log("Wayland detected - forcing X11 backend for transparency");
  process.env.GDK_BACKEND = "x11";
}

// Settings store
let settingsStore = {
  isOn: true,
  size: 80,        // Size percentage of screen
  thickness: 25,   // Ring thickness in pixels
  brightness: 100, // 0-100
  blur: 40,        // Glow/blur amount in pixels
  color: "#fff5cc" // Warm white
};

const SETTINGS_FILE = path.join(app.getPath("userData"), "lum-o-ring.json");

// Load settings
async function loadSettings() {
  try {
    const fs = require("fs");
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, "utf8");
      const loaded = JSON.parse(data);
      settingsStore = { ...settingsStore, ...loaded };
      console.log("[lum-o-ring] Settings loaded:", settingsStore);
    }
  } catch (error) {
    console.error("[lum-o-ring] Failed to load settings:", error);
  }
  return settingsStore;
}

// Save settings
async function saveSettings(event, data) {
  try {
    if (data.settings) {
      settingsStore = { ...settingsStore, ...data.settings };
    }
    const fs = require("fs");
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settingsStore, null, 2));
    console.log("[lum-o-ring] Settings saved:", settingsStore);
    return { success: true };
  } catch (error) {
    console.error("[lum-o-ring] Failed to save settings:", error);
    return { success: false, error: error.message };
  }
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  console.log("[lum-o-ring] Another instance is already running!");
  app.quit();
}

let ringWindow = null;
let settingsWindow = null;
let isQuitting = false;

app.whenReady().then(async () => {
  console.log("[lum-o-ring] App ready");

  // Load settings
  await loadSettings();

  // Get primary display size
  const { screen } = require("electron");
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  console.log(`[lum-o-ring] Display size: ${width}x${height}`);

  // ========== Create Ring Window (fullscreen, transparent, click-through) ==========
  ringWindow = new BrowserWindow({
    width: width,
    height: height,
    x: 0,
    y: 0,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: false,
    alwaysOnTop: true,
    show: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "src/renderer/preload.js"),
    },
  });

  // Ring window is always click-through
  ringWindow.setIgnoreMouseEvents(true, { forward: true });
  console.log("[lum-o-ring] Ring window created (click-through enabled)");

  // Handle ring window close
  ringWindow.on("close", (event) => {
    if (!isQuitting) {
      isQuitting = true;
      app.quit();
    }
  });

  ringWindow.loadFile("src/renderer/index.html");

  // ========== Create Settings Window (normal, hidden by default) ==========
  createSettingsWindow();

  // ========== Register Keyboard Shortcuts ==========
  // Ctrl+Shift+L to toggle settings window
  globalShortcut.register('CommandOrControl+Shift+L', () => {
    toggleSettingsWindow();
  });
  console.log("[lum-o-ring] Keyboard shortcut registered: Ctrl+Shift+L for settings");

  console.log("[lum-o-ring] Ring window loaded");
});

function createSettingsWindow() {
  const { screen } = require("electron");
  const primaryDisplay = screen.getPrimaryDisplay();
  const { x, y } = primaryDisplay.bounds;

  settingsWindow = new BrowserWindow({
    width: 320,
    height: 450,
    x: x + 50,
    y: y + 50,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "src/renderer/preload.js"),
    },
  });

  console.log("[lum-o-ring] Settings window created");

  settingsWindow.loadFile("src/renderer/settings.html");

  settingsWindow.on("close", (event) => {
    // Just hide instead of closing
    event.preventDefault();
    settingsWindow.hide();
    console.log("[lum-o-ring] Settings window hidden");
  });
}

function toggleSettingsWindow() {
  if (settingsWindow) {
    if (settingsWindow.isVisible()) {
      settingsWindow.hide();
      console.log("[lum-o-ring] Settings window hidden");
    } else {
      settingsWindow.show();
      settingsWindow.focus();
      console.log("[lum-o-ring] Settings window shown");
    }
  }
}

// IPC handlers
ipcMain.handle("loadSettings", async () => {
  return settingsStore;
});

ipcMain.handle("saveSettings", async (event, data) => {
  return await saveSettings(event, data);
});

ipcMain.on("quitApp", () => {
  console.log("[lum-o-ring] Quit app requested");
  isQuitting = true;
  app.quit();
});

ipcMain.on("close-settings", () => {
  if (settingsWindow) {
    settingsWindow.hide();
    console.log("[lum-o-ring] Settings window closed");
  }
});

ipcMain.on("update-ring", (event, settings) => {
  // Broadcast settings to ring window
  if (ringWindow) {
    ringWindow.webContents.send("ring-settings-updated", settings);
  }
});

// App lifecycle - don't prevent quit on Linux
app.on("window-all-closed", () => {
  // On Linux, quit when all windows are closed
  app.quit();
});

app.on("before-quit", () => {
  isQuitting = true;
  globalShortcut.unregisterAll();
});

app.on("activate", () => {
  // On macOS, recreate window if needed
  if (ringWindow === null) {
    app.whenReady().then(async () => {
      await loadSettings();
    });
  }
});
