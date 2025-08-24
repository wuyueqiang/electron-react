/**
 * 直播平台SDK
 * Author Alizeegod
 * Date 2020-07-02
 */

import TRTCCloud from 'trtc-electron-sdk';
import {
    TRTCParams,
    TRTCAppScene,
    TRTCRoleType,
    TRTCVideoStreamType,
    TRTCVideoResolution,
    TRTCVideoEncParam,
    TRTCNetworkQosParam,
    TRTCBeautyStyle,
    TRTCVideoQosPreference,
    TRTCAudioQuality,
    TRTCVideoMirrorType,
    TRTCVideoRotation,
    TRTCVideoFillMode,
    TRTCSpeedTestParams,
    TRTCRenderParams,
    AudioMusicParam,
    TRTCVideoResolutionMode
    // @ts-ignore
} from 'trtc-electron-sdk/liteav/trtc_define';

import { BoardStreamEncoderParams, AnswerActions, DiggActions, RewardActions, OnlineNumsActions, TeacherEnterActions, ChatActions, AdminChatActions, PendantActions, VideoCallActions, LotteryActions } from '../vars/room-vars';

// @ts-ignore
import TIM from 'tim-js-sdk';
// @ts-ignore
import COS from 'cos-js-sdk-v5';
import errorLog from '../utils/errorLog';
import { Tool } from '../utils/tools';

interface TEduBoardInitParam {
    id: string, // 【必填】白板渲染的 dom 节点 ID，需保证该节点有 position: relative 样式，否则可能引起白板定位异常的问题
    classId?: number, // 【可选】课堂 ID，默认InitConfigParam.roomId
    sdkAppId?: number, // 【可选】腾讯云应用的唯一标识，可登录 实时音视频控制台 查看，默认InitConfigParam.sdkAppId
    userId?: string, // 【可选】用户名，默认InitConfigParam.userId
    userSig?: string, // 【可选】登录鉴权信息，默认InitConfigParam.userSig
    config?:{
        ratio?: string, // 【可选】默认白板宽高比（可传格式如“4:3”、“16:9”的字符串），默认值 "16:9"
        scale?: number, // 【可选】白板默认缩放系数，实际缩放倍数为 scale/100，默认值 100
        toolType?: number, // 【可选】白板工具，默认值 TEDU_BOARD_TOOL_TYPE_PEN
        boardContentFitMode?: number, // 【可选】内容自适应模式，默认值 TEDU_BOARD_CONTENT_FIT_MODE_NONE
        preloadDepth?: number, // 【可选】图片预加载深度，默认值 5，表示预加载当前页前后5页的图片
        progressBarUrl?: string, // 【可选】自定义加载图标，在 progressEnable = true 时生效，支持 jpg、gif、png、svg
    },
    userConfig?:{
        nickname?: string, // 可选】当前白板用户昵称， 默认值 ''
    },
    styleConfig:{
        textStyle?: number, // 【可选】文本样式（0：常规；1：粗体；2：斜体；3：粗斜体），默认值 0
        textSize?: number, // 【可选】文本大小，默认值 320
        textColor?: string, // 【可选】文本颜色，默认值 #000000
        brushColor?: string, // 【可选】画笔颜色，默认值 #ff0000
        brushThin?: number, // 【可选】画笔粗细，默认值 100
        globalBackgroundColor?: string, // 【可选】全局背景色，默认值 #ffffff

    },
    authConfig:{
        drawEnable?: boolean, // 【可选】是否允许涂鸦，默认值 true
        dataSyncEnable?: boolean, // 【可选】是否启用数据同步，禁用后将导致本地白板操作不会被同步给远端，默认值 true
        progressEnable?: boolean, // 【可选】是否启用SDK内置Loading图标，默认值 false

    }
}

interface InitConfigParam {
    sdkAppId: number, // AppId
    roomId: number, // 房间ID
    role: string,   // 角色，讲师teacher、助教、学生
    userId: string, // 用户ID
    userSig: string, // 签名
    isVisibleFake:number, // 老师是否可见伪评论
}

interface BeautyParams {
    beautyStyle: number; //1表示光滑，适用于美女秀场，效果比较明显，2表示自然，磨皮算法更多地保留了面部细节，主观感受上会更加自然
    beauty: number; //美颜级别，取值范围0 - 9，0表示关闭，1 - 9值越大，效果越明显
    white: number; //美白级别，取值范围0 - 9，0表示关闭，1 - 9值越大，效果越明显
    ruddiness: number; //红润级别，取值范围0 - 9，0表示关闭，1 - 9值越大，效果越明显，该参数 windows 平台暂未生效
}

interface MuteParam {
    groupID?: string,
    userID: string,
    muteTime?: number
}

interface MessageParam {
    type: string,
    avatar?: string,
    nick?: string,
    text?: string,
    img?: string,
    action?: string
}

// 视频画面设置
interface VideoEncoderParams {
    videoResolution: number,
    videoFps: number,
    enableAdjustRes: boolean,
    videoBitrate: number,
    minVideoBitrate?: number,
    resMode?: TRTCVideoResolutionMode
}


interface CaptureConfigParam {
    type: number,
    sourceId: string,
    sourceName: string,
    rect: any,
    captureMouse: boolean,
    highlightWindow: boolean,
}

interface StartClassparam extends CaptureConfigParam {
    cameraView: HTMLElement,
    isMix: boolean
}

