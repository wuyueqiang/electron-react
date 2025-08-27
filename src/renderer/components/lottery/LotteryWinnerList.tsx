import React, { useState, useEffect, useRef, useCallback } from 'react';
import './lotteryWinnerList.scss';
import { Button, message as Message } from 'antd';
import { setList, setValue } from '../../reducers/roomConfigSlice';
import { useDispatch, useSelector } from 'react-redux';
import { selectRoomConfig } from '../../reducers/index';

export default function LotteryWinnerList() {
    const dispatch = useDispatch();
    const roomConfig = useSelector(selectRoomConfig);
    const { lotteryWinnerList, showLotteryWinnerList } = roomConfig
    const [copyText, setCopyText] = useState('')

    // 关闭
    function close() {
        dispatch(setValue({key: 'showLotteryWinnerList', value: false}))
        dispatch(setList({name: 'lotteryWinner', list: []}))
    }

    // 复制名单
    function copyList(str: string) {
        try {
            window.navigator.clipboard.writeText(str).then(res => {
                Message.success(`复制成功`)
            })
        } catch (error) {
            Message.error(`复制失败`)
        }
        
    }

    useEffect(() => {
        if (lotteryWinnerList.length > 0) {
            let str = ''
            lotteryWinnerList.map((item:any) => {
                str += `ID${item.user_id}-${item.nickname}
`;
            })
            setCopyText(str)
        }else {
            setCopyText("")
        }
    }, [lotteryWinnerList])

    return (
        <>
            {showLotteryWinnerList?
                <div className='lottery-winner-bg'>
                    <div className='lottery-winner-box'>
                        <div className='lottery-winner-title'>中奖名单</div>
                        <div className='close-btn' onClick={close}>
                            <img src="http://feed.youshu.cc/readwith/media/picture/6274f0877e999.png" alt="" />
                        </div>
                        <div className='lottery-winner-main'>
                            {
                                lotteryWinnerList.map((item:any) => {
                                    return (
                                        <div key={item.user_id} className='user-item'>
                                            <div className="avatar">
                                                <img src={item.avatar} />
                                            </div>
                                            <div className="nick-box">
                                                <p className="nickname">{ item.nickname }</p>
                                                <p className="user-id">ID{ item.user_id }</p>
                                            </div>
                                            <p className="time-box">{ item.draw_time }开奖</p>
                                        </div>
                                    )
                                })
                            }
                        </div>
                        <div className='copy-btn-box'>
                            <Button type="primary" shape="round" onClick={()=>{
                                copyList(copyText)
                            }}>复制名单</Button>
                        </div>
                    </div>
                </div>
                : null
            }
        </>
    )
}