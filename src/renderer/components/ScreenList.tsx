import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectRoomConfig } from '../reducers/index';
import { Button, Checkbox } from 'antd';
import './screenList.scss';
import { setValue, setList, setLog } from '../reducers/roomConfigSlice';
import { updateMixLiveAction } from '../reducers/roomConfigThunks';
import { LIVE_ACTIONS } from '../vars/room-vars';
import { TRTCScreenCaptureSourceType, Rect, TRTCScreenCaptureSourceInfo, TRTCScreenCaptureProperty } from 'trtc-electron-sdk/liteav/trtc_define';
interface ScreenListParam {
    ysLiveClient: any
}

export default function ScreenList(props: ScreenListParam) {
    const dispatch = useDispatch();
    const roomConfig = useSelector(selectRoomConfig);
    const { ysLiveClient } = props;
    const { screenList, currentScreen, isShareScreen, isStart } = roomConfig;
    const [selectScreen, setSelectScreen] = useState({
        type: '',
        sourceId:'',
        sourceName: ''
    })
    // 是否采集本地系统声音
    const [systemAudioLoopbackChecked, setSystemAudioLoopbackChecked] = useState(true)

    //渲染屏幕分享列表
    function randerScrrenCapture(screenList: any) {
        if (screenList.length === 0) {
            return;
        }
        let srcInfos = null;
        let elId = '';
        let cnvs = null;
        let imgData = null;

        for (let i = 0; i < screenList.length; i++) {
            srcInfos = screenList[i];
            if (!srcInfos['thumbBGRA']) continue;
            elId = `screen_${srcInfos['sourceId']}`;
            cnvs = document.getElementById(elId);
            // @ts-ignore
            cnvs.width = srcInfos['thumbBGRA']['width'];
            // @ts-ignore
            cnvs.height = srcInfos['thumbBGRA']['height'];
            imgData = new ImageData(new Uint8ClampedArray(srcInfos['thumbBGRA']['buffer']), srcInfos['thumbBGRA']['width'], srcInfos['thumbBGRA']['height']);
            // @ts-ignore
            cnvs.getContext("2d").putImageData(imgData, 0, 0);
        }
    }

    // 确认分享
    function shareHandle() {
        dispatch(setValue({ key: 'currentScreen', value: selectScreen }))
        ysLiveClient.selectScreenShare({
            source: new TRTCScreenCaptureSourceInfo(selectScreen["type"], selectScreen["sourceId"], selectScreen["sourceName"], null, null, true),
            captureRect: new Rect(0,0,0,0),
            property: new TRTCScreenCaptureProperty(true, true, true, 0, 0, true)
        })
        // console.log('确认分享', isStart, !isShareScreen, systemAudioLoopbackChecked);
        
        if (isStart && !isShareScreen) {
            ysLiveClient.startCapturShare()
            if (systemAudioLoopbackChecked) {
                ysLiveClient.startSystemAudioLoopback()
                ysLiveClient.setSystemAudioLoopbackVolume(80)
            }
            dispatch(setValue({ key: 'isShareScreen', value: true }))
            setTimeout(() => {
                dispatch(updateMixLiveAction())
            }, 2000);
        }
        dispatch(setValue({ key: 'screenVisibility', value: false }))
        // dispatch(setLog(LIVE_ACTIONS.startCapturShare, {
        //     type: selectScreen["type"],
        //     sourceId: selectScreen["sourceId"],
        //     sourceName: selectScreen["sourceName"]
        // }))
    }

    // 是否采集系统声音
    function checkChange(e: any) {
        // console.log('e.target.checked', e);
        setSystemAudioLoopbackChecked(e.target.checked);
    }

    useEffect(() => {
        dispatch(setList({name: 'screen', list: ysLiveClient.getScreenShareList()}))
        // console.log('screenList', screenList);
        // console.log('currentScreen', currentScreen);
        currentScreen && setSelectScreen(currentScreen)
        
        setTimeout(() => {
            randerScrrenCapture(screenList);
        }, 500);
    }, [])
    useEffect(() => {
        // console.log('update screenList', screenList);
        setTimeout(() => {
            randerScrrenCapture(screenList);
        }, 500);
    }, [screenList])

    return (
        <div className="screenDialogBody">
            <p className="screenTitle">屏幕</p>
            {screenList && screenList.map(item => {
                if(item.type == TRTCScreenCaptureSourceType.TRTCScreenCaptureSourceTypeScreen) {
                    return (
                        <div className={(selectScreen["sourceId"]==item['sourceId'])?'screenDialogCard active':'screenDialogCard'} key={item['sourceId']} onClick={() => {
                            setSelectScreen(item)
                        }}>
                            <canvas id={'screen_' + item['sourceId']} width='0' height='0'></canvas>
                            <p className="screenName">{item['sourceName']}</p>
                        </div>
                    )
                }else {
                    return null
                }
                
            })}
            <p className="screenTitle">窗口</p>
            {screenList && screenList.map(item => {
                if(item.type == TRTCScreenCaptureSourceType.TRTCScreenCaptureSourceTypeWindow) {
                    return (
                        <div className={(selectScreen["sourceId"]==item['sourceId'])?'screenDialogCard active':'screenDialogCard'} key={item['sourceId']} onClick={() => {
                            setSelectScreen(item)
                        }}>
                            <canvas id={'screen_' + item['sourceId']} width='0' height='0'></canvas>
                            <p className="screenName">{item['sourceName']}</p>
                        </div>
                    )
                }else {
                    return null
                }
                
            })}
                
            

            <div className="btn-box">
                <Button shape="round" className="btn" disabled={!selectScreen["sourceId"]} onClick={()=>{
                    shareHandle()
                }}>确认共享</Button>
                <Checkbox className="checkbox" checked={systemAudioLoopbackChecked} onChange={checkChange}>同时共享电脑声音</Checkbox>
            </div>
        </div>
    )
}
