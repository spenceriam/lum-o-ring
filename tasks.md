# Implementation Tasks - Lum-o-ring

## Phase 1: Foundation & Project Setup
- [ ] **Task 1.1**: Initialize Project Repository & Stack
  - **Description**: Create a new project using Electron, React, and TypeScript. Configure TailwindCSS for styling. Set up the basic directory structure (src/main, src/renderer). Ensure the application launches a default "Hello World" window.
  - **Dependencies**: None
  - **Files**: `package.json`, `tsconfig.json`, `src/main/main.ts`, `src/renderer/App.tsx`, `tailwind.config.js`
  - **Verification**: Run `npm start` and verify a standard Electron window with React content appears.

- [ ] **Task 1.2**: Configure Transparent Overlay Window
  - **Description**: Modify the Electron main process to create a window that is frameless, transparent, always on top, and maximizes to cover the primary display. Remove default window controls. Ensure the background is fully transparent (alpha 0).
  - **Dependencies**: Task 1.1
  - **Files**: `src/main/main.ts`
  - **Verification**: Launch the app. The window should cover the screen but be invisible (or show a test element floating), with no window borders or title bar.

## Phase 2: Ring Rendering & Passthrough Logic
- [ ] **Task 2.1**: Implement Ring UI Component
  - **Description**: Create a React component rendering the Ring Light. Use CSS/SVG to create a circular overlay with a transparent center. Implement initial props/state for `thickness`, `color`, `blur`, and `radius` (scale). The ring should be centered on the screen by default.
  - **Dependencies**: Task 1.2
  - **Files**: `src/renderer/components/RingOverlay.tsx`, `src/renderer/App.tsx`
  - **Verification**: App displays a visible ring on the screen. The center is transparent visually.

- [ ] **Task 2.2**: Implement "Smart Click-Through" Logic
  - **Description**: Implement the logic to allow mouse clicks to pass through the empty center but block them on the ring pixels.
    - Add a mouse movement listener in the renderer.
    - Determine if the mouse is over a "clickable" element (Ring or Menu) or the "transparent hole".
    - Use `ipcRenderer` to send `set-ignore-mouse-events` to the main process.
    - **Logic**: 
      - Mouse over Ring/Menu -> `setIgnoreMouseEvents(false)`
      - Mouse over Hole -> `setIgnoreMouseEvents(true, { forward: true })`
  - **Dependencies**: Task 2.1
  - **Files**: `src/renderer/hooks/useClickThrough.ts`, `src/main/main.ts`
  - **Verification**: Open a browser window behind the app. Verify you can click links in the browser through the center hole, but clicking the ring itself does not interact with the background window.

## Phase 3: Floating Control Menu
- [ ] **Task 3.1**: Create Draggable Control Panel UI
  - **Description**: Develop a floating, draggable menu component. It should contain sliders/inputs for:
    - Brightness (Opacity of the ring)
    - Color (Color picker or presets)
    - Edge Blurriness (CSS filter blur)
    - Ring Thickness
    - Power Toggle (Hides ring but keeps app running)
  - **Dependencies**: Task 2.1
  - **Files**: `src/renderer/components/ControlPanel.tsx`
  - **Verification**: A menu appears on screen. It can be dragged around (ensure dragging logic works with the click-through logic from Task 2.2).

- [ ] **Task 3.2**: Connect Control State to Ring Component
  - **Description**: Wire the Control Panel inputs to the React state that drives the `RingOverlay`. Ensure changes in the menu immediately reflect on the ring visual.
  - **Dependencies**: Task 3.1
  - **Files**: `src/renderer/App.tsx`, `src/renderer/context/SettingsContext.tsx`
  - **Verification**: Moving the "Blur" slider changes the ring's blur instantly. Changing color updates the ring.

## Phase 4: System Integration & Persistence
- [ ] **Task 4.1**: Implement Settings Persistence
  - **Description**: Integrate `electron-store` (or similar) to save user preferences (ring size, color, menu position) to disk. Load these settings on application startup.
  - **Dependencies**: Task 3.2
  - **Files**: `src/main/store.ts` (or equivalent), `src/renderer/App.tsx`
  - **Verification**: Change settings, close the app, and restart. The app should restore the previous state.

- [ ] **Task 4.2**: System Tray Implementation
  - **Description**: Add a system tray icon. The tray context menu should include "Show/Hide Ring", "Reset Settings", and "Quit". This ensures the user can close the app if the UI is hidden or inaccessible.
  - **Dependencies**: Task 1.2
  - **Files**: `src/main/tray.ts`, `src/main/main.ts`
  - **Verification**: A tray icon appears in the OS taskbar/menubar. Right-clicking shows the menu options, and they function correctly.

## Phase 5: Polish & Packaging
- [ ] **Task 5.1**: Multi-Monitor Support (Basic)
  - **Description**: Add logic to detect current display bounds. If possible, allow the window to move to a specific display or span all displays (depending on chosen strategy, likely per-display window or moving the window). For MVP, ensure it centers correctly on the primary display or the display the cursor is on at launch.
  - **Dependencies**: Task 1.2
  - **Files**: `src/main/windowManager.ts`
  - **Verification**: App opens correctly centered on the primary monitor.

- [ ] **Task 5.2**: Build Configuration
  - **Description**: Configure `electron-builder` for Windows, macOS, and Linux targets. Set up application icons and build scripts.
  - **Dependencies**: All previous tasks
  - **Files**: `package.json`, `electron-builder.yml`, `resources/icon.png`
  - **Verification**: Run `npm run build` (or `make`) and generate an executable/installer. Run the installer on the host OS to verify it works outside the dev environment.