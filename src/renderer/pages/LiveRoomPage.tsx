import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Rect,
  TRTCDeviceType,
  TRTCDeviceState,
  TRTCVideoStreamType,
  TRTCVideoResolutionMode,
} from 'trtc-electron-sdk/liteav/trtc_define';
import {
  LIVE_STAGE,
  CameraStreamEncoderParams,
  StreamEncoderParams,
  BoardStreamEncoderParams,
  CameraPositions,
  BeautyStyles,
  OPERATE_ACTION,
  VideoCallUserParams,
  LIVE_ACTIONS,
} from '../vars/room-vars';
import os from 'os';
// import { execSync } from 'child_process'
import { VERSION } from '../config/index';
import { Modal, message, notification, Button } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import YSElectronLive from '../plugins/live';
import './LiveRoomPage.scss';
import { selectRoomConfig, selectRouteParams } from '../reducers/index';
import {
  setValue,
  setList,
  setDevice,
  setLog,
  toggleCamera,
  toggleMic,
  setVisibility,
} from '../reducers/roomConfigSlice';
import { initYsLiveClient } from '../reducers/ysLiveClientSlice';
import { LStorage } from '../utils/tools';
import {
  enterLiveRoom,
  TeacherQuitRoom,
  SaveTeacherAvDevice,
  CancelLive,
  StopWhiteBoardPush,
} from '../api';
import {
  startBoardPushAction,
  updateMixLiveAction,
} from '../reducers/roomConfigThunks';
import Test from '../components/Test';
import Board from '../components/Board';
import ControlBar from '../components/ControlBar';
import Chat from '../components/Chat';
import Pendant from '../components/Pendant';
import DraggableModal from '../components/common/DraggableModal';
import ScreenList from '../components/ScreenList';
import Answer from '../components/Answer';
import LotteryActivity from '../components/lottery/LotteryActivity';
import LotteryWinnerList from '../components/lottery/LotteryWinnerList';

import { handleDeviceChange } from '../utils/deviceChangeHandler';

// @ts-ignore
let ysLiveClient: any = null;
let testLive: boolean = false; // 是否是测试直播

function LiveRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const userInfo = LStorage.getItem('USER_INFO') || {};
  console.log('userInfo', userInfo);
  const refCurrentScreen: any = useRef({});
  const refScreenList: any = useRef([]);
  const isStartRef: any = useRef(false);
  const cameraPositionRef: any = useRef(CameraPositions[1]);
  const [currentBeautyStyle, setCurrentBeautyStyle] = useState(BeautyStyles[0]);
  const [isShowOutModal, setIsShowOutModal] = useState(false);
  const [showLoadingVisibility, setShowLoadingVisibility] = useState(false);
  const [lotteryTask, setLotteryTask] = useState({
    draw_interval: 0,
    is_join_lottery: false,
    lottery_task_id: 0,
    prize_img: '',
  });
  const navigate = useNavigate();
  const dispatch = useDispatch();
  let EVENT: any;

  // 使用Redux选择器获取状态
  const roomConfig = useSelector(selectRoomConfig);
  const {
    roomInfo,
    isStart,
    isOpenCamera,
    screenVisibility,
    screenList,
    cameraList,
    micList,
    speakerList,
    isMirror,
    isTested,
    testVisibility,
    visibilityStatus,
    liveStatus,
    cameraPosition,
    isOpenMic,
    deviceStatus,
    liveBGM,
    liveStage,
  } = roomConfig;
  const routeParams = useSelector(selectRouteParams);

  const [availableCameraResolution, setAvailableCameraResolution] = useState(
    [],
  );
  const [showVideoSettingVisibility, setShowVideoSettingVisibility] =
    useState(false);

  const [currentCameraStreamEncoder, setCurrentCameraStreamEncoder] = useState(
    CameraStreamEncoderParams[2],
  );

  function onError(result: any) {
    console.log('onError', result);
  }

  function onStartLivePush(result: any) {
    console.log('onStartLivePush', result);
  }

  // 监听TIM 加入群组结果
  function onTimJoinGroup(result: any) {
    console.log('====onTimJoinGroup', result);
    // im登陆成功
    if (result?.data?.code == 0) {
      //设置im正常
      dispatch(setValue({ key: 'imIsLogin', value: true }));
    }
    // im组不存在或已被解散
    if (result?.data?.code == 10010) {
      // log(result, 'ERR')
    }
    // dispatch(setLog(LIVE_ACTIONS.TimJoinGroup, {
    //     joinCode: result?.data?.code,
    //     joinStatus: result?.data?.data?.status,
    //     joinEventCode: result?.eventCode
    // }))
  }
  // 监听外接设备的插拔
  function onDeviceChange(result: any) {
    console.log('onDeviceChange-------------', result);

    // 使用工具函数处理设备变更
    handleDeviceChange(result, ysLiveClient, dispatch);
  }

  // 监听其他讲师进入直播间消息
  function onMessageReceived(item: { data: any; eventCode: string }) {
    let data = item.data;
    if (data.type == 'liveSystemNotice' && data.action == 'anchorEnterRoom') {
      setIsShowOutModal(true);
      setTimeout(() => {
        quitApp();
      }, 2000);
    }
  }

  function quitApp() {
    window.electron?.ipcRenderer.sendMessage('exit');
  }

  // 订阅回调
  function bindEvent() {
    ysLiveClient.on(ysLiveClient.EVENT.ERROR, onError);
    ysLiveClient.on(ysLiveClient.EVENT.START_LIVE_PUSH, onStartLivePush);
    ysLiveClient.on(ysLiveClient.EVENT.TRTC_DEVICE_CHANGE, onDeviceChange);
    // // ysLiveClient.on(ysLiveClient.EVENT.TRTC_SCREEN_CAPTURE_COVERED, onScreenCaptureCovered)
    // ysLiveClient.on(ysLiveClient.EVENT.TRTC_SCREEN_CAPTURE_STARTED, onScreenCaptureStarted)
    // ysLiveClient.on(ysLiveClient.EVENT.TRTC_SCREEN_CAPTURE_STOPPED, onScreenCaptureStopped)
    // ysLiveClient.on(ysLiveClient.EVENT.TRTC_CONNECTION_LOST, onConnectionLost)
    // ysLiveClient.on(ysLiveClient.EVENT.TRTC_TRY_TO_RECONNECT, onTryToReconnect)
    // ysLiveClient.on(ysLiveClient.EVENT.TRTC_CONNECTION_RECOVERY, onConnectionRecovery)
    ysLiveClient.on(ysLiveClient.EVENT.TIM_JOIN_GROUP, onTimJoinGroup);
    ysLiveClient.on(
      ysLiveClient.EVENT.TIM_TEACHER_ENTER_RECEIVED,
      onMessageReceived,
    );
    // ysLiveClient.on(ysLiveClient.EVENT.LOTTERY_MSG_RECEIVED, onLotteryReceived);
  }

  // 取消订阅
  function unBindEvent() {
    ysLiveClient.off(ysLiveClient.EVENT.ERROR, onError);
    ysLiveClient.off(ysLiveClient.EVENT.START_LIVE_PUSH, onStartLivePush);
    ysLiveClient.off(ysLiveClient.EVENT.TRTC_DEVICE_CHANGE, onDeviceChange);
    ysLiveClient.off(ysLiveClient.EVENT.TIM_JOIN_GROUP, onTimJoinGroup);
    // // ysLiveClient.off(ysLiveClient.EVENT.TRTC_SCREEN_CAPTURE_COVERED, onScreenCaptureCovered)
    // ysLiveClient.off(ysLiveClient.EVENT.TRTC_SCREEN_CAPTURE_STARTED, onScreenCaptureStarted)
    // ysLiveClient.off(ysLiveClient.EVENT.TRTC_SCREEN_CAPTURE_STOPPED, onScreenCaptureStopped)
    // ysLiveClient.off(ysLiveClient.EVENT.TRTC_CONNECTION_LOST, onConnectionLost)
    // ysLiveClient.off(ysLiveClient.EVENT.TRTC_TRY_TO_RECONNECT, onTryToReconnect)
    // ysLiveClient.off(ysLiveClient.EVENT.TRTC_CONNECTION_RECOVERY, onConnectionRecovery)
    ysLiveClient.off(
      ysLiveClient.EVENT.TIM_TEACHER_ENTER_RECEIVED,
      onMessageReceived,
    );
    // ysLiveClient.off(ysLiveClient.EVENT.LOTTERY_MSG_RECEIVED, onLotteryReceived);
  }

  // 进入房间
  function initDeviceList() {
    // 初始化设备
    const cameraListData = ysLiveClient.getCameraList();
    const speakerListData = ysLiveClient.getSpeakerList();
    console.log('===speakerListData', speakerListData);

    const micListData = ysLiveClient.getMicList();
    dispatch(setList({ name: 'camera', list: cameraListData }));
    dispatch(setList({ name: 'speaker', list: speakerListData }));
    dispatch(setList({ name: 'mic', list: micListData }));

    dispatch(
      setDevice({
        name: 'camera',
        device: {
          deviceId: ysLiveClient.getCameraList()[0]?.deviceId || '',
          deviceName: ysLiveClient.getCameraList()[0]?.deviceName || '',
          isOpen: true,
        },
      }),
    );
    let curSpeaker: any = ysLiveClient.getCurrentSpeaker();
    let curSpeakerVolume: number = ysLiveClient.getAudioPlayoutVolume();
    console.log('===curSpeaker', curSpeaker);
    console.log('===curSpeakerVolume', curSpeakerVolume);

    dispatch(
      setDevice({
        name: 'speaker',
        device: {
          deviceId: curSpeaker.deviceId,
          volume: curSpeakerVolume,
          deviceName: curSpeaker.deviceName,
          isOpen: true,
        },
      }),
    );
    let curMic: any = ysLiveClient.getCurrentMic();
    dispatch(
      setDevice({
        name: 'mic',
        device: {
          deviceId: curMic.deviceId,
          volume: 0,
          deviceName: curMic.deviceName,
          isOpen: true,
        },
      }),
    );
    // 初始化镜像模式
    setMirror(isMirror);

    // 初始化美颜
    setBeautyStyle(currentBeautyStyle);
  }

  // 美颜设置
  function setBeautyStyle(item: any) {
    setCurrentBeautyStyle(item);
    ysLiveClient.setBeautyStyle({
      beautyStyle: item.beautyStyle,
      beauty: item.beauty,
      white: item.white,
      ruddiness: item.ruddiness,
    });
    // dispatch(
    //   setLog(LIVE_ACTIONS.setBeautyStyle, {
    //     label: item?.label,
    //   }),
    // );
  }

  // 镜像切换
  function setMirror(mirror: boolean) {
    dispatch(setValue({ key: 'isMirror', value: mirror }));
    ysLiveClient.setLocalViewMirror(mirror);
    ysLiveClient.setVideoEncoderMirror(mirror);
    // dispatch(setLog(LIVE_ACTIONS.setMirror, {
    //     mirror
    // }))
  }

  // 关闭应用
  function onCloseWindow() {
    if (testLive) {
      message.warning('请先结束测试！');
      return;
    }

    if (isStartRef.current) {
      message.warning('请先下课！');
      return;
    }

    exitRoom('closeWindow');
  }

  // 离开直播间
  function exitRoom(type: string | undefined) {
    if (!isStart) {
      setShowLoadingVisibility(true);
      // dispatch(setLog(LIVE_ACTIONS.anchorExitRoom));
      ysLiveClient.exitRoom();
      if (!roomInfo.room_id) {
        // _exitRoom()
        liveRoom(type);
        return;
      }
      TeacherQuitRoom(roomInfo.room_id)
        .then((res) => {
          if (res.status.code == 200) {
            // _exitRoom()
            liveRoom(type);
          } else {
            message.error(`${res.status.code}-${res.status.msg}`);
            // _exitRoom()
            liveRoom(type);
          }
        })
        .catch((error) => {
          console.warn(error);
          // _exitRoom()
          liveRoom(type);
        });
    } else {
      message.warning('请先下课！');
    }
  }

  function liveRoom(type: string | undefined) {
    if (type == 'closeWindow') {
      _exitRoom();
    } else {
      goLiveListPage();
    }
  }

  function _exitRoom() {
    // console.log('_exitRoom');
    // dispatch(setOperateLog(OPERATE_ACTION.teacher_close_soft, {}));
    ysLiveClient.exitRoom();
    setTimeout(() => {
      window.electron?.ipcRenderer.sendMessage('exit');
    }, 500);
  }

  function goLiveListPage() {
    const liveStatus = routeParams?.liveStatus;
    const sortType = routeParams?.sortType;
    navigate('/live-list', {
      state: {
        liveStatus,
        sortType,
      },
    });
  }

  // 打开摄像头
  function muteLocalVideo() {
    if (!isStart) {
      notification.warning({
        message: '通知',
        description: '直播开始才可以打开摄像头',
      });
      return;
    }
    dispatch(setValue({ key: 'isOpenCamera', value: !isOpenCamera }));
    uploadTeacherAvDevice(!isOpenCamera);
    // if (!isOpenCamera) {
    //     dispatch(setLog(LIVE_ACTIONS.anchorCloseCamera))
    // } else {
    //     dispatch(setLog(LIVE_ACTIONS.anchorOpenCamera))
    // }
    dispatch(updateMixLiveAction() as any);
  }

  // 开始直播
  function startLivePush(is_test: boolean) {
    if (!isTested) {
      notification.warning({
        message: '通知',
        description: '直播开始前请进行设备检测',
      });
      return;
    }
    let cameraView = document.getElementById('room-camera-view');

    ysLiveClient.startLivePush({
      cameraView,
    });

    // 设置摄像头画面质量
    changeCameraStreamEncoder(currentCameraStreamEncoder);

    dispatch(setValue({ key: 'isStart', value: true }));
    dispatch(setValue({ key: 'isOpenCamera', value: true }));
    dispatch(setValue({ key: 'isOpenMic', value: true }));
    dispatch(setValue({ key: 'isTestLive', value: is_test }));
    testLive = is_test;

    uploadTeacherAvDevice(true);
    dispatch(
      setDevice({
        name: 'mic',
        device: {
          volume: 100,
        },
      }),
    );

    window.electron?.ipcRenderer.sendMessage('startLivePush');

    // dispatch(setLog(LIVE_ACTIONS.anchorStartPush));

    startBoardPush();
  }

  // 开始白板推流
  function startBoardPush() {
    dispatch(startBoardPushAction() as any);
    // dispatch(setLog(LIVE_ACTIONS.startBoardPush));
  }

  // 停止直播推流
  function stopLivePush(endLive: boolean) {
    ysLiveClient.stopLivePush();
    dispatch(setValue({ key: 'isStart', value: false }));
    dispatch(setValue({ key: 'isOpenCamera', value: false }));
    dispatch(setValue({ key: 'isTestLive', value: false }));
    testLive = false;
    dispatch(
      setDevice({
        name: 'mic',
        device: {
          volume: 0,
        },
      }),
    );
    ysLiveClient.stopSystemAudioLoopback();
    ysLiveClient.stopScreenCapture();
    window.electron?.ipcRenderer.sendMessage('stopLivePush');
    // dispatch(setLog(LIVE_ACTIONS.anchorStopPush));
    // dispatch(setLog(LIVE_ACTIONS.stopBoardPush));

    Promise.all([
      StopWhiteBoardPush(roomInfo.room_id, userInfo.userId),
      CancelLive(roomInfo.room_id, userInfo.userId, userInfo.app, endLive),
    ]).then((res) => {
      // console.log('res', res)
      if (res[0].status.code != 200) {
        message.error(`${res[0].status.code}-${res[0].status.msg}`);
      }
      if (res[1].status.code != 200) {
        message.error(`${res[1].status.code}-${res[1].status.msg}`);
      } else {
        // 修改状态为已结束
        if (endLive) {
          dispatch(setValue({ key: 'liveStage', value: LIVE_STAGE.END_STAGE }));
        }
      }
    });
  }

  // 设置摄像头画面质量
  function changeCameraStreamEncoder(params: StreamEncoderParams) {
    const { videoResolution, videoFps, videoBitrate, minVideoBitrate } = params;
    setCurrentCameraStreamEncoder(params);
    ysLiveClient.setVideoEncoderParam({
      videoResolution,
      videoFps,
      videoBitrate,
      minVideoBitrate,
      // resMode: roomInfo.display_type == 1 ? TRTCVideoResolutionMode.TRTCVideoResolutionModePortrait : TRTCVideoResolutionMode.TRTCVideoResolutionModeLandscape
      resMode: TRTCVideoResolutionMode.TRTCVideoResolutionModeLandscape,
    });
    // dispatch(
    //   setLog(LIVE_ACTIONS.anchorSetVideoResolution, {
    //     videoResolution: params.videoResolution,
    //     label: params.label,
    //   }),
    // );
  }

  // 上报视频设备信息
  function uploadTeacherAvDevice(isOpenCamera: boolean) {
    let cameraParam = {
      room_id: roomConfig?.roomInfo?.room_id,
      av_device_type: 2,
      device: JSON.stringify({
        deviceList: roomConfig.cameraList,
        currentDeviceId: roomConfig?.camera?.deviceId,
        isUse: isOpenCamera,
      }),
    };
    SaveTeacherAvDevice(cameraParam)
      .then((res) => {
        if (res.status.code != 200) {
          console.warn(res);
        }
      })
      .catch((error) => {
        console.warn(error);
      });
  }

  // 摄像头位置设置
  function setCameraPosition(item: any) {
    // 正在当前的位置 return不处理 全屏除外
    if (
      item.position == cameraPositionRef.current.position &&
      item.position != 'fullScreen'
    )
      return;
    // 当前为全屏
    if (cameraPositionRef.current.position == 'fullScreen') {
      console.log('退出全屏');
      // 退出全屏/在全屏状态直接切换位置
      let position = item.position == 'fullScreen' ? CameraPositions[1] : item;
      dispatch(
        setValue({
          key: 'cameraPosition',
          value: item.position == 'fullScreen' ? CameraPositions[1] : item,
        }),
      );
      // dispatch(
      //   setLog(LIVE_ACTIONS.anchorSetCameraPosition, {
      //     position: position?.position,
      //     label: position?.label,
      //   }),
      // );
    } else {
      if (item.position == 'fullScreen') {
        console.log('进入全屏');
      }
      dispatch(setValue({ key: 'cameraPosition', value: item }));
      // dispatch(
      //   setLog(LIVE_ACTIONS.anchorSetCameraPosition, {
      //     position: item?.position,
      //     label: item?.label,
      //   }),
      // );
    }
    // 切换到相应位置log
    dispatch(updateMixLiveAction() as any);
  }

  // 显示摄像头设置弹窗
  function setShowVideoSetting(val: boolean) {
    setShowVideoSettingVisibility(val);
  }

  useEffect(() => {
    isStartRef.current = isStart;
    return () => {};
  }, [isStart]);

  useEffect(() => {
    console.log('roomId', roomId);
    console.log('userInfo', userInfo);
    if (!roomId) {
      navigate('/login');
      return;
    }

    function init(json: any) {
      let room_info = {
        ...json.room_info,
      };
      dispatch(setValue({ key: 'roomInfo', value: room_info }));
      dispatch(
        setValue({
          key: 'liveStage',
          value: room_info.live_stage || LIVE_STAGE.TEST_STAGE,
        }),
      );
      dispatch(
        setValue({
          key: 'isOpenVideoCall',
          value: room_info.is_connect || false,
        }),
      );

      // 是否答题中
      try {
        let isAnswering = json.answer_exam_question?.answering_exam_question
          ? true
          : false;
        dispatch(setValue({ key: 'isAnswering', value: isAnswering }));
      } catch (error) {
        console.error('isAnswering parse error', error);
      }

      // 是否抽奖中
      try {
        let isLotterying = json.lottery_task ? true : false;
        dispatch(setValue({ key: 'isLotterying', value: isLotterying }));
        if (isLotterying) {
          dispatch(setValue({ key: 'lotteryTask', value: json.lottery_task }));
        }
      } catch (error) {}

      // 获取设置的默认清晰度
      try {
        let camera_resolution = json.room_info.camera_resolution || 'CR720P';

        let resolutions: any = CameraStreamEncoderParams.filter((item: any) => {
          let label = 'CR' + item.label;
          return (json.available_camera_resolution || []).some(
            (i: any) => i == label,
          );
        });
        setAvailableCameraResolution(resolutions);
        let index = (resolutions || []).findIndex(
          (r: any) => `CR${r.label}` == camera_resolution,
        );
        setCurrentCameraStreamEncoder(
          index >= 0 ? resolutions[index] : CameraStreamEncoderParams[2],
        );
      } catch (e) {
        console.warn(e);
      }

      ysLiveClient = new YSElectronLive({
        sdkAppId: Number(room_info.sdk_app_id),
        roomId: Number(room_info.room_id),
        role: userInfo['role'],
        userId: room_info.userSigId,
        userSig: room_info.userSig,
        isVisibleFake: room_info.is_visible_fake,
      });
      dispatch(initYsLiveClient(ysLiveClient));
      EVENT = ysLiveClient.EVENT;
      bindEvent();
      initDeviceList();
    }

    enterLiveRoom(
      Number(roomId),
      userInfo['userId'],
      userInfo['nick'],
      userInfo['role'],
      '',
      'TEACHER',
    )
      .then((res) => {
        console.log('enterLiveRoom', res);
        if (res.status.code == 200) {
          init(res);
        } else if (res.status.code == 6511022) {
          Modal.confirm({
            content:
              '房间号' + roomId + '当前有老师登录，继续登录会将其移出房间',
            okText: '继续登录',
            cancelText: '取消',
            onOk: () => {
              init(res);
            },
            onCancel: () => {
              // 后退一步
              navigate(-1);
            },
          });
        } else {
          message.error(`${res.status.code}-${res.status.msg}`);
          console.warn(res);
          navigate(-1);
        }
      })
      .catch((error) => {
        console.log('enterLiveRoom error', error);
      });

    // 上报老师设备信息
    window.electron?.ipcRenderer.sendMessage('enterRoom', userInfo['userId']);
    window.electron?.ipcRenderer.on('app-close', onCloseWindow);

    return () => {
      console.log('unmount');
      unBindEvent();
      ysLiveClient = null;
    };
  }, []);

  return (
    <div>
      {showLoadingVisibility ? (
        <div className="laoding-box">
          <p>
            <LoadingOutlined style={{ fontSize: '30px', color: '#5AC98F' }} />
          </p>
          <p>退出中...</p>
        </div>
      ) : null}
      <Modal
        title="提示"
        open={isShowOutModal}
        onOk={() => quitApp()}
        onCancel={() => quitApp()}
        footer={[
          <Button type="primary" onClick={() => quitApp()}>
            确定
          </Button>,
        ]}
      >
        <p>房间号{roomId}有其他老师进入，导致您被退出</p>
      </Modal>

      {/* 检测弹窗 */}
      {testVisibility ? (
        <Test ysLiveClient={ysLiveClient} setMirror={setMirror}></Test>
      ) : null}

      {/* 分享屏幕弹窗 */}
      {screenVisibility ? (
        <DraggableModal
          title="选择共享内容"
          width={840}
          height={540}
          close={() =>
            dispatch(setValue({ key: 'screenVisibility', value: false }))
          }
          visible={screenVisibility}
        >
          <ScreenList ysLiveClient={ysLiveClient}></ScreenList>
        </DraggableModal>
      ) : null}

      {/* 答题弹窗 */}
      {ysLiveClient ? (
        <Answer ysLiveClient={ysLiveClient} room_id={roomInfo.room_id}></Answer>
      ) : null}

      {/* 抽奖活动配置弹窗 */}
      {ysLiveClient ? (
        <LotteryActivity
          ysLiveClient={ysLiveClient}
          room_id={roomInfo.room_id}
        ></LotteryActivity>
      ) : null}

      {/* 抽奖中奖用户弹窗 */}
      {ysLiveClient ? (
        <LotteryWinnerList></LotteryWinnerList>
      ) : null}

      <div className="room-wrap" id="room-wrap">
        <div className="roomRow">
          <div className="roomMain">
            <div className="roomLeft">
              {ysLiveClient ? (
                <Board
                  setCameraPosition={setCameraPosition}
                  ysLiveClient={ysLiveClient}
                  startLivePush={startLivePush}
                ></Board>
              ) : null}
            </div>
            <div className="roomRight">
              {ysLiveClient ? <Chat ysLiveClient={ysLiveClient}></Chat> : null}
            </div>
          </div>
          <div className="roomCtrl">
            <ControlBar
              ysLiveClient={ysLiveClient}
              muteLocalVideo={muteLocalVideo}
              stopLivePush={stopLivePush}
              exitRoom={exitRoom}
              setShowVideoSetting={setShowVideoSetting}
            ></ControlBar>
          </div>
        </div>
        {ysLiveClient ? (
          <Pendant
            ysLiveClient={ysLiveClient}
            lotteryTask={lotteryTask}
          ></Pendant>
        ) : null}
      </div>
      <div style={{ position: 'fixed', top: 0, left: 0, zIndex: 1000 }}>
        <button className="back-btn" onClick={() => navigate('/login')}>
          back
        </button>
      </div>
    </div>
  );
}

export default LiveRoomPage;
