import React, { useState, useEffect, useRef } from 'react';
import { message as Message, Popconfirm, notification } from 'antd';
import {
  setValue,
  setList,
} from '../../reducers/roomConfigSlice';
import { updateMixLiveAction } from '../../reducers/roomConfigThunks';
import { Tool } from '../../utils/tools';
import { LIVE_STAGE, VideoCallUserParams } from '../../vars/room-vars';
import {
  GetLiveConnectList,
  LiveTeacherConnectStatus,
  LiveTeacherConnectControl,
} from '../../api/index';
import { useDispatch, useSelector } from 'react-redux';
import { selectRoomConfig } from '../../reducers/index';
interface UserDeviceAvailableParam {
  trtcUid: string;
  userId: string;
  available: number;
}

import './userList.scss';
const level_text: { [key: number | string]: string } = {
  1: 'S级',
  2: 'A级',
  3: 'B级',
  4: 'C级',
  5: '',
};
const conversion_stage: { [key: number | string]: string } = {
  1: '已支付',
  2: '已付定金',
  3: '下单未支付',
  4: '已领优惠券',
  5: '浏览大课',
  6: '',
};
const status_text: { [key: number | string]: string } = {
  waiting: '连麦接通中',
  calling: '连麦中',
  end: '连麦结束',
};
enum CALL_STATUS {
  WAITING = 'waiting',
  CALLING = 'calling',
  END = 'end',
}
enum CONNECT_STATUS {
  ASKING = 1,
  WAITING = 2,
  CALLING = 3,
  END = 4,
}
enum CONNECT_TYPE {
  VIDEO_CALL = 1,
  AUDIO_CALL = 2,
}
enum CONNECT_CONTROL_STATUS {
  AGREE = 1,
  CALLING = 2,
  END = 3,
}
interface UserListParam {
  ysLiveClient: any;
  userListHeight: string;
}

let tempUserList: any = [];
let isStartTemp: boolean = false;

