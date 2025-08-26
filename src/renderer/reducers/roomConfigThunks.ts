import { createAsyncThunk } from '@reduxjs/toolkit';
import { setValue, setList, setDevice } from './roomConfigSlice';
import { LIVE_STAGE, LIVE_ACTIONS, OPERATE_ACTION } from '../vars/room-vars';
import { LStorage } from '../utils/tools';
import errorLog from '../utils/errorLog';
import { RootState } from './index';

// API导入（需要根据实际项目路径调整）
import { 
  StartLive, 
  SendMsg, 
  AddOperateLog, 
  SaveTeacherAvDevice,
  StartMCUMixTranscode,
  StartWhiteBoardPush,
  CreateCommonMixStream,
  CancelCommonMixStream
} from '../api';


// 开始直播推流
export const startLiveAction = createAsyncThunk(
  'roomConfig/startLive',
  async (isTestLive: boolean, { dispatch, getState }) => {
    const state = getState() as RootState;
    const { roomConfig } = state;
    const { roomInfo } = roomConfig;
    const userInfo = LStorage.getItem('USER_INFO') || {};
    
    try {
      // 延迟2秒确保推流开始
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const res = await StartLive(roomInfo.room_id, userInfo.userId, userInfo.app, isTestLive);
      if (res.status.code === 200 && !isTestLive) {
        dispatch(setValue({ key: 'liveStage', value: LIVE_STAGE.CLASS_STAGE }));
      }
      return res;
    } catch (error) {
      console.warn(error);
      throw error;
    }
  }
);

// 设置日志
export const setLog = createAsyncThunk(
  'roomConfig/setLog',
  async (params: { action: LIVE_ACTIONS | string, logParams?: object }, { dispatch, getState }) => {
    const { action, logParams = {} } = params;
    const state = getState() as RootState;
    const { roomConfig } = state;
    const userInfo = LStorage.getItem('USER_INFO') || {};

    const isString = typeof action === 'string';
    
    // 记录日志
    setTimeout(() => {
      errorLog({
        code: isString ? action : LIVE_ACTIONS[action as LIVE_ACTIONS],
        log_type: "MESSAGE_LOG",
        request_data: {
          room_id: roomConfig?.roomInfo?.room_id,
          ...logParams
        },
        message: '' // 这里需要根据实际情况设置消息内容
      });
    }, 300);

    if (!isString) {
      // 通过IM同步主播操作
      try {
        const res = await SendMsg(roomConfig.roomInfo.room_id, userInfo.userId, {
          type: 'liveSystemNotice',
          action: LIVE_ACTIONS[action as LIVE_ACTIONS],
          role: userInfo.role
        });
        if (res.status.code !== 200) {
          console.warn(res);
        }
      } catch (error) {
        console.warn(error);
      }
    }

    return action;
  }
);

// 操作日志
export const setOperateLog = createAsyncThunk(
  'roomConfig/setOperateLog',
  async (params: { operate_action_code: OPERATE_ACTION, after_action_content?: object }, { dispatch, getState }) => {
    const { operate_action_code, after_action_content = {} } = params;
    const state = getState() as RootState;
    const { roomConfig } = state;
    const userInfo = LStorage.getItem('USER_INFO') || {};
    
    const param = {
      room_id: roomConfig?.roomInfo?.room_id,
      operate_action_code: operate_action_code,
      operate_uid: userInfo.userId,
      source: "TEACHER_SOURCE",
      after_action_content: JSON.stringify(after_action_content)
    };
    
    try {
      const res = await AddOperateLog(param);
      if (res.status.code !== 200) {
        console.warn(res);
      }
      return res;
    } catch (error) {
      console.warn(error);
      throw error;
    }
  }
);

// 更新混流模板
export const updateMixLiveAction = createAsyncThunk(
  'roomConfig/updateMixLive',
  async (_, { dispatch, getState }) => {
    const state = getState() as RootState;
    const { roomConfig } = state;
    const { roomInfo, isOpenCamera, cameraPosition, isShareScreen, videoCallUserList } = roomConfig;
    const userInfo = LStorage.getItem('USER_INFO') || {};
    
    const main_stream = isShareScreen ? 1 : 0; // 1屏幕分享 0白板
    const connect_user_info = videoCallUserList.map((user: any) => ({
      connect_user_id: user.userId,
      student_camera: user.video === 1 ? true : false
    }));
    
    try {
      const res = await StartMCUMixTranscode(
        roomInfo.room_id, 
        userInfo.userId, 
        isOpenCamera, 
        cameraPosition.type, 
        main_stream, 
        connect_user_info, 
        roomInfo.display_type
      );
      
      if (res.status.code !== 200) {
        console.warn(res);
      }
      
      return res;
    } catch (error) {
      console.warn(error);
      throw error;
    }
  }
);

