import { configureStore } from '@reduxjs/toolkit';
import { createHashHistory } from 'history';
import { createReduxHistoryContext } from 'redux-first-history';
import roomConfigReducer from '../reducers/roomConfigSlice';
import ysLiveClientReducer from '../reducers/ysLiveClientSlice';
import appReducer from '../reducers/appReducer';

// 创建 history 对象
const history = createHashHistory();
const { createReduxHistory, routerMiddleware, routerReducer } = createReduxHistoryContext({
  history
});

// 保持与原来相同的导出方式
const configureAppStore = (preloadedState = {}) => {
  const store = configureStore({
    reducer: {
      router: routerReducer,
      roomConfig: roomConfigReducer,
      ysLiveClient: ysLiveClientReducer,
      app: appReducer,
    },
    middleware: (getDefaultMiddleware) => {
      const middlewares = getDefaultMiddleware();
      
      // 添加 router middleware
      middlewares.push(routerMiddleware);
      
      // 开发环境添加 logger
      if (process.env.NODE_ENV !== 'production') {
        try {
          const { createLogger } = require('redux-logger');
          return middlewares.concat(createLogger({ collapsed: true }));
        } catch (e) {
          console.warn('redux-logger not available:', e);
        }
      }
      
      return middlewares;
    },
    preloadedState,
  });
  
  return store;
};

// 创建 redux 增强的 history
const reduxHistory = createReduxHistory(configureAppStore());

// 导出默认函数，保持与原来的导出方式一致
export default configureAppStore;

// 导出 history 供其他组件使用
export { reduxHistory as history };