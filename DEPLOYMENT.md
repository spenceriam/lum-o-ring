# Lum-o-ring Deployment Guide

## Overview

Build instructions for creating installers and portable versions for Linux, Windows, and macOS **without** GitHub Actions. All builds performed manually on native machines/VMs for validation.

**Assigned To:** Minimax M2.1  
**Reviewed By:** GitHub Copilot (Claude Opus 4.5)  
**Date:** 2024-12-28

---

## Build Targets

| Platform | Installer | Portable |
|----------|-----------|----------|
| Linux | `.deb` | `.AppImage` |
| Windows | `.exe` (NSIS) | `.exe` (portable) |
| macOS | `.dmg` | `.zip` (app bundle) |

**Signing:** Unsigned for v1 (users will see security warnings)

---

## Step 1: Create Icon Assets

The source icon is `lum-o-ring-icon.png` in the project root.

### 1.1 Create Build Directory Structure

```bash
mkdir -p build/icons
```

### 1.2 Generate Linux Icons

```bash
# Install ImageMagick if not present
sudo apt-get install imagemagick

# Generate all sizes from source
for size in 16 32 48 64 128 256 512; do
  convert lum-o-ring-icon.png -resize ${size}x${size} build/icons/${size}x${size}.png
done

# Copy largest as main icon
cp build/icons/512x512.png build/icon.png
```

### 1.3 Generate Windows Icon (.ico)

```bash
# Create multi-resolution .ico file
convert lum-o-ring-icon.png -define icon:auto-resize=256,128,64,48,32,16 build/icon.ico
```

### 1.4 Generate macOS Icon (.icns)

**Option A: On Linux (using png2icns)**
```bash
sudo apt-get install icnsutils
png2icns build/icon.icns build/icons/512x512.png build/icons/256x256.png build/icons/128x128.png build/icons/64x64.png build/icons/32x32.png build/icons/16x16.png
```

**Option B: On macOS (using iconutil)**
```bash
mkdir build/icon.iconset
for size in 16 32 64 128 256 512; do
  cp build/icons/${size}x${size}.png build/icon.iconset/icon_${size}x${size}.png
done
iconutil -c icns build/icon.iconset -o build/icon.icns
rm -rf build/icon.iconset
```

### 1.5 Verify Icon Structure

After generation, you should have:
```
build/
├── icon.png          # 512x512 (main source)
├── icon.ico          # Windows
├── icon.icns         # macOS
└── icons/
    ├── 16x16.png
    ├── 32x32.png
    ├── 48x48.png
    ├── 64x64.png
    ├── 128x128.png
    ├── 256x256.png
    └── 512x512.png
```

---

## Step 2: Update package.json

Replace the existing `"build"` section and add new scripts.

### 2.1 Full Build Configuration

Replace the `"build"` object in `package.json` with:

```json
"build": {
  "appId": "com.lum-o-ring.app",
  "productName": "Lum-o-ring",
  "copyright": "Copyright © 2025 Spencer Francisco",
  "artifactName": "${productName}-${version}-${os}-${arch}.${ext}",
  
  "files": [
    "main.js",
    "src/**/*"
  ],
  
  "directories": {
    "output": "dist",
    "buildResources": "build"
  },

  "linux": {
    "target": [
      { "target": "deb", "arch": ["x64"] },
      { "target": "AppImage", "arch": ["x64"] }
    ],
    "category": "Utility",
    "icon": "build/icons",
    "executableName": "lum-o-ring",
    "synopsis": "Screen-based ring light for video calls",
    "description": "A customizable ring light overlay that illuminates your face during video calls."
  },

  "deb": {
    "depends": ["libnotify4", "libxtst6", "libnss3"],
    "packageCategory": "utils",
    "priority": "optional"
  },

  "win": {
    "target": [
      { "target": "nsis", "arch": ["x64"] },
      { "target": "portable", "arch": ["x64"] }
    ],
    "icon": "build/icon.ico"
  },

  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "installerIcon": "build/icon.ico",
    "uninstallerIcon": "build/icon.ico",
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true
  },

  "portable": {
    "artifactName": "${productName}-${version}-portable.exe"
  },

  "mac": {
    "target": [
      { "target": "dmg", "arch": ["x64", "arm64"] },
      { "target": "zip", "arch": ["x64", "arm64"] }
    ],
    "category": "public.app-category.utilities",
    "icon": "build/icon.icns",
    "hardenedRuntime": false,
    "gatekeeperAssess": false
  },

  "dmg": {
    "contents": [
      { "x": 130, "y": 220 },
      { "x": 410, "y": 220, "type": "link", "path": "/Applications" }
    ]
  }
}
```