// 开始白板推流
export const startBoardPushAction = createAsyncThunk(
  'roomConfig/startBoardPush',
  async (_, { dispatch, getState }) => {
    const state = getState() as RootState;
    const { roomConfig } = state;
    const { roomInfo } = roomConfig;
    const userInfo = LStorage.getItem('USER_INFO') || {};
    
    try {
      const res = await StartWhiteBoardPush(roomInfo.room_id, userInfo.userId, userInfo.app);
      if (res.status.code !== 200) {
        console.warn(res);
      }
      return res;
    } catch (error) {
      console.warn(error);
      throw error;
    }
  }
);

// 开始混流
export const startStreamMix = createAsyncThunk(
  'roomConfig/startStreamMix',
  async (_, { dispatch, getState }) => {
    const state = getState() as RootState;
    const { roomConfig } = state;
    const { roomInfo, isOpenCamera, isStart } = roomConfig;
    const userInfo = LStorage.getItem('USER_INFO') || {};

    if (isStart) {
      try {
        // 延迟2秒确保推流开始后再调用混流接口
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const res = await CreateCommonMixStream(roomInfo.room_id, userInfo.userId, userInfo.app, isOpenCamera);
        if (res.status.code === 200) {
          dispatch(setValue({ key: 'isMix', value: 1 }));
        } else {
          console.warn(res);
        }
        return res;
      } catch (error) {
        console.warn(error);
        throw error;
      }
    }
    
    return null;
  }
);

// 停止混流
export const stopStreamMix = createAsyncThunk(
  'roomConfig/stopStreamMix',
  async (_, { dispatch, getState }) => {
    const state = getState() as RootState;
    const { roomConfig } = state;
    const { roomInfo, isStart } = roomConfig;
    const userInfo = LStorage.getItem('USER_INFO') || {};

    if (isStart) {
      try {
        // 延迟500ms确保操作顺序正确
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const res = await CancelCommonMixStream(roomInfo.room_id, userInfo.userId, userInfo.app);
        if (res.status.code === 200) {
          dispatch(setValue({ key: 'isMix', value: 2 }));
        } else {
          console.warn(res);
        }
        return res;
      } catch (error) {
        console.warn(error);
        throw error;
      }
    }
    
    return null;
  }
);

// 设备切换
export const setDeviceThunk = createAsyncThunk(
  'roomConfig/setDevice',
  async (params: { name: string, info: { deviceId?: string, volume?: number } }, { dispatch, getState }) => {
    const { name, info } = params;
    const state = getState() as RootState;
    const { ysLiveClient, roomConfig } = state;
    const { cameraList, speakerList, micList } = roomConfig;
    const { deviceId, volume } = info;

    let device = { ...roomConfig[name] };

    if (ysLiveClient && deviceId) {
      switch (name) {
        case "speaker":
          let speaker = speakerList.find((item: any) => item.deviceId === deviceId);
          device = {
            ...device,
            ...speaker
          };
          (ysLiveClient as any).setCurrentSpeaker(device.deviceId);
          break;
        case "camera":
          let camera = cameraList.find((item: any) => item.deviceId === deviceId);
          device = {
            ...device,
            ...camera
          };
          (ysLiveClient as any).setCurrentCamera(device.deviceId);
          try {
            const cameraParam = {
              room_id: roomConfig?.roomInfo?.room_id,
              av_device_type: 2,
              device: JSON.stringify({
                deviceList: cameraList,
                currentDeviceId: device.deviceId,
                isUse: roomConfig.isOpenCamera
              })
            };
            const res = await SaveTeacherAvDevice(cameraParam);
            if (res.status.code !== 200) {
              console.warn(res);
            }
          } catch (error) {
            console.warn(error);
          }
          break;
        case "mic":
          let mic = micList.find((item: any) => item.deviceId === deviceId);
          device = {
            ...device,
            ...mic
          };
          (ysLiveClient as any).setCurrentMic(device.deviceId);
          try {
            const micParam = {
              room_id: roomConfig?.roomInfo?.room_id,
              av_device_type: 1,
              device: JSON.stringify({
                deviceList: micList,
                currentDeviceId: device.deviceId,
                isUse: roomConfig.mic.volume > 0 ? true : false
              })
            };
            const res = await SaveTeacherAvDevice(micParam);
            if (res.status.code !== 200) {
              console.warn(res);
            }
          } catch (error) {
            console.warn(error);
          }
          break;
      }
    }

    if (ysLiveClient && volume !== undefined && name !== 'camera') {
      device = {
        ...device,
        volume
      };
      switch (name) {
        case "speaker":
          ysLiveClient.setAudioPlayoutVolume(volume);
          break;
        case "mic":
          ysLiveClient.setAudioCaptureVolume(volume);
          try {
            const micParam = {
              room_id: roomConfig?.roomInfo?.room_id,
              av_device_type: 1,
              device: JSON.stringify({
                deviceList: roomConfig.micList,
                currentDeviceId: device.deviceId,
                isUse: volume > 0 ? true : false
              })
            };
            const res = await SaveTeacherAvDevice(micParam);
            if (res.status.code !== 200) {
              console.warn(res);
            }
          } catch (error) {
            console.warn(error);
          }
          break;
      }
    }

    dispatch(setDevice({ name, device }));
    return device;
  }
);

