import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Index from './pages/Index';
import RoomPage from './pages/Room';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/room" element={<RoomPage />} />
      </Routes>
    </Router>
  );
}
