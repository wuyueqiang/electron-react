import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LIVE_STAGE } from '../vars/room-vars';
import os from 'os';

// 定义RoomConfig状态接口
interface RoomConfigState {
  debug: boolean;
  roomInfo: any;
  liveStage: string;
  testVisibility: boolean;
  fileVisibility: boolean;
  screenVisibility: boolean;
  currentScreen: any;
  answerVisibility: boolean;
  lotteryActivityVisibility: boolean;
  isTested: boolean;
  imIsLogin: boolean;
  isStart: boolean;
  isTestLive: boolean;
  isShareScreen: boolean;
  isAnswering: boolean;
  isLotterying: boolean;
  isMirror: boolean;
  cameraList: any[];
  speakerList: any[];
  micList: any[];
  screenList: any[];
  resolution: number;
  isOpenCamera: boolean;
  isMix: number; // 是否开启混流,默认0（开启），1（开启），2（关闭）
  camera: {
    deviceId: string;
    deviceName: string;
    volume?: string;
    isOpen: boolean;
  };
  cameraPosition: {
    label: string; // 位置名称
    position: string; // 位置值
    shortcutKey: string; // 快捷键
    icon: string; // 图标
    type: number; // 请求接口用
  };
  speaker: {
    deviceId: string;
    deviceName: string;
    volume: number;
    isOpen: boolean;
  };
  isOpenMic: boolean;
  mic: {
    deviceId: string;
    deviceName: string;
    volume: number;
    isOpen: boolean;
  };
  boardFileList: any[];
  videoCallUserList: any[];
  isOpenVideoCall: boolean;
  lotteryWinnerList: any[];
  showLotteryWinnerList: boolean;
  liveBGM: any;
  [key: string]: any; // 索引签名，允许动态属性访问
}

// 保持原有的初始状态
const initialState: RoomConfigState = {
  debug: false,
  roomInfo: {},
  liveStage: LIVE_STAGE.TEST_STAGE,
  testVisibility: false,
  fileVisibility: false,
  screenVisibility: false,
  answerVisibility: false,
  lotteryActivityVisibility: false,
  currentScreen: {},    
  isTested: false, // 是否设备检测通过
  imIsLogin: false,
  isStart: false,
  isShareScreen: false,
  isAnswering: false,
  isLotterying: false,
  isMirror: os.type() === 'Darwin' ? true : false,
  isTestLive: false, // 是否是课前测试
  cameraList: [],
  speakerList: [],
  micList: [],
  screenList: [],
  resolution: 0, // 这里需要导入TRTCVideoResolution，暂时使用0代替
  isOpenCamera: false,
  isMix: 2,
  camera: {
    deviceId: '',
    deviceName: '',
    isOpen: false,
  },
  cameraPosition: {
    label: '右上',
    position: 'rightTop',
    shortcutKey: 'ctrl/cmd+2',
    icon: 'rightTop',
    type: 3
  },
  speaker: {
    deviceId: '',
    deviceName: '',
    volume: 0,
    isOpen: true
  },
  isOpenMic: false,
  mic: {
    deviceId: '',
    deviceName: '',
    volume: 0,
    isOpen: false
  },
  boardFileList: [],
  videoCallUserList: [], // 连麦中用户列表
  isOpenVideoCall: false,
  lotteryWinnerList: [],
  showLotteryWinnerList: false,
  liveBGM: {},
};

const roomConfigSlice = createSlice({
  name: 'roomConfig',
  initialState,
  reducers: {
    // 替代 SET_VALUE action
    setValue: (state, action: PayloadAction<{ key: string; value: any }>) => {
      const { key, value } = action.payload;
      state[key] = value;
    },
    
    // 替代 SET_LIST action
    setList: (state, action: PayloadAction<{ name: string; list: any[] }>) => {
      const { name, list } = action.payload;
      state[`${name}List`] = list;
    },
    
    // 替代 SET_DEVICE action
    setDevice: (state, action: PayloadAction<{ name: string; device: any }>) => {
      const { name, device } = action.payload;
      state[name] = device;
    },
    
    // 窗口大小调整
    resizeWindow: (state) => {
      // 窗口大小调整的同步逻辑（如果需要更新状态的话）
      // 这个action主要用于触发重新渲染或其他UI更新
    },
    
    // 开始混流（同步状态更新）
    startStreamMix: (state) => {
      state.isMix = 1; // 设置为开启混流状态
    },
    
    // 停止混流（同步状态更新）
    stopStreamMix: (state) => {
      state.isMix = 2; // 设置为关闭混流状态
    },
    
    // 设置日志（同步状态更新）
    setLog: (state) => {
      // 日志相关的同步状态更新
      // 主要的日志逻辑在异步thunk中处理
    },
    
    // 设置操作日志（同步状态更新）
    setOperateLog: (state) => {
      // 操作日志相关的同步状态更新
      // 主要的日志逻辑在异步thunk中处理
    },
    
    // 开始直播动作（同步状态更新）
    startLiveAction: (state) => {
      state.isStart = true;
    },
    
    // 设备变更动作（同步状态更新）
    deviceChangeAction: (state) => {
      // 设备变更的同步状态处理
      // 主要逻辑在异步thunk中处理
    },
    
    // 切换摄像头开关
    toggleCamera: (state, action: PayloadAction<boolean>) => {
      state.isOpenCamera = action.payload;
    },
    
    // 切换麦克风开关
    toggleMic: (state, action: PayloadAction<boolean>) => {
      state.isOpenMic = action.payload;
    },
    
    // 切换屏幕共享
    toggleScreenShare: (state, action: PayloadAction<boolean>) => {
      state.isShareScreen = action.payload;
    },
    
    // 设置摄像头位置
    setCameraPosition: (state, action: PayloadAction<any>) => {
      state.cameraPosition = action.payload;
    },
    
    // 设置直播阶段
    setLiveStage: (state, action: PayloadAction<string>) => {
      state.liveStage = action.payload;
    },
    
    // 设置可见性状态
    setVisibility: (state, action: PayloadAction<{ type: string; visible: boolean }>) => {
      const { type, visible } = action.payload;
      switch (type) {
        case 'test':
          state.testVisibility = visible;
          break;
        case 'file':
          state.fileVisibility = visible;
          break;
        case 'screen':
          state.screenVisibility = visible;
          break;
        case 'answer':
          state.answerVisibility = visible;
          break;
        case 'lottery':
          state.lotteryActivityVisibility = visible;
          break;
      }
    },
    
    // 重置状态
    resetRoomConfig: (state) => {
      // 重置为初始状态，但保留一些重要信息
      Object.assign(state, initialState, {
        roomInfo: state.roomInfo, // 保留房间信息
        debug: state.debug, // 保留调试模式
      });
    },
  },
});

// 导出 actions
export const {
  setValue,
  setList,
  setDevice,
  resizeWindow,
  startStreamMix,
  stopStreamMix,
  setLog,
  setOperateLog,
  startLiveAction,
  deviceChangeAction,
  toggleCamera,
  toggleMic,
  toggleScreenShare,
  setCameraPosition,
  setLiveStage,
  setVisibility,
  resetRoomConfig,
} = roomConfigSlice.actions;

// 导出 reducer
export default roomConfigSlice.reducer;
