import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, Button, Input, Select, Switch, Divider, message } from 'antd';
import { 
  setValue, 
  setList, 
  setDevice, 
  toggleCamera, 
  toggleMic, 
  setVisibility 
} from '../../reducers/roomConfigSlice';
import { 
  selectRoomConfig, 
  selectIsOpenCamera, 
  selectIsOpenMic,
  selectDeviceStatus,
  selectLiveStatus,
  selectVisibilityStatus
} from '../../reducers/index';

const { Option } = Select;

// 测试组件，用于测试roomConfig状态更新
const RoomConfigTest: React.FC = () => {
  const dispatch = useDispatch();
  
  // 使用选择器获取状态
  const roomConfig = useSelector(selectRoomConfig);
  const isOpenCamera = useSelector(selectIsOpenCamera);
  const isOpenMic = useSelector(selectIsOpenMic);
  const deviceStatus = useSelector(selectDeviceStatus);
  const liveStatus = useSelector(selectLiveStatus);
  const visibilityStatus = useSelector(selectVisibilityStatus);
  
  // 用于输入的状态
  const [key, setKey] = useState('debug');
  const [value, setValue_] = useState('');
  const [listName, setListName] = useState('camera');
  const [deviceName, setDeviceName] = useState('camera');
  
  // 测试setValue
  const handleSetValue = () => {
    try {
      let parsedValue = value;
      // 尝试解析JSON
      try {
        parsedValue = JSON.parse(value);
      } catch (e) {
        // 如果不是JSON，则根据类型转换
        if (value === 'true') parsedValue = true;
        else if (value === 'false') parsedValue = false;
        else if (!isNaN(Number(value))) parsedValue = Number(value);
      }
      
      dispatch(setValue({ key, value: parsedValue }));
      message.success(`成功设置 ${key} = ${value}`);
    } catch (error) {
      message.error(`设置失败: ${error.message}`);
    }
  };
  
  // 测试setList
  const handleSetList = () => {
    try {
      let list = [];
      try {
        list = JSON.parse(value);
        if (!Array.isArray(list)) {
          list = [list];
        }
      } catch (e) {
        list = [{ id: 'test-item', name: value || '测试项' }];
      }
      
      dispatch(setList({ name: listName, list }));
      message.success(`成功设置 ${listName}List`);
    } catch (error) {
      message.error(`设置失败: ${error.message}`);
    }
  };
  
  // 测试setDevice
  const handleSetDevice = () => {
    try {
      let device = {};
      try {
        device = JSON.parse(value);
      } catch (e) {
        device = { 
          deviceId: `test-${deviceName}`, 
          deviceName: `测试${deviceName}`,
          isOpen: true 
        };
      }
      
      dispatch(setDevice({ name: deviceName, device }));
      message.success(`成功设置 ${deviceName} 设备`);
    } catch (error) {
      message.error(`设置失败: ${error.message}`);
    }
  };
  
  // 测试toggleCamera - 使用新的action
  const handleToggleCamera = () => {
    dispatch(toggleCamera(!isOpenCamera));
    message.success(`摄像头状态: ${!isOpenCamera ? '开启' : '关闭'}`);
  };
  
  // 测试toggleMic - 使用新的action
  const handleToggleMic = () => {
    dispatch(toggleMic(!isOpenMic));
    message.success(`麦克风状态: ${!isOpenMic ? '开启' : '关闭'}`);
  };
  
  // 测试可见性切换
  const handleToggleVisibility = (type: string, visible: boolean) => {
    dispatch(setVisibility({ type, visible }));
    message.success(`${type}可见性: ${visible ? '显示' : '隐藏'}`);
  };
  
  return (
    <div style={{ padding: '20px' }}>
      <Card title="RoomConfig 测试" style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h3>设置状态值 (setValue)</h3>
          <div style={{ display: 'flex', marginBottom: '10px' }}>
            <Input 
              placeholder="键名" 
              value={key} 
              onChange={(e) => setKey(e.target.value)}
              style={{ marginRight: '10px', width: '150px' }}
            />
            <Input 
              placeholder="值" 
              value={value} 
              onChange={(e) => setValue_(e.target.value)}
              style={{ marginRight: '10px', flex: 1 }}
            />
            <Button type="primary" onClick={handleSetValue}>设置</Button>
          </div>
          
          <h3>设置列表 (setList)</h3>
          <div style={{ display: 'flex', marginBottom: '10px' }}>
            <Select 
              value={listName} 
              onChange={setListName}
              style={{ marginRight: '10px', width: '150px' }}
            >
              <Option value="camera">camera</Option>
              <Option value="mic">mic</Option>
              <Option value="speaker">speaker</Option>
              <Option value="screen">screen</Option>
              <Option value="boardFile">boardFile</Option>
              <Option value="videoCallUser">videoCallUser</Option>
            </Select>
            <Input 
              placeholder="列表值 (JSON 或字符串)" 
              value={value} 
              onChange={(e) => setValue_(e.target.value)}
              style={{ marginRight: '10px', flex: 1 }}
            />
            <Button type="primary" onClick={handleSetList}>设置列表</Button>
          </div>
          
          <h3>设置设备 (setDevice)</h3>
          <div style={{ display: 'flex', marginBottom: '10px' }}>
            <Select 
              value={deviceName} 
              onChange={setDeviceName}
              style={{ marginRight: '10px', width: '150px' }}
            >
              <Option value="camera">camera</Option>
              <Option value="mic">mic</Option>
              <Option value="speaker">speaker</Option>
            </Select>
            <Input 
              placeholder="设备值 (JSON 或留空使用默认值)" 
              value={value} 
              onChange={(e) => setValue_(e.target.value)}
              style={{ marginRight: '10px', flex: 1 }}
            />
            <Button type="primary" onClick={handleSetDevice}>设置设备</Button>
          </div>
        </div>
        
        <Divider />
        
        <div>
          <h3>快捷操作</h3>
          <div style={{ marginBottom: '10px' }}>
            <Button 
              type={isOpenCamera ? 'primary' : 'default'} 
              onClick={handleToggleCamera}
              style={{ marginRight: '10px' }}
            >
              {isOpenCamera ? '关闭摄像头' : '开启摄像头'}
            </Button>
            
            <Button 
              type={isOpenMic ? 'primary' : 'default'} 
              onClick={handleToggleMic}
              style={{ marginRight: '10px' }}
            >
              {isOpenMic ? '关闭麦克风' : '开启麦克风'}
            </Button>
            
            <Button 
              type={visibilityStatus.testVisibility ? 'primary' : 'default'} 
              onClick={() => handleToggleVisibility('test', !visibilityStatus.testVisibility)}
              style={{ marginRight: '10px' }}
            >
              测试面板: {visibilityStatus.testVisibility ? '显示' : '隐藏'}
            </Button>
            
            <Button 
              type={visibilityStatus.fileVisibility ? 'primary' : 'default'} 
              onClick={() => handleToggleVisibility('file', !visibilityStatus.fileVisibility)}
              style={{ marginRight: '10px' }}
            >
              文件面板: {visibilityStatus.fileVisibility ? '显示' : '隐藏'}
            </Button>
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <h4>设备状态概览（使用复合选择器）:</h4>
            <pre style={{ fontSize: '12px', background: '#f5f5f5', padding: '10px' }}>
              {JSON.stringify(deviceStatus, null, 2)}
            </pre>
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <h4>直播状态概览（使用复合选择器）:</h4>
            <pre style={{ fontSize: '12px', background: '#f5f5f5', padding: '10px' }}>
              {JSON.stringify(liveStatus, null, 2)}
            </pre>
          </div>
        </div>
      </Card>
      
      <Card title="当前 RoomConfig 状态">
        <pre style={{ maxHeight: '400px', overflow: 'auto' }}>
          {JSON.stringify(roomConfig, null, 2)}
        </pre>
      </Card>
    </div>
  );
};

export default RoomConfigTest;
