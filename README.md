# Lum-o-ring

![Version](https://img.shields.io/badge/version-1.0.0-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)

![Demo](releases/Screencap.gif)

## Description

Lum-o-ring is a cross-platform desktop application designed to function as a screen-based ring light overlay for video calls. It renders a scalable, illuminated ring shape on the screen to improve user lighting conditions without requiring external hardware. The application ensures the center of the screen remains unobstructed for work, while the illuminated ring section is interactive and opaque to prevent accidental clicks on underlying windows.

## Key Features

*   **Scalable Ring Overlay** - customizable ring diameter and thickness to fit various screen sizes and camera positions.
*   **Intelligent Click-Through** - mouse events pass through the transparent center to interact with other applications, while the illuminated ring captures clicks to prevent accidental interaction with hidden windows.
*   **Floating Control Menu** - provides quick access to adjust brightness, color temperature (RGB/Hex), edge blurriness, and power state.
*   **Multi-Monitor Support** - automatic detection of connected displays with the ability to select the target monitor for the overlay.
*   **State Persistence** - automatically saves and restores user preferences including ring position, size, color, and brightness across sessions.
*   **Cross-Platform Compatibility** - fully functional on Windows, macOS, and Linux environments.

## Tech Stack

*   **Framework:** Electron (v28+)
*   **Frontend:** React.js
*   **Language:** TypeScript
*   **State Management:** Electron Store
*   **Build Tool:** Electron Forge

## Getting Started

Follow these instructions to set up the project locally for development and testing.

### Prerequisites

*   Node.js (v18.0.0 or higher)
*   npm (v9.0.0 or higher) or yarn

### Installation

Clone the repository and install the dependencies.

```bash
git clone https://github.com/your-org/lum-o-ring.git
cd lum-o-ring
npm install
```

### Usage

**Development Mode**
Start the application in development mode with hot-reloading.

```bash
npm start
```

**Production Build**
Create a distributable executable for your current OS.

```bash
npm run make
```

**Runtime Controls**
*   **Drag:** Click and hold the illuminated ring section to move the overlay.
*   **Resize:** Use the floating menu sliders to adjust the inner and outer radius.
*   **Menu Access:** Right-click the ring or click the tray icon to toggle the floating control menu.

## Contributing

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/NewFeature`).
3.  Commit your changes (`git commit -m 'Add some NewFeature'`).
4.  Push to the branch (`git push origin feature/NewFeature`).
5.  Open a Pull Request.

## License

Distributed under the Apache License 2.0. See `LICENSE` for more information.