# Project Requirements: Lum-o-ring

## 1. Project Overview
*   **Objective**: Develop a cross-platform desktop application (Windows, macOS, Linux) that overlays a virtual "ring light" on the user's screen to illuminate their face during video calls. The application must feature a scalable, donut-shaped window where the illuminated ring blocks mouse interaction (to prevent accidental clicks on hidden content) while the empty center allows full mouse pass-through to underlying applications.
*   **Target Audience**: Remote workers, streamers, and content creators who need improved lighting for video calls but lack physical hardware or space.
*   **Key Differentiator**: The "Hole" architecture—ensuring the center of the screen remains fully interactive while the light source occupies the periphery.

## 2. Tech Stack & Constraints
*   **Core Framework**: **Electron** (Latest Stable)
    *   *Reasoning*: Electron is the only cross-platform framework with mature, consistent support for "pixel-perfect" click-through transparency (`setIgnoreMouseEvents` with forwarding) across Windows, macOS, and Linux. While heavier than Tauri, reliability of the "hole" interaction is paramount.
*   **Frontend**: **React** + **Vite**
    *   *Reasoning*: High performance, component-based architecture for the floating menu and SVG manipulation of the ring.
*   **Styling**: **TailwindCSS**
    *   *Reasoning*: Rapid UI development for the control panel.
*   **State Management**: **Zustand** or **React Context**
    *   *Reasoning*: Lightweight state management for brightness/color sync between the control window and the ring window.
*   **Persistence**: **electron-store**
    *   *Reasoning*: Simple, reliable JSON-based storage for user preferences.
*   **OS Compatibility**:
    *   Windows 10/11
    *   macOS 12+ (Monterey or newer)
    *   Linux (Ubuntu 20.04+, GNOME/KDE) - *Note: Wayland support in Electron is experimental; X11 fallback may be required.*

## 3. Core Features

### 3.1. The Ring Overlay (Toroidal Window)
*   **Description**: A frameless, transparent window rendering a high-brightness ring.
*   **Acceptance Criteria**:
    *   [ ] Render a circular or rounded-rectangular ring (user toggleable) on top of all other windows (`alwaysOnTop`).
    *   [ ] **The "Hole" Interaction (CRITICAL)**:
        *   Pixels within the illuminated ring MUST intercept mouse events (Click, Drag, Scroll).
        *   Pixels within the empty center MUST pass all mouse events to the OS/window behind the application.
        *   Implementation must use `setIgnoreMouseEvents(true, { forward: true })` with a mouse-tracking event listener in the renderer process to toggle the ignore state dynamically.
    *   [ ] **Drag & Resize**:
        *   User can click and drag the illuminated ring section to move the overlay.
        *   User can drag the outer or inner edges to resize the ring thickness and diameter.
    *   [ ] **Visuals**:
        *   Adjustable color temperature (Warm/Cool gradient).
        *   Adjustable brightness (Opacity/White overlay).
        *   Adjustable edge blur (CSS `filter: blur()`) to soften the light.

### 3.2. Floating Control Menu
*   **Description**: A separate, smaller child window acting as the remote control for the ring.
*   **Acceptance Criteria**:
    *   [ ] Spawned alongside the Ring window.
    *   [ ] Contains sliders for:
        *   **Brightness**: 0% - 100%
        *   **Temperature**: 2700K (Warm) - 6500K (Cool)
        *   **Thickness**: Ring width adjustment.
        *   **Blur**: Hard edge vs. Soft diffuse.
    *   [ ] **Power Toggle**: Button to hide the Ring window completely without closing the app.
    *   [ ] **Monitor Selector**: Dropdown to move the ring to a specific display (if >1 monitor detected).
    *   [ ] Window must be draggable and collapsible to a "mini" icon.

