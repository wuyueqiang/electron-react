import React, { useState, useEffect } from 'react';
import { Tooltip } from 'antd';
import { VideoCallUserParams, CameraPositions } from '../../vars/room-vars';
import VideoCallUserStatus from './videoCallUserStatus';
import { useSelector } from 'react-redux';
import { selectRoomConfig } from '../../reducers/index';
import { LStorage } from '../../utils/tools';
interface CameraPostionParams {
  setCameraPosition: any;
}
export default function CameraPosition(props: CameraPostionParams) {
  const userInfo = LStorage.getItem('USER_INFO');
  const roomConfig = useSelector(selectRoomConfig);
  const { setCameraPosition } = props;
  const {
    cameraPosition,
    isOpenCamera,
    isOpenMic,
    videoCallUserList,
    roomInfo,
  } = roomConfig;
  const [teacherStatus, setTeacherStatus] = useState({
    userId: userInfo.userId,
    avatar: userInfo.avatar,
    nick: userInfo.nick,
    video: 1,
    audio: 1,
    status: 'calling',
  });

  // 双击摄像头 全屏切换
  function handleClickCamera(event: any) {
    if (event.detail === 2) {
      if (cameraPosition.position == 'fullScreen') {
        setCameraPosition(CameraPositions[1]);
      } else {
        setCameraPosition(CameraPositions[4]);
      }
    }
  }

  useEffect(() => {
    setTeacherStatus({
      ...teacherStatus,
      video: isOpenCamera ? 1 : 0,
      audio: isOpenMic ? 1 : 0,
    });
  }, [isOpenCamera, isOpenMic]);

  // 竖屏控制比例为 9:16
  useEffect(() => {
    // 横屏跳出
    if (roomInfo.display_type == 0) {
      return;
    }
    if (
      cameraPosition.position == 'fullScreen' &&
      videoCallUserList.length == 0
    ) {
      let height = document.getElementById('board-wrap')?.clientHeight || 0;
      if (height > 0) {
        let width = (height / 16) * 9;
        let teacherFullScreenDom =
          document.querySelector('.teacherVideoCallCamera') || null;
        if (teacherFullScreenDom) {
          teacherFullScreenDom.style.maxWidth = width + 'px';
        }
      }
    } else {
      let teacherFullScreenDom =
        document.querySelector('.teacherVideoCallCamera') || null;
      if (teacherFullScreenDom) {
        teacherFullScreenDom.style.maxWidth = '50%';
      }
    }
  }, [cameraPosition, videoCallUserList]);

  return (
    <Tooltip
      placement="bottom"
      trigger="hover"
      title={cameraPosition.position == 'fullScreen' ? '双击缩小' : '双击放大'}
    >
      <div
        className={
          'camera-position-box ' +
          cameraPosition.position +
          (!isOpenCamera && videoCallUserList.length == 0 ? ' hidden' : '') +
          (roomInfo.display_type == 1 ? ' vertical' : '')
        }
        onClick={handleClickCamera}
      >
        {/* 未全屏 主播位置 */}
        {cameraPosition.position != 'fullScreen' ? (
          <div
            className={
              roomInfo.display_type == 1
                ? 'cameraPosition vertical'
                : 'cameraPosition'
            }
          >
            <div className="video-view" id="room-camera-view"></div>
            <VideoCallUserStatus
              videoCallUserStatus={teacherStatus}
            ></VideoCallUserStatus>
          </div>
        ) : null}

        {/* 未全屏 连麦人位置 */}
        {cameraPosition.position != 'fullScreen' &&
          videoCallUserList.length > 0 &&
          videoCallUserList.map((item: VideoCallUserParams, index: number) => {
            return (
              <div
                key={index}
                className={
                  roomInfo.display_type == 1
                    ? 'cameraPosition vertical'
                    : 'cameraPosition'
                }
              >
                <div className="video-view" id={'student-view-' + index}></div>
                <VideoCallUserStatus
                  videoCallUserStatus={item}
                ></VideoCallUserStatus>
              </div>
            );
          })}

        {/* 全屏 主播位置 */}
        {cameraPosition.position == 'fullScreen' ? (
          <div className="videoCallCamera teacherVideoCallCamera">
            <div className="video-view" id="room-camera-fullScreen-view"></div>
            <VideoCallUserStatus
              videoCallUserStatus={teacherStatus}
            ></VideoCallUserStatus>
          </div>
        ) : null}

        {/* 全屏 连麦人位置 */}
        {cameraPosition.position == 'fullScreen' && videoCallUserList.length > 0
          ? videoCallUserList.map(
              (item: VideoCallUserParams, index: number) => {
                return (
                  <div key={index} className="videoCallCamera">
                    <div
                      className="video-view"
                      id={'student-fullScreen-view-' + index}
                    ></div>
                    <VideoCallUserStatus
                      videoCallUserStatus={item}
                    ></VideoCallUserStatus>
                  </div>
                );
              },
            )
          : null}
      </div>
    </Tooltip>
  );
}
