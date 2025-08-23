import React, { useState, useEffect, useRef } from 'react';
import { Popover, Button, message as Message, Modal } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import './LiveListPage.scss';
import { VERSION, npm_env } from '../config/index';
import {
  GetTodayWhiteBoardLiveByTeacher,
  GetWhiteBoardLiveListByTeacher,
  GetWhiteBoardLiveListByTeacherParam,
  CheckRoomTeacherLogin,
  LiveUploadLog,
} from '../api';
import { timestampToTime, timestampToDate, LStorage } from '../utils/tools';
import { setValue } from '../reducers/roomConfigSlice';

interface LiveSimpleInfoParam {
  live_id: number;
  title: string;
  start_time: string;
  end_time: string;
  is_test: boolean;
  room_id: string;
  image_url: string;
}
interface liveStatusItem {
  label: string;
  value: number;
}
const liveStatusList: liveStatusItem[] = [
  {
    label: '未开播',
    value: 1,
  },
  {
    label: '直播中',
    value: 2,
  },
  {
    label: '直播结束',
    value: 3,
  },
];
const pageSize: string = '18';

function LiveListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  // 使用Redux状态
  const appState = useSelector((state: any) => state.app);
  const roomConfig = useSelector((state: any) => state.roomConfig);
  
  const [loginOut, setLoginOut] = useState<boolean>(false); //退出登录 是否显示
  const [showMoreLive, setShowMoreLive] = useState<boolean>(false); //今日直播是否打开 更多
  const [userInfo, setUserInfo] = useState<any>({}); //当前登录者信息
  const userInfoRef = useRef<any>({});
  const [todayLiveList, setTodayLiveList] = useState([]); //今日直播 列表

  // 从location.state中获取参数，如果没有则使用默认值
  const locationState = location.state as any || {};
  const liveStatusRef = useRef<number>(locationState.liveStatus || 1); // 选中直播状态
  const livePageRef = useRef<string>('1'); // 全部直播分页
  const sortTypeRef = useRef<number>(locationState.sortType || 1); // 列表排序方式
  const [unstartCount, setUnstartCount] = useState<number>(0); // 老师所有直播 未开播数量
  const unstartCountRef = useRef<number>(0); // 老师所有直播 未开播数量
  const [livingCount, setLivingCount] = useState<number>(0); //老师所有直播 直播中数量
  const livingCountRef = useRef<number>(0); // 老师所有直播 未开播数量
  const [endCount, setEndCount] = useState<number>(0); //老师所有直播 已结束数量
  const endCountRef = useRef<number>(0); // 老师所有直播 未开播数量

  const [teacherLiveList, setTeacherLiveList] = useState([]); // 老师所有直播 列表
  const teacherLiveListRef = useRef([]);
  const [uploadLogDisable, setUploadLogDisable] = useState(false);

  // 获取老师今日直播
  function getTodayLiveList() {
    GetTodayWhiteBoardLiveByTeacher(userInfo.userId)
      .then((res) => {
        if (res.status.code == 200) {
          let list = res.list || [];
          setTodayLiveList(list);
        } else {
          Message.error(`${res.status.code}-${res.status.msg}`);
          console.warn(res);
        }
      })
      .catch((err) => {
        console.warn(err);
      });
  }

  // 获取老师所有直播
  function getTeacherLiveList() {
    const params: GetWhiteBoardLiveListByTeacherParam = {
      teacher_id: userInfoRef.current.userId, // [必填]老师用户id
      page: livePageRef.current, // [必填]页码
      page_size: pageSize, // [必填]没页数量
      status_type: liveStatusRef.current || 1,
      sort_type: sortTypeRef.current || 1,
    };
    GetWhiteBoardLiveListByTeacher(params)
      .then((res) => {
        if (res.status.code == 200) {
          let list = [];
          if (livePageRef.current == '1') {
            list = res.list || [];
          } else {
            list = [...teacherLiveListRef.current, ...res.list];
          }
          list.sort((a: LiveSimpleInfoParam, b: LiveSimpleInfoParam) => {
            if (sortTypeRef.current == 1) {
              return Number(a.start_time) - Number(b.start_time);
            } else {
              return Number(b.start_time) - Number(a.start_time);
            }
          });
          let hasObj: { [key: string]: number } = {};
          const resultList = list.reduce(
            (cur: LiveSimpleInfoParam[], next: LiveSimpleInfoParam) => {
              hasObj[next.room_id]
                ? ''
                : (hasObj[next.room_id] = true && cur.push(next));
              return cur;
            },
            [],
          );
          teacherLiveListRef.current = resultList;
          setTeacherLiveList(resultList);
          livingCountRef.current = res.living_count;
          setLivingCount(res.living_count);
          unstartCountRef.current = res.unstart_count;

          setUnstartCount(res.unstart_count);
          setEndCount(res.end_count);
          endCountRef.current = res.end_count;
        } else {
          Message.error(`${res.status.code}-${res.status.msg}`);
          console.warn(res);
        }
      })
      .catch((err) => {
        console.warn(err);
      });
  }

  // 刷新当前 页面数据
  function handleRefreshPage() {
    getTodayLiveList();
    livePageRef.current = '1';
    getTeacherLiveList();
  }
  
  // 退出登录页
  function handleLoginOut() {
    navigate('/login');
  }
  
  // 进入直播房间
  function goLiveRoom(roomId: string) {
    const liveStatus = liveStatusRef.current;
    const sortType = sortTypeRef.current;
    
    // 使用Redux存储房间信息
    dispatch(setValue({ key: 'roomInfo', value: { room_id: roomId } }));
    
    navigate(`/live-room/${roomId}`, {
      state: {
        liveStatus,
        sortType,
      },
    });
  }
  
  // 进入直播间
  function handleClickLiveInfoCard(data: LiveSimpleInfoParam) {
    const roomId = data.room_id;

    CheckRoomTeacherLogin(roomId).then((res) => {
      if (res.status.code == 200) {
        LStorage.setItem('USER_INFO', {
          ...userInfo,
          roomId,
        });
        
        // 使用Redux存储房间信息
        dispatch(setValue({ key: 'roomInfo', value: { 
          room_id: roomId,
          title: data.title,
          is_test: data.is_test,
          live_id: data.live_id
        }}));
        
        if (res.teacher_uid > 0) {
          Modal.confirm({
            content:
              '房间号' + roomId + '当前有老师登录，继续登录会将其移出房间',
            okText: '继续登录',
            cancelText: '取消',
            onOk: () => {
              goLiveRoom(roomId);
            },
            onCancel: () => {},
          });
        } else {
          goLiveRoom(roomId);
        }
      } else {
        Message.error(`${res.status.code}-${res.status.msg}`);
        console.warn(res);
      }
    });
  }

  // 全部直播列表排序
  function handleClickSortLiveList() {
    sortTypeRef.current = sortTypeRef.current == 1 ? 2 : 1;
    getTeacherLiveList();
  }

  // 获取直播时间
  function getLiveTime(item: LiveSimpleInfoParam) {
    const start_time = Number(item.start_time) * 1000;
    const end_time = Number(item.end_time) * 1000;
    const startTS = new Date(
      new Date(start_time).setHours(0, 0, 0, 0),
    ).getTime();
    return `${timestampToDate(start_time)} - ${end_time - startTS > 24 * 60 * 60 * 1000 ? timestampToDate(end_time) : timestampToTime(end_time)}`;
  }
  
  // 总分页 大于当前 分页 代码还有新数据，需进行接口请求
  function getTeacherLiveListCount() {
    const liveStatusCurrent =
      liveStatusRef.current == 2
        ? livingCountRef.current
        : liveStatusRef.current == 1
          ? unstartCountRef.current
          : liveStatusRef.current == 3
            ? endCountRef.current
            : 0;
    return (
      Math.ceil(liveStatusCurrent / Number(pageSize)) >
      Number(livePageRef.current)
    );
  }

  function uploadLog() {
    console.log('====uploadLog');
    window.electron.ipcRenderer.sendMessage('uploadLog');
    setUploadLogDisable(true);
  }

  function onGetLogUrl(result: any) {
    setTimeout(() => {
      setUploadLogDisable(false);
    }, 500);
    if (result) {
      // Message.success(`上传成功${result}`)
      console.log('====onGetLogUrl', result);
      let param = {
        file_url: result,
        user_id: userInfo.userId,
      };
      LiveUploadLog(param).then((res) => {
        if (res?.status?.code == 200) {
          Message.success(`上传成功`);
        } else {
          Message.error(`上传失败，请手动发送`);
        }
      });
    } else {
      Message.error(`上传失败，请手动发送`);
    }
  }

  // 导航到Redux测试页面
  const goToReduxTest = () => {
    navigate('/redux-test');
  };

  useEffect(() => {
    const removeListener = window.electron.ipcRenderer.on('getLogUrl', onGetLogUrl);
    return () => {
      removeListener();
    };
  }, []);

  // 加载用户信息
  useEffect(() => {
    async function loadUserInfo() {
      const userData = await LStorage.getItem('USER_INFO');
      console.log('====userData', userData);
      setUserInfo(userData || {});
    }
    loadUserInfo();
  }, []);

  // 当用户信息加载完成后，刷新页面数据
  useEffect(() => {
    if (userInfo && userInfo.userId) {
      userInfoRef.current = userInfo;
      handleRefreshPage();
    }
  }, [userInfo]);

  useEffect(() => {
    const livepage: HTMLElement | null = document.getElementById('root');
    document.addEventListener('scroll', function () {
      //页面卷去高度 + 浏览器可视窗口的高度 >= 整个页面的高度

      if (
        livepage &&
        window.pageYOffset + window.innerHeight >= livepage.offsetHeight
      ) {
        console.log(
          '到达底部',
          getTeacherLiveListCount(),
          Number(livePageRef.current),
        );

        if (getTeacherLiveListCount()) {
          livePageRef.current = `${Number(livePageRef.current) + 1}`;
          getTeacherLiveList();
        }
      }
    });
  }, []);
  
  return (
    <div
      className="live-list-wrap"
      id="live-list-wrap"
      onClick={() => {
        setLoginOut(false);
      }}
    >
      <div className="header">
        <span className="client-name">
          有书直播客户端V{VERSION}
          {npm_env == 'prod' ? null : npm_env}
        </span>
        <div className="action-box">
          {/* <Button
            className="upload-btn"
            type="text"
            size="small"
            loading={uploadLogDisable}
            onClick={uploadLog}
          >
            上报日志
          </Button> */}
          {
          <Button
            className="upload-btn"
            type="text"
            size="small"
            onClick={goToReduxTest}
          >
            Redux测试
          </Button>
          }
          <div
            className="refresh"
            onClick={() => {
              handleRefreshPage();
            }}
          >
            <img
              src="https://feed.youshu.cc/readwith/media/picture/63317907b37bc.png"
              alt=""
            />
            刷新
          </div>
          <Popover
            content={
              <span
                style={{
                  fontSize: '12px',
                  color: '#686868',
                  fontWeight: 500,
                  padding: '6px 30px',
                  display: 'inline-block',
                }}
                onClick={() => handleLoginOut()}
              >
                退出登录
              </span>
            }
            trigger="click"
            placement="bottomRight"
            open={loginOut}
            getPopupContainer={(triggerNode) => triggerNode}
          >
            <div
              className="teacher-info"
              onClick={(e) => {
                setLoginOut(!loginOut);
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
              }}
            >
              <img src={userInfo.avatar} alt="" className="teacher-avatar" />
              <span className="teacher-name">{userInfo.nick}</span>
              {!loginOut ? (
                <img
                  src="https://feed.youshu.cc/readwith/media/picture/63318072801a1.png"
                  alt=""
                  className="icon"
                />
              ) : (
                <img
                  src="https://feed.youshu.cc/readwith/media/picture/63325cc14b6cb.png"
                  alt=""
                  className="icon"
                />
              )}
            </div>
          </Popover>
        </div>
      </div>
      <div className="content">
        <div className="liveCard">
          <div className="title">今日直播</div>
          <div className="card-box">
            {todayLiveList.map((item: LiveSimpleInfoParam, index: number) => {
              return index < 3 || showMoreLive ? (
                <div
                  className="card"
                  onClick={() => handleClickLiveInfoCard(item)}
                  key={item.room_id}
                >
                  <div className="card-left">
                    <div className="live-title">
                      <img
                        className="icon"
                        src="https://feed.youshu.cc/readwith/media/picture/63326d645c7d5.png"
                        alt=""
                      />
                      {item.title}
                    </div>
                    <div className="time">直播时间：{getLiveTime(item)}</div>
                    <div className="live-id">
                      {item.is_test ? <span>测试直播</span> : null}
                      直播ID：{item.live_id}
                    </div>
                  </div>
                  <div className="card-right">
                    <img src={item.image_url} alt="" />
                  </div>
                </div>
              ) : null;
            })}

            {todayLiveList.length > 3 ? (
              <div className="card-footer">
                {!showMoreLive ? (
                  <div onClick={() => setShowMoreLive(true)}>
                    展开更多
                    <img
                      src="https://feed.youshu.cc/readwith/media/picture/63318072801a1.png"
                      alt=""
                      className="icon"
                    />{' '}
                  </div>
                ) : (
                  <div onClick={() => setShowMoreLive(false)}>
                    收起更多
                    <img
                      src="https://feed.youshu.cc/readwith/media/picture/63325cc14b6cb.png"
                      alt=""
                      className="icon"
                    />
                  </div>
                )}
              </div>
            ) : null}
            {!(todayLiveList || []).length ? (
              <div className="not-data">
                <img
                  src="https://feed.youshu.cc/readwith/media/picture/6274ef0e64fc3.png"
                  alt=""
                />
                暂无直播
              </div>
            ) : null}
          </div>
        </div>
        <div className="liveCard all-live">
          <div className="title">
            全部直播
            <div className="title-btn">
              <div className="live-type-btn">
                {liveStatusList.map((item) => {
                  return (
                    <span
                      className={
                        item.value == liveStatusRef.current
                          ? 'btn btn-activity'
                          : 'btn'
                      }
                      onClick={() => {
                        liveStatusRef.current = item.value;
                        livePageRef.current = '1';
                        getTeacherLiveList();
                      }}
                      key={item.value}
                    >
                      {item.label}
                      {item.value == 2 && livingCount > 0
                        ? `(${livingCount})`
                        : item.value == 1 && unstartCount > 0
                          ? `(${unstartCount})`
                          : item.value == 3 && endCount > 0
                            ? `(${endCount})`
                            : null}
                    </span>
                  );
                })}
              </div>
              <div
                className="live-time"
                onClick={() => handleClickSortLiveList()}
              >
                {sortTypeRef.current == 1 ? (
                  <img
                    src="https://feed.youshu.cc/readwith/media/picture/6347b7695941c.png"
                    alt=""
                  />
                ) : (
                  <img
                    src="https://feed.youshu.cc/readwith/media/picture/6347b7b6a9237.png"
                    alt=""
                  />
                )}
                直播时间
              </div>
            </div>
          </div>
          <div className="card-box">
            {teacherLiveList.map((item: LiveSimpleInfoParam) => {
              return (
                <div
                  className="card"
                  key={item.room_id}
                  onClick={() => handleClickLiveInfoCard(item)}
                >
                  <div className="card-left">
                    <div className="live-title">
                      <img
                        className="icon"
                        src="https://feed.youshu.cc/readwith/media/picture/63326d645c7d5.png"
                        alt=""
                      />
                      {item.title}
                    </div>
                    <div className="time">直播时间：{getLiveTime(item)}</div>
                    <div className="live-id">
                      {item.is_test ? <span>测试直播</span> : null}
                      直播ID：{item.live_id}
                    </div>
                  </div>
                  <div className="card-right">
                    <img src={item.image_url} alt="" />
                  </div>
                </div>
              );
            })}
            {!(teacherLiveList || []).length ? (
              <div className="not-data">
                <img
                  src="https://feed.youshu.cc/readwith/media/picture/6274ef0e64fc3.png"
                  alt=""
                />
                暂无直播
              </div>
            ) : null}
            {(teacherLiveList || []).length && !getTeacherLiveListCount() ? (
              <div className="scroll-bottom">到底啦～</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LiveListPage;