### 3.3. Multi-Monitor Support
*   **Description**: Ability to project the ring light onto any connected display.
*   **Acceptance Criteria**:
    *   [ ] Detect all active displays using Electron's `screen` API.
    *   [ ] Ensure the Ring window coordinates are correctly calculated relative to the selected display's bounds (handling negative coordinates for left/top aligned secondary monitors).
    *   [ ] If a monitor is disconnected, the Ring must automatically jump to the primary display to prevent it from being "lost" off-screen.

### 3.4. State Persistence
*   **Description**: Save user preferences between sessions.
*   **Acceptance Criteria**:
    *   [ ] On app launch, restore the last known:
        *   Ring Position (X, Y) and Size.
        *   Selected Monitor ID.
        *   Brightness, Color, and Blur settings.
    *   [ ] If the last known Monitor ID is invalid, revert to Primary Display.

## 4. User Experience (UX) Flow

1.  **Launch**: App starts. If first run, Ring appears centered on Primary Display with default "Warm" light. Control Menu appears bottom-right.
2.  **Adjustment**: User notices the ring covers their browser tabs. They click the **Ring Body** (illuminated part) and drag it down.
3.  **Interaction**: User moves mouse into the **Center Hole** of the ring. They click a link on the web browser behind the ring. The click registers on the browser (Pass-through success).
4.  **Fine Tuning**: User clicks the **Control Menu**. They slide "Blur" to max to create a soft vignette effect.
5.  **Session End**: User clicks "Power Off" in the menu. Ring disappears. App remains in System Tray (optional) or closes based on settings.

## 5. Non-Functional Requirements

*   **Performance**:
    *   Ring rendering must maintain 60 FPS to prevent "stutter" when dragging.
    *   CPU usage must remain below 5% when idle (static light).
    *   Memory footprint should be optimized (target < 150MB) by minimizing Main Process logic and using CSS for rendering instead of Canvas where possible.
*   **Responsiveness**:
    *   The transition between "Clickable Ring" and "Click-through Hole" must happen instantly (<16ms) to prevent the user from accidentally clicking the ring when aiming for the center.
*   **System Permissions**:
    *   **macOS**: Must gracefully handle/request "Screen Recording" or "Accessibility" permissions if required for global mouse event forwarding (though `forward: true` often bypasses the need for global hooks).

## 6. Implementation Guidelines (Technical Specs)

### 6.1. Click-Through Logic (The "Hole")
The renderer process (React) will track the mouse position.
```javascript
// Pseudo-code concept for Renderer Logic
window.addEventListener('mousemove', (e) => {
  const element = document.elementFromPoint(e.clientX, e.clientY);
  // If hovering over the ring (id='ring-ui'), capture clicks.
  // If hovering over transparent body, ignore clicks.
  if (element.id === 'ring-ui') {
    ipcRenderer.send('set-ignore-mouse', false);
  } else {
    ipcRenderer.send('set-ignore-mouse', true, { forward: true });
  }
});
```

### 6.2. IPC Communication
*   **Channel**: `update-ring-state`
    *   Payload: `{ brightness: number, color: string, blur: number }`
    *   Flow: Control Window -> Main Process -> Ring Window.
*   **Channel**: `move-ring-to-display`
    *   Payload: `{ displayId: number }`
    *   Flow: Control Window -> Main Process (calculates bounds) -> Ring Window (`setBounds`).

## 7. Future Considerations
*   **Webcam Integration**: Use the physical webcam feed to "auto-adjust" brightness based on ambient light.
*   **Shortcuts**: Global hotkeys (e.g., `Ctrl+Shift+L`) to toggle the light on/off during a call.
*   **Tauri Migration**: Evaluate Tauri v2+ once support for pixel-perfect transparency/click-through becomes stable, to reduce binary size from ~120MB (Electron) to ~10MB.