const EVENT = {
    ERROR: 'ERROR', // 异常
    WARNING: 'WARNING', // 警告
    START_LIVE_PUSH: 'START_LIVE_PUSH',
    TRTC_SPEAKER_VOLUME: 'TRTC_SPEAKER_VOLUME',
    TRTC_MIC_VOLUME: 'TRTC_MIC_VOLUME',
    TRTC_SPEED_TEST_RESULT: 'TRTC_SPEED_TEST_RESULT',
    TRTC_ENTER_ROOM_SUCCESS: 'TRTC_ENTER_ROOM_SUCCESS',
    TRTC_DEVICE_CHANGE: 'TRTC_DEVICE_CHANGE',
    TRTC_NETWORK_QUALITY: 'TRTC_NETWORK_QUALITY',   // 网络质量回调
    TRTC_STATISTICS: 'TRTC_STATISTICS',
    TRTC_SCREEN_CAPTURE_COVERED: 'TRTC_SCREEN_CAPTURE_COVERED', // 窗口分享被遮挡
    TRTC_SCREEN_CAPTURE_STARTED: 'TRTC_SCREEN_CAPTURE_STARTED', // 窗口分享开始
    TRTC_SCREEN_CAPTURE_STOPPED: 'TRTC_SCREEN_CAPTURE_STOPPED', // 窗口分享结束
    TRTC_CONNECTION_LOST: 'TRTC_CONNECTION_LOST', // SDK 跟服务器的连接断开
    TRTC_TRY_TO_RECONNECT: 'TRTC_TRY_TO_RECONNECT', // SDK 尝试重新连接到服务器
    TRTC_CONNECTION_RECOVERY: 'TRTC_CONNECTION_RECOVERY', // SDK 跟服务器的连接恢复
    TIM_MESSAGE_RECEIVED: 'TIM_MESSAGE_RECEIVED', // im
    TIM_ADMIN_MESSAGE_RECEIVED: 'TIM_ADMIN_MESSAGE_RECEIVED', // admin im 助教/讲师群聊im
    TIM_ANSWER_RECEIVED: 'TIM_ANSWER_RECEIVED', // im收到答题相关消息
    TIM_ONLINE_NUMS_RECEIVED: "TIM_ONLINE_NUMS_RECEIVED", // im 收到在线人数变更消息
    TIM_DIGG_RECEIVED: 'TIM_DIGG_RECEIVED', // im收到点赞消息
    TIM_BOARD_RECEIVED: 'TIM_BOARD_RECEIVED', // im收到白板消息
    TIM_TEACHER_ENTER_RECEIVED: 'TIM_TEACHER_ENTER_RECEIVED', // im收到老师进入直播间消息
    TIM_IMAGE_UPLOAD: 'TIM_IMAGE_UPLOAD',
    TIM_JOIN_GROUP: 'TIM_JOIN_GROUP',
    TIM_PENDANT: 'TIM_PENDANT', // im 收到商品挂件消息
    FAKE_MESSAGES_RECEIVED: 'FAKE_MESSAGES_RECEIVED', // 伪评论列表
    TIM_REWARD:'TIM_REWARD', //红包打赏
    TRTC_REMOTE_USER_ENTER_ROOM: 'TRTC_REMOTE_USER_ENTER_ROOM', // 用户进入房间
    TRTC_REMOTE_USER_LEAVE_ROOM: 'TRTC_REMOTE_USER_LEAVE_ROOM', // 用户离开房间
    TRTC_USER_VIDEO_AVAILABLE: 'TRTC_USER_VIDEO_AVAILABLE', // TRTC用户是否开启摄像头视频
    TRTC_USER_AUDIO_AVAILABLE: 'TRTC_USER_AUDIO_AVAILABLE', // TRTC用户是否开启音频
    TIM_CALL_RECEIVED: 'TIM_CALL_RECEIVED', // im收到连麦消息
    LOTTERY_MSG_RECEIVED: 'LOTTERY_MSG_RECEIVED', // im收到抽奖相关消息
    MUSIC_START: 'MUSIC_START',
    MUSIC_PLAY_PROGRESS: 'MUSIC_PLAY_PROGRESS',
    MUSIC_END: 'MUSIC_END',

}

export default class YSElectronLive {
    private readonly sdkAppId: number;

    private readonly roomId: number;
    private readonly role: string;
    private readonly groupId: string;

    private readonly userId: string;
    private readonly userSig: string;
    private readonly isVisibleFake: number;

    private _emitter: Event;

    tim: any;
    EVENT: any;
    rtcCloud: any;
    timEvent: any;
    teduBoard: any;

    constructor(config: InitConfigParam) {
        this.sdkAppId = config.sdkAppId;
        this.roomId = config.roomId;
        this.groupId = config.roomId.toString();
        this.role = config.role;
        this.userId = config.userId;
        this.userSig = config.userSig;
        this.isVisibleFake = config.isVisibleFake
        this.EVENT = EVENT;
        this._emitter = new Event()

        // IM初始化
        this.tim = this._initIm();
        this.tim.registerPlugin({'cos-js-sdk': COS});   // IM注册上传插件

        // 音视频
        // @ts-ignore
        // TRTCCloud.destroyTRTCShareInstance();   // 释放 TRTCCloud 对象并清理资源，确保单例模式
        // @ts-ignore
        this.rtcCloud = TRTCCloud.getTRTCShareInstance(); // 获取TRTCCloud实例

        /**
         * 设置网络流控相关参数
         * 该设置决定了 SDK 在各种网络环境下的调控策略（例如弱网下是“保清晰”还是“保流畅”）
         * https://trtc-1252463788.file.myqcloud.com/electron_sdk/docs/TRTCCloud.html#setNetworkQosParam
         * */
        let netWorkParam  = new TRTCNetworkQosParam();
        // netWorkParam.preference = TRTCVideoQosPreference.TRTCVideoQosPreferenceSmooth
        netWorkParam.preference = TRTCVideoQosPreference.TRTCVideoQosPreferenceClear
        this.rtcCloud.setNetworkQosParam(netWorkParam)

        this._bindEvent()
        this.loginIm();

    }

