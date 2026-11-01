const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  loadData: () => ipcRenderer.invoke('data:load'),
  saveData: (data) => ipcRenderer.invoke('data:save', data),
  exportBackup: (data) => ipcRenderer.invoke('data:exportBackup', data),
  cryptoQuotes: (symbols) => ipcRenderer.invoke('market:cryptoQuotes', symbols),
  stockQuotes: (symbols) => ipcRenderer.invoke('market:stockQuotes', symbols),
  testCmcKey: (key) => ipcRenderer.invoke('cmc:testKey', key),
  openExternal: (url) => ipcRenderer.invoke('app:openExternal', url),
  appVersion: () => ipcRenderer.invoke('app:version'),
});
