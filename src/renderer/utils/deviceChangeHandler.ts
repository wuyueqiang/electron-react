import { notification } from 'antd';
import { TRTCDeviceType, TRTCDeviceState } from 'trtc-electron-sdk/liteav/trtc_define';
import { DeviceChangeParams } from '../vars/room-vars';
import { setList, setDevice } from '../reducers/roomConfigSlice';

// 设备变更处理函数
export const handleDeviceChange = (
  result: { data: DeviceChangeParams | null },
  ysLiveClient: any,
  dispatch: any
) => {
  const payload = result.data;
  if (!payload) return;

  const { type, deviceId, state } = payload;

  // 设备类型映射
  const typeObj: any = {
    [TRTCDeviceType.TRTCDeviceTypeCamera]: 'camera',
    [TRTCDeviceType.TRTCDeviceTypeMic]: 'mic',
    [TRTCDeviceType.TRTCDeviceTypeSpeaker]: 'speaker',
    [TRTCDeviceType.TRTCDeviceTypeUnknown]: 'unknown'
  };

  // 设备状态映射
  const stateObj: any = {
    [TRTCDeviceState.TRTCDeviceStateAdd]: 'add',
    [TRTCDeviceState.TRTCDeviceStateRemove]: 'remove',
    [TRTCDeviceState.TRTCDeviceStateActive]: 'active'
  };

  console.log('设备变更:', {
    type: typeObj[type],
    deviceId,
    state: stateObj[state],
    changeMsg: `${typeObj[type]}-${stateObj[state]}-${deviceId}`
  });

  // 处理摄像头设备变更
  if (type === TRTCDeviceType.TRTCDeviceTypeCamera) {
    handleCameraChange(deviceId, state, ysLiveClient, dispatch);
  }
  
  // 处理麦克风设备变更
  else if (type === TRTCDeviceType.TRTCDeviceTypeMic) {
    handleMicChange(deviceId, state, ysLiveClient, dispatch);
  }
  
  // 处理扬声器设备变更
  else if (type === TRTCDeviceType.TRTCDeviceTypeSpeaker) {
    handleSpeakerChange(deviceId, state, ysLiveClient, dispatch);
  }
};

// 处理摄像头变更
const handleCameraChange = (deviceId: string, state: string | number, ysLiveClient: any, dispatch: any) => {
  if (state === TRTCDeviceState.TRTCDeviceStateAdd) {
    notification.info({
      message: '通知',
      description: '您有新的摄像头可以使用！'
    });
  }
  
  // 更新设备列表
  const cameraList = ysLiveClient.getCameraList();
  dispatch(setList({ name: 'camera', list: cameraList }));
  
  // 如果当前设备被移除，选择其他设备
  if (state === TRTCDeviceState.TRTCDeviceStateRemove) {
    const currentCamera = ysLiveClient.getCurrentCamera();
    if (currentCamera?.deviceId === deviceId && cameraList.length > 0) {
      dispatch(setDevice({
        name: 'camera',
        device: {
          deviceId: cameraList[0]?.deviceId || ''
        }
      }));
    }
  }
};

// 处理麦克风变更
const handleMicChange = (deviceId: string, state: string | number, ysLiveClient: any, dispatch: any) => {
  if (state === TRTCDeviceState.TRTCDeviceStateAdd) {
    notification.info({
      message: '通知',
      description: '您有新的麦克风可以使用！'
    });
    
    // 特殊处理：如果是 TRTC 设备，直接选择
    const curMic = ysLiveClient.getCurrentMic();
    if (curMic?.deviceName?.indexOf('TRTC') !== -1) {
      dispatch(setDevice({
        name: 'mic',
        device: { deviceId }
      }));
      return;
    }
  }
  
  if (state === TRTCDeviceState.TRTCDeviceStateActive) {
    console.log('麦克风启用了', deviceId);
    dispatch(setDevice({
      name: 'mic',
      device: { deviceId }
    }));
  }
  
  // 更新设备列表
  const micList = ysLiveClient.getMicList();
  dispatch(setList({ name: 'mic', list: micList }));
  
  // 如果当前设备被移除，选择其他设备
  if (state === TRTCDeviceState.TRTCDeviceStateRemove) {
    const currentMic = ysLiveClient.getCurrentMic();
    if (currentMic?.deviceId === deviceId && micList.length > 0) {
      dispatch(setDevice({
        name: 'mic',
        device: {
          deviceId: micList[0]?.deviceId || ''
        }
      }));
    }
  }
};

// 处理扬声器变更
const handleSpeakerChange = (deviceId: string, state: string | number, ysLiveClient: any, dispatch: any) => {
  if (state === TRTCDeviceState.TRTCDeviceStateAdd) {
    notification.info({
      message: '通知',
      description: '您有新的扬声器可以使用！'
    });
  }
  
  // 更新设备列表
  const speakerList = ysLiveClient.getSpeakerList();
  dispatch(setList({ name: 'speaker', list: speakerList }));
  
  // 如果当前设备被移除，选择其他设备
  if (state === TRTCDeviceState.TRTCDeviceStateRemove) {
    const currentSpeaker = ysLiveClient.getCurrentSpeaker();
    if (currentSpeaker?.deviceId === deviceId && speakerList.length > 0) {
      dispatch(setDevice({
        name: 'speaker',
        device: {
          deviceId: speakerList[0]?.deviceId || ''
        }
      }));
    }
  }
};
