const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dockAPI', {
  checkPort: (port) => ipcRenderer.invoke('check-port', port),
  checkAllPorts: (ports) => ipcRenderer.invoke('check-all-ports', ports),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  getProjects: () => ipcRenderer.invoke('get-projects'),
  saveProjects: (projects) => ipcRenderer.invoke('save-projects', projects),
  refreshMenu: () => ipcRenderer.invoke('refresh-menu'),
  scanPorts: () => ipcRenderer.invoke('scan-ports'),
  exportConfig: () => ipcRenderer.invoke('export-config'),
  importConfig: () => ipcRenderer.invoke('import-config'),
  openPath: (p) => ipcRenderer.invoke('open-path', p),
  openSettings: () => ipcRenderer.invoke('open-settings-window'),
  getVersion: () => ipcRenderer.invoke('get-version'),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (s) => ipcRenderer.invoke('save-settings', s),
  onThemeChanged: (cb) => ipcRenderer.on('theme-changed', (_e, theme) => cb(theme)),
});