// 设备变更处理
export const deviceChangeAction = createAsyncThunk(
  'roomConfig/deviceChange',
  async (params: { 
    result: { data: any }, 
    ysLiveClient: any 
  }, { dispatch, getState }) => {
    const { result, ysLiveClient } = params;
    const state = getState() as RootState;
    const { roomConfig } = state;
    const { camera, mic, speaker, cameraList, speakerList, micList } = roomConfig;

    const payload = result.data;
    if (!payload) return;

    const { type, deviceId, state: deviceState } = payload;

    // 设备类型映射
    const typeObj: any = {
      0: 'camera',    // TRTCDeviceType.TRTCDeviceTypeCamera
      1: 'mic',       // TRTCDeviceType.TRTCDeviceTypeMic
      2: 'speaker',   // TRTCDeviceType.TRTCDeviceTypeSpeaker
      3: 'unknown'    // TRTCDeviceType.TRTCDeviceTypeUnknown
    };

    // 设备状态映射
    const stateObj: any = {
      0: 'add',       // TRTCDeviceState.TRTCDeviceStateAdd
      1: 'remove',    // TRTCDeviceState.TRTCDeviceStateRemove
      2: 'active'     // TRTCDeviceState.TRTCDeviceStateActive
    };

    // 处理摄像头设备变更
    if (type === 0) { // TRTCDeviceType.TRTCDeviceTypeCamera
      dispatch(setList({ name: 'camera', list: ysLiveClient.getCameraList() }));
      
      let select = false;
      if (deviceState === 1) { // TRTCDeviceState.TRTCDeviceStateRemove
        // 选择设备被移除了，尝试选择其他设备
        if (camera?.deviceId === deviceId) {
          select = true;
        }
      } else if (deviceState === 0) { // TRTCDeviceState.TRTCDeviceStateAdd
        // 如果之前没有设备，此时添加了设备，则重新选择
        if (!camera?.deviceId || camera.deviceId === '') {
          select = true;
        }
        // 显示通知
        const { notification } = await import('antd');
        notification.info({
          message: '通知',
          description: '您有新的摄像头可以使用！'
        });
      }

      if (cameraList.length > 0 && select) {
        // 重新选择设备后需要重新打开采集摄像头
        dispatch(setDevice({
          name: 'camera',
          device: {
            deviceId: cameraList[0]?.deviceId || ''
          }
        }));
      }
    }
    
    // 处理麦克风设备变更
    else if (type === 1) { // TRTCDeviceType.TRTCDeviceTypeMic
      dispatch(setList({ name: 'mic', list: ysLiveClient.getMicList() }));
      
      let select = false;
      if (deviceState === 1) { // TRTCDeviceState.TRTCDeviceStateRemove
        // 选择设备被移除了，尝试选择其他设备
        if (mic?.deviceId === deviceId) {
          select = true;
        }
      } else if (deviceState === 0) { // TRTCDeviceState.TRTCDeviceStateAdd
        // 如果之前没有设备，此时添加了设备，则重新选择
        if (!mic?.deviceId || mic.deviceId === '') {
          select = true;
        }
        // 显示通知
        const { notification } = await import('antd');
        notification.info({
          message: '通知',
          description: '您有新的麦克风可以使用！'
        });
        
        // 特殊处理：如果是 TRTC 设备，直接选择
        let curMic: any = ysLiveClient.getCurrentMic();
        if (curMic?.deviceName?.indexOf('TRTC') !== -1) {
          dispatch(setDevice({
            name: 'mic',
            device: { deviceId }
          }));
          return;
        }
      } else if (deviceState === 2) { // TRTCDeviceState.TRTCDeviceStateActive
        console.log('麦克风启用了', deviceId);
        dispatch(setDevice({
          name: 'mic',
          device: { deviceId }
        }));
      }

      if (micList.length > 0 && select) {
        // 重新选择设备后需要重新打开采集摄像头
        dispatch(setDevice({
          name: 'mic',
          device: {
            deviceId: micList[0]?.deviceId || ''
          }
        }));
      }
    }
    
    // 处理扬声器设备变更
    else if (type === 2) { // TRTCDeviceType.TRTCDeviceTypeSpeaker
      dispatch(setList({ name: 'speaker', list: ysLiveClient.getSpeakerList() }));
      
      let select = false;
      if (deviceState === 1) { // TRTCDeviceState.TRTCDeviceStateRemove
        // 选择设备被移除了，尝试选择其他设备
        if (speaker?.deviceId === deviceId) {
          select = true;
        }
      } else if (deviceState === 0) { // TRTCDeviceState.TRTCDeviceStateAdd
        // 如果之前没有设备，此时添加了设备，则重新选择
        if (!speaker?.deviceId || speaker.deviceId === '') {
          select = true;
        }
        // 显示通知
        const { notification } = await import('antd');
        notification.info({
          message: '通知',
          description: '您有新的扬声器可以使用！'
        });
      }

      if (speakerList.length > 0 && select) {
        // 重新选择设备后需要重新打开采集摄像头
        dispatch(setDevice({
          name: 'speaker',
          device: {
            deviceId: speakerList[0]?.deviceId || ''
          }
        }));
      }
    }

    // 记录日志
    dispatch(setLog({
      action: LIVE_ACTIONS.DeviceChange,
      logParams: {
        type: result?.data?.type,
        deviceId: result?.data?.deviceId,
        state: result?.data?.state,
        changeMsg: typeObj[result?.data?.type] + '-' + stateObj[result?.data?.state] + '-' + result?.data?.deviceId
      }
    }));

    return result;
  }
);

