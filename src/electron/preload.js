const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  getUser: (rfid) => ipcRenderer.invoke('db:get-user', rfid),
  saveUser: (user) => ipcRenderer.invoke('db:save-user', user),
  logEntry: (entry) => ipcRenderer.invoke('db:log-entry', entry),
  login: (creds) => ipcRenderer.invoke('auth:login', creds),
  logout: () => ipcRenderer.invoke('auth:logout'),
  checkAuth: () => ipcRenderer.invoke('auth:check'),
  sync: () => ipcRenderer.invoke('sync:perform'),
  getSetting: (key) => ipcRenderer.invoke('settings:get', key),
  setSetting: (key, value) => ipcRenderer.invoke('settings:set', key, value)
});