    /**
     * 直播间事件绑定
     * @private
     */
    _bindEvent() {
        this.rtcCloud.on('onEnterRoom', (result: number) => {
            this._emitter.emit(EVENT.START_LIVE_PUSH, { result: result })
        })
        this.rtcCloud.on('onSendFirstLocalVideoFrame', (result: any) => {
            // console.log(result)
        })
        this.rtcCloud.on('onTestSpeakerVolume', (result: number) => {
            this._emitter.emit(EVENT.TRTC_SPEAKER_VOLUME, { result: result })
        })
        this.rtcCloud.on('onTestMicVolume', (result: number) => {
            this._emitter.emit(EVENT.TRTC_MIC_VOLUME, { result: result })
        })
        this.rtcCloud.on('onSpeedTestResult', (result: any) => {
            this._emitter.emit(EVENT.TRTC_SPEED_TEST_RESULT, result)
        })
        this.rtcCloud.on('onNetworkQuality', (result: any) => {
            this._emitter.emit(EVENT.TRTC_NETWORK_QUALITY, result)
        })
        this.rtcCloud.on('onStatistics', (result: any) => {
            this._emitter.emit(EVENT.TRTC_STATISTICS, result)
        })
        this.rtcCloud.on('onScreenCaptureCovered', (result: any) => {
            this._emitter.emit(EVENT.TRTC_SCREEN_CAPTURE_COVERED, result)
        })
        this.rtcCloud.on('onScreenCaptureStarted', (result: any) => {
            this._emitter.emit(EVENT.TRTC_SCREEN_CAPTURE_STARTED, result)
        })
        this.rtcCloud.on('onScreenCaptureStopped', (result: any) => {
            this._emitter.emit(EVENT.TRTC_SCREEN_CAPTURE_STOPPED, result)
        })
        this.rtcCloud.on('onDeviceChange', (deviceId: string, type: number, state: number) => {
            // 实时监控本地设备的拔插
            console.info('监控本地设备的拔插 deviceId:' + deviceId + '|type:' + type + '|state:' + state);
            let result = { deviceId, type, state};
            this._emitter.emit(EVENT.TRTC_DEVICE_CHANGE, result)
        })
        this.rtcCloud.on('onConnectionLost', (result: any) => {
            this._emitter.emit(EVENT.TRTC_CONNECTION_LOST, result)
        })
        this.rtcCloud.on('onTryToReconnect', (result: any) => {
            this._emitter.emit(EVENT.TRTC_TRY_TO_RECONNECT, result)
        })
        this.rtcCloud.on('onConnectionRecovery', (result: any) => {
            this._emitter.emit(EVENT.TRTC_CONNECTION_RECOVERY, result)
        })
        this.rtcCloud.on('onRemoteUserEnterRoom', (result: any) => {
            // console.log('=====onRemoteUserEnterRoom 进入房间用户', Tool.trtcUidToUid(result));
            let uid = Tool.trtcUidToUid(result)
            if(uid && uid != 'WhiteBoard') {
                this._emitter.emit(EVENT.TRTC_REMOTE_USER_ENTER_ROOM, result)
            }
        })
        this.rtcCloud.on('onRemoteUserLeaveRoom', (result: any) => {
            // console.log('=====onRemoteUserEnterRoom 离开房间用户', result, Tool.trtcUidToUid(result));
            let uid = Tool.trtcUidToUid(result)
            if(uid && uid != 'WhiteBoard') {
                this._emitter.emit(EVENT.TRTC_REMOTE_USER_LEAVE_ROOM, result)
            }
        })
        this.rtcCloud.on('onUserVideoAvailable', (userId: String, available: Number) => {
            // console.log('=====onUserVideoAvailable 用户是否开启摄像头视频', {userId, available});
            let uid = Tool.trtcUidToUid(userId)
            if(uid && uid != 'WhiteBoard') {
                this._emitter.emit(EVENT.TRTC_USER_VIDEO_AVAILABLE, {
                    trtcUid: userId,
                    userId: uid,
                    available
                })
            }
        })
        this.rtcCloud.on('onUserAudioAvailable', (userId: String, available: Number) => {
            // console.log('=====onUserAudioAvailable 用户是否开启音频上行', {userId, available});
            let uid = Tool.trtcUidToUid(userId)
            if(uid && uid != 'WhiteBoard') {
                this._emitter.emit(EVENT.TRTC_USER_AUDIO_AVAILABLE, {
                    trtcUid: userId,
                    userId: uid,
                    available
                })
            }
        })
        this.rtcCloud.on('onError', (result: any) => {
            this._emitter.emit(EVENT.ERROR, result)
        })
        this.tim.on(TIM.EVENT.SDK_READY, () => {
            setTimeout(() => {
                this._joinGroup(this.groupId).then((imResponse: any) => {
                    console.log(`成功加入群组${this.groupId}`, imResponse);
                    this._emitter.emit(EVENT.TIM_JOIN_GROUP, imResponse)
                }).catch((imError: any) => {
                    console.warn(`加入群组${this.groupId}失败：`, imError); // 申请加群失败的相关信息
                    this._emitter.emit(EVENT.TIM_JOIN_GROUP, imError)
                });


                // console.log('groupId-------------------',this.groupId)
                // let promise = this.tim.searchGroupByID(this.groupId);
                // console.log('进入房间，查询群组是否已创建')
                // promise.then((imResponse: any) => {
                //     this._joinGroup(this.groupId);
                //     console.log(`进入房间，群组${this.groupId}已存在：`, imResponse)
                // }).catch((imError: any) => {
                //     this._createGroup(this.groupId); // 测试，正式环境由服务端创建群组
                //     console.log(`进入房间，群组${this.groupId}不存在，马上创建房间：`, imError)
                //     console.warn('searchGroupByID error:', imError); // 搜素群组失败的相关信息
                // });

            }, 1000)
        });

        this.tim.off(TIM.EVENT.ERROR, this._onError);
        this.tim.on(TIM.EVENT.ERROR, this._onError.bind(this));
        this.tim.off(TIM.EVENT.MESSAGE_RECEIVED, this._onIMMessageReceived)
        this.tim.on(TIM.EVENT.MESSAGE_RECEIVED, this._onIMMessageReceived.bind(this))
    }
    _onError(event: { data: { code: any; message: any; }; }) {
        if (event?.data?.code == 2999) {
            this.loginIm()
        }
        this._emitter.emit(EVENT.ERROR, {errcode:event.data.code, errmsg:event.data.message})
    };
    _onIMMessageReceived(event: { data: any; }) {
        // console.log('messageReceived', event)
        const messageData = event?.data
        let nowTime:number = Math.floor(new Date().getTime()/1000)
        let fakeList:any = []
        let discardNum: number = 0
        messageData.forEach((message:any) => {
            let elements = message.getElements()
            // console.log("===== message conversationType", message.conversationType)
            elements.forEach((item: {type: string,content:{data:string,text:string,extension:string}})=> {
                if (message.conversationType == 'C2C') {
                    // console.log('私信 item', item);
                    let msg = JSON.parse(item.content.text)
                    msg.quote = JSON.parse(msg.quote)
                    // console.log('私信 msg', msg);
                    if (VideoCallActions.indexOf(msg.action) > -1) {
                        console.log('收到连麦申请/取消申请 im', msg);
                        this._emitter.emit(EVENT.TIM_CALL_RECEIVED, msg)
                    }
                    
                }else {
                    if (item.type == 'TIMCustomElem') {
                        // 白板消息
                        if (item.content.extension == 'TXWhiteBoardExt') {
                            // console.log('白板消息');
                            // this._emitter.emit(EVENT.TIM_BOARD_RECEIVED, item.content.data)
                        }else {
                            // 正常消息
                            let msg = JSON.parse(item.content.data)
                            if (AnswerActions.indexOf(msg.action) > -1) {
                                // 答题消息
                                // console.log('答题消息', msg);
                                this._emitter.emit(EVENT.TIM_ANSWER_RECEIVED, msg)
                            }else if (DiggActions.indexOf(msg.action) > -1) {
                                // 点赞消息
                                // console.log('点赞消息', msg);
                                this._emitter.emit(EVENT.TIM_DIGG_RECEIVED, msg)
                            }else if (OnlineNumsActions.indexOf(msg.action) > -1) {
                                // 现在人数更新消息
                                // console.log('现在人数更新消息', msg);
                                this._emitter.emit(EVENT.TIM_ONLINE_NUMS_RECEIVED, msg)
                            }else if (TeacherEnterActions.indexOf(msg.action) > -1) {
                                // 老师进入直播间消息
                                // console.log('老师进入直播间消息', msg);
                                this._emitter.emit(EVENT.TIM_TEACHER_ENTER_RECEIVED, msg)
                            }else if (ChatActions.indexOf(msg.action) > -1) {
                                // 直播消息(文本/图片/通知/业务消息)
                                // console.log('直播消息', msg);
                                if (this.isVisibleFake == 1 && (msg.type == 'text' || msg.type == 'image' || msg.type == 'imageText') && msg.isVirtual) return;
                                this._emitter.emit(EVENT.TIM_MESSAGE_RECEIVED, msg)
                            }else if (AdminChatActions.indexOf(msg.action) > -1) {
                                // admin消息(文本/图片)
                                // console.log('admin消息', msg);
                                this._emitter.emit(EVENT.TIM_ADMIN_MESSAGE_RECEIVED, msg)
                            } else if (PendantActions.indexOf(msg.action) > -1){
                                // 商品挂件im
                                // console.log('商品挂件', msg);
                                this._emitter.emit(EVENT.TIM_PENDANT, msg)
                            } else if (RewardActions.indexOf(msg.action) > -1){
                                // 红包打赏
                                this._emitter.emit(EVENT.TIM_REWARD, msg)
                            } else if (LotteryActions.indexOf(msg.action) > -1) {
                                // 抽奖
                                this._emitter.emit(EVENT.LOTTERY_MSG_RECEIVED, msg)
                            }
                            
                        }
                        
                    }else if (item.type == 'TIMTextElem') {
                        // 老师伪评论 不可见
                        if (this.isVisibleFake == 1) return;
                        // 伪评论消息
                        let msg = JSON.parse(item.content.text)
                        msg.quote = JSON.parse(msg.quote)
                        if (msg.send_time && msg.send_time >= nowTime - 5) {
                            // 没失效
                            fakeList.push(msg)
                        }else {
                            // 时间小于当前5s的消息，认为失效不处理,并打log
                            discardNum++
                        }
                    }
                }
            });
            
        });

        if (fakeList.length > 0) {
            this._emitter.emit(EVENT.FAKE_MESSAGES_RECEIVED, fakeList)
        }
        if (discardNum > 0) {
            // 打抛弃日志
            errorLog({
                code: "discardMsg",
                log_type: "MESSAGE_LOG",
                request_data: {
                    room_id: this.roomId,
                },
                response_data: {
                    code: '',
                    msg: JSON.stringify({
                        type: "expired",
                        text: "消息过期",
                        num: discardNum
                    })
                },
                message: '抛弃消息'
            }, "INFO")
        }
    }

