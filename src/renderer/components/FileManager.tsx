import React, { useEffect, useState } from 'react';
import { Button, Col, Empty, Input, message as Message, notification, Row, Spin, Tabs, Upload } from 'antd';
// @ts-ignore
import InfiniteScroll from 'react-infinite-scroller';
import { DeleteOutlined } from '@ant-design/icons';
import OSS from 'ali-oss';
import './fileManager.scss';
import { AddFile, AddTranscode, DelFile, GetFileList, GetLiveOssToken, QueryTranscodingFile, getUploadCloudSign } from '../api';
import GenerateFileMd5 from '../utils/generateFileMd5';
import CheckFileExt from '../utils/checkFileExt';
import { setOperateLog, setValue } from '../reducers/roomConfigSlice';
import { BIND_TYPES, FILE_EXT, OPERATE_ACTION } from '../vars/room-vars';
import TcVod from 'vod-js-sdk-v6'
import { LStorage } from '../utils/tools';
const { TabPane } = Tabs;
const { Search } = Input;


interface FileManagerParams {
    dispatch: any,
    roomConfig: any,
    ysLiveClient: any,
    deleteFileById: any
}

let ossClient:any = null;
let uploaderVideo:any = null;
let assetsBak:any = [];
let transcodingAssetsBak: any = []; // 素材库中正在上传/转码的文件
let transcodingLiveBak: any = []; // 直播间中正在上传/转码的文件
let liveFileBak:any = [];
let ossPath: string = '';
let ossCdn: string = '';
let searchText: string = '';
let taskArr: any = [];
let taskTimer: any = null;
let UploadAction:any = {
    upload: 1,
    cancelUpload: 2
}
let CoursewareAction: any = {
    add: 1,
    del: 2
}
let FileType: any = {
    6: 'IMAGE',
    5: 'AUDIO',
    4: 'VIDEO',
    3: 'PDF',
    2: 'PPT',
}


