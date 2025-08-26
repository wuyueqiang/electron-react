import React, { useState, useRef, useEffect } from 'react'
import { LStorage } from '../../utils/tools';
interface VideoCallUserStatusParams {
    videoCallUserStatus: {
        userId: string,
        avatar: string,
        nick: string,
        video: number,
        audio: number
    }
}
export default function VideoCallUserStatus(props: VideoCallUserStatusParams) {
    const { videoCallUserStatus } = props;
    const userInfo = LStorage.getItem('USER_INFO');

    function getNickText() {
        let nick = ''
        if (videoCallUserStatus.nick.length > 6) {
            nick = videoCallUserStatus.nick.slice(0, 6)+'...'
        }else {
            nick = videoCallUserStatus.nick
        }
        if (videoCallUserStatus.userId == userInfo.userId) {
            nick += '(我)'
        }
        return nick
    } 

    return (
        <div className='video-call-user-status-box'>
            <div className='user-status'>
                {videoCallUserStatus.audio == 0 ? <img className='mic-close-icon' src="https://feed.youshu.cc/readwith/media/0/1695783364309.png" alt=""/> : null }
                <p className='nick'>{getNickText()}</p>
            </div>
            {videoCallUserStatus.video == 0 ? <div className='avatar-box'>
                <img src={videoCallUserStatus.avatar} />
            </div> : null }
        </div>
    )
}