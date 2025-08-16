import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './LiveListPage.scss';

interface LiveRoom {
  id: string;
  title: string;
  host: string;
  viewers: number;
  thumbnail: string;
  isLive: boolean;
}

function LiveListPage() {
  const navigate = useNavigate();
  const [liveRooms] = useState<LiveRoom[]>([
    {
      id: '1',
      title: '音乐直播 - 经典老歌回顾',
      host: '音乐达人',
      viewers: 1234,
      thumbnail:
        'https://via.placeholder.com/300x200/667eea/ffffff?text=音乐直播',
      isLive: true,
    },
    {
      id: '2',
      title: '游戏直播 - 王者荣耀排位赛',
      host: '游戏主播小王',
      viewers: 5678,
      thumbnail:
        'https://via.placeholder.com/300x200/764ba2/ffffff?text=游戏直播',
      isLive: true,
    },
    {
      id: '3',
      title: '美食直播 - 家常菜制作',
      host: '美食小当家',
      viewers: 890,
      thumbnail:
        'https://via.placeholder.com/300x200/f093fb/ffffff?text=美食直播',
      isLive: true,
    },
    {
      id: '4',
      title: '教育直播 - 英语口语练习',
      host: '英语老师',
      viewers: 456,
      thumbnail:
        'https://via.placeholder.com/300x200/4facfe/ffffff?text=教育直播',
      isLive: false,
    },
  ]);

  const handleRoomClick = (roomId: string) => {
    navigate(`/live-room/${roomId}`);
  };

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="live-list-page">
      <header className="live-list-header">
        <h1>直播列表</h1>
        <button type="button" onClick={handleLogout} className="logout-button">
          退出登录
        </button>
      </header>

      <div className="live-list-container">
        <div className="live-grid">
          {liveRooms.map((room) => (
            <button
              key={room.id}
              type="button"
              className={`live-room-card ${!room.isLive ? 'offline' : ''}`}
              onClick={() => handleRoomClick(room.id)}
            >
              <div className="room-thumbnail">
                <img src={room.thumbnail} alt={room.title} />
                {room.isLive && <span className="live-badge">直播中</span>}
                {!room.isLive && <span className="offline-badge">未开播</span>}
              </div>
              <div className="room-info">
                <h3 className="room-title">{room.title}</h3>
                <p className="room-host">主播: {room.host}</p>
                <p className="room-viewers">
                  {room.isLive ? `${room.viewers} 人观看` : '未开播'}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LiveListPage;
