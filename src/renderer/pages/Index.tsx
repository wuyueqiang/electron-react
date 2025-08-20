import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Index.css';
import { getUserToken } from '../api';

function Index() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    roomName: 'test1',
    identity: 'nick1'
  });
  
  const [errors, setErrors] = useState({
    roomName: '',
    identity: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 清除对应字段的错误信息
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {
      roomName: '',
      identity: ''
    };
    let isValid = true;

    if (!formData.roomName.trim()) {
      newErrors.roomName = '请输入房间名';
      isValid = false;
    }

    if (!formData.identity.trim()) {
      newErrors.identity = '请输入用户昵称';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    let token = window.localStorage.getItem('token');
    let wsUrl = window.localStorage.getItem('wsUrl');
    if (token && wsUrl) {
      navigate('/room', {
        state: {
          token,
          wsUrl,
        },
      });
      return;
    }

    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const res = await getUserToken({
        roomName: formData.roomName.trim(),
        identity: formData.identity.trim()
      });

      window.localStorage.setItem('token', res.token);
      window.localStorage.setItem('wsUrl', res.wsUrl);

      // 导航到房间页面
      navigate('/room', {
        state: {
          token: res.token,
          wsUrl: res.wsUrl
        },
        replace: true
      });
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        roomName: error instanceof Error ? error.message : '获取 token 失败'
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = () => {
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('wsUrl');
  };

  return (
    <div className="index-container">
      <h1>MossVox屏幕分享</h1>
      <div className="form-group">
        <label htmlFor="roomName">房间名</label>
        <input
          type="text"
          id="roomName"
          name="roomName"
          value={formData.roomName}
          onChange={handleInputChange}
          placeholder="请输入房间名"
        />
        {errors.roomName && <div className="error-message">{errors.roomName}</div>}
      </div>
      <div className="form-group">
        <label htmlFor="identity">用户昵称</label>
        <input
          type="text"
          id="identity"
          name="identity"
          value={formData.identity}
          onChange={handleInputChange}
          placeholder="请输入用户昵称"
        />
        {errors.identity && <div className="error-message">{errors.identity}</div>}
      </div>
      <div className="form-group">
        <button
          className="join-button"
          onClick={handleSubmit}
          disabled={!formData.roomName || !formData.identity || loading}
        >
          加入房间
        </button>
      </div>
      <div className="form-group">
        <button
          className="join-button"
          onClick={handleClearCache}
        >
          清除缓存
        </button>
      </div>
    </div>
  );
}

export default Index;