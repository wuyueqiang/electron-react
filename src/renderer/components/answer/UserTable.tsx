import React, { useEffect, useState } from 'react';
import './userTable.scss';
import { Table, Button } from 'antd';
const { Column } = Table;

interface UserTablePropsParam {
  data: any;
}

export default function Exam(props: UserTablePropsParam) {
  const { data } = props;
  const [step, setStep] = useState(1); // 选项

  useEffect(() => {}, [data]);

  return (
    <div className="user-table-box">
      <div className="box-top">
        <p className="tips">按提交时间展示前20位用户</p>
        <div className="user-tab-box">
          <p
            className={step == 1 ? 'active' : ''}
            onClick={() => {
              setStep(1);
            }}
          >
            全部
          </p>
          <p
            className={step == 2 ? 'active' : ''}
            onClick={() => {
              setStep(2);
            }}
          >
            答对用户
          </p>
        </div>
      </div>
      {step == 1 ? (
        <div className="user-table">
          <Table
            locale={{ emptyText: '暂无数据' }}
            scroll={{ y: 264 }}
            size="small"
            pagination={false}
            dataSource={data.answer_user_top.answer_user_list}
          >
            <Column
              title="序号"
              dataIndex="index"
              key="index"
              render={(text: any, record: any, index: any) => (
                <span>{index + 1}</span>
              )}
            />
            <Column title="用户ID" dataIndex="user_id" key="user_id" />
            <Column title="用户昵称" dataIndex="nickname" key="nickname" />
            <Column
              title="提交答案"
              dataIndex="answer_content"
              key="answer_content"
              render={(answer_content: any) => {
                return <span>{answer_content || '-'}</span>;
              }}
            />
            <Column
              title="是否答对"
              dataIndex="is_right"
              key="is_right"
              render={(is_right: boolean) => {
                let text: any = '',
                  style: any = null;
                if (is_right == true) {
                  text = '正确';
                  style = {
                    color: '#545454',
                  };
                } else {
                  text = '错误';
                  style = {
                    color: '#FF6F27',
                  };
                }
                return <span style={style}>{text}</span>;
              }}
            />
            <Column
              title="使用时长"
              dataIndex="answer_duration"
              key="answer_duration"
            />
            <Column
              title="提交时间"
              dataIndex="answer_time"
              key="answer_time"
            />
          </Table>
        </div>
      ) : null}
      {step == 2 ? (
        <div className="user-table">
          <Table
            locale={{ emptyText: '暂无数据' }}
            scroll={{ y: 264 }}
            size="small"
            pagination={false}
            dataSource={data.answer_user_top.answer_right_list}
          >
            <Column
              title="序号"
              dataIndex="index"
              key="index"
              render={(text: any, record: any, index: any) => (
                <span>{index + 1}</span>
              )}
            />
            <Column title="用户ID" dataIndex="user_id" key="user_id" />
            <Column title="用户昵称" dataIndex="nickname" key="nickname" />
            <Column
              title="提交答案"
              dataIndex="answer_content"
              key="answer_content"
              render={(answer_content: any) => {
                return <span>{answer_content || '-'}</span>;
              }}
            />
            <Column
              title="是否答对"
              dataIndex="is_right"
              key="is_right"
              render={(is_right: boolean) => {
                let text: any = '',
                  style: any = null;
                if (is_right == true) {
                  text = '正确';
                  style = {
                    color: '#545454',
                  };
                } else {
                  text = '错误';
                  style = {
                    color: '#FF6F27',
                  };
                }
                return <span style={style}>{text}</span>;
              }}
            />
            <Column
              title="使用时长"
              dataIndex="answer_duration"
              key="answer_duration"
            />
            <Column
              title="提交时间"
              dataIndex="answer_time"
              key="answer_time"
            />
          </Table>
        </div>
      ) : null}
    </div>
  );
}
