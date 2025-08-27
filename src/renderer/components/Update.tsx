import { useState, useEffect } from 'react'
import { Button, message as Message, Modal, Progress, notification } from 'antd';
import { VERSION, npm_env } from '../config/index'
import { teacherClientUpdate } from '../api/index'
import { LStorage, Tool } from '../utils/tools';

export default function Update() {
    const [progress, setProgress] = useState(0); // 下载进度
    const [showProgress, setShowProgress] = useState(false); // 显示下载进度弹窗
    const [showHaveUpdate, setShowHaveUpdate] = useState(false); // 显示有新版本提示
    const [disableBtn, setDisableBtn] = useState(false); // 禁用暂不更新按钮
    const [newVersionData, setNewVersionData] = useState({
        newVersion: '',
        minimumVersion: '',
        updateContent: ''
    });

    // electron检查更新
    function electronCheckUpdate() {
        window.electron.ipcRenderer.sendMessage('checkForUpdate');
    }

    function onUpdateMessage(e: any, result: any) {
        console.log('onUpdateMessage', result);
        let cmd = result.cmd
        switch (cmd) {
            case "error":
                // 升级失败
                Message.error(`更新失败：${result.message.code}`);
                setShowProgress(true)
                break;
            case "checking-for-update":
                // 开始检测更新事件
                break;
            case "update-available":
                // 发现可用更新
                setShowProgress(true)
                break;
            case "update-not-available":
                // 没有可用更新
                Message.warning(`没有可用更新`);
                break;
            case "download-progress":
                // 下载进度
                setProgress(parseInt(result.message.percent))
                break;
            case "update-downloaded":
                // 下载完成
                setProgress(100)
                setShowProgress(false)
                break;
            default:
                break;
        }
    }
    /**
    * 比较两个版本号的大小
    * @param {string} v1
    * @param {string} v2
    * @returns {0|1|-1} 0表示v1 = v2，1表示v1 > v2，-1表示v1 < v2
    *
    * compareVersion('1.1.0', '1.1.0');      // => 0
    * compareVersion('1.20.0', '1.2.20');    // => 1
    * compareVersion('v2.0.30', 'v1.9.10');  // => 1
    * compareVersion('v1.1.40', 'v1.2.0');   // => -1
    */
    function compareVersion(v1: string, v2: string) {
        let cpResult;
        let i = 0;
        const arr1 = v1.replace(/[^0-9.]/, '').split('.');
        const arr2 = v2.replace(/[^0-9.]/, '').split('.');
        while (true) {
            const s1 = arr1[i];
            const s2 = arr2[i++];
            if (s1 === undefined || s2 === undefined) {
                cpResult = arr1.length - arr2.length;
                break;
            }
            if (s1 === s2) continue;
            cpResult = s1 - s2;
            break;
        }
        // eslint-disable-next-line
        return cpResult > 0 ? 1 : cpResult === 0 ? 0 : -1;
    }

    // 接口获取更新信息
    function getUpdate(handle:boolean = false) {
        teacherClientUpdate().then(res => {
            if (res.code == 1) {
                let data: any = {
                    newVersion: res.data.version,
                    minimumVersion: res.data.min_version,
                    updateContent: res.data.explain
                }
                // 当前版本比最低要求版本要小，提示更新，且暂不更新不可点击
                if (compareVersion(data.minimumVersion, VERSION) == 1) {
                    console.log('当前版本比最低要求版本要小，提示更新，且暂不更新不可点击');
                    setNewVersionData(data)
                    setShowHaveUpdate(true)
                    setDisableBtn(true)
                } else {
                    // 当前不是最新
                    if (compareVersion(data.newVersion, VERSION) == 1) {
                        let notUpdateTime = LStorage.getItem("notUpdateTime") || 0
                        console.log('notUpdateTime', notUpdateTime);
                        // 判断，如果是手动检查，要展示更新
                        if (handle) {
                            // 提示更新
                            console.log('提示更新');
                            setNewVersionData(data)
                            setShowHaveUpdate(true)
                        }else {
                            if (Tool.isToday(notUpdateTime)) {
                                // 今日点击过暂不更新，不展示更新提示
                                console.log('今日点击过暂不更新，不展示更新提示');
                            } else {
                                // 提示更新
                                console.log('提示更新');
                                setNewVersionData(data)
                                setShowHaveUpdate(true)
                            }
                        }
                    } else {
                        // 当前是最新,不做处理
                        console.log('当前是最新,不做处理');
                        if (handle) {
                            notification.success({
                                message: '通知',
                                description: '当前已是最新版本'
                            })
                        }
                    }
                }
            }else {
                Message.warning(`${res.code}--${res.msg}`);
            }
        }).catch(err => {
            Message.warning(`检查更新请求失败`);
        })
    }

    useEffect(() => {
        window.electron.ipcRenderer.on('updateMessage', onUpdateMessage)
        setTimeout(() => {
            getUpdate(false)
        }, 500);
        return () => {
            window.electron.ipcRenderer.off('updateMessage', onUpdateMessage)
        }
    }, [])

    return (
        <div>
            <div className="update-box">
                <span className="version" onClick={() => {
                    getUpdate(true)
                }}>版本：{VERSION}{npm_env=='prod'?null:npm_env}</span>
            </div>
            
            <Modal
                title="请更新至最新版本"
                closable={false}
                keyboard={false}
                maskClosable={false}
                open={showHaveUpdate}
                onCancel={() => {
                    setShowHaveUpdate(false)
                }}
                footer={
                    disableBtn ? [
                        <Button key="ok" type="primary" onClick={() => {
                            electronCheckUpdate()
                            setShowHaveUpdate(false)
                        }}>
                            立即更新
                        </Button>
                    ] : [
                        <Button key="cancel" disabled={disableBtn} onClick={() => {
                            setShowHaveUpdate(false)
                            LStorage.setItem('notUpdateTime', new Date().getTime().toString())
                        }}>
                            暂不更新
                        </Button>,
                        <Button key="ok" type="primary" onClick={() => {
                            electronCheckUpdate()
                            setShowHaveUpdate(false)
                        }}>
                            立即更新
                        </Button>
                    ]
                }>
                <p>V{newVersionData.newVersion}版本更新内容：</p>
                <pre>{newVersionData.updateContent}</pre>
            </Modal>

            <Modal
                title="正在下载更新"
                closable={false}
                keyboard={false}
                maskClosable={false}
                open={showProgress}
                onCancel={() => {
                    setShowProgress(false)
                }}
                footer={[]}>
                <div>
                    <Progress percent={progress} />
                </div>
            </Modal>
        </div>
    )
}
