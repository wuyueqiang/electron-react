import axios from '../utils/axios'
import axios2 from '../utils/axios2' // 有书登陆

import { YOUSHU_URL, XLOG_HOST } from '../config'
import { BIND_TYPES } from '../vars/room-vars';

interface YoushuLoginParams {
    mobile: number,
    login_type: string,
    password?: string,
    code?: number
}
interface YoushuSmsCodeParams {
    mobile: number
}

export const xlog = (type: string, user_id: any = '', soft: string, os: string, messages: string, shutLog: boolean = true) => axios({
    type: 'POST',
    baseUrl: XLOG_HOST,
    path: '',
    data: {
        type, user_id, soft, os, messages
    },
    shutLog
})

/**
 * 获取软件版本更新接口
 * @param params 
 */
export const teacherClientUpdate = (params = { t: new Date().getTime() }) => {
    return axios2({
        type: 'GET',
        baseUrl: YOUSHU_URL,
        path: '/api/v2/live/teacher_client_update',
        data: params
    })
}

/**
 * 有书登录
 * @param params
 */
export const youshuLogin = (params: YoushuLoginParams) => {
    return axios2({
        type: 'POST',
        baseUrl: YOUSHU_URL,
        path: '/api/v2/live/teacher_login',
        data: params
    })
}

/**
 * 有书获取验证码
 * @param params
 */
export const youshuSmsCode = (params: YoushuSmsCodeParams) => {
    return axios2({
        type: 'POST',
        baseUrl: YOUSHU_URL,
        path: '/w/sms/sendCode',
        data: params
    })
}


/**
 * 进入房间
 * @param room_id 房间ID
 * @param user_id 用户ID
 * @param nickname 用户昵称
 * @param role 角色
 * @param code 参加码
 * @param source 来源
 */
export const enterLiveRoom = (room_id: number, user_id: number, nickname: string, role: string, code: string, source: string) => axios({
    type: 'POST',
    baseUrl: '',
    path: '/Ys.Pb.Live.ServiceHttp/EnterRoom',
    data: {
        room_id, user_id, nickname, role, code, source
    },
    dataType: 'json',
    contentType: 'application/json'
})

/**
 * 老师离开直播间
 * @param room_id 房间ID
 */
export const TeacherQuitRoom = (room_id: number) => axios({
    type: 'POST',
    baseUrl: '',
    path: '/Ys.Pb.Live.ServiceHttp/TeacherQuitRoom',
    data: {
        room_id
    },
    dataType: 'json',
    contentType: 'application/json'
})


/**
 * 获取oss token
 * @param 
 * @constructor
 */
export const GetLiveOssToken = () => axios({
    type: 'GET',
    baseUrl: '',
    path: '/Ys.Pb.Live.ServiceYSHttp/GetLiveOssToken',
    data: {},
    dataType: 'json',
    contentType: 'application/json'
})

// 获取视频上传腾讯 的签名
export const getUploadCloudSign = () => axios({
    type: 'GET',
    baseUrl: '',
    path: '/Ys.Pb.Live.ServiceHttp/GetUploadCloudSign',
    data: {},
    dataType: 'json',
    contentType: 'application/json'
})

/**
 * 添加文件转码
 * @param room_id 房间ID
 * @param url 文件URL
 * @param is_static_ppt 是否静态PPT 默认false
 * @param minResolution 最小分辨率
 * @param thumbnail_resolution 动态PPT转码可以为文件生成该分辨率的缩略图，不传或者格式错误，则无
 * @param title 文件名称
 * @param user_id 用户标识
 * @param bind_type 绑定类型
 * @param sign md5
 * @param file_ext 文件类型
 * @param file_size 文件大小
 * @constructor
 */
export const AddTranscode = (room_id: number, url: string, is_static_ppt: boolean, minResolution: string, thumbnail_resolution: string, title: string, user_id: number, bind_type: BIND_TYPES, sign: string, file_ext: string, file_size: number,file_id:string) => axios({
    type: 'POST',
    baseUrl: '',
    path: '/Ys.Pb.Live.ServiceHttp/AddTranscode',
    data: {
        room_id, url, is_static_ppt, minResolution, thumbnail_resolution, title, user_id, bind_type, sign, file_ext, file_size, file_id
    },
    dataType: 'json',
    contentType: 'application/json'
})