    /**
     * 订阅回调
     * @param eventCode
     * @param handler
     * @param context
     */
    on(eventCode: any, handler: any, context: any) {
        this._emitter.on(eventCode, handler, context)
    }

    /**
     * 取消订阅
     * @param eventCode
     * @param handler
     */
    off(eventCode: any, handler: any) {
        this._emitter.off(eventCode, handler)
    }

    /**
     * 白板初始化
     * @param TEduBoardInitParam
     */
    initBoard(boardParam: TEduBoardInitParam) {
        // @ts-ignore
        if (TEduBoard === 'undefined') {
            console.warn('白板初始化失败-SDK不存在')
            return
        }

        let commonParam: object = {
            sdkAppId: this.sdkAppId,
            userId: this.userId,
            userSig: this.userSig,
            classId: this.roomId,
        }

        let params: object = Object.assign(commonParam, boardParam)
        // console.log('params', params)
        // @ts-ignore
        this.teduBoard = new TEduBoard(params);
    }

    /**
     * 进入音视频房间
     * @private
     */
    _enterTrtcRoom() {
        const param = new TRTCParams();
        param.sdkAppId = this.sdkAppId;
        param.roomId = this.roomId;
        param.userId = this.userId;
        param.userSig = this.userSig;
        param.privateMapKey = '';
        param.businessInfo = '';
        param.role = this.role == 'ANCHOR' ? TRTCRoleType.TRTCRoleAnchor : TRTCRoleType.TRTCRoleAudience; // 主播，可以上行视频和音频
        this.rtcCloud.enterRoom(param, TRTCAppScene.TRTCAppSceneVideoCall); // 视频通话场景，支持720P、1080P高清画质
    }

    /**
     * 开始直播推流
     * @param config
     */
    startLivePush(config: StartClassparam) {
        const { cameraView } = config;
        if (this.role == 'ANCHOR') {
            this._enterTrtcRoom();
            // this.sendMSG({
            //     type: 'liveSystemNotice',
            //     action: 'anchorStartPush',
            // })
        }

        this.openMicrophone() // 开启本地音频的采集和上行
        // isMix && setTimeout(() => {
        //     this.startCapturShare({type, sourceId, sourceName, rect, captureMouse, highlightWindow}) // 开启屏幕分享
        // }, 500)
        this.openCamera(cameraView) // 开启视频采集

    }

