/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import logger from 'electron-log';
import { machineIdSync } from 'node-machine-id';
import { randomUUID } from 'crypto';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import os from 'os';
import { execSync } from 'child_process';

class AppUpdater {
  constructor() {
    logger.transports.file.level = 'info';
    autoUpdater.logger = logger;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('exit', () => {
  app.exit();
});

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

// 获取设备 ID
ipcMain.handle('get-device-id', async () => {
  try {
    return machineIdSync(true);
  } catch (error) {
    // 如果获取机器 ID 失败，则返回 UUID
    return randomUUID();
  }
});

// 处理日志上传
ipcMain.on('uploadLog', (event) => {
  try {
    // 这里实现日志上传逻辑
    // 上传成功后，发送结果到渲染进程
    event.reply('getLogUrl', 'https://example.com/log/123456');
  } catch (error) {
    console.error('上传日志失败:', error);
    event.reply('getLogUrl', null);
  }
});

ipcMain.on('setLogger', (event, arg) => {
  console.log('====setLogger', arg);
  logger.info(JSON.stringify(arg));
});

ipcMain.on('getCPUUsage', (event, arg) => {
  console.log('====getCPUUsage');
  let arr: any = [];
  let timer: any = setInterval(() => {
    //获取当前cpu使用率
    const cpuUsage = getCPUUsage();
    console.log('cpuUsage', cpuUsage);
    arr.push(cpuUsage);
  }, 300);
  setTimeout(() => {
    // 结束计时器，取最大CPU
    clearInterval(timer);
    let maxCPU = Math.max(...arr);
    console.log('maxCPU', maxCPU);
    event.reply('getCPUUsage', maxCPU);
  }, 2000);
});

ipcMain.on('getAssetPath', (event, arg) => {
  console.log('====getAssetPath', arg);
  event.reply('getAssetPath', getAssetPath(arg));
});

ipcMain.on('getOsVersion', (event, arg) => {
  console.log('====getOsVersion');
  let label = {
    name: '',
    version: '',
  };
  let osType = os.type();
  switch (osType) {
    case 'Darwin':
      label = {
        name: 'macOS ',
        version: execSync('sw_vers -productVersion').toString().trim(),
      };
      break;
    case 'Linux':
      label = {
        name: 'linux ',
        version: '',
      };
      break;
    case 'Windows_NT':
      label = {
        name: 'windows ',
        version: getWindowsVersion(),
      };
      break;
    default:
      label = {
        name: '未知',
        version: '',
      };
  }
  event.reply('getOsVersion', label);
});

// 获取 Windows 版本号的函数
const getWindowsVersion = (): string => {
  const release = os.release(); // 格式: '10.0.22621'
  const parts = release.split('.');
  const majorVersion = parseInt(parts[0], 10);
  const minorVersion = parseInt(parts[1], 10);

  // Windows 版本映射
  if (majorVersion === 10) {
    return '10';
  } else if (majorVersion === 6) {
    if (minorVersion === 3) {
      return '8.1';
    } else if (minorVersion === 2) {
      return '8';
    } else if (minorVersion === 1) {
      return '7';
    } else if (minorVersion === 0) {
      return 'Vista';
    }
  } else if (majorVersion === 5) {
    if (minorVersion === 2) {
      return 'Server 2003';
    } else if (minorVersion === 1) {
      return 'XP';
    } else if (minorVersion === 0) {
      return '2000';
    }
  }

  return release; // 如果无法识别，返回完整版本号
};

// 获取 CPU 使用率的简单方法
const getCPUUsage = (): number => {
  try {
    const platform = os.platform();
    console.log('====platform', platform, '111');
    switch (platform) {
      case 'win32':
        return getWindowsCPUUsage();
      case 'darwin':
        return getMacCPUUsage();
      default:
        return 0;
    }
  } catch (error) {
    console.error('获取 CPU 使用率失败:', error);
    return 0;
  }
};

// Windows 平台
const getWindowsCPUUsage = (): number => {
  try {
    // 方法1: 使用 PowerShell 获取 CPU 使用率
    const command = `powershell "Get-Counter '\\Processor(_Total)\\% Processor Time' | Select-Object -ExpandProperty CounterSamples | Select-Object -ExpandProperty CookedValue"`;
    const result = execSync(command, { encoding: 'utf8' });
    const usage = parseFloat(result.trim());
    
    if (!isNaN(usage)) {
      console.log('====getWindowsCPUUsage PowerShell success:', usage);
      return Math.round(usage);
    }
  } catch (error) {
    console.log('====getWindowsCPUUsage PowerShell failed:', error.message);
    return 0;
  }
  return 0;
};

// macOS 平台
const getMacCPUUsage = (): number => {
  try {
    const command = `top -l 1 -n 0 | grep "CPU usage" | awk '{print $3}' | sed 's/%//'`;
    const result = execSync(command, { encoding: 'utf8' });
    return parseFloat(result.trim()) || 0;
  } catch (error) {
    return 0;
  }
};

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug').default();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const RESOURCES_PATH = app.isPackaged
  ? path.join(
      process.resourcesPath || path.dirname(app.getPath('exe')),
      'assets',
    )
  : path.join(__dirname, '../../assets');

const getAssetPath = (...paths: string[]): string => {
  return path.join(RESOURCES_PATH, ...paths);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }
  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      webSecurity: false,
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
      devTools: true,
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