/**
 * 查询转码文件
 * @param task_id 转码任务ID
 */
export const QueryTranscodingFile = (task_id: string) => axios({
    type: 'GET',
    baseUrl: '',
    path: '/Ys.Pb.Live.ServiceHttp/QueryTranscodingFile',
    data: {
        task_id
    },
    dataType: 'json',
    contentType: 'application/json'
})


/**
 * 开始直播
 * @param room_id 房间ID
 * @param user_id 用户ID
 * @param app 业务端来源
 * @constructor
 */
export const StartLive = (room_id: number, user_id: number, app: string, is_test: boolean) => axios({
    type: 'POST',
    baseUrl: '',
    path: '/Ys.Pb.Live.ServiceHttp/StartLive',
    data: {
        room_id, user_id, app, is_test
    },
    dataType: 'json',
    contentType: 'application/json'
})

/**
 * 开始（更新）混流
 * @param room_id 房间ID
 * @param user_id 用户ID
 * @param camera 讲师是否开启摄像头
 * @param template 混流模版,1（摄像头左上），2（摄像头左下），3（摄像头右上），4（摄像头右下），5（摄像头全屏）
 * @param connect_users 连麦中的用户
 * @param display_type 直播类型 0横屏 1竖屏
 * @constructor
 */
export const StartMCUMixTranscode = (room_id: number, user_id: number, camera: boolean, template: number, main_stream: number, connect_user_info: Array<any>, display_type: number) => axios({
    type: 'POST',
    baseUrl: '',
    path: '/Ys.Pb.Live.ServiceHttp/StartMCUMixTranscode',
    data: {
        room_id, user_id, camera, template, main_stream, connect_user_info, display_type
    },
    dataType: 'json',
    contentType: 'application/json'
})

/**
 * 开始白板推流
 * @param room_id 房间ID
 * @param user_id 用户ID
 * @param app 业务端来源
 * @constructor
 */
export const StartWhiteBoardPush = (room_id: number, user_id: number, app: string) => axios({
    type: 'POST',
    baseUrl: '',
    path: '/Ys.Pb.Live.ServiceHttp/StartWhiteBoardPush',
    data: {
        room_id, user_id, app
    },
    dataType: 'json',
    contentType: 'application/json'
})

/**
 * 停止白板推流
 * @param room_id 房间ID
 * @param user_id 用户ID
 * @constructor
 */
export const StopWhiteBoardPush = (room_id: number, user_id: number) => axios({
    type: 'POST',
    baseUrl: '',
    path: '/Ys.Pb.Live.ServiceHttp/StopWhiteBoardPush',
    data: {
        room_id, user_id
    },
    dataType: 'json',
    contentType: 'application/json'
})


/**
 * 暂停直播(取消混流)
 * @param room_id
 * @param user_id
 * @param app 业务端来源
 * @param endLive 是否结束直播
 * @constructor
 */
export const CancelLive = (room_id: number, user_id: number, app: string, is_end: boolean) => axios({
    type: 'POST',
    baseUrl: '',
    path: '/Ys.Pb.Live.ServiceHttp/CancelLive',
    data: {
        room_id, user_id, app, is_end
    },
    dataType: 'json',
    contentType: 'application/json'
})

/**
 * 发送消息
 * @param room_id 房间ID
 * @param user_id 业务用户ID
 * @param body 消息体
 *  {
        action: "", [type=liveSystemNotice]系统消息类型，anchorEnterRoom：主播进入房间，anchorExitRoom：主播离开房间，anchorOpenCamera：主播打开摄像头，anchorCloseCamera：主播关闭摄像头，anchorStartPush：主播开始推流，anchorStopPush：主播停止推流，fileTranceCodeFinished：文件转码完成
        avatar: "http://feed.youshu.cc/readwith/media/picture/5f291d15a913b.png",
        img: "", 图片，[type=image]如果是图片类型，这里传图片地址
        nick: "老师", 昵称
        role: "anchor",  角色 anchor：主播，admin：管理员，member：普通成员
        send_time: 1596591333, 消息发送时间
        text: "你好", [type=text]类型为文本时传文本消息，[type=liveSystemNotice,action=fileTranceCodeFinished]类型系统消息的转码动作时，传json字符串
        type: "text", 消息类型，默认text，image，liveSystemNotice
        userID: "888", 业务用户ID
        agent: "", 终端Agent
    }
 * @constructor
 */
