const { app, BrowserWindow, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('node:path');

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#0f172a',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  return window;
}

function checkForUpdates(window) {
  if (!app.isPackaged) return;

  autoUpdater.on('update-available', async (info) => {
    const result = await dialog.showMessageBox(window, {
      type: 'info',
      title: 'Доступна новая версия GooAI',
      message: `Доступна версия ${info.version}. Скачать обновление сейчас?`,
      buttons: ['Скачать', 'Позже'],
      defaultId: 0,
      cancelId: 1,
    });
    if (result.response === 0) autoUpdater.downloadUpdate();
  });

  autoUpdater.on('update-downloaded', async () => {
    const result = await dialog.showMessageBox(window, {
      type: 'info',
      title: 'Обновление готово',
      message: 'Обновление GooAI скачано. Перезапустить приложение сейчас?',
      buttons: ['Перезапустить', 'Позже'],
      defaultId: 0,
      cancelId: 1,
    });
    if (result.response === 0) autoUpdater.quitAndInstall();
  });

  autoUpdater.on('error', (error) => {
    console.error('GooAI update check failed:', error.message);
  });

  autoUpdater.checkForUpdates().catch((error) => {
    console.error('GooAI update check failed:', error.message);
  });
}

app.whenReady().then(() => {
  const window = createWindow();
  checkForUpdates(window);
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
