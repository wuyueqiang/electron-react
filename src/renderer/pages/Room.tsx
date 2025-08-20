import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Room, Track, LocalVideoTrack, RemoteParticipant, RemoteTrack, RemoteTrackPublication } from 'livekit-client';
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
  const [screenShareTrack, setScreenShareTrack] = useState<LocalVideoTrack>();
  const [shareAudio, setShareAudio] = useState(false);
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
  const [remoteScreenTracks, setRemoteScreenTracks] = useState<RemoteTrack[]>([]);
  
  // 将sources分类
  const screenSources = sources.filter(s => s.id.startsWith('screen'));
  const windowSources = sources.filter(s => s.id.startsWith('window'));
  // 处理参与者加入
  const handleParticipantConnected = useCallback((participant: RemoteParticipant) => {
    console.log('====handleParticipantConnected', participant);
    setParticipants(prev => [...prev, participant]);
    
    // 处理已有的屏幕共享轨道
    for (const [_, publication] of participant.trackPublications) {
      if (publication.source === Track.Source.ScreenShare) {
        const track = publication.track;
        if (track) {
          setRemoteScreenTracks(prev => [...prev, track]);
        }
      }
    }
  }, []);

  // 处理参与者离开
  const handleParticipantDisconnected = useCallback((participant: RemoteParticipant) => {
    console.log('====handleParticipantDisconnected', participant);
    setParticipants(prev => prev.filter(p => p.sid !== participant.sid));
    setRemoteScreenTracks(prev => prev.filter(track => track.sid !== participant.sid));
  }, []);

  // 处理新的轨道发布
  const handleTrackPublished = useCallback((publication: RemoteTrackPublication, participant: RemoteParticipant) => {
    console.log('====handleTrackPublished', publication, participant);
    if (publication.source === Track.Source.ScreenShare) {
      // 如果轨道已经可用
      if (publication.track) {
        setRemoteScreenTracks(prev => [...prev, publication.track!]);
      }
      
      // 订阅轨道并监听轨道就绪事件
      publication.setSubscribed(true);
      publication.on('subscribed', (track) => {
        console.log('Track subscribed:', track);
        setRemoteScreenTracks(prev => [...prev, track]);
      });
    }
  }, []);

  // 处理轨道取消发布
  const handleTrackUnpublished = useCallback((publication: RemoteTrackPublication, participant: RemoteParticipant) => {
    console.log('====handleTrackUnpublished', publication, participant);
    if (publication.source === Track.Source.ScreenShare) {
      setRemoteScreenTracks(prev => prev.filter(track => track.sid !== publication.trackSid));
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    
    const connect = async () => {
      if (mounted) {
        room.on('participantConnected', handleParticipantConnected);
        room.on('participantDisconnected', handleParticipantDisconnected);
        room.on('trackPublished', handleTrackPublished);
        room.on('trackUnpublished', handleTrackUnpublished);

        await room.connect(wsUrl, token);

        // 获取已连接的参与者
        setParticipants(Array.from(room.remoteParticipants.values()));
        
        // 获取已有的屏幕共享轨道
        const tracks: RemoteTrack[] = [];
        room.remoteParticipants.forEach(participant => {
          for (const [_, publication] of participant.trackPublications) {
            if (publication.source === Track.Source.ScreenShare) {
              // 如果轨道已经可用
              if (publication.track) {
                tracks.push(publication.track);
              }
              
              // 订阅轨道并监听轨道就绪事件
              publication.setSubscribed(true);
              publication.on('subscribed', (track) => {
                console.log('Track subscribed:', track);
                setRemoteScreenTracks(prev => [...prev, track]);
              });
            }
          }
        });
        setRemoteScreenTracks(tracks);
      }
    };
    connect();

    return () => {
      mounted = false;
      room.off('participantConnected', handleParticipantConnected);
      room.off('participantDisconnected', handleParticipantDisconnected);
      room.off('trackPublished', handleTrackPublished);
      room.off('trackUnpublished', handleTrackUnpublished);
      room.disconnect();
    };
  }, [room, handleParticipantConnected, handleParticipantDisconnected, handleTrackPublished, handleTrackUnpublished]);

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
        audio: shareAudio ? {
          mandatory: {
            chromeMediaSource: 'desktop',
          }
        } as any : false,
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
      setScreenShareTrack(videoTrack);
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

  // 停止屏幕共享
  const stopScreenShare = async () => {
    if (screenShareTrack) {
      await room.localParticipant.unpublishTrack(screenShareTrack);
      screenShareTrack.stop();
      setScreenShareTrack(undefined);
    }
  };

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (screenShareTrack) {
        screenShareTrack.stop();
      }
    };
  }, [screenShareTrack]);

  return (
    <div className="room-container">
      <div className="controls">
        <button 
          onClick={screenShareTrack ? stopScreenShare : handleShareScreen} 
          className={`share-screen-btn ${screenShareTrack ? 'sharing' : ''}`}
        >
          {screenShareTrack ? '停止共享' : '分享屏幕'}
        </button>
      </div>

      <div className="video-container">
        {/* 本地屏幕共享预览 */}
        {screenShareTrack && (
          <div className="video-item">
            <div className="video-header">
              <span className="participant-name">我的屏幕共享</span>
            </div>
            <video
              ref={el => {
                if (el) {
                  el.muted = true;
                  el.srcObject = new MediaStream([screenShareTrack.mediaStreamTrack]);
                }
              }}
              autoPlay
              playsInline
            />
          </div>
        )}

        {/* 远程参与者的屏幕共享 */}
        {remoteScreenTracks.map(track => (
          <div key={track.sid} className="video-item">
            <div className="video-header">
              <span className="participant-name">
                {participants.find(p => 
                  Array.from(p.trackPublications.values()).some(pub => pub.trackSid === track.sid)
                )?.identity || '未知用户'}的屏幕共享
              </span>
            </div>
            <video
              ref={el => {
                if (el) {
                  el.muted = false;
                  el.srcObject = new MediaStream([track.mediaStreamTrack]);
                }
              }}
              autoPlay
              playsInline
            />
          </div>
        ))}
      </div>

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
              <div className="modal-footer-left">
                <label className="audio-toggle">
                  <input
                    type="checkbox"
                    checked={shareAudio}
                    onChange={(e) => setShareAudio(e.target.checked)}
                  />
                  分享系统音频
                </label>
              </div>
              <div className="modal-footer-right">
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
        </div>
      )}
    </div>
  )
}

export default RoomPage;
