import {
  MemoryRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { LoginPage, LiveListPage, LiveRoomPage } from './pages';
import './App.css';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/live-list" element={<LiveListPage />} />
        <Route path="/live-room/:roomId" element={<LiveRoomPage />} />
      </Routes>
    </Router>
  );
}
