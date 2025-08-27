import React, { useEffect, useState, useRef } from 'react';
import './answer.scss';
import { message as Message, Table } from 'antd';

import { setValue } from '../reducers/roomConfigSlice';
import Exam from '../components/answer/Exam';
import QuestionStatistics from '../components/answer/QuestionStatistics';
import { GetLiveExamQuestionList, GetLiveExamQuestionTaskInfo } from '../api';
// import Store from 'electron-store'
// const store: any = new Store();
import { LStorage } from '../utils/tools';
import { useDispatch, useSelector } from 'react-redux';
import { selectRoomConfig } from '../reducers/index';



interface AnswerPropsParam {
    ysLiveClient: any,
    room_id: any,
}

export default function Answer(props: AnswerPropsParam) {
    const timerId: any = useRef();
    const show: any = useRef();
    const { ysLiveClient, room_id } = props;
    const dispatch = useDispatch();
    const roomConfig = useSelector(selectRoomConfig);
    const { answerVisibility, isAnswering } = roomConfig
    const EVENT = ysLiveClient?.EVENT || {};

    const [examList, setExamList] = useState([]); // 试卷列表
    const examListRef: any = useRef(); // 试卷列表
    const [questionStatistics, setQuestionStatistics] = useState(null); // 题目统计信息
    const [showQuestionStatistics, setShowQuestionStatistics] = useState(false); // 题目统计信息
    const [showLost, setShowLost] = useState(false); // 题目统计失效
    const userInfo = LStorage.getItem('USER_INFO')
    const role_label = {
        "ANCHOR":"老师",
        "ADMIN":"主持人",
        "MONITOR":"班长",
        "MEMBER":"学员",
        "NONE": ""
    }


    useEffect(()=>{
        show.current = answerVisibility
        if (answerVisibility) {
            getExamList()
        }
    }, [answerVisibility])

    useEffect(()=>{
        if (!isAnswering) {
            setTimeout(() => {
                clearInterval(timerId.current)
            }, 2000);
        }
    }, [isAnswering])

    useEffect(()=>{

        if (ysLiveClient) {
            ysLiveClient.on(EVENT.TIM_ANSWER_RECEIVED, onMessageReceived);
        }

        return () => {
            ysLiveClient.off(EVENT.TIM_ANSWER_RECEIVED, onMessageReceived);
        }
    }, [])

    // 收到答题im消息
    function onMessageReceived (item: {data: any, eventCode: string}) {
        // console.log('答题IM接收消息：', item)
        let data: any = item.data;
        if (data.userID == userInfo.userId) {
            // 自己的操作消息抛弃
            return
        }
        if (data.type == 'liveSystemMsg') {
            // 发起答题
            if (data.action == 'sendLiveExamQuestion') {
                let item = JSON.parse(data.quote)
                Message.info(`${role_label[data.role]}${data.nick}发起答题`);
                dispatch(setValue({ key: 'isAnswering', value: true }))
                updateQuestion(item, {
                    live_exam_task_answer_id: item.live_exam_task_answer_id,
                    live_question_status: 2
                })
                show.current && getQuestionStatistics({
                    live_exam_task_answer_id: item.live_exam_task_answer_id,
                    live_question_status: 2
                })
            }
            // 替换答题
            else if (data.action == 'replaceLiveExamQuestion') {
                let item = JSON.parse(data.quote)
                dispatch(setValue({ key: 'isAnswering', value: true }))
                getExamList()
                show.current && getQuestionStatistics({
                    live_exam_task_answer_id: item.live_exam_task_answer_id,
                    live_question_status: 2
                })
                Message.info(`${role_label[data.role]}${data.nick}发起答题`);
            }
            // 结束答题
            else if (data.action == 'endLiveExamQuestion') {
                let item = JSON.parse(data.quote)
                if(role_label[data.role] && data.nick) {
                    Message.info(`${role_label[data.role]}${data.nick}结束作答`);
                }else {
                    Message.info(`答题结束`);
                }
                dispatch(setValue({ key: 'isAnswering', value: false }))
                updateQuestion(item, {
                    live_question_status: 3
                })
            }
            // 添加试卷/更新试卷/删除试题
            else if (data.action == 'createLiveExamQuestion' || data.action == 'refreshLiveExamQuestion' || data.action == 'deleteLiveExamQuestion') {
                let msg_lable: any = {
                    createLiveExamQuestion: '添加了试卷-ID',
                    refreshLiveExamQuestion: '更新了试卷-ID',
                    deleteLiveExamQuestion: '移除了1道试题-试卷ID'
                }
                let item = JSON.parse(data.quote)
                Message.info(`${role_label[data.role]}${data.nick}${msg_lable[data.action]}${item.bm_exam_id || "" }`);
                getExamList()
            }
        }

    }

    // 获取试卷列表
    function getExamList() {
        GetLiveExamQuestionList(Number(room_id)).then(res => {
            if (res.status.code == 200) {
                let list = res.live_exam_list || []
                examListRef.current = list
                setExamList(list)
            } else {
                Message.error(`${res.status.code}-${res.status.msg}`)
                console.warn(res)
            }
        }).catch(err => {
            console.warn(err)
        })
    }

    // 获取子组件的更新事件，更新答题状态
    function updateQuestion (item:any, json: any) {
        // 拷贝数据
        let tempExamList = JSON.parse(JSON.stringify(examListRef.current))
        // 找试卷
        let ids = tempExamList.map(function(d){
            return Number(d.live_bm_exam_id);
        })
        let index = ids.indexOf(Number(item.bm_exam_id))
        // 找试题
        let ids2 = tempExamList[index].exam_question_list.map(function(c) {
            return Number(c.live_exam_question_id)
        })
        let childIndex = ids2.indexOf(Number(item.live_exam_question_id))
        // 更新状态
        tempExamList[index].exam_question_list[childIndex] = {
            ...tempExamList[index].exam_question_list[childIndex],
            ...json
        }
        // 重新赋值
        examListRef.current = tempExamList
        setExamList(tempExamList)
    }

    // 获取并展示答题统计信息
    function getQuestionStatistics(obj:any) {
        if (obj.live_exam_task_answer_id) {
            clearInterval(timerId.current)
            GetLiveExamQuestionTaskInfo(obj.live_exam_task_answer_id).then(res => {
                if (res.status.code == 200) {
                    let data = res.live_exam_task_info
                    setQuestionStatistics(data)
                    setShowQuestionStatistics(true)
                    setShowLost(false)
                } else if (res.status.code == 6511035) {
                    setQuestionStatistics(null)
                    setShowLost(true)
                    setShowQuestionStatistics(true)
                } else {
                    Message.error(`${res.status.code}-${res.status.msg}`)
                    console.warn(res)
                }
            })
            // 正在答题中 2s更新一次
            if (obj.live_question_status == 2) {
                startTaskTimer(obj.live_exam_task_answer_id)
            }
        }
    }

    // 开始每2s更新答题数据
    function startTaskTimer (live_exam_task_answer_id:any) {
        timerId.current = setInterval(() => {
            GetLiveExamQuestionTaskInfo(live_exam_task_answer_id).then(res => {
                if (res.status.code == 200) {
                    let data = res.live_exam_task_info
                    setQuestionStatistics(data)
                }
            })
        }, 2000)
    }

    // 统计返回至列表
    function back() {
        clearInterval(timerId.current)
        setShowQuestionStatistics(false)
        setQuestionStatistics(null)
        setShowLost(false)
    }


    return (
        <>
            {answerVisibility?
            <div className="answer-wrap">
                <div className="answer-box">
                    <p className="box-title">答题</p>
                    <div 
                        className="close-btn"
                        onClick={() => {
                            dispatch(setValue({ key: 'answerVisibility', value: false }))
                            showQuestionStatistics && back()
                        }}
                    >
                        <img src="http://feed.youshu.cc/readwith/media/picture/6274f0877e999.png" alt="" />
                    </div>
                    <div className="main">
                        {/* 试卷列表 */}
                        {!showQuestionStatistics ? 
                            <div className="exam-list">  
                                {examList && examList.map(item => {
                                    return <Exam key={item.live_exam_id} getExamList={getExamList} updateQuestion={updateQuestion} getStatistics={getQuestionStatistics} examInfo={item}></Exam>
                                })}
                                {examList && examList.length == 0 ? 
                                    <div className="no-data">
                                        <img src="http://feed.youshu.cc/readwith/media/picture/6274ef0e64fc3.png" alt="" />
                                        <p>暂无题目，请联系助教添加</p>
                                    </div>
                                    :null
                                }
                            </div>
                            : null
                        }
                        
                        
                        {/* 答题统计 */}
                        {showQuestionStatistics ? 
                            <QuestionStatistics updateQuestion={updateQuestion} back={back} showLost={showLost} data={questionStatistics}></QuestionStatistics>
                            :null
                        }

                    </div>
                    
                </div>
            </div>
            : null
            }
        </>
        
    )
}