// 摄像头控制
export const toggleCamera = createAsyncThunk(
  'roomConfig/toggleCamera',
  async (isOpen: boolean, { dispatch, getState }) => {
    const state = getState() as RootState;
    const { ysLiveClient, roomConfig } = state;
    
    dispatch(setValue({ key: 'isOpenCamera', value: isOpen }));
    
    if (ysLiveClient) {
      if (isOpen) {
        ysLiveClient.startLocalPreview();
        
        // 记录日志
        dispatch(setLog({ 
          action: LIVE_ACTIONS.anchorOpenCamera,
          logParams: { isOpen }
        }));
      } else {
        ysLiveClient.stopLocalPreview();
        
        // 记录日志
        dispatch(setLog({ 
          action: LIVE_ACTIONS.anchorCloseCamera,
          logParams: { isOpen }
        }));
      }
      
      // 更新混流模板
      dispatch(updateMixLiveAction());
    }
    
    return isOpen;
  }
);

// 麦克风控制
export const toggleMic = createAsyncThunk(
  'roomConfig/toggleMic',
  async (isOpen: boolean, { dispatch, getState }) => {
    const state = getState() as RootState;
    const { ysLiveClient, roomConfig } = state;
    
    dispatch(setValue({ key: 'isOpenMic', value: isOpen }));
    
    if (ysLiveClient) {
      if (isOpen) {
        ysLiveClient.startLocalAudio();
        
        // 记录日志
        dispatch(setLog({ 
          action: LIVE_ACTIONS.anchorSetMicVolume,
          logParams: { volume: roomConfig.mic.volume }
        }));
      } else {
        ysLiveClient.stopLocalAudio();
        
        // 记录日志
        dispatch(setLog({ 
          action: LIVE_ACTIONS.anchorSetMicVolume,
          logParams: { volume: 0 }
        }));
      }
    }
    
    return isOpen;
  }
);

// 屏幕共享控制
export const toggleScreenShare = createAsyncThunk(
  'roomConfig/toggleScreenShare',
  async (isShare: boolean, { dispatch, getState }) => {
    const state = getState() as RootState;
    const { ysLiveClient, roomConfig } = state;
    
    dispatch(setValue({ key: 'isShareScreen', value: isShare }));
    
    if (ysLiveClient) {
      if (isShare) {
        // 开始屏幕共享的逻辑
        ysLiveClient.startScreenCapture();
        
        // 记录日志
        dispatch(setLog({ 
          action: LIVE_ACTIONS.startCapturShare
        }));
      } else {
        // 停止屏幕共享的逻辑
        ysLiveClient.stopScreenCapture();
        
        // 记录日志
        dispatch(setLog({ 
          action: LIVE_ACTIONS.stopCapturShare
        }));
      }
      
      // 更新混流模板
      dispatch(updateMixLiveAction());
    }
    
    return isShare;
  }
);