import {
  MemoryRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { Provider } from 'react-redux';
import { LoginPage, LiveListPage, LiveRoomPage } from './pages';
import './App.scss';
import configureStore from './store/configureStore';

// 创建 Redux store
const store = configureStore();

export default function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/live-list" element={<LiveListPage />} />
          <Route path="/live-room/:roomId" element={<LiveRoomPage />} />
        </Routes>
      </Router>
    </Provider>
  );
}