export default function UserList(props: UserListParam) {
  const dispatch = useDispatch();
  const roomConfig = useSelector(selectRoomConfig);
  const { userListHeight, ysLiveClient } = props;
  const {
    isOpenVideoCall,
    videoCallUserList,
    isStart,
    isTestLive,
    roomInfo,
    isShareScreen,
    liveStage,
  } = roomConfig;
  const timer: any = useRef(null);
  const [userList, setUserList] = useState([]);
  const videoCallUserListRef = useRef<Array<VideoCallUserParams>>([]);
  const [osVersion, setOsVersion] = useState({
    name: '',
    version: '',
  });

  // 修改连麦功能开关
  function changeOpenVideoCall() {
    LiveTeacherConnectStatus(
      roomInfo.room_id,
      !isOpenVideoCall ? 1 : 0,
      osVersion.name + osVersion.version,
    )
      .then((res) => {
        if (res.status.code == 200) {
          dispatch(setValue({ key: 'isOpenVideoCall', value: !isOpenVideoCall }));
        } else {
          Message.error(`${res.status.code}-${res.status.msg}`);
        }
      })
      .catch((err) => {
        Message.error(`请求失败`);
      });
  }

  // 用户连麦发起请求/取消请求
  function onReceivedVideoCallMsg(result: { data: any; eventCode: string }) {
    // 发起请求
    if (result.data.action == 'liveConnectApply') {
      let list = result.data.quote;
      let newList = list.map((item: any) => {
        return {
          ...item,
          user_id: item.user_id + '',
          connect_time_text: '',
        };
      });
      newList.forEach((user: any) => {
        removeUser(user.user_id);
      });
      console.log('收到连麦申请请求', newList);
      addUsers(newList);
    } else if (result.data.action == 'liveConnectCancelApply') {
      // 取消请求
      let user_ids = result.data.quote.user_ids;
      user_ids.forEach((user_id: any) => {
        removeUser(user_id);
      });
    }
  }

  function addUsers(users: Array<any>) {
    if (isStartTemp == false) {
      return;
    }
    let newList = tempUserList.concat(users);
    tempUserList = newList.concat([]);
    setUserList(tempUserList);
  }

  // 更新申请用户信息
  function updateUser(user_id: string, data: object) {
    let newList = tempUserList.map((item: any) => {
      if (item.user_id == user_id) {
        return {
          ...item,
          ...data,
        };
      } else {
        return item;
      }
    });
    tempUserList = newList.concat([]);
    setUserList(tempUserList);
  }

  // 删除申请用户
  function removeUser(user_id: string) {
    let newList = tempUserList.filter((item: any) => {
      return item.user_id != user_id;
    });
    tempUserList = newList.concat([]);
    setUserList(tempUserList);
  }

  // 监听用户进入事件
  function onUserEnterRoom(result: { data: string; eventCode: string }) {
    let trtcUid = result.data;
    let userId = Tool.trtcUidToUid(trtcUid);
    console.log('有用户进入房间', userId);

    // 处理连麦中列表数据
    let user = tempUserList.find((item: any) => {
      return item.user_id == userId;
    });
    if (!user) {
      return;
    }
    let videoCallUser = {
      trtcUid: trtcUid,
      userId: userId,
      avatar:
        user?.avatar ||
        'https://feed.youshu.cc/readwith/media/0/1696829775480.png',
      nick: user?.nickname || '学员' + userId,
      video: 0,
      audio: 0,
    };
    let tempList = videoCallUserListRef.current.concat([videoCallUser]);
    dispatch(setList({ name: 'videoCallUser', list: tempList }));
    dispatch(updateMixLiveAction() as any);
    LiveTeacherConnectControl(
      roomInfo.room_id,
      CONNECT_CONTROL_STATUS.CALLING,
      user.user_id,
    );
    // 处理申请列表数据
    updateUser(userId, {
      connect_status: CONNECT_STATUS.CALLING,
      start_time: Math.floor(new Date().getTime() / 1000),
    });
  }

  // 有用户退出房间
  function onUserLeaveRoom(result: { data: String; eventCode: string }) {
    let trtcUid = result.data;
    let userId = Tool.trtcUidToUid(trtcUid);
    console.log('有用户退出房间', userId);
    let videoCallUser = videoCallUserListRef.current.find((item: any) => {
      return item.userId == userId;
    });
    if (videoCallUser) {
      Message.info(`结束连麦`);
    }
    // 处理连麦中列表数据
    videoCallUserListRef.current = videoCallUserListRef.current.filter(
      (item: VideoCallUserParams) => {
        return item.userId != userId;
      },
    );
    const newList = videoCallUserListRef.current.concat([]);
    dispatch(setList({ name: 'videoCallUser', list: newList }));
    ysLiveClient.stopRemoteView(trtcUid);
    setTimeout(() => {
      dispatch(updateMixLiveAction() as any);
    }, 1000);
    LiveTeacherConnectControl(
      roomInfo.room_id,
      CONNECT_CONTROL_STATUS.END,
      userId,
    );
    // 处理结束连麦用户
    updateUser(userId, {
      connect_status: CONNECT_STATUS.END,
      end_time: Math.floor(new Date().getTime() / 1000),
    });
    // 2秒后删除
    setTimeout(() => {
      removeUser(userId);
    }, 2000);
  }

  // 是否开启摄像头视频
  function onUserVideoAvailable(result: {
    data: UserDeviceAvailableParam;
    eventCode: string;
  }) {
    let data = result.data;
    console.log('有用户修改摄像头视频', data);
    videoCallUserListRef.current.forEach(
      (item: VideoCallUserParams, index: number) => {
        if (item.trtcUid == data.trtcUid) {
          videoCallUserListRef.current[index].video = data.available;
        }
      },
    );
    const newList = videoCallUserListRef.current.concat([]);
    dispatch(setList({ name: 'videoCallUser', list: newList }));
    dispatch(updateMixLiveAction() as any);
  }

  // 是否开启音频
  function onUserAudioAvailable(result: {
    data: UserDeviceAvailableParam;
    eventCode: string;
  }) {
    let data = result.data;
    console.log('有用户修改音频', data);
    videoCallUserListRef.current.forEach(
      (item: VideoCallUserParams, index: number) => {
        if (item.trtcUid == data.trtcUid) {
          videoCallUserListRef.current[index].audio = data.available;
        }
      },
    );
    const newList = videoCallUserListRef.current.concat([]);
    dispatch(setList({ name: 'videoCallUser', list: newList }));
  }

  // 绑定监听事件
  function bindEvent() {
    ysLiveClient.on(
      ysLiveClient.EVENT.TRTC_REMOTE_USER_ENTER_ROOM,
      onUserEnterRoom,
    );
    ysLiveClient.on(
      ysLiveClient.EVENT.TRTC_REMOTE_USER_LEAVE_ROOM,
      onUserLeaveRoom,
    );
    ysLiveClient.on(
      ysLiveClient.EVENT.TRTC_USER_VIDEO_AVAILABLE,
      onUserVideoAvailable,
    );
    ysLiveClient.on(
      ysLiveClient.EVENT.TRTC_USER_AUDIO_AVAILABLE,
      onUserAudioAvailable,
    );
    ysLiveClient.on(
      ysLiveClient.EVENT.TIM_CALL_RECEIVED,
      onReceivedVideoCallMsg,
    );
  }

  // 卸载监听事件
  function unBindEvent() {
    ysLiveClient.off(
      ysLiveClient.EVENT.TRTC_REMOTE_USER_ENTER_ROOM,
      onUserEnterRoom,
    );
    ysLiveClient.off(
      ysLiveClient.EVENT.TRTC_REMOTE_USER_LEAVE_ROOM,
      onUserLeaveRoom,
    );
    ysLiveClient.off(
      ysLiveClient.EVENT.TRTC_USER_VIDEO_AVAILABLE,
      onUserVideoAvailable,
    );
    ysLiveClient.off(
      ysLiveClient.EVENT.TRTC_USER_AUDIO_AVAILABLE,
      onUserAudioAvailable,
    );
    ysLiveClient.off(
      ysLiveClient.EVENT.TIM_CALL_RECEIVED,
      onReceivedVideoCallMsg,
    );
  }

  // 昵称长度处理
  function getNickText(nickname: string) {
    if (nickname.length > 6) {
      return nickname.slice(0, 6) + '...';
    } else {
      return nickname;
    }
  }

  // 启动计时器
  const startTimer = () => {
    if (timer.current) {
      clearTimer();
    }
    updateUserListTime();
    timer.current = setInterval(updateUserListTime, 1000);
  };

  const clearTimer = () => {
    clearInterval(timer.current);
  };
  // 处理列表内的时间展示
  const updateUserListTime = () => {
    // 获取当前时间的时间戳
    const currentTime = Math.floor(Date.now() / 1000);
    const newList = tempUserList.map((item: any) => {
      if (item.connect_status == CONNECT_STATUS.CALLING) {
        // 上麦中 计算上麦时长
        let start_time = item?.start_time || null;
        if (start_time) {
          const timeDifference = Math.floor(currentTime - start_time);
          const minutes = Math.floor(timeDifference / 60)
            .toString()
            .padStart(2, '0');
          const seconds = (timeDifference % 60).toString().padStart(2, '0');
          return { ...item, connect_time_text: `${minutes}:${seconds}` };
        } else {
          return { ...item, connect_time_text: '' };
        }
      } else if (item.connect_status == CONNECT_STATUS.WAITING) {
        // 连接中
        return { ...item, connect_time_text: '' };
      } else if (item.connect_status == CONNECT_STATUS.ASKING) {
        // 申请中
        const timeDifference = Math.floor(currentTime - item.connect_time);
        if (timeDifference < 60) {
          return { ...item, connect_time_text: '刚刚' };
        } else if (timeDifference >= 60 && timeDifference < 600) {
          const minutes = Math.floor(timeDifference / 60);
          return { ...item, connect_time_text: `${minutes}分钟前` };
        } else {
          const date = new Date(item.connect_time * 1000);
          const hours = date.getHours().toString().padStart(2, '0');
          const minutes = date.getMinutes().toString().padStart(2, '0');
          return { ...item, connect_time_text: `${hours}:${minutes}申请` };
        }
      } else if (item.connect_status == CONNECT_STATUS.END) {
        // 已结束
        return { ...item, connect_time_text: '' };
      }
    });
    tempUserList = newList.concat([]);
    setUserList(tempUserList);
  };

  // 同意某用户连麦
  function agreeCall(user: any) {
    if (isStart == false) {
      Message.info(`请先上课`);
      return;
    }
    if (isShareScreen == true) {
      notification.warning({
        message: '通知',
        description: '分享屏幕中暂不支持连麦',
      });
      return;
    }
    if (user.connect_status != CONNECT_STATUS.ASKING) {
      return;
    }
    // 请求同意连麦接口
    LiveTeacherConnectControl(
      roomInfo.room_id,
      CONNECT_CONTROL_STATUS.AGREE,
      user.user_id,
    )
      .then((res) => {
        if (res.status.code == 200) {
          let newList = tempUserList.map((item: any) => {
            if (item.user_id == user.user_id) {
              return {
                ...item,
                connect_status: CONNECT_STATUS.WAITING,
                start_time: null,
              };
            } else {
              return item;
            }
          });
          tempUserList = newList.concat([]);
          setUserList(tempUserList);
          updateUserListTime();
          // 10秒未上麦 超时结束
          setTimeout(() => {
            let connect_status = checkUserVideoCallStatus(user.user_id);
            if (connect_status == CONNECT_STATUS.WAITING) {
              Message.error(`通话异常，接通失败`);
              // removeUser(user.user_id)
              endCall(user);
            } else if (connect_status == CONNECT_STATUS.CALLING) {
              console.log('已上麦');
            } else if (connect_status == CONNECT_STATUS.END) {
              console.log('已结束');
            }
          }, 10000);
        } else {
          if (res.status.code == 6517001) {
            removeUser(user.user_id);
          }
          Message.error(`${res.status.code}-${res.status.msg}`);
        }
      })
      .catch((err) => {
        Message.error(`请求失败`);
      });
  }

  // 结束某用户连麦
  function endCall(user: any) {
    // 请求结束连麦接口
    LiveTeacherConnectControl(
      roomInfo.room_id,
      CONNECT_CONTROL_STATUS.END,
      user.user_id,
    )
      .then((res) => {
        if (res.status.code == 200) {
          removeUser(user.user_id);
        } else {
          Message.error(`${res.status.code}-${res.status.msg}`);
        }
      })
      .catch((err) => {
        Message.error(`请求失败`);
      });
  }

  // 检查用户是否上麦， 未上麦做超时处理
  function checkUserVideoCallStatus(user_id: string) {
    let askHadThisUser = tempUserList.find((item: any) => {
      return item.user_id == user_id;
    });
    if (askHadThisUser && askHadThisUser.connect_status) {
      return askHadThisUser.connect_status;
    } else {
      return null;
    }
  }

  // 获取申请用户列表
  async function getUserList() {
    GetLiveConnectList(roomInfo.room_id).then((res) => {
      if (res.status.code == 200) {
        let newList = res.list.filter((item: any) => {
          let isInCalling =
            item.connect_status == CONNECT_STATUS.CALLING &&
            videoCallUserList.find((user: any) => {
              return user.userId == item.user_id;
            });
          return item.connect_status != CONNECT_STATUS.CALLING || isInCalling;
        });
        newList = newList.map((item: any) => {
          let callingUser = tempUserList.find((user: any) => {
            return item.user_id == user.user_id;
          });
          return {
            ...item,
            user_id: item.user_id + '',
            start_time: callingUser?.start_time || null,
            connect_time_text: callingUser?.connect_time_text || '',
          };
        });
        tempUserList = newList.concat([]);
        setUserList(tempUserList);
        startTimer();

        let callingNotInList = res.list.filter((item: any) => {
          let isInCallingButNotIn =
            item.connect_status == CONNECT_STATUS.CALLING &&
            !videoCallUserList.find((user: any) => {
              return user.userId == item.user_id;
            });
          return isInCallingButNotIn;
        });
        callingNotInList.forEach((user: any) => {
          endCall({ user_id: user.user_id });
        });
      } else {
        Message.error(`${res.status.code}-${res.status.msg}`);
      }
    });
  }

  useEffect(() => {
    window.electron.ipcRenderer.once('getOsVersion', (res: any) => {
        setOsVersion(res);
    });
    window.electron.ipcRenderer.sendMessage('getOsVersion');
    bindEvent();
    isOpenVideoCall && getUserList();

    return () => {
      dispatch(setList({ name: 'videoCallUser', list: [] }));
      setUserList([]);
      unBindEvent();
      clearTimer();
    };
  }, []);

  useEffect(() => {
    if (isStart && isOpenVideoCall) {
      getUserList();
    } else if (isStart && !isOpenVideoCall) {
      let newList = tempUserList.filter((item: any) => {
        return item.connect_status == CONNECT_STATUS.CALLING;
      });
      tempUserList = newList.concat([]);
      setUserList(tempUserList);
    } else if (!isStart) {
      tempUserList = [];
      setUserList(tempUserList);
      dispatch(setList({ name: 'videoCallUser', list: [] }));
    }
  }, [isStart, isOpenVideoCall]);

  useEffect(() => {
    isStartTemp = isStart;
    // 下课并且开启连麦时，关闭连麦功能
    if (!isStart && isOpenVideoCall) {
      changeOpenVideoCall();
    }
    // 下课并且连麦中，挂断连麦
    if (!isStart && videoCallUserListRef.current.length > 0) {
      videoCallUserListRef.current.forEach((videoCallUser: any) => {
        endCall({ user_id: videoCallUser.userId });
      });
    }
  }, [isStart]);

  useEffect(() => {
    videoCallUserListRef.current = videoCallUserList;
    // if (videoCallUserList.length > 0) {
    //     dispatch(setDevice('speaker', { volume: 100 }))
    // }else {
    //     dispatch(setDevice('speaker', { volume: 0 }))
    // }
  }, [videoCallUserList]);

  return (
    <div className="user-list-box">
      <div className="openVideoCall">
        <p>开启学员连麦</p>
        <img
          src={
            isOpenVideoCall
              ? 'https://feed.youshu.cc/readwith/media/0/1696734980615.png'
              : 'https://feed.youshu.cc/readwith/media/0/1696734971685.png'
          }
          alt="开关学员连麦"
          onClick={() => {
            if (liveStage == LIVE_STAGE.END_STAGE) {
              Message.info(`直播已结束，无法连麦`);
              return;
            }
            if (isStart == false) {
              Message.info(`请先点击上课`);
              return;
            }
            if (isTestLive) {
              Message.info(`课前测试，无法连麦`);
              return;
            }
            changeOpenVideoCall();
          }}
        />
      </div>
      <div className="videoCallUserList" style={{ height: userListHeight }}>
        {userList.length > 0 ? (
          userList.map((item: any, index: number) => {
            return (
              <div key={item.user_id} className="user-item">
                <div className="user-left">
                  <div className="avatar-box">
                    <img
                      className="avatar"
                      src={
                        item.avatar ||
                        'https://avatar.youshu.cc/file_u/wx/act/20220817/62fc9f4745abf2855.png'
                      }
                    />
                    <img
                      className="connect-type"
                      src={
                        item.connect_type == CONNECT_TYPE.VIDEO_CALL
                          ? 'https://feed.youshu.cc/readwith/media/0/1696757252330.png'
                          : 'https://feed.youshu.cc/readwith/media/0/1696757245288.png'
                      }
                      alt=""
                    />
                  </div>
                </div>
                <div className="user-main">
                  <div className="middle-box">
                    <div className="nick-box">
                      <p className="nick">{getNickText(item.nickname)}</p>
                      {level_text[item.level] ? (
                        <p className="level">{level_text[item.level]}</p>
                      ) : null}
                      {conversion_stage[item.conversion_stage] ? (
                        <p
                          className={
                            item.conversion_stage == 3
                              ? 'conversion active'
                              : 'conversion'
                          }
                        >
                          {conversion_stage[item.conversion_stage]}
                        </p>
                      ) : null}
                    </div>
                    {item.connect_status == CONNECT_STATUS.ASKING ? (
                      <p className="time-label">
                        {item.connect_type == CONNECT_TYPE.VIDEO_CALL
                          ? '申请视频连麦'
                          : '申请语音连麦'}{' '}
                        {item.connect_time_text}
                      </p>
                    ) : null}
                    {item.connect_status == CONNECT_STATUS.WAITING ? (
                      <p className="time-label">连麦接通中</p>
                    ) : null}
                    {item.connect_status == CONNECT_STATUS.CALLING ? (
                      <p className="time-label">
                        连麦中 {item.connect_time_text}
                      </p>
                    ) : null}
                    {item.connect_status == CONNECT_STATUS.END ? (
                      <p className="time-label">连麦结束</p>
                    ) : null}
                  </div>
                  <div className="user-right">
                    {item.connect_status == CONNECT_STATUS.ASKING &&
                    videoCallUserList.length == 0 ? (
                      <div
                        onClick={() => {
                          agreeCall(item);
                        }}
                        className="btn agree"
                      >
                        同意
                      </div>
                    ) : null}
                    {item.connect_status == CONNECT_STATUS.CALLING ? (
                      <Popconfirm
                        placement="bottomRight"
                        title="确认结束此次连麦？"
                        onConfirm={() => {
                          endCall(item);
                        }}
                        okText="确认结束"
                        cancelText="取消"
                      >
                        <div className="btn close">结束</div>
                      </Popconfirm>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="no-data">
            <img
              src="https://feed.youshu.cc/readwith/media/0/1697094382213.png"
              alt=""
            />
            <p>暂无学员申请连麦</p>
          </div>
        )}
      </div>
    </div>
  );
}
