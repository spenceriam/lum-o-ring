// Lum-o-ring Main Process
// Two-window approach: Ring overlay + Settings dialog

const { app, BrowserWindow, ipcMain, Menu } = require("electron");
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
  thickness: 40,   // Ring thickness in pixels
  brightness: 100, // 0-100
  blur: 40,        // Glow/blur amount in pixels
  color: "#fff5cc", // Warm white
  customColor: "#fff5cc" // User's custom color
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
let gearWindow = null;
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

  // Ring window is always click-through (but we'll toggle for gear icon)
  ringWindow.setIgnoreMouseEvents(true, { forward: true });
  console.log("[lum-o-ring] Ring window created (click-through enabled)");

  // Handle ring window close - quit app
  ringWindow.on("close", () => {
    if (!isQuitting) {
      isQuitting = true;
    }
  });

  // When ring window is closed, destroy all windows and quit
  ringWindow.on("closed", () => {
    ringWindow = null;
    isQuitting = true;
    console.log("[lum-o-ring] Ring window closed - destroying all windows");

    // Destroy settings window if it exists
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.destroy();
    }
    // Destroy gear window if it exists
    if (gearWindow && !gearWindow.isDestroyed()) {
      gearWindow.destroy();
    }

    // Force exit on Linux
    app.exit(0);
  });

  ringWindow.loadFile("src/renderer/index.html");

  // ========== Create Settings Window (normal, hidden by default) ==========
  createSettingsWindow();

  // ========== Create Gear Icon Window (separate, receives mouse events) ==========
  createGearWindow();

  console.log("[lum-o-ring] Ring window loaded");
});

function createSettingsWindow() {
  const { screen } = require("electron");
  const primaryDisplay = screen.getPrimaryDisplay();
  const { x, y } = primaryDisplay.bounds;

  settingsWindow = new BrowserWindow({
    width: 320,
    height: 720,
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
    // Only hide if app is not quitting - allow close during quit
    if (!isQuitting) {
      event.preventDefault();
      settingsWindow.hide();
      console.log("[lum-o-ring] Settings window hidden");
    }
    // If isQuitting, allow the close to proceed
  });
}

function createGearWindow() {
  const { screen } = require("electron");
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width } = primaryDisplay.workAreaSize;

  gearWindow = new BrowserWindow({
    width: 50,
    height: 50,
    x: width - 56,  // Top-right corner (width - 50 - margins)
    y: 10,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    show: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "src/renderer/preload.js"),
    },
  });

  // NOTE: No setIgnoreMouseEvents - this window receives all events normally!
  gearWindow.loadFile("src/renderer/gear.html");
  console.log("[lum-o-ring] Gear icon window created");

  gearWindow.on("close", () => {
    if (!isQuitting) {
      gearWindow = null;
    }
  });

  gearWindow.on("closed", () => {
    gearWindow = null;
  });
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

  // Destroy all windows forcefully
  if (ringWindow && !ringWindow.isDestroyed()) {
    ringWindow.destroy();
  }
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.destroy();
  }
  if (gearWindow && !gearWindow.isDestroyed()) {
    gearWindow.destroy();
  }

  // Force exit on Linux
  app.exit(0);
});

ipcMain.on("close-settings", () => {
  if (settingsWindow) {
    settingsWindow.hide();
    console.log("[lum-o-ring] Settings window closed");
  }
});

ipcMain.on("open-settings", () => {
  if (settingsWindow) {
    settingsWindow.show();
    settingsWindow.focus();
    console.log("[lum-o-ring] Settings window opened via right-click");
  }
});

ipcMain.on("update-ring", (event, data) => {
  // Extract only settings properties - data may contain IPC MessagePort properties
  const settings = {
    isOn: data.isOn,
    size: data.size,
    thickness: data.thickness,
    brightness: data.brightness,
    blur: data.blur,
    color: data.color
  };

  // Broadcast settings to ring window
  if (ringWindow) {
    ringWindow.webContents.send("ring-settings-updated", settings);
  }
});

ipcMain.on("open-external", (event, url) => {
  console.log("[lum-o-ring] Opening external URL:", url);
  require("electron").shell.openExternal(url);
});

// Show context menu for gear icon
ipcMain.on("show-context-menu", () => {
  // Build menu dynamically based on current ring state
  const ringLabel = settingsStore.isOn ? "Turn Ring Off" : "Turn Ring On";

  const contextMenu = Menu.buildFromTemplate([
    {
      label: ringLabel,
      click: () => {
        console.log("[lum-o-ring] Context menu: " + ringLabel);

        // Toggle the ring state
        settingsStore.isOn = !settingsStore.isOn;

        // Send to ring window to update visual
        if (ringWindow && !ringWindow.isDestroyed()) {
          ringWindow.webContents.send("ring-settings-updated", settingsStore);
        }

        // Send to settings window to sync toggle UI
        if (settingsWindow && !settingsWindow.isDestroyed()) {
          settingsWindow.webContents.send("sync-ring-toggle", settingsStore.isOn);
        }

        console.log("[lum-o-ring] Ring toggled " + (settingsStore.isOn ? "ON" : "OFF"));
      }
    },
    {
      label: "Settings",
      click: () => {
        if (settingsWindow) {
          settingsWindow.show();
          settingsWindow.focus();
          console.log("[lum-o-ring] Settings opened from context menu");
        }
      }
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        console.log("[lum-o-ring] Quit requested from context menu");
        isQuitting = true;

        // Destroy all windows forcefully
        if (ringWindow && !ringWindow.isDestroyed()) {
          ringWindow.destroy();
        }
        if (settingsWindow && !settingsWindow.isDestroyed()) {
          settingsWindow.destroy();
        }
        if (gearWindow && !gearWindow.isDestroyed()) {
          gearWindow.destroy();
        }

        // Force exit on Linux
        app.exit(0);
      }
    }
  ]);

  // Position menu at top-right corner of screen (where gear icon is)
  const { screen } = require("electron");
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width } = primaryDisplay.workAreaSize;

  contextMenu.popup({
    x: width - 100,
    y: 50
  });
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
  if (ringWindow === null) {
    app.whenReady().then(async () => {
      await loadSettings();
    });
  }
});