export default function FileManager(props: FileManagerParams) {
    const { ysLiveClient, dispatch, roomConfig, deleteFileById } = props;
    const { roomInfo, boardFileList, liveBGM } = roomConfig;
    const EVENT = ysLiveClient?.EVENT || {};
    const [isLoading, setIsLoading] = useState(false); // 加载中
    const [isUploading, setIsUploading] = useState(false); // 上传中
    const [isHasMore, setIsHasMore] = useState(true); // 是否还有更多素材
    const [assets, setAssets] = useState([]); // 素材列表
    const [transcodingAssets, setTranscodingAssets] = useState([]); // 素材转码中列表
    const [transcodingLive, setTranscodingLive] = useState([]); // 直播间转码中列表

    const [liveFiles, setLiveFiles] = useState([]); // 直播间课件列表
    const [startPage, setStartPage] = useState(0);

    const userInfo = LStorage.getItem('USER_INFO');

    useEffect(() => {
        // console.log('fileManagerfileList', boardFileList);
        onSearch('', null)

        return () => {
            liveFileBak = [];
            assetsBak = [];
            transcodingAssetsBak = [];
            transcodingLiveBak = [];
            clearInterval(taskTimer);
            taskArr = [];
            searchText = "";
            setIsLoading(false);
            setIsUploading(false);
            setIsHasMore(true);
            setAssets([]);
            setTranscodingAssets([]);
            setTranscodingLive([]);
            setLiveFiles([]);
            setStartPage(0);
        }
    }, [])

    useEffect(() => {

        // console.log('fileManagerfileList', boardFileList);
        liveFileBak = boardFileList
        setLiveFiles(liveFileBak)
    }, [boardFileList])

    function delSign (title: string) {
        return title.split("?sign=")[0]
    }

    function loadFunc(page: any) {
        // console.log(page)
        setIsLoading(true)

        getFileListHandler(page, 10);
    }


    function getFileListHandler(page: number, size: number) {
        let param: any = {
            app: userInfo.app,
            bind_type: BIND_TYPES.BINDUSER,
            room_id: roomInfo.room_id,
            user_id: userInfo.userId,
            page: page,
            size: size,
        }
        searchText && (param.file_title = searchText)
        GetFileList(param).then((res: any) => {
            if (res.status.code == 200) {
                if (page == 1) {
                    assetsBak = res.file_info;
                } else {
                    assetsBak = assetsBak.concat(res.file_info);
                }

                setAssets(assetsBak);
                if (res.file_info.length <= 0) {
                    setIsHasMore(false);
                }
            } else {
                setIsHasMore(false);
            }
            setIsLoading(false)
        })
    }
    // 刷新
    function refresh() {
        onSearch('', null)
    }

    // 搜索
    function onSearch(val: any, e: any) {
        assetsBak = [];
        setAssets(assetsBak);
        searchText = val;
        setTimeout(() => {
            setIsHasMore(true);
            setStartPage(1);
            getFileListHandler(1, 10);
        },100)
    }
    // 获取视频转码签名
    async function getSignature() {
        const res = await getUploadCloudSign()
        if (res?.status?.code == 200) {
            return res.signature;
        } else {
            Message.error(`${res.status.code}-${res.status.msg}` || '网络错误');
            return '';
        }
    }

    // 上传视频到腾讯
    async function handleUploadVideo(file: any, info: any) {
        const tcVod = new TcVod({
            getSignature: getSignature, // 前文中所述的获取上传签名的函数
        });
        uploaderVideo = tcVod.upload({
            mediaName: file.name,
            mediaFile: file, // 媒体文件（视频或音频或图片），类型为 File
        });
        uploaderVideo.on("media_progress", function (progressInfo:any) {
            let progressPercent = Math.ceil(progressInfo.percent * 100);
            setCurrentUploadFile(info.sign, info.bind_type, 'update', {
                upload_tips: `上传中${progressPercent}%`,
                upload_status: 2
            })
        });
        uploaderVideo.done()
            .then(function (res:any) {
                handleUploadSuccess(res, info)
            }).catch(function (err:any) {
                setIsUploading(false);
            })


    }
    // 创建OSS实例
    async function ossInit() {
        await GetLiveOssToken().then(res => {
            if (res?.status?.code == 200) {
                ossClient = new OSS({
                    accessKeyId: res.oss_token.AccessKeyId,
                    accessKeySecret: res.oss_token.AccessKeySecret,
                    stsToken: res.oss_token.SecurityToken,
                    bucket: res.oss_info.OssBucket,
                    endpoint: res.oss_info.OssEndpoint,
                })
                ossPath = res.oss_info.OssPath;
                ossCdn = res.oss_info.OssCdn;
            }
        })

    }

    // OSS直传
    function ossUpload(file: any, info: any) {
        // setIsUploading(true)
        let file_type=(file.name).substr(file.name.lastIndexOf(".")).toLowerCase()

        let reader = new FileReader();
        reader.readAsArrayBuffer(file);
        // console.log('文件读取中');
        
        reader.onload = function () {
            // console.log('文件读取成功，开始上传');
            let date = new Date();
            let storeAs = ossPath + '/' + date.getTime() + file_type;

            // 上传
            let promise = ossClient.multipartUpload(storeAs, file, {
                progress: async function (p: any, checkpoint: any) {
                    // 断点记录点。 浏览器重启后无法直接继续上传，需用户手动触发进行设置。
                    let progressPercent = Math.ceil(p * 100)
                    // console.log(p, checkpoint, progressPercent)

                    setCurrentUploadFile(info.sign, info.bind_type, 'update', {
                        upload_tips: `上传中...${progressPercent}%`,
                        upload_status: 2
                    })
                }
            });
            promise.then((res: any) => {
                // console.log('文件上传成功');
                handleUploadSuccess(res,info)

                // console.log('文件上传成功：', res)
                reader.onload = null
            }).catch((err: any) => {
                // console.log('文件上传失败：', err);
                setIsUploading(false);
                reader.onload = null
            });
        }

    }
    // ppt/pdf/video/audio 上传成功
    function handleUploadSuccess(res:any,info:any){
        // 上传文件信息
        let fileInfo = {
            ...info,
            url: (info.file_ext == FILE_EXT.VIDEO || info.file_ext == FILE_EXT.AUDIO) ? `${res?.video?.url}?sign=${info.sign}` : `${ossCdn}${res.name}?sign=${info.sign}`,
            thumbnail: info.thumbnail,
            upload_tips: '',
            upload_status: 0,
            file_id: (info.file_ext == FILE_EXT.VIDEO || info.file_ext == FILE_EXT.AUDIO) ? res?.fileId : '',
        }
        // 添加参数
        let addParams: any = {
            app: userInfo.app,
            pre: false,
            sign: fileInfo.sign,
            url: fileInfo.url,
            downloadLink: fileInfo.url,
            thumbnail: fileInfo.thumbnail,
            file_size: fileInfo.file_size,
            file_ext: fileInfo.file_ext,
            file_title: fileInfo.file_title,
            user_id: userInfo.userId // 无论 直播间/素材库 上传，都要绑定到用户身上
        }

        // fileInfo.bind_type == BIND_TYPES.BINDROOM ? (addParams.room_id = roomInfo.room_id) : (addParams.user_id = userInfo.userId);

        if (info.file_ext == FILE_EXT.IMAGE) {
            addParams.thumbnail = fileInfo.thumbnail = fileInfo.url;
        } else if (info.file_ext == FILE_EXT.AUDIO) {
            addParams.thumbnail = 'https://feed.youshu.cc/readwith/media/0/1701848652683.png';
        } else if ([FILE_EXT.PPT, FILE_EXT.PDF, FILE_EXT.VIDEO].includes(info.file_ext)) {
            fileInfo.upload_tips = '上传完成';
            fileInfo.upload_status = 3;
            addTranscodeToGo(fileInfo);
        }

       if ([FILE_EXT.PPT, FILE_EXT.PDF, FILE_EXT.VIDEO].includes(info.file_ext)) {
            setCurrentUploadFile(info.sign, info.bind_type, 'update', {
                url: fileInfo.url,
                downloadLink: fileInfo.url,
                thumbnail: fileInfo.thumbnail,
                upload_tips: fileInfo.upload_tips,
                upload_status: fileInfo.upload_status
            })
        } else {
            addFileHandle(addParams, info.bind_type, () => {
                setCurrentUploadFile(info.sign, info.bind_type, 'update', {
                    url: fileInfo.url,
                    downloadLink: fileInfo.url,
                    thumbnail: fileInfo.thumbnail,
                    upload_tips: fileInfo.upload_tips,
                    upload_status: fileInfo.upload_status
                })
                addTranscodeFinish(info.sign, info.bind_type, {})
            })
        }
        setIsUploading(false);
    }

    // 只用于新增添加文件
    function addFileHandle(fileInfo: any, bind_type: BIND_TYPES, callback: any) {
        AddFile(fileInfo).then(res => {
            if (res.status.code == 200) { // 添加成功
                callback();
            } else {
                Message.error(`${res.status.code}-${res.status.msg}`)
                console.warn(res)
                setCurrentUploadFile(fileInfo.sign, bind_type, 'del') // 添加失败删除
            }
        }).catch(error => {
            console.warn(error)
        })
    }
    
    // 取消课件关联
    function delToRoom(info: any) {
        Message.loading({
            duration: 0,
            content: '取消关联中...',
            key: 'file'
        })
        if (info.file_ext == FILE_EXT.AUDIO) {
            ysLiveClient.stopPlayMusic(1)
            dispatch(setValue('liveBGM', {}))
            Message.destroy('file')
        }else {
            delBoardFile(info)
        }
    }

    // 素材库添加素材到直播间
    function addToRoom(info: any) {
        Message.loading({
            duration: 0,
            content: '关联中...',
            key: 'file'
        })
        if (info.file_ext == FILE_EXT.IMAGE) {
            addImages([info.url], info.file_title);
        } else if (info.file_ext == FILE_EXT.VIDEO) {
            addVideo(info.url, `${info.file_title}?sign=${info.sign}&cover=${info.thumbnail}`);
        } else if (info.file_ext == FILE_EXT.AUDIO) {
            setBGM(info.url, info.file_title, info.sign)
            Message.destroy()
        } else if (info.file_ext == FILE_EXT.PPT || info.file_ext == FILE_EXT.PDF) {
            let config = {
                url: info.url,
                title: info.file_title + (info ? `?sign=${info.sign}` : ''),
                // title: info.file_title,
                pages: info.pages,
                resolution: info.resolution,
            }
            ysLiveClient.teduBoard.addTranscodeFile(config, false);
        }
        // 素材添加到直播间
        dispatch(setOperateLog(OPERATE_ACTION.live_courseware, {
            action: CoursewareAction.add,
            file_name: info.file_title,
            file_type: info.file_ext,
            file_size: info.file_size,
            file_md5: info.sign
        }))
    }

    // 取消上传
    function cancelUpload(fileInfo: any) {
        if (fileInfo.file_ext == FILE_EXT.VIDEO || fileInfo.file_ext == FILE_EXT.AUDIO){
            uploaderVideo.cancel();
            setIsUploading(false)
        }else{
            ossClient.cancel();
        }
        setCurrentUploadFile(fileInfo.sign, fileInfo.bind_type, 'cancelUpload');
        // 上传操作日志
        dispatch(setOperateLog(OPERATE_ACTION.file_upload, {
            action: UploadAction.cancelUpload,
            file_name:fileInfo.file_title,
            file_md5: fileInfo.sign,
            file_type: fileInfo.file_ext,
            file_size: fileInfo.file_size
        }))
    }

    // 滚动到底部
    function scrollToCoding() {
        let  endEl:any = document.getElementById('assetsTop');
        setTimeout(() => {
            endEl && endEl.scrollIntoView();
        }, 300)
    }

    // 删除直播间白板的文件
    function delBoardFile(item:any) {
        // console.log('item', item);
        deleteFileById(item.sign)
        dispatch(setOperateLog(OPERATE_ACTION.live_courseware, {
            action: CoursewareAction.del,
            file_name: item.title,
            file_type: FileType[item.fileType]||'UNKNOWFILE',
            file_md5: item.sign
        }))
    }

    // 管理素材库中的文件
    function setAssetsFile(sign: string, action: string, params?: any) {
        let index: number,
        bak = assetsBak,
        bind_id = userInfo.userId,
        liveArr: any = [];

        index = bak.findIndex((item: any) => item.sign == sign);
        switch (action) {
            case 'add': // 添加
                bak.unshift(params);
                liveArr = bak.concat([])
                setAssets(liveArr);
                assetsBak = liveArr
                scrollToCoding();
                break;
            case 'update': // 更新
                bak[index] = {
                    ...bak[index],
                    ...params
                }
                liveArr = bak.concat([])
                setAssets(liveArr)
                assetsBak = liveArr
                break;
            case 'del': // 删除
                DelFile(userInfo.app, sign, BIND_TYPES.BINDUSER, bind_id, 'ANCHOR', roomInfo.room_id, userInfo.userId+'').then(res => {
                    if (res.status.code == 200) {
                        bak.splice(index, 1);
                        liveArr = bak.concat([])
                        setAssets(liveArr);
                        assetsBak = liveArr
                    } else {
                        Message.error(`${res.status.code}-${res.status.msg}`)
                        console.warn(res)
                    }
                }).catch(error => {
                    console.warn(error)
                })
                break;
        }
    }

    // 管理正在上传的文件
    function setCurrentUploadFile(sign: string, bind_type: BIND_TYPES, action: string, params?: any) {
        let index: number,
            bak = bind_type == BIND_TYPES.BINDROOM ? transcodingLiveBak : transcodingAssetsBak,
            bind_id = bind_type == BIND_TYPES.BINDROOM ? roomInfo.room_id : userInfo.userId,
            liveArr: any = [];
        index = bak.findIndex((item: any) => item.sign == sign);
        switch (action) {
            case 'add': // 添加
                if (bind_type == BIND_TYPES.BINDROOM) {
                    bak.push(params);
                    liveArr = bak.concat([])
                    setTranscodingLive(liveArr);
                    transcodingLiveBak = liveArr
                    scrollToCoding();
                } else {
                    bak.push(params);
                    liveArr = bak.concat([])
                    setTranscodingAssets(liveArr);
                    transcodingAssetsBak = liveArr
                    scrollToCoding();
                }
                break;
            case 'update': // 更新
                if (bind_type == BIND_TYPES.BINDROOM) {
                    bak[index] = {
                        ...bak[index],
                        ...params
                    }
                    liveArr = bak.concat([])
                    setTranscodingLive(liveArr);
                    transcodingLiveBak = liveArr
                } else {
                    bak[index] = {
                        ...bak[index],
                        ...params
                    }
                    liveArr = bak.concat([])
                    setTranscodingAssets(liveArr);
                    transcodingAssetsBak = liveArr
                }
                break;
            case 'del': // 删除
                if (bind_type == BIND_TYPES.BINDROOM) {
                    bak.splice(index, 1);
                    liveArr = bak.concat([])
                    setTranscodingLive(liveArr);
                    transcodingLiveBak = liveArr
                } else {
                    bak.splice(index, 1);
                    liveArr = bak.concat([])
                    setTranscodingAssets(liveArr);
                    transcodingAssetsBak = liveArr
                }
                break;
            case 'cancelUpload': // 取消上传
                if (bind_type == BIND_TYPES.BINDROOM) {
                    bak.splice(index, 1);
                    liveArr = bak.concat([]);
                    setTranscodingLive(liveArr);
                    transcodingLiveBak = liveArr
                } else {
                    bak.splice(index, 1);
                    liveArr = bak.concat([]);
                    setTranscodingAssets(liveArr);
                    transcodingAssetsBak = liveArr
                }
        }


    }
    // 课件上传
    async function upload(file: any) {
        setIsUploading(true)

        // console.log('选择文件');
        const file_ext = CheckFileExt(file.name);
        // 检测文件格式，不支持提示。
        if (file_ext === FILE_EXT.UnKnowFile) {
            notification.warning({
                message: '通知',
                description: '不支持您的课件格式'
            })
            setIsUploading(false)
            return;
        }

        // @ts-ignore
        let file_size = parseInt(Math.round(file.size/1024*100)/100); //单位为k
        // console.log('文件大小', file_size);

        // console.log('文件ossInit');
        Message.loading({content: "读取文件信息中...", duration: 0})
        let fileMd5: any = await GenerateFileMd5(file);
        // console.log('文件fileMd5', fileMd5);
        Message.destroy()
        let index: number,  bak = [...transcodingAssetsBak, ...transcodingLiveBak];
        index = bak.findIndex((item: any) => item.sign == fileMd5);
        if (index > -1) {
            Message.info(`文件已存在`)
            setIsUploading(false)
            return ;
        }

        let fileInfo = {
            file_title: file.name,
            file_size: file_size,
            file_ext: file_ext,
            file_task_id: '',
            url: '',
            downloadLink: '',
            thumbnail: file_ext == FILE_EXT.AUDIO ? 'https://feed.youshu.cc/readwith/media/0/1701848652683.png':'http://feed.youshu.cc/readwith/media/picture/5f9ffb2778386.png',
            thumbnail_url: '',
            upload_status: 1, // 0：文件已添加，1：准备上场，2：上传中，3：上传完成，4：准备转码，5：转码中，6：转码完成，7：转码失败
            upload_tips: '准备上传', // 上传转码状态文案
            sign: fileMd5,
            bind_type: BIND_TYPES.BINDUSER
        }
        // console.log(fileInfo);

        // 上传操作日志
        dispatch(setOperateLog(OPERATE_ACTION.file_upload, {
            action: UploadAction.upload,
            file_name:fileInfo.file_title,
            file_md5: fileInfo.sign,
            file_type: fileInfo.file_ext,
            file_size: fileInfo.file_size
        }))

        // 检测文件MD5值，判断该文件是否已上传
        let addFileP: any = {
            app: userInfo.app,
            pre: true,
            sign: fileInfo.sign,
            file_title: fileInfo.file_title,
            user_id: userInfo.userId
        }
        AddFile(addFileP).then(async res => {
            if (res.status.code == 200) { // 添加成功
                let info = res.file_info;
                setCurrentUploadFile(info.sign, fileInfo.bind_type, 'add', {
                    file_title: info.file_title,
                    file_size: info.file_size,
                    file_ext: info.file_ext,
                    file_task_id: info.file_task_id,
                    url: info.url,
                    quote: info.info,
                    sign: info.sign,
                    downloadLink: info.downloadLink,
                    thumbnail: info.thumbnail,
                    thumbnail_url: info.thumbnail_url,
                    pages: info.pages,
                    resolution: info.resolution,
                    upload_tips: '',
                    upload_status: ''
                })
                // addTranscodeFinish(info.sign, fileInfo.bind_type, {})
                if (fileInfo.bind_type == BIND_TYPES.BINDUSER) {
                    setAssetsFile(info.sign, 'add', {
                        bind_id: userInfo.userId,
                        BIND_TYPES: BIND_TYPES.BINDUSER,
                        file_title: info.file_title,
                        file_size: info.file_size,
                        file_ext: info.file_ext,
                        file_task_id: info.file_task_id,
                        url: info.url,
                        quote: info.info,
                        sign: info.sign,
                        downloadLink: info.downloadLink,
                        download_link: info.downloadLink,
                        thumbnail: info.thumbnail,
                        thumbnail_url: info.thumbnail_url,
                        pages: info.pages,
                        resolution: info.resolution,
                    })
                    setCurrentUploadFile(info.sign, fileInfo.bind_type, 'del')
                }else {
                    setAssetsFile(info.sign, 'update', {
                        quote: true
                    })
                    delTranscodeFinish(fileInfo.bind_type, info.sign)
                }
                if (info.file_ext == FILE_EXT.IMAGE) {
                    fileInfo.bind_type == BIND_TYPES.BINDROOM && addImages([info.url], info.file_title);
                } else if (info.file_ext == FILE_EXT.VIDEO) {
                    fileInfo.bind_type == BIND_TYPES.BINDROOM && addVideo(info.url, `${info.file_title}?sign=${info.sign}&cover=${info.thumbnail}`);
                } else if (info.file_ext == FILE_EXT.AUDIO) {
                    // fileInfo.bind_type == BIND_TYPES.BINDROOM && setBMG(info.url, info.file_title)
                } else if (info.file_ext == FILE_EXT.PPT || info.file_ext == FILE_EXT.PDF) {
                    // console.log('info', info)
                    let config = {
                        url: info.url,
                        title: info.file_title + (info ? `?sign=${info.sign}` : ''),
                        // title: info.file_title,
                        pages: info.pages,
                        resolution: info.resolution,
                    }
                    fileInfo.bind_type == BIND_TYPES.BINDROOM && ysLiveClient.teduBoard.addTranscodeFile(config, false);
                }
                setIsUploading(false)
            } else if (res.status.code == 6511025) { // 文件不存在，可继续上传
                setCurrentUploadFile(fileInfo.sign, fileInfo.bind_type, 'add', fileInfo);
                if (file_ext === FILE_EXT.VIDEO || file_ext === FILE_EXT.AUDIO){
                    handleUploadVideo(file, fileInfo)
                }else{
                    await ossInit();
                    ossUpload(file, fileInfo)
                }
            } else if (res.status.code == 6511026) { // 文件已存在
                Message.info(`${res?.status?.code}-${res?.status?.msg}`)
                setIsUploading(false)
            } else {
                Message.error(`${res?.status?.code}-${res?.status?.msg}`)
                setIsUploading(false)
                console.warn(res)
            }
        })

    }

    // 文件地址上报给后台，如果是PPT/PDF进行转码
    function addTranscodeToGo(fileInfo: any) {
        AddTranscode(roomInfo.room_id, fileInfo.url, [FILE_EXT.PPT, FILE_EXT.VIDEO].includes(fileInfo.file_ext) ? false : true, fileInfo.file_ext == FILE_EXT.VIDEO ? '' : '1920x1080', fileInfo.file_ext == FILE_EXT.VIDEO ? '' : '200x200', fileInfo.file_title, userInfo.userId, fileInfo.bind_type, fileInfo.sign, fileInfo.file_ext, fileInfo.file_size,fileInfo.file_id).then(res => {
            // console.log('课件开始转码-------', res)
            if (res.status.code != 200) {
                notification.warning({
                    message: '通知',
                    description: '上传课件转码失败，不支持加密，请重新上传或检查课件是否加密。'
                })
                console.warn(res)
            } else {
                setCurrentUploadFile(fileInfo.sign, fileInfo.bind_type, 'update', {
                    file_task_id: res.data,
                    upload_tips: '准备转码',
                    upload_status: 4
                })
                // 加入转码任务列表
                taskArr.push({
                    task_id: res.data,
                    bind_type: fileInfo.bind_type
                })
                // 开始任务计时器
                taskTimer && clearInterval(taskTimer)
                startTaskTimer()
            }
        }).catch(error => {
            console.warn(error)
        })
    }

    // 转码任务计时器更新
    function startTaskTimer() {
        taskTimer && clearInterval(taskTimer)
        taskTimer = setInterval(() => {
            if (taskArr.length > 0) {
                for (let i = 0; i < taskArr.length; i++) {
                    // console.log('检查taskid='+taskArr[i].task_id+'的进度');
                    QueryTranscodingFile(taskArr[i].task_id).then((res: any) => {
                        let bind_type = taskArr[i].bind_type;
                        let fileList = bind_type == BIND_TYPES.BINDROOM ? transcodingLiveBak : transcodingAssetsBak
                        let file = fileList.find((j: any) => j.file_task_id == taskArr[i].task_id);
                        if (res.status.code == 200) {
                            // 更新进度
                            if (res.transcoding_file.state == 'PENDING') {
                                let progress = res.transcoding_file.progress
                                file && setCurrentUploadFile(file.sign, bind_type, 'update', {
                                    upload_tips: `转码中...${progress}%`,
                                    upload_status: 5
                                })
                            }else if (res.transcoding_file.state == 'DONE') {
                                // 成功
                                setCurrentUploadFile(file.sign, file.bind_type, 'update', {
                                    upload_tips: '转码成功',
                                    upload_status: 0
                                })
                                taskArr.splice(i, 1)
                                setTimeout(()=>{
                                    addTranscodeFinish(file.sign, bind_type, {
                                        ...file,
                                        download_link: res.transcoding_file.download_link,
                                        quote: bind_type == BIND_TYPES.BINDROOM ? true : false,
                                        pages: res.transcoding_file.pages,
                                        resolution: res.transcoding_file.resolution,
                                        state: 'NORMAL',
                                        thumbnail: file.file_ext == FILE_EXT.VIDEO ? res.transcoding_file.thumbnail_url : res.transcoding_file.thumbnail_url+'1.jpg',
                                        thumbnail_url: res.transcoding_file.thumbnail_url,
                                        url: res.transcoding_file.result_url
                                    })
                                }, 1000)
                                
                            }else if (res.transcoding_file.state == 'FAILED') {
                                // 失败
                                setCurrentUploadFile(file.sign, taskArr[i].bind_type, 'update', {
                                    upload_tips: '转码失败',
                                    upload_status: 7
                                })
                                taskArr.splice(i, 1)
                            }
                        } else {
                            // 失败
                            setCurrentUploadFile(file.sign, taskArr[i].bind_type, 'update', {
                                upload_tips: '转码失败',
                                upload_status: 7
                            })
                            taskArr.splice(i, 1)
                            console.warn(res)
                        }
                    }).catch(error => {
                        console.warn(error)
                    })
                }
            }else {
                clearInterval(taskTimer)
                taskTimer = null
            }
        }, 5000)
    }


    // 添加视频文件
    function addVideo(url: any, title: string = "", needSwitch: boolean = false) {
        ysLiveClient.teduBoard.addVideoFile(url, title, needSwitch)
    }

    // 添加图片文件
    function addImages(urls: string[], title: string = "",  needSwitch: boolean = false) {
        ysLiveClient.teduBoard.addImagesFile(urls, title, needSwitch)
    }

    // 设置背景音乐
    function setBGM(url: any, title: string, sign: string) {
        ysLiveClient.stopPlayMusic(1)
        // 设置背景音乐数据
        dispatch(setValue('liveBGM', {url, title, sign}))
    }

    // 删除转码后的本地文件
    function delTranscodeFinish (bind_type: string, sign: string) {
        let index: number,
        bak = bind_type == BIND_TYPES.BINDROOM ? transcodingLiveBak : transcodingAssetsBak,
        liveArr: any = [];
        index = bak.findIndex((item: any) => item.sign == sign);
        bak.splice(index, 1);
        liveArr = bak.concat([])
        bind_type == BIND_TYPES.BINDROOM ? setTranscodingLive(liveArr) : setTranscodingAssets(liveArr)
        bind_type == BIND_TYPES.BINDROOM ? transcodingLiveBak = liveArr : transcodingAssetsBak = liveArr
    }

    // 添加转码成功的本地文件到素材库列表/直播间列表
    function addTranscodeFinish (sign: string, bind_type: string, data: any) {
        let index: number,
        bak = bind_type == BIND_TYPES.BINDROOM ? transcodingLiveBak : transcodingAssetsBak
        index = bak.findIndex((item: any) => item.sign == sign);
        // console.log('bak[index]', bak[index]);
        let file = bak[index]
        if(bind_type == BIND_TYPES.BINDROOM) {
            // 更新本地数据
            setCurrentUploadFile(file.sign, file.bind_type, 'update', {
                ...file,
                ...data,
                upload_tips: '',
                upload_status: 0,
                bind_id: userInfo.userId
            })
            // // 将本地数据放入直播间
            addToRoom({...file, ...data})
            // 删除此条本地数据
            setCurrentUploadFile(file.sign, file.bind_type, 'del')
            // 更新素材库为已关联
            setAssetsFile(file.sign, 'update', {
                quote: true,
            })
        }else {
            // 更新本地数据
            setCurrentUploadFile(file.sign, file.bind_type, 'update', {
                ...file,
                ...data,
                upload_tips: '',
                upload_status: 0,
                bind_id: userInfo.userId
            })
            // 将本地数据放入素材库
            setAssetsFile(file.sign, 'add', bak[index])
            // 删除此条本地数据
            setCurrentUploadFile(file.sign, file.bind_type, 'del')
        }
        
    }
    // 判断当前课件是否已添加进白板
    function isInLiveFile(sign: string) {
        let index: number = [...liveFiles, liveBGM].findIndex((item: any) => item.sign == sign);
        return index != -1
    }

    return (
        <div className="file-manager">
            <Row className="file-wrap">
                <Col span={6}>
                    {
                        <div>
                            <Button className="refresh-btn" shape="round" size="large" onClick={() => refresh()}>同步课件</Button>
                            <Upload
                                className="file-upload"
                                showUploadList={false}
                                beforeUpload={(file: any) => {
                                    upload(file).then();
                                    return false;
                                }}
                            >
                                <Button shape="round" size="large" disabled={isUploading}>上传素材库</Button>
                            </Upload>
                            <div className="file-desc">
                                <p>1、课件仅支持ppt、pptx、pdf格式内容</p>
                                <p>2、课件中不能包含密码</p>
                                <p>3、音视频课件仅支持mp3,mp4格式</p>
                            </div>
                        </div>
                    }
                    
                </Col>
                <Col span={18} className="file-list-wrap">
                    <div className="file-list-content">
                        <Search defaultValue={searchText} placeholder="输入文件名称搜索" onSearch={onSearch} style={{ width: 200 }} />
                        <div className="file-list">
                            <div id="assetsTop" style={{height:0,overflow:'hidden'}}></div>
                            {
                                (assets.length == 0 && transcodingAssets.length == 0) ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" /> :
                                    <InfiniteScroll
                                        pageStart={startPage}
                                        loadMore={loadFunc}
                                        hasMore={!isLoading && isHasMore}
                                        useWindow={false}
                                        threshold={5}
                                    >
                                        {transcodingAssets.map((item: any, index: number) => (
                                            <Row className="file-item" key={index}>
                                                <Col span={4} className="file-cover">
                                                    <img src={item.thumbnail} alt="img"/>
                                                </Col>
                                                <Col span={11} className="file-name">
                                                    {item.file_title}
                                                </Col>
                                                <Col span={5} className="file-ext">
                                                    { item.upload_tips }
                                                </Col>
                                                <Col span={4} className="file-action">
                                                    {
                                                        item.upload_status == 2 && <Button type="link" className="file-delete" onClick={() => cancelUpload(item)}>取消上传</Button>
                                                    }
                                                    {
                                                        (!item.upload_status) && <Button type="text" className="file-delete" onClick={() => setCurrentUploadFile(item.sign, BIND_TYPES.BINDUSER, 'del')}>
                                                            <DeleteOutlined />
                                                        </Button>
                                                    }
                                                    {
                                                        item.upload_status == 7 && <Button type="text" className="file-delete" onClick={() => delTranscodeFinish(BIND_TYPES.BINDUSER,item.sign)}>
                                                            <DeleteOutlined />
                                                        </Button>
                                                    }
                                                </Col>
                                            </Row>
                                        ))}
                                        {assets.map((item: any, index: number) => (
                                            <Row className="file-item" key={index}>
                                                <Col span={4} className="file-cover">
                                                    <img src={item.thumbnail} alt="img"/>
                                                </Col>
                                                <Col span={11} className="file-name">
                                                    {item.file_title}
                                                </Col>
                                                <Col span={5} className="file-ext">
                                                    {
                                                        item.upload_status ? <span>{ item.upload_tips }</span> :
                                                            (
                                                                isInLiveFile(item.sign) ? <Button type="text" className="file-add-to-live" onClick={() => delToRoom(item)}>
                                                                    取消添加
                                                                </Button> : <Button type="link" onClick={() => addToRoom(item)} className="file-add-to-live">
                                                                    {item.file_ext == FILE_EXT.AUDIO ? '设为背景音乐':'添加到直播间'}
                                                                </Button>
                                                            )
                                                    }
                                                </Col>
                                                <Col span={4} className="file-action">
                                                    {
                                                        (!item.upload_status) && <Button type="text" className="file-delete" onClick={() => setAssetsFile(item.sign, 'del')}>
                                                            <DeleteOutlined />
                                                        </Button>
                                                    }
                                                </Col>
                                            </Row>
                                        ))}
                                        {
                                            (assets.length != 0 || transcodingAssets.length != 0) &&!isLoading && !isHasMore && <div className="file-all-load">已全部加载</div>
                                        }
                                    </InfiniteScroll>
                            }
                            {isHasMore && isLoading && (
                                <div className="file-loading-container">
                                    <Spin />
                                </div>
                            )}
                        </div>
                    </div>

                </Col>
            </Row>
        </div>
    )
}