### 2.2 Add Build Scripts

Add these scripts to the `"scripts"` section in `package.json`:

```json
"scripts": {
  "start": "GDK_BACKEND=x11 electron . 2>&1 | grep -v 'GetVSyncParametersIfAvailable'",
  "dev": "GDK_BACKEND=x11 electron . --enable-logging 2>&1 | grep -v 'GetVSyncParametersIfAvailable'",
  "dev:verbose": "GDK_BACKEND=x11 electron . --enable-logging",
  
  "clean": "rm -rf dist/",
  
  "build:linux": "electron-builder --linux",
  "build:linux:deb": "electron-builder --linux deb",
  "build:linux:portable": "electron-builder --linux AppImage",
  
  "build:win": "electron-builder --win",
  "build:win:installer": "electron-builder --win nsis",
  "build:win:portable": "electron-builder --win portable",
  
  "build:mac": "electron-builder --mac",
  "build:mac:dmg": "electron-builder --mac dmg",
  "build:mac:portable": "electron-builder --mac zip",
  
  "build:all:linux": "npm run build:linux",
  "build:all:win": "npm run build:win",
  "build:all:mac": "npm run build:mac"
}
```

---

## Step 3: Install Build Dependencies

### 3.1 Linux Build Requirements

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y dpkg fakeroot rpm libfuse2
```

### 3.2 Windows Build Requirements

On Windows VM/machine:
- Install Node.js 18+ from https://nodejs.org
- No additional tools needed

### 3.3 macOS Build Requirements

On macOS:
```bash
xcode-select --install
```

---

## Step 4: Build on Linux (Native)

Run these commands on your Linux machine (Ubuntu/Zorin):

```bash
# 1. Clean previous builds
npm run clean

# 2. Build both installer and portable
npm run build:linux

# 3. Or build individually:
npm run build:linux:deb        # .deb installer
npm run build:linux:portable   # .AppImage portable

# 4. Check output
ls -la dist/
```

**Expected output files:**
```
dist/
├── Lum-o-ring-1.0.0-linux-x64.deb
├── Lum-o-ring-1.0.0-linux-x64.AppImage
└── (other build artifacts)
```

### 4.1 Test .deb Installer

```bash
# Install
sudo dpkg -i dist/Lum-o-ring-1.0.0-linux-x64.deb

# If dependency errors:
sudo apt-get install -f

# Run from terminal
lum-o-ring

# Or find in application menu

# Uninstall
sudo dpkg -r lum-o-ring
```

### 4.2 Test AppImage Portable

```bash
# Make executable
chmod +x dist/Lum-o-ring-1.0.0-linux-x64.AppImage

# Run
./dist/Lum-o-ring-1.0.0-linux-x64.AppImage

# Note: May need libfuse2
# sudo apt-get install libfuse2
```

---

## Step 5: Build on Windows (VM)

### 5.1 Setup Windows VM

1. Create Windows 10/11 VM (VirtualBox, VMware, etc.)
2. Install Node.js 18+ from https://nodejs.org
3. Copy project folder to VM (shared folder or git clone)

### 5.2 Build Commands

Open PowerShell or CMD:

```powershell
# Navigate to project
cd C:\path\to\lum-o-ring

# Install dependencies
npm install

# Build both installer and portable
npm run build:win

# Or build individually:
npm run build:win:installer   # NSIS .exe installer
npm run build:win:portable    # Standalone portable .exe

