# AGENTS.md

## Header
**Name:** Lum-o-ring  
**Version:** 1.0.0  
**Role:** Product Architect & Lead Developer

## Context
The goal of this project is to develop Lum-o-ring, a cross-platform desktop application that functions as a screen-based ring light overlay for video calls. The application targets Windows, macOS, and Linux, prioritizing speed, reliability, and responsiveness.

The core utility is a customizable ring of light displayed on the user's screen to illuminate their face during video calls. This ring must be scalable and leave the center of the screen unobstructed. A floating menu will provide controls for brightness, color temperature (or RGB), edge blurriness, and power state.

A critical requirement is the interaction model: the ring overlay must allow mouse clicks to pass through the empty center to interact with windows behind it, but the illuminated ring section itself must block clicks to prevent accidental interactions with underlying elements. User settings such as ring position, size, color, and brightness must persist between sessions.

## Capabilities
As the primary development agent, you are capable of:
1.  **Architecture Design:** Designing a modular and performance-oriented architecture using Tauri (Rust) for the backend and React/TypeScript for the frontend.
2.  **Cross-Platform Development:** Writing and testing code that compiles and runs consistently across Windows, macOS, and Linux environments.
3.  **Window Management:** Implementing advanced windowing features, including transparency, always-on-top behavior, and complex click-through logic (ignoring mouse events in the center while capturing them on the ring).
4.  **State Management:** implementing local persistence for user preferences using disk-based stores.
5.  **UI/UX Implementation:** Creating a high-performance, responsive user interface with smooth transitions for light adjustments (brightness, color, blur).

## Actions
When executing tasks, perform the following actions where appropriate:

**scaffold_project**
Initialize a new Tauri project using the React/TypeScript template. Configure the `tauri.conf.json` to support transparent windows, removing standard window decorations to create a seamless overlay experience.

**implement_click_through_logic**
Develop the specific logic to handle mouse event forwarding. This involves configuring the main window to be transparent and always on top. You must implement a mechanism (likely via Rust command or CSS pointer-events combined with window event ignoring) that ensures the central "hole" allows click-through to the OS, while the visible ring captures mouse events for moving or resizing the overlay.

**create_floating_controls**
Build a floating, draggable menu component. This menu must exist within the overlay context but be independently positionable. Connect the UI sliders for brightness, color, and blur to the application state.

**configure_persistence**
Set up a local store (e.g., using `tauri-plugin-store`) to save the state of the ring (size, color, brightness, position) to the disk. Ensure these settings are loaded and applied immediately upon application launch.

**optimize_performance**
Ensure the rendering of the ring light (which may use CSS filters or Canvas) does not consume excessive CPU/GPU resources, as the app will run alongside video conferencing software.

## Instructions
Follow these system guidelines strictly:

**Technology Stack**
Use Tauri as the application framework to ensure a small binary size and high performance. Use Rust for backend system operations and React with TypeScript for the frontend interface. Use Tailwind CSS for styling.

**Window Behavior**
The application must launch as a frameless, transparent window. By default, it should cover the active monitor. You must ensure the "click-through" requirement is robust; the user must never feel like their mouse is blocked by invisible elements in the center of the screen.

**Visual Fidelity**
The ring light effect should be smooth. Changes in brightness or color must happen instantly without lag. The edge blurriness feature should use efficient rendering techniques to avoid performance drops.

**User Safety**
Prevent the ring from becoming "lost" off-screen. Implement bounds checking to ensure the floating menu and the ring itself remain accessible on the visible display area.

**Code Quality**
Write strongly typed code. Ensure all Rust commands are safe and handle errors gracefully. Comment complex logic, especially regarding the window transparency and event handling, to ensure future maintainability.

**Persistence Strategy**
Save settings automatically on change or on app exit. Do not require a manual "Save" button for configuration preferences.

