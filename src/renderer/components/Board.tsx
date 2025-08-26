import React, { useState, useRef, useEffect } from 'react';
import Mousetrap from 'mousetrap';
import { Button, Slider, InputNumber, Switch, Modal, notification, message as Message } from 'antd';
import { LeftCircleOutlined, LeftOutlined, RightOutlined} from '@ant-design/icons'
import { LStorage, Tool } from '../utils/tools';
import './Board.scss';

import { TRTCVideoStreamType } from 'trtc-electron-sdk/liteav/trtc_define';
import { LIVE_ACTIONS, LIVE_STAGE, VideoCallUserParams } from '../vars/room-vars';
import ImgIcon from './ImgIcon';
import DraggableModal from './common/DraggableModal';
import FileManager from './FileManager';

import { useSelector } from 'react-redux';
import { selectRoomConfig } from '../reducers/index';
import { useDispatch } from 'react-redux';
import { setValue, setList } from '../reducers/roomConfigSlice';
import CameraPosition from "./board/cameraPosition";
import LiveBGM from "./board/LiveBGM"

interface NewBoardParam {
    ysLiveClient: any;
    startLivePush: any;
    setCameraPosition: any;
}

let teduBoard: any = null;
let viewFileList: any = [];
let pptCurrentPage: any = {};
let sendMessageStatus: any = {};
let videoLoop: boolean = true; // 视频课件是否循环播放
let t1: any = 0; // 初始时间