### Verified Sources
- [reddit.com](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQENDUgD1B2t6MoQRMgftIPPlTzJDQZoKovZJ7Hj3HJ69aNLi2vCpFie4tY0zDHBCW_xTxFOAIb9PUonkHkhPEldmMAoq5iOv7BaTGzP5Gt8eGy0maZJgvgW3vdoiFvv6I6tsU5ZvjwVT2jVAn4H3u2jj0MmpdHJTcAVvlB5mLMK)
- [github.com](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQECkerXfkP5EZFu1dz5SbIufIY6TCuFBaDnRSlTJFAlIJp8nPlC0iBJ36hVi-sJvt6SdMG2cCUN21uFI_c0SLAonjZQTZwasCWicLq3TZaILex4HDrOsXB0_ivHe2nt7iJkQvusmNtkJpBVbg==)
- [juejin.cn](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEQmFHPCKsfLG4ZpoEbzZULWRmRHQZYA_CJfnNbl5x5Vvd2HBGElEq0dqVXStSBvR64fEe0sArAlEHaU39TUuoapHTHHU5aUok-2j2TmYnjNE5Xe5WtN23QQ2v_Dq1p8HMLT4Ey)
- [github.com](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFtn2ylyed4c6U1tCLAV07cNxVq3WimjInL6XQ6H4YpuOY-tpJSAMC5GJcX-fZIAUhNfTDD3XSaYnqvtVD1n0LAI3StTHCylR1nYyQoCLEjb-UC008JLX87_wiZrROaWIYOA-5nkecqdrRa)
- [electronjs.org](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHbBhCVqu8gQpGSr8XSnqgtQmWqlNEPeVzL6JHdoZEc6nFcwT7pyG9kEDty-7P9XhV6z6StG6pV7WeuqYzuFsLaAo7sVi51-bj0mofBOifDqh1fCseiSHriv19PMgmsFhGmB1jd_z4N1I4hufnyfpQWOw==)
- [reddit.com](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHacsxxy5A9mkaD4R3of1yZml_gW3_4DCwvNt4UaU1jFw73L4BW4SVnMqL5a_o9qSCF1qY307Gctuu_PqimIH7CXPA-8PjDbIsh6518Vx0IYT9aI33t3eCdF76ivYvsbOANfNTrgji4Vti7R-cjLVue-OF8FRuNb5FEWXTzHquaRyxCtfxsiF6FvuC5jLDhRu7HL_7tQDryjzYylvf9rA==)
- [raftlabs.com](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEqveK4Emz0FF95vCrbGzg8U8N7djbg7ZY3ef_CN7jpCT1fDGYbNxbLy3FgoojiroTZZvn_4WcQHBGboUAZ-QpFsZfCjC2tVrCx6lj_RHtr4Qb_VqgjhvPZbJbEFT8__pZA9Tbw5m9FdNMne7VC2scUUDYKZQ==)
- [levminer.com](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFFiTySDZGQuukogtHHooajZjBFrJlnvHWF5gSC0-FEGvJtXvBanPAudYbLGlCR4QqqGmtUqD-s3qw_2wckvTzbiEUC3nHLaBi7FxewhcTDH10KfiEvQER41cngP4CYx4XIggkCcad9SuI=)
- [palette.dev](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHI6XHwDTbXJRumLTKmcPUMF6TiOJmIS1XBIxMnxgh4vL2nkZMF6BpBXgChF_k6k7ktvmhoUjViyFZCe0bay2yg5KtOQx7CkZ5Hv4n4VwqXdCTo-DaMBp1OlwcrKosfx--IJS_vZ5sbfgMYm9Dmd1h40jkzmFrM-PJz)
- [github.com](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFzy0t5J9Ta6pe4xgOEB0yRtP1vpvoD0-kstTo6hy73xfDhNv0NfgUim_P4LOFbLuZ-6iGPQ2bbEq1NQHcvrWhGhJLguxktyz7m2jA6k0suo8j3zHatnNo1u7lHMKdxZnPSSH_8K6kWqk9duw==)