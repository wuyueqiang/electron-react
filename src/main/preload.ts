// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { ipcRenderer, IpcRendererEvent } from 'electron';
// 在window上添加ipcRenderer
// (window as any).electron.ipcRenderer = ipcRenderer

export type Channels = 'ipc-example' | 'get-device-id' | 'uploadLog' | 'getLogUrl' | 'setLogger' | 'enterRoom' | 'app-close' | 'exit' | 'startLivePush' | 'getAssetPath' | 'getOsVersion' | 'getCPUUsage';

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
  // 获取设备 ID
  getDeviceId: () => ipcRenderer.invoke('get-device-id'),
};

(window as any).electron = electronHandler;

export type ElectronHandler = typeof electronHandler;
