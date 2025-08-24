import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { LIVE_STAGE, CameraStreamEncoderParams } from '../vars/room-vars';
// import YSElectronLive from '../plugins/live';
import './LiveRoomPage.scss';
import {
  selectRoomConfig,
  selectLiveStatus,
  selectDeviceStatus,
  selectVisibilityStatus,
  selectRouteParams,
} from '../reducers/index';
import {
  setValue,
  toggleCamera,
  toggleMic,
  setVisibility,
} from '../reducers/roomConfigSlice';
import { LStorage } from '../utils/tools';

// @ts-ignore
let ysLiveClient: any = null;
let statTime: number = 0;
let testLive: boolean = false; // 是否是测试直播

function LiveRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const userInfo = LStorage.getItem('USER_INFO') || {};
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // 使用Redux选择器获取状态
  const roomConfig = useSelector(selectRoomConfig);
  const liveStatus = useSelector(selectLiveStatus);
  const deviceStatus = useSelector(selectDeviceStatus);
  const visibilityStatus = useSelector(selectVisibilityStatus);
  const routeParams = useSelector(selectRouteParams);

  const [availableCameraResolution, setAvailableCameraResolution] = useState([]);
  const [currentCameraStreamEncoder, setCurrentCameraStreamEncoder] =
    useState('');

  useEffect(() => {
    if (!roomId) {
      navigate('/login');
      return;
    }

    function init(json: any) {
      let room_info = {
        ...json,
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
    }
  }, []);

  return (
    <div>
      <h1>LiveRoomPage</h1>
    </div>
  );
}

export default LiveRoomPage;