export default function Board(props: NewBoardParam) {
    const { ysLiveClient, startLivePush, setCameraPosition } = props;
    const roomConfig = useSelector(selectRoomConfig);
    const { isStart, isTestLive, isShareScreen, boardFileList, fileVisibility, isTested, roomInfo, isOpenCamera, cameraPosition, isOpenMic, videoCallUserList, liveBGM, liveStage } = roomConfig;
    const dispatch = useDispatch();
    const EVENT = ysLiveClient?.EVENT || {};
    const [currentPage, setCurrentPage] = useState(1); // 当前课件页码
    const [currentAllPages, setCurrentAllPages] = useState(1); // 当前课件所有页数
    const [currentColor, setCurrentColor] = useState('#151515'); // 当前使用工具的颜色
    const [currentSize, setCurrentSize] = useState(50); // 当前使用工具的规格大小
    const [currentTool, setCurrentTool] = useState(1); // 当前使用的画笔工具
    const [boardSnapshot, setBoardSnapshot] = useState('');
    const [currentFid, setCurrentFid] = useState(''); // 当前显示的文件id
    const [currentBoardId, setCurrentBoardId] = useState(''); // 当前显示的ppt白板id
    const [showThumbnail, setShowThumbnail] = useState(false); // 显示/隐藏
    const [pptBoardThumbs, setPptBoardThumbs] = useState([]);
    const [showPpt, setShowPpt] = useState(false); // 显示选中ppt内容的缩略图列表
    const [pptTitle, setPptTitle] = useState(''); // 选中的ppt文件名称
    const [diggCount, setDiggCount] = useState(0); // 点赞数
    const [diggCountText, setDiggCountText] = useState('0'); // 转化后点赞文本
    const [onlineNums, setOnlineNums] = useState(''); // 在线人数
    const [showModel, setShowModel] = useState(false); // 上课弹窗是否展示
    const [hiddenBoardContrl, setHiddenBoardContrl] = useState(false); // 是否隐藏白板操作项
    const userInfo = LStorage.getItem('USER_INFO') || {};


    // 订阅白板回调
    function bindBoardEvent() {
        // 互动白板历史数据同步完成回调
        teduBoard.on(TEduBoard.EVENT.TEB_HISTROYDATA_SYNCCOMPLETED, () => {
            // console.log('TEB_HISTROYDATA_SYNCCOMPLETED', )
            teduBoard.setHandwritingEnable(true)
            getCurrent()
            getCurrentPageAndAllPages()
            boardReady()
        });
        // 互动白板同步数据事件
        teduBoard.on(TEduBoard.EVENT.TEB_SYNCDATA, (data: any) => {
            // console.log('sendBoardRealtimeDataMessage', data);
            sendBoardRealtimeDataMessage(data)
        });
        // 互动白板初始化事件
        teduBoard.on(TEduBoard.EVENT.TEB_INIT, (data: any) => {
            // console.log('TEB_INIT', data)
            setSize(50);
            onSetToolType(1);
            errorLog({
                code: "TEB_INIT",
                log_type: "MESSAGE_LOG",
                request_data: {
                    room_id: roomConfig?.roomInfo?.room_id,
                },
                message: '白板初始化成功'
            }, "INFO")
        });

        // 互动白板截图（快照）回调
        teduBoard.on(TEduBoard.EVENT.TEB_SNAPSHOT, (data: any) => {
            // console.log('======================:  ', 'TEB_SNAPSHOT', data);
            if (data.userData == '#DEFAULT') {
                setBoardSnapshot(data.image)
            }
        });
        
        // 互动白板错误事件
        teduBoard.on(TEduBoard.EVENT.TEB_ERROR, (errorCode: any, errorMessage: any) => {
            console.error(errorCode, errorMessage)
            errorLog({
                code: "TEB_ERROR",
                log_type: "MESSAGE_LOG",
                request_data: {
                    room_id: roomConfig?.roomInfo?.room_id,
                },
                response_data: {
                    code: errorCode||'',
                    msg: errorMessage||''
                },
                message: errorMessage||''
            }, "INFO")
        });

        // 互动白板警告事件
        teduBoard.on(TEduBoard.EVENT.TEB_WARNING, (warnCode: any, warnMessage: any) => {
            console.error(warnCode, warnMessage)
            errorLog({
                code: "TEB_WARNING",
                log_type: "MESSAGE_LOG",
                request_data: {
                    room_id: roomConfig?.roomInfo?.room_id,
                },
                response_data: {
                    code: warnCode||'',
                    msg: warnMessage||''
                },
                message: warnMessage||''
            }, "INFO")
        });

        // 视频播放状态回调
        teduBoard.on(TEduBoard.EVENT.TEB_VIDEO_STATUS_CHANGED, (result: any) => {
            // console.log('result', result);
            // 播放结束
            if (result.status == 8) {
                // console.log('videoLoop', videoLoop);
                if (videoLoop) {
                    setTimeout(() => {
                        teduBoard.playVideo();
                    }, 500);
                }
            // 播放暂停在结束位置（腾讯白板bug）也认为播放结束
            }
            else if (result.status == 6 && (parseInt(result.progress) == parseInt(result.duration))) {
                if (videoLoop) {
                    setTimeout(() => {
                        teduBoard.playVideo();
                    }, 500);
                }
            }
        });
        // 撤销状态改变
        teduBoard.on(TEduBoard.EVENT.TEB_OPERATE_CANUNDO_STATUS_CHANGED, (enable: boolean) => {
        
        });
        // 重做状态改变
        teduBoard.on(TEduBoard.EVENT.TEB_OPERATE_CANREDO_STATUS_CHANGED, (enable: boolean) => {
        
        });
        // ppt动画步数改变回调
        teduBoard.on(TEduBoard.EVENT.TEB_GOTOSTEP, (step: number, count: number) => {
            // console.log('ppt动画步数改变回调:  ', 'TEB_GOTOSTEP', ' step:', step, ' count:', count);
        });
        // 跳转白板页回调
        teduBoard.on(TEduBoard.EVENT.TEB_GOTOBOARD, (boardId: string, fid: string) => {
            console.log('跳转白板页回调:  ', 'TEB_GOTOBOARD', ' boardId:', boardId, ' fid:', fid);
            if (fid == "#DEFAULT") {
                getCurrentPageAndAllPages()
            }
            setCurrentBoardId(boardId);
            setCurrentFid(fid);
            setTimeout(() => {
                setSnapshot(fid)
            }, 300);
            let fileInfo = viewFileList.find((item: { fid: string; }, index: number) => {
                return item.fid == fid
            });
            let fileIndex = viewFileList.indexOf(fileInfo)
            // console.log('======fileInfo.fileType', fileInfo.fileType);
            if (fileInfo.fileType == 2 || fileInfo.fileType == 3) {
                let title = fileInfo.title
                let boardIds = teduBoard.getFileBoardList(fid)
                let slideIndex = boardIds.indexOf(boardId)
                pptCurrentPage[fid]=slideIndex
                setPptBoardThumbs(fileInfo.boardThumbs)
                setPptTitle(delSign(title))
                setShowPpt(true)
                
                //滚动到选中的ppt缩略图
                setTimeout(()=>{
                    scrollToPPTActive(slideIndex==-1?0:slideIndex)
                    getCurrentPageAndAllPages()
                },500)
            }else{
                //滚动到选中外部缩略图
                setTimeout(()=>{
                    scrollToActive(fileIndex)
                    getCurrentPageAndAllPages()
                },500)
            }
            // dispatch(setDevice('speaker', { volume: 0 }))
            // 如果是视频，静音
            if (fileInfo.fileType == 4) {
                setTimeout(()=>{
                    teduBoard.muteVideo(true)
                }, 500)
            }
        });
        // 增加H5动画PPT文件回调
        teduBoard.on(TEduBoard.EVENT.TEB_ADDH5PPTFILE, (fid: string) => {
            // console.log('======================:  ', 'TEB_ADDH5PPTFILE', ' fid:', fid);
            proBoardData();
        });
        // 增加文件回调
        teduBoard.on(TEduBoard.EVENT.TEB_ADDFILE, (fid: string) => {
            // console.log('======================:  ', 'TEB_ADDFILE', ' fid:', fid);
            proBoardData();
        });
        // 增加图片文件回调
        teduBoard.on(TEduBoard.EVENT.TEB_ADDTRANSCODEFILE, (fid: string) => {
            // console.log('======================:  ', 'TEB_ADDTRANSCODEFILE', ' fid:', fid);
            proBoardData();
        });
        // 增加转码文件回调
        teduBoard.on(TEduBoard.EVENT.TEB_ADDIMAGESFILE, (fid: string) => {
            // console.log('======================:  ', 'TEB_ADDIMAGESFILE', ' fid:', fid);
            proBoardData();
        });
        // 删除文件回调
        teduBoard.on(TEduBoard.EVENT.TEB_DELETEFILE, (fid: string) => {
            // console.log('======================:  ', 'TEB_DELETEFILE', ' fid:', fid);
            proBoardData();
        });
        // 文件上传进度
        teduBoard.on(TEduBoard.EVENT.TEB_FILEUPLOADPROGRESS, (data: any) => {
            // console.log('======================:  ', 'TEB_FILEUPLOADPROGRESS:: ', data);
            // showTip('上传进度:' + parseInt(data.percent * 100) + '%');
        });
        // 文件上传状态
        teduBoard.on(TEduBoard.EVENT.TEB_FILEUPLOADSTATUS, (status: number, data: any) => {
            // console.log('======================:  ', 'TEB_FILEUPLOADSTATUS', status, data);
            if (status === 1) {
                // console.log('上传成功');
            } else {
                // console.log('上传失败');
            }
            // document.getElementById('file_input').value = '';
        });
        // 转码进度
        teduBoard.on(TEduBoard.EVENT.TEB_TRANSCODEPROGRESS, (res: any) => {
            // console.log('=======  TEB_TRANSCODEPROGRESS 转码进度：', JSON.stringify(res));
        });
        
    }

    function delSign (title: string) {
        return title.split("?sign=")[0]
    }

    function getFileType (item: {fileType:any}) {
        switch (item.fileType) {
            case 6:
                return '图'
            case 4:
                return 'mp4'
            case 3:
                return 'pdf'
            case 2:
                return 'ppt'
            default:
                return '未知'
        }
    }


    function showErrorTip(title: string) {
        // console.log(title)
    }

    // 白板数据同步完成
    function boardReady () {
        // startBoardPush()
        // dispatch(setLog(LIVE_ACTIONS.startBoardPush))
    }


    // 监听窗口大小改变
    function resizeWindow() {
        let dom = document.getElementById('board-wrap');
        if (dom) {
            // dom.style.height = Math.round((dom.clientWidth * 9) / 16) + 'px';
            // dispatch(onResizeWindow())
        }
    }


    // 撤销
    function onUndo() {
        // ysboard.undo()
        teduBoard.undo()
    }
    // 重做
    function onRedo() {
        // ysboard.redo()
        teduBoard.redo()
    }

    // 动画上一步
    function prevStep() {
        // ysboard.prevStep();
        teduBoard.prevStep();
    }
    // 动画下一步
    function nextStep() {
        // ysboard.nextStep();
        teduBoard.nextStep();
    }

    function currentPageInputOnBlur() {
        let currentFileInfo = teduBoard.getFileInfo(teduBoard.getCurrentFile())
        let page = document.getElementById("currentPage")?.value || currentPage;
        if (page == currentPage) {
            console.log('当前页相同不需要切换');
            return
        }else {
            if(currentFileInfo.fileType == 2 || currentFileInfo.fileType == 3) {
                // teduBoard.getFileBoardList(fid)
                let BoardList = teduBoard.getFileBoardList(currentFileInfo.fid)
                if (page > BoardList.length || page == 0) {
                    return
                }
                let id = BoardList[page-1]
                teduBoard.gotoBoard(id)
                setCurrentPage(page)
            }
        }
    }

    function getCurrentPageAndAllPages() {
        let currentFileInfo = teduBoard.getFileInfo(teduBoard.getCurrentFile())
        if (currentFileInfo.fileType == 2 || currentFileInfo.fileType == 3) {
            setCurrentPage(currentFileInfo.currentPageIndex+1)
            setCurrentAllPages(currentFileInfo.pageCount||1)
        }else {
            setCurrentPage(1)
            setCurrentAllPages(1)
        }
    }

    // 选择画笔工具
    function onSetToolType(toolType: number) {
        setCurrentTool(toolType);
        // ysboard.setTool(toolType);
        teduBoard.setToolType(toolType);
    }

    // 选择颜色
    function onSetColor(color: any) {
        let colorHex = rgbToHex(color);
        setCurrentColor(color);
        // ysboard.setBrushColor(colorHex);
        // ysboard.setTextColor(colorHex);
        teduBoard.setBrushColor(colorHex);
        teduBoard.setTextColor(colorHex);
    }

    // 选择规格大小
    function setSize(size: number) {
        setCurrentSize(size);
        // ysboard.setTextSize(size);
        // ysboard.setBrushThin(size);
        teduBoard.setTextSize(size * 5<250?250:size * 5);
        teduBoard.setBrushThin(size);
    }

    //  清空当前页涂鸦(保留背景色/图片)
    function clearDraws() {
        // ysboard.clearDraw();
        teduBoard.clear();
    }

    function getCurrent() {
        setCurrentFid(teduBoard.getCurrentFile())
        setCurrentBoardId(teduBoard.getCurrentBoard())
        setSnapshot(teduBoard.getCurrentFile())
        let currentFileInfo = teduBoard.getFileInfo(teduBoard.getCurrentFile())
        //  当前若是视频
        if (currentFileInfo.fileType == 4) {
            // 将系统静音
            // dispatch(setDevice("speaker", { volume: 0 }))
            teduBoard.muteVideo(true)
            setTimeout(()=>{
                teduBoard.pauseVideo()
            }, 1000)
            
        }
    }


    function proBoardData() {
        Message.destroy('file')
        // let fileList = ysboard.getFileList();
        let fileList = teduBoard.getFileInfoList();
        let files = fileList.filter((item: any) => item.fid != '#DEFAULT');
        let list: any = [];
        setTimeout(() => {
            files.forEach((item: any) => {
                let thumbs = teduBoard.getThumbnailImages(item.fid);
                let ids = teduBoard.getFileBoardList(item.fid);
                let file = teduBoard.getFileInfo(item.fid);
                let boardThumbs = thumbs.map((thumb: string, index: number) => {
                    return {
                        fid: item.fid,
                        id: ids[index],
                        cover: thumb,
                        title: 'thumb',
                        ftype: 'thumb'
                    }
                })
                let cover = boardThumbs[0]?.cover
                let ftype = item.type;
                let sign = Tool.getId(item.title, 'sign') ? Tool.getId(item.title, 'sign') : Tool.getId(item.downloadURL, 'sign');
                if (item.downloadURL.match(/\.(mp4)/)) {
                    const coverImg = Tool.getId(item.title, 'cover')
                    ftype = 'video'
                    cover = item.downloadURL.includes('livevod')?coverImg : item.downloadURL + '&x-oss-process=video/snapshot,t_1000,f_jpg,w_0,h_0,m_fast';
                }
                if (item.type == 6 && file.boardInfoList.length > 0) {
                    ftype = 'img'
                    cover = file.boardInfoList[0].backgroundUrl;
                    sign = Tool.getId(cover, 'sign')
                }
                list.push({
                    ...item,
                    boardThumbs,
                    cover,
                    id: item.fid,
                    ftype,
                    sign,
                    currentBoardId: ids[0] ? ids[0] : ''
                })

            })
            dispatch(setList({ name: 'boardFile', list: list }))
            viewFileList = list
            // console.log('viewFileList', viewFileList)
        }, 500)
    }


    // 切换白板或文件
    function onSwitchFile(fid: string) {
        // ysboard.switchFile(fid);
        teduBoard.switchFile(fid);
        // setCurrentFid(fid);
    }

    // 切换缩略图或白板
    function thumbHandler(file: any) {
        let currentFileId = teduBoard.getCurrentFile()
        if (file.ftype == 'thumb') {
            // 内层点击
            if (currentFileId == file.fid) {
                // 当前文件，切换boardId
                teduBoard.gotoBoard(file.id)
            }else{
                // 其他文件，切换文件fid和boardId
                teduBoard.switchFile(file.fid, file.id)
            }
        }else if (file.ftype == 'video' || file.ftype == 'img') {
            teduBoard.switchFile(file.fid)
        }else {
            // 外层点击，进入ppt/pdf
            setPptBoardThumbs(file.boardThumbs)
            setPptTitle(delSign(file.title))
            setShowPpt(true)
            setTimeout(function(){
                scrollToPPTActive(pptCurrentPage[file.fid]?pptCurrentPage[file.fid]:0)
            },500)
        }
    }


    // 设置白板缩略图
    function setSnapshot(fid: any) {
        if (fid == '#DEFAULT') {
            teduBoard.snapshot({userData: '#DEFAULT'});
        }
    }

    // 删除文件
    function deleteFileById(sign: string) {
        if (sign == "#DEFAULT") {
            showErrorTip('缺省文件 不能删除!');
            return;
        }
        let curFile = boardFileList.find((item: any) => sign == item.sign)
        curFile && teduBoard.deleteFile(curFile.fid);
    }

    // 颜色转换
    function rgbToHex(color: any) {
        let arr = [],
            strHex;
        if (/^(rgb|RGB)/.test(color)) {
            arr = color.replace(/(?:\(|\)|rgb|RGB)*/g, "").split(",");
            strHex = '#' + ((1 << 24) + (arr[0] << 16) + (arr[1] << 8) + parseInt(arr[2])).toString(16).substr(1);
        } else {
            strHex = color;
        }
        return strHex;
    }

    // 显示/隐藏课件缩略图
    function switchThumbnail(val: any) {
        setShowThumbnail(!val)
    }

    // 滚动到选中的ppt缩略图
    function scrollToPPTActive(index: any) {
        //滚动
        const dom: any = document.querySelector("#board-thumbnail-ppt");
        // console.log(dom.scrollTop);
        let height: any = (index-1)*160 >= 0 ? (index-1)*160 : 0
        dom.scrollTo({
            top: height,
            behavior: "smooth"
        })
    }

    // 滚动到选中的文件缩略图
    function scrollToActive(index: any) {
        //滚动
        const dom: any = document.querySelector("#board-thumbnail-files");
        // console.log(dom.scrollTop);
        let height: any = (index-1)*54 >= 0 ? (index-1)*54 : 0
        dom.scrollTo({
            top: height,
            behavior: "smooth"
        })
    }

    //显示课件管理弹窗
    function showFileUpload() {
        dispatch(setValue({ key: 'fileVisibility', value: true }));
    }

    function addResizeLinster () {
        window.onresize= resizeWindow
    }

    // 本地白板事件发布到远端
    async function sendBoardRealtimeDataMessage(data: any) {
        if(!ysLiveClient.tim) {
            return
        }

        const groupId = String(roomInfo.room_id);
        const message = ysLiveClient.tim.createCustomMessage({
            to: groupId,
            conversationType: "GROUP",
            priority: "High",  // 因为im消息有限频，白板消息的优先级调整为最高
            payload: {
                data: JSON.stringify(data),
                description: '',
                extension: 'TXWhiteBoardExt',
            },
        });
        const [error] = await Tool.awaitWrap(ysLiveClient.tim.sendMessage(message));
        if (error) {
            sendMessageStatus[message.ID] = {
                resendCount: 1,
            }; // 重试次数
            resendBoardRealtimeDataMessage(message);
        }
    }

    async function resendBoardRealtimeDataMessage(message:any) {
        // console.log('>>>> resendBoardRealtimeDataMessage:', sendMessageStatus[message.ID].resendCount);
        const [error] = await Tool.awaitWrap(ysLiveClient.tim.resendMessage(message));
        if (error && sendMessageStatus[message.ID].resendCount) {
          sendMessageStatus[message.ID].resendCount += 1; // 重试次数+1
          if (sendMessageStatus[message.ID].resendCount > 3) { // 重试3次后
            console.error('白板实时信令同步失败');
            sendBoardRealtimeDataError({
                errorCode: error?.code,
                errorMsg: error?.message
            })
          }else {
            resendBoardRealtimeDataMessage(message);
          }
        } else {
          // 成功后，删除状态
          delete sendMessageStatus[message.ID];
        }
    }
    // 发送错误日志
    function sendBoardRealtimeDataError(error:any) {
        let t2=new Date().getTime() //当前时间
        // 10秒内只触发一次
        if (t2-t1 > 10000) {
            dispatch(setLog(LIVE_ACTIONS.sendBoardRealtimeDataError, {
                errorCode: error?.code,
                errorMsg: error?.message
            }))
            t1 = t2
        }
    }

    // 收到白板事件同步到本地
    function addSyncData(realtimeData:any) {
        if (teduBoard) {
            teduBoard.addSyncData(realtimeData);
        }
    }
    // 收到点赞消息
    function onDiggReceived (item: {data: any, eventCode: string}) {
        let data: any = item.data
        JSON.parse(data.quote).digg_count && setDiggCount(JSON.parse(data.quote).digg_count)
    }
    // 收到在线人数变更消息
    function onOnlineNumsReceived(item: {data: any, eventCode: string}) {
        let quote: any = item?.data?.quote
        let num = JSON.parse(quote)?.online_nums || 0
        if (num > 10000) {
            num = (num/10000).toFixed(1)+'万'
        }
        setOnlineNums(num)
    }

    function videoLoopChange(checked:boolean) {
        // console.log('videoLoopChange',checked)
        videoLoop = checked
    }

    // 展示上课弹窗
    function handleShowModel() {
        if (!isTested) {
            notification.warning({
                message: '通知',
                description: '直播开始前请进行设备检测'
            })
            return;
        }
        setShowModel(true)
    }

    // 定义颜色
    const colors = [
        {
            name: 'black',
            color: '#151515'
        },
        {
            name: 'white',
            color: '#FFFFFF'
        },
        {
            name: 'blue1',
            color: '#0091FF'
        },
        {
            name: 'blue2',
            color: '#6236FF'
        },
        {
            name: 'red',
            color: '#F12E2E'
        },
        {
            name: 'orange',
            color: '#F7B500'
        },
    ]

    useEffect(() => {
        let num = roomInfo.online_nums
        if (num > 10000) {
            num = (num/10000).toFixed(1)+'万'
        }
        setOnlineNums(num)
        // 白板初始化
        if (ysLiveClient) {
            let testedTime = LStorage.getItem("testedTime") || 0
            if (Tool.isToday(testedTime)) {
                dispatch(setValue({ key: 'isTested', value: true }));
            }
            ysLiveClient.initBoard({
                id: 'board-wrap'
            })
            teduBoard = ysLiveClient.teduBoard;
            teduBoard.setDataSyncEnable(true)
            teduBoard.setRemoteCursorVisible(true)
            teduBoard.setSyncVideoStatusEnable(true)
            // 注册键盘事件
            Mousetrap.bind('left', function() {
                prevStep();
            })
            Mousetrap.bind('right', function() {
                nextStep();
            })
            Mousetrap.bind('up', function() {
                prevStep();
            })
            Mousetrap.bind('down', function() {
                nextStep();
            })

            ysLiveClient.on(EVENT.TIM_DIGG_RECEIVED, onDiggReceived);
            ysLiveClient.on(EVENT.TIM_ONLINE_NUMS_RECEIVED, onOnlineNumsReceived);
            bindBoardEvent()
            proBoardData()
            addResizeLinster()
            setTimeout(() => {
                resizeWindow()
            }, 300)
            // window.onresize = resizeWindow;
        }

        return () => {
            // ysLiveClient && ysLiveClient.ysboard.destroy();
            teduBoard && teduBoard.destroy()
            ysLiveClient.off(EVENT.TIM_DIGG_RECEIVED, onDiggReceived);
            ysLiveClient.off(EVENT.TIM_ONLINE_NUMS_RECEIVED, onOnlineNumsReceived);
            Mousetrap.unbind('left')
            Mousetrap.unbind('right')
            Mousetrap.unbind('up')
            Mousetrap.unbind('down')
        }
    }, [])

    useEffect(()=>{
        if (isStart && isOpenCamera && cameraPosition.position == 'fullScreen') {
            let cameraView = document.getElementById('room-camera-fullScreen-view');
            ysLiveClient.updateLocalView(cameraView);
        }else if (isStart && isOpenCamera && cameraPosition.position != 'fullScreen') {
            let cameraView = document.getElementById('room-camera-view');
            ysLiveClient.updateLocalView(cameraView);
        }
        if (isStart && !isOpenCamera) {
            ysLiveClient.closeCamera();
        }
        if (isStart && videoCallUserList.length>0 && cameraPosition.position != 'fullScreen') {
            videoCallUserList.forEach((item: VideoCallUserParams, index: number) =>{
                console.log('document.getElementById("student-view-"+index)', document.getElementById("student-view-"+index));
                ysLiveClient.startRemoteView(item.trtcUid, document.getElementById("student-view-"+index), TRTCVideoStreamType.TRTCVideoStreamTypeBig)
            })
        }else if (isStart && videoCallUserList.length>0 && cameraPosition.position == 'fullScreen') {
            videoCallUserList.forEach((item: VideoCallUserParams, index: number) =>{
                console.log('document.getElementById("student-fullScreen-view-"+index)', document.getElementById("student-fullScreen-view-"+index));
                ysLiveClient.startRemoteView(item.trtcUid, document.getElementById("student-fullScreen-view-"+index), TRTCVideoStreamType.TRTCVideoStreamTypeBig)
            })
        }
    }, [cameraPosition, isOpenCamera, isStart, videoCallUserList])

    useEffect(()=>{
        if ((isStart && isShareScreen) || (isStart && cameraPosition.position == 'fullScreen' && videoCallUserList.length == 0 && isOpenCamera) || (isStart && cameraPosition.position == 'fullScreen' && videoCallUserList.length > 0)) {
            setHiddenBoardContrl(true)
        }else {
            setHiddenBoardContrl(false)
        }
    }, [cameraPosition, isStart, isShareScreen])

    useEffect(()=>{
        if (diggCount >= 10000000) {
            setDiggCountText((diggCount / 10000000).toFixed(1) + '千万')
        }else if (diggCount >= 10000) {
            setDiggCountText((diggCount / 10000).toFixed(1) + '万')
        }else {
            setDiggCountText(diggCount+'')
        }
    }, [diggCount])

    return (
        <div className="board-body">
            <div className="board-wrap">
                <div className="info-box">
                    {/*直播间id*/}
                    <p className="roomId">房间ID：{roomInfo.room_id}</p>
                    {/*直播间在线人数*/}
                    <div className="online-num">
                        <p>{onlineNums}人在线</p>
                    </div> 
                    {/*直播间点赞数*/}
                    {/* <div className="digg-box">
                        <ImgIcon.Digg className="digg-icon" title="点赞数" />
                        <p>{diggCountText}</p>
                    </div>  */}
                    {
                        isTestLive ? <p className="testing">课前测试中 {roomInfo.display_type == 1 ? '(竖屏)':'(横屏)'}</p> : isStart ? <p className="living">直播中 {roomInfo.display_type == 1 ? '(竖屏)':'(横屏)'}</p> : null
                    }
                </div>
                
                {/*白板区域*/}
                <div className="board-box">
                    <div className="board-content">
                        {/*{*/}
                        {/*    total > 1 ? <div className="board-count">{currentPage} / {total}</div> : null*/}
                        {/*}*/}
                        <div id="board-wrap"></div>
                        {/* 直播结束提示 */}
                        {
                            !isStart ?
                                <div className="startClass">
                                    {
                                        liveStage == LIVE_STAGE.END_STAGE ?
                                            <div className="endClass">直播已结束</div>
                                            : <Button type="primary" size="large" shape="round" className="startClassBtn" onClick={handleShowModel}>上课</Button>
                                    }
                                </div>
                                : null
                        }
                        {/* 摄像头布局 */}
                        <CameraPosition setCameraPosition={setCameraPosition}></CameraPosition>
                        
                        {
                            (isStart) ? <div className={isShareScreen?"shareScreen-view" : "shareScreen-view no-pointer"} id="shareScreen-view">

                            </div> : null
                        }
                        {/* 全屏 分享屏幕时， 不显示白板操作项 */}
                        { hiddenBoardContrl ? null : <div className="board-prev board-pn" onClick={prevStep}><LeftOutlined /></div>}
                        { hiddenBoardContrl ? null : <div className="board-next board-pn" onClick={nextStep}><RightOutlined /></div>}
                    </div>
                </div>

                {/*白板控制区*/}
                {
                    /* 全屏 分享屏幕时，不显示白板操作项 */
                    <div className="board-control-wrap">
                        <LiveBGM ysLiveClient={ysLiveClient}></LiveBGM>
                        <div className="board-tools">
                            <div className="page-contrl">
                                <span>跳转至</span>
                                <InputNumber
                                    // addonBefore="跳转至"
                                    // addonAfter={'/'+currentAllPages}
                                    id="currentPage"
                                    style={{width: '50px'}} 
                                    min={1}
                                    max={currentAllPages}
                                    value={currentPage}
                                    onPressEnter={currentPageInputOnBlur}
                                    onBlur={currentPageInputOnBlur}/>
                                <span>/ {currentAllPages}</span>
                            </div>

                            <div className="line"></div>

                            {/*工具选择*/}
                            {currentTool == 0 ? <ImgIcon.MoveClick title="鼠标" /> : <ImgIcon.Move title="鼠标" onClick={() => onSetToolType(0)} />}
                            {currentTool == 1 ? <ImgIcon.PenClick title="画笔" /> : <ImgIcon.Pen title="画笔" onClick={() => onSetToolType(1)} />}
                            {currentTool == 6 ? <ImgIcon.RectangleClick title="正方形" /> : <ImgIcon.Rectangle title="正方形" onClick={() => onSetToolType(6)} />}
                            {currentTool == 5 ? <ImgIcon.CircleClick title="圆形" /> : <ImgIcon.Circle title="圆形" onClick={() => onSetToolType(5)} />}
                            {currentTool == 11 ? <ImgIcon.TextClick title="文字" /> : <ImgIcon.Text title="文字" onClick={() => onSetToolType(11)} />}

                            <div className="line"></div>

                            {currentTool == 2 ? <ImgIcon.EarserClick title="橡皮擦" /> : <ImgIcon.Earser title="橡皮擦" onClick={() => onSetToolType(2)} />}
                            <ImgIcon.Clean title="清空涂鸦" onClick={() => clearDraws()} />
                            {/*撤销和重做*/}
                            <ImgIcon.Undo title="撤销" onClick={onUndo} />
                            <ImgIcon.Redo title="重做" onClick={onRedo}/>
                            <div className="line"></div>
                            {/*设置字体大小和线宽*/}
                            <Slider style={{width: '80px'}}  min={1} max={200} value={currentSize} defaultValue={50} onChange={setSize} />
                            <InputNumber style={{width: '50px'}} min={1} max={200} value={currentSize} onChange={setSize} />
                            {/*{currentSize == 200 ? <ImgIcon.BigClick /> : <ImgIcon.Big onClick={() => setSize(200)} />}*/}
                            {/*{currentSize == 100 ? <ImgIcon.MiddleClick /> : <ImgIcon.Middle onClick={() => setSize(100)} />}*/}
                            {/*{currentSize == 50 ? <ImgIcon.SmallClick /> : <ImgIcon.Small onClick={() => setSize(50)} />}*/}
                            <div className="line"></div>
                            {/*颜色选择*/}
                            {
                                colors && colors.map((item: any, index: number) => {
                                    return <div key={index} className={ `color ${item.name} ${currentColor == item.color ? "active" : ""}`} onClick={() => onSetColor(item.color)}><div className="color-inner"></div></div>
                                })
                            }
                        </div>
                    
                    </div>
                }
            </div>
            {/*课件缩略图区域*/}
            {
                (isStart && isOpenCamera && cameraPosition.position == 'fullScreen') ? null : <div className={ showThumbnail ? 'thumbnail-wrap active' : 'thumbnail-wrap'}>
                    <p className={userInfo.app == 10120?"thumbnail-title youshu":"thumbnail-title"} onClick={()=>switchThumbnail(showThumbnail)}>我的课件</p>

                    <div className='thumbnail-box'>
                        <div className='board-thumbnail-white'>
                            <p>白板</p>
                            <div onClick={() => onSwitchFile('#DEFAULT')} className={[currentFid == '#DEFAULT' ? 'active' : '', userInfo.app==10120?"youshu":""].join(" ")}>
                                {
                                    boardSnapshot && <img src={boardSnapshot} style={{width: '100%', height: '100%'}} alt=""/>
                                }
                            </div>



                        </div>
                        <div className="video-loop">
                            视频循环播放：<Switch checkedChildren="开启" unCheckedChildren="关闭" onChange={videoLoopChange} defaultChecked={videoLoop} />
                        </div>
                        {/*外层文件缩略图列表*/}
                        <div id="board-thumbnail-files" className="board-thumbnail-files">
                            {
                                viewFileList && viewFileList.map((item: any, index: number) => {
                                    return <div onClick={() => thumbHandler(item)} className="thumbnail-file" key={index} >
                                        <div className={currentFid==item.fid?"thumbnail youshu active":"thumbnail youshu"}>
                                            <img src={item.cover} alt={item.title}/>
                                        </div>
                                        <p className={currentFid==item.fid?"file-title active-color":"file-title"} ><span>[{getFileType(item)}]</span>{delSign(item.title)}</p>
                                    </div>
                                })
                            }
                        </div>

                        {/*内层ppt页缩略图列表*/}
                        {
                            showPpt?<p className="ppt-name" onClick={() => setShowPpt(false)}><LeftCircleOutlined title="返回查看课件列表" />{pptTitle}</p>:null
                        }
                        {
                            showPpt?<div id="board-thumbnail-ppt" className="board-thumbnail-ppt">
                                {
                                    pptBoardThumbs && pptBoardThumbs.map((item: any, index: number) => {
                                        return <div onClick={() => thumbHandler(item)} className={'thumbnail-file ' + 'thumbnail-file-'+index} key={index} >
                                            <div className={[currentBoardId==item.id?"thumbnail active":"thumbnail", userInfo.app==10120?"youshu":""].join(" ")}>
                                                <img src={item.cover} alt=''/>
                                            </div>
                                            <p className="file-title">{index + 1} / {pptBoardThumbs.length}页</p>
                                        </div>
                                    })
                                }
                            </div>:null
                        }

                        {/*课件管理按钮*/}
                        {
                            !showPpt?<div className="courseware-btn-box">
                                <div className={["courseware-btn", userInfo.app==10120?"youshu":""].join(" ")} onClick={showFileUpload}>课件管理</div>
                            </div>:null
                        }
                    </div>
                </div>
            }
            
            {/*上传课件弹窗*/}
            <DraggableModal
                title="选择课件"
                width={800}
                close={() => dispatch(setValue('fileVisibility', false))}
                visible={fileVisibility}
            >
                {
                    teduBoard?
                        <FileManager ysLiveClient={ysLiveClient} roomConfig={roomConfig} dispatch={dispatch} deleteFileById={deleteFileById} />
                        :null
                }
            </DraggableModal>

            <Modal
                open={showModel}
                title="确认上课"
                onCancel={()=>{
                    setShowModel(false)
                }}
                footer={[
                    <Button disabled={liveStage != LIVE_STAGE.TEST_STAGE} key="back" onClick={()=>{
                        startLivePush(true)
                        setShowModel(false)
                    }}>
                        课前测试
                    </Button>,
                    <Button type="primary" key="done" onClick={()=>{
                        startLivePush(false)
                        setShowModel(false)
                    }}>
                        确认上课
                    </Button>
                ]}
            >
                <p>上课前可进行课前测试，仅助教可见画面。确认上课，正式开始直播</p>
            </Modal>
        </div>
    );
}