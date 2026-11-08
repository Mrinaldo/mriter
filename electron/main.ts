import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
//
process.env.APP_ROOT = path.join(__dirname, '..')

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    width: 1300,
    height: 850,
    minWidth: 500,
    minHeight: 500,
    backgroundColor: '#f7f5f2',
    titleBarStyle: 'hidden',
    ...(process.platform === 'darwin'
      ? {
          trafficLightPosition: { x: 14, y: 14 },
        }
      : {}),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(process.env.VITE_PUBLIC || RENDERER_DIST, 'icon.png'),
  })

  // Window state notification for renderer custom controls
  win.on('maximize', () => {
    win?.webContents.send('window:maximized-change', true)
  })
  win.on('unmaximize', () => {
    win?.webContents.send('window:maximized-change', false)
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  createWindow()

  // IPC handlers for saving / opening files
  ipcMain.handle('dialog:saveProject', async (_, { defaultPath, data }) => {
    if (!win) return { canceled: true }
    const result = await dialog.showSaveDialog(win, {
      title: 'Save Manuscript Project',
      defaultPath: defaultPath || 'My Novel.mriter',
      filters: [{ name: 'Mriter Manuscript Project (*.mriter, *.json)', extensions: ['mriter', 'json'] }],
    })
    if (!result.canceled && result.filePath) {
      await fs.writeFile(result.filePath, JSON.stringify(data, null, 2), 'utf-8')
      return { canceled: false, filePath: result.filePath }
    }
    return { canceled: true }
  })

  ipcMain.handle('dialog:openProject', async () => {
    if (!win) return { canceled: true }
    const result = await dialog.showOpenDialog(win, {
      title: 'Open Manuscript Project',
      filters: [{ name: 'Mriter Manuscript Project (*.mriter, *.json)', extensions: ['mriter', 'json'] }],
      properties: ['openFile'],
    })
    if (!result.canceled && result.filePaths.length > 0) {
      const content = await fs.readFile(result.filePaths[0], 'utf-8')
      return { canceled: false, filePath: result.filePaths[0], data: JSON.parse(content) }
    }
    return { canceled: true }
  })

  ipcMain.handle('fs:saveFile', async (_, { filePath, content, isBinary }) => {
    if (isBinary) {
      await fs.writeFile(filePath, Buffer.from(content, 'base64'))
    } else {
      await fs.writeFile(filePath, content, 'utf-8')
    }
    return true
  })

  ipcMain.handle('dialog:showSaveFileDialog', async (_, { title, defaultName, filters }) => {
    if (!win) return { canceled: true }
    const result = await dialog.showSaveDialog(win, {
      title,
      defaultPath: defaultName,
      filters,
    })
    return result
  })

  ipcMain.handle('print:toPDF', async (_, options) => {
    if (!win) return null
    // Electron printToPDF
    const pdfData = await win.webContents.printToPDF(options || {})
    return pdfData.toString('base64')
  })

  // Window management IPC handlers for frameless window controls
  ipcMain.handle('window:minimize', () => {
    win?.minimize()
    return true
  })

  ipcMain.handle('window:maximize', () => {
    if (!win) return false
    if (win.isMaximized()) {
      win.unmaximize()
      return false
    } else {
      win.maximize()
      return true
    }
  })

  ipcMain.handle('window:close', () => {
    win?.close()
    return true
  })

  ipcMain.handle('window:isMaximized', () => {
    return win?.isMaximized() ?? false
  })
})
