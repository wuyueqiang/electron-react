// @ts-ignore
import { TRTCVideoResolution, TRTCBeautyStyle } from 'trtc-electron-sdk/liteav/trtc_define';

// 画质参数
export interface StreamEncoderParams {
    label: string, // 画质名称
    videoResolution: number, // 分辨率
    videoFps: number, // 帧率
    videoBitrate: number, // 码率
    minVideoBitrate: number, // 最小码率
    enableAdjustRes: boolean
}

// 16:9 清晰度
export enum Resolutions {
    '90P' = TRTCVideoResolution.TRTCVideoResolution_160_90,
    '144P' = TRTCVideoResolution.TRTCVideoResolution_256_144,
    '180P' = TRTCVideoResolution.TRTCVideoResolution_320_180,
    '270P' = TRTCVideoResolution.TRTCVideoResolution_480_270,
    '360P' = TRTCVideoResolution.TRTCVideoResolution_640_360,
    '540P' = TRTCVideoResolution.TRTCVideoResolution_960_540,
    '720P' = TRTCVideoResolution.TRTCVideoResolution_1280_720,
    '1080P' = TRTCVideoResolution.TRTCVideoResolution_1920_1080,
}

// 摄像头画质列表
export const CameraStreamEncoderParams: StreamEncoderParams[] = [
    {
        label: '360P',
        videoResolution: Resolutions['360P'],
        videoFps: 20,
        videoBitrate: 400,
        minVideoBitrate: 350,
        enableAdjustRes: false
    },
    {
        label: '540P',
        videoResolution: Resolutions['540P'],
        videoFps: 20,
        videoBitrate: 1200,
        minVideoBitrate:1200,
        enableAdjustRes: false
    },
    {
        label: '720P',
        videoResolution: Resolutions['720P'],
        videoFps: 20,
        videoBitrate: 1800,
        minVideoBitrate: 1800,
        enableAdjustRes: false
    },
    {
        label: '1080P',
        videoResolution: Resolutions['1080P'],
        videoFps: 20,
        videoBitrate: 2500,
        minVideoBitrate: 2500,
        enableAdjustRes: false
    },
];

// 白板播放视频时，推流画质配置参数
export const BoardVideoEncoderParam: StreamEncoderParams = {
    label: '720P',
    videoResolution: Resolutions['720P'],
    videoFps: 10,
    videoBitrate: 600,
    minVideoBitrate: 550,
    enableAdjustRes: false
}

// 屏幕分享画质列表
export const BoardStreamEncoderParams: StreamEncoderParams[] = [
    // {
    //     label: '1080P',
    //     videoResolution: Resolutions['1080P'],
    //     videoFps: 10,
    //     videoBitrate: 800,
    //     minVideoBitrate: 750,
    //     enableAdjustRes: false
    // },
    {
        label: '720P',
        videoResolution: Resolutions['720P'],
        videoFps: 10,
        videoBitrate: 800,
        minVideoBitrate: 600,
        enableAdjustRes: false
    },
    {
        label: '540P',
        videoResolution: Resolutions['540P'],
        videoFps: 10,
        videoBitrate:400,
        minVideoBitrate: 350,
        enableAdjustRes: false
    }
];

// 定义美颜配置参数类型
export interface BeautyStyleParams {
    label: string, // 美颜名称
    beautyStyle: TRTCBeautyStyle, // 风格
    beauty: number, // 美颜
    white: number, // 美白
    ruddiness: number // 红润
}

// 美颜配置列表
export const BeautyStyles: BeautyStyleParams[] = [
    {
        label: '真实',
        beautyStyle: TRTCBeautyStyle.TRTCBeautyStyleSmooth,
        beauty: 4,
        white: 4,
        ruddiness: 5
    },
    {
        label: '酷白',
        beautyStyle: TRTCBeautyStyle.TRTCBeautyStyleSmooth,
        beauty: 5,
        white: 7,
        ruddiness: 5
    },
    {
        label: '清爽',
        beautyStyle: TRTCBeautyStyle.TRTCBeautyStyleNature,
        beauty: 3,
        white: 5,
        ruddiness: 5
    },
    {
        label: '鲜明',
        beautyStyle: TRTCBeautyStyle.TRTCBeautyStyleNature,
        beauty: 5,
        white: 6,
        ruddiness: 5
    },
    {
        label: '极致',
        beautyStyle: TRTCBeautyStyle.TRTCBeautyStyleNature,
        beauty: 7,
        white: 7,
        ruddiness: 5
    },
    {
        label: '无美颜',
        beautyStyle: TRTCBeautyStyle.TRTCBeautyStyleNature,
        beauty: 0,
        white: 0,
        ruddiness: 0
    }
]