# Check output
dir dist\
```

**Expected output files:**
```
dist\
├── Lum-o-ring-1.0.0-win-x64.exe       (NSIS installer)
├── Lum-o-ring-1.0.0-portable.exe      (portable)
└── (other build artifacts)
```

### 5.3 Test NSIS Installer

1. Run `Lum-o-ring-1.0.0-win-x64.exe`
2. **SmartScreen warning:** Click "More info" → "Run anyway" (unsigned app)
3. Follow installation wizard
4. Verify Start Menu shortcut created
5. Verify Desktop shortcut (if selected)
6. Launch app and test all features
7. Test uninstaller from Control Panel → Programs

### 5.4 Test Portable Version

1. Copy `Lum-o-ring-1.0.0-portable.exe` to any folder (Desktop, USB, etc.)
2. Run directly - no installation needed
3. **SmartScreen warning:** Click "More info" → "Run anyway"
4. Test all features work identically to installed version

---

## Step 6: Build on macOS (Native)

**IMPORTANT:** macOS builds MUST be done on macOS. Cross-compilation from Linux/Windows is not supported.

### 6.1 Setup on Mac

```bash
# Install Xcode command line tools
xcode-select --install

# Clone/copy project to Mac
git clone <your-repo> lum-o-ring
cd lum-o-ring

# Install dependencies
npm install
```

### 6.2 Build Commands

```bash
# Build both DMG and portable ZIP
npm run build:mac

# Or build individually:
npm run build:mac:dmg       # .dmg installer
npm run build:mac:portable  # .zip portable

# Check output
ls -la dist/
```

**Expected output files:**
```
dist/
├── Lum-o-ring-1.0.0-mac-x64.dmg
├── Lum-o-ring-1.0.0-mac-arm64.dmg     (if on Apple Silicon)
├── Lum-o-ring-1.0.0-mac-x64.zip
├── Lum-o-ring-1.0.0-mac-arm64.zip     (if on Apple Silicon)
└── (other build artifacts)
```

### 6.3 Test DMG Installer

1. Double-click `.dmg` to mount
2. Drag Lum-o-ring.app to Applications folder
3. **First launch - Gatekeeper bypass:**
   - Right-click app → "Open"
   - Click "Open" in dialog (bypasses unsigned app warning)
4. Test all features

### 6.4 Test ZIP Portable

1. Extract `.zip` file
2. Move `Lum-o-ring.app` anywhere (Desktop, folder, USB)
3. **First launch:** Right-click → "Open" (Gatekeeper bypass)
4. Test all features work identically

### 6.5 If "App is damaged" Error

```bash
# Remove quarantine attribute
xattr -cr /path/to/Lum-o-ring.app
```

---

## Step 7: Verification Checklists

### Linux (.deb) Verification

| # | Test | Pass? |
|---|------|-------|
| 1 | `dpkg -i` installs without errors | |
| 2 | App appears in application menu | |
| 3 | App launches from menu | |
| 4 | Ring displays with transparency | |
| 5 | Settings window opens (hamburger click) | |
| 6 | All settings visible (no cutoff) | |
| 7 | Ring toggle works | |
| 8 | Color temperature presets work | |
| 9 | X link opens browser | |
| 10 | Quit button closes app | |
| 11 | Right-click context menu works | |
| 12 | `dpkg -r` uninstalls cleanly | |

### Linux (AppImage) Verification

| # | Test | Pass? |
|---|------|-------|
| 1 | Runs without installation | |
| 2 | All features work (same as .deb) | |
| 3 | Settings persist between runs | |
| 4 | Can run from any directory | |

### Windows (Installer) Verification

| # | Test | Pass? |
|---|------|-------|
| 1 | Installer runs (bypass SmartScreen) | |
| 2 | Installation wizard completes | |
| 3 | Start Menu shortcut created | |
| 4 | Desktop shortcut created (if selected) | |
| 5 | App launches correctly | |
| 6 | Transparent window works | |
| 7 | Always-on-top works | |
| 8 | All settings work | |
| 9 | X link opens browser | |
| 10 | Uninstaller removes app cleanly | |

### Windows (Portable) Verification

| # | Test | Pass? |
|---|------|-------|
| 1 | Runs without installation | |
| 2 | All features work (same as installer) | |
| 3 | Can run from USB/any folder | |
| 4 | Settings persist in same location | |

### macOS (DMG) Verification

| # | Test | Pass? |
|---|------|-------|
| 1 | DMG mounts correctly | |
| 2 | Drag to Applications works | |
| 3 | App launches (with Gatekeeper bypass) | |
| 4 | Transparent window works | |
| 5 | All settings work | |
| 6 | X link opens browser | |
| 7 | Cmd+Q quits app | |
| 8 | Dock icon appears | |

### macOS (ZIP Portable) Verification

| # | Test | Pass? |
|---|------|-------|
| 1 | ZIP extracts correctly | |
| 2 | App runs from any location | |
| 3 | All features work (same as DMG) | |

---

## Step 8: Collect Release Artifacts

After all builds pass verification, organize files:

```bash
mkdir -p releases/v1.0.0/{linux,windows,macos}

