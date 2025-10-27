const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

let mainWindow;
let windows = [];

function createMainWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width,
    height,
    frame: false,
    transparent: false,
    backgroundColor: '#000000',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, '..', '..', 'public', 'index.html'));

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  if (process.platform === 'linux' && process.arch === 'arm64') {
    mainWindow.setFullScreen(true);
  }
}

function createAppWindow(appData) {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    transparent: false,
    backgroundColor: '#0f0f14',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile(path.join(__dirname, '..', '..', 'public', 'app-window.html'));

  win.webContents.on('did-finish-load', () => {
    win.webContents.send('app-data', appData);
  });

  windows.push(win);

  win.on('closed', () => {
    windows = windows.filter((w) => w !== win);
  });

  return win;
}

ipcMain.on('open-app', (_event, appName) => {
  console.log('Opening app:', appName);
  createAppWindow({ name: appName });
});

ipcMain.on('minimize-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.minimize();
});

ipcMain.on('maximize-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }
});

ipcMain.on('close-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.close();
});

ipcMain.on('system-shutdown', () => {
  app.quit();
});

app.whenReady().then(createMainWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createMainWindow();
  }
});
