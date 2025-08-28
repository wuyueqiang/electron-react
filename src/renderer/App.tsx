import {
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { Provider } from 'react-redux';
import { HistoryRouter } from 'redux-first-history/rr6';
import { LoginPage, LiveListPage, LiveRoomPage } from './pages';
import './App.scss';
import configureStore, { history } from './store/configureStore';

// 创建 Redux store
const store = configureStore();

export default function App() {
  return (
    <Provider store={store}>
      <HistoryRouter history={history}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/live-list" element={<LiveListPage />} />
          <Route path="/live-room/:roomId" element={<LiveRoomPage />} />
        </Routes>
      </HistoryRouter>
    </Provider>
  );
}