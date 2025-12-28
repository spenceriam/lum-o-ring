// Lum-o-ring Preload - Electron API Bridge
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  invoke: (channel, ...args) => {
    return ipcRenderer.invoke(channel, ...args);
  },
  send: (channel, ...args) => {
    ipcRenderer.send(channel, ...args);
  },
  on: (channel, callback) => {
    ipcRenderer.on(channel, (event, ...args) => callback(...args));
  },
  showContextMenu: (options) => {
    ipcRenderer.send("show-context-menu", options);
  }
});
