import { combineReducers, createSelector } from '@reduxjs/toolkit';
import ysLiveClientReducer from './ysLiveClientSlice';
import roomConfigReducer from './roomConfigSlice';
import appReducer from './appReducer';

// 创建根reducer
const rootReducer = combineReducers({
  ysLiveClient: ysLiveClientReducer,
  roomConfig: roomConfigReducer,
  app: appReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;

// ===========================================
// 核心状态选择器 (Selectors)
// ===========================================

// 基础选择器
export const selectRoomConfig = (state: RootState) => state.roomConfig;
export const selectYsLiveClient = (state: RootState) => state.ysLiveClient;
export const selectApp = (state: RootState) => state.app;

// roomConfig 相关选择器
export const selectRoomInfo = createSelector(
  [selectRoomConfig],
  (roomConfig) => roomConfig.roomInfo
);

export const selectLiveStage = createSelector(
  [selectRoomConfig],
  (roomConfig) => roomConfig.liveStage
);

export const selectIsStart = createSelector(
  [selectRoomConfig],
  (roomConfig) => roomConfig.isStart
);

export const selectIsTestLive = createSelector(
  [selectRoomConfig],
  (roomConfig) => roomConfig.isTestLive
);

// 设备相关选择器
export const selectCamera = createSelector(
  [selectRoomConfig],
  (roomConfig) => roomConfig.camera
);

export const selectMic = createSelector(
  [selectRoomConfig],
  (roomConfig) => roomConfig.mic
);

export const selectSpeaker = createSelector(
  [selectRoomConfig],
  (roomConfig) => roomConfig.speaker
);

export const selectIsOpenCamera = createSelector(
  [selectRoomConfig],
  (roomConfig) => roomConfig.isOpenCamera
);

export const selectIsOpenMic = createSelector(
  [selectRoomConfig],
  (roomConfig) => roomConfig.isOpenMic
);

// 设备列表选择器
export const selectCameraList = createSelector(
  [selectRoomConfig],
  (roomConfig) => roomConfig.cameraList
);

export const selectMicList = createSelector(
  [selectRoomConfig],
  (roomConfig) => roomConfig.micList
);

export const selectSpeakerList = createSelector(
  [selectRoomConfig],
  (roomConfig) => roomConfig.speakerList
);

export const selectScreenList = createSelector(
  [selectRoomConfig],
  (roomConfig) => roomConfig.screenList
);

// 摄像头位置选择器
export const selectCameraPosition = createSelector(
  [selectRoomConfig],
  (roomConfig) => roomConfig.cameraPosition
);

// 直播状态选择器
export const selectIsShareScreen = createSelector(
  [selectRoomConfig],
  (roomConfig) => roomConfig.isShareScreen
);

export const selectIsAnswering = createSelector(
  [selectRoomConfig],
  (roomConfig) => roomConfig.isAnswering
);

export const selectIsLotterying = createSelector(
  [selectRoomConfig],
  (roomConfig) => roomConfig.isLotterying
);

// 可见性选择器
export const selectTestVisibility = createSelector(
  [selectRoomConfig],
  (roomConfig) => roomConfig.testVisibility
);

export const selectFileVisibility = createSelector(
  [selectRoomConfig],
  (roomConfig) => roomConfig.fileVisibility
);

export const selectScreenVisibility = createSelector(
  [selectRoomConfig],
  (roomConfig) => roomConfig.screenVisibility
);

export const selectAnswerVisibility = createSelector(
  [selectRoomConfig],
  (roomConfig) => roomConfig.answerVisibility
);

export const selectLotteryActivityVisibility = createSelector(
  [selectRoomConfig],
  (roomConfig) => roomConfig.lotteryActivityVisibility
);

// 混流相关选择器
export const selectIsMix = createSelector(
  [selectRoomConfig],
  (roomConfig) => roomConfig.isMix
);

export const selectResolution = createSelector(
  [selectRoomConfig],
  (roomConfig) => roomConfig.resolution
);

// 调试和系统状态选择器
export const selectDebug = createSelector(
  [selectRoomConfig],
  (roomConfig) => roomConfig.debug
);

export const selectIsMirror = createSelector(
  [selectRoomConfig],
  (roomConfig) => roomConfig.isMirror
);

export const selectIsTested = createSelector(
  [selectRoomConfig],
  (roomConfig) => roomConfig.isTested
);

export const selectImIsLogin = createSelector(
  [selectRoomConfig],
  (roomConfig) => roomConfig.imIsLogin
);

// 复合选择器 - 设备状态概览
export const selectDeviceStatus = createSelector(
  [selectIsOpenCamera, selectIsOpenMic, selectCamera, selectMic, selectSpeaker],
  (isOpenCamera, isOpenMic, camera, mic, speaker) => ({
    isOpenCamera,
    isOpenMic,
    camera,
    mic,
    speaker
  })
);

// 复合选择器 - 直播状态概览
export const selectLiveStatus = createSelector(
  [selectLiveStage, selectIsStart, selectIsTestLive, selectIsShareScreen],
  (liveStage, isStart, isTestLive, isShareScreen) => ({
    liveStage,
    isStart,
    isTestLive,
    isShareScreen
  })
);

// 复合选择器 - 可见性状态概览
export const selectVisibilityStatus = createSelector(
  [
    selectTestVisibility,
    selectFileVisibility,
    selectScreenVisibility,
    selectAnswerVisibility,
    selectLotteryActivityVisibility
  ],
  (testVisibility, fileVisibility, screenVisibility, answerVisibility, lotteryActivityVisibility) => ({
    testVisibility,
    fileVisibility,
    screenVisibility,
    answerVisibility,
    lotteryActivityVisibility
  })
);

// 复合选择器 - 设备列表概览
export const selectDeviceLists = createSelector(
  [selectCameraList, selectMicList, selectSpeakerList, selectScreenList],
  (cameraList, micList, speakerList, screenList) => ({
    cameraList,
    micList,
    speakerList,
    screenList
  })
);

// ===========================================
// 路由状态选择器 (Router Selectors)
// ===========================================
export const selectRouter = (state: RootState) => state.router;
export const selectLocation = (state: RootState) => state.router?.location;
export const selectCurrentPath = (state: RootState) => state.router?.location?.pathname;
export const selectQueryParams = (state: RootState) => {
  const location = state.router?.location;
  if (!location?.search) return {};
  
  const searchParams = new URLSearchParams(location.search);
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
};

// 路由参数选择器
export const selectRouteParams = (state: RootState) => {
  const location = state.router?.location;
  if (!location?.pathname) return {};
  
  // 解析路径参数，例如 /live-room/:roomId
  const pathSegments = location.pathname.split('/');
  const params: Record<string, string> = {};
  
  // 这里可以根据实际路由结构来解析参数
  // 例如：/live-room/123 -> { roomId: '123' }
  if (pathSegments[1] === 'live-room' && pathSegments[2]) {
    params.roomId = pathSegments[2];
  }
  
  return params;
};

// 复合选择器 - 路由状态概览
export const selectRouteInfo = createSelector(
  [selectCurrentPath, selectQueryParams, selectRouteParams],
  (currentPath, queryParams, routeParams) => ({
    currentPath,
    queryParams,
    routeParams
  })
);