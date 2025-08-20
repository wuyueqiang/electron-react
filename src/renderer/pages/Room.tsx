import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Room, Track, LocalVideoTrack } from 'livekit-client';
import './Room.css';

interface SourceItem {
  id: string;
  name: string;
  thumbnail: string;
  display_id?: string;
  appIcon?: string;
}

interface RoomProps {
  token: string;
  wsUrl: string;
}

function RoomPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [room] = useState(() => new Room({
    adaptiveStream: true,
    dynacast: true,
  }));
  const { token, wsUrl } = location.state as RoomProps;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('screen'); // 'screen' or 'window'
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string>();
  
  // 将sources分类
  const screenSources = sources.filter(s => s.id.startsWith('screen'));
  const windowSources = sources.filter(s => s.id.startsWith('window'));
  useEffect(() => {
    let mounted = true;
    
    const connect = async () => {
      if (mounted) {
        await room.connect(wsUrl, token);
      }
    };
    connect();

    return () => {
      mounted = false;
      room.disconnect();
    };
  }, [room]);

  useEffect(() => {
    const unsubscribe = window.electron.ipcRenderer.on('get-screen-sources-reply', (sourcesData) => {
      console.log('====sources', sourcesData);
      setSources(sourcesData as SourceItem[]);
      setIsModalOpen(true);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleShareScreen = () => {
    setIsModalOpen(true);
    window.electron.ipcRenderer.sendMessage('get-screen-sources');
  };

  const handleSelectSource = (sourceId: string) => {
    setSelectedSourceId(sourceId);
  };

  const handleConfirm = async () => {
    if (!selectedSourceId) return;
    
    try {
      // 获取屏幕媒体流
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: selectedSourceId,
            maxWidth: 1920,
            maxHeight: 1080,
            maxFrameRate: 30
          }
        } as any
      });
      
      // 创建本地视频轨道
      const videoTrack = new LocalVideoTrack(stream.getVideoTracks()[0]);
      await room.localParticipant.publishTrack(videoTrack, {
        source: Track.Source.ScreenShare,
        name: 'screen_share',
      });
      setIsModalOpen(false);
      setSelectedSourceId(undefined);
    } catch (error) {
      console.error('Failed to share screen:', error);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setSelectedSourceId(undefined);
  };

  return (
    <div className="room-container">
      <button onClick={handleShareScreen} className="share-screen-btn">分享屏幕</button>

      {isModalOpen && (
        <div className="screen-modal-overlay">
          <div className="screen-modal">
            <div className="modal-header">
              <div className="tabs">
                <button 
                  className={`tab ${activeTab === 'screen' ? 'active' : ''}`}
                  onClick={() => setActiveTab('screen')}
                >
                  屏幕
                </button>
                <button 
                  className={`tab ${activeTab === 'window' ? 'active' : ''}`}
                  onClick={() => setActiveTab('window')}
                >
                  窗口
                </button>
              </div>
            </div>
            
            <div className="modal-content">
              <div className="sources-grid">
                {(activeTab === 'screen' ? screenSources : windowSources).map((source) => (
                  <div
                    key={source.id}
                    className={`source-item ${selectedSourceId === source.id ? 'selected' : ''}`}
                    onClick={() => handleSelectSource(source.id)}
                  >
                    <img src={source.thumbnail.startsWith('data:image/') ? source.thumbnail : `data:image/png;base64,${source.thumbnail}`} alt={source.name} />
                    <div className="source-name">{source.name}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={handleCancel} className="cancel-btn">取消</button>
              <button 
                onClick={handleConfirm} 
                className="confirm-btn"
                disabled={!selectedSourceId}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RoomPage;