    /**
     * 停止直播推流
     */
    stopLivePush() {
        // 下课时暂停白板视频播放
        this.teduBoard && this.teduBoard.pauseVideo();
        this.rtcCloud.exitRoom();
        this._clearData();
        if (this.role == 'ANCHOR') {
            // this.sendMSG({
            //     type: 'liveSystemNotice',
            //     action: 'anchorStopPush',
            // })
        }
    }

    /**
     * 清除音视频
     * @private
     */
    _clearData() {
        // 关闭采集音视频
        this.rtcCloud.stopLocalPreview();
        this.rtcCloud.stopLocalAudio();
        this.rtcCloud.stopScreenCapture();
        this.rtcCloud.stopAllAudioEffects();
        this.rtcCloud.stopBGM();
    }

    /**
     * 离开直播间
     */
    async exitRoom() {
        // await this.sendMSG({
        //     type: 'liveSystemNotice',
        //     action: this.role == 'ANCHOR' ? 'anchorExitRoom' : 'exitRoom',
        // })

        // let profile = await this.getGroupProfile(this.groupId, ['ownerID'])
        // let ownerID = profile?.data?.group?.ownerID;
        // console.log('离开房间：', profile, this.userId)
        // if (ownerID == this.userId) {
        //     this.rtcCloud.exitRoom();
        //     this.logoutIm();
        //     return profile;
        // } else {
        //     return this._quitGroup(this.groupId).finally(() => {
        //         this.logoutIm();
        //         this.rtcCloud.exitRoom();
        //     })
        // }
        this.teduBoard && this.teduBoard.destroy()
        this.tim && this.logoutIm();
        this.rtcCloud.exitRoom();
    }

    /**
     * 调用实验性 API 接口
     * */

    callExperimentalAPI(jsonStr: string) {
        this.rtcCloud.callExperimentalAPI(jsonStr);
    }

    /**
     * 获取摄像头列表
     */
    getCameraList() {
        return this.rtcCloud.getCameraDevicesList();
    }

    /*
    * 设置摄像头
    * @params deviceId:string 从 getCameraDevicesList 中得到的设备 ID
    */
    setCurrentCamera(deviceId:string) {
        this.rtcCloud.setCurrentCameraDevice(deviceId)
    }

    /*
    * 获取摄像头
    */
    getCurrentCamera() {
        return this.rtcCloud.getCurrentCameraDevice()
    }

    /**
     * 开始摄像头测试
     * @param elementId 测试摄像头DOM节点ID
     */
    startCameraTest(elementId: string) {
        let cameraTestVideoEl = document.getElementById(elementId);
        this.rtcCloud.startCameraDeviceTest(cameraTestVideoEl);
    }

    /**
     * 停止摄像头测试
     * 暂时不需要主动调用 stopCameraDeviceTest 这样会导致 Renderer 失效
     */
    stopCameraTest() {
        this.rtcCloud.stopCameraDeviceTest();
    }

    /**
     * 获取扬声器列表
     */
    getSpeakerList() {
        return this.rtcCloud.getSpeakerDevicesList();
    }

    /**
     * 获取当前扬声器设备
     */
    getCurrentSpeaker() {
        return this.rtcCloud.getCurrentSpeakerDevice();
    }

    /**
     * 设置要使用的扬声器
     * @param speakerId 设备ID
     */
    setCurrentSpeaker(speakerId: string) {
        this.rtcCloud.setCurrentSpeakerDevice(speakerId);
    }

    /**
     * 获取系统当前扬声器设备音量
     */
    getCurrentSpeakerVolume() {
        return this.rtcCloud.getCurrentSpeakerVolume();
    }

    /**
     * 设置系统当前扬声器设备音量
     * @param volume 音量
     */
    setCurrentSpeakerVolume(volume: number) {
        this.rtcCloud.setCurrentSpeakerVolume(volume);
    }

    /**
     * 开始进行扬声器测试
     * @param filePath 文件路径
     */
    startSpeakerTest(filePath: string) {
        this.rtcCloud.startSpeakerDeviceTest(filePath)
    }

    /**
     * 停止扬声器测试
     */
    stopSpeakerTest() {
        this.rtcCloud.stopSpeakerDeviceTest()
    }

    /**
     * 获取麦克风设备列表
     */
    getMicList() {
        let allMicList: any = this.rtcCloud.getMicDevicesList()
        let micList: any = []
        allMicList.forEach((item:{deviceName: String}) => {
            if (item.deviceName.indexOf('TRTC') == -1) {
                micList.push(item)
            }
        });
        // console.log('getMicList', micList);
        
        return micList
    }

    /**
     * 获取当前选择的麦克风
     */
    getCurrentMic() {
        return this.rtcCloud.getCurrentMicDevice()
    }

    /**
     * 设置要使用的麦克风
     * @param micId 设备ID
     */
    setCurrentMic(micId: string) {
        this.rtcCloud.setCurrentMicDevice(micId)
    }

    /**
     * 获取系统当前麦克风设备音量
     */
    getCurrentMicVolume() {
        return this.rtcCloud.getCurrentMicDeviceVolume()
    }

    /**
     * 设置系统当前麦克风设备音量
     * @param volume 音量
     */
    setCurrentMicVolume(volume: number) {
        this.rtcCloud.setCurrentMicDeviceVolume(volume)
    }

    startLocalAudio (quality: TRTCAudioQuality) {
        // this.rtcCloud.setAudioQuality(quality)
        this.rtcCloud.startLocalAudio(quality)
    }

    /**
     * 开始进行麦克风测试
     * @param interval 反馈音量提示的时间间隔（ms），建议设置到大于 200 毫秒
     */
    startMicTest(interval: number) {
        this.rtcCloud.startMicDeviceTest(interval)
        this.setAudioCaptureVolume(100);
    }

    /**
     * 停止麦克风测试
     */
    stopMicTest() {
        this.rtcCloud.stopMicDeviceTest()
        this.setAudioCaptureVolume(0);
    }

    /**
     * 设置SDK采集音量
     * @param volume 音量
     */
    setAudioCaptureVolume(volume: number) {
        this.rtcCloud.setAudioCaptureVolume(volume)
    }

    /**
     * 获取SDK采集音量
     */
    getAudioCaptureVolume() {
        return this.rtcCloud.getAudioCaptureVolume()
    }

    /**
     * 设置SDK播放音量
     * @param volume 音量
     */
    setAudioPlayoutVolume(volume: number) {
        this.rtcCloud.setAudioPlayoutVolume(volume)
    }

