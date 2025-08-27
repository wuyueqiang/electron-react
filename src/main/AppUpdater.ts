import { autoUpdater } from 'electron-updater'
import { ipcMain, dialog } from 'electron'
import logger from 'electron-log';


let mainWindow: any = null;
export function updateHandle(window: any, feedUrl: string) {
    mainWindow = window;
    //设置更新包的地址
    autoUpdater.setFeedURL(feedUrl);
    //监听升级失败事件
    autoUpdater.on('error', function (error) {
        sendUpdateMessage({
            cmd: 'error',
            message: error
        })
    });
    //监听开始检测更新事件
    autoUpdater.on('checking-for-update', function (message) {
        sendUpdateMessage({
            cmd: 'checking-for-update',
            message: message
        })
    });
    //监听发现可用更新事件
    autoUpdater.on('update-available', function (message) {
        sendUpdateMessage({
            cmd: 'update-available',
            message: message
        })
    });
    //监听没有可用更新事件
    autoUpdater.on('update-not-available', function (message) {
        console.log('update-not-available', message);
        sendUpdateMessage({
            cmd: 'update-not-available',
            message: message
        })
    });

    // 更新下载进度事件
    autoUpdater.on('download-progress', function (progressObj) {
        sendUpdateMessage({
            cmd: 'download-progress',
            message: progressObj
        })
    });
    //监听下载完成事件
    autoUpdater.on('update-downloaded', function (event, releaseNotes, releaseName, releaseDate, updateUrl) {
        sendUpdateMessage({
            cmd: 'update-downloaded',
            message: {
                releaseNotes,
                releaseName,
                releaseDate,
                updateUrl
            }
        })
        dialog.showMessageBox({
            title: '检测到新版本',
            message: '新版本已下载完成, 请点击立即重启以完成更新',
            buttons: ['立即重启', '取消']
        }).then((res) => {
            // 退出并安装更新包
            if (res.response == 0) {
                autoUpdater.quitAndInstall();
            }
        })

    });

    //接收渲染进程消息，开始检查更新
    ipcMain.on("checkForUpdate", (e, arg) => {
        //执行自动更新检查
        autoUpdater.checkForUpdates();
    })
}
//给渲染进程发送消息
function sendUpdateMessage(text: any) {
    logger.info(JSON.stringify(text))
    mainWindow.webContents.send('updateMessage', text)
}
