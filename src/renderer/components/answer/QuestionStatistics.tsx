import React, { useEffect, useState } from 'react';
import './questionStatistics.scss';
import UserTable from './UserTable';
import { message as Message, Modal } from 'antd';
import { setValue } from '../../reducers/roomConfigSlice';
import { endLiveExamQuestion } from '../../api';
// import Store from 'electron-store';
// const store: any = new Store();
import { LStorage } from '../../utils/tools';
import { useDispatch, useSelector } from 'react-redux';
import { selectRoomConfig } from '../../reducers/index';

interface QuestionStatisticsPropsParam {
  updateQuestion: any;
  showLost: boolean;
  data: any;
  back: any;
}

export default function Exam(props: QuestionStatisticsPropsParam) {
  const dispatch = useDispatch();
  const roomConfig = useSelector(selectRoomConfig);
  const { updateQuestion, showLost, data, back } = props;
  const [step, setStep] = useState(1); // 选项
  const userInfo = LStorage.getItem('USER_INFO');
  // 结束答题弹窗
  const [visible, setVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {}, [data]);

  function getPercentage(numerator: number, denominator: number) {
    if (numerator == 0) {
      return 0;
    } else {
      let per = ((numerator / denominator) * 100).toFixed(0);
      return per;
    }
  }

  // 结束作答
  function endQuestion() {
    setVisible(true);
  }

  // 确定结束
  function handleOk() {
    setConfirmLoading(true);
    endLiveExamQuestion(
      data.live_exam_task_answer_id,
      userInfo.userId,
      userInfo.role,
    )
      .then((res) => {
        handleCancel();
        if (res.status.code == 200) {
          Message.success('成功结束');
          dispatch(setValue({ key: 'isAnswering', value: false }));
          updateQuestion(
            {
              bm_exam_id: data.bm_exam_id,
              live_exam_question_id: data.live_exam_question_id,
            },
            {
              live_question_status: 3,
            },
          );
        } else {
          Message.error(`${res.status.code}-${res.status.msg}`);
          console.warn(res);
        }
      })
      .catch((err) => {
        handleCancel();
      });
  }

  // 取消
  function handleCancel() {
    setVisible(false);
    setConfirmLoading(false);
  }

  return (
    <div className="statistic-box">
      <div className="statistic-top">
        <p className="statistic-title">
          题目：
          <span>{data && data.question_title ? data.question_title : '-'}</span>
        </p>
        <div className="statistic-btns">
          {data && data.answer_status == 1 ? (
            <div
              className="end-btn"
              onClick={() => {
                endQuestion();
              }}
            >
              结束作答
            </div>
          ) : null}
          <div
            className="back-btn"
            onClick={() => {
              back();
            }}
          >
            返回
          </div>
        </div>
      </div>
      {showLost ? (
        <div className="lostData">
          <img src="http://feed.youshu.cc/readwith/media/picture/6274ef0e64fc3.png" />
          <p>数据已失效，请联系助教查看</p>
        </div>
      ) : null}
      {!showLost && data ? (
        <>
          <div className="tab-box">
            <div className="tab">
              <div
                className={step == 1 ? 'active' : ''}
                onClick={() => {
                  setStep(1);
                }}
              >
                按题目查看
              </div>
              <div
                className={step == 2 ? 'active' : ''}
                onClick={() => {
                  setStep(2);
                }}
              >
                按用户查看
              </div>
            </div>
            <div className="submit-box">
              <p>提交人数：{data.answer_user_nums}</p>
              <p>耗时：{data.answer_duration}</p>
            </div>
          </div>
          {step == 1 ? (
            <div className="chart-box">
              <div className="question-info">
                <p>题型：{data.question_type == 1 ? '单选' : '多选'}</p>
                <p>正确答案：{data.right_answer_items}</p>
                <p>答对人数：{data.answer_right_nums}</p>
                <p>
                  正确率：
                  {getPercentage(data.answer_right_nums, data.answer_user_nums)}
                  %
                </p>
              </div>

              <div className="chart">
                {data.answer_status == 1 && data.answer_user_nums == 0 ? (
                  <div className="waiting">
                    <img src="https://feed.youshu.cc/readwith/media/picture/6274ef0e64fc3.png" />
                    <p>等待学员提交...</p>
                  </div>
                ) : null}
                {data.exam_answer_item &&
                  data.exam_answer_item.map((item) => {
                    let style = {
                      height:
                        getPercentage(
                          item.answer_user_nums,
                          data.answer_user_nums,
                        ) + '%',
                    };
                    return (
                      <div key={item.target_number} className="cylinder">
                        <p>
                          {item.answer_user_nums}人/
                          {getPercentage(
                            item.answer_user_nums,
                            data.answer_user_nums,
                          )}
                          %
                        </p>
                        <div className="percent">
                          {getPercentage(
                            item.answer_user_nums,
                            data.answer_user_nums,
                          ) > 0 ? (
                            <div style={style} className="percent-color"></div>
                          ) : null}
                        </div>
                        <h5>{item.target_number}</h5>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : null}
          {step == 2 ? (
            <div className="chart-box">
              <UserTable data={data}></UserTable>
            </div>
          ) : null}
        </>
      ) : null}

      <Modal
        title="确认结束学员答题吗？"
        open={visible}
        confirmLoading={confirmLoading}
        okText="确认"
        onOk={handleOk}
        cancelText="取消"
        onCancel={handleCancel}
      >
        {data && data.question_title
          ? '题目名称：' + data.question_title
          : '题目名称：-'}
      </Modal>
    </div>
  );
}
