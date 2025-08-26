import React, { useState, useRef, useEffect } from 'react';
import { Button, Slider, InputNumber, Switch, Modal, notification, message as Message } from 'antd';
import { LStorage } from '../utils/tools';
import './Board.scss';

import { TRTCVideoStreamType } from 'trtc-electron-sdk/liteav/trtc_define';
import ImgIcon from './ImgIcon';
import { useSelector } from 'react-redux';
import { selectRoomConfig } from '../reducers/index';
import { useDispatch } from 'react-redux';

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

    return (
        <div className="board-body">
            <div>bb - 开发中</div>
        </div>
    );
}