    /**
     * 获取SDK播放音量
     */
    getAudioPlayoutVolume() {
        return this.rtcCloud.getAudioPlayoutVolume()
    }

    /**
     * 开始进行网络测速
     * @param config
     */
    startSpeedTest() {
        let con = new TRTCSpeedTestParams(this.sdkAppId, this.userId, this.userSig, 2500, 2500)
        // @ts-ignore
        this.rtcCloud.startSpeedTest(con)
    }

    /**
     * 停止网络测试
     */
    stopSpeedTest() {
        this.rtcCloud.stopSpeedTest()
    }

    /**
     * 选择分享的屏幕/应用
     * @param param
     */
    selectScreenShare(param: any) {
        const { source, captureRect, property } = param
        this.rtcCloud.selectScreenCaptureTarget(source, captureRect, property)
    }

    /**
     * 开始屏幕分享
     */
    startCapturShare() {
        const preview =  document.getElementById('shareScreen-view');
        let encParam = this._getEncoderParam(BoardStreamEncoderParams[0])
        this.rtcCloud.startScreenCapture(preview, TRTCVideoStreamType.TRTCVideoStreamTypeSub, encParam)
    }

    /**
     * 暂停屏幕分享
     */
    pauseScreenCapture () {
        this.rtcCloud.pauseScreenCapture();
    }

    /**
     * 恢复屏幕分享
     */
    resumeScreenCapture () {
        this.rtcCloud.resumeScreenCapture();
    }

    /**
     * 停止屏幕分享
     */
    stopScreenCapture () {
        this.rtcCloud.stopScreenCapture();
    }

    /**
     * 获取屏幕分享列表
     */
    getScreenShareList() {
        return this.rtcCloud.getScreenCaptureSources(144, 84, 20, 20)
    }

    /**
     * 设置视频编码器相关参数
     * @param params VideoEncoderParams
     */
    setVideoEncoderParam(params: VideoEncoderParams) {
        let encParam = this._getEncoderParam(params);
        this.rtcCloud.setVideoEncoderParam(encParam);
    }

    /**
     * 设置辅流（屏幕分享）的编码器参数
     * @param params VideoEncoderParams
     */
    setSubStreamEncoderParam(params: VideoEncoderParams) {
        let encParam = this._getEncoderParam(params);
        // console.log('setSubStreamEncoderParam----', encParam)
        this.rtcCloud.setSubStreamEncoderParam(encParam);
    }

    _getEncoderParam(params: VideoEncoderParams) {
        const { videoResolution, videoFps, videoBitrate, minVideoBitrate, enableAdjustRes, resMode } = params;
        let encParam = new TRTCVideoEncParam();
        encParam.videoResolution = videoResolution || TRTCVideoResolution.TRTCVideoResolution_1280_720;
        encParam.videoFps = videoFps || 15;
        encParam.videoBitrate = videoBitrate || 1000;
        encParam.minVideoBitrate = minVideoBitrate || 1000;
        encParam.enableAdjustRes = enableAdjustRes || false
        encParam.resMode = resMode || TRTCVideoResolutionMode.TRTCVideoResolutionModeLandscape
        return encParam;
    }

    sendSEIMsg(msg: string, repeatCount: number) {
        // console.log('SEI---',msg)
        return this.rtcCloud.sendSEIMsg(msg, repeatCount)
    }

    /*
     * 打开摄像头
     */
    openCamera(cameraView: HTMLElement) {
        this.rtcCloud.startLocalPreview(cameraView);
    }

    /*
     * 关闭摄像头
     */
    closeCamera() {
        this.rtcCloud.stopLocalPreview();
        // this.rtcCloud.muteLocalVideo(true, TRTCVideoStreamType.TRTCVideoStreamTypeBig);
        // this.sendMSG({
        //     type: 'liveSystemNotice',
        //     action: 'anchorCloseCamera',
        // })
    }
    // 暂停/恢复发布本地的视频流
    muteLocalVideo(mute: Boolean) {
        console.log("======muteLocalVideo", mute);
        this.rtcCloud.muteLocalVideo(mute);
    }

    // 修改本地摄像头预览的 HTML 元素
    updateLocalView(cameraView: HTMLElement) {
        // this.rtcCloud.updateLocalView(cameraView);
        this.rtcCloud.startLocalPreview(cameraView);
    }
    /**
     * 设置本地摄像头预览画面的镜像模式
     * @param mirror 镜像模式, windows 默认值: false(非镜像模式), mac 默认值: true(镜像模式)
     */
    setLocalViewMirror(mirror: boolean) {
        // this.rtcCloud.setLocalViewMirror(mirror)
        this.rtcCloud.setLocalRenderParams({
            rotation: TRTCVideoRotation.TRTCVideoRotation0,
            fillMode: TRTCVideoFillMode.TRTCVideoFillMode_Fill,
            mirrorType: mirror?TRTCVideoMirrorType.TRTCVideoMirrorType_Enable : TRTCVideoMirrorType.TRTCVideoMirrorType_Disable
        })
    }

    /**
     * 设置编码器输出的画面镜像模式
     * @param mirror 是否开启远端镜像, true：远端画面镜像；false：远端画面非镜像。默认值：false
     */
    setVideoEncoderMirror(mirror: boolean) {
        this.rtcCloud.setVideoEncoderMirror(mirror)
    }

    /**
     * 开启本地音频的采集和上行
     */
    openMicrophone() {
        // 设置音频质量
        this.startLocalAudio(TRTCAudioQuality.TRTCAudioQualityDefault)
        // this.muteLocalAudio(false);
    }

    /**
     * 关闭本地音频的采集和上行
     */
    closeMicrophone() {
        this.rtcCloud.stopLocalAudio();
        // this.muteLocalAudio(true);
    }

    /**
     * 静音本地的音频
     * @param mute
     */
    muteLocalAudio(mute: boolean) {
        this.rtcCloud.muteLocalAudio(mute);
    }

    /*
     * 设置美颜、美白、红润效果级别
     * @params params BeautyParams
     */
    setBeautyStyle(params: BeautyParams) {
        this.rtcCloud.setBeautyStyle(params.beautyStyle, params.beauty, params.white, params.ruddiness);
    }

