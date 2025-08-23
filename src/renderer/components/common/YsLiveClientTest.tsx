import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, Button, Input, message } from 'antd';
import { initYsLiveClient } from '../../reducers/ysLiveClientSlice';

// 测试组件，用于测试ysLiveClient状态更新
const YsLiveClientTest: React.FC = () => {
  const dispatch = useDispatch();
  
  // 获取ysLiveClient状态
  const ysLiveClient = useSelector((state: any) => state.ysLiveClient);
  
  // 用于输入的状态
  const [clientValue, setClientValue] = useState('');
  
  // 测试initYsLiveClient
  const handleInitClient = () => {
    try {
      let client = {};
      try {
        client = JSON.parse(clientValue);
      } catch (e) {
        client = { 
          id: 'test-client', 
          status: 'initialized',
          timestamp: new Date().toISOString()
        };
      }
      
      dispatch(initYsLiveClient(client));
      message.success('成功初始化 YsLiveClient');
    } catch (error) {
      message.error(`初始化失败: ${error.message}`);
    }
  };
  
  // 测试重置Client
  const handleResetClient = () => {
    dispatch(initYsLiveClient(null));
    message.success('已重置 YsLiveClient');
  };
  
  return (
    <div style={{ padding: '20px' }}>
      <Card title="YsLiveClient 测试" style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h3>初始化 YsLiveClient</h3>
          <div style={{ display: 'flex', marginBottom: '10px' }}>
            <Input 
              placeholder="客户端配置 (JSON 或留空使用默认值)" 
              value={clientValue} 
              onChange={(e) => setClientValue(e.target.value)}
              style={{ marginRight: '10px', flex: 1 }}
            />
            <Button type="primary" onClick={handleInitClient} style={{ marginRight: '10px' }}>
              初始化客户端
            </Button>
            <Button danger onClick={handleResetClient}>
              重置客户端
            </Button>
          </div>
        </div>
      </Card>
      
      <Card title="当前 YsLiveClient 状态">
        <pre style={{ maxHeight: '400px', overflow: 'auto' }}>
          {JSON.stringify(ysLiveClient, null, 2)}
        </pre>
      </Card>
    </div>
  );
};

export default YsLiveClientTest;
