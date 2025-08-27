import React, { useState, useEffect } from 'react'
import { CameraPositions, BeautyStyles, LIVE_ACTIONS } from '../vars/room-vars';
import { Select, Radio } from 'antd';
import { setLog, setDevice } from '../reducers/roomConfigSlice';
import { useDispatch, useSelector } from 'react-redux';
import { selectRoomConfig } from '../reducers/index';

import '../css/videoSetting.scss';
interface VideoSettingParams {
    ysLiveClient: any,
    setMirror: any,
    setShowVideoSetting: any,
    setCameraPosition: any
}
export default function VideoSetting(props: VideoSettingParams) {
    const dispatch = useDispatch();
    const roomConfig = useSelector(selectRoomConfig);
    const { ysLiveClient, setMirror, setShowVideoSetting, setCameraPosition } = props;
    const { cameraList, camera, isMirror, cameraPosition, roomInfo } = roomConfig;
    const [currentBeautyStyleLabel, setCurrentBeautyStyleLabel] = useState(BeautyStyles[0].label)

    function closeSetting() {
        setShowVideoSetting(false)
    }

    function handleCamreChange (value: string) {
        let selectCamrea = cameraList.find((item:{deviceId: string, deviceName: string}) => item.deviceId === value);
        console.log("====handleCamreChange", selectCamrea);
        if (selectCamrea) {
            dispatch(
                setDevice({
                  name: 'camera',
                  device: {
                    deviceId: selectCamrea.deviceId || '',
                    deviceName: selectCamrea.deviceName || ''
                  },
                }),
              );  
            // dispatch(setLog(LIVE_ACTIONS.selectCamera, {
            //     deviceId: selectCamrea.deviceId,
            //     deviceName: selectCamrea.deviceName,
            // })) 
        }
    }

    function handleMirrorChange(value: boolean) {
        setMirror(value)
    }

    function handleBeautyStyleChange(item: any) {
        setCurrentBeautyStyleLabel(item.label)
        ysLiveClient.setBeautyStyle({
            beautyStyle: item.beautyStyle,
            beauty: item.beauty,
            white: item.white,
            ruddiness: item.ruddiness
        })
        // dispatch(setLog(LIVE_ACTIONS.setBeautyStyle, {
        //     label: item?.label
        // }))
    }
    
    
    useEffect(() => {
        
    }, [])

    return (
        <div className='video-setting-box'>
            <div className='close' onClick={closeSetting}>
                <img src="https://feed.youshu.cc/readwith/media/0/1696646788124.png" alt="关闭" />
            </div>
            <div className='header'>
                <p className='title'>设置</p>
            </div>
            <div className='main'>
                <div className='item'>
                    <p className='lable'>摄像头</p>
                    <div className='content'>
                        <Select
                            value={camera.deviceId}
                            style={{ width: 320 }}
                            onChange={handleCamreChange}
                        >
                            {
                                cameraList.map((item: any, index: number) => {
                                    return <Select.Option key={index} value={item.deviceId}>{item.deviceName}</Select.Option>
                                })
                            }
                        </Select>
                    </div>
                </div>
                <div className='item'>
                    <p className='lable'>镜像</p>
                    <div className='content'>
                        <div onClick={() => handleMirrorChange(true)} className={ isMirror ? 'live-radio active' : 'live-radio'}>开启</div>
                        <div onClick={() => handleMirrorChange(false)} className={ !isMirror ? 'live-radio active' : 'live-radio'}>关闭</div>
                    </div>
                </div>
                <div className='item'>
                    <p className='lable'>美颜</p>
                    <div className='content'>
                        {
                            BeautyStyles.map((item: any, index: number) => {
                                return (<div key={index} onClick={() => handleBeautyStyleChange(item)} className={ currentBeautyStyleLabel == item.label ? 'live-radio active' : 'live-radio'}>{item.label}</div>)
                            })
                        }
                    </div>
                </div>
                <div className='item'>
                    <p className='lable'>布局</p>
                    <div className={roomInfo.display_type == 1?'content video-position-content vertical':'content video-position-content'}>
                        {
                            roomInfo.display_type == 0 && CameraPositions.map((item: any, index: number) => {
                                return item.position == 'fullScreen' ? null : <div key={index} onClick={() => setCameraPosition(item)} className={item.position == cameraPosition.position ? 'video-position avtive':'video-position'}>
                                    <div className='top'>
                                        <div className={'positon ' + item.position}></div>
                                    </div>
                                    <div className='bottom'>
                                        <div className={item.position == cameraPosition.position ? 'live-radio active' : 'live-radio'}>{item.label}</div>
                                    </div>
                                </div>
                            })
                        }
                        {
                            roomInfo.display_type == 1 ? <>
                                <div onClick={() => setCameraPosition(CameraPositions[1])} className='vertical-video-position'>
                                    <div className='top'>
                                        <div className='ppt'>
                                            <span>PPT</span>
                                        </div>
                                        <div className='camera'>
                                            <span>摄像头</span>
                                        </div>
                                    </div>
                                    <div className={CameraPositions[1].position == cameraPosition.position?'vertical-radio active':'vertical-radio'}></div>
                                </div>
                                <div onClick={() => 
                                        CameraPositions[4].position != cameraPosition.position && setCameraPosition(CameraPositions[4])
                                    } className='vertical-video-position'>
                                    <div className='top'>
                                        <div className='camera'>
                                            <span>摄像头</span>
                                        </div>
                                    </div>
                                    <div className={CameraPositions[4].position == cameraPosition.position?'vertical-radio active':'vertical-radio'}></div>
                                </div>
                            </> : null
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}