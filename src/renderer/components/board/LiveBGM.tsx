import React, { useState, useEffect, useRef } from 'react'
import { AudioMusicParam } from 'trtc-electron-sdk/liteav/trtc_define';
import { Slider, Popover, Button, Tooltip } from 'antd';
import ImgIcon from '../ImgIcon';
import { LStorage } from '../../utils/tools';
import './liveBGM.scss'
import { setValue } from '../../reducers/roomConfigSlice';
import { useSelector, useDispatch } from 'react-redux';
import { selectRoomConfig } from '../../reducers/index';
interface LiveBGMParams {
    ysLiveClient: any
}
export default function LiveBGM(props: LiveBGMParams) {
    const { ysLiveClient } = props;
    const roomConfig = useSelector(selectRoomConfig);
    const dispatch = useDispatch();
    const EVENT = ysLiveClient?.EVENT || {};
    const { liveBGM, isStart } = roomConfig
    const [musicVolume, setMusicVolume] = useState(80)
    const [musicLoop, setMusicLoop] = useState(LStorage.getItem('musicLoop')||false)
    const [duration, setDuration] = useState('00:00');
    const durationSRef = useRef(0);
    const [currentTime, setCurrentTime] = useState('00:00');
    const [musicStatus, setMusicStatus] = useState('stop');
    const musicStatusRef = useRef('stop')
    const [cuerrentPercent, setCuerrentPercent] = useState('0%');
    const [showTitle, setShowTitle] = useState('')
    // 播放
    function playMusic() {
        let params = new AudioMusicParam(1, liveBGM.url, 0)
        ysLiveClient.startPlayMusic(params)
    }
    // 暂停
    function pausePlayMusic() {
        ysLiveClient.pausePlayMusic(1)
        setMusicStatus('pause')
    }
    // 继续
    function resumePlayMusic() {
        ysLiveClient.resumePlayMusic(1)
        setMusicStatus('playing')
    }
    // 停止
    function stopPlayMusic() {
        ysLiveClient.stopPlayMusic(1)
        setMusicStatus('stop')
    }

    // 设置进度
    function seekMusicToPosInTime(s:number) {
        ysLiveClient.seekMusicToPosInTime(1, s*1000)
    }

    function toTwo(n: number | string) {
        return (n = Number(n) > 9 ? "" + n : "0" + n);
    }
    // 获取音频时长
    function getMusicDurationInMS() {
        let second = Math.floor(ysLiveClient.getMusicDurationInMS(liveBGM.url)/1000)
        let m = toTwo(Math.floor(second / 60));
        let s = toTwo(Math.floor(second % 60));
        setDuration(`${m}:${s}`)
        durationSRef.current = second
    }
    // 设置音量
    function setAllMusicVolume(volume: number) {
        setMusicVolume(volume)
        ysLiveClient.setAllMusicVolume(volume)
    }
    function volumeMusicSteps() {
        return (
            <div>
                <Slider className='music-volume-slider' style={{ height: '100px' }} vertical defaultValue={musicVolume} value={musicVolume} onChange={(v: any) => setAllMusicVolume(v)} />
            </div>
        )
    }

    // 改变是否循环
    function changMusicLoop() {
        setMusicLoop(!musicLoop)
        LStorage.setItem('musicLoop', !musicLoop)
    }

    // 播放开始
    function onMusicStart (params:{eventCode: string, data: any}) {
        setMusicStatus('playing')
    }

    // 播放进度
    function onMusicPlayProgress (params:{eventCode: string, data: any}) {
        let second = Math.floor(params.data.curPtsMS/1000)
        let m = toTwo(Math.floor(second / 60));
        let s = toTwo(Math.floor(second % 60));
        setCurrentTime(`${m}:${s}`)
        let cuerrentPercent = (second/durationSRef.current)*100
        setCuerrentPercent(cuerrentPercent+"%")
    }
    // 播放结束
    function onMusicEnd (params:{eventCode: string, data: any}) {
        if (LStorage.getItem('musicLoop')) {
            playMusic()
        }else {
            setMusicStatus('stop')
            setCurrentTime('00:00')
            setCuerrentPercent('0%')
        }
    }

    function bindEvent () {
        ysLiveClient.on(EVENT.MUSIC_START, onMusicStart);
        ysLiveClient.on(EVENT.MUSIC_PLAY_PROGRESS, onMusicPlayProgress);
        ysLiveClient.on(EVENT.MUSIC_END, onMusicEnd);
    }

    function unbindEvent () {
        ysLiveClient.off(EVENT.MUSIC_START, onMusicStart);
        ysLiveClient.off(EVENT.MUSIC_PLAY_PROGRESS, onMusicPlayProgress);
        ysLiveClient.off(EVENT.MUSIC_END, onMusicEnd);
    }

    function mouseDown(e: any) {
        e.preventDefault();
        if (musicStatusRef.current == 'stop') {
            return
        }
        seekMusic(e)
        // pausePlayMusic()
        document.onmousemove = function(e) {
            seekMusic(e)
        }
        /*鼠标的抬起事件,终止拖动*/
        document.onmouseup = function () {
            // resumePlayMusic()
            document.onmousemove = null;
            document.onmouseup = null;
        }

    }

    function seekMusic(e:any) {
        const progressBar = document.querySelector('.progressBar');
        const progressBarWidth = progressBar.offsetWidth;
        const offsetX = e.pageX - progressBar.getBoundingClientRect().left;
        const clickPercent = (offsetX / progressBarWidth)*100;
        setCuerrentPercent(clickPercent+"%")
        let newS = Math.floor(clickPercent/100*durationSRef.current)
        seekMusicToPosInTime(newS)
    }
    

    // 初始化
    function init () {
        setMusicStatus('stop')
        setDuration('00:00')
        durationSRef.current = 0
        setCurrentTime('00:00')
        setCuerrentPercent('0%')
    }
    

    useEffect(() => {
        setAllMusicVolume(80)
        if (LStorage.getItem('liveBGM')) {
            dispatch(setValue({key: 'liveBGM', value: LStorage.getItem('liveBGM')}))
        }
        return() => {
            
        }
    }, [])

    useEffect(() => {
        if (liveBGM.title) {
            bindEvent()
            getMusicDurationInMS()
            LStorage.setItem('liveBGM', liveBGM)
            if(liveBGM.title.length > 18) {
                let frontStr = liveBGM.title.substring(0, 10);
                let backStr = liveBGM.title.substring(liveBGM.title.length - 6);
                setShowTitle(frontStr + '...' + backStr)
            }else {
                setShowTitle(liveBGM.title)
            }
        }else {
            init()
            unbindEvent()
            LStorage.setItem('liveBGM', "")
        }
        return() => {
            init()
            unbindEvent()
        }
    }, [liveBGM])

    useEffect(() => {
        musicStatusRef.current = musicStatus
        return() =>{

        }
    }, [musicStatus])

    useEffect(() => {
        if(!isStart) {
            stopPlayMusic()
            setMusicStatus('stop')
            setCurrentTime('00:00')
            setCuerrentPercent('0%')
        }
        return() =>{

        }
    }, [isStart])

    return (
        <>
        {
            liveBGM && liveBGM.title? <div className='music-box'>
                <div className='btn-box'>
                    {musicStatus=='stop'?<ImgIcon.MusicPlay onClick={playMusic} className="music-btn" title="播放" />:null}
                    {musicStatus=='pause'?<ImgIcon.MusicPlay onClick={resumePlayMusic} className="music-btn" title="播放" />:null}
                    {musicStatus=='playing'?<ImgIcon.MusicPause onClick={pausePlayMusic} className="music-btn" title="暂停" />:null}
                </div>

                <p className='currentTime time'>{currentTime}</p>
                <div className='progressBar' onMouseDown={mouseDown}>
                    <div className="progress" style={{width: cuerrentPercent}}></div>
                </div>
                <p className='duration time'>{duration}</p>
                <Popover color="#4F5361" placement="top" content={() => volumeMusicSteps()} trigger="click">
                    <ImgIcon.MusicVolume className="contrl-btn" title="音量" />
                </Popover>
                {musicLoop?<ImgIcon.MusicLoop  onClick={changMusicLoop} className="contrl-btn" title="循环" />:<ImgIcon.MusicNoLoop  onClick={changMusicLoop} className="contrl-btn" title="循环" />}
                <div className='line'></div>
                <Tooltip placement="top" title={liveBGM.title}>
                    <p className='music-title'>{showTitle}</p>
                </Tooltip>
                <Button type="text" size="small" className="music-quit-btn" icon={<ImgIcon.MusicQuit className="contrl-btn"/>} onClick={()=>{
                    stopPlayMusic()
                    init ()
                    dispatch(setValue({key: 'liveBGM', value: {}}))
                }}>
                    结束音频
                </Button> 
            </div>:<div className='music-box-nodata'></div>
        }
        </>
    )
}