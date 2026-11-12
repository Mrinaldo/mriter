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
    const subscription = (_event: any, value: boolean) => callback(value)
    ipcRenderer.on('window:maximized-change', subscription)
    return () => ipcRenderer.removeListener('window:maximized-change', subscription)
  },
  isWindowFullScreen: () => ipcRenderer.invoke('window:isFullScreen'),
  onWindowFullScreenChange: (callback: (isFullScreen: boolean) => void) => {
    const subscription = (_event: any, value: boolean) => callback(value)
    ipcRenderer.on('window:fullscreen-change', subscription)
    return () => ipcRenderer.removeListener('window:fullscreen-change', subscription)
  },
  onMenuAction: (callback: (action: string) => void) => {
    const subscription = (_event: any, action: string) => callback(action)
    ipcRenderer.on('menu:action', subscription)
    return () => ipcRenderer.removeListener('menu:action', subscription)
  },
  platform: process.platform,
  onMainMessage: (callback: (message: string) => void) => {
    ipcRenderer.on('main-process-message', (_event, value) => callback(value))
  },
  spellcheck: {
    toggle: (enabled: boolean) => ipcRenderer.invoke('spellcheck:toggle', enabled),
    getState: () => ipcRenderer.invoke('spellcheck:getState'),
    setLanguages: (languages: string[]) => ipcRenderer.invoke('spellcheck:setLanguages', languages),
    getAvailableLanguages: () => ipcRenderer.invoke('spellcheck:getAvailableLanguages'),
    addToDictionary: (word: string) => ipcRenderer.invoke('spellcheck:addToDictionary', word),
    getCustomWords: () => ipcRenderer.invoke('spellcheck:getCustomWords'),
    onToggled: (callback: (enabled: boolean) => void) => {
      const subscription = (_event: any, value: boolean) => callback(value)
      ipcRenderer.on('spellcheck:toggled', subscription)
      return () => ipcRenderer.removeListener('spellcheck:toggled', subscription)
    },
    onLanguageChanged: (callback: (lang: string) => void) => {
      const subscription = (_event: any, value: string) => callback(value)
      ipcRenderer.on('spellcheck:languageChanged', subscription)
      return () => ipcRenderer.removeListener('spellcheck:languageChanged', subscription)
    },
  },
})
