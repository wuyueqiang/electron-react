import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, Button, Divider, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { push, replace, goBack, goForward } from 'redux-first-history';
import { 
  selectRouteInfo,
  selectCurrentPath,
  selectQueryParams,
  selectRouteParams
} from '../../reducers/index';

// 路由测试组件
const RouterTest: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // 使用选择器获取路由状态
  const routeInfo = useSelector(selectRouteInfo);
  const currentPath = useSelector(selectCurrentPath);
  const queryParams = useSelector(selectQueryParams);
  const routeParams = useSelector(selectRouteParams);
  
  // 使用 Redux 进行导航
  const handleReduxNavigate = (path: string) => {
    dispatch(push(path));
    message.success(`Redux导航到: ${path}`);
  };
  
  // 使用 Redux 替换当前路由
  const handleReduxReplace = (path: string) => {
    dispatch(replace(path));
    message.success(`Redux替换路由为: ${path}`);
  };
  
  // 使用 React Router 进行导航
  const handleReactRouterNavigate = (path: string) => {
    navigate(path);
    message.success(`React Router导航到: ${path}`);
  };
  
  // 测试路由参数
  const handleNavigateToRoom = () => {
    const roomId = Math.floor(Math.random() * 1000) + 1;
    const path = `/live-room/${roomId}`;
    dispatch(push(path));
    message.success(`导航到房间: ${roomId}`);
  };
  
  // 浏览器历史操作
  const handleGoBack = () => {
    dispatch(goBack());
    message.success('后退');
  };
  
  const handleGoForward = () => {
    dispatch(goForward());
    message.success('前进');
  };
  
  return (
    <div style={{ padding: '20px' }}>
      <Card title="路由集成测试" style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h3>当前路由状态</h3>
          <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '4px' }}>
            <p><strong>当前路径:</strong> {currentPath}</p>
            <p><strong>查询参数:</strong> {JSON.stringify(queryParams || {})}</p>
            <p><strong>路由参数:</strong> {JSON.stringify(routeParams || {})}</p>
          </div>
        </div>
        
        <Divider orientation="left">Redux 路由操作</Divider>
        
        <div style={{ marginBottom: '15px' }}>
          <h4>基础导航</h4>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <Button onClick={() => handleReduxNavigate('/login')}>登录页</Button>
            <Button onClick={() => handleReduxNavigate('/live-list')}>直播列表</Button>
            <Button onClick={() => handleReduxNavigate('/redux-test')}>Redux测试</Button>
            <Button onClick={() => handleReduxNavigate('/live-room/123')}>房间123</Button>
          </div>
          
          <h4>替换路由</h4>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <Button onClick={() => handleReduxReplace('/login')}>替换为登录页</Button>
            <Button onClick={() => handleReduxReplace('/live-list')}>替换为直播列表</Button>
          </div>
          
          <h4>历史操作</h4>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <Button onClick={handleGoBack}>后退</Button>
            <Button onClick={handleGoForward}>前进</Button>
          </div>
        </div>
        
        <Divider orientation="left">React Router 导航</Divider>
        
        <div style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <Button onClick={() => handleReactRouterNavigate('/login')}>React Router - 登录页</Button>
            <Button onClick={() => handleReactRouterNavigate('/live-list')}>React Router - 直播列表</Button>
            <Button onClick={handleNavigateToRoom}>随机房间</Button>
          </div>
        </div>
      </Card>
      
      <Card title="路由状态监控">
        <div>
          <h4>实时路由变化</h4>
          <p>当前路径: <code>{currentPath}</code></p>
          <p>查询参数: <code>{JSON.stringify(queryParams || {})}</code></p>
          <p>路由参数: <code>{JSON.stringify(routeParams || {})}</code></p>
          
          <Divider />
          
          <h4>完整路由状态</h4>
          <pre style={{ fontSize: '12px', background: '#f5f5f5', padding: '10px', maxHeight: '300px', overflow: 'auto' }}>
            {JSON.stringify(routeInfo, null, 2)}
          </pre>
        </div>
      </Card>
    </div>
  );
};

export default RouterTest;