// 设备修改参数
export interface DeviceChangeParams {
    type: string | number,
    deviceId: string,
    state: string | number
}


/**
 * 直播系统操作类型定义
 */
export enum LIVE_ACTIONS {
    anchorEnterRoom, // 主播进入房间
    anchorExitRoom, // 主播离开房间
    anchorOpenCamera, // 主播打开摄像头
    anchorCloseCamera, // 主播关闭摄像头
    anchorSetMicVolume, // 主播设置麦克风音量
    anchorStartPush, // 开始直播推流
    anchorStopPush, // 停止直播推流
    anchorSetCameraPosition, // 设置摄像头位置
    anchorSetVideoResolution, // 设置摄像头分辨率
    selectCamera, // 选择摄像头
    selectMic, // 选择摄像头
    setMirror, // 设置镜像
    setBeautyStyle, // 设置美颜
    startCapturShare, // 开始屏幕分享
    stopCapturShare, // 停止屏幕分享
    startBoardPush, // 开始白板推流
    stopBoardPush, // 停止白板推流
    testResult, // 上报设备测试结果
    fileTranceCodeFinished, // 课件转码回调
    NetworkQuality, // 网络质量
    NetworkErr, // 网络异常
    CPUErr, // cpu异常
    TimJoinGroup, // 加入群组
    ConnectionLost, // SDK 跟服务器的连接断开
    TryToReconnect, // SDK 尝试重新连接到服务器
    ConnectionRecovery, // SDK 跟服务器的连接恢复
    DeviceChange, // 监听外接设备的插拔
    sendBoardRealtimeDataError, // 发送白板事件到远端失败
    Error, // 错误监听
}

// 
export enum LIVE_ACTIONS_TEXT {
    anchorEnterRoom = "主播进入房间", // 主播进入房间
    anchorExitRoom = "主播离开房间", // 主播离开房间
    anchorOpenCamera = "主播打开摄像头", // 主播打开摄像头
    anchorCloseCamera = "主播关闭摄像头", // 主播关闭摄像头
    anchorSetMicVolume = "主播设置麦克风音量", // 主播设置麦克风音量
    anchorStartPush = "开始直播推流", // 开始直播推流
    anchorStopPush = "停止直播推流", // 停止直播推流
    anchorSetCameraPosition = "设置摄像头位置", // 设置摄像头位置
    anchorSetVideoResolution = "设置摄像头分辨率", // 设置摄像头分辨率
    selectCamera = "选择摄像头", // 选择摄像头
    selectMic = "选择麦克风", // 选择摄像头
    setMirror = "设置镜像", // 设置镜像
    setBeautyStyle = "设置美颜", // 设置美颜
    startCapturShare = "开始屏幕分享", // 开始屏幕分享
    stopCapturShare = "停止屏幕分享", // 停止屏幕分享
    startBoardPush = "开始白板推流", // 开始白板推流
    stopBoardPush = "停止白板推流", // 停止白板推流
    testResult = "上报设备测试结果", // 上报设备测试结果
    fileTranceCodeFinished = "课件转码回调", // 课件转码回调
    NetworkQuality = "网络质量回调", // 网络质量
    NetworkErr = "网络异常", // 网络异常
    CPUErr = "cpu异常", // cpu异常
    TimJoinGroup = "加入IM群组", // 加入群组
    ConnectionLost = "SDK 跟服务器的连接断开", // SDK 跟服务器的连接断开
    TryToReconnect = "SDK 尝试重新连接到服务器", // SDK 尝试重新连接到服务器
    ConnectionRecovery = "SDK 跟服务器的连接恢复", // SDK 跟服务器的连接恢复
    DeviceChange = "外接设备的插拔", // 监听外接设备的插拔
    sendBoardRealtimeDataError = "发送白板事件到远端失败", // 发送白板事件到远端失败
    Error = "", // TRTC错误
}

// 日志code
export enum  OPERATE_ACTION {
    live_env_check = "live_env_check", // 检测情况
    microphone_swtich = "microphone_swtich", // 麦克风开关
    file_upload = "file_upload", // 文件上传
    live_courseware = "live_courseware", //直播间课件操作
    screen_share = "screen_share", // 屏幕分享
    teacher_close_soft = "teacher_close_soft", // 关闭软件
}

