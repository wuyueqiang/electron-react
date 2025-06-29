import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // 这里可以添加实际的登录逻辑
    // eslint-disable-next-line no-console
    console.log('登录信息:', { username, password });
    // 登录成功后跳转到直播列表页面
    navigate('/live-list');
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>欢迎登录</h1>
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="username">
              用户名
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                required
              />
            </label>
          </div>
          <div className="form-group">
            <label htmlFor="password">
              密码
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                required
              />
            </label>
          </div>
          <button type="submit" className="login-button">
            登录
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
