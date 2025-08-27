import React, { useState, useRef, useEffect } from 'react'
import { Popover, Button, Slider, notification, Modal } from 'antd';
import SignalProgress from './common/SignalProgress'
import { BugOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { StatisticsWarn, LIVE_ACTIONS, OPERATE_ACTION } from '../vars/room-vars';
import './controlBar.scss'
// import Store from 'electron-store'
// const store: any = new Store();
import { LStorage } from '../utils/tools';
import { setDevice, setValue, setLog, setOperateLog } from '../reducers/roomConfigSlice';
import { updateMixLiveAction } from '../reducers/roomConfigThunks';
import IMGS from '../imgs';
import ImgIcon from './ImgIcon';
import { SendMsg } from '../api';
import { useDispatch, useSelector } from 'react-redux';
import { selectRoomConfig } from '../reducers';

interface ControlBarPropsParam {
    ysLiveClient: any,
    stopLivePush: any,
    exitRoom: any,
    muteLocalVideo: any,
    setShowVideoSetting: any
}
let statTime: number = 0;


export default function ControlBar(props: ControlBarPropsParam) {
    const dispatch = useDispatch();
    const roomConfig = useSelector(selectRoomConfig);
    const { ysLiveClient, stopLivePush, exitRoom, muteLocalVideo, setShowVideoSetting } = props;
    const { cameraList, speakerList, micList, mic, speaker, camera, isStart, isTestLive, isShareScreen, isOpenCamera, testVisibility, answerVisibility, isAnswering, videoCallUserList } = roomConfig;
    const userInfo = LStorage.getItem('USER_INFO')
    const EVENT = ysLiveClient?.EVENT || {};
    const [quality, setQuality] = useState({
        appCpu: 0,
        systemCpu: 0,
        rtt: 0,
        localStatisticsArray: []
    });
    const [networkQuality, setNetworkQuality] = useState(0);
    const networkQualityArr = useRef([]); // 网络质量缓存
    const statisticsArr = useRef([]) // cpu/延迟缓存
    const [showModel, setShowModel] = useState(false); // 显示确认下课弹窗

    useEffect(() => {
        if (ysLiveClient) {
            ysLiveClient.on(EVENT.TRTC_STATISTICS, onStatistics);
            ysLiveClient.on(EVENT.TRTC_NETWORK_QUALITY, onNetworkQuality)
        }

        return () => {
            ysLiveClient && ysLiveClient.off(EVENT.TRTC_STATISTICS, onStatistics);
            ysLiveClient && ysLiveClient.off(EVENT.TRTC_NETWORK_QUALITY, onNetworkQuality)
        }
    })

    // 技术指标统计回调
    function onStatistics(result: {data:{appCpu:number, systemCpu:number, rtt:number, localStatisticsArray:any, downLoss:number, upLoss:number, sentBytes:number, receivedBytes:number}}) {
        setQuality(result.data)
        statTime++
        if (statTime % 30 == 0) {
            // dispatch(setLog(LIVE_ACTIONS.NetworkQuality, {
            //     appCpu: result?.data?.appCpu,
            //     systemCpu: result?.data?.systemCpu,
            //     downLoss: result?.data?.downLoss,
            //     upLoss: result?.data?.upLoss,
            //     rtt: result?.data?.rtt,
            //     sentBytes: result?.data?.sentBytes,
            //     receivedBytes: result?.data?.receivedBytes
            // }))
        }
        // 将回调缓存
        // addStatisticsWatcher(result.data)
    }

    // 网络质量回调
    function onNetworkQuality(result: any) {
        let quality = result?.data?.quality || 0
        // console.log('网络质量回调，每2秒触发一次：', quality, result)
        let qualitys = [0, 5, 4, 3, 2, 1, 0, 0];
        setNetworkQuality(qualitys[quality] || 0);
        // 网络不好时发送消息
        // 将网络回调缓存
        addNetworklQualityWatcher(quality)
    }

    // 缓存多次的设备情况，如连续异常则提示
    function addStatisticsWatcher(data:{systemCpu:any, appCpu:any, rtt:any, upLoss:any}) {
        // 有异常
        if(data.systemCpu >= StatisticsWarn.systemCpu || data.appCpu > StatisticsWarn.appCpu || data.rtt >= StatisticsWarn.rtt || data.upLoss >= StatisticsWarn.upLoss) {
            // cpu异常
            if (data.systemCpu >= StatisticsWarn.systemCpu || data.appCpu > StatisticsWarn.appCpu) {
                if (statisticsArr.current.length < 5) {
                    statisticsArr.current.push(data)
                }else{
                    statisticsArr.current.push(data)
                    statisticsArr.current.shift()
                    const args:any = {
                        message: '提醒',
                        icon: <ExclamationCircleOutlined style={{ color: 'red' }}/>,
                        placement: 'topLeft',
                        description:
                            '当前系统CPU使用率过高，可关闭其他软件，避免直播卡顿',
                        duration: 0,
                        key: 'cpu'
                    };
                    notification.open(args);
                    SendMsg(roomConfig.roomInfo.room_id, userInfo.userId, {
                        type: 'liveSystemNotice',
                        action: 'teacherStatisticsMsg',
                        quote: JSON.stringify({
                            upLoss: data.upLoss,
                            appCpu: data.appCpu,
                            systemCpu: data.systemCpu,
                            rtt: data.rtt
                        })
                    }).then(res => {
                        if (res.status.code != 200) {
                            console.warn(res)
                        }
                    }).catch(error => {
                        console.warn(error)
                    })
                }
            }
            if(data.rtt >= StatisticsWarn.rtt || data.upLoss >= StatisticsWarn.upLoss){
            // 网络异常
                addNetworklQualityWatcher(4)
            }
        }else {
        // 无异常
            statisticsArr.current = []
            notification.destroy('cpu')
        }

        if (data.rtt > 80 || data.upLoss > 15) {
            // dispatch(setLog(LIVE_ACTIONS.NetworkErr,{
            //     rtt: data.rtt,
            //     upLoss: data.upLoss
            // }))
        }
        if (data.systemCpu >= StatisticsWarn.systemCpu || data.appCpu > StatisticsWarn.appCpu) {
            // cpu异常
            // dispatch(setLog(LIVE_ACTIONS.CPUErr,{
            //     appCpu: data.appCpu,
            //     systemCpu: data.systemCpu,
            // }))
        }
    }

    // 缓存多次的网络情况，如连续异常则提示
    function addNetworklQualityWatcher(quality: any) {
        if(quality<4) {
            networkQualityArr.current = []
            notification.destroy('network')
        }else {
            // dispatch(setLog(LIVE_ACTIONS.NetworkErr,{
            //     quality
            // }))
            if (networkQualityArr.current.length < 8) {
                networkQualityArr.current.push(quality)
            }else{
                // 加尾去头
                networkQualityArr.current.push(quality)
                networkQualityArr.current.shift()
                const args:any = {
                    message: '提醒',
                    icon: <ExclamationCircleOutlined style={{ color: 'red' }}/>,
                    placement: 'topLeft',
                    description:
                        '当前网络状况不佳，可关闭其他用网设备或更换网络，避免直播卡顿',
                    duration: 0,
                    key: 'network'
                };
                notification.open(args);
                SendMsg(roomConfig.roomInfo.room_id, userInfo.userId, {
                    type: 'liveSystemNotice',
                    action: 'teacherNetworkQualityMsg',
                    quote: JSON.stringify({
                        quality
                    })
                }).then(res => {
                    if (res.status.code != 200) {
                        console.warn(res)
                    }
                }).catch(error => {
                    console.warn(error)
                })
            }
        }
    }    

    // 设备列表DOM
    function deviceList(list: [], type: string, device: any) {

        return (
            <div className="control-device-list">
                { type == 'camera' ?  <p className='device-list-title'>摄像头</p> : <p className='device-list-title'>麦克风</p> }
                {
                    list && list.map((item: any, index: number) => {
                        // @ts-ignore
                        return (
                            <Button key={index} className={item.deviceId == device.deviceId ? 'active device' : 'device'} size="small" type="text" onClick={() => selectDevice(type, item)}>{item.deviceName}</Button>
                        )
                    })
                }
                { type == 'camera' ? <Button size="small" type="text" onClick={() => openVideoSetting(true)}>更多设置</Button> : null }
            </div>
        )
    }

    function openVideoSetting (val: boolean) {
        setShowVideoSetting(val)
    }

    function selectDevice(type:string, item: {deviceId:any, deviceName:any}) {
        dispatch(setDevice({ name: type, device: { deviceId: item.deviceId } }))  
        let action = {
            camera: LIVE_ACTIONS.selectCamera,
            mic: LIVE_ACTIONS.selectMic
        }
        if (type == "camera" || type == "mic") {
            // dispatch(setLog(action[type], {
            //     deviceId: item.deviceId,
            //     deviceName: item.deviceName,
            // }))
        }             
        
    }

    // 设置音量
    function setVolume(name: string, volume: number) {
        dispatch(setDevice({ name, device: { volume } }))
        if(name === 'mic') {
            // dispatch(setOperateLog(OPERATE_ACTION.microphone_swtich, {
            //     action: volume === 0 ? 0 : 1,
            //     level: volume
            // }))
            // dispatch(setLog(LIVE_ACTIONS.anchorSetMicVolume, {
            //     volume
            // }))
            if (volume == 0) {
                ysLiveClient.closeMicrophone()
                dispatch(setValue({ key: 'isOpenMic', value: false }));
            }else {
                ysLiveClient.openMicrophone()
                dispatch(setValue({ key: 'isOpenMic', value: true }));
            }
        }
    }

    // 设备音量控制DOM
    function volumeSteps(name: string) {
        let volume = roomConfig[name].volume;
        return (
            <div>
                <Slider style={{ height: '50px' }} vertical defaultValue={volume} value={volume} onChange={(v: any) => setVolume(name, v)} />
                {
                    name == 'speaker' ?
                        (speaker.volume == 0 ? <Button type="text" icon={<ImgIcon.SpeakerClose />} onClick={() => setVolume('speaker', 100)}></Button> : <Button type="text" icon={<ImgIcon.Speaker />} onClick={() => setVolume('speaker', 0)}></Button>) :
                        (mic.volume == 0 ? <Button type="text" icon={<ImgIcon.MicClose />} onClick={() => setVolume('mic', 100)}></Button> : <Button type="text" icon={<ImgIcon.Mic />} onClick={() => setVolume('mic', 0)}></Button>)
                }
            </div>
        )
    }

    // 展示设备测试
    function showTest() {
        if (!isStart) {
            dispatch(setValue({ key: 'testVisibility', value: true }))
        } else {
            notification.warning({
                message: '通知',
                description: '直播期间不允许进行设备测试'
            })
        }
    }
    // 展示抽奖活动配置
    function showLotteryActivity() {
        dispatch(setValue({ key: 'lotteryActivityVisibility', value: true }))
    }

    // 展示答题
    function showAnswer() {
        dispatch(setValue({ key: 'answerVisibility', value: true }))
    }

    // 点击下课
    function handleStop() {
        if(isTestLive) {
            // 结束测试
            ysLiveClient.stopScreenCapture()
            ysLiveClient.stopSystemAudioLoopback()
            dispatch(setValue({ key: 'isShareScreen', value: false }))
            let endLive: boolean = false
            stopLivePush(endLive)
        }else {
            setShowModel(true)
        }
    }

    // 获取网络质量监控
    function getNetworkQuality() {

        return (
            <div className="newwork">
                <div className="q-item" style={{ justifyContent: 'center' }}>
                    <BugOutlined onClick={() => {
                        dispatch(setValue({ key: 'debug', value: true }))
                    }} />
                </div>
                {
                    (quality?.localStatisticsArray && quality?.localStatisticsArray.length > 0) && quality.localStatisticsArray.map((item: any, index: number) => {
                        return <div key={index}>
                            <div className="q-item">
                                <label>{item.streamType == 0 ? '摄像头' : '白板'}码率：</label>
                                <p>{item.videoBitrate}kbps</p>
                            </div>
                            <div className="q-item">
                                <label>{item.streamType == 0 ? '摄像头' : '白板'}帧率：</label>
                                <p>{item.frameRate}</p>
                            </div>
                        </div>
                    })
                }
                <div className="q-item">
                    <label>系统CPU：</label>
                    <p>{quality.systemCpu}%</p>
                </div>
                <div className="q-item">
                    <label>应用CPU：</label>
                    <p>{quality.appCpu}%</p>
                </div>
                <div className="q-item">
                    <label>延迟：</label>
                    <p>{quality.rtt}ms</p>
                </div>
            </div>
        )
    }

    return (
        <div className="control-bar-wrap">

            <div className="control-left">
                {/*LOGO*/}
                {/* {
                    userInfo.app == 10110 ?
                        <img src={IMGS.YOUSHILOGO} alt="" className="bar-logo" />
                        : <img src={IMGS.LOGIN_LOGO_2} alt="" className="bar-logo" />
                } */}

                {/*扬声器*/}
                <div>
                    {
                        speaker.volume == 0 ?
                            <ImgIcon.SpeakerClose onClick={() => setVolume('speaker', 100)} /> :
                            <Popover placement="top" content={() => volumeSteps('speaker')} trigger="click">
                                <ImgIcon.Speaker />
                            </Popover>
                    }
                    <Popover placement="top" content={() => deviceList(speakerList, 'speaker', speaker)} trigger="click">
                        <ImgIcon.Sanjiao />
                    </Popover>
                </div>


                <div className="line"></div>

                {/*麦克风*/}
                <div>
                    {
                        mic.volume == 0 ?
                            <ImgIcon.MicClose className="active" onClick={() => setVolume('mic', 100)} /> :
                            <Popover placement="top" content={() => volumeSteps('mic')} trigger="click">
                                <ImgIcon.Mic />
                            </Popover>

                    }
                    <Popover placement="top" content={() => deviceList(micList, 'mic', mic)} trigger="click">
                        <ImgIcon.Sanjiao />
                    </Popover>
                </div>


                <div className="line"></div>

                {/*摄像头*/}
                <div>
                    {isOpenCamera ? <ImgIcon.Camera onClick={muteLocalVideo} /> : <ImgIcon.CameraClose onClick={muteLocalVideo} />}
                    <Popover placement="top" content={() => deviceList(cameraList, 'camera', camera)} trigger="click">
                        <ImgIcon.Sanjiao />
                    </Popover>
                </div>

                <div className="line"></div>

                {/*屏幕分享*/}
                <div>
                    {isShareScreen ?
                        <Button type="text" size="small"  icon={<ImgIcon.ShareScreen />} onClick={() => {
                            ysLiveClient.stopScreenCapture()
                            ysLiveClient.stopSystemAudioLoopback()
                            dispatch(setValue({ key: 'isShareScreen', value: false }))
                            dispatch(updateMixLiveAction() as any)
                            // dispatch(setLog(LIVE_ACTIONS.stopCapturShare))
                        }}>停止屏幕分享</Button> :
                        <Button type="text" size="small" icon={<ImgIcon.ShareScreen />} onClick={() => {
                            if (!isStart) {
                                notification.warning({
                                    message: '通知',
                                    description: '直播开始才可以分享屏幕'
                                })
                                return
                            }
                            if (videoCallUserList.length > 0) {
                                notification.warning({
                                    message: '通知',
                                    description: '连麦中暂不支持分享屏幕'
                                })
                                return
                            }
                            ysLiveClient.teduBoard && ysLiveClient.teduBoard.pauseVideo();
                            dispatch(setValue({ key: 'screenVisibility', value: true }))
                        }}>屏幕分享</Button>
                    }
                </div>

                <div className="line"></div>

                {/*答题*/}
                <div>
                    <Button className={isAnswering?'active-color':''} type="text" size="small" icon={isAnswering ? <ImgIcon.AnswerClick /> : <ImgIcon.Answer />} onClick={showAnswer}>{isAnswering?'答题中':'答题'}</Button>
                </div>

                <div className="line"></div>

                {/*网络设备检测*/}
                <div>
                    <Button type="text" size="small" icon={testVisibility ? <ImgIcon.TestClick /> : <ImgIcon.Test />} onClick={showTest}>检测</Button>
                </div>
                
                <div className="line"></div>

                <div>
                    <Button className='lottery-btn' type="text" size="small" icon={<ImgIcon.Lottery />} onClick={showLotteryActivity}>抽奖</Button>
                </div>

            </div>
            <div className="control-right">
                {/*设备cpu/网络状态*/}
                {isStart ?
                    <Popover placement="top" overlayClassName="network-pop" color="rgba(0,0,0,.5)" content={() => getNetworkQuality()} trigger="click">
                        <div className="system-info">
                            <div className="network-progress" title="点我查看网络状态"><SignalProgress value={networkQuality} step={5}></SignalProgress></div>
                            <p className="network-rtt">延迟: <span className={quality.rtt >= StatisticsWarn.rtt ? 'warning' : ''}>{quality.rtt}ms</span></p>
                            <p className="network-rtt">CPU: <span className={quality.appCpu >= StatisticsWarn.appCpu ? 'warning' : ''}>{quality.appCpu}%</span> | <span className={quality.systemCpu >= StatisticsWarn.systemCpu ? 'warning' : ''}>{quality.systemCpu}%</span></p>
                        </div>
                    </Popover> :
                    null
                }
                {/*下课*/}
                {isStart ? <Button type="text" size="small" className="stopClass" icon={<ImgIcon.Xiake />} onClick={()=>{
                        // ysLiveClient.stopScreenCapture()
                        // ysLiveClient.stopSystemAudioLoopback()
                        // dispatch(setValue('isShareScreen', false))
                        // dispatch(updateMixLiveAction())
                        // stopLivePush()
                        handleStop()
                    }}>
                        {isTestLive?'结束测试':'下课'}
                    </Button> : null
                }
                {/*<Button type="text" icon={<LogoutOutlined />} onClick={startClass}>上课</Button>*/}

                {/*离开房间*/}
                {!isStart ? <Button type="text" size="small" icon={<ImgIcon.Exit />} onClick={exitRoom}>离开房间</Button> : null}
                {/*<div className="line"></div>*/}
                {/*课件*/}
                {/*<Button type="text" size="small" icon={<ImgIcon.Kejian />} onClick={showFileUpload}>课件</Button>*/}
                {/*<div className="line"></div>*/}
                {/*屏幕分享*/}
                {/*{ isMix ? <Button type="text" size="small" onClick={stopMix}>停止混流</Button> : <Button type="text" size="small" onClick={startMix}>开启混流</Button>}*/}
            </div>


            <Modal
                open={showModel}
                title="确认下课"
                onCancel={()=>{
                    setShowModel(false)
                }}
                footer={[
                    <Button key="back" onClick={()=>{
                        setShowModel(false)
                        ysLiveClient.stopScreenCapture()
                        ysLiveClient.stopSystemAudioLoopback()
                        dispatch(setValue({ key: 'isShareScreen', value: false }))
                        let endLive: boolean = false
                        stopLivePush(endLive)
                    }}>
                        暂时离开
                    </Button>,
                    <Button key="end" type="primary" onClick={()=>{
                        setShowModel(false)
                        ysLiveClient.stopScreenCapture()
                        ysLiveClient.stopSystemAudioLoopback()
                        dispatch(setValue({ key: 'isShareScreen', value: false }))
                        let endLive: boolean = true
                        stopLivePush(endLive)
                    }}>
                        结束直播
                    </Button>
                ]}
            >
                <p>确认结束直播，并开始生成回放？</p>
            </Modal>
        </div>
    )
}
