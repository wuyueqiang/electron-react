import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Tabs, Table, message as Message, Button, Radio, TimePicker, InputNumber, Popconfirm } from 'antd';
const { TabPane } = Tabs;
const { Column } = Table;
import './lottery.scss';
import { setList, setValue } from '../../reducers/roomConfigSlice';
import { getLiveLotteryActivityListApi, getLotteryTaskListApi, startLotteryTaskApi, endLotteryTaskApi } from '../../api';
import { LIVE_STAGE } from '../../vars/room-vars';
import { timestampToTime } from '../../utils/tools'
import { useDispatch, useSelector } from 'react-redux';
import { selectRoomConfig } from '../../reducers/index';
interface DrawObj {
    lottery_activity_id: number,
    draw_time_type: number,
    draw_run_time: null|number,
    draw_time: any
}

interface LotteryActivityParam {
    ysLiveClient: any,
    room_id: any
}
export default function LotteryActivity(props: LotteryActivityParam) {
    const { ysLiveClient, room_id } = props;
    const dispatch = useDispatch();
    const roomConfig = useSelector(selectRoomConfig);
    const { lotteryActivityVisibility, liveStage } = roomConfig
    const [tabIndex, setTabIndex] = useState('1'); // tab索引
    const tabIndexRef = useRef('1');
    const [activityList, setActivityList] = useState([]); // 抽奖活动列表
    const [taskList, setTaskList] = useState([]); // 抽奖任务结果列表
    const [showSend, setShowSend] = useState(false); // 显示发起弹窗
    const [loading, setLoading] = useState(false); // loading
    const [drawData, setDrawData] = useState<DrawObj>({
        lottery_activity_id: 0,
        draw_time_type: 1,
        draw_run_time: null,
        draw_time: null
    })

    useEffect(() => {
        if (lotteryActivityVisibility) {
            setTabIndex('1');
            getTableList('1')
        }
        return () => {

        }
    }, [lotteryActivityVisibility])

    useEffect(()=> {
        bindEvent()
        return () => {
            unBindEvent()
        }
    }, [])
    useEffect(()=> {
        tabIndexRef.current = tabIndex
    }, [tabIndex])

    function bindEvent() {
        ysLiveClient.on(ysLiveClient.EVENT.LOTTERY_MSG_RECEIVED, onLotteryReceived);
    }

    function unBindEvent() {
        ysLiveClient.off(ysLiveClient.EVENT.LOTTERY_MSG_RECEIVED, onLotteryReceived);
    }

    // 收到抽奖相关im消息
    function onLotteryReceived(item: {data: any, eventCode: string}) {
        let data = item.data
        switch (data.action) {
            case "liveLotteryTaskStart":
                // 发起抽奖im
                getTableList(tabIndexRef.current)
                break;
            case "liveLotteryTaskPushWinnerResult":
                // 抽奖结果im
                getTableList(tabIndexRef.current)
                break;
            case "liveLotteryTaskEnd":
                // 取消抽奖im
                getTableList(tabIndexRef.current)
                break;
            default:
                break;
        }
    }

    function tabChange(active: string) {
        setTabIndex(active)
        getTableList(active)
    }

    function getTableList (type: string) {
        if (type == '1' ) {
            getActivityList()
        }else {
            getLotteryTaskList()
        }
    }
    // 获取抽奖活动列表
    function getActivityList() {
        getLiveLotteryActivityListApi(room_id).then(res => {
            if (res.status.code == 200) {
                let list = res.activity_list ||[]
                list.forEach((item: any, index:number) => {
                    item['key'] = item.lottery_activity_id
                });
                setActivityList(list)
            }else {
                Message.error(`${res.status.code}-${res.status.msg}`)
            }
        })
    }
    // 获取抽奖任务列表
    function getLotteryTaskList() {
        getLotteryTaskListApi(room_id).then(res => {
            if (res.status.code == 200) {
                let list = res.task_list ||[]
                list.forEach((item: any, index:number) => {
                    item['key'] = item.lottery_task_id
                });
                setTaskList(list)
            }else {
                Message.error(`${res.status.code}-${res.status.msg}`)
            }
        })
    }

    // 点击发起，弹出确认发起弹窗
    function handleActionInitiate(item: any) {
        setDrawData({
            lottery_activity_id: item.lottery_activity_id,
            draw_time_type: 1,
            draw_run_time: null,
            draw_time: null
        })
        setShowSend(true)
    }
    // 发送类型变化
    function onRadioChange(e: any) {
        setDrawData((prevData) => {
            let newData = {
                ...prevData,
                draw_time_type: e.target.value
            }
            if (e.target.value == 1) {
                newData.draw_time = null
            }else {
                newData.draw_run_time = null
            }
            return newData
        })
    }
    // 分钟数变化
    function onRunTimeChange(value: number|null) {
        setDrawData((prevData) => {
            let newData = {
                ...prevData,
                draw_run_time: value
            }
            return newData
        })
    }
    // 时间选择框变化
    function onTimeChange(time: any, timeString: any) {
        setDrawData((prevData) => {
            let newData = {
                ...prevData,
                draw_time: time
            }
            return newData
        })
    }
    // 关闭发送弹窗
    function closeSend() {
        setShowSend(false)
        setDrawData({
            lottery_activity_id: 0,
            draw_time_type: 1,
            draw_run_time: null,
            draw_time: null
        })
    }
    // 发送抽奖
    function submitSend() {
        let params = null
        if(drawData.draw_time_type == 1) {
            if (drawData.draw_run_time && drawData.draw_run_time>0) {
                params = {
                    lottery_activity_id: drawData.lottery_activity_id,
                    draw_time_type: drawData.draw_time_type,
                    draw_run_time: drawData.draw_run_time
                }
            }else {
                Message.error(`请输入倒计时时间`)
            }
        }else if (drawData.draw_time_type == 2) {
            if (drawData.draw_time != null) {
                params = {
                    lottery_activity_id: drawData.lottery_activity_id,
                    draw_time_type: drawData.draw_time_type,
                    draw_time: drawData.draw_time.format('HH:mm')
                }
            }else {
                Message.error(`请选择固定时间`)
            }
        }
        if (params) {
            setLoading(true)
            startLotteryTaskApi(params).then(res => {
                setLoading(false)
                if(res?.status?.code == 200) {
                    Message.success(`发起成功`)
                    closeSend()
                }else {
                    Message.error(res?.status?.msg || "请求失败")
                }
            }).catch(err => {
                Message.error(`发起抽奖失败`)
                setLoading(false)
            })
        }
    }
    // 结束抽奖
    function confirmEnd(item:any) {
        let lottery_task_id = item.lottery_task_id
        endLotteryTaskApi({lottery_task_id}).then(res => {
            if(res?.status?.code == 200) {
                Message.success(`已成功结束`)
            }else {
                Message.error(res?.status?.msg || "请求失败")
            }
        }).catch(err => {
            Message.error(`结束抽奖失败`)
        })
    }
    // 查看抽奖结果
    function lookResult(item: any) {
        let winner_user_list = item.winner_user_list||[]
        dispatch(setList({name: 'lotteryWinner', list: winner_user_list}))
        dispatch(setValue({key: 'showLotteryWinnerList', value: true}))
    }
    
    return (
        <>
            {lotteryActivityVisibility?
            <div className="lottery-wrap">
                <div className="lottery-box">
                    <p className="box-title">抽奖设置</p>
                    <div 
                        className="close-btn"
                        onClick={() => {
                            dispatch(setValue({key: 'lotteryActivityVisibility', value: false}))
                            // showQuestionStatistics && back()
                        }}
                    >
                        <img src="http://feed.youshu.cc/readwith/media/picture/6274f0877e999.png" alt="" />
                    </div>
                    <div className="main">
                        <Tabs onChange={tabChange} activeKey={tabIndex}>
                            <TabPane tab="发起抽奖" key={"1"}>
                                <Table locale={{'emptyText': '暂无数据'}} scroll={{ y: 350 }} size="small" pagination={false} dataSource={activityList}>
                                    <Column
                                        title="抽奖名称"
                                        dataIndex="title"
                                        render={(title:string) => {
                                            return (
                                                <span>{title}</span>
                                            )
                                        }}
                                    />
                                    <Column
                                        title="奖品"
                                        dataIndex="prize_name"
                                        render={(prize_name:string) => {
                                            return (
                                                <span>{prize_name}</span>
                                            )
                                        }}
                                    />
                                    <Column
                                        title="数量"
                                        dataIndex="prize_total"
                                        width={80}
                                        render={(prize_total:number) => {
                                            return (
                                                <span>{prize_total}</span>
                                            )
                                        }}
                                    />
                                    <Column
                                        title="操作"
                                        width={80}
                                        align="center"
                                        render={(text: any, record: any, index: any) => {
                                            return (
                                                record.lottery_status == 2 ? (
                                                    <Popconfirm
                                                        title="是否确认结束"
                                                        onConfirm={()=>{
                                                            confirmEnd(record)}
                                                        }
                                                        okText="确认"
                                                        cancelText="取消"
                                                    >
                                                        <Button type='text' className='end' disabled={liveStage == LIVE_STAGE.END_STAGE}>结束</Button>
                                                    </Popconfirm>
                                                ): (
                                                    <Button type='text' className='start' disabled={liveStage == LIVE_STAGE.END_STAGE} onClick={() => {
                                                        handleActionInitiate(record)
                                                    }}>发起</Button>
                                                )
                                            )
                                        }}
                                    />
                                </Table>
                            </TabPane>
                            <TabPane tab="中奖名单" key={"2"}>
                                <Table locale={{'emptyText': '暂无数据'}} scroll={{ y: 350 }} size="small" pagination={false} dataSource={taskList}>
                                    <Column
                                        title="抽奖名称"
                                        dataIndex="title"
                                        render={(title:string) => {
                                            return (
                                                <span>{title}</span>
                                            )
                                        }}
                                    />
                                    <Column
                                        title="奖品"
                                        dataIndex="prize_name"
                                        render={(prize_name:string) => {
                                            return (
                                                <span>{prize_name}</span>
                                            )
                                        }}
                                    />
                                    <Column
                                        title="开奖时间"
                                        dataIndex="draw_timestamp"
                                        width={120}
                                        render={(draw_timestamp:string) => {
                                            return (
                                                <span>{timestampToTime(Number(draw_timestamp)*1000)}</span>
                                            )
                                        }}
                                    />
                                    <Column
                                        title="数量"
                                        dataIndex="prize_total"
                                        width={80}
                                        render={(prize_total:string) => {
                                            return (
                                                <span>{prize_total}</span>
                                            )
                                        }}
                                    />
                                    <Column
                                        title="中奖名单"
                                        width={100}
                                        align="center"
                                        render={(text: any, record: any, index: any) => {
                                            return (
                                                record.winner_user_list.length ? (
                                                    <Button type='text' className='start' onClick={()=>{
                                                        lookResult(record)
                                                    }}>查看</Button>
                                                ): (
                                                    <Button type='text' className='end' disabled={true}>未开奖</Button>
                                                )
                                            )
                                        }}
                                    />
                                </Table>
                            </TabPane>
                        </Tabs>
                    </div>
                    
                </div>
                {showSend ? 
                    <div className='send-box'>
                        <p className='send-title'>开奖时间</p>
                        <div className='send-main'>
                            <Radio.Group onChange={onRadioChange} value={drawData.draw_time_type} >
                                <Radio value={1}>倒计时</Radio>
                                <Radio value={2}>固定时间</Radio>
                            </Radio.Group>
                            { drawData.draw_time_type==1 ?
                                <div className='flex'>   
                                    <div className='flex-number'>
                                        <InputNumber min={1} max={120} value={drawData.draw_run_time} onChange={onRunTimeChange}/>
                                        <p style={{marginLeft: '10px'}}>分钟后</p>
                                    </div>
                                </div>
                                :null
                            }
                            { drawData.draw_time_type==2 ?
                                <div className='flex'>
                                    <TimePicker placeholder='请选择时间' value={drawData.draw_time} format="HH:mm" onChange={onTimeChange}/>
                                </div>
                                :null
                            }
                        </div>
                        <div className='btn-box'>
                            <Button onClick={closeSend}>取消</Button>
                            <Button className="submit-btn" type="primary" loading={loading} onClick={submitSend}>发起抽奖</Button>
                        </div>
                    </div>
                    : null
                }
            </div>
            : null
            }
        </>
    )
}