### Verified Sources
- [gitlab.com](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHIxzpCEDU1ENf5yeFlV2FKrxKqEtZfaI0Fx4BXWrZKXsSM8j5ONyZ_wHn2Upd1BRtGmqhOgA-WPvcLMtOenlszVpgW_ee-yERwnL3xsLPP6x0wliaqSxBdTmhJltY691pO61FpYJnct6S0dRbYr2zYirSb5XqvlzztBUw=)
- [wandb.ai](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEmrFbIUF-j9GLF_iYv3UZ6o7YWYe9J9uxMsGAr4T4Fb_RLyQvk1Wh23H_QDXJQZvFQI0e026PCx3EZjREQzEOJEGo_V_9CsdTh2Erphb-U7s2j-_Qbh2jKchv6UraQAmzzRVfzYiLk-CMMpv-S0cfA4fbhw341BRpgEL8z1q1TppKii0IlH-K-cLOsAqwLK3yv1W10DY-tICU=)
- [github.com](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFiU_4MZRa6FCEpqMY4IoT2vtHWp1gnj6eHCX0YtJpfGLYGG53T3PzEQ2pSVLY89_FWDlq1KLZjFWIa2aDvvWl1Oj6hVi13mZv4K5fTFq2fWyv-MCeTHooglzSbMxgnKl4=)
- [medium.com](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQG_ekI_hqJ-YTddqz0yAjDjry7e4STBarvUxSBQfF68fcZMVYOZvABCD9DfdF95VX-VrEznhWW82Esf51Xo53oBbPJGea1DDeHzG3ya8u7WsmEDDZ07wi4zHLM_y_qvbjZrNseSsrGLKM8AiZegrqPMXC64SJHt_pzuuX5SqEya1HoOXe3gC0yfLb1lzN0KwMp_q1xObU5pY5kmHg==)
- [plainenglish.io](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHA5adi3dogjCA0lapjg1bshv9oxM0moJF0nBiQrlU00L_ALV4RnrdWbloIe67IoOeuYMBUfpFvxsseqYDHt_zHHVi2jea610QaBV-jrSxmyGI0DBk9D6ZKXufEF01VQaE8i9IaCtpbIBQgtHGq2asSOBMf7pA3U6x-Q51gRb_c96KM-op-EGsfm1RDuLy8PeZ5lIt215rufNPKKsZ7pQ==)
- [agents.md](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGsuDGT4i-KDfPFbSTmWQLd-ve43RCCW-5O2OX3XayKnCaG_DA4A23leJy74yJVTTlsXOlBAwlWbOaTVndywHUwfPrQOZ0Acsr3l9Im8g==)
- [builder.io](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQG5T4UFd8kvUYY6ELAJFaaPDWrhrEtvonmtQFfygyfk-yjhOKBqxiglH2kP355S0szbkjv9znqj5xFfZRdJtpZuWrdu-8eZEvzyWt9BXt9sHEnIC800FqxQlTJr3spYP3Y=)
- [aimultiple.com](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFubSqvDfE5CLvXzzMNRIE5Up2kFjISfmve71MPz6ctOLu2Xwq9JOHCgH16Qz_pXLY8cmZK-V9mlGJ6MDc5OUnek_NnM8ko7GVsjAMW5B4d6xzm7WWxTcE2aLgDxl97zivjrI-j4w==)
- [habr.com](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEyHiQ9NjheTTRNt4y-l6avrhVgB8-CYmVUul6uwzSbK7L1kasRfBPSHFDlsExeCBYMqv6OZV61hElXhruZItl3YpmnD1_Qtppf0lGSsLSizrHoyDMI3rCAQXVDzYNJ5A==)
- [socket.dev](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFIKyXVwvCuJGjfVrpN1wmGAZV9GzCXY3x_1UdXAeaUABuLaumAexPw52RYYb-rt4wVdK7mWUyqmbQvojKojqKmYiMb8nr58bWaGaJCHiHhZ-RO65KXmhtTeS0vLIgL1XoBoOxwxLOx76haAuXD-OipZmGv2n-NniHTQwH12qfrZbR9s8bb1ggrjZi6B7WFIElZvA==)
- [factory.ai](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFmaI3rApDl0t97sjsq0rhyCGykzw3FLJGkFTw7UGs1D8qi8cIgI7L_LlkfbYgwdyEqdeb1anKXJHTZSaM9H-CvHjEvysmROVyFUgltrTcAdYfiFvgi4PijgJD77A==)
- [medium.com](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGj9B2HERPnpFFLXTbq2YWK8hBWYxarHyDMtif-zgwsdb0O1_ChreHYRi9a29fceDRm0iy-w8Jtwv28fKwklN7Vy3e6xFa0tp44om7qBodXQxGiTp8uVuapT88Nzlp8j6pfW3EoJO3mnEbZxZhU3CeZk5MogSzcMbpZOvaBEQHX6MC9oW3d9r1MOso-mAGSqYmmX_0zYnLgOpv0J2Y=)