    /*
     * 打开系统声音采集
     * @params path 不传 path 或为 null，代表采集整个操作系统的声音；path 填写 exe 程序（如 QQ音乐）所在的路径，将会启动此程序并只采集此程序的声音。
     */
    startSystemAudioLoopback(path: string | null | undefined = null) {
        this.rtcCloud.startSystemAudioLoopback(path);
    }

    /**
     * 关闭系统声音采集
     */
    stopSystemAudioLoopback() {
        this.rtcCloud.stopSystemAudioLoopback()
    }

    /*
     * 设置系统当前扬声器设备的静音状态
     * @params mute
     */
    // setCurrentSpeakerDeviceMute(mute: boolean) {
    //     this.rtcCloud.setCurrentSpeakerDeviceMute(mute)
    // }

    /*
     * 设置系统声音采集的音量
     * @params volume 音量
     */
    setSystemAudioLoopbackVolume(volume: number) {
        this.rtcCloud.setSystemAudioLoopbackVolume(volume)
    }

    // 开始显示远端视频画面
    startRemoteView(userId: string, views: HTMLElement, streamType: TRTCVideoStreamType) {
        this.rtcCloud.startRemoteView(userId, views, streamType)
        this.setRemoteRenderParams(userId, TRTCVideoStreamType.TRTCVideoStreamTypeBig, {
            rotation: TRTCVideoRotation.TRTCVideoRotation0,
            fillMode: TRTCVideoFillMode.TRTCVideoFillMode_Fill,
            mirrorType: TRTCVideoMirrorType.TRTCVideoMirrorType_Disable
        })
    }

    // 停止显示远端视频画面
    stopRemoteView(userId: string) {
        this.rtcCloud.stopRemoteView(userId)
    }

    // 更新远端视频渲染
    updateRemoteView(userId: string, views: HTMLElement | null, streamType: TRTCVideoStreamType) {
        this.rtcCloud.updateRemoteView(userId, views, streamType)
        // this.rtcCloud.startRemoteView(userId, views, streamType)
    }

    // 设置远端图像的渲染参数。
    setRemoteRenderParams(userId: string, streamType: TRTCVideoStreamType, params: TRTCRenderParams) {
        this.rtcCloud.setRemoteRenderParams(userId, streamType, params)
    }

    // 播放背景音乐
    startPlayMusic(params: AudioMusicParam) {
        this.rtcCloud.startPlayMusic(params, {
            onStart: (id: number, errCode: number) => {
                // console.log(`onStart, id: ${id}, errorCode: ${errCode}`);
                this._emitter.emit(EVENT.MUSIC_START, {id, errCode})
            },
            onPlayProgress: (id: number, curPtsMS: number, durationMS: number) => {
                // console.log(`onPlayProgress, id: ${id}, curPtsMS: ${curPtsMS}, durationMS: ${durationMS}`);
                this._emitter.emit(EVENT.MUSIC_PLAY_PROGRESS, {id, curPtsMS, durationMS})
            },
            onComplete: (id: number, errCode: number) => {
                console.log(`onComplete, id: ${id}, errCode: ${errCode}`);
                this._emitter.emit(EVENT.MUSIC_END, {id, errCode})
            }
        })
    }

    // 停止背景音乐
    stopPlayMusic(id: number) {
        this.rtcCloud.stopPlayMusic(id)
    }

    // 暂停背景音乐
    pausePlayMusic(id: number) {
        this.rtcCloud.pausePlayMusic(id)
    }

    // 恢复背景音乐
    resumePlayMusic(id: number) {
        this.rtcCloud.resumePlayMusic(id)
    }

    // 获取背景音乐文件总时长，单位毫秒
    getMusicDurationInMS(path: string) {
        return this.rtcCloud.getMusicDurationInMS(path)
    }

    // 设置背景音乐播放进度
    seekMusicToPosInTime(id: number, pts: number){
        this.rtcCloud.seekMusicToPosInTime(id, pts)
    }

    // 设置所有背景音乐的本地音量和远端音量的大小
    setAllMusicVolume(volume: number) {
        this.rtcCloud.setAllMusicVolume(volume)
    }

    /**
     * IM初始化
     * @private
     */
    _initIm() {
        const tim = TIM.create({
            SDKAppID: this.sdkAppId
        });
        tim.setLogLevel(2); // 告警级别，SDK 只输出告警和错误级别的日志
        return tim;
    }

    /**
     * 登录IM
     * @param {*} params
     * userID: string; // 用户 ID
     * userSig: string; // 签名
     */
    loginIm() {
        if (!this.tim) {
            return;
        }
        // console.log('IM-----------------------------------------------', this.userId, this.userSig)
        const promise = this.tim.login({
            userID: this.userId,
            userSig: this.userSig
        });
        // console.log('IM-----------------------------------------------', promise)
        promise.then(function(imResponse: { data: { repeatLogin: boolean; errorInfo: any; }; }) {
            // console.log('loginIm', imResponse); // 登录成功
        }).catch(function(imError: any) {
            console.warn('login error:', imError); // 登录失败的相关信息

        });
        return promise;
    }

    /**
     * 登出IM
     */
    logoutIm() {
        let that= this
        let promise = this.tim.logout();
        promise.then(function() {
            // console.log('logout success'); // 登出成功
            that.tim.destroy()
            that.tim = null
        }).catch(function(imError: any) {
            console.warn('logout error:', imError);
            that.tim.destroy()
            that.tim = null
        });
    }
    /**
     * 停止白板推流
     */
    

    /**
     * 创建群组
     * @param groupID string; // 教室id
     * @private
     */
    _createGroup(groupID: string) {
        // 创建私有群
        const promise = this.tim.createGroup({
            type: TIM.TYPES.GRP_AVCHATROOM, // 聊天室
            groupID: groupID,
            name: groupID,
        });
        // console.log(promise)
        promise.then((imResponse: { data: { group: any; }; }) => { // 创建成功
            this._joinGroup(groupID);
            // console.log(`成功创建群组${groupID}`, imResponse); // 创建的群的资料
        }).catch((imError: any) => {
            // console.log(`创建群组失败${groupID}`, imError); // 创建群组失败的相关信息
        });
        // return promise
    }

    /**
     * 获取群组信息
     * @param groupId
     * @param groupCustomFieldFilter
     */
    getGroupProfile(groupId: string, groupCustomFieldFilter: any = []) {
        return  this.tim.getGroupProfile({ groupID: groupId, groupCustomFieldFilter });
    }