export const SendMsg = (room_id: number, user_id: number, body: any) => axios({
    type: 'POST',
    baseUrl: '',
    path: '/Ys.Pb.Live.ServiceHttp/SendMsg',
    data: {
        room_id, user_id, body
    },
    dataType: 'json',
    contentType: 'application/json'
})

/**
 * 发送老师和助教群组消息
 * @param room_id 房间ID
 * @param user_id 业务用户ID
 * @param body 消息体
 * @param app 10120有书
 *  {
        action: "sendTextMsg", 发送文本：sendTextMsg  发送图片：sendImageMsg
        type: "adminGroupMsg",
        avatar: "http://feed.youshu.cc/readwith/media/picture/5f291d15a913b.png",
        img: "", 图片，[action=sendImageMsg]如果是图片类型，这里传图片地址
        nick: "老师", 昵称
        role: "anchor",  角色 anchor：主播，admin：管理员
        send_time: 1596591333, 消息发送时间
        text: "你好", [action=sendTextMsg]类型为文本时传文本消息，[type=liveSystemNotice,action=fileTranceCodeFinished]类型系统消息的转码动作时，传json字符串
        userID: "888", 业务用户ID
        quote: JSON.stringify{
            create_time: new Date(), // 发送时间
            is_popup: false // 是否弹窗提示
        }
    }
 * @param app 10120有书
 * @constructor
 */
export const SendAdminGroupMsg = (room_id: number, user_id: number, body: any, app: 10120) => axios({
    type: 'POST',
    baseUrl: '',
    path: '/Ys.Pb.Live.ServiceHttp/SendAdminGroupMsg',
    data: {
        room_id, user_id, body, app
    },
    dataType: 'json',
    contentType: 'application/json'
})

/**
 * 获取老师和助教群组最近消息
 * @param room_id
 * @constructor
 */
export const GetAdminGroupLatestChatMsg = (room_id: number) => axios({
    type: 'GET',
    baseUrl: '',
    path: '/Ys.Pb.Live.ServiceHttp/GetAdminGroupLatestChatMsg',
    data: {
        room_id
    },
    dataType: 'json',
    contentType: 'application/json'
})

/**
 * 发送老师和助教群组消息
 * @param room_id 房间ID
 * @param operate_type 操作类型 1撤回 2删除 3删除并拉黑
 * @param operate_msg_uid 被操作的评论的uid
 * @param operate_msg_id 被操作的评论id
 * @constructor
 */
export const CommentOperate = (room_id: number, operate_type: number, operate_msg_uid: number, operate_msg_id: string) => axios({
    type: 'POST',
    baseUrl: '',
    path: '/Ys.Pb.Live.ServiceHttp/CommentOperate',
    data: {
        room_id, operate_type, operate_msg_uid, operate_msg_id
    },
    dataType: 'json',
    contentType: 'application/json'
})

/**
 * 发送文本消息（C端学生使用，暂只支持文本和图片消息）
 * @param 参数同SendMsg
 * @constructor
 */
export const SendTextMsg = (room_id: number, user_id: number, body: any) => axios({
    type: 'POST',
    baseUrl: '',
    path: '/Ys.Pb.Live.ServiceHttp/SendTextMsg',
    data: {
        room_id, user_id, body
    },
    dataType: 'json',
    contentType: 'application/json'
})

interface ForbidParams {
    room_id: number,
    time: number,
    user_id: number,
    role: string,
    source: string
}

/**
 * 用户禁言/取消禁言
 * @param room_id [必填]房间ID
 * @param time [必填]为0时表示取消禁言
 * @param user_id [必填]业务端用户ID
 * @param role [必填]角色
 * @param source [必填]来源端
 * @constructor
 */
export const ForbidMsg = (params: ForbidParams) => axios({
    type: 'POST',
    baseUrl: '',
    path: '/Ys.Pb.Live.ServiceHttp/ForbidMsg',
    data: {
        ...params
    },
    dataType: 'json',
    contentType: 'application/json'
})

