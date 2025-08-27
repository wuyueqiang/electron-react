import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Card, Button, message, Divider, Tag } from 'antd';
import './LiveRoomPage.scss';
import { 
  selectRoomConfig,
  selectLiveStatus,
  selectDeviceStatus,
  selectVisibilityStatus,
  selectRouteParams
} from '../reducers/index';
import { 
  setValue, 
  toggleCamera, 
  toggleMic, 
  setVisibility 
} from '../reducers/roomConfigSlice';



function LiveRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // 使用Redux选择器获取状态
  const roomConfig = useSelector(selectRoomConfig);
  const liveStatus = useSelector(selectLiveStatus);
  const deviceStatus = useSelector(selectDeviceStatus);
  const visibilityStatus = useSelector(selectVisibilityStatus);
  const routeParams = useSelector(selectRouteParams);
  
  // 初始化房间信息
  useEffect(() => {
    if (roomId) {
      dispatch(setValue({ 
        key: 'roomInfo', 
        value: { 
          room_id: roomId,
          title: `房间 ${roomId}`,
          display_type: 0 // 横屏
        } 
      }));
      message.success(`进入房间: ${roomId}`);
    }
  }, [roomId, dispatch]);
  
  // 处理设备控制
  const handleToggleCamera = () => {
    dispatch(toggleCamera(!deviceStatus.isOpenCamera));
  };
  
  const handleToggleMic = () => {
    dispatch(toggleMic(!deviceStatus.isOpenMic));
  };
  
  const handleTogglePanel = (type: string) => {
    const currentVisibility = visibilityStatus[`${type}Visibility` as keyof typeof visibilityStatus];
    dispatch(setVisibility({ type, visible: !currentVisibility }));
  };
  
  const handleStartLive = () => {
    dispatch(setValue({ key: 'isStart', value: true }));
    message.success('开始直播');
  };
  
  const handleStopLive = () => {
    dispatch(setValue({ key: 'isStart', value: false }));
    message.success('停止直播');
  };

  return (
    <div className="live-room-page" style={{ padding: '20px' }}>
      <Card title={`直播间 - ${roomId}`} style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '15px' }}>
          <h3>房间信息</h3>
          <p><strong>房间ID:</strong> {roomId}</p>
          <p><strong>直播状态:</strong> 
            <Tag color={liveStatus.isStart ? 'green' : 'red'}>
              {liveStatus.isStart ? '直播中' : '未开始'}
            </Tag>
          </p>
          <p><strong>直播阶段:</strong> {liveStatus.liveStage}</p>
        </div>
        
        <Divider orientation="left">设备控制</Divider>
        
        <div style={{ marginBottom: '15px' }}>
          <Button 
            type={deviceStatus.isOpenCamera ? 'primary' : 'default'}
            onClick={handleToggleCamera}
            style={{ marginRight: '10px' }}
          >
            {deviceStatus.isOpenCamera ? '关闭摄像头' : '开启摄像头'}
          </Button>
          
          <Button 
            type={deviceStatus.isOpenMic ? 'primary' : 'default'}
            onClick={handleToggleMic}
            style={{ marginRight: '10px' }}
          >
            {deviceStatus.isOpenMic ? '关闭麦克风' : '开启麦克风'}
          </Button>
        </div>
        
        <Divider orientation="left">面板控制</Divider>
        
        <div style={{ marginBottom: '15px' }}>
          <Button 
            onClick={() => handleTogglePanel('test')}
            style={{ marginRight: '10px' }}
          >
            {visibilityStatus.testVisibility ? '隐藏测试面板' : '显示测试面板'}
          </Button>
          
          <Button 
            onClick={() => handleTogglePanel('file')}
            style={{ marginRight: '10px' }}
          >
            {visibilityStatus.fileVisibility ? '隐藏文件面板' : '显示文件面板'}
          </Button>
          
          <Button 
            onClick={() => handleTogglePanel('screen')}
            style={{ marginRight: '10px' }}
          >
            {visibilityStatus.screenVisibility ? '隐藏屏幕面板' : '显示屏幕面板'}
          </Button>
        </div>
        
        <Divider orientation="left">直播控制</Divider>
        
        <div style={{ marginBottom: '15px' }}>
          <Button 
            type="primary"
            onClick={handleStartLive}
            disabled={liveStatus.isStart}
            style={{ marginRight: '10px' }}
          >
            开始直播
          </Button>
          
          <Button 
            danger
            onClick={handleStopLive}
            disabled={!liveStatus.isStart}
            style={{ marginRight: '10px' }}
          >
            停止直播
          </Button>
          
          <Button onClick={() => navigate('/live-list', {
            replace: true,
          })}>
            返回列表
          </Button>
        </div>
      </Card>
      
      <Card title="Redux状态监控">
        <div>
          <h4>房间配置状态</h4>
          <pre style={{ fontSize: '12px', background: '#f5f5f5', padding: '10px', maxHeight: '200px', overflow: 'auto' }}>
            {JSON.stringify(roomConfig, null, 2)}
          </pre>
          
          <Divider />
          
          <h4>设备状态</h4>
          <pre style={{ fontSize: '12px', background: '#f5f5f5', padding: '10px', maxHeight: '150px', overflow: 'auto' }}>
            {JSON.stringify(deviceStatus, null, 2)}
          </pre>
          
          <Divider />
          
          <h4>可见性状态</h4>
          <pre style={{ fontSize: '12px', background: '#f5f5f5', padding: '10px', maxHeight: '150px', overflow: 'auto' }}>
            {JSON.stringify(visibilityStatus, null, 2)}
          </pre>
        </div>
      </Card>
    </div>
  );
}

export default LiveRoomPage;
