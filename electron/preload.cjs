/**
 * Preload — API segura hacia el renderer (widget flotante).
 */
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("sentinel", {
  isElectron: true,
  toggleWidget: () => ipcRenderer.invoke("widget:toggle"),
  openWidget: () => ipcRenderer.invoke("widget:open"),
  closeWidget: () => ipcRenderer.invoke("widget:close"),
  isWidgetOpen: () => ipcRenderer.invoke("widget:is-open"),
  onWidgetState: (cb) => {
    const handler = (_e, open) => cb(!!open);
    ipcRenderer.on("widget:state", handler);
    return () => ipcRenderer.removeListener("widget:state", handler);
  },
});
