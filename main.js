// Lum-o-ring Main Process
// Screen-based ring light overlay

const { app, BrowserWindow, ipcMain } = require("electron");
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

let mainWindow = null;
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

  // Create transparent window
  mainWindow = new BrowserWindow({
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

  console.log("[lum-o-ring] Window created");

  // Note: Click-through is handled via CSS pointer-events in the renderer
  // The ring has pointer-events: none, while UI elements have pointer-events: auto
  console.log("[lum-o-ring] Using CSS pointer-events for click-through");

  // Handle window close - actually quit
  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      isQuitting = true;
      app.quit();
    }
  });

  mainWindow.loadFile("src/renderer/index.html");

  console.log("[lum-o-ring] Window loaded");
});

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

// App lifecycle - don't prevent quit on Linux
app.on("window-all-closed", () => {
  // On Linux, quit when all windows are closed
  app.quit();
});

app.on("before-quit", () => {
  isQuitting = true;
});

app.on("activate", () => {
  // On macOS, recreate window if needed
  if (mainWindow === null) {
    app.whenReady().then(async () => {
      await loadSettings();
      // Recreate window logic here if needed
    });
  }
});
