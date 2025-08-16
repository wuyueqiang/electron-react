import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './LiveRoomPage.scss';

interface Message {
  id: string;
  user: string;
  content: string;
  timestamp: Date;
}

function LiveRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [roomInfo] = useState({
    id: roomId,
    title: '音乐直播 - 经典老歌回顾',
    host: '音乐达人',
    viewers: 1234,
    isLive: true,
  });

  useEffect(() => {
    // 模拟接收消息
    const interval = setInterval(() => {
      const mockMessages = [
        '太棒了！',
        '主播唱得真好听',
        '666666',
        '支持主播',
        '这首歌太经典了',
      ];
      const randomMessage =
        mockMessages[Math.floor(Math.random() * mockMessages.length)];
      const randomUsers = ['用户A', '用户B', '用户C', '用户D', '用户E'];
      const randomUser =
        randomUsers[Math.floor(Math.random() * randomUsers.length)];

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          user: randomUser,
          content: randomMessage,
          timestamp: new Date(),
        },
      ]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          user: '我',
          content: newMessage,
          timestamp: new Date(),
        },
      ]);
      setNewMessage('');
    }
  };

  const handleBackToList = () => {
    navigate('/live-list');
  };

  return (
    <div className="live-room-page">
      <header className="live-room-header">
        <button
          type="button"
          onClick={handleBackToList}
          className="back-button"
        >
          ← 返回列表
        </button>
        <div className="room-info">
          <h1>{roomInfo.title}</h1>
          <p>
            主播: {roomInfo.host} | 观看人数: {roomInfo.viewers}
          </p>
        </div>
        {roomInfo.isLive && <span className="live-indicator">直播中</span>}
      </header>

      <div className="live-room-content">
        <div className="video-container">
          <div className="video-placeholder">
            <div className="video-overlay">
              <div className="play-button">▶</div>
              <p>直播画面</p>
            </div>
          </div>
        </div>

        <div className="chat-container">
          <div className="chat-header">
            <h3>聊天室</h3>
            <span className="online-count">{messages.length} 条消息</span>
          </div>

          <div className="chat-messages">
            {messages.map((message) => (
              <div key={message.id} className="message">
                <span className="message-user">{message.user}:</span>
                <span className="message-content">{message.content}</span>
                <span className="message-time">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="chat-input-form">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="输入消息..."
              className="chat-input"
            />
            <button type="submit" className="send-button">
              发送
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LiveRoomPage;
