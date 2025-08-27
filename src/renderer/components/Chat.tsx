import React, { useState, useEffect, useRef } from 'react';
import OSS from 'ali-oss';
// import { shell } from 'electron';
import { LStorage } from '../utils/tools';
import {
  Input,
  message as Message,
  Upload,
  Popover,
  Alert,
  Checkbox,
  notification,
} from 'antd';
import ImgIcon from './ImgIcon';
import { BellOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { selectRoomConfig } from '../reducers/index';

const { TextArea } = Input;
import './chat.scss';
import {
  GetLiveOssToken,
  SendMsg,
  ForbidMsg,
  ForbidRoom,
  GetAdminGroupLatestChatMsg,
  SendAdminGroupMsg,
  CommentOperate,
} from '../api';
import errorLog from '../utils/errorLog';
import { Tool } from '../utils/tools';
import RewardMarquee from './RewardMarquee';
import UserList from './chat/UserList';
const labelCss: {
  [key: string]: { [key: string]: string };
} = {
  '1705056156214': {
    background: '#EEF5FF',
    border: '1px solid #93BEFF',
    color: '#5490EB',
  },
  '1705056187472': {
    background: '#E3FFFF',
    border: '1px solid #60E1E1',
    color: '#39BEBE',
  },
  '1705056221168': {
    background: '#FFE8E8',
    border: '1px solid #F28282',
    color: '#E05D5D',
  },
  '1705056256694': {
    background: '#fff3d6',
    border: '1px solid #FFB82B',
    color: '#F48E27',
  },
  '1705056283189': {
    background: '#FFECE5',
    border: '1px solid #FF9270',
    color: '#F45727',
  },
  '1705056318043': {
    background: '#FFE8EF',
    border: '1px solid #F296B2',
    color: '#EC5280',
  },
  '1705055479249': {
    background: '#E2FAFD',
    border: '1px solid #2AB0E9',
    color: '#2AB0E9',
  },
  '1705055872510': {
    background: '#EAEAFF',
    border: '1px solid #8563DC',
    color: '#8563DC',
  },
  '1705055893749': {
    background: '#FFF3D6',
    border: '1px solid #FFB82B',
    color: '#F48E27',
  },
  '1712914204091': {
    background: '#E2FAFD',
    border: '1px solid #2AB0E9',
    color: '#2AB0E9',
  },
  '1712914253960': {
    background: '#EAEAFF',
    border: '1px solid #8563DC',
    color: '#8563DC',
  },
  '1712914293802': {
    background: '#FFF3D6',
    border: '1px solid #FFB82B',
    color: '#F48E27',
  },
};
let ossClient: any = null;
let isCanScroll: boolean = true; // 是否可以滚动
interface ChatParam {
  ysLiveClient: any;
}
export default function Chat(props: ChatParam) {
  const roomConfig = useSelector(selectRoomConfig);
  const dispatch = useDispatch();
  const { ysLiveClient } = props;
  const { roomInfo } = roomConfig;
  const EVENT = ysLiveClient.EVENT;
  const [text, setText] = useState('');
  const [adminText, setAdminText] = useState('');
  const [nav, setNav] = useState(1);
  const navRef: any = useRef(1); // 等待展示的消息
  const [showRed, setShowRed] = useState(false);
  const [notice, setNotice] = useState({
    type: '',
    content: '',
    link: '',
  });
  const waitingShowMsgs: any = useRef([]); // 等待展示的消息
  const msgTimer: any = useRef(); // 消费等待展示消息定时器
  const cacheFakeMsgs: any = useRef([]); // 缓存伪评论消息
  const fakseMsgTimer: any = useRef(); // 消费伪评论消息定时器

  const chatArr: any = useRef([]); //已展示消息
  const [chatList, setChatList] = useState([]); // 聊天列表
  const adminChatArr: any = useRef([]); //admin消息
  const [adminChatList, setAdminChatList] = useState([]); // 助教聊天列表
  const [onlineNums, setOnlineNums] = useState(''); // 在线人数
  const [muteChecked, setMuteChecked] = useState(false); // 禁言
  // const [isCanScroll, setIsCanScroll] = useState(true);
  const userInfo = LStorage.getItem('USER_INFO');
  const [messageListHeight, setMessageListHeight] = useState('');
  const [userListHeight, setUserListHeight] = useState('');
  const [replyMsgQuote, setReplyMsgQuote] = useState(null);

  // 发送消息
  function send(body: object) {
    SendMsg(roomConfig.roomInfo.room_id, userInfo.userId, body)
      .then((res) => {
        if (res.status.code != 200) {
          console.warn(res);
        }
        setText('');
        closeReply();
      })
      .catch((error) => {
        console.warn(error);
      });
  }

  // 发送消息
  function sendAdmin(body: object) {
    SendAdminGroupMsg(
      roomConfig.roomInfo.room_id,
      Number(userInfo.userId),
      body,
      userInfo.app,
    )
      .then((res) => {
        if (res.status.code != 200) {
          console.warn(res);
        }
        setAdminText('');
      })
      .catch((error) => {
        console.warn(error);
      });
  }

  function sendClassMessage() {
    let textValue = text.replace(/\s+/g, '');
    if (!textValue) {
      Message.warning('请输入发送内容');
      setTimeout(() => {
        setText('');
      }, 100);
      return;
    }

    setText('');
    let quote: string = '';
    // 有书要传quote
    if (userInfo.app == 10120) {
      quote = JSON.stringify({
        membership_icon: '',
        user_type_icon: 'speaker_icon',
        level_icon: '',
        ...replyMsgQuote,
        create_time: Tool.timestampToStr(new Date().getTime()),
      });
    }
    let _message = {
      action: replyMsgQuote ? 'sendReplyMsg' : 'sendUserLiveMsg',
      type: 'text',
      text: textValue,
      userId: userInfo.userId,
      // userID: userInfo.userId,
      avatar: userInfo.avatar
        ? userInfo.avatar
        : 'http://feed.youshu.cc/readwith/media/picture/5f291d15a913b.png',
      nick: userInfo.nick ? userInfo.nick : '老师',
      source: 'PC',
      role: userInfo.role,
      quote,
    };
    send(_message);
  }

  // 发送admin文本消息
  function sendAdminMessage() {
    let textValue = adminText.replace(/\s+/g, '');
    if (!textValue) {
      Message.warning('请输入发送内容');
      setTimeout(() => {
        setAdminText('');
      }, 100);
      return;
    }

    setAdminText('');
    let quote: string = '';
    // 有书要传quote
    quote = JSON.stringify({
      create_time: new Date(),
      is_popup: false,
    });
    let _message = {
      action: 'sendTextMsg',
      type: 'adminGroupMsg',
      text: textValue,
      userId: Number(userInfo.userId),
      avatar: userInfo.avatar
        ? userInfo.avatar
        : 'http://feed.youshu.cc/readwith/media/picture/5f291d15a913b.png',
      nick: userInfo.nick ? userInfo.nick : '老师',
      source: 'PC',
      role: userInfo.role,
      quote,
    };
    sendAdmin(_message);
  }

  // @ts-ignore
  function sendImageMessage(file) {
    GetLiveOssToken().then((res) => {
      if (res?.status?.code == 200) {
        ossClient = new OSS({
          accessKeyId: res.oss_token.AccessKeyId,
          accessKeySecret: res.oss_token.AccessKeySecret,
          stsToken: res.oss_token.SecurityToken,
          bucket: res.oss_info.OssBucket,
          endpoint: res.oss_info.OssEndpoint,
        });

        ossUpload(file, res.oss_info.OssPath)
          .then((json: any) => {
            let url: string = `${res.oss_info.OssCdn}${json.name}`;
            let quote: string = '';
            // 有书要传quote
            if (userInfo.app == 10120) {
              quote = JSON.stringify({
                create_time: Tool.timestampToStr(new Date().getTime()),
                membership_icon: '',
                user_type_icon: 'speaker_icon',
                level_icon: '',
              });
            }
            let _message = {
              action: 'sendUserLiveMsg',
              type: 'image',
              img: url,
              // userID: userInfo.userId,
              avatar: userInfo.avatar
                ? userInfo.avatar
                : 'http://feed.youshu.cc/readwith/media/picture/5f291d15a913b.png',
              nick: userInfo.nick ? userInfo.nick : '老师',
              source: 'PC',
              role: userInfo.role,
              quote,
            };
            send(_message);
          })
          .catch((err) => {
            errorLog(
              {
                code: 'uplaodImgErr',
                log_type: 'MESSAGE_LOG',
                request_data: {
                  room_id: roomConfig?.roomInfo?.room_id,
                },
                response_data: {
                  code: '',
                  msg: JSON.stringify(err),
                },
                message: '图片上传失败',
              },
              'ERR',
            );
            Message.error('图片上传失败');
          });
      }
    });

    return false;
  }

  //
  function sendAdminImageMessage(file) {
    GetLiveOssToken().then((res) => {
      if (res?.status?.code == 200) {
        ossClient = new OSS({
          accessKeyId: res.oss_token.AccessKeyId,
          accessKeySecret: res.oss_token.AccessKeySecret,
          stsToken: res.oss_token.SecurityToken,
          bucket: res.oss_info.OssBucket,
          endpoint: res.oss_info.OssEndpoint,
        });

        ossUpload(file, res.oss_info.OssPath)
          .then((json: any) => {
            let url: string = `${res.oss_info.OssCdn}${json.name}`;
            let quote: string = '';
            // 有书要传quote
            quote = JSON.stringify({
              create_time: new Date(),
              is_popup: false,
            });
            let _message = {
              action: 'sendImageMsg',
              type: 'adminGroupMsg',
              img: url,
              userId: Number(userInfo.userId),
              // userID: userInfo.userId,
              avatar: userInfo.avatar
                ? userInfo.avatar
                : 'http://feed.youshu.cc/readwith/media/picture/5f291d15a913b.png',
              nick: userInfo.nick ? userInfo.nick : '老师',
              source: 'PC',
              role: userInfo.role,
              quote,
            };
            sendAdmin(_message);
          })
          .catch((err) => {
            errorLog(
              {
                code: 'uplaodImgErr',
                log_type: 'MESSAGE_LOG',
                request_data: {
                  room_id: roomConfig?.roomInfo?.room_id,
                },
                response_data: {
                  code: '',
                  msg: JSON.stringify(err),
                },
                message: '图片上传失败',
              },
              'ERR',
            );
            Message.error('图片上传失败');
          });
      }
    });

    return false;
  }
  // 收到im消息
  function onMessageReceived(item: { data: any; eventCode: string }) {
    // console.log('chat onMessageReceived', item);

    // event.data - 存储 Message 对象的数组 - [Message]
    let msg: any = item.data;
    // 有书/有师都走这里
    if (msg.type == 'text' || msg.type == 'image' || msg.type == 'imageText') {
      if (msg.userID == userInfo.userId) msg.isSelf = true;
      if (msg.isHidden) return;
      let quote = JSON.parse(msg.quote);
      if (
        msg.action == 'sendReplyMsg' &&
        quote.userID != userInfo.userId &&
        quote.isHidden
      ) {
        // 回复已屏蔽的消息，不做处理
        return;
      }
      if (waitingShowMsgs.current.length > 500) {
        // 打抛弃消息log
        errorLog(
          {
            code: 'discardMsg',
            log_type: 'MESSAGE_LOG',
            request_data: {
              room_id: roomConfig?.roomInfo?.room_id,
            },
            response_data: {
              code: '',
              msg: JSON.stringify({
                type: 'cacheFull',
                text: '缓存已满',
                num: 1,
              }),
            },
            message: '抛弃消息',
          },
          'INFO',
        );
        return;
      }
      let tempArr = waitingShowMsgs.current;
      tempArr.push({
        ...msg,
        quote,
      });
      waitingShowMsgs.current = tempArr;
      // 仅有师走这里
    } else if (msg.type == 'businessText') {
      let text = JSON.parse(msg.text) || {};
      if (text.type == 'board') {
        setNotice(text);
      } else if (text.type == 'cancel_top' || text.type == 'set_top') {
        // 更新置顶消息（已删除）
      }
      // 仅有师走这里
    } else if (msg.type == 'liveSystemNotice') {
      // console.log(msg)
      if (msg.action == 'roomForbid') {
        // 全体禁言
        setMuteChecked(true);
        // console.log(muteChecked)
      } else if (msg.action == 'roomCancelForbid') {
        // 取消全体禁言
        setMuteChecked(false);
      } else if (msg.action == 'onlineNums') {
        // 在线人数更新
        let text = JSON.parse(msg.text) || {};
        setOnlineNums(text.OnlineNums);
      }
      // 仅有书走这里
    } else if (msg.type == 'liveSystemMsg') {
      if (msg.action == 'liveRadioNotice') {
        // 直播公告
        // console.log('直播公告', JSON.parse(msg.quote));
        let notice = JSON.parse(msg.quote).radio_notice_content;
        let link = JSON.parse(msg.quote).notice_url || '';
        setNotice({
          type: 'board',
          content: notice,
          link: link,
        });
      } else if (msg.action == 'liveStatusChange') {
        // 直播状态变更
      } else if (msg.action == 'fakeCommentTaskOperate') {
        // 伪评论
        let task = JSON.parse(msg.quote);
        // console.log('fakeCommentTaskOperate', task);
        if (task.operate_type == 2) {
          // 取消伪评论任务
          delFakeMsgs(task.fake_task_id);
        }
      } else if (msg.action == 'adminUploadFile') {
        Message.info(msg.text);
      }
    } else if (msg.type == 'userAction') {
      if (msg.action == 'liveRemoveMsg' || msg.action == 'liveRevokeMsg') {
        // 删除消息
        let relate_msg_id = JSON.parse(msg.quote).relate_msg_id;
        // console.log('撤回/删除', relate_msg_id)
        chatArr.current = chatArr.current.filter((item: any) => {
          return item.msgId != relate_msg_id;
        });
        const newArr = chatArr.current.concat([]);
        setChatList(newArr);
      }
    } else if (msg.type == 'adminGroupMsg') {
      if (msg.action == 'sendTextMsg' || msg.action == 'sendImageMsg') {
        // 删除消息
        // console.log('adminGroupMsg', msg);
        // 添加到消息列表
        if (msg.userID == userInfo.userId) msg.isSelf = true;
        msg.msg_id = msg.msgId;
        msg.quote = JSON.parse(msg.quote || '{}');
        adminChatArr.current.push(msg);
        const newArr = adminChatArr.current.concat([]);
        setAdminChatList(newArr);

        if (navRef.current == 1) {
          if (msg.userID != userInfo.userId) {
            setShowRed(true);
          }
        } else if (navRef.current == 2) {
          setTimeout(function () {
            const msgEnd: any = document.getElementById('msgEnd-2');
            isCanScroll && msgEnd.scrollIntoView();
          }, 100);
        }
        // 弹窗提示消息
        if (msg.userID != userInfo.userId && msg.quote.is_popup) {
          // console.log('收到is_popup消息', msg);
          if (msg.action == 'sendImageMsg') {
            return;
          }
          notification.destroy('popupMsg');
          const btn = (
            <div className="behave">
              <div className="ok-btn" onClick={() => handleClickPopupOK()}>
                ok
              </div>
              <div
                className="reply-btn"
                onClick={() => handleClickPopupReply()}
              >
                回复
              </div>
            </div>
          );
          const args: any = {
            message: '提醒消息',
            icon: <BellOutlined style={{ color: '#2BAF6A' }} />,
            placement: 'topLeft',
            description:
              msg.nick +
              '：' +
              (msg.text.length > 40 ? msg.text.slice(0, 40) + '...' : msg.text),
            duration: 10,
            key: 'popupMsg',
            btn: btn,
          };
          notification.open(args);
        }
      }
    }
  }

  // 收到伪评论列表
  function onFakeMessagesReceived(item: { data: any; eventCode: string }) {
    // console.log('chat onFakeListMessageReceived', item);
    let newArr: any = cacheFakeMsgs.current.concat(item.data);
    newArr.sort((a: { send_time: number }, b: { send_time: number }) => {
      return a.send_time - b.send_time;
    });
    cacheFakeMsgs.current = newArr;
  }

  // 取消伪评论任务，删除对应伪评论的消息
  function delFakeMsgs(fake_task_id: any) {
    let newArr: any =
      cacheFakeMsgs.current &&
      cacheFakeMsgs.current.filter((item: any) => {
        return item.quote.fake_task_id != fake_task_id;
      });
    cacheFakeMsgs.current = newArr;
  }

  // OSS直传
  function ossUpload(file: any, ossPath: string) {
    let file_type = file.name.substr(file.name.lastIndexOf('.')).toLowerCase();

    let reader = new FileReader();
    reader.readAsArrayBuffer(file);

    return new Promise((resolve, reject) => {
      reader.onload = function () {
        let date = new Date();
        let storeAs = ossPath + '/' + date.getTime() + file_type;

        // 上传
        let promise = ossClient.multipartUpload(storeAs, file, {
          progress: async function (p: any, checkpoint: any) {
            // 断点记录点。 浏览器重启后无法直接继续上传，需用户手动触发进行设置。
            let progressPercent = Math.ceil(p * 100);
            // console.log(p, checkpoint, progressPercent)
          },
        });
        promise
          .then((res: any) => {
            // console.log('文件上传成功：', res)
          })
          .catch((err: any) => {
            reject(err);
            // console.log('文件上传失败：', err);
          });
        resolve(promise);
      };
    });
  }

  // 禁言
  function setMute(item: any) {
    ForbidMsg({
      room_id: Number(roomConfig.roomInfo.room_id),
      time: 7200,
      user_id: Number(item.userID),
      role: userInfo.role,
      source: 'PC',
    })
      .then((res) => {
        if (res.status.code != 200) {
          console.warn(res);
        }
      })
      .catch((error) => {
        console.warn(error);
      });
  }

  // 全体禁言
  function setMuteAll(e: any) {
    // console.log(`checked = ${e.target.checked}`);
    let checked = e.target.checked;
    ForbidRoom({
      room_id: Number(roomConfig.roomInfo.room_id),
      time: checked ? 720000 : 0,
      user_id: Number(userInfo.userId),
      role: userInfo.role,
      source: 'PC',
    })
      .then((res) => {
        if (res.status.code != 200) {
          console.warn(res);
        }
      })
      .catch((error) => {
        console.warn(error);
      });
  }

  function textChange(e: any) {
    e.persist();
    let text = e.target.value;
    setText(text);
  }

  function adminTextChange(e: any) {
    e.persist();
    let text = e.target.value;
    setAdminText(text);
  }

  function formatRole(role: string, role_label?: string): string {
    if (role == 'ANCHOR') {
      return '主讲人';
    } else if (role == 'ADMIN') {
      return role_label || '主持人';
    } else if (role == 'MONITOR') {
      return role_label || '班长';
    } else {
      return '学生';
    }
  }

  function getMessageListHeight() {
    const height =
      document.querySelector('.roomRight').offsetHeight -
      130 -
      document.querySelector('.chat-message-control').offsetHeight;
    // console.log('height',height);
    setMessageListHeight(height + 'px');
  }
  function getUserListHeight() {
    const height =
      document.querySelector('.roomRight').offsetHeight -
      document.querySelector('.nav').offsetHeight -
      48;
    setUserListHeight(height + 'px');
  }

  useEffect(() => {
    waitingShowMsgs.current = [];
    cacheFakeMsgs.current = [];
    chatArr.current = [];
    ysLiveClient.on(EVENT.TIM_MESSAGE_RECEIVED, onMessageReceived);
    ysLiveClient.on(EVENT.TIM_ADMIN_MESSAGE_RECEIVED, onMessageReceived);
    ysLiveClient.on(EVENT.FAKE_MESSAGES_RECEIVED, onFakeMessagesReceived);
    window.addEventListener('resize', onResizeWindow);
    setMuteChecked(roomInfo.shut_all == 'TRUE');
    let num = roomInfo.online_nums;
    if (num > 10000) {
      num = (num / 10000).toFixed(1) + '万';
    }
    setOnlineNums(num);
    // 仅有师获取置顶消息列表
    // if (userInfo.app == 10110) getTopList()
    getMessageListHeight();
    startMsgTimer();
    startFakeMsgTimer();
    getAdminChatList();
    return () => {
      clearData();
    };
  }, []);

  function onResizeWindow() {
    if (navRef.current != 3) {
      getMessageListHeight();
    } else {
      getUserListHeight();
    }
  }

  // 消费待展示消息
  function startMsgTimer() {
    if (msgTimer.current) clearInterval(msgTimer.current);
    msgTimer.current = setInterval(() => {
      let num = Math.min(waitingShowMsgs.current.length, 20);
      if (num > 0) {
        let comments = waitingShowMsgs.current.splice(0, num);
        if (comments.length > 0) {
          chatArr.current = chatArr.current.concat(comments);
          const newArr = chatArr.current.concat([]);
          setChatList(newArr);
          const msgEnd: any = document.getElementById('msgEnd-1');
          isCanScroll && msgEnd && msgEnd.scrollIntoView();
          if (chatArr.current.length > 500) {
            chatArr.current.splice(0, 100);
          }
        }
      }
    }, 200);
  }

  // 消费伪评论
  function startFakeMsgTimer() {
    if (fakseMsgTimer.current) clearInterval(fakseMsgTimer.current);
    fakseMsgTimer.current = setInterval(() => {
      let nowTime: number = Math.floor(new Date().getTime() / 1000);
      // 取出消息
      let nowMsgs = cacheFakeMsgs.current.filter(
        (item: { send_time: number }) => {
          return item.send_time <= nowTime;
        },
      );
      if (nowMsgs && nowMsgs.length > 0) {
        // 删除取出的消息
        cacheFakeMsgs.current.splice(0, nowMsgs.length);
        // 超出待显示上限，不再放入
        if (waitingShowMsgs.current.length < 500) {
          waitingShowMsgs.current.push(...nowMsgs);
        } else {
          // 打抛弃消息log
          errorLog(
            {
              code: 'discardMsg',
              log_type: 'MESSAGE_LOG',
              request_data: {
                room_id: roomConfig?.roomInfo?.room_id,
              },
              response_data: {
                code: '',
                msg: JSON.stringify({
                  type: 'cacheFull',
                  text: '缓存已满',
                  num: nowMsgs.length,
                }),
              },
              message: '抛弃消息',
            },
            'INFO',
          );
        }
      }
    }, 1000);
  }

  // 点击切换
  function handleClickNav(i: number) {
    if (navRef.current == i) {
      return;
    }
    setNav(i);
    navRef.current = i;
    if (i == 2) {
      clearRed();
    }

    if (i != 3) {
      setTimeout(function () {
        const msgEnd: any = document.getElementById('msgEnd-' + i);
        isCanScroll && msgEnd.scrollIntoView();
      }, 100);
    } else {
      getUserListHeight();
    }
  }

  // 清除红点
  function clearRed() {
    setShowRed(false);
  }

  // 点击弹窗消息，回复ok后，关闭弹窗/清空红点
  function handleClickPopupOK() {
    notification.destroy('popupMsg');
    clearRed();
    let quote: string = JSON.stringify({
      create_time: new Date(),
      is_popup: false,
    });
    let _message = {
      action: 'sendTextMsg',
      type: 'adminGroupMsg',
      text: 'OK',
      userId: Number(userInfo.userId),
      // userID: userInfo.userId,
      avatar: userInfo.avatar
        ? userInfo.avatar
        : 'http://feed.youshu.cc/readwith/media/picture/5f291d15a913b.png',
      nick: userInfo.nick ? userInfo.nick : '老师',
      source: 'PC',
      role: userInfo.role,
      quote,
    };
    sendAdmin(_message);
  }

  // 弹窗提示消息点击回复，自动切换到消息列表，并且获取输入框焦点
  function handleClickPopupReply() {
    notification.destroy('popupMsg');
    handleClickNav(2);
    setTimeout(() => {
      document.getElementById('admin-chat-input')?.focus();
    }, 300);
  }

  // 获取助教历史消息
  function getAdminChatList() {
    GetAdminGroupLatestChatMsg(Number(roomConfig.roomInfo.room_id))
      .then((res) => {
        if (res.status.code == 200) {
          let arr = res.msg_list || [];
          if (arr.length > 0) {
            arr.map((item: any) => {
              item.quote = JSON.parse(item.quote || '{}');
              item.userID = item.userId;
              if (item.userID == userInfo.userId) {
                item.isSelf = true;
              }
            });
            arr.reverse();
            adminChatArr.current = arr;
            setAdminChatList(arr);
          }
        }
      })
      .catch((error) => {
        console.warn(error);
      });
  }

  function clearData() {
    ysLiveClient.off(EVENT.TIM_MESSAGE_RECEIVED, onMessageReceived);
    ysLiveClient.off(EVENT.TIM_ADMIN_MESSAGE_RECEIVED, onMessageReceived);
    ysLiveClient.off(EVENT.FAKE_MESSAGES_RECEIVED, onFakeMessagesReceived);
    window.removeEventListener('resize', onResizeWindow);
    chatArr.current = [];
    cacheFakeMsgs.current = [];
    waitingShowMsgs.current = [];
    clearInterval(fakseMsgTimer.current);
    clearInterval(msgTimer.current);
    ossClient = null;
  }

  function handleAction(action: string, msg: any) {
    let obj = {
      revoke: 1,
      del: 2,
      delAndForbidden: 3,
    };
    switch (action) {
      case 'reply':
        replyMsg(msg);
        break;
      case 'revoke':
      case 'del':
      case 'delAndForbidden':
        // console.log('消息', msg);
        CommentOperate(
          roomConfig.roomInfo.room_id,
          obj[action],
          msg.userID,
          msg.msgId,
        )
          .then((res) => {
            if (res.status.code != 200) {
              // console.warn(res)
            }
            Message.success('操作成功');
          })
          .catch((error) => {
            console.warn(error);
          });
        break;
      default:
        break;
    }
  }

  function actionList(msg: any) {
    let list: any[] = [];
    let imgObj = {
      reply: 'http://feed.youshu.cc/readwith/media/picture/62ea150b2ec50.png',
      revoke: 'http://feed.youshu.cc/readwith/media/picture/62ea15f6d7fd7.png',
      del: 'http://feed.youshu.cc/readwith/media/picture/62ea150946c77.png',
      delAndForbidden:
        'http://feed.youshu.cc/readwith/media/picture/62ea15081fddc.png',
    };
    // 自己的消息
    if (msg.userID == userInfo.userId) {
      list = [
        {
          action: 'revoke',
          label: '撤回',
        },
      ];
      // 助教消息
    } else if (msg.role == 'ADMIN') {
      list = [
        {
          action: 'reply',
          label: '引用回复',
        },
      ];
      // 伪评论消息
    } else if (msg.isVirtual) {
      list = [
        {
          action: 'reply',
          label: '引用回复',
        },
        {
          action: 'del',
          label: '删除',
        },
      ];
      // 普通学员消息 班长消息
    } else {
      list = [
        {
          action: 'reply',
          label: '引用回复',
        },
        {
          action: 'del',
          label: '删除',
        },
        {
          action: 'delAndForbidden',
          label: '删除并拉黑',
        },
      ];
    }
    // console.log('actionList', list);

    return (
      <div className="action-box">
        {list &&
          list.map((item: any, index: number) => {
            return (
              <div
                className="action-item"
                key={index}
                onClick={() => handleAction(item.action, msg)}
              >
                <img src={imgObj[item.action]} alt="" />
                <p>{item.label}</p>
              </div>
            );
          })}
      </div>
    );
  }

  function replyMsg(msg: any) {
    if (msg.type == 'image') {
      return;
    }
    setReplyMsgQuote(msg);
    setText('');
    setTimeout(() => {
      document.getElementById('chat-input')?.focus();
    }, 300);
  }

  function closeReply() {
    setReplyMsgQuote(null);
  }

  return (
    <div className="chat-message-container">
      <div className="nav">
        <p
          onClick={() => handleClickNav(1)}
          className={nav == 1 ? 'nav-item active' : 'nav-item'}
        >
          互动
        </p>
        <p
          onClick={() => handleClickNav(3)}
          className={nav == 3 ? 'nav-item active' : 'nav-item'}
        >
          学员
        </p>
        <p
          onClick={() => handleClickNav(2)}
          className={nav == 2 ? 'nav-item active' : 'nav-item'}
        >
          助教{showRed ? <span className="red"></span> : null}
        </p>
      </div>
      {ysLiveClient ? <RewardMarquee ysLiveClient={ysLiveClient} /> : null}
      {nav == 1 ? (
        <div className="nav-container">
          <div className="chat-message-content">
            {/* <div className="chat-message-title">聊天列表<i className="title-line"></i></div> */}

            <div className="top-msg-place">
              {notice.content && (
                <Alert
                  className={notice.link ? 'link' : ''}
                  message={notice.content}
                  closable
                  onClick={() => {
                    (window as any).electron.shell.openExternal(notice.link);
                  }}
                  onClose={(event: any) => {
                    event.stopPropagation();

                    setNotice({
                      type: '',
                      content: '',
                      link: '',
                    });
                  }}
                  type="success"
                />
              )}
            </div>

            <div
              style={{ height: messageListHeight }}
              className={`chat-message-list`}
              onMouseOver={() => (isCanScroll = false)}
              onMouseLeave={() => (isCanScroll = true)}
              onMouseOut={() => (isCanScroll = true)}
            >
              {chatList.map((item: any, index: number) => {
                return (
                  <div
                    key={item.quote.msgId || index}
                    className={item.isSelf ? 'message sent' : 'message receive'}
                  >
                    {/* <Popconfirm disabled={item.isSelf} placement="topLeft" title={`是否对${item.nick}禁言`} onConfirm={() => setMute(item)} okText="Yes" cancelText="No">
                                                <div className="avatar">
                                                    <img src={item.avatar} alt=""/>
                                                </div>
                                            </Popconfirm> */}
                    <div className="content">
                      <div className="nickname">
                        {item.role == 'MEMBER' &&
                        item.quote.user_level_label ? (
                          <span
                            className={
                              'level level-' + item.quote.user_level_label
                            }
                          ></span>
                        ) : null}
                        <span className="nick"> {item.nick} </span>
                        {item.role == 'ADMIN' || item.role == 'ANCHOR' ? (
                          <i className="role teacher">
                            {formatRole(item.role, item.quote.host_role_label)}
                          </i>
                        ) : null}
                        {item.role == 'MONITOR' ? (
                          <i className="role monitor">
                            {formatRole(
                              item.role,
                              item.quote.monitor_role_label,
                            )}
                          </i>
                        ) : null}
                        {(item.userRoleLabels || []).map(
                          (
                            item: {
                              label: string;
                              labelCssClass: string;
                            },
                            index: number,
                          ) => {
                            return index < 2 ? (
                              <span
                                className="command-label"
                                style={labelCss[item.labelCssClass]}
                              >
                                <img
                                  src={`https://feed.youshu.cc/readwith/media/0/${item.labelCssClass}.png`}
                                />
                                {item.label}
                              </span>
                            ) : null;
                          },
                        )}
                      </div>
                      <div className="info">
                        <p>
                          {item.quote.nick ? (
                            <span className="call-nick">
                              @{item.quote.nick}&nbsp;
                            </span>
                          ) : null}
                          {item.text}
                        </p>
                        {item.img ? <img src={item.img} alt="img" /> : null}
                        {item.imgUrls &&
                          item.imgUrls.map((url) => {
                            return (
                              <div className="imgbox">
                                <img src={url} alt="img" />
                              </div>
                            );
                          })}
                        {!(item.type == 'image' && item.role == 'ADMIN') ? (
                          <Popover
                            color="#323232"
                            placement="bottom"
                            content={() => actionList(item)}
                            trigger="click"
                          >
                            <img
                              className="info-more"
                              src="http://feed.youshu.cc/readwith/media/picture/5f6d5ecdbc64e.png"
                            />
                          </Popover>
                        ) : null}
                      </div>
                      <br />
                      {item.quote.msgId ? (
                        <div className="reply-info">
                          <p>
                            {item.quote.nick}:&nbsp;{item.quote.text}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
              <div
                id="msgEnd-1"
                style={{ height: 0, overflow: 'hidden' }}
              ></div>
            </div>
          </div>
          <div className="chat-message-control">
            {replyMsgQuote ? (
              <div className="input-reply">
                <p>
                  {replyMsgQuote?.nick}:{replyMsgQuote?.text}
                </p>
                <div className="close-reply" onClick={() => closeReply()}>
                  <img src="http://feed.youshu.cc/readwith/media/picture/613b022e82464.png" />
                </div>
              </div>
            ) : null}
            <TextArea
              id="chat-input"
              className="chat-input"
              maxLength={500}
              autoSize={{ minRows: 2, maxRows: 2 }}
              placeholder={
                replyMsgQuote ? `回复@${replyMsgQuote.nick}` : '输入互动消息…'
              }
              onResize={getMessageListHeight}
              onChange={(e: any) => textChange(e)}
              onPressEnter={sendClassMessage}
              value={text}
            />
            <div className="chat-message-btns">
              <div className="chat-btn-left">
                <Upload
                  showUploadList={false}
                  beforeUpload={(file: any) => {
                    sendImageMessage(file);
                    return false;
                  }}
                  className="chat-upload"
                  accept="image/*"
                >
                  <ImgIcon.Uploadpic className="chat-img-btn" />
                </Upload>
                {
                  //仅有师展示禁言
                  userInfo.app == 10110 ? (
                    <Checkbox
                      className="chat-mute-all"
                      checked={muteChecked}
                      onChange={setMuteAll}
                    >
                      全体禁言
                    </Checkbox>
                  ) : null
                }
              </div>
              <button
                className={text ? 'chat-button active' : 'chat-button'}
                onClick={() => sendClassMessage()}
              >
                发送
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {nav == 2 ? (
        <div className="nav-container">
          <div className="chat-message-content">
            <div
              style={{ height: messageListHeight }}
              className={`chat-message-list`}
              onMouseOver={() => (isCanScroll = false)}
              onMouseLeave={() => (isCanScroll = true)}
              onMouseOut={() => (isCanScroll = true)}
            >
              {adminChatList.map((item: any, index: number) => {
                return (
                  <div
                    key={item.msgId || index}
                    className={item.isSelf ? 'message sent' : 'message receive'}
                  >
                    {/* <Popconfirm disabled={item.isSelf} placement="topLeft" title={`是否对${item.nick}禁言`} onConfirm={() => setMute(item)} okText="Yes" cancelText="No">
                                                <div className="avatar">
                                                    <img src={item.avatar} alt=""/>
                                                </div>
                                            </Popconfirm> */}
                    <div className="content">
                      <div className="nickname">
                        {item.quote.user_level_label ? (
                          <span
                            className={
                              'level level-' + item.quote.user_level_label
                            }
                          ></span>
                        ) : null}
                        {item.nick}
                        {item.role == 'ADMIN' || item.role == 'ANCHOR' ? (
                          <i className="role teacher">
                            {formatRole(item.role, item.quote.host_role_label)}
                          </i>
                        ) : null}
                        {item.role == 'MONITOR' ? (
                          <i className="role monitor">
                            {formatRole(
                              item.role,
                              item.quote.monitor_role_label,
                            )}
                          </i>
                        ) : null}
                      </div>
                      <div className="info">
                        <p>
                          {item.quote.nick ? (
                            <span className="call-nick">
                              @{item.quote.nick}&nbsp;
                            </span>
                          ) : null}
                          {item.text}
                        </p>
                        {item.img ? <img src={item.img} alt="img" /> : null}
                      </div>
                      <br />
                      {item.quote.msgId ? (
                        <div className="reply-info">
                          <p>
                            {item.quote.nick}:&nbsp;{item.quote.text}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
              <div
                id="msgEnd-2"
                style={{ height: 0, overflow: 'hidden' }}
              ></div>
            </div>
          </div>
          <div className="chat-message-control">
            <TextArea
              id="admin-chat-input"
              className="chat-input"
              maxLength={500}
              autoSize={{ minRows: 2, maxRows: 2 }}
              placeholder="输入和助教沟通消息…"
              onResize={getMessageListHeight}
              onChange={(e: any) => adminTextChange(e)}
              onPressEnter={sendAdminMessage}
              value={adminText}
            />
            <div className="chat-message-btns">
              <div className="chat-btn-left">
                <Upload
                  showUploadList={false}
                  beforeUpload={(file: any) => {
                    sendAdminImageMessage(file);
                    return false;
                  }}
                  className="chat-upload"
                  accept="image/*"
                >
                  <ImgIcon.Uploadpic className="chat-img-btn" />
                </Upload>
              </div>
              <button
                className={adminText ? 'chat-button active' : 'chat-button'}
                onClick={() => sendAdminMessage()}
              >
                发送助教
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div
        style={{ display: nav == 3 ? 'block' : 'none' }}
        className="nav-container nav-container-userlist"
      >
        <UserList ysLiveClient={ysLiveClient} userListHeight={userListHeight} />
      </div>
    </div>
  );
}