/**
 * 全体禁言
 * @param room_id [必填]房间ID
 * @param time [必填]为0时表示取消禁言
 * @param user_id [必填]业务端用户ID
 * @param role [必填]角色
 * @param source [必填]来源端
 * @constructor
 */
export const ForbidRoom = (params: ForbidParams) => axios({
    type: 'POST',
    baseUrl: '',
    path: '/Ys.Pb.Live.ServiceHttp/ForbidRoom',
    data: {
        ...params
    },
    dataType: 'json',
    contentType: 'application/json'
})

interface GetFileListParams {
    app: string,
    bind_type: BIND_TYPES,
    room_id: number,
    user_id: number,
    file_title?: string,
    page: number,
    size: number
}

/**
 * 获取文件列表
 * @param app [必填][必填]业务ID
 * @param bind_type [必填]房间ID
 * @param page [必填]房间ID
 * @param size [必填]为0时表示取消禁言
 * @constructor
 */
export const GetFileList = (params: GetFileListParams) => axios({
    type: 'POST',
    baseUrl: '',
    path: '/Ys.Pb.Live.ServiceHttp/GetFileList',
    data: {
        ...params
    },
    dataType: 'json',
    contentType: 'application/json'
})

interface AddFileParams {
    app: string, // [必填]sdkAppId
    pre: boolean, // [必填]快传验证，如果MD5存在，则返回成功
    sign: string, // [必填] 文件签名（MD5）
    url?: string, // 素材使用链接
    downloadLink?: string, // 素材下载链接
    file_size?: number, // 录制文件大小，单位字节
    file_ext?: string, // 文件后缀
    file_task_id?: string, // 视频文件时使用
    file_title: string, // [必填]文件标题
    thumbnail?: string, // 缩略图
    room_id?: number, // room、user
    user_id?: number, // room、user
    pages?: number, // PPT文件页数
    thumbnail_url?: string, // PPT文件缩略图前缀
    resolution?: string, // PPT文件清晰度
}

/**
 * 添加素材
 * @param params AddFileParams
 * @constructor
 */
export const AddFile = (params: AddFileParams) => axios({
    type: 'POST',
    baseUrl: '',
    path: '/Ys.Pb.Live.ServiceHttp/AddFile',
    data: {
        ...params
    },
    dataType: 'json',
    contentType: 'application/json'
})

/**
 * 删除素材
 * @constructor
 */
export const DelFile = (app: number, sign: string, bind_type: BIND_TYPES, bind_id: number, role: string, room_id: number, creator: string) => axios({
    type: 'POST',
    baseUrl: '',
    path: '/Ys.Pb.Live.ServiceHttp/DelFile',
    data: {
        app, sign, bind_type, bind_id, role, room_id, creator
    },
    dataType: 'json',
    contentType: 'application/json'
})


/**
 * 创建混流
 * @param room_id 房间ID
 * @param user_id 用户ID
 * @param camera 是否开启摄像头
 * @param app 业务端来源
 * @constructor
 */
export const CreateCommonMixStream = (room_id: number, user_id: number, app: string, camera: boolean) => axios({
    type: 'POST',
    baseUrl: '',
    path: '/Ys.Pb.Live.ServiceHttp/CreateCommonMixStream',
    data: {
        room_id, user_id, app, camera
    },
    dataType: 'json',
    contentType: 'application/json'
})

/**
 * 取消混流
 * @param room_id
 * @param user_id
 * @param app 业务端来源
 * @constructor
 */
export const CancelCommonMixStream = (room_id: number, user_id: number, app: string) => axios({
    type: 'POST',
    baseUrl: '',
    path: '/Ys.Pb.Live.ServiceHttp/CancelCommonMixStream',
    data: {
        room_id, user_id, app
    },
    dataType: 'json',
    contentType: 'application/json'
})

/**
 * 直播答题试卷列表
 * @param room_id
 * @constructor
 */
export const GetLiveExamQuestionList = (room_id: number) => axios({
    type: 'GET',
    baseUrl: '',
    path: '/Ys.Pb.Live.ServiceExam/GetLiveExamQuestionList',
    data: {
        room_id
    },
    dataType: 'json',
    contentType: 'application/json'
})

