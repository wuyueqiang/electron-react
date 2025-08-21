import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './LiveRoomPage.scss';



function LiveRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  return (
    <div className="live-room-page">
      live room page
    </div>
  );
}

export default LiveRoomPage;
