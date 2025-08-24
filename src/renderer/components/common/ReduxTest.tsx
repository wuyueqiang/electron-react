import React, { useState } from 'react';
import { Tabs, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import RoomConfigTest from './RoomConfigTest';
import YsLiveClientTest from './YsLiveClientTest';
import RouterTest from './RouterTest';

const { TabPane } = Tabs;

// Redux测试组件，集成多个测试模块
const ReduxTest: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1>Redux 状态管理测试</h1>
        <Button onClick={() => navigate('/login')}>返回登录页</Button>
      </div>
      
      <Tabs defaultActiveKey="roomConfig">
        <TabPane tab="RoomConfig 测试" key="roomConfig">
          <RoomConfigTest />
        </TabPane>
        <TabPane tab="异步操作测试" key="ysLiveClient">
          <YsLiveClientTest />
        </TabPane>
        <TabPane tab="路由集成测试" key="router">
          <RouterTest />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default ReduxTest;