/**
 * 发起答题
 * @param live_exam_question_id
 * @param is_replace_exam_question
 * @param user_id
 * @param role
 * 
 * @constructor
 */
export const startLiveExamQuestion = (live_exam_question_id: number, is_replace_exam_question: boolean, user_id: number, role: string) => axios({
    type: 'POST',
    baseUrl: '',
    path: '/Ys.Pb.Live.ServiceExam/StartLiveExamQuestion',
    data: {
        live_exam_question_id, is_replace_exam_question, user_id, role
    },
    dataType: 'json',
    contentType: 'application/json'
})

/**
 * 结束答题
 * @param live_exam_task_answer_id
 * @constructor
 */
export const endLiveExamQuestion = (live_exam_task_answer_id: number, user_id: number, role: string) => axios({
    type: 'POST',
    baseUrl: '',
    path: '/Ys.Pb.Live.ServiceExam/EndLiveExamQuestion',
    data: {
        live_exam_task_answer_id, user_id, role
    },
    dataType: 'json',
    contentType: 'application/json'
})

/**
 * 答题统计
 * @param room_id
 * @constructor
 */
export const GetLiveExamQuestionTaskInfo = (live_exam_task_answer_id: number) => axios({
    type: 'GET',
    baseUrl: '',
    path: '/Ys.Pb.Live.ServiceExam/GetLiveExamQuestionTaskInfo',
    data: {
        live_exam_task_answer_id
    },
    dataType: 'json',
    contentType: 'application/json'
})
interface AddOperateLogParam {
    room_id: number,                 // [必填]房间id
    operate_action_code: string,     // [必填]操作code
    operate_uid: number,             // [必填]操作人用户id
    operate_email?: string,          // [非必填]操作人邮箱
    source: string,                  // [必填]操作来源 讲师TEACHER_SOURCE
    before_action_content?: string,  // [非必填]操作前内容json 串 
    after_action_content: string,    // [必填]操作后内容json 串
}

/**
 * 增加操作日志
 * @param params AddOperateLogParam
 * @constructor
 */
export const AddOperateLog = (params: AddOperateLogParam) => axios({
    type: 'POST',
    baseUrl: '',
    path: '/Ys.Pb.Live.ServiceHttp/AddOperateLog',
    data: {
        ...params
    },
    dataType: 'json',
    contentType: 'application/json'
})


interface SaveTeacherAvDeviceParam {
    room_id: number,                 // [必填]房间id
    av_device_type: number,          // [必填]音视频设备类型 1:音频 2:视频
    device: string,     // [必填]设备信息详情数据，前端自定义编码
}
/**
 * 保存老师端音视频设备信息
 * @param params SaveTeacherAvDeviceParam
 * @constructor 
 */
export const SaveTeacherAvDevice = (params: SaveTeacherAvDeviceParam) => axios({
    type: 'POST',
    baseUrl: '',
    path: '/Ys.Pb.Live.ServiceHttp/SaveTeacherAvDevice',
    data: {
        ...params
    },
    dataType: 'json',
    contentType: 'application/json'
})
/**
 * 获取当前老师的今日白板直播列表
 * @param teacher_id
 * @constructor
 */
export const GetTodayWhiteBoardLiveByTeacher = (teacher_id: string) => axios({
    type: 'GET',
    baseUrl: '',
    path: '/Ys.Pb.Live.ServiceYSHttp/GetTodayWhiteBoardLiveByTeacher',
    data: {
        teacher_id
    },
    dataType: 'json',
    contentType: 'application/json'
})



export interface GetWhiteBoardLiveListByTeacherParam {
    teacher_id: string,                 // [必填]老师用户id
    page: string,          // [必填]页码
    page_size: string,     // [必填]没页数量
    status_type: number, // 直播状态类型 1: 未开播，2: 直播中，3: 直播结束 必填
    sort_type: number,//排序规则 1: 顺序，2:倒序 @doc required
}
/**
 * 获取当前老师的所有白板直播列表
 */
