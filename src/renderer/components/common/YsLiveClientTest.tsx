import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, Button, Input, message, Alert, Divider } from 'antd';
import { initYsLiveClient } from '../../reducers/ysLiveClientSlice';
import { 
  startLiveAction,
  setLog,
  setOperateLog,
  updateMixLiveAction,
  startBoardPushAction,
  setDeviceThunk,
  toggleCamera,
  toggleMic,
  toggleScreenShare
} from '../../reducers/roomConfigThunks';
import { 
  selectRoomConfig, 
  selectIsOpenCamera, 
  selectIsOpenMic,
  selectLiveStatus,
  selectDeviceStatus
} from '../../reducers/index';

// 测试组件，用于测试异步操作
const YsLiveClientTest: React.FC = () => {
  const dispatch = useDispatch();
  
  // 使用选择器获取状态
  const ysLiveClient = useSelector((state: any) => state.ysLiveClient);
  const roomConfig = useSelector(selectRoomConfig);
  const isOpenCamera = useSelector(selectIsOpenCamera);
  const isOpenMic = useSelector(selectIsOpenMic);
  const liveStatus = useSelector(selectLiveStatus);
  const deviceStatus = useSelector(selectDeviceStatus);
  
  // 用于输入的状态
  const [clientValue, setClientValue] = useState('');
  
  // 加载状态
  const [loadingStates, setLoadingStates] = useState<{[key: string]: boolean}>({});
  const [testResults, setTestResults] = useState<{[key: string]: any}>({});
  
  // 设置加载状态
  const setLoading = (action: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [action]: loading }));
  };
  
  // 设置测试结果
  const setResult = (action: string, result: any) => {
    setTestResults(prev => ({ ...prev, [action]: result }));
  };
  
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
    } catch (error: any) {
      message.error(`初始化失败: ${error?.message || '未知错误'}`);
    }
  };
  
  // 测试重置Client
  const handleResetClient = () => {
    dispatch(initYsLiveClient(null));
    message.success('已重置 YsLiveClient');
  };
  
  // 测试开始直播
  const handleStartLive = async () => {
    setLoading('startLive', true);
    try {
      const result = await dispatch(startLiveAction(false) as any).unwrap();
      setResult('startLive', result);
      message.success('开始直播成功');
    } catch (error: any) {
      setResult('startLive', { error: error?.message || '未知错误' });
      message.error(`开始直播失败: ${error?.message || '未知错误'}`);
    } finally {
      setLoading('startLive', false);
    }
  };
  
  // 测试设置日志
  const handleSetLog = async () => {
    setLoading('setLog', true);
    try {
      const result = await dispatch(setLog({ 
        action: 'anchorOpenCamera',
        logParams: { isOpen: true }
      }) as any).unwrap();
      setResult('setLog', result);
      message.success('设置日志成功');
    } catch (error: any) {
      setResult('setLog', { error: error.message });
      message.error(`设置日志失败: ${error.message}`);
    } finally {
      setLoading('setLog', false);
    }
  };
  
  // 测试摄像头控制
  const handleToggleCamera = async () => {
    setLoading('toggleCamera', true);
    try {
      await dispatch(toggleCamera(!isOpenCamera) as any).unwrap();
      message.success(`摄像头${!isOpenCamera ? '开启' : '关闭'}成功`);
    } catch (error: any) {
      message.error(`摄像头控制失败: ${error.message}`);
    } finally {
      setLoading('toggleCamera', false);
    }
  };
  
  // 测试麦克风控制
  const handleToggleMic = async () => {
    setLoading('toggleMic', true);
    try {
      await dispatch(toggleMic(!isOpenMic) as any).unwrap();
      message.success(`麦克风${!isOpenMic ? '开启' : '关闭'}成功`);
    } catch (error: any) {
      message.error(`麦克风控制失败: ${error.message}`);
    } finally {
      setLoading('toggleMic', false);
    }
  };
  
  return (
    <div style={{ padding: '20px' }}>
      <Card title="异步操作测试" style={{ marginBottom: '20px' }}>
        <Alert
          message="异步操作测试说明"
          description="这些测试会调用实际的API接口。请确保网络连接正常，并且相关的API服务可用。"
          type="info"
          showIcon
          style={{ marginBottom: '20px' }}
        />
        
        <Divider orientation="left">YsLiveClient 操作</Divider>
        
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
        
        <Divider orientation="left">直播相关操作</Divider>
        
        <div style={{ marginBottom: '15px' }}>
          <Button 
            type="primary"
            loading={loadingStates.startLive}
            onClick={handleStartLive}
            style={{ marginRight: '10px' }}
          >
            开始直播
          </Button>
          
          <Button 
            type="default"
            loading={loadingStates.setLog}
            onClick={handleSetLog}
            style={{ marginRight: '10px' }}
          >
            设置日志
          </Button>
        </div>
        
        <Divider orientation="left">设备控制操作</Divider>
        
        <div style={{ marginBottom: '15px' }}>
          <Button 
            type="default"
            loading={loadingStates.toggleCamera}
            onClick={handleToggleCamera}
            style={{ marginRight: '10px' }}
          >
            {isOpenCamera ? '关闭摄像头' : '开启摄像头'}
          </Button>
          
          <Button 
            type="default"
            loading={loadingStates.toggleMic}
            onClick={handleToggleMic}
            style={{ marginRight: '10px' }}
          >
            {isOpenMic ? '关闭麦克风' : '开启麦克风'}
          </Button>
        </div>
      </Card>
      
      <Card title="测试结果" style={{ marginBottom: '20px' }}>
        <div>
          <h4>当前状态:</h4>
          <pre style={{ fontSize: '12px', background: '#f5f5f5', padding: '10px', maxHeight: '200px', overflow: 'auto' }}>
            {JSON.stringify({
              deviceStatus,
              liveStatus,
              isOpenCamera,
              isOpenMic,
              ysLiveClient
            }, null, 2)}
          </pre>
        </div>
        
        <Divider />
        
        <div>
          <h4>异步操作结果:</h4>
          {Object.keys(testResults).length === 0 ? (
            <p style={{ color: '#999' }}>暂无测试结果</p>
          ) : (
            Object.entries(testResults).map(([key, result]) => (
              <div key={key} style={{ marginBottom: '10px' }}>
                <h5>{key}:</h5>
                <pre style={{ fontSize: '12px', background: '#f5f5f5', padding: '10px', maxHeight: '150px', overflow: 'auto' }}>
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default YsLiveClientTest;