# Linux
cp dist/Lum-o-ring-1.0.0-linux-x64.deb releases/v1.0.0/linux/
cp dist/Lum-o-ring-1.0.0-linux-x64.AppImage releases/v1.0.0/linux/

# Windows (copy from VM)
cp dist/Lum-o-ring-1.0.0-win-x64.exe releases/v1.0.0/windows/
cp dist/Lum-o-ring-1.0.0-portable.exe releases/v1.0.0/windows/

# macOS (copy from Mac)
cp dist/Lum-o-ring-1.0.0-mac-x64.dmg releases/v1.0.0/macos/
cp dist/Lum-o-ring-1.0.0-mac-x64.zip releases/v1.0.0/macos/
```

### Generate Checksums

```bash
cd releases/v1.0.0
sha256sum linux/* windows/* macos/* > checksums.txt
```

---

## Troubleshooting

### Linux: AppImage won't run
```bash
# Install FUSE
sudo apt-get install libfuse2

# Make executable
chmod +x Lum-o-ring-*.AppImage
```

### Linux: Transparency not working
```bash
# Force X11 backend (should be automatic, but verify)
GDK_BACKEND=x11 ./Lum-o-ring-*.AppImage
```

### Windows: SmartScreen blocks app
- Click "More info" → "Run anyway"
- This is normal for unsigned applications
- For v2+, consider code signing certificate

### Windows: Transparency issues
- Should work on Windows 10/11
- Try running as Administrator if issues persist

### macOS: "App is damaged"
```bash
xattr -cr /Applications/Lum-o-ring.app
```

### macOS: "Unidentified developer"
- Right-click → "Open" → "Open" (first launch only)
- This bypasses Gatekeeper for unsigned apps

### Build fails with icon errors
- Verify `build/` directory has all icon files
- Check icon paths in package.json match actual locations
- For macOS, ensure .icns was generated correctly

---

## Implementation Checklist for M2.1

| # | Task | Status |
|---|------|--------|
| 1 | Create `build/` directory | |
| 2 | Generate icons from `lum-o-ring-icon.png` | |
| 3 | Update `package.json` build config | |
| 4 | Add build scripts to `package.json` | |
| 5 | Test `npm run build:linux` on native | |
| 6 | Verify .deb installation/uninstallation | |
| 7 | Verify AppImage runs portably | |
| 8 | Test `npm run build:win` on Windows VM | |
| 9 | Verify NSIS installer + uninstaller | |
| 10 | Verify portable .exe works | |
| 11 | Test `npm run build:mac` on macOS | |
| 12 | Verify DMG installation | |
| 13 | Verify ZIP portable works | |
| 14 | Collect all artifacts to releases/ | |
| 15 | Generate checksums | |

---

## Questions for Copilot

*M2.1: Add questions here if you encounter issues.*

---

## Copilot Answers

*Copilot will respond here.*