export const GetWhiteBoardLiveListByTeacher = (params: GetWhiteBoardLiveListByTeacherParam) => axios({
    type: 'GET',
    baseUrl: '',
    path: '/Ys.Pb.Live.ServiceYSHttp/GetWhiteBoardLiveListByTeacher',
    data: params,
    dataType: 'json',
    contentType: 'application/json'
})

/**
 * 检查白板直播间是否有老师登录
 * room_id 房间号
 */
export const CheckRoomTeacherLogin = (room_id: string) => axios({
    type: 'POST',
    baseUrl: '',
    path: '/Ys.Pb.Live.ServiceHttp/CheckRoomTeacherLogin',
    data: { room_id },
    dataType: 'json',
    contentType: 'application/json'
})

/**
 * 老师获取直播连麦列表
 * room_id 房间号
 */
export const GetLiveConnectList = (room_id: string) => axios({
    type: 'GET',
    baseUrl: '',
    path: '/Ys.Pb.Live.ServiceHttp/GetLiveConnectList',
    data: { room_id },
    dataType: 'json',
    contentType: 'application/json'
})

/**
 * 老师开启/关闭连麦功能
 * room_id 房间号
 * status 状态 0关 1开
 */
export const LiveTeacherConnectStatus = (room_id: string, status: number, device: string) => axios({
    type: 'POST',
    baseUrl: '',
    path: '/Ys.Pb.Live.ServiceHttp/LiveTeacherConnectStatus',
    data: { room_id, status, device },
    dataType: 'json',
    contentType: 'application/json'
})

/**
 * 老师更新与学员的连麦状态
 * room_id 房间号
 * status 状态：1-同意连麦 2-上麦成功 3-结束连麦
 * student_id 学员id
 */
export const LiveTeacherConnectControl = (room_id: string, status: number, student_id: string) => axios({
    type: 'POST',
    baseUrl: '',
    path: '/Ys.Pb.Live.ServiceHttp/LiveTeacherConnectControl',
    data: { room_id, status, student_id },
    dataType: 'json',
    contentType: 'application/json'
})

/**
 * 获取抽奖活动列表
 * @param room_id
 * @constructor
 */
export const getLiveLotteryActivityListApi = (room_id: string) => axios({
    type: 'GET',
    baseUrl: '',
    path: '/Ys.Pb.Live.ServiceYSHttp/GetLiveLotteryActivityList',
    data: {
        room_id
    },
    dataType: 'json',
    contentType: 'application/json'
})


export interface startLotteryTaskParam {
    lottery_activity_id: number,
    draw_time_type: number,
    draw_run_time?: number,
    draw_time?: string
}
/**
 * 开始抽奖活动
 * @param startLotteryTaskParam 
 * @constructor
 */
export const startLotteryTaskApi = (params: startLotteryTaskParam) => axios({
    type: 'POST',
    baseUrl: '',
    path: '/Ys.Pb.Live.ServiceYSHttp/StartLotteryTask',
    data: params,
    dataType: 'json',
    contentType: 'application/json'
})

/**
 * 结束抽奖活动
 * @param params
 * @constructor
 */
export const endLotteryTaskApi = (params: {lottery_task_id:number}) => axios({
    type: 'POST',
    baseUrl: '',
    path: '/Ys.Pb.Live.ServiceYSHttp/EndLotteryTask',
    data: params,
    dataType: 'json',
    contentType: 'application/json'
})

/**
 * 获取抽奖任务列表
 * @param room_id
 * @constructor
 */
export const getLotteryTaskListApi = (room_id: string) => axios({
    type: 'GET',
    baseUrl: '',
    path: '/Ys.Pb.Live.ServiceYSHttp/GetLotteryTaskList',
    data: {
        room_id
    },
    dataType: 'json',
    contentType: 'application/json'
})

export interface LiveUploadLogParam {
    file_url: string,
    user_id: number
}
/**
 * 上传trtc日志
 * @param LiveUploadLogParam
 * @constructor
 */
export const LiveUploadLog = (params: LiveUploadLogParam) => axios({
    type: 'POST',
    baseUrl: '',
    path: '/Ys.Pb.Live.ServiceYSHttp/LiveUploadLog',
    data: params,
    dataType: 'json',
    contentType: 'application/json'
})