/**
 * 素材关联类型
 */
export enum BIND_TYPES {
    UnKnowBindType = 'UNKNOWBINDTYPE',
    BINDROOM = 'BINDROOM', // 关联房间
    BINDUSER = 'BINDUSER' // 关联老师
}

/**
 * 文件类型
 */
export enum FILE_EXT {
    UnKnowFile = 'UNKNOWFILE',
    AUDIO = 'AUDIO', // 视频
    VIDEO = 'VIDEO', // 音频
    PPT = 'PPT', // PPT
    PDF = 'PDF', // PDF
    IMAGE = 'IMAGE' // 图片
}

// 定义摄像头位置参数类型
export interface CameraPositionParams {
    label: string, // 位置名称
    position: string, // 位置值
    shortcutKey: string, // 快捷键
    icon: string, // 图标
    type: number, // 请求接口用
}
/**
 * 摄像头位置列表
 */
 export const CameraPositions: CameraPositionParams[] = [
    
    {
        label: '左上',
        position: 'leftTop',
        shortcutKey: 'ctrl/cmd+1',
        icon: 'leftTop',
        type: 1
    },
    {
        label: '右上',
        position: 'rightTop',
        shortcutKey: 'ctrl/cmd+2',
        icon: 'rightTop',
        type: 3
    },
    {
        label: '左下',
        position: 'leftBottom',
        shortcutKey: 'ctrl/cmd+3',
        icon: 'leftBottom',
        type: 2
    },
    {
        label: '右下',
        position: 'rightBottom',
        shortcutKey: 'ctrl/cmd+4',
        icon: 'rightBottom',
        type: 4
    },
    {
        label: '全屏',
        position: 'fullScreen',
        shortcutKey: 'ctrl/cmd+s',
        icon: 'fullScreen',
        type: 5
    }
]

// 定义技术技术指标异常值
export enum StatisticsWarn {
    systemCpu = 80, // 系统cpu使用率
    appCpu = 80, // 应用cpu使用率
    rtt = 250, // 延迟
    upLoss = 30 // 上行丢包率
}

// 连麦IM action
export const VideoCallActions: string[] = [
    "liveConnectCancelApply",
    "liveConnectApply"
]

// 答题IM action
export const AnswerActions: string[] = [
    "sendLiveExamQuestion",
    "replaceLiveExamQuestion",
    "endLiveExamQuestion",
    "createLiveExamQuestion",
    "refreshLiveExamQuestion",
    "deleteLiveExamQuestion"
]

// 点赞IM action
export const DiggActions: string[] = [
    "userLiveDigg"
]
// 红包打赏IM action
export const RewardActions: string[] = [
    "userNewLiveReward"
]
// 在线人数更新IM action
export const OnlineNumsActions: string[] = [
    "liveSyncOnlineNum"
]

// 老师进入直播间IM action
export const TeacherEnterActions: string[] = [
    "anchorEnterRoom"
]

// 直播消息IM action
export const ChatActions: string[] = [
    "sendUserLiveMsg",
    "sendReplyMsg",
    "liveRadioNotice",
    "liveSyncOnlineNum",
    "liveRemoveMsg",
    "liveRevokeMsg",
    "fakeCommentTaskOperate",
    "adminUploadFile"
]

// 助教/讲师群消息IM action
export const AdminChatActions: string[] = [
    "sendTextMsg",
    "sendImageMsg"
]
// 助教/讲师挂件（商品/优惠券） action
export const PendantActions: string[] = [
    "liveSpreadRecommend", 
    "liveSpreadYouzanRecommend", 
    "liveCancelSpreadRecommend", 
    "setLiveHotConfig",
    "liveCouponRecommend",
    "liveCancelCouponRecommend"
]
// 抽奖im相关 action
export const LotteryActions: string[] = [
    "liveLotteryTaskStart",
    "liveLotteryTaskEnd",
    "liveLotteryTaskPushWinnerResult"
]
/**
 * 直播状态阶段
 */
 export enum LIVE_STAGE {
    TEST_STAGE = 'TEST_STAGE', // 测试阶段
    CLASS_STAGE = 'CLASS_STAGE', // 上课阶段
    END_STAGE = 'END_STAGE', // 已结束
}

export interface VideoCallUserParams {
    trtcUid: string,
    userId: string,
    avatar: string,
    nick: string,
    video: number,
    audio: number
}