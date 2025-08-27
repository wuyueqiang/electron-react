import React, { useEffect, useState } from 'react';
import './exam.scss';
import { message as Message, Table, Button, Modal, Popover } from 'antd';
const { Column } = Table;
import { setValue } from '../../reducers/roomConfigSlice';
import { startLiveExamQuestion, endLiveExamQuestion } from '../../api';
import Preview from './Preview';
import { useSelector, useDispatch } from 'react-redux';
import { selectRoomConfig } from '../../reducers/index';

// import Store from 'electron-store';
// const store: any = new Store();
import { LStorage } from '../../utils/tools';

interface ExamPropsParam {
  examInfo: any;
  updateQuestion: any;
  getStatistics: any;
  getExamList: any;
}

export default function Exam(props: ExamPropsParam) {
  const roomConfig = useSelector(selectRoomConfig);
  const dispatch = useDispatch();
  const {
    examInfo,
    updateQuestion,
    getStatistics,
    getExamList,
  } = props;
  const { answerVisibility, isAnswering, isStart } = roomConfig;
  const [show, setShow] = useState(true);
  const userInfo = LStorage.getItem('USER_INFO');
  // 结束/发起答题 弹窗数据
  const [qustionModal, setQustionModal] = useState({
    live_question_status: 0,
  });
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState('');
  const [visible, setVisible] = useState(false);
  const [okText, setOkText] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    // console.log('examInfo', examInfo)
  }, [examInfo]);

  // 点击发起/结束答题
  function handleQuestion(item: any) {
    if (!isStart) {
      Message.warning(`请先上课`);
      return;
    }
    setQustionModal(item);
    if (item.live_question_status == 1 || item.live_question_status == 3) {
      // 点击发起此题目
      setModalTitle(
        isAnswering ? '当前有答题中的题目，是否确认替换？' : '确认发起答题？',
      );
      setModalContent('题目名称：' + item.question_title);
      setOkText(isAnswering ? '确认替换' : '发起');
      setVisible(true);
    } else if (item.live_question_status == 2) {
      // 点击结束此题目
      setModalTitle('确认结束学员答题吗？');
      setModalContent('题目名称：' + item.question_title);
      setOkText('确认');
      setVisible(true);
    }
  }

  // 获取预览dom
  function getPreview(data: any) {
    return <>{data ? <Preview data={data}></Preview> : null}</>;
  }

  // 取消弹窗
  function handleCancel() {
    setVisible(false);
    setQustionModal({
      live_question_status: 0,
    });
    setModalTitle('');
    setModalContent('');
    setConfirmLoading(false);
    setOkText('');
  }

  // 弹窗点击ok
  function handleOk() {
    if (
      qustionModal.live_question_status == 1 ||
      qustionModal.live_question_status == 3
    ) {
      setConfirmLoading(true);
      startLiveExamQuestion(
        qustionModal.live_exam_question_id,
        isAnswering,
        userInfo.userId,
        userInfo.role,
      )
        .then((res) => {
          handleCancel();
          if (res.status.code == 200) {
            // 替换直接更新列表
            if (isAnswering) {
              Message.success('替换成功');
              getExamList();
            } else {
              Message.success('发起成功');
              dispatch(setValue({ key: 'isAnswering', value: true }));
              updateQuestion(qustionModal, {
                live_question_status: 2,
                live_exam_task_answer_id: res.live_exam_task_answer_id,
              });
            }
            // 获取正在答题的结果数据
            getStatistics({
              live_exam_task_answer_id: res.live_exam_task_answer_id,
              live_question_status: 2,
            });
          } else {
            Message.error(`${res.status.code}-${res.status.msg}`);
            console.warn(res);
          }
        })
        .catch((err) => {
          handleCancel();
        });
    } else if (qustionModal.live_question_status == 2) {
      setConfirmLoading(true);
      endLiveExamQuestion(
        qustionModal.live_exam_task_answer_id,
        userInfo.userId,
        userInfo.role,
      )
        .then((res) => {
          handleCancel();
          if (res.status.code == 200) {
            Message.success('成功结束');
            dispatch(setValue({ key: 'isAnswering', value: false }));
            updateQuestion(qustionModal, {
              live_question_status: 3,
            });
          } else {
            Message.error(`${res.status.code}-${res.status.msg}`);
            console.warn(res);
          }
        })
        .catch((err) => {
          handleCancel();
        });
    }
  }

  return (
    <div className="exam-item">
      <p className="exam-title">
        {examInfo.live_bm_exam_id}-{examInfo.exam_title}
      </p>
      {show ? (
        <p
          className="exam-btn hide-btn"
          onClick={() => {
            setShow(false);
          }}
        >
          收起
        </p>
      ) : (
        <p
          className="exam-btn show-btn"
          onClick={() => {
            setShow(true);
          }}
        >
          展开
        </p>
      )}
      {show ? (
        <Table
          rowKey={(record) => record.live_exam_question_id}
          size="small"
          pagination={false}
          dataSource={examInfo.exam_question_list}
          locale={{ emptyText: '暂无数据' }}
        >
          <Column
            title="序号"
            dataIndex="index"
            key="index"
            render={(text: any, record: any, index: any) => (
              <span>{index + 1}</span>
            )}
          />
          <Column
            title="题型"
            dataIndex="question_type"
            key="question_type"
            render={(question_type: any) => (
              <span>{question_type == 1 ? '单选' : '多选'}</span>
            )}
          />
          <Column
            title="试题名称"
            dataIndex="question_title"
            key="question_title"
            width="250px"
            render={(question_title: any) => (
              <Popover content={question_title}>
                <p className="question-title">{question_title}</p>
              </Popover>
            )}
          />
          <Column
            title="判断对错"
            dataIndex="show_right_answer"
            key="show_right_answer"
            render={(show_right_answer: any) => (
              <span>{show_right_answer == 1 ? '判断' : '不判断'}</span>
            )}
          />
          <Column
            title="正确答案"
            dataIndex="right_answer_items"
            key="right_answer_items"
          />
          <Column
            title="状态"
            dataIndex="live_question_status"
            key="live_question_status"
            render={(live_question_status: any) => {
              let text: any = '',
                style: any = null;
              if (live_question_status == 1) {
                text = '未发起';
                style = {
                  color: '#545454',
                };
              } else if (live_question_status == 2) {
                text = '答题中';
                style = {
                  color: '#FF6F27',
                };
              } else if (live_question_status == 3) {
                text = '已结束';
                style = {
                  color: '#545454',
                };
              }
              return <span style={style}>{text}</span>;
            }}
          />
          <Column
            title="操作"
            align="center"
            dataIndex="action"
            key="action"
            render={(action: any, record: any) => {
              return (
                <>
                  <Popover placement="left" content={() => getPreview(record)}>
                    <Button size="small" type="link" className="btn">
                      预览
                    </Button>
                  </Popover>
                  <Button
                    size="small"
                    type="link"
                    className={
                      record.live_question_status == 2
                        ? 'btn btn-active'
                        : 'btn'
                    }
                    onClick={() => {
                      handleQuestion(record);
                    }}
                  >
                    {record.live_question_status == 2 ? '结束' : '发起'}
                  </Button>
                  <Button
                    className={
                      record.live_question_status == 1 ? 'disable btn' : 'btn'
                    }
                    size="small"
                    type="link"
                    onClick={() => {
                      if (record.live_question_status == 1) {
                        Message.error('暂未发起答题，无数据');
                      } else {
                        getStatistics({
                          live_exam_task_answer_id:
                            record.live_exam_task_answer_id,
                          live_question_status: record.live_question_status,
                        });
                      }
                    }}
                  >
                    数据
                  </Button>
                </>
              );
            }}
          />
        </Table>
      ) : null}

      <Modal
        title={modalTitle}
        open={visible}
        confirmLoading={confirmLoading}
        okText={okText}
        onOk={handleOk}
        cancelText="取消"
        onCancel={handleCancel}
      >
        {modalContent}
      </Modal>
    </div>
  );
}
