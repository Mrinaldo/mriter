import { app, BrowserWindow, ipcMain, dialog, Menu, MenuItemConstructorOptions } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'

app.name = 'Mriter'

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

let win: BrowserWindow | null = null

function setupApplicationMenu() {
  const isMac = process.platform === 'darwin'

  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              {
                label: 'Preferences...',
                accelerator: 'CmdOrCtrl+,',
                click: () => {
                  win?.webContents.send('menu:action', 'system.openKeymap')
                },
              },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const },
            ],
          },
        ]
      : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New Manuscript...',
          accelerator: 'CmdOrCtrl+Alt+M',
          click: () => {
            win?.webContents.send('menu:action', 'project.new')
          },
        },
        {
          label: 'Open Manuscript...',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            win?.webContents.send('menu:action', 'project.open')
          },
        },
        { type: 'separator' as const },
        {
          label: 'Save Manuscript',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            win?.webContents.send('menu:action', 'project.save')
          },
        },
        { type: 'separator' as const },
        isMac ? { role: 'close' as const } : { role: 'quit' as const },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' as const },
        { role: 'redo' as const },
        { type: 'separator' as const },
        { role: 'cut' as const },
        { role: 'copy' as const },
        { role: 'paste' as const },
        { role: 'pasteAndMatchStyle' as const },
        { role: 'delete' as const },
        { role: 'selectAll' as const },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Zen Focus Mode',
          accelerator: 'F11',
          click: () => {
            win?.webContents.send('menu:action', 'layout.toggleZen')
          },
        },
        {
          label: 'Toggle Binder Sidebar',
          accelerator: 'CmdOrCtrl+\\',
          click: () => {
            win?.webContents.send('menu:action', 'layout.toggleSidebar')
          },
        },
        {
          label: 'Toggle Scene Inspector',
          accelerator: 'CmdOrCtrl+Alt+I',
          click: () => {
            win?.webContents.send('menu:action', 'layout.toggleInspector')
          },
        },
        { type: 'separator' as const },
        { role: 'reload' as const },
        { role: 'forceReload' as const },
        { role: 'toggleDevTools' as const },
        { type: 'separator' as const },
        { role: 'resetZoom' as const },
        { role: 'zoomIn' as const },
        { role: 'zoomOut' as const },
        { type: 'separator' as const },
        { role: 'togglefullscreen' as const },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' as const },
        { role: 'zoom' as const },
        ...(isMac
          ? [
              { type: 'separator' as const },
              { role: 'front' as const },
              { type: 'separator' as const },
              { role: 'window' as const },
            ]
          : [{ role: 'close' as const }]),
      ],
    },
    {
      role: 'help' as const,
      submenu: [
        {
          label: 'Configure Keyboard Shortcuts...',
          accelerator: 'CmdOrCtrl+Alt+K',
          click: () => {
            win?.webContents.send('menu:action', 'system.openKeymap')
          },
        },
        {
          label: 'Find Action / Commands...',
          accelerator: 'CmdOrCtrl+Shift+A',
          click: () => {
            win?.webContents.send('menu:action', 'system.findAction')
          },
        },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

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

  // Window state notification for renderer custom controls and layout
  win.on('maximize', () => {
    win?.webContents.send('window:maximized-change', true)
  })
  win.on('unmaximize', () => {
    win?.webContents.send('window:maximized-change', false)
  })

  win.on('enter-full-screen', () => {
    win?.webContents.send('window:fullscreen-change', true)
  })
  win.on('leave-full-screen', () => {
    win?.webContents.send('window:fullscreen-change', false)
  })

  win.on('closed', () => {
    win = null
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
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
  setupApplicationMenu()
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

  ipcMain.handle('window:isFullScreen', () => {
    return win?.isFullScreen() ?? false
  })
})
