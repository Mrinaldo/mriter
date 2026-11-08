import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('electronAPI', {
  saveProject: (data: { defaultPath?: string; data: any }) => ipcRenderer.invoke('dialog:saveProject', data),
  openProject: () => ipcRenderer.invoke('dialog:openProject'),
  saveFile: (data: { filePath: string; content: string; isBinary?: boolean }) => ipcRenderer.invoke('fs:saveFile', data),
  showSaveFileDialog: (options: { title: string; defaultName: string; filters: Array<{ name: string; extensions: string[] }> }) =>
    ipcRenderer.invoke('dialog:showSaveFileDialog', options),
  printToPDF: (options: any) => ipcRenderer.invoke('print:toPDF', options),
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  isWindowMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  onWindowMaximizedChange: (callback: (isMaximized: boolean) => void) => {
    ipcRenderer.on('window:maximized-change', (_event, value) => callback(value))
  },
  platform: process.platform,
  onMainMessage: (callback: (message: string) => void) => {
    ipcRenderer.on('main-process-message', (_event, value) => callback(value))
  },
})