    /**
     * 退出群组
     * @param groupID
     * @private
     */
    _quitGroup(groupID: string) {
        let promise = this.tim.quitGroup(groupID);
        promise.then(function(imResponse: { data: { groupID: any; }; }) {
            // console.log(`成功退出群组${groupID}`, imResponse); // 退出成功的群 ID
        }).catch(function(imError:any){
            // console.warn(`退出群组${groupID}失败`, imError); // 退出群组失败的相关信息
        });
        return promise
    }

    /**
     * 加入群组
     * @param groupID 群组id
     * @private
     */
    _joinGroup(groupID: string) {
        const promise = this.tim.joinGroup({
            groupID,
            type: TIM.TYPES.GRP_AVCHATROOM
        });
        promise.then((imResponse: any) => {
            // console.log(`成功加入群组${groupID}`, imResponse);
            // this.sendMSG({
            //     type: 'liveSystemNotice',
            //     action: 'anchorEnterRoom'
            // })
            // this.tim.updateMyProfile({
            //     nick: '我是老师',  // 昵称
            //     avatar: 'http://feed.youshu.cc/readwith/media/picture/5eea0d883a6c8.png', // 头像
            // });
        }).catch((imError: any) => {
            console.warn(`加入群组${groupID}失败：`, imError); // 申请加群失败的相关信息
        });
        return promise;
    }


    /**
     * 发送文字消息
     * @params message:string; 消息
     */
    sendTextMessage(message: string) {
        if (!this.tim) {
            console.warn('未开启IM功能，该方法无法使用', message);
            return;
        }
        // console.log('sendGroupTextMessage', message);
        const _message = this.tim.createTextMessage({
            to: this.groupId,
            conversationType: TIM.TYPES.CONV_GROUP, // 群组会话
            payload: {
                text: message
            }
        });
        const promise = this.tim.sendMessage(_message);
        promise.then((imResponse: any) => {
            // 发送成功
            // console.log('sendGroupTextMessage success', imResponse);
        }).catch((imError: string) => {
            // 发送失败
            console.warn('sendGroupTextMessage error:', imError);
        });
        return promise;
    }

    /**
     * 发送图片消息
     * @params message:string; 消息
     */
    sendImageMessage(file: any) {
        if (!this.tim) {
            console.warn('未开启IM功能，该方法无法使用', file);
            return;
        }
        // console.log('sendImageMessage', file);
        const _message = this.tim.createImageMessage({
            to: this.groupId,
            conversationType: TIM.TYPES.CONV_GROUP, // 群组会话
            payload: {
                file: file
            },
            onProgress: (event: any) => {
                this._emitter.emit(EVENT.TIM_IMAGE_UPLOAD, event)
            }
        });
        const promise = this.tim.sendMessage(_message);
        promise.then((imResponse: any) => {
            // 发送成功
            // console.log('sendImageMessage success', imResponse);
        }).catch((imError: string) => {
            // 发送失败
            console.warn('sendImageMessage error:', imError);
        });
        return promise;
    }

    /*
     * 发送自定义消息
     * @params
     * data:string; // 自定义消息的数据字段
     * description:string; // 自定义消息的说明字段
     * extension:string; // 自定义消息的扩展字段
     */
    sendCustomMessage(data:string, description:string, extension:string) {
        // 创建自定义消息实例
        let _message = this.tim.createCustomMessage({
            to: this.groupId,
            conversationType: TIM.TYPES.CONV_GROUP,
            payload: {
                data,
                description,
                extension
            }
        });
        // 发送消息
        const promise = this.tim.sendMessage(_message);
        promise.then((imResponse: any) => {
            console.info('自定义消息发送成功', imResponse);
        }).catch((imError: string) => {
            console.warn('自定义消息发送失败', imError);
        });
        return promise;
    }

    /**
     * 发送消息
     * @param message
     */
    sendMSG(message: MessageParam) {
        const { type } = message
        let data = {
            userID: this.userId,
            ...message
        };
        let description = '';
        if (type == 'text') {
            description = '文本消息';
        } else if (type == 'image') {
            description = '图片消息';
        } else if (type == 'liveSystemNotice') {
            description = '直播平台系统消息';
        }
        return this.sendCustomMessage(JSON.stringify(data), description, '')
    }

    /**
     * 群组内禁言
     * @param param
     */
    setMuteTime(param: MuteParam) {
        const { groupID = this.groupId, userID, muteTime = 7200} = param
        let promise = this.tim.setGroupMemberMuteTime({
            groupID: groupID,
            userID: userID,
            muteTime: muteTime // 禁言10分钟；设为0，则表示取消禁言
        });
        promise.then(function(imResponse: any) {
            // console.log(`禁言${userID}成功`, imResponse);
        }).catch(function(imError: any) {
            // console.warn(`禁言${userID}失败`, imError);
        });
        return promise;
    }

}


/**
 * 事件发布订阅，收归trtc、im的事件
 */
class Event {
    _stores: any;
    on(event: string | number, fn: any, ctx: any) {
        if (typeof fn !== 'function') {
            console.error('listener must be a function')
            return
        }

        this._stores = this._stores || {};
        (this._stores[event] = this._stores[event] || []).push({ cb: fn, ctx: ctx })
    }

    emit(event: string | number, data:any) {
        this._stores = this._stores || {}
        let store = this._stores[event]
        let args:any[] = []

        if (store) {
            store = store.slice(0)
            // args = [].slice.call(arguments, 1),
            args[0] = {
                eventCode: event,
                data: data,
            }
            for (let i = 0, len = store.length; i < len; i++) {
                store[i].cb.apply(store[i].ctx, args)
            }
        }
    }

    off(event: string | number, fn: any) {
        this._stores = this._stores || {}

        // all
        if (!event) {
            this._stores = {}
            return
        }

        // specific event
        const store = this._stores[event]
        if (!store) return

        // remove all handlers
        if (!fn) {
            delete this._stores[event]
            return
        }

        // remove specific handler
        let cb
        for (let i = 0, len = store.length; i < len; i++) {
            cb = store[i].cb
            if (cb === fn) {
                store.splice(i, 1)
                break
            }
        }
        return
